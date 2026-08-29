import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Settings2,
  Save,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Users,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";

const EmployeeSettings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "Aarav",
    lastName: "Sharma",
    email: "aarav.sharma@gov.in",
    phone: "+91 98765 43210",
    designation: "Senior Verification Officer",
  });

  const [notifications, setNotifications] = useState({
    taskAssignment: true,
    deadlineReminder: true,
    verificationUpdate: true,
    missionUpdate: true,
  });

  const [preferences, setPreferences] = useState({
    compactDashboard: false,
    automaticRefresh: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const navItems = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Settings2 },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Officer Profile
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Account Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage your personal officer credentials, deliverable notifications, and app preferences.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          icon={saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
        >
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-[#EBF6F0] p-4 text-xs font-bold text-[#154B38] border border-[#D1EBDD] animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Your settings have been saved successfully.</span>
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
              <h2 className="text-base font-bold text-slate-900 mb-1">Officer Information</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Personal details and service designation.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
                <Input
                  label="Official Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
                <Input
                  label="Designation"
                  value={profile.designation}
                  disabled
                />
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Task & Verification Alerts</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Configure how and when you receive workflow notices.</p>

              <div className="space-y-4">
                {[
                  { key: "taskAssignment", label: "New Task Assigned", desc: "Notify immediately when a new deliverable is assigned to you" },
                  { key: "deadlineReminder", label: "Milestone Reminders", desc: "Alert 24h prior to task deliverable deadline" },
                  { key: "verificationUpdate", label: "Lead Verification Result", desc: "Notify when team lead approves or requests rework on evidence" },
                  { key: "missionUpdate", label: "Mission Status Updates", desc: "Receive summary alerts when parent mission progresses" },
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

          {activeSection === "preferences" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Interface Preferences</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Customize your workspace experience.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Live Auto-Sync</p>
                    <p className="text-[11px] text-slate-400">Keep task status live across browser tabs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.automaticRefresh}
                    onChange={(e) => setPreferences({ ...preferences, automaticRefresh: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#154B38] cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Security & Access</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Account credentials and verification keys.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Officer Signature Key</p>
                    <p className="text-[11px] text-slate-400">Digital key attached to submitted deliverable evidence</p>
                  </div>
                  <Badge variant="completed">Active & Valid</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeSettings;