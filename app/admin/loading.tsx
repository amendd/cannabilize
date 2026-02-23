import { Skeleton, SkeletonDashboard, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <SkeletonDashboard />
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <SkeletonTable />
      </div>
    </div>
  );
}
