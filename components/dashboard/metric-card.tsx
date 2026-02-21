import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  accentClassName?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  accentClassName = "text-zinc-900",
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <div className={accentClassName}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className={["text-2xl font-semibold", accentClassName].join(" ")}>{value}</p>
      </CardContent>
    </Card>
  );
}
