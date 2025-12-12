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
    color: "hsl(240, 5%, 65%)",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "hsl(271, 91%, 65%)",
  },
  APPROVED: {
    label: "Approved",
    color: "hsl(160, 84%, 39%)",
  },
  PUBLISHED: {
    label: "Published",
    color: "hsl(217, 91%, 60%)",
  },
  REJECTED: {
    label: "Rejected",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

export function StatusGraph({ 
  data, 
  title = "Status Distribution", 
  description = "Ongoing projects by status" 
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
    <Card className="flex flex-col bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50 dark:from-purple-950/20 dark:via-background dark:to-blue-950/20 border-purple-200/50 dark:border-purple-800/30">
      <CardHeader className="items-center pb-2 space-y-1">
        <CardTitle className="text-lg md:text-xl text-center">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm text-center">
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
              label={(entry) => entry.value}
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
