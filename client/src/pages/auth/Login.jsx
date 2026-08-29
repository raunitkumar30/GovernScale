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
    <div className="min-h-screen w-full bg-[#F4F6F8] font-sans antialiased flex flex-col justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* 2-Column Split Hero Layout */}
      <div className="mx-auto w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
        {/* =====================================================
            LEFT HERO BRANDING PANEL (5 Columns)
        ====================================================== */}
        <section className="lg:col-span-5 rounded-3xl bg-forest-card-mesh text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl border border-emerald-950/20">
          <div className="relative z-10">
            {/* Logo Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#154B38] shadow-md">
                <ShieldCheck size={22} strokeWidth={2.4} />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  GovernScale
                </span>
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-xs">
                  SaaS OS
                </span>
              </div>
            </div>

            {/* Main Punchy Copy */}
            <div className="mt-8 sm:mt-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-400/30">
                <Sparkles size={12} />
                <span>Next-Gen Governance Stack</span>
              </span>

              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Modern Execution & Performance Intelligence
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                Streamline mission cascading, verify operational milestones, and align productivity from executive leadership to frontline public service.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                <span>Hierarchical Mission Distribution</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                <span>4-Factor Verified Output Scoring</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                <span>Audit-Ready Deliverable Verification</span>
              </div>
            </div>
          </div>

          {/* Glassmorphism Testimonial Card */}
          <div className="relative z-10 mt-6 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15 shadow-inner">
            <p className="text-[11px] italic text-emerald-50 leading-relaxed">
              "GovernScale transformed how our department monitors civil service delivery and milestone SLA adherence."
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-300 text-[#154B38] font-bold text-[10px] flex items-center justify-center">
                AS
              </div>
              <div>
                <p className="text-[11px] font-bold text-white leading-tight">Aditya Sharma</p>
                <p className="text-[9px] text-emerald-200/80">Chief Secretary of Administration</p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT FORM & ROLE SELECTOR PANEL (7 Columns)
        ====================================================== */}
        <section className="lg:col-span-7 flex flex-col justify-center">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 card-soft-shadow">
            {/* Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to your Portal
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Select your administrative role below to instantly load credentials.
              </p>
            </div>

            {/* Quick One-Click Role Selector Cards */}
            <div className="mt-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                        flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer
                        ${
                          isSelected
                            ? "border-[#154B38] bg-[#EBF6F0] text-[#154B38] shadow-2xs font-bold ring-1 ring-[#154B38]"
                            : "border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 text-slate-700 font-semibold"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex h-6 w-6 shrink-0 items-center justify-center rounded-lg
                          ${
                            isSelected
                              ? "bg-[#154B38] text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }
                        `}
                      >
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight">{account.level}</p>
                        <p className="text-[9px] text-slate-400 font-normal truncate">
                          {account.role}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Authorized Credentials
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-shake">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                  !
                </span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Official Email / ID
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    value={officialId}
                    onChange={(e) => setOfficialId(e.target.value)}
                    placeholder="official@governscale.demo"
                    required
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#154B38] focus:ring-3 focus:ring-[#154B38]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <LockKeyhole size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-11 text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#154B38] focus:ring-3 focus:ring-[#154B38]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium text-[11px]">
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
                  className="font-bold text-[#154B38] hover:underline cursor-pointer text-[11px]"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full mt-1 flex items-center justify-center gap-2 rounded-full bg-[#154B38] py-3 px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[#0D3427] hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <span>Sign In to Workspace</span>
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Bottom Help Text */}
            <p className="mt-4 text-center text-[11px] text-slate-500 font-medium">
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