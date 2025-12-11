"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Edit3, Upload } from "lucide-react"
import FacultyUploadModal from "@/components/faculty/faculty-upload-modal"

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null)
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "" })

  useEffect(() => {
    fetchFaculty()
  }, [])

  const fetchFaculty = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/faculty")
      const json = await res.json()
      setFaculty(json.faculty || [])
    } catch {
      setFaculty([])
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setFormData({ full_name: "", email: "", password: "" })
    setShowAddDialog(true)
  }

  const openEditDialog = (facultyMember: any) => {
    setSelectedFaculty(facultyMember)
    setFormData({ full_name: facultyMember.full_name, email: facultyMember.email, password: "" })
    setShowEditDialog(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddFaculty = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error("All fields are required")
      return
    }
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Faculty created")
        setShowAddDialog(false)
        fetchFaculty()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to add faculty")
      }
    } catch {
      toast.error("Failed to add faculty")
    }
  }

  const handleEditFaculty = async () => {
    if (!selectedFaculty) return
    if (!formData.full_name || !formData.email) {
      toast.error("Name and email are required")
      return
    }
    try {
      const res = await fetch(`/api/faculty/${selectedFaculty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Faculty updated")
        setShowEditDialog(false)
        fetchFaculty()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update faculty")
      }
    } catch {
      toast.error("Failed to update faculty")
    }
  }

  const handleDeleteFaculty = async (id: string) => {
    try {
      const res = await fetch(`/api/faculty/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("Faculty deleted")
        fetchFaculty()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete faculty")
      }
    } catch {
      toast.error("Failed to delete faculty")
    }
  }

  if (loading) return <Skeleton className="h-40 w-full" />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Faculty Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={openAddDialog}>Add Faculty</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {faculty.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500">
                No faculty found
              </TableCell>
            </TableRow>
          ) : (
            faculty.map((fac) => (
              <TableRow key={fac.id}>
                <TableCell>{fac.full_name}</TableCell>
                <TableCell>{fac.email}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(fac)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteFaculty(fac.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={formData.full_name}
              onChange={e => handleInputChange("full_name", e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => handleInputChange("email", e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e => handleInputChange("password", e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddFaculty}>Add Faculty</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={formData.full_name}
              onChange={e => handleInputChange("full_name", e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => handleInputChange("email", e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditFaculty}>Update Faculty</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacultyUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          fetchFaculty()
          setShowUploadModal(false)
        }}
      />
    </div>
  )
}
