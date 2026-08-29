import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  Target,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Award,
  Layers,
  Sparkles,
  Shield,
  Gauge,
  Sliders,
  CalendarDays,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getDepartmentTasks,
  getMissions,
  getTasks,
} from "../../utils/localStorage";
import { getDepartments, getOrganizations } from "../../data/hierarchy";
import {
  aggregateDepartmentScores,
  calculateScore,
  calculateVolume,
  calculateTimeliness,
  calculateQuality,
  calculateComplexity,
  isTaskCompleted,
  isTaskOverdue,
  isTaskSubmitted,
} from "../../utils/scoringEngine";
import { useAuth } from "../auth/AuthContext";

const DepartmentAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const allDepartments = useMemo(() => getDepartments(), []);
  const allOrganizations = useMemo(() => getOrganizations(), []);

  const [departmentName, setDepartmentName] = useState(() => {
    return (
      currentUser?.department ||
      allDepartments[0]?.name ||
      "Education Department"
    );
  });

  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    try {
      const deptTasks = getDepartmentTasks(departmentName) || [];
      setTasks(deptTasks);

      const allMissions = getMissions() || [];
      const deptMissions = allMissions.filter(
        (m) =>
          Array.isArray(m.departments) &&
          m.departments.some(
            (d) => String(d).toLowerCase() === departmentName.toLowerCase()
          )
      );
      setMissions(deptMissions);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentName]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [departmentName]);

  // Aggregate Department Analytics Array
  const deptAggregates = useMemo(() => {
    return aggregateDepartmentScores(
      tasks,
      missions,
      allDepartments,
      allOrganizations
    );
  }, [tasks, missions, allDepartments, allOrganizations]);

  const currentScoreObj = useMemo(() => {
    if (Array.isArray(deptAggregates)) {
      const found = deptAggregates.find(
        (d) => (d.name || "").toLowerCase() === departmentName.toLowerCase()
      );
      if (found) return found;
    }

    const baseSc = calculateScore(tasks, missions);
    return {
      name: departmentName,
      score: baseSc.score,
      volume: calculateVolume(tasks),
      timeliness: calculateTimeliness(tasks),
      quality: calculateQuality(tasks),
      complexity: calculateComplexity(tasks, missions),
      totalTasks: tasks.length,
      completedTasks: tasks.filter(isTaskCompleted).length,
      submittedTasks: tasks.filter(isTaskSubmitted).length,
      overdueTasks: tasks.filter(isTaskOverdue).length,
      organizations: [],
      organizationBreakdown: [],
      missionContributionRate: 0,
      totalMissionTarget: 0,
    };
  }, [deptAggregates, departmentName, tasks, missions]);

  const totalMissionTarget = missions.reduce(
    (sum, m) => sum + Number(m.target || 0),
    0
  );
  const totalCompletedUnits = tasks
    .filter(isTaskCompleted)
    .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);

  const deliveryRate =
    totalMissionTarget > 0
      ? Math.min(100, Math.round((totalCompletedUnits / totalMissionTarget) * 100))
      : tasks.length > 0
      ? Math.round(
          (tasks.filter(isTaskCompleted).length / tasks.length) * 100
        )
      : 0;

  const orgBreakdown = currentScoreObj.organizationBreakdown || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <BarChart3 size={14} />
            <span>Departmental Intelligence & Strategic Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {departmentName} Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Volume-weighted agency contribution breakdown, quality verification index, and delivery velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {allDepartments.length > 1 && (
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/80 px-3.5 py-1.5 shadow-2xs">
              <Building2 size={15} className="text-[#154B38]" />
              <select
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {allDepartments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/department/dashboard")}
            icon={<Gauge size={14} />}
          >
            Dashboard
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/department/reports")}
            icon={<FileText size={14} />}
          >
            Audit Report
          </Button>

          <button
            type="button"
            onClick={loadData}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-2xs cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          featured={true}
          title="Weighted Department Index"
          value={`${currentScoreObj.score || 0} / 100`}
          change="Volume-weighted agency roll-up"
        />

        <StatCard
          title="Strategic Delivery Rate"
          value={`${deliveryRate}%`}
          change={`${totalCompletedUnits.toLocaleString()} / ${totalMissionTarget > 0 ? totalMissionTarget.toLocaleString() : tasks.length} units`}
          changeType={deliveryRate >= 70 ? "positive" : "neutral"}
        />

        <StatCard
          title="Constituent Agencies"
          value={orgBreakdown.length > 0 ? orgBreakdown.length : allOrganizations.filter((o) => (o.department || "").toLowerCase() === departmentName.toLowerCase()).length}
          change="Operating statutory agencies"
          changeType="positive"
        />

        <StatCard
          title="Active State Directives"
          value={missions.length}
          change="Cabinet directives in execution"
          changeType="neutral"
        />
      </div>

      {/* 4-PILLAR MATHEMATICAL SUB-SCORE BREAKDOWN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Volume Output (25%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentScoreObj.volume || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#154B38] rounded-full"
              style={{ width: `${currentScoreObj.volume || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Timeliness SLA (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentScoreObj.timeliness || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${currentScoreObj.timeliness || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quality Compliance (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentScoreObj.quality || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-cyan-600 rounded-full"
              style={{ width: `${currentScoreObj.quality || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Complexity Index (15%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentScoreObj.complexity || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${currentScoreObj.complexity || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Constituent Agencies Performance Breakdown */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-[#154B38]" />
              Constituent Organization Efficiency Ledger
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Ranked comparison of agencies under {departmentName}, weighted by delivered volume.
            </p>
          </div>
          <Badge variant="sage">SIH25250 Formula</Badge>
        </div>

        {orgBreakdown.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No agency deliverables recorded yet</p>
            <p className="mt-0.5">Tasks assigned to agencies will calculate and rank here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 px-4">Organization Agency</th>
                  <th className="pb-3 px-4">Volume Share</th>
                  <th className="pb-3 px-4">Deliverables (Done / Total)</th>
                  <th className="pb-3 px-4">Agency Score</th>
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {orgBreakdown.map((org, idx) => (
                  <tr key={org.name} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4 font-black text-slate-900">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-black">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {org.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Director: {org.head || "Agency Director"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{org.volumeShare || 0}%</span>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#154B38] rounded-full"
                            style={{ width: `${org.volumeShare || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">
                      {org.completedTasks || 0} / {org.totalTasks || 0}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm text-[#154B38]">
                      {org.score || 0} / 100
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate("/organization/dashboard")}
                        className="inline-flex items-center gap-1 text-[#154B38] font-bold hover:underline cursor-pointer"
                      >
                        <span>Inspect Agency</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default DepartmentAnalytics;
