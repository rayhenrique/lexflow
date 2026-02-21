"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Footer } from "@/components/layout/footer";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import type { AppRole, Workspace, WorkspaceScope } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  role: AppRole;
  workspaces: Workspace[];
  initialWorkspaceId: WorkspaceScope;
  userName: string | null;
  userEmail: string | null;
}

export function AppShell({
  children,
  role,
  workspaces,
  initialWorkspaceId,
  userName,
  userEmail,
}: AppShellProps) {
  return (
    <WorkspaceProvider
      role={role}
      workspaces={workspaces}
      initialWorkspaceId={initialWorkspaceId}
      userName={userName}
      userEmail={userEmail}
    >
      <div className="min-h-screen bg-zinc-50 text-zinc-900 print:bg-white">
        <div className="flex min-h-screen print:block">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 p-4 sm:p-6 print:p-0 print:pt-0">{children}</main>
            <Footer />
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
