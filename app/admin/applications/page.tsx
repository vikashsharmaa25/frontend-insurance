"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getApplicationsApi,
  getApplicationDetailApi,
  updateApplicationStatusApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  HeartPulse,
  CreditCard,
  Sliders,
  AlertTriangle,
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Audit Detail Modal / Drawer state
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Rejection Modal State
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApplicationsApi({
        status: statusFilter,
        search,
        page,
        limit: 10,
      });
      const data = res.data?.data;
      if (data) {
        setApplications(data.applications || (Array.isArray(data) ? data : []));
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Fetch applications error:", err);
      toast.error("Failed to load customer applications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenAuditModal = async (id: string) => {
    setSelectedAppId(id);
    setAuditData(null);
    try {
      setLoadingAudit(true);
      const res = await getApplicationDetailApi(id);
      setAuditData(res.data?.data || res.data);
    } catch (err) {
      console.error("Fetch audit detail error:", err);
      toast.error("Failed to load full application audit detail");
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this application and issue the policy?")) return;
    try {
      setSubmittingAction(true);
      await updateApplicationStatusApi(id, { status: "APPROVED" });
      toast.success("Application approved and policy issued!");
      if (selectedAppId === id) setSelectedAppId(null);
      fetchApplications();
    } catch (err: any) {
      console.error("Approve error:", err);
      toast.error(err.response?.data?.message || "Failed to approve application");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAppId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      setSubmittingAction(true);
      await updateApplicationStatusApi(rejectingAppId, {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("Application rejected.");
      setRejectingAppId(null);
      setRejectionReason("");
      if (selectedAppId === rejectingAppId) setSelectedAppId(null);
      fetchApplications();
    } catch (err: any) {
      console.error("Reject error:", err);
      toast.error(err.response?.data?.message || "Failed to reject application");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const uppercaseStatus = (status || "").toUpperCase();
    if (uppercaseStatus === "PENDING_APPROVAL" || uppercaseStatus === "PENDING") {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Approval
        </Badge>
      );
    }
    if (uppercaseStatus === "APPROVED" || uppercaseStatus === "POLICY_ISSUED") {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Approved / Issued
        </Badge>
      );
    }
    if (uppercaseStatus === "REJECTED") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-slate-600 border-slate-200">
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Customer Applications & Underwriting <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Audit applicant details, medical history, member lists & issue or reject policies.
            </p>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              type="text"
              placeholder="Search application no, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-orange-600" /> Status:
            </span>
            <button
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${statusFilter === "all"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter("PENDING_APPROVAL");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${statusFilter === "PENDING_APPROVAL"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => {
                setStatusFilter("APPROVED");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${statusFilter === "APPROVED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              Approved
            </button>
            <button
              onClick={() => {
                setStatusFilter("REJECTED");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${statusFilter === "REJECTED"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Applications Data Table (shadcn Table) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">App & Policy No.</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant Name</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email / Phone</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Premium</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created Date</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                    Fetching application records...
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No applications found for selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => {
                  const status = app.status || "PENDING_APPROVAL";
                  const isPending = status === "PENDING_APPROVAL" || status === "PENDING";

                  return (
                    <TableRow key={app._id} className="hover:bg-slate-50 transition">
                      <TableCell className="px-6 py-4">
                        <div className="font-mono text-xs text-orange-600 font-extrabold">
                          {app.applicationNumber || app._id?.slice(-8)}
                        </div>
                        {app.policyNumber && (
                          <div className="text-[11px] font-mono text-emerald-600 font-bold">
                            Pol: {app.policyNumber}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-6 py-4 font-bold text-slate-900">
                        {app.applicantDetails?.fullName || "N/A"}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-xs">
                        <div className="text-slate-800 font-medium">{app.applicantDetails?.email}</div>
                        <div className="text-slate-400">{app.applicantDetails?.phone}</div>
                      </TableCell>

                      <TableCell className="px-6 py-4 font-mono font-extrabold text-slate-900">
                        ₹{app.pricing?.totalPremium ? Number(app.pricing.totalPremium).toLocaleString() : "0"}
                      </TableCell>

                      <TableCell className="px-6 py-4">{getStatusBadge(status)}</TableCell>

                      <TableCell className="px-6 py-4 text-xs text-slate-500">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAuditModal(app._id)}
                            className="h-8 text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Audit
                          </Button>

                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(app._id)}
                                disabled={submittingAction}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectingAppId(app._id);
                                  setRejectionReason("");
                                }}
                                disabled={submittingAction}
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
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
                Page {page} of {totalPages} ({totalItems} total applications)
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

      {/* Audit Detail Dialog (shadcn Dialog) */}
      <Dialog
        open={Boolean(selectedAppId)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppId(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl bg-white border-slate-200 text-slate-900 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono text-orange-600 font-bold uppercase">Underwriting Audit File</span>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Application Audit: {auditData?.applicationNumber || selectedAppId}
            </DialogTitle>
          </DialogHeader>

          {loadingAudit ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
              Loading detailed audit log...
            </div>
          ) : auditData ? (
            <div className="space-y-6 text-xs text-slate-700 pt-2">
              {/* Status Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">
                    Current Audit Status
                  </span>
                  <div className="mt-1">{getStatusBadge(auditData.status)}</div>
                </div>
                {auditData.policyNumber && (
                  <div className="text-right">
                    <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">
                      Issued Policy Number
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      {auditData.policyNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Section 1: Applicant Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-orange-600" /> Primary Applicant Info
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Full Name</span>
                    <span className="font-bold text-slate-900">{auditData.applicantDetails?.fullName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="font-mono text-slate-800 font-semibold">{auditData.applicantDetails?.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone Number</span>
                    <span className="font-mono text-slate-800 font-semibold">{auditData.applicantDetails?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Premium & Tax Breakdown
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Base Premium</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{auditData.pricing?.basePremium ? Number(auditData.pricing.basePremium).toLocaleString() : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GST Amount</span>
                    <span className="font-mono text-slate-700">
                      ₹{auditData.pricing?.gstAmount ? Number(auditData.pricing.gstAmount).toLocaleString() : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Payable</span>
                    <span className="font-mono font-extrabold text-orange-600 text-sm">
                      ₹{auditData.pricing?.totalPremium ? Number(auditData.pricing.totalPremium).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Insured Members */}
              {auditData.insuredMembers && auditData.insuredMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <HeartPulse className="w-4 h-4 text-amber-600" /> Insured Family Members
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    {auditData.insuredMembers.map((m: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                        <div>
                          <span className="font-bold text-slate-900">{m.firstName} {m.lastName}</span>
                          <span className="text-slate-500 ml-2">({m.relationship || "Member"})</span>
                        </div>
                        <div className="text-slate-600 font-medium">
                          Age: {m.age || "N/A"} • Gender: {m.gender || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason display if rejected */}
              {auditData.rejectionReason && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <span className="font-bold block mb-1">Rejection Reason:</span>
                  <p>{auditData.rejectionReason}</p>
                </div>
              )}

              {/* Actions inside audit dialog */}
              {(auditData.status === "PENDING_APPROVAL" || auditData.status === "PENDING") && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRejectingAppId(auditData._id);
                      setRejectionReason("");
                    }}
                    className="text-red-600 hover:bg-red-50 font-bold"
                  >
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => handleApprove(auditData._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Approve & Issue Policy
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog (shadcn Dialog) */}
      <Dialog
        open={Boolean(rejectingAppId)}
        onOpenChange={(open) => {
          if (!open) setRejectingAppId(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Reject Application
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              State the official underwriting rejection reason to record in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmReject} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Pre-existing medical condition exceeds max coverage threshold"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingAppId(null)}
                className="border-slate-200 bg-white text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
