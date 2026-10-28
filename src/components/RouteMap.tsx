// Source: Google Maps Platform Code Assist
import React, { useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { StopDetails } from '../oop/busSystem';
import {
  formatStopForLang,
  Language,
  STOP_NAME_EN,
  toBengaliDigits,
} from '../i18n/translations';

export interface RouteMapProps {
  routeId: string;
  routeTitle: string;
  directionKey: 'going' | 'returning';
  directionTitle: string;
  stops: StopDetails[];
  selectedStopName?: string | null;
  onSelectStop?: (stopName: string | null) => void;
  lang?: Language;
}

interface RouteMetrics {
  distanceKm: string;
  durationMins: string;
}

interface MapPolyline {
  setMap: (map: unknown) => void;
  setOptions: (options: Record<string, unknown>) => void;
}

interface ResolvedStopPlace {
  stop: StopDetails;
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number } | any;
}

const ROUTE_ADDRESS_ENDPOINTS: Record<
  string,
  { cityEndpoint: string; baustEndpoint: string; regionContext: string }
> = {
  dinajpur: {
    cityEndpoint: 'Suihari, Dinajpur, Bangladesh',
    baustEndpoint:
      'Bangladesh Army University of Science and Technology (BAUST), Saidpur, Bangladesh',
    regionContext: 'Dinajpur, Bangladesh',
  },
  rangpur: {
    cityEndpoint: 'Shapla Chattar, Rangpur, Bangladesh',
    baustEndpoint:
      'Bangladesh Army University of Science and Technology (BAUST), Saidpur, Bangladesh',
    regionContext: 'Rangpur, Bangladesh',
  },
  nilphamari: {
    cityEndpoint: 'Chourangi Mor, Nilphamari, Bangladesh',
    baustEndpoint:
      'Bangladesh Army University of Science and Technology (BAUST), Saidpur, Bangladesh',
    regionContext: 'Nilphamari, Bangladesh',
  },
};

function checkAndDispatchQuotaError(err: unknown) {
  const msg = String((err as any)?.message || err || '');
  const status = String((err as any)?.status || (err as any)?.code || '');
  if (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('429') ||
    status === 'OVER_QUERY_LIMIT' ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === '429'
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

function RoutePolylineAndStopSearch({
  routeId,
  directionKey,
  stops,
  selectedStopName,
  resetBoundsTrigger,
  lang,
  onSelectStop,
  onMetricsChange,
  onStatusChange,
}: {
  routeId: string;
  directionKey: 'going' | 'returning';
  stops: StopDetails[];
  selectedStopName?: string | null;
  resetBoundsTrigger: number;
  lang: Language;
  onSelectStop?: (stopName: string | null) => void;
  onMetricsChange: (metrics: RouteMetrics | null) => void;
  onStatusChange: (loading: boolean, error: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');

  const polylinesRef = useRef<MapPolyline[]>([]);
  const routeViewportRef = useRef<any>(null);
  const [endpointLocations, setEndpointLocations] = useState<{
    start: any;
    end: any;
  } | null>(null);
  const [resolvedStop, setResolvedStop] = useState<ResolvedStopPlace | null>(null);

  // Re-fit route bounds when user clicks "সম্পূর্ণ রুট দেখুন" / "Full Route View"
  useEffect(() => {
    if (resetBoundsTrigger > 0 && map && routeViewportRef.current) {
      map.fitBounds(routeViewportRef.current);
      setResolvedStop(null);
    }
  }, [resetBoundsTrigger, map]);

  // Compute and draw route via modern Routes API (Route.computeRoutes)
  useEffect(() => {
    if (!map || !routesLib) return;

    // Clean up previous polylines and markers
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    setEndpointLocations(null);
    routeViewportRef.current = null;
    onMetricsChange(null);
    onStatusChange(true, null);

    const endpoints =
      ROUTE_ADDRESS_ENDPOINTS[routeId] || ROUTE_ADDRESS_ENDPOINTS.dinajpur;
    const origin =
      directionKey === 'going' ? endpoints.cityEndpoint : endpoints.baustEndpoint;
    const destination =
      directionKey === 'going' ? endpoints.baustEndpoint : endpoints.cityEndpoint;

    const request = {
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    let cancelled = false;

    (routesLib.Route as any)
      .computeRoutes(request)
      .then((res: { routes?: any[] }) => {
        if (cancelled) return;
        onStatusChange(false, null);

        const primaryRoute = res?.routes?.[0];
        if (!primaryRoute) {
          onStatusChange(
            false,
            lang === 'en'
              ? 'Route map path could not be found.'
              : 'এই রুটের ম্যাপ পাথ পাওয়া যায়নি।'
          );
          return;
        }

        // Render route polylines using native createPolylines()
        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines: MapPolyline[] = primaryRoute.createPolylines();
          newPolylines.forEach((polyline) => {
            polyline.setOptions({
              strokeColor: directionKey === 'going' ? '#1d4ed8' : '#059669',
              strokeWeight: 6,
              strokeOpacity: 0.9,
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }

        // Extract start and end coordinates from route path for AdvancedMarker rendering
        const routePath = Array.isArray(primaryRoute.path) ? primaryRoute.path : [];
        if (routePath.length >= 2) {
          setEndpointLocations({
            start: routePath[0],
            end: routePath[routePath.length - 1],
          });
        }

        if (primaryRoute.viewport) {
          routeViewportRef.current = primaryRoute.viewport;
          map.fitBounds(primaryRoute.viewport);
        }

        const distanceMeters = primaryRoute.distanceMeters ?? 0;
        const durationMillis = primaryRoute.durationMillis ?? 0;
        onMetricsChange({
          distanceKm: (distanceMeters / 1000).toFixed(1),
          durationMins: Math.round(durationMillis / 60000).toString(),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        checkAndDispatchQuotaError(err);
        onStatusChange(
          false,
          lang === 'en'
            ? 'Failed to load route map. Please try again shortly.'
            : 'রুট ম্যাপ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
        );
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, routeId, directionKey, lang]);

  // Locate selected stop dynamically using Places API (New) Place.searchByText
  useEffect(() => {
    if (!map || !placesLib || !selectedStopName) {
      setResolvedStop(null);
      return;
    }

    const matchedStop = stops.find((s) => s.name === selectedStopName);
    if (!matchedStop) {
      setResolvedStop(null);
      return;
    }

    const endpoints =
      ROUTE_ADDRESS_ENDPOINTS[routeId] || ROUTE_ADDRESS_ENDPOINTS.dinajpur;
    const englishStopQuery = STOP_NAME_EN[selectedStopName] || selectedStopName;
    const searchQuery =
      selectedStopName === 'BAUST'
        ? endpoints.baustEndpoint
        : `${englishStopQuery}, ${endpoints.regionContext}`;

    let cancelled = false;
    const PlaceClass = (placesLib as any).Place;
    if (!PlaceClass || typeof PlaceClass.searchByText !== 'function') {
      return;
    }

    PlaceClass.searchByText({
      textQuery: searchQuery,
      fields: ['displayName', 'location', 'formattedAddress'],
    })
      .then((res: { places?: any[] }) => {
        if (cancelled) return;
        const firstPlace = res?.places?.[0];
        if (firstPlace?.location) {
          setResolvedStop({
            stop: matchedStop,
            displayName: firstPlace.displayName || matchedStop.name,
            formattedAddress: firstPlace.formattedAddress || searchQuery,
            location: firstPlace.location,
          });
          map.panTo(firstPlace.location);
          map.setZoom(14);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          checkAndDispatchQuotaError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [map, placesLib, routeId, selectedStopName, stops]);

  const startTitle = stops[0]
    ? formatStopForLang(stops[0], lang).name
    : lang === 'en'
    ? 'Start'
    : 'যাত্রা শুরু';
  const endTitle = stops[stops.length - 1]
    ? formatStopForLang(stops[stops.length - 1], lang).name
    : lang === 'en'
    ? 'Destination'
    : 'গন্তব্য';

  const resolvedFormatted = resolvedStop
    ? formatStopForLang(resolvedStop.stop, lang)
    : null;

  return (
    <>
      {endpointLocations && (
        <>
          <AdvancedMarker position={endpointLocations.start} title={startTitle} />
          <AdvancedMarker position={endpointLocations.end} title={endTitle} />
        </>
      )}
      {resolvedStop && resolvedFormatted && (
        <>
          <AdvancedMarker
            position={resolvedStop.location}
            title={resolvedFormatted.name}
          />
          <InfoWindow
            position={resolvedStop.location}
            onCloseClick={() => {
              setResolvedStop(null);
              if (onSelectStop) onSelectStop(null);
            }}
          >
            <div className="map-infowindow-content">
              <h4 className="map-infowindow-title">
                {resolvedFormatted.serial}. {resolvedFormatted.name}
              </h4>
              <p className="map-infowindow-meta">
                {lang === 'en' ? 'Time:' : 'সময়:'}{' '}
                <strong>{resolvedFormatted.time}</strong> ·{' '}
                {lang === 'en' ? 'Fare:' : 'ভাড়া:'}{' '}
                <strong>{resolvedFormatted.fare}</strong>
              </p>
              <p className="map-infowindow-address">{resolvedStop.formattedAddress}</p>
            </div>
          </InfoWindow>
        </>
      )}
    </>
  );
}

export default function RouteMap({
  routeId,
  routeTitle,
  directionKey,
  directionTitle,
  stops,
  selectedStopName,
  onSelectStop,
  lang = 'bn',
}: RouteMapProps) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [resetBoundsTrigger, setResetBoundsTrigger] = useState<number>(0);

  return (
    <div className="route-map-card">
      <div className="route-map-header">
        <div>
          <span className="route-map-kicker">
            {lang === 'en'
              ? 'Bus Route & Stops View on Google Maps'
              : 'গুগল ম্যাপে বাস রুট ও স্টপেজ ভিউ'}
          </span>
          <h3 className="route-map-title">
            {routeTitle} — {directionTitle}
          </h3>
        </div>
        <div className="route-map-badges">
          {loading && (
            <span className="map-metric-text">
              {lang === 'en' ? 'Loading route map...' : 'রুট ম্যাপ লোড হচ্ছে...'}
            </span>
          )}
          {!loading && metrics && (
            <span className="map-metric-text tabular-nums">
              {lang === 'en' ? (
                <>
                  Est. Distance: <strong>{metrics.distanceKm} km</strong> · Road Time:{' '}
                  <strong>~{metrics.durationMins} mins</strong>
                </>
              ) : (
                <>
                  আনুমানিক দূরত্ব: <strong>{toBengaliDigits(metrics.distanceKm)} কি.মি.</strong> ·
                  সড়কপথে সময়: <strong>প্রায় {toBengaliDigits(metrics.durationMins)} মিনিট</strong>
                </>
              )}
            </span>
          )}
          <button
            type="button"
            className="stop-chip-btn"
            onClick={() => {
              if (onSelectStop) onSelectStop(null);
              setResetBoundsTrigger((prev) => prev + 1);
            }}
          >
            {lang === 'en' ? 'Full Route View' : 'সম্পূর্ণ রুট দেখুন'}
          </button>
          <button
            type="button"
            className={`stop-chip-btn ${mapTypeId === 'hybrid' ? 'active' : ''}`}
            onClick={() =>
              setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
            }
          >
            {mapTypeId === 'roadmap'
              ? lang === 'en'
                ? 'Satellite View'
                : 'স্যাটেলাইট ভিউ'
              : lang === 'en'
              ? 'Standard Map'
              : 'সাধারণ ম্যাপ'}
          </button>
        </div>
      </div>

      {/* Interactive Stop Quick-Locator Buttons */}
      <div className="route-map-stop-strip">
        <span className="stop-strip-label">
          {lang === 'en' ? 'Locate Stop on Map:' : 'ম্যাপে স্টপেজ দেখুন:'}
        </span>
        <div className="stop-strip-buttons">
          {stops.map((stop) => {
            const isSelected = selectedStopName === stop.name;
            const formattedStop = formatStopForLang(stop, lang);
            return (
              <button
                key={`${stop.serial}-${stop.name}`}
                type="button"
                onClick={() =>
                  onSelectStop && onSelectStop(isSelected ? null : stop.name)
                }
                className={`stop-chip-btn ${isSelected ? 'active' : ''}`}
              >
                {formattedStop.serial}. {formattedStop.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="warning-notice-banner" role="alert">
          {error}
        </div>
      )}

      <div className="route-map-canvas">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              mapId="DEMO_MAP_ID"
              defaultZoom={2}
              defaultCenter={{ lat: 0, lng: 0 }}
              mapTypeId={mapTypeId}
              gestureHandling="cooperative"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <RoutePolylineAndStopSearch
                routeId={routeId}
                directionKey={directionKey}
                stops={stops}
                selectedStopName={selectedStopName}
                resetBoundsTrigger={resetBoundsTrigger}
                lang={lang}
                onSelectStop={onSelectStop}
                onMetricsChange={setMetrics}
                onStatusChange={(l, err) => {
                  setLoading(l);
                  setError(err);
                }}
              />
            </Map>
          </APIProvider>
        ) : (
          <div className="map-fallback-box">
            <p>
              {lang === 'en'
                ? 'Activating API Key to display Google Maps...'
                : 'গুগল ম্যাপ প্রদর্শনের জন্য API Key সক্রিয় করা হচ্ছে...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

