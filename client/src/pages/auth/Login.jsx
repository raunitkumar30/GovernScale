import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  LockKeyhole,
  User,
  Eye,
  EyeOff,
  BarChart3,
  Target,
  Building2,
  Users,
  BriefcaseBusiness,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [officialId, setOfficialId] = useState("government@governscale.demo");
  const [password, setPassword] = useState("GovScale@2026Secure");
  const [error, setError] = useState("");
  const [selectedDemo, setSelectedDemo] = useState("Government");

  const { login } = useAuth();

  // ==========================================================
  // DEMO ACCOUNTS
  // ==========================================================
  const demoAccounts = [
    {
      level: "Government",
      officialId: "government@governscale.demo",
      password: "GovScale@2026Secure",
      role: "Super Admin",
      icon: Shield,
    },
    {
      level: "Department",
      officialId: "department@governscale.demo",
      password: "GovScale@2026Secure",
      role: "Dept Head",
      icon: Building2,
    },
    {
      level: "Organization",
      officialId: "organization@governscale.demo",
      password: "GovScale@2026Secure",
      role: "Org Admin",
      icon: BriefcaseBusiness,
    },
    {
      level: "Team",
      officialId: "team@governscale.demo",
      password: "GovScale@2026Secure",
      role: "Team Lead",
      icon: Users,
    },
    {
      level: "Employee",
      officialId: "employee@governscale.demo",
      password: "GovScale@2026Secure",
      role: "Officer",
      icon: User,
    },
  ];

  // ==========================================================
  // FILL DEMO ACCOUNT
  // ==========================================================
  const fillDemoAccount = (account) => {
    setSelectedDemo(account.level);
    setOfficialId(account.officialId);
    setPassword(account.password);
    setError("");
  };

  // ==========================================================
  // LOGIN SUBMISSION
  // ==========================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!officialId.trim() || !password.trim()) {
      setError("Please enter your Official ID and password.");
      return;
    }

    const result = login(officialId.trim(), password);

    if (!result.success) {
      setError(result.message || "Invalid login credentials.");
      return;
    }

    const level = result.user.level;

    switch (level) {
      case "government":
        navigate("/government/dashboard");
        break;
      case "department":
        navigate("/department/dashboard");
        break;
      case "organization":
        navigate("/organization/dashboard");
        break;
      case "team":
        navigate("/team/dashboard");
        break;
      case "employee":
        navigate("/employee/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  const handleRegister = () => {
    window.alert(
      "GovernScale account provisioning is restricted. Please contact your Department IT Administrator for security credential issuance."
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6F8] font-sans antialiased flex flex-col justify-center">
      {/* 2-Column Split Hero Layout */}
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* =====================================================
            LEFT HERO BRANDING PANEL (5 Columns)
        ====================================================== */}
        <section className="lg:col-span-5 rounded-3xl bg-forest-card-mesh text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-xl border border-emerald-950/20">
          <div className="relative z-10">
            {/* Logo Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#154B38] shadow-md">
                <ShieldCheck size={24} strokeWidth={2.4} />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  GovernScale
                </span>
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-xs">
                  SaaS OS
                </span>
              </div>
            </div>

            {/* Main Punchy Copy */}
            <div className="mt-12 sm:mt-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                <Sparkles size={13} />
                <span>Next-Gen Governance Stack</span>
              </span>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Modern Execution & Performance Intelligence
              </h1>

              <p className="mt-4 text-sm text-emerald-100/90 leading-relaxed font-medium">
                Streamline mission cascading, verify operational milestones, and align productivity from executive leadership to frontline public service.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white">
                  <CheckCircle2 size={13} />
                </div>
                <span>Hierarchical Mission Distribution</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white">
                  <CheckCircle2 size={13} />
                </div>
                <span>4-Factor Verified Output Scoring</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white">
                  <CheckCircle2 size={13} />
                </div>
                <span>Audit-Ready Deliverable Verification</span>
              </div>
            </div>
          </div>

          {/* Glassmorphism Testimonial Card */}
          <div className="relative z-10 mt-10 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15 shadow-inner">
            <p className="text-xs italic text-emerald-50 leading-relaxed">
              "GovernScale transformed how our department monitors civil service delivery and milestone SLA adherence."
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-emerald-300 text-[#154B38] font-bold text-xs flex items-center justify-center">
                AS
              </div>
              <div>
                <p className="text-xs font-bold text-white">Aditya Sharma</p>
                <p className="text-[10px] text-emerald-200/80">Chief Secretary of Administration</p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT FORM & ROLE SELECTOR PANEL (7 Columns)
        ====================================================== */}
        <section className="lg:col-span-7 flex flex-col justify-center">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 card-soft-shadow">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to your Portal
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                Select your administrative role below to instantly load credentials.
              </p>
            </div>

            {/* Quick One-Click Role Selector Cards */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Role Switcher
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  const isSelected = selectedDemo === account.level;

                  return (
                    <button
                      key={account.level}
                      type="button"
                      onClick={() => fillDemoAccount(account)}
                      className={`
                        flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer
                        ${
                          isSelected
                            ? "border-[#154B38] bg-[#EBF6F0] text-[#154B38] shadow-2xs font-bold ring-1 ring-[#154B38]"
                            : "border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 text-slate-700 font-semibold"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                          ${
                            isSelected
                              ? "bg-[#154B38] text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }
                        `}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight">{account.level}</p>
                        <p className="text-[10px] text-slate-400 font-normal truncate">
                          {account.role}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Authorized Credentials
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-shake">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                  !
                </span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Official Email / ID
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    value={officialId}
                    onChange={(e) => setOfficialId(e.target.value)}
                    placeholder="official@governscale.demo"
                    required
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#154B38] focus:ring-4 focus:ring-[#154B38]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <LockKeyhole size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-3 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#154B38] focus:ring-4 focus:ring-[#154B38]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-[#154B38] focus:ring-[#154B38]"
                  />
                  <span>Remember my session</span>
                </label>

                <button
                  type="button"
                  onClick={() => window.alert("Demo password for all official accounts is: GovScale@2026Secure")}
                  className="font-bold text-[#154B38] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#154B38] py-3.5 px-6 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[#0D3427] hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Bottom Help Text */}
            <p className="mt-6 text-center text-xs text-slate-500 font-medium">
              Need assistance?{" "}
              <button
                type="button"
                onClick={handleRegister}
                className="font-bold text-[#154B38] hover:underline cursor-pointer"
              >
                Contact System Administrator
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;