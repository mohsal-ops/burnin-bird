"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const VERIFY_MESSAGES: Record<string, { type: "success" | "error"; message: string }> = {
  "first-admin": {
    type: "success",
    message: "Email verified - you're the first admin, so you're approved. Sign in below.",
  },
  "pending-approval": {
    type: "success",
    message: "Email verified. An existing admin needs to approve your account before you can sign in.",
  },
  invalid: {
    type: "error",
    message: "That verification link is invalid or has expired.",
  },
};

function LoginPageInner() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupSent, setSignupSent] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify && VERIFY_MESSAGES[verify]) {
      const { type, message } = VERIFY_MESSAGES[verify];
      if (type === "success") toast.success(message);
      else toast.error(message);
    }
  }, [searchParams]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Welcome back!", { description: "Redirecting to dashboard..." });
        setTimeout(() => router.push("/admin"), 800);
      } else {
        toast.error(data.error ?? "Invalid email or password");
        setPassword("");
      }
    });
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSignupSent(true);
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
    });
  }

  if (signupSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-background" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to <strong>{email}</strong>. Click it to
            confirm your account, then sign in once an existing admin approves it.
          </p>
          <Button variant="outline" className="w-full" onClick={() => { setSignupSent(false); setMode("login"); }}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
              <Lock className="w-5 h-5 text-background" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to continue" : "Create an admin account"}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              aria-label="Email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                aria-label="Password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={isPending || !email || !password}>
              {isPending ? "Checking..." : "Sign in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              aria-label="Full name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
            <Input
              type="email"
              aria-label="Email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              aria-label="Password, minimum 8 characters"
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !name || !email || password.length < 8}
            >
              {isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "login"
            ? "Need an admin account? Request access"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
