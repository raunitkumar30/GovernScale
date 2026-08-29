import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  CalendarDays,
  BarChart3,
  ClipboardList,
  Building2,
  Users,
  CheckCircle2,
  Clock3,
  Search,
  X,
  Target,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Layers,
  Filter,
  Check,
  TrendingUp,
  Award,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getMissions,
  getDepartmentAllocationsByDepartment,
  getOrganizationAllocationsByDepartment,
  getTeamAllocations,
  getDepartmentTasks,
} from "../../utils/localStorage";
import {
  calculateScore,
  clamp,
  isTaskCompleted,
  isTaskOverdue,
  isTaskSubmitted,
  aggregateDepartmentScores,
} from "../../utils/scoringEngine";
import { getDepartments, getOrganizations } from "../../data/hierarchy";

const normalizeStatus = (status) => {
  const s = String(status || "").trim().toLowerCase();
  if (s === "pending verification" || s === "submitted" || s === "awaiting verification") {
    return "Pending Verification";
  }
  if (s === "completed" || s === "verified") return "Completed";
  if (s === "in progress" || s === "in_progress") return "In Progress";
  if (s === "rejected") return "Rejected";
  return "Pending";
};

const DepartmentReports = () => {
  const [departmentName, setDepartmentName] = useState("Education Department");
  const [missions, setMissions] = useState([]);
  const [departmentAllocations, setDepartmentAllocations] = useState([]);
  const [organizationAllocations, setOrganizationAllocations] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'agencies' | 'deliverables'
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);

  const loadDepartmentData = () => {
    setLoading(true);
    try {
      const allMissions = getMissions() || [];
      const deptMissions = allMissions.filter(
        (m) => Array.isArray(m.departments) && m.departments.includes(departmentName)
      );
      setMissions(deptMissions);

      const deptAlloc = getDepartmentAllocationsByDepartment(departmentName) || [];
      setDepartmentAllocations(deptAlloc);

      const orgAlloc = getOrganizationAllocationsByDepartment(departmentName) || [];
      setOrganizationAllocations(orgAlloc);

      const allTeamAlloc = getTeamAllocations() || [];
      const deptTeams = allTeamAlloc.filter(
        (a) => a.department === departmentName || (DEPT_ORGANIZATION_MAP[departmentName] || []).includes(a.organization)
      );
      setTeamAllocations(deptTeams);

      const deptTasks = getDepartmentTasks(departmentName) || [];
      setTasks(deptTasks);
    } catch (error) {
      console.error("Failed to load department reports data:", error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    loadDepartmentData();
  }, [departmentName]);

  useEffect(() => {
    const handleUpdate = () => loadDepartmentData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [departmentName]);

  // Pure Math Scoring Engine metrics
  const scoreMetrics = useMemo(() => {
    return calculateScore(tasks, missions);
  }, [tasks, missions]);

  // Aggregate Department Stats
  const summary = useMemo(() => {
    const totalTarget = departmentAllocations.reduce(
      (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
      0
    );
    const cascadedToOrgs = organizationAllocations.reduce(
      (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
      0
    );
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(isTaskCompleted).length;
    const pendingVerification = tasks.filter(isTaskSubmitted).length;
    const overdueTasks = tasks.filter(isTaskOverdue).length;
    const rate = totalTarget > 0 ? Math.round((completedTasks / totalTarget) * 100) : totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      missionsCount: missions.length,
      totalTarget,
      cascadedToOrgs,
      remainingUnallocated: Math.max(0, totalTarget - cascadedToOrgs),
      totalTasks,
      completedTasks,
      pendingVerification,
      overdueTasks,
      completionRate: Math.min(100, rate),
    };
  }, [missions, departmentAllocations, organizationAllocations, tasks]);

  // Phase 8: Organization-Volume-Weighted Department Roll-Up
  const deptAggregate = useMemo(() => {
    const allDepartments = getDepartments();
    const allOrganizations = getOrganizations();
    const currentDept = allDepartments.find((d) => d.name === departmentName);

    const allAggregates = aggregateDepartmentScores(
      tasks,
      missions,
      currentDept ? [currentDept] : [],
      allOrganizations.filter(
        (o) => o.department.toLowerCase() === departmentName.toLowerCase()
      )
    );
    return (
      allAggregates[0] || {
        score: 0,
        volume: 0,
        timeliness: 0,
        quality: 0,
        complexity: 0,
        organizationBreakdown: [],
        missionContributionRate: 0,
        totalMissionTarget: 0,
      }
    );
  }, [tasks, missions, departmentName]);

  const agencyBreakdown = useMemo(() => {
    return deptAggregate.organizationBreakdown || [];
  }, [deptAggregate]);

  // Filtered Deliverables Log
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        (t.title || t.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.organization || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.team || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.employeeName || t.assignedTo || "").toLowerCase().includes(search.toLowerCase());

      const norm = normalizeStatus(t.status);
      const isOverdue = isTaskOverdue(t);

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Overdue" ? isOverdue : norm === statusFilter);

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  const handleExportFullAudit = () => {
    if (missions.length === 0 && tasks.length === 0) {
      window.alert(`No activity records available to export for ${departmentName}.`);
      return;
    }

    const exportData = {
      title: `${departmentName} Comprehensive Governance & Delivery Audit`,
      department: departmentName,
      generatedAt: new Date().toISOString(),
      mathematicalScoreSummary: {
        departmentProductivityIndex: scoreMetrics.score,
        volumeFactor: `${scoreMetrics.volume}% (Weight 25%)`,
        timelinessFactor: `${scoreMetrics.timeliness}% (Weight 30%)`,
        qualityProofFactor: `${scoreMetrics.quality}% (Weight 30%)`,
        complexityFactor: `${scoreMetrics.complexity}% (Weight 15%)`,
        formula: "0.25V + 0.30T + 0.30Q + 0.15C",
      },
      departmentQuotaSummary: {
        assignedStateMissions: summary.missionsCount,
        totalStateTargetQuota: summary.totalTarget,
        subCascadedToAgencies: summary.cascadedToOrgs,
        unallocatedBuffer: summary.remainingUnallocated,
        verifiedCompletedDeliverables: summary.completedTasks,
        pendingLeadReview: summary.pendingVerification,
        overdueItems: summary.overdueTasks,
        overallCompletionRate: `${summary.completionRate}%`,
      },
      agencyOrganizationPerformance: agencyBreakdown.map((a) => ({
        agency: a.name,
        targetQuota: a.allocatedTarget,
        verifiedCompleted: a.completedTasks,
        totalTasksLogged: a.totalTasks,
        agencyScoreIndex: a.score,
        deliveryRate: `${a.completionRate}%`,
      })),
      activeMissions: missions.map((m) => {
        const alloc = departmentAllocations.find((a) => String(a.missionId) === String(m.id));
        return {
          id: m.id,
          title: m.title,
          deadline: m.deadline || "Ongoing",
          priority: m.priority || "Medium",
          status: m.status || "Active",
          departmentTargetQuota: Number(alloc?.allocatedTarget || alloc?.target || 0),
        };
      }),
      deliverablesAuditTrail: tasks.map((t) => ({
        id: t.id,
        title: t.title || t.name,
        organization: t.organization || "Unassigned Agency",
        team: t.team || "Unassigned Team",
        assignedOfficer: t.employeeName || t.assignedTo || "Unassigned",
        targetUnits: t.target || 1,
        dueDate: t.dueDate || "Ongoing",
        status: normalizeStatus(t.status),
        isLeadVerified: isTaskCompleted(t),
        evidenceNotes: t.evidenceNotes || "None",
        evidenceUrl: t.evidenceUrl || "None",
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Department_Audit_${departmentName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      {/* =====================================================
          HEADER WITH DEPARTMENT SWITCHER & AUDIT EXPORT
      ====================================================== */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Departmental Audit Documentation
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {departmentName} Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Dynamic mission execution audits, agency performance roll-ups, and verified evidence logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Switcher Pills */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {getDepartments().map((dept) => (
              <button
                key={dept.id || dept.name}
                type="button"
                onClick={() => setDepartmentName(dept.name)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer
                  ${
                    departmentName === dept.name
                      ? "bg-[#154B38] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                {dept.name.replace(" Department", "")}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadDepartmentData}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportFullAudit}
            icon={<Download size={14} />}
          >
            Export JSON Audit
          </Button>
        </div>
      </div>

      {/* =====================================================
          4 STAT CARDS (100% PURE MATH FROM REAL DATA)
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Department Efficiency"
          value={tasks.length > 0 ? `${deptAggregate.score} Score` : "0 Score"}
          change="Volume-weighted agency roll-up"
        />
        <StatCard
          title="Department Target Quota"
          value={summary.totalTarget.toLocaleString()}
          change={summary.totalTarget > 0 ? `${summary.missionsCount} active state missions` : "No active quota"}
          changeType="neutral"
        />
        <StatCard
          title="Cascaded to Agencies"
          value={summary.cascadedToOrgs.toLocaleString()}
          change={
            summary.totalTarget > 0
              ? `${Math.round((summary.cascadedToOrgs / summary.totalTarget) * 100)}% delegated`
              : "0% delegated"
          }
          changeType={summary.cascadedToOrgs > 0 ? "positive" : "neutral"}
        />
        <StatCard
          title="Verified Outputs"
          value={summary.completedTasks.toLocaleString()}
          change={summary.completedTasks > 0 ? `${summary.completionRate}% quota fulfilled` : "0% fulfilled"}
          changeType={summary.completedTasks > 0 ? "positive" : "neutral"}
        />
      </div>

      {/* =====================================================
          REPORT NAVIGATION TABS
      ====================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        {[
          { id: "overview", label: "Executive Summary & Scoring", icon: Gauge },
          { id: "agencies", label: "Agency Performance Roll-up", icon: Building2 },
          { id: "deliverables", label: `Deliverables Audit Log (${tasks.length})`, icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-[#154B38] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================
          TAB 1: EXECUTIVE SUMMARY & SCORING BREAKDOWN
      ====================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* 4-Factor Scoring Breakdown Card */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                      <Gauge size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Productivity Scoring Factors
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        SIH25250 mathematical formula breakdown for {departmentName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="sage">{scoreMetrics.score}/100</Badge>
                </div>

                <div className="space-y-3.5">
                  <FactorRow label="Volume" value={scoreMetrics.volume} weight="25%" color="bg-[#154B38]" />
                  <FactorRow label="Timeliness" value={scoreMetrics.timeliness} weight="30%" color="bg-[#1E654C]" />
                  <FactorRow label="Quality (Proof)" value={scoreMetrics.quality} weight="30%" color="bg-[#38A57F]" />
                  <FactorRow label="Complexity" value={scoreMetrics.complexity} weight="15%" color="bg-[#2D7D60]" />
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Formula: <b>0.25V + 0.30T + 0.30Q + 0.15C</b></span>
                <span className="font-bold text-[#154B38]">Pure Mathematical Engine</span>
              </div>
            </Card>

            {/* Quota Alignment & Mission Cascade Status */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Departmental Target Cascade Audit
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-5">
                  State outcome distribution across working agencies.
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-semibold">
                      <span className="text-slate-600">Cascaded to Agencies</span>
                      <span className="font-bold text-slate-900">
                        {summary.cascadedToOrgs.toLocaleString()} / {summary.totalTarget.toLocaleString()} units (
                        {summary.totalTarget > 0 ? Math.round((summary.cascadedToOrgs / summary.totalTarget) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#154B38] transition-all"
                        style={{
                          width: `${summary.totalTarget > 0 ? Math.min(100, (summary.cascadedToOrgs / summary.totalTarget) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-semibold">
                      <span className="text-slate-600">Verified Completed Outputs</span>
                      <span className="font-bold text-emerald-700">
                        {summary.completedTasks.toLocaleString()} units ({summary.completionRate}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all"
                        style={{
                          width: `${summary.completionRate}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-800">Unallocated Quota</span>
                    <p className="text-sm font-extrabold text-amber-900 mt-0.5">
                      {summary.remainingUnallocated.toLocaleString()} Units
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Pending Review</span>
                    <p className="text-sm font-extrabold text-emerald-900 mt-0.5">
                      {summary.pendingVerification} Deliverables
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active Initiatives: <b>{summary.missionsCount}</b></span>
                <span>Active Deliverables: <b>{summary.totalTasks}</b></span>
              </div>
            </Card>
          </div>

          {/* State Missions Audit List */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              State Missions Assigned to {departmentName}
            </h2>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Direct state outcome quotas allocated by the Executive Government.
            </p>

            {missions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active state missions assigned to {departmentName}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="pb-3 pr-4">Mission Title</th>
                      <th className="pb-3 px-4">Priority</th>
                      <th className="pb-3 px-4">Deadline</th>
                      <th className="pb-3 px-4">Allocated Quota</th>
                      <th className="pb-3 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                    {missions.map((m) => {
                      const alloc = departmentAllocations.find((a) => String(a.missionId) === String(m.id));
                      const quota = Number(alloc?.allocatedTarget || alloc?.target || 0);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 pr-4 font-bold text-slate-900">
                            {m.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={m.priority === "High" ? "danger" : "default"}>
                              {m.priority || "Medium"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {m.deadline || "Ongoing"}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#154B38]">
                            {quota > 0 ? `${quota.toLocaleString()} Units` : "Full Mission"}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <Badge variant={m.status === "Completed" ? "completed" : "sage"}>
                              {m.status || "Active"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =====================================================
          TAB 2: AGENCY PERFORMANCE ROLL-UP
      ====================================================== */}
      {activeTab === "agencies" && (
        <Card className="p-6">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Agency Organizations Performance Breakdown
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Real-time delivery rates and mathematical productivity scores calculated across sub-organizations under {departmentName}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3 pr-4">Agency Organization</th>
                  <th className="pb-3 px-4">Cascaded Quota</th>
                  <th className="pb-3 px-4">Task Deliverables</th>
                  <th className="pb-3 px-4">Verified Completed</th>
                  <th className="pb-3 px-4">SLA Fulfillment</th>
                  <th className="pb-3 pl-4 text-right">Productivity Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {agencyBreakdown.map((agency) => (
                  <tr key={agency.name} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4 font-bold text-slate-900">
                      {agency.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {agency.allocatedTarget.toLocaleString()} Units
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {agency.totalTasks} Tasks
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {agency.completedTasks.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#154B38]"
                            style={{ width: `${agency.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900">{agency.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <Badge variant="sage" className="font-extrabold">
                        {agency.score} Score
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =====================================================
          TAB 3: DELIVERABLES AUDIT LOG
      ====================================================== */}
      {activeTab === "deliverables" && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Deliverables Audit Log
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Live task records and evidence submission history across {departmentName}.
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search deliverables..."
                  className="w-48 sm:w-56 rounded-full border border-slate-200/90 bg-[#F4F6F8] py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#154B38]"
                />
              </div>

              <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <Filter size={12} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <ClipboardList size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No matching deliverable records</p>
              <p className="mt-0.5">Adjust your search or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-3 pr-4">Deliverable</th>
                    <th className="pb-3 px-4">Agency / Team</th>
                    <th className="pb-3 px-4">Officer</th>
                    <th className="pb-3 px-4">Due Date</th>
                    <th className="pb-3 px-4">Target Units</th>
                    <th className="pb-3 px-4">Verification Status</th>
                    <th className="pb-3 pl-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                  {filteredTasks.map((t, idx) => {
                    const norm = normalizeStatus(t.status);
                    const isDone = norm === "Completed";
                    const isPending = norm === "Pending Verification";

                    return (
                      <tr key={t.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 pr-4 font-bold text-slate-900">
                          {t.title || t.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <p className="font-semibold text-slate-800">{t.organization || "Department Agency"}</p>
                          <p className="text-[11px] text-slate-400">{t.team || "Working Team"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {t.employeeName || t.assignedTo || "Unassigned"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {t.dueDate || "Ongoing"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {t.target || 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              isDone
                                ? "completed"
                                : isPending
                                ? "warning"
                                : "default"
                            }
                          >
                            {norm}
                          </Badge>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(t)}
                            className="text-xs font-bold text-[#154B38] hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>Audit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =====================================================
          DELIVERABLE PROOF AUDIT MODAL
      ====================================================== */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Deliverable Proof Audit
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#F4F6F8] p-5 rounded-2xl border border-slate-200/80 mb-6">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Deliverable Title:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedTask.title || selectedTask.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Agency / Team:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTask.organization || "Agency"}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Assigned Officer:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTask.employeeName || selectedTask.assignedTo || "Unassigned"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Target Volume:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTask.target || 1} Units</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Due Date:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTask.dueDate || "Ongoing"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Audit Status:</span>
                  <Badge variant="sage" className="mt-0.5">{normalizeStatus(selectedTask.status)}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Lead Verified:</span>
                  <Badge variant={isTaskCompleted(selectedTask) ? "completed" : "default"} className="mt-0.5">
                    {isTaskCompleted(selectedTask) ? "Verified" : "Pending"}
                  </Badge>
                </div>
              </div>

              {selectedTask.evidenceNotes && (
                <div className="pt-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Submitted Evidence Notes:</span>
                  <p className="text-xs text-slate-700 mt-0.5 bg-white p-3 rounded-xl border border-slate-200">
                    {selectedTask.evidenceNotes}
                  </p>
                </div>
              )}

              {selectedTask.evidenceUrl && (
                <div className="pt-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Document Attachment URL:</span>
                  <a
                    href={selectedTask.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-bold text-[#154B38] underline mt-0.5 truncate"
                  >
                    {selectedTask.evidenceUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>
                Close Audit View
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const FactorRow = ({ label, value, weight, color }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs">
      <span className="font-semibold text-slate-700">
        {label} <small className="ml-1 text-[9px] font-bold text-slate-400">({weight})</small>
      </span>
      <span className="font-extrabold text-slate-900">{value}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamp(value)}%` }} />
    </div>
  </div>
);

export default DepartmentReports;