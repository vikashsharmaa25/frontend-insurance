"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  getPlanOptionsApi,
  getSumInsuredApi,
  getAgeSlabsApi,
  getFamilyTypesApi,
  getPremiumRatesApi,
  createPremiumRateApi,
  uploadPremiumExcelApi,
  downloadExcelTemplateApi,
  getExcelTemplateDownloadUrl,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  Plus,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  DollarSign,
  FileCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function RateCardsPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [plans, setPlans] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [sumInsuredList, setSumInsuredList] = useState<any[]>([]);
  const [ageSlabsList, setAgeSlabsList] = useState<any[]>([]);
  const [familyTypesList, setFamilyTypesList] = useState<any[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Single Rate Entry Modal state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [submittingRate, setSubmittingRate] = useState(false);
  const [rateForm, setRateForm] = useState({
    planId: "",
    optionId: "",
    sumInsuredId: "",
    ageSlabId: "",
    familyTypeId: "",
    basePremium: 3442,
    gstPercentage: 18,
  });

  // Bulk Excel Upload Modal state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // Load masters for dropdowns
  useEffect(() => {
    const fetchDropdownMasters = async () => {
      try {
        const [plansRes, sumRes, ageRes, famRes] = await Promise.allSettled([
          getPlansApi({ limit: 100 }),
          getSumInsuredApi(),
          getAgeSlabsApi(),
          getFamilyTypesApi(),
        ]);

        if (plansRes.status === "fulfilled") {
          const list = plansRes.value.data?.data?.plans || plansRes.value.data?.data || [];
          setPlans(list);
          if (list.length > 0) setSelectedPlanId(list[0]._id);
        }
        if (sumRes.status === "fulfilled") {
          setSumInsuredList(sumRes.value.data?.data || []);
        }
        if (ageRes.status === "fulfilled") {
          setAgeSlabsList(ageRes.value.data?.data || []);
        }
        if (famRes.status === "fulfilled") {
          setFamilyTypesList(famRes.value.data?.data || []);
        }
      } catch (err) {
        console.error("Fetch dropdown masters error:", err);
      }
    };

    fetchDropdownMasters();
  }, []);

  // Fetch plan options when selectedPlanId changes
  useEffect(() => {
    if (!selectedPlanId) return;
    const fetchOptions = async () => {
      try {
        const res = await getPlanOptionsApi(selectedPlanId);
        setOptions(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, [selectedPlanId]);

  // Fetch rates card matrix
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPremiumRatesApi({
        planId: selectedPlanId,
        page,
        limit: 20,
      });
      const data = res.data?.data;
      if (data) {
        setRates(data.rates || data.premiumRates || (Array.isArray(data) ? data : []));
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Fetch rate cards error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, page]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      toast.info("Preparing Excel template download...");
      const response = await downloadExcelTemplateApi();

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ICICI_Insurance_Master_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel Template Downloaded!");
    } catch (err) {
      console.error("Download template error:", err);
      // Direct link fallback
      window.open(getExcelTemplateDownloadUrl(), "_blank");
    }
  };

  // Upload Excel handler
  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an Excel file (.xlsx)");
      return;
    }

    try {
      setUploadingExcel(true);
      await uploadPremiumExcelApi(selectedFile);

      toast.success("Bulk Excel file processed & rates created successfully!");
      setIsExcelModalOpen(false);
      setSelectedFile(null);
      fetchRates();
    } catch (err: any) {
      console.error("Upload Excel error:", err);
      toast.error(err.response?.data?.message || "Failed to upload Excel file");
    } finally {
      setUploadingExcel(false);
    }
  };

  // Save single rate entry
  const handleSaveSingleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingRate(true);
      await createPremiumRateApi(rateForm);
      toast.success("Premium rate card created!");
      setIsRateModalOpen(false);
      fetchRates();
    } catch (err: any) {
      console.error("Single rate error:", err);
      toast.error(err.response?.data?.message || "Failed to create rate entry");
    } finally {
      setSubmittingRate(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Rate Card Matrix & Excel Upload <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Manage actuarial premium rate matrices or perform 1-click bulk Excel uploads.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-10"
            >
              <Download className="w-4 h-4 mr-1.5 text-blue-600" /> Download Template
            </Button>
            <Button
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 shadow-md shadow-emerald-600/20"
            >
              <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Bulk Excel
            </Button>
            <Button
              onClick={() => {
                setRateForm({
                  ...rateForm,
                  planId: selectedPlanId || (plans[0]?._id ?? ""),
                  optionId: options[0]?._id ?? "",
                  sumInsuredId: sumInsuredList[0]?._id ?? "",
                  ageSlabId: ageSlabsList[0]?._id ?? "",
                  familyTypeId: familyTypesList[0]?._id ?? "",
                });
                setIsRateModalOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs h-10 shadow-md shadow-orange-600/20"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Single Rate Entry
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-orange-600" /> Filter Plan:
            </span>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 transition font-bold min-w-50"
            >
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono font-semibold">
            Total Rate Entries: {totalItems}
          </span>
        </div>

        {/* Rate Cards Matrix Table (shadcn Table) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan & Option</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sum Insured</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Age Bracket</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Family Type</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Base Premium</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GST %</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                    Loading rate cards matrix...
                  </TableCell>
                </TableRow>
              ) : rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No premium rates configured for this plan. Click &quot;Single Rate Entry&quot; or &quot;Upload Bulk Excel&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate, idx) => {
                  const planName = typeof rate.planId === "object" ? rate.planId?.name : rate.planName || "Selected Plan";
                  const optionName = typeof rate.optionId === "object" ? rate.optionId?.name : rate.optionName || "Base Option";
                  const sumName = typeof rate.sumInsuredId === "object" ? rate.sumInsuredId?.displayName : rate.sumInsuredName || "5 Lakhs";
                  const ageName = typeof rate.ageSlabId === "object" ? rate.ageSlabId?.displayName : rate.ageSlabName || "18-25 Yrs";
                  const famName = typeof rate.familyTypeId === "object" ? rate.familyTypeId?.code : rate.familyTypeName || "1A+0K";

                  const base = rate.basePremium || 0;
                  const gst = rate.gstPercentage || 18;
                  const total = base + (base * gst) / 100;

                  return (
                    <TableRow key={rate._id || idx} className="hover:bg-slate-50 transition">
                      <TableCell className="px-6 py-4">
                        <div className="font-bold text-slate-900">{planName}</div>
                        <div className="text-xs text-orange-600 font-mono font-bold">{optionName}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-xs text-emerald-700 font-extrabold">
                        {sumName}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-slate-700 font-mono font-semibold">
                        {ageName}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-blue-700 font-mono font-bold">
                        {famName}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono font-bold text-slate-900">
                        ₹{base.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">
                        {gst}%
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono font-extrabold text-orange-600 text-base">
                        ₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {page} of {totalPages} ({totalItems} total rates)
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

      {/* Bulk Excel Upload Dialog (shadcn Dialog) */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Excel Bulk Upload (.xlsx)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload an Excel workbook containing sheets for Plans, Options, Coverages, Coverage Matrix, Sum Insured, Age Slabs, Family Types, and Premium Rates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadExcel} className="space-y-4 pt-2">
            {/* Drag & Drop Box */}
            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 rounded-2xl p-8 text-center transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <FileCheck className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Drag & Drop Excel file here, or click to browse
                  </p>
                  <p className="text-[11px] text-slate-500">Supports .xlsx and .xls formats</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExcelModalOpen(false)}
                className="border-slate-200 bg-white text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadingExcel || !selectedFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {uploadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process & Import Excel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Rate Entry Dialog (shadcn Dialog) */}
      <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" /> Create Rate Card Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Manually add actuarial premium rate card entries to the system matrix.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSingleRate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Plan
                </label>
                <select
                  value={rateForm.planId}
                  onChange={(e) => setRateForm({ ...rateForm, planId: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Option
                </label>
                <select
                  value={rateForm.optionId}
                  onChange={(e) => setRateForm({ ...rateForm, optionId: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  {options.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Sum Insured
                </label>
                <select
                  value={rateForm.sumInsuredId}
                  onChange={(e) => setRateForm({ ...rateForm, sumInsuredId: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  {sumInsuredList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Age Slab
                </label>
                <select
                  value={rateForm.ageSlabId}
                  onChange={(e) => setRateForm({ ...rateForm, ageSlabId: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  {ageSlabsList.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Family Type
                </label>
                <select
                  value={rateForm.familyTypeId}
                  onChange={(e) => setRateForm({ ...rateForm, familyTypeId: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  {familyTypesList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Base Premium (₹) *
                </label>
                <Input
                  type="number"
                  required
                  value={rateForm.basePremium}
                  onChange={(e) => setRateForm({ ...rateForm, basePremium: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  GST Percentage (%)
                </label>
                <Input
                  type="number"
                  required
                  value={rateForm.gstPercentage}
                  onChange={(e) => setRateForm({ ...rateForm, gstPercentage: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRateModalOpen(false)}
                className="border-slate-200 bg-white text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingRate}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {submittingRate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Rate Entry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
