"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SalesData } from '@/app/actions/reportActions';

interface SalesChartProps {
  data: SalesData[];
  dataKey: 'revenue' | 'orders' | 'averageOrderValue';
  title: string;
  color?: string;
  height?: number;
}

export function SalesChart({ 
  data, 
  dataKey, 
  title, 
  color = "#8884d8", 
  height = 200 
}: SalesChartProps) {
  const formatValue = (value: number) => {
    if (dataKey === 'revenue') {
      return `ETB ${value.toFixed(0)}`;
    } else if (dataKey === 'averageOrderValue') {
      return `ETB ${value.toFixed(2)}`;
    } else {
      return value.toString();
    }
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            fontSize={12}
            className="text-muted-foreground"
          />
          <YAxis 
            fontSize={12}
            className="text-muted-foreground"
            tickFormatter={formatValue}
          />
          <Tooltip 
            formatter={(value) => [formatValue(Number(value)), title]}
            labelClassName="text-foreground"
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}