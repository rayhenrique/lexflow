"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ClassificationRecord,
  ClientRecord,
  TransactionStatus,
  Workspace,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface FormularioReceitaProps {
  selectedWorkspaceId: string | "all";
  workspaces: Workspace[];
  classifications: ClassificationRecord[];
  clients: ClientRecord[];
  loading: boolean;
  onSubmit: (payload: {
    workspaceId: string;
    clientId: string | null;
    description: string;
    amount: number;
    occurredOn: string;
    classificationId: string;
    status: TransactionStatus;
    notes?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    workspace_id: string;
    client_id: string | null;
    description: string;
    amount: number;
    occurred_on: string;
    classification_id: string;
    status: TransactionStatus;
    notes: string | null;
  } | null;
}

export function FormularioReceita({
  selectedWorkspaceId,
  workspaces,
  classifications,
  clients,
  loading,
  onSubmit,
  initialData = null,
}: FormularioReceitaProps) {
  const workspacesOptions = useMemo(
    () => workspaces.filter((workspace) => !workspace.is_matrix),
    [workspaces],
  );
  const [form, setForm] = useState({
    workspaceId: "",
    clientId: "none",
    description: "",
    amount: null as number | null,
    occurredOn: new Date().toISOString().slice(0, 10),
    classificationId: "",
    status: "pendente" as TransactionStatus,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initialData);
  const [classificationOpen, setClassificationOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);

  const needsWorkspace = selectedWorkspaceId === "all";
  const selectedClassification = classifications.find(
    (item) => item.id === form.classificationId,
  );
  const selectedClient = clients.find((item) => item.id === form.clientId);

  useEffect(() => {
    if (initialData) {
      setForm({
        workspaceId: initialData.workspace_id,
        clientId: initialData.client_id ?? "none",
        description: initialData.description ?? "",
        amount: Number(initialData.amount),
        occurredOn: initialData.occurred_on,
        classificationId: initialData.classification_id,
        status: initialData.status,
        notes: initialData.notes ?? "",
      });
      return;
    }

    setForm({
      workspaceId: "",
      clientId: "none",
      description: "",
      amount: null,
      occurredOn: new Date().toISOString().slice(0, 10),
      classificationId: "",
      status: "pendente",
      notes: "",
    });
  }, [initialData]);

  async function handleSubmit() {
    try {
      setError(null);
      const workspaceId = needsWorkspace ? form.workspaceId : selectedWorkspaceId;
      const amount = form.amount;

      if (
        !workspaceId ||
        !form.description.trim() ||
        !form.classificationId ||
        !form.occurredOn ||
        amount === null
      ) {
        throw new Error("Preencha os campos obrigatórios da receita.");
      }

      await onSubmit({
        workspaceId,
        clientId: form.clientId === "none" ? null : form.clientId,
        description: form.description.trim(),
        amount: Number(amount),
        occurredOn: form.occurredOn,
        classificationId: form.classificationId,
        status: form.status,
        notes: form.notes.trim(),
      });

      setForm({
        workspaceId: needsWorkspace ? form.workspaceId : "",
        clientId: "none",
        description: "",
        amount: null,
        occurredOn: new Date().toISOString().slice(0, 10),
        classificationId: "",
        status: "pendente",
        notes: "",
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Não foi possível cadastrar receita.",
      );
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
              {workspacesOptions.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      <Field label="Descrição">
        <Input
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>

      <Field label="Valor">
        <MoneyInput
          value={form.amount}
          onValueChange={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          placeholder="R$ 0,00"
        />
      </Field>

      <Field label="Data">
        <Input
          type="date"
          value={form.occurredOn}
          onChange={(event) =>
            setForm((prev) => {
              const nextDate = event.target.value;
              const today = new Date().toISOString().slice(0, 10);
              const shouldSetPending = nextDate > today && prev.status === "pago";

              return {
                ...prev,
                occurredOn: nextDate,
                status: shouldSetPending ? "pendente" : prev.status,
              };
            })
          }
        />
      </Field>

      <Field label="Classificação da Receita">
        <Popover open={classificationOpen} onOpenChange={setClassificationOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={classificationOpen}
              className="w-full justify-between font-normal"
            >
              {selectedClassification
                ? `${selectedClassification.code} - ${selectedClassification.name}`
                : "Selecione uma classificação..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Buscar classificação..." />
              <CommandList>
                <CommandEmpty>Nenhuma classificação encontrada.</CommandEmpty>
                <CommandGroup>
                  {classifications
                    .filter((item) => item.active)
                    .map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.code} ${item.name}`}
                        onSelect={() => {
                          setForm((prev) => ({ ...prev, classificationId: item.id }));
                          setClassificationOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            form.classificationId === item.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {item.code} - {item.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Field>

      <Field label="Cliente (Opcional)">
        <Popover open={clientOpen} onOpenChange={setClientOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={clientOpen}
              className="w-full justify-between font-normal"
            >
              {form.clientId === "none"
                ? "Selecione um cliente..."
                : (selectedClient?.name ?? "Selecione um cliente...")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandList>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="Sem cliente"
                    onSelect={() => {
                      setForm((prev) => ({ ...prev, clientId: "none" }));
                      setClientOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        form.clientId === "none" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Limpar seleção
                  </CommandItem>
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.name}
                      onSelect={() => {
                        setForm((prev) => ({ ...prev, clientId: client.id }));
                        setClientOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.clientId === client.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {client.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Field>

      <Field label="Status">
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, status: value as TransactionStatus }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Observação">
        <Textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </Field>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar receita"}
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
