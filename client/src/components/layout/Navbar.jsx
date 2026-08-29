import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Mail,
  ChevronDown,
  Shield,
  Menu,
  CheckCircle,
  ExternalLink,
  User,
  LogOut,
  Target,
  Briefcase,
  Building2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../pages/auth/AuthContext";
import { getMissions, getTasks } from "../../utils/localStorage";
import { getEmployees, getDepartments } from "../../data/hierarchy";

const Navbar = ({ onToggleSidebar = () => {} }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const level = currentUser?.level || "government";

  const levelConfig = {
    government: {
      workspace: "Government Workspace",
      title: "Central Administration",
      role: "Super Admin",
      email: "government@governscale.demo",
    },
    department: {
      workspace: "Department Workspace",
      title: currentUser?.department || "Education Department",
      role: "Department Head",
      email: "department@governscale.demo",
    },
    organization: {
      workspace: "Organization Workspace",
      title: currentUser?.organization || "Scholarship Services",
      role: "Organization Admin",
      email: "organization@governscale.demo",
    },
    team: {
      workspace: "Team Workspace",
      title: currentUser?.team || "Scholarship Verification Team",
      role: "Team Lead",
      email: "team@governscale.demo",
    },
    employee: {
      workspace: "Employee Workspace",
      title: currentUser?.team || "My Workspace",
      role: "Officer",
      email: "employee@governscale.demo",
    },
  };

  const config = levelConfig[level] || levelConfig.government;

  const getInitials = () => {
    if (!currentUser?.name) return "GA";
    const parts = currentUser.name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Real-time Search Match Engine (Phase E Spec)
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || q.length < 2) return { missions: [], tasks: [], employees: [] };

    try {
      const allMissions = getMissions() || [];
      const allTasks = getTasks() || [];
      const allEmployees = getEmployees() || [];

      const matchedMissions = allMissions
        .filter(
          (m) =>
            m.title?.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q)
        )
        .slice(0, 4);

      const matchedTasks = allTasks
        .filter(
          (t) =>
            t.title?.toLowerCase().includes(q) ||
            t.employeeName?.toLowerCase().includes(q) ||
            t.employee?.toLowerCase().includes(q)
        )
        .slice(0, 4);

      const matchedEmployees = allEmployees
        .filter(
          (e) =>
            e.name?.toLowerCase().includes(q) ||
            e.role?.toLowerCase().includes(q) ||
            e.department?.toLowerCase().includes(q)
        )
        .slice(0, 3);

      return {
        missions: matchedMissions,
        tasks: matchedTasks,
        employees: matchedEmployees,
      };
    } catch {
      return { missions: [], tasks: [], employees: [] };
    }
  }, [searchTerm]);

  const totalResults =
    searchResults.missions.length +
    searchResults.tasks.length +
    searchResults.employees.length;

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-all">
      {/* LEFT SIDE: TOGGLE & WORKSPACE TITLE */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#154B38]" />
            <h2 className="truncate text-[11px] font-extrabold uppercase tracking-wider text-[#154B38]">
              {config.workspace}
            </h2>
          </div>
          <p className="truncate text-sm font-bold text-slate-900 leading-tight mt-0.5">
            {config.title}
          </p>
        </div>
      </div>

      {/* CENTER: SEARCH BAR WITH LIVE RESULTS PANEL (PHASE E SPEC) */}
      <div
        ref={searchRef}
        className="relative hidden md:flex md:w-80 lg:w-[420px] items-center"
      >
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={16} />
          </div>

          <input
            type="text"
            value={searchTerm}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search tasks, missions, officers..."
            className="w-full rounded-full border border-slate-200/80 bg-[#F4F6F8] py-2 pl-10 pr-10 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all duration-200"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setIsSearchOpen(false);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Panel */}
        {isSearchOpen && searchTerm.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 max-h-[380px] overflow-y-auto">
            {totalResults === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching results found for "{searchTerm}"
              </div>
            ) : (
              <div className="space-y-3">
                {/* Missions */}
                {searchResults.missions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Target size={12} className="text-[#154B38]" />
                      <span>Missions</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.missions.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            navigate("/government/missions");
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {m.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Target: {Number(m.target || 0).toLocaleString()} • {m.priority || "High"}
                            </p>
                          </div>
                          <ExternalLink size={12} className="text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Briefcase size={12} className="text-[#154B38]" />
                      <span>Deliverables & Tasks</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.tasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            navigate("/team/dashboard");
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {t.title || t.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Assigned: {t.employeeName || t.employee || "Officer"} • {t.status || "In Progress"}
                            </p>
                          </div>
                          <ExternalLink size={12} className="text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employees */}
                {searchResults.employees.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <User size={12} className="text-[#154B38]" />
                      <span>Officers</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.employees.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => {
                            navigate("/government/employees");
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{e.name}</p>
                            <p className="text-[10px] text-slate-400">{e.role} • {e.department}</p>
                          </div>
                          <ExternalLink size={12} className="text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: ACTIONS & PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() =>
            window.alert(
              "GovernScale Inbox: All communication channels and verification messages are active."
            )
          }
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F6F8] text-slate-600 transition-all hover:bg-slate-200/80 hover:text-slate-900 cursor-pointer"
          title="Messages"
        >
          <Mail size={16} />
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F6F8] text-slate-600 transition-all hover:bg-slate-200/80 hover:text-slate-900 cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#154B38] ring-2 ring-white animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 bg-white p-3 card-soft-shadow shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2">
                <p className="text-xs font-bold text-slate-900">Notifications</p>
                <span className="rounded-full bg-[#EBF6F0] px-2 py-0.5 text-[10px] font-bold text-[#154B38]">
                  2 New
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="rounded-xl p-2.5 hover:bg-slate-50 transition cursor-pointer">
                  <p className="text-xs font-semibold text-slate-800">
                    Mission Target Update
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Education Department completed 85% of allocated tasks.
                  </p>
                </div>
                <div className="rounded-xl p-2.5 hover:bg-slate-50 transition cursor-pointer">
                  <p className="text-xs font-semibold text-slate-800">
                    Verification Complete
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scholarship Verification Team audited 150 submissions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white py-1.5 pl-2 pr-3 transition-all hover:bg-slate-50 active:scale-95 shadow-2xs cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#154B38] text-[11px] font-bold text-white shadow-xs">
              {getInitials()}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {currentUser?.name || config.role}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                {config.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 card-soft-shadow shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-900">
                  {currentUser?.name || "Super Admin"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser?.email || config.email}
                </p>
              </div>

              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/government/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#EBF6F0] hover:text-[#154B38] transition cursor-pointer"
                >
                  <User size={14} />
                  <span>Profile Settings</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;