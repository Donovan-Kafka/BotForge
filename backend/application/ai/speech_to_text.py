import json
import os
from functools import lru_cache
from io import BytesIO

from pydub import AudioSegment
from vosk import Model, KaldiRecognizer

AudioSegment.converter = os.getenv("FFMPEG_BINARY", "ffmpeg")

@lru_cache(maxsize=1)
def _get_model() -> Model:
    model_path = os.getenv("VOSK_MODEL_PATH")
    if not model_path:
        raise ValueError("VOSK_MODEL_PATH is not set.")
    if not os.path.isdir(model_path):
        raise ValueError("VOSK_MODEL_PATH does not point to a directory.")
    return Model(model_path)


def _decode_audio(audio_bytes: bytes) -> tuple[bytes, int]:
    segment = AudioSegment.from_file(BytesIO(audio_bytes))
    segment = segment.set_channels(1).set_frame_rate(16000).set_sample_width(2)
    return segment.raw_data, 16000


def transcribe_audio(audio_bytes: bytes) -> tuple[str, float | None]:
    if not audio_bytes:
        raise ValueError("audio is empty.")

    raw_audio, sample_rate = _decode_audio(audio_bytes)
    recognizer = KaldiRecognizer(_get_model(), sample_rate)
    recognizer.SetWords(True)

    recognizer.AcceptWaveform(raw_audio)
    result = json.loads(recognizer.Result())

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
