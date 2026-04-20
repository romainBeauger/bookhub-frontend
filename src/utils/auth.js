export function getUserRoles(user) {
    if (Array.isArray(user?.roles)) {
        return user.roles;
    }

    if (Array.isArray(user?.role)) {
        return user.role;
    }

    if (typeof user?.role === "string") {
        return [user.role];
    }

    return [];
}

export function hasRole(user, role) {
    return getUserRoles(user).includes(role);
}

export function hasStaffAccess(user) {
    return hasRole(user, "ROLE_LIBRARIAN") || hasRole(user, "ROLE_ADMIN");
}
