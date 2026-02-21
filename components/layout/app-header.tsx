"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  FileChartColumn,
  LayoutGrid,
  LogOut,
  Menu,
  Settings2,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    role,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    userName,
    userEmail,
    workspaces,
  } = useWorkspace();

  const displayName =
    userName?.trim() || userEmail?.split("@")[0] || "Usuário";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    ...(role === "gestor"
      ? [{ href: "/usuarios", label: "Usuários", icon: Users }]
      : []),
    { href: "/relatorios", label: "Relatórios", icon: FileChartColumn },
  ];

  function getHeaderByPath(path: string) {
    if (path === "/dashboard") {
      return {
        section: "Painel",
        title: "Dashboard Financeiro",
      };
    }

    if (path === "/usuarios") {
      return {
        section: "Configurações",
        title: "Usuários",
      };
    }

    if (path === "/relatorios") {
      return {
        section: "Relatórios",
        title: "Hub de Relatórios",
      };
    }

    if (path === "/relatorios/receitas") {
      return {
        section: "Relatórios",
        title: "Relatório de Receitas",
      };
    }

    if (path === "/relatorios/despesas") {
      return {
        section: "Relatórios",
        title: "Relatório de Despesas",
      };
    }

    if (path === "/relatorios/balanco") {
      return {
        section: "Relatórios",
        title: "Relatório de Balanço",
      };
    }

    if (path === "/relatorios/inadimplencia") {
      return {
        section: "Relatórios",
        title: "Relatório de Inadimplência",
      };
    }

    if (path === "/financeiro/receitas") {
      return {
        section: "Financeiro",
        title: "Receitas",
      };
    }

    if (path === "/financeiro/despesas") {
      return {
        section: "Financeiro",
        title: "Despesas",
      };
    }

    if (path === "/cadastros/clientes") {
      return {
        section: "Cadastros",
        title: "Clientes",
      };
    }

    if (path === "/cadastros/categorias") {
      return {
        section: "Cadastros",
        title: "Categorias",
      };
    }

    if (path === "/administracao/auditoria") {
      return {
        section: "Administração",
        title: "Auditoria",
      };
    }

    if (path === "/administracao/backup") {
      return {
        section: "Administração",
        title: "Backup e Restauração",
      };
    }

    if (path === "/administracao/configuracoes") {
      return {
        section: "Administração",
        title: "Configurações",
      };
    }

    return {
      section: "Painel",
      title: "Dashboard Financeiro",
    };
  }

  const header = getHeaderByPath(pathname);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleMobileNavClick() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur print:hidden">
      <div className="flex h-16 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleMobileNavClick}
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
                </nav>

                <div className="space-y-1">
                  <p className="px-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Financeiro
                  </p>
                  <Link
                    href="/financeiro/receitas"
                    onClick={handleMobileNavClick}
                    className={cn(
                      "ml-3 block rounded-md px-3 py-1.5 text-sm transition-colors",
                      pathname.startsWith("/financeiro/receitas")
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    Receitas
                  </Link>
                  <Link
                    href="/financeiro/despesas"
                    onClick={handleMobileNavClick}
                    className={cn(
                      "ml-3 block rounded-md px-3 py-1.5 text-sm transition-colors",
                      pathname.startsWith("/financeiro/despesas")
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    Despesas
                  </Link>
                </div>

                <div className="space-y-1">
                  <p className="px-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Cadastros
                  </p>
                  <Link
                    href="/cadastros/clientes"
                    onClick={handleMobileNavClick}
                    className={cn(
                      "ml-3 block rounded-md px-3 py-1.5 text-sm transition-colors",
                      pathname.startsWith("/cadastros/clientes")
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    Clientes
                  </Link>
                  <Link
                    href="/cadastros/categorias"
                    onClick={handleMobileNavClick}
                    className={cn(
                      "ml-3 block rounded-md px-3 py-1.5 text-sm transition-colors",
                      pathname.startsWith("/cadastros/categorias")
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    Categorias
                  </Link>
                </div>

                {role === "gestor" ? (
                  <div className="space-y-1">
                    <p className="px-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Administração
                    </p>
                    <Link
                      href="/administracao/auditoria"
                      onClick={handleMobileNavClick}
                      className={cn(
                        "ml-3 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                        pathname.startsWith("/administracao/auditoria")
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Auditoria
                    </Link>
                    <Link
                      href="/administracao/backup"
                      onClick={handleMobileNavClick}
                      className={cn(
                        "ml-3 block rounded-md px-3 py-1.5 text-sm transition-colors",
                        pathname.startsWith("/administracao/backup")
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      Backup
                    </Link>
                    <Link
                      href="/administracao/configuracoes"
                      onClick={handleMobileNavClick}
                      className={cn(
                        "ml-3 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
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
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {header.section}
            </p>
            <h2 className="truncate text-base font-semibold text-zinc-900">
              {header.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {role === "gestor" ? (
            <div className="w-[140px] sm:w-[210px]">
              <Select
                value={selectedWorkspaceId}
                onValueChange={(value) => setSelectedWorkspaceId(value)}
              >
                <SelectTrigger className="max-w-[150px] sm:max-w-none">
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Áreas (Matriz)</SelectItem>
                  {workspaces
                    .filter((workspace) => !workspace.is_matrix)
                    .map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserRound className="h-4 w-4 text-zinc-500" />
                <span className="hidden max-w-48 truncate text-sm text-zinc-700 sm:inline-block">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="max-w-64 truncate">
                {userEmail ?? "Conta"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/conta")}>
                <UserRound className="mr-2 h-4 w-4" />
                Conta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
