import AppShell from "@/components/AppShell";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}