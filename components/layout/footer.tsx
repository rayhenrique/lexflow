import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 py-6 print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-1 px-4 text-center text-xs text-zinc-500 md:flex-row md:gap-2 sm:px-6 lg:px-8">
        <span>© {currentYear} {APP_NAME} - Simples. Seguro. Jurídico. | Desenvolvido por</span>
        <Link
          href="https://kltecnologia.com"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        >
          KL Tecnologia
        </Link>
      </div>
    </footer>
  );
}
