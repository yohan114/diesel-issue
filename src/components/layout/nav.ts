import {
  LayoutDashboard,
  Truck,
  Fuel,
  ClipboardList,
  Gauge,
  BarChart3,
  Users,
  Banknote,
  DatabaseBackup,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  mobile?: boolean; // shown in the mobile bottom bar
};

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/fleet", label: "Fleet", icon: Truck, mobile: true },
  { href: "/fuel/issues", label: "Fuel Issues", icon: Fuel, mobile: true },
  { href: "/fuel/requests", label: "Requests", icon: ClipboardList, mobile: true },
  { href: "/readings", label: "Readings", icon: Gauge },
  { href: "/reports", label: "Reports", icon: BarChart3, mobile: true },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/admin/prices", label: "Fuel Prices", icon: Banknote, adminOnly: true },
  { href: "/admin/backups", label: "Backups", icon: DatabaseBackup, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];
