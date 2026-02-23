import GppCannaLayout from '@/components/layout/GppCannaLayout';

export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GppCannaLayout>{children}</GppCannaLayout>;
}
