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

export function GoogleMapView({ events, mapsKey }) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  const pinned = (events || []).filter((e) => e.venue?.lat != null && e.venue?.lng != null);

  useEffect(() => {
    if (!mapsKey || !pinned.length || !ref.current) return undefined;
    let map;
    loadMaps(mapsKey)
      .then((gmaps) => {
        map = new gmaps.Map(ref.current, {
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
      .catch((err) => setError(err.message));
    return undefined;
  }, [mapsKey, pinned.map((e) => e.id).join(",")]);

  if (!pinned.length) {
    return <p className="text-sm text-mist">No mapped venues yet. Add a Maps link or re-optimize with a Google key.</p>;
  }

  if (!mapsKey) {
    return (
      <p className="text-sm text-mist">
        Google Maps is not configured. Set GOOGLE_MAPS_API_KEY to show the live map and driving distances.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="text-ember text-sm mb-2">{error}</p>}
      <div ref={ref} className="h-80 w-full rounded-2xl border border-stone-200" />
    </div>
  );
}
