"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AlertCircle, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workspace } from "@/lib/types";
import {
  createWorkspace,
  deleteWorkspace,
  fetchWorkspacesForAdmin,
  updateWorkspace,
} from "@/lib/workspaces/workspaces-service";

interface WorkspaceRow extends Workspace {
  created_at: string;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AreasModule() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState<WorkspaceRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<WorkspaceRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const itemsPerPage = 10;

  const workspaces = useSWR("admin-workspaces", () => fetchWorkspacesForAdmin());

  const isEditing = Boolean(editingItem);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingItem) {
      setFormName(editingItem.name);
      setFormSlug(editingItem.slug);
    } else {
      setFormName("");
      setFormSlug("");
    }

    setFormError(null);
  }, [open, editingItem]);

  async function handleSave() {
    const name = formName.trim();
    const slug = slugify(formSlug || name);

    if (!name) {
      setFormError("Nome é obrigatório.");
      return;
    }

    if (!slug) {
      setFormError("Slug inválido.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        await updateWorkspace(editingItem.id, { name, slug });
        toast.success("Área atualizada com sucesso.");
      } else {
        await createWorkspace({ name, slug });
        toast.success("Área criada com sucesso.");
      }

      await workspaces.mutate();
      setOpen(false);
      setEditingItem(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar área.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) {
      return;
    }

    try {
      await deleteWorkspace(deleteItem.id);
      toast.success("Área excluída com sucesso.");
      await workspaces.mutate();
      setDeleteItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir área.");
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      (workspaces.data ?? []).filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.slug.toLowerCase().includes(normalizedSearch)
        );
      }),
    [workspaces.data, normalizedSearch],
  );

  const totalResults = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);
  const showingFrom = totalResults === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalResults);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (workspaces.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (workspaces.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar áreas</AlertTitle>
        <AlertDescription>{workspaces.error.message}</AlertDescription>
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
            placeholder="Buscar por nome ou slug..."
            className="pl-9"
          />
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingItem(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Área
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
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Slug</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Tipo</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-zinc-500" colSpan={4}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-200 last:border-b-0">
                    <td className="px-3 py-2 text-zinc-700">{item.name}</td>
                    <td className="px-3 py-2 font-mono text-zinc-700">{item.slug}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      {item.is_matrix ? <Badge variant="gestor">Matriz</Badge> : "Área"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!item.is_matrix ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingItem(item);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          ) : null}
                          {!item.is_matrix ? (
                            <DropdownMenuItem
                              onClick={() => setDeleteItem(item)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          ) : null}
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
            setEditingItem(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Editar Área" : "Nova Área"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Atualize os dados da área selecionada."
                : "Cadastre uma nova área de atuação para o escritório."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Nome</Label>
              <Input
                id="workspace-name"
                value={formName}
                onChange={(event) => {
                  setFormName(event.target.value);
                  if (!isEditing) {
                    setFormSlug(slugify(event.target.value));
                  }
                }}
                placeholder="Ex.: Empresarial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-slug">Slug</Label>
              <Input
                id="workspace-slug"
                value={formSlug}
                onChange={(event) => setFormSlug(slugify(event.target.value))}
                placeholder="ex.: empresarial"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Área"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirma exclusão da área?</AlertDialogTitle>
            <AlertDialogDescription>
              A exclusão só é permitida para áreas sem vínculos e sem lançamentos.
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
