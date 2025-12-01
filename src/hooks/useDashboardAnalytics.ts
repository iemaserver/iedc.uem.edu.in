"use client";

import { useMemo } from "react";

interface AnalyticsResult {
  total: number;
  approved: number;
  underReview: number;
  draft: number;
  rejected: number;
  published: number;
  chartData: Array<{ name: string; value: number }>;
  getWeeklyData: (statusFilter?: string) => Array<{ value: number }>;
  calculateTrend: (currentValue: number, days?: number) => { value: number; isPositive: boolean };
}

export function useDashboardAnalytics(data: any[], dateField: string = "createdAt"): AnalyticsResult {
  return useMemo(() => {
    const now = new Date();
    
    // Count by status
    const total = data.length;
    const approved = data.filter((item) => item.status === "APPROVED").length;
    const underReview = data.filter((item) => item.status === "UNDER_REVIEW").length;
    const draft = data.filter((item) => item.status === "DRAFT").length;
    const rejected = data.filter((item) => item.status === "REJECTED").length;
    const published = data.filter((item) => item.status === "PUBLISHED").length;

    // Calculate monthly growth data
    const monthlyData:any[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const count = data.filter((item) => {
        const itemDate = new Date(item[dateField] || item.createdAt);
        return itemDate >= date && itemDate < nextMonth;
      }).length;
      
      monthlyData.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        value: count,
      });
    }
    
    // Calculate cumulative data for growth chart
    const chartData = monthlyData.map((month, index) => ({
      name: month.name,
      value: monthlyData.slice(0, index + 1).reduce((sum, m) => sum + m.value, 0),
    }));

    // Get weekly data for mini charts
    const getWeeklyData = (statusFilter?: string) => {
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const count = data.filter((item) => {
          if (statusFilter && item.status !== statusFilter) return false;
          const itemDate = new Date(item[dateField] || item.createdAt);
          return itemDate >= weekStart && itemDate < weekEnd;
        }).length;
        
        weeklyData.push({ value: count });
      }
      return weeklyData;
    };

    // Calculate trend
    const calculateTrend = (currentValue: number, days: number = 30) => {
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - days);
      const previousStart = new Date(periodStart);
      previousStart.setDate(periodStart.getDate() - days);
      
      const currentCount = data.filter((item) => {
        const itemDate = new Date(item[dateField] || item.createdAt);
        return itemDate >= periodStart && itemDate <= now;
      }).length;
      
      const previousCount = data.filter((item) => {
        const itemDate = new Date(item[dateField] || item.createdAt);
        return itemDate >= previousStart && itemDate < periodStart;
      }).length;
      
      if (previousCount === 0) return { value: currentCount > 0 ? 100 : 0, isPositive: currentCount > 0 };
      const change = ((currentCount - previousCount) / previousCount) * 100;
      return { value: Math.abs(Math.round(change * 10) / 10), isPositive: change >= 0 };
    };

    return {
      total,
      approved,
      underReview,
      draft,
      rejected,
      published,
      chartData,
      getWeeklyData,
      calculateTrend,
    };
  }, [data, dateField]);
}
