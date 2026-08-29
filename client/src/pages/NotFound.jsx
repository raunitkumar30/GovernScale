import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "./auth/AuthContext";

const NotFound = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated || !currentUser) {
      navigate("/login");
      return;
    }

    const homeMap = {
      government: "/government/dashboard",
      department: "/department/dashboard",
      organization: "/organization/dashboard",
      team: "/team/dashboard",
      employee: "/employee/dashboard",
    };

    navigate(homeMap[currentUser.level] || "/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38] mb-5 border border-[#D1EBDD]">
          <ShieldAlert size={36} strokeWidth={2.2} />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
          HTTP 404 • Resource Not Found
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Directive Unreachable
        </h1>

        <p className="text-xs text-slate-500 font-medium mt-2 mb-6 leading-relaxed">
          The governance portal URL or administrative resource you requested does not exist or has been restructured within the hierarchy.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={16} />}
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            className="flex-1"
            onClick={handleGoHome}
            icon={<Home size={16} />}
          >
            Dashboard
          </Button>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-slate-400 mt-6">
        GovernScale Productivity OS • Central Secure Gateway
      </p>
    </div>
  );
};

export default NotFound;
