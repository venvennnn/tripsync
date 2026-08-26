import { useEffect, useRef, useState } from "react";

let mapsPromise = null;
function loadMaps(key) {
  if (!key) return Promise.reject(new Error("missing key"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    s.async = true;
    s.onload = () => resolve(window.google.maps);
    s.onerror = () => reject(new Error("Maps script failed"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

function FallbackMap({ pinned }) {
  const lats = pinned.map((e) => e.venue.lat);
  const lngs = pinned.map((e) => e.venue.lng);
  const north = Math.max(...lats);
  const south = Math.min(...lats);
  const east = Math.max(...lngs);
  const west = Math.min(...lngs);
  const padLat = (north - south || 0.04) * 0.2 + 0.01;
  const padLng = (east - west || 0.04) * 0.2 + 0.01;
  return (
    <div className="relative h-80 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200">
      {pinned.map((e, i) => {
        const x = ((e.venue.lng - (west - padLng)) / (east - west + padLng * 2 || 1)) * 100;
        const y = (((north + padLat) - e.venue.lat) / (north - south + padLat * 2 || 1)) * 100;
        return (
          <div
            key={e.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={e.venue.name}
          >
            <div className="w-6 h-6 rounded-full bg-gold text-white text-[10px] font-bold grid place-items-center border-2 border-white shadow">
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function flattenPins(events, wishlist) {
  const fromEvents = [];
  for (const e of events || []) {
    if (e.stops?.length) {
      e.stops.forEach((s, i) => {
        if (s.lat == null || s.lng == null) return;
        fromEvents.push({
          id: `${e.id}-${i}`,
          title: s.name || e.title,
          venue: { name: s.name || e.title, lat: s.lat, lng: s.lng, maps_url: s.maps_url },
        });
      });
    } else if (e.venue?.lat != null && e.venue?.lng != null) {
      fromEvents.push(e);
    }
  }
  if (fromEvents.length) return fromEvents;
  return (wishlist || [])
    .filter((w) => w.lat != null && w.lng != null)
    .map((w) => ({
      id: w.id,
      title: w.title,
      venue: { name: w.query || w.title, lat: w.lat, lng: w.lng, maps_url: w.maps_url },
    }));
}

export function GoogleMapView({ events, wishlist, mapsKey }) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  const pinned = flattenPins(events, wishlist);
  const linked = (events || []).filter((e) => e.venue?.maps_url);
  const [useFallback, setUseFallback] = useState(!mapsKey);

  useEffect(() => {
    setUseFallback(!mapsKey);
    if (!mapsKey || !pinned.length || !ref.current) return undefined;
    loadMaps(mapsKey)
      .then((gmaps) => {
        const map = new gmaps.Map(ref.current, {
          center: { lat: pinned[0].venue.lat, lng: pinned[0].venue.lng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const path = [];
        pinned.forEach((e, i) => {
          const pos = { lat: e.venue.lat, lng: e.venue.lng };
          path.push(pos);
          new gmaps.Marker({
            map,
            position: pos,
            label: { text: String(i + 1), color: "white" },
            title: e.venue.name || e.title,
          });
        });
        new gmaps.Polyline({
          map,
          path,
          strokeColor: "#0f766e",
          strokeWeight: 3,
        });
        const bounds = new gmaps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        if (path.length > 1) map.fitBounds(bounds, 48);
      })
      .catch((err) => {
        setError(err.message);
        setUseFallback(true);
      });
    return undefined;
  }, [mapsKey, pinned.map((e) => `${e.id}:${e.venue?.lat}`).join(",")]);

  if (!pinned.length) {
    return (
      <div className="text-sm text-mist space-y-2">
        <p>
          Stops don’t have map pins yet. Paste a Google Maps share link on each wish (short{" "}
          <span className="font-mono text-xs">maps.app.goo.gl</span> links are fine), then click Re-Optimize Trip.
        </p>
        {linked.length > 0 && (
          <ol className="space-y-1">
            {linked.map((e, i) => (
              <li key={e.id}>
                {i + 1}. {e.venue?.name || e.title}{" "}
                <a className="text-gold underline" href={e.venue.maps_url} target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && useFallback && (
        <p className="text-xs text-mist mb-2">Live Google map unavailable — showing pin layout. {error}</p>
      )}
      {mapsKey ? <div ref={ref} className={`h-80 w-full rounded-2xl border border-stone-200 ${useFallback ? "hidden" : ""}`} /> : null}
      {(!mapsKey || useFallback) && <FallbackMap pinned={pinned} />}
    </div>
  );
}
