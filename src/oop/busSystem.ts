/**
 * src/oop/busSystem.ts
 * --------------------
 * TypeScript OOP implementation mirroring the Python OOP models in:
 * - models/bus_stop.py (BusStop)
 * - models/bus.py (Bus)
 * - models/bus_route.py (BusRoute)
 * - models/bus_schedule.py (BusSchedule)
 * - models/route_types.py (BaseRoute, GoingRoute, ReturningRoute)
 * - services/tracking_system.py (BusTrackingSystem)
 * - data/routes.py (ROUTES_DATA)
 *
 * Used for instant rendering while the backend also executes Python's
 * `python3 -m services.tracking_system` dynamically from `data/routes.py`.
 */

export interface StopDetails {
  serial: string;
  name: string;
  time: string;
  fare: string;
  has_fare: boolean;
  display_time?: string;
}

export interface BusInfo {
  bus_id: string;
  bus_name: string;
  route: string;
  gps_available: boolean;
  tracking_note: string;
}

export interface SchedulePayload {
  route_id: string;
  route_name: string;
  route_title?: string;
  route_short_name?: string;
  short_description?: string;
  estimated_distance: string;
  direction: string;
  direction_key: 'going' | 'returning';
  direction_title: string;
  direction_label: string;
  button_label: string;
  schedule_type: string;
  route_start_time: string;
  first_stop_time: string;
  has_separate_first_stop_time: boolean;
  is_estimated: boolean;
  time_column_Title: string;
  notice: string | null;
  warning_notice?: string;
  total_stops: number;
  stops: StopDetails[];
  bus_info: BusInfo;
}

export interface RouteSummaryPayload {
  id: string;
  name: string;
  title: string;
  estimated_distance: string;
  short_description: string;
  icon_name: string;
  bus_info: BusInfo;
  going_start_time: string;
  going_first_stop_time: string;
  going_stops_count: number;
  returning_start_time: string;
  returning_stops_count: number;
  going: SchedulePayload;
  returning: SchedulePayload;
}

export interface SystemSummary {
  project_name: string;
  total_routes: number;
  total_routes_bn: string;
  directions_text: string;
  available_info_text: string;
  no_gps_notice: string;
  return_warning_notice: string;
}

export const RETURN_WARNING_NOTICE =
  'সতর্কতা: ফেরার সময়সূচি আনুমানিক। প্রকৃত সময়সূচি ও ভাড়া সংশ্লিষ্ট কর্তৃপক্ষের কাছ থেকে যাচাই করে নিন।';

export const NO_GPS_NOTICE =
  'এই ওয়েবসাইটে বাসের রুট, সময়সূচি ও ভাড়ার তথ্য দেওয়া হয়। বর্তমানে প্রকৃত GPS-ভিত্তিক লাইভ বাস ট্র্যাকিং সুবিধা নেই।';

/**
 * 13.1 BusStop Class (Encapsulation)
 */
export class BusStop {
  private _serial: string;
  private _name: string;
  private _time: string;
  private _fare: string;

  constructor(serial: string, name: string, time: string, fare: string | null = null) {
    if (!name || !name.trim()) {
      throw new Error('স্টপেজের নাম খালি রাখা যাবে না।');
    }
    if (!time || !time.trim()) {
      throw new Error('স্টপেজের সময় খালি রাখা যাবে না।');
    }
    this._serial = serial.trim();
    this._name = name.trim();
    this._time = time.trim();
    this._fare = BusStop.normalizeFare(fare);
  }

  private static normalizeFare(fare: string | null | undefined): string {
    if (fare === null || fare === undefined) {
      return '—';
    }
    const cleaned = fare.trim();
    if (!cleaned || ['উল্লেখ করা হয়নি', 'None', 'null', '—', '-'].includes(cleaned)) {
      return '—';
    }
    if (['0', '০', '0 টাকা', '০ টাকা'].includes(cleaned)) {
      throw new Error("অজানা ভাড়াকে শূন্য (০ টাকা) হিসেবে দেখানো যাবে না; '—' ব্যবহার করুন।");
    }
    return cleaned;
  }

  public update_time(newTime: string): void {
    if (!newTime || !newTime.trim()) {
      throw new Error('নতুন সময় খালি হতে পারবে না।');
    }
    this._time = newTime.trim();
  }

  public update_fare(newFare: string | null): void {
    this._fare = BusStop.normalizeFare(newFare);
  }

  public get_details(): StopDetails {
    return {
      serial: this._serial,
      name: this._name,
      time: this._time,
      fare: this._fare,
      has_fare: this._fare !== '—',
    };
  }
}

/**
 * 13.2 Bus Class
 */
export class Bus {
  private _routeTitle: string;
  private _busId: string;
  private _busName: string;

  constructor(routeTitle: string, busId?: string, busName?: string) {
    this._routeTitle = routeTitle.trim();
    this._busId = busId ? busId.trim() : 'নির্ধারিত বাস নম্বর উল্লেখ নেই';
    this._busName = busName ? busName.trim() : 'BAUST নির্ধারিত রুট বাস';
  }

  public get_route(): string {
    return this._routeTitle;
  }

  public get_bus_info(): BusInfo {
    return {
      bus_id: this._busId,
      bus_name: this._busName,
      route: this._routeTitle,
      gps_available: false,
      tracking_note: 'স্থির সময়সূচি ও স্টপেজ তথ্য (প্রকৃত GPS ট্র্যাকিং নেই)',
    };
  }
}

/**
 * 13.3 BusRoute Class
 */
export class BusRoute {
  private _routeId: string;
  private _routeName: string;
  private _direction: string;
  private _estimatedDistance: string;
  private _stops: BusStop[] = [];

  constructor(
    routeId: string,
    routeName: string,
    direction: string,
    estimatedDistance = 'উল্লেখ নেই'
  ) {
    this._routeId = routeId;
    this._routeName = routeName;
    this._direction = direction;
    this._estimatedDistance =
      estimatedDistance && estimatedDistance.trim() ? estimatedDistance.trim() : 'উল্লেখ নেই';
  }

  public get estimated_distance(): string {
    return this._estimatedDistance;
  }

  public get_estimated_distance(): string {
    return this._estimatedDistance;
  }

  public update_estimated_distance(newDistance: string): void {
    if (!newDistance || !newDistance.trim()) {
      throw new Error('আনুমানিক দূরত্ব খালি রাখা যাবে না।');
    }
    this._estimatedDistance = newDistance.trim();
  }

  public add_stop(stop: BusStop): void {
    this._stops.push(stop);
  }

  public get_stops(): BusStop[] {
    return [...this._stops];
  }

  public display_route() {
    const stops = this._stops.map((s) => s.get_details());
    return {
      route_id: this._routeId,
      route_name: this._routeName,
      direction: this._direction,
      estimated_distance: this._estimatedDistance,
      total_stops: stops.length,
      first_stop: stops[0]?.name ?? '—',
      last_stop: stops[stops.length - 1]?.name ?? '—',
      first_stop_time: stops[0]?.time ?? '—',
      last_stop_time: stops[stops.length - 1]?.time ?? '—',
      stops,
    };
  }
}

/**
 * 13.4 BusSchedule Class
 */
export class BusSchedule {
  private _startTime: string;
  private _scheduleType: string;
  private _busRoute: BusRoute;
  private _isEstimated: boolean;
  private _notice: string | null;

  constructor(
    startTime: string,
    scheduleType: string,
    busRoute: BusRoute,
    isEstimated = false,
    notice: string | null = null
  ) {
    this._startTime = startTime;
    this._scheduleType = scheduleType;
    this._busRoute = busRoute;
    this._isEstimated = isEstimated;
    this._notice = notice;
  }

  private static isDistinctStartTime(routeStart: string, firstStop: string): boolean {
    if (routeStart === firstStop) return false;
    const equivalentPairs = [
      ['সকাল ৬টা ২০ মিনিট', 'সকাল ৬:২০'],
      ['সকাল ৬টা ৩০ মিনিট', 'সকাল ৬:৩০'],
      ['দুপুর ২টা ৩৫ মিনিট', 'দুপুর ২:৩৫'],
    ];
    return !equivalentPairs.some(([a, b]) => a === routeStart && b === firstStop);
  }

  public get_schedule() {
    const routeData = this._busRoute.display_route();
    const firstStopTime = routeData.first_stop_time;
    return {
      route_id: routeData.route_id,
      route_name: routeData.route_name,
      direction: routeData.direction,
      estimated_distance: routeData.estimated_distance,
      schedule_type: this._scheduleType,
      route_start_time: this._startTime,
      first_stop_time: firstStopTime,
      has_separate_first_stop_time: BusSchedule.isDistinctStartTime(
        this._startTime,
        firstStopTime
      ),
      is_estimated: this._isEstimated,
      time_column_Title: this._isEstimated ? 'আনুমানিক সময়' : 'সময়',
      notice: this._notice,
      total_stops: routeData.total_stops,
      stops: routeData.stops,
    };
  }

  public display_schedule() {
    const schedule = this.get_schedule();
    return {
      ...schedule,
      stops: schedule.stops.map((s) => ({
        ...s,
        display_time: this._isEstimated ? `${s.time} (আনুমানিক)` : s.time,
      })),
    };
  }
}

/**
 * 13.5 Abstract BaseRoute Class (Abstraction & Inheritance)
 */
export abstract class BaseRoute {
  protected _routeId: string;
  protected _routeTitle: string;
  protected _directionTitle: string;
  protected _startTime: string;
  protected _busRoute: BusRoute;
  protected _bus: Bus;

  constructor(
    routeId: string,
    routeTitle: string,
    directionTitle: string,
    startTime: string,
    busRoute: BusRoute,
    bus: Bus
  ) {
    this._routeId = routeId;
    this._routeTitle = routeTitle;
    this._directionTitle = directionTitle;
    this._startTime = startTime;
    this._busRoute = busRoute;
    this._bus = bus;
  }

  public get bus_route(): BusRoute {
    return this._busRoute;
  }

  public abstract get_direction_label(): string;
  public abstract get_schedule(): SchedulePayload;
}

/**
 * 13.6 GoingRoute Class (Inheritance & Polymorphism)
 */
export class GoingRoute extends BaseRoute {
  private _schedule: BusSchedule;

  constructor(
    routeId: string,
    routeTitle: string,
    directionTitle: string,
    startTime: string,
    busRoute: BusRoute,
    bus: Bus
  ) {
    super(routeId, routeTitle, directionTitle, startTime, busRoute, bus);
    this._schedule = new BusSchedule(
      startTime,
      'নির্ধারিত সময়সূচি (BAUST-এ যাওয়া)',
      busRoute,
      false,
      null
    );
  }

  public get_direction_label(): string {
    return 'BAUST-এ যাওয়া';
  }

  public get_schedule(): SchedulePayload {
    const base = this._schedule.display_schedule();
    return {
      ...base,
      direction_key: 'going',
      direction_title: this._directionTitle,
      direction_label: this.get_direction_label(),
      button_label: 'BAUST-এ যাওয়ার সময়সূচি',
      bus_info: this._bus.get_bus_info(),
    };
  }
}

/**
 * 13.7 ReturningRoute Class (Inheritance & Polymorphism)
 */
export class ReturningRoute extends BaseRoute {
  private _schedule: BusSchedule;
  private _warningNotice: string;

  constructor(
    routeId: string,
    routeTitle: string,
    directionTitle: string,
    startTime: string,
    busRoute: BusRoute,
    bus: Bus,
    warningNotice = RETURN_WARNING_NOTICE
  ) {
    super(routeId, routeTitle, directionTitle, startTime, busRoute, bus);
    this._warningNotice = warningNotice;
    this._schedule = new BusSchedule(
      startTime,
      'আনুমানিক সময়সূচি (BAUST থেকে ফেরা)',
      busRoute,
      true,
      warningNotice
    );
  }

  public get_direction_label(): string {
    return 'BAUST থেকে ফেরা';
  }

  public get_schedule(): SchedulePayload {
    const base = this._schedule.display_schedule();
    return {
      ...base,
      direction_key: 'returning',
      direction_title: this._directionTitle,
      direction_label: this.get_direction_label(),
      button_label: 'BAUST থেকে ফেরার সময়সূচি',
      warning_notice: this._warningNotice,
      bus_info: this._bus.get_bus_info(),
    };
  }
}

/**
 * 13.8 BusTrackingSystem Class
 */
export class BusTrackingSystem {
  private _routes: Map<
    string,
    {
      id: string;
      name: string;
      title: string;
      short_description: string;
      icon_name: string;
      bus: Bus;
      goingRoute: GoingRoute;
      returningRoute: ReturningRoute;
    }
  > = new Map();

  public add_route(record: {
    id: string;
    name: string;
    title: string;
    short_description: string;
    icon_name: string;
    bus: Bus;
    goingRoute: GoingRoute;
    returningRoute: ReturningRoute;
  }): void {
    this._routes.set(record.id, record);
  }

  public find_route(routeId: string): RouteSummaryPayload | null {
    const record = this._routes.get(routeId.trim().toLowerCase());
    if (!record) return null;
    const going = record.goingRoute.get_schedule();
    const returning = record.returningRoute.get_schedule();
    const estimatedDistance = record.goingRoute.bus_route.estimated_distance;
    going.route_title = record.title;
    going.route_short_name = record.name;
    going.short_description = record.short_description;
    going.estimated_distance = estimatedDistance;
    returning.route_title = record.title;
    returning.route_short_name = record.name;
    returning.short_description = record.short_description;
    returning.estimated_distance = estimatedDistance;

    return {
      id: record.id,
      name: record.name,
      title: record.title,
      estimated_distance: estimatedDistance,
      short_description: record.short_description,
      icon_name: record.icon_name,
      bus_info: record.bus.get_bus_info(),
      going_start_time: going.route_start_time,
      going_first_stop_time: going.first_stop_time,
      going_stops_count: going.total_stops,
      returning_start_time: returning.route_start_time,
      returning_stops_count: returning.total_stops,
      going,
      returning,
    };
  }

  public get_all_routes(): RouteSummaryPayload[] {
    const list: RouteSummaryPayload[] = [];
    for (const key of this._routes.keys()) {
      const found = this.find_route(key);
      if (found) list.push(found);
    }
    return list;
  }

  public get_schedule(routeId: string, direction: 'going' | 'returning'): SchedulePayload | null {
    const record = this._routes.get(routeId.trim().toLowerCase());
    if (!record) return null;
    const directionalRoute: BaseRoute =
      direction === 'returning' ? record.returningRoute : record.goingRoute;
    const schedule = directionalRoute.get_schedule();
    schedule.route_title = record.title;
    schedule.route_short_name = record.name;
    schedule.short_description = record.short_description;
    schedule.estimated_distance = directionalRoute.bus_route.estimated_distance;
    return schedule;
  }

  public get_system_summary(): SystemSummary {
    return {
      project_name: 'Baust Bus Tracking System',
      total_routes: this._routes.size,
      total_routes_bn: '৩টি',
      directions_text: 'BAUST-এ যাওয়া এবং BAUST থেকে ফেরা',
      available_info_text: 'স্টপেজ, সময়সূচি ও ভাড়া',
      no_gps_notice: NO_GPS_NOTICE,
      return_warning_notice: RETURN_WARNING_NOTICE,
    };
  }
}

const RAW_ROUTES_DATA = [
  {
    id: 'dinajpur',
    name: 'দিনাজপুর',
    title: 'দিনাজপুর ↔ BAUST',
    estimated_distance: 'প্রায় ৩৮ কি.মি.',
    short_description:
      'সুইহারী তেলপাম্প, মডার্ন মোড়, দিনাজপুর টার্মিনাল, কলেজ মোড়, দশ মাইল ও রানীর বন্দর হয়ে BAUST ক্যাম্পাসে যাতায়াতের নির্ধারিত বাস রুট।',
    icon_name: 'route-north',
    going: {
      direction_title: 'দিনাজপুর থেকে BAUST',
      route_start_time: 'সকাল ৬টা ২০ মিনিট',
      stops: [
        { serial: '১', name: 'সুইহারী তেলপাম্প', time: 'সকাল ৬:২০', fare: '৭০ টাকা' },
        { serial: '২', name: 'মডার্ন মোড়', time: 'সকাল ৬:২২', fare: '৭০ টাকা' },
        { serial: '৩', name: 'লিলির মোড়', time: 'সকাল ৬:২৬', fare: '৭০ টাকা' },
        { serial: '৪', name: 'মেডিকেল মোড়', time: 'সকাল ৬:২৮', fare: '৭০ টাকা' },
        { serial: '৫', name: 'মহারাজার মোড়', time: 'সকাল ৬:৩০', fare: '৭০ টাকা' },
        { serial: '৬', name: 'দিনাজপুর টার্মিনাল', time: 'সকাল ৬:৩৫', fare: '৭০ টাকা' },
        { serial: '৭', name: 'কলেজ মোড়', time: 'সকাল ৬:৪০', fare: '৭০ টাকা' },
        { serial: '৮', name: 'বাঁশেরহাট', time: 'সকাল ৬:৫০', fare: '৬০ টাকা' },
        { serial: '৯', name: 'দশ মাইল', time: 'সকাল ৭:০০', fare: '৪৫ টাকা' },
        { serial: '১০', name: 'ভূষির বন্দর', time: 'সকাল ৭:০৫', fare: '৪০ টাকা' },
        { serial: '১১', name: 'রানীর বন্দর', time: 'সকাল ৭:১০', fare: '২৫ টাকা' },
      ],
    },
    returning: {
      direction_title: 'BAUST থেকে দিনাজপুর',
      route_start_time: 'দুপুর ২টা ৩৫ মিনিট',
      stops: [
        { serial: '১', name: 'BAUST', time: 'দুপুর ২:৩৫', fare: null },
        { serial: '২', name: 'রানীর বন্দর', time: 'দুপুর ২:৫৫', fare: '২৫ টাকা' },
        { serial: '৩', name: 'ভূষির বন্দর', time: 'বিকেল ৩:০০', fare: '৪০ টাকা' },
        { serial: '৪', name: 'দশ মাইল', time: 'বিকেল ৩:০৫', fare: '৪৫ টাকা' },
        { serial: '৫', name: 'বাঁশেরহাট', time: 'বিকেল ৩:১৫', fare: '৬০ টাকা' },
        { serial: '৬', name: 'কলেজ মোড়', time: 'বিকেল ৩:২৫', fare: '৭০ টাকা' },
        { serial: '৭', name: 'দিনাজপুর টার্মিনাল', time: 'বিকেল ৩:৩০', fare: '৭০ টাকা' },
        { serial: '৮', name: 'মহারাজার মোড়', time: 'বিকেল ৩:৩৫', fare: '৭০ টাকা' },
        { serial: '৯', name: 'মেডিকেল মোড়', time: 'বিকেল ৩:৩৭', fare: '৭০ টাকা' },
        { serial: '১০', name: 'লিলির মোড়', time: 'বিকেল ৩:৩৯', fare: '৭০ টাকা' },
        { serial: '১১', name: 'মডার্ন মোড়', time: 'বিকেল ৩:৪৩', fare: '৭০ টাকা' },
        { serial: '১২', name: 'সুইহারী তেলপাম্প', time: 'বিকেল ৩:৪৫', fare: '৭০ টাকা' },
      ],
    },
  },
  {
    id: 'rangpur',
    name: 'রংপুর',
    title: 'রংপুর ↔ BAUST',
    estimated_distance: 'প্রায় ৪২ কি.মি.',
    short_description:
      'শাপলা, জাহাজ কোম্পানি, পায়রা, মেডিকেল মোড়, পাগলাপীর ও তারাগঞ্জ হয়ে BAUST ক্যাম্পাসে যাতায়াতের নির্ধারিত বাস রুট।',
    icon_name: 'route-east',
    going: {
      direction_title: 'রংপুর থেকে BAUST',
      route_start_time: 'সকাল ৬টা ৩০ মিনিট',
      stops: [
        { serial: '১', name: 'শাপলা', time: 'সকাল ৬:৩০', fare: '৭০ টাকা' },
        { serial: '২', name: 'জাহাজ কোম্পানি', time: 'সকাল ৬:৩৫', fare: '৭০ টাকা' },
        { serial: '৩', name: 'পায়রা', time: 'সকাল ৬:৩৭', fare: '৭০ টাকা' },
        { serial: '৪', name: 'চেক পোস্ট', time: 'সকাল ৬:৫০', fare: '৭০ টাকা' },
        { serial: '৫', name: 'মেডিকেল মোড়', time: 'সকাল ৭:০০', fare: '৭০ টাকা' },
        { serial: '৬', name: 'সিও বাজার', time: 'সকাল ৭:০৫', fare: '৭০ টাকা' },
        { serial: '৭', name: 'হাসনা', time: 'সকাল ৭:১০', fare: '৭০ টাকা' },
        { serial: '৮', name: 'হাজীর হাট', time: 'সকাল ৭:১৫', fare: '৬০ টাকা' },
        { serial: '৯', name: 'পাগলাপীর', time: 'সকাল ৭:২৫', fare: '৫০ টাকা' },
        { serial: '১০', name: 'ইকরচালী', time: 'সকাল ৭:৩৫', fare: '৩৫ টাকা' },
        { serial: '১১', name: 'তারাগঞ্জ', time: 'সকাল ৭:৪৫', fare: '২৫ টাকা' },
      ],
    },
    returning: {
      direction_title: 'BAUST থেকে রংপুর',
      route_start_time: 'দুপুর ২টা ৩৫ মিনিট',
      stops: [
        { serial: '১', name: 'BAUST', time: 'দুপুর ২:৩৫', fare: null },
        { serial: '২', name: 'তারাগঞ্জ', time: 'দুপুর ২:৫৫', fare: '২৫ টাকা' },
        { serial: '৩', name: 'ইকরচালী', time: 'বিকেল ৩:০৫', fare: '৩৫ টাকা' },
        { serial: '৪', name: 'পাগলাপীর', time: 'বিকেল ৩:১৫', fare: '৫০ টাকা' },
        { serial: '৫', name: 'হাজীর হাট', time: 'বিকেল ৩:২৫', fare: '৬০ টাকা' },
        { serial: '৬', name: 'হাসনা', time: 'বিকেল ৩:৩০', fare: '৭০ টাকা' },
        { serial: '৭', name: 'সিও বাজার', time: 'বিকেল ৩:৩৫', fare: '৭০ টাকা' },
        { serial: '৮', name: 'মেডিকেল মোড়', time: 'বিকেল ৩:৪০', fare: '৭০ টাকা' },
        { serial: '৯', name: 'চেক পোস্ট', time: 'বিকেল ৩:৫০', fare: '৭০ টাকা' },
        { serial: '১০', name: 'পায়রা', time: 'বিকেল ৪:০০', fare: '৭০ টাকা' },
        { serial: '১১', name: 'জাহাজ কোম্পানি', time: 'বিকেল ৪:০৫', fare: '৭০ টাকা' },
        { serial: '১২', name: 'শাপলা', time: 'বিকেল ৪:১০', fare: '৭০ টাকা' },
      ],
    },
  },
  {
    id: 'nilphamari',
    name: 'নীলফামারী',
    title: 'নীলফামারী ↔ BAUST',
    estimated_distance: 'প্রায় ২২ কি.মি.',
    short_description:
      'চৌরঙ্গী, কালীবাড়ী, দারোয়ানী, কাজির হাট ও চেলাপীর হয়ে BAUST ক্যাম্পাসে যাতায়াতের নির্ধারিত বাস রুট।',
    icon_name: 'route-central',
    going: {
      direction_title: 'নীলফামারী থেকে BAUST',
      route_start_time: 'সকাল ৭টা',
      stops: [
        { serial: '১', name: 'চৌরঙ্গী', time: 'সকাল ৭:১০', fare: '৪০ টাকা' },
        { serial: '২', name: 'কালীবাড়ী', time: 'সকাল ৭:১৫', fare: '৪০ টাকা' },
        { serial: '৩', name: 'দারোয়ানী', time: 'সকাল ৭:২০', fare: '৪০ টাকা' },
        { serial: '৪', name: 'কাজির হাট', time: 'সকাল ৭:২৫', fare: '৪০ টাকা' },
        { serial: '৫', name: 'চেলাপীর', time: 'সকাল ৭:৩০', fare: '২০ টাকা' },
      ],
    },
    returning: {
      direction_title: 'BAUST থেকে নীলফামারী',
      route_start_time: 'দুপুর ২টা ৩৫ মিনিট',
      stops: [
        { serial: '১', name: 'BAUST', time: 'দুপুর ২:৩৫', fare: null },
        { serial: '২', name: 'চেলাপীর', time: 'বিকেল ৩:০৫', fare: '২০ টাকা' },
        { serial: '৩', name: 'কাজির হাট', time: 'বিকেল ৩:১০', fare: '৪০ টাকা' },
        { serial: '৪', name: 'দারোয়ানী', time: 'বিকেল ৩:১৫', fare: '৪০ টাকা' },
        { serial: '৫', name: 'কালীবাড়ী', time: 'বিকেল ৩:২০', fare: '৪০ টাকা' },
        { serial: '৬', name: 'চৌরঙ্গী', time: 'বিকেল ৩:২৫', fare: '৪০ টাকা' },
      ],
    },
  },
];

export function createDefaultTrackingSystem(): BusTrackingSystem {
  const system = new BusTrackingSystem();

  for (const r of RAW_ROUTES_DATA) {
    const bus = new Bus(r.title);

    const goingBusRoute = new BusRoute(
      r.id,
      r.name,
      r.going.direction_title,
      r.estimated_distance
    );
    for (const s of r.going.stops) {
      goingBusRoute.add_stop(new BusStop(s.serial, s.name, s.time, s.fare));
    }
    const goingRoute = new GoingRoute(
      r.id,
      r.title,
      r.going.direction_title,
      r.going.route_start_time,
      goingBusRoute,
      bus
    );

    const returningBusRoute = new BusRoute(
      r.id,
      r.name,
      r.returning.direction_title,
      r.estimated_distance
    );
    for (const s of r.returning.stops) {
      returningBusRoute.add_stop(new BusStop(s.serial, s.name, s.time, s.fare));
    }
    const returningRoute = new ReturningRoute(
      r.id,
      r.title,
      r.returning.direction_title,
      r.returning.route_start_time,
      returningBusRoute,
      bus,
      RETURN_WARNING_NOTICE
    );

    system.add_route({
      id: r.id,
      name: r.name,
      title: r.title,
      short_description: r.short_description,
      icon_name: r.icon_name,
      bus,
      goingRoute,
      returningRoute,
    });
  }

  return system;
}
