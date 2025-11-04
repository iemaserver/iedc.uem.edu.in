export const CHART_COLORS = {
  primary: "#0ea5e9",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  muted: "#6b7280",
  accent: "#f97316",
  emerald: "#059669",
  violet: "#7c3aed",
  rose: "#e11d48",
  amber: "#d97706",
  teal: "#0d9488",
  indigo: "#4f46e5",
};

export const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  CHART_COLORS.accent,
  CHART_COLORS.emerald,
  CHART_COLORS.violet,
  CHART_COLORS.rose,
  CHART_COLORS.amber,
  CHART_COLORS.teal,
  CHART_COLORS.indigo,
];

export const STATUS_COLORS = {
  uploaded: CHART_COLORS.info,
  under_review: CHART_COLORS.warning,
  accepted: CHART_COLORS.success,
  rejected: CHART_COLORS.danger,
  ongoing: CHART_COLORS.primary,
  completed: CHART_COLORS.secondary,
  approved: CHART_COLORS.success,
  pending: CHART_COLORS.warning,
};

export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || CHART_COLORS.muted;
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'accepted':
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'under_review':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ongoing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'uploaded':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};