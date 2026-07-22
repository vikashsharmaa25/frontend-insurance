"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  ShieldAlert,
  Phone,
  ArrowRight,
  Loader2,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "phone" | "otp";

export default function LoginPage() {
  const { sendOtp, verifyOtp, user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [demoOtp, setDemoOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-600 animate-spin" />
          <Loader2 className="w-6 h-6 text-orange-600 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Verifying Session...
        </p>
      </div>
    );
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      const { demoOtp: receivedOtp } = await sendOtp(phone.trim());
      setDemoOtp(receivedOtp);
      // Auto-fill OTP digits with dummy OTP
      if (receivedOtp && receivedOtp.length === 6) {
        setOtpDigits(receivedOtp.split(""));
      }
      setStep("otp");
      toast.success("OTP sent! Check the hint below.");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send OTP. Please check your mobile number.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await verifyOtp(phone.trim(), otp);
      toast.success("Login successful! Welcome.");
    } catch (err: any) {
      const message =
        err.message ||                        // role-denied or plain Error
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid or expired OTP. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP box handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
    setOtpDigits(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const digits = pasted.split("");
      setOtpDigits([...digits, ...Array(6 - digits.length).fill("")]);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      const { demoOtp: newOtp } = await sendOtp(phone.trim());
      setDemoOtp(newOtp);
      if (newOtp && newOtp.length === 6) {
        setOtpDigits(newOtp.split(""));
      }
      toast.success("New OTP sent!");
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-slate-50 to-orange-50/50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-87.5 h-87.5 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 p-px shadow-xl shadow-orange-500/20 mb-4">
            <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-orange-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            ICICI Admin Portal
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            {step === "phone"
              ? "Enter your registered mobile number to continue"
              : `Verification code sent to +91 ${phone.slice(-10)}`}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${step === "phone" ? "text-orange-600" : "text-green-600"}`}>
            {step === "otp" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">1</div>
            )}
            Mobile Number
          </div>
          <div className="h-px w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${step === "otp" ? "text-orange-600" : "text-slate-400"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "otp" ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-400"}`}>2</div>
            Verify OTP
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 transition-all duration-300">

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── STEP 1: Phone Input ── */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    required
                    maxLength={15}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-200"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter your 10-digit mobile number registered with ICICI Admin
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 transition duration-200 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">

              {/* Demo OTP Hint Card */}
              {demoOtp && (
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Demo OTP (auto-filled)</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your OTP is <span className="font-mono font-bold text-sm tracking-widest text-amber-900">{demoOtp}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Enter 6-Digit OTP
                </label>

                {/* OTP Digit Boxes */}
                <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition duration-200 caret-orange-500"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join("").length !== 6}
                  className="w-full h-11 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 transition duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Verify & Login
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setErrorMsg(""); setOtpDigits(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Change Number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold transition disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6 font-medium">
          &copy; 2026 ICICI Insurance Management System • Secure Admin Portal
        </p>
      </div>
    </div>
  );
}
