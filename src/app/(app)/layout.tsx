import { StoreProvider } from "@/store/StoreProvider";
import { ProjectLoader } from "@/components/ProjectLoader";
import { Toaster } from "sonner";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoreProvider>
      <ProjectLoader>{children}</ProjectLoader>
      <Toaster position="bottom-center" richColors />
    </StoreProvider>
  );
}
