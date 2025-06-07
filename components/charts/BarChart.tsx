"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey: string;
  title: string;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function CustomBarChart({ 
  data, 
  dataKey, 
  title, 
  color = "#82ca9d", 
  height = 200,
  formatValue = (value) => value.toString()
}: BarChartProps) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            fontSize={12}
            className="text-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={60}
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
          <Bar 
            dataKey={dataKey} 
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}