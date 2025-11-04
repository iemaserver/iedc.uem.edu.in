export { CustomPieChart, CustomDonutChart } from './pie-chart';
export { CustomBarChart, CustomStackedBarChart } from './bar-chart';
export { CustomLineChart } from './line-chart';
export { CustomAreaChart, CustomStackedAreaChart } from './custom-area-chart';
export { CustomComposedChart } from './composed-chart';
export { CHART_COLORS, PIE_COLORS, STATUS_COLORS, getStatusColor, getStatusBadgeClass } from './chart-colors';

// Common chart configurations
export const DEFAULT_CHART_HEIGHT = 300;
export const DEFAULT_PIE_OUTER_RADIUS = 80;
export const DEFAULT_DONUT_INNER_RADIUS = 40;

// Common formatters
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatMonth = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number) => {
  return value.toLocaleString();
};

// Chart themes
export const lightTheme = {
  background: '#ffffff',
  gridColor: '#f3f4f6',
  textColor: '#374151',
  tooltipBackground: '#ffffff',
  tooltipBorder: '#d1d5db',
};

export const darkTheme = {
  background: '#1f2937',
  gridColor: '#374151',
  textColor: '#f9fafb',
  tooltipBackground: '#374151',
  tooltipBorder: '#6b7280',
};