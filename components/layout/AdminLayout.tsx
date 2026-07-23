"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role?.toUpperCase() !== "ADMIN") {
        // Non-admin user somehow reached here — kick them out
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-600 animate-spin" />
          <Loader2 className="w-6 h-6 text-orange-600 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Verifying Insurance Admin Credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Fixed Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Header */}
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Main Content Window */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
