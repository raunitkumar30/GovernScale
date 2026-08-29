import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Building2,
  Landmark,
  Users,
  Briefcase,
  ChevronUp,
  Sparkles,
} from "lucide-react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../../pages/auth/AuthContext";
import { DEMO_USERS } from "../../pages/auth/demoUsers";

const PERSONAS = [
  {
    role: "Government Admin",
    level: "government",
    icon: Landmark,
    path: "/government/dashboard",
    color: "text-amber-400",
  },
  {
    role: "Department Head",
    level: "department",
    icon: Building2,
    path: "/department/dashboard",
    color: "text-emerald-400",
  },
  {
    role: "Agency Director",
    level: "organization",
    icon: Shield,
    path: "/organization/dashboard",
    color: "text-cyan-400",
  },
  {
    role: "Team Supervisor",
    level: "team",
    icon: Users,
    path: "/team/dashboard",
    color: "text-purple-400",
  },
  {
    role: "Frontline Officer",
    level: "employee",
    icon: Briefcase,
    path: "/employee/tasks",
    color: "text-rose-400",
  },
];

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const { updateCurrentUser, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole =
    PERSONAS.find((p) =>
      location.pathname.startsWith(
        p.path.split("/")[1] ? `/${p.path.split("/")[1]}` : "/login"
      )
    ) || PERSONAS[0];

  const handleSwitchPersona = (persona) => {
    const demo = DEMO_USERS.find((u) => u.level === persona.level) || {
      name: persona.role,
      level: persona.level,
      email: `${persona.level}@governscale.demo`,
    };

    updateCurrentUser({
      id: demo.id,
      name: demo.name,
      email: demo.email,
      level: demo.level,
      department: demo.department,
      organization: demo.organization,
      team: demo.team,
      employeeId: demo.employeeId,
    });

    navigate(persona.path);
    setDockOpen(false);
    window.dispatchEvent(new Event("governscale-data-updated"));
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 antialiased selection:bg-[#154B38] selection:text-white relative">
      <div className="flex min-h-screen">
        {/* SIDEBAR (Desktop sticky + Mobile Drawer) */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* MAIN CONTENT AREA */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* NAVBAR */}
          <Navbar onToggleSidebar={() => setMobileSidebarOpen(true)} />

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 transition-all">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>

      {/* PHASE 10: QUICK ROLE / PERSONA SWITCHER DOCK (FLOATING BOTTOM RIGHT) */}
      <div className="fixed bottom-5 right-5 z-40">
        <div className="flex flex-col items-end">
          {dockOpen && (
            <div className="mb-2 p-2 rounded-2xl bg-[#113E2E] text-white shadow-2xl border border-emerald-950/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 min-w-[220px]">
              <div className="px-3 py-1.5 border-b border-emerald-800/60 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
                <span>Switch Role Persona</span>
                <Sparkles size={12} />
              </div>
              <div className="mt-1 space-y-0.5">
                {PERSONAS.map((p) => {
                  const Icon = p.icon;
                  const isCurrent = currentUser?.level === p.level;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleSwitchPersona(p)}
                      className={`
                        w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer
                        ${
                          isCurrent
                            ? "bg-[#1E654C] text-white shadow-xs"
                            : "text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white"
                        }
                      `}
                    >
                      <Icon size={14} className={p.color} />
                      <span className="truncate">{p.role}</span>
                      {isCurrent && (
                        <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floating Pill Toggle Button */}
          <button
            type="button"
            onClick={() => setDockOpen(!dockOpen)}
            className="flex items-center gap-2 rounded-full bg-[#154B38] text-white py-2 px-3.5 text-xs font-extrabold shadow-lg hover:bg-[#0D3427] hover:scale-105 active:scale-95 transition cursor-pointer border border-emerald-700/50"
          >
            <currentRole.icon size={14} className={currentRole.color} />
            <span className="hidden sm:inline">{currentRole.role}</span>
            <ChevronUp
              size={14}
              className={`transition-transform duration-200 ${
                dockOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;