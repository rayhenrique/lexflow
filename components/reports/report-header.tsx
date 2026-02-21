"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchFirmSettings } from "@/lib/firm-settings/fetch-firm-settings";

export function ReportHeader() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const { data } = useSWR("firm-settings-report-header", async () =>
    fetchFirmSettings(supabase),
  );

  return (
    <div className="hidden print:mb-6 print:flex print:flex-row print:items-start print:justify-between print:border-b print:border-zinc-300 print:pb-4">
      <div className="print:min-h-16 print:min-w-36">
        {data?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logo_url} alt="Logo do escritório" className="print:max-h-16 print:w-auto" />
        ) : null}
      </div>

      <div className="print:max-w-[70%] print:text-right">
        <p className="print:text-base print:font-semibold print:text-zinc-900">
          {data?.name || "Escritório"}
        </p>
        {data?.cnpj ? <p className="print:text-xs print:text-zinc-700">CNPJ: {data.cnpj}</p> : null}
        {data?.address ? (
          <p className="print:text-xs print:text-zinc-700">{data.address}</p>
        ) : null}
        <p className="print:text-xs print:text-zinc-700">
          {[data?.phone, data?.email, data?.website].filter(Boolean).join(" | ")}
        </p>
      </div>
    </div>
  );
}
