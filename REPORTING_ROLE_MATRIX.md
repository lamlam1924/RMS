# Reporting Role Matrix

This document defines dashboard/report ownership and data scope by role.

## Core Principle

- Every role has a dashboard.
- Not every role should see enterprise-level recruitment reports.
- Enterprise recruitment reporting has two levels:
  - `HR_MANAGER`: operational owner (full recruitment KPI set).
  - `DIRECTOR`: strategic read-only visibility.

## Matrix

| Role | Dashboard Focus | Data Scope | Global Recruitment Report |
|---|---|---|---|
| ADMIN | System governance | System-wide user/role/department/config | No |
| DIRECTOR | Strategic recruitment decisions | Enterprise read-only | Yes |
| HR_MANAGER | Recruitment operations | Enterprise operational | Yes |
| HR_STAFF | Daily execution | Assigned work only | No |
| DEPARTMENT_MANAGER | Department hiring | Department-only | No |
| EMPLOYEE | Interview tasks | Self/interviewer | No |
| CANDIDATE | Application journey | Self | No |

## Standard Endpoints by Scope

- HR Manager reporting:
  - `GET /api/hr/statistics/dashboard`
  - `GET /api/hr/statistics/funnel`
- Director reporting (read-only proxy):
  - `GET /api/director/statistics/overview`
  - `GET /api/director/statistics/funnel`
- Department manager dashboard:
  - `GET /api/dept-manager/dashboard/stats`

## Notes

- Do not expose HR reporting endpoints directly to non-HR roles.
- Keep Director report endpoints read-only and scoped to strategic views.
- Keep Department Manager metrics sourced from department-scoped backend logic.
