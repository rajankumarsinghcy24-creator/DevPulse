import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, User, Mail, Lock, Loader2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "developer",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5F0] border border-[#B8EAD9] shadow-subtle mb-4">
          <Sparkles className="w-7 h-7 text-[#0F8B6D]" />
        </div>
        <h2 className="text-3xl font-bold text-[#1F2933] tracking-tight">
          Create an Account
        </h2>
        <p className="mt-1.5 text-sm text-[#667085]">
          Join your engineering team on DevPulse
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-[#E7E7E0] sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-[#FDF2F2] border border-[#FDE2E2] text-[#C94C4C] text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C94C4C]" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98A2B3]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Taylor Swift"
                  className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98A2B3]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="taylor@devpulse.io"
                  className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                Role in Team
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
              >
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager / Team Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98A2B3]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98A2B3]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create DevPulse Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-[#E7E7E0]">
            <p className="text-sm text-[#667085]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#0F8B6D] hover:text-[#0B7057] transition"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
