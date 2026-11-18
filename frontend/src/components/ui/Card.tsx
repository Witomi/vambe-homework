import clsx from 'clsx';

interface CardProps {
  title?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  action,
  className,
  children,
}: CardProps) {
  return (
    <section
      className={clsx(
        'border-border bg-surface rounded-xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && (
              <p className="text-muted mt-0.5 text-xs">{subtitle}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
