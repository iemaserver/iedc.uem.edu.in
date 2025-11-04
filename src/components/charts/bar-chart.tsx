import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "./chart-colors";

interface DataPoint {
  [key: string]: any;
}

interface CustomBarChartProps {
  data: DataPoint[];
  xAxisKey: string;
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  width?: string | number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  xAxisAngle?: number;
  xAxisHeight?: number;
}

export function CustomBarChart({
  data,
  xAxisKey,
  bars,
  width = "100%",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  xAxisAngle = 0,
  xAxisHeight = 60,
}: CustomBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            angle={xAxisAngle}
            textAnchor={xAxisAngle !== 0 ? "end" : "middle"}
            height={xAxisAngle !== 0 ? xAxisHeight : undefined}
          />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || CHART_COLORS.primary}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StackedBarChartProps extends CustomBarChartProps {
  stackId?: string;
}

export function CustomStackedBarChart({
  data,
  xAxisKey,
  bars,
  width = "100%",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  xAxisAngle = 0,
  xAxisHeight = 60,
  stackId = "1",
}: StackedBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            angle={xAxisAngle}
            textAnchor={xAxisAngle !== 0 ? "end" : "middle"}
            height={xAxisAngle !== 0 ? xAxisHeight : undefined}
          />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              stackId={stackId}
              fill={bar.color || CHART_COLORS.primary}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}