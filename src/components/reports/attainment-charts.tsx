"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AttainmentChartProps {
    coData?: any[]
    poData?: any[]
}

export function AttainmentChart({ coData, poData }: AttainmentChartProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Course Outcome (CO) Attainment</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={coData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="co_number" />
                            <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} label={{ value: 'Level', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Bar dataKey="attainment_level" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                {coData?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.attainment_level >= 2 ? '#22c55e' : entry.attainment_level >= 1 ? '#eab308' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Program Outcome (PO) Attainment</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={poData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="po_number" />
                            <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                            <Tooltip />
                            <Bar dataKey="calculated_attainment" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                {poData?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.calculated_attainment >= 2 ? '#22c55e' : entry.calculated_attainment >= 1 ? '#eab308' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}