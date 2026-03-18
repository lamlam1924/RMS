/**
 * Defined roles matches with Database Seed Data
 */
export const ROLES = {
    // Staff Roles
    ADMIN: 'ADMIN',
    DIRECTOR: 'DIRECTOR',
    HR_MANAGER: 'HR_MANAGER',
    HR_STAFF: 'HR_STAFF',
    DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
    EMPLOYEE: 'EMPLOYEE',

    // Candidate (Future proofing)
    CANDIDATE: 'CANDIDATE'
};

/**
 * Check if user has required role
 * @param {Array<string>} userRoles List of roles user currently has
 * @param {Array<string>|string} requiredRoles Role(s) required to access
 */
export const hasRole = (userRoles, requiredRoles) => {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const userRolesUpper = userRoles.map(r => r.toUpperCase());

    if (Array.isArray(requiredRoles)) {
        return requiredRoles.some(role => userRolesUpper.includes(role.toUpperCase()));
    }

    return userRolesUpper.includes(requiredRoles.toUpperCase());
};
