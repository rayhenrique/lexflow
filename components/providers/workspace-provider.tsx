"use client";

import { createContext, useContext, useState } from "react";
import type { AppRole, Workspace, WorkspaceScope } from "@/lib/types";

interface WorkspaceContextValue {
  role: AppRole;
  workspaces: Workspace[];
  selectedWorkspaceId: WorkspaceScope;
  setSelectedWorkspaceId: (workspaceId: WorkspaceScope) => void;
  userName: string | null;
  userEmail: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  children: React.ReactNode;
  role: AppRole;
  workspaces: Workspace[];
  initialWorkspaceId: WorkspaceScope;
  userName: string | null;
  userEmail: string | null;
}

export function WorkspaceProvider({
  children,
  role,
  workspaces,
  initialWorkspaceId,
  userName,
  userEmail,
}: WorkspaceProviderProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] =
    useState<WorkspaceScope>(initialWorkspaceId);

  function setSelectedWorkspaceId(workspaceId: WorkspaceScope) {
    if (role !== "gestor") {
      return;
    }

    setSelectedWorkspaceIdState(workspaceId);
  }

  const value: WorkspaceContextValue = {
    role,
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    userName,
    userEmail,
  };

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider.");
  }

  return context;
}
