"""
services/tracking_system.py
---------------------------
Defines the BusTrackingSystem service class that orchestrates all routes,
stops, buses, and schedules using Object-Oriented Programming principles.

Required Methods (Section 13.8):
- add_route()
- find_route()
- get_all_routes()
- get_schedule()
"""

import json
import sys
from typing import Dict, Any, List, Optional

from data.routes import ROUTES_DATA, RETURN_WARNING_NOTICE, NO_GPS_NOTICE
from models.bus_stop import BusStop
from models.bus import Bus
from models.bus_route import BusRoute
from models.route_types import BaseRoute, GoingRoute, ReturningRoute


class RouteRecord:
    """
    Encapsulates a bidirectional route record (going + returning) inside BusTrackingSystem.
    """

    def __init__(
        self,
        route_id: str,
        name: str,
        title: str,
        short_description: str,
        icon_name: str,
        bus: Bus,
        going_route: GoingRoute,
        returning_route: ReturningRoute,
    ) -> None:
        self.route_id = route_id
        self.name = name
        self.title = title
        self.short_description = short_description
        self.icon_name = icon_name
        self.bus = bus
        self.going_route = going_route
        self.returning_route = returning_route

    def get_directional_route(self, direction: str) -> Optional[BaseRoute]:
        """
        Returns the BaseRoute polymorphic instance (GoingRoute or ReturningRoute)
        corresponding to the requested direction.
        """
        if direction == "going":
            return self.going_route
        if direction == "returning":
            return self.returning_route
        return None

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the route record and both directional schedules using polymorphism.
        """
        going_schedule = self.going_route.get_schedule()
        returning_schedule = self.returning_route.get_schedule()
        return {
            "id": self.route_id,
            "name": self.name,
            "title": self.title,
            "estimated_distance": self.going_route.bus_route.estimated_distance,
            "short_description": self.short_description,
            "icon_name": self.icon_name,
            "bus_info": self.bus.get_bus_info(),
            "going_start_time": going_schedule["route_start_time"],
            "going_first_stop_time": going_schedule["first_stop_time"],
            "going_stops_count": going_schedule["total_stops"],
            "returning_start_time": returning_schedule["route_start_time"],
            "returning_stops_count": returning_schedule["total_stops"],
            "going": going_schedule,
            "returning": returning_schedule,
        }


class BusTrackingSystem:
    """
    Central OOP controller class for Baust Bus Tracking System.
    Flask routes interact exclusively with this class instead of raw dictionaries.
    """

    def __init__(self) -> None:
        self._routes: Dict[str, RouteRecord] = {}

    def add_route(self, route_record: RouteRecord) -> None:
        """
        Registers a RouteRecord in the system.
        """
        if not isinstance(route_record, RouteRecord):
            raise TypeError("শুধুমাত্র বৈধ RouteRecord অবজেক্ট সিস্টেমে যোগ করা যাবে।")
        self._routes[route_record.route_id] = route_record

    def find_route(self, route_id: str) -> Optional[Dict[str, Any]]:
        """
        Finds a route by its identifier (e.g., 'dinajpur', 'rangpur', 'nilphamari').
        Returns None if not found.
        """
        if not route_id:
            return None
        record = self._routes.get(str(route_id).strip().lower())
        return record.to_dict() if record else None

    def get_all_routes(self) -> List[Dict[str, Any]]:
        """
        Returns a list of all registered routes in order.
        """
        return [record.to_dict() for record in self._routes.values()]

    def get_schedule(self, route_id: str, direction: str = "going") -> Optional[Dict[str, Any]]:
        """
        Demonstrates Polymorphism:
        Retrieves the directional BaseRoute object (either GoingRoute or ReturningRoute)
        and invokes the common interface `route_obj.get_schedule()`.
        """
        if not route_id or not direction:
            return None
        record = self._routes.get(str(route_id).strip().lower())
        if not record:
            return None

        directional_route: Optional[BaseRoute] = record.get_directional_route(
            str(direction).strip().lower()
        )
        if not directional_route:
            return None

        # Polymorphic method call on BaseRoute reference
        schedule = directional_route.get_schedule()
        schedule["route_title"] = record.title
        schedule["route_short_name"] = record.name
        schedule["short_description"] = record.short_description
        schedule["estimated_distance"] = directional_route.bus_route.estimated_distance
        return schedule

    def search_routes_and_stops(self, keyword: str) -> List[Dict[str, Any]]:
        """
        Searches across all registered routes and both travel directions for stops
        or route titles matching the given keyword.
        """
        query = str(keyword or "").strip().lower()
        if not query:
            return []

        results: List[Dict[str, Any]] = []
        for record in self._routes.values():
            for direction_key, route_obj in [
                ("going", record.going_route),
                ("returning", record.returning_route),
            ]:
                sched = route_obj.get_schedule()
                for stop in sched["stops"]:
                    if (
                        query in record.title.lower()
                        or query in record.name.lower()
                        or query in stop["name"].lower()
                        or query in stop["time"].lower()
                        or query in stop["fare"].lower()
                    ):
                        results.append(
                            {
                                "route_id": record.route_id,
                                "route_title": record.title,
                                "direction_key": direction_key,
                                "direction_label": route_obj.get_direction_label(),
                                "direction_title": sched["direction_title"],
                                "is_estimated": sched["is_estimated"],
                                "serial": stop["serial"],
                                "stop_name": stop["name"],
                                "time": stop["time"],
                                "fare": stop["fare"],
                            }
                        )
        return results

    def get_system_summary(self) -> Dict[str, Any]:
        """
        Returns verified system-level summary facts (Section 5.3) without fabricating stats.
        """
        return {
            "project_name": "Baust Bus Tracking System",
            "total_routes": len(self._routes),
            "total_routes_bn": "৩টি",
            "directions_text": "BAUST-এ যাওয়া এবং BAUST থেকে ফেরা",
            "available_info_text": "স্টপেজ, সময়সূচি ও ভাড়া",
            "no_gps_notice": NO_GPS_NOTICE,
            "return_warning_notice": RETURN_WARNING_NOTICE,
        }


def _build_bus_route(
    route_id: str,
    route_name: str,
    direction_data: Dict[str, Any],
    estimated_distance: str = "উল্লেখ নেই",
) -> BusRoute:
    """
    Helper that constructs a BusRoute and populates it with validated BusStop objects.
    """
    bus_route = BusRoute(
        route_id=route_id,
        route_name=route_name,
        direction=direction_data["direction_title"],
        estimated_distance=estimated_distance,
    )
    for stop_item in direction_data["stops"]:
        stop_obj = BusStop(
            serial=stop_item["serial"],
            name=stop_item["name"],
            time=stop_item["time"],
            fare=stop_item.get("fare"),
        )
        bus_route.add_stop(stop_obj)
    return bus_route


def create_default_tracking_system() -> BusTrackingSystem:
    """
    Factory function that initializes BusTrackingSystem from data/routes.py.
    """
    system = BusTrackingSystem()

    for route_key, route_conf in ROUTES_DATA.items():
        bus = Bus(route_title=route_conf["title"])
        est_distance = route_conf.get("estimated_distance", "উল্লেখ নেই")

        going_conf = route_conf["going"]
        going_bus_route = _build_bus_route(
            route_key, route_conf["name"], going_conf, est_distance
        )
        going_route = GoingRoute(
            route_id=route_key,
            route_title=route_conf["title"],
            direction_title=going_conf["direction_title"],
            start_time=going_conf["route_start_time"],
            bus_route=going_bus_route,
            bus=bus,
        )

        returning_conf = route_conf["returning"]
        returning_bus_route = _build_bus_route(
            route_key, route_conf["name"], returning_conf, est_distance
        )
        returning_route = ReturningRoute(
            route_id=route_key,
            route_title=route_conf["title"],
            direction_title=returning_conf["direction_title"],
            start_time=returning_conf["route_start_time"],
            bus_route=returning_bus_route,
            bus=bus,
            warning_notice=returning_conf.get("notice"),
        )

        record = RouteRecord(
            route_id=route_key,
            name=route_conf["name"],
            title=route_conf["title"],
            short_description=route_conf["short_description"],
            icon_name=route_conf["icon_name"],
            bus=bus,
            going_route=going_route,
            returning_route=returning_route,
        )
        system.add_route(record)

    return system


if __name__ == "__main__":
    # Allows live execution of the Python OOP system to output JSON for verification or API bridges
    sys.stdout.reconfigure(encoding="utf-8")
    tracking_sys = create_default_tracking_system()
    payload = {
        "summary": tracking_sys.get_system_summary(),
        "routes": tracking_sys.get_all_routes(),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
