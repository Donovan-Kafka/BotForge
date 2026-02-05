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

# Thread-local storage for recognizers
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
    """
    Reuse recognizer per thread to reduce CPU overhead.
    """
    rec = getattr(_thread_local, "recognizer", None)

    if rec is None or rec.SampleRate() != sample_rate:
        rec = KaldiRecognizer(_get_model(), sample_rate)
        rec.SetWords(True)
        _thread_local.recognizer = rec
    else:
        # Reset recognizer state for new request
        rec.Reset()

    return rec


def _decode_audio(audio_bytes: bytes) -> tuple[bytes, int]:
    try:
        segment = AudioSegment.from_file(BytesIO(audio_bytes))
    except Exception as e:
        raise ValueError("Invalid audio format") from e

    segment = segment.set_channels(1).set_frame_rate(16000).set_sample_width(2)
    return segment.raw_data, 16000


def transcribe_audio(audio_bytes: bytes) -> tuple[str, float | None]:
    if not audio_bytes:
        raise ValueError("audio is empty.")

    raw_audio, sample_rate = _decode_audio(audio_bytes)

    recognizer = _get_recognizer(sample_rate)

    if recognizer.AcceptWaveform(raw_audio):
        result = json.loads(recognizer.Result())
    else:
        result = json.loads(recognizer.FinalResult())

    text = (result.get("text") or "").strip()

    confidence = None
    if result.get("result"):
        confs = [
            w.get("conf")
            for w in result["result"]
            if isinstance(w.get("conf"), (int, float))
        ]
        if confs:
            confidence = sum(confs) / len(confs)

    return text, confidence
