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

const DepartmentSettings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "Department Head",
    email: "department.head@gov.in",
    phone: "+91 98765 43210",
    role: "Department Head",
  });

  const [department, setDepartment] = useState({
    name: "Department of Education",
    code: "EDU-001",
    state: "Government of India",
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
    { id: "department", label: "Department Info", icon: Building2 },
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
            Department Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage departmental profile, administrative credentials, notifications, and security protocols.
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
          <span>Department settings successfully saved.</span>
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
              <h2 className="text-base font-bold text-slate-900 mb-1">Department Head Profile</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Contact credentials and role permissions.</p>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                  label="Department Email"
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
                  label="Assigned Role"
                  value={profile.role}
                  disabled
                />
              </div>
            </Card>
          )}

          {activeSection === "department" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Department Identity</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Administrative division identifiers.</p>

              <div className="space-y-4">
                <Input
                  label="Department Title"
                  value={department.name}
                  onChange={(e) => setDepartment({ ...department, name: e.target.value })}
                />
                <Input
                  label="Division Code"
                  value={department.code}
                  onChange={(e) => setDepartment({ ...department, code: e.target.value })}
                />
                <Input
                  label="Jurisdiction"
                  value={department.state}
                  onChange={(e) => setDepartment({ ...department, state: e.target.value })}
                />
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Notification Channels</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Configure deliverable events and alerts.</p>

              <div className="space-y-4">
                {[
                  { key: "missionUpdates", label: "State Mission Updates", desc: "Alert when a central directive targets are adjusted" },
                  { key: "taskAssigned", label: "Deliverable Assignment", desc: "Notify when tasks are sub-delegated to organizations" },
                  { key: "taskCompleted", label: "Verification Notice", desc: "Notify when teams submit deliverable proof" },
                  { key: "overdueTask", label: "Overdue Item Alerts", desc: "Urgent notifications on delayed deliverables" },
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
              <h2 className="text-base font-bold text-slate-900 mb-1">Security Controls</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Department level access safeguard policies.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Multi-Factor Authentication</p>
                    <p className="text-[11px] text-slate-400">Require MFA for department head approvals</p>
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

export default DepartmentSettings;