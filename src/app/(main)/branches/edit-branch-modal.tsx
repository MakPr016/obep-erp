"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface EditBranchModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    branch: any
}

export default function EditBranchModal({ open, onClose, onSuccess, branch }: EditBranchModalProps) {
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState<any[]>([])
    const [schemes, setSchemes] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        department_id: "",
        scheme_id: "",
    })

    useEffect(() => {
        if (open) {
            fetchDepartments()
            fetchSchemes()
            if (branch) {
                setFormData({
                    name: branch.name || "",
                    code: branch.code || "",
                    department_id: branch.department_id || "",
                    scheme_id: branch.scheme_id || "", // Note: Ensure your branch object has scheme_id. If it comes from the join, it might be different.
                    // The GET /api/branches route returns `scheme:schemes(...)` but might not return `scheme_id` directly if not selected.
                    // Let's check the GET route. It selects `id, name, code, scheme:schemes(...), department:departments(...)`.
                    // It does NOT select `scheme_id` or `department_id`. I should fix the GET route first or ensure I have these IDs.
                    // Actually, looking at the GET route in step 65, it selects:
                    // id, name, code, scheme:schemes(name, year), department:departments(name)
                    // It is missing department_id and scheme_id. I need to update the GET route to include these.
                })
            }
        }
    }, [open, branch])

    // Wait, I need to fix the GET route to include department_id and scheme_id first.
    // I will write this file assuming the branch object has them, and then I will update the GET route.

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch(`/api/branches/${branch.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                const error = await res.json()
                toast.error(error.error || "Failed to update branch")
            }
        } catch {
            toast.error("Failed to update branch")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Branch</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Branch Name</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Computer Science & Engineering"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-code">Branch Code</Label>
                        <Input
                            id="edit-code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g. CSE"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-department">Department</Label>
                        <Select
                            value={formData.department_id}
                            onValueChange={(val) => setFormData({ ...formData, department_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-scheme">Scheme</Label>
                        <Select
                            value={formData.scheme_id}
                            onValueChange={(val) => setFormData({ ...formData, scheme_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Scheme" />
                            </SelectTrigger>
                            <SelectContent>
                                {schemes.map((scheme) => (
                                    <SelectItem key={scheme.id} value={scheme.id}>
                                        {scheme.name} ({scheme.year})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Update Branch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
