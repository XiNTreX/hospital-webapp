import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: string;
}

export default function PatientEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon = '📁',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-blue-900/5 backdrop-blur-2xl">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}