import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "./chart-colors";

interface DataPoint {
  [key: string]: any;
}

interface CustomAreaChartProps {
  data: DataPoint[];
  xAxisKey: string;
  areas: Array<{
    dataKey: string;
    name: string;
    color?: string;
    fillOpacity?: number;
    strokeWidth?: number;
    stackId?: string;
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

export function CustomAreaChart({
  data,
  xAxisKey,
  areas,
  width = "100%",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  xAxisFormatter,
  tooltipLabelFormatter,
}: CustomAreaChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={data}>
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
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stackId={area.stackId}
              stroke={area.color || CHART_COLORS.primary}
              fill={area.color || CHART_COLORS.primary}
              fillOpacity={area.fillOpacity || 0.6}
              strokeWidth={area.strokeWidth || 2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StackedAreaChartProps extends CustomAreaChartProps {
  defaultStackId?: string;
}

export function CustomStackedAreaChart({
  data,
  xAxisKey,
  areas,
  width = "100%",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  xAxisFormatter,
  tooltipLabelFormatter,
  defaultStackId = "1",
}: StackedAreaChartProps) {
  const stackedAreas = areas.map(area => ({
    ...area,
    stackId: area.stackId || defaultStackId,
  }));

  return (
    <CustomAreaChart
      data={data}
      xAxisKey={xAxisKey}
      areas={stackedAreas}
      width={width}
      height={height}
      showGrid={showGrid}
      showLegend={showLegend}
      showTooltip={showTooltip}
      className={className}
      xAxisFormatter={xAxisFormatter}
      tooltipLabelFormatter={tooltipLabelFormatter}
    />
  );
}