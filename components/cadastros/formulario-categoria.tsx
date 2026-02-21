"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import type { Workspace, WorkspaceScope } from "@/lib/types";

interface FormularioCategoriaProps {
  tipo: "receita" | "despesa";
  selectedWorkspaceId: WorkspaceScope;
  workspaces: Workspace[];
  loading: boolean;
  onSubmit: (payload: {
    workspaceId: string;
    name: string;
    description?: string;
    active: boolean;
  }) => Promise<void>;
  initialData?: {
    id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    active: boolean;
  } | null;
}

export function FormularioCategoria({
  tipo,
  selectedWorkspaceId,
  workspaces,
  loading,
  onSubmit,
  initialData = null,
}: FormularioCategoriaProps) {
  const [form, setForm] = useState({
    workspaceId: "",
    name: "",
    description: "",
    active: "true",
  });
  const [error, setError] = useState<string | null>(null);
  const needsWorkspace = selectedWorkspaceId === "all";
  const workspaceOptions = useMemo(
    () => workspaces.filter((workspace) => !workspace.is_matrix),
    [workspaces],
  );
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setForm({
        workspaceId: initialData.workspace_id,
        name: initialData.name ?? "",
        description: initialData.description ?? "",
        active: initialData.active ? "true" : "false",
      });
      return;
    }

    setForm({
      workspaceId: needsWorkspace ? "" : String(selectedWorkspaceId),
      name: "",
      description: "",
      active: "true",
    });
  }, [initialData, needsWorkspace, selectedWorkspaceId]);

  async function handleSubmit() {
    try {
      setError(null);
      const workspaceId = needsWorkspace ? form.workspaceId : selectedWorkspaceId;
      if (!workspaceId || !form.name.trim()) {
        throw new Error("Preencha a área e o nome da categoria.");
      }

      await onSubmit({
        workspaceId,
        name: form.name.trim(),
        description: form.description.trim(),
        active: form.active === "true",
      });

      setForm({
        workspaceId: needsWorkspace ? form.workspaceId : "",
        name: "",
        description: "",
        active: "true",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar.");
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {needsWorkspace ? (
        <Field label="Área de atuação">
          <Select
            value={form.workspaceId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, workspaceId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              {workspaceOptions.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      <Field label={`Nome da categoria de ${tipo}`}>
        <Input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </Field>

      <Field label="Ativo">
        <Select
          value={form.active}
          onValueChange={(value) => setForm((prev) => ({ ...prev, active: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Sim</SelectItem>
            <SelectItem value="false">Não</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Descrição (Opcional)">
        <Textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Salvar categoria"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
