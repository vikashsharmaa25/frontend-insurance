"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Layers,
  Database,
  Grid2X2,
  FileText,
  BadgePercent,
  ClipboardList,
  Table,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Insurance Plans",
    href: "/admin/plans",
    icon: Layers,
    badge: "Core",
  },
  {
    title: "Master Data Center",
    href: "/admin/masters",
    icon: Database,
  },
  {
    title: "Coverage Matrix",
    href: "/admin/matrix",
    icon: Grid2X2,
  },
  {
    title: "Plan Tabulation",
    href: "/admin/tabulation",
    icon: Table,
    badge: "Matrix",
  },
  {
    title: "Rate Cards & Excel",
    href: "/admin/rate-cards",
    icon: BadgePercent,
    badge: "Excel",
  },
  {
    title: "Applications",
    href: "/admin/applications",
    icon: ClipboardList,
  },
];

export function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 shrink-0 z-40 w-68 border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between shadow-xs select-none",
        isOpen ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl shadow-orange-500/10" : "fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand Header (Fixed at top of sidebar) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="h-16 shrink-0 flex items-center px-5 border-b border-slate-100 justify-between bg-white sticky top-0 z-10">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-600 via-amber-500 to-orange-400 p-px shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                Insurance <span className="text-orange-600">Portal</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Insurance Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-5 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 whitespace-nowrap">
            Main Management
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group whitespace-nowrap",
                    isActive
                      ? "text-orange-700 font-bold bg-orange-50/80 border border-orange-200/80 shadow-xs shadow-orange-500/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSideNav"
                      className="absolute left-0 w-1.5 h-6 bg-linear-to-b from-orange-500 to-amber-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-orange-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="whitespace-nowrap tracking-tight">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.badge && (
                      <Badge variant="outline" className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase bg-orange-100 text-orange-700 border-orange-200 shrink-0">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                        isActive
                          ? "text-orange-600 opacity-100"
                          : "opacity-0 group-hover:opacity-60 text-slate-400 group-hover:translate-x-0.5"
                      )}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Banner (Fixed at bottom of sidebar) */}
      <div className="p-3 shrink-0 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-linear-to-br from-slate-900 to-slate-950 text-white shadow-md">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-orange-400">
            <Zap className="w-4 h-4 fill-orange-400/20" />
            <span>System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-slate-300">Railway API Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
