"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardPeriodicity } from "@/lib/dashboard/fetch-dashboard-overview";

interface DashboardFilterBarProps {
  selectedYear: number;
  yearOptions: number[];
  selectedPeriodicity: DashboardPeriodicity;
  lastUpdatedAt: Date | null;
  isRefreshing: boolean;
  onYearChange: (value: number) => void;
  onPeriodicityChange: (value: DashboardPeriodicity) => void;
  onRefresh: () => void;
}

const PERIODICITY_OPTIONS: Array<{
  value: DashboardPeriodicity;
  label: string;
}> = [
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "quadrimestral", label: "Quadrimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function DashboardFilterBar({
  selectedYear,
  yearOptions,
  selectedPeriodicity,
  lastUpdatedAt,
  isRefreshing,
  onYearChange,
  onPeriodicityChange,
  onRefresh,
}: DashboardFilterBarProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-[140px]">
            <Select value={String(selectedYear)} onValueChange={(value) => onYearChange(Number(value))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[200px]">
            <Select value={selectedPeriodicity} onValueChange={onPeriodicityChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Periodicidade" />
              </SelectTrigger>
              <SelectContent>
                {PERIODICITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          <span className="text-sm text-zinc-500">
            Atualizado: {lastUpdatedAt ? timeFormatter.format(lastUpdatedAt) : "--:--:--"}
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}

