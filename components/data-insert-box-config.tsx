"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Minus } from "lucide-react"
import { useState } from "react"
import type { DataInsertBox } from "@/lib/types"
import { AVAILABLE_TAGS, DCS_GRAPHICS } from "@/lib/process-data"

interface DataInsertBoxConfigProps {
  onConfirm: (box: Omit<DataInsertBox, "id">) => void
  onCancel: () => void
  defaultUnit?: string
}

const UNITS = ["CDU", "VDU", "HCR", "CCR", "DHT", "NHT", "Utilities"]

export function DataInsertBoxConfig({ onConfirm, onCancel, defaultUnit }: DataInsertBoxConfigProps) {
  const [boxType, setBoxType] = useState<"trend" | "dcs" | "table" | "chart">("trend")
  const [title, setTitle] = useState("")
  const [selectedUnit, setSelectedUnit] = useState(defaultUnit || "CDU")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedGraphic, setSelectedGraphic] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [rows, setRows] = useState(3)
  const [columns, setColumns] = useState(3)

  const handleConfirm = () => {
    const config: DataInsertBox["config"] = { title }

    if (boxType === "trend") {
      config.tags = selectedTags
      config.fromDate = fromDate
      config.toDate = toDate
      config.unit = selectedUnit
    } else if (boxType === "dcs") {
      config.unit = selectedUnit
      config.graphicNumber = selectedGraphic
      config.fromDate = fromDate
      config.toDate = toDate
    } else if (boxType === "table") {
      config.rows = rows
      config.columns = columns
      config.tableData = Array(rows)
        .fill(null)
        .map(() => Array(columns).fill(""))
    }

    onConfirm({ type: boxType, config })
  }

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const availableTags = AVAILABLE_TAGS[selectedUnit] || []
  const availableGraphics = DCS_GRAPHICS[selectedUnit] || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-lg space-y-4 bg-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">데이터 삽입 설정</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>데이터 타입</Label>
            <Select value={boxType} onValueChange={(v: any) => setBoxType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trend">트렌드 그래프</SelectItem>
                <SelectItem value="dcs">DCS 화면</SelectItem>
                <SelectItem value="table">데이터 테이블</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>제목</Label>
            <Input placeholder="예: 반응기 온도 추이" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* 트렌드 그래프 설정 */}
          {boxType === "trend" && (
            <>
              <div className="space-y-2">
                <Label>공정 선택</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>태그 선택</Label>
                <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px] bg-background">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {availableTags
                    .filter((t) => !selectedTags.includes(t))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleAddTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일 (From)</Label>
                  <Input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>종료일 (To)</Label>
                  <Input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* DCS 화면 설정 */}
          {boxType === "dcs" && (
            <>
              <div className="space-y-2">
                <Label>공정 선택</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>그래픽 넘버</Label>
                <Select value={selectedGraphic} onValueChange={setSelectedGraphic}>
                  <SelectTrigger>
                    <SelectValue placeholder="그래픽을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGraphics.map((g) => (
                      <SelectItem key={g.number} value={g.number}>
                        {g.number} - {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>시점</Label>
                <Input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
            </>
          )}

          {/* 데이터 테이블 설정 */}
          {boxType === "table" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>행 수</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRows(Math.max(1, rows - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="text-center"
                  />
                  <Button variant="outline" size="sm" onClick={() => setRows(rows + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>열 수</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setColumns(Math.max(1, columns - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={columns}
                    onChange={(e) => setColumns(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="text-center"
                  />
                  <Button variant="outline" size="sm" onClick={() => setColumns(columns + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleConfirm} className="flex-1">
            확인
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            취소
          </Button>
        </div>
      </Card>
    </div>
  )
}
