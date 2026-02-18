"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TICKET_CATEGORY_TEMPLATES } from "@/lib/ticket-templates"
import { CheckCircle } from "lucide-react"

interface TemplateSelectorDialogProps {
  open: boolean
  onSelect: (category: string) => void
  onCancel: () => void
}

export function TemplateSelectorDialog({ open, onSelect, onCancel }: TemplateSelectorDialogProps) {
  const templates = [
    { key: "Trouble", label: "문제 해결", description: "문제 현상부터 해결까지 체계적으로 기록" },
    { key: "Improvement", label: "개선 제안", description: "아이디어 검증부터 실행 결과까지" },
    { key: "Change", label: "변경 관리", description: "변경 요청부터 완료 확인까지" },
    { key: "Analysis", label: "분석 보고", description: "데이터 수집부터 결론까지" },
  ]

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>템플릿 선택</DialogTitle>
          <DialogDescription>작업 유형에 맞는 템플릿을 선택하면 필요한 항목이 자동으로 삽입됩니다</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <Card
              key={template.key}
              className="p-4 hover:border-primary cursor-pointer transition-colors"
              onClick={() => onSelect(template.key)}
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">{template.label}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="mt-3 space-y-1">
                    {TICKET_CATEGORY_TEMPLATES[template.key].map((field, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        • {field.label}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
