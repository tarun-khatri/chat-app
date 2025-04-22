import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/auth/request-password-reset", { email });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Password reset successfully!");
      setStep(3);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="w-full max-w-md bg-base-100 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" /> Forgot Password
        </h2>
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Send OTP"}
            </button>
            <div className="text-center mt-2">
              <Link to="/login" className="link link-primary">Back to Login</Link>
            </div>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">OTP</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type="password"
                  className="input input-bordered w-full pl-10"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Reset Password"}
            </button>
          </form>
        )}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="text-green-600 font-semibold text-lg">Password reset successfully!</div>
            <Link to="/login" className="btn btn-primary w-full">Go to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
