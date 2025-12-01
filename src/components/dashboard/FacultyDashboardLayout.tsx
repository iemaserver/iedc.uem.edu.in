"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { AnalyticsCard } from "./AnalyticsCard";
import { GrowthLineChart } from "./GrowthLineChart";

interface AnalyticsMetric {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chartData?: Array<{ value: number }>;
  chartType?: "area" | "bar";
}

interface FacultyDashboardLayoutProps {
  title: string;
  description?: string;
  analyticsCards: AnalyticsMetric[];
  chartData: Array<{ name: string; value: number }>;
  chartTitle: string;
  chartDescription?: string;
  filterSection: ReactNode;
  children: ReactNode;
}

export function FacultyDashboardLayout({
  title,
  description,
  analyticsCards,
  chartData,
  chartTitle,
  chartDescription,
  filterSection,
  children,
}: FacultyDashboardLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Analytics Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analyticsCards.map((card, index) => (
          <AnalyticsCard
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
            trend={card.trend}
            chartData={card.chartData}
            chartType={card.chartType}
          />
        ))}
      </div>

      {/* Growth Line Chart Section */}
      <GrowthLineChart
        title={chartTitle}
        description={chartDescription}
        data={chartData}
      />

      {/* Filter Section */}
      <div className="rounded-lg border bg-card p-4">
        {filterSection}
      </div>

      {/* Table Section */}
      <div className="rounded-lg border bg-card">
        {children}
      </div>
    </div>
  );
}
