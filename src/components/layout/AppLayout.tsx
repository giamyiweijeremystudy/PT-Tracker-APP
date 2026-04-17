import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 flex items-center border-b border-border px-3 sm:px-4 bg-card/95 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="mr-3 sm:mr-4" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">PT App</h2>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 20px))" }} className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
