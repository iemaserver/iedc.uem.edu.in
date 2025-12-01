"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
} from "@/components/ui/chart";

interface GrowthGraphProps {
  data: any[];
  title?: string;
  description?: string;
  monthsToShow?: number;
}

const chartConfig = {
  count: {
    label: "Research Papers",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig;

export function GrowthGraph({ 
  data, 
  title = "Research Papers Growth", 
  description = "Monthly cumulative growth of research papers",
  monthsToShow = 6 
}: GrowthGraphProps) {
  const { chartData, trend } = useMemo(() => {
    const now = new Date();
    const monthlyData: { month: string; count: number; cumulative: number }[] = [];
    
    // Generate data for the last N months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const count = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= date && itemDate < nextMonth;
      }).length;
      
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        count: count,
        cumulative: 0,
      });
    }
    
    // Calculate cumulative count
    let cumulative = 0;
    monthlyData.forEach((month) => {
      cumulative += month.count;
      month.cumulative = cumulative;
    });

    // Calculate trend
    const lastMonth = monthlyData[monthlyData.length - 1]?.count || 0;
    const previousMonth = monthlyData[monthlyData.length - 2]?.count || 0;
    
    let trendValue = 0;
    let isPositive = true;
    
    if (previousMonth > 0) {
      trendValue = ((lastMonth - previousMonth) / previousMonth) * 100;
      isPositive = trendValue >= 0;
    } else if (lastMonth > 0) {
      trendValue = 100;
      isPositive = true;
    }

    return {
      chartData: monthlyData,
      trend: {
        value: Math.abs(Math.round(trendValue * 10) / 10),
        isPositive,
      },
    };
  }, [data, monthsToShow]);

  const totalPapers = chartData[chartData.length - 1]?.cumulative || 0;

  return (
    <Card className="flex flex-col bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <ChartContainer config={chartConfig} className="w-full h-[200px] sm:h-[250px] lg:h-[160px]">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -20,
              right: 5,
              top: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              width={25}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                labelFormatter={(value) => `${value}`}
                formatter={(value, name) => [
                  <span key={name} className="font-medium">{value}</span>,
                  name === "cumulative" ? "Total Papers" : "New This Month"
                ]}
              />}
            />
            <Area
              dataKey="cumulative"
              type="monotone"
              fill="var(--color-count)"
              fillOpacity={0.4}
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-start gap-2 text-xs sm:text-sm">
          <div className="grid gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 leading-none font-medium flex-wrap">
              {trend.isPositive ? (
                <>
                  Trending up by {trend.value}% this month 
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </>
              ) : (
                <>
                  Trending down by {trend.value}% this month 
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total: {totalPapers} research papers
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
