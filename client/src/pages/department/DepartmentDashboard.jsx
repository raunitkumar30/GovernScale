import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  Target,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  CalendarDays,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  FileText,
  Award,
  Gauge,
  Landmark,
  BarChart3,
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
import { aggregateDepartmentScores } from "../../utils/scoringEngine";

const DepartmentDashboard = () => {
  const navigate = useNavigate();

  const allDepartments = useMemo(() => getDepartments(), []);
  const allOrganizations = useMemo(() => getOrganizations(), []);
  const [departmentName, setDepartmentName] = useState(
    () => getDepartments()[0]?.name || "Education Department"
  );
  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentDept = useMemo(() => {
    return allDepartments.find((d) => d.name === departmentName);
  }, [departmentName, allDepartments]);

  const loadDepartmentData = () => {
    setRefreshing(true);
    try {
      const storedTasks = getDepartmentTasks(departmentName);
      setTasks(Array.isArray(storedTasks) ? storedTasks : []);

      const storedMissions = getMissions();
      const departmentMissions = Array.isArray(storedMissions)
        ? storedMissions.filter(
            (m) =>
              Array.isArray(m.departments) &&
              m.departments.some(
                (d) => d.toLowerCase() === departmentName.toLowerCase()
              )
          )
        : [];
      setMissions(departmentMissions);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadDepartmentData();
  }, [departmentName]);

  useEffect(() => {
    const handleStorageChange = () => loadDepartmentData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("governscale-data-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("governscale-data-updated", handleStorageChange);
    };
  }, [departmentName]);

  // Phase 8: Organization-Volume-Weighted Department Roll-Up
  const deptAggregate = useMemo(() => {
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
  }, [tasks, missions, currentDept, allOrganizations, departmentName]);

  const totalTarget = missions.reduce(
    (sum, m) => sum + Number(m.target || 0),
    0
  );
  const verifiedVolume = tasks
    .filter((t) => String(t.status || "").toLowerCase() === "completed")
    .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
  const completedCount = tasks.filter(
    (t) => String(t.status || "").toLowerCase() === "completed"
  ).length;

  const targetProgress =
    totalTarget > 0
      ? Math.min(100, Math.round((verifiedVolume / totalTarget) * 100))
      : 0;

  const orgBreakdown = deptAggregate.organizationBreakdown || [];

  return (
    <DashboardLayout>
      {/* HEADER WITH DEPARTMENT SWITCHER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 8 • Department Command Center
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {departmentName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Strategic cabinet desk: volume-weighted agency roll-up, volume share breakdown, and state mission contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Switcher Pills */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {allDepartments.map((dept) => (
              <button
                key={dept.id}
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
            onClick={() => navigate("/department/analytics")}
            icon={<BarChart3 size={14} />}
          >
            Analytics
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/department/reports")}
            icon={<FileText size={14} />}
          >
            Audit Reports
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadDepartmentData}
            loading={refreshing}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* PHASE 8 MISSION CONTRIBUTION BANNER */}
      {missions.length > 0 && (
        <div className="mb-7 p-4 rounded-2xl border border-emerald-200 bg-[#EBF6F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-[#154B38] shrink-0" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#154B38]">
                State Strategic Contribution
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {targetProgress}% of active state mission targets delivered by {departmentName} ({verifiedVolume.toLocaleString()} / {totalTarget.toLocaleString()} units).
              </p>
            </div>
          </div>
          <Badge variant="completed" className="shrink-0">
            {verifiedVolume.toLocaleString()} Units Verified
          </Badge>
        </div>
      )}

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Department Efficiency"
          value={`${deptAggregate.score} Index`}
          change="Volume-weighted agency roll-up"
        />

        <StatCard
          title="Target vs Delivered"
          value={`${verifiedVolume.toLocaleString()} / ${
            totalTarget > 0 ? totalTarget.toLocaleString() : tasks.length
          }`}
          change={`${targetProgress}% of state quota completed`}
          changeType={targetProgress >= 70 ? "positive" : "neutral"}
        />

        <StatCard
          title="Constituent Agencies"
          value={orgBreakdown.length || 1}
          change="Operational organizations"
          changeType="positive"
        />

        <StatCard
          title="Active State Directives"
          value={missions.length}
          change="Cabinet initiatives"
          changeType="neutral"
        />
      </div>

      {/* ORGANIZATION BREAKDOWN & VOLUME SHARE (PHASE 8 SPEC REQUIREMENT) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px] mb-7">
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-[#154B38]" />
                Constituent Organization Volume Share & Scores
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Agency performance indices weighted by delivered task volume.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/department/organizations")}
              icon={<ArrowUpRight size={14} />}
            >
              All Organizations
            </Button>
          </div>

          {orgBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No organizations currently registered under {departmentName}.
            </div>
          ) : (
            <div className="space-y-4">
              {orgBreakdown.map((org, idx) => (
                <div
                  key={org.name}
                  className="p-4 rounded-2xl border border-slate-100 bg-[#FAFCFB] hover:bg-slate-50 hover:border-slate-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{org.name}</h4>
                        <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-extrabold">
                          {org.volumeShare}% of Dept Volume
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Director: <b>{org.head || "Agency Director"}</b> • {org.completedVolume || 0} completed units
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Agency Score
                        </span>
                        <span className="text-sm font-extrabold text-[#154B38]">
                          {org.score} / 100
                        </span>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/organization/dashboard")}
                        icon={<ChevronRight size={13} />}
                      >
                        Drill Down
                      </Button>
                    </div>
                  </div>

                  {/* Volume Share Visualizer Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                      <span>Volume Contribution</span>
                      <span>{org.completedVolume || 0} units ({org.volumeShare}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#154B38] transition-all duration-500"
                        style={{ width: `${org.volumeShare}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 4-Factor Department Roll-up Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Department Pillars
                </h3>
                <p className="text-xs text-slate-400">4-Factor performance roll-up</p>
              </div>
              <Badge variant="sage">{deptAggregate.score} Index</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Volume Output</span>
                  <span className="font-bold text-slate-900">{deptAggregate.volume}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#154B38]"
                    style={{ width: `${deptAggregate.volume}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Timeliness SLA</span>
                  <span className="font-bold text-slate-900">{deptAggregate.timeliness}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1E654C]"
                    style={{ width: `${deptAggregate.timeliness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Quality / Evidence Compliance</span>
                  <span className="font-bold text-slate-900">{deptAggregate.quality}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#38A57F]"
                    style={{ width: `${deptAggregate.quality}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Complexity Index</span>
                  <span className="font-bold text-slate-900">{deptAggregate.complexity}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#2D7D60]"
                    style={{ width: `${deptAggregate.complexity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-medium leading-relaxed">
            ℹ️ <b>Phase 8 Formula:</b> Department efficiency is the volume-weighted roll-up of constituent agency scores.
          </div>
        </Card>
      </div>

      {/* ACTIVE DEPARTMENT MISSIONS LIST */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Strategic Directives
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              High-level government missions binding {departmentName}.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/department/missions")}
            icon={<Target size={14} />}
          >
            All Missions
          </Button>
        </div>

        {missions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active strategic missions assigned to {departmentName}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((mission) => {
              const mTasks = tasks.filter((t) => String(t.missionId) === String(mission.id));
              const mVerified = mTasks
                .filter((t) => String(t.status || "").toLowerCase() === "completed")
                .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
              const mTarget = Number(mission.target || 0);
              const mProg = mTarget > 0 ? Math.min(100, Math.round((mVerified / mTarget) * 100)) : 0;

              return (
                <div
                  key={mission.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-slate-50 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="sage">{mission.priority || "Medium"} Priority</Badge>
                      <Badge variant={mProg >= 100 ? "completed" : "info"}>
                        {mProg >= 100 ? "Completed" : "In Progress"}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {mission.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                      <span>Verified Progress</span>
                      <span className="font-extrabold text-slate-900">
                        {mVerified.toLocaleString()} / {mTarget.toLocaleString()} ({mProg}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          mProg >= 100 ? "bg-emerald-600" : "bg-[#154B38]"
                        }`}
                        style={{ width: `${mProg}%` }}
                      />
                    </div>
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

export default DepartmentDashboard;