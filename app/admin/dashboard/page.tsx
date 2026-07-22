"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getCoveragesApi,
  getApplicationsApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Layers,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activePlans: 0,
    totalCoverages: 0,
    pendingApps: 0,
    approvedApps: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [plansRes, coveragesRes, pendingRes, approvedRes, recentRes] = await Promise.allSettled([
        getPlansApi({ status: "active", limit: 1 }),
        getCoveragesApi(),
        getApplicationsApi({ status: "PENDING_APPROVAL", limit: 1 }),
        getApplicationsApi({ status: "APPROVED", limit: 1 }),
        getApplicationsApi({ limit: 5 }),
      ]);

      const activePlansCount =
        plansRes.status === "fulfilled"
          ? plansRes.value.data?.data?.pagination?.total ?? plansRes.value.data?.data?.plans?.length ?? 0
          : 0;

      const coveragesCount =
        coveragesRes.status === "fulfilled"
          ? Array.isArray(coveragesRes.value.data?.data)
            ? coveragesRes.value.data.data.length
            : coveragesRes.value.data?.data?.coverages?.length ?? 0
          : 0;

      const pendingCount =
        pendingRes.status === "fulfilled"
          ? pendingRes.value.data?.data?.pagination?.total ?? pendingRes.value.data?.data?.applications?.length ?? 0
          : 0;

      const approvedCount =
        approvedRes.status === "fulfilled"
          ? approvedRes.value.data?.data?.pagination?.total ?? approvedRes.value.data?.data?.applications?.length ?? 0
          : 0;

      const applicationsList =
        recentRes.status === "fulfilled"
          ? recentRes.value.data?.data?.applications || recentRes.value.data?.data || []
          : [];

      setStats({
        activePlans: activePlansCount,
        totalCoverages: coveragesCount,
        pendingApps: pendingCount,
        approvedApps: approvedCount,
      });

      setRecentApps(applicationsList);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    const uppercaseStatus = (status || "").toUpperCase();
    if (uppercaseStatus === "PENDING_APPROVAL" || uppercaseStatus === "PENDING") {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Approval
        </span>
      );
    }
    if (uppercaseStatus === "APPROVED" || uppercaseStatus === "POLICY_ISSUED") {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Approved / Issued
        </span>
      );
    }
    if (uppercaseStatus === "REJECTED") {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Rejected
        </span>
      );
    }
    return (
      <Badge variant="outline" className="text-slate-600 border-slate-200">
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-linear-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl shadow-orange-600/10 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              ICICI Executive Dashboard
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono font-bold">
                REALTIME
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-orange-100">
              Manage insurance products, master rates, policy conditions & underwriting reviews.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-500/40 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Active Plans
              </span>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats.activePlans}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> Active Master
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-500/40 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Coverages
              </span>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats.totalCoverages}
              </span>
              <span className="text-xs font-semibold text-cyan-600 flex items-center gap-0.5">
                Configured
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/40 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Approval
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats.pendingApps}
              </span>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5">
                Action Needed
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Approved Policies
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats.approvedApps}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                Issued
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/rate-cards">
              <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-500/60 hover:bg-orange-50/40 transition duration-200 flex items-center gap-3 cursor-pointer group shadow-2xs">
                <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 border border-orange-200 group-hover:bg-orange-600 group-hover:text-white transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Upload Excel Data</h4>
                  <p className="text-xs text-slate-500">Bulk upload rates & master cards</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/plans">
              <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-500/60 hover:bg-orange-50/40 transition duration-200 flex items-center gap-3 cursor-pointer group shadow-2xs">
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Create New Plan</h4>
                  <p className="text-xs text-slate-500">Add plan & option configurations</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/applications">
              <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-500/60 hover:bg-orange-50/40 transition duration-200 flex items-center gap-3 cursor-pointer group shadow-2xs">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Review Applications</h4>
                  <p className="text-xs text-slate-500">Underwrite & issue pending policies</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Customer Applications Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Applications</h3>
              <p className="text-xs text-slate-500">Latest policy purchase requests submitted by users</p>
            </div>
            <Link href="/admin/applications">
              <Button variant="ghost" size="sm" className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                View All Applications <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Application No.</th>
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Total Premium</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Submitted At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                        Loading applications...
                      </td>
                    </tr>
                  ) : recentApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        No customer applications found yet.
                      </td>
                    </tr>
                  ) : (
                    recentApps.map((app: any) => (
                      <tr key={app._id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono text-xs text-orange-600 font-bold">
                          {app.applicationNumber || app._id?.slice(-8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {app.applicantDetails?.fullName || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {app.applicantDetails?.email || app.applicantDetails?.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          ₹{app.pricing?.totalPremium ? Number(app.pricing.totalPremium).toLocaleString() : "0"}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href="/admin/applications">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Audit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
