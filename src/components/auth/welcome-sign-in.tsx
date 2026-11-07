"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignInModal, shouldAutoOpenSignInModal } from "@/components/auth/sign-in-modal";

/** Opens the sign-in modal on first free-forge visit; dismissible to continue guest. */
export function WelcomeSignIn() {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const welcome = params.get("welcome") === "1";
    if (welcome || shouldAutoOpenSignInModal()) {
      setOpen(true);
    }
  }, [params]);

  return <SignInModal open={open} onOpenChange={setOpen} freeHref="/learn" />;
}
