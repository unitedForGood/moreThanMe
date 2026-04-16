export type AdminRole = "super" | "finance" | "events" | "media" | null;

export function getAdminRoleLabels(role: AdminRole | AdminRole[]): string {
  const roles = Array.isArray(role) ? role : [role];
  const activeRoles = roles.filter((r): r is Exclude<AdminRole, null> => !!r);
  
  if (activeRoles.length === 0) return "Admin";
  if (activeRoles.includes("super")) return "Super Admin";
  
  return activeRoles.map(r => {
    switch (r) {
      case "finance":
        return "Finance";
      case "events":
        return "Events";
      case "media":
        return "Media";
      default:
        return "Admin";
    }
  }).join(", ");
}

/** @deprecated Use getAdminRoleLabels instead */
export function getAdminRoleLabel(role: AdminRole): string {
  return getAdminRoleLabels(role);
}

export function canAccessAdminHref(role: AdminRole | AdminRole[], href: string): boolean {
  if (href === "/admin") return true;


  const roles = Array.isArray(role) ? role : [role];
  if (roles.includes("super")) return true;

  return roles.some(r => {
    switch (r) {
      case "finance":
        return href.startsWith("/admin/donate") || href.startsWith("/admin/transparency");
      case "events":
        return href.startsWith("/admin/works");
      case "media":
        return (
          href.startsWith("/admin/assets") ||
          href.startsWith("/admin/newsletters")
        );
      default:
        return false;
    }
  });
}

