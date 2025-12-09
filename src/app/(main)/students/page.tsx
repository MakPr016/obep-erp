"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import CsvUploadModal from "./csv-upload-modal"
import AddStudentModal from "./add-student-modal"
import EditStudentModal from "./edit-student-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function StudentPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

  const [branches, setBranches] = useState<any[]>([])
  const [schemes, setSchemes] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedScheme, setSelectedScheme] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  useEffect(() => {
    fetchSchemes()
  }, [])

  useEffect(() => {
    if (selectedScheme && selectedScheme !== "all") {
      fetchBranches()
    } else {
      setBranches([])
    }
    setSelectedBranch("")
    setSelectedClass("")
    setClasses([])
  }, [selectedScheme])

  useEffect(() => {
    if (selectedBranch && selectedBranch !== "all") {
      fetchClasses()
    } else {
      setClasses([])
      setSelectedClass("")
    }
  }, [selectedBranch])

  useEffect(() => {
    fetchStudents()
  }, [page, selectedClass])

  const fetchBranches = async () => {
    setLoadingBranches(true)
    try {
      const params = new URLSearchParams()
      if (selectedScheme && selectedScheme !== "all") params.append("schemeId", selectedScheme)
      const res = await fetch(`/api/branches?${params.toString()}`)
      const json = await res.json()
      setBranches(json.branches || [])
    } catch {
      setBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }

  const fetchSchemes = async () => {
    setLoadingSchemes(true)
    try {
      const res = await fetch("/api/schemes")
      const json = await res.json()
      setSchemes(json.schemes || [])
    } catch {
      setSchemes([])
    } finally {
      setLoadingSchemes(false)
    }
  }

  const fetchClasses = async () => {
    setLoadingClasses(true)
    try {
      const params = new URLSearchParams()
      if (selectedBranch) params.append("branchid", selectedBranch)
      if (selectedScheme) params.append("schemeid", selectedScheme)
      const res = await fetch(`/api/classes?${params.toString()}`)
      const json = await res.json()
      setClasses(json.classes || [])
    } catch {
      setClasses([])
    } finally {
      setLoadingClasses(false)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (selectedClass && selectedClass !== "all") params.append("classid", selectedClass)
      const res = await fetch(`/api/students?${params.toString()}`)
      const json = await res.json()
      setStudents(Array.isArray(json.students) ? json.students : [])
      setTotalPages(json.pagination?.totalpages || 1)
      setSelectedStudentIds([])
    } catch {
      setStudents([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    fetchStudents()
    toast.success("Students uploaded successfully")
  }

  const handleAddSuccess = () => {
    setShowAddModal(false)
    fetchStudents()
    toast.success("Student added successfully")
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setSelectedStudent(null)
    fetchStudents()
    toast.success("Student updated successfully")
  }

  const openEditModal = (student: any) => {
    setSelectedStudent(student)
    setShowEditModal(true)
  }

  const openDeactivateDialog = (student: any) => {
    setSelectedStudent(student)
    setShowDeactivateDialog(true)
  }

  const handleDeactivate = async () => {
    if (!selectedStudent) return
    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("Student deactivated successfully")
        fetchStudents()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to deactivate student")
      }
    } catch {
      toast.error("Failed to deactivate student")
    } finally {
      setShowDeactivateDialog(false)
      setSelectedStudent(null)
    }
  }

  const handleActivate = async (student: any) => {
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true })
      })
      if (res.ok) {
        toast.success("Student activated successfully")
        fetchStudents()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to activate student")
      }
    } catch {
      toast.error("Failed to activate student")
    }
  }

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length && students.length > 0) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(students.map(s => s.id))
    }
  }

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id))
    } else {
      setSelectedStudentIds([...selectedStudentIds, id])
    }
  }

  const handleBulkAction = async (action: "activate" | "deactivate") => {
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          action
        })
      })
      if (res.ok) {
        toast.success(`Students ${action}d successfully`)
        fetchStudents()
        setSelectedStudentIds([])
      } else {
        toast.error(`Failed to ${action} students`)
      }
    } catch {
      toast.error(`Failed to ${action} students`)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <div className="flex gap-2">
          {selectedStudentIds.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleBulkAction("activate")}>Activate Selected</Button>
              <Button variant="destructive" onClick={() => handleBulkAction("deactivate")}>Deactivate Selected</Button>
            </>
          )}
          <Button variant="outline" onClick={() => setShowAddModal(true)}>Add Student</Button>
          <Button onClick={() => setShowUploadModal(true)}>Upload CSV</Button>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        <Select value={selectedScheme} onValueChange={setSelectedScheme} disabled={loadingSchemes}>
          <SelectTrigger className="w-[200px]">
            {loadingSchemes ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select Scheme" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schemes</SelectItem>
            {schemes.map(scheme => (
              <SelectItem key={scheme.id} value={scheme.id}>{scheme.name} ({scheme.year})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={!selectedScheme || selectedScheme === "all" || loadingBranches}>
          <SelectTrigger className="w-[200px]">
            {loadingBranches ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select Branch" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(branch => (
              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedBranch || selectedBranch === "all" || loadingClasses}>
          <SelectTrigger className="w-[200px]">
            {loadingClasses ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select Class" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>
                Sem {cls.semester} {cls.section} ({cls.academic_year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={students.length > 0 && selectedStudentIds.length === students.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>USN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => toggleSelectStudent(student.id)}
                      />
                    </TableCell>
                    <TableCell>{student.usn}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      {student.class
                        ? `${student.class.academic_year} Sem ${student.class.semester} ${student.class.section}`
                        : "-"}
                    </TableCell>
                    <TableCell>{student.is_active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(student)}>Edit</Button>
                      {student.is_active ? (
                        <Button size="sm" variant="destructive" onClick={() => openDeactivateDialog(student)}>Deactivate</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleActivate(student)}>Activate</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <div>Page {page} of {totalPages}</div>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </>
      )}

      <CsvUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
      {selectedStudent && (
        <EditStudentModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          student={selectedStudent}
        />
      )}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to deactivate student "{selectedStudent?.name}"?</p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
