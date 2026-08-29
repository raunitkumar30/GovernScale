import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  Users,
  UserRound,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Activity,
  ListTodo,
  BriefcaseBusiness,
  RefreshCw,
  BarChart3,
  Network,
  Sparkles,
  Award,
  Gauge,
  Layers,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getOrganizationAllocations,
  getMissions,
  getTasks,
} from "../../utils/localStorage";
import { getOrganizations, getTeams } from "../../data/hierarchy";
import { aggregateOrganizationScores } from "../../utils/scoringEngine";

const OrganizationDashboard = () => {
  const navigate = useNavigate();

  const organizations = useMemo(() => getOrganizations(), []);
  const allTeams = useMemo(() => getTeams(), []);
  const [organizationName, setOrganizationName] = useState(
    () => getOrganizations()[0]?.name || "Scholarship Services"
  );
  const [organizationAllocations, setOrganizationAllocations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentOrg = useMemo(() => {
    return organizations.find((o) => o.name === organizationName);
  }, [organizationName, organizations]);

  const loadDashboardData = () => {
    setRefreshing(true);
    try {
      const allAllocations = getOrganizationAllocations() || [];
      const orgAlloc = allAllocations.filter(
        (a) => a.organization === organizationName
      );
      setOrganizationAllocations(orgAlloc);

      const storedMissions = getMissions() || [];
      setMissions(storedMissions);

      const allTasks = getTasks() || [];
      const orgTasks = allTasks.filter(
        (t) =>
          t.organization === organizationName ||
          (t.department === currentOrg?.department && !t.organization)
      );
      setTasks(orgTasks);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [organizationName]);

  useEffect(() => {
    const handleStorageChange = () => loadDashboardData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("governscale-data-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("governscale-data-updated", handleStorageChange);
    };
  }, [organizationName]);

  // Phase 7: Team-Volume-Weighted Organization Aggregation
  const orgAggregate = useMemo(() => {
    const orgsData = aggregateOrganizationScores(
      tasks,
      currentOrg ? [currentOrg] : [],
      allTeams.filter((t) => t.organization === organizationName)
    );
    return (
      orgsData[0] || {
        score: 0,
        volume: 0,
        timeliness: 0,
        quality: 0,
        complexity: 0,
        teamLeaderboard: [],
        interTeamBottleneck: null,
      }
    );
  }, [tasks, currentOrg, allTeams, organizationName]);

  const stats = useMemo(() => {
    const totalTarget = organizationAllocations.reduce(
      (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
      0
    );
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => String(t.status).toLowerCase() === "completed"
    ).length;
    const verifiedVolume = tasks
      .filter((t) => String(t.status).toLowerCase() === "completed")
      .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
    const pendingTasks = totalTasks - completedTasks;
    const completionRate =
      totalTarget > 0 && verifiedVolume > 0
        ? Math.min(100, Math.round((verifiedVolume / totalTarget) * 100))
        : totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    return {
      totalTarget,
      totalTasks,
      completedTasks,
      verifiedVolume,
      pendingTasks,
      completionRate,
      activeDirectives: organizationAllocations.length,
    };
  }, [organizationAllocations, tasks]);

  const leaderboard = orgAggregate.teamLeaderboard || [];

  return (
    <DashboardLayout>
      {/* HEADER WITH ORGANIZATION SWITCHER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            {currentOrg?.department} • Phase 7 Agency Command
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {organizationName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Agency command workbench: volume-weighted team aggregation, inter-team rankings, and bottleneck detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Org switcher pills */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setOrganizationName(org.name)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer
                  ${
                    organizationName === org.name
                      ? "bg-[#154B38] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                {org.name}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/organization/analytics")}
            icon={<BarChart3 size={14} />}
          >
            Analytics
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/organization/reports")}
            icon={<Activity size={14} />}
          >
            Audit Reports
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            loading={refreshing}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* PHASE 7 INTER-TEAM BOTTLENECK ALERT */}
      {orgAggregate.interTeamBottleneck && (
        <div className="mb-7 p-4 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Inter-Team Bottleneck Alert: {orgAggregate.interTeamBottleneck}</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            Operational latency detected in the lowest-performing team. Consider rebalancing task quota from the organization directive desk.
          </p>
        </div>
      )}

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Organization Efficiency"
          value={`${orgAggregate.score} Index`}
          change="Volume-weighted team roll-up"
        />

        <StatCard
          title="Target vs Actual"
          value={`${stats.verifiedVolume.toLocaleString()} / ${
            stats.totalTarget > 0 ? stats.totalTarget.toLocaleString() : stats.totalTasks
          }`}
          change={`${stats.completionRate}% quota delivered`}
          changeType={stats.completionRate >= 70 ? "positive" : "neutral"}
        />

        <StatCard
          title="Constituent Teams"
          value={leaderboard.length || 1}
          change="Operational working units"
          changeType="positive"
        />

        <StatCard
          title="Active Directives"
          value={stats.activeDirectives}
          change="Cascaded from Department"
          changeType="neutral"
        />
      </div>

      {/* TEAM COMPARISON RANKING LEADERBOARD (PHASE 7 SPEC REQUIREMENT) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px] mb-7">
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award size={18} className="text-[#154B38]" />
                Team Comparison Ranking Leaderboard
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Teams ranked by efficiency index and completed deliverable volume.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/organization/teams")}
              icon={<Users size={14} />}
            >
              Manage Teams
            </Button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No teams actively linked to {organizationName}.
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((team) => {
                const isFirst = team.rank === 1;
                const isSecond = team.rank === 2;
                const isThird = team.rank === 3;

                return (
                  <div
                    key={team.name}
                    className="p-4 rounded-2xl border border-slate-100 bg-[#FAFCFB] hover:bg-slate-50 hover:border-slate-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-extrabold text-xs shadow-xs ${
                          isFirst
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : isSecond
                            ? "bg-slate-200 text-slate-800"
                            : isThird
                            ? "bg-orange-100 text-orange-900 border border-orange-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {team.rankLabel}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {team.name}
                          {isFirst && (
                            <span className="rounded-full bg-emerald-50 text-[#154B38] px-2 py-0.2 text-[10px] font-extrabold border border-emerald-200">
                              ★ Top Performer
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supervisor: <b>{team.lead}</b> • {team.completedTasks || 0} tasks completed ({team.totalTasks || 0} total)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Efficiency
                        </span>
                        <span className="text-sm font-extrabold text-[#154B38]">
                          {team.score} / 100
                        </span>
                      </div>

                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Timeliness SLA
                        </span>
                        <span className="font-bold text-slate-800">{team.timeliness}%</span>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/team/dashboard")}
                        icon={<ChevronRight size={13} />}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 4-Factor Organizational Roll-up Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pillar Aggregations
                </h3>
                <p className="text-xs text-slate-400">4-Factor performance roll-up</p>
              </div>
              <Badge variant="sage">{orgAggregate.score} Index</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Volume Output</span>
                  <span className="font-bold text-slate-900">{orgAggregate.volume}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#154B38]"
                    style={{ width: `${orgAggregate.volume}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Timeliness SLA</span>
                  <span className="font-bold text-slate-900">{orgAggregate.timeliness}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1E654C]"
                    style={{ width: `${orgAggregate.timeliness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Quality / First-Pass Proof</span>
                  <span className="font-bold text-slate-900">{orgAggregate.quality}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#38A57F]"
                    style={{ width: `${orgAggregate.quality}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Complexity Index</span>
                  <span className="font-bold text-slate-900">{orgAggregate.complexity}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#2D7D60]"
                    style={{ width: `${orgAggregate.complexity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-medium leading-relaxed">
            ℹ️ <b>Phase 7 Formula:</b> Organization efficiency represents the volume-weighted aggregation of constituent working teams.
          </div>
        </Card>
      </div>

      {/* ACTIVE CASCADED DIRECTIVES */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Department Directives & Sub-Allocations
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Targets cascaded to {organizationName} and assigned to working teams.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/organization/missions")}
            icon={<ArrowUpRight size={14} />}
          >
            All Directives
          </Button>
        </div>

        {organizationAllocations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active directives currently allocated to {organizationName}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizationAllocations.map((alloc) => {
              const mission = missions.find(
                (m) => String(m.id) === String(alloc.missionId)
              );
              const targetVal = Number(
                alloc.allocatedTarget || alloc.target || 0
              );

              return (
                <div
                  key={alloc.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-slate-50 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="sage">Active Directive</Badge>
                      <Badge variant="info">Target: {targetVal.toLocaleString()} units</Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {mission?.title || `Mission #${alloc.missionId}`}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-4 pt-3 border-t border-slate-200/60">
                    <span>From: {alloc.department}</span>
                    <button
                      type="button"
                      onClick={() => navigate("/organization/teams")}
                      className="font-bold text-[#154B38] hover:underline cursor-pointer"
                    >
                      Sub-cascade to Teams →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default OrganizationDashboard;