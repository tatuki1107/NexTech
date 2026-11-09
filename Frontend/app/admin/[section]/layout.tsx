import AdminShell from "../_components/AdminShell";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
