import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api.js";

const DEMO_CODE = "KL-FOOD-SQUAD-2026";

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-mist mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-white border border-stone-300 px-3 py-2 text-ink outline-none focus:border-gold";

export function Landing() {
  const nav = useNavigate();
  const [tab, setTab] = useState("join");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [form, setForm] = useState({
    trip_name: "",
    timezone: "Asia/Kuala_Lumpur",
    base_name: "",
    base_address: "",
    name: "",
    arrival: "2026-08-29T09:00",
    departure: "2026-09-07T18:00",
  });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function join(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const code = joinCode.trim();
      const { room } = await api.getRoom(code);
      saveSession({ code: room.code, participantId: null });
      nav(`/room/${encodeURIComponent(room.code)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { room, you } = await api.createRoom({
        trip_name: form.trip_name,
        timezone: form.timezone,
        base_location: { name: form.base_name, address: form.base_address },
        owner: {
          name: form.name,
          arrival: new Date(form.arrival).toISOString(),
          departure: new Date(form.departure).toISOString(),
        },
      });
      saveSession({ code: room.code, participantId: you.id });
      nav(`/room/${encodeURIComponent(room.code)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <header className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-gold tracking-[0.25em] text-xs font-semibold">GROUP TRIP COORDINATION</p>
            <h1 className="font-display text-5xl md:text-7xl mt-2 leading-none">TripSync</h1>
            <p className="mt-4 max-w-xl text-ink/75 text-lg">
              Everyone wants something. TripSync finds the moment — one shared itinerary that
              respects who is actually around.
            </p>
          </div>
          <div className="code-capsule hidden md:inline-flex">
            <span className="px-4 py-2 text-sm">Room code required</span>
          </div>
        </header>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          <aside className="md:col-span-2 card-paper rounded-3xl p-5 space-y-4">
            <h2 className="font-display text-2xl">Coordination, not another attraction list.</h2>
            <ul className="text-sm text-ink/75 space-y-3">
              <li>Mixed arrivals become overlap windows.</li>
              <li>Wishlist cravings cluster into group matches.</li>
              <li>Hipster spots sit beside must-do meals.</li>
              <li>Google Maps measures real driving distance between stops.</li>
              <li>Pin stops at 100%, then re-optimize around them.</li>
            </ul>
            <p className="text-xs text-mist">
              Trip data stays behind the login code. If you do not have the code, you cannot see the
              itinerary, wishlist, or who is coming.
            </p>
          </aside>

          <section className="md:col-span-3 card-paper rounded-3xl p-5 md:p-7">
            <div className="flex gap-2 mb-6">
              {[
                ["join", "Enter trip code"],
                ["create", "Create a trip"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setError("");
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    tab === id ? "bg-gold text-white" : "bg-stone-100 text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "join" ? (
              <form onSubmit={join} className="space-y-4">
                <Field label="Trip login code">
                  <input
                    className={`${inputCls} tracking-[0.14em] uppercase`}
                    placeholder="KL-FOOD-SQUAD-2026"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                  />
                </Field>
                <p className="text-xs text-mist">
                  Each trip has its own code. Paste it exactly — that is the only way in.
                </p>
                {error && <p className="text-ember text-sm">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={busy}
                    className="bg-gold text-white font-bold rounded-full px-5 py-2.5 disabled:opacity-60"
                  >
                    {busy ? "Checking…" : "Open trip"}
                  </button>
                  <button
                    type="button"
                    className="text-sm underline text-mist"
                    onClick={() => setJoinCode(DEMO_CODE)}
                  >
                    Fill sample code {DEMO_CODE}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={create} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Trip name">
                    <input className={inputCls} value={form.trip_name} onChange={(e) => set("trip_name", e.target.value)} required placeholder="KL Food Squad" />
                  </Field>
                  <Field label="Your name">
                    <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Venmani" />
                  </Field>
                  <Field label="Base (hotel / Airbnb / area)">
                    <input className={inputCls} value={form.base_name} onChange={(e) => set("base_name", e.target.value)} placeholder="Petaling Jaya Hotel" />
                  </Field>
                  <Field label="Address or Maps link">
                    <input className={inputCls} value={form.base_address} onChange={(e) => set("base_address", e.target.value)} placeholder="Petaling Jaya, Malaysia" />
                  </Field>
                  <Field label="You arrive">
                    <input type="datetime-local" className={inputCls} value={form.arrival} onChange={(e) => set("arrival", e.target.value)} required />
                  </Field>
                  <Field label="You leave">
                    <input type="datetime-local" className={inputCls} value={form.departure} onChange={(e) => set("departure", e.target.value)} required />
                  </Field>
                </div>
                <p className="text-xs text-mist">
                  Creating a trip mints a unique login code automatically. Share that code — never a
                  public link without it.
                </p>
                {error && <p className="text-ember text-sm">{error}</p>}
                <button disabled={busy} className="bg-gold text-white font-bold rounded-full px-5 py-2.5 disabled:opacity-60">
                  {busy ? "Minting code…" : "Create trip + code"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
