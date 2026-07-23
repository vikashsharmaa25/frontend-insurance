"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
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
  BadgePercent,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";

export default function RateCardsPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Master lists
  const [plans, setPlans] = useState<any[]>([]);
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
          if (list.length > 0) {
            setRateForm((prev) => ({ ...prev, planId: list[0]._id }));
          }
        }

        if (sumRes.status === "fulfilled") {
          const list = sumRes.value.data?.data || [];
          setSumInsuredList(list);
          if (list.length > 0) setRateForm((prev) => ({ ...prev, sumInsuredId: list[0]._id }));
        }

        if (ageRes.status === "fulfilled") {
          const list = ageRes.value.data?.data || [];
          setAgeSlabsList(list);
          if (list.length > 0) setRateForm((prev) => ({ ...prev, ageSlabId: list[0]._id }));
        }

        if (famRes.status === "fulfilled") {
          const list = famRes.value.data?.data || [];
          setFamilyTypesList(list);
          if (list.length > 0) setRateForm((prev) => ({ ...prev, familyTypeId: list[0]._id }));
        }
      } catch (err) {
        console.error("Fetch dropdown masters error:", err);
      }
    };

    fetchDropdownMasters();
  }, []);

  // Fetch rates
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPremiumRatesApi({
        planId: selectedPlanId || undefined,
        page,
        limit: 20,
      });

      const data = res.data?.data;
      if (Array.isArray(data)) {
        setRates(data);
        setTotalPages(1);
        setTotalItems(data.length);
      } else {
        setRates(data?.rates || []);
        setTotalPages(data?.pagination?.totalPages || 1);
        setTotalItems(data?.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Fetch rate cards error:", err);
      toast.error("Failed to load rate card entries");
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, page]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Download Excel Template handler
  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadExcelTemplateApi();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Health_Insurance_Rate_Card_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel Template Downloaded!");
    } catch (err) {
      console.error("Template download error:", err);
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

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs h-10"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-500" /> Template (.xlsx)
            </Button>

            <Button
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs h-10"
            >
              <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Excel Data
            </Button>

            <Button
              onClick={() => setIsRateModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs h-10"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Single Rate
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-80">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Filter Plan:
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => {
                setSelectedPlanId(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-semibold"
            >
              <option value="">All Insurance Plans ({plans.length})</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="text-slate-900 font-extrabold">{rates.length}</span> of {totalItems} matrix entries
          </div>
        </div>

        {/* Rates Table */}
        {loading ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
            Loading rate card matrix...
          </div>
        ) : rates.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500 space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700">No Rate Entries Found</p>
            <p className="text-xs text-slate-500">Upload your actuarial rate card Excel file to populate rates automatically.</p>
            <Button
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 mt-2"
            >
              <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Excel Rate File
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Name</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Age Slab</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sum Insured</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Family Type</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Base Premium</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total (incl. 18% GST)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {rates.map((r) => {
                  const gst = r.gstPercentage || 18;
                  const total = Math.round((r.basePremium + (r.basePremium * (gst / 100))) * 100) / 100;

                  return (
                    <TableRow key={r._id} className="hover:bg-slate-50 transition">
                      <TableCell className="px-6 py-4 font-bold text-slate-900">
                        {r.planId?.name || "Health Shield"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {r.ageSlabId?.displayName || `${r.ageSlabId?.minAge}-${r.ageSlabId?.maxAge} yrs`}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs">
                          ₹{r.sumInsuredId?.amount ? r.sumInsuredId.amount.toLocaleString("en-IN") : r.sumInsuredId?.displayName}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {r.familyTypeId?.name || r.familyTypeId?.code}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-xs text-slate-700">
                        ₹{r.basePremium.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-extrabold text-slate-900 text-right">
                        ₹{total.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-2xl">
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              variant="outline"
              className="h-8 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              variant="outline"
              className="h-8 text-xs font-bold"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Single Rate Entry Modal */}
      <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-orange-600" /> Create Premium Rate Entry
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSingleRate} className="space-y-4 pt-2">
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
                  value={rateForm.basePremium}
                  onChange={(e) => setRateForm({ ...rateForm, basePremium: Number(e.target.value) })}
                  className="h-10 text-xs bg-slate-50 border-slate-200 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  GST Rate (%)
                </label>
                <Input
                  type="number"
                  value={rateForm.gstPercentage}
                  onChange={(e) => setRateForm({ ...rateForm, gstPercentage: Number(e.target.value) })}
                  className="h-10 text-xs bg-slate-50 border-slate-200 focus:bg-white font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRateModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingRate}
                className="h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {submittingRate && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Rate Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Excel Upload Modal */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk Upload Insurance Master Data
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadExcel} className="space-y-4 pt-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">📋 Excel Upload Guide:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>Upload an Excel file (<code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">.xlsx</code> or <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">.csv</code>).</li>
                <li>Imports Plans, Coverages, Coverage Matrix, Sum Insured, Age Slabs, Family Types, &amp; Rates.</li>
              </ul>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-orange-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Standard Sample Excel Template
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Select Excel File *
              </label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition bg-slate-50/50 hover:bg-emerald-50/20 group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 mx-auto transition" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-700">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Click or drag &amp; drop Excel file here
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Supports .xlsx, .xls, .csv</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setSelectedFile(null);
                }}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadingExcel || !selectedFile}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {uploadingExcel ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading &amp; Importing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload &amp; Import Data
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
