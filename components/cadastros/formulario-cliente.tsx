"use client";

import { useEffect, useState } from "react";
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

interface FormularioClienteProps {
  selectedWorkspaceId: WorkspaceScope;
  workspaces: Workspace[];
  loading: boolean;
  onSubmit: (payload: {
    workspaceId: string;
    name: string;
    cpf?: string;
    phone?: string;
    address?: string;
    processNumber?: string;
    notes?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    workspace_id: string;
    name: string;
    cpf: string | null;
    phone: string | null;
    address: string | null;
    process_number: string | null;
    notes: string | null;
  } | null;
}

export function FormularioCliente({
  selectedWorkspaceId,
  workspaces,
  loading,
  onSubmit,
  initialData = null,
}: FormularioClienteProps) {
  const [form, setForm] = useState({
    workspaceId: "",
    name: "",
    cpf: "",
    phone: "",
    address: "",
    processNumber: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const needsWorkspace = selectedWorkspaceId === "all";
  const workspaceOptions = workspaces.filter((workspace) => !workspace.is_matrix);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setForm({
        workspaceId: initialData.workspace_id,
        name: initialData.name ?? "",
        cpf: initialData.cpf ?? "",
        phone: initialData.phone ?? "",
        address: initialData.address ?? "",
        processNumber: initialData.process_number ?? "",
        notes: initialData.notes ?? "",
      });
      return;
    }

    setForm({
      workspaceId: needsWorkspace ? "" : String(selectedWorkspaceId),
      name: "",
      cpf: "",
      phone: "",
      address: "",
      processNumber: "",
      notes: "",
    });
  }, [initialData, needsWorkspace, selectedWorkspaceId]);

  async function handleSubmit() {
    try {
      setError(null);
      const workspaceId = needsWorkspace ? form.workspaceId : selectedWorkspaceId;

      if (!workspaceId || !form.name.trim()) {
        throw new Error("Preencha a área e o nome do cliente.");
      }

      await onSubmit({
        workspaceId,
        name: form.name.trim(),
        cpf: form.cpf.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        processNumber: form.processNumber.trim(),
        notes: form.notes.trim(),
      });

      setForm({
        workspaceId: needsWorkspace ? form.workspaceId : "",
        name: "",
        cpf: "",
        phone: "",
        address: "",
        processNumber: "",
        notes: "",
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

      <Field label="Nome">
        <Input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </Field>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="CPF">
          <Input
            value={form.cpf}
            onChange={(event) => setForm((prev) => ({ ...prev, cpf: event.target.value }))}
          />
        </Field>
        <Field label="Telefone">
          <Input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </Field>
      </div>

      <Field label="Endereço">
        <Input
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
        />
      </Field>

      <Field label="Nº Processo / Ação">
        <Input
          value={form.processNumber}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, processNumber: event.target.value }))
          }
        />
      </Field>

      <Field label="Observação">
        <Textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </Field>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar cliente"}
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
