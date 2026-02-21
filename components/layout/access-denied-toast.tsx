"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function AccessDeniedToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    const denied = searchParams.get("denied");

    if (denied !== "1" || handledRef.current) {
      return;
    }

    handledRef.current = true;
    toast.error("Acesso negado");
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
