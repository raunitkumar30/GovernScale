import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Target,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Users,
  ArrowLeft,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import { getMissions, getTasks } from "../../utils/localStorage";
import { getDepartments, getDeptOrgMap } from "../../data/hierarchy";

const GovernmentDepartments = () => {
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const departments = useMemo(() => {
    return getDepartments().map((d) => ({
      ...d,
      shortName: d.name.replace(" Department", ""),
      icon: Building2,
    }));
  }, []);

  const loadData = () => {
    setRefreshing(true);
    try {
      setMissions(Array.isArray(getMissions()) ? getMissions() : []);
      setTasks(Array.isArray(getTasks()) ? getTasks() : []);
      setLastUpdated(new Date());
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("governscale-data-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("governscale-data-updated", handleStorageChange);
    };
  }, []);

  const resolveTaskDept = (t) => {
    const d = String(t.department || "").trim();
    if (d && d.toLowerCase().includes("department")) return d;
    const org = String(t.organization || "").toLowerCase().trim();
    const map = getDeptOrgMap();
    for (const [dept, orgList] of Object.entries(map)) {
      if (orgList.includes(org)) {
        const foundDept = getDepartments().find(
          (dep) => dep.name.toLowerCase() === dept.toLowerCase()
        );
        return foundDept ? foundDept.name : dept;
      }
    }
    return d || "Education Department";
  };

  const getDepartmentData = (deptName) => {
    const deptMissions = missions.filter((m) =>
      Array.isArray(m.departments) && m.departments.includes(deptName)
    );

    const deptTasks = tasks.filter((t) => resolveTaskDept(t) === deptName);

    const totalTasks = deptTasks.length;
    const completedTasks = deptTasks.filter(
      (t) => String(t.status || "").toLowerCase() === "completed"
    ).length;
    const verifiedVolume = deptTasks
      .filter((t) => String(t.status || "").toLowerCase() === "completed")
      .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
    const pendingTasks = totalTasks - completedTasks;
    const highPriorityTasks = deptTasks.filter(
      (t) => String(t.priority || "").toLowerCase() === "high"
    ).length;

    const totalTarget = deptMissions.reduce(
      (sum, m) => sum + Number(m.target || 0),
      0
    );

    const completionRate = totalTarget > 0 && verifiedVolume > 0
      ? Math.min(100, Math.round((verifiedVolume / totalTarget) * 100))
      : totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    return {
      missions: deptMissions,
      tasks: deptTasks,
      totalMissions: deptMissions.length,
      totalTasks,
      completedTasks,
      verifiedVolume,
      pendingTasks,
      highPriorityTasks,
      completionRate,
      totalTarget,
    };
  };

  const governmentStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter(
      (t) => String(t.status || "").toLowerCase() === "completed"
    ).length;
    const pending = totalTasks - completed;
    const completion = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return { totalTasks, completed, pending, completion };
  }, [tasks]);

  const selectedData = selectedDepartment
    ? getDepartmentData(selectedDepartment.name)
    : null;

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Government Operations
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Departments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Monitor administrative departments, active missions and execution performance.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadData}
          loading={refreshing}
          icon={<RefreshCw size={14} />}
        >
          Refresh
        </Button>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Departments"
          value={departments.length}
          change="State administrative divisions"
        />
        <StatCard
          title="Missions"
          value={missions.length}
          change="Active government initiatives"
          changeType="positive"
        />
        <StatCard
          title="Total Tasks"
          value={governmentStats.totalTasks}
          change={`${governmentStats.pending} in progress`}
          changeType="neutral"
        />
        <StatCard
          title="Task Completion"
          value={`${governmentStats.completion}%`}
          change={`${governmentStats.completed} verified completed`}
          changeType="positive"
        />
      </div>

      {/* DETAIL OR GRID */}
      {selectedDepartment && selectedData ? (
        <DepartmentDetail
          department={selectedDepartment}
          data={selectedData}
          onBack={() => setSelectedDepartment(null)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {departments.map((dept) => {
            const data = getDepartmentData(dept.name);
            return (
              <DepartmentCard
                key={dept.id}
                department={dept}
                data={data}
                onOpen={() => setSelectedDepartment(dept)}
              />
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

const DepartmentCard = ({ department, data, onOpen }) => {
  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
              <Building2 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {department.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {department.description}
              </p>
            </div>
          </div>

          <Badge variant="sage">{data.totalMissions} Missions</Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Overall Execution</span>
            <span className="font-extrabold text-slate-900">{data.completionRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#154B38] transition-all duration-500"
              style={{ width: `${data.completionRate}%` }}
            />
          </div>
        </div>

        {/* Metric Badges */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tasks
            </p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {data.totalTasks}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed
            </p>
            <p className="text-base font-extrabold text-emerald-700 mt-0.5">
              {data.completedTasks}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target
            </p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {data.totalTarget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          {data.highPriorityTasks} High Priority Tasks
        </span>

        <Button variant="secondary" size="sm" onClick={onOpen} icon={<ArrowUpRight size={14} />}>
          View Details
        </Button>
      </div>
    </Card>
  );
};

const DepartmentDetail = ({ department, data, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#154B38] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Back to All Departments</span>
        </button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{department.name}</h2>
            <p className="text-xs text-slate-400">{department.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#F4F6F8] text-center border border-slate-100">
            <p className="text-xs text-slate-400">Assigned Missions</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{data.totalMissions}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F6F8] text-center border border-slate-100">
            <p className="text-xs text-slate-400">Total Tasks</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{data.totalTasks}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F6F8] text-center border border-slate-100">
            <p className="text-xs text-slate-400">Verified Completed</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{data.completedTasks}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F6F8] text-center border border-slate-100">
            <p className="text-xs text-slate-400">Completion Rate</p>
            <p className="text-xl font-extrabold text-[#154B38] mt-1">{data.completionRate}%</p>
          </div>
        </div>
      </Card>

      {/* Missions for this department */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Assigned Missions ({data.missions.length})
        </h3>
        {data.missions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No missions currently assigned to this department.</p>
        ) : (
          <div className="space-y-3">
            {data.missions.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{m.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Target: {Number(m.target || 0).toLocaleString()} deliverables</p>
                </div>
                <Badge variant={m.status === "Completed" ? "completed" : "info"}>{m.status || "Active"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default GovernmentDepartments;