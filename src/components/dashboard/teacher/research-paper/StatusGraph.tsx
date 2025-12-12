"use client";

import { useMemo } from "react";
import { Pie, PieChart, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";

interface StatusGraphProps {
  data: any[];
  title?: string;
  description?: string;
}

const chartConfig = {
  count: {
    label: "Count",
  },
  DRAFT: {
    label: "Draft",
    color: "rgb(4, 54, 74)",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "rgb(23, 107, 135)",
  },
  APPROVED: {
    label: "Approved",
    color: "rgb(100, 204, 197)",
  },
  PUBLISHED: {
    label: "Published",
    color: "rgb(23, 107, 135)",
  },
  REJECTED: {
    label: "Rejected",
    color: "rgb(4, 54, 74)",
  },
} satisfies ChartConfig;

export function StatusGraph({ 
  data, 
  title = "Status Distribution", 
  description = "Research papers by status" 
}: StatusGraphProps) {
  const chartData = useMemo(() => {
    const statusCount = {
      DRAFT: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      REJECTED: 0,
    };

    data.forEach((item) => {
      if (item.status && statusCount.hasOwnProperty(item.status)) {
        statusCount[item.status as keyof typeof statusCount]++;
      }
    });

    return [
      {
        status: "DRAFT",
        count: statusCount.DRAFT,
        fill: "var(--color-DRAFT)",
      },
      {
        status: "UNDER_REVIEW",
        count: statusCount.UNDER_REVIEW,
        fill: "var(--color-UNDER_REVIEW)",
      },
      {
        status: "APPROVED",
        count: statusCount.APPROVED,
        fill: "var(--color-APPROVED)",
      },
      {
        status: "PUBLISHED",
        count: statusCount.PUBLISHED,
        fill: "var(--color-PUBLISHED)",
      },
      {
        status: "REJECTED",
        count: statusCount.REJECTED,
        fill: "var(--color-REJECTED)",
      },
    ].filter(item => item.count > 0);
  }, [data]);

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col bg-gradient-to-br from-green-50/50 via-white to-teal-50/50">
          <CardHeader className="items-center pb-2 space-y-1">
            <CardTitle className="text-lg md:text-xl text-center text-[var(--first-color)]">{title}</CardTitle>
            <CardDescription className="text-xs md:text-sm text-center text-[var(--first-color)]/70">
              {description} • Total: {totalCount}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <ChartContainer
              config={chartConfig}
              className="w-full h-[200px] sm:h-[250px] lg:h-[160px]"
            >
              <PieChart width={300} height={300}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius="30%"
                  outerRadius="100%"
                  strokeWidth={5}
                  label={(entry) => entry.count}
                  labelLine={false}
                  cx="50%"
                  cy="50%"
                />
                <Legend
                  content={<ChartLegendContent nameKey="status" />}
                  className="-translate-y-2 flex-wrap gap-1 sm:gap-2 text-xs [&>*]:basis-1/3 sm:[&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="">
            <div className="flex w-full items-center justify-center text-xs sm:text-sm text-muted-foreground">
              Click on a status to see details
            </div>
          </CardFooter>
        </Card>
  );
}
