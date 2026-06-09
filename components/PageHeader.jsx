export default function PageHeader({ eyebrow, title, description, action, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-500">{description}</p> : null}
      </div>
      {action || children ? (
        <div className="flex items-center gap-3">
          {action}
          {children}
        </div>
      ) : null}
    </div>
  );
}
