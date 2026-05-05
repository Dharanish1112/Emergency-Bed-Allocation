import { useEffect, useRef, useState, useCallback } from 'react';
import { Navigation, MapPin, AlertTriangle } from 'lucide-react';
import { CITY_COORDS } from '../data/dummy';

/**
 * SimpleMap — Leaflet + OSRM real road navigation
 * Props:
 *   hospitals  – array of hospital objects (markers)
 *   routeTo    – hospital object to navigate to (null = no route)
 *   driverCity – driver's city name (e.g. 'Vellore') — used as origin for route
 *   lang       – 'en' | 'ta'
 */
const SimpleMap = ({ hospitals = [], routeTo = null, driverCity = null, lang = 'en' }) => {
  const mapRef       = useRef(null);
  const mapInst      = useRef(null);
  const routeGroup   = useRef(null);
  const [driverLoc,  setDriverLoc]  = useState(null);
  const [navSteps,   setNavSteps]   = useState([]);
  const [routeInfo,  setRouteInfo]  = useState(null);
  const [navLoading, setNavLoading] = useState(false);
  const [navError,   setNavError]   = useState('');
  const [leafletOk,  setLeafletOk]  = useState(!!window.L);

  const ta = lang === 'ta';

  // ── Load Leaflet CSS + JS once ─────────────────────────────
  useEffect(() => {
    if (window.L) { setLeafletOk(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletOk(true);
    document.head.appendChild(script);
  }, []);

  // ── Set driver location from city name ─────────────────────
  useEffect(() => {
    if (driverCity && CITY_COORDS[driverCity]) {
      setDriverLoc(CITY_COORDS[driverCity]);
    } else {
      setDriverLoc(null);
    }
  }, [driverCity]);

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!leafletOk || !mapRef.current || mapInst.current) return;
    const L = window.L;

    // Use driver city coords as center, fall back to first hospital or Trichy
    const cityCoords = driverCity && CITY_COORDS[driverCity] ? CITY_COORDS[driverCity] : null;
    const center = cityCoords
      ? [cityCoords.lat, cityCoords.lng]
      : hospitals[0]?.coordinates
        ? [hospitals[0].coordinates.lat, hospitals[0].coordinates.lng]
        : [10.7905, 78.7047];

    const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapInst.current = map;

    // Hospital markers
    hospitals.forEach(h => {
      if (!h.coordinates) return;
      const color = h.status === 'available' ? '#22c55e'
                  : h.status === 'critical'  ? '#f59e0b' : '#ef4444';
      L.circleMarker([h.coordinates.lat, h.coordinates.lng], {
        radius: 9, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9,
      }).addTo(map).bindPopup(`
        <div style="font-family:sans-serif;padding:5px;min-width:150px">
          <p style="margin:0 0 3px;font-weight:700;color:#1a3a6b;font-size:12px">${h.speciality}</p>
          <p style="margin:0 0 2px;font-size:11px;color:#666">${h.address}</p>
          <p style="margin:0;font-size:11px">ETA <b>${h.eta}</b> · ICU <b>${h.beds.icu}</b> · EM <b>${h.beds.emergency}</b></p>
        </div>`);
    });

    // Driver location marker (from city coords, not GPS)
    const markerCoords = cityCoords || driverLoc;
    if (markerCoords) {
      L.circleMarker([markerCoords.lat, markerCoords.lng], {
        radius: 12, fillColor: '#3b82f6', color: '#fff', weight: 3, fillOpacity: 1,
      }).addTo(map).bindPopup(`
        <b style="color:#3b82f6">${ta ? 'உங்கள் இடம்' : 'Your Location'}</b><br>
        <span style="font-size:11px">${driverCity || ''}</span>
      `);
    }
  }, [leafletOk, driverLoc]);

  // ── Fetch OSRM route and draw ──────────────────────────────
  const fetchAndDrawRoute = useCallback(async (from, to) => {
    if (!mapInst.current || !window.L) return;
    const L = window.L;
    const map = mapInst.current;

    if (routeGroup.current) { map.removeLayer(routeGroup.current); routeGroup.current = null; }
    setNavSteps([]);
    setRouteInfo(null);
    setNavError('');
    setNavLoading(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
      const res  = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route');

      const route  = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distKm = (route.distance / 1000).toFixed(1);
      const durMin = Math.ceil(route.duration / 60);
      const steps  = route.legs[0]?.steps || [];

      setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} min` });

      const parsed = steps
        .filter((s, i) => s.maneuver?.type !== 'depart' || i === 0)
        .slice(0, 12)
        .map(s => ({
          instruction: formatManeuver(s.maneuver, s.name),
          distance:    s.distance > 0 ? `${s.distance.toFixed(0)} m` : '',
          type:        s.maneuver?.type || 'straight',
        }));
      setNavSteps(parsed);

      // Draw route
      const line = L.polyline(coords, {
        color: '#1a3a6b', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round',
      });

      // Destination pin
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,.4)"></div>`,
        iconSize: [28, 28], iconAnchor: [14, 28],
      });
      const destMarker = L.marker([to.lat, to.lng], { icon: destIcon })
        .bindPopup(`
          <div style="font-family:sans-serif;padding:6px">
            <p style="margin:0 0 3px;font-weight:700;color:#dc2626;font-size:13px">
              ${ta ? 'இலக்கு மருத்துவமனை' : 'Destination'}
            </p>
            <p style="margin:0 0 2px;font-size:11px">${routeTo?.address || ''}</p>
            <p style="margin:0;font-size:11px;color:#1a3a6b;font-weight:600">
              ${distKm} km · ${durMin} ${ta ? 'நிமிடம்' : 'min'}
            </p>
          </div>
        `).openPopup();

      // Origin pin
      const originIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const originMarker = L.marker([from.lat, from.lng], { icon: originIcon });

      // Midpoint label
      const mid = [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
      const midIcon = L.divIcon({
        className: '',
        html: `<div style="background:#1a3a6b;color:#fff;border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.3)">${ta ? 'வழி' : 'Route'} → ${durMin} ${ta ? 'நிமி' : 'min'}</div>`,
        iconAnchor: [30, 10],
      });
      const midMarker = L.marker(mid, { icon: midIcon });

      routeGroup.current = L.layerGroup([line, destMarker, originMarker, midMarker]).addTo(map);
      map.fitBounds(line.getBounds().pad(0.15));

    } catch (err) {
      console.error('Route error:', err);
      setNavError(ta ? 'வழி கிடைக்கவில்லை' : 'Could not fetch route');
      // Fallback: straight line
      if (mapInst.current && window.L) {
        const L = window.L;
        const line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
          color: '#1a3a6b', weight: 4, opacity: 0.7, dashArray: '10,8',
        }).addTo(mapInst.current);
        const destIcon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,.4)"></div>`,
          iconSize: [28, 28], iconAnchor: [14, 28],
        });
        const m = L.marker([to.lat, to.lng], { icon: destIcon }).addTo(mapInst.current);
        routeGroup.current = L.layerGroup([line, m]).addTo(mapInst.current);
        mapInst.current.fitBounds(line.getBounds().pad(0.2));
      }
    } finally {
      setNavLoading(false);
    }
  }, [routeTo, ta]);

  // ── Trigger route when routeTo or driverLoc changes ────────
  useEffect(() => {
    if (!routeTo?.coordinates) {
      if (routeGroup.current && mapInst.current) {
        mapInst.current.removeLayer(routeGroup.current);
        routeGroup.current = null;
      }
      setNavSteps([]);
      setRouteInfo(null);
      setNavError('');
      return;
    }
    if (driverLoc) {
      fetchAndDrawRoute(driverLoc, routeTo.coordinates);
    } else {
      // No driver city — just show destination
      if (mapInst.current && window.L) {
        const L = window.L;
        if (routeGroup.current) mapInst.current.removeLayer(routeGroup.current);
        const destIcon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,.4)"></div>`,
          iconSize: [28, 28], iconAnchor: [14, 28],
        });
        const m = L.marker([routeTo.coordinates.lat, routeTo.coordinates.lng], { icon: destIcon })
          .addTo(mapInst.current).bindPopup(`<b>${ta ? 'இலக்கு' : 'Destination'}</b><br>${routeTo.address}`).openPopup();
        routeGroup.current = m;
        mapInst.current.setView([routeTo.coordinates.lat, routeTo.coordinates.lng], 14);
      }
    }
  }, [routeTo, driverLoc, fetchAndDrawRoute]);

  const centerOnDriver = () => {
    if (driverLoc && mapInst.current) mapInst.current.setView([driverLoc.lat, driverLoc.lng], 14);
  };

  const openGoogleMaps = () => {
    if (!routeTo?.coordinates) return;
    const { lat, lng } = routeTo.coordinates;
    const origin = driverLoc ? `${driverLoc.lat},${driverLoc.lng}` : '';
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
        <div ref={mapRef} style={{ height: '380px' }} className="w-full" />

        {/* My Location button */}
        <button
          onClick={centerOnDriver}
          className="absolute top-3 right-3 z-[999] bg-white shadow-md rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1a3a6b] hover:bg-blue-50 border border-gray-200 flex items-center gap-1.5 transition-colors"
        >
          <MapPin size={13} />
          {ta ? 'என் இடம்' : 'My Location'}
        </button>

        {/* Loading overlay */}
        {navLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[998]">
            <div className="bg-white rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 border border-gray-200">
              <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" />
              <span className="text-sm font-semibold text-[#1a3a6b]">
                {ta ? 'வழி கணக்கிடுகிறது...' : 'Calculating route...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Route Summary Bar ─────────────────────────────── */}
      {routeTo && (
        <div className="bg-[#1a3a6b] text-white rounded-xl overflow-hidden">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Navigation size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase tracking-wide">
                  {ta ? 'வழிசெலுத்தல்' : 'Navigation'}
                </p>
                <p className="font-bold text-sm">{routeTo.address}</p>
                <p className="text-xs text-blue-200">{routeTo.speciality}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {routeInfo && (
                <>
                  <div className="text-center">
                    <p className="text-blue-300 text-xs">{ta ? 'தூரம்' : 'Distance'}</p>
                    <p className="font-bold text-white">{routeInfo.distance}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <p className="text-blue-300 text-xs">ETA</p>
                    <p className="font-bold text-green-400">{routeInfo.duration}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                </>
              )}
              <button
                onClick={openGoogleMaps}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1a3a6b] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Google Maps
              </button>
            </div>
          </div>

          {/* Error */}
          {navError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-200 text-xs">
              <AlertTriangle size={13} />
              {navError} — {ta ? 'நேர்கோடு காட்டப்படுகிறது' : 'Showing straight line'}
            </div>
          )}

          {/* Turn-by-turn steps */}
          {navSteps.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs text-blue-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Navigation size={11} />
                {ta ? 'திருப்பம் திருப்பம் வழிகாட்டி' : 'Turn-by-Turn Directions'}
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {navSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-white/10 last:border-0">
                    <div className="w-5 h-5 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TurnIcon type={step.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white leading-snug">{step.instruction}</p>
                    </div>
                    {step.distance && (
                      <span className="text-xs text-blue-300 flex-shrink-0 font-medium">{step.distance}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Turn icon ─────────────────────────────────────────────────
function TurnIcon({ type }) {
  const s = { width: 10, height: 10, stroke: 'white', fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'turn' || type === 'new name') {
    return <svg viewBox="0 0 24 24" style={s}><path d="M9 18l6-6-6-6"/></svg>;
  }
  if (type === 'arrive') {
    return <svg viewBox="0 0 24 24" style={s}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white" stroke="none"/></svg>;
  }
  if (type === 'roundabout' || type === 'rotary') {
    return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="4"/></svg>;
  }
  return <svg viewBox="0 0 24 24" style={s}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
}

// ── Format maneuver ───────────────────────────────────────────
function formatManeuver(maneuver, street) {
  if (!maneuver) return street || 'Continue';
  const st = street ? ` onto ${street}` : '';
  const mod = maneuver.modifier || '';
  switch (maneuver.type) {
    case 'depart':    return `Start${st}`;
    case 'arrive':    return 'Arrive at destination';
    case 'turn':      return `Turn ${mod}${st}`;
    case 'new name':  return `Continue${st}`;
    case 'merge':     return `Merge ${mod}${st}`;
    case 'fork':      return `Keep ${mod}${st}`;
    case 'roundabout':return `Enter roundabout${st}`;
    case 'exit roundabout': return `Exit roundabout${st}`;
    default:          return `Continue${st}`;
  }
}

export default SimpleMap;
