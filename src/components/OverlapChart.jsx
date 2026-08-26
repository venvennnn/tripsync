import { compactDay } from "../lib/format.js";
import { Avatar } from "./Avatar.jsx";

export function OverlapChart({ room }) {
  const presence = room.presence;
  if (!presence?.days?.length) {
    return <p className="text-mist text-sm">Add arrival and departure times to see overlap.</p>;
  }
  const { days, rows, group } = presence;
  const fullStart = group.findIndex(Boolean);
  const fullEnd = group.lastIndexOf(true);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="grid gap-1" style={{ gridTemplateColumns: `9rem repeat(${days.length}, minmax(3.2rem, 1fr))` }}>
          <div />
          {days.map((d) => (
            <div key={d} className="text-[10px] uppercase tracking-wide text-mist text-center pb-1">
              {compactDay(d)}
            </div>
          ))}
          {rows.map((row) => (
            <div key={row.id} className="contents">
              <div className="flex items-center gap-2 pr-2">
                <Avatar avatar={row.avatar} name={row.name} size={28} />
                <span className="text-sm truncate">{row.name}</span>
              </div>
              {row.cells.map((on, i) => (
                <div key={i} className="h-7 rounded-md overflow-hidden bg-stone-100">
                  {on && <div className="bar-fill h-full" style={{ color: row.avatar?.color || "#0f766e" }} />}
                </div>
              ))}
            </div>
          ))}
          <div className="text-sm font-semibold pt-1">GROUP</div>
          {group.map((on, i) => (
            <div
              key={i}
              className={`h-6 rounded-md grid place-items-center text-[11px] ${
                on ? "bg-gold text-white font-bold" : "bg-stone-100 text-mist"
              }`}
            >
              {on ? "●" : "·"}
            </div>
          ))}
        </div>
        {fullStart >= 0 && (
          <p className="text-sm text-gold mt-3">
            Full-group window: {compactDay(days[fullStart])}
            {fullEnd !== fullStart ? ` → ${compactDay(days[fullEnd])}` : ""}. Shared plans belong here.
          </p>
        )}
      </div>
    </div>
  );
}
