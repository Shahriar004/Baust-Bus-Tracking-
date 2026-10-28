"""
data package initializer for Baust Bus Tracking System.
Exposes route data definitions from data.routes.
"""

from data.routes import ROUTES_DATA, RETURN_WARNING_NOTICE, NO_GPS_NOTICE

__all__ = ["ROUTES_DATA", "RETURN_WARNING_NOTICE", "NO_GPS_NOTICE"]
