export function Avatar({ avatar, name, size = 40 }) {
  const initials = avatar?.initials || (name || "?").slice(0, 2).toUpperCase();
  const color = avatar?.color || "#0f766e";
  return (
    <div
      className="rounded-full grid place-items-center shrink-0 font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: Math.max(11, size * 0.36) }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function AvatarBadge({ participant, size = 40 }) {
  if (!participant) return null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar avatar={participant.avatar} name={participant.name} size={size} />
      <div className="min-w-0">
        <div className="font-semibold truncate leading-tight">{participant.name}</div>
      </div>
    </div>
  );
}
