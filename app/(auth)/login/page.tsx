import { LoginButton } from "@/components/login-github";

export default async function LoginPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center space-y-2 py-10">
      <LoginButton />
    </div>
  );
}
