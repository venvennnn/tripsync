export function ToastHost({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-pop text-left rounded-2xl px-4 py-3 shadow-xl border border-stone-200 bg-white text-ink"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg leading-tight">{t.title}</div>
              {t.body && <div className="text-sm mt-1 opacity-80">{t.body}</div>}
            </div>
            <button
              type="button"
              className="text-mist text-xs shrink-0"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          {t.action && (
            <button
              type="button"
              className="text-xs font-semibold text-gold underline mt-2"
              onClick={() => {
                t.action.onClick?.();
                onDismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
