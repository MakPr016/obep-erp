"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface FilterData {
  branches: Array<{
    id: string
    name: string
    code: string
    department_id: string
    department_name: string
    department_code: string
  }>
  semesters: Array<{ value: number; label: string }>
  courseTypes: Array<{ value: string; label: string }>
}

export function CourseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterData | null>(null)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [branchId, setBranchId] = useState(searchParams.get("branchId") || "all")
  const [semester, setSemester] = useState(searchParams.get("semester") || "all")
  const [courseType, setCourseType] = useState(searchParams.get("courseType") || "all")

  useEffect(() => {
    fetch("/api/courses/filters")
      .then((res) => res.json())
      .then((data) => setFilters(data))
      .catch((error) => console.error("Error fetching filters:", error))
  }, [])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (branchId && branchId !== "all") params.set("branchId", branchId)
    if (semester && semester !== "all") params.set("semester", semester)
    if (courseType && courseType !== "all") params.set("courseType", courseType)
    
    router.push(`/courses?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setBranchId("all")
    setSemester("all")
    setCourseType("all")
    router.push("/courses")
  }

  const hasActiveFilters = search || (branchId && branchId !== "all") || (semester && semester !== "all") || (courseType && courseType !== "all")

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Clear
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Course code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Branch</Label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger id="branch">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {filters?.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger id="semester">
              <SelectValue placeholder="All semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {filters?.semesters.map((sem) => (
                <SelectItem key={sem.value} value={sem.value.toString()}>
                  {sem.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="courseType">Course Type</Label>
          <Select value={courseType} onValueChange={setCourseType}>
            <SelectTrigger id="courseType">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {filters?.courseTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={applyFilters} className="w-full">
        Apply Filters
      </Button>
    </div>
  )
}
