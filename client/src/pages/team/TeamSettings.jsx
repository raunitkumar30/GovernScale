import React, { useEffect, useState } from "react";
import {
  UserRound,
  Users,
  Bell,
  ShieldCheck,
  Settings as SettingsIcon,
  Save,
  Lock,
  Mail,
  Phone,
  Globe2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";

const TeamSettings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "Team Lead",
    email: "team.lead@gov.in",
    phone: "+91 98765 43210",
    role: "Team Lead",
  });

  const [team, setTeam] = useState({
    name: "Scholarship Verification Team",
    code: "SVT-001",
    organization: "Scholarship Services",
    location: "New Delhi",
  });

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    taskCompleted: true,
    overdueTask: true,
    missionUpdates: true,
    weeklyReport: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    loginAlerts: true,
  });

  const [systemPreferences, setSystemPreferences] = useState({
    compactDashboard: false,
    automaticRefresh: true,
  });

  useEffect(() => {
    const savedCompact = localStorage.getItem("teamCompactDashboard");
    if (savedCompact !== null) {
      setSystemPreferences((prev) => ({
        ...prev,
        compactDashboard: savedCompact === "true",
      }));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("teamCompactDashboard", String(systemPreferences.compactDashboard));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const navItems = [
    { id: "profile", label: "Lead Profile", icon: UserRound },
    { id: "team", label: "Team Info", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Workforce Settings
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Team Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage team lead credentials, desk alert rules, and operational preferences.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          icon={saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
        >
          {saved ? "Saved" : "Save Settings"}
        </Button>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-[#EBF6F0] p-4 text-xs font-bold text-[#154B38] border border-[#D1EBDD] animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Team settings saved successfully.</span>
        </div>
      )}

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
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

        <div>
          {activeSection === "profile" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Lead Officer Profile</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Contact credentials and team lead verification authority.</p>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                  label="Official Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Input
                  label="Desk Contact"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
                <Input
                  label="Role"
                  value={profile.role}
                  disabled
                />
              </div>
            </Card>
          )}

          {activeSection === "team" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Team Identity</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Functional unit identifiers.</p>

              <div className="space-y-4">
                <Input
                  label="Team Title"
                  value={team.name}
                  onChange={(e) => setTeam({ ...team, name: e.target.value })}
                />
                <Input
                  label="Unit Identifier"
                  value={team.code}
                  onChange={(e) => setTeam({ ...team, code: e.target.value })}
                />
                <Input
                  label="Parent Agency"
                  value={team.organization}
                  disabled
                />
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Verification Alerts</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Manage incoming evidence submission notifications.</p>

              <div className="space-y-4">
                {[
                  { key: "taskCompleted", label: "Officer Submissions", desc: "Notify immediately when an officer submits evidence" },
                  { key: "taskAssigned", label: "Directives Cascaded", desc: "Notify when agency allocates new targets to team" },
                  { key: "overdueTask", label: "Milestone Warnings", desc: "Alert when a deliverable is nearing deadline" },
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

          {activeSection === "security" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Verification Security</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Cryptographic lead approval policies.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Lead Sign-Off Signature</p>
                    <p className="text-[11px] text-slate-400">Cryptographically stamp all approved officer submissions</p>
                  </div>
                  <Badge variant="completed">Enforced</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamSettings;