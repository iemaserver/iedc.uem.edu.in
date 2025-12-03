"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell, Legend } from "recharts";
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
  public: {
    label: "Public",
    color: "hsl(160, 84%, 39%)",
  },
  private: {
    label: "Private",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig;

export function StatusGraph({ 
  data, 
  title = "Visibility Distribution", 
  description = "Certifications by visibility status" 
}: StatusGraphProps) {
  const chartData = useMemo(() => {
    const visibilityCount = {
      public: 0,
      private: 0,
    };

    data.forEach((item) => {
      if (item.isPublic) {
        visibilityCount.public++;
      } else {
        visibilityCount.private++;
      }
    });

    return [
      {
        status: "public",
        count: visibilityCount.public,
        fill: "var(--color-public)",
      },
      {
        status: "private",
        count: visibilityCount.private,
        fill: "var(--color-private)",
      },
    ].filter(item => item.count > 0);
  }, [data]);

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col bg-gradient-to-br from-green-50/50 via-white to-blue-50/50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20 border-green-200/50 dark:border-green-800/30">
      <CardHeader className="items-center pb-2 space-y-1">
        <CardTitle className="text-lg md:text-xl text-center">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm text-center">
          {description} • Total: {totalCount}
        </CardDescription>
      </CardHeader>
      <CardContent className=" p-2">
        {totalCount === 0 ? (
          <div className="flex items-center justify-center h-[200px] sm:h-[250px] lg:h-[160px] text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
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
        )}
      </CardContent>
      <CardFooter className="">
        <div className="flex w-full items-center justify-center text-xs sm:text-sm text-muted-foreground">
          Click on a status to see details
        </div>
      </CardFooter>
    </Card>
  );
}
