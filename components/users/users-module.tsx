"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, PencilLine, Plus, Search } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { UserRecord, Workspace } from "@/lib/types";
import { fetchUsersData } from "@/lib/users/users-service";
import { UserSheet } from "@/components/users/user-sheet";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

interface UserTableRow extends UserRecord {
  default_workspace_name: string;
  workspace_count: number;
}

export function UsersModule() {
  const { role } = useWorkspace();
  const supabase = createSupabaseBrowserClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, error, isLoading, mutate } = useSWR("users-module", () =>
    fetchUsersData(supabase),
  );

  if (role !== "gestor") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>
          Apenas gestores podem acessar o módulo de Usuários.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar usuários</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Não foi possível carregar o módulo de usuários."}
        </AlertDescription>
      </Alert>
    );
  }

  const workspaceMap = new Map<string, Workspace>();
  for (const workspace of data.workspaces) {
    workspaceMap.set(workspace.id, workspace);
  }

  const rows: UserTableRow[] = data.users.map((user) => ({
    ...user,
    default_workspace_name: user.default_workspace_id
      ? (workspaceMap.get(user.default_workspace_id)?.name ?? "Sem área")
      : "Sem área",
    workspace_count: user.workspace_ids.length,
  }));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = rows.filter((user) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      (user.name ?? "").toLowerCase().includes(normalizedSearch) ||
      (user.email ?? "").toLowerCase().includes(normalizedSearch) ||
      user.role.toLowerCase().includes(normalizedSearch) ||
      user.default_workspace_name.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9"
          />
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </div>
      <UsersTable rows={filteredRows} onEdit={(user) => setEditingUser(user)} />
      <UserSheet
        open={createOpen}
        user={null}
        workspaces={data.workspaces}
        onOpenChange={setCreateOpen}
        onSaved={async () => {
          setCreateOpen(false);
          await mutate();
        }}
      />
      <UserSheet
        open={Boolean(editingUser)}
        user={editingUser}
        workspaces={data.workspaces}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSaved={async () => {
          setEditingUser(null);
          await mutate();
        }}
      />
    </div>
  );
}

function UsersTable({
  rows,
  onEdit,
}: {
  rows: UserTableRow[];
  onEdit: (user: UserRecord) => void;
}) {
  const columns = useMemo<ColumnDef<UserTableRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Usuário",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">
              {row.original.name ?? "Sem nome"}
            </span>
            <span className="text-xs text-zinc-500">
              {row.original.email ?? "Sem email"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Perfil",
        cell: ({ getValue }) => {
          const role = getValue() as UserRecord["role"];
          return (
            <Badge variant={role === "gestor" ? "gestor" : "associado"}>
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "default_workspace_name",
        header: "Área padrão",
      },
      {
        accessorKey: "workspace_count",
        header: "Áreas vinculadas",
      },
      {
        accessorKey: "created_at",
        header: "Criado em",
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-600">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
            <PencilLine className="mr-2 h-4 w-4" />
            Editar
          </Button>
        ),
      },
    ],
    [onEdit],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-zinc-600"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={columns.length}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-200 last:border-b-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-zinc-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
