import { useState } from "react";
import { formatDay, formatRange } from "../lib/format.js";
import { Avatar } from "./Avatar.jsx";
import { GoogleMapView } from "./GoogleMapView.jsx";
import { BLOCKS, eachDay, isoDay, tripSpan } from "../../shared/engine.js";

function tripDays(room) {
  const span = tripSpan(room.participants || []);
  if (!span) return [];
  return eachDay(span.start, span.end, room.timezone || "Asia/Kuala_Lumpur");
}

function SlotPicker({ room, event, onPick }) {
  const tz = room.timezone;
  const days = tripDays(room);
  const currentDay = event.start ? isoDay(event.start, tz) : "";
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] text-mist">Drop onto a slot, or tap one here. Occupied slots swap.</p>
      {days.map((day) => (
        <div key={day}>
          <div className="text-[11px] font-semibold text-mist mb-1">{formatDay(`${day}T12:00:00`, tz)}</div>
          <div className="flex flex-wrap gap-1">
            {BLOCKS.map((b) => {
              const taken = (room.events || []).find(
                (e) => e.id !== event.id && e.block === b.id && isoDay(e.start, tz) === day,
              );
              const here = currentDay === day && event.block === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={here}
                  onClick={() => onPick(day, b.id)}
                  className={`text-[11px] rounded-full px-2 py-1 ${
                    here
                      ? "bg-gold text-white"
                      : taken
                        ? "bg-teal-50 border border-gold/30"
                        : "bg-stone-100"
                  }`}
                  title={taken ? `Swap with ${taken.title}` : "Move here"}
                >
                  {b.label}
                  {taken ? ` · ${taken.title.slice(0, 12)}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventCard({ event, room, dragging, onDragStart, onLock, onDelete, onMove, onRegenerate }) {
  const [moveOpen, setMoveOpen] = useState(false);
  const people = (event.participants || [])
    .map((id) => room.participants.find((p) => p.id === id))
    .filter(Boolean);
  const conflict = (room.conflicts || []).some((c) => c.event_id === event.id);
  const travel =
    event.travel_from_previous?.text ||
    (event.travel_from_previous_min != null ? `${event.travel_from_previous_min} min from previous stop` : null);
  const walk = event.kind === "walking_tour" || event.stops?.length > 1;

  return (
    <article
      draggable={!event.locked}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/event-id", event.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(event.id);
      }}
      className={`rounded-2xl p-3 border ${
        event.locked ? "border-gold/50 bg-teal-50" : "border-stone-200 bg-white"
      } ${conflict ? "ring-2 ring-ember" : ""} ${dragging ? "opacity-50" : ""} ${walk ? "bg-teal-50/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {!event.locked && (
            <span
              className="drag-handle shrink-0 mt-1 text-mist select-none"
              title="Drag to another slot"
              aria-hidden
            >
              ⋮⋮
            </span>
          )}
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-mist">
              {event.block} · {formatRange(event.start, event.end, room.timezone)}
              {event.locked ? " · locked" : ""}
              {walk ? " · walking tour" : ""}
            </div>
            <h4 className="font-display text-xl leading-tight">{event.title}</h4>
            {event.venue?.name && event.venue.name !== event.title && (
              <div className="text-sm text-ink/80">{event.venue.name}</div>
            )}
            {event.venue?.address && <div className="text-xs text-mist">{event.venue.address}</div>}
            {walk && event.stops?.length > 0 && (
              <ol className="mt-1 text-xs text-ink/80 list-decimal pl-4">
                {event.stops.map((s, i) => (
                  <li key={`${s.name}-${i}`}>
                    {s.name}
                    {s.maps_url ? (
                      <>
                        {" "}
                        <a className="text-gold underline" href={s.maps_url} target="_blank" rel="noreferrer">
                          map
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
            {event.venue?.maps_url && !walk && (
              <a className="text-xs text-gold underline" href={event.venue.maps_url} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            )}
          </div>
        </div>
        {event.group_match && (
          <span className="text-[10px] font-bold bg-gold text-white rounded-full px-2 py-1 shrink-0">GROUP MATCH</span>
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
        <button
          type="button"
          className="text-xs rounded-full px-2 py-1 bg-stone-100"
          onClick={() => setMoveOpen((v) => !v)}
        >
          Move
        </button>
        <button type="button" className="text-xs rounded-full px-2 py-1 bg-stone-100" onClick={() => onRegenerate(event)}>
          Regenerate
        </button>
        <button type="button" className="text-xs rounded-full px-2 py-1 bg-ember/15" onClick={() => onDelete(event)}>
          Delete
        </button>
      </div>
      {moveOpen && (
        <SlotPicker
          room={room}
          event={event}
          onPick={(date, block) => {
            onMove(event, date, block);
            setMoveOpen(false);
          }}
        />
      )}
    </article>
  );
}

function DropSlot({ day, block, event, room, isOver, onDrop, onDragOver, children }) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(day, block.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/event-id");
        if (id) onDrop(id, day, block.id);
      }}
      className={`drop-slot rounded-xl min-h-[3.2rem] p-1 ${
        isOver ? "drop-slot-over" : event ? "bg-white" : "bg-stone-50 border border-dashed border-stone-200"
      }`}
    >
      {children}
    </div>
  );
}

export function ItineraryPanel({
  room,
  view,
  mapsKey,
  onLock,
  onDelete,
  onMove,
  onRegenerate,
  onRegenerateDay,
}) {
  const tz = room.timezone;
  const events = [...(room.events || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  function handleDrop(eventId, date, block) {
    const event = events.find((e) => e.id === eventId);
    setDragging(null);
    setOver(null);
    if (event) onMove(event, date, block);
  }

  if (!events.length) {
    return (
      <div className="text-sm text-mist py-8 text-center">
        No itinerary yet. Add wishes, then hit <span className="text-gold">Re-Optimize Trip</span>.
      </div>
    );
  }

  if (view === "calendar") {
    const days = tripDays(room);
    const boardDays = days.length ? days : [...new Set(events.map((e) => isoDay(e.start, tz)))];
    return (
      <div>
        <p className="text-xs text-mist mb-2">Drag a stop onto a slot. Dropping on a filled slot swaps them.</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {boardDays.map((day) => (
            <div key={day} className="rounded-2xl bg-stone-50 p-3 border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display">{formatDay(`${day}T12:00:00`, tz)}</h4>
                <button type="button" className="text-[11px] underline text-mist" onClick={() => onRegenerateDay(day)}>
                  Regen day
                </button>
              </div>
              <div className="space-y-2">
                {BLOCKS.map((b) => {
                  const ev = events.find((e) => isoDay(e.start, tz) === day && e.block === b.id);
                  const isOver = over?.day === day && over?.block === b.id;
                  return (
                    <div key={b.id} className="text-xs">
                      <div className="text-mist mb-0.5">{b.label}</div>
                      <DropSlot
                        day={day}
                        block={b}
                        event={ev}
                        room={room}
                        isOver={isOver}
                        onDrop={handleDrop}
                        onDragOver={(d, blockId) => setOver({ day: d, block: blockId })}
                      >
                        {ev ? (
                          <button
                            type="button"
                            draggable={!ev.locked}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/event-id", ev.id);
                              setDragging(ev.id);
                            }}
                            className="w-full text-left px-2 py-1 rounded-lg bg-white border border-stone-200"
                          >
                            <span className="drag-handle mr-1 text-mist">⋮⋮</span>
                            {ev.title}
                            {ev.kind === "walking_tour" ? " 🚶" : ""}
                          </button>
                        ) : (
                          <div className="text-mist px-2 py-1">Drop here</div>
                        )}
                      </DropSlot>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
                {e.kind === "walking_tour"
                  ? "· walking tour"
                  : e.venue?.lat == null
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
    const day = isoDay(e.start, tz);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day).push(e);
  }
  const days = tripDays(room);
  const showDays = days.length ? days : [...grouped.keys()];

  return (
    <div className="space-y-5">
      <p className="text-xs text-mist">Drag the ⋮⋮ handle onto another day or time slot. Nearby stops stay clustered after Re-Optimize.</p>
      {showDays.map((day) => {
        const list = grouped.get(day) || [];
        return (
          <section key={day}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display text-xl">{formatDay(`${day}T12:00:00`, tz)}</h4>
              <button type="button" className="text-xs underline text-mist" onClick={() => onRegenerateDay(day)}>
                Regenerate this day
              </button>
            </div>
            <div className="space-y-2">
              {BLOCKS.map((b) => {
                const event = list.find((e) => e.block === b.id);
                const isOver = over?.day === day && over?.block === b.id;
                return (
                  <DropSlot
                    key={b.id}
                    day={day}
                    block={b}
                    event={event}
                    room={room}
                    isOver={isOver}
                    onDrop={handleDrop}
                    onDragOver={(d, blockId) => setOver({ day: d, block: blockId })}
                  >
                    {event ? (
                      <EventCard
                        event={event}
                        room={room}
                        dragging={dragging === event.id}
                        onDragStart={setDragging}
                        onLock={onLock}
                        onDelete={onDelete}
                        onMove={onMove}
                        onRegenerate={onRegenerate}
                      />
                    ) : (
                      <div className="text-xs text-mist px-3 py-2">
                        {b.label} — drop a stop here
                      </div>
                    )}
                  </DropSlot>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
