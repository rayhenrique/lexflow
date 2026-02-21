"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileChartColumn,
  FolderKanban,
  LayoutGrid,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/providers/workspace-provider";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: FileChartColumn,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useWorkspace();
  const financeiroOpen = pathname.startsWith("/financeiro");
  const cadastrosOpen = pathname.startsWith("/cadastros");
  const administracaoOpen = pathname.startsWith("/administracao");

  return (
    <aside className="hidden w-64 border-r border-zinc-200 bg-white lg:flex lg:flex-col print:hidden">
      <div className="px-5 py-5">
        <Logo />
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Micro-ERP Jurídico
        </p>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-2 space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              financeiroOpen ? "bg-zinc-100 text-zinc-900" : "text-zinc-500",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Financeiro</span>
          </div>

          <Link
            href="/financeiro/receitas"
            className={cn(
              "ml-6 block rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith("/financeiro/receitas")
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            Receitas
          </Link>

          <Link
            href="/financeiro/despesas"
            className={cn(
              "ml-6 block rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith("/financeiro/despesas")
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            Despesas
          </Link>
        </div>

        <div className="mt-2 space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              cadastrosOpen ? "bg-zinc-100 text-zinc-900" : "text-zinc-500",
            )}
          >
            <FolderKanban className="h-4 w-4" />
            <span>Cadastros</span>
          </div>

          <Link
            href="/cadastros/clientes"
            className={cn(
              "ml-6 block rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith("/cadastros/clientes")
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            Clientes
          </Link>

          <Link
            href="/cadastros/categorias"
            className={cn(
              "ml-6 block rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith("/cadastros/categorias")
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            Categorias
          </Link>
        </div>

        {role === "gestor" ? (
          <div className="mt-2 space-y-1">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                administracaoOpen ? "bg-zinc-100 text-zinc-900" : "text-zinc-500",
              )}
            >
              <Shield className="h-4 w-4" />
              <span>Administração</span>
            </div>

            <Link
              href="/administracao/auditoria"
              className={cn(
                "ml-6 block rounded-md px-3 py-1.5 text-sm transition-colors",
                pathname.startsWith("/administracao/auditoria")
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              Auditoria
            </Link>

            <Link
              href="/administracao/backup"
              className={cn(
                "ml-6 block rounded-md px-3 py-1.5 text-sm transition-colors",
                pathname.startsWith("/administracao/backup")
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              Backup
            </Link>

            <Link
              href="/administracao/configuracoes"
              className={cn(
                "ml-6 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                pathname.startsWith("/administracao/configuracoes")
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configurações
            </Link>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
