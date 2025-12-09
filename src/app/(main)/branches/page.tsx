"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import AddBranchModal from "./add-branch-modal"
import EditBranchModal from "./edit-branch-modal"

export default function BranchesPage() {
    const [branches, setBranches] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
    const [selectedBranch, setSelectedBranch] = useState<any>(null)

    const [departments, setDepartments] = useState<any[]>([])
    const [schemes, setSchemes] = useState<any[]>([])
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
    const [selectedScheme, setSelectedScheme] = useState<string>("all")

    useEffect(() => {
        fetchDepartments()
        fetchSchemes()
    }, [])

    useEffect(() => {
        fetchBranches()
    }, [selectedDepartment, selectedScheme])

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments")
            const data = await res.json()
            setDepartments(data.departments || [])
        } catch {
            toast.error("Failed to load departments")
        }
    }

    const fetchSchemes = async () => {
        try {
            const res = await fetch("/api/schemes")
            const data = await res.json()
            setSchemes(data.schemes || [])
        } catch {
            toast.error("Failed to load schemes")
        }
    }

    const fetchBranches = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedDepartment && selectedDepartment !== "all") params.append("departmentId", selectedDepartment)
            if (selectedScheme && selectedScheme !== "all") params.append("schemeId", selectedScheme)

            const res = await fetch(`/api/branches?${params.toString()}`)
            const json = await res.json()
            setBranches(json.branches || [])
        } catch {
            toast.error("Failed to load branches")
            setBranches([])
        } finally {
            setLoading(false)
        }
    }

    const openDeleteDialog = (id: string) => {
        setSelectedBranchId(id)
        setShowDeleteDialog(true)
    }

    const openEditModal = (branch: any) => {
        setSelectedBranch(branch)
        setShowEditModal(true)
    }

    const handleDelete = async () => {
        if (!selectedBranchId) return
        try {
            const res = await fetch(`/api/branches/${selectedBranchId}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Branch deleted successfully")
                fetchBranches()
            } else {
                const errorData = await res.json()
                toast.error(errorData.error || "Failed to delete branch")
            }
        } catch {
            toast.error("Failed to delete branch")
        } finally {
            setShowDeleteDialog(false)
            setSelectedBranchId(null)
        }
    }

    const handleAddSuccess = () => {
        fetchBranches()
        toast.success("Branch added successfully")
    }

    const handleEditSuccess = () => {
        fetchBranches()
        toast.success("Branch updated successfully")
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Branches</h1>
                <Button onClick={() => setShowAddModal(true)}>Add Branch</Button>
            </div>

            <div className="flex gap-4 mb-6">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedScheme} onValueChange={setSelectedScheme}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filter by Scheme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Schemes</SelectItem>
                        {schemes.map((scheme) => (
                            <SelectItem key={scheme.id} value={scheme.id}>
                                {scheme.name} ({scheme.year})
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
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Scheme</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        No branches found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">{branch.name}</TableCell>
                                        <TableCell>{branch.code}</TableCell>
                                        <TableCell>{branch.department?.name || "-"}</TableCell>
                                        <TableCell>
                                            {branch.scheme ? `${branch.scheme.name} (${branch.scheme.year})` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(branch)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(branch.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <AddBranchModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddSuccess}
            />

            {selectedBranch && (
                <EditBranchModal
                    open={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditSuccess}
                    branch={selectedBranch}
                />
            )}

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this branch? This action cannot be undone.</p>
                    <DialogFooter className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
