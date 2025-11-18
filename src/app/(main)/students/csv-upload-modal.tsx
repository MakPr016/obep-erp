"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Papa from "papaparse"

interface CsvUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CsvUploadModal({ open, onClose, onSuccess }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) {
      setError("Please select a CSV file")
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setIsUploading(true)
        setError(null)
        try {
          const res = await fetch("/api/students/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: results.data }),
          })
          if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || "Upload failed")
          }
          onSuccess()
        } catch (err: any) {
          setError(err.message)
        } finally {
          setIsUploading(false)
        }
      },
      error: (err) => {
        setError("Failed to parse CSV: " + err.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Students from CSV</DialogTitle>
        </DialogHeader>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        {error && <p className="text-red-600 mt-2">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isUploading}>{isUploading ? "Uploading..." : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
