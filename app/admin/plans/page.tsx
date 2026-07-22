"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  createPlanApi,
  updatePlanApi,
  deletePlanApi,
  togglePlanStatusApi,
  getPlanOptionsApi,
  createPlanOptionApi,
  updatePlanOptionApi,
  deletePlanOptionApi,
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
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
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
  DialogDescription,
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

interface PlanOption {
  _id: string;
  planId: string;
  name: string;
  description: string;
  status: string;
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

  // Plan Options Drawer/Modal state
  const [selectedPlanForOptions, setSelectedPlanForOptions] = useState<Plan | null>(null);
  const [options, setOptions] = useState<PlanOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionForm, setOptionForm] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [editingOption, setEditingOption] = useState<PlanOption | null>(null);
  const [submittingOption, setSubmittingOption] = useState(false);

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

  // --- Options Management ---
  const fetchOptions = async (planId: string) => {
    try {
      setLoadingOptions(true);
      const res = await getPlanOptionsApi(planId);
      setOptions(res.data?.data || []);
    } catch (err) {
      console.error("Fetch options error:", err);
      toast.error("Failed to load options");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOpenOptionsDrawer = (plan: Plan) => {
    setSelectedPlanForOptions(plan);
    setOptionForm({ name: "", description: "", status: "active" });
    setEditingOption(null);
    fetchOptions(plan._id);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForOptions || !optionForm.name) {
      toast.error("Option name is required");
      return;
    }

    try {
      setSubmittingOption(true);
      if (editingOption) {
        await updatePlanOptionApi(editingOption._id, optionForm);
        toast.success("Option updated");
      } else {
        await createPlanOptionApi({
          planId: selectedPlanForOptions._id,
          ...optionForm,
        });
        toast.success("Plan Option created");
      }
      setOptionForm({ name: "", description: "", status: "active" });
      setEditingOption(null);
      fetchOptions(selectedPlanForOptions._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save option");
    } finally {
      setSubmittingOption(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("Delete this option?")) return;
    try {
      await deletePlanOptionApi(optionId);
      toast.success("Option deleted");
      if (selectedPlanForOptions) fetchOptions(selectedPlanForOptions._id);
    } catch (err) {
      toast.error("Failed to delete option");
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
              Create, configure, and manage core ICICI insurance policy products & variants.
            </p>
          </div>
          <Button
            onClick={() => handleOpenPlanModal()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs sm:text-sm h-10"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create New Plan
          </Button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              type="text"
              placeholder="Search by plan name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-orange-600" /> Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 transition font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Plans Table (shadcn Table) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Logo</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Name & Slug</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Short Description</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Toggle</TableHead>
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
                        className={`px-3 py-1 text-xs font-bold rounded-full border transition flex items-center gap-1.5 ${
                          plan.status === "active"
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenOptionsDrawer(plan)}
                          className="h-8 text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1" /> Options
                        </Button>

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
                  className="h-8 text-xs border-slate-200 bg-white text-slate-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs border-slate-200 bg-white text-slate-700"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Form Dialog (shadcn Dialog) */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingPlan ? "Edit Insurance Plan" : "Create Insurance Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure product details, description, and status for ICICI core insurance policies.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Plan Name *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Comprehensive Health Plan"
                value={planForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                  setPlanForm({ ...planForm, name, slug });
                }}
                className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Slug *
              </label>
              <Input
                type="text"
                required
                placeholder="comprehensive-health-plan"
                value={planForm.slug}
                onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                className="bg-slate-50 border-slate-200 font-mono text-orange-600 focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Short Description
              </label>
              <Input
                type="text"
                placeholder="Brief summary of plan benefits"
                value={planForm.shortDescription}
                onChange={(e) => setPlanForm({ ...planForm, shortDescription: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Full Description
              </label>
              <textarea
                rows={3}
                placeholder="Inpatient expenses, ICU room rent, day care procedures..."
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Logo URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/logo.png"
                value={planForm.logo}
                onChange={(e) => setPlanForm({ ...planForm, logo: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPlanModalOpen(false)}
                className="border-slate-200 bg-white text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingPlan}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {submittingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Options Management Dialog (shadcn Dialog) */}
      <Dialog
        open={Boolean(selectedPlanForOptions)}
        onOpenChange={(open) => {
          if (!open) setSelectedPlanForOptions(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl bg-white border-slate-200 text-slate-900 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono text-orange-600 font-bold uppercase">Plan Options Master</span>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Manage Options for &quot;{selectedPlanForOptions?.name}&quot;
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Option Create/Edit Form */}
            <form onSubmit={handleSaveOption} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {editingOption ? "Edit Option" : "Add New Plan Option"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="text"
                  required
                  placeholder="Option Name (e.g. Option A - Base)"
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 text-xs focus-visible:ring-orange-500"
                />
                <select
                  value={optionForm.status}
                  onChange={(e) => setOptionForm({ ...optionForm, status: e.target.value })}
                  className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <Input
                type="text"
                placeholder="Description (e.g. Base Cover - Excludes Maternity)"
                value={optionForm.description}
                onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                className="bg-white border-slate-200 text-slate-900 text-xs focus-visible:ring-orange-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                {editingOption && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingOption(null);
                      setOptionForm({ name: "", description: "", status: "active" });
                    }}
                    className="text-xs text-slate-500"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingOption}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 font-bold"
                >
                  {submittingOption ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingOption ? "Update Option" : "Add Option"}
                </Button>
              </div>
            </form>

            {/* Existing Options List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Configured Options ({options.length})
              </h4>
              {loadingOptions ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-600" />
                </div>
              ) : options.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No options created for this plan yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {options.map((opt) => (
                    <div
                      key={opt._id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{opt.name}</span>
                          <Badge
                            variant={opt.status === "active" ? "default" : "secondary"}
                            className={opt.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-200 text-slate-600"}
                          >
                            {opt.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{opt.description || "No description"}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingOption(opt);
                            setOptionForm({
                              name: opt.name,
                              description: opt.description || "",
                              status: opt.status || "active",
                            });
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOption(opt._id)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
