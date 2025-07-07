"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A pie chart showing user statistics"

interface ChartData {
  category: string;
  count: number;
  fill: string;
}

interface ChartPieLabelListProps {
  data: ChartData[];
  title?: string;
  description?: string;
  userType: "ADMIN" | "FACULTY" | "STUDENT";
}

// Define chart configuration based on user type
const getChartConfig = (userType: string): ChartConfig => {
  if (userType === "ADMIN") {
    return {
      count: {
        label: "Count",
      },
      projects: {
        label: "Ongoing Projects",
        color: "var(--chart-1)",
      },
      papers: {
        label: "Research Papers",
        color: "var(--chart-2)",
      },
      achievements: {
        label: "Achievements",
        color: "var(--chart-3)",
      },
      users: {
        label: "Total Users",
        color: "var(--chart-4)",
      },
    } satisfies ChartConfig;
  } else if (userType === "FACULTY") {
    return {
      count: {
        label: "Count",
      },
      papers: {
        label: "Research Papers",
        color: "var(--chart-1)",
      },
      projects: {
        label: "Ongoing Projects",
        color: "var(--chart-2)",
      },
    } satisfies ChartConfig;
  } else {
    return {
      count: {
        label: "Count",
      },
      projects: {
        label: "My Projects",
        color: "var(--chart-1)",
      },
      papers: {
        label: "My Papers",
        color: "var(--chart-2)",
      },
    } satisfies ChartConfig;
  }
};

export function ChartPieLabelList({ 
  data, 
  title = "Statistics Overview", 
  description = "Your activity summary",
  userType 
}: ChartPieLabelListProps) {
  const chartConfig = getChartConfig(userType);
  
  // Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie data={data} dataKey="count">
              <LabelList
                dataKey="category"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(label: React.ReactNode) => {
                  if (typeof label === "string" && label in chartConfig) {
                    return chartConfig[label as keyof typeof chartConfig]?.label;
                  }
                  return label;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total: {total} items <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {userType === "ADMIN" && "System-wide statistics"}
          {userType === "FACULTY" && "Your supervised items"}
          {userType === "STUDENT" && "Your submissions"}
        </div>
      </CardFooter>
    </Card>
  );
}
