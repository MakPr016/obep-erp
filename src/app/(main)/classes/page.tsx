"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import AddClassModal from "./add-class-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export default function ClassesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  const isFaculty = session?.user?.role === "faculty"

  useEffect(() => {
    fetchClasses()
    fetchBranches()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/classes")
      const json = await res.json()
      setClasses(Array.isArray(json.classes) ? json.classes : [])
    } catch {
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches")
      const json = await res.json()
      setBranches(json.branches || [])
    } catch {
      setBranches([])
    }
  }

  const openDeleteDialog = (id: string) => {
    setSelectedClassId(id)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!selectedClassId) return
    try {
      const res = await fetch(`/api/classes/${selectedClassId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Class deleted successfully")
        fetchClasses()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to delete class")
      }
    } catch {
      toast.error("Failed to delete class")
    } finally {
      setShowDeleteDialog(false)
      setSelectedClassId(null)
    }
  }

  const handleRowClick = (id: string) => {
    router.push(`/classes/${id}`)
  }

  if (loading) {
    return <Skeleton className="h-40 w-full" />
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        {!isFaculty && <Button onClick={() => setShowAddModal(true)}>Add Class</Button>}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Total Students</TableHead>
            {!isFaculty && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isFaculty ? 5 : 6} className="text-center text-gray-500">
                No classes found
              </TableCell>
            </TableRow>
          ) : (
            classes.map(cls => (
              <TableRow key={cls.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleRowClick(cls.id)}>
                <TableCell>{cls.branch?.name || "-"}</TableCell>
                <TableCell>{cls.semester}</TableCell>
                <TableCell>{cls.section}</TableCell>
                <TableCell>{cls.academic_year}</TableCell>
                <TableCell>{cls.total_students}</TableCell>
                {!isFaculty && (
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); openDeleteDialog(cls.id) }}>
                      Delete
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AddClassModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchClasses} branches={branches} />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this class?</p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
