"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getCoveragesApi,
  createCoverageApi,
  updateCoverageApi,
  deleteCoverageApi,
  getSumInsuredApi,
  createSumInsuredApi,
  updateSumInsuredApi,
  deleteSumInsuredApi,
  getAgeSlabsApi,
  createAgeSlabApi,
  updateAgeSlabApi,
  deleteAgeSlabApi,
  getFamilyTypesApi,
  createFamilyTypeApi,
  updateFamilyTypeApi,
  deleteFamilyTypeApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  ShieldCheck,
  DollarSign,
  Calendar,
  Users,
  Plus,
  Search,
  Loader2,
  Sparkles,
  CheckCircle,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"coverages" | "sum-insured" | "age-slabs" | "family-types">("coverages");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states - Empty initial values (no pre-filled sample text/numbers)
  const [coverageForm, setCoverageForm] = useState({ title: "", description: "", status: "active" });
  const [sumInsuredForm, setSumInsuredForm] = useState<{ amount: number | string; displayName: string; status: string }>({ amount: "", displayName: "", status: "active" });
  const [ageSlabForm, setAgeSlabForm] = useState<{ minAge: number | string; maxAge: number | string; displayName: string; status: string }>({ minAge: "", maxAge: "", displayName: "", status: "active" });
  const [familyTypeForm, setFamilyTypeForm] = useState<{ name: string; code: string; adultCount: number | string; childCount: number | string; status: string }>({ name: "", code: "", adultCount: "", childCount: "", status: "active" });

  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      let res: any;
      if (activeTab === "coverages") res = await getCoveragesApi();
      else if (activeTab === "sum-insured") res = await getSumInsuredApi();
      else if (activeTab === "age-slabs") res = await getAgeSlabsApi();
      else if (activeTab === "family-types") res = await getFamilyTypesApi();

      const data = res.data?.data;
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && typeof data === "object") {
        setItems(data.coverages || data.sumInsured || data.ageSlabs || data.familyTypes || data.items || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Fetch master error:", err);
      toast.error(`Failed to load ${activeTab}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMasterData();
    setSearch("");
  }, [fetchMasterData]);

  const openCreateModal = () => {
    setEditingItem(null);
    setCoverageForm({ title: "", description: "", status: "active" });
    setSumInsuredForm({ amount: "", displayName: "", status: "active" });
    setAgeSlabForm({ minAge: "", maxAge: "", displayName: "", status: "active" });
    setFamilyTypeForm({ name: "", code: "", adultCount: "", childCount: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === "coverages") {
      setCoverageForm({
        title: item.title || "",
        description: item.description || "",
        status: item.status || "active",
      });
    } else if (activeTab === "sum-insured") {
      setSumInsuredForm({
        amount: item.amount !== undefined ? item.amount : "",
        displayName: item.displayName || "",
        status: item.status || "active",
      });
    } else if (activeTab === "age-slabs") {
      setAgeSlabForm({
        minAge: item.minAge !== undefined ? item.minAge : "",
        maxAge: item.maxAge !== undefined ? item.maxAge : "",
        displayName: item.displayName || "",
        status: item.status || "active",
      });
    } else if (activeTab === "family-types") {
      setFamilyTypeForm({
        name: item.name || "",
        code: item.code || "",
        adultCount: item.adultCount !== undefined ? item.adultCount : "",
        childCount: item.childCount !== undefined ? item.childCount : "",
        status: item.status || "active",
      });
    }
    setIsModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Prepared payload formatted correctly
      const coveragePayload = { ...coverageForm };
      const sumInsuredPayload = {
        ...sumInsuredForm,
        amount: Number(sumInsuredForm.amount),
      };
      const ageSlabPayload = {
        ...ageSlabForm,
        minAge: Number(ageSlabForm.minAge),
        maxAge: Number(ageSlabForm.maxAge),
      };
      const familyTypePayload = {
        ...familyTypeForm,
        adultCount: Number(familyTypeForm.adultCount || 0),
        childCount: Number(familyTypeForm.childCount || 0),
      };

      if (editingItem) {
        // UPDATE MODE
        if (activeTab === "coverages") {
          await updateCoverageApi(editingItem._id, coveragePayload);
          toast.success("Coverage item updated!");
        } else if (activeTab === "sum-insured") {
          await updateSumInsuredApi(editingItem._id, sumInsuredPayload);
          toast.success("Sum Insured slab updated!");
        } else if (activeTab === "age-slabs") {
          await updateAgeSlabApi(editingItem._id, ageSlabPayload);
          toast.success("Age slab updated!");
        } else if (activeTab === "family-types") {
          await updateFamilyTypeApi(editingItem._id, familyTypePayload);
          toast.success("Family type updated!");
        }
      } else {
        // CREATE MODE
        if (activeTab === "coverages") {
          await createCoverageApi(coveragePayload);
          toast.success("Coverage item created!");
        } else if (activeTab === "sum-insured") {
          await createSumInsuredApi(sumInsuredPayload);
          toast.success("Sum Insured slab created!");
        } else if (activeTab === "age-slabs") {
          await createAgeSlabApi(ageSlabPayload);
          toast.success("Age slab created!");
        } else if (activeTab === "family-types") {
          await createFamilyTypeApi(familyTypePayload);
          toast.success("Family composition type created!");
        }
      }
      setIsModalOpen(false);
      fetchMasterData();
    } catch (err: any) {
      console.error("Submit master error:", err);
      toast.error(err.response?.data?.message || `Failed to ${editingItem ? "update" : "create"} master entry`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      if (activeTab === "coverages") {
        await deleteCoverageApi(deletingItem._id);
        toast.success("Coverage item deleted successfully!");
      } else if (activeTab === "sum-insured") {
        await deleteSumInsuredApi(deletingItem._id);
        toast.success("Sum Insured slab deleted successfully!");
      } else if (activeTab === "age-slabs") {
        await deleteAgeSlabApi(deletingItem._id);
        toast.success("Age slab deleted successfully!");
      } else if (activeTab === "family-types") {
        await deleteFamilyTypeApi(deletingItem._id);
        toast.success("Family type deleted successfully!");
      }
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchMasterData();
    } catch (err: any) {
      console.error("Delete master error:", err);
      toast.error(err.response?.data?.message || "Failed to delete master entry");
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(term);
  });

  const getColSpan = () => {
    if (activeTab === "family-types") return 5;
    return 4;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Master Data Center <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Configure insurance coverages, sum insured slabs, age brackets, and family composition types.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs sm:text-sm h-10"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Master Item
          </Button>
        </div>

        {/* Master Category Tabs (shadcn Tabs) */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 flex-wrap h-auto">
            <TabsTrigger
              value="coverages"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs font-bold rounded-lg px-4 py-2 flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" /> Coverages Master
            </TabsTrigger>
            <TabsTrigger
              value="sum-insured"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs font-bold rounded-lg px-4 py-2 flex items-center gap-2 transition"
            >
              <DollarSign className="w-4 h-4" /> Sum Insured Slabs
            </TabsTrigger>
            <TabsTrigger
              value="age-slabs"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs font-bold rounded-lg px-4 py-2 flex items-center gap-2 transition"
            >
              <Calendar className="w-4 h-4" /> Age Bracket Slabs
            </TabsTrigger>
            <TabsTrigger
              value="family-types"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs font-bold rounded-lg px-4 py-2 flex items-center gap-2 transition"
            >
              <Users className="w-4 h-4" /> Family Types
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              type="text"
              placeholder={`Search ${activeTab.replace("-", " ")}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            Total Records: {filteredItems.length}
          </span>
        </div>

        {/* Data Table (shadcn Table) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50">
              {activeTab === "coverages" && (
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              )}
              {activeTab === "sum-insured" && (
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹)</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              )}
              {activeTab === "age-slabs" && (
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bracket Name</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Age Range</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              )}
              {activeTab === "family-types" && (
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type Name</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Adults / Kids</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              )}
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={getColSpan()} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                    Loading master records...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={getColSpan()} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No records found for &quot;{activeTab}&quot;. Click &quot;Add New Master Item&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, idx) => (
                  <TableRow key={item._id || idx} className="hover:bg-slate-50 transition">
                    {activeTab === "coverages" && (
                      <>
                        <TableCell className="px-6 py-4 font-bold text-slate-900">{item.title}</TableCell>
                        <TableCell className="px-6 py-4 text-xs text-slate-500 max-w-sm truncate">{item.description}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            className={
                              item.status === "inactive"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> {item.status || "active"}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {activeTab === "sum-insured" && (
                      <>
                        <TableCell className="px-6 py-4 font-bold text-slate-900">{item.displayName}</TableCell>
                        <TableCell className="px-6 py-4 font-mono text-orange-600 font-extrabold">
                          ₹{Number(item.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            className={
                              item.status === "inactive"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> {item.status || "active"}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {activeTab === "age-slabs" && (
                      <>
                        <TableCell className="px-6 py-4 font-bold text-slate-900">{item.displayName}</TableCell>
                        <TableCell className="px-6 py-4 text-xs font-mono text-slate-700 font-semibold">
                          {item.minAge} - {item.maxAge} Years
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            className={
                              item.status === "inactive"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> {item.status || "active"}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {activeTab === "family-types" && (
                      <>
                        <TableCell className="px-6 py-4 font-bold text-slate-900">{item.name}</TableCell>
                        <TableCell className="px-6 py-4 font-mono text-xs text-orange-600 font-bold">{item.code}</TableCell>
                        <TableCell className="px-6 py-4 text-xs text-slate-700">
                          {item.adultCount} Adult(s), {item.childCount} Kid(s)
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            className={
                              item.status === "inactive"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> {item.status || "active"}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Actions Column */}
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-orange-600 hover:border-orange-200 bg-white"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(item)}
                          className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Dialog (shadcn Dialog) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingItem ? "Edit" : "Add"} {activeTab.replace("-", " ").toUpperCase()} Item
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingItem ? "Update existing" : "Create a new"} master data entry for ICICI insurance system configuration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {activeTab === "coverages" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Coverage Title *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Hospitalisation Expenses"
                    value={coverageForm.title}
                    onChange={(e) => setCoverageForm({ ...coverageForm, title: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Inpatient room rent & ICU"
                    value={coverageForm.description}
                    onChange={(e) => setCoverageForm({ ...coverageForm, description: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={coverageForm.status}
                    onChange={(e) => setCoverageForm({ ...coverageForm, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === "sum-insured" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={sumInsuredForm.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const amount = val === "" ? "" : Number(val);
                      let displayName = sumInsuredForm.displayName;
                      if (typeof amount === "number" && amount > 0) {
                        if (amount >= 10000000) displayName = `${amount / 10000000} Crore`;
                        else displayName = `${amount / 100000} Lakhs`;
                      }
                      setSumInsuredForm({ ...sumInsuredForm, amount, displayName });
                    }}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Display Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 5 Lakhs"
                    value={sumInsuredForm.displayName}
                    onChange={(e) => setSumInsuredForm({ ...sumInsuredForm, displayName: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={sumInsuredForm.status}
                    onChange={(e) => setSumInsuredForm({ ...sumInsuredForm, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === "age-slabs" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Min Age *
                    </label>
                    <Input
                      type="number"
                      required
                      placeholder="e.g. 18"
                      value={ageSlabForm.minAge}
                      onChange={(e) => {
                        const val = e.target.value;
                        const minAge = val === "" ? "" : Number(val);
                        const maxAge = ageSlabForm.maxAge;
                        const displayName = (minAge !== "" && maxAge !== "") ? `${minAge}-${maxAge} Years` : ageSlabForm.displayName;
                        setAgeSlabForm({
                          ...ageSlabForm,
                          minAge,
                          displayName,
                        });
                      }}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Max Age *
                    </label>
                    <Input
                      type="number"
                      required
                      placeholder="e.g. 25"
                      value={ageSlabForm.maxAge}
                      onChange={(e) => {
                        const val = e.target.value;
                        const maxAge = val === "" ? "" : Number(val);
                        const minAge = ageSlabForm.minAge;
                        const displayName = (minAge !== "" && maxAge !== "") ? `${minAge}-${maxAge} Years` : ageSlabForm.displayName;
                        setAgeSlabForm({
                          ...ageSlabForm,
                          maxAge,
                          displayName,
                        });
                      }}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Display Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 18-25 Years"
                    value={ageSlabForm.displayName}
                    onChange={(e) => setAgeSlabForm({ ...ageSlabForm, displayName: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={ageSlabForm.status}
                    onChange={(e) => setAgeSlabForm({ ...ageSlabForm, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === "family-types" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Type Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 1 Adult + 1 Kid"
                    value={familyTypeForm.name}
                    onChange={(e) => setFamilyTypeForm({ ...familyTypeForm, name: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Code *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 1A+1K"
                    value={familyTypeForm.code}
                    onChange={(e) => setFamilyTypeForm({ ...familyTypeForm, code: e.target.value })}
                    className="bg-slate-50 border-slate-200 font-mono text-orange-600 font-bold focus-visible:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Adult Count
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 1"
                      value={familyTypeForm.adultCount}
                      onChange={(e) => setFamilyTypeForm({ ...familyTypeForm, adultCount: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Child Count
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 1"
                      value={familyTypeForm.childCount}
                      onChange={(e) => setFamilyTypeForm({ ...familyTypeForm, childCount: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-mono font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={familyTypeForm.status}
                    onChange={(e) => setFamilyTypeForm({ ...familyTypeForm, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-slate-200 bg-white text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? "Update Master Record" : "Save Master Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete this master record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingItem && (
            <div className="p-3 my-2 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">
                {deletingItem.title || deletingItem.displayName || deletingItem.name}
              </div>
              {deletingItem.description && <div className="text-slate-500">{deletingItem.description}</div>}
              {deletingItem.amount && <div className="text-orange-600 font-mono font-bold">₹{Number(deletingItem.amount).toLocaleString()}</div>}
              {deletingItem.code && <div className="text-orange-600 font-mono font-bold">Code: {deletingItem.code}</div>}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="border-slate-200 bg-white text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
