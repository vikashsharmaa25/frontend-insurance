"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Executive Dashboard",
  "/admin/plans": "Insurance Plans",
  "/admin/masters": "Master Data Center",
  "/admin/matrix": "Plan Coverage Matrix",
  "/admin/tabulation": "Plan Tabulation & Policy Matrix",
  "/admin/rate-cards": "Premium Rates & Bulk Excel",
  "/admin/applications": "Customer Applications Review",
};

export function AdminHeader({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const title = pageTitles[pathname] || "Admin Portal";

  const getInitials = (name?: string) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fullName = user?.name || user?.email || "Admin User";


  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-600 hover:text-slate-900"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Page Title & Breadcrumbs */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Insurance Admin</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-orange-600 font-semibold">{title}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Mock input */}
        {/* <div className="relative hidden md:block w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
          <Input
            type="text"
            placeholder="Quick search..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-100 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-orange-500"
          />
        </div> */}

        {/* Notifications */}
        {/* <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        </button> */}

        <div className="h-6 w-px bg-slate-200" />

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-orange-200 ring-2 ring-orange-500/10">
            <AvatarFallback className="bg-linear-to-br from-orange-600 to-amber-600 text-white font-bold text-xs">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">
                {fullName}
              </span>
              <Badge variant="outline" className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-orange-100 text-orange-700 border-orange-200 uppercase">
                {user?.role || "ADMIN"}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 truncate max-w-37.5">
              {user?.email || user?.phone || "admin@insurance.com"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Logout"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition rounded-lg ml-1"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
