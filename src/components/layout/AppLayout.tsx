import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 flex items-center border-b px-3 sm:px-4 bg-card">
            <SidebarTrigger className="mr-3 sm:mr-4" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">PT App</h2>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto pb-20 sm:pb-6">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
