import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Target,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity,
  CalendarDays,
  Gauge,
  Award,
  Info,
  Clock3,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  Shield,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getMissions,
  getTasks,
  getOrganizationAllocations,
} from "../../utils/localStorage";
import { getOrganizations, getTeams } from "../../data/hierarchy";
import {
  aggregateOrganizationScores,
  calculateScore,
  calculateVolume,
  calculateTimeliness,
  calculateQuality,
  calculateComplexity,
  isTaskCompleted,
  isTaskOverdue,
  isTaskSubmitted,
  clamp,
} from "../../utils/scoringEngine";
import { useAuth } from "../auth/AuthContext";

const OrganizationAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const allOrganizations = useMemo(() => getOrganizations(), []);
  const allTeams = useMemo(() => getTeams(), []);

  const [organizationName, setOrganizationName] = useState(() => {
    return (
      currentUser?.organization ||
      allOrganizations[0]?.name ||
      "Scholarship Services"
    );
  });

  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentOrg = useMemo(() => {
    return (
      allOrganizations.find(
        (o) => o.name.toLowerCase() === organizationName.toLowerCase()
      ) || allOrganizations[0]
    );
  }, [organizationName, allOrganizations]);

  const loadData = () => {
    setRefreshing(true);
    try {
      const allTasks = getTasks() || [];
      const orgTasks = allTasks.filter(
        (t) =>
          String(t.organization || "").toLowerCase() ===
            organizationName.toLowerCase() ||
          (String(t.department || "").toLowerCase() ===
            (currentOrg?.department || "").toLowerCase() &&
            !t.organization)
      );

      const allAllocations = getOrganizationAllocations() || [];
      const orgAllocations = allAllocations.filter(
        (a) =>
          String(a.organization || "").toLowerCase() ===
          organizationName.toLowerCase()
      );

      setTasks(orgTasks);
      setAllocations(orgAllocations);
      setMissions(getMissions() || []);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationName]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [organizationName]);

  // Phase 7: Team-Volume-Weighted Organization Aggregation
  const orgAggregate = useMemo(() => {
    const relevantTeams = allTeams.filter(
      (t) =>
        String(t.organization || "").toLowerCase() ===
        organizationName.toLowerCase()
    );
    const orgsData = aggregateOrganizationScores(
      tasks,
      currentOrg ? [currentOrg] : [],
      relevantTeams
    );
    return (
      orgsData[0] || {
        name: organizationName,
        score: calculateScore(tasks, missions).score,
        volume: calculateVolume(tasks),
        timeliness: calculateTimeliness(tasks),
        quality: calculateQuality(tasks),
        complexity: calculateComplexity(tasks, missions),
        totalTasks: tasks.length,
        completedTasks: tasks.filter(isTaskCompleted).length,
        submittedTasks: tasks.filter(isTaskSubmitted).length,
        overdueTasks: tasks.filter(isTaskOverdue).length,
        teamLeaderboard: [],
        interTeamBottleneck: null,
      }
    );
  }, [tasks, currentOrg, allTeams, organizationName, missions]);

  const teamLeaderboard = orgAggregate.teamLeaderboard || [];
  const completedCount = tasks.filter(isTaskCompleted).length;
  const overdueCount = tasks.filter(isTaskOverdue).length;
  const pendingVerification = tasks.filter(isTaskSubmitted).length;

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <BarChart3 size={14} />
            <span>Agency Performance Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {organizationName} Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Volume-weighted team aggregation, 4-factor sub-scores (V/T/Q/X), and inter-team latency alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Org switcher dropdown */}
          {allOrganizations.length > 1 && (
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/80 px-3.5 py-1.5 shadow-2xs">
              <Building2 size={15} className="text-[#154B38]" />
              <select
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {allOrganizations.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/organization/dashboard")}
            icon={<Gauge size={14} />}
          >
            Dashboard
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/organization/reports")}
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

      {/* PHASE 7 INTER-TEAM BOTTLENECK ALERT */}
      {orgAggregate.interTeamBottleneck && (
        <div className="mb-8 p-5 rounded-3xl border border-amber-200 bg-amber-50/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                Phase 7 Inter-Team Latency Engine
              </span>
              <p className="text-xs font-bold text-amber-950 mt-0.5">
                {orgAggregate.interTeamBottleneck}
              </p>
              <p className="text-[11px] text-amber-800 font-medium mt-1">
                Deliverable progress variance detected between fastest and slowest teams in this agency.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="shrink-0 bg-amber-800 hover:bg-amber-900 border-amber-900"
            onClick={() => navigate("/organization/teams")}
            icon={<Users size={13} />}
          >
            Manage Teams
          </Button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          featured={true}
          title="Agency Efficiency Index"
          value={`${orgAggregate.score || 0} / 100`}
          change="Volume-weighted team roll-up"
        />

        <StatCard
          title="Constituent Teams"
          value={teamLeaderboard.length > 0 ? teamLeaderboard.length : 1}
          change="Operational delivery units"
          changeType="positive"
        />

        <StatCard
          title="Completed Deliverables"
          value={`${completedCount} / ${tasks.length}`}
          change={`${
            tasks.length > 0
              ? Math.round((completedCount / tasks.length) * 100)
              : 0
          }% delivery completion rate`}
          changeType={completedCount > 0 ? "positive" : "neutral"}
        />

        <StatCard
          title="Supervisory Audit Desk"
          value={pendingVerification}
          change={
            pendingVerification > 0
              ? "Submissions awaiting verification"
              : "All deliverables audited"
          }
          changeType={pendingVerification > 0 ? "warning" : "positive"}
        />
      </div>

      {/* 4-PILLAR MATHEMATICAL SUB-SCORE BREAKDOWN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Volume Output (25%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {orgAggregate.volume || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#154B38] rounded-full"
              style={{ width: `${orgAggregate.volume || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Timeliness SLA (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {orgAggregate.timeliness || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${orgAggregate.timeliness || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quality Compliance (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {orgAggregate.quality || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-cyan-600 rounded-full"
              style={{ width: `${orgAggregate.quality || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Complexity Index (15%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {orgAggregate.complexity || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${orgAggregate.complexity || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* PHASE 7 RANKED TEAM LEADERBOARD */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-[#154B38]" />
              Constituent Team Performance Leaderboard
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Ranked mathematical roll-up weighted by completed task volume across agency teams.
            </p>
          </div>
          <Badge variant="sage">Phase 7 Spec</Badge>
        </div>

        {teamLeaderboard.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No team deliverables recorded</p>
            <p className="mt-0.5">
              Assigned team tasks will automatically populate this leaderboard in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 px-4">Team Name</th>
                  <th className="pb-3 px-4">Supervisor / Lead</th>
                  <th className="pb-3 px-4">Completed / Assigned</th>
                  <th className="pb-3 px-4">Volume (25%)</th>
                  <th className="pb-3 px-4">Timeliness (30%)</th>
                  <th className="pb-3 px-4">Quality (30%)</th>
                  <th className="pb-3 px-4">Complexity (15%)</th>
                  <th className="pb-3 px-4">Score</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {teamLeaderboard.map((team) => {
                  const isTop = team.rank === 1;
                  const isBehind = (team.overdueTasks || 0) > 0 || (team.score || 0) < 65;

                  return (
                    <tr key={team.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-4 font-black text-slate-900">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
                            isTop
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {team.rankLabel || `#${team.rank}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {team.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">
                        {team.lead || "Supervisor"}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        {team.completedTasks || 0} / {team.totalTasks || 0}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {team.volume || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {team.timeliness || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {team.quality || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {team.complexity || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm text-[#154B38]">
                        {team.score || 0} / 100
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Badge
                          variant={
                            isBehind
                              ? "danger"
                              : isTop
                              ? "completed"
                              : "default"
                          }
                        >
                          {isBehind
                            ? "Latency"
                            : isTop
                            ? "Top Performer"
                            : "Standard"}
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
    </DashboardLayout>
  );
};

export default OrganizationAnalytics;