"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { AlertCircle, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FormularioCliente } from "@/components/cadastros/formulario-cliente";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createClientRecord, fetchClients } from "@/lib/modules/cadastros-financeiro-service";
import type { ClientRecord } from "@/lib/types";

export function ClientesModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId, workspaces } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [deleteClient, setDeleteClient] = useState<ClientRecord | null>(null);
  const itemsPerPage = 10;

  const clients = useSWR(["clients", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchClients(supabase, workspaceScope),
  );

  async function handleSubmit(payload: {
    workspaceId: string;
    name: string;
    cpf?: string;
    phone?: string;
    address?: string;
    processNumber?: string;
    notes?: string;
  }) {
    setSaving(true);
    setFormError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sessão inválida.");
      }

      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update({
            workspace_id: payload.workspaceId,
            name: payload.name,
            cpf: payload.cpf || null,
            phone: payload.phone || null,
            address: payload.address || null,
            process_number: payload.processNumber || null,
            notes: payload.notes || null,
          })
          .eq("id", editingClient.id);

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Cliente atualizado com sucesso.");
      } else {
        await createClientRecord(supabase, {
          ...payload,
          userId: user.id,
        });
        toast.success("Cliente criado com sucesso.");
      }

      await clients.mutate();
      setOpen(false);
      setEditingClient(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar cliente.");
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteClient) {
      return;
    }

    try {
      const { error } = await supabase.from("clients").delete().eq("id", deleteClient.id);
      if (error) {
        throw new Error(error.message);
      }
      toast.success("Cliente excluído com sucesso.");
      await clients.mutate();
      setDeleteClient(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir cliente.");
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredClients = (clients.data ?? []).filter((item) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedSearch) ||
      (item.cpf ?? "").toLowerCase().includes(normalizedSearch)
    );
  });
  const totalResults = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  const showingFrom = totalResults === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalResults);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedWorkspaceId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (clients.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (clients.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar clientes</AlertTitle>
        <AlertDescription>{clients.error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="pl-9"
          />
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingClient(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Nome</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">CPF</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Telefone</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Processo</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-zinc-500" colSpan={5}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-200 last:border-b-0">
                    <td className="px-3 py-2 text-zinc-700">{item.name}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.cpf ?? "-"}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.phone ?? "-"}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.process_number ?? "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingClient(item);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteClient(item)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 px-2 py-1 sm:flex-row sm:items-center">
        <p className="text-sm text-zinc-500">
          Mostrando {showingFrom} a {showingTo} de {totalResults} resultados
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage <= 1}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage >= totalPages}
          >
            Próximo
          </Button>
        </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setEditingClient(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</SheetTitle>
            <SheetDescription>
              {editingClient
                ? "Atualize os dados do cliente selecionado."
                : "Cadastre um cliente sem perder o contexto da tabela."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5">
            <FormularioCliente
              selectedWorkspaceId={selectedWorkspaceId}
              workspaces={workspaces}
              loading={saving}
              initialData={editingClient}
              onSubmit={handleSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleteClient)} onOpenChange={(open) => !open && setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absolutamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá permanentemente este registro do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
