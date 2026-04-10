export type AdminRole = "super" | "finance" | "events" | "media" | null;

export function getAdminRoleLabel(role: AdminRole): string {
  switch (role) {
    case "super":
      return "Super Admin";
    case "finance":
      return "Finance Admin";
    case "events":
      return "Events Admin";
    case "media":
      return "Media Admin";
    default:
      return "Admin";
  }
}

export function canAccessAdminHref(role: AdminRole, href: string): boolean {
  if (href === "/admin") return true;

  // Availability is accessible to all admin roles
  if (href.startsWith("/admin/availability")) return true;

  if (role === "super") return true;

  switch (role) {
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
}

