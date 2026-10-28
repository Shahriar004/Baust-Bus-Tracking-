"""
models/bus_schedule.py
----------------------
Defines the BusSchedule class responsible for formatting and presenting
the departure time, schedule type, and stop-by-stop schedule for a BusRoute.
"""

from typing import Optional, Dict, Any
from models.bus_route import BusRoute


class BusSchedule:
    """
    Manages the schedule metadata and stop-wise timing/fare table for a BusRoute.
    """

    def __init__(
        self,
        start_time: str,
        schedule_type: str,
        bus_route: BusRoute,
        is_estimated: bool = False,
        notice: Optional[str] = None,
    ) -> None:
        self._start_time: str = str(start_time).strip()
        self._schedule_type: str = str(schedule_type).strip()
        self._bus_route: BusRoute = bus_route
        self._is_estimated: bool = bool(is_estimated)
        self._notice: Optional[str] = notice

    @property
    def start_time(self) -> str:
        return self._start_time

    @property
    def schedule_type(self) -> str:
        return self._schedule_type

    @property
    def is_estimated(self) -> bool:
        return self._is_estimated

    @staticmethod
    def _is_distinct_start_time(route_start: str, first_stop: str) -> bool:
        """
        Checks if route start time and first stop time are genuinely different times
        (e.g. Nilphamari route starts at 'সকাল ৭টা' while first stop চৌরঙ্গী is at 'সকাল ৭:১০').
        """
        equivalent_pairs = {
            ("সকাল ৬টা ২০ মিনিট", "সকাল ৬:২০"),
            ("সকাল ৬টা ৩০ মিনিট", "সকাল ৬:৩০"),
            ("দুপুর ২টা ৩৫ মিনিট", "দুপুর ২:৩৫"),
        }
        if route_start == first_stop or (route_start, first_stop) in equivalent_pairs:
            return False
        return True

    def get_schedule(self) -> Dict[str, Any]:
        """
        Returns the raw schedule structure aligned with the underlying BusRoute stops.
        """
        route_data = self._bus_route.display_route()
        first_stop_time = route_data["first_stop_time"]
        return {
            "route_id": route_data["route_id"],
            "route_name": route_data["route_name"],
            "direction": route_data["direction"],
            "estimated_distance": route_data["estimated_distance"],
            "schedule_type": self._schedule_type,
            "route_start_time": self._start_time,
            "first_stop_time": first_stop_time,
            "has_separate_first_stop_time": self._is_distinct_start_time(
                self._start_time, first_stop_time
            ),
            "is_estimated": self._is_estimated,
            "time_column_Title": "আনুমানিক সময়" if self._is_estimated else "সময়",
            "notice": self._notice,
            "total_stops": route_data["total_stops"],
            "stops": route_data["stops"],
        }

    def display_schedule(self) -> Dict[str, Any]:
        """
        Returns display-ready schedule data for UI templates and API responses.
        """
        schedule = self.get_schedule()
        formatted_stops = []
        for stop in schedule["stops"]:
            formatted_stops.append(
                {
                    **stop,
                    "display_time": (
                        f"{stop['time']} (আনুমানিক)" if self._is_estimated else stop["time"]
                    ),
                }
            )
        schedule["stops"] = formatted_stops
        return schedule
