import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  hideText?: boolean;
  className?: string;
}

export function Logo({ hideText = false, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`.trim()}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-zinc-800 to-zinc-950 text-sm font-bold tracking-tighter text-white">
        LF
      </div>
      {!hideText ? (
        <span className="text-lg font-semibold tracking-tight text-zinc-900">{APP_NAME}</span>
      ) : null}
    </div>
  );
}
