import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "./chart-colors";

interface DataPoint {
  [key: string]: any;
}

interface CustomLineChartProps {
  data: DataPoint[];
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }>;
  width?: string | number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  xAxisFormatter?: (value: any) => string;
  tooltipLabelFormatter?: (value: any) => string;
}

export function CustomLineChart({
  data,
  xAxisKey,
  lines,
  width = "100%",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  xAxisFormatter,
  tooltipLabelFormatter,
}: CustomLineChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey}
            tickFormatter={xAxisFormatter}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          {showTooltip && (
            <Tooltip 
              labelFormatter={tooltipLabelFormatter}
            />
          )}
          {showLegend && <Legend />}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || CHART_COLORS.primary}
              strokeWidth={line.strokeWidth || 2}
              strokeDasharray={line.strokeDasharray}
              dot={{ fill: line.color || CHART_COLORS.primary, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}