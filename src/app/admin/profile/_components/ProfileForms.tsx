"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateName, requestEmailChange, changePassword } from "../_actions/profileActions";

type Admin = { name: string; email: string; pendingEmail: string | null };

export function EmailChangeStatusToast() {
  const searchParams = useSearchParams();
  const status = searchParams.get("emailChange");

  useEffect(() => {
    if (status === "success") toast.success("Email updated - sign in with your new email next time.");
    if (status === "invalid") toast.error("That confirmation link is invalid or has expired.");
  }, [status]);

  return null;
}

export function NameForm({ admin }: { admin: Admin }) {
  const [name, setName] = useState(admin.name);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateName(name);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="admin-name">Full name</Label>
        <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <Button type="submit" size="sm" disabled={isPending || name.trim() === admin.name}>
        {isPending ? "Saving..." : "Save name"}
      </Button>
    </form>
  );
}

export function EmailForm({ admin }: { admin: Admin }) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestEmailChange(email);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.message);
        setEmail("");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Current sign-in email</Label>
        <p className="text-sm text-stone-600">{admin.email}</p>
        {admin.pendingEmail && (
          <p className="text-xs text-amber-600 mt-1">
            Confirmation pending for <strong>{admin.pendingEmail}</strong> - check that inbox.
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="admin-new-email">New email</Label>
          <Input
            id="admin-new-email"
            type="email"
            placeholder="new@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending || !email}>
          {isPending ? "Sending..." : "Send confirmation email"}
        </Button>
      </form>
    </div>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    startTransition(async () => {
      const res = await changePassword(currentPassword, newPassword);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={isPending || !currentPassword || newPassword.length < 8}
      >
        {isPending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
