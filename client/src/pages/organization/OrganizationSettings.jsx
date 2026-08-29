import React, { useState } from "react";
import {
  UserRound,
  Building2,
  Bell,
  ShieldCheck,
  Settings as SettingsIcon,
  Save,
  Lock,
  Mail,
  Phone,
  Globe2,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";

const OrganizationSettings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "Organization Head",
    email: "organization.head@gov.in",
    phone: "+91 98765 43210",
    role: "Organization Head",
  });

  const [organization, setOrganization] = useState({
    name: "Scholarship Services",
    code: "CSO-001",
    department: "Education Department",
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: UserRound },
    { id: "organization", label: "Agency Info", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            System Configuration
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Organization Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage agency profile, team notification rules, and access control policies.
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
          <span>Agency settings successfully saved.</span>
        </div>
      )}

      {/* 2-COLUMN SETTINGS LAYOUT */}
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
              <h2 className="text-base font-bold text-slate-900 mb-1">Director Profile</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Agency director credentials and contact.</p>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                  label="Agency Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Input
                  label="Direct Line"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
                <Input
                  label="Role Authority"
                  value={profile.role}
                  disabled
                />
              </div>
            </Card>
          )}

          {activeSection === "organization" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Agency Identity</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Organizational division metadata.</p>

              <div className="space-y-4">
                <Input
                  label="Agency Title"
                  value={organization.name}
                  onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                />
                <Input
                  label="Agency Code"
                  value={organization.code}
                  onChange={(e) => setOrganization({ ...organization, code: e.target.value })}
                />
                <Input
                  label="Parent Department"
                  value={organization.department}
                  disabled
                />
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Notification Routing</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Manage team deliverable alerts.</p>

              <div className="space-y-4">
                {[
                  { key: "missionUpdates", label: "Department Directives", desc: "Notify when department cascades deliverables" },
                  { key: "taskAssigned", label: "Team Sub-Allocation", desc: "Notify when tasks are sub-delegated to teams" },
                  { key: "taskCompleted", label: "Officer Submissions", desc: "Notify when officers upload deliverable evidence" },
                  { key: "overdueTask", label: "Delay Warnings", desc: "Immediate alert when team milestones are delayed" },
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
              <h2 className="text-base font-bold text-slate-900 mb-1">Security Protocols</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Zero-trust access enforcement.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">MFA Verification</p>
                    <p className="text-[11px] text-slate-400">Enforce OTP verification on director logins</p>
                  </div>
                  <Badge variant="completed">Active</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationSettings;