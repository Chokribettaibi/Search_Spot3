function DetectionHistorySidebar({
  history,
  isOpen,
  onSearchItem,
}) {
  return (
    <aside
      className={`history-drawer ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <h2 className="text-lg font-semibold text-white">Detection history</h2>
          <p className="mt-1 text-sm text-slate-300">
            Stable object detections are saved here.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Point your camera at an object to start building history.
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSearchItem(item.label)}
                className="history-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold capitalize text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {item.confidence}% confidence
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                    Search
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400">{item.timestamp}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

export default DetectionHistorySidebar;
