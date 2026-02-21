"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AppRole, UserRecord, Workspace } from "@/lib/types";
import {
  createUserRecord,
  deleteUserRecord,
  updateUserRecord,
} from "@/lib/users/users-service";

interface UserSheetProps {
  open: boolean;
  user: UserRecord | null;
  workspaces: Workspace[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}

export function UserSheet({
  open,
  user,
  workspaces,
  onOpenChange,
  onSaved,
}: UserSheetProps) {
  const isEditMode = Boolean(user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("associado");
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState<string>("none");
  const [workspaceIds, setWorkspaceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPassword("");
      setRole(user.role);
      setDefaultWorkspaceId(user.default_workspace_id ?? "none");
      setWorkspaceIds(user.workspace_ids);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("associado");
      setDefaultWorkspaceId("none");
      setWorkspaceIds([]);
    }

    setError(null);
  }, [open, user]);

  const filteredWorkspaces = useMemo(
    () => workspaces.filter((workspace) => !workspace.is_matrix),
    [workspaces],
  );

  function toggleWorkspace(workspaceId: string, checked: boolean) {
    if (checked) {
      setWorkspaceIds((prev) => Array.from(new Set([...prev, workspaceId])));
      return;
    }

    setWorkspaceIds((prev) => prev.filter((id) => id !== workspaceId));
    if (defaultWorkspaceId === workspaceId) {
      setDefaultWorkspaceId("none");
    }
  }

  async function handleSave() {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setError("Nome e email são obrigatórios.");
      return;
    }

    if (!isEditMode && password.trim().length < 8) {
      setError("Senha inicial deve ter ao menos 8 caracteres.");
      return;
    }

    if (role === "associado" && workspaceIds.length === 0) {
      setError("Usuário associado precisa estar vinculado a pelo menos uma área.");
      return;
    }

    if (defaultWorkspaceId !== "none" && !workspaceIds.includes(defaultWorkspaceId)) {
      setError("A área padrão precisa estar entre as áreas vinculadas.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode && user) {
        await updateUserRecord(user.user_id, {
          name: normalizedName,
          email: normalizedEmail,
          role,
          defaultWorkspaceId: defaultWorkspaceId === "none" ? null : defaultWorkspaceId,
          workspaceIds,
          password: password.trim() ? password.trim() : undefined,
        });
      } else {
        await createUserRecord({
          name: normalizedName,
          email: normalizedEmail,
          password: password.trim(),
          role,
          defaultWorkspaceId: defaultWorkspaceId === "none" ? null : defaultWorkspaceId,
          workspaceIds,
        });
      }

      await onSaved();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar as alterações.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `Excluir o usuário ${user.email ?? user.user_id}? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteUserRecord(user.user_id);
      await onSaved();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir o usuário.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Editar usuário" : "Novo usuário"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Atualize perfil, áreas e credenciais do usuário."
              : "Crie um usuário com acesso controlado por área."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nome</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@escritorio.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              {isEditMode ? "Nova senha (opcional)" : "Senha inicial"}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isEditMode ? "Deixe vazio para manter" : "Mínimo 8 caracteres"}
            />
          </div>

          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gestor">gestor</SelectItem>
                <SelectItem value="associado">associado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Área padrão</Label>
            <Select value={defaultWorkspaceId} onValueChange={setDefaultWorkspaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem área padrão</SelectItem>
                {filteredWorkspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Áreas vinculadas</Label>
            <div className="space-y-2 rounded-md border border-zinc-200 p-3">
              {filteredWorkspaces.map((workspace) => {
                const checked = workspaceIds.includes(workspace.id);
                return (
                  <label
                    key={workspace.id}
                    className="flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        toggleWorkspace(workspace.id, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span>{workspace.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <SheetFooter className="mt-6">
          {isEditMode ? (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isDeleting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isDeleting}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? "Salvar alterações" : "Criar usuário"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
