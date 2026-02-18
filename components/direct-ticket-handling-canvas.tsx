"use client"

import { Label } from "@/components/ui/label"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { sendOpinion, saveTicketDraft, convertDirectHandlingToWP } from "@/lib/storage"
import { X, FileUp, Trash2, Save, PlusCircle, Boxes, Send } from "lucide-react"
import type { DataInsertBox } from "@/lib/types"
import { DataInsertBoxConfig } from "@/components/data-insert-box-config"
import { DataVisualization } from "@/components/data-visualization"
import { Textarea } from "@/components/ui/textarea"
import { TemplateSelectorDialog } from "@/components/template-selector-dialog"
import { TICKET_CATEGORY_TEMPLATES } from "@/lib/ticket-templates"

interface DirectTicketHandlingCanvasProps {
  ticketId: string
  ticketCategory: string
  ticketUnit?: string
  currentUser: string
  onCancel: () => void
  onSuccess: () => void
  onConvertToWP?: () => void
}

export function DirectTicketHandlingCanvas({
  ticketId,
  ticketCategory,
  ticketUnit,
  currentUser,
  onCancel,
  onSuccess,
  onConvertToWP,
}: DirectTicketHandlingCanvasProps) {
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([])
  const [dataBoxes, setDataBoxes] = useState<DataInsertBox[]>([])
  const [showDataBoxConfig, setShowDataBoxConfig] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)

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

  const handleAddDataBox = (box: Omit<DataInsertBox, "id">) => {
    console.log("[v0] handleAddDataBox received:", box)
    console.log("[v0] box.type:", box.type)
    console.log("[v0] box.config:", box.config)

    const newBox: DataInsertBox = {
      id: `box-${Date.now()}`,
      type: box.type, // 전달받은 타입을 그대로 사용
      config: box.config, // 전달받은 config를 그대로 사용
    }

    console.log("[v0] Created newBox:", newBox)
    console.log("[v0] newBox.type:", newBox.type)

    setDataBoxes([...dataBoxes, newBox])
    setShowDataBoxConfig(false)
  }

  const handleRemoveDataBox = (id: string) => {
    setDataBoxes(dataBoxes.filter((box) => box.id !== id))
  }

  const handleTableDataChange = (boxId: string, data: string[][]) => {
    setDataBoxes(
      dataBoxes.map((box) => (box.id === boxId ? { ...box, config: { ...box.config, tableData: data } } : box)),
    )
  }

  const getBoxTypeLabel = (type: string) => {
    switch (type) {
      case "trend":
        return "트렌드 그래프"
      case "dcs":
        return "DCS 화면"
      case "table":
        return "데이터 테이블"
      default:
        return type
    }
  }

  const handleSubmit = () => {
    if (!content.trim() && dataBoxes.length === 0) {
      alert("처리 내용을 입력해주세요")
      return
    }

    let summary = `## ${ticketCategory} 티켓 처리 의견\n\n${content}\n\n`

    if (dataBoxes.length > 0) {
      summary += `### 참조 데이터\n${dataBoxes.map((box) => `- ${box.config.title || getBoxTypeLabel(box.type)}: ${box.config.tags?.join(", ") || box.config.graphicNumber || "테이블"}`).join("\n")}\n\n`
    }

    if (attachments.length > 0) {
      summary += `### 첨부 파일\n${attachments.map((att) => `- ${att.fileName}`).join("\n")}`
    }

    sendOpinion(ticketId, summary, currentUser, dataBoxes)
    alert("의견이 티켓 요청자에게 전송되었습니다")
    onSuccess()
  }

  const handleSaveDraft = () => {
    saveTicketDraft(ticketId, content)
    alert("임시 저장되었습니다")
  }

  const handleTemplateSelect = (category: string) => {
    const template = TICKET_CATEGORY_TEMPLATES[category]
    if (template) {
      const templateText = template.map((field) => `${field.label}:\n\n`).join("\n")
      setContent(templateText)
    }
    setShowTemplateDialog(false)
  }

  const handleConvertToWP = () => {
    if (!content.trim() && dataBoxes.length === 0) {
      alert("처리 내용을 입력해주세요")
      return
    }
    convertDirectHandlingToWP(ticketId, content, dataBoxes)
    if (onConvertToWP) {
      onConvertToWP()
    }
  }

  return (
    <>
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">직접 처리</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {ticketCategory} 티켓 처리 내용을 자유롭게 작성해주세요
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 데이터 삽입 영역 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">참조 데이터</Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => setShowDataBoxConfig(true)}
            >
              <PlusCircle className="h-3 w-3" />
              데이터 삽입
            </Button>
          </div>

          {dataBoxes.length > 0 && (
            <div className="space-y-3">
              {dataBoxes.map((box) => (
                <Card key={box.id} className="p-4 bg-muted/30 border-border relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveDataBox(box.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground">
                      {box.config.title || getBoxTypeLabel(box.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {box.type === "trend" && box.config.tags?.join(", ")}
                      {box.type === "dcs" && `${box.config.unit} - ${box.config.graphicNumber}`}
                      {box.type === "table" && `${box.config.rows}행 x ${box.config.columns}열`}
                    </p>
                  </div>
                  <DataVisualization box={box} onTableDataChange={(data) => handleTableDataChange(box.id, data)} />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 텍스트 편집 영역 */}
        <div className="space-y-4">
          <div className="flex gap-2 items-center flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)} className="bg-transparent">
              템플릿 삽입
            </Button>
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                <span>
                  <FileUp className="h-4 w-4" />
                  파일 첨부
                </span>
              </Button>
            </label>
            <Input id="file-upload" type="file" multiple onChange={handleFileUpload} className="hidden" />
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="처리 내용을 입력해주세요..."
            className="min-h-[300px] max-h-[500px] resize-y"
          />

          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">첨부 파일</p>
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

        {/* 액션 버튼 영역 */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button onClick={handleSubmit} className="gap-2">
            <Send className="h-4 w-4" />
            의견 보내기
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} className="gap-2 bg-transparent">
            <Save className="h-4 w-4" />
            임시 저장
          </Button>
          <Button variant="outline" onClick={onCancel} className="bg-transparent">
            취소
          </Button>
        </div>

        <div className="pt-2 border-t border-border">
          <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={handleConvertToWP}>
            <Boxes className="h-4 w-4" />
            Work Package로 전환
          </Button>
        </div>
      </Card>

      {showDataBoxConfig && (
        <DataInsertBoxConfig
          onConfirm={handleAddDataBox}
          onCancel={() => setShowDataBoxConfig(false)}
          defaultUnit={ticketUnit}
        />
      )}

      <TemplateSelectorDialog
        open={showTemplateDialog}
        onSelect={handleTemplateSelect}
        onCancel={() => setShowTemplateDialog(false)}
      />
    </>
  )
}
