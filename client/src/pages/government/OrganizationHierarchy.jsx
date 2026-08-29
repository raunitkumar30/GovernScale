import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Network,
  Users,
  UserRound,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getDepartments,
  getOrganizations,
  getTeams,
  getEmployees,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createTeam,
  updateTeam,
  deleteTeam,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetHierarchyData,
} from "../../data/hierarchy";
import { getMissions, getTasks } from "../../utils/localStorage";

const OrganizationHierarchy = () => {
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState({ government: true });

  // Modal State for CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("department"); // "department" | "organization" | "team" | "employee"
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    head: "",
    email: "",
    description: "",
    department: "",
    organization: "",
    team: "",
    role: "",
    supervisor: "",
    reportingTo: "",
    baseOfficers: 6,
    tags: "",
  });

  const loadData = () => {
    setLoading(true);
    try {
      const depts = getDepartments();
      const orgs = getOrganizations();
      const tms = getTeams();
      const emps = getEmployees();
      const msn = getMissions();
      const tsk = getTasks();

      setDepartments(depts);
      setOrganizations(orgs);
      setTeams(tms);
      setEmployees(emps);
      setMissions(msn);
      setTasks(tsk);

      // Auto-expand all depts by default
      const defaultExpanded = { government: true };
      depts.forEach((d) => {
        defaultExpanded[`dept_${d.id}`] = true;
      });
      setExpandedNodes((prev) => ({ ...defaultExpanded, ...prev }));
    } catch (e) {
      console.error("Failed loading hierarchy data:", e);
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
  }, []);

  const toggleNode = (nodeKey) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const expandAll = () => {
    const all = { government: true };
    departments.forEach((d) => {
      all[`dept_${d.id}`] = true;
    });
    organizations.forEach((o) => {
      all[`org_${o.id}`] = true;
    });
    teams.forEach((t) => {
      all[`team_${t.id}`] = true;
    });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({ government: true });
  };

  // Open Add Modal
  const openAddModal = (type = "department", parent = {}) => {
    setEditingItem(null);
    setModalType(type);
    setFormData({
      name: "",
      code: "",
      head: "",
      email: "",
      description: "",
      department: parent.department || (departments[0]?.name || ""),
      organization: parent.organization || (organizations[0]?.name || ""),
      team: parent.team || (teams[0]?.name || ""),
      role: type === "employee" ? "Officer" : "",
      supervisor: parent.supervisor || "",
      reportingTo: parent.reportingTo || "",
      baseOfficers: 6,
      tags: "",
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (type, item) => {
    setEditingItem(item);
    setModalType(type);
    setFormData({
      name: item.name || "",
      code: item.code || "",
      head: item.head || "",
      email: item.email || "",
      description: item.description || "",
      department: item.department || "",
      organization: item.organization || "",
      team: item.team || "",
      role: item.role || "",
      supervisor: item.supervisor || "",
      reportingTo: item.reportingTo || "",
      baseOfficers: item.baseOfficers || 6,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
    });
    setModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Name is required.");
      return;
    }

    try {
      if (modalType === "department") {
        if (editingItem) {
          updateDepartment(editingItem.id, {
            name: formData.name,
            code: formData.code,
            head: formData.head,
            email: formData.email,
            description: formData.description,
          });
        } else {
          createDepartment({
            name: formData.name,
            code: formData.code,
            head: formData.head,
            email: formData.email,
            description: formData.description,
          });
        }
      } else if (modalType === "organization") {
        if (!formData.department) {
          alert("Department is required.");
          return;
        }
        if (editingItem) {
          updateOrganization(editingItem.id, {
            name: formData.name,
            code: formData.code,
            department: formData.department,
            head: formData.head,
            email: formData.email,
            description: formData.description,
          });
        } else {
          createOrganization({
            name: formData.name,
            code: formData.code,
            department: formData.department,
            head: formData.head,
            email: formData.email,
            description: formData.description,
          });
        }
      } else if (modalType === "team") {
        if (!formData.department || !formData.organization) {
          alert("Department and Organization are required.");
          return;
        }
        const parsedTags = formData.tags
          ? formData.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
          : [];
        if (editingItem) {
          updateTeam(editingItem.id, {
            name: formData.name,
            code: formData.code,
            department: formData.department,
            organization: formData.organization,
            supervisor: formData.supervisor,
            baseOfficers: Number(formData.baseOfficers) || 6,
            tags: parsedTags,
          });
        } else {
          createTeam({
            name: formData.name,
            code: formData.code,
            department: formData.department,
            organization: formData.organization,
            supervisor: formData.supervisor,
            baseOfficers: Number(formData.baseOfficers) || 6,
            tags: parsedTags,
          });
        }
      } else if (modalType === "employee") {
        if (!formData.team) {
          alert("Team is required.");
          return;
        }
        const selectedTm = teams.find((t) => t.name === formData.team);
        if (editingItem) {
          updateEmployee(editingItem.id, {
            name: formData.name,
            role: formData.role,
            email: formData.email,
            department: selectedTm?.department || formData.department,
            organization: selectedTm?.organization || formData.organization,
            team: formData.team,
            reportingTo: formData.reportingTo,
          });
        } else {
          createEmployee({
            name: formData.name,
            role: formData.role,
            email: formData.email,
            department: selectedTm?.department || formData.department,
            organization: selectedTm?.organization || formData.organization,
            team: formData.team,
            reportingTo: formData.reportingTo,
          });
        }
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save entity.");
    }
  };

  const handleDeleteItem = (type, item, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete ${type} "${item.name}"? This action is permanent.`
      )
    ) {
      return;
    }
    if (type === "department") deleteDepartment(item.id);
    else if (type === "organization") deleteOrganization(item.id);
    else if (type === "team") deleteTeam(item.id);
    else if (type === "employee") deleteEmployee(item.id);
    loadData();
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Reset entire organizational hierarchy to standard SIH25250 government seed template?"
      )
    ) {
      resetHierarchyData();
      loadData();
    }
  };

  // Filtered lists based on search
  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.head && d.head.toLowerCase().includes(q))
    );
  }, [departments, search]);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 1 • Government Skeleton
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Organization Hierarchy Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage the multi-layered government tree: Departments → Organizations → Teams → Employees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            variant="secondary"
            size="sm"
            onClick={handleResetDefaults}
            icon={<RotateCcw size={14} />}
          >
            Reset Default Tree
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddModal("department")}
            icon={<Plus size={16} />}
          >
            Add Department
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Departments"
          value={`${departments.length} Divisions`}
          change="Cabinet Level"
        />
        <StatCard
          title="Organizations"
          value={`${organizations.length} Agencies`}
          change="Operational Layers"
          changeType="positive"
        />
        <StatCard
          title="Working Teams"
          value={`${teams.length} Teams`}
          change="Frontline Units"
          changeType="positive"
        />
        <StatCard
          title="Total Staff"
          value={`${employees.length} Officers`}
          change="Assigned in tree"
          changeType="positive"
        />
      </div>

      {/* SEARCH BAR & EXPAND CONTROLS */}
      <Card className="mb-7 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments, organizations, teams, or officers..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="text-xs font-bold text-[#154B38] hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </Card>

      {/* DYNAMIC HIERARCHY TREE VIEW */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#154B38]" />
            <h2 className="text-base font-bold text-slate-900">
              State Governance Tree (Two-Hierarchy Foundation)
            </h2>
          </div>
          <Badge variant="sage">{departments.length} Departments Active</Badge>
        </div>

        {/* ROOT GOVERNMENT NODE */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFC] p-4 shadow-2xs">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleNode("government")}
            >
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-700">
                  {expandedNodes.government ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#154B38] text-white shadow-xs">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    State Central Government (Apex Governance)
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    Directs state targets & missions across {departments.length} departments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddModal("department");
                  }}
                  icon={<Plus size={14} />}
                >
                  Add Department
                </Button>
              </div>
            </div>

            {/* LEVEL 2: DEPARTMENTS */}
            {expandedNodes.government && (
              <div className="mt-4 ml-6 pl-4 border-l-2 border-[#154B38]/20 space-y-4">
                {filteredDepartments.map((dept) => {
                  const deptOrgs = organizations.filter(
                    (o) => o.department.toLowerCase() === dept.name.toLowerCase()
                  );
                  const isDeptExpanded = expandedNodes[`dept_${dept.id}`];

                  return (
                    <div
                      key={dept.id}
                      className="rounded-xl border border-slate-200/90 bg-white p-4 transition-all hover:border-slate-300"
                    >
                      {/* Dept Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleNode(`dept_${dept.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-slate-400">
                            {isDeptExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#154B38] text-xs font-extrabold">
                            {dept.code || "DEP"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {dept.name}
                              </h4>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                {dept.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Dept Head: <span className="font-semibold text-slate-700">{dept.head}</span> • {deptOrgs.length} Organizations
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            title="Add Organization"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddModal("organization", { department: dept.name });
                            }}
                            className="p-1.5 rounded-lg text-[#154B38] hover:bg-emerald-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} /> Add Org
                          </button>
                          <button
                            title="Edit Department"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal("department", dept);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            title="Delete Department"
                            onClick={(e) => handleDeleteItem("department", dept, e)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* LEVEL 3: ORGANIZATIONS */}
                      {isDeptExpanded && (
                        <div className="mt-3 ml-6 pl-4 border-l-2 border-emerald-200/60 space-y-3">
                          {deptOrgs.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-1">
                              No organizations created under {dept.name} yet. Click "Add Org" above.
                            </p>
                          ) : (
                            deptOrgs.map((org) => {
                              const orgTeams = teams.filter(
                                (t) => t.organization.toLowerCase() === org.name.toLowerCase()
                              );
                              const isOrgExpanded = expandedNodes[`org_${org.id}`];

                              return (
                                <div
                                  key={org.id}
                                  className="rounded-lg border border-slate-200/80 bg-[#FAFCFB] p-3 transition-all"
                                >
                                  {/* Org Header */}
                                  <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleNode(`org_${org.id}`)}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <button className="text-slate-400">
                                        {isOrgExpanded ? (
                                          <ChevronDown size={14} />
                                        ) : (
                                          <ChevronRight size={14} />
                                        )}
                                      </button>
                                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                                        {org.code || "ORG"}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-800">
                                          {org.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                          Director: {org.head} • {orgTeams.length} Teams
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        title="Add Team"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAddModal("team", {
                                            department: dept.name,
                                            organization: org.name,
                                          });
                                        }}
                                        className="p-1 rounded text-[#154B38] hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus size={12} /> Add Team
                                      </button>
                                      <button
                                        title="Edit Organization"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal("organization", org);
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        title="Delete Organization"
                                        onClick={(e) => handleDeleteItem("organization", org, e)}
                                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* LEVEL 4: TEAMS */}
                                  {isOrgExpanded && (
                                    <div className="mt-2.5 ml-5 pl-3.5 border-l-2 border-teal-200/60 space-y-2.5">
                                      {orgTeams.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic py-1">
                                          No teams assigned yet. Click "Add Team".
                                        </p>
                                      ) : (
                                        orgTeams.map((team) => {
                                          const teamEmps = employees.filter(
                                            (e) => (e.team || "").toLowerCase() === team.name.toLowerCase()
                                          );
                                          const isTeamExpanded = expandedNodes[`team_${team.id}`];

                                          return (
                                            <div
                                              key={team.id}
                                              className="rounded-lg border border-slate-200/70 bg-white p-2.5"
                                            >
                                              {/* Team Header */}
                                              <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleNode(`team_${team.id}`)}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <button className="text-slate-400">
                                                    {isTeamExpanded ? (
                                                      <ChevronDown size={13} />
                                                    ) : (
                                                      <ChevronRight size={13} />
                                                    )}
                                                  </button>
                                                  <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                                    {team.code?.substring(0, 3) || "TM"}
                                                  </div>
                                                  <div>
                                                    <p className="text-xs font-bold text-slate-900">
                                                      {team.name}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-medium">
                                                      Lead: {team.supervisor || "Supervisor"} • {teamEmps.length} Officers ({team.baseOfficers} capacity)
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                  <button
                                                    title="Add Employee"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openAddModal("employee", {
                                                        department: dept.name,
                                                        organization: org.name,
                                                        team: team.name,
                                                        reportingTo: team.supervisor,
                                                      });
                                                    }}
                                                    className="p-1 rounded text-[#154B38] hover:bg-emerald-50 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                                                  >
                                                    <Plus size={11} /> Add Officer
                                                  </button>
                                                  <button
                                                    title="Edit Team"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openEditModal("team", team);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                                  >
                                                    <Edit2 size={11} />
                                                  </button>
                                                  <button
                                                    title="Delete Team"
                                                    onClick={(e) => handleDeleteItem("team", team, e)}
                                                    className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                                  >
                                                    <Trash2 size={11} />
                                                  </button>
                                                </div>
                                              </div>

                                              {/* LEVEL 5: EMPLOYEES / OFFICERS */}
                                              {isTeamExpanded && (
                                                <div className="mt-2 ml-4 pl-3 border-l-2 border-amber-200/70 space-y-1.5">
                                                  {teamEmps.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 italic py-0.5">
                                                      No officers assigned to this team yet.
                                                    </p>
                                                  ) : (
                                                    teamEmps.map((emp) => (
                                                      <div
                                                        key={emp.id}
                                                        className="flex items-center justify-between rounded-md bg-[#F8FAFC] px-2.5 py-1.5 border border-slate-100 text-xs"
                                                      >
                                                        <div className="flex items-center gap-2">
                                                          <UserRound size={12} className="text-[#154B38]" />
                                                          <div>
                                                            <span className="font-semibold text-slate-800">
                                                              {emp.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                                              ({emp.employeeId || emp.role})
                                                            </span>
                                                            {emp.reportingTo && (
                                                              <span className="text-[9px] text-slate-400 ml-2">
                                                                ↳ Reports to: {emp.reportingTo}
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                          <button
                                                            title="Edit Officer"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              openEditModal("employee", emp);
                                                            }}
                                                            className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
                                                          >
                                                            <Edit2 size={10} />
                                                          </button>
                                                          <button
                                                            title="Delete Officer"
                                                            onClick={(e) => handleDeleteItem("employee", emp, e)}
                                                            className="p-0.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                                          >
                                                            <Trash2 size={10} />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    ))
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* CRUD MODAL FOR ADD / EDIT NODE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? "Edit" : "Create New"}{" "}
                  {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {modalType === "department" && "Define ministerial level department division."}
                  {modalType === "organization" && "Define operational agency or board."}
                  {modalType === "team" && "Define frontline working group and supervisor."}
                  {modalType === "employee" && "Add civil servant/officer account & reporting relationship."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Type Switcher if creating fresh */}
              {!editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entity Type
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                    {["department", "organization", "team", "employee"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setModalType(t);
                          openAddModal(t);
                        }}
                        className={`py-1.5 rounded-md capitalize transition-all cursor-pointer ${
                          modalType === t
                            ? "bg-white text-[#154B38] font-bold shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalType === "employee" ? "Officer Full Name" : "Entity Name"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    modalType === "department"
                      ? "e.g. Higher Education Department"
                      : modalType === "organization"
                      ? "e.g. CBSE Board / Examination Agency"
                      : modalType === "team"
                      ? "e.g. Verification Team Alpha"
                      : "e.g. Rahul Sharma"
                  }
                  required
                />
              </div>

              {/* CODE / EMPLOYEE ID */}
              {modalType !== "employee" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Code / Abbreviation
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. EDU, HDS, SVT-001"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Role
                  </label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Verification Officer, Technical Officer"
                  />
                </div>
              )}

              {/* DEPARTMENT SELECTOR (for Org, Team, Employee) */}
              {["organization", "team"].includes(modalType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#154B38] focus:outline-none"
                    required
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ORGANIZATION SELECTOR (for Team) */}
              {modalType === "team" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent Organization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#154B38] focus:outline-none"
                    required
                  >
                    {organizations
                      .filter(
                        (o) =>
                          !formData.department ||
                          o.department.toLowerCase() === formData.department.toLowerCase()
                      )
                      .map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* TEAM SELECTOR (for Employee) */}
              {modalType === "employee" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Team <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => {
                      const tName = e.target.value;
                      const tm = teams.find((t) => t.name === tName);
                      setFormData({
                        ...formData,
                        team: tName,
                        reportingTo: tm?.supervisor || formData.reportingTo,
                        department: tm?.department || formData.department,
                        organization: tm?.organization || formData.organization,
                      });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#154B38] focus:outline-none"
                    required
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.organization})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* HEAD / LEAD / SUPERVISOR / REPORTING TO */}
              {["department", "organization"].includes(modalType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Leadership / Head Officer Name
                  </label>
                  <Input
                    value={formData.head}
                    onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar"
                  />
                </div>
              )}

              {modalType === "team" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Supervisor
                    </label>
                    <Input
                      value={formData.supervisor}
                      onChange={(e) =>
                        setFormData({ ...formData, supervisor: e.target.value })
                      }
                      placeholder="e.g. Aarav Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Officer Capacity
                    </label>
                    <Input
                      type="number"
                      value={formData.baseOfficers}
                      onChange={(e) =>
                        setFormData({ ...formData, baseOfficers: e.target.value })
                      }
                      min={1}
                      max={50}
                    />
                  </div>
                </div>
              )}

              {modalType === "employee" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reports To (Supervisor Chain)
                  </label>
                  <Input
                    value={formData.reportingTo}
                    onChange={(e) =>
                      setFormData({ ...formData, reportingTo: e.target.value })
                    }
                    placeholder="e.g. Team Supervisor / Director"
                  />
                </div>
              )}

              {/* TAGS (For Team Decision Engine matching) */}
              {modalType === "team" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Domain Tags (comma-separated, used by Decision Engine)
                  </label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. verification, scholarship, emergency, document"
                  />
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Check size={14} />}>
                  {editingItem ? "Save Changes" : "Create Node"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizationHierarchy;