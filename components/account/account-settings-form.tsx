"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface AccountSettingsFormProps {
  userId: string;
  initialName: string;
}

export function AccountSettingsForm({ userId, initialName }: AccountSettingsFormProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [name, setName] = useState(initialName);
  const [nameState, setNameState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  async function handleSaveName() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setNameState({
        loading: false,
        error: "Informe um nome válido.",
        success: null,
      });
      return;
    }

    setNameState({ loading: true, error: null, success: null });

    const { error } = await supabase
      .from("profiles")
      .update({ name: normalizedName })
      .eq("user_id", userId);

    if (error) {
      setNameState({
        loading: false,
        error: "Não foi possível salvar o nome.",
        success: null,
      });
      return;
    }

    setNameState({
      loading: false,
      error: null,
      success: "Nome atualizado com sucesso.",
    });
    router.refresh();
  }

  async function handleChangePassword() {
    if (password.length < 8) {
      setPasswordState({
        loading: false,
        error: "A nova senha deve ter pelo menos 8 caracteres.",
        success: null,
      });
      return;
    }

    if (password !== confirmPassword) {
      setPasswordState({
        loading: false,
        error: "A confirmação da senha não confere.",
        success: null,
      });
      return;
    }

    setPasswordState({ loading: true, error: null, success: null });

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordState({
        loading: false,
        error: "Não foi possível alterar a senha.",
        success: null,
      });
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordState({
      loading: false,
      error: null,
      success: "Senha alterada com sucesso.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="account-name">Nome</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
        />
        {nameState.error ? <p className="text-sm text-rose-600">{nameState.error}</p> : null}
        {nameState.success ? (
          <p className="text-sm text-emerald-600">{nameState.success}</p>
        ) : null}
        <Button onClick={handleSaveName} disabled={nameState.loading}>
          {nameState.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar nome
        </Button>
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-5">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo de 8 caracteres"
        />
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a nova senha"
        />
        {passwordState.error ? (
          <p className="text-sm text-rose-600">{passwordState.error}</p>
        ) : null}
        {passwordState.success ? (
          <p className="text-sm text-emerald-600">{passwordState.success}</p>
        ) : null}
        <Button onClick={handleChangePassword} disabled={passwordState.loading}>
          {passwordState.loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Alterar senha
        </Button>
      </div>
    </div>
  );
}
