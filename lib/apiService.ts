import api, { API_BASE_URL } from "./axios";

// ----------------------------------------------------
// 🔐 1. Authentication & Session Management
// ----------------------------------------------------

/** Register: name + email + phone (no password) */
export const registerApi = (data: { name: string; email: string; phone: string }) => {
  return api.post("/api/auth/register", data);
};

/** Step 1 of login: send OTP to mobile */
export const sendOtpApi = (phone: string) => {
  return api.post("/api/auth/send-otp", { phone });
};

/** Step 2 of login: verify OTP and receive tokens */
export const verifyOtpApi = (phone: string, otp: string) => {
  return api.post("/api/auth/verify-otp", { phone, otp });
};

export const getMeApi = () => {
  return api.get("/api/auth/me");
};

export const logoutApi = () => {
  return api.post("/api/auth/logout");
};

export const refreshTokenApi = (refreshToken?: string) => {
  return api.post("/api/auth/refresh-token", { refreshToken });
};

// ----------------------------------------------------
// 📦 2. Insurance Plans Master Module
// ----------------------------------------------------
export interface GetPlansParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const getPlansApi = (params?: GetPlansParams) => {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  return api.get(`/api/admin/plans?${query.toString()}`);
};

export const createPlanApi = (data: {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  logo?: string;
  status?: string;
}) => {
  return api.post("/api/admin/plans", data);
};

export const updatePlanApi = (id: string, data: Partial<{
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  logo: string;
  status: string;
}>) => {
  return api.put(`/api/admin/plans/${id}`, data);
};

export const deletePlanApi = (id: string) => {
  return api.delete(`/api/admin/plans/${id}`);
};

export const togglePlanStatusApi = (id: string, status: string) => {
  return api.patch(`/api/admin/plans/${id}/status`, { status });
};

// ----------------------------------------------------
// ⚙️ 3. Plan Options Master Module
// ----------------------------------------------------
export const getPlanOptionsApi = (planId: string) => {
  return api.get(`/api/admin/plan-options?planId=${planId}`);
};

export const createPlanOptionApi = (data: {
  planId: string;
  name: string;
  description?: string;
  status?: string;
}) => {
  return api.post("/api/admin/plan-options", data);
};

export const updatePlanOptionApi = (id: string, data: Partial<{
  name: string;
  description: string;
  status: string;
}>) => {
  return api.put(`/api/admin/plan-options/${id}`, data);
};

export const deletePlanOptionApi = (id: string) => {
  return api.delete(`/api/admin/plan-options/${id}`);
};

// ----------------------------------------------------
// 🛡️ 4. Coverage Master Module
// ----------------------------------------------------
export const getCoveragesApi = () => {
  return api.get("/api/admin/coverages");
};

export const createCoverageApi = (data: {
  title: string;
  description?: string;
  icon?: string;
  status?: string;
}) => {
  return api.post("/api/admin/coverages", data);
};

// ----------------------------------------------------
// 💰 5. Sum Insured Master Module
// ----------------------------------------------------
export const getSumInsuredApi = () => {
  return api.get("/api/admin/sum-insured");
};

export const createSumInsuredApi = (data: {
  amount: number;
  displayName: string;
  status?: string;
}) => {
  return api.post("/api/admin/sum-insured", data);
};

// ----------------------------------------------------
// 🎂 6. Age Slab Master Module
// ----------------------------------------------------
export const getAgeSlabsApi = () => {
  return api.get("/api/admin/age-slabs");
};

export const createAgeSlabApi = (data: {
  minAge: number;
  maxAge: number;
  displayName: string;
  status?: string;
}) => {
  return api.post("/api/admin/age-slabs", data);
};

// ----------------------------------------------------
// 👨‍👩‍👧 7. Family Type Master Module
// ----------------------------------------------------
export const getFamilyTypesApi = () => {
  return api.get("/api/admin/family-types");
};

export const createFamilyTypeApi = (data: {
  name: string;
  code: string;
  adultCount: number;
  childCount: number;
  status?: string;
}) => {
  return api.post("/api/admin/family-types", data);
};

// ----------------------------------------------------
// 🔗 8. Plan Option Coverage Matrix Module
// ----------------------------------------------------
export const getPlanOptionCoveragesApi = (planId: string, optionId: string) => {
  return api.get(`/api/admin/plan-option-coverages?planId=${planId}&optionId=${optionId}`);
};

export const savePlanOptionCoverageApi = (data: {
  planId: string;
  optionId: string;
  coverageId: string;
  isCovered: boolean;
  value: string;
}) => {
  return api.post("/api/admin/plan-option-coverages", data);
};

// ----------------------------------------------------
// 📄 9. Policy Conditions & Sub-limits Module
// ----------------------------------------------------
export const savePolicyConditionsApi = (data: {
  planId: string;
  roomRentLimit?: string;
  ambulanceCoverLimit?: number;
  maternityLimit?: number;
  coPayPercentage?: number;
  initialWaitingPeriodDays?: number;
  specificIllnessWaitingDays?: number;
  preExistingDiseaseWaitingMonths?: number;
  diseaseSubLimits?: Array<{ diseaseName: string; limitAmount: number }>;
  exclusions?: string[];
}) => {
  return api.post("/api/admin/policy-conditions", data);
};

export const seedPolicyConditionsApi = () => {
  return api.post("/api/admin/policy-conditions/seed");
};

// ----------------------------------------------------
// 📊 10. Premium Rate Matrix & Bulk Excel Upload Module
// ----------------------------------------------------
export interface GetPremiumRatesParams {
  planId?: string;
  page?: number;
  limit?: number;
}

export const getPremiumRatesApi = (params?: GetPremiumRatesParams) => {
  const query = new URLSearchParams();
  if (params?.planId) query.set("planId", params.planId);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  return api.get(`/api/admin/premium-rates?${query.toString()}`);
};

export const createPremiumRateApi = (data: {
  planId: string;
  optionId: string;
  sumInsuredId: string;
  ageSlabId: string;
  familyTypeId: string;
  basePremium: number;
  gstPercentage?: number;
}) => {
  return api.post("/api/admin/premium-rates", data);
};

export const uploadPremiumExcelApi = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/admin/premium/upload-excel", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const downloadExcelTemplateApi = () => {
  return api.get("/api/admin/premium/download-excel-template", {
    responseType: "blob",
  });
};

export const getExcelTemplateDownloadUrl = () => {
  return `${API_BASE_URL}/api/admin/premium/download-excel-template`;
};

// ----------------------------------------------------
// 📝 11. Customer Applications & Underwriting Review Module
// ----------------------------------------------------
export interface GetApplicationsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getApplicationsApi = (params?: GetApplicationsParams) => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  return api.get(`/api/admin/applications?${query.toString()}`);
};

export const getApplicationDetailApi = (id: string) => {
  return api.get(`/api/admin/applications/${id}`);
};

export const updateApplicationStatusApi = (
  id: string,
  payload: { status: "APPROVED" | "REJECTED"; rejectionReason?: string }
) => {
  return api.patch(`/api/admin/applications/${id}/status`, payload);
};

// ----------------------------------------------------
// 📱 12. Customer Applied Insurances & Applications Module
// ----------------------------------------------------
export interface GetCustomerApplicationsParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** Get list of all insurance policies applied by the logged-in customer */
export const getMyApplicationsApi = (params?: GetCustomerApplicationsParams) => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  return api.get(`/api/customer/applications?${query.toString()}`);
};

/** Get detailed view of a specific insurance application submitted by customer */
export const getCustomerApplicationDetailApi = (id: string) => {
  return api.get(`/api/customer/applications/${id}`);
};

/** Apply for a new insurance policy */
export const applyForInsurancePolicyApi = (payload: any) => {
  return api.post("/api/customer/applications", payload);
};

