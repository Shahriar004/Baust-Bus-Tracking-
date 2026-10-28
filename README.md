# Baust Bus Tracking System

## 1. Project Name
**Baust Bus Tracking System**

---

## 2. Project Introduction
**Baust Bus Tracking System** is an academic Object-Oriented Programming (OOP) web application built using **Python**, **Flask**, **HTML5**, **CSS3**, **JavaScript**, and **Jinja2**. It presents the official bus routes, boarding stops, departure schedules, and stop-wise fares for **Bangladesh Army University of Science and Technology (BAUST)** in a clean, responsive, and student-friendly Bengali interface.

---

## 3. Project Objective
The primary objective of this project is to allow BAUST students to easily find:
- Which official routes BAUST buses operate on (`দিনাজপুর ↔ BAUST`, `রংপুর ↔ BAUST`, `নীলফামারী ↔ BAUST`).
- Which stops students can board from on each route.
- What the scheduled departure time is for each stop.
- What the fare is for each specific stop.
- What the schedule is for going to BAUST (`BAUST-এ যাওয়া`).
- What the estimated schedule is for returning from BAUST (`BAUST থেকে ফেরা`).

---

## 4. Technologies Used
1. **Python 3** — Core programming language and OOP implementation.
2. **Flask** — Backend web framework (`app.py`).
3. **HTML5 & Jinja2** — Semantic page templates with template inheritance (`templates/`).
4. **CSS3** — Responsive layout, dark blue & green theme, and Bengali typography (`static/css/style.css`).
5. **JavaScript (ES6)** — Mobile navigation menu toggle and schedule filter interactions (`static/js/script.js`).
6. **Object-Oriented Programming (OOP)** — Encapsulation, Inheritance, Polymorphism, and Abstraction (`models/` & `services/`).

---

## 5. Key Features
- **Three Official BAUST Routes**:
  1. **দিনাজপুর ↔ BAUST** (Going start: সকাল ৬টা ২০ মিনিট | 11 stops)
  2. **রংপুর ↔ BAUST** (Going start: সকাল ৬টা ৩০ মিনিট | 11 stops)
  3. **নীলফামারী ↔ BAUST** (Going start: সকাল ৭টা, First stop `চৌরঙ্গী` at সকাল ৭:১০ | 5 stops)
- **Bidirectional Schedule Support**: Separate schedules for going to BAUST (`BAUST-এ যাওয়া`) and returning from BAUST (`BAUST থেকে ফেরা` starting at দুপুর ২টা ৩৫ মিনিট).
- **Mandatory Returning Schedule Warning**: Clearly displays the notice above returning schedules indicating that returning times are estimated (`আনুমানিক`).
- **Accurate Fare Handling**: Shows `"—"` for the BAUST starting row on returning schedules where no fare is specified (never misleadingly displayed as `0` or `০ টাকা`).
- **Centralized Python Data File**: All route, stop, time, and fare records live in `data/routes.py` so updating a single file updates the entire website.
- **Custom 404 Error Handling**: Gracefully informs the user if an invalid or non-existent route is requested.

---

## 6. Four Pillars of Object-Oriented Programming (OOP)

Every OOP principle is actively used in the runtime logic of this application:

### 6.1 Encapsulation (`এনক্যাপসুলেশন`)
- **File**: `models/bus_stop.py`, `models/bus.py`, `models/bus_route.py`, `models/bus_schedule.py`
- **Classes**: `BusStop`, `Bus`, `BusRoute`, `BusSchedule`
- **Methods & Properties**:
  - In `BusStop`, protected attributes `_serial`, `_name`, `_time`, and `_fare` are encapsulated and validated inside `__init__`, `_normalize_fare()`, `update_time()`, `update_fare()`, and `get_details()`.
  - `_normalize_fare()` ensures unspecified fares (such as the `BAUST` starting point on returning trips) are stored as `"—"` and blocks invalid `"0 টাকা"` values.

### 6.2 Abstraction (`অ্যাবস্ট্রাকশন`)
- **File**: `models/route_types.py`
- **Class**: `BaseRoute(ABC)`
- **Methods**:
  - Uses Python's `abc.ABC` and `@abstractmethod` decorators to define abstract methods `get_schedule()` and `get_direction_label()`.
  - Enforces a strict interface contract that every concrete route direction class must implement.

### 6.3 Inheritance (`ইনহেরিট্যান্স`)
- **File**: `models/route_types.py`
- **Classes**: `GoingRoute(BaseRoute)` and `ReturningRoute(BaseRoute)`
- **Methods**:
  - Both `GoingRoute` and `ReturningRoute` inherit common attributes (`route_id`, `route_title`, `direction_title`, `start_time`, `bus_route`, `bus`) and shared method `get_route_info()` from `BaseRoute` via `super().__init__(...)`.

### 6.4 Polymorphism (`পলিমরফিজম`)
- **Files**: `models/route_types.py` and `services/tracking_system.py`
- **Classes**: `GoingRoute`, `ReturningRoute`, and `BusTrackingSystem`
- **Method**: `get_schedule()`
  - `GoingRoute.get_schedule()` returns confirmed morning stop times (`is_estimated = False`).
  - `ReturningRoute.get_schedule()` returns estimated afternoon return times (`is_estimated = True`) along with the mandatory warning banner (`RETURN_WARNING_NOTICE`).
  - `BusTrackingSystem.get_schedule(route_id, direction)` calls `directional_route.get_schedule()` through the common `BaseRoute` interface without needing to know the concrete subclass implementation.

---

## 7. Folder Structure

```text
Baust-Bus-Tracking-System/
│
├── app.py
├── requirements.txt
├── README.md
│
├── models/
│   ├── __init__.py
│   ├── bus.py
│   ├── bus_stop.py
│   ├── bus_route.py
│   ├── bus_schedule.py
│   └── route_types.py
│
├── services/
│   ├── __init__.py
│   └── tracking_system.py
│
├── data/
│   ├── __init__.py
│   └── routes.py
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── routes.html
│   ├── route_detail.html
│   ├── schedule.html
│   ├── about.html
│   └── 404.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── images/
│
└── tests/
    └── test_system.py
```

---

## 8. How to Install Required Packages

Make sure Python 3.8+ is installed on your computer. Open a terminal in the project folder and create a virtual environment:

### Windows (Command Prompt / PowerShell)
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 9. How to Run the Project in VS Code
1. Open **Visual Studio Code**.
2. Click **File → Open Folder** and select the `Baust-Bus-Tracking-System` directory.
3. Open the integrated terminal in VS Code (`Ctrl + ~` or **Terminal → New Terminal**).
4. Activate your virtual environment and install dependencies (`pip install -r requirements.txt`).
5. Run the Flask server:
   ```bash
   python app.py
   ```
6. Open your browser and visit: `http://127.0.0.1:5000`
7. To run the OOP unit tests:
   ```bash
   python -m unittest discover -s tests -p "test_*.py" -v
   ```

---

## 10. How to Update Route Information
All route names, stop names, scheduled times, and fares are stored in a single file:
- **`data/routes.py`**

To update any stop time or fare:
1. Open `data/routes.py` in VS Code.
2. Locate the route key (`"dinajpur"`, `"rangpur"`, or `"nilphamari"`) and direction (`"going"` or `"returning"`).
3. Edit the `"name"`, `"time"`, or `"fare"` value inside the `"stops"` list and save the file.
4. Refresh the browser — the website will automatically display the updated data through `BusTrackingSystem`.

---

## 11. Project Limitations
- Version 1.0 is a static schedule, stop, and fare information system.
- There is **no real-time GPS hardware integration or live bus location tracking** in this version.
- Afternoon returning schedules (`BAUST থেকে ফেরা`) are estimated (`আনুমানিক`) and subject to verification from the BAUST transport authority.

---

## 12. Future Enhancements
- Integration with real-time GPS tracking devices installed on BAUST buses.
- Admin authentication panel for transport officers to publish notice alerts or special exam-day schedules.
- Push or SMS notifications for schedule changes.
- Search by stop name across all routes.

---

## 13. Developer Information
**Developed by Shahriar Islam Santo**
© 2026 Baust Bus Tracking System. All Rights Reserved.
