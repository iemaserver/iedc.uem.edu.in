import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { PIE_COLORS } from "./chart-colors";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface CustomPieChartProps {
  data: DataPoint[];
  dataKey?: string;
  nameKey?: string;
  width?: string | number;
  height?: number;
  outerRadius?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  colors?: string[];
  className?: string;
}

export function CustomPieChart({
  data,
  dataKey = "value",
  nameKey = "name",
  width = "100%",
  height = 300,
  outerRadius = 80,
  innerRadius = 0,
  showLabels = true,
  showLegend = true,
  colors = PIE_COLORS,
  className,
}: CustomPieChartProps) {
  const formatLabel = ({ name, percent }: { name: string; percent?: number }) => {
    if (!showLabels || percent === undefined) return "";
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            label={showLabels ? formatLabel : undefined}
           
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value, "Count"]}
            labelFormatter={(label: string) => `${label}`}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CustomDonutChart({
  data,
  dataKey = "value",
  nameKey = "name",
  width = "100%",
  height = 300,
  outerRadius = 80,
  innerRadius = 40,
  showLabels = true,
  showLegend = true,
  colors = PIE_COLORS,
  className,
}: CustomPieChartProps) {
  return (
    <CustomPieChart
      data={data}
      dataKey={dataKey}
      nameKey={nameKey}
      width={width}
      height={height}
      outerRadius={outerRadius}
      innerRadius={innerRadius}
      showLabels={showLabels}
      showLegend={showLegend}
      colors={colors}
      className={className}
    />
  );
}