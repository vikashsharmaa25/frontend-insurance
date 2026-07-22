"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  getPlansApi,
  savePolicyConditionsApi,
  seedPolicyConditionsApi,
} from "@/lib/apiService";
import { toast } from "sonner";
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  Layers,
  Wand2,
  ShieldAlert,
  Clock,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiseaseSubLimit {
  diseaseName: string;
  limitAmount: number;
}

interface Plan {
  _id: string;
  name: string;
}

export default function PolicyConditionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Policy conditions form fields
  const [roomRentLimit, setRoomRentLimit] = useState("Up to 2% for normal room and up to 4% for ICU");
  const [ambulanceCoverLimit, setAmbulanceCoverLimit] = useState(3000);
  const [maternityLimit, setMaternityLimit] = useState(40000);
  const [coPayPercentage, setCoPayPercentage] = useState(10);
  const [initialWaitingPeriodDays, setInitialWaitingPeriodDays] = useState(30);
  const [specificIllnessWaitingDays, setSpecificIllnessWaitingDays] = useState(90);
  const [preExistingDiseaseWaitingMonths, setPreExistingDiseaseWaitingMonths] = useState(24);

  // Dynamic Repeaters
  const [diseaseSubLimits, setDiseaseSubLimits] = useState<DiseaseSubLimit[]>([
    { diseaseName: "Cataract per eye", limitAmount: 30000 },
    { diseaseName: "Hernia Related Surgeries", limitAmount: 90000 },
    { diseaseName: "Knee Ligament Surgery", limitAmount: 150000 },
  ]);

  const [exclusions, setExclusions] = useState<string[]>([
    "Cosmetic surgery",
    "Rest Cure and rehabilitation",
    "Hazardous or Adventure Sports",
  ]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const res = await getPlansApi({ status: "active", limit: 100 });
        const list = res.data?.data?.plans || res.data?.data || [];
        setPlans(list);
        if (list.length > 0) setSelectedPlanId(list[0]._id);
      } catch (err) {
        console.error("Fetch plans error:", err);
        toast.error("Failed to load plans list");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleAddDiseaseSubLimit = () => {
    setDiseaseSubLimits([...diseaseSubLimits, { diseaseName: "", limitAmount: 0 }]);
  };

  const handleRemoveDiseaseSubLimit = (index: number) => {
    setDiseaseSubLimits(diseaseSubLimits.filter((_, i) => i !== index));
  };

  const handleAddExclusion = () => {
    setExclusions([...exclusions, ""]);
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  const handleSeedSample = async () => {
    try {
      setSeeding(true);
      await seedPolicyConditionsApi();
      toast.success("1-Click sample policy document seeded successfully!");
    } catch (err: any) {
      console.error("Seed error:", err);
      toast.error(err.response?.data?.message || "Failed to seed sample policy document");
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error("Please select a Plan first");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        planId: selectedPlanId,
        roomRentLimit,
        ambulanceCoverLimit: Number(ambulanceCoverLimit),
        maternityLimit: Number(maternityLimit),
        coPayPercentage: Number(coPayPercentage),
        initialWaitingPeriodDays: Number(initialWaitingPeriodDays),
        specificIllnessWaitingDays: Number(specificIllnessWaitingDays),
        preExistingDiseaseWaitingMonths: Number(preExistingDiseaseWaitingMonths),
        diseaseSubLimits: diseaseSubLimits.filter((d) => d.diseaseName.trim() !== ""),
        exclusions: exclusions.filter((e) => e.trim() !== ""),
      };

      await savePolicyConditionsApi(payload);
      toast.success("Policy terms & sub-limits saved successfully!");
    } catch (err: any) {
      console.error("Save policy conditions error:", err);
      toast.error(err.response?.data?.message || "Failed to save policy conditions");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Policy Terms & Sub-limits <Sparkles className="w-4 h-4 text-orange-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Configure room rent caps, waiting periods, disease sub-limits, and exclusions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedSample}
              disabled={seeding}
              className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs h-10 font-bold"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-1.5 text-orange-600" />
              )}
              1-Click Seed Sample Document
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Selector */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" /> Target Insurance Plan *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
            >
              {loadingPlans ? (
                <option>Loading active plans...</option>
              ) : plans.length === 0 ? (
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

          {/* Core Terms & Caps */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" /> Key Policy Caps & Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Room Rent Cap / Limit Details
                </label>
                <input
                  type="text"
                  value={roomRentLimit}
                  onChange={(e) => setRoomRentLimit(e.target.value)}
                  placeholder="e.g. Up to 2% for normal room and 4% for ICU"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Ambulance Cover Limit (₹)
                </label>
                <input
                  type="number"
                  value={ambulanceCoverLimit}
                  onChange={(e) => setAmbulanceCoverLimit(Number(e.target.value))}
                  placeholder="3000"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Maternity Cover Limit (₹)
                </label>
                <input
                  type="number"
                  value={maternityLimit}
                  onChange={(e) => setMaternityLimit(Number(e.target.value))}
                  placeholder="40000"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Co-Pay Percentage (%)
                </label>
                <input
                  type="number"
                  value={coPayPercentage}
                  onChange={(e) => setCoPayPercentage(Number(e.target.value))}
                  placeholder="10"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Waiting Periods */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Mandatory Waiting Periods
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Initial Waiting (Days)
                </label>
                <input
                  type="number"
                  value={initialWaitingPeriodDays}
                  onChange={(e) => setInitialWaitingPeriodDays(Number(e.target.value))}
                  placeholder="30"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Specific Illness (Days)
                </label>
                <input
                  type="number"
                  value={specificIllnessWaitingDays}
                  onChange={(e) => setSpecificIllnessWaitingDays(Number(e.target.value))}
                  placeholder="90"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Pre-Existing Disease (Months)
                </label>
                <input
                  type="number"
                  value={preExistingDiseaseWaitingMonths}
                  onChange={(e) => setPreExistingDiseaseWaitingMonths(Number(e.target.value))}
                  placeholder="24"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Disease Sub-Limits Repeater */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-amber-600" /> Disease Sub-Limits Repeater
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddDiseaseSubLimit}
                className="text-xs border-orange-200 bg-orange-50 text-orange-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Disease Limit
              </Button>
            </div>

            <div className="space-y-3">
              {diseaseSubLimits.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Disease Name (e.g. Cataract per eye)"
                    value={item.diseaseName}
                    onChange={(e) => {
                      const newLimits = [...diseaseSubLimits];
                      newLimits[idx].diseaseName = e.target.value;
                      setDiseaseSubLimits(newLimits);
                    }}
                    className="flex-1 h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <div className="w-44">
                    <input
                      type="number"
                      placeholder="Limit Amount (₹)"
                      value={item.limitAmount}
                      onChange={(e) => {
                        const newLimits = [...diseaseSubLimits];
                        newLimits[idx].limitAmount = Number(e.target.value);
                        setDiseaseSubLimits(newLimits);
                      }}
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-semibold"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveDiseaseSubLimit(idx)}
                    className="h-9 w-9 p-0 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Permanent Exclusions List */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" /> Permanent Policy Exclusions
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddExclusion}
                className="text-xs border-orange-200 bg-orange-50 text-orange-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Exclusion Item
              </Button>
            </div>

            <div className="space-y-2">
              {exclusions.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="e.g. Cosmetic surgery"
                    value={ex}
                    onChange={(e) => {
                      const newEx = [...exclusions];
                      newEx[idx] = e.target.value;
                      setExclusions(newEx);
                    }}
                    className="flex-1 h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveExclusion(idx)}
                    className="h-9 w-9 p-0 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-6 h-11 shadow-md shadow-orange-600/20 text-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Policy Conditions Document
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
