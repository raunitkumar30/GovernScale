import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  RefreshCw,
  Plus,
  X,
  ArrowUpRight,
  Send,
  Network,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getDepartmentTasks,
  getOrganizationAllocationsByDepartment,
  createOrganizationAllocation,
  getMissions,
} from "../../utils/localStorage";
import { getDepartmentNames, getOrganizations } from "../../data/hierarchy";

const DepartmentOrganizations = () => {
  const departments = useMemo(() => getDepartmentNames(), []);
  const organizationList = useMemo(() => getOrganizations(), []);

  const [departmentName, setDepartmentName] = useState("Education Department");
  const [departmentTasks, setDepartmentTasks] = useState([]);
  const [organizationAllocations, setOrganizationAllocations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    try {
      const storedTasks = getDepartmentTasks(departmentName) || [];
      setDepartmentTasks(storedTasks);

      const storedAlloc = getOrganizationAllocationsByDepartment(departmentName) || [];
      setOrganizationAllocations(storedAlloc);

      const storedMissions = getMissions() || [];
      setMissions(storedMissions);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [departmentName]);

  const currentOrgs = useMemo(() => {
    return organizationList.filter((o) => o.department === departmentName);
  }, [departmentName]);

  const totalTasks = departmentTasks.length;
  const completedTasks = departmentTasks.filter((t) => String(t.status).toLowerCase() === "completed").length;
  const capacityRate = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%";

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Department Structure
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Department Organizations
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Agency organizations operating under {departmentName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartmentName(dept)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer
                  ${
                    departmentName === dept
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
            onClick={loadData}
            loading={refreshing}
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
          title="Organizations"
          value={currentOrgs.length}
          change={`Agencies under ${departmentName}`}
        />
        <StatCard
          title="Active Allocations"
          value={organizationAllocations.length}
          change="Cascaded mission directives"
          changeType="positive"
        />
        <StatCard
          title="Department Tasks"
          value={totalTasks}
          change={`${completedTasks} completed`}
          changeType="neutral"
        />
        <StatCard
          title="Avg. Capacity"
          value={capacityRate}
          change={totalTasks > 0 ? "Operational bandwidth" : "No active tasks"}
          changeType={completedTasks > 0 ? "positive" : "neutral"}
        />
      </div>

      {/* ORGANIZATIONS LIST */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {currentOrgs.map((org) => {
          const orgAlloc = organizationAllocations.filter((a) => a.organization === org.name);
          const totalOrgTarget = orgAlloc.reduce((sum, a) => sum + Number(a.allocatedTarget || a.target || 0), 0);
          const orgTasks = departmentTasks.filter((t) => t.organization === org.name);
          const orgDone = orgTasks.filter((t) => String(t.status).toLowerCase() === "completed").length;
          const prog = orgTasks.length > 0 ? Math.round((orgDone / orgTasks.length) * 100) : 0;

          return (
            <Card key={org.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                      <Network size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{org.name}</h3>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">{org.description}</p>
                    </div>
                  </div>
                  <Badge variant="sage">{orgAlloc.length} Directives</Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-[#F4F6F8] border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Target</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{totalOrgTarget.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F6F8] border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Tasks</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{orgTasks.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F6F8] border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Verified</span>
                    <p className="font-extrabold text-emerald-700 mt-0.5">{orgDone}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Deliverable Progress</span>
                    <span className="font-bold text-slate-900">{prog}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#154B38] transition-all"
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{org.department}</span>
                <button
                  type="button"
                  onClick={() => window.alert(`Organization: ${org.name}\nDepartment: ${org.department}\nAllocated Target: ${totalOrgTarget}`)}
                  className="flex items-center gap-1 text-xs font-bold text-[#154B38] hover:underline cursor-pointer"
                >
                  <span>Agency Details</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default DepartmentOrganizations;