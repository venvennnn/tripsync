import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, clearSession, loadSession, saveSession, loadGeminiKey, saveGeminiKey } from "../api.js";
import { formatDay } from "../lib/format.js";
import { MascotBadge } from "../components/Mascot.jsx";
import { OverlapChart } from "../components/OverlapChart.jsx";
import { WishlistPanel } from "../components/WishlistPanel.jsx";
import { ItineraryPanel } from "../components/Itinerary.jsx";
import { ToastHost } from "../components/ToastHost.jsx";

const inputCls =
  "w-full rounded-xl bg-ink border border-paper/15 px-3 py-2 text-paper outline-none focus:border-gold";

function copy(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export function Room() {
  const { code } = useParams();
  const nav = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [gate, setGate] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [youId, setYouId] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("timeline");
  const [toasts, setToasts] = useState([]);
  const [gemini, setGemini] = useState(loadGeminiKey());
  const [baseOpen, setBaseOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({
    name: "",
    arrival: "2026-08-31T09:00",
    departure: "2026-09-03T18:00",
    preferences: "",
  });

  const session = loadSession();
  const unlocked = session?.code?.toUpperCase() === String(code || "").toUpperCase();

  function toast(title, body) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }

  async function loadUnlocked() {
    const data = await api.getRoom(code);
    setRoom(data.room);
    setError("");
    const s = loadSession();
    if (s?.participantId && data.room.participants.some((p) => p.id === s.participantId)) {
      setYouId(s.participantId);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!unlocked) {
        setNeedsCode(true);
        setRoom(null);
        return;
      }
      setNeedsCode(false);
      try {
        const data = await api.getRoom(code);
        if (!alive) return;
        setRoom(data.room);
        const s = loadSession();
        if (s?.participantId && data.room.participants.some((p) => p.id === s.participantId)) {
          setYouId(s.participantId);
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message);
        setRoom(null);
      }
    })();
    const t = setInterval(() => {
      if (loadSession()?.code?.toUpperCase() === String(code || "").toUpperCase()) {
        api.getRoom(code).then((d) => alive && setRoom(d.room)).catch(() => {});
      }
    }, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [code, unlocked]);

  const you = useMemo(() => room?.participants.find((p) => p.id === youId) || null, [room, youId]);

  async function submitGate(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.getRoom(gate);
      if (data.room.code !== String(code || "").toUpperCase()) {
        setError("That code does not unlock this trip.");
        return;
      }
      saveSession({ code: data.room.code, participantId: youId });
      setNeedsCode(false);
      setRoom(data.room);
    } catch (err) {
      setError(err.message);
    }
  }

  async function join(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.join(room.code, {
        name: joinForm.name,
        arrival: new Date(joinForm.arrival).toISOString(),
        departure: new Date(joinForm.departure).toISOString(),
        preferences: joinForm.preferences
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setRoom(res.room);
      setYouId(res.you.id);
      saveSession({ code: res.room.code, participantId: res.you.id });
      setJoinOpen(false);
      if (res.appeared) toast(`A wild ${res.you.name} appeared! ${res.you.avatar?.emoji || ""}`, "Welcome to the party.");
    } catch (err) {
      toast("Join failed", err.message);
    } finally {
      setBusy(false);
    }
  }

  async function optimize(body = { scope: "all" }) {
    setBusy(true);
    try {
      const res = await api.optimize(room.code, body);
      setRoom(res.room);
      const s = res.optimization?.summary;
      toast(s?.headline || "Trip optimized! ✨", (s?.lines || []).join(" "));
    } catch (err) {
      toast("Optimize failed", err.message);
    } finally {
      setBusy(false);
    }
  }

  if (needsCode) {
    return (
      <div className="bg-grid min-h-screen grid place-items-center px-4">
        <form onSubmit={submitGate} className="card-paper rounded-3xl p-6 max-w-md w-full space-y-3">
          <p className="text-gold text-xs tracking-[0.2em]">LOCKED TRIP</p>
          <h1 className="font-display text-3xl">Enter the trip code</h1>
          <p className="text-sm text-mist">
            This itinerary is private. The URL is not enough — you need the login code.
          </p>
          <input
            className={`${inputCls} tracking-[0.14em] uppercase`}
            value={gate}
            onChange={(e) => setGate(e.target.value.toUpperCase())}
            placeholder="TRIP-CODE-HERE"
            required
          />
          {error && <p className="text-ember text-sm">{error}</p>}
          <div className="flex gap-3">
            <button className="bg-gold text-ink font-bold rounded-full px-4 py-2">Unlock</button>
            <Link to="/" className="text-sm underline self-center">
              Back
            </Link>
          </div>
        </form>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="bg-grid min-h-screen grid place-items-center px-4">
        <div className="card-paper rounded-3xl p-6 max-w-md">
          <h1 className="font-display text-3xl mb-2">No trip found</h1>
          <p className="text-mist text-sm mb-4">{error}</p>
          <Link to="/" className="text-gold underline">
            Enter a different code
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-grid min-h-screen grid place-items-center text-mist">Opening trip…</div>
    );
  }

  return (
    <div className="bg-grid min-h-screen pb-16">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-ink/80 border-b border-paper/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <Link to="/" className="text-[10px] tracking-[0.25em] text-gold">
              TRIPSYNC
            </Link>
            <h1 className="font-display text-2xl md:text-3xl leading-none">{room.trip_name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="code-capsule"
              title="Copy login code"
              onClick={() => {
                copy(room.code);
                toast("Code copied", "Share this. It is the only way into the trip.");
              }}
            >
              <span className="orb" />
              <span className="px-3 py-1 text-xs">{room.code}</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => optimize({ scope: "all" })}
              className="bg-gold text-ink font-bold rounded-full px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              <span className={busy ? "optimize-spin inline-block" : ""}>✨</span>
              Re-Optimize Trip
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        <section className="card-paper rounded-3xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Who is here?</h2>
            <button type="button" className="text-sm underline" onClick={() => setJoinOpen(true)}>
              {you ? "Switch / update me" : "I am joining"}
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {room.participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setYouId(p.id);
                  saveSession({ code: room.code, participantId: p.id });
                }}
                className={`min-w-[11rem] rounded-2xl p-3 text-left ${
                  you?.id === p.id ? "bg-gold/20 ring-1 ring-gold" : "bg-ink/40"
                }`}
              >
                <MascotBadge participant={p} />
                <p className="text-[11px] text-mist mt-2">
                  {formatDay(p.arrival, room.timezone)} → {formatDay(p.departure, room.timezone)}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-mist mt-2">
            Base: {room.base_location?.name || "not set"}{" "}
            <button type="button" className="underline" onClick={() => setBaseOpen((v) => !v)}>
              edit
            </button>
          </p>
          {baseOpen && (
            <form
              className="grid md:grid-cols-3 gap-2 mt-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const res = await api.patchRoom(room.code, {
                  base_location: {
                    name: fd.get("name"),
                    address: fd.get("address"),
                    maps_url: fd.get("maps_url"),
                  },
                });
                setRoom(res.room);
                setBaseOpen(false);
              }}
            >
              <input name="name" className={inputCls} defaultValue={room.base_location?.name} placeholder="Hotel / Airbnb" />
              <input name="address" className={inputCls} defaultValue={room.base_location?.address} placeholder="Address" />
              <input name="maps_url" className={inputCls} defaultValue={room.base_location?.maps_url || ""} placeholder="Maps URL" />
              <button className="md:col-span-3 text-sm bg-paper text-ink rounded-full py-2 font-semibold">Save base</button>
            </form>
          )}
        </section>

        <section className="card-paper rounded-3xl p-4 md:p-5">
          <h2 className="font-display text-2xl mb-3">When is everyone together?</h2>
          <OverlapChart room={room} />
        </section>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <WishlistPanel
              room={room}
              you={you}
              onAdd={async (payload) => {
                if (!you) {
                  setJoinOpen(true);
                  toast("Join first", "Add yourself to the trip before dropping wishes.");
                  return;
                }
                const res = await api.addWish(room.code, payload);
                setRoom(res.room);
                if (res.room.matches?.length) {
                  toast("SUPER EFFECTIVE! ⚡", "A group match showed up on the board.");
                }
              }}
              onHeart={async (wid) => {
                if (!you) return;
                const res = await api.heartWish(room.code, wid, you.id);
                setRoom(res.room);
              }}
              onDelete={async (wid) => {
                const res = await api.deleteWish(room.code, wid);
                setRoom(res.room);
              }}
            />
          </div>
          <section className="lg:col-span-3 card-paper rounded-3xl p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-2xl">What are we doing?</h2>
              <div className="flex gap-1">
                {["timeline", "calendar", "map", "overlap"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`text-xs rounded-full px-3 py-1 capitalize ${
                      view === v ? "bg-gold text-ink" : "bg-paper/10"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {view === "overlap" ? (
              <OverlapChart room={room} />
            ) : (
              <ItineraryPanel
                room={room}
                view={view}
                onLock={async (event) => {
                  const res = await api.patchEvent(room.code, event.id, { locked: !event.locked });
                  setRoom(res.room);
                }}
                onDelete={async (event) => {
                  const res = await api.deleteEvent(room.code, event.id);
                  setRoom(res.room);
                }}
                onSave={async (event, body) => {
                  const res = await api.patchEvent(room.code, event.id, body);
                  setRoom(res.room);
                  if (res.conflicts?.length) toast("It's not very effective…", res.conflicts[0].message);
                }}
                onRegenerate={(event) => optimize({ scope: "event", event_id: event.id })}
                onRegenerateDay={(date) => optimize({ scope: "day", date })}
              />
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="text-xs rounded-full px-3 py-1 bg-paper/10" onClick={() => optimize({ scope: "unlocked" })}>
                Regen unlocked
              </button>
            </div>
            {room.last_optimization?.summary?.lines?.length > 0 && (
              <div className="mt-4 text-sm rounded-2xl bg-ink/50 p-3">
                <div className="text-gold font-semibold">{room.last_optimization.summary.headline}</div>
                <ul className="list-disc pl-4 mt-1 text-paper/80">
                  {room.last_optimization.summary.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <section className="card-paper rounded-3xl p-4 md:p-5 flex flex-wrap items-end gap-3">
          <label className="text-xs text-mist flex-1 min-w-[16rem]">
            Optional Gemini API key (stored only in this browser; used to reason over wishes)
            <input
              className={`${inputCls} mt-1`}
              type="password"
              value={gemini}
              onChange={(e) => {
                setGemini(e.target.value);
                saveGeminiKey(e.target.value.trim());
              }}
              placeholder="Leave blank to use the built-in constraint engine"
            />
          </label>
          <button
            type="button"
            className="text-xs underline text-mist"
            onClick={() => {
              clearSession();
              nav("/");
            }}
          >
            Leave room
          </button>
        </section>
      </main>

      {joinOpen && (
        <div className="fixed inset-0 bg-ink/70 grid place-items-center z-40 px-4">
          <form onSubmit={join} className="card-paper rounded-3xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-display text-2xl">Join {room.trip_name}</h3>
            <p className="text-xs text-mist">You already have the code. Tell us when you are around.</p>
            <input className={inputCls} required placeholder="Name" value={joinForm.name} onChange={(e) => setJoinForm((f) => ({ ...f, name: e.target.value }))} />
            <input type="datetime-local" className={inputCls} value={joinForm.arrival} onChange={(e) => setJoinForm((f) => ({ ...f, arrival: e.target.value }))} />
            <input type="datetime-local" className={inputCls} value={joinForm.departure} onChange={(e) => setJoinForm((f) => ({ ...f, departure: e.target.value }))} />
            <input className={inputCls} placeholder="Preferences (comma separated)" value={joinForm.preferences} onChange={(e) => setJoinForm((f) => ({ ...f, preferences: e.target.value }))} />
            <div className="flex gap-2">
              <button disabled={busy} className="bg-gold text-ink font-bold rounded-full px-4 py-2">
                Appear
              </button>
              <button type="button" className="text-sm" onClick={() => setJoinOpen(false)}>
                Cancel
              </button>
            </div>
            {room.participants.length > 0 && (
              <p className="text-xs text-mist">Or tap an existing traveler card to act as them on this device.</p>
            )}
          </form>
        </div>
      )}

      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
