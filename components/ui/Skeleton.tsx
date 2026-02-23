export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-label="Carregando..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 3 }: { rows?: number; cols?: number } = {}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={j === 0 ? 'h-12 flex-1' : j === 1 ? 'h-12 w-32' : 'h-12 w-24'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-md">
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton para dashboard do paciente: hero + o que fazer agora + conteúdo */
export function SkeletonPatientDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-up">
      <div className="mb-8 rounded-2xl overflow-hidden">
        <Skeleton className="h-12 w-48 mb-4 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <div className="mb-8">
        <Skeleton className="h-6 w-56 mb-3 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="mb-8">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <Skeleton className="h-6 w-48 mb-4 rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-16 w-full rounded-lg" key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton para lista de consultas/receitas/pagamentos */
export function SkeletonPatientList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
