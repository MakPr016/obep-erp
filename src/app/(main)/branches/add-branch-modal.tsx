"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AddBranchModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddBranchModal({ open, onClose, onSuccess }: AddBranchModalProps) {
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
        }
    }, [open])

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
            const res = await fetch("/api/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                onSuccess()
                onClose()
                setFormData({ name: "", code: "", department_id: "", scheme_id: "" })
            } else {
                const error = await res.json()
                toast.error(error.error || "Failed to create branch")
            }
        } catch {
            toast.error("Failed to create branch")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Branch</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Branch Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Computer Science & Engineering"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">Branch Code</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g. CSE"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
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
                        <Label htmlFor="scheme">Scheme</Label>
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
                            {loading ? "Creating..." : "Create Branch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
