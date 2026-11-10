export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#faf8fc]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-200 bg-white shadow-sm">
          <span className="text-3xl text-purple-700">✦</span>
        </div>

        <h1 className="mt-6 font-serif text-2xl font-semibold tracking-wide text-purple-950">
          Restoration Refuge
        </h1>

        <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
          Massage Studio
        </p>

        <div className="mt-8 flex items-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-600 [animation-delay:300ms]" />
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Preparing your moment of relaxation…
        </p>
      </div>
    </div>
  );
}