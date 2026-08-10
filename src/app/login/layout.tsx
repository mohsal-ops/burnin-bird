import { Toaster } from "@/components/ui/sonner";

// This layout is OUTSIDE /admin so the admin navbar never appears here
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster richColors closeButton />
    </>
  );
}