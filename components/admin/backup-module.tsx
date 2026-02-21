"use client";

import { useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface RestoreResponse {
  message?: string;
  summary?: Record<string, unknown>;
}

function buildExportUrl(workspaceId: string | "all") {
  const url = new URL("/api/backup/export", window.location.origin);

  if (workspaceId !== "all") {
    url.searchParams.set("workspaceId", workspaceId);
  }

  return url.toString();
}

export function BackupModule() {
  const { selectedWorkspaceId } = useWorkspace();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = buildExportUrl(selectedWorkspaceId);
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Backup gerado. O download foi iniciado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar backup.");
    } finally {
      setExporting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo JSON para restaurar.");
      return;
    }

    setRestoring(true);
    try {
      const fileContent = await selectedFile.text();
      const parsed = JSON.parse(fileContent) as unknown;

      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: parsed }),
      });

      const data = (await response.json().catch(() => null)) as RestoreResponse | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Falha ao iniciar restauração.");
      }

      toast.success(data?.message ?? "Restauração iniciada com sucesso.");
      setSelectedFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar restauração.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Exportar Dados (Backup)</CardTitle>
          <CardDescription>
            Faça o download completo dos dados do seu escritório em formato JSON criptografado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Gerar Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurar Dados</CardTitle>
          <CardDescription>
            Atenção! A restauração sobrepõe os dados atuais. Faça o upload do arquivo JSON de
            backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept=".json,application/json"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <Button type="button" onClick={handleRestore} disabled={restoring}>
            {restoring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Iniciar Restauração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
