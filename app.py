"""
app.py
------
Flask web application entry point for Baust Bus Tracking System.

Academic OOP Project:
- Uses BusTrackingSystem (from services/tracking_system.py) to serve route,
  stop, schedule, and fare data through Object-Oriented Programming models.
- Never hardcodes route data inside HTML templates or route handlers.
"""

from flask import Flask, render_template, request, abort
from services.tracking_system import create_default_tracking_system

app = Flask(__name__)


def get_system():
    """
    Creates and returns an instance of BusTrackingSystem loaded from data/routes.py.
    Reloading per request ensures any update to data/routes.py is reflected immediately.
    """
    return create_default_tracking_system()


@app.context_processor
def inject_global_context():
    """
    Provides common navigation and footer route data to all templates extending base.html.
    """
    system = get_system()
    return {
        "nav_routes": system.get_all_routes(),
        "system_summary": system.get_system_summary(),
    }


@app.route("/")
def index():
    """
    Homepage (/):
    Displays Hero section, 3 official route cards, quick verified facts, and non-GPS notice.
    """
    system = get_system()
    routes = system.get_all_routes()
    summary = system.get_system_summary()
    return render_template("index.html", routes=routes, summary=summary, active_page="home")


@app.route("/routes")
def routes_page():
    """
    Bus Routes Page (/routes):
    Displays the 3 BAUST bus routes with interactive direction selection
    (BAUST-এ যাওয়ার সময়সূচি and BAUST থেকে ফেরার সময়সূচি).
    """
    system = get_system()
    routes = system.get_all_routes()
    selected_route_id = request.args.get("route", "dinajpur").strip().lower()
    selected_direction = request.args.get("direction", "going").strip().lower()

    if selected_direction not in ("going", "returning"):
        selected_direction = "going"

    selected_route = system.find_route(selected_route_id)
    if not selected_route:
        selected_route_id = "dinajpur"
        selected_route = system.find_route("dinajpur")

    active_schedule = system.get_schedule(selected_route_id, selected_direction)

    return render_template(
        "routes.html",
        routes=routes,
        selected_route=selected_route,
        selected_route_id=selected_route_id,
        selected_direction=selected_direction,
        active_schedule=active_schedule,
        active_page="routes",
    )


@app.route("/route/<route_id>")
def route_detail(route_id: str):
    """
    Route Detail Page (/route/<route_id>):
    Displays complete information for a specific route ('dinajpur', 'rangpur', 'nilphamari').
    Returns custom 404 page if an invalid or unknown route_id (e.g. 'phulbari') is requested.
    """
    system = get_system()
    route = system.find_route(route_id)
    if not route:
        abort(404)

    direction = request.args.get("direction", "going").strip().lower()
    if direction not in ("going", "returning"):
        direction = "going"

    active_schedule = system.get_schedule(route_id, direction)

    return render_template(
        "route_detail.html",
        route=route,
        selected_direction=direction,
        active_schedule=active_schedule,
        active_page="routes",
    )


@app.route("/schedule")
def schedule_page():
    """
    Schedule Page (/schedule):
    Allows the student to select:
      1. Route (দিনাজপুর / রংপুর / নীলফামারী)
      2. Travel Direction (BAUST-এ যাওয়া / BAUST থেকে ফেরা)
    Shows clear guidance if no selection has been made yet.
    """
    system = get_system()
    routes = system.get_all_routes()

    selected_route_id = request.args.get("route", "").strip().lower()
    selected_direction = request.args.get("direction", "").strip().lower()

    schedule_data = None
    error_message = None

    if selected_route_id or selected_direction:
        if not selected_route_id or not selected_direction:
            error_message = "অনুগ্রহ করে রুট এবং যাতায়াতের দিক—উভয়টিই নির্বাচন করুন।"
        elif selected_direction not in ("going", "returning"):
            error_message = "নির্বাচিত যাতায়াতের দিকটি সঠিক নয়। অনুগ্রহ করে বৈধ দিক নির্বাচন করুন।"
        else:
            schedule_data = system.get_schedule(selected_route_id, selected_direction)
            if not schedule_data:
                error_message = "নির্বাচিত রুটটি পাওয়া যায়নি। শুধুমাত্র দিনাজপুর, রংপুর অথবা নীলফামারী রুট নির্বাচন করুন।"

    return render_template(
        "schedule.html",
        routes=routes,
        selected_route_id=selected_route_id,
        selected_direction=selected_direction,
        schedule_data=schedule_data,
        error_message=error_message,
        active_page="schedule",
    )


@app.route("/about")
def about_page():
    """
    About Page (/about):
    Displays project introduction, purpose, important notes for students, and summary info.
    """
    system = get_system()
    summary = system.get_system_summary()
    return render_template("about.html", summary=summary, active_page="about")


@app.route("/contact")
def contact_page():
    """
    Contact Page (/contact):
    Allows students to contact via Email or Facebook social links and submit requests
    to add or correct bus stop, schedule, or fare information.
    """
    system = get_system()
    routes = system.get_all_routes()
    summary = system.get_system_summary()
    return render_template("contact.html", routes=routes, summary=summary, active_page="contact")


@app.errorhandler(404)
def page_not_found(error):
    """
    Custom 404 Page:
    Gracefully handles unknown URLs or non-existent routes without crashing.
    """
    system = get_system()
    routes = system.get_all_routes()
    return render_template("404.html", routes=routes, active_page=""), 404


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
