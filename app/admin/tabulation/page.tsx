"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getPlanOptionsApi,
  getCoveragesApi,
  getPlanOptionCoveragesApi,
  getPremiumRatesApi,
  getSumInsuredApi,
  getAgeSlabsApi,
  getFamilyTypesApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Table as TableIcon,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  HeartPulse,
  BadgePercent,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Building,
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

interface Plan {
  _id: string;
  name: string;
  slug: string;
}

interface Option {
  _id: string;
  name: string;
  description?: string;
}

interface CoverageItem {
  _id: string;
  title: string;
  description: string;
}

function TabulationContent() {
  const searchParams = useSearchParams();
  const paramPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [options, setOptions] = useState<Option[]>([]);
  const [coverages, setCoverages] = useState<CoverageItem[]>([]);
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, { isCovered: boolean; value: string }>>>({});

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [activeTab, setActiveTab] = useState("coverages");

  // Fetch initial plans & coverages
  useEffect(() => {
    const fetchInitialMasters = async () => {
      try {
        setLoading(true);
        const [plansRes, covRes] = await Promise.all([
          getPlansApi({ status: "active", limit: 100 }),
          getCoveragesApi(),
        ]);

        const planList = plansRes.data?.data?.plans || plansRes.data?.data || [];
        const covList = Array.isArray(covRes.data?.data)
          ? covRes.data.data
          : covRes.data?.data?.coverages || [];

        setPlans(planList);
        setCoverages(covList);

        if (paramPlanId && planList.some((p: Plan) => p._id === paramPlanId)) {
          setSelectedPlanId(paramPlanId);
        } else if (planList.length > 0) {
          setSelectedPlanId(planList[0]._id);
        }
      } catch (err) {
        console.error("Fetch tabulation error:", err);
        toast.error("Failed to load tabulation data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMasters();
  }, [paramPlanId]);

  useEffect(() => {
    const found = plans.find((p) => p._id === selectedPlanId) || null;
    setSelectedPlan(found);
  }, [selectedPlanId, plans]);

  useEffect(() => {
    if (!selectedPlanId) return;

    const fetchPlanDetails = async () => {
      try {
        setLoadingMatrix(true);
        const [optionsRes, ratesRes] = await Promise.all([
          getPlanOptionsApi(selectedPlanId),
          getPremiumRatesApi({ planId: selectedPlanId, limit: 500 }),
        ]);

        const opts: Option[] = optionsRes.data?.data || [];
        setOptions(opts);
        setRates(ratesRes.data?.data?.rates || ratesRes.data?.data || []);

        const fullMatrix: Record<string, Record<string, { isCovered: boolean; value: string }>> = {};

        for (const opt of opts) {
          const matrixRes = await getPlanOptionCoveragesApi(selectedPlanId, opt._id);
          const rawItems: any[] = matrixRes.data?.data || [];

          fullMatrix[opt._id] = {};

          rawItems.forEach((item) => {
            const covId = typeof item.coverageId === "object" ? item.coverageId._id : item.coverageId;
            fullMatrix[opt._id][covId] = {
              isCovered: Boolean(item.isCovered),
              value: item.value || "Yes",
            };
          });
        }

        setMatrixData(fullMatrix);
      } catch (err) {
        console.error("Fetch plan details error:", err);
      } finally {
        setLoadingMatrix(false);
      }
    };

    fetchPlanDetails();
  }, [selectedPlanId]);

  // Helper mapping for Option Sum Insured labels from Image
  const getOptionSumInsuredLabel = (optName: string) => {
    if (optName.includes("A") || optName.includes("C")) return "3L, 5L, 10L";
    if (optName.includes("B") || optName.includes("D")) return "5L, 10L";
    return "3L, 5L, 10L";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Plan Tabulation & Policy Matrix <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Master Plan Benefit Matrix, Coverage Table & Premium Rates (matching official sheet specs).
            </p>
          </div>
        </div>

        {/* Plan Selector Header Banner */}
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
                <div className="text-[10px] text-slate-400 font-medium">Options</div>
                <div className="font-bold text-white">{options.length} Options (A, B, C, D)</div>
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

        {/* Tabulation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-12 flex space-x-1 border border-slate-200">
            <TabsTrigger
              value="coverages"
              className="rounded-lg text-xs font-bold px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Cover Names vs Options Matrix
            </TabsTrigger>

            <TabsTrigger
              value="rates"
              className="rounded-lg text-xs font-bold px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs transition"
            >
              <BadgePercent className="w-4 h-4 mr-2" /> Premium Tables (excl. GST)
            </TabsTrigger>

            <TabsTrigger
              value="details"
              className="rounded-lg text-xs font-bold px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs transition"
            >
              <FileText className="w-4 h-4 mr-2" /> Additional Details & Terms
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COVER NAMES VS OPTIONS MATRIX (MATCHING TOP IMAGE TABLE) */}
          <TabsContent value="coverages" className="mt-4 space-y-4">
            {loadingMatrix ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                Loading Coverages Matrix...
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-white overflow-hidden shadow-md">
                <Table>
                  <TableHeader>
                    {/* Header Row 1: Red Header for Cover Names & Options */}
                    <TableRow className="bg-red-600 hover:bg-red-600 border-b border-red-700">
                      <TableHead className="px-6 py-3 text-xs font-extrabold text-white uppercase tracking-wider min-w-65 bg-red-600">
                        Cover Names
                      </TableHead>
                      <TableHead colSpan={options.length || 4} className="px-6 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center bg-red-600">
                        Options
                      </TableHead>
                    </TableRow>

                    {/* Header Row 2: Sub-headers for A, B, C, D */}
                    <TableRow className="bg-red-500 hover:bg-red-500 border-b border-red-600">
                      <TableHead className="px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider bg-red-500">
                        Sum Insured
                      </TableHead>
                      {options.map((opt) => (
                        <TableHead key={opt._id} className="px-4 py-2.5 text-center text-xs font-extrabold text-white border-l border-red-400 bg-red-500">
                          <div className="text-sm font-black">{opt.name.replace("Option ", "")}</div>
                          <div className="text-[11px] text-red-100 font-normal">{getOptionSumInsuredLabel(opt.name)}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-slate-200">
                    {coverages.map((cov) => (
                      <TableRow key={cov._id} className="hover:bg-amber-50/40 transition">
                        <TableCell className="px-6 py-3.5 text-xs font-bold text-slate-800">
                          {cov.title}
                        </TableCell>

                        {options.map((opt) => {
                          const item = matrixData[opt._id]?.[cov._id] || { isCovered: false, value: "No" };
                          const isYes = item.isCovered || item.value?.toLowerCase() === "yes";

                          return (
                            <TableCell key={opt._id} className="px-4 py-3.5 text-center border-l border-slate-200 font-bold text-xs">
                              {isYes ? (
                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                                  No
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PREMIUM TABLES EXCL GST (MATCHING LOWER IMAGE TABLES) */}
          <TabsContent value="rates" className="mt-4 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold tracking-wide uppercase flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-orange-400" /> Premium Tables (excl. GST)
              </h3>
              <Badge className="bg-orange-500 text-white font-bold">18% GST Applicable</Badge>
            </div>

            {rates.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                Loading Premium Rates...
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {options.map((opt) => {
                  const optRates = rates.filter((r) => r.optionId?._id === opt._id || r.optionId === opt._id);
                  if (optRates.length === 0) return null;

                  // Group by Sum Insured
                  const sumGroups: Record<string, any[]> = {};
                  optRates.forEach((r) => {
                    const siLabel = r.sumInsuredId?.displayName || "Standard SI";
                    if (!sumGroups[siLabel]) sumGroups[siLabel] = [];
                    sumGroups[siLabel].push(r);
                  });

                  return (
                    <div key={opt._id} className="space-y-4">
                      <div className="px-4 py-2 rounded-xl bg-blue-900 text-white font-black text-sm tracking-wide">
                        {opt.name}
                      </div>

                      {Object.entries(sumGroups).map(([siLabel, groupRates]) => (
                        <div key={siLabel} className="rounded-xl border border-blue-200 bg-white overflow-hidden shadow-xs">
                          <div className="px-4 py-2 bg-blue-950 text-white font-bold text-xs text-center uppercase tracking-wider">
                            Sum Insured = {siLabel}
                          </div>
                          <Table>
                            <TableHeader className="bg-blue-900 text-white">
                              <TableRow className="border-b border-blue-800">
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase">Age / SI</TableHead>
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">Individual</TableHead>
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">1A+1K</TableHead>
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">1A+2K</TableHead>
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">2A</TableHead>
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">2A+1K</TableHead>
                                <TableHead className="px-3 py-2 text-[11px] font-bold text-white uppercase text-right">2A+2K</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100 text-xs">
                              {Array.from(new Set(groupRates.map((r) => r.ageSlabId?.displayName))).map((ageLabel) => {
                                const rowRates = groupRates.filter((r) => r.ageSlabId?.displayName === ageLabel);
                                const getVal = (code: string) => {
                                  const item = rowRates.find((r) => r.familyTypeId?.code === code || r.familyTypeId?.name === code);
                                  return item ? `₹${item.basePremium.toLocaleString("en-IN")}` : "—";
                                };

                                return (
                                  <TableRow key={ageLabel} className="hover:bg-blue-50/50">
                                    <TableCell className="px-3 py-2 font-bold text-blue-950 bg-blue-50/30">{ageLabel}</TableCell>
                                    <TableCell className="px-3 py-2 text-right font-medium">{getVal("Individual")}</TableCell>
                                    <TableCell className="px-3 py-2 text-right font-medium">{getVal("1A+1K")}</TableCell>
                                    <TableCell className="px-3 py-2 text-right font-medium">{getVal("1A+2K")}</TableCell>
                                    <TableCell className="px-3 py-2 text-right font-medium">{getVal("2A")}</TableCell>
                                    <TableCell className="px-3 py-2 text-right font-medium">{getVal("2A+1K")}</TableCell>
                                    <TableCell className="px-3 py-2 text-right font-medium">{getVal("2A+2K")}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: ADDITIONAL DETAILS (MATCHING BOTTOM LEFT TABLE IN IMAGE) */}
          <TabsContent value="details" className="mt-4 space-y-6">
            <div className="max-w-md rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider">
                ADDITIONAL DETAILS
              </div>
              <Table>
                <TableBody className="divide-y divide-slate-200 text-xs font-semibold">
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500 w-36">Vertical</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">KRG</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">Mailing address</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">Prabhadevi</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">Contact no</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">XXXXXXXXXX</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">Email Id</TableCell>
                    <TableCell className="px-4 py-3 font-mono font-bold text-slate-900">abcd@gmail.com</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="px-4 py-3 bg-slate-50 text-slate-500">Risk address</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-slate-900">Mumbai</TableCell>
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

export default function TabulationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Tabulation Page...</div>}>
      <TabulationContent />
    </Suspense>
  );
}
