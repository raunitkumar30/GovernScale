import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Government Pages
import GovernmentDashboard from "./pages/government/GovernmentDashboard";
import MissionManagement from "./pages/government/MissionManagement";
import MissionCreation from "./pages/government/MissionCreation";
import MissionCascade from "./pages/government/MissionCascade";
import OrganizationHierarchy from "./pages/government/OrganizationHierarchy";
import DecisionSupport from "./pages/government/DecisionSupport";
import GovernmentDepartments from "./pages/government/GovernmentDepartments";
import GovernmentTeams from "./pages/government/GovernmentTeams";
import GovernmentEmployees from "./pages/government/GovernmentEmployees";
import GovernmentAnalytics from "./pages/government/GovernmentAnalytics";
import GovernmentReports from "./pages/government/GovernmentReports";
import AuditLog from "./pages/government/AuditLog";
import GovernmentSettings from "./pages/government/GovernmentSettings";

// Department Pages
import DepartmentDashboard from "./pages/department/DepartmentDashboard";
import DepartmentMissions from "./pages/department/DepartmentMissions";
import DepartmentOrganizations from "./pages/department/DepartmentOrganizations";
import DepartmentTeams from "./pages/department/DepartmentTeams";
import DepartmentEmployees from "./pages/department/DepartmentEmployees";
import DepartmentAnalytics from "./pages/department/DepartmentAnalytics";
import DepartmentReports from "./pages/department/DepartmentReports";
import DepartmentSettings from "./pages/department/DepartmentSettings";

// Organization Pages
import OrganizationDashboard from "./pages/organization/OrganizationDashboard";
import OrganizationMissions from "./pages/organization/OrganizationMissions";
import OrganizationTeams from "./pages/organization/OrganizationTeams";
import OrganizationEmployees from "./pages/organization/OrganizationEmployees";
import OrganizationAnalytics from "./pages/organization/OrganizationAnalytics";
import OrganizationReports from "./pages/organization/OrganizationReports";
import OrganizationSettings from "./pages/organization/OrganizationSettings";

// Team Pages
import TeamDashboard from "./pages/team/TeamDashboard";
import TeamMissions from "./pages/team/TeamMissions";
import TeamEmployees from "./pages/team/TeamEmployees";
import TeamAnalytics from "./pages/team/TeamAnalytics";
import TeamReports from "./pages/team/TeamReports";
import TeamSettings from "./pages/team/TeamSettings";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeMissions from "./pages/employee/EmployeeMissions";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import EmployeeReports from "./pages/employee/EmployeeReports";
import EmployeeSettings from "./pages/employee/EmployeeSettings";

const App = () => {
  return (
    <div>
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* =====================================================
            GOVERNMENT TIER (Central Super Admin)
        ====================================================== */}
        <Route
          path="/government/dashboard"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/missions"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <MissionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/missions/create"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <MissionCreation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/missions/cascade"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <MissionCascade />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/departments"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/organizations"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <OrganizationHierarchy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/teams"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/employees"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/analytics"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/decision-support"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <DecisionSupport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/reports"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/audit-log"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <AuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/settings"
          element={
            <ProtectedRoute allowedLevels={["government"]}>
              <GovernmentSettings />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            DEPARTMENT TIER
        ====================================================== */}
        <Route
          path="/department/dashboard"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/missions"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentMissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/organizations"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentOrganizations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/teams"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/employees"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/analytics"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/reports"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/settings"
          element={
            <ProtectedRoute allowedLevels={["government", "department"]}>
              <DepartmentSettings />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            ORGANIZATION TIER
        ====================================================== */}
        <Route
          path="/organization/dashboard"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/missions"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationMissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/teams"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/employees"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/analytics"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/reports"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/settings"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization"]}>
              <OrganizationSettings />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            TEAM TIER
        ====================================================== */}
        <Route
          path="/team/dashboard"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team"]}>
              <TeamDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/missions"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team"]}>
              <TeamMissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/employees"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team"]}>
              <TeamEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/analytics"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team"]}>
              <TeamAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/reports"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team"]}>
              <TeamReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/settings"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team"]}>
              <TeamSettings />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            EMPLOYEE TIER
        ====================================================== */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team", "employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/missions"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team", "employee"]}>
              <EmployeeMissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/tasks"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team", "employee"]}>
              <EmployeeTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/reports"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team", "employee"]}>
              <EmployeeReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/settings"
          element={
            <ProtectedRoute allowedLevels={["government", "department", "organization", "team", "employee"]}>
              <EmployeeSettings />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;