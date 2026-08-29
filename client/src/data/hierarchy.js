// =====================================================
// GOVERNSCALE — CENTRALIZED HIERARCHY DATA & CRUD (PHASE 1)
// =====================================================
//
// Single source of truth for all organizational entities.
//
// Government
//   ├── Department
//   │     └── Organization
//   │           └── Team
//   │                 └── Employee
//
// On first load, seed data is written to localStorage.
// All reads/writes go through localStorage with live event dispatching.
// =====================================================

const KEYS = {
  departments: "governscale_departments",
  organizations: "governscale_organizations",
  teams: "governscale_teams",
  employees: "governscale_employees",
  seeded: "governscale_hierarchy_seeded",
};

// =====================================================
// SEED DATA (SIH25250 Architecture Standard)
// =====================================================

export const SEED_DEPARTMENTS = [
  {
    id: "dept_001",
    name: "Education Department",
    code: "EDU",
    head: "Dr. Ramesh Verma",
    email: "head.education@gov.in",
    description: "Responsible for state education, scholarships, curricula, and digital learning initiatives.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept_002",
    name: "Healthcare Department",
    code: "HLT",
    head: "Dr. Sanjay Mehta",
    email: "head.health@gov.in",
    description: "Responsible for public health infrastructure, digital medical records, hospital networks, and health schemes.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept_003",
    name: "Citizen Services Department",
    code: "CSD",
    head: "Ms. Kavita Rao",
    email: "head.citizen@gov.in",
    description: "Responsible for citizen identity documents, civic services delivery, and public grievance redressal.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

export const SEED_ORGANIZATIONS = [
  // Education Department
  {
    id: "org_001",
    name: "Scholarship Services",
    code: "SS",
    department: "Education Department",
    head: "Aarav Sharma",
    email: "director.scholarship@gov.in",
    description: "Manages state scholarship disbursement, application validation, and student verification.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "org_002",
    name: "Digital Education",
    code: "DE",
    department: "Education Department",
    head: "Rahul Singh",
    email: "director.digitaledu@gov.in",
    description: "Digital platform infrastructure, online exam platforms, and smart classroom initiatives.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "org_003",
    name: "Citizen Education Services",
    code: "CES",
    department: "Education Department",
    head: "Priya Verma",
    email: "director.citizenedu@gov.in",
    description: "Public adult education, vocational outreach, and educational aid processing.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "org_004",
    name: "Document Services",
    code: "DS",
    department: "Education Department",
    head: "Vikash Kumar",
    email: "director.docs@gov.in",
    description: "Educational credential authentication, diploma archives, and certificate verification.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "org_005",
    name: "Student Support Services",
    code: "SSS",
    department: "Education Department",
    head: "Rohan Mehta",
    email: "director.support@gov.in",
    description: "Student grievance cells, accommodation subsidies, and welfare services.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Healthcare Department
  {
    id: "org_006",
    name: "Health Services",
    code: "HS",
    department: "Healthcare Department",
    head: "Rakesh Kumar",
    email: "director.healthservices@gov.in",
    description: "District hospital coordination, emergency medical camps, and healthcare supplies.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "org_007",
    name: "Health Data Services",
    code: "HDS",
    department: "Healthcare Department",
    head: "Pooja Verma",
    email: "director.healthdata@gov.in",
    description: "Electronic health records (EHR), hospital digitization, and epidemiological monitoring.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Citizen Services Department
  {
    id: "org_008",
    name: "Citizen Support Services",
    code: "CSS",
    department: "Citizen Services Department",
    head: "Anjali Gupta",
    email: "director.citizensupport@gov.in",
    description: "Centralized citizen helpdesk, grievance management, and civic helpline operations.",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

export const SEED_TEAMS = [
  // Scholarship Services
  {
    id: "team_001",
    name: "Scholarship Verification Team",
    code: "SVT-001",
    department: "Education Department",
    organization: "Scholarship Services",
    supervisor: "Aarav Sharma",
    baseOfficers: 6,
    tags: ["scholarship", "education", "verification", "document"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team_002",
    name: "Application Processing Team",
    code: "APT-002",
    department: "Education Department",
    organization: "Scholarship Services",
    supervisor: "Priya Verma",
    baseOfficers: 5,
    tags: ["application", "processing", "education", "student"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team_003",
    name: "Scholarship Processing Team",
    code: "SPT-003",
    department: "Education Department",
    organization: "Scholarship Services",
    supervisor: "Priya Verma",
    baseOfficers: 5,
    tags: ["scholarship", "processing", "disbursement"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Digital Education
  {
    id: "team_004",
    name: "Digital Platform Team",
    code: "DPT-004",
    department: "Education Department",
    organization: "Digital Education",
    supervisor: "Rahul Singh",
    baseOfficers: 8,
    tags: ["digital", "platform", "education", "infrastructure"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team_005",
    name: "Digital Records Team",
    code: "DRT-005",
    department: "Education Department",
    organization: "Digital Education",
    supervisor: "Rahul Singh",
    baseOfficers: 6,
    tags: ["digital", "records", "data"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team_006",
    name: "Data Verification Team",
    code: "DVT-006",
    department: "Education Department",
    organization: "Digital Education",
    supervisor: "Neha Gupta",
    baseOfficers: 5,
    tags: ["data", "verification", "quality"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Document Services
  {
    id: "team_007",
    name: "Document Verification Team",
    code: "DOC-007",
    department: "Education Department",
    organization: "Document Services",
    supervisor: "Vikash Kumar",
    baseOfficers: 5,
    tags: ["document", "citizen", "verification", "clearance"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team_008",
    name: "Document Processing Team",
    code: "DPT-008",
    department: "Education Department",
    organization: "Document Services",
    supervisor: "Vikash Kumar",
    baseOfficers: 5,
    tags: ["document", "processing"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Citizen Education Services
  {
    id: "team_009",
    name: "Citizen Service Team",
    code: "CST-009",
    department: "Education Department",
    organization: "Citizen Education Services",
    supervisor: "Anjali Gupta",
    baseOfficers: 5,
    tags: ["citizen", "education", "service"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Student Support Services
  {
    id: "team_010",
    name: "Student Support Team",
    code: "SST-010",
    department: "Education Department",
    organization: "Student Support Services",
    supervisor: "Rohan Mehta",
    baseOfficers: 5,
    tags: ["student", "support", "welfare"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Healthcare Department
  {
    id: "team_011",
    name: "Health Application Team",
    code: "HAT-011",
    department: "Healthcare Department",
    organization: "Health Services",
    supervisor: "Rakesh Kumar",
    baseOfficers: 7,
    tags: ["health", "healthcare", "application", "hospital"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team_012",
    name: "Medical Records Team",
    code: "MRT-012",
    department: "Healthcare Department",
    organization: "Health Data Services",
    supervisor: "Pooja Verma",
    baseOfficers: 6,
    tags: ["medical", "record", "digitization", "healthcare"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  // Citizen Services Department
  {
    id: "team_013",
    name: "Citizen Support Team",
    code: "SUP-013",
    department: "Citizen Services Department",
    organization: "Citizen Support Services",
    supervisor: "Anjali Gupta",
    baseOfficers: 6,
    tags: ["citizen", "support", "service", "public"],
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

export const SEED_EMPLOYEES = [
  {
    id: "emp_001",
    name: "Aarav Sharma",
    employeeId: "GOV-E001",
    email: "aarav.sharma@gov.in",
    role: "Senior Officer",
    department: "Education Department",
    organization: "Scholarship Services",
    team: "Scholarship Verification Team",
    reportingTo: "Dr. Ramesh Verma",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_002",
    name: "Priya Verma",
    employeeId: "GOV-E002",
    email: "priya.verma@gov.in",
    role: "Program Officer",
    department: "Education Department",
    organization: "Scholarship Services",
    team: "Scholarship Verification Team",
    reportingTo: "Aarav Sharma",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_003",
    name: "Rohan Mehta",
    employeeId: "GOV-E003",
    email: "rohan.mehta@gov.in",
    role: "Operations Officer",
    department: "Education Department",
    organization: "Scholarship Services",
    team: "Scholarship Verification Team",
    reportingTo: "Aarav Sharma",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_004",
    name: "Rahul Singh",
    employeeId: "GOV-E004",
    email: "rahul.singh@gov.in",
    role: "Technical Officer",
    department: "Education Department",
    organization: "Digital Education",
    team: "Digital Platform Team",
    reportingTo: "Dr. Ramesh Verma",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_005",
    name: "Neha Gupta",
    employeeId: "GOV-E005",
    email: "neha.gupta@gov.in",
    role: "Service Officer",
    department: "Education Department",
    organization: "Digital Education",
    team: "Data Verification Team",
    reportingTo: "Rahul Singh",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_006",
    name: "Vikash Kumar",
    employeeId: "GOV-E006",
    email: "vikash.kumar@gov.in",
    role: "Documentation Officer",
    department: "Education Department",
    organization: "Document Services",
    team: "Document Verification Team",
    reportingTo: "Dr. Ramesh Verma",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_007",
    name: "Anjali Gupta",
    employeeId: "GOV-E007",
    email: "anjali.gupta@gov.in",
    role: "Support Officer",
    department: "Citizen Services Department",
    organization: "Citizen Support Services",
    team: "Citizen Support Team",
    reportingTo: "Ms. Kavita Rao",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_008",
    name: "Rakesh Kumar",
    employeeId: "GOV-E008",
    email: "rakesh.kumar@gov.in",
    role: "Health Officer",
    department: "Healthcare Department",
    organization: "Health Services",
    team: "Health Application Team",
    reportingTo: "Dr. Sanjay Mehta",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_009",
    name: "Pooja Verma",
    employeeId: "GOV-E009",
    email: "pooja.verma@gov.in",
    role: "Medical Records Officer",
    department: "Healthcare Department",
    organization: "Health Data Services",
    team: "Medical Records Team",
    reportingTo: "Dr. Sanjay Mehta",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp_010",
    name: "Suresh Patel",
    employeeId: "GOV-E010",
    email: "suresh.patel@gov.in",
    role: "Education Officer",
    department: "Education Department",
    organization: "Digital Education",
    team: "Digital Records Team",
    reportingTo: "Rahul Singh",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

// =====================================================
// STORAGE UTILITIES
// =====================================================

const readLS = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeLS = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

const genId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const notify = () => {
  window.dispatchEvent(new Event("governscale-data-updated"));
};

// =====================================================
// SEEDING
// =====================================================

export const ensureHierarchySeeded = () => {
  if (localStorage.getItem(KEYS.seeded)) return;

  if (!readLS(KEYS.departments)) writeLS(KEYS.departments, SEED_DEPARTMENTS);
  if (!readLS(KEYS.organizations)) writeLS(KEYS.organizations, SEED_ORGANIZATIONS);
  if (!readLS(KEYS.teams)) writeLS(KEYS.teams, SEED_TEAMS);
  if (!readLS(KEYS.employees)) writeLS(KEYS.employees, SEED_EMPLOYEES);

  localStorage.setItem(KEYS.seeded, "true");
};

// Auto-seed on module import
ensureHierarchySeeded();

// =====================================================
// 1. DEPARTMENT CRUD
// =====================================================

export const getDepartments = () => {
  ensureHierarchySeeded();
  return readLS(KEYS.departments) || [];
};

export const getDepartmentById = (id) =>
  getDepartments().find((d) => d.id === id);

export const getDepartmentByName = (name) =>
  getDepartments().find(
    (d) => d.name.toLowerCase() === String(name || "").trim().toLowerCase()
  );

export const createDepartment = (data) => {
  const departments = getDepartments();
  const entry = {
    id: genId("dept"),
    name: String(data.name || "").trim(),
    code: String(data.code || "").toUpperCase().trim() || "DEPT",
    head: String(data.head || "").trim() || "Unassigned",
    email: String(data.email || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeLS(KEYS.departments, [...departments, entry]);
  notify();
  return entry;
};

export const updateDepartment = (id, updates) => {
  const departments = getDepartments().map((d) =>
    d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
  );
  writeLS(KEYS.departments, departments);
  notify();
  return departments.find((d) => d.id === id);
};

export const deleteDepartment = (id) => {
  const dept = getDepartmentById(id);
  if (!dept) return false;
  writeLS(
    KEYS.departments,
    getDepartments().filter((d) => d.id !== id)
  );
  notify();
  return true;
};

// =====================================================
// 2. ORGANIZATION CRUD
// =====================================================

export const getOrganizations = () => {
  ensureHierarchySeeded();
  return readLS(KEYS.organizations) || [];
};

export const getOrganizationById = (id) =>
  getOrganizations().find((o) => o.id === id);

export const getOrganizationsByDepartment = (departmentName) => {
  const norm = String(departmentName || "").trim().toLowerCase();
  return getOrganizations().filter(
    (o) => o.department.trim().toLowerCase() === norm
  );
};

export const getOrganizationByName = (name) =>
  getOrganizations().find(
    (o) => o.name.toLowerCase() === String(name || "").trim().toLowerCase()
  );

export const createOrganization = (data) => {
  const organizations = getOrganizations();
  const entry = {
    id: genId("org"),
    name: String(data.name || "").trim(),
    code: String(data.code || "").toUpperCase().trim() || "ORG",
    department: String(data.department || "").trim(),
    head: String(data.head || "").trim() || "Unassigned",
    email: String(data.email || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeLS(KEYS.organizations, [...organizations, entry]);
  notify();
  return entry;
};

export const updateOrganization = (id, updates) => {
  const organizations = getOrganizations().map((o) =>
    o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
  );
  writeLS(KEYS.organizations, organizations);
  notify();
  return organizations.find((o) => o.id === id);
};

export const deleteOrganization = (id) => {
  writeLS(
    KEYS.organizations,
    getOrganizations().filter((o) => o.id !== id)
  );
  notify();
  return true;
};

// =====================================================
// 3. TEAM CRUD
// =====================================================

export const getTeams = () => {
  ensureHierarchySeeded();
  return readLS(KEYS.teams) || [];
};

export const getTeamById = (id) =>
  getTeams().find((t) => t.id === id);

export const getTeamsByOrganization = (orgName) => {
  const norm = String(orgName || "").trim().toLowerCase();
  return getTeams().filter(
    (t) => t.organization.trim().toLowerCase() === norm
  );
};

export const getTeamsByDepartment = (deptName) => {
  const norm = String(deptName || "").trim().toLowerCase();
  return getTeams().filter(
    (t) => t.department.trim().toLowerCase() === norm
  );
};

export const getTeamByName = (name) =>
  getTeams().find(
    (t) => t.name.toLowerCase() === String(name || "").trim().toLowerCase()
  );

export const createTeam = (data) => {
  const teams = getTeams();
  const entry = {
    id: genId("team"),
    name: String(data.name || "").trim(),
    code: String(data.code || "").toUpperCase().trim() || "TEAM",
    department: String(data.department || "").trim(),
    organization: String(data.organization || "").trim(),
    supervisor: String(data.supervisor || "").trim() || "Team Supervisor",
    baseOfficers: Number(data.baseOfficers) || 6,
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: data.status || "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeLS(KEYS.teams, [...teams, entry]);
  notify();
  return entry;
};

export const updateTeam = (id, updates) => {
  const teams = getTeams().map((t) =>
    t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
  );
  writeLS(KEYS.teams, teams);
  notify();
  return teams.find((t) => t.id === id);
};

export const deleteTeam = (id) => {
  writeLS(
    KEYS.teams,
    getTeams().filter((t) => t.id !== id)
  );
  notify();
  return true;
};

// =====================================================
// 4. EMPLOYEE CRUD
// =====================================================

export const getEmployees = () => {
  ensureHierarchySeeded();
  return readLS(KEYS.employees) || [];
};

export const getEmployeeById = (id) =>
  getEmployees().find((e) => e.id === id);

export const getEmployeesByTeam = (teamName) => {
  const norm = String(teamName || "").trim().toLowerCase();
  return getEmployees().filter(
    (e) => (e.team || "").trim().toLowerCase() === norm
  );
};

export const getEmployeesByOrganization = (orgName) => {
  const norm = String(orgName || "").trim().toLowerCase();
  return getEmployees().filter(
    (e) => (e.organization || "").trim().toLowerCase() === norm
  );
};

export const getEmployeesByDepartment = (deptName) => {
  const norm = String(deptName || "").trim().toLowerCase();
  return getEmployees().filter(
    (e) => (e.department || "").trim().toLowerCase() === norm
  );
};

export const createEmployee = (data) => {
  const employees = getEmployees();
  const nextNum = employees.length + 1;
  const entry = {
    id: genId("emp"),
    name: String(data.name || "").trim(),
    employeeId: String(data.employeeId || "").trim() || `GOV-E${String(nextNum).padStart(3, "0")}`,
    email: String(data.email || "").trim() || `${String(data.name || "").toLowerCase().replace(/\s+/g, ".")}@gov.in`,
    role: String(data.role || "").trim() || "Officer",
    department: String(data.department || "").trim(),
    organization: String(data.organization || "").trim(),
    team: String(data.team || "").trim(),
    reportingTo: String(data.reportingTo || "").trim() || "Supervisor",
    status: data.status || "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeLS(KEYS.employees, [...employees, entry]);
  notify();
  return entry;
};

export const updateEmployee = (id, updates) => {
  const employees = getEmployees().map((e) =>
    e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
  );
  writeLS(KEYS.employees, employees);
  notify();
  return employees.find((e) => e.id === id);
};

export const deleteEmployee = (id) => {
  writeLS(
    KEYS.employees,
    getEmployees().filter((e) => e.id !== id)
  );
  notify();
  return true;
};

// =====================================================
// CONVENIENCE MAPPINGS & DROPDOWN LISTS
// =====================================================

export const getDeptOrgMap = () => {
  const orgs = getOrganizations();
  const map = {};
  orgs.forEach((o) => {
    const dept = (o.department || "").trim().toLowerCase();
    if (!map[dept]) map[dept] = [];
    map[dept].push((o.name || "").trim().toLowerCase());
  });
  return map;
};

export const getDepartmentNames = () =>
  getDepartments().map((d) => d.name);

export const getOrganizationNames = () =>
  getOrganizations().map((o) => o.name);

export const getTeamNames = () =>
  getTeams().map((t) => t.name);

export const clearHierarchyData = () => {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
};

export const resetHierarchyData = () => {
  clearHierarchyData();
  ensureHierarchySeeded();
  notify();
};
