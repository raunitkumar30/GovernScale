export const DEMO_USERS = [
  {
    id: "gov-001",
    name: "Government Admin",
    email: "government@governscale.demo",
    password: "GovScale@2026Secure",
    level: "government",
    department: null,
    organization: null,
    team: null,
    employeeId: null,
  },
  {
    id: "dept-001",
    name: "Education Department Head",
    email: "department@governscale.demo",
    password: "GovScale@2026Secure",
    level: "department",
    department: "Education Department",
    organization: null,
    team: null,
    employeeId: null,
  },
  {
    id: "org-001",
    name: "Scholarship Services Director",
    email: "organization@governscale.demo",
    password: "GovScale@2026Secure",
    level: "organization",
    department: "Education Department",
    organization: "Scholarship Services",
    team: null,
    employeeId: null,
  },
  {
    id: "team-001",
    name: "Verification Team Supervisor",
    email: "team@governscale.demo",
    password: "GovScale@2026Secure",
    level: "team",
    department: "Education Department",
    organization: "Scholarship Services",
    team: "Scholarship Verification Team",
    employeeId: null,
  },
  {
    id: "emp-001",
    name: "Aarav Sharma (Officer)",
    email: "employee@governscale.demo",
    password: "GovScale@2026Secure",
    level: "employee",
    department: "Education Department",
    organization: "Scholarship Services",
    team: "Scholarship Verification Team",
    employeeId: "emp_001",
  },
];

export const findDemoUser = (email, password) => {
  return DEMO_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );
};