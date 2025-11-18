"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import AddClassModal from "./add-class-modal"

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [branches, setBranches] = useState<any[]>([])

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

  const handleAddSuccess = () => {
    setShowAddModal(false)
    fetchClasses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this class?")) return
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" })
      if (res.ok) fetchClasses()
    } catch {}
  }

  if (loading) {
    return <Skeleton className="h-40 w-full" />
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        <Button onClick={() => setShowAddModal(true)}>Add Class</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Total Students</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                No classes found
              </TableCell>
            </TableRow>
          ) : (
            classes.map(cls => (
              <TableRow key={cls.id}>
                <TableCell>{cls.branch?.name || "-"}</TableCell>
                <TableCell>{cls.semester}</TableCell>
                <TableCell>{cls.section}</TableCell>
                <TableCell>{cls.academic_year}</TableCell>
                <TableCell>{cls.total_students}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(cls.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AddClassModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        branches={branches}
      />
    </div>
  )
}
