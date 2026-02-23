import ErpCannaLayout from '@/components/layout/ErpCannaLayout';

export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ErpCannaLayout>{children}</ErpCannaLayout>;
}
