"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIRM_SETTINGS_ID } from "@/lib/constants";
import { fetchFirmSettings } from "@/lib/firm-settings/fetch-firm-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface SettingsFormState {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
}

const initialState: SettingsFormState = {
  name: "",
  cnpj: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo_url: "",
};

export function ConfiguracoesModule() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<SettingsFormState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    let active = true;

    fetchFirmSettings(supabase)
      .then((settings) => {
        if (!active || !settings) {
          return;
        }

        setForm({
          name: settings.name ?? "",
          cnpj: settings.cnpj ?? "",
          address: settings.address ?? "",
          phone: settings.phone ?? "",
          email: settings.email ?? "",
          website: settings.website ?? "",
          logo_url: settings.logo_url ?? "",
        });
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar configurações.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const extension = file.name.split(".").pop() ?? "png";
      const filePath = `firm-logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from("logos").getPublicUrl(filePath);
      const logoUrl = data.publicUrl;

      setForm((prev) => ({ ...prev, logo_url: logoUrl }));
      toast.success("Logo enviada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: FIRM_SETTINGS_ID,
        name: form.name || null,
        cnpj: form.cnpj || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        logo_url: form.logo_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("firm_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Configurações salvas com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-zinc-500">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Escritório</CardTitle>
        <CardDescription>
          Essas informações serão exibidas nos relatórios exportados em PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Escritório</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={form.cnpj}
                onChange={(event) => setForm((prev) => ({ ...prev, cnpj: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleLogoUpload(file);
                }
              }}
            />

            {uploadingLogo ? (
              <p className="text-xs text-zinc-500">Enviando logo...</p>
            ) : null}

            {form.logo_url ? (
              <div className="rounded-md border border-zinc-200 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo_url} alt="Logo do escritório" className="max-h-16 w-auto" />
              </div>
            ) : null}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saving || uploadingLogo}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
