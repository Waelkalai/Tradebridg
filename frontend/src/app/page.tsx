export default function HomePage(): React.ReactElement {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.18),_transparent_55%),linear-gradient(160deg,#f7f4ef_0%,#e8f0ee_45%,#dce8e4_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <p className="mb-4 font-display text-5xl tracking-tight text-teal-900 sm:text-6xl md:text-7xl">
          Tradebridg
        </p>
        <h1 className="text-xl font-medium text-slate-700 sm:text-2xl">
          Welcome to Tradebridg
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
          Multi-vendor COD commerce for Tunisia — sellers, suppliers, and
          agencies on one bridged platform.
        </p>
      </div>
    </main>
  );
}
