"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getCoveragesApi,
  getSumInsuredApi,
  getPlanCoveragesApi,
  getPremiumRatesApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Sparkles,
  Layers,
  ShieldCheck,
  FileText,
  BadgePercent,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  _id: string;
  name: string;
  slug: string;
}

interface CoverageItem {
  _id: string;
  title: string;
  description: string;
}

interface SumInsuredSlab {
  _id: string;
  displayName: string;
  amount: number;
}

// matrixState[coverageId][sumInsuredId] = { isCovered, value }
type CellState = { isCovered: boolean; value: string };
type MatrixState = Record<string, Record<string, CellState>>;

// ─── Inner Component ──────────────────────────────────────────────────────────

function TabulationContent() {
  const searchParams = useSearchParams();
  const paramPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [coverages, setCoverages] = useState<CoverageItem[]>([]);
  const [slabs, setSlabs] = useState<SumInsuredSlab[]>([]);
  const [planCoverageMap, setPlanCoverageMap] = useState<Record<string, { isCovered: boolean; value: string }>>({});

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [activeTab, setActiveTab] = useState("coverages");

  // ── Initial load: plans + coverages + sum insured slabs ──────────────────
  useEffect(() => {
    const fetchInitialMasters = async () => {
      try {
        setLoading(true);
        const [plansRes, covRes, slabsRes] = await Promise.all([
          getPlansApi({ status: "active", limit: 100 }),
          getCoveragesApi(),
          getSumInsuredApi(),
        ]);

        const planList: Plan[] =
          plansRes.data?.data?.plans || plansRes.data?.data || [];

        const covList: CoverageItem[] = Array.isArray(covRes.data?.data)
          ? covRes.data.data
          : covRes.data?.data?.coverages || [];

        const rawSlabs: SumInsuredSlab[] = Array.isArray(slabsRes.data?.data)
          ? slabsRes.data.data
          : [];

        const sortedSlabs = rawSlabs.sort((a, b) => a.amount - b.amount);

        setPlans(planList);
        setCoverages(covList);
        setSlabs(sortedSlabs);

        const initialPlan =
          paramPlanId && planList.some((p) => p._id === paramPlanId)
            ? paramPlanId
            : planList[0]?._id || "";

        setSelectedPlanId(initialPlan);
      } catch (err) {
        console.error("Fetch tabulation error:", err);
        toast.error("Failed to load tabulation data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMasters();
  }, [paramPlanId]);

  // Sync selectedPlan object
  useEffect(() => {
    const found = plans.find((p) => p._id === selectedPlanId) || null;
    setSelectedPlan(found);
  }, [selectedPlanId, plans]);

  // ── Load matrix + rates when plan changes ─────────────────────────────────
  useEffect(() => {
    if (!selectedPlanId) return;

    const fetchPlanDetails = async () => {
      try {
        setLoadingMatrix(true);

        const [matrixRes, ratesRes] = await Promise.all([
          getPlanCoveragesApi(selectedPlanId),
          getPremiumRatesApi({ planId: selectedPlanId, limit: 500 }),
        ]);

        const rawMappings: Array<{
          coverageId: { _id: string } | string;
          isCovered: boolean;
          value: string;
        }> = matrixRes.data?.data || [];

        const mapState: Record<string, { isCovered: boolean; value: string }> = {};

        rawMappings.forEach((m) => {
          const covId = typeof m.coverageId === "object" ? m.coverageId._id : m.coverageId;
          if (!covId) return;
          mapState[covId] = {
            isCovered: Boolean(m.isCovered),
            value: m.value || (m.isCovered ? "Yes" : "No"),
          };
        });

        setPlanCoverageMap(mapState);
        setRates(ratesRes.data?.data?.rates || ratesRes.data?.data || []);
      } catch (err) {
        console.error("Fetch plan details error:", err);
      } finally {
        setLoadingMatrix(false);
      }
    };

    fetchPlanDetails();
  }, [selectedPlanId]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page Title ────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Plan Tabulation &amp; Policy Matrix{" "}
            <Sparkles className="w-4 h-4 text-orange-600" />
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Master Plan Benefit Matrix, Coverage Table &amp; Premium Rates.
          </p>
        </div>

        {/* ── Plan Selector Banner ──────────────────────────────── */}
        <div className="p-5 rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 w-full md:w-96">
            <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-400" /> Select Insurance Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full h-11 px-3 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-semibold"
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

          <div className="flex items-center gap-4 text-xs">
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Sum Insured Slabs</div>
                <div className="font-bold text-white">{slabs.length} Slabs</div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Coverages</div>
                <div className="font-bold text-white">{coverages.length} Items</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-12 flex space-x-1 border border-slate-200">
            <TabsTrigger
              value="coverages"
              className="rounded-lg text-xs font-bold px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Cover Names vs Sum Insured Matrix
            </TabsTrigger>
            <TabsTrigger
              value="rates"
              className="rounded-lg text-xs font-bold px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs transition"
            >
              <BadgePercent className="w-4 h-4 mr-2" />
              Premium Tables (excl. GST)
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-lg text-xs font-bold px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs transition"
            >
              <FileText className="w-4 h-4 mr-2" />
              Additional Details &amp; Terms
            </TabsTrigger>
          </TabsList>

          {/* ── TAB 1: Coverage Matrix ────────────────────────── */}
          <TabsContent value="coverages" className="mt-4 space-y-4">
            {loadingMatrix ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                Loading Coverage Matrix...
              </div>
            ) : coverages.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400 text-sm">
                No coverages found. Add coverages in Master Data first.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider w-28">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                        Coverage Item &amp; Details
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-64">
                        Coverage Limit / Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coverages.map((cov, idx) => {
                      const cell = planCoverageMap[cov._id] || { isCovered: false, value: "No" };
                      const isYes = cell.isCovered || (cell.value && cell.value.toLowerCase() !== "no");
                      return (
                        <tr
                          key={cov._id}
                          className={isYes ? "bg-emerald-50/20 hover:bg-emerald-50/40" : "bg-white hover:bg-slate-50"}
                        >
                          <td className="px-6 py-4 text-center">
                            {isYes ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Covered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                Not Covered
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{cov.title}</div>
                            {cov.description && (
                              <div className="text-xs text-slate-500 font-normal mt-0.5">{cov.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold ${isYes ? "text-slate-900 font-mono" : "text-slate-400"}`}>
                              {cell.value || (isYes ? "Yes" : "No")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ── TAB 2: Premium Tables ────────────────────────────── */}
          <TabsContent value="rates" className="mt-4 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold tracking-wide uppercase flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-orange-400" /> Premium
                Tables (excl. GST)
              </h3>
              <Badge className="bg-orange-500 text-white font-bold">
                18% GST Applicable
              </Badge>
            </div>

            {rates.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400 text-sm">
                No premium rates found for this plan.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Group rates by sum insured */}
                {slabs.map((slab) => {
                  const slabRates = rates.filter(
                    (r) =>
                      r.sumInsuredId?._id === slab._id ||
                      r.sumInsuredId === slab._id
                  );
                  if (slabRates.length === 0) return null;

                  return (
                    <div
                      key={slab._id}
                      className="rounded-xl border border-blue-200 bg-white overflow-hidden shadow-xs"
                    >
                      <div className="px-4 py-2 bg-blue-950 text-white font-bold text-xs text-center uppercase tracking-wider">
                        Sum Insured = {slab.displayName}
                      </div>
                      <Table>
                        <TableHeader className="bg-blue-900 text-white">
                          <TableRow className="border-b border-blue-800">
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase">
                              Age Slab
                            </TableHead>
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">
                              Individual
                            </TableHead>
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">
                              1A+1K
                            </TableHead>
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">
                              1A+2K
                            </TableHead>
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">
                              2A
                            </TableHead>
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">
                              2A+1K
                            </TableHead>
                            <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">
                              2A+2K
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 text-xs">
                          {Array.from(
                            new Set(
                              slabRates.map((r) => r.ageSlabId?.displayName)
                            )
                          )
                            .filter(Boolean)
                            .map((ageLabel) => {
                              const rowRates = slabRates.filter(
                                (r) => r.ageSlabId?.displayName === ageLabel
                              );
                              const getVal = (code: string) => {
                                const item = rowRates.find(
                                  (r) =>
                                    r.familyTypeId?.code === code ||
                                    r.familyTypeId?.name === code
                                );
                                return item
                                  ? `₹${item.basePremium.toLocaleString("en-IN")}`
                                  : "—";
                              };

                              return (
                                <TableRow
                                  key={ageLabel}
                                  className="hover:bg-blue-50/50"
                                >
                                  <TableCell className="px-3 py-2 font-bold text-blue-950 bg-blue-50/30">
                                    {ageLabel}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {getVal("Individual")}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {getVal("1A+1K")}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {getVal("1A+2K")}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {getVal("2A")}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {getVal("2A+1K")}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {getVal("2A+2K")}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── TAB 3: Additional Details ───────────────────────── */}
          <TabsContent value="details" className="mt-4 space-y-6">
            <div className="max-w-md rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider">
                Additional Details
              </div>
              <Table>
                <TableBody className="divide-y divide-slate-200 text-xs font-semibold">
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500 w-36">
                      Vertical
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">
                      KRG
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">
                      Mailing address
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">
                      Prabhadevi
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">
                      Contact no
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">
                      XXXXXXXXXX
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">
                      Email Id
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono font-bold text-slate-900">
                      abcd@gmail.com
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">
                      Risk address
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">
                      Mumbai
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function TabulationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          Loading Tabulation Page...
        </div>
      }
    >
      <TabulationContent />
    </Suspense>
  );
}
