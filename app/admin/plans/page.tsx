"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  createPlanApi,
  updatePlanApi,
  deletePlanApi,
  togglePlanStatusApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Plan {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  logo?: string;
  status: "active" | "inactive" | string;
  createdAt?: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Plan Form Modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    logo: "",
    status: "active",
  });
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPlansApi({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      const data = res.data?.data;
      if (data) {
        setPlans(data.plans || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Fetch plans error:", err);
      toast.error("Failed to load insurance plans");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name || "",
        slug: plan.slug || "",
        shortDescription: plan.shortDescription || "",
        description: plan.description || "",
        logo: plan.logo || "",
        status: plan.status || "active",
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "",
        slug: "",
        shortDescription: "",
        description: "",
        logo: "",
        status: "active",
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.slug) {
      toast.error("Name and slug are required");
      return;
    }

    try {
      setSubmittingPlan(true);
      if (editingPlan) {
        await updatePlanApi(editingPlan._id, planForm);
        toast.success("Plan updated successfully");
      } else {
        await createPlanApi(planForm);
        toast.success("New Plan created successfully");
      }
      setIsPlanModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      console.error("Save plan error:", err);
      toast.error(err.response?.data?.message || "Failed to save plan");
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    try {
      await togglePlanStatusApi(plan._id, newStatus);
      toast.success(`Plan marked as ${newStatus}`);
      fetchPlans();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to soft delete this plan?")) return;
    try {
      await deletePlanApi(id);
      toast.success("Plan deleted successfully");
      fetchPlans();
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Insurance Plans Master <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Create, configure, and manage core ICICI insurance policy products.
            </p>
          </div>
          <Button
            onClick={() => handleOpenPlanModal()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs h-10"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create New Plan
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search plans by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50 border-slate-200 text-xs focus-visible:ring-orange-500 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Plans Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-16 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Logo</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Details</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Short Description</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                    Fetching insurance plans...
                  </TableCell>
                </TableRow>
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No insurance plans found. Click &quot;Create New Plan&quot; to get started.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan._id} className="hover:bg-slate-50 transition">
                    <TableCell className="px-6 py-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {plan.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={plan.logo}
                            alt={plan.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="font-bold text-slate-900">{plan.name}</div>
                      <div className="text-xs font-mono text-orange-600">{plan.slug}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {plan.shortDescription || "No short description provided."}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(plan)}
                        className={`px-3 py-1 text-xs font-bold rounded-full border transition flex items-center gap-1.5 ${plan.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                      >
                        {plan.status === "active" ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/matrix?planId=${plan._id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Coverages
                          </Button>
                        </Link>

                        <Link href={`/admin/tabulation?planId=${plan._id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold"
                          >
                            <TableIcon className="w-3.5 h-3.5 mr-1" /> Tabulation
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenPlanModal(plan)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlan(plan._id)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page {page} of {totalPages} ({totalItems} total plans)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs font-bold"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Plan Dialog */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingPlan ? "Edit Insurance Plan" : "Create New Insurance Plan"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Plan Name *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. ICICI Pru Health Shield"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 text-xs focus-visible:ring-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Slug (URL Identifier) *
              </label>
              <Input
                type="text"
                required
                placeholder="icici-pru-health-shield"
                value={planForm.slug}
                onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 text-xs font-mono focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Short Summary
              </label>
              <Input
                type="text"
                placeholder="e.g. Comprehensive Health Cover with Unlimited Reset"
                value={planForm.shortDescription}
                onChange={(e) => setPlanForm({ ...planForm, shortDescription: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 text-xs focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Logo URL
              </label>
              <Input
                type="text"
                placeholder="https://cdn.example.com/logo.png"
                value={planForm.logo}
                onChange={(e) => setPlanForm({ ...planForm, logo: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 text-xs focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={planForm.status}
                onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingPlan}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-9 font-bold px-4"
              >
                {submittingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
