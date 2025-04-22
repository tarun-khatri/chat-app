import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, CheckCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: signup
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const { signup, isSigningUp } = useAuthStore();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    setIsOtpSending(true);
    try {
      await axiosInstance.post("/auth/request-otp", { email: formData.email });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return toast.error("Enter the OTP sent to your email");
    setIsOtpVerifying(true);
    try {
      await axiosInstance.post("/auth/verify-otp", { email: formData.email, otp });
      toast.success("OTP verified! Continue to sign up.");
      setIsOtpVerified(true);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">Get started with your free account</p>
            </div>
          </div>

          {/* Step 1: Email & Send OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isOtpSending}>
                {isOtpSending ? <><Loader2 className="size-5 animate-spin" /> Sending...</> : <>Send OTP <Send className="ml-2 size-4" /></>}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Enter OTP</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full text-center tracking-widest text-lg"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-link text-xs mt-2"
                  onClick={handleSendOtp}
                  disabled={isOtpSending}
                >
                  {isOtpSending ? "Resending..." : "Resend OTP"}
                </button>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isOtpVerifying}>
                {isOtpVerifying ? <><Loader2 className="size-5 animate-spin" /> Verifying...</> : <>Verify OTP <CheckCircle className="ml-2 size-4" /></>}
              </button>
            </form>
          )}

          {/* Step 3: Full Signup Form */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Full Name</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pl-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-5 text-base-content/40" /> : <Eye className="size-5 text-base-content/40" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
                {isSigningUp ? <><Loader2 className="size-5 animate-spin" /> Loading...</> : "Create Account"}
              </button>
            </form>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* right side */}
      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};
export default SignUpPage;
