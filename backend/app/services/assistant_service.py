"""
assistant_service.py — Natural Language Ocean Assistant Service (Qwen3-4B Interface & Demo NLP Engine)
SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform

Implements:
- Interface abstraction for Qwen/Qwen3-4B-Instruct-2507
- Strict memory safety: Honest "not_loaded" status on laptops without dedicated 8GB+ GPU/RAM
- Rule-based Structured Query Extraction fallback ("Demo NLP Engine")
- Structured query extraction mapping natural language into 3D globe viewport actions
"""

from __future__ import annotations

import re
from typing import Any, Optional


class QwenAssistantService:
    """
    Assistant service managing Qwen3-4B model status and structured ocean parameter extraction.
    """

    MODEL_ID = "Qwen/Qwen3-4B-Instruct-2507"
    REQUIRED_VRAM_GB = 8.0

    def __init__(self) -> None:
        self._is_loaded = False
        self._reason = (
            "Local hardware does not have sufficient memory for this model "
            f"(Requires >={self.REQUIRED_VRAM_GB} GB dedicated VRAM/RAM). "
            "Executing via fallback Demo NLP Engine."
        )

    def get_status(self) -> dict[str, Any]:
        return {
            "status": "not_loaded",
            "model": self.MODEL_ID,
            "reason": "Insufficient local RAM / No NVIDIA CUDA GPU available",
            "active_fallback": "Demo NLP Engine",
            "capabilities": ["parameter_filter", "depth_selection", "region_focus", "anomaly_inspection"],
        }

    def parse_query_nlp(self, query: str) -> dict[str, Any]:
        """
        Extract structured variables, operators, values, depths, and regions from user prompt.
        Identified transparently as 'Demo NLP Engine'.
        """
        q = query.strip()
        q_lower = q.lower()

        # 1. Variable extraction
        variable: Optional[str] = None
        if any(w in q_lower for w in ["temp", "temperature", "sst", "thermal", "warm", "heat", "heatwave"]):
            variable = "temperature"
        elif any(w in q_lower for w in ["sal", "salinity", "psu", "halocline", "salt", "freshwater"]):
            variable = "salinity"
        elif any(w in q_lower for w in ["current", "velocity", "flow", "jet", "speed", "stream", "streamlines"]):
            variable = "current_velocity"
        elif any(w in q_lower for w in ["sea level", "ssh", "surface height", "elevation", "tide"]):
            variable = "sea_level"
        elif any(w in q_lower for w in ["chlorophyll", "phyto", "phytoplankton", "plankton", "fish", "pfz", "biology"]):
            variable = "chlorophyll"
        else:
            variable = "temperature"

        # 2. Depth extraction (e.g. "at 50m", "50 meters", "depth 100", "surface")
        depth: float = 0.0
        depth_match = re.search(r'(\d+)\s*(?:m|meter|meters|metre|metres)\b', q_lower)
        if depth_match:
            depth = float(depth_match.group(1))
        elif "surface" in q_lower:
            depth = 0.0
        elif "deep" in q_lower or "bottom" in q_lower or "abyssal" in q_lower:
            depth = 1000.0

        # 3. Numerical threshold & Operator extraction (e.g. "> 30", "above 28", "below 34", "< 1.5", "greater than 25")
        operator: Optional[str] = None
        threshold_val: Optional[float] = None

        if any(w in q_lower for w in [">", "above", "greater than", "more than", "higher than", "exceeds", "over"]):
            operator = ">"
        elif any(w in q_lower for w in ["<", "below", "less than", "lower than", "under"]):
            operator = "<"
        elif any(w in q_lower for w in ["=", "equals", "equal to", "at"]):
            operator = "="

        num_match = re.search(r'(?:above|below|greater than|less than|>|<|=|exceeds|over)\s*([+-]?\d+(?:\.\d+)?)\s*(?:°?c|psu|m/s|mg/m³|cm)?', q_lower)
        if num_match:
            threshold_val = float(num_match.group(1))
        else:
            # Look for general numbers following temperature/degree
            deg_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:degrees|°c|celsius)', q_lower)
            if deg_match:
                threshold_val = float(deg_match.group(1))
                if not operator:
                    operator = ">"

        # 4. Region extraction
        region: Optional[str] = None
        if "bay of bengal" in q_lower or "bengal" in q_lower or "bob" in q_lower:
            region = "Bay of Bengal"
        elif "arabian sea" in q_lower or "arabian" in q_lower:
            region = "Arabian Sea"
        elif "andaman" in q_lower or "nicobar" in q_lower:
            region = "Andaman Sea"
        elif "equator" in q_lower or "equatorial" in q_lower:
            region = "Equatorial Indian Ocean"
        elif "somali" in q_lower or "somalia" in q_lower:
            region = "Arabian Sea"
        elif "sri lanka" in q_lower:
            region = "Bay of Bengal"
        else:
            region = "Indian Ocean"

        # 5. Synthesize actions for the 3D globe viewport
        action_label = f"Set {variable.capitalize()} at {int(depth)}m"
        if region and region != "Indian Ocean":
            action_label += f" ({region})"
        if operator and threshold_val is not None:
            action_label += f" [{operator} {threshold_val}]"

        viewport_action = {
            "label": action_label,
            "target_variable": variable,
            "target_depth": int(depth),
            "target_region": region,
            "globe_mode": "heatmap",
        }

        # Human-readable reply summary
        reply_parts = [f"Showing **{variable.replace('_', ' ').title()}**"]
        if depth > 0:
            reply_parts.append(f"at **{int(depth)} meters** depth")
        else:
            reply_parts.append("at **surface (0m)**")
        if region and region != "Indian Ocean":
            reply_parts.append(f"in the **{region}**")
        if operator and threshold_val is not None:
            reply_parts.append(f"where values are **{operator} {threshold_val}**")

        reply_text = " ".join(reply_parts) + "."

        return {
            "model": self.MODEL_ID,
            "model_status": "not_loaded",
            "model_reason": self._reason,
            "engine": "Demo NLP Engine",
            "query": q,
            "structured": {
                "action": "filter" if (operator and threshold_val is not None) else "navigate",
                "variable": variable,
                "operator": operator,
                "value": threshold_val,
                "depth": depth,
                "region": region,
            },
            "viewport_actions": [viewport_action],
            "reply_text": reply_text,
        }


# Singleton instance
_assistant_service_instance: Optional[QwenAssistantService] = None


def get_assistant_service() -> QwenAssistantService:
    global _assistant_service_instance
    if _assistant_service_instance is None:
        _assistant_service_instance = QwenAssistantService()
    return _assistant_service_instance
