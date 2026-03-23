import { StoreProvider } from "@/store/StoreProvider";
import { ProjectLoader } from "@/components/ProjectLoader";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "sonner";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <StoreProvider>
        <ProjectLoader>{children}</ProjectLoader>
        <Toaster position="top-center" richColors theme="system" />
      </StoreProvider>
    </AuthGuard>
  );
}
