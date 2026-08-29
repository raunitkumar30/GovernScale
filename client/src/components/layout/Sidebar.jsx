import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Building2,
  Network,
  Users,
  Briefcase,
  BarChart3,
  BrainCircuit,
  FileText,
  Settings,
  LogOut,
  Shield,
  ListChecks,
  HelpCircle,
  X,
  History,
} from "lucide-react";

import { useAuth } from "../../pages/auth/AuthContext";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // =====================================================
  // CURRENT USER & LEVEL CHECKS
  // =====================================================
  const userLevel = currentUser?.level || "government";
  const isGovernment = userLevel === "government";
  const isDepartment = userLevel === "department";
  const isOrganization = userLevel === "organization";
  const isTeam = userLevel === "team";
  const isEmployee = userLevel === "employee";

  const levelName = isGovernment
    ? "Government"
    : isDepartment
    ? "Department"
    : isOrganization
    ? "Organization"
    : isTeam
    ? "Team"
    : "Employee";

  const roleName = isGovernment
    ? "Super Admin"
    : isDepartment
    ? "Department Head"
    : isOrganization
    ? "Organization Admin"
    : isTeam
    ? "Team Lead"
    : "Employee";

  const initials = isGovernment
    ? "SA"
    : isDepartment
    ? "DH"
    : isOrganization
    ? "OA"
    : isTeam
    ? "TL"
    : "EM";

  // =====================================================
  // DYNAMIC PATHS
  // =====================================================
  const dashboardPath = isGovernment
    ? "/government/dashboard"
    : isDepartment
    ? "/department/dashboard"
    : isOrganization
    ? "/organization/dashboard"
    : isTeam
    ? "/team/dashboard"
    : "/employee/dashboard";

  const missionPath = isGovernment
    ? "/government/missions"
    : isDepartment
    ? "/department/missions"
    : isOrganization
    ? "/organization/missions"
    : isTeam
    ? "/team/missions"
    : "/employee/missions";

  const taskPath = "/employee/tasks";

  const reportPath = isGovernment
    ? "/government/reports"
    : isDepartment
    ? "/department/reports"
    : isOrganization
    ? "/organization/reports"
    : isTeam
    ? "/team/reports"
    : "/employee/reports";

  const settingsPath = isGovernment
    ? "/government/settings"
    : isDepartment
    ? "/department/settings"
    : isOrganization
    ? "/organization/settings"
    : isTeam
    ? "/team/settings"
    : "/employee/settings";

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-hidden bg-white text-slate-800 border-r border-slate-200/80">
      {/* TOP: BRAND & LEVEL */}
      <div className="shrink-0">
        {/* Brand Header */}
        <div className="flex h-[76px] items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#154B38] text-white shadow-sm shadow-emerald-950/20">
              <Shield size={20} strokeWidth={2.4} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-extrabold tracking-tight text-slate-900">
                GovernScale
              </h1>
              <p className="truncate text-[10px] font-semibold text-emerald-700 tracking-wide">
                Productivity OS
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Level Pill Card */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between rounded-xl bg-[#EBF6F0] px-3.5 py-2.5 border border-[#D1EBDD]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#154B38] animate-pulse" />
              <span className="text-[11px] font-bold text-[#154B38] uppercase tracking-wider">
                {levelName} Tier
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#154B38]/70">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE: SCROLLABLE NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* SECTION: MENU */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Menu
          </p>

          <div className="space-y-1">
            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              path={dashboardPath}
              onClick={onClose}
            />

            <NavItem
              icon={<Target size={18} />}
              label="Missions"
              path={missionPath}
              onClick={onClose}
            />

            {isEmployee && (
              <NavItem
                icon={<ListChecks size={18} />}
                label="Tasks"
                path={taskPath}
                onClick={onClose}
              />
            )}

            {isGovernment && (
              <NavItem
                icon={<Building2 size={18} />}
                label="Departments"
                path="/government/departments"
                onClick={onClose}
              />
            )}

            {(isGovernment || isDepartment) && (
              <NavItem
                icon={<Network size={18} />}
                label="Organizations"
                path={
                  isDepartment
                    ? "/department/organizations"
                    : "/government/organizations"
                }
                onClick={onClose}
              />
            )}

            {(isGovernment || isDepartment || isOrganization) && (
              <NavItem
                icon={<Users size={18} />}
                label="Teams"
                path={
                  isGovernment
                    ? "/government/teams"
                    : isDepartment
                    ? "/department/teams"
                    : "/organization/teams"
                }
                onClick={onClose}
              />
            )}

            {(isGovernment || isDepartment || isOrganization || isTeam) && (
              <NavItem
                icon={<Briefcase size={18} />}
                label="Employees"
                path={
                  isGovernment
                    ? "/government/employees"
                    : isDepartment
                    ? "/department/employees"
                    : isOrganization
                    ? "/organization/employees"
                    : "/team/employees"
                }
                onClick={onClose}
              />
            )}

            {(isGovernment || isDepartment || isOrganization || isTeam) && (
              <NavItem
                icon={<BarChart3 size={18} />}
                label="Analytics"
                path={
                  isGovernment
                    ? "/government/analytics"
                    : isDepartment
                    ? "/department/analytics"
                    : isOrganization
                    ? "/organization/analytics"
                    : "/team/analytics"
                }
                onClick={onClose}
              />
            )}

            {isGovernment && (
              <NavItem
                icon={<BrainCircuit size={18} />}
                label="Decision Support"
                path="/government/decision-support"
                onClick={onClose}
              />
            )}

            {isGovernment && (
              <NavItem
                icon={<History size={18} />}
                label="Audit Log"
                path="/government/audit-log"
                onClick={onClose}
              />
            )}

            <NavItem
              icon={<FileText size={18} />}
              label="Reports"
              path={reportPath}
              onClick={onClose}
            />
          </div>
        </div>

        {/* SECTION: GENERAL */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            General
          </p>

          <div className="space-y-1">
            <NavItem
              icon={<Settings size={18} />}
              label="Settings"
              path={settingsPath}
              onClick={onClose}
            />

            <button
              type="button"
              onClick={() => {
                window.alert("GovernScale Help & Knowledge Base: All documentation and governance protocols are active.");
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-[#EBF6F0]/60 hover:text-[#154B38]"
            >
              <span className="shrink-0 text-slate-400">
                <HelpCircle size={18} />
              </span>
              <span className="truncate">Help & Guides</span>
            </button>
          </div>
        </div>
      </nav>

      {/* FOOTER: USER & LOGOUT */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 bg-slate-50 border border-slate-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#154B38] text-xs font-bold text-white shadow-sm">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">
              {currentUser?.name || roleName}
            </p>
            <p className="truncate text-[10px] text-slate-500 font-medium">
              {currentUser?.email || `${levelName.toLowerCase()}@governscale.demo`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col z-30">
        {sidebarContent}
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

/* =========================================================
   NAV ITEM COMPONENT (Matching reference active pill state)
========================================================= */
const NavItem = ({ icon, label, path, badge, onClick }) => {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) => `
        group relative flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150
        ${
          isActive
            ? "bg-[#154B38] text-white shadow-sm shadow-[#154B38]/20"
            : "text-slate-600 hover:bg-[#EBF6F0]/60 hover:text-[#154B38]"
        }
      `}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`shrink-0 transition-colors ${
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-[#154B38]"
              }`}
            >
              {icon}
            </span>

            <span className="truncate">{label}</span>
          </div>

          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-[#EBF6F0] text-[#154B38]"
              }`}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default Sidebar;