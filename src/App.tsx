import React, { useEffect, useMemo, useState } from 'react';
import {
  createDefaultTrackingSystem,
  RouteSummaryPayload,
  SchedulePayload,
  StopDetails,
  SystemSummary,
} from './oop/busSystem';
import RouteMap from './components/RouteMap';
import {
  formatRouteForLang,
  formatScheduleForLang,
  formatStopForLang,
  Language,
  matchesBilingualRouteMeta,
  matchesBilingualStopKeyword,
  toBengaliDigits,
} from './i18n/translations';

type DirectionKey = 'going' | 'returning';

interface RouteLocation {
  pathname: string;
  searchParams: URLSearchParams;
}

interface CrossRouteMatch {
  routeId: string;
  routeTitle: string;
  directionKey: DirectionKey;
  directionLabel: string;
  directionTitle: string;
  isEstimated: boolean;
  stop: StopDetails;
}

function parseWindowLocation(): RouteLocation {
  return {
    pathname: window.location.pathname || '/',
    searchParams: new URLSearchParams(window.location.search),
  };
}

function getInitialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem('baust_bus_lang');
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {
    // ignore storage errors
  }
  return 'bn';
}

export default function App() {
  const fallbackSystem = useMemo(() => createDefaultTrackingSystem(), []);
  const [routes, setRoutes] = useState<RouteSummaryPayload[]>(() =>
    fallbackSystem.get_all_routes()
  );
  const [summary, setSummary] = useState<SystemSummary>(() =>
    fallbackSystem.get_system_summary()
  );
  const [location, setLocation] = useState<RouteLocation>(() => parseWindowLocation());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Bilingual language state ('bn' | 'en')
  const [lang, setLang] = useState<Language>(() => getInitialLanguage());

  // Google Maps Demo Key quota state
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Selected stop on the Google Map (for /routes, /route/:id, /schedule)
  const [selectedMapStop, setSelectedMapStop] = useState<string | null>(null);

  // Real-time search states for Routes (/routes) and Schedule (/schedule) pages
  const [routesSearchQuery, setRoutesSearchQuery] = useState<string>('');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState<string>('');

  // Schedule page filter states
  const [scheduleRouteInput, setScheduleRouteInput] = useState<string>('');
  const [scheduleDirectionInput, setScheduleDirectionInput] = useState<string>('');
  const [scheduleSubmittedRoute, setScheduleSubmittedRoute] = useState<string>('');
  const [scheduleSubmittedDirection, setScheduleSubmittedDirection] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Contact page form states for adding/correcting information
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactRoute, setContactRoute] = useState<string>('dinajpur');
  const [contactRequestType, setContactRequestType] = useState<string>('correction');
  const [contactStopName, setContactStopName] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  // Persist language choice and update <html lang="...">
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem('baust_bus_lang', lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  // Listen for Google Maps Demo Key quota errors
  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Fetch live data from Python OOP backend (python3 -m services.tracking_system)
  useEffect(() => {
    fetch('/api/bus-system')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.routes) && data.summary) {
          setRoutes(data.routes);
          setSummary(data.summary);
        }
      })
      .catch(() => {
        // Fallback OOP system is already active
      });
  }, []);

  // Sync browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const loc = parseWindowLocation();
      setLocation(loc);
      setMobileMenuOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Close slide-out mobile menu on Escape key or desktop resize, and lock body scroll while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  // Sync schedule query params when navigating to /schedule
  useEffect(() => {
    if (location.pathname === '/schedule') {
      const r = (location.searchParams.get('route') || '').trim().toLowerCase();
      const d = (location.searchParams.get('direction') || '').trim().toLowerCase();
      setScheduleRouteInput(r);
      setScheduleDirectionInput(d);
      setScheduleSubmittedRoute(r);
      setScheduleSubmittedDirection(d);
      setScheduleError(null);
    }
    setSelectedMapStop(null);
  }, [location]);

  const navigate = (to: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    window.history.pushState({}, '', to);
    setLocation(parseWindowLocation());
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const findRouteById = (routeId: string): RouteSummaryPayload | undefined => {
    const clean = routeId.trim().toLowerCase();
    return routes.find((r) => r.id === clean);
  };

  const getScheduleFromRoute = (
    routeId: string,
    direction: DirectionKey
  ): SchedulePayload | null => {
    const found = findRouteById(routeId);
    if (!found) return null;
    const sched = direction === 'returning' ? found.returning : found.going;
    return {
      ...sched,
      route_title: found.title,
      route_short_name: found.name,
      short_description: found.short_description,
      estimated_distance: found.estimated_distance,
    };
  };

  // Search across all routes and directions for a keyword (supports both Bengali & English queries)
  const searchAcrossAllRoutes = (rawQuery: string): CrossRouteMatch[] => {
    const q = rawQuery.trim();
    if (!q) return [];
    const results: CrossRouteMatch[] = [];
    for (const route of routes) {
      const routeMetaMatches = matchesBilingualRouteMeta(route, q);
      const formattedRoute = formatRouteForLang(route, lang);
      const directions: Array<{ key: DirectionKey; sched: SchedulePayload }> = [
        { key: 'going', sched: route.going },
        { key: 'returning', sched: route.returning },
      ];
      for (const dir of directions) {
        const formattedSched = formatScheduleForLang(
          { ...dir.sched, route_title: route.title },
          lang
        );
        for (const stop of dir.sched.stops) {
          if (routeMetaMatches || matchesBilingualStopKeyword(stop, q)) {
            results.push({
              routeId: route.id,
              routeTitle: formattedRoute.title,
              directionKey: dir.key,
              directionLabel: formattedSched.direction_label,
              directionTitle: formattedSched.direction_title,
              isEstimated: dir.sched.is_estimated,
              stop,
            });
          }
        }
      }
    }
    return results;
  };

  // Determine current active page
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  let activeNavPage: 'home' | 'routes' | 'schedule' | 'about' | 'contact' | '' = '';
  if (pathname === '/') activeNavPage = 'home';
  else if (pathname === '/routes' || pathname.startsWith('/route/')) activeNavPage = 'routes';
  else if (pathname === '/schedule') activeNavPage = 'schedule';
  else if (pathname === '/about') activeNavPage = 'about';
  else if (pathname === '/contact') activeNavPage = 'contact';

  // Reusable Schedule Table Component with bilingual support & real-time stop filter
  const renderScheduleBox = (
    scheduleData: SchedulePayload,
    kickerText: string,
    serialColumnHeader?: string,
    filterKeyword = '',
    enableMapLocate = false
  ) => {
    const cleanQuery = filterKeyword.trim();
    const formattedSched = formatScheduleForLang(scheduleData, lang);
    const parentRoute = findRouteById(scheduleData.route_id);
    const routeNameMatches =
      cleanQuery &&
      parentRoute &&
      matchesBilingualRouteMeta(parentRoute, cleanQuery);

    const filteredStops = cleanQuery
      ? scheduleData.stops.filter(
          (stop) => routeNameMatches || matchesBilingualStopKeyword(stop, cleanQuery)
        )
      : scheduleData.stops;

    const resolvedSerialHeader =
      serialColumnHeader || (lang === 'en' ? 'Serial' : 'ক্রমিক');

    return (
      <div className="schedule-display-box" id="routeScheduleSection">
        <div className="schedule-display-header">
          <div>
            <p className="schedule-kicker">{kickerText}</p>
            <h2 className="schedule-main-heading">{formattedSched.direction_title}</h2>
          </div>
          <div className="schedule-meta-summary">
            <span>
              {lang === 'en' ? 'Est. Distance:' : 'আনুমানিক দূরত্ব:'}{' '}
              <strong>{formattedSched.estimated_distance}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {lang === 'en' ? 'Route Start Time:' : 'রুট শুরুর নির্ধারিত সময়:'}{' '}
              <strong>{formattedSched.route_start_time}</strong>
            </span>
            {scheduleData.has_separate_first_stop_time && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {lang === 'en'
                    ? `First Stop Time (${formattedSched.first_stop_name}):`
                    : `প্রথম স্টপেজের সময় (${formattedSched.first_stop_name}):`}{' '}
                  <strong>{formattedSched.first_stop_time}</strong>
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {lang === 'en' ? 'Total Stops:' : 'মোট স্টপেজ:'}{' '}
              <strong>
                {lang === 'en'
                  ? cleanQuery
                    ? `${filteredStops.length} (of ${scheduleData.total_stops})`
                    : `${scheduleData.total_stops}`
                  : cleanQuery
                  ? `${toBengaliDigits(filteredStops.length)}টি (মোট ${toBengaliDigits(
                      scheduleData.total_stops
                    )}টির মধ্যে)`
                  : `${toBengaliDigits(scheduleData.total_stops)}টি`}
              </strong>
            </span>
          </div>
        </div>

        {scheduleData.is_estimated && formattedSched.notice && (
          <div className="warning-notice-banner" role="alert">
            <strong>{formattedSched.notice}</strong>
          </div>
        )}

        {filteredStops.length > 0 ? (
          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>{resolvedSerialHeader}</th>
                  <th>{lang === 'en' ? 'Stop Name' : 'স্টপেজের নাম'}</th>
                  <th>
                    {scheduleData.is_estimated
                      ? lang === 'en'
                        ? 'Estimated Time'
                        : 'আনুমানিক সময়'
                      : lang === 'en'
                      ? 'Time'
                      : 'সময়'}
                  </th>
                  <th>{lang === 'en' ? 'Fare' : 'ভাড়া'}</th>
                  {enableMapLocate && (
                    <th>{lang === 'en' ? 'Map Location' : 'ম্যাপে অবস্থান'}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredStops.map((stop) => {
                  const isSelectedOnMap = enableMapLocate && selectedMapStop === stop.name;
                  const formattedStop = formatStopForLang(stop, lang);
                  return (
                    <tr
                      key={`${scheduleData.direction_key}-${stop.serial}-${stop.name}`}
                      className={isSelectedOnMap ? 'row-map-selected' : ''}
                    >
                      <td className="col-serial tabular-nums">{formattedStop.serial}</td>
                      <td className="col-name">{formattedStop.name}</td>
                      <td className="col-time tabular-nums">
                        {formattedStop.time}
                        {scheduleData.is_estimated && (
                          <span className="estimated-text">
                            {lang === 'en' ? '(Estimated)' : '(আনুমানিক)'}
                          </span>
                        )}
                      </td>
                      <td className="col-fare tabular-nums">{formattedStop.fare}</td>
                      {enableMapLocate && (
                        <td>
                          <button
                            type="button"
                            className={`map-stop-chip ${isSelectedOnMap ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedMapStop(stop.name);
                              const mapEl = document.getElementById('routeGoogleMapSection');
                              if (mapEl) {
                                mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                          >
                            {lang === 'en' ? 'View on Map' : 'ম্যাপে দেখুন'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-guidance-box">
            <h3 className="empty-guidance-title">
              {lang === 'en' ? (
                <>No stop matching &ldquo;{cleanQuery}&rdquo; found in this schedule</>
              ) : (
                <>এই সময়সূচিতে &ldquo;{cleanQuery}&rdquo; নামের কোনো স্টপেজ পাওয়া যায়নি</>
              )}
            </h3>
            <p className="empty-guidance-desc">
              {lang === 'en'
                ? 'Please check the spelling or try selecting another route or travel direction.'
                : 'অনুগ্রহ করে বানান যাচাই করুন অথবা অন্য রুট বা যাতায়াতের দিক নির্বাচন করে দেখুন।'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Page 1: Homepage (/) — Clean Student Project Layout
  const renderHomePage = () => {
    return (
      <>
        {/* 5.1 Hero Section */}
        <section className="hero-section">
          <div className="container hero-inner">
            <div className="hero-content">
              <h1 className="hero-title">Baust Bus Tracking System</h1>
              <p className="hero-subtitle">
                {lang === 'en'
                  ? 'Find official bus stops, morning and afternoon schedules, fare lists, and interactive Google Maps routes for Dinajpur, Rangpur, and Nilphamari routes to BAUST campus in one place.'
                  : 'শিক্ষার্থীদের ক্যাম্পাসে যাতায়াতের সুবিধার্থে দিনাজপুর, রংপুর ও নীলফামারী রুটের বাসের নির্ধারিত স্টপেজ, যাতায়াতের সময়সূচি, ভাড়ার তালিকা ও গুগল ম্যাপ রুটের তথ্য এক জায়গায় দেখুন।'}
              </p>
              <div className="hero-buttons">
                <a
                  href="/routes"
                  onClick={(e) => navigate('/routes', e)}
                  className="btn btn-primary"
                >
                  {lang === 'en' ? 'View Bus Routes & Map' : 'বাস রুট ও ম্যাপ দেখুন'}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5.3 Quick Verified Information */}
        <section className="quick-info-section">
          <div className="container">
            <div className="quick-info-grid">
              <div className="quick-info-card">
                <span className="quick-info-label">
                  {lang === 'en' ? 'Total Official Routes' : 'মোট নির্ধারিত রুট'}
                </span>
                <strong className="quick-info-value">
                  {lang === 'en' ? '3 Bus Routes' : '৩টি বাস রুট'}
                </strong>
                <span className="quick-info-sub">
                  {lang === 'en'
                    ? 'Dinajpur, Rangpur & Nilphamari'
                    : 'দিনাজপুর, রংপুর ও নীলফামারী'}
                </span>
              </div>
              <div className="quick-info-card">
                <span className="quick-info-label">
                  {lang === 'en' ? 'Travel Directions' : 'যাতায়াতের দিক'}
                </span>
                <strong className="quick-info-value">
                  {lang === 'en'
                    ? 'Going to BAUST & Returning from BAUST'
                    : 'BAUST-এ যাওয়া এবং BAUST থেকে ফেরা'}
                </strong>
                <span className="quick-info-sub">
                  {lang === 'en'
                    ? 'Morning & Afternoon Schedules'
                    : 'সকাল ও দুপুরের নির্ধারিত সময়সূচি'}
                </span>
              </div>
              <div className="quick-info-card">
                <span className="quick-info-label">
                  {lang === 'en' ? 'Available Information' : 'প্রদত্ত তথ্যসমূহ'}
                </span>
                <strong className="quick-info-value">
                  {lang === 'en'
                    ? 'Stops, Time, Fare & Map'
                    : 'স্টপেজ, সময়, ভাড়া ও ম্যাপ'}
                </strong>
                <span className="quick-info-sub">
                  {lang === 'en'
                    ? 'Stop-by-stop serial details'
                    : 'প্রতিটি স্টপেজের ক্রমিক অনুযায়ী তথ্য'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5.2 Three Main Route Cards */}
        <section className="routes-showcase-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                {lang === 'en' ? 'Main Bus Routes' : 'প্রধান বাস রুটসমূহ'}
              </h2>
              <p className="section-desc">
                {lang === 'en'
                  ? 'Select any route below to view the stop list, estimated distance, Google Map route, and fare table.'
                  : 'নিচের যেকোনো একটি রুট নির্বাচন করে স্টপেজের তালিকা, আনুমানিক দূরত্ব, গুগল ম্যাপ ও নির্ধারিত ভাড়া দেখুন।'}
              </p>
            </div>

            <div className="route-cards-grid">
              {routes.map((route) => {
                const formattedRoute = formatRouteForLang(route, lang);
                return (
                  <article className="route-card" key={route.id}>
                    <div>
                      <div className="route-card-header">
                        <div className="route-icon-box" aria-hidden="true">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="4" y="3" width="16" height="15" rx="2"></rect>
                            <path d="M4 11h16"></path>
                            <path d="M8 15h.01"></path>
                            <path d="M16 15h.01"></path>
                            <path d="M6 18v3"></path>
                            <path d="M18 18v3"></path>
                          </svg>
                        </div>
                        <h3 className="route-card-title">{formattedRoute.title}</h3>
                      </div>
                      <p className="route-card-desc">{formattedRoute.short_description}</p>
                    </div>

                    <div>
                      <div className="route-card-meta">
                        <span>
                          {lang === 'en' ? 'Est. Distance:' : 'আনুমানিক দূরত্ব:'}{' '}
                          {formattedRoute.estimated_distance}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {lang === 'en' ? 'Starts:' : 'যাত্রা শুরু:'}{' '}
                          {formattedRoute.going_start_time}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {lang === 'en' ? 'Return:' : 'ফেরা:'}{' '}
                          {formattedRoute.returning_start_time}
                        </span>
                      </div>
                      <div className="route-card-actions">
                        <a
                          href={`/route/${route.id}`}
                          onClick={(e) => navigate(`/route/${route.id}`, e)}
                          className="btn btn-primary btn-block"
                        >
                          {lang === 'en' ? 'View Route & Map' : 'রুট ও ম্যাপ দেখুন'}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Overview Table on Homepage */}
        <section className="routes-page-section">
          <div className="container">
            <div className="schedule-display-box">
              <div className="schedule-display-header">
                <div>
                  <p className="schedule-kicker">
                    {lang === 'en' ? 'Routes Summary Table' : 'রুটগুলোর সংক্ষিপ্ত তালিকা'}
                  </p>
                  <h2 className="schedule-main-heading">
                    {lang === 'en'
                      ? 'Schedule & Distance of All 3 Bus Routes at a Glance'
                      : 'এক নজরে তিনটি বাস রুটের সময়সূচি ও দূরত্ব'}
                  </h2>
                </div>
              </div>
              <div className="table-responsive">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>{lang === 'en' ? 'Serial' : 'ক্রমিক'}</th>
                      <th>{lang === 'en' ? 'Bus Route Name' : 'বাস রুটের নাম'}</th>
                      <th>{lang === 'en' ? 'First Stop' : 'প্রথম স্টপেজ'}</th>
                      <th>{lang === 'en' ? 'Est. Distance' : 'আনুমানিক দূরত্ব'}</th>
                      <th>{lang === 'en' ? 'Morning Departure' : 'সকালে যাত্রা শুরু'}</th>
                      <th>
                        {lang === 'en'
                          ? 'Afternoon Return from Campus'
                          : 'দুপুরে ক্যাম্পাস থেকে ফেরা'}
                      </th>
                      <th>{lang === 'en' ? 'Details' : 'বিস্তারিত'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route, idx) => {
                      const formattedRoute = formatRouteForLang(route, lang);
                      return (
                        <tr key={route.id}>
                          <td className="col-serial tabular-nums">
                            {lang === 'en' ? idx + 1 : toBengaliDigits(idx + 1)}
                          </td>
                          <td className="col-name">{formattedRoute.title}</td>
                          <td>{formattedRoute.first_stop_name}</td>
                          <td className="tabular-nums">
                            {formattedRoute.estimated_distance}
                          </td>
                          <td className="col-time tabular-nums">
                            {formattedRoute.going_start_time}
                          </td>
                          <td className="col-time tabular-nums">
                            {formattedRoute.returning_start_time}
                          </td>
                          <td>
                            <a
                              href={`/route/${route.id}`}
                              onClick={(e) => navigate(`/route/${route.id}`, e)}
                              className="text-link"
                            >
                              {lang === 'en' ? 'View Details →' : 'বিস্তারিত দেখুন →'}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 5.4 Non-GPS Notice */}
        <section className="notice-section">
          <div className="container">
            <div className="info-notice-box" role="note">
              <div className="notice-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <p className="notice-text">
                {lang === 'en'
                  ? 'This website provides official bus routes, schedules, and fare information. Real-time GPS live bus tracking is currently not available.'
                  : summary.no_gps_notice}
              </p>
            </div>
          </div>
        </section>
      </>
    );
  };

  // Page 2: Bus Routes Page (/routes) with Real-Time Search Input Bar & Google Map
  const renderRoutesPage = () => {
    const rawRouteParam = (location.searchParams.get('route') || 'dinajpur').trim().toLowerCase();
    const rawDirParam = (location.searchParams.get('direction') || 'going').trim().toLowerCase();
    const selectedRouteId = findRouteById(rawRouteParam) ? rawRouteParam : 'dinajpur';
    const selectedDirection: DirectionKey =
      rawDirParam === 'returning' ? 'returning' : 'going';
    const activeSchedule = getScheduleFromRoute(selectedRouteId, selectedDirection);
    const formattedActiveSched = activeSchedule
      ? formatScheduleForLang(activeSchedule, lang)
      : null;

    const trimmedQuery = routesSearchQuery.trim();

    // Filter route cards by title, description, or matching stops inside that route (bilingual)
    const filteredRouteCards = routes
      .map((route) => {
        if (!trimmedQuery) {
          return { route, matches: true, matchedStopCount: 0 };
        }
        const metaMatch = matchesBilingualRouteMeta(route, trimmedQuery);

        const matchingGoingStops = route.going.stops.filter((s) =>
          matchesBilingualStopKeyword(s, trimmedQuery)
        );
        const matchingReturningStops = route.returning.stops.filter((s) =>
          matchesBilingualStopKeyword(s, trimmedQuery)
        );
        const uniqueStopNames = new Set([
          ...matchingGoingStops.map((s) => s.name),
          ...matchingReturningStops.map((s) => s.name),
        ]);

        return {
          route,
          matches: metaMatch || uniqueStopNames.size > 0,
          matchedStopCount: uniqueStopNames.size,
        };
      })
      .filter((item) => item.matches);

    return (
      <>
        <section className="page-header-section">
          <div className="container">
            <h1 className="page-title">
              {lang === 'en' ? 'Bus Routes & Google Map' : 'বাস রুট ও গুগল ম্যাপ'}
            </h1>
            <p className="page-subtitle">
              {lang === 'en'
                ? 'Explore all three official BAUST bus routes, interactive Google Maps paths, and stop-by-stop going and returning schedules with fares.'
                : 'BAUST-এর তিনটি নির্ধারিত বাস রুট, গুগল ম্যাপে রুটের পথ এবং যাওয়া ও ফেরার স্টপেজভিত্তিক সময়সূচি ও ভাড়ার তালিকা।'}
            </p>
          </div>
        </section>

        <section className="routes-page-section">
          <div className="container">
            {/* Real-Time Search Bar */}
            <div className="realtime-search-bar" role="search">
              <div className="search-input-wrapper">
                <span className="search-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="search"
                  id="routesSearchInput"
                  className="search-input"
                  value={routesSearchQuery}
                  onChange={(e) => setRoutesSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search by route or stop name in English or Bengali (e.g., Dinajpur, College Mor, Shapla, Chourangi...)'
                      : 'বাংলা বা ইংরেজিতে রুট বা স্টপেজের নাম লিখে খুঁজুন (যেমন: দিনাজপুর, College Mor, শাপলা, Chourangi...)'
                  }
                  aria-label={
                    lang === 'en'
                      ? 'Search by route or stop name'
                      : 'রুট বা স্টপেজের নাম লিখে খুঁজুন'
                  }
                />
                {routesSearchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setRoutesSearchQuery('')}
                  >
                    {lang === 'en' ? 'Clear' : 'মুছুন'}
                  </button>
                )}
              </div>
              <p className="search-status-text">
                {trimmedQuery
                  ? lang === 'en'
                    ? `Search Result: ${filteredRouteCards.length} route(s) found for "${trimmedQuery}".`
                    : `অনুসন্ধান ফলাফল: "${trimmedQuery}"-এর জন্য ${toBengaliDigits(
                        filteredRouteCards.length
                      )}টি রুট পাওয়া গেছে।`
                  : lang === 'en'
                  ? 'Type any route, stop name, time, or fare in English or Bengali to filter instantly.'
                  : 'বাংলা বা ইংরেজিতে যেকোনো রুট, স্টপেজের নাম, সময় বা ভাড়া লিখে তাৎক্ষণিক ফিল্টার করুন।'}
              </p>
            </div>

            {/* Route Selector Cards */}
            {filteredRouteCards.length > 0 ? (
              <div className="route-selector-grid">
                {filteredRouteCards.map(({ route, matchedStopCount }) => {
                  const isThisRoute = selectedRouteId === route.id;
                  const formattedRoute = formatRouteForLang(route, lang);
                  return (
                    <div
                      key={route.id}
                      className={`route-selector-card ${isThisRoute ? 'selected' : ''}`}
                    >
                      <div>
                        <div className="route-selector-top">
                          <h2 className="route-selector-title">{formattedRoute.title}</h2>
                          <a
                            href={`/route/${route.id}`}
                            onClick={(e) => navigate(`/route/${route.id}`, e)}
                            className="text-link"
                          >
                            {lang === 'en' ? 'Details Page →' : 'বিস্তারিত পেজ →'}
                          </a>
                        </div>
                        <p className="route-selector-desc">
                          {formattedRoute.short_description}
                        </p>
                        <div className="route-card-meta">
                          <span>
                            {lang === 'en' ? 'Est. Distance:' : 'আনুমানিক দূরত্ব:'}{' '}
                            {formattedRoute.estimated_distance}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {lang === 'en' ? 'Starts:' : 'যাত্রা শুরু:'}{' '}
                            {formattedRoute.going_start_time}
                          </span>
                        </div>
                        {trimmedQuery && matchedStopCount > 0 && (
                          <p className="route-match-count">
                            {lang === 'en'
                              ? `Matching stops: ${matchedStopCount}`
                              : `মিল পাওয়া স্টপেজ: ${toBengaliDigits(matchedStopCount)}টি`}
                          </p>
                        )}
                      </div>

                      <div className="direction-btn-group">
                        <a
                          href={`/routes?route=${route.id}&direction=going`}
                          onClick={(e) =>
                            navigate(`/routes?route=${route.id}&direction=going`, e)
                          }
                          className={`btn ${
                            isThisRoute && selectedDirection === 'going'
                              ? 'btn-primary'
                              : 'btn-outline'
                          }`}
                        >
                          {lang === 'en'
                            ? 'Schedule: Going to BAUST'
                            : 'BAUST-এ যাওয়ার সময়সূচি'}
                        </a>
                        <a
                          href={`/routes?route=${route.id}&direction=returning`}
                          onClick={(e) =>
                            navigate(`/routes?route=${route.id}&direction=returning`, e)
                          }
                          className={`btn ${
                            isThisRoute && selectedDirection === 'returning'
                              ? 'btn-green'
                              : 'btn-outline'
                          }`}
                        >
                          {lang === 'en'
                            ? 'Schedule: Returning from BAUST'
                            : 'BAUST থেকে ফেরার সময়সূচি'}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-guidance-box">
                <h2 className="empty-guidance-title">
                  {lang === 'en' ? (
                    <>No route or stop found matching &ldquo;{trimmedQuery}&rdquo;</>
                  ) : (
                    <>&ldquo;{trimmedQuery}&rdquo; নামের কোনো রুট বা স্টপেজ পাওয়া যায়নি</>
                  )}
                </h2>
                <p className="empty-guidance-desc">
                  {lang === 'en'
                    ? 'Please try searching for a stop name under the Dinajpur, Rangpur, or Nilphamari routes.'
                    : 'অনুগ্রহ করে দিনাজপুর, রংপুর বা নীলফামারী রুটের অন্তর্গত স্টপেজের নাম লিখে পুনরায় চেষ্টা করুন।'}
                </p>
              </div>
            )}

            {/* Interactive Google Map for the Selected Bus Route */}
            {activeSchedule && formattedActiveSched && (
              <div id="routeGoogleMapSection">
                <RouteMap
                  routeId={selectedRouteId}
                  routeTitle={formattedActiveSched.route_title}
                  directionKey={selectedDirection}
                  directionTitle={formattedActiveSched.direction_title}
                  stops={activeSchedule.stops}
                  selectedStopName={selectedMapStop}
                  onSelectStop={(stopName) => setSelectedMapStop(stopName)}
                  lang={lang}
                />
              </div>
            )}

            {activeSchedule &&
              formattedActiveSched &&
              renderScheduleBox(
                activeSchedule,
                formattedActiveSched.route_title,
                lang === 'en' ? 'Serial' : 'ক্রমিক',
                routesSearchQuery,
                true
              )}
          </div>
        </section>
      </>
    );
  };

  // Page 3: Specific Route Detail Page (/route/<route_id>) with Google Map
  const renderRouteDetailPage = (routeId: string) => {
    const route = findRouteById(routeId);
    if (!route) {
      return render404Page();
    }
    const rawDirParam = (location.searchParams.get('direction') || 'going').trim().toLowerCase();
    const selectedDirection: DirectionKey =
      rawDirParam === 'returning' ? 'returning' : 'going';
    const activeSchedule = getScheduleFromRoute(route.id, selectedDirection);
    const formattedRoute = formatRouteForLang(route, lang);
    const formattedActiveSched = activeSchedule
      ? formatScheduleForLang(activeSchedule, lang)
      : null;

    return (
      <>
        <section className="page-header-section">
          <div className="container">
            <p className="breadcrumb-nav">
              <a href="/" onClick={(e) => navigate('/', e)}>
                {lang === 'en' ? 'Home' : 'হোম'}
              </a>
              <span aria-hidden="true">/</span>
              <a href="/routes" onClick={(e) => navigate('/routes', e)}>
                {lang === 'en' ? 'Bus Routes' : 'বাস রুট'}
              </a>
              <span aria-hidden="true">/</span>
              <span>{formattedRoute.title}</span>
            </p>
            <h1 className="page-title">{formattedRoute.title}</h1>
            <p className="page-subtitle">{formattedRoute.short_description}</p>

            <div className="detail-direction-switcher">
              <a
                href={`/route/${route.id}?direction=going`}
                onClick={(e) => navigate(`/route/${route.id}?direction=going`, e)}
                className={`btn ${
                  selectedDirection === 'going' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {lang === 'en'
                  ? 'Schedule: Going to BAUST'
                  : 'BAUST-এ যাওয়ার সময়সূচি'}
              </a>
              <a
                href={`/route/${route.id}?direction=returning`}
                onClick={(e) => navigate(`/route/${route.id}?direction=returning`, e)}
                className={`btn ${
                  selectedDirection === 'returning' ? 'btn-green' : 'btn-outline'
                }`}
              >
                {lang === 'en'
                  ? 'Schedule: Returning from BAUST'
                  : 'BAUST থেকে ফেরার সময়সূচি'}
              </a>
            </div>
          </div>
        </section>

        <section className="route-detail-section">
          <div className="container">
            {/* Route Overview Card with Estimated Distance */}
            <article className="route-card">
              <div className="route-card-header">
                <div className="route-icon-box" aria-hidden="true">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="4" y="3" width="16" height="15" rx="2"></rect>
                    <path d="M4 11h16"></path>
                    <path d="M8 15h.01"></path>
                    <path d="M16 15h.01"></path>
                    <path d="M6 18v3"></path>
                    <path d="M18 18v3"></path>
                  </svg>
                </div>
                <h2 className="route-card-title">
                  {formattedRoute.title} —{' '}
                  {lang === 'en' ? 'Route Summary' : 'রুট সারসংক্ষেপ'}
                </h2>
              </div>
              <p className="route-card-desc">{formattedRoute.short_description}</p>
              <div className="route-card-meta">
                <span>
                  {lang === 'en' ? 'Est. Distance:' : 'আনুমানিক দূরত্ব:'}{' '}
                  {formattedRoute.estimated_distance}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {lang === 'en' ? 'Starts:' : 'যাত্রা শুরু:'}{' '}
                  {formattedRoute.going_start_time}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {lang === 'en' ? 'Return:' : 'ফেরা:'}{' '}
                  {formattedRoute.returning_start_time}
                </span>
              </div>
            </article>

            {activeSchedule && formattedActiveSched && (
              <div id="routeGoogleMapSection">
                <RouteMap
                  routeId={route.id}
                  routeTitle={formattedRoute.title}
                  directionKey={selectedDirection}
                  directionTitle={formattedActiveSched.direction_title}
                  stops={activeSchedule.stops}
                  selectedStopName={selectedMapStop}
                  onSelectStop={(stopName) => setSelectedMapStop(stopName)}
                  lang={lang}
                />
              </div>
            )}

            {activeSchedule &&
              formattedActiveSched &&
              renderScheduleBox(
                activeSchedule,
                formattedActiveSched.schedule_type,
                lang === 'en' ? 'Serial' : 'ক্রমিক',
                '',
                true
              )}
          </div>
        </section>
      </>
    );
  };

  // Page 4: Schedule Page (/schedule) with Real-Time Search Input Bar & Google Map
  const renderSchedulePage = () => {
    const handleScheduleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!scheduleRouteInput || !scheduleDirectionInput) {
        setScheduleError(
          lang === 'en'
            ? 'Please select both a Route and a Travel Direction.'
            : 'অনুগ্রহ করে রুট এবং যাতায়াতের দিক—উভয়টিই নির্বাচন করুন।'
        );
        setScheduleSubmittedRoute('');
        setScheduleSubmittedDirection('');
        return;
      }
      setScheduleError(null);
      navigate(
        `/schedule?route=${encodeURIComponent(scheduleRouteInput)}&direction=${encodeURIComponent(
          scheduleDirectionInput
        )}`
      );
    };

    const handleRouteDropdownChange = (val: string) => {
      setScheduleRouteInput(val);
      setScheduleError(null);
      if (val && scheduleDirectionInput) {
        navigate(`/schedule?route=${val}&direction=${scheduleDirectionInput}`);
      }
    };

    const handleDirectionDropdownChange = (val: string) => {
      setScheduleDirectionInput(val);
      setScheduleError(null);
      if (scheduleRouteInput && val) {
        navigate(`/schedule?route=${scheduleRouteInput}&direction=${val}`);
      }
    };

    let scheduleData: SchedulePayload | null = null;
    let validationMessage: string | null = scheduleError;

    if (!validationMessage && (scheduleSubmittedRoute || scheduleSubmittedDirection)) {
      if (!scheduleSubmittedRoute || !scheduleSubmittedDirection) {
        validationMessage =
          lang === 'en'
            ? 'Please select both a Route and a Travel Direction.'
            : 'অনুগ্রহ করে রুট এবং যাতায়াতের দিক—উভয়টিই নির্বাচন করুন।';
      } else if (
        scheduleSubmittedDirection !== 'going' &&
        scheduleSubmittedDirection !== 'returning'
      ) {
        validationMessage =
          lang === 'en'
            ? 'Selected travel direction is invalid. Please choose a valid direction.'
            : 'নির্বাচিত যাতায়াতের দিকটি সঠিক নয়। অনুগ্রহ করে বৈধ দিক নির্বাচন করুন।';
      } else {
        scheduleData = getScheduleFromRoute(
          scheduleSubmittedRoute,
          scheduleSubmittedDirection as DirectionKey
        );
        if (!scheduleData) {
          validationMessage =
            lang === 'en'
              ? 'Selected route was not found. Please select Dinajpur, Rangpur, or Nilphamari.'
              : 'নির্বাচিত রুটটি পাওয়া যায়নি। শুধুমাত্র দিনাজপুর, রংপুর অথবা নীলফামারী রুট নির্বাচন করুন।';
        }
      }
    }

    const formattedSched = scheduleData ? formatScheduleForLang(scheduleData, lang) : null;
    const trimmedSearch = scheduleSearchQuery.trim();
    const crossRouteMatches =
      !scheduleData && trimmedSearch ? searchAcrossAllRoutes(trimmedSearch) : [];

    return (
      <>
        <section className="page-header-section">
          <div className="container">
            <h1 className="page-title">
              {lang === 'en'
                ? 'Bus Schedule & Fare Finder'
                : 'বাসের সময়সূচি ও ভাড়া অনুসন্ধান'}
            </h1>
            <p className="page-subtitle">
              {lang === 'en'
                ? 'Select your preferred route and travel direction below to view the Google Map route, official stops, timings, and fares.'
                : 'নিচের ফর্ম থেকে আপনার কাঙ্ক্ষিত রুট এবং যাতায়াতের দিক নির্বাচন করে গুগল ম্যাপে রুট, নির্ধারিত স্টপেজ, সময় ও ভাড়া দেখুন।'}
            </p>
          </div>
        </section>

        <section className="schedule-page-section">
          <div className="container">
            <form onSubmit={handleScheduleSubmit} className="schedule-filter-form">
              <div className="form-group">
                <label htmlFor="routeSelect" className="form-label">
                  {lang === 'en' ? 'Step 1: Select Route' : 'প্রথম নির্বাচন: রুট'}
                </label>
                <select
                  id="routeSelect"
                  name="route"
                  className="form-select"
                  value={scheduleRouteInput}
                  onChange={(e) => handleRouteDropdownChange(e.target.value)}
                >
                  <option value="">
                    {lang === 'en' ? '-- Select Route --' : '-- রুট নির্বাচন করুন --'}
                  </option>
                  <option value="dinajpur">
                    {lang === 'en' ? 'Dinajpur' : 'দিনাজপুর'}
                  </option>
                  <option value="rangpur">{lang === 'en' ? 'Rangpur' : 'রংপুর'}</option>
                  <option value="nilphamari">
                    {lang === 'en' ? 'Nilphamari' : 'নীলফামারী'}
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="directionSelect" className="form-label">
                  {lang === 'en'
                    ? 'Step 2: Travel Direction'
                    : 'দ্বিতীয় নির্বাচন: যাতায়াতের দিক'}
                </label>
                <select
                  id="directionSelect"
                  name="direction"
                  className="form-select"
                  value={scheduleDirectionInput}
                  onChange={(e) => handleDirectionDropdownChange(e.target.value)}
                >
                  <option value="">
                    {lang === 'en'
                      ? '-- Select Travel Direction --'
                      : '-- যাতায়াতের দিক নির্বাচন করুন --'}
                  </option>
                  <option value="going">
                    {lang === 'en' ? 'Going to BAUST' : 'BAUST-এ যাওয়া'}
                  </option>
                  <option value="returning">
                    {lang === 'en' ? 'Returning from BAUST' : 'BAUST থেকে ফেরা'}
                  </option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {lang === 'en' ? 'View Schedule' : 'সময়সূচি দেখুন'}
                </button>
                {(scheduleRouteInput || scheduleDirectionInput) && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setScheduleError(null);
                      navigate('/schedule');
                    }}
                  >
                    {lang === 'en' ? 'Reset' : 'পুনরায় নির্বাচন'}
                  </button>
                )}
              </div>
            </form>

            {/* Real-Time Search Bar on Schedule Page */}
            <div className="realtime-search-bar" role="search">
              <div className="search-input-wrapper">
                <span className="search-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="search"
                  id="scheduleSearchInput"
                  className="search-input"
                  value={scheduleSearchQuery}
                  onChange={(e) => setScheduleSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search by stop name, route, time, or fare in English or Bengali (e.g., Dash Mile, Shapla, Chourangi, 40 BDT...)'
                      : 'বাংলা বা ইংরেজিতে স্টপেজের নাম, রুট, সময় বা ভাড়া লিখে খুঁজুন (যেমন: দশ মাইল, Shapla, চৌরঙ্গী, 40...)'
                  }
                  aria-label={
                    lang === 'en'
                      ? 'Search schedule stops or times'
                      : 'সময়সূচির স্টপেজ বা সময় লিখে খুঁজুন'
                  }
                />
                {scheduleSearchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setScheduleSearchQuery('')}
                  >
                    {lang === 'en' ? 'Clear' : 'মুছুন'}
                  </button>
                )}
              </div>
              <p className="search-status-text">
                {scheduleData
                  ? lang === 'en'
                    ? 'Filter any stop, time, or fare in the selected schedule table instantly.'
                    : 'নির্বাচিত সময়সূচি টেবিলের যেকোনো স্টপেজ, সময় বা ভাড়া লিখে সাথে সাথে ফিল্টার করুন।'
                  : lang === 'en'
                  ? 'Type any stop name without selecting a route to search across all routes at once.'
                  : 'রুট নির্বাচন ছাড়াই যেকোনো স্টপেজের নাম লিখলে সব রুটের মিল থাকা স্টপেজ নিচে দেখা যাবে।'}
              </p>
            </div>

            {validationMessage ? (
              <div className="warning-notice-banner" role="alert">
                {validationMessage}
              </div>
            ) : !scheduleData && !trimmedSearch ? (
              <div className="empty-guidance-box">
                <h2 className="empty-guidance-title">
                  {lang === 'en'
                    ? 'Select a Route and Travel Direction'
                    : 'রুট এবং যাতায়াতের দিক নির্বাচন করুন'}
                </h2>
                <p className="empty-guidance-desc">
                  {lang === 'en' ? (
                    <>
                      To view the schedule and fare table, choose{' '}
                      <strong>Step 1: Select Route</strong> (Dinajpur, Rangpur, or Nilphamari) and{' '}
                      <strong>Step 2: Travel Direction</strong> (Going to BAUST or Returning from
                      BAUST) above, or type a stop name in the search box.
                    </>
                  ) : (
                    <>
                      সময়সূচি ও ভাড়ার টেবিল দেখতে উপরে <strong>প্রথম নির্বাচন: রুট</strong>{' '}
                      (দিনাজপুর, রংপুর অথবা নীলফামারী) এবং{' '}
                      <strong>দ্বিতীয় নির্বাচন: যাতায়াতের দিক</strong> (BAUST-এ যাওয়া অথবা BAUST
                      থেকে ফেরা) নির্বাচন করে <strong>সময়সূচি দেখুন</strong> বাটনে ক্লিক করুন,
                      অথবা সার্চ বক্সে স্টপেজের নাম লিখুন।
                    </>
                  )}
                </p>
              </div>
            ) : null}

            {/* Cross-Route Instant Stop Search Results when no specific route is selected */}
            {!scheduleData && trimmedSearch && (
              <div className="cross-route-results-box">
                <div className="cross-route-header">
                  <h2 className="cross-route-title">
                    {lang === 'en' ? (
                      <>
                        Search Results for &ldquo;{trimmedSearch}&rdquo; ({crossRouteMatches.length}
                        )
                      </>
                    ) : (
                      <>
                        &ldquo;{trimmedSearch}&rdquo;-এর জন্য অনুসন্ধান ফলাফল (
                        {toBengaliDigits(crossRouteMatches.length)}টি)
                      </>
                    )}
                  </h2>
                </div>
                {crossRouteMatches.length > 0 ? (
                  <div className="table-responsive">
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th>{lang === 'en' ? 'Route & Direction' : 'রুট ও দিক'}</th>
                          <th>{lang === 'en' ? 'Serial' : 'ক্রমিক'}</th>
                          <th>{lang === 'en' ? 'Stop Name' : 'স্টপেজের নাম'}</th>
                          <th>{lang === 'en' ? 'Time' : 'সময়'}</th>
                          <th>{lang === 'en' ? 'Fare' : 'ভাড়া'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crossRouteMatches.map((item, idx) => {
                          const formattedStop = formatStopForLang(item.stop, lang);
                          return (
                            <tr
                              key={`${item.routeId}-${item.directionKey}-${item.stop.serial}-${idx}`}
                            >
                              <td>
                                <a
                                  href={`/schedule?route=${item.routeId}&direction=${item.directionKey}`}
                                  onClick={(e) => {
                                    setScheduleSearchQuery('');
                                    navigate(
                                      `/schedule?route=${item.routeId}&direction=${item.directionKey}`,
                                      e
                                    );
                                  }}
                                  className="text-link"
                                >
                                  {item.directionTitle} →
                                </a>
                              </td>
                              <td className="col-serial tabular-nums">{formattedStop.serial}</td>
                              <td className="col-name">{formattedStop.name}</td>
                              <td className="col-time tabular-nums">
                                {formattedStop.time}
                                {item.isEstimated && (
                                  <span className="estimated-text">
                                    {lang === 'en' ? '(Estimated)' : '(আনুমানিক)'}
                                  </span>
                                )}
                              </td>
                              <td className="col-fare tabular-nums">{formattedStop.fare}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty-guidance-desc">
                    {lang === 'en'
                      ? 'No stop, time, or fare matching this keyword was found in any route.'
                      : 'কোনো রুটে এই নামের স্টপেজ, সময় বা ভাড়া পাওয়া যায়নি।'}
                  </p>
                )}
              </div>
            )}

            {scheduleData && formattedSched && (
              <div id="routeGoogleMapSection">
                <RouteMap
                  routeId={scheduleSubmittedRoute}
                  routeTitle={formattedSched.route_title}
                  directionKey={scheduleSubmittedDirection as DirectionKey}
                  directionTitle={formattedSched.direction_title}
                  stops={scheduleData.stops}
                  selectedStopName={selectedMapStop}
                  onSelectStop={(stopName) => setSelectedMapStop(stopName)}
                  lang={lang}
                />
              </div>
            )}

            {scheduleData &&
              formattedSched &&
              renderScheduleBox(
                scheduleData,
                `${formattedSched.route_title} · ${formattedSched.direction_label}`,
                lang === 'en' ? 'Serial No.' : 'ক্রমিক নম্বর',
                scheduleSearchQuery,
                true
              )}
          </div>
        </section>
      </>
    );
  };

  // Page 5: About Page (/about) — No code, no tech stack, no OOP, no VS Code file list
  const renderAboutPage = () => (
    <>
      <section className="page-header-section">
        <div className="container">
          <h1 className="page-title">
            {lang === 'en' ? 'About Us' : 'আমাদের সম্পর্কে'}
          </h1>
          <p className="page-subtitle">
            {lang === 'en'
              ? 'Overview, purpose, main features, and important guidelines for students using the Baust Bus Tracking System.'
              : 'Baust Bus Tracking System ওয়েবসাইটের পরিচিতি, লক্ষ্য, মূল কাজ এবং শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ নির্দেশনা।'}
          </p>
        </div>
      </section>

      <section className="about-page-section">
        <div className="container">
          {/* প্রজেক্টের পরিচিতি / Project Introduction */}
          <div className="about-card">
            <h2 className="about-card-title">
              {lang === 'en' ? 'Project Introduction' : 'প্রজেক্টের পরিচিতি'}
            </h2>
            <p className="about-text">
              {lang === 'en' ? (
                <>
                  <strong>Baust Bus Tracking System</strong> is an informational web portal built
                  for the students of BAUST to make daily campus commuting easier and well-informed.
                  The main purpose of this website is to clearly present the official bus routes,
                  designated stops, timings at each stop, and fare details in one convenient place.
                </>
              ) : (
                <>
                  <strong>Baust Bus Tracking System</strong> হলো BAUST-এর শিক্ষার্থীদের প্রতিদিনের
                  যাতায়াতকে সহজ ও তথ্যসমৃদ্ধ করার জন্য তৈরি একটি তথ্যভিত্তিক ওয়েবসাইট। ক্যাম্পাসে
                  যাতায়াতকারী শিক্ষার্থীদের জন্য বাসের সঠিক রুট, নির্ধারিত স্টপেজ, প্রতিটি স্টপেজে
                  বাসের সময় এবং নির্ধারিত ভাড়ার তথ্য এক জায়গায় পরিষ্কারভাবে তুলে ধরাই এই ওয়েবসাইটের
                  মূল উদ্দেশ্য।
                </>
              )}
            </p>
            <p className="about-text">
              {lang === 'en'
                ? 'Especially for new students or those commuting on a route for the first time, every detail has been organized systematically so they can easily find their nearest bus stop, departure time, and fare without any confusion.'
                : 'বিশেষ করে নবীন শিক্ষার্থী কিংবা যারা নতুন রুটে যাতায়াত করতে চান, তারা যেন কোনো বিভ্রান্তি ছাড়াই নিজেদের নিকটস্থ স্টপেজ, বাস ছাড়ার সময় ও ভাড়ার পরিমাণ সহজে জানতে পারেন—সেই লক্ষ্যেই প্রতিটি তথ্য সুশৃঙ্খলভাবে সাজানো হয়েছে।'}
            </p>
          </div>

          {/* এই ওয়েবসাইটের মূল কাজসমূহ / Main Features */}
          <div className="about-card">
            <h2 className="about-card-title">
              {lang === 'en' ? 'What This Website Does' : 'এই ওয়েবসাইটের মূল কাজসমূহ'}
            </h2>
            <p className="about-text">
              {lang === 'en'
                ? 'Students can easily use this website for the following purposes:'
                : 'একজন শিক্ষার্থী এই ওয়েবসাইট ব্যবহার করে খুব সহজেই নিচের কাজগুলো করতে পারবেন:'}
            </p>
            <div className="oop-principles-grid">
              <div className="oop-item">
                <h3>
                  {lang === 'en'
                    ? '1. View Official Bus Routes & Maps'
                    : '১. নির্ধারিত বাস রুটের তথ্য ও ম্যাপ দেখা'}
                </h3>
                <p>
                  {lang === 'en' ? (
                    <>
                      Explore detailed information, Google Maps routes, and stop lists for BAUST’s
                      three main bus routes—<strong>Dinajpur ↔ BAUST</strong>,{' '}
                      <strong>Rangpur ↔ BAUST</strong>, and <strong>Nilphamari ↔ BAUST</strong>.
                    </>
                  ) : (
                    <>
                      BAUST-এর তিনটি প্রধান বাস রুট—<strong>দিনাজপুর ↔ BAUST</strong>,{' '}
                      <strong>রংপুর ↔ BAUST</strong> এবং <strong>নীলফামারী ↔ BAUST</strong> সম্পর্কে
                      বিস্তারিত তথ্য, গুগল ম্যাপ রুট ও স্টপেজ তালিকা দেখা।
                    </>
                  )}
                </p>
              </div>
              <div className="oop-item">
                <h3>
                  {lang === 'en'
                    ? '2. Check Going & Returning Schedules'
                    : '২. যাওয়া ও ফেরার সময়সূচি দেখা'}
                </h3>
                <p>
                  {lang === 'en'
                    ? 'View fixed morning departure times to campus and estimated afternoon return schedules from BAUST separately for every stop.'
                    : 'সকালে ক্যাম্পাসে যাওয়ার নির্ধারিত সময়সূচি এবং দুপুরে BAUST থেকে ফেরার আনুমানিক সময়সূচি আলাদাভাবে নির্বাচন করে প্রতিটি স্টপেজের সময় জানা।'}
                </p>
              </div>
              <div className="oop-item">
                <h3>
                  {lang === 'en'
                    ? '3. Know Stop-wise Bus Fares'
                    : '৩. স্টপেজভিত্তিক নির্ধারিত ভাড়া জানা'}
                </h3>
                <p>
                  {lang === 'en'
                    ? 'Check the exact fare assigned for boarding or alighting at each stop along every route in serial order.'
                    : 'প্রতিটি রুটের কোন স্টপেজ থেকে উঠলে বা নামলে কত টাকা ভাড়া নির্ধারিত রয়েছে, তা ক্রমিক অনুযায়ী স্পষ্টভাবে দেখে নেওয়া।'}
                </p>
              </div>
              <div className="oop-item">
                <h3>
                  {lang === 'en'
                    ? '4. Instant Stop & Route Search (Bangla & English)'
                    : '৪. দ্রুত স্টপেজ ও রুট অনুসন্ধান'}
                </h3>
                <p>
                  {lang === 'en'
                    ? 'Use the real-time search bar and filters on the Routes and Schedule pages in either Bangla or English to immediately find your stop’s time and fare.'
                    : 'বাস রুট ও সময়সূচি পেজে থাকা সার্চ বক্স ও ফিল্টার ব্যবহার করে বাংলা বা ইংরেজিতে নিজের স্টপেজের নাম লিখে তাৎক্ষণিকভাবে বাসের সময় ও ভাড়া খুঁজে বের করা।'}
                </p>
              </div>
            </div>
          </div>

          {/* গুরুত্বপূর্ণ কথা ও সংক্ষিপ্ত তথ্য */}
          <div className="about-grid">
            <div className="about-card">
              <h2 className="about-card-title">
                {lang === 'en'
                  ? 'Important Notes for Students'
                  : 'শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ কথা'}
              </h2>
              <ul className="tech-list">
                <li>
                  {lang === 'en'
                    ? 'Students are advised to arrive at their respective bus stops at least 5 to 10 minutes before the scheduled time.'
                    : 'যাতায়াতের সুবিধার্থে নির্ধারিত সময়ের অন্তত ৫ থেকে ১০ মিনিট পূর্বে নিজ নিজ বাস স্টপেজে উপস্থিত থাকার পরামর্শ দেওয়া হচ্ছে।'}
                </li>
                <li>
                  {lang === 'en'
                    ? 'Bus arrival times may vary slightly due to road traffic, weather, or unavoidable circumstances.'
                    : 'সড়কের যানজট, আবহাওয়া বা অনিবার্য পরিস্থিতির কারণে বাস পৌঁছানোর সময়ে সামান্য তারতম্য হতে পারে।'}
                </li>
                <li>
                  {lang === 'en'
                    ? 'Returning schedules from BAUST are provided as estimates; please verify updated timings and fares with the transport authority during special exams or holidays.'
                    : 'BAUST থেকে ফেরার সময়সূচি আনুমানিক হিসেবে দেওয়া হয়েছে; বিশেষ পরীক্ষা বা ছুটির দিনে পরিবর্তিত সময়সূচি ও ভাড়া সংশ্লিষ্ট পরিবহন কর্তৃপক্ষের কাছ থেকে যাচাই করে নিন।'}
                </li>
                <li>
                  {lang === 'en'
                    ? 'This website provides designated routes, stops, schedules, and fare information. Real-time GPS live bus tracking is currently not available.'
                    : 'এই ওয়েবসাইটে বাসের নির্ধারিত রুট, স্টপেজ, সময়সূচি ও ভাড়ার তথ্য প্রদান করা হয়। বর্তমানে প্রকৃত GPS-ভিত্তিক লাইভ বাস ট্র্যাকিং সুবিধা নেই।'}
                </li>
              </ul>
            </div>

            <div className="about-card">
              <h2 className="about-card-title">
                {lang === 'en' ? 'Quick Summary' : 'সংক্ষিপ্ত তথ্য'}
              </h2>
              <dl className="about-definition-list">
                <div className="about-def-row">
                  <dt>{lang === 'en' ? 'Website Name' : 'ওয়েবসাইটের নাম'}</dt>
                  <dd>
                    <strong>Baust Bus Tracking System</strong>
                  </dd>
                </div>
                <div className="about-def-row">
                  <dt>{lang === 'en' ? 'Covered Routes' : 'অন্তর্ভুক্ত রুটসমূহ'}</dt>
                  <dd>
                    {lang === 'en'
                      ? 'Dinajpur ↔ BAUST, Rangpur ↔ BAUST & Nilphamari ↔ BAUST (Total 3 Routes)'
                      : 'দিনাজপুর ↔ BAUST, রংপুর ↔ BAUST এবং নীলফামারী ↔ BAUST (মোট ৩টি রুট)'}
                  </dd>
                </div>
                <div className="about-def-row">
                  <dt>{lang === 'en' ? 'Travel Directions' : 'যাতায়াতের দিক'}</dt>
                  <dd>
                    {lang === 'en'
                      ? 'Going to BAUST & Returning from BAUST'
                      : 'BAUST-এ যাওয়া এবং BAUST থেকে ফেরা'}
                  </dd>
                </div>
                <div className="about-def-row">
                  <dt>{lang === 'en' ? 'Primary Goal' : 'মূল উদ্দেশ্য'}</dt>
                  <dd>
                    {lang === 'en'
                      ? 'Easily present BAUST bus routes, stops, schedules, and fare information in both Bangla and English.'
                      : 'BAUST-সংশ্লিষ্ট নির্ধারিত বাস রুট, স্টপেজ, সময়সূচি ও ভাড়ার তথ্য সহজে উপস্থাপন করা।'}
                  </dd>
                </div>
                <div className="about-def-row">
                  <dt>{lang === 'en' ? 'Developer' : 'ডেভেলপার'}</dt>
                  <dd>
                    <strong>Shahriar Islam Santo</strong>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  // Page 6: Contact Page (/contact) - যোগাযোগ (Email & Facebook Social Contact + Information Correction/Addition)
  const renderContactPage = () => {
    const selectedRouteObj = findRouteById(contactRoute);
    const formattedSelectedRoute = selectedRouteObj
      ? formatRouteForLang(selectedRouteObj, lang)
      : null;
    const routeNameLabel = formattedSelectedRoute
      ? formattedSelectedRoute.title
      : lang === 'en'
      ? 'Dinajpur ↔ BAUST'
      : 'দিনাজপুর ↔ BAUST';

    const requestTypeLabelMap: Record<string, { bn: string; en: string }> = {
      correction: {
        bn: 'তথ্য সংশোধন (সময় বা ভাড়া)',
        en: 'Information Correction (Time or Fare)',
      },
      addition: {
        bn: 'নতুন স্টপেজ বা তথ্য যুক্ত করা',
        en: 'Add New Stop or Information',
      },
      map: {
        bn: 'রুট বা ম্যাপ সংক্রান্ত পরামর্শ',
        en: 'Route or Map Suggestion',
      },
      other: {
        bn: 'অন্যান্য মতামত',
        en: 'Other Feedback',
      },
    };

    const currentReqTypeLabel =
      requestTypeLabelMap[contactRequestType]?.[lang] ||
      requestTypeLabelMap.correction[lang];

    const handleContactFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setContactSubmitted(true);
    };

    const buildMailtoHref = () => {
      const subject = encodeURIComponent(
        `[Baust Bus Tracking System] ${currentReqTypeLabel} - ${routeNameLabel}`
      );
      const bodyLines =
        lang === 'en'
          ? [
              `Request Type: ${currentReqTypeLabel}`,
              `Bus Route: ${routeNameLabel}`,
              `Stop Name: ${contactStopName || 'Not specified'}`,
              `Sender Name: ${contactName || 'Student'}`,
              `Sender Email: ${contactEmail || 'Not specified'}`,
              ``,
              `Details / Correction:`,
              `${contactMessage || ''}`,
            ]
          : [
              `আবেদনের ধরন: ${currentReqTypeLabel}`,
              `বাস রুট: ${routeNameLabel}`,
              `স্টপেজের নাম: ${contactStopName || 'উল্লেখ করা হয়নি'}`,
              `প্রেরকের নাম: ${contactName || 'শিক্ষার্থী'}`,
              `প্রেরকের ইমেইল: ${contactEmail || 'উল্লেখ করা হয়নি'}`,
              ``,
              `বিস্তারিত তথ্য / সংশোধনী:`,
              `${contactMessage || ''}`,
            ];
      return `mailto:santo.ictbaust25@gmail.com?subject=${subject}&body=${encodeURIComponent(
        bodyLines.join('\n')
      )}`;
    };

    return (
      <>
        <section className="page-header-section">
          <div className="container">
            <h1 className="page-title">
              {lang === 'en'
                ? 'Contact & Information Update'
                : 'যোগাযোগ ও তথ্য সংশোধন'}
            </h1>
            <p className="page-subtitle">
              {lang === 'en'
                ? 'Contact us directly via Email or Facebook to add new bus route/stop details or correct existing schedule and fare information.'
                : 'বাসের রুট, স্টপেজ, সময়সূচি বা ভাড়া সংক্রান্ত কোনো নতুন তথ্য যুক্ত করতে অথবা বিদ্যমান তথ্য সংশোধন করতে ইমেইল বা ফেসবুকের মাধ্যমে সরাসরি আমাদের সাথে যোগাযোগ করুন।'}
            </p>
          </div>
        </section>

        <section className="contact-page-section">
          <div className="container">
            <div className="contact-grid">
              {/* Left Column: Social Contact Cards (Email & Facebook) */}
              <div className="contact-card">
                <div>
                  <span className="contact-kicker">
                    {lang === 'en' ? 'Direct Contact Channels' : 'সরাসরি যোগাযোগ মাধ্যম'}
                  </span>
                  <h2 className="contact-card-title">
                    {lang === 'en'
                      ? 'Contact via Email & Facebook'
                      : 'ইমেইল ও ফেসবুকে যোগাযোগ করুন'}
                  </h2>
                  <p className="contact-card-desc">
                    {lang === 'en'
                      ? 'If any bus stop, schedule, or fare information on the website changes or needs to be added, click the social links below to let us know.'
                      : 'ওয়েবসাইটে প্রদর্শিত কোনো বাস স্টপেজ, সময়সূচি কিংবা ভাড়ার তথ্যে পরিবর্তন আসলে বা নতুন কোনো তথ্য যুক্ত করার প্রয়োজন হলে নিচের সোশ্যাল আইকন বা লিংকে ক্লিক করে আমাদের জানাতে পারেন।'}
                  </p>
                </div>

                <div className="social-contact-list">
                  {/* Email Contact Card */}
                  <a
                    href="mailto:santo.ictbaust25@gmail.com?subject=Baust%20Bus%20Tracking%20System%20-%20Information%20Update"
                    className="social-contact-item email-card"
                  >
                    <div className="social-icon-circle email-icon" aria-hidden="true">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </div>
                    <div className="social-contact-info">
                      <span className="social-contact-label">
                        {lang === 'en' ? 'Send Info via Email' : 'ইমেইলে তথ্য পাঠান (Email)'}
                      </span>
                      <strong className="social-contact-value">santo.ictbaust25@gmail.com</strong>
                      <span className="social-contact-action">
                        {lang === 'en'
                          ? 'Click to send an Email →'
                          : 'ইমেইল পাঠাতে ক্লিক করুন →'}
                      </span>
                    </div>
                  </a>

                  {/* Facebook Contact Card */}
                  <a
                    href="https://www.facebook.com/search/top?q=Shahriar%20Islam%20Santo%20BAUST"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-contact-item facebook-card"
                  >
                    <div className="social-icon-circle facebook-icon" aria-hidden="true">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </div>
                    <div className="social-contact-info">
                      <span className="social-contact-label">
                        {lang === 'en'
                          ? 'Message on Facebook'
                          : 'ফেসবুকে মেসেজ দিন (Facebook)'}
                      </span>
                      <strong className="social-contact-value">Shahriar Islam Santo</strong>
                      <span className="social-contact-action">
                        {lang === 'en'
                          ? 'Click to contact on Facebook →'
                          : 'ফেসবুকে যোগাযোগ করতে ক্লিক করুন →'}
                      </span>
                    </div>
                  </a>
                </div>

                <div className="info-notice-box" role="note">
                  <div className="notice-icon" aria-hidden="true">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <p className="notice-text">
                    {lang === 'en' ? (
                      <>
                        <strong>How to send updates:</strong> Mention the route (Dinajpur / Rangpur
                        / Nilphamari), the stop name, and the corrected time or fare via Email or
                        Facebook. Information will be updated promptly after verification.
                      </>
                    ) : (
                      <>
                        <strong>কীভাবে তথ্য পাঠাবেন:</strong> কোন রুটের (দিনাজপুর / রংপুর /
                        নীলফামারী) কোন স্টপেজের সময় বা ভাড়া সংশোধন করতে হবে অথবা নতুন কোন স্টপেজ
                        যুক্ত করতে হবে তা উল্লেখ করে ইমেইল বা ফেসবুকে মেসেজ পাঠান। যাচাই সাপেক্ষে
                        দ্রুত তথ্য আপডেট করা হবে।
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Right Column: Information Addition or Correction Request Form */}
              <div className="contact-card">
                <div>
                  <span className="contact-kicker">
                    {lang === 'en' ? 'Information Update Form' : 'তথ্য হালনাগাদ ফর্ম'}
                  </span>
                  <h2 className="contact-card-title">
                    {lang === 'en'
                      ? 'Request to Add or Correct Information'
                      : 'তথ্য যুক্ত বা সংশোধনের অনুরোধ জানান'}
                  </h2>
                  <p className="contact-card-desc">
                    {lang === 'en'
                      ? 'Fill out the details below and submit, or send directly through your email application.'
                      : 'নিচের ফর্মে প্রয়োজনীয় তথ্য পূরণ করে জমা দিন অথবা সরাসরি ইমেইল অ্যাপের মাধ্যমে আমাদের কাছে পাঠিয়ে দিন।'}
                  </p>
                </div>

                <form onSubmit={handleContactFormSubmit} className="contact-form-grid">
                  <div className="form-group">
                    <label htmlFor="contactNameInput" className="form-label">
                      {lang === 'en' ? 'Your Name' : 'আপনার নাম'}
                    </label>
                    <input
                      id="contactNameInput"
                      type="text"
                      className="form-input"
                      placeholder={lang === 'en' ? 'Enter your name' : 'আপনার নাম লিখুন'}
                      value={contactName}
                      onChange={(e) => {
                        setContactName(e.target.value);
                        setContactSubmitted(false);
                      }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactEmailInput" className="form-label">
                      {lang === 'en' ? 'Your Email (Optional)' : 'আপনার ইমেইল (ঐচ্ছিক)'}
                    </label>
                    <input
                      id="contactEmailInput"
                      type="email"
                      className="form-input"
                      placeholder="example@gmail.com"
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        setContactSubmitted(false);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactRouteSelect" className="form-label">
                      {lang === 'en' ? 'Related Bus Route' : 'সংশ্লিষ্ট বাস রুট'}
                    </label>
                    <select
                      id="contactRouteSelect"
                      className="form-select"
                      value={contactRoute}
                      onChange={(e) => {
                        setContactRoute(e.target.value);
                        setContactSubmitted(false);
                      }}
                    >
                      <option value="dinajpur">
                        {lang === 'en' ? 'Dinajpur ↔ BAUST' : 'দিনাজপুর ↔ BAUST'}
                      </option>
                      <option value="rangpur">
                        {lang === 'en' ? 'Rangpur ↔ BAUST' : 'রংপুর ↔ BAUST'}
                      </option>
                      <option value="nilphamari">
                        {lang === 'en' ? 'Nilphamari ↔ BAUST' : 'নীলফামারী ↔ BAUST'}
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactTypeSelect" className="form-label">
                      {lang === 'en' ? 'Request Type' : 'আবেদনের ধরন'}
                    </label>
                    <select
                      id="contactTypeSelect"
                      className="form-select"
                      value={contactRequestType}
                      onChange={(e) => {
                        setContactRequestType(e.target.value);
                        setContactSubmitted(false);
                      }}
                    >
                      <option value="correction">
                        {requestTypeLabelMap.correction[lang]}
                      </option>
                      <option value="addition">{requestTypeLabelMap.addition[lang]}</option>
                      <option value="map">{requestTypeLabelMap.map[lang]}</option>
                      <option value="other">{requestTypeLabelMap.other[lang]}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactStopInput" className="form-label">
                      {lang === 'en'
                        ? 'Stop Name (If applicable)'
                        : 'স্টপেজের নাম (যদি প্রযোজ্য হয়)'}
                    </label>
                    <input
                      id="contactStopInput"
                      type="text"
                      className="form-input"
                      placeholder={
                        lang === 'en'
                          ? 'e.g., Dash Mile, College Mor, Shapla Chattar, Chourangi Mor...'
                          : 'যেমন: দশ মাইল, কলেজ মোড়, শাপলা চত্বর, চৌরঙ্গী মোড়...'
                      }
                      value={contactStopName}
                      onChange={(e) => {
                        setContactStopName(e.target.value);
                        setContactSubmitted(false);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactMsgInput" className="form-label">
                      {lang === 'en'
                        ? 'Details or Correction Note'
                        : 'বিস্তারিত তথ্য বা সংশোধনী লিখুন'}
                    </label>
                    <textarea
                      id="contactMsgInput"
                      className="form-textarea"
                      placeholder={
                        lang === 'en'
                          ? 'Describe the information you want to add or correct (e.g., updated time, fare, or new stop details)...'
                          : 'কোন তথ্যটি যুক্ত বা সংশোধন করতে চান তা বিস্তারিত লিখুন (যেমন: সঠিক সময়, ভাড়া বা নতুন স্টপেজের বিবরণ)...'
                      }
                      value={contactMessage}
                      onChange={(e) => {
                        setContactMessage(e.target.value);
                        setContactSubmitted(false);
                      }}
                      required
                    ></textarea>
                  </div>

                  <div className="hero-buttons">
                    <button type="submit" className="btn btn-primary">
                      {lang === 'en' ? 'Submit Request' : 'অনুরোধ জমা দিন'}
                    </button>
                    <a href={buildMailtoHref()} className="btn btn-green">
                      {lang === 'en' ? 'Send Directly via Email' : 'সরাসরি ইমেইলে পাঠান'}
                    </a>
                  </div>

                  {contactSubmitted && (
                    <div className="contact-success-banner" role="status">
                      {lang === 'en' ? (
                        <>
                          Thank you! Your information update request is ready. You can{' '}
                          <a href={buildMailtoHref()} className="text-link">
                            send it directly via Email (santo.ictbaust25@gmail.com)
                          </a>{' '}
                          or message us on Facebook.
                        </>
                      ) : (
                        <>
                          ধন্যবাদ! আপনার তথ্য সংযোজন/সংশোধনের অনুরোধটি প্রস্তুত হয়েছে। আপনি চাইলে{' '}
                          <a href={buildMailtoHref()} className="text-link">
                            সরাসরি ইমেইল পাঠান (santo.ictbaust25@gmail.com)
                          </a>{' '}
                          অথবা ফেসবুকে মেসেজ দিয়ে দ্রুত নিশ্চিত করতে পারেন।
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  // Page 7: 404 Error Page
  const render404Page = () => (
    <section className="error-404-section">
      <div className="container">
        <div className="error-404-box">
          <p className="error-code tabular-nums">
            {lang === 'en' ? '404' : '৪০৪'}
          </p>
          <h1 className="error-title">
            {lang === 'en'
              ? 'Sorry, the requested page or bus route was not found'
              : 'দুঃখিত, কাঙ্ক্ষিত পেজ বা বাস রুটটি পাওয়া যায়নি'}
          </h1>
          <p className="error-desc">
            {lang === 'en'
              ? 'The route or webpage you are looking for does not exist in this system. Baust Bus Tracking System includes only the three official routes (Dinajpur, Rangpur, and Nilphamari).'
              : 'আপনি যে রুট বা ওয়েবপেজটি খুঁজছেন তা এই সিস্টেমে বিদ্যমান নেই। Baust Bus Tracking System-এ শুধুমাত্র নির্ধারিত তিনটি রুট (দিনাজপুর, রংপুর ও নীলফামারী) অন্তর্ভুক্ত রয়েছে।'}
          </p>
          <div className="error-actions">
            <a href="/" onClick={(e) => navigate('/', e)} className="btn btn-primary">
              {lang === 'en' ? 'Back to Homepage' : 'হোমপেজে ফিরে যান'}
            </a>
            <a href="/routes" onClick={(e) => navigate('/routes', e)} className="btn btn-green">
              {lang === 'en' ? 'View All Bus Routes' : 'সব বাস রুট দেখুন'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );

  // Route Dispatcher matching Flask routes in app.py
  const renderMainView = () => {
    if (pathname === '/') {
      return renderHomePage();
    }
    if (pathname === '/routes') {
      return renderRoutesPage();
    }
    if (pathname.startsWith('/route/')) {
      const routeId = pathname.replace('/route/', '').split('/')[0];
      return renderRouteDetailPage(routeId);
    }
    if (pathname === '/schedule') {
      return renderSchedulePage();
    }
    if (pathname === '/about') {
      return renderAboutPage();
    }
    if (pathname === '/contact') {
      return renderContactPage();
    }
    return render404Page();
  };

  return (
    <>
      {/* Google Maps Demo Key Quota Exceeded Top Banner (Section 8.2) */}
      {quotaExceeded && (
        <div
          role="alert"
          className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm"
        >
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navigation Bar (Section 4) */}
      <header className="site-header">
        <div className="container navbar-container">
          <a href="/" onClick={(e) => navigate('/', e)} className="brand-logo">
            Baust Bus Tracking System
          </a>

          {/* Backdrop Overlay for Slide-Out Mobile Menu */}
          <div
            className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`}
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
          />

          <nav
            className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}
            id="mainNav"
            aria-label={lang === 'en' ? 'Main Navigation' : 'প্রধান নেভিগেশন'}
          >
            <div className="mobile-nav-header">
              <span>{lang === 'en' ? 'Navigation Menu' : 'নেভিগেশন মেনু'}</span>
            </div>
            <a
              href="/"
              onClick={(e) => navigate('/', e)}
              className={`nav-link ${activeNavPage === 'home' ? 'active' : ''}`}
            >
              {lang === 'en' ? 'Home' : 'হোম'}
            </a>
            <a
              href="/routes"
              onClick={(e) => navigate('/routes', e)}
              className={`nav-link ${activeNavPage === 'routes' ? 'active' : ''}`}
            >
              {lang === 'en' ? 'Bus Routes' : 'বাস রুট'}
            </a>
            <a
              href="/schedule"
              onClick={(e) => navigate('/schedule', e)}
              className={`nav-link ${activeNavPage === 'schedule' ? 'active' : ''}`}
            >
              {lang === 'en' ? 'Schedule' : 'সময়সূচি'}
            </a>
            <a
              href="/about"
              onClick={(e) => navigate('/about', e)}
              className={`nav-link ${activeNavPage === 'about' ? 'active' : ''}`}
            >
              {lang === 'en' ? 'About Us' : 'আমাদের সম্পর্কে'}
            </a>
            <a
              href="/contact"
              onClick={(e) => navigate('/contact', e)}
              className={`nav-link ${activeNavPage === 'contact' ? 'active' : ''}`}
            >
              {lang === 'en' ? 'Contact' : 'যোগাযোগ'}
            </a>
          </nav>

          <div className="header-actions">
            {/* Bilingual Language Toggle Button (বাংলা | EN) */}
            <button
              type="button"
              className="lang-switch-btn"
              onClick={toggleLanguage}
              aria-label={
                lang === 'bn'
                  ? 'Switch language to English'
                  : 'ভাষা বাংলায় পরিবর্তন করুন'
              }
              title={
                lang === 'bn'
                  ? 'Switch to English'
                  : 'বাংলায় দেখুন'
              }
            >
              <span className={`lang-switch-option ${lang === 'bn' ? 'active' : ''}`}>
                বাংলা
              </span>
              <span className={`lang-switch-option ${lang === 'en' ? 'active' : ''}`}>
                EN
              </span>
            </button>

            <button
              type="button"
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
              aria-label={
                mobileMenuOpen
                  ? lang === 'en'
                    ? 'Close menu'
                    : 'মেনু বন্ধ করুন'
                  : lang === 'en'
                  ? 'Open menu'
                  : 'মেনু খুলুন'
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mainNav"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">{renderMainView()}</main>

      {/* Footer (Section 18) */}
      <footer className="site-footer">
        <div className="container footer-grid">
          {/* 18.1 Project Introduction & Social Icons */}
          <div className="footer-col">
            <h3 className="footer-brand">Baust Bus Tracking System</h3>
            <p className="footer-desc">
              {lang === 'en'
                ? 'Easily find BAUST bus routes, schedules, fares, and Google Maps directions. Contact us via Email or Facebook to add or update any information.'
                : 'বাসের রুট, সময়সূচি, ভাড়ার তালিকা ও গুগল ম্যাপের তথ্য সহজেই জানুন। কোনো তথ্য যুক্ত বা সংশোধন করতে ইমেইল ও ফেসবুকে যোগাযোগ করুন।'}
            </p>
            <div className="footer-social-row">
              <a
                href="mailto:santo.ictbaust25@gmail.com?subject=Baust%20Bus%20Tracking%20System%20-%20Information%20Update"
                className="footer-social-btn"
                aria-label={
                  lang === 'en' ? 'Contact via Email' : 'ইমেইলে যোগাযোগ করুন'
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <span>{lang === 'en' ? 'Email' : 'ইমেইল'}</span>
              </a>
              <a
                href="https://www.facebook.com/search/top?q=Shahriar%20Islam%20Santo%20BAUST"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label={
                  lang === 'en' ? 'Contact via Facebook' : 'ফেসবুকে যোগাযোগ করুন'
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                <span>{lang === 'en' ? 'Facebook' : 'ফেসবুক'}</span>
              </a>
            </div>
          </div>

          {/* 18.2 Important Links */}
          <div className="footer-col">
            <h4 className="footer-heading">
              {lang === 'en' ? 'Quick Links' : 'প্রয়োজনীয় লিংক'}
            </h4>
            <ul className="footer-links">
              <li>
                <a href="/" onClick={(e) => navigate('/', e)}>
                  {lang === 'en' ? 'Home' : 'হোম'}
                </a>
              </li>
              <li>
                <a href="/routes" onClick={(e) => navigate('/routes', e)}>
                  {lang === 'en' ? 'Bus Routes' : 'বাস রুট'}
                </a>
              </li>
              <li>
                <a href="/schedule" onClick={(e) => navigate('/schedule', e)}>
                  {lang === 'en' ? 'Schedule' : 'সময়সূচি'}
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => navigate('/about', e)}>
                  {lang === 'en' ? 'About Us' : 'আমাদের সম্পর্কে'}
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => navigate('/contact', e)}>
                  {lang === 'en'
                    ? 'Contact (Add/Correct Info)'
                    : 'যোগাযোগ (তথ্য সংযোজন/সংশোধন)'}
                </a>
              </li>
            </ul>
          </div>

          {/* 18.3 Our Routes */}
          <div className="footer-col">
            <h4 className="footer-heading">
              {lang === 'en' ? 'Our Routes' : 'আমাদের রুট'}
            </h4>
            <ul className="footer-links">
              <li>
                <a href="/route/dinajpur" onClick={(e) => navigate('/route/dinajpur', e)}>
                  {lang === 'en' ? 'Dinajpur ↔ BAUST' : 'দিনাজপুর ↔ BAUST'}
                </a>
              </li>
              <li>
                <a href="/route/rangpur" onClick={(e) => navigate('/route/rangpur', e)}>
                  {lang === 'en' ? 'Rangpur ↔ BAUST' : 'রংপুর ↔ BAUST'}
                </a>
              </li>
              <li>
                <a href="/route/nilphamari" onClick={(e) => navigate('/route/nilphamari', e)}>
                  {lang === 'en' ? 'Nilphamari ↔ BAUST' : 'নীলফামারী ↔ BAUST'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 18.4 & 18.5 Developer & Copyright */}
        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <p className="copyright-text">© 2026 Baust Bus Tracking System. All Rights Reserved.</p>
            <p className="developer-text">
              Developed by <strong>Shahriar Islam Santo</strong>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
