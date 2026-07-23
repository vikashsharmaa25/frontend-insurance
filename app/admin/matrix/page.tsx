"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getCoveragesApi,
  getSumInsuredApi,
  getPlanCoveragesApi,
  savePlanCoverageBatchApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  _id: string;
  name: string;
}

interface CoverageItem {
  _id: string;
  title: string;
}

interface SumInsuredSlab {
  _id: string;
  displayName: string;
  amount: number;
}

// matrixState[coverageId][sumInsuredId] = { isCovered, value }
type CellState = { isCovered: boolean; value: string };
type MatrixState = Record<string, Record<string, CellState>>;

// ─── Inner component ──────────────────────────────────────────────────────────

function CoverageMatrixInner() {
  const searchParams = useSearchParams();
  const paramPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [coverages, setCoverages] = useState<CoverageItem[]>([]);
  const [slabs, setSlabs] = useState<SumInsuredSlab[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [matrixState, setMatrixState] = useState<MatrixState>({});
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // ── Initial load: plans + coverages + sum insured slabs ──────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [plansRes, coveragesRes, slabsRes] = await Promise.all([
          getPlansApi({ status: "active", limit: 100 }),
          getCoveragesApi(),
          getSumInsuredApi(),
        ]);

        const planList: Plan[] =
          plansRes.data?.data?.plans || plansRes.data?.data || [];

        const covList: CoverageItem[] = Array.isArray(coveragesRes.data?.data)
          ? coveragesRes.data.data
          : coveragesRes.data?.data?.coverages || [];

        const rawSlabs = Array.isArray(slabsRes.data?.data)
          ? slabsRes.data.data
          : [];

        // Sort slabs by amount ascending
        const sortedSlabs: SumInsuredSlab[] = rawSlabs.sort(
          (a: SumInsuredSlab, b: SumInsuredSlab) => a.amount - b.amount
        );

        setPlans(planList);
        setCoverages(covList);
        setSlabs(sortedSlabs);

        const initialPlan =
          paramPlanId && planList.some((p) => p._id === paramPlanId)
            ? paramPlanId
            : planList[0]?._id || "";

        setSelectedPlanId(initialPlan);
      } catch (err) {
        console.error("Fetch initial data error:", err);
        toast.error("Failed to load matrix data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // ── Load existing mappings when plan changes ──────────────────────────────
  useEffect(() => {
    if (!selectedPlanId || slabs.length === 0 || coverages.length === 0) return;

    const fetchMappings = async () => {
      try {
        setLoading(true);
        const res = await getPlanCoveragesApi(selectedPlanId);
        const mappings: Array<{
          coverageId: { _id: string } | string;
          sumInsuredId: { _id: string } | string | null;
          isCovered: boolean;
          value: string;
        }> = res.data?.data || [];

        // Build initial state: all cells default to "No"
        const state: MatrixState = {};
        coverages.forEach((cov) => {
          state[cov._id] = {};
          slabs.forEach((slab) => {
            state[cov._id][slab._id] = { isCovered: false, value: "No" };
          });
        });

        // Overlay with existing saved mappings
        mappings.forEach((m) => {
          const covId =
            typeof m.coverageId === "object" ? m.coverageId._id : m.coverageId;
          const slabId =
            m.sumInsuredId == null
              ? null
              : typeof m.sumInsuredId === "object"
              ? m.sumInsuredId._id
              : m.sumInsuredId;

          if (slabId && state[covId] && state[covId][slabId] !== undefined) {
            state[covId][slabId] = {
              isCovered: Boolean(m.isCovered),
              value: m.value || (m.isCovered ? "Yes" : "No"),
            };
          }
        });

        setMatrixState(state);
      } catch (err) {
        console.error("Fetch matrix mappings error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMappings();
  }, [selectedPlanId, slabs, coverages]);

  // ── Toggle a single cell ─────────────────────────────────────────────────
  const toggleCell = (covId: string, slabId: string) => {
    setMatrixState((prev) => {
      const current = prev[covId]?.[slabId] ?? { isCovered: false, value: "No" };
      const next = !current.isCovered;
      return {
        ...prev,
        [covId]: {
          ...prev[covId],
          [slabId]: { isCovered: next, value: next ? "Yes" : "No" },
        },
      };
    });
  };

  // ── Toggle entire row (all slabs for one coverage) ───────────────────────
  const toggleRow = (covId: string) => {
    setMatrixState((prev) => {
      const rowCells = prev[covId] || {};
      const allCovered = slabs.every((s) => rowCells[s._id]?.isCovered);
      const newVal = !allCovered;
      const updated: Record<string, CellState> = {};
      slabs.forEach((s) => {
        updated[s._id] = { isCovered: newVal, value: newVal ? "Yes" : "No" };
      });
      return { ...prev, [covId]: updated };
    });
  };

  // ── Toggle entire column (all coverages for one slab) ───────────────────
  const toggleColumn = (slabId: string) => {
    setMatrixState((prev) => {
      const allCovered = coverages.every((c) => prev[c._id]?.[slabId]?.isCovered);
      const newVal = !allCovered;
      const next = { ...prev };
      coverages.forEach((cov) => {
        next[cov._id] = {
          ...next[cov._id],
          [slabId]: { isCovered: newVal, value: newVal ? "Yes" : "No" },
        };
      });
      return next;
    });
  };

  // ── Save all ─────────────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan first");
      return;
    }
    try {
      setSavingAll(true);
      const coverageRows: Array<{
        coverageId: string;
        sumInsuredId: string;
        isCovered: boolean;
        value: string;
      }> = [];

      coverages.forEach((cov) => {
        slabs.forEach((slab) => {
          const cell = matrixState[cov._id]?.[slab._id] ?? {
            isCovered: false,
            value: "No",
          };
          coverageRows.push({
            coverageId: cov._id,
            sumInsuredId: slab._id,
            isCovered: cell.isCovered,
            value: cell.value,
          });
        });
      });

      await savePlanCoverageBatchApi({
        planId: selectedPlanId,
        coverages: coverageRows,
      });
      toast.success("Coverage matrix saved successfully!");
    } catch (err: any) {
      console.error("Save matrix error:", err);
      toast.error(err.response?.data?.message || "Failed to save matrix");
    } finally {
      setSavingAll(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getCell = (covId: string, slabId: string): CellState =>
    matrixState[covId]?.[slabId] ?? { isCovered: false, value: "No" };

  const isRowAllCovered = (covId: string) =>
    slabs.length > 0 && slabs.every((s) => getCell(covId, s._id).isCovered);

  const isColAllCovered = (slabId: string) =>
    coverages.length > 0 &&
    coverages.every((c) => getCell(c._id, slabId).isCovered);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Plan Coverage Matrix <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure which coverages apply to each sum insured slab.
            </p>
          </div>
          {selectedPlanId && (
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs sm:text-sm h-10 px-5"
            >
              {savingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Matrix
            </Button>
          )}
        </div>

        {/* ── Plan Selector ────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Layers className="w-4 h-4 text-orange-600" /> Select Insurance Plan
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full md:max-w-xs h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-semibold"
          >
            {plans.length === 0 ? (
              <option value="">No active plans</option>
            ) : (
              plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* ── Matrix Table ─────────────────────────────────────── */}
        {loading ? (
          <div className="p-16 text-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
            <p className="text-sm text-slate-500">Loading matrix…</p>
          </div>
        ) : slabs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500">
            <p className="text-sm font-semibold">No Sum Insured slabs found.</p>
            <p className="text-xs mt-1">Add slabs in Master Data Centre first.</p>
          </div>
        ) : coverages.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500">
            <p className="text-sm font-semibold">No coverage items found.</p>
            <p className="text-xs mt-1">Add coverages in Master Data Centre first.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">

                {/* ── THEAD ──────────────────────────────────────── */}
                <thead>
                  {/* Row 1: "Cover Names" + "Sum Insured Slabs" spanning header */}
                  <tr>
                    <th
                      className="border border-slate-200 bg-slate-800 text-white px-5 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ minWidth: 220 }}
                    >
                      Cover Names
                    </th>
                    <th
                      colSpan={slabs.length}
                      className="border border-slate-200 bg-red-600 text-white px-4 py-3 text-center text-xs font-bold uppercase tracking-widest"
                    >
                      Sum Insured Slabs
                    </th>
                  </tr>

                  {/* Row 2: slab display names */}
                  <tr>
                    {/* Empty cell under "Cover Names" — shows toggle-all row hint */}
                    <th className="border border-slate-200 bg-slate-100 px-5 py-2.5 text-left">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Click slab header to toggle column
                      </span>
                    </th>
                    {slabs.map((slab) => {
                      const allCovered = isColAllCovered(slab._id);
                      return (
                        <th
                          key={slab._id}
                          onClick={() => toggleColumn(slab._id)}
                          title="Click to toggle entire column"
                          className={`border border-slate-200 px-4 py-2.5 text-center text-xs font-bold cursor-pointer select-none transition-colors ${
                            allCovered
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
                          style={{ minWidth: 90 }}
                        >
                          {slab.displayName}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ── TBODY ──────────────────────────────────────── */}
                <tbody>
                  {coverages.map((cov, rowIdx) => {
                    const allRowCovered = isRowAllCovered(cov._id);
                    return (
                      <tr
                        key={cov._id}
                        className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        {/* Coverage name cell — click to toggle entire row */}
                        <td
                          onClick={() => toggleRow(cov._id)}
                          title="Click to toggle entire row"
                          className={`border border-slate-200 px-5 py-3 text-xs font-semibold cursor-pointer select-none transition-colors ${
                            allRowCovered
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {cov.title}
                        </td>

                        {/* One cell per slab */}
                        {slabs.map((slab) => {
                          const cell = getCell(cov._id, slab._id);
                          return (
                            <td
                              key={slab._id}
                              onClick={() => toggleCell(cov._id, slab._id)}
                              className={`border border-slate-200 px-3 py-3 text-center cursor-pointer select-none transition-all ${
                                cell.isCovered
                                  ? "bg-emerald-50 hover:bg-emerald-100"
                                  : "bg-yellow-50 hover:bg-yellow-100"
                              }`}
                            >
                              {cell.isCovered ? (
                                <span className="inline-flex items-center justify-center gap-1 text-xs font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1 text-xs font-bold text-amber-600">
                                  <XCircle className="w-3.5 h-3.5" />
                                  No
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Legend + Save footer ─────────────────────────── */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  Yes — covered for this slab
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />
                  No — not covered
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  Click any cell, row name, or slab header to toggle
                </span>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={savingAll || loading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs h-9 px-5 w-full sm:w-auto"
              >
                {savingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save All Coverages
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function CoverageMatrixPage() {
  return (
    <Suspense fallback={null}>
      <CoverageMatrixInner />
    </Suspense>
  );
}
