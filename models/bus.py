"""
models/bus.py
-------------
Defines the Bus class representing a bus assigned to a BAUST route.

Academic Note (Section 13.2):
- Does not fabricate unverified bus registration numbers, bus names, or fake live GPS data.
- Clearly states when specific bus identifiers or names are not officially provided.
"""

from typing import Optional, Dict, Any


class Bus:
    """
    Represents bus information associated with a specific BAUST route.
    """

    def __init__(
        self,
        route_title: str,
        bus_id: Optional[str] = None,
        bus_name: Optional[str] = None,
    ) -> None:
        if not route_title or not str(route_title).strip():
            raise ValueError("রুটের নাম খালি হতে পারবে না (Route title cannot be empty).")

        self._route_title: str = str(route_title).strip()
        # Only store verified bus_id / bus_name if explicitly provided; never fabricate
        self._bus_id: str = str(bus_id).strip() if bus_id else "নির্ধারিত বাস নম্বর উল্লেখ নেই"
        self._bus_name: str = str(bus_name).strip() if bus_name else "BAUST নির্ধারিত রুট বাস"

    def get_route(self) -> str:
        """
        Returns the title of the associated bus route.
        """
        return self._route_title

    def get_bus_info(self) -> Dict[str, Any]:
        """
        Returns verified bus information without fabricating registration numbers or GPS status.
        """
        return {
            "bus_id": self._bus_id,
            "bus_name": self._bus_name,
            "route": self._route_title,
            "gps_available": False,
            "tracking_note": "স্থির সময়সূচি ও স্টপেজ তথ্য (প্রকৃত GPS ট্র্যাকিং নেই)",
        }
