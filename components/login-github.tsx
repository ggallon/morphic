"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { IconGitHub } from "@/components/icons/github";
import { IconSpinner } from "@/components/icons/spinner";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true);
        signIn("github", { callbackUrl });
      }}
      disabled={isLoading}
    >
      {isLoading ? (
        <IconSpinner className="mr-2" />
      ) : (
        <IconGitHub className="mr-2" />
      )}
      Login with GitHub
    </Button>
  );
}
