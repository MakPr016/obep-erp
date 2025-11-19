// src/components/assessments/question-part-builder.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubQuestion {
  label: string;
  marks: number;
  bloomsLevel: string;
  courseOutcomeId: string;
}

interface QuestionPart {
  partNumber: number;
  question1Number: number;
  question2Number: number;
  subQuestions: SubQuestion[];
}

interface Props {
  questionParts: QuestionPart[];
  setQuestionParts: (parts: QuestionPart[]) => void;
  courseOutcomes: Array<{ id: string; co_number: string }>;
}

export default function QuestionPartBuilder({ questionParts, setQuestionParts, courseOutcomes }: Props) {
  const addNewPart = () => {
    const partNumber = questionParts.length + 1;
    const newPart: QuestionPart = {
      partNumber,
      question1Number: (partNumber * 2) - 1,
      question2Number: partNumber * 2,
      subQuestions: []
    };
    setQuestionParts([...questionParts, newPart]);
  };

  const removePart = (partIndex: number) => {
    const updatedParts = questionParts.filter((_, idx) => idx !== partIndex);
    // Renumber parts
    updatedParts.forEach((part, idx) => {
      part.partNumber = idx + 1;
      part.question1Number = ((idx + 1) * 2) - 1;
      part.question2Number = (idx + 1) * 2;
    });
    setQuestionParts(updatedParts);
  };

  const addSubQuestion = (partIndex: number) => {
    const updatedParts = [...questionParts];
    const currentPart = updatedParts[partIndex];
    const subQuestionLabel = String.fromCharCode(97 + currentPart.subQuestions.length); // a, b, c...

    const newSubQuestion: SubQuestion = {
      label: subQuestionLabel,
      marks: 0,
      bloomsLevel: '',
      courseOutcomeId: ''
    };

    currentPart.subQuestions.push(newSubQuestion);
    setQuestionParts(updatedParts);
  };

  const updateSubQuestion = (
    partIndex: number,
    subIndex: number,
    field: keyof SubQuestion,
    value: string | number
  ) => {
    const updatedParts = [...questionParts];
    const subQuestion = updatedParts[partIndex].subQuestions[subIndex];
    if (field === 'marks') {
      subQuestion.marks = value as number;
    } else {
      (subQuestion[field] as string) = value as string;
    }
    setQuestionParts(updatedParts);
  };

  const removeSubQuestion = (partIndex: number, subIndex: number) => {
    const updatedParts = [...questionParts];
    updatedParts[partIndex].subQuestions = updatedParts[partIndex].subQuestions.filter(
      (_, idx) => idx !== subIndex
    );
    // Re-label remaining sub-questions
    updatedParts[partIndex].subQuestions.forEach((subQ, idx) => {
      subQ.label = String.fromCharCode(97 + idx);
    });
    setQuestionParts(updatedParts);
  };

  const getTotalMarks = (part: QuestionPart) => {
    return part.subQuestions.reduce((sum, subQ) => sum + subQ.marks, 0);
  };

  return (
    <div className="space-y-6">
      {questionParts.map((part, partIndex) => (
        <Card key={partIndex}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Part {part.partNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant="outline" className="mr-2">
                  Question {part.question1Number}
                </Badge>
                OR
                <Badge variant="outline" className="ml-2">
                  Question {part.question2Number}
                </Badge>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Total: {getTotalMarks(part)} marks
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removePart(partIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {part.subQuestions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sub-Q</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Bloom's Level</TableHead>
                    <TableHead>Course Outcome</TableHead>
                    <TableHead className="w-16">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {part.subQuestions.map((subQ, subIndex) => (
                    <TableRow key={subIndex}>
                      <TableCell className="font-medium">
                        ({subQ.label})
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={subQ.marks}
                          onChange={(e) => updateSubQuestion(partIndex, subIndex, 'marks', Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={subQ.bloomsLevel}
                          onValueChange={(value) => updateSubQuestion(partIndex, subIndex, 'bloomsLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CL1">CL1 - Remember</SelectItem>
                            <SelectItem value="CL2">CL2 - Understand</SelectItem>
                            <SelectItem value="CL3">CL3 - Apply</SelectItem>
                            <SelectItem value="CL4">CL4 - Analyze</SelectItem>
                            <SelectItem value="CL5">CL5 - Evaluate</SelectItem>
                            <SelectItem value="CL6">CL6 - Create</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={subQ.courseOutcomeId}
                          onValueChange={(value) => updateSubQuestion(partIndex, subIndex, 'courseOutcomeId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CO" />
                          </SelectTrigger>
                          <SelectContent>
                            {courseOutcomes.map((co) => (
                              <SelectItem key={co.id} value={co.id}>
                                {co.co_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubQuestion(partIndex, subIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No sub-questions added yet
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => addSubQuestion(partIndex)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sub-Question
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button onClick={addNewPart}>
        <Plus className="h-4 w-4 mr-2" />
        Add New Part
      </Button>
    </div>
  );
}
