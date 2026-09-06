"""
anomaly_service.py — MOMENT-1-small Real Ocean Time-Series Anomaly Detection Service
SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform

Implements:
- Safe Local CPU Inference using AutonLab/MOMENT-1-small (Patch-based Time Series Transformer)
- Lazy loading with strict RAM safety guards (Checks free physical memory before allocating)
- Real sequence reconstruction mode (MSE reconstruction loss calculation)
- Graceful error recovery (Never crashes FastAPI server if PyTorch/HuggingFace is missing)
- Standardized severity mapping (CRITICAL / WARNING / ADVISORY)
"""

from __future__ import annotations

import ctypes
import logging
import math
from typing import Any, Optional

logger = logging.getLogger(__name__)


def get_available_memory_mb() -> float:
    """Return available physical memory in megabytes using Windows API or fallback."""
    try:
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
            return stat.ullAvailPhys / (1024 * 1024)
    except Exception:
        pass
    return 1024.0  # Safe default estimate


class MOMENTAnomalyService:
    """
    Service wrapper for AutonLab/MOMENT-1-small foundation model for time-series anomaly detection.
    """

    MODEL_ID = "AutonLab/MOMENT-1-small"
    MIN_RAM_REQUIRED_MB = 250.0  # Memory safety threshold

    def __init__(self) -> None:
        self._model: Any = None
        self._is_loaded: bool = False
        self._load_error: Optional[str] = None
        self._torch: Any = None

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def get_status(self) -> dict[str, Any]:
        """Return diagnostic status of MOMENT-1-small without triggering model download."""
        if self._is_loaded:
            return {
                "status": "loaded",
                "model": self.MODEL_ID,
                "device": "CPU",
                "mode": "reconstruction",
            }
        elif self._load_error:
            return {
                "status": "not_loaded",
                "model": self.MODEL_ID,
                "reason": self._load_error,
            }
        else:
            return {
                "status": "available",
                "model": self.MODEL_ID,
                "mode": "lazy_local_cpu",
                "loaded": False,
            }

    def _ensure_model_loaded(self) -> tuple[bool, Optional[str]]:
        """
        Lazily load the MOMENT-1-small model into memory on CPU with safety checks.
        """
        if self._is_loaded and self._model is not None:
            return True, None

        # Check physical RAM availability first
        free_mb = get_available_memory_mb()
        if free_mb < self.MIN_RAM_REQUIRED_MB:
            err = f"Insufficient free RAM ({free_mb:.1f} MB available, requires >{self.MIN_RAM_REQUIRED_MB} MB). Deferred to avoid system thrashing."
            self._load_error = err
            logger.warning("MOMENT load skipped: %s", err)
            return False, err

        try:
            import torch
            self._torch = torch

            try:
                # Attempt standard MOMENT library loading
                from momentfm import MOMENTPipeline
                logger.info("Loading AutonLab/MOMENT-1-small on CPU...")
                pipeline = MOMENTPipeline.from_pretrained(
                    self.MODEL_ID,
                    model_kwargs={"task_name": "reconstruction"},
                )
                pipeline.init()
                self._model = pipeline.to("cpu")
                self._is_loaded = True
                self._load_error = None
                logger.info("AutonLab/MOMENT-1-small loaded successfully on CPU.")
                return True, None

            except ImportError:
                # Fallback to Hugging Face transformers if momentfm is not installed
                try:
                    from transformers import AutoModel
                    logger.info("Attempting transformers load for AutonLab/MOMENT-1-small...")
                    model = AutoModel.from_pretrained(
                        self.MODEL_ID,
                        trust_remote_code=True,
                    )
                    model.eval()
                    self._model = model.to("cpu")
                    self._is_loaded = True
                    self._load_error = None
                    return True, None
                except Exception as hf_err:
                    err = f"MOMENT dependencies missing: {hf_err}. Install momentfm or transformers with torch."
                    self._load_error = err
                    return False, err

        except ImportError as torch_err:
            err = f"PyTorch is not installed in the local environment ({torch_err})."
            self._load_error = err
            return False, err
        except Exception as exc:
            err = f"Model load error: {exc}"
            self._load_error = err
            logger.error("Failed to load MOMENT-1-small: %s", exc)
            return False, err

    def preprocess_sequence(
        self, values: list[float], target_len: int = 512
    ) -> tuple[Any, float, float]:
        """
        Clean, interpolate, pad/resample time-series values to target patch sequence length (512).
        Returns normalized tensor [1, 1, target_len], mean, and standard deviation.
        """
        torch = self._torch
        # Clean nulls / NaNs
        cleaned: list[float] = []
        for v in values:
            if v is not None and not math.isnan(v) and not math.isinf(v):
                cleaned.append(float(v))
            elif cleaned:
                cleaned.append(cleaned[-1])  # Forward fill
            else:
                cleaned.append(0.0)

        if not cleaned:
            cleaned = [0.0] * target_len

        # Resample or linear interpolate to target_len
        n = len(cleaned)
        if n == 1:
            resampled = cleaned * target_len
        elif n != target_len:
            resampled = []
            for i in range(target_len):
                idx = (i / (target_len - 1)) * (n - 1)
                i0 = int(idx)
                i1 = min(i0 + 1, n - 1)
                frac = idx - i0
                val = cleaned[i0] * (1.0 - frac) + cleaned[i1] * frac
                resampled.append(val)
        else:
            resampled = cleaned

        # Compute mean & std for z-score normalization
        mean = sum(resampled) / len(resampled)
        variance = sum((x - mean) ** 2 for x in resampled) / len(resampled)
        std = math.sqrt(variance) if variance > 1e-7 else 1.0

        normalized = [(x - mean) / std for x in resampled]
        tensor = torch.tensor(normalized, dtype=torch.float32).unsqueeze(0).unsqueeze(0)  # Shape: [1, 1, 512]
        return tensor, mean, std

    def detect_anomaly(
        self,
        values: list[float],
        variable: str = "temperature",
        timestamp: Optional[str] = None,
        threshold_critical: float = 2.5,
        threshold_warning: float = 1.4,
    ) -> dict[str, Any]:
        """
        Run actual MOMENT-1-small time-series reconstruction inference on CPU.
        """
        loaded, reason = self._ensure_model_loaded()
        if not loaded:
            return {
                "model": self.MODEL_ID,
                "status": "not_loaded",
                "variable": variable,
                "reason": reason or "Model not loaded on local hardware.",
            }

        try:
            torch = self._torch
            tensor, mean, std = self.preprocess_sequence(values)

            with torch.no_grad():
                # Forward pass in reconstruction mode
                if hasattr(self._model, "reconstruct"):
                    output = self._model.reconstruct(x_enc=tensor)
                    reconstruction = output.reconstruction
                elif callable(self._model):
                    output = self._model(tensor)
                    reconstruction = getattr(output, "reconstruction", output[0] if isinstance(output, tuple) else output)
                else:
                    raise RuntimeError("Loaded model does not have a callable forward or reconstruct interface.")

                # Calculate real point-wise and overall reconstruction Mean Squared Error (MSE)
                mse_loss = torch.mean((tensor - reconstruction) ** 2).item()
                peak_error = torch.max(torch.abs(tensor - reconstruction)).item()

            observed_val = values[-1] if values else mean
            anomaly_score = float(mse_loss * 2.5 + peak_error * 0.5)

            if anomaly_score >= threshold_critical:
                severity = "CRITICAL"
                msg = f"Critical oceanographic anomaly detected ({variable}): High reconstruction deviation from expected temporal patterns."
            elif anomaly_score >= threshold_warning:
                severity = "WARNING"
                msg = f"Elevated anomaly detected ({variable}): Moderate deviation in time-series dynamics."
            else:
                severity = "ADVISORY"
                msg = f"Nominal ocean conditions ({variable}): Time-series sequence conforms to baseline reconstruction."

            return {
                "model": self.MODEL_ID,
                "status": "loaded",
                "variable": variable,
                "anomaly_score": round(anomaly_score, 4),
                "severity": severity,
                "observed_value": round(float(observed_val), 3),
                "reconstruction_loss": round(float(mse_loss), 6),
                "peak_deviation": round(float(peak_error), 4),
                "sequence_length": len(values),
                "inference_device": "CPU",
                "message": msg,
                "timestamp": timestamp,
            }

        except Exception as err:
            logger.exception("Error during MOMENT inference")
            return {
                "model": self.MODEL_ID,
                "status": "not_loaded",
                "variable": variable,
                "reason": f"Inference execution failure: {err}",
            }


# Singleton service instance
_moment_service_instance: Optional[MOMENTAnomalyService] = None


def get_moment_service() -> MOMENTAnomalyService:
    global _moment_service_instance
    if _moment_service_instance is None:
        _moment_service_instance = MOMENTAnomalyService()
    return _moment_service_instance
