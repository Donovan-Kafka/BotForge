import json
import os
import logging
import threading
from functools import lru_cache
from io import BytesIO

from pydub import AudioSegment
from vosk import Model, KaldiRecognizer

logger = logging.getLogger(__name__)
AudioSegment.converter = os.getenv("FFMPEG_BINARY", "ffmpeg")

_thread_local = threading.local()

@lru_cache(maxsize=1)
def _get_model() -> Model:
    model_path = os.getenv("VOSK_MODEL_PATH")

    if not model_path:
        raise ValueError("VOSK_MODEL_PATH is not set.")
    if not os.path.isdir(model_path):
        raise ValueError("VOSK_MODEL_PATH does not point to directory.")

    logger.info("Loading VOSK model from %s", model_path)
    return Model(model_path)


def _get_recognizer(sample_rate: int) -> KaldiRecognizer:
    rec = getattr(_thread_local, "recognizer", None)
    stored_rate = getattr(_thread_local, "sample_rate", None)

    if rec is None or stored_rate != sample_rate:
        rec = KaldiRecognizer(_get_model(), sample_rate)
        rec.SetWords(True)
        _thread_local.recognizer = rec
        _thread_local.sample_rate = sample_rate
    else:
        rec.Reset()

    return rec


def _decode_audio(audio_bytes: bytes) -> tuple[bytes, int]:
    try:
        segment = AudioSegment.from_file(BytesIO(audio_bytes))
    except Exception as e:
        logger.exception("Audio decoding failed")
        raise ValueError("Invalid audio format") from e

    segment = segment.set_channels(1).set_frame_rate(16000).set_sample_width(2)

    return segment.raw_data, 16000


def transcribe_audio(audio_bytes: bytes) -> tuple[str, float | None]:

    if not audio_bytes:
        raise ValueError("audio is empty.")

    raw_audio, sample_rate = _decode_audio(audio_bytes)

    MIN_AUDIO_BYTES = 16000  # ~0.5 seconds
    if len(raw_audio) < MIN_AUDIO_BYTES:
        logger.warning("Audio too short for reliable transcription")
        return "", 0.0

    recognizer = _get_recognizer(sample_rate)

    chunk_size = 8000
    accepted = False

    for i in range(0, len(raw_audio), chunk_size):
        chunk = raw_audio[i : i + chunk_size]

        if recognizer.AcceptWaveform(chunk):
            accepted = True

    if accepted:
        result = json.loads(recognizer.Result())
    else:
        result = json.loads(recognizer.FinalResult())

        # fallback to partial if empty
        if not result.get("text"):
            partial = json.loads(recognizer.PartialResult())
            if partial.get("partial"):
                result["text"] = partial["partial"]

    text = (result.get("text") or "").strip()

    if not text:
        logger.warning("Transcription returned empty text")

    confidence = 0.0 if text else None

    if result.get("result"):
        confs = [
            w.get("conf")
            for w in result["result"]
            if isinstance(w.get("conf"), (int, float))
        ]
        if confs:
            confidence = sum(confs) / len(confs)

    return text, confidence