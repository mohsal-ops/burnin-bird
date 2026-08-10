import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import {
  EmailChangeStatusToast,
  NameForm,
  EmailForm,
  PasswordForm,
} from "./_components/ProfileForms";

export default async function ProfilePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");

  // Only pass the fields the client actually needs - never ship
  // passwordHash/verificationToken to the browser.
  const safeAdmin = {
    name: admin.name,
    email: admin.email,
    pendingEmail: admin.pendingEmail,
  };

  return (
    <div className="flex w-full justify-center">
      <div className="min-h-screen bg-stone-50 p-6 space-y-8 w-full md:max-w-xl">
        <Suspense fallback={null}>
          <EmailChangeStatusToast />
        </Suspense>

        <div>
          <h1 className="text-2xl font-bold text-stone-900">Your profile</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage your name, sign-in email, and password.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            Name
          </h2>
          <NameForm admin={safeAdmin} />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            Email
          </h2>
          <EmailForm admin={safeAdmin} />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            Password
          </h2>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
