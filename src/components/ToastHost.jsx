export function ToastHost({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className="toast-pop text-left rounded-2xl px-4 py-3 shadow-xl border border-stone-200 bg-white text-ink"
        >
          <div className="font-display text-lg leading-tight">{t.title}</div>
          {t.body && <div className="text-sm mt-1 opacity-80">{t.body}</div>}
        </button>
      ))}
    </div>
  );
}
