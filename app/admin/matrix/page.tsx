"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getPlanOptionsApi,
  getCoveragesApi,
  getPlanOptionCoveragesApi,
  savePlanOptionCoverageApi,
  savePlanOptionCoverageBatchApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Grid2X2,
  CheckSquare,
  Square,
  Save,
  Loader2,
  Sparkles,
  Layers,
  Settings,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Plan {
  _id: string;
  name: string;
}

interface Option {
  _id: string;
  name: string;
}

interface CoverageItem {
  _id: string;
  title: string;
  description: string;
}

interface MatrixItem {
  coverageId: string;
  isCovered: boolean;
  value: string;
  _id?: string;
}

export default function CoverageMatrixPage() {
  const searchParams = useSearchParams();
  const paramPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [coverages, setCoverages] = useState<CoverageItem[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");

  const [matrixState, setMatrixState] = useState<Record<string, { isCovered: boolean; value: string }>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  // Fetch initial plans & coverages list
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [plansRes, coveragesRes] = await Promise.all([
          getPlansApi({ status: "active", limit: 100 }),
          getCoveragesApi(),
        ]);

        const planList = plansRes.data?.data?.plans || plansRes.data?.data || [];
        const covList = Array.isArray(coveragesRes.data?.data)
          ? coveragesRes.data.data
          : coveragesRes.data?.data?.coverages || [];

        setPlans(planList);
        setCoverages(covList);

        if (paramPlanId && planList.some((p: Plan) => p._id === paramPlanId)) {
          setSelectedPlanId(paramPlanId);
        } else if (planList.length > 0) {
          setSelectedPlanId(planList[0]._id);
        }
      } catch (err) {
        console.error("Fetch initial matrix data error:", err);
        toast.error("Failed to load plans or coverages");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch options when selectedPlanId changes
  useEffect(() => {
    if (!selectedPlanId) return;

    const fetchOptionsForPlan = async () => {
      try {
        const res = await getPlanOptionsApi(selectedPlanId);
        const opts = res.data?.data || [];
        setOptions(opts);
        if (opts.length > 0) {
          setSelectedOptionId(opts[0]._id);
        } else {
          setSelectedOptionId("");
          setMatrixState({});
        }
      } catch (err) {
        console.error("Fetch plan options error:", err);
        setOptions([]);
        setSelectedOptionId("");
      }
    };

    fetchOptionsForPlan();
  }, [selectedPlanId]);

  // Fetch existing matrix mappings when plan & option selected
  useEffect(() => {
    if (!selectedPlanId || !selectedOptionId) return;

    const fetchMatrixMappings = async () => {
      try {
        setLoading(true);
        const res = await getPlanOptionCoveragesApi(selectedPlanId, selectedOptionId);

        const matrixData: MatrixItem[] = res.data?.data || [];
        const initialMap: Record<string, { isCovered: boolean; value: string }> = {};

        // Pre-fill existing mappings
        matrixData.forEach((item) => {
          const covId = typeof item.coverageId === "object" ? (item.coverageId as any)._id : item.coverageId;
          initialMap[covId] = {
            isCovered: Boolean(item.isCovered),
            value: item.value || "Yes",
          };
        });

        // Ensure all coverages have a default state if not mapped yet
        coverages.forEach((cov) => {
          if (!initialMap[cov._id]) {
            initialMap[cov._id] = { isCovered: false, value: "No" };
          }
        });

        setMatrixState(initialMap);
      } catch (err) {
        console.error("Fetch matrix error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixMappings();
  }, [selectedPlanId, selectedOptionId, coverages]);

  const handleToggleCovered = (covId: string) => {
    setMatrixState((prev) => {
      const current = prev[covId] || { isCovered: false, value: "No" };
      const nextIsCovered = !current.isCovered;
      return {
        ...prev,
        [covId]: {
          isCovered: nextIsCovered,
          value: nextIsCovered ? (current.value === "No" ? "Yes" : current.value) : "No",
        },
      };
    });
  };

  const handleValueChange = (covId: string, val: string) => {
    setMatrixState((prev) => ({
      ...prev,
      [covId]: {
        ...prev[covId],
        value: val,
      },
    }));
  };

  const handleSaveSingleRow = async (covId: string) => {
    if (!selectedPlanId || !selectedOptionId) {
      toast.error("Please select a Plan and an Option first");
      return;
    }

    const state = matrixState[covId] || { isCovered: false, value: "No" };

    try {
      setSavingId(covId);
      await savePlanOptionCoverageApi({
        planId: selectedPlanId,
        optionId: selectedOptionId,
        coverageId: covId,
        isCovered: state.isCovered,
        value: state.value,
      });
      toast.success("Coverage mapping saved!");
    } catch (err: any) {
      console.error("Save single matrix error:", err);
      toast.error(err.response?.data?.message || "Failed to save coverage mapping");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedPlanId || !selectedOptionId) {
      toast.error("Please select a Plan and Option first");
      return;
    }

    try {
      setSavingAll(true);
      const payload = {
        planId: selectedPlanId,
        optionId: selectedOptionId,
        coverages: coverages.map((cov) => {
          const state = matrixState[cov._id] || { isCovered: false, value: "No" };
          return {
            coverageId: cov._id,
            isCovered: state.isCovered,
            value: state.value,
          };
        }),
      };

      await savePlanOptionCoverageBatchApi(payload);
      toast.success("All coverages saved successfully!");
    } catch (err: any) {
      console.error("Save all matrix error:", err);
      toast.error(err.response?.data?.message || "Failed to save matrix changes");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Plan Coverage Matrix <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Map individual coverages to each plan and define custom coverage limits.
            </p>
          </div>
          {selectedOptionId && (
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs sm:text-sm h-10"
            >
              {savingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Matrix Changes
            </Button>
          )}
        </div>

        {/* Plan & Option Selectors Toolbar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-600" /> Select Insurance Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-semibold"
            >
              {plans.length === 0 ? (
                <option value="">No active plans available</option>
              ) : (
                plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-600" /> Select Sum Insured
            </label>
            <select
              value={selectedOptionId}
              onChange={(e) => setSelectedOptionId(e.target.value)}
              disabled={!selectedPlanId || options.length === 0}
              className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-semibold disabled:opacity-50"
            >
              {options.length === 0 ? (
                <option value="">No options found for this plan</option>
              ) : (
                options.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Matrix Grid Data Table (shadcn Table) */}
        {!selectedOptionId ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500 space-y-2">
            <Grid2X2 className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Option Selected</p>
            <p className="text-xs text-slate-500">
              Select an Insurance Plan and a Sum Insured above to view and configure its coverage matrix.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Is Covered</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Coverage Item</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Value / Limit Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                        Loading matrix configuration...
                      </TableCell>
                    </TableRow>
                  ) : coverages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                        No coverage items created in Master Data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coverages.map((cov) => {
                      const state = matrixState[cov._id] || { isCovered: false, value: "No" };

                      return (
                        <TableRow key={cov._id} className="hover:bg-slate-50 transition">
                          <TableCell className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCovered(cov._id)}
                              className={`p-1.5 px-3 rounded-lg border transition flex items-center gap-2 ${
                                state.isCovered
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                                  : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {state.isCovered ? (
                                <>
                                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                                  <span className="text-xs font-bold text-emerald-700">Yes</span>
                                </>
                              ) : (
                                <>
                                  <Square className="w-5 h-5 text-slate-400" />
                                  <span className="text-xs font-medium text-slate-500">No</span>
                                </>
                              )}
                            </button>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-orange-600" />
                              {cov.title}
                            </div>
                            <div className="text-xs text-slate-500">{cov.description}</div>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <Input
                              type="text"
                              value={state.value}
                              onChange={(e) => handleValueChange(cov._id, e.target.value)}
                              disabled={!state.isCovered}
                              placeholder="e.g. Yes, Covered up to 2%, or 100%"
                              className="max-w-md bg-slate-50 border-slate-200 text-slate-900 text-xs focus-visible:ring-orange-500 disabled:opacity-50"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Bottom Save All Action Bar */}
            {coverages.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Select coverages and enter limit details above, then click save to update all matrix items at once.
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={savingAll || loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs sm:text-sm h-11 px-6 w-full sm:w-auto"
                >
                  {savingAll ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save All Coverages
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
