"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AttainmentChart } from "@/components/reports/attainment-charts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function CourseReportPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Note: This fetches from the API route we created earlier
                const res = await fetch(`/api/reports/course/${id}`)
                const json = await res.json()
                if (res.ok) {
                    setData(json)
                } else {
                    toast.error(json.error || "Failed to load report")
                }
            } catch (error) {
                toast.error("Failed to load report")
            } finally {
                setLoading(false)
            }
        }
        if (id) {
            fetchData()
        }
    }, [id])

    if (loading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!data) return <div className="p-6 text-center">No data found</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Attainment Report</h1>
                        <p className="text-muted-foreground">
                            {data.course?.course_name} ({data.course?.course_code}) - {data.class?.academic_year}
                        </p>
                    </div>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
            </div>

            <AttainmentChart coData={data.co_attainment} poData={data.po_attainment} />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>CO Attainment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>CO</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.co_attainment?.map((co: any) => (
                                    <TableRow key={co.co_id}>
                                        <TableCell className="font-medium">{co.co_number}</TableCell>
                                        <TableCell>{co.attainment_level}</TableCell>
                                        <TableCell>
                                            {co.attainment_level >= (data.course?.set_target_percentage || 0.6) * 3 ?
                                                <span className="text-green-600 font-bold">Attained</span> :
                                                <span className="text-red-500">Not Attained</span>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>PO Attainment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO</TableHead>
                                    <TableHead>Calculated Level</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.po_attainment?.map((po: any) => (
                                    <TableRow key={po.program_outcome_id}>
                                        <TableCell className="font-medium" title={po.description}>{po.po_number}</TableCell>
                                        <TableCell>{po.calculated_attainment}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}