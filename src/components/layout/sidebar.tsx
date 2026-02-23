"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  PoundSterling,
  Store,
  Grid3X3,
  FileText,
  Bell,
  Settings,
  LogOut,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Timeline", href: "/dashboard/timeline", icon: Calendar },
  { name: "Guests", href: "/dashboard/guests", icon: Users },
  { name: "Budget", href: "/dashboard/budget", icon: PoundSterling },
  { name: "Vendors", href: "/dashboard/vendors", icon: Store },
  { name: "Seating", href: "/dashboard/seating", icon: Grid3X3 },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
];

const secondaryNavigation = [
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  weddingName?: string;
  weddingDate?: string;
}

export function Sidebar({ weddingName = "Your Wedding", weddingDate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-serif text-lg font-semibold">{weddingName}</span>
      </div>

      {weddingDate && (
        <div className="border-b px-6 py-3">
          <p className="text-xs text-muted-foreground">Wedding Date</p>
          <p className="text-sm font-medium">{weddingDate}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
