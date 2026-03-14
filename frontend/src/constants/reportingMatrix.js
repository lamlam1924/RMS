import { ROLES } from './roles';

// Role-based reporting matrix used to align dashboard behavior with business scope.
export const REPORTING_MATRIX = {
  [ROLES.ADMIN]: {
    dashboard: 'system-governance',
    scope: 'system',
    canViewGlobalRecruitmentReport: false,
    kpis: ['totalUsers', 'activeUsers', 'totalRoles', 'totalDepartments', 'activeDepartments'],
  },
  [ROLES.DIRECTOR]: {
    dashboard: 'recruitment-strategy',
    scope: 'enterprise-read-only',
    canViewGlobalRecruitmentReport: true,
    kpis: ['pendingJobRequests', 'pendingOffers', 'urgentItems', 'totalPending', 'funnel', 'applications'],
    endpoints: ['/director/statistics/overview', '/director/statistics/funnel'],
  },
  [ROLES.HR_MANAGER]: {
    dashboard: 'recruitment-operations',
    scope: 'enterprise-operational',
    canViewGlobalRecruitmentReport: true,
    kpis: ['pendingJobRequests', 'totalApplications', 'screeningApplications', 'interviewingApplications', 'upcomingInterviews', 'pendingOffers', 'activeJobPostings', 'funnel'],
    endpoints: ['/hr/statistics/dashboard', '/hr/statistics/funnel'],
  },
  [ROLES.HR_STAFF]: {
    dashboard: 'execution-workbench',
    scope: 'assigned-work',
    canViewGlobalRecruitmentReport: false,
    kpis: ['assignedJobPostings', 'assignedInterviews', 'offersToSend'],
  },
  [ROLES.DEPARTMENT_MANAGER]: {
    dashboard: 'department-recruitment',
    scope: 'department-only',
    canViewGlobalRecruitmentReport: false,
    kpis: ['myJobRequests', 'pendingApproval', 'upcomingInterviews', 'activeCandidates'],
    endpoints: ['/dept-manager/dashboard/stats'],
  },
  [ROLES.EMPLOYEE]: {
    dashboard: 'interviewer-personal',
    scope: 'self',
    canViewGlobalRecruitmentReport: false,
    kpis: ['myInterviews', 'pendingFeedback'],
  },
  [ROLES.CANDIDATE]: {
    dashboard: 'candidate-portal',
    scope: 'self',
    canViewGlobalRecruitmentReport: false,
    kpis: ['myApplications', 'myOffers', 'myInterviews'],
  },
};

export function getPrimaryReportingRole(userRoles = []) {
  const priority = [
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HR_MANAGER,
    ROLES.HR_STAFF,
    ROLES.DEPARTMENT_MANAGER,
    ROLES.EMPLOYEE,
    ROLES.CANDIDATE,
  ];

  return priority.find((role) => userRoles.includes(role)) || null;
}

export function getReportingConfig(userRoles = []) {
  const primary = getPrimaryReportingRole(userRoles);
  return primary ? REPORTING_MATRIX[primary] : null;
}
