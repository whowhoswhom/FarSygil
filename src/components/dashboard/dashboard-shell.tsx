import type { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className = "",
}: DashboardShellProps) {
  return (
    <main className={`page-shell dashboard-shell ${className}`.trim()}>
      {children}
    </main>
  );
}
