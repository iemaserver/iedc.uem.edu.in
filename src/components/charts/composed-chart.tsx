import { ResponsiveContainer, ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "./chart-colors";

interface DataPoint {
  [key: string]: any;
}

interface ChartElement {
  type: 'line' | 'bar' | 'area';
  dataKey: string;
  name: string;
  color?: string;
  yAxisId?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  stackId?: string;
}

interface CustomComposedChartProps {
  data: DataPoint[];
  xAxisKey: string;
  elements: ChartElement[];
  width?: string | number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  xAxisFormatter?: (value: any) => string;
  tooltipLabelFormatter?: (value: any) => string;
  leftYAxisLabel?: string;
  rightYAxisLabel?: string;
}

export function CustomComposedChart({
  data,
  xAxisKey,
  elements,
  width = "100%",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  xAxisFormatter,
  tooltipLabelFormatter,
  leftYAxisLabel,
  rightYAxisLabel,
}: CustomComposedChartProps) {
  const hasRightAxis = elements.some(el => el.yAxisId === 'right');

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <ComposedChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey}
            tickFormatter={xAxisFormatter}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left" 
            label={leftYAxisLabel ? { value: leftYAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          {hasRightAxis && (
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={rightYAxisLabel ? { value: rightYAxisLabel, angle: 90, position: 'insideRight' } : undefined}
            />
          )}
          {showTooltip && (
            <Tooltip 
              labelFormatter={tooltipLabelFormatter}
            />
          )}
          {showLegend && <Legend />}
          
          {elements.map((element, index) => {
            const color = element.color || CHART_COLORS.primary;
            const yAxisId = element.yAxisId || 'left';

            switch (element.type) {
              case 'area':
                return (
                  <Area
                    key={element.dataKey}
                    type="monotone"
                    dataKey={element.dataKey}
                    name={element.name}
                    stackId={element.stackId}
                    stroke={color}
                    fill={color}
                    fillOpacity={element.fillOpacity || 0.6}
                    strokeWidth={element.strokeWidth || 2}
                    yAxisId={yAxisId}
                  />
                );
              case 'line':
                return (
                  <Line
                    key={element.dataKey}
                    type="monotone"
                    dataKey={element.dataKey}
                    name={element.name}
                    stroke={color}
                    strokeWidth={element.strokeWidth || 2}
                    dot={{ fill: color, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    yAxisId={yAxisId}
                  />
                );
              case 'bar':
                return (
                  <Bar
                    key={element.dataKey}
                    dataKey={element.dataKey}
                    name={element.name}
                    fill={color}
                    stackId={element.stackId}
                    yAxisId={yAxisId}
                  />
                );
              default:
                return null;
            }
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}