"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
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
  RotateCcw,
  CheckSquare,
  Square,
  Edit2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  _id: string;
  name: string;
  slug?: string;
}

interface CoverageItem {
  _id: string;
  title: string;
  description?: string;
}

interface SumInsuredSlab {
  _id: string;
  displayName: string;
  amount: number;
}

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
  const [savedState, setSavedState] = useState<MatrixState>({});

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // In-cell editing popup/inline state
  const [editingCell, setEditingCell] = useState<{ covId: string; slabId: string } | null>(null);

  // ── Initial load: plans + coverages + sum insured slabs ──────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setLoadingInitial(true);
        const [plansRes, coveragesRes, slabsRes] = await Promise.all([
          getPlansApi({ status: "active", limit: 100 }),
          getCoveragesApi(),
          getSumInsuredApi(),
        ]);

        if (!isMounted) return;

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
        console.error("Fetch initial matrix data error:", err);
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

  // ── Load existing mappings when plan changes ──────────────────────────────
  const fetchPlanMappings = useCallback(async () => {
    if (!selectedPlanId || slabs.length === 0 || coverages.length === 0) return;

    try {
      setLoadingMatrix(true);
      const res = await getPlanCoveragesApi(selectedPlanId);
      const mappings: Array<{
        coverageId: { _id: string } | string;
        sumInsuredId: { _id: string } | string | null;
        isCovered: boolean;
        value: string;
      }> = res.data?.data || [];

      // Build default state: all cells default to "No"
      const initialState: MatrixState = {};
      coverages.forEach((cov) => {
        initialState[cov._id] = {};
        slabs.forEach((slab) => {
          initialState[cov._id][slab._id] = { isCovered: false, value: "No" };
        });
      });

      // Overlay with existing saved mappings from backend
      mappings.forEach((m) => {
        const covId =
          typeof m.coverageId === "object" ? m.coverageId._id : m.coverageId;
        const slabId =
          m.sumInsuredId == null
            ? null
            : typeof m.sumInsuredId === "object"
              ? m.sumInsuredId._id
              : m.sumInsuredId;

        if (covId && slabId && initialState[covId] && initialState[covId][slabId] !== undefined) {
          initialState[covId][slabId] = {
            isCovered: Boolean(m.isCovered),
            value: m.value || (m.isCovered ? "Yes" : "No"),
          };
        }
      });

      setMatrixState(initialState);
      setSavedState(JSON.parse(JSON.stringify(initialState)));
    } catch (err) {
      console.error("Fetch matrix mappings error:", err);
      toast.error("Failed to load saved coverage mappings for selected plan");
    } finally {
      setLoadingMatrix(false);
    }
  }, [selectedPlanId, slabs, coverages]);

  useEffect(() => {
    fetchPlanMappings();
  }, [fetchPlanMappings]);

  // ── Cell Operations ───────────────────────────────────────────────────────

  /** Toggle cell isCovered flag */
  const toggleCell = (covId: string, slabId: string) => {
    setMatrixState((prev) => {
      const current = prev[covId]?.[slabId] ?? { isCovered: false, value: "No" };
      const nextCovered = !current.isCovered;
      const nextValue = nextCovered
        ? current.value === "No" || !current.value
          ? "Yes"
          : current.value
        : "No";

      return {
        ...prev,
        [covId]: {
          ...prev[covId],
          [slabId]: { isCovered: nextCovered, value: nextValue },
        },
      };
    });
  };

  /** Update cell custom text value */
  const updateCellValue = (covId: string, slabId: string, newValue: string) => {
    setMatrixState((prev) => {
      const current = prev[covId]?.[slabId] ?? { isCovered: true, value: "Yes" };
      const isCovered = newValue.trim().toLowerCase() !== "no" && newValue.trim() !== "";
      return {
        ...prev,
        [covId]: {
          ...prev[covId],
          [slabId]: { isCovered, value: newValue },
        },
      };
    });
  };

  /** Toggle entire row (all slabs for one coverage) */
  const toggleRow = (covId: string) => {
    setMatrixState((prev) => {
      const rowCells = prev[covId] || {};
      const allCovered = slabs.every((s) => rowCells[s._id]?.isCovered);
      const newVal = !allCovered;

      const updatedRow: Record<string, CellState> = {};
      slabs.forEach((s) => {
        const existingVal = rowCells[s._id]?.value;
        const value = newVal
          ? existingVal && existingVal !== "No" ? existingVal : "Yes"
          : "No";
        updatedRow[s._id] = { isCovered: newVal, value };
      });

      return { ...prev, [covId]: updatedRow };
    });
  };

  /** Toggle entire column (all coverages for one slab) */
  const toggleColumn = (slabId: string) => {
    setMatrixState((prev) => {
      const allCovered = coverages.every((c) => prev[c._id]?.[slabId]?.isCovered);
      const newVal = !allCovered;

      const updatedMatrix = { ...prev };
      coverages.forEach((cov) => {
        const existingVal = prev[cov._id]?.[slabId]?.value;
        const value = newVal
          ? existingVal && existingVal !== "No" ? existingVal : "Yes"
          : "No";

        updatedMatrix[cov._id] = {
          ...updatedMatrix[cov._id],
          [slabId]: { isCovered: newVal, value },
        };
      });

      return updatedMatrix;
    });
  };

  /** Enable All Matrix Cells */
  const handleEnableAll = () => {
    setMatrixState((prev) => {
      const updated: MatrixState = {};
      coverages.forEach((cov) => {
        updated[cov._id] = {};
        slabs.forEach((s) => {
          const existing = prev[cov._id]?.[s._id]?.value;
          updated[cov._id][s._id] = {
            isCovered: true,
            value: existing && existing !== "No" ? existing : "Yes",
          };
        });
      });
      return updated;
    });
    toast.info("All coverages set to Covered (Yes)");
  };

  /** Disable All Matrix Cells */
  const handleDisableAll = () => {
    setMatrixState((prev) => {
      const updated: MatrixState = {};
      coverages.forEach((cov) => {
        updated[cov._id] = {};
        slabs.forEach((s) => {
          updated[cov._id][s._id] = { isCovered: false, value: "No" };
        });
      });
      return updated;
    });
    toast.info("All coverages set to Not Covered (No)");
  };

  /** Reset matrix to last saved state */
  const handleReset = () => {
    setMatrixState(JSON.parse(JSON.stringify(savedState)));
    toast.info("Matrix reset to last saved state");
  };

  // ── Save All Matrix ───────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    if (!selectedPlanId) {
      toast.error("Please select an insurance plan first");
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

      setSavedState(JSON.parse(JSON.stringify(matrixState)));
      toast.success("Coverage matrix saved successfully!");
    } catch (err: any) {
      console.error("Save matrix error:", err);
      toast.error(err.response?.data?.message || "Failed to save coverage matrix");
    } finally {
      setSavingAll(false);
    }
  };

  // ── Matrix Calculation Helpers ────────────────────────────────────────────
  const getCell = (covId: string, slabId: string): CellState =>
    matrixState[covId]?.[slabId] ?? { isCovered: false, value: "No" };

  const isRowAllCovered = (covId: string) =>
    slabs.length > 0 && slabs.every((s) => getCell(covId, s._id).isCovered);

  const isColAllCovered = (slabId: string) =>
    coverages.length > 0 &&
    coverages.every((c) => getCell(c._id, slabId).isCovered);

  const totalCells = coverages.length * slabs.length;
  let coveredCellsCount = 0;
  coverages.forEach((c) => {
    slabs.forEach((s) => {
      if (getCell(c._id, s._id).isCovered) coveredCellsCount++;
    });
  });

  const selectedPlanName = plans.find((p) => p._id === selectedPlanId)?.name || "Select Plan";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Plan Coverage Matrix <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure which coverages and limit values apply to each sum insured slab for insurance plans.
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

        {/* ── Plan Selector & Matrix Stats Bar ────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Layers className="w-4 h-4 text-orange-600" /> Select Insurance Plan
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
              <div className="flex items-center gap-2 pt-1 sm:pt-5">
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-semibold px-3 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-orange-600" />
                  {selectedPlanName}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-mono font-semibold px-3 py-1">
                  Mapped: {coveredCellsCount} / {totalCells} Cells
                </Badge>
              </div>
            )}
          </div>

          {/* Batch Quick Action Toolbar */}
          {selectedPlanId && slabs.length > 0 && coverages.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnableAll}
                disabled={loadingMatrix}
                className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white"
                title="Set all cells to Covered (Yes)"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" /> Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisableAll}
                disabled={loadingMatrix}
                className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 bg-white"
                title="Set all cells to Not Covered (No)"
              >
                <Square className="w-3.5 h-3.5 mr-1" /> Disable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={loadingMatrix}
                className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 bg-white"
                title="Reset matrix to last saved backend state"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          )}
        </div>

        {/* ── Matrix Table Container ─────────────────────────────── */}
        {loadingInitial ? (
          <div className="p-16 text-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading master configuration data...</p>
          </div>
        ) : slabs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500">
            <p className="text-sm font-semibold">No Sum Insured slabs found.</p>
            <p className="text-xs mt-1">Please add Sum Insured slabs in Master Data Center first.</p>
          </div>
        ) : coverages.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500">
            <p className="text-sm font-semibold">No coverage items found.</p>
            <p className="text-xs mt-1">Please add Coverage items in Master Data Center first.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs relative">
            {loadingMatrix && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                  <span className="text-xs font-bold text-slate-700">Fetching plan matrix mappings...</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">

                {/* ── THEAD ──────────────────────────────────────── */}
                <thead>
                  {/* Header Row 1: Category Titles */}
                  <tr className="bg-slate-900 text-white">
                    <th
                      className="border-b border-r border-slate-800 px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider sticky left-0 z-10 bg-slate-900 shadow-md"
                      style={{ minWidth: 260 }}
                    >
                      Insurance Coverages
                    </th>
                    <th
                      colSpan={slabs.length}
                      className="border-b border-slate-800 px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-widest bg-slate-900 text-orange-400"
                    >
                      Sum Insured Slabs
                    </th>
                  </tr>

                  {/* Header Row 2: Slab Headers & Column Toggle Buttons */}
                  <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                    {/* Corner Cell */}
                    <th className="border-r border-slate-700 px-5 py-3 text-left sticky left-0 z-10 bg-slate-800 shadow-md">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Click slab header button to toggle column
                      </span>
                    </th>

                    {/* Slab Header Columns */}
                    {slabs.map((slab) => {
                      const allColCovered = isColAllCovered(slab._id);
                      return (
                        <th
                          key={slab._id}
                          className="border-r border-slate-700 px-3 py-3 text-center text-xs font-bold whitespace-nowrap min-w-30"
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-white font-extrabold">{slab.displayName}</span>
                            <button
                              type="button"
                              onClick={() => toggleColumn(slab._id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition border ${allColCovered
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                                }`}
                              title="Toggle entire column"
                            >
                              {allColCovered ? "All Yes" : "Toggle Col"}
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ── TBODY ──────────────────────────────────────── */}
                <tbody className="divide-y divide-slate-200">
                  {coverages.map((cov, rowIdx) => {
                    const allRowCovered = isRowAllCovered(cov._id);
                    return (
                      <tr
                        key={cov._id}
                        className={rowIdx % 2 === 0 ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/30 hover:bg-slate-50"}
                      >
                        {/* Coverage Title Cell (Sticky Left) */}
                        <td
                          className="border-r border-slate-200 px-5 py-3 text-xs font-bold text-slate-900 sticky left-0 z-10 bg-white shadow-xs group"
                          style={{ minWidth: 260 }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate">
                              <span className="text-slate-900 block truncate">{cov.title}</span>
                              {cov.description && (
                                <span className="text-[10px] text-slate-400 block truncate font-normal">
                                  {cov.description}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleRow(cov._id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 transition border ${allRowCovered
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                              title="Toggle entire row"
                            >
                              {allRowCovered ? "All Yes" : "Row Toggle"}
                            </button>
                          </div>
                        </td>

                        {/* Slab Cells */}
                        {slabs.map((slab) => {
                          const cell = getCell(cov._id, slab._id);
                          const isEditing = editingCell?.covId === cov._id && editingCell?.slabId === slab._id;

                          return (
                            <td
                              key={slab._id}
                              className={`border-r border-slate-200 px-2 py-2 text-center transition-all ${cell.isCovered
                                ? "bg-emerald-50/70 hover:bg-emerald-100/60"
                                : "bg-slate-50/50 hover:bg-slate-100/60"
                                }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1 min-w-27.5">
                                  <Input
                                    type="text"
                                    autoFocus
                                    value={cell.value}
                                    onChange={(e) => updateCellValue(cov._id, slab._id, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === "Escape") {
                                        setEditingCell(null);
                                      }
                                    }}
                                    className="h-7 text-xs bg-white border-orange-500 px-2 py-0 text-center font-bold"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Toggle Badge */}
                                  <button
                                    type="button"
                                    onClick={() => toggleCell(cov._id, slab._id)}
                                    className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg transition shadow-2xs border ${cell.isCovered
                                      ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                                      : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                                      }`}
                                    title="Click to toggle Covered / Not Covered"
                                  >
                                    {cell.isCovered ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {cell.value && cell.value !== "Yes" ? cell.value : "Yes"}
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                        No
                                      </>
                                    )}
                                  </button>

                                  {/* Inline Edit Button (if covered) */}
                                  {cell.isCovered && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingCell({ covId: cov._id, slabId: slab._id })}
                                      className="p-1 text-slate-400 hover:text-orange-600 transition rounded-md hover:bg-white"
                                      title="Edit custom coverage value (e.g. Up to 100%, Single AC Room)"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
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

            {/* ── Footer Legend & Save Action ─────────────────────────── */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block shadow-2xs" />
                  Covered (Yes)
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-md bg-slate-300 inline-block shadow-2xs" />
                  Not Covered (No)
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 italic">
                  <Edit2 className="w-3 h-3 text-orange-500" /> Click edit icon to type custom limit values
                </span>
              </div>

              <Button
                onClick={handleSaveAll}
                disabled={savingAll || loadingMatrix}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs h-9 px-6 w-full sm:w-auto"
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
