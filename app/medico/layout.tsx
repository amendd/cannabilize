import DoctorLayout from '@/components/layout/DoctorLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DoctorLayout>{children}</DoctorLayout>;
}
