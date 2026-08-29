import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  Users,
  Search,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CalendarDays,
  RefreshCw,
  Plus,
  Send,
  X,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getMissions,
  getTeamAllocations,
  getTasks,
  createTask,
  createEmployeeAllocation,
} from "../../utils/localStorage";
import { getTeams, getEmployees } from "../../data/hierarchy";

const CATEGORIES = [
  "Scholarship Verification",
  "Application Processing",
  "Document Authentication",
  "Citizen Support & Grievance",
  "Medical & Health Records",
  "Digital Platform & Infra",
  "Field Inspection & Survey",
  "General Administrative",
];

const TeamMissions = () => {
  const EMPLOYEES = useMemo(() => getEmployees(), []);
  const [selectedTeamName, setSelectedTeamName] = useState(
    () => getTeams()[0]?.name || "Scholarship Verification Team"
  );
  const [missions, setMissions] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [search, setSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  // Form State for Task Creation
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState("Scholarship Verification");
  const [taskComplexity, setTaskComplexity] = useState("Medium");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskTarget, setTaskTarget] = useState("10");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState(
    () => getEmployees()[0]?.name || "Aarav Sharma"
  );
  const [allocationError, setAllocationError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic available teams list
  const allAvailableTeams = useMemo(() => {
    const list = getTeams().map((t) => ({
      ...t,
      lead: t.supervisor || t.lead || "Team Supervisor",
    }));
    try {
      const rawAlloc = getTeamAllocations() || [];
      rawAlloc.forEach((a) => {
        const tName = a.team || a.teamName;
        if (tName && !list.some((t) => t.name.toLowerCase() === tName.toLowerCase())) {
          list.push({
            name: tName,
            code: `TEAM-${list.length + 1}`,
            organization: a.organization || "General Agency",
            department: a.department || "General Department",
            lead: a.lead || "Team Supervisor",
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
    return list;
  }, []);

  const activeTeam = useMemo(() => {
    return (
      allAvailableTeams.find(
        (t) => t.name.toLowerCase() === selectedTeamName.toLowerCase()
      ) || allAvailableTeams[0] || {
        name: selectedTeamName,
        organization: "General Agency",
        department: "General Department",
      }
    );
  }, [allAvailableTeams, selectedTeamName]);

  // Filter officers belonging to this team or all officers
  const teamOfficers = useMemo(() => {
    const specific = EMPLOYEES.filter(
      (e) => (e.team || "").toLowerCase() === activeTeam.name.toLowerCase()
    );
    return specific.length > 0 ? specific : EMPLOYEES;
  }, [EMPLOYEES, activeTeam]);

  const loadData = () => {
    setLoading(true);
    try {
      const storedMissions = getMissions() || [];
      const allAlloc = getTeamAllocations() || [];
      const filteredAlloc = allAlloc.filter(
        (a) =>
          (a.team || "").toLowerCase() === activeTeam.name.toLowerCase() ||
          (a.teamName || "").toLowerCase() === activeTeam.name.toLowerCase()
      );
      const allTasks = getTasks() || [];
      const teamTasks = allTasks.filter(
        (t) => (t.team || "").toLowerCase() === activeTeam.name.toLowerCase()
      );

      setMissions(storedMissions);
      setTeamAllocations(filteredAlloc);
      setTasks(teamTasks);
    } catch (err) {
      console.error("Failed to load team missions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamName]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedTeamName]);

  const teamDirectives = useMemo(() => {
    return teamAllocations.map((alloc) => {
      const mission = missions.find((m) => String(m.id) === String(alloc.missionId));
      const targetVal = Number(alloc.allocatedTarget || alloc.target || 0);
      const missionTasks = tasks.filter(
        (t) => String(t.missionId) === String(alloc.missionId)
      );
      const assignedTarget = missionTasks.reduce((sum, t) => sum + Number(t.target || 0), 0);
      const verifiedTarget = missionTasks
        .filter((t) => String(t.status).toLowerCase() === "completed")
        .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 0), 0);

      return {
        ...mission,
        id: alloc.missionId,
        allocationId: alloc.id,
        title: mission?.title || `Directive #${alloc.missionId}`,
        allocatedTarget: targetVal,
        assignedTarget,
        verifiedTarget,
        remainingTarget: Math.max(0, targetVal - assignedTarget),
        tasksCount: missionTasks.length,
        status: mission?.status || "Active",
      };
    });
  }, [teamAllocations, missions, tasks]);

  const filteredDirectives = useMemo(() => {
    return teamDirectives.filter((d) => {
      return !search || d.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [teamDirectives, search]);

  const openAssignModal = (directive) => {
    if (directive.remainingTarget <= 0 && directive.allocatedTarget > 0) {
      window.alert(
        `Team quota for "${directive.title}" (${directive.allocatedTarget.toLocaleString()} units) has already been 100% assigned to officers.`
      );
      return;
    }

    setSelectedMission(directive);
    setTaskTitle(`${directive.title} - Verification Task`);
    setTaskDescription(`Execute deliverable quota verification for ${directive.title}.`);
    setTaskCategory("Scholarship Verification");
    setTaskComplexity("Medium");
    setTaskPriority("Medium");
    setTaskTarget(directive.remainingTarget > 0 ? String(directive.remainingTarget) : "10");
    if (teamOfficers.length > 0) {
      setSelectedOfficer(teamOfficers[0].name);
    }
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setTaskDueDate(d.toISOString().split("T")[0]);
    setAllocationError("");
    setShowAssignModal(true);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    setAllocationError("");

    if (!selectedMission || !taskTitle || !taskTarget) {
      setAllocationError("Please provide complete task deliverable details.");
      return;
    }

    const emp =
      teamOfficers.find((e) => e.name === selectedOfficer) ||
      EMPLOYEES.find((e) => e.name === selectedOfficer) ||
      EMPLOYEES[0];
    const targetNum = Number(taskTarget);

    if (isNaN(targetNum) || targetNum <= 0) {
      setAllocationError("Please enter a valid positive target number.");
      return;
    }

    // STRICT CASCADING GUARDRAIL: Cannot exceed team remaining quota
    if (selectedMission.remainingTarget > 0 && targetNum > selectedMission.remainingTarget) {
      setAllocationError(
        `Cannot assign ${targetNum.toLocaleString()} units. Remaining unallocated directive quota is only ${selectedMission.remainingTarget.toLocaleString()} units. Task targets cannot exceed assigned directive quota.`
      );
      return;
    }

    try {
      // Phase 3: Team Supervisor creates Task with Category, Complexity, Target, Deadline
      createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        category: taskCategory,
        complexity: taskComplexity,
        priority: taskPriority,
        target: targetNum,
        dueDate: taskDueDate,
        status: "Pending",
        missionId: selectedMission.id,
        department: activeTeam.department || "Education Department",
        organization: activeTeam.organization,
        team: activeTeam.name,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        createdBy: `${activeTeam.lead || "Supervisor"} (${activeTeam.name})`,
      });

      createEmployeeAllocation({
        missionId: selectedMission.id,
        department: activeTeam.department || "Education Department",
        organization: activeTeam.organization,
        team: activeTeam.name,
        employeeId: emp.id,
        employee: emp.name,
        allocatedTarget: targetNum,
      });

      setShowAssignModal(false);
      loadData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(
        `Task deliverable allocated to ${emp.name} successfully (${targetNum} units, Complexity: ${taskComplexity})!`
      );
    } catch (err) {
      console.error("Task creation failed:", err);
      setAllocationError("Failed to allocate task to officer.");
    }
  };

  const totalAllocated = teamDirectives.reduce((sum, d) => sum + d.allocatedTarget, 0);
  const totalVerified = teamDirectives.reduce((sum, d) => sum + d.verifiedTarget, 0);

  return (
    <DashboardLayout>
      {/* HEADER WITH TEAM SELECTOR */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#154B38]">
              {activeTeam.organization} • Phase 3 Task Distribution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {activeTeam.name} Directives
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Supervisor Desk: Receive cascaded team quota and assign tagged tasks to officers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Switcher Dropdown Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Users size={14} className="text-[#154B38]" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Team:</span>
            <select
              value={selectedTeamName}
              onChange={(e) => setSelectedTeamName(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer max-w-[200px] truncate"
            >
              {allAvailableTeams.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
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
          title="Team Target"
          value={totalAllocated.toLocaleString()}
          change="Deliverable quota"
        />
        <StatCard
          title="Verified Outputs"
          value={totalVerified.toLocaleString()}
          change={`${
            totalAllocated > 0 ? Math.round((totalVerified / totalAllocated) * 100) : 0
          }% achieved`}
          changeType="positive"
        />
        <StatCard
          title="Active Directives"
          value={teamDirectives.length}
          change="Assigned from organization"
          changeType="neutral"
        />
        <StatCard
          title="Team Officers"
          value={teamOfficers.length}
          change="Assigned to this unit"
          changeType="positive"
        />
      </div>

      {/* SEARCH BAR */}
      <Card className="mb-7 p-4">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incoming team directives..."
            className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
          />
        </div>
      </Card>

      {/* DIRECTIVES LIST */}
      {filteredDirectives.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#154B38] mb-4">
            <Target size={28} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            No Cascaded Directives For This Team
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Directives cascade from Government $\rightarrow$ Department $\rightarrow$ Organization.
            Use the Organization dashboard to allocate targets to {activeTeam.name}.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredDirectives.map((directive) => {
            const hasRemaining = directive.remainingTarget > 0;
            const progress =
              directive.allocatedTarget > 0
                ? Math.min(
                    100,
                    Math.round(
                      (directive.verifiedTarget / directive.allocatedTarget) * 100
                    )
                  )
                : 0;

            return (
              <Card key={directive.allocationId} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="info">{directive.status || "Active"}</Badge>
                      <Badge variant={hasRemaining ? "sage" : "completed"}>
                        {hasRemaining
                          ? `${directive.remainingTarget.toLocaleString()} units remaining to assign`
                          : "100% Assigned"}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{directive.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Directive quota assigned by {activeTeam.organization}.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openAssignModal(directive)}
                    disabled={!hasRemaining}
                    icon={<Send size={14} />}
                  >
                    Assign Task to Officer
                  </Button>
                </div>

                {/* Quota Progress Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Team Quota
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {directive.allocatedTarget.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Assigned in Tasks
                    </span>
                    <span className="text-base font-extrabold text-[#154B38]">
                      {directive.assignedTarget.toLocaleString()} ({directive.tasksCount} tasks)
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Verified Completed
                    </span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {directive.verifiedTarget.toLocaleString()} ({progress}%)
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TASK ASSIGNMENT MODAL (PHASE 3 TAGGING) */}
      {showAssignModal && selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#154B38]">
                  Phase 3 • Task Distribution
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Dispatch Task to Officer
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quota Banner */}
            <div className="mb-4 rounded-xl border border-emerald-200 bg-[#EBF6F0] p-3 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Directive:</span>
                <b className="text-slate-900">{selectedMission.title}</b>
              </div>
              <div className="flex items-center justify-between text-emerald-900 font-bold mt-1.5 pt-1.5 border-t border-emerald-200">
                <span>Maximum Allowed to Assign:</span>
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

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Verify 500 merit scholarship applications"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Execution Instructions & Description
                </label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Provide operational guidelines, document checklist, and verification standards..."
                  className="w-full rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-medium text-slate-800 focus:border-[#154B38] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Deliverable Category
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#154B38]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Complexity Dropdown (Spec Section 3 & 4) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Complexity Tag <span className="text-emerald-700 font-extrabold">(Spec)</span>
                  </label>
                  <select
                    value={taskComplexity}
                    onChange={(e) => setTaskComplexity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#154B38]"
                  >
                    <option value="Low">Low (1.0x / 40 pts)</option>
                    <option value="Medium">Medium (1.5x / 70 pts)</option>
                    <option value="High">High (2.0x / 100 pts)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Officer Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Assign Officer
                  </label>
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#154B38]"
                  >
                    {teamOfficers.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#154B38]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    label={`Target Volume (Max: ${selectedMission.remainingTarget})`}
                    type="number"
                    min="1"
                    max={
                      selectedMission.remainingTarget > 0
                        ? selectedMission.remainingTarget
                        : undefined
                    }
                    value={taskTarget}
                    onChange={(e) => {
                      setTaskTarget(e.target.value);
                      setAllocationError("");
                    }}
                    placeholder={`Max: ${selectedMission.remainingTarget}`}
                    required
                  />
                  {Number(taskTarget) > selectedMission.remainingTarget &&
                    selectedMission.remainingTarget > 0 && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">
                        ⚠️ Exceeds quota ({selectedMission.remainingTarget} max)
                      </p>
                    )}
                </div>

                <Input
                  label="Due Date"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<Send size={14} />}
                  disabled={
                    Number(taskTarget) > selectedMission.remainingTarget &&
                    selectedMission.remainingTarget > 0
                  }
                >
                  Dispatch Task Deliverable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeamMissions;