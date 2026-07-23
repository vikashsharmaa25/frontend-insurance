"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getCoveragesApi,
  getPlanCoveragesApi,
  savePlanCoverageBatchApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  ShieldCheck,
  Search,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Plan {
  _id: string;
  name: string;
  slug?: string;
  sumInsuredSlabs?: Array<{ _id: string; displayName?: string; amount?: number }>;
  slabs?: Array<{ _id: string; displayName?: string; amount?: number }>;
}

interface CoverageItem {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
}

type CoverageRowState = {
  isCovered: boolean;
  value: string;
};

function CoverageMatrixInner() {
  const searchParams = useSearchParams();
  const paramPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [coverages, setCoverages] = useState<CoverageItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [search, setSearch] = useState("");

  const [matrixState, setMatrixState] = useState<Record<string, CoverageRowState>>({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // 1. Initial Load: Plans & Coverages
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setLoadingInitial(true);
        const [plansRes, coveragesRes] = await Promise.all([
          getPlansApi({ status: "active", limit: 100 }),
          getCoveragesApi(),
        ]);

        if (!isMounted) return;

        const planList: Plan[] = plansRes.data?.data?.plans || plansRes.data?.data || [];
        const covList: CoverageItem[] = Array.isArray(coveragesRes.data?.data)
          ? coveragesRes.data.data
          : coveragesRes.data?.data?.coverages || [];

        setPlans(planList);
        setCoverages(covList);

        const initialPlan =
          paramPlanId && planList.some((p) => p._id === paramPlanId)
            ? paramPlanId
            : planList[0]?._id || "";

        setSelectedPlanId(initialPlan);
      } catch (err) {
        console.error("Fetch initial matrix error:", err);
        toast.error("Failed to load matrix configuration data");
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };
    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [paramPlanId]);

  // 2. Fetch Plan Coverage Mappings when selectedPlanId changes
  const fetchPlanMappings = useCallback(async () => {
    if (!selectedPlanId || coverages.length === 0) return;

    try {
      setLoadingMatrix(true);
      const res = await getPlanCoveragesApi(selectedPlanId);
      const mappings: Array<{
        coverageId: { _id: string } | string;
        isCovered: boolean;
        value: string;
      }> = res.data?.data || [];

      // Default state: all coverages default to isCovered: false, value: "No"
      const initialState: Record<string, CoverageRowState> = {};
      coverages.forEach((cov) => {
        initialState[cov._id] = { isCovered: false, value: "No" };
      });

      // Overlay with saved mappings
      mappings.forEach((m) => {
        const covId = typeof m.coverageId === "object" ? m.coverageId._id : m.coverageId;
        if (covId && initialState[covId]) {
          initialState[covId] = {
            isCovered: Boolean(m.isCovered),
            value: m.value || (m.isCovered ? "Yes" : "No"),
          };
        }
      });

      setMatrixState(initialState);
    } catch (err) {
      console.error("Fetch plan mappings error:", err);
      toast.error("Failed to load saved coverage mappings for selected plan");
    } finally {
      setLoadingMatrix(false);
    }
  }, [selectedPlanId, coverages]);

  useEffect(() => {
    fetchPlanMappings();
  }, [fetchPlanMappings]);

  // Row toggles
  const handleToggleCoverage = (covId: string) => {
    setMatrixState((prev) => {
      const current = prev[covId] || { isCovered: false, value: "No" };
      const nextCovered = !current.isCovered;
      const nextValue = nextCovered
        ? current.value === "No" || !current.value
          ? "Yes"
          : current.value
        : "No";

      return {
        ...prev,
        [covId]: { isCovered: nextCovered, value: nextValue },
      };
    });
  };

  const handleUpdateValue = (covId: string, value: string) => {
    setMatrixState((prev) => {
      const isCovered = value.trim().toLowerCase() !== "no" && value.trim() !== "";
      return {
        ...prev,
        [covId]: { isCovered, value },
      };
    });
  };

  const handleEnableAll = () => {
    setMatrixState((prev) => {
      const updated: Record<string, CoverageRowState> = {};
      coverages.forEach((cov) => {
        const existingVal = prev[cov._id]?.value;
        updated[cov._id] = {
          isCovered: true,
          value: existingVal && existingVal !== "No" ? existingVal : "Yes",
        };
      });
      return updated;
    });
    toast.info("All coverages set to Covered (Yes)");
  };

  const handleDisableAll = () => {
    setMatrixState((prev) => {
      const updated: Record<string, CoverageRowState> = {};
      coverages.forEach((cov) => {
        updated[cov._id] = { isCovered: false, value: "No" };
      });
      return updated;
    });
    toast.info("All coverages set to Not Covered (No)");
  };

  const handleSaveAll = async () => {
    if (!selectedPlanId) {
      toast.error("Please select an insurance plan first");
      return;
    }
    try {
      setSavingAll(true);
      const coverageRows = coverages.map((cov) => {
        const row = matrixState[cov._id] || { isCovered: false, value: "No" };
        return {
          coverageId: cov._id,
          sumInsuredId: null,
          isCovered: row.isCovered,
          value: row.value,
        };
      });

      await savePlanCoverageBatchApi({
        planId: selectedPlanId,
        coverages: coverageRows,
      });

      toast.success("Plan coverage matrix saved successfully!");
    } catch (err: any) {
      console.error("Save matrix error:", err);
      toast.error(err.response?.data?.message || "Failed to save plan coverage matrix");
    } finally {
      setSavingAll(false);
    }
  };

  const activePlan = plans.find((p) => p._id === selectedPlanId);
  const planSlabs = activePlan?.slabs || activePlan?.sumInsuredSlabs || [];

  const filteredCoverages = coverages.filter((cov) =>
    cov.title.toLowerCase().includes(search.toLowerCase()) ||
    (cov.description && cov.description.toLowerCase().includes(search.toLowerCase()))
  );

  const coveredCount = coverages.filter((c) => matrixState[c._id]?.isCovered).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Plan Coverage Matrix <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable or disable coverages and set custom limits for your insurance plans with a single checkbox.
            </p>
          </div>
          {selectedPlanId && (
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || loadingMatrix || loadingInitial}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs sm:text-sm h-10 px-5"
            >
              {savingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Coverage Matrix
            </Button>
          )}
        </div>

        {/* Plan Selector & Stats Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Layers className="w-4 h-4 text-orange-600" /> Select Insurance Plan *
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={loadingInitial}
                className="w-full sm:w-72 h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
              >
                {plans.length === 0 ? (
                  <option value="">No active plans found</option>
                ) : (
                  plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedPlanId && (
              <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-5">
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-semibold px-3 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-orange-600" />
                  {activePlan?.name}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-mono font-semibold px-3 py-1">
                  Covered: {coveredCount} / {coverages.length}
                </Badge>
                {planSlabs.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-400">Assigned Slabs:</span>
                    {planSlabs.map((s: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded">
                        {s.displayName || `₹${s.amount}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Toolbar */}
          {selectedPlanId && coverages.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnableAll}
                disabled={loadingMatrix}
                className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white font-bold"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" /> Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisableAll}
                disabled={loadingMatrix}
                className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 bg-white font-bold"
              >
                <Square className="w-3.5 h-3.5 mr-1" /> Deselect All
              </Button>
            </div>
          )}
        </div>

        {/* Coverage List Table */}
        {loadingInitial ? (
          <div className="p-16 text-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading master coverages...</p>
          </div>
        ) : coverages.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500">
            <p className="text-sm font-semibold">No coverages found.</p>
            <p className="text-xs mt-1">Please add Coverage items in Master Data Center first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Filter */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search coverages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-xs focus-visible:ring-orange-500 rounded-xl"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs relative">
              {loadingMatrix && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                    <span className="text-xs font-bold text-slate-700">Loading plan coverage mappings...</span>
                  </div>
                </div>
              )}

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider w-16">
                      Covered
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                      Insurance Coverage Title & Description
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-72">
                      Coverage Value / Limit Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCoverages.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No matching coverages found for &quot;{search}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredCoverages.map((cov) => {
                      const rowState = matrixState[cov._id] || { isCovered: false, value: "No" };
                      return (
                        <tr
                          key={cov._id}
                          className={`transition ${rowState.isCovered ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "hover:bg-slate-50"
                            }`}
                        >
                          {/* Checkbox Cell */}
                          <td className="px-5 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={rowState.isCovered}
                              onChange={() => handleToggleCoverage(cov._id)}
                              className="w-5 h-5 accent-orange-600 rounded cursor-pointer transition focus:ring-orange-500"
                            />
                          </td>

                          {/* Coverage Info Cell */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm block">
                                {cov.title}
                              </span>
                              {rowState.isCovered ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Included
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  Not Included
                                </span>
                              )}
                            </div>
                            {cov.description && (
                              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                                {cov.description}
                              </p>
                            )}
                          </td>

                          {/* Value / Custom Limit Input Cell */}
                          <td className="px-5 py-4">
                            <Input
                              type="text"
                              value={rowState.value}
                              disabled={!rowState.isCovered}
                              onChange={(e) => handleUpdateValue(cov._id, e.target.value)}
                              placeholder="e.g. Yes, Covered up to 5L, Single AC Room"
                              className={`h-9 text-xs font-semibold rounded-xl transition ${rowState.isCovered
                                ? "bg-white border-slate-300 text-slate-900 focus-visible:ring-orange-500 font-bold"
                                : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Bottom Footer */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 font-medium">
                  Check the box to enable coverages for <strong className="text-slate-900">{activePlan?.name || "selected plan"}</strong>.
                </p>

                <Button
                  onClick={handleSaveAll}
                  disabled={savingAll || loadingMatrix}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs h-10 px-6 w-full sm:w-auto"
                >
                  {savingAll ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Coverage Matrix
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function CoverageMatrixPage() {
  return (
    <Suspense fallback={null}>
      <CoverageMatrixInner />
    </Suspense>
  );
}
