import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, Lock, Mail, Loader2, AlertCircle, ArrowRight } from "lucide-react";

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (email, password) => {
    setFormData({ email, password });
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5F0] border border-[#B8EAD9] shadow-subtle mb-4">
          <Sparkles className="w-7 h-7 text-[#0F8B6D]" />
        </div>
        <h2 className="text-3xl font-bold text-[#1F2933] tracking-tight">
          Welcome to DevPulse
        </h2>
        <p className="mt-1.5 text-sm text-[#667085]">
          AI-Powered Project & Task Management Platform
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
                  placeholder="developer@devpulse.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-[#E7E7E0]">
            <p className="text-xs font-semibold text-[#667085] mb-2.5 text-center">
              Quick demo account fill:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("alex.chen@devpulse.io", "Password123!")}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F7F7F2] hover:bg-[#EFEFE9] text-[#1F2933] border border-[#E7E7E0] transition text-center"
              >
                Alex Chen (Lead)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("priya.patel@devpulse.io", "Password123!")}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F7F7F2] hover:bg-[#EFEFE9] text-[#1F2933] border border-[#E7E7E0] transition text-center"
              >
                Priya Patel (Dev)
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#667085]">
              Don't have an account yet?{" "}
              <Link
                to="/register"
                className="font-bold text-[#0F8B6D] hover:text-[#0B7057] transition"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
