import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  Building2,
  Network,
  Users,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ChevronRight,
  ArrowDown,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

import {
  getMissions,
  getDepartmentAllocations,
  getOrganizationAllocations,
  getTeamAllocations,
  getTasks,
} from "../../utils/localStorage";

const MissionCascade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryMissionId = searchParams.get("missionId");

  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState(queryMissionId || null);
  const [departmentAllocations, setDepartmentAllocations] = useState([]);
  const [organizationAllocations, setOrganizationAllocations] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    try {
      const storedMissions = getMissions() || [];
      const storedDeptAlloc = getDepartmentAllocations() || [];
      const storedOrgAlloc = getOrganizationAllocations() || [];
      const storedTeamAlloc = getTeamAllocations() || [];
      const storedTasks = getTasks() || [];

      setMissions(storedMissions);
      setDepartmentAllocations(storedDeptAlloc);
      setOrganizationAllocations(storedOrgAlloc);
      setTeamAllocations(storedTeamAlloc);
      setTasks(storedTasks);

      if (storedMissions.length > 0) {
        if (queryMissionId && storedMissions.some((m) => String(m.id) === String(queryMissionId))) {
          setSelectedMissionId(queryMissionId);
        } else if (!selectedMissionId || !storedMissions.some((m) => String(m.id) === String(selectedMissionId))) {
          setSelectedMissionId(storedMissions[0].id);
        }
      } else {
        setSelectedMissionId(null);
      }
    } catch (err) {
      console.error("Failed to load cascade data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedMissionId]);

  const activeMission = useMemo(() => {
    return missions.find((m) => m.id === selectedMissionId) || missions[0] || null;
  }, [missions, selectedMissionId]);

  // Department allocations for this mission
  const activeDeptAllocations = useMemo(() => {
    if (!activeMission) return [];
    const direct = departmentAllocations.filter(
      (a) => a.missionId === activeMission.id || String(a.missionId) === String(activeMission.id)
    );
    if (direct.length > 0) return direct;

    // Fallback if mission has departments array
    if (Array.isArray(activeMission.departments) && activeMission.departments.length > 0) {
      const perDept = Math.round(Number(activeMission.target || 0) / activeMission.departments.length);
      return activeMission.departments.map((dept, idx) => ({
        id: `dept_alloc_${idx}`,
        department: dept,
        allocatedTarget: perDept,
      }));
    }
    return [];
  }, [activeMission, departmentAllocations]);

  // Tasks belonging to this mission
  const missionTasks = useMemo(() => {
    if (!activeMission) return [];
    return tasks.filter(
      (t) => t.missionId === activeMission.id || String(t.missionId) === String(activeMission.id)
    );
  }, [activeMission, tasks]);

  // Stats for the active mission
  const missionStats = useMemo(() => {
    if (!activeMission) {
      return { totalTarget: 0, completedVolume: 0, remainingVolume: 0, progress: 0, completedCount: 0 };
    }
    const target = Number(activeMission.target || 0);
    const completedTasks = missionTasks.filter((t) => String(t.status || "").toLowerCase() === "completed");
    const completedVol = completedTasks.reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
    const prog = target > 0 ? Math.min(100, Math.round((completedVol / target) * 100)) : 0;
    const remaining = Math.max(0, target - completedVol);

    return {
      totalTarget: target,
      completedVolume: completedVol,
      remainingVolume: remaining,
      progress: prog,
      completedCount: completedTasks.length,
      tasksCount: missionTasks.length,
    };
  }, [activeMission, missionTasks]);

  return (
    <DashboardLayout>
      {/* PAGE HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Mission Planning
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Mission Cascade
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Break down state missions into measurable department, organization and team deliverable targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {missions.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Mission:</span>
              <select
                value={selectedMissionId || ""}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer max-w-[160px] truncate"
              >
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/government/missions/create")}
            icon={<Plus size={15} />}
          >
            Create New Cascade
          </Button>
        </div>
      </div>

      {!activeMission ? (
        <Card className="p-12 text-center">
          <Target size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Missions to Cascade</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first government mission to begin target allocation across departments and working teams.
          </p>
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/government/missions/create")}
              icon={<Plus size={14} />}
            >
              Create State Mission
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* MISSION SUMMARY HERO */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px] mb-7">
            <Card className="flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                    <Target size={24} strokeWidth={2.2} />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active State Directive
                    </span>
                    <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-slate-900">
                      {activeMission.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                      {activeMission.description || `Target of ${missionStats.totalTarget.toLocaleString()} units assigned across ${activeDeptAllocations.length} key administrative departments.`}
                    </p>
                  </div>
                </div>

                <Badge variant={missionStats.progress === 100 ? "completed" : "sage"}>
                  {missionStats.progress === 100 ? "Completed" : "In Progress"}
                </Badge>
              </div>
            </Card>

            {/* Mission Progress Card */}
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Mission Progress</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">{missionStats.progress}%</p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                  <Target size={20} />
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#154B38] transition-all duration-500"
                    style={{ width: `${missionStats.progress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>{missionStats.completedVolume.toLocaleString()} verified</span>
                  <span>{missionStats.totalTarget.toLocaleString()} target</span>
                </div>
              </div>
            </Card>
          </div>

          {/* CASCADE HIERARCHY FLOW */}
          <Card className="mb-7 p-6 sm:p-8">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-base font-bold text-slate-900">
                Target Allocation Hierarchy
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 font-medium">
                Multi-tiered target flow from state administration down to operational teams.
              </p>
            </div>

            {/* Level 1: Government Root Node */}
            <div className="flex justify-center">
              <FlowNode
                type="Government Tier"
                title={activeMission.title}
                target={`${missionStats.totalTarget.toLocaleString()} Target`}
                icon={<Target size={20} />}
                main
              />
            </div>

            <Connector />

            {/* Level 2: Departments */}
            {activeDeptAllocations.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400 max-w-md mx-auto">
                No department allocations assigned yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {activeDeptAllocations.map((d, idx) => {
                  const targetVal = Number(d.allocatedTarget || d.target || 0);
                  const isDept = (t) => {
                    const deptStr = String(d.department || "").toLowerCase();
                    const tDept = String(t.department || "").toLowerCase();
                    const tOrg = String(t.organization || "").toLowerCase();
                    if (deptStr.includes("education")) {
                      return tDept.includes("education") || ["scholarship services", "citizen education services", "digital education", "document services", "student support services"].includes(tOrg);
                    }
                    if (deptStr.includes("health")) {
                      return tDept.includes("health") || ["health services", "health data services", "public health bureau", "medical supplies division"].includes(tOrg);
                    }
                    return tDept === deptStr;
                  };

                  const deptTasks = missionTasks.filter(isDept);
                  const doneTasks = deptTasks.filter((t) => String(t.status || "").toLowerCase() === "completed");
                  const verifiedUnits = doneTasks.reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
                  const deptProg = targetVal > 0 && verifiedUnits > 0
                    ? Math.min(100, Math.round((verifiedUnits / targetVal) * 100))
                    : deptTasks.length > 0
                    ? Math.round((doneTasks.length / deptTasks.length) * 100)
                    : 0;

                  return (
                    <FlowNode
                      key={d.id || idx}
                      type="Department Tier"
                      title={d.department || "Department"}
                      target={`${targetVal.toLocaleString()} Target`}
                      progress={deptProg}
                      icon={<Building2 size={18} />}
                    />
                  );
                })}
              </div>
            )}

            <Connector />

            {/* Level 3: Frontline Teams & Tasks */}
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Frontline Working Groups & Directives
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { name: "Scholarship Verification Team", org: "Scholarship Services" },
                { name: "Application Processing Team", org: "Scholarship Services" },
                { name: "Digital Platform Team", org: "Digital Education" },
                { name: "Health Records Team", org: "Health Services" },
              ].map((team, idx) => {
                const teamTasks = missionTasks.filter(
                  (t) => (t.team && t.team.toLowerCase() === team.name.toLowerCase()) ||
                         (t.organization && t.organization.toLowerCase() === team.org.toLowerCase())
                );
                const doneCount = teamTasks.filter((t) => String(t.status || "").toLowerCase() === "completed").length;
                const verifiedUnits = teamTasks
                  .filter((t) => String(t.status || "").toLowerCase() === "completed")
                  .reduce((s, t) => s + Number(t.verifiedTarget || t.target || 1), 0);
                const teamTarget = teamTasks.reduce((s, t) => s + Number(t.target || 1), 0);
                const teamProg = teamTarget > 0 && verifiedUnits > 0
                  ? Math.min(100, Math.round((verifiedUnits / teamTarget) * 100))
                  : teamTasks.length > 0
                  ? Math.round((doneCount / teamTasks.length) * 100)
                  : 0;

                return (
                  <FlowNode
                    key={idx}
                    type={team.org}
                    title={team.name}
                    target={teamTarget > 0 ? `${teamTarget.toLocaleString()} units` : "Active"}
                    progress={teamTasks.length > 0 ? teamProg : undefined}
                    icon={<Network size={16} />}
                  />
                );
              })}
            </div>
          </Card>

          {/* BOTTOM INFO & ACTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
            <InfoCard
              icon={<Target size={18} />}
              title="State Mission Target"
              value={missionStats.totalTarget.toLocaleString()}
              description="Deliverable Units"
              type="forest"
            />
            <InfoCard
              icon={<CheckCircle2 size={18} />}
              title="Verified Completed"
              value={missionStats.completedVolume.toLocaleString()}
              description={`${missionStats.progress}% quota verified`}
              type="green"
            />
            <InfoCard
              icon={<Clock3 size={18} />}
              title="Pending Balance"
              value={missionStats.remainingVolume.toLocaleString()}
              description="Active in frontline workflow"
              type="orange"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#EBF6F0] p-5 border border-[#D1EBDD]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#154B38] shadow-xs">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#154B38]">Cascade Milestone Deadline</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {activeMission.deadline ? `Target completion due by ${activeMission.deadline}` : "Target completion schedule: Ongoing"}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/government/departments")}
              icon={<ChevronRight size={15} />}
            >
              Manage Department Allocations
            </Button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

const FlowNode = ({ type, title, target, progress, icon, main = false }) => {
  if (main) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-forest-card-mesh text-white p-5 card-soft-shadow border border-emerald-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
              {icon}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                {type}
              </span>
              <p className="truncate text-sm font-extrabold text-white">{title}</p>
            </div>
          </div>
          <span className="text-sm font-extrabold text-white bg-white/15 px-3 py-1 rounded-full border border-white/10 shrink-0">
            {target}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 card-soft-shadow hover:border-[#154B38]/40 hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EBF6F0] text-[#154B38]">
            {icon}
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {type}
            </span>
            <p className="truncate text-xs font-bold text-slate-900">{title}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-900 shrink-0">{target}</span>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
            <span>Progress</span>
            <span className="text-slate-900 font-bold">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#154B38]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Connector = () => (
  <div className="flex justify-center my-3">
    <div className="flex flex-col items-center">
      <div className="h-6 w-0.5 bg-slate-300" />
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ArrowDown size={11} />
      </div>
    </div>
  </div>
);

const InfoCard = ({ icon, title, value, description, type }) => {
  const isForest = type === "forest";

  return (
    <div
      className={`
        rounded-2xl p-5 card-soft-shadow flex flex-col justify-between
        ${
          isForest
            ? "bg-forest-card-mesh text-white border border-emerald-950/20"
            : "bg-white border border-slate-200/80 text-slate-900"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold ${isForest ? "text-emerald-100/90" : "text-slate-400"}`}>
            {title}
          </p>
          <p className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isForest ? "text-white" : "text-slate-900"}`}>
            {value}
          </p>
          <p className={`mt-0.5 text-xs ${isForest ? "text-emerald-200/70" : "text-slate-400 font-medium"}`}>
            {description}
          </p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isForest ? "bg-white/20 text-white" : "bg-[#EBF6F0] text-[#154B38]"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MissionCascade;