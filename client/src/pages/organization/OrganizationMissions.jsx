import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  Search,
  Users,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CalendarDays,
  RefreshCw,
  Building2,
  Send,
  X,
  ShieldAlert,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getMissions,
  getOrganizationAllocations,
  getTeamAllocations,
  createTeamAllocation,
  getTasks,
} from "../../utils/localStorage";
import { getOrganizationNames, getTeamsByOrganization } from "../../data/hierarchy";

const OrganizationMissions = () => {
  const ORGANIZATIONS = useMemo(() => getOrganizationNames(), []);
  const [organizationName, setOrganizationName] = useState(() => getOrganizationNames()[0] || "Scholarship Services");
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [organizationAllocations, setOrganizationAllocations] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamTarget, setTeamTarget] = useState("");
  const [allocationError, setAllocationError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    try {
      const storedMissions = getMissions() || [];
      setMissions(storedMissions);

      const allOrgAlloc = getOrganizationAllocations() || [];
      const orgAlloc = allOrgAlloc.filter((a) => a.organization === organizationName);
      setOrganizationAllocations(orgAlloc);

      const allTeamAlloc = getTeamAllocations() || [];
      const teamAlloc = allTeamAlloc.filter((a) => a.organization === organizationName);
      setTeamAllocations(teamAlloc);

      const allTasks = getTasks() || [];
      const orgTasks = allTasks.filter(
        (t) => t.organization === organizationName || (!t.organization && orgAlloc.some((a) => String(a.missionId) === String(t.missionId)))
      );
      setTasks(orgTasks);
    } catch (err) {
      console.error("Failed to load organization missions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationName]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        !e.key ||
        [
          "governscale_missions",
          "governscale_organization_allocations",
          "governscale_team_allocations",
          "governscale_tasks",
        ].includes(e.key)
      ) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("governscale-data-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("governscale-data-updated", handleStorageChange);
    };
  }, [organizationName]);

  const availableTeams = useMemo(() => {
    return getTeamsByOrganization(organizationName);
  }, [organizationName]);

  const orgMissionList = useMemo(() => {
    return organizationAllocations.map((alloc) => {
      const mission = missions.find((m) => String(m.id) === String(alloc.missionId));
      const allocatedTarget = Number(alloc.allocatedTarget || alloc.target || 0);

      const subAllocatedToTeams = teamAllocations
        .filter((ta) => String(ta.missionId) === String(alloc.missionId))
        .reduce((sum, ta) => sum + Number(ta.allocatedTarget || ta.target || 0), 0);

      const orgMissionTasks = tasks.filter(
        (t) => String(t.missionId) === String(alloc.missionId)
      );
      const verifiedCompleted = orgMissionTasks
        .filter((t) => String(t.status || "").toLowerCase() === "completed")
        .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
      const executionRate = allocatedTarget > 0 ? Math.min(100, Math.round((verifiedCompleted / allocatedTarget) * 100)) : 0;

      return {
        ...mission,
        id: alloc.missionId,
        allocationId: alloc.id,
        department: alloc.department,
        allocatedTarget,
        subAllocatedToTeams,
        verifiedCompleted,
        executionRate,
        remainingTarget: Math.max(0, allocatedTarget - subAllocatedToTeams),
        title: mission?.title || `Mission #${alloc.missionId}`,
        description: mission?.description || "Cascaded state mission objective.",
        deadline: mission?.deadline || "Ongoing",
        status: mission?.status || "Active",
        priority: mission?.priority || "Medium",
      };
    });
  }, [organizationAllocations, missions, teamAllocations, tasks]);

  const filteredMissions = useMemo(() => {
    return orgMissionList.filter((m) => {
      const matchSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orgMissionList, search, statusFilter]);

  const openAllocateModal = (item) => {
    if (item.remainingTarget <= 0 && item.allocatedTarget > 0) {
      window.alert(
        `Agency quota for "${item.title}" (${item.allocatedTarget.toLocaleString()} units) has already been 100% cascaded to teams.`
      );
      return;
    }

    setSelectedMission(item);
    if (availableTeams.length > 0) {
      setSelectedTeam(availableTeams[0].name);
    }
    setTeamTarget(item.remainingTarget > 0 ? String(item.remainingTarget) : "50");
    setAllocationError("");
    setShowAllocateModal(true);
  };

  const handleAllocateToTeam = (e) => {
    e.preventDefault();
    setAllocationError("");

    if (!selectedMission || !selectedTeam || !teamTarget) {
      setAllocationError("Please fill all target allocation fields.");
      return;
    }

    const num = Number(teamTarget);
    if (isNaN(num) || num <= 0) {
      setAllocationError("Please provide a positive numeric target.");
      return;
    }

    // STRICT CASCADING GUARDRAIL: Cannot exceed remaining quota
    if (selectedMission.remainingTarget > 0 && num > selectedMission.remainingTarget) {
      setAllocationError(
        `Cannot cascade ${num.toLocaleString()} units. Remaining agency quota is only ${selectedMission.remainingTarget.toLocaleString()} units. Cascaded targets cannot exceed assigned quota.`
      );
      return;
    }

    try {
      createTeamAllocation({
        missionId: selectedMission.id,
        department: selectedMission.department || "Education Department",
        organization: organizationName,
        team: selectedTeam,
        allocatedTarget: num,
      });

      setShowAllocateModal(false);
      loadData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(`Successfully allocated ${num.toLocaleString()} units to ${selectedTeam}!`);
    } catch (err) {
      console.error("Team allocation failed:", err);
      setAllocationError("Unable to complete team allocation.");
    }
  };

  const totalDirectives = orgMissionList.length;
  const totalTargetSum = orgMissionList.reduce((sum, m) => sum + m.allocatedTarget, 0);
  const totalCascadedToTeams = orgMissionList.reduce((sum, m) => sum + m.subAllocatedToTeams, 0);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Organization Operations
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Organization Missions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage agency directives and sub-allocate deliverables to frontline execution teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {ORGANIZATIONS.map((org) => (
              <button
                key={org}
                type="button"
                onClick={() => setOrganizationName(org)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer
                  ${
                    organizationName === org
                      ? "bg-[#154B38] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                {org.replace(" Services", "").replace(" Education", "")}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={loadData} loading={loading} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Assigned Quota"
          value={totalTargetSum.toLocaleString()}
          change="State target units"
        />
        <StatCard
          title="Active Directives"
          value={totalDirectives}
          change="Delegated initiatives"
          changeType="positive"
        />
        <StatCard
          title="Cascaded to Teams"
          value={totalCascadedToTeams.toLocaleString()}
          change={`${totalTargetSum > 0 ? Math.round((totalCascadedToTeams / totalTargetSum) * 100) : 0}% delegated`}
          changeType="positive"
        />
        <StatCard
          title="Operational Teams"
          value={availableTeams.length}
          change="Available staff groups"
          changeType="neutral"
        />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <Card className="mb-7 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search directives..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 text-[11px] uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option>All</option>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* DIRECTIVES LIST */}
      <div className="space-y-4">
        {filteredMissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center card-soft-shadow">
            <Target size={32} className="mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No active directives</h3>
            <p className="text-xs text-slate-400 mt-1">No directives currently assigned to {organizationName}.</p>
          </div>
        ) : (
          filteredMissions.map((item) => {
            const teamAllocsForThis = teamAllocations.filter(
              (ta) => String(ta.missionId) === String(item.id)
            );
            const isFullyCascaded = item.allocatedTarget > 0 && item.remainingTarget <= 0;
            const progress = item.allocatedTarget > 0 ? Math.min(100, Math.round((item.subAllocatedToTeams / item.allocatedTarget) * 100)) : 0;

            return (
              <Card key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="sage">{item.status}</Badge>
                      <Badge variant={item.priority === "High" ? "danger" : "warning"}>
                        {item.priority} Priority
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">
                        Due {item.deadline}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isFullyCascaded ? (
                      <Badge variant="completed" className="px-3.5 py-1.5 text-xs">
                        100% Cascaded
                      </Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAllocateModal(item)}
                        icon={<Send size={14} />}
                      >
                        Allocate to Team
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F4F6F8] p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Allocated Quota:</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {item.allocatedTarget.toLocaleString()} Units
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Delegated to Teams:</span>
                    <p className="text-base font-extrabold text-[#154B38] mt-0.5">
                      {item.subAllocatedToTeams.toLocaleString()} ({progress}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Verified Completed:</span>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                      {item.verifiedCompleted.toLocaleString()} ({item.executionRate}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Unassigned Buffer:</span>
                    <p className={`text-base font-extrabold mt-0.5 ${item.remainingTarget > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                      {item.remainingTarget.toLocaleString()} Units
                    </p>
                  </div>
                </div>

                {/* Verified Execution Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Verified Deliverable Progress</span>
                    <span className="font-bold text-slate-900">
                      {item.verifiedCompleted.toLocaleString()} / {item.allocatedTarget.toLocaleString()} units ({item.executionRate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${item.executionRate >= 100 ? "bg-emerald-600" : "bg-[#154B38]"}`}
                      style={{ width: `${item.executionRate}%` }}
                    />
                  </div>
                </div>

                {teamAllocsForThis.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Working Teams:</span>
                    {teamAllocsForThis.map((ta, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs"
                      >
                        {ta.team}: {Number(ta.allocatedTarget || ta.target).toLocaleString()} Units
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* TEAM ALLOCATION MODAL WITH QUOTA GUARDRAILS */}
      {showAllocateModal && selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Cascade Deliverables to Team
              </h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quota Check Guardrail Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs mb-4">
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span>Total Agency Quota:</span>
                <b className="text-slate-900">{selectedMission.allocatedTarget.toLocaleString()} Units</b>
              </div>
              <div className="flex items-center justify-between text-slate-700 font-medium mt-1">
                <span>Already Cascaded to Teams:</span>
                <b className="text-[#154B38]">{selectedMission.subAllocatedToTeams.toLocaleString()} Units</b>
              </div>
              <div className="flex items-center justify-between text-emerald-900 font-bold mt-1.5 pt-1.5 border-t border-emerald-200">
                <span>Maximum Allowed to Cascade:</span>
                <span className="text-sm font-extrabold text-[#154B38]">
                  {selectedMission.remainingTarget.toLocaleString()} Units
                </span>
              </div>
            </div>

            {allocationError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0 text-rose-600" />
                <span>{allocationError}</span>
              </div>
            )}

            <form onSubmit={handleAllocateToTeam} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Directive:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedMission.title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Execution Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-sm font-bold text-slate-900 outline-none focus:border-[#154B38] focus:ring-4 focus:ring-[#154B38]/10"
                >
                  {availableTeams.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label={`Target Deliverable Volume (Max: ${selectedMission.remainingTarget})`}
                  type="number"
                  min="1"
                  max={selectedMission.remainingTarget > 0 ? selectedMission.remainingTarget : undefined}
                  value={teamTarget}
                  onChange={(e) => {
                    setTeamTarget(e.target.value);
                    setAllocationError("");
                  }}
                  placeholder={`Max: ${selectedMission.remainingTarget}`}
                  required
                />
                {Number(teamTarget) > selectedMission.remainingTarget && selectedMission.remainingTarget > 0 && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <span>⚠️ Value exceeds remaining agency quota ({selectedMission.remainingTarget} units)</span>
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAllocateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<Send size={14} />}
                  disabled={Number(teamTarget) > selectedMission.remainingTarget && selectedMission.remainingTarget > 0}
                >
                  Cascade to Team
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizationMissions;