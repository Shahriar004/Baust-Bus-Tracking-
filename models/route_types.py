"""
models/route_types.py
---------------------
Defines the abstract BaseRoute class and its concrete subclasses GoingRoute
and ReturningRoute.

OOP Principles Demonstrated:
1. Abstraction: BaseRoute inherits from ABC and declares @abstractmethod get_schedule()
   and get_direction_label(), enforcing a contract for all route types.
2. Inheritance: GoingRoute and ReturningRoute inherit common properties and methods
   from BaseRoute without duplicating code.
3. Polymorphism: Both GoingRoute and ReturningRoute implement get_schedule() with
   distinct behavior (confirmed going schedule vs. estimated returning schedule with
   mandatory warning notice).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from models.bus import Bus
from models.bus_route import BusRoute
from models.bus_schedule import BusSchedule
from data.routes import RETURN_WARNING_NOTICE


class BaseRoute(ABC):
    """
    Abstract base class representing a directional route in the Baust Bus Tracking System.
    """

    def __init__(
        self,
        route_id: str,
        route_title: str,
        direction_title: str,
        start_time: str,
        bus_route: BusRoute,
        bus: Bus,
    ) -> None:
        self._route_id: str = route_id
        self._route_title: str = route_title
        self._direction_title: str = direction_title
        self._start_time: str = start_time
        self._bus_route: BusRoute = bus_route
        self._bus: Bus = bus

    @property
    def route_id(self) -> str:
        return self._route_id

    @property
    def route_title(self) -> str:
        return self._route_title

    @property
    def direction_title(self) -> str:
        return self._direction_title

    @property
    def start_time(self) -> str:
        return self._start_time

    @property
    def bus_route(self) -> BusRoute:
        return self._bus_route

    @property
    def bus(self) -> Bus:
        return self._bus

    @abstractmethod
    def get_direction_label(self) -> str:
        """
        Returns the Bengali label for this route direction.
        """
        pass

    @abstractmethod
    def get_schedule(self) -> Dict[str, Any]:
        """
        Polymorphic method that returns the formatted schedule for this specific direction.
        """
        pass

    def get_route_info(self) -> Dict[str, Any]:
        """
        Shared method inherited by both GoingRoute and ReturningRoute.
        """
        return {
            "route_id": self._route_id,
            "route_title": self._route_title,
            "direction_title": self._direction_title,
            "direction_label": self.get_direction_label(),
            "route_start_time": self._start_time,
            "bus_info": self._bus.get_bus_info(),
            "route_details": self._bus_route.display_route(),
        }


class GoingRoute(BaseRoute):
    """
    Concrete subclass representing a BAUST-bound route (BAUST-এ যাওয়া).
    """

    def __init__(
        self,
        route_id: str,
        route_title: str,
        direction_title: str,
        start_time: str,
        bus_route: BusRoute,
        bus: Bus,
    ) -> None:
        super().__init__(route_id, route_title, direction_title, start_time, bus_route, bus)
        self._schedule = BusSchedule(
            start_time=start_time,
            schedule_type="নির্ধারিত সময়সূচি (BAUST-এ যাওয়া)",
            bus_route=bus_route,
            is_estimated=False,
            notice=None,
        )

    def get_direction_label(self) -> str:
        return "BAUST-এ যাওয়া"

    def get_schedule(self) -> Dict[str, Any]:
        """
        Polymorphic implementation for BAUST-bound schedule (confirmed stop times).
        """
        schedule_data = self._schedule.display_schedule()
        schedule_data.update(
            {
                "direction_key": "going",
                "direction_title": self._direction_title,
                "direction_label": self.get_direction_label(),
                "button_label": "BAUST-এ যাওয়ার সময়সূচি",
                "bus_info": self._bus.get_bus_info(),
            }
        )
        return schedule_data


class ReturningRoute(BaseRoute):
    """
    Concrete subclass representing a returning route from BAUST (BAUST থেকে ফেরা).
    Explicitly marks the schedule as estimated and attaches the warning notice.
    """

    def __init__(
        self,
        route_id: str,
        route_title: str,
        direction_title: str,
        start_time: str,
        bus_route: BusRoute,
        bus: Bus,
        warning_notice: Optional[str] = None,
    ) -> None:
        super().__init__(route_id, route_title, direction_title, start_time, bus_route, bus)
        self._warning_notice: str = warning_notice or RETURN_WARNING_NOTICE
        self._schedule = BusSchedule(
            start_time=start_time,
            schedule_type="আনুমানিক সময়সূচি (BAUST থেকে ফেরা)",
            bus_route=bus_route,
            is_estimated=True,
            notice=self._warning_notice,
        )

    def get_direction_label(self) -> str:
        return "BAUST থেকে ফেরা"

    def get_schedule(self) -> Dict[str, Any]:
        """
        Polymorphic implementation for returning schedule from BAUST (estimated times + warning).
        """
        schedule_data = self._schedule.display_schedule()
        schedule_data.update(
            {
                "direction_key": "returning",
                "direction_title": self._direction_title,
                "direction_label": self.get_direction_label(),
                "button_label": "BAUST থেকে ফেরার সময়সূচি",
                "warning_notice": self._warning_notice,
                "bus_info": self._bus.get_bus_info(),
            }
        )
        return schedule_data
