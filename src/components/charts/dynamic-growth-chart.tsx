"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"

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

interface ChartData {
  month: string;
  [key: string]: any;
}

interface GrowthData {
  chartData: ChartData[];
  title: string;
  description: string;
  userType: string;
}

export function DynamicGrowthChart() {
  const { data: session } = useSession();
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrowthData = async () => {
      if (!session?.user?.email) return;
      
      try {
        setLoading(true);
        const response = await axios.get('/api/stats/monthly-growth');
        if (response.data.success) {
          setGrowthData(response.data.data);
        } else {
          setError('Failed to fetch growth data');
        }
      } catch (err) {
        setError('Error fetching growth data');
        console.error('Error fetching growth data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowthData();
  }, [session]);

  if (loading) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Fetching your growth statistics</CardDescription>
        </CardHeader>
        <CardContent className="h-44 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !growthData) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Unable to load growth statistics</CardDescription>
        </CardHeader>
        <CardContent className="h-44 flex items-center justify-center">
          <p className="text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  // Dynamic chart configuration based on user type
  const getChartConfig = (): ChartConfig => {
    switch (growthData.userType) {
      case 'STUDENT':
        return {
          papers: {
            label: "Research Papers",
            color: "hsl(var(--chart-1))",
          },
          projects: {
            label: "Ongoing Projects", 
            color: "hsl(var(--chart-2))",
          },
          total: {
            label: "Total",
            color: "hsl(var(--chart-3))",
          },
        } satisfies ChartConfig;
      
      case 'TEACHER':
        return {
          researchWorks: {
            label: "Research Works",
            color: "hsl(var(--chart-1))",
          },
        } satisfies ChartConfig;
      
      case 'ADMIN':
        return {
          students: {
            label: "Students",
            color: "hsl(var(--chart-1))",
          },
          teachers: {
            label: "Teachers",
            color: "hsl(var(--chart-2))",
          },
          total: {
            label: "Total Users",
            color: "hsl(var(--chart-3))",
          },
        } satisfies ChartConfig;
      
      default:
        return {} satisfies ChartConfig;
    }
  };

  const chartConfig = getChartConfig();

  // Render areas based on user type
  const renderAreas = () => {
    switch (growthData.userType) {
      case 'STUDENT':
        return (
          <>
            <Area
              dataKey="papers"
              type="natural"
              fill="var(--color-papers)"
              fillOpacity={0.4}
              stroke="var(--color-papers)"
              stackId="a"
            />
            <Area
              dataKey="projects"
              type="natural"
              fill="var(--color-projects)"
              fillOpacity={0.4}
              stroke="var(--color-projects)"
              stackId="a"
            />
          </>
        );
      
      case 'TEACHER':
        return (
          <Area
            dataKey="researchWorks"
            type="natural"
            fill="var(--color-researchWorks)"
            fillOpacity={0.4}
            stroke="var(--color-researchWorks)"
          />
        );
      
      case 'ADMIN':
        return (
          <>
            <Area
              dataKey="students"
              type="natural"
              fill="var(--color-students)"
              fillOpacity={0.4}
              stroke="var(--color-students)"
              stackId="a"
            />
            <Area
              dataKey="teachers"
              type="natural"
              fill="var(--color-teachers)"
              fillOpacity={0.4}
              stroke="var(--color-teachers)"
              stackId="a"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (growthData.chartData.length < 2) return 0;
    
    let currentMonthValue = 0;
    let previousMonthValue = 0;
    
    if (growthData.userType === 'STUDENT') {
      currentMonthValue = growthData.chartData[growthData.chartData.length - 1]?.total || 0;
      previousMonthValue = growthData.chartData[growthData.chartData.length - 2]?.total || 0;
    } else if (growthData.userType === 'TEACHER') {
      currentMonthValue = growthData.chartData[growthData.chartData.length - 1]?.researchWorks || 0;
      previousMonthValue = growthData.chartData[growthData.chartData.length - 2]?.researchWorks || 0;
    } else if (growthData.userType === 'ADMIN') {
      currentMonthValue = growthData.chartData[growthData.chartData.length - 1]?.total || 0;
      previousMonthValue = growthData.chartData[growthData.chartData.length - 2]?.total || 0;
    }
    
    if (previousMonthValue === 0) return currentMonthValue > 0 ? 100 : 0;
    return Math.round(((currentMonthValue - previousMonthValue) / previousMonthValue) * 100);
  };

  const growthPercentage = calculateGrowth();

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle>{growthData.title}</CardTitle>
        <CardDescription>{growthData.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-44 w-full">
          <AreaChart
            accessibilityLayer
            data={growthData.chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {renderAreas()}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {growthPercentage > 0 ? 'Trending up by' : growthPercentage < 0 ? 'Trending down by' : 'No change'} {Math.abs(growthPercentage)}% this month
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Showing data for the last 6 months
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
