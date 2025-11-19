'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface COAttainment {
    course_outcome_id: string;
    co_number: string;
    description?: string;
    students_attempted: number;
    students_attained: number;
    attainment_percentage: number;
    attainment_level: 0 | 1 | 2 | 3;
}

interface COAttainmentTableProps {
    attainments: COAttainment[];
    assessmentType?: string;
}

function AttainmentLevelBadge({ level }: { level: 0 | 1 | 2 | 3 }) {
    const variants = {
        0: 'destructive',
        1: 'secondary',
        2: 'default',
        3: 'default'
    } as const;

    const colors = {
        0: 'bg-red-500',
        1: 'bg-orange-500',
        2: 'bg-yellow-500',
        3: 'bg-green-500'
    };

    return (
        <Badge className={`${colors[level]} text-white`}>
            Level {level}
        </Badge>
    );
}

export default function COAttainmentTable({ attainments, assessmentType }: COAttainmentTableProps) {
    if (!attainments || attainments.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No attainment data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    CO Attainment Results {assessmentType && `- ${assessmentType}`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>CO Number</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">Attempted</TableHead>
                            <TableHead className="text-center">Attained</TableHead>
                            <TableHead className="text-center">Percentage</TableHead>
                            <TableHead className="text-center">Level</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attainments.map((co) => (
                            <TableRow key={co.course_outcome_id}>
                                <TableCell className="font-medium">{co.co_number}</TableCell>
                                <TableCell className="max-w-md truncate">{co.description || '-'}</TableCell>
                                <TableCell className="text-center">{co.students_attempted}</TableCell>
                                <TableCell className="text-center">{co.students_attained}</TableCell>
                                <TableCell className="text-center font-semibold">
                                    {co.attainment_percentage.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-center">
                                    <AttainmentLevelBadge level={co.attainment_level} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
