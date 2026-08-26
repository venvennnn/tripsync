import { useState } from "react";
import { HIPSTER_CATEGORIES, HIPSTER_CATALOG } from "../../shared/places.js";
import { PRIORITY_LABEL } from "../lib/format.js";
import { MascotSprite } from "./Mascot.jsx";

const inputCls =
  "w-full rounded-xl bg-ink border border-paper/15 px-3 py-2 text-paper outline-none focus:border-gold";

const TYPES = [
  { id: "cuisine", label: "Craving" },
  { id: "venue", label: "Exact venue" },
  { id: "natural", label: "Vibe" },
  { id: "hipster", label: "Hipster" },
];

export function WishlistPanel({ room, you, onAdd, onHeart, onDelete }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("cuisine");
  const [form, setForm] = useState({
    title: "",
    maps_url: "",
    priority: "would_love",
    preferred_time: "any",
    hipster_category: "third_wave",
  });

  function pickHipster(place) {
    setTab("hipster");
    setForm((f) => ({
      ...f,
      title: place.name,
      maps_url: place.maps_url,
      hipster_category: place.category,
    }));
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    await onAdd({
      title: form.title,
      query: form.title,
      type: tab,
      maps_url: form.maps_url,
      priority: form.priority,
      preferred_time: form.preferred_time,
      hipster_category: tab === "hipster" ? form.hipster_category : undefined,
      created_by: you?.id,
    });
    setForm({
      title: "",
      maps_url: "",
      priority: "would_love",
      preferred_time: "any",
      hipster_category: form.hipster_category,
    });
    setOpen(false);
  }

  const hipsterCity = HIPSTER_CATALOG.filter((p) => p.tags.includes("hipster"));

  return (
    <section className="card-paper rounded-3xl p-4 md:p-5 h-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-display text-2xl">Wishlist</h3>
        <button
          type="button"
          className="text-sm bg-gold text-ink font-bold rounded-full px-3 py-1"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "+ Add"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {HIPSTER_CATEGORIES.slice(0, 6).map((c) => (
          <button
            key={c.id}
            type="button"
            className="text-[11px] rounded-full px-2 py-1 bg-paper/10 hover:bg-gold/20"
            onClick={() => {
              setTab("hipster");
              setForm((f) => ({ ...f, hipster_category: c.id, title: c.label }));
              setOpen(true);
            }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-2 mb-4 rounded-2xl bg-ink/50 p-3">
          <div className="flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`text-xs rounded-full px-3 py-1 ${tab === t.id ? "bg-gold text-ink" : "bg-paper/10"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "hipster" && (
            <div className="flex flex-wrap gap-1">
              {hipsterCity.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickHipster(p)}
                  className="text-[11px] rounded-lg px-2 py-1 bg-leaf/20 hover:bg-leaf/40"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <input
            className={inputCls}
            required
            placeholder={
              tab === "hipster"
                ? "Independent café, speakeasy, record shop…"
                : tab === "venue"
                  ? "Super Kitchen Chilli Pan Mee"
                  : tab === "natural"
                    ? "Somewhere chill to talk for a few hours"
                    : "Japanese curry / banana leaf / mala"
            }
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          {(tab === "venue" || tab === "hipster") && (
            <input
              className={inputCls}
              placeholder="Optional Google Maps link"
              value={form.maps_url}
              onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))}
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select
              className={inputCls}
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={form.preferred_time}
              onChange={(e) => setForm((f) => ({ ...f, preferred_time: e.target.value }))}
            >
              {["any", "breakfast", "morning", "lunch", "afternoon", "dinner", "evening"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {tab === "hipster" && (
            <select
              className={inputCls}
              value={form.hipster_category}
              onChange={(e) => setForm((f) => ({ ...f, hipster_category: e.target.value }))}
            >
              {HIPSTER_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
          <button className="w-full bg-paper text-ink rounded-full py-2 font-semibold text-sm">
            Add to board
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {(room.wishlist || []).map((w) => {
          const hearts = w.participants_interested || [];
          const people = hearts
            .map((id) => room.participants.find((p) => p.id === id))
            .filter(Boolean);
          return (
            <li key={w.id} className="rounded-2xl bg-ink/40 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold leading-tight">{w.title}</div>
                  <div className="text-[11px] text-mist uppercase tracking-wide">
                    {w.type}
                    {w.group_match ? " · SUPER EFFECTIVE" : ""} · {PRIORITY_LABEL[w.priority] || w.priority}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {you && (
                    <button
                      type="button"
                      className="text-sm px-2 py-1 rounded-full bg-paper/10"
                      onClick={() => onHeart(w.id)}
                    >
                      ♥ {hearts.length}
                    </button>
                  )}
                  {you?.id === w.created_by && (
                    <button type="button" className="text-mist text-xs" onClick={() => onDelete(w.id)}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-1 mt-1">
                {people.map((p) => (
                  <span key={p.id} title={p.name}>
                    <MascotSprite mascot={p.avatar} size={22} />
                  </span>
                ))}
              </div>
            </li>
          );
        })}
        {!room.wishlist?.length && (
          <p className="text-sm text-mist">Add cravings, exact venues, vibes, or hipster hunts.</p>
        )}
      </ul>
    </section>
  );
}
