"""
models/bus_route.py
-------------------
Defines the BusRoute class that manages an ordered list of BusStop objects
and the estimated route distance for a specific route and travel direction.
"""

from typing import List, Dict, Any
from models.bus_stop import BusStop


class BusRoute:
    """
    Manages the route identifier, travel direction, estimated distance,
    and ordered list of BusStop objects.
    """

    def __init__(
        self,
        route_id: str,
        route_name: str,
        direction: str,
        estimated_distance: str = "উল্লেখ নেই",
    ) -> None:
        if not route_id or not str(route_id).strip():
            raise ValueError("রুটের পরিচিতি (route_id) খালি রাখা যাবে না।")
        self._route_id: str = str(route_id).strip()
        self._route_name: str = str(route_name).strip()
        self._direction: str = str(direction).strip()
        self._estimated_distance: str = (
            str(estimated_distance).strip()
            if estimated_distance and str(estimated_distance).strip()
            else "উল্লেখ নেই"
        )
        self._stops: List[BusStop] = []

    @property
    def route_id(self) -> str:
        return self._route_id

    @property
    def route_name(self) -> str:
        return self._route_name

    @property
    def direction(self) -> str:
        return self._direction

    @property
    def estimated_distance(self) -> str:
        return self._estimated_distance

    def get_estimated_distance(self) -> str:
        """
        Returns the estimated travel distance for this route.
        """
        return self._estimated_distance

    def update_estimated_distance(self, new_distance: str) -> None:
        """
        Updates the estimated travel distance for this route (Encapsulation).
        """
        if not new_distance or not str(new_distance).strip():
            raise ValueError("আনুমানিক দূরত্ব খালি রাখা যাবে না।")
        self._estimated_distance = str(new_distance).strip()

    def add_stop(self, stop: BusStop) -> None:
        """
        Adds a BusStop instance to the route while preserving stop order.
        """
        if not isinstance(stop, BusStop):
            raise TypeError("শুধুমাত্র BusStop অবজেক্ট রুটে যোগ করা যাবে।")
        self._stops.append(stop)

    def get_stops(self) -> List[BusStop]:
        """
        Returns a copy of the ordered list of BusStop objects.
        """
        return list(self._stops)

    def search_stops(self, keyword: str) -> List[Dict[str, Any]]:
        """
        Filters stops in this BusRoute whose name, serial, time, or fare matches the keyword.
        """
        query = str(keyword or "").strip().lower()
        if not query:
            return [stop.get_details() for stop in self._stops]
        matched = []
        for stop in self._stops:
            details = stop.get_details()
            if (
                query in details["name"].lower()
                or query in details["serial"].lower()
                or query in details["time"].lower()
                or query in details["fare"].lower()
            ):
                matched.append(details)
        return matched

    def display_route(self) -> Dict[str, Any]:
        """
        Returns structured route information including estimated distance and all stops in order.
        """
        stop_details = [stop.get_details() for stop in self._stops]
        return {
            "route_id": self._route_id,
            "route_name": self._route_name,
            "direction": self._direction,
            "estimated_distance": self._estimated_distance,
            "total_stops": len(stop_details),
            "first_stop": stop_details[0]["name"] if stop_details else "—",
            "last_stop": stop_details[-1]["name"] if stop_details else "—",
            "first_stop_time": stop_details[0]["time"] if stop_details else "—",
            "last_stop_time": stop_details[-1]["time"] if stop_details else "—",
            "stops": stop_details,
        }
