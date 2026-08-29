import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  CalendarDays,
  Target,
  Building2,
  Users,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  BarChart3,
  Eye,
  RefreshCw,
  X,
  Printer,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getMissions,
  getTasks,
  getOrganizationAllocations,
  getTeamAllocations,
  getEmployeeAllocations,
} from "../../utils/localStorage";

const GovernmentReports = () => {
  const [period, setPeriod] = useState("This Month");
  const [reportType, setReportType] = useState("Government Overview");
  const [showPreview, setShowPreview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [organizationAllocations, setOrganizationAllocations] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [employeeAllocations, setEmployeeAllocations] = useState([]);

  const loadData = () => {
    setRefreshing(true);
    try {
      setMissions(Array.isArray(getMissions()) ? getMissions() : []);
      setTasks(Array.isArray(getTasks()) ? getTasks() : []);
      setOrganizationAllocations(Array.isArray(getOrganizationAllocations()) ? getOrganizationAllocations() : []);
      setTeamAllocations(Array.isArray(getTeamAllocations()) ? getTeamAllocations() : []);
      setEmployeeAllocations(Array.isArray(getEmployeeAllocations()) ? getEmployeeAllocations() : []);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, []);

  const normalizeStatus = (s) => String(s || "").trim().toLowerCase();
  const isCompleted = (t) => normalizeStatus(t?.status) === "completed";
  const isOverdue = (t) => {
    if (!t?.dueDate || isCompleted(t)) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && d < new Date();
  };

  const governmentSummary = useMemo(() => {
    const totalMissions = missions.length;
    const completedMissions = missions.filter((m) => normalizeStatus(m.status) === "completed").length;
    const activeMissions = totalMissions - completedMissions;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(isCompleted).length;
    const pendingTasks = tasks.filter((t) => normalizeStatus(t.status) === "pending").length;
    const inProgressTasks = tasks.filter((t) => normalizeStatus(t.status) === "in progress").length;
    const verificationTasks = tasks.filter((t) =>
      ["pending verification", "submitted"].includes(normalizeStatus(t.status))
    ).length;
    const overdueTasks = tasks.filter(isOverdue).length;

    const totalTarget = missions.reduce((sum, m) => sum + Number(m.target || 0), 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalMissions,
      completedMissions,
      activeMissions,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      verificationTasks,
      overdueTasks,
      totalTarget,
      overallProgress,
    };
  }, [missions, tasks]);

  const departmentReports = useMemo(() => {
    const departments = {};
    missions.forEach((m) => {
      if (Array.isArray(m.departments)) {
        m.departments.forEach((d) => {
          if (!departments[d]) {
            departments[d] = { name: d, missions: 0, tasks: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 };
          }
          departments[d].missions += 1;
        });
      }
    });

    const resolveDept = (t) => {
      const d = String(t.department || "").trim();
      if (d && d.toLowerCase().includes("department")) return d;
      const org = String(t.organization || "").toLowerCase();
      if (["scholarship services", "citizen education services", "digital education", "document services", "student support services"].includes(org)) {
        return "Education Department";
      }
      if (["health services", "health data services", "public health bureau", "medical supplies division"].includes(org)) {
        return "Healthcare Department";
      }
      return d || "Education Department";
    };

    tasks.forEach((t) => {
      const d = resolveDept(t);
      if (!d) return;
      if (!departments[d]) {
        departments[d] = { name: d, missions: 0, tasks: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 };
      }
      departments[d].tasks += 1;
      if (isCompleted(t)) departments[d].completed += 1;
      else if (normalizeStatus(t.status) === "pending") departments[d].pending += 1;
      else if (normalizeStatus(t.status) === "in progress") departments[d].inProgress += 1;
      if (isOverdue(t)) departments[d].overdue += 1;
    });

    return Object.values(departments).map((dept) => ({
      ...dept,
      performance: dept.tasks > 0 ? Math.round((dept.completed / dept.tasks) * 100) : 0,
    }));
  }, [missions, tasks]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportData = {
      title: "GovernScale Executive Governance Report",
      period,
      generatedAt: new Date().toISOString(),
      summary: governmentSummary,
      departments: departmentReports,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GovernScale_Report_${period.replace(" ", "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Compliance & Documentation
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Government Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Generate, preview and export verified state-wide outcome reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={loadData} loading={refreshing} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>

          <Button variant="secondary" size="sm" onClick={() => setShowPreview(true)} icon={<Eye size={14} />}>
            Preview Report
          </Button>

          <Button variant="primary" size="sm" onClick={handleDownload} icon={<Download size={14} />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Total Target"
          value={governmentSummary.totalTarget.toLocaleString()}
          change="State-wide deliverables"
        />
        <StatCard
          title="Overall Execution"
          value={`${governmentSummary.overallProgress}%`}
          change={`${governmentSummary.completedTasks} completed`}
          changeType="positive"
        />
        <StatCard
          title="Active Missions"
          value={governmentSummary.activeMissions}
          change="Across all departments"
          changeType="neutral"
        />
        <StatCard
          title="Awaiting Verification"
          value={governmentSummary.verificationTasks}
          change="Evidence submitted"
          changeType="neutral"
        />
      </div>

      {/* FILTER / CONFIGURATION CARD */}
      <Card className="mb-7 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-[#F4F6F8] px-3.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 text-[11px] uppercase">Type:</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option>Government Overview</option>
                <option>Department Performance</option>
                <option>Mission Deliverables</option>
                <option>Task Verification Audit</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-[#F4F6F8] px-3.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 text-[11px] uppercase">Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option>This Week</option>
                <option>This Month</option>
                <option>This Quarter</option>
                <option>This Year</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} icon={<Printer size={14} />}>
              Print View
            </Button>
          </div>
        </div>
      </Card>

      {/* REPORT DATA TABLE */}
      <Card className="p-6 mb-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Department Outcome Summary
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Verified metric breakdown by administrative division.
            </p>
          </div>

          <Badge variant="sage">{departmentReports.length} Departments</Badge>
        </div>

        {departmentReports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No departmental report data found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3 pr-4">Department</th>
                  <th className="pb-3 px-4 text-center">Missions</th>
                  <th className="pb-3 px-4 text-center">Tasks</th>
                  <th className="pb-3 px-4 text-center">Completed</th>
                  <th className="pb-3 px-4 text-center">Pending</th>
                  <th className="pb-3 px-4 text-center">Overdue</th>
                  <th className="pb-3 pl-4 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {departmentReports.map((d) => (
                  <tr key={d.name} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 pr-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EBF6F0] text-[#154B38] font-bold text-xs">
                        {d.name.charAt(0)}
                      </span>
                      <span>{d.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center">{d.missions}</td>
                    <td className="py-4 px-4 text-center font-bold text-slate-900">{d.tasks}</td>
                    <td className="py-4 px-4 text-center text-emerald-700 font-bold">{d.completed}</td>
                    <td className="py-4 px-4 text-center text-amber-700 font-bold">{d.pending}</td>
                    <td className="py-4 px-4 text-center text-rose-700 font-bold">{d.overdue}</td>
                    <td className="py-4 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#154B38]"
                            style={{ width: `${d.performance}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 w-8">{d.performance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{reportType}</h3>
                  <p className="text-xs text-slate-400">Period: {period}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl bg-[#F4F6F8] p-5 border border-slate-200/80 mb-6 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Missions Evaluated:</span>
                <span className="font-bold text-slate-900">{governmentSummary.totalMissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Assigned Deliverables:</span>
                <span className="font-bold text-slate-900">{governmentSummary.totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Verified Completion Rate:</span>
                <span className="font-bold text-emerald-700">{governmentSummary.overallProgress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">State Deliverable Volume:</span>
                <span className="font-bold text-slate-900">{governmentSummary.totalTarget.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload} icon={<Download size={14} />}>
                Export PDF/JSON
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GovernmentReports;