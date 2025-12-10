"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttainmentChartProps {
  coData?: any[];
  poData?: any[];
  targetLevel?: number;
}

export function AttainmentChart({
  coData,
  poData,
  targetLevel = 1.8,
}: AttainmentChartProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* CO Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Course Outcome (CO) Attainment</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="co_number" />
              <YAxis
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                label={{ value: "Level", angle: -90, position: "insideLeft" }}
              />
              <ReferenceLine
                y={targetLevel}
                label="Target"
                stroke="#eab308"
                strokeDasharray="5 5"
              />
              <Tooltip />
              <Bar dataKey="attainment_level" radius={[4, 4, 0, 0]}>
                {coData?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.attainment_level >= 2
                        ? "#22c55e"
                        : entry.attainment_level >= 1
                          ? "#eab308"
                          : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PO Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Program Outcome (PO) Attainment</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={poData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ponumber" />
              <YAxis domain={[0, 3]} ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} />
              <ReferenceLine
                y={targetLevel}
                label="Target"
                stroke="#eab308"
                strokeDasharray="5 5"
              />
              <Tooltip />
              <Bar dataKey="calculatedattainment" radius={[4, 4, 0, 0]}>
                {poData?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.calculatedattainment >= 2
                        ? "#22c55e"
                        : entry.calculatedattainment >= 1
                          ? "#eab308"
                          : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
