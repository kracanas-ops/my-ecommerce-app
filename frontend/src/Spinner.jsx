export default function Spinner({ label = 'Loading', fullPage = false }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm text-zinc-400 ${fullPage ? 'min-h-64' : 'py-10'}`}
      role="status"
      aria-live="polite"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
      <span>{label}</span>
    </div>
  );
}
