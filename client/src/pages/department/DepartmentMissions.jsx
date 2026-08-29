import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  Plus,
  Search,
  Building2,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  X,
  RefreshCw,
  Users,
  Send,
  ArrowUpRight,
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
  getDepartmentAllocationsByDepartment,
  getOrganizationAllocationsByDepartment,
  createOrganizationAllocation,
  getDepartmentTasks,
} from "../../utils/localStorage";
import {
  getDepartmentNames,
  getOrganizationsByDepartment,
} from "../../data/hierarchy";

const DepartmentMissions = () => {
  const DEPARTMENTS = useMemo(() => getDepartmentNames(), []);
  const [departmentName, setDepartmentName] = useState(() => getDepartmentNames()[0] || "Education Department");
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [departmentAllocations, setDepartmentAllocations] = useState([]);
  const [organizationAllocations, setOrganizationAllocations] = useState([]);

  const currentDeptOrgs = useMemo(() => {
    return getOrganizationsByDepartment(departmentName).map((o) => o.name);
  }, [departmentName]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [organizationTarget, setOrganizationTarget] = useState("");
  const [modalRemainingQuota, setModalRemainingQuota] = useState(0);
  const [modalTotalQuota, setModalTotalQuota] = useState(0);
  const [modalAlreadyCascaded, setModalAlreadyCascaded] = useState(0);
  const [allocationError, setAllocationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDepartmentMissions = () => {
    setLoading(true);
    try {
      const storedMissions = getMissions() || [];
      const departmentMissions = storedMissions.filter(
        (m) => Array.isArray(m.departments) && m.departments.includes(departmentName)
      );
      setMissions(departmentMissions);

      const storedDeptAlloc = getDepartmentAllocationsByDepartment(departmentName) || [];
      setDepartmentAllocations(storedDeptAlloc);

      const storedOrgAlloc = getOrganizationAllocationsByDepartment(departmentName) || [];
      setOrganizationAllocations(storedOrgAlloc);

      const storedTasks = getDepartmentTasks(departmentName) || [];
      setTasks(storedTasks);
    } catch (error) {
      console.error("Failed to load department missions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartmentMissions();
  }, [departmentName]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        !e.key ||
        [
          "governscale_missions",
          "governscale_department_allocations",
          "governscale_organization_allocations",
          "governscale_tasks",
        ].includes(e.key)
      ) {
        loadDepartmentMissions();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("governscale-data-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("governscale-data-updated", handleStorageChange);
    };
  }, [departmentName]);

  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      const matchSearch =
        !search ||
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [missions, search, statusFilter]);

  const getMissionAllocatedTarget = (missionId) => {
    const alloc = departmentAllocations.find((a) => String(a.missionId) === String(missionId));
    return alloc ? Number(alloc.allocatedTarget || alloc.target || 0) : 0;
  };

  const getMissionSubAllocatedTarget = (missionId) => {
    return organizationAllocations
      .filter((a) => String(a.missionId) === String(missionId))
      .reduce((sum, a) => sum + Number(a.allocatedTarget || a.target || 0), 0);
  };

  const openAllocateModal = (mission) => {
    const allocated = getMissionAllocatedTarget(mission.id);
    const subAllocated = getMissionSubAllocatedTarget(mission.id);
    const remaining = Math.max(0, allocated - subAllocated);

    if (remaining <= 0 && allocated > 0) {
      window.alert(
        `Department quota for "${mission.title}" (${allocated.toLocaleString()} units) has already been 100% cascaded to organizations.`
      );
      return;
    }

    setSelectedMission(mission);
    setSelectedOrganization(currentDeptOrgs[0] || "");
    setModalTotalQuota(allocated);
    setModalAlreadyCascaded(subAllocated);
    setModalRemainingQuota(remaining);
    setOrganizationTarget(remaining > 0 ? String(remaining) : "100");
    setAllocationError("");
    setShowAllocateModal(true);
  };

  const handleAllocate = (e) => {
    e.preventDefault();
    setAllocationError("");

    if (!selectedMission || !selectedOrganization || !organizationTarget) {
      setAllocationError("Please provide a valid organization and target quantity.");
      return;
    }

    const targetNum = Number(organizationTarget);
    if (isNaN(targetNum) || targetNum <= 0) {
      setAllocationError("Please enter a positive numeric target.");
      return;
    }

    // STRICT CASCADING GUARDRAIL: Cannot exceed remaining quota
    if (modalRemainingQuota > 0 && targetNum > modalRemainingQuota) {
      setAllocationError(
        `Cannot cascade ${targetNum.toLocaleString()} units. Remaining department quota is only ${modalRemainingQuota.toLocaleString()} units. Cascaded targets cannot exceed assigned quota.`
      );
      return;
    }

    try {
      createOrganizationAllocation({
        missionId: selectedMission.id,
        department: departmentName,
        organization: selectedOrganization,
        allocatedTarget: targetNum,
      });

      setShowAllocateModal(false);
      loadDepartmentMissions();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(`Successfully cascaded ${targetNum.toLocaleString()} units to ${selectedOrganization}!`);
    } catch (err) {
      console.error("Allocation error:", err);
      setAllocationError("Failed to allocate to organization.");
    }
  };

  const totalMissions = missions.length;
  const activeMissions = missions.filter((m) => m.status === "Active").length;
  const completedMissions = missions.filter((m) => m.status === "Completed").length;

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Department Operations
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Department Missions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Review allocated state outcomes and sub-cascade targets to agency organizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartmentName(dept)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer
                  ${departmentName === dept
                    ? "bg-[#154B38] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                {dept.replace(" Department", "")}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadDepartmentMissions}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Assigned Directives"
          value={totalMissions}
          change="State-mandated initiatives"
        />
        <StatCard
          title="Active Missions"
          value={activeMissions}
          change="Execution in progress"
          changeType="positive"
        />
        <StatCard
          title="Agency Allocations"
          value={organizationAllocations.length}
          change="Sub-cascaded directives"
          changeType="neutral"
        />
        <StatCard
          title="Completed Outcomes"
          value={completedMissions}
          change="Verified milestones"
          changeType="positive"
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
              placeholder="Search department missions..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-[#F4F6F8] p-1 text-xs font-semibold text-slate-700">
            {["All", "Active", "Completed", "Pending"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  rounded-full px-3 py-1 transition-all cursor-pointer
                  ${statusFilter === status
                    ? "bg-white font-bold text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                  }
                `}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* MISSIONS LIST */}
      <div className="space-y-4">
        {filteredMissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center card-soft-shadow">
            <Target size={36} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No Missions Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No state missions are currently assigned to {departmentName}.
            </p>
          </div>
        ) : (
          filteredMissions.map((mission) => {
            const allocated = getMissionAllocatedTarget(mission.id);
            const subAllocated = getMissionSubAllocatedTarget(mission.id);
            const remaining = Math.max(0, allocated - subAllocated);
            const cascadeProgress = allocated > 0 ? Math.min(100, Math.round((subAllocated / allocated) * 100)) : 0;
            const isFullyCascaded = allocated > 0 && remaining <= 0;

            const missionTasks = tasks.filter((t) => String(t.missionId) === String(mission.id));
            const verifiedUnits = missionTasks
              .filter((t) => String(t.status || "").toLowerCase() === "completed")
              .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
            const executionRate = allocated > 0 ? Math.min(100, Math.round((verifiedUnits / allocated) * 100)) : 0;

            const orgAllocsForThisMission = organizationAllocations.filter(
              (a) => String(a.missionId) === String(mission.id)
            );

            return (
              <Card key={mission.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="sage">{mission.status || "Active"}</Badge>
                      <Badge variant={mission.priority === "High" ? "danger" : "default"}>
                        {mission.priority || "Medium"} Priority
                      </Badge>
                      <span className="text-xs font-semibold text-slate-400">
                        Deadline: {mission.deadline || "Ongoing"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {mission.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {mission.description || "State-mandated target deliverable."}
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
                        onClick={() => openAllocateModal(mission)}
                        icon={<ArrowRight size={14} />}
                      >
                        Cascade to Agency
                      </Button>
                    )}
                  </div>
                </div>

                {/* TARGET PROGRESS & BREAKDOWN */}
                <div className="mt-5 rounded-2xl bg-[#F4F6F8] p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Department Quota:</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {allocated ? allocated.toLocaleString() : "Full Mission"} Units
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Cascaded to Agencies:</span>
                    <p className="text-base font-extrabold text-[#154B38] mt-0.5">
                      {subAllocated.toLocaleString()} ({cascadeProgress}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Verified Completed:</span>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                      {verifiedUnits.toLocaleString()} ({executionRate}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Remaining Buffer:</span>
                    <p className={`text-base font-extrabold mt-0.5 ${remaining > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                      {remaining.toLocaleString()} Units
                    </p>
                  </div>
                </div>

                {/* Verified Deliverables Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Verified Deliverable Progress</span>
                    <span className="font-bold text-slate-900">
                      {verifiedUnits.toLocaleString()} / {allocated ? allocated.toLocaleString() : "0"} units ({executionRate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${executionRate >= 100 ? "bg-emerald-600" : "bg-[#154B38]"}`}
                      style={{ width: `${executionRate}%` }}
                    />
                  </div>
                </div>

                {/* ORGANIZATIONS WITH CASCADED TARGETS */}
                {orgAllocsForThisMission.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Cascaded Agencies:</span>
                    {orgAllocsForThisMission.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs"
                      >
                        {a.organization}: {Number(a.allocatedTarget || a.target).toLocaleString()} Units
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ALLOCATE MODAL WITH QUOTA GUARDRAILS */}
      {showAllocateModal && selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Cascade to Agency Organization
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
                <span>Total Dept Quota:</span>
                <b className="text-slate-900">{modalTotalQuota.toLocaleString()} Units</b>
              </div>
              <div className="flex items-center justify-between text-slate-700 font-medium mt-1">
                <span>Already Cascaded:</span>
                <b className="text-[#154B38]">{modalAlreadyCascaded.toLocaleString()} Units</b>
              </div>
              <div className="flex items-center justify-between text-emerald-900 font-bold mt-1.5 pt-1.5 border-t border-emerald-200">
                <span>Maximum Allowed to Cascade:</span>
                <span className="text-sm font-extrabold text-[#154B38]">
                  {modalRemainingQuota.toLocaleString()} Units
                </span>
              </div>
            </div>

            {allocationError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0 text-rose-600" />
                <span>{allocationError}</span>
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Mission:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedMission.title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Organization
                </label>
                <select
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-sm font-bold text-slate-900 outline-none focus:border-[#154B38] focus:ring-4 focus:ring-[#154B38]/10"
                >
                  {currentDeptOrgs.map((org) => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label={`Target Quantity to Cascade (Max: ${modalRemainingQuota})`}
                  type="number"
                  min="1"
                  max={modalRemainingQuota > 0 ? modalRemainingQuota : undefined}
                  value={organizationTarget}
                  onChange={(e) => {
                    setOrganizationTarget(e.target.value);
                    setAllocationError("");
                  }}
                  placeholder={`Max: ${modalRemainingQuota}`}
                  required
                />
                {Number(organizationTarget) > modalRemainingQuota && modalRemainingQuota > 0 && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <span>⚠️ Value exceeds remaining department quota ({modalRemainingQuota} units)</span>
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
                  disabled={Number(organizationTarget) > modalRemainingQuota && modalRemainingQuota > 0}
                >
                  Cascade Directive
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DepartmentMissions;