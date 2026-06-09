export default function PageHeader({ eyebrow, title, description, action, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-signal-cyan">{eyebrow}</p>
        <h1 className="text-3xl font-black text-white md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {/* Support both legacy `action` prop and new children pattern */}
      {action || children ? (
        <div className="flex items-center gap-3">
          {action}
          {children}
        </div>
      ) : null}
    </div>
  );
}
