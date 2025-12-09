"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { BarChart3, Loader2, Eye } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const res = await fetch('/api/course-assignments')
            const json = await res.json()
            setAssignments(Array.isArray(json.data) ? json.data : [])
        } catch {
            toast.error("Failed to load assignments")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="text-muted-foreground">
                    Generate and view CO-PO attainment reports
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Course Attainment Reports
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Course Code</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Semester</TableHead>
                                <TableHead>Section</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No courses found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assignments.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell>{assignment.courses?.course_name}</TableCell>
                                        <TableCell>{assignment.courses?.course_code}</TableCell>
                                        <TableCell>{assignment.classes?.branches?.name}</TableCell>
                                        <TableCell>{assignment.classes?.semester}</TableCell>
                                        <TableCell>{assignment.classes?.section}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => router.push(`/reports/course/${assignment.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> View Report
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}