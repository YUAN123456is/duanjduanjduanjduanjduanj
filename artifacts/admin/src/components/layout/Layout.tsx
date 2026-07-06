import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Link } from "wouter";
import { Film } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Film size={18} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">DramaVerse</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
