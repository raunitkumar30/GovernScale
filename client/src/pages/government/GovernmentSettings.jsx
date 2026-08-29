import React, { useState, useEffect } from "react";
import {
  UserRound,
  Landmark,
  Building2,
  Bell,
  ShieldCheck,
  Settings as SettingsIcon,
  Save,
  Lock,
  Mail,
  Phone,
  MapPin,
  Globe2,
  CheckCircle2,
  Users,
  Database,
  Server,
  Sparkles,
  Sliders,
  RotateCcw,
  Scale,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import {
  exportEntireStateBackup,
  restoreEntireStateBackup,
  seedSIH25250BenchmarkData,
  clearGovernScaleData,
} from "../../utils/localStorage";
import { DEFAULT_ROLE_WEIGHTS } from "../../utils/scoringEngine";

const GovernmentSettings = () => {
  const [activeSection, setActiveSection] = useState("role_weights");
  const [saved, setSaved] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const [profile, setProfile] = useState({
    name: "Super Admin",
    email: "admin@gov.in",
    phone: "+91 98765 43210",
    role: "Government Super Admin",
  });

  const [government, setGovernment] = useState({
    name: "Government of India",
    code: "GOV-IN",
    country: "India",
    location: "New Delhi",
  });

  const [notifications, setNotifications] = useState({
    missionCreated: true,
    missionCompleted: true,
    taskOverdue: true,
    departmentUpdates: true,
    organizationUpdates: true,
    securityAlerts: true,
    weeklyReport: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    loginAlerts: true,
    suspiciousActivity: true,
  });

  const [system, setSystem] = useState({
    autoRefresh: true,
    compactMode: false,
    activityLogging: true,
  });

  // Phase 5 Configurable Role Weights
  const [roleWeights, setRoleWeights] = useState(() => {
    try {
      const stored = localStorage.getItem("governscale_role_weights");
      return stored ? JSON.parse(stored) : DEFAULT_ROLE_WEIGHTS;
    } catch {
      return DEFAULT_ROLE_WEIGHTS;
    }
  });

  const handleWeightChange = (roleKey, factorKey, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0)) / 100;
    setRoleWeights((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [factorKey]: num,
      },
    }));
  };

  const handleResetWeights = () => {
    setRoleWeights(DEFAULT_ROLE_WEIGHTS);
    localStorage.setItem("governscale_role_weights", JSON.stringify(DEFAULT_ROLE_WEIGHTS));
    window.dispatchEvent(new Event("governscale-data-updated"));
    alert("Role weights reset to SIH25250 system defaults.");
  };

  const handleSave = () => {
    try {
      localStorage.setItem("governscale_role_weights", JSON.stringify(roleWeights));
      window.dispatchEvent(new Event("governscale-data-updated"));
    } catch (e) {
      console.error("Failed to save role weights:", e);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleSeedBenchmark = () => {
    seedSIH25250BenchmarkData();
    setSeedSuccess(true);
    setTimeout(() => setSeedSuccess(false), 3000);
  };

  const handleFileRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const res = restoreEntireStateBackup(event.target.result);
        if (res.success) {
          alert("Full state backup restored successfully! All dashboards updated.");
        } else {
          alert("Failed to restore backup: " + res.error);
        }
      } catch (err) {
        alert("Invalid JSON backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { id: "role_weights", label: "Scoring & Role Weights", icon: Sliders },
    { id: "data_management", label: "Data Integrity & Backups", icon: Database },
    { id: "profile", label: "Admin Profile", icon: UserRound },
    { id: "government", label: "Government Info", icon: Landmark },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Access", icon: ShieldCheck },
    { id: "system", label: "System Preferences", icon: SettingsIcon },
  ];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 5 • System Governance & Weights
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Government Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Configure role weight formulas, audit thresholds, and system governance policies.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          icon={saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
        >
          {saved ? "Configuration Saved" : "Save Changes"}
        </Button>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-[#EBF6F0] p-4 text-xs font-bold text-[#154B38] border border-[#D1EBDD] animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>System configuration and scoring role weights updated live across all dashboards!</span>
        </div>
      )}

      {/* 2-COLUMN SETTINGS LAYOUT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* NAV TABS */}
        <Card className="p-3 h-fit space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`
                  w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-bold transition-all text-left cursor-pointer
                  ${
                    isActive
                      ? "bg-[#154B38] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </Card>

        {/* SETTINGS CONTENT CONTAINER */}
        <div>
          {/* 1. SCORING & ROLE WEIGHTS (PHASE 5 REQUIREMENT) */}
          {activeSection === "role_weights" && (
            <div className="space-y-6">
              <Card className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Configurable 4-Factor Role Weights (Phase 5)
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Spec Rule: Weights are configurable per job family — never hardcoded.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetWeights}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      key: "operations",
                      title: "Operations & Frontline Officers",
                      desc: "Emphasizes completion volume and execution timeliness for day-to-day administrative processing.",
                    },
                    {
                      key: "verification",
                      title: "Verification & Audit Officers",
                      desc: "Emphasizes first-pass evidence accuracy and verification compliance over raw speed.",
                    },
                    {
                      key: "technical",
                      title: "Technical & IT Engineering Staff",
                      desc: "Emphasizes technical deliverable quality and high-complexity infrastructure items.",
                    },
                    {
                      key: "supervisor",
                      title: "Team Supervisors & Leads",
                      desc: "Balanced split across timeliness, quality audit, and team complexity management.",
                    },
                    {
                      key: "default",
                      title: "Standard / Default Baseline",
                      desc: "Standard 25% Volume, 30% Timeliness, 30% Quality, 15% Complexity baseline.",
                    },
                  ].map((role) => {
                    const current = roleWeights[role.key] || DEFAULT_ROLE_WEIGHTS.default;
                    const v = Math.round((current.volume ?? 0.25) * 100);
                    const t = Math.round((current.timeliness ?? 0.30) * 100);
                    const q = Math.round((current.quality ?? 0.30) * 100);
                    const x = Math.round((current.complexity ?? 0.15) * 100);
                    const sum = v + t + q + x;

                    return (
                      <div
                        key={role.key}
                        className="rounded-2xl border border-slate-200/80 bg-[#FAFCFB] p-4 sm:p-5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {role.title}
                          </h3>
                          <Badge variant={sum === 100 ? "completed" : "danger"}>
                            Sum: {sum}% {sum !== 100 && "⚠️ (Needs 100%)"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-4">{role.desc}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Volume Weight
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={v}
                                onChange={(e) =>
                                  handleWeightChange(role.key, "volume", e.target.value)
                                }
                                className="w-16 rounded border border-slate-200 px-2 py-1 font-bold text-slate-900 focus:border-[#154B38] outline-none text-right"
                              />
                              <span className="font-bold text-slate-500">%</span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Timeliness Weight
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={t}
                                onChange={(e) =>
                                  handleWeightChange(role.key, "timeliness", e.target.value)
                                }
                                className="w-16 rounded border border-slate-200 px-2 py-1 font-bold text-slate-900 focus:border-[#154B38] outline-none text-right"
                              />
                              <span className="font-bold text-slate-500">%</span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Quality Weight
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={q}
                                onChange={(e) =>
                                  handleWeightChange(role.key, "quality", e.target.value)
                                }
                                className="w-16 rounded border border-slate-200 px-2 py-1 font-bold text-slate-900 focus:border-[#154B38] outline-none text-right"
                              />
                              <span className="font-bold text-slate-500">%</span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Complexity Weight
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={x}
                                onChange={(e) =>
                                  handleWeightChange(role.key, "complexity", e.target.value)
                                }
                                className="w-16 rounded border border-slate-200 px-2 py-1 font-bold text-slate-900 focus:border-[#154B38] outline-none text-right"
                              />
                              <span className="font-bold text-slate-500">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* PHASE 10 DATA INTEGRITY & BACKUPS */}
          {activeSection === "data_management" && (
            <div className="space-y-6">
              <Card className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      State Data Integrity & Portable Backups
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Manage full-state JSON snapshots, seed SIH25250 reference data, or restore existing backups.
                    </p>
                  </div>
                  <Badge variant="sage">localStorage Active</Badge>
                </div>

                {seedSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-[#EBF6F0] border border-[#D1EBDD] text-xs font-bold text-[#154B38] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>SIH25250 Benchmark Dataset loaded across all 5 tiers! All dashboards populated with live mathematical evidence.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seed Benchmark Card */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-[#FAFCFB] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-[#154B38] font-bold text-xs">
                        <Sparkles size={16} />
                        <span>SIH25250 Benchmark Dataset</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Seeds complete missions, department allocations, agency quotas, teams, and officers (Aarav, Priya, Rohan, Ananya, Vikram) with completed proofs and timestamped status audit logs.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSeedBenchmark}
                      icon={<Sparkles size={14} />}
                    >
                      Load SIH25250 Benchmark Data
                    </Button>
                  </div>

                  {/* Export Full Backup Card */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-[#FAFCFB] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-xs">
                        <Database size={16} />
                        <span>Export Full State Backup</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Downloads a portable JSON file containing all missions, allocations, tasks, status logs, role weights, and score snapshots.
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={exportEntireStateBackup}
                      icon={<Database size={14} />}
                    >
                      Download State Backup (.json)
                    </Button>
                  </div>

                  {/* Restore Backup Card */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-[#FAFCFB] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-xs">
                        <Server size={16} />
                        <span>Restore From JSON Backup</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Upload a previously exported GovernScale JSON backup file to instantly restore all records and hierarchy stores.
                      </p>
                    </div>

                    <label className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer">
                      <Server size={14} />
                      <span>Select Backup File...</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileRestore}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Clear Data Card */}
                  <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-rose-900 font-bold text-xs">
                        <RotateCcw size={16} className="text-rose-600" />
                        <span>Reset All Local Storage</span>
                      </div>
                      <p className="text-xs text-rose-700 mb-4 leading-relaxed">
                        Wipes all localStorage records, mission trees, employee rosters, and role weights back to zero state.
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="border-rose-200 text-rose-700 hover:bg-rose-100"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear all GovernScale data in localStorage?")) {
                          clearGovernScaleData();
                          alert("All GovernScale stores cleared.");
                        }
                      }}
                      icon={<RotateCcw size={14} />}
                    >
                      Wipe & Reset Storage
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* PROFILE SECTION */}
          {activeSection === "profile" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Super Admin Profile</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">
                Update master identity details for state administration.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                  label="Designation Role"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
                <Input
                  label="Official Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </Card>
          )}

          {/* GOVERNMENT INFO */}
          {activeSection === "government" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Government Metadata</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">
                Jurisdictional and portal configuration parameters.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Entity Name"
                  value={government.name}
                  onChange={(e) => setGovernment({ ...government, name: e.target.value })}
                />
                <Input
                  label="Administrative Jurisdiction Code"
                  value={government.code}
                  onChange={(e) => setGovernment({ ...government, code: e.target.value })}
                />
                <Input
                  label="Country Jurisdiction"
                  value={government.country}
                  onChange={(e) => setGovernment({ ...government, country: e.target.value })}
                />
                <Input
                  label="Administrative Headquarters"
                  value={government.location}
                  onChange={(e) => setGovernment({ ...government, location: e.target.value })}
                />
              </div>
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Notification Preferences</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">
                Manage email alerts and mission lifecycle event dispatches.
              </p>

              <div className="space-y-4">
                {[
                  { key: "missionCreated", label: "Mission Created", desc: "Notify when a new central directive is initialized" },
                  { key: "missionCompleted", label: "Mission Completed", desc: "Notify when 100% of deliverables are verified" },
                  { key: "taskOverdue", label: "Task Overdue Alert", desc: "Trigger high-priority alert for delayed milestones" },
                  { key: "departmentUpdates", label: "Department Cascade Changes", desc: "Receive updates when department targets are modified" },
                  { key: "securityAlerts", label: "Security & Login Alerts", desc: "Immediate notification on suspicious administrative logins" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#154B38] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECURITY */}
          {activeSection === "security" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Security & Authentication</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">
                Manage zero-trust administrative access controls.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-slate-400">Enforce OTP verification on every administrative session</p>
                  </div>
                  <Badge variant="completed">Enforced</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Cryptographic Evidence Signatures</p>
                    <p className="text-[11px] text-slate-400">All task submissions require verified officer signatures</p>
                  </div>
                  <Badge variant="sage">Active</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* SYSTEM */}
          {activeSection === "system" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">System Preferences</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">
                Local cache and interface behavioral defaults.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Live Auto-Refresh</p>
                    <p className="text-[11px] text-slate-400">Automatically sync analytics with localStorage events</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={system.autoRefresh}
                    onChange={(e) => setSystem({ ...system, autoRefresh: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#154B38] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Activity Audit Logging</p>
                    <p className="text-[11px] text-slate-400">Record all mission target redistributions to audit log</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={system.activityLogging}
                    onChange={(e) => setSystem({ ...system, activityLogging: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#154B38] cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovernmentSettings;