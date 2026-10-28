"""
models/bus_stop.py
------------------
Defines the BusStop class representing a single bus stop along a BAUST bus route.

OOP Principle Demonstrated:
- Encapsulation: Private/protected attributes (_serial, _name, _time, _fare)
  are encapsulated within the class and accessed/modified through validated
  properties and methods (get_details, update_time, update_fare).
"""

from typing import Optional, Dict, Any


class BusStop:
    """
    Represents an individual bus stop with its serial number, name, scheduled time, and fare.
    """

    def __init__(self, serial: str, name: str, time: str, fare: Optional[str] = None) -> None:
        if not name or not str(name).strip():
            raise ValueError("স্টপেজের নাম খালি রাখা যাবে না (Stop name cannot be empty).")
        if not time or not str(time).strip():
            raise ValueError("স্টপেজের সময় খালি রাখা যাবে না (Stop time cannot be empty).")

        self._serial: str = str(serial).strip()
        self._name: str = str(name).strip()
        self._time: str = str(time).strip()
        self._fare: str = self._normalize_fare(fare)

    @staticmethod
    def _normalize_fare(fare: Optional[str]) -> str:
        """
        Ensures missing or unspecified fare is represented as '—' and never as 0.
        Rule (Section 11): BAUST departure row has no fare specified and must show '—'.
        """
        if fare is None:
            return "—"
        cleaned = str(fare).strip()
        if not cleaned or cleaned in ("উল্লেখ করা হয়নি", "None", "null", "—", "-"):
            return "—"
        if cleaned in ("0", "০", "0 টাকা", "০ টাকা"):
            raise ValueError("অজানা ভাড়াকে শূন্য (০ টাকা) হিসেবে দেখানো যাবে না; '—' ব্যবহার করুন।")
        return cleaned

    @property
    def serial(self) -> str:
        return self._serial

    @property
    def name(self) -> str:
        return self._name

    @property
    def time(self) -> str:
        return self._time

    @property
    def fare(self) -> str:
        return self._fare

    def update_time(self, new_time: str) -> None:
        """
        Updates the scheduled time of the bus stop after validation.
        """
        if not new_time or not str(new_time).strip():
            raise ValueError("নতুন সময় খালি হতে পারবে না (New time cannot be empty).")
        self._time = str(new_time).strip()

    def update_fare(self, new_fare: Optional[str]) -> None:
        """
        Updates the fare of the bus stop after validation.
        """
        self._fare = self._normalize_fare(new_fare)

    def get_details(self) -> Dict[str, Any]:
        """
        Returns a dictionary containing the complete details of this bus stop.
        """
        return {
            "serial": self._serial,
            "name": self._name,
            "time": self._time,
            "fare": self._fare,
            "has_fare": self._fare != "—",
        }
