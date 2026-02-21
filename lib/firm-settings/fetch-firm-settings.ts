import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRM_SETTINGS_ID } from "@/lib/constants";

export interface FirmSettings {
  id: string;
  name: string | null;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  updated_at: string;
}

export async function fetchFirmSettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("firm_settings")
    .select("id, name, cnpj, address, phone, email, website, logo_url, updated_at")
    .eq("id", FIRM_SETTINGS_ID)
    .maybeSingle<FirmSettings>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
