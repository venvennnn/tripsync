import { useState } from "react";
import { formatDay, formatRange, toDatetimeLocal, fromDatetimeLocal } from "../lib/format.js";
import { Avatar } from "./Avatar.jsx";
import { GoogleMapView } from "./GoogleMapView.jsx";
import { BLOCKS } from "../../shared/engine.js";

export function EventCard({ event, room, onLock, onDelete, onSave, onRegenerate }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({
    start: toDatetimeLocal(event.start),
    end: toDatetimeLocal(event.end),
    venueName: event.venue?.name || event.title,
  });
  const people = (event.participants || [])
    .map((id) => room.participants.find((p) => p.id === id))
    .filter(Boolean);
  const conflict = (room.conflicts || []).some((c) => c.event_id === event.id);
  const travel = event.travel_from_previous?.text || (event.travel_from_previous_min != null ? `${event.travel_from_previous_min} min from previous stop` : null);

  return (
    <article
      className={`rounded-2xl p-3 border ${
        event.locked ? "border-gold/50 bg-teal-50" : "border-stone-200 bg-white"
      } ${conflict ? "ring-2 ring-ember" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-mist">
            {event.block} · {formatRange(event.start, event.end, room.timezone)}
            {event.locked ? " · locked" : ""}
          </div>
          <h4 className="font-display text-xl leading-tight">{event.title}</h4>
          {event.venue?.name && event.venue.name !== event.title && (
            <div className="text-sm text-ink/80">{event.venue.name}</div>
          )}
          {event.venue?.address && <div className="text-xs text-mist">{event.venue.address}</div>}
          {event.venue?.maps_url && (
            <a className="text-xs text-gold underline" href={event.venue.maps_url} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          )}
        </div>
        {event.group_match && (
          <span className="text-[10px] font-bold bg-gold text-white rounded-full px-2 py-1">GROUP MATCH</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {people.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-stone-100 rounded-full pr-2">
            <Avatar avatar={p.avatar} name={p.name} size={20} />
            {p.name}
          </span>
        ))}
      </div>
      {travel && <p className="text-xs text-mist mt-2">{travel}</p>}
      {event.reason && (
        <p className="text-sm mt-2 text-ink/80">
          <span className="text-gold">Why here?</span> {event.reason}
        </p>
      )}
      {conflict && (
        <p className="text-ember text-sm mt-2">This slot conflicts with someone’s arrival or departure.</p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        <button type="button" className="text-xs rounded-full px-2 py-1 bg-stone-100" onClick={() => onLock(event)}>
          {event.locked ? "Unlock" : "Lock"}
        </button>
        <button type="button" className="text-xs rounded-full px-2 py-1 bg-stone-100" onClick={() => setEdit((v) => !v)}>
          Move
        </button>
        <button type="button" className="text-xs rounded-full px-2 py-1 bg-stone-100" onClick={() => onRegenerate(event)}>
          Regenerate
        </button>
        <button type="button" className="text-xs rounded-full px-2 py-1 bg-ember/15" onClick={() => onDelete(event)}>
          Delete
        </button>
      </div>
      {edit && (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(event, {
              start: fromDatetimeLocal(draft.start),
              end: fromDatetimeLocal(draft.end),
              venue: { ...event.venue, name: draft.venueName },
            });
            setEdit(false);
          }}
        >
          <input
            type="datetime-local"
            className="rounded-xl bg-white border border-stone-300 px-2 py-1 text-sm"
            value={draft.start}
            onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
          />
          <input
            type="datetime-local"
            className="rounded-xl bg-white border border-stone-300 px-2 py-1 text-sm"
            value={draft.end}
            onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
          />
          <input
            className="rounded-xl bg-white border border-stone-300 px-2 py-1 text-sm"
            value={draft.venueName}
            onChange={(e) => setDraft((d) => ({ ...d, venueName: e.target.value }))}
            placeholder="Replace venue"
          />
          <button className="text-xs bg-gold text-white rounded-full py-1 font-bold">Save move</button>
        </form>
      )}
    </article>
  );
}

export function ItineraryPanel({ room, view, mapsKey, onLock, onDelete, onSave, onRegenerate, onRegenerateDay }) {
  const tz = room.timezone;
  const events = [...(room.events || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
  const days = [...new Set(events.map((e) => e.start?.slice(0, 10)))].filter(Boolean);

  if (!events.length) {
    return (
      <div className="text-sm text-mist py-8 text-center">
        No itinerary yet. Add wishes, then hit <span className="text-gold">Re-Optimize Trip</span>.
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {days.map((day) => (
          <div key={day} className="rounded-2xl bg-stone-50 p-3 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display">{formatDay(day + "T12:00:00", tz)}</h4>
              <button type="button" className="text-[11px] underline text-mist" onClick={() => onRegenerateDay(day)}>
                Regen day
              </button>
            </div>
            <div className="space-y-2">
              {BLOCKS.map((b) => {
                const ev = events.find((e) => e.start?.slice(0, 10) === day && e.block === b.id);
                return (
                  <div key={b.id} className="text-xs flex gap-2">
                    <span className="text-mist w-20 shrink-0">{b.label}</span>
                    <span>{ev ? ev.title : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === "map") {
    return (
      <div>
        <GoogleMapView events={events} wishlist={room.wishlist} mapsKey={mapsKey} />
        <ol className="mt-3 space-y-1 text-sm">
          {events.map((e, i) => (
            <li key={e.id}>
              {i + 1}. {e.venue?.name || e.title}{" "}
              <span className="text-mist">
                {e.venue?.lat == null
                  ? "· no pin yet"
                  : e.travel_from_previous?.text
                    ? `· ${e.travel_from_previous.text}`
                    : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const grouped = new Map();
  for (const e of events) {
    const day = e.start.slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day).push(e);
  }

  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([day, list]) => (
        <section key={day}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-display text-xl">{formatDay(list[0].start, tz)}</h4>
            <button type="button" className="text-xs underline text-mist" onClick={() => onRegenerateDay(day)}>
              Regenerate this day
            </button>
          </div>
          <div className="space-y-2">
            {list.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                room={room}
                onLock={onLock}
                onDelete={onDelete}
                onSave={onSave}
                onRegenerate={onRegenerate}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
