import {
  IconDashboard,
  IconPaperclip,
  IconUsers,
  IconTallymark2,
  IconFileUpload,
  IconFileCertificate,
  IconTournament,
  IconFileText,
  IconUserSearch,
  IconBook2,
  IconCoin,
  IconUsersGroup,
  IconUser,
  IconAward,
  IconFile,
  IconFiles,
  IconBriefcase,
  IconTrophy,
  IconGraphOff,
  IconBell,
  IconSettings,
  IconMessage,
  IconLogout,
} from "@tabler/icons-react";

import {
  LayoutDashboard,
  User as LucideUser,
  Search,
  Settings as LucideSettings,
  Bell,
  Trophy,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";

// Define a type for a single dashboard item
type DashboardItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: DashboardSubItem[];
};

// Define a type for a sub-item
type DashboardSubItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
};

// Define a type for a dashboard group
export type DashboardGroup = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  access: ("ADMIN" | "TEACHER" | "STUDENT")[];
  isOpen?: boolean;
  items: (DashboardItem | DashboardSubItem)[];
};

export const DashboardItems: DashboardGroup[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    access: ["ADMIN", "TEACHER", "STUDENT"],
    isOpen: true,
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: LucideUser,
      },
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
      },
      {
        title: "Messages",
        url: "/dashboard/messages",
        icon: IconMessage,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: IconGraphOff,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: LucideSettings,
      },
      {
        title: "Logout",
        url: "/logout",
        icon: IconLogout,
      },
    ],
  },

  // Student Specific Routes
  {
    title: "My Work",
    url: "#",
    icon: IconBook2,
    access: ["STUDENT", "ADMIN"],
    items: [
      {
        title: "My Research Papers",
        url: "/dashboard/my-papers",
        icon: IconPaperclip,
      },
      {
        title: "My Ongoing Projects",
        url: "/dashboard/my-projects",
        icon: IconFiles,
      },
      {
        title: "Upload New Paper",
        url: "/dashboard/paper/upload",
        icon: IconFileUpload,
      },
      {
        title: "Upload New Project",
        url: "/dashboard/project/upload",
        icon: IconFileUpload,
      },
      {
        title: "My Achievements",
        url: "/dashboard/my-achievements",
        icon: IconAward,
      },
      {
        title: "My Competitions",
        url: "/dashboard/my-competitions",
        icon: IconTrophy,
      },
    ],
  },

  // Teacher Specific Routes
  {
    title: "Teacher Panel",
    url: "#",
    icon: IconBriefcase,
    access: ["TEACHER", "ADMIN"],
    items: [
      {
        title: "My Research Works",
        url: "/dashboard/teacher/research",
        icon: IconFile,
      },
      {
        title: "Advised Papers",
        url: "/dashboard/teacher/papers",
        icon: IconPaperclip,
      },
      {
        title: "Advised Projects",
        url: "/dashboard/teacher/projects",
        icon: IconFiles,
      },
      {
        title: "Upload Research Work",
        url: "/dashboard/teacher/research/upload",
        icon: IconFileUpload,
      },
      {
        title: "Student Search",
        url: "/dashboard/teacher/students",
        icon: IconUserSearch,
      },
      {
        title: "Approvals",
        url: "/dashboard/teacher/approvals",
        icon: ShieldCheck,
      },
    ],
  },

  // Admin Specific Routes
  {
    title: "Admin Panel",
    url: "#",
    icon: IconTallymark2,
    access: ["ADMIN"],
    items: [
      {
        title: "System Stats",
        url: "/dashboard/admin/stats",
        icon: IconTallymark2,
      },
      {
        title: "Manage Users",
        url: "/dashboard/admin/users",
        icon: IconUsersGroup,
      },
      {
        title: "Manage Achievements",
        url: "/dashboard/admin/achievements",
        icon: IconAward,
      },
      {
        title: "Manage Competitions",
        url: "/dashboard/admin/competitions",
        icon: IconTournament,
      },
      {
        title: "All Research Works",
        url: "/dashboard/admin/research-works",
        icon: IconFileText,
      },
      {
        title: "All Projects",
        url: "/dashboard/admin/projects",
        icon: FolderOpen,
      },
      {
        title: "Payments",
        url: "/dashboard/admin/payments",
        icon: IconCoin,
      },
      {
        title: "System Settings",
        url: "/dashboard/admin/settings",
        icon: IconSettings,
      },
    ],
  },
];
