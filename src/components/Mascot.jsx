export function MascotSprite({ mascot, size = 56 }) {
  const m = mascot || { id: "voltling", color: "#F4D35E", emoji: "⚡" };
  const id = m.id || "voltling";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="drop-shadow-sm">
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff6" />
          <stop offset="55%" stopColor={m.color || "#F4D35E"} />
          <stop offset="100%" stopColor="#0004" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="34" r="22" fill={`url(#${id}-g)`} stroke="#0c0e14" strokeWidth="2.5" />
      {id === "voltling" && (
        <>
          <polygon points="44,8 50,26 38,20" fill={m.color} stroke="#0c0e14" strokeWidth="2" />
          <polygon points="20,10 14,26 26,20" fill={m.color} stroke="#0c0e14" strokeWidth="2" />
        </>
      )}
      {id === "sproutail" && <ellipse cx="32" cy="12" rx="8" ry="10" fill="#3d8f4a" stroke="#0c0e14" strokeWidth="2" />}
      {id === "cinderpaw" && <path d="M28 14c2-8 8-8 10 0l-5 6z" fill="#ffb347" stroke="#0c0e14" strokeWidth="2" />}
      {id === "ripplet" && <path d="M20 40c6 8 18 8 24 0" fill="none" stroke="#0c0e14" strokeWidth="2.5" />}
      <circle cx="24" cy="32" r="4" fill="#0c0e14" />
      <circle cx="40" cy="32" r="4" fill="#0c0e14" />
      <circle cx="23.2" cy="31" r="1.2" fill="#fff" />
      <circle cx="39.2" cy="31" r="1.2" fill="#fff" />
      <path d="M26 42c4 4 8 4 12 0" fill="none" stroke="#0c0e14" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function MascotBadge({ participant, size = 48 }) {
  if (!participant) return null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="rounded-full grid place-items-center shrink-0"
        style={{ background: `${participant.avatar?.color || "#f0c94a"}22`, width: size + 10, height: size + 10 }}
      >
        <MascotSprite mascot={participant.avatar} size={size} />
      </div>
      <div className="min-w-0">
        <div className="font-semibold truncate leading-tight">
          {participant.avatar?.emoji} {participant.name}
        </div>
        {participant.avatar?.name && (
          <div className="text-xs text-mist truncate">{participant.avatar.name}</div>
        )}
      </div>
    </div>
  );
}
