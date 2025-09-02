"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, Download, Eye } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface FileUploadProps {
  jobCardId: string
  existingFiles?: FileAttachment[]
  onFilesChange?: (files: FileAttachment[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
}

interface FileAttachment {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size?: number
  uploaded_by: string
  created_at: string
}

export function FileUpload({
  jobCardId,
  existingFiles = [],
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "txt", "xlsx", "csv"],
}: FileUploadProps) {
  const [files, setFiles] = useState<FileAttachment[]>(existingFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])

    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSizeMB}MB`)
        continue
      }

      // Check file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      if (fileExtension && !acceptedTypes.includes(fileExtension)) {
        alert(`File type .${fileExtension} is not allowed`)
        continue
      }

      await uploadFile(file)
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${jobCardId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("job-card-attachments")
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100)
          },
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("job-card-attachments").getPublicUrl(fileName)

      // Save to database
      const { data: attachmentData, error: dbError } = await supabase
        .from("job_card_attachments")
        .insert({
          job_card_id: jobCardId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbError) throw dbError

      const newFile: FileAttachment = {
        id: attachmentData.id,
        file_name: attachmentData.file_name,
        file_url: attachmentData.file_url,
        file_type: attachmentData.file_type,
        file_size: file.size,
        uploaded_by: attachmentData.uploaded_by,
        created_at: attachmentData.created_at,
      }

      const updatedFiles = [...files, newFile]
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = async (fileId: string) => {
    try {
      const { error } = await supabase.from("job_card_attachments").delete().eq("id", fileId)

      if (error) throw error

      const updatedFiles = files.filter((f) => f.id !== fileId)
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
    } catch (error) {
      console.error("Error removing file:", error)
      alert("Failed to remove file")
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">File Attachments</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept={acceptedTypes.map((type) => `.${type}`).join(",")}
      />

      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.file_name)}
                    <div>
                      <div className="font-medium text-sm">{file.file_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.file_url, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a")
                        link.href = file.file_url
                        link.download = file.file_name
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Maximum {maxFiles} files, {maxSizeMB}MB each. Accepted: {acceptedTypes.join(", ")}
      </div>
    </div>
  )
}
