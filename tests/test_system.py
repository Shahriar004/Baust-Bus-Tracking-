"""
tests/test_system.py
--------------------
Unit tests for Baust Bus Tracking System verifying:
1. Exactly 3 routes exist (dinajpur, rangpur, nilphamari) and no 4th route (e.g., phulbari).
2. All going and returning stops, times, and fares match the specification.
3. Nilphamari route start time ('সকাল ৭টা') is kept separate from first stop time ('সকাল ৭:১০').
4. BAUST departure stop on returning routes has fare '—' and never '0' or '০ টাকা'.
5. Returning routes include the mandatory estimated warning notice.
6. OOP classes (BusStop, Bus, BusRoute, BusSchedule, BaseRoute, GoingRoute, ReturningRoute,
   BusTrackingSystem) and methods work as expected.
"""

import unittest
from models.bus_stop import BusStop
from models.bus import Bus
from models.bus_route import BusRoute
from models.bus_schedule import BusSchedule
from models.route_types import BaseRoute, GoingRoute, ReturningRoute
from services.tracking_system import create_default_tracking_system
from data.routes import RETURN_WARNING_NOTICE


class TestBaustBusTrackingOOP(unittest.TestCase):
    def setUp(self) -> None:
        self.system = create_default_tracking_system()

    def test_exact_three_routes(self) -> None:
        routes = self.system.get_all_routes()
        self.assertEqual(len(routes), 3)
        route_ids = [r["id"] for r in routes]
        self.assertEqual(route_ids, ["dinajpur", "rangpur", "nilphamari"])
        self.assertIsNone(self.system.find_route("phulbari"))
        self.assertIsNone(self.system.find_route("unknown"))

    def test_dinajpur_going_schedule(self) -> None:
        sched = self.system.get_schedule("dinajpur", "going")
        self.assertIsNotNone(sched)
        self.assertEqual(sched["route_start_time"], "সকাল ৬টা ২০ মিনিট")
        self.assertFalse(sched["is_estimated"])
        self.assertEqual(len(sched["stops"]), 11)
        self.assertEqual(sched["stops"][0]["name"], "সুইহারী তেলপাম্প")
        self.assertEqual(sched["stops"][0]["time"], "সকাল ৬:২০")
        self.assertEqual(sched["stops"][0]["fare"], "৭০ টাকা")
        self.assertEqual(sched["stops"][-1]["name"], "রানীর বন্দর")
        self.assertEqual(sched["stops"][-1]["time"], "সকাল ৭:১০")
        self.assertEqual(sched["stops"][-1]["fare"], "২৫ টাকা")

    def test_rangpur_going_schedule(self) -> None:
        sched = self.system.get_schedule("rangpur", "going")
        self.assertIsNotNone(sched)
        self.assertEqual(sched["route_start_time"], "সকাল ৬টা ৩০ মিনিট")
        self.assertEqual(len(sched["stops"]), 11)
        self.assertEqual(sched["stops"][0]["name"], "শাপলা")
        self.assertEqual(sched["stops"][0]["time"], "সকাল ৬:৩০")
        self.assertEqual(sched["stops"][0]["fare"], "৭০ টাকা")
        self.assertEqual(sched["stops"][-1]["name"], "তারাগঞ্জ")
        self.assertEqual(sched["stops"][-1]["time"], "সকাল ৭:৪৫")
        self.assertEqual(sched["stops"][-1]["fare"], "২৫ টাকা")

    def test_nilphamari_going_separate_start_time(self) -> None:
        sched = self.system.get_schedule("nilphamari", "going")
        self.assertIsNotNone(sched)
        # Route start time is সকাল ৭টা, first stop চৌরঙ্গী is সকাল ৭:১০
        self.assertEqual(sched["route_start_time"], "সকাল ৭টা")
        self.assertEqual(sched["first_stop_time"], "সকাল ৭:১০")
        self.assertTrue(sched["has_separate_first_stop_time"])
        self.assertEqual(len(sched["stops"]), 5)
        self.assertEqual(sched["stops"][0]["name"], "চৌরঙ্গী")
        self.assertEqual(sched["stops"][0]["time"], "সকাল ৭:১০")
        self.assertEqual(sched["stops"][0]["fare"], "৪০ টাকা")
        self.assertEqual(sched["stops"][-1]["name"], "চেলাপীর")
        self.assertEqual(sched["stops"][-1]["time"], "সকাল ৭:৩০")
        self.assertEqual(sched["stops"][-1]["fare"], "২০ টাকা")

    def test_returning_schedules_and_baust_fare_dash(self) -> None:
        for route_id, expected_count in [("dinajpur", 12), ("rangpur", 12), ("nilphamari", 6)]:
            sched = self.system.get_schedule(route_id, "returning")
            self.assertIsNotNone(sched)
            self.assertTrue(sched["is_estimated"])
            self.assertEqual(sched["route_start_time"], "দুপুর ২টা ৩৫ মিনিট")
            self.assertEqual(sched["notice"], RETURN_WARNING_NOTICE)
            self.assertEqual(len(sched["stops"]), expected_count)
            first_stop = sched["stops"][0]
            self.assertEqual(first_stop["name"], "BAUST")
            self.assertEqual(first_stop["time"], "দুপুর ২:৩৫")
            # Must be '—', never '0' or '০ টাকা'
            self.assertEqual(first_stop["fare"], "—")
            self.assertNotIn(first_stop["fare"], ("0", "০", "0 টাকা", "০ টাকা"))

    def test_bus_stop_encapsulation_and_updates(self) -> None:
        stop = BusStop("১", "চৌরঙ্গী", "সকাল ৭:১০", "৪০ টাকা")
        self.assertEqual(stop.get_details()["time"], "সকাল ৭:১০")
        stop.update_time("সকাল ৭:১৫")
        stop.update_fare("৪৫ টাকা")
        self.assertEqual(stop.get_details()["time"], "সকাল ৭:১৫")
        self.assertEqual(stop.get_details()["fare"], "৪৫ টাকা")

        # Updating fare to None should set '—'
        stop.update_fare(None)
        self.assertEqual(stop.get_details()["fare"], "—")

        # Setting fare to '0 টাকা' should raise ValueError
        with self.assertRaises(ValueError):
            stop.update_fare("০ টাকা")

    def test_inheritance_and_polymorphism(self) -> None:
        bus = Bus("দিনাজপুর ↔ BAUST")
        bus_route = BusRoute("dinajpur", "দিনাজপুর", "দিনাজপুর থেকে BAUST", "প্রায় ৩৮ কি.মি.")
        bus_route.add_stop(BusStop("১", "সুইহারী তেলপাম্প", "সকাল ৬:২০", "৭০ টাকা"))

        going = GoingRoute("dinajpur", "দিনাজপুর ↔ BAUST", "দিনাজপুর থেকে BAUST", "সকাল ৬টা ২০ মিনিট", bus_route, bus)
        returning = ReturningRoute("dinajpur", "দিনাজপুর ↔ BAUST", "BAUST থেকে দিনাজপুর", "দুপুর ২টা ৩৫ মিনিট", bus_route, bus)

        self.assertIsInstance(going, BaseRoute)
        self.assertIsInstance(returning, BaseRoute)
        self.assertFalse(going.get_schedule()["is_estimated"])
        self.assertTrue(returning.get_schedule()["is_estimated"])
        self.assertEqual(going.get_schedule()["estimated_distance"], "প্রায় ৩৮ কি.মি.")

    def test_bus_route_estimated_distance(self) -> None:
        routes = {r["id"]: r for r in self.system.get_all_routes()}
        self.assertEqual(routes["dinajpur"]["estimated_distance"], "প্রায় ৩৮ কি.মি.")
        self.assertEqual(routes["rangpur"]["estimated_distance"], "প্রায় ৪২ কি.মি.")
        self.assertEqual(routes["nilphamari"]["estimated_distance"], "প্রায় ২২ কি.মি.")

        bus_route = BusRoute("dinajpur", "দিনাজপুর", "দিনাজপুর থেকে BAUST", "প্রায় ৩৮ কি.মি.")
        self.assertEqual(bus_route.estimated_distance, "প্রায় ৩৮ কি.মি.")
        self.assertEqual(bus_route.get_estimated_distance(), "প্রায় ৩৮ কি.মি.")
        bus_route.update_estimated_distance("প্রায় ৪০ কি.মি.")
        self.assertEqual(bus_route.display_route()["estimated_distance"], "প্রায় ৪০ কি.মি.")

    def test_search_routes_and_stops(self) -> None:
        results = self.system.search_routes_and_stops("চৌরঙ্গী")
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["route_id"], "nilphamari")
        self.assertEqual(results[0]["stop_name"], "চৌরঙ্গী")


if __name__ == "__main__":
    unittest.main()
