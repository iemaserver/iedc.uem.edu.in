/**
 * Utility functions for calculating dashboard analytics from API data
 */

export interface TimeSeriesData {
  name: string;
  value: number;
  date: Date;
}

export interface AnalyticsData {
  total: number;
  approved: number;
  underReview: number;
  draft: number;
  rejected: number;
  published: number;
  monthlyData: TimeSeriesData[];
  weeklyData: Array<{ value: number }>;
}

/**
 * Calculate analytics from data array
 */
export function calculateAnalytics(data: any[]): AnalyticsData {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  // Count by status
  const total = data.length;
  const approved = data.filter((item) => item.status === "APPROVED").length;
  const underReview = data.filter((item) => item.status === "UNDER_REVIEW").length;
  const draft = data.filter((item) => item.status === "DRAFT").length;
  const rejected = data.filter((item) => item.status === "REJECTED").length;
  const published = data.filter((item) => item.status === "PUBLISHED").length;
  
  // Group by month for the last 6 months
  const monthlyMap = new Map<string, number>();
  
  // Initialize all months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyMap.set(key, 0);
  }
  
  // Count items per month
  data.forEach((item) => {
    const createdAt = new Date(item.createdAt || item.filedAt || item.startDate);
    if (createdAt >= sixMonthsAgo) {
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
    }
  });
  
  // Convert to array with cumulative counts
  const monthlyData: TimeSeriesData[] = [];
  let cumulative = 0;
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    cumulative += monthlyMap.get(key) || 0;
    
    monthlyData.push({
      name: date.toLocaleDateString('en-US', { month: 'short' }),
      value: cumulative,
      date: date,
    });
  }
  
  // Calculate weekly data for mini charts (last 7 weeks)
  const weeklyData: Array<{ value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const count = data.filter((item) => {
      const createdAt = new Date(item.createdAt || item.filedAt || item.startDate);
      return createdAt >= weekStart && createdAt < weekEnd;
    }).length;
    
    weeklyData.push({ value: count });
  }
  
  return {
    total,
    approved,
    underReview,
    draft,
    rejected,
    published,
    monthlyData,
    weeklyData,
  };
}

/**
 * Calculate trend percentage compared to previous period
 */
export function calculateTrend(currentData: any[], previousPeriodDays: number = 30): {
  value: number;
  isPositive: boolean;
} {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - previousPeriodDays);
  const previousPeriodStart = new Date(periodStart);
  previousPeriodStart.setDate(periodStart.getDate() - previousPeriodDays);
  
  const currentCount = currentData.filter((item) => {
    const createdAt = new Date(item.createdAt || item.filedAt || item.startDate);
    return createdAt >= periodStart && createdAt <= now;
  }).length;
  
  const previousCount = currentData.filter((item) => {
    const createdAt = new Date(item.createdAt || item.filedAt || item.startDate);
    return createdAt >= previousPeriodStart && createdAt < periodStart;
  }).length;
  
  if (previousCount === 0) {
    return { value: currentCount > 0 ? 100 : 0, isPositive: currentCount > 0 };
  }
  
  const percentageChange = ((currentCount - previousCount) / previousCount) * 100;
  
  return {
    value: Math.abs(Math.round(percentageChange * 10) / 10),
    isPositive: percentageChange >= 0,
  };
}

/**
 * Calculate total amount for transactions or grants
 */
export function calculateTotalAmount(data: any[], amountField: string = 'amount'): number {
  return data.reduce((sum, item) => sum + (Number(item[amountField]) || 0), 0);
}

/**
 * Calculate average for a numeric field
 */
export function calculateAverage(data: any[], field: string): number {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  return Math.round((sum / data.length) * 10) / 10;
}
