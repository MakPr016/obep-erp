"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, AlertCircle, FileDown } from "lucide-react"
import Papa from "papaparse"
import { toast } from "sonner"

interface FacultyUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FacultyUploadModal({ open, onClose, onSuccess }: FacultyUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setDebugInfo(null)
    }
  }

  const handleDownloadTemplate = () => {
    window.location.href = `/api/faculty/template`
  }

  const handleUpload = () => {
    if (!file) {
      setError("Please select a CSV file")
      return
    }

    setUploading(true)
    setError(null)
    setDebugInfo(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.data.length === 0) {
            throw new Error("The CSV file appears to be empty")
          }

          const res = await fetch(`/api/faculty/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facultyData: results.data }),
          })

          const json = await res.json()

          if (!res.ok) {
            if (json.debug) {
              setDebugInfo(json.debug)
            }
            throw new Error(json.error || "Failed to upload faculty")
          }

          toast.success(`Successfully imported ${json.facultyCount} faculty members`)
          onSuccess()
          onClose()
          setFile(null)
        } catch (err: any) {
          console.error("Upload error:", err)
          setError(err.message || "Failed to process CSV file")
        } finally {
          setUploading(false)
        }
      },
      error: (err) => {
        setUploading(false)
        setError(`CSV Parsing Error: ${err.message}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Faculty from CSV</DialogTitle>
          <DialogDescription>
            Upload faculty details in bulk. Users will be created automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Template Download Section */}
          <div className="bg-muted/50 border border-dashed rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              <p className="font-medium text-foreground">1. Download Template</p>
              <p className="text-xs">Get the correct CSV format for faculty import.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <FileDown className="mr-2 h-4 w-4" /> Download Template
            </Button>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <div className="text-sm font-medium">2. Upload Filled CSV</div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-file" className="sr-only">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              CSV should include: Full Name, Email, Password (optional - auto-generated if empty)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-wrap text-xs">
                <p className="font-semibold text-sm mb-1">{error}</p>
                {debugInfo && (
                  <div className="mt-2 bg-red-950/10 p-2 rounded border border-red-200">
                    <p><strong>Expected Headers:</strong> {debugInfo.expected.join(", ")}</p>
                    <p className="mt-1"><strong>Received Headers:</strong> {debugInfo.received.join(", ")}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Import Faculty
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
