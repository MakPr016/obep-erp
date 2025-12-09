"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const formSchema = z.object({
  cos: z.array(z.object({
    text: z.string().min(10)
  })).min(1)
})

type FormValues = z.infer<typeof formSchema>

interface ProgramOutcome {
  id: string
  po_number: string
  description: string
}

interface POMapping {
  po_id: string // UUID of program outcome
  po_number: string // for display
  score: number
  strength: number
}

interface BloomPrediction {
  predicted_level: string
  confidence: number
  all_scores: Record<string, number>
  description: string
}

interface COEditable {
  co_text: string
  mappings: POMapping[]
  bloom_prediction: BloomPrediction
}

type MapPageProps = {
  courseId: string
  initialCOs?: any[]
  programOutcomes: ProgramOutcome[]
}

export default function MapPage({ courseId, initialCOs, programOutcomes }: MapPageProps) {
  const [results, setResults] = useState<COEditable[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { cos: [{ text: '' }] }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cos"
  })

  useEffect(() => {
    if (initialCOs && programOutcomes) {
      form.reset({
        cos: initialCOs.map((co: any) => ({ text: co.description })),
      })
      setResults(initialCOs.map((co: any) => ({
        co_text: co.description,
        bloom_prediction: {
          predicted_level: co.blooms_level || "CL1",
          confidence: 1,
          all_scores: {},
          description: ""
        },
        mappings: programOutcomes.map(po => {
          const m = co.co_po_mappings?.find((x: any) => x.program_outcome?.id === po.id)
          return {
            po_id: po.id,
            po_number: po.po_number,
            strength: m?.mapping_strength ?? 0,
            score: m?.mapping_strength ? m.mapping_strength / 3 : 0,
          }
        })
      })))
    }
  }, [initialCOs, programOutcomes, form])

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    setResults(null)
    try {
      const co_texts = values.cos.map(co => co.text)
      const response = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ co_texts })
      })
      if (!response.ok) throw new Error("Failed to map COs")
      const data = await response.json()
      console.log(data);
      setResults(data.results.map((r: any) => ({
        co_text: r.co_text,
        bloom_prediction: r.bloom_prediction || { predicted_level: "Remember", confidence: 1, all_scores: {}, description: "" },
        mappings: programOutcomes.map(po => {
          const m = r.mappings.find((x: any) => x.po_id === po.po_number)
          return {
            po_id: po.id,
            po_number: po.po_number,
            score: m?.score ?? 0,
            strength: m?.strength ?? 0
          }
        })
      })))
    } catch (e) {
      toast.success("Mapping failed")
    }
    setIsLoading(false)
  }

  const onMappingEdit = (coIdx: number, poIdx: number, field: "strength" | "score", value: string) => {
    if (!results) return
    setResults(r =>
      r!.map((co, i) =>
        i === coIdx ? {
          ...co,
          mappings: co.mappings.map((pm, j) =>
            j === poIdx ? { ...pm, [field]: field === "strength" ? parseInt(value) : parseFloat(value) } : pm
          )
        } : co
      )
    )
  }

  const colorStrength = (strength: number) =>
    strength === 3 ? "text-green-600 font-bold"
      : strength === 2 ? "text-blue-600 font-bold"
        : strength === 1 ? "text-yellow-600 font-bold"
          : "text-gray-500 font-bold"

  const colorScore = (score: number) =>
    score >= 0.7 ? "text-green-600 font-semibold"
      : score >= 0.5 ? "text-blue-600 font-semibold"
        : score >= 0.3 ? "text-yellow-600"
          : "text-gray-500"

  const bloomColors: Record<string, string> = {
    CL1: "bg-gray-500",
    CL2: "bg-blue-500",
    CL3: "bg-green-500",
    CL4: "bg-yellow-500",
    CL5: "bg-orange-500",
    CL6: "bg-purple-500",
  }

  const onSave = async () => {
    setIsLoading(true)
    const res = await fetch(`/api/courses/${courseId}/cos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    })
    if (res.ok) {
      setIsSaved(true)
      toast.success("COs and mappings saved!")
      router.push(`/courses/${courseId}`)
    } else {
      toast.error("Failed to save COs and mappings")
    }
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Course Outcomes</CardTitle>
          <CardDescription>
            Add one or more Course Outcomes to analyze and save their PO mapping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`cos.${idx}.text`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`CO ${idx + 1}...`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => append({ text: "" })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another CO
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Calculate Mappings
                </Button>
                {results && (
                  <Button type="button" variant="default" onClick={onSave} disabled={isLoading}>
                    Save
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>CO-PO Mapping (Editable)</CardTitle>
            <CardDescription>
              Edit both the <span className="font-semibold">strength</span> (0-3) and <span className="font-semibold">score</span> (0-1) for each cell. Press Save to persist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO</TableHead>
                    <TableHead>Bloom&apos;s</TableHead>
                    {programOutcomes.map(po => (
                      <TableHead key={po.id} className="text-center">{po.po_number}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((co, coIdx) => (
                    <TableRow key={coIdx}>
                      <TableCell className="font-medium max-w-[120px] truncate" title={co.co_text}>
                        CO{coIdx + 1}: {co.co_text.slice(0, 24)}{co.co_text.length > 24 ? "..." : ""}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${bloomColors[co.bloom_prediction.predicted_level] || "bg-gray-500"} text-white`}>
                          {co.bloom_prediction.predicted_level}
                        </Badge>
                      </TableCell>
                      {co.mappings.map((m, poIdx) => (
                        <TableCell key={m.po_id} className="p-1 px-2 align-middle text-center">
                          <input
                            type="number"
                            min={0}
                            max={3}
                            className={`w-10 rounded border py-0.5 px-1 text-center text-sm ${colorStrength(m.strength)}`}
                            value={m.strength}
                            onChange={e => onMappingEdit(coIdx, poIdx, "strength", e.target.value)}
                            style={{ marginBottom: 2 }}
                          />
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            className={`w-14 mt-1 rounded border text-xs text-center ${colorScore(m.score)}`}
                            value={m.score.toFixed(2)}
                            onChange={e => onMappingEdit(coIdx, poIdx, "score", e.target.value)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex flex-wrap gap-5 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-green-600 inline-block" />
                3 = High, ≥0.7
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-600 inline-block" />
                2 = Medium, ≥0.5
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-yellow-600 inline-block" />
                1 = Low, ≥0.3
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-gray-500 inline-block" />
                0 = Very Low, &lt;0.3
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
