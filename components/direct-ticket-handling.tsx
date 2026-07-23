"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { closeTicketDirect } from "@/lib/storage"
import { CheckCircle, X, FileUp, Trash2 } from "lucide-react"
import { getTemplateForCategory } from "@/lib/ticket-templates"
import type { TicketHandlingData } from "@/lib/types"

interface DirectTicketHandlingProps {
  ticketId: string
  ticketCategory: string
  onCancel: () => void
  onSuccess: () => void
}

export function DirectTicketHandling({ ticketId, ticketCategory, onCancel, onSuccess }: DirectTicketHandlingProps) {
  const template = getTemplateForCategory(ticketCategory)
  const [handlingData, setHandlingData] = useState<TicketHandlingData>({})
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([])

  const handleFieldChange = (label: string, value: string) => {
    setHandlingData({ ...handlingData, [label]: value })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newAttachments = Array.from(files).map((file) => ({
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
      }))
      setAttachments([...attachments, ...newAttachments])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    // Validate required fields
    const missingFields = template.filter((field) => field.required && !handlingData[field.label]?.trim())

    if (missingFields.length > 0) {
      alert(`다음 필수 항목을 입력해주세요: ${missingFields.map((f) => f.label).join(", ")}`)
      return
    }

    // Generate summary
    let summary = `## ${ticketCategory} 이벤트 처리 완료\n\n`

    template.forEach((field) => {
      const value = handlingData[field.label] || "기록 없음"
      summary += `### ${field.label}\n${value}\n\n`
    })

    if (attachments.length > 0) {
      summary += `### 첨부 파일\n${attachments.map((att) => `- ${att.fileName}`).join("\n")}`
    }

    closeTicketDirect(ticketId, summary)
    onSuccess()
  }

  return (
    <Card className="p-6 space-y-4 bg-card border-border">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">직접 처리</h3>
          <p className="text-sm text-muted-foreground mt-1">{ticketCategory} 이벤트에 대한 처리 내용을 작성해주세요</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {template.map((field, index) => (
          <div key={index} className="space-y-2">
            <Label htmlFor={`field-${index}`} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={`field-${index}`}
              value={handlingData[field.label] || ""}
              onChange={(e) => handleFieldChange(field.label, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="resize-none"
            />
          </div>
        ))}

        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-foreground flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            첨부 파일
          </Label>
          <Input type="file" multiple onChange={handleFileUpload} className="cursor-pointer" />

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-md border border-border"
                >
                  <span className="text-sm text-foreground truncate flex-1">{att.fileName}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAttachment(index)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Button onClick={handleSubmit} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          이벤트 완료
        </Button>
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </Card>
  )
}
