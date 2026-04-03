"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  ArrowDown, 
  Link2, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  GitBranch,
  ChevronRight,
  ChevronDown,
  GripVertical,
  X,
  Plus,
  Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "lucide-react"

// 이벤트 노드 타입
interface EventNode {
  id: string
  title: string
  status: string
  ticketType?: string
  dueDate?: string
  x: number
  y: number
}

// 이벤트 간 관계 타입
interface EventRelation {
  id: string
  sourceId: string
  targetId: string
  type: "parent-child" | "sequence" // 모-자 관계 또는 전-후 관계
}

// 이벤트 Due Date 변경 타입
export interface EventDueDate {
  eventId: string
  dueDate: string
}

interface EventRelationCanvasProps {
  events: Array<{
    id: string
    title: string
    status: string
    ticketType?: string
    dueDate?: string
  }>
  relations?: EventRelation[]
  onRelationsChange?: (relations: EventRelation[]) => void
  onRemoveEvent?: (eventId: string) => void
  eventDueDates?: EventDueDate[]
  onDueDatesChange?: (dueDates: EventDueDate[]) => void
  className?: string
}

export function EventRelationCanvas({ 
  events, 
  relations: initialRelations = [],
  onRelationsChange,
  onRemoveEvent,
  eventDueDates: initialDueDates = [],
  onDueDatesChange,
  className 
}: EventRelationCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<EventNode[]>([])
  const [relations, setRelations] = useState<EventRelation[]>(initialRelations)
  const [dueDates, setDueDates] = useState<EventDueDate[]>(initialDueDates)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connecting, setConnecting] = useState<{ sourceId: string; startX: number; startY: number } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [showRelationDialog, setShowRelationDialog] = useState(false)
  const [pendingRelation, setPendingRelation] = useState<{ sourceId: string; targetId: string } | null>(null)
  const [newRelationType, setNewRelationType] = useState<"parent-child" | "sequence">("sequence")

  // 이벤트를 노드로 초기화 (그리드 배치)
  useEffect(() => {
    const cols = 3
    const nodeWidth = 200
    const nodeHeight = 100
    const gap = 40
    
    const newNodes = events.map((event, index) => {
      const existingNode = nodes.find(n => n.id === event.id)
      const existingDueDate = dueDates.find(d => d.eventId === event.id)?.dueDate || event.dueDate
      if (existingNode) {
        return { ...existingNode, title: event.title, status: event.status, ticketType: event.ticketType, dueDate: existingDueDate }
      }
      const row = Math.floor(index / cols)
      const col = index % cols
      return {
        id: event.id,
        title: event.title,
        status: event.status,
        ticketType: event.ticketType,
        dueDate: existingDueDate,
        x: col * (nodeWidth + gap) + 20,
        y: row * (nodeHeight + gap) + 20
      }
    })
    setNodes(newNodes)
  }, [events, dueDates])

  // 노드 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDraggingNode(nodeId)
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - node.x,
      y: (e.clientY - rect.top) / zoom - node.y
    })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    setMousePos({ x, y })

    if (draggingNode) {
      setNodes(prev => prev.map(n => 
        n.id === draggingNode 
          ? { ...n, x: x - dragOffset.x, y: y - dragOffset.y }
          : n
      ))
    }
  }, [draggingNode, dragOffset, zoom])

  const handleMouseUp = () => {
    if (connecting) {
      // 연결 종료 - 타겟 노드 찾기
      const targetNode = nodes.find(n => {
        const nodeWidth = 200
        const nodeHeight = 90
        return mousePos.x >= n.x && mousePos.x <= n.x + nodeWidth &&
               mousePos.y >= n.y && mousePos.y <= n.y + nodeHeight &&
               n.id !== connecting.sourceId
      })
      
      if (targetNode) {
        // 이미 존재하는 관계인지 확인
        const exists = relations.some(r => 
          (r.sourceId === connecting.sourceId && r.targetId === targetNode.id) ||
          (r.sourceId === targetNode.id && r.targetId === connecting.sourceId)
        )
        
        if (!exists) {
          setPendingRelation({ sourceId: connecting.sourceId, targetId: targetNode.id })
          setShowRelationDialog(true)
        }
      }
      setConnecting(null)
    }
    setDraggingNode(null)
  }

  // 연결 시작
  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    setConnecting({
      sourceId: nodeId,
      startX: node.x + 100, // 노드 중앙
      startY: node.y + 35
    })
  }

  // 관계 추가
  const addRelation = () => {
    if (!pendingRelation) return
    
    const newRelation: EventRelation = {
      id: `rel-${Date.now()}`,
      sourceId: pendingRelation.sourceId,
      targetId: pendingRelation.targetId,
      type: newRelationType
    }
    
    const updatedRelations = [...relations, newRelation]
    setRelations(updatedRelations)
    onRelationsChange?.(updatedRelations)
    
    setShowRelationDialog(false)
    setPendingRelation(null)
    setNewRelationType("sequence")
  }

  // 관계 제거
  const removeRelation = (relationId: string) => {
    const updatedRelations = relations.filter(r => r.id !== relationId)
    setRelations(updatedRelations)
    onRelationsChange?.(updatedRelations)
  }

  // Due Date 업데이트
  const updateDueDate = (eventId: string, newDate: string) => {
    const existingIdx = dueDates.findIndex(d => d.eventId === eventId)
    let updatedDueDates: EventDueDate[]
    
    if (existingIdx >= 0) {
      updatedDueDates = dueDates.map((d, i) => 
        i === existingIdx ? { ...d, dueDate: newDate } : d
      )
    } else {
      updatedDueDates = [...dueDates, { eventId, dueDate: newDate }]
    }
    
    setDueDates(updatedDueDates)
    onDueDatesChange?.(updatedDueDates)
    
    // Update node as well
    setNodes(prev => prev.map(n => 
      n.id === eventId ? { ...n, dueDate: newDate } : n
    ))
  }

  // 줌
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5))
  const handleZoomReset = () => setZoom(1)

  // 연결선 그리기
  const renderConnection = (sourceNode: EventNode, targetNode: EventNode, relation: EventRelation) => {
    const nodeWidth = 200
    const nodeHeight = 90
    
    // 소스와 타겟의 중심 좌표
    const sx = sourceNode.x + nodeWidth / 2
    const sy = sourceNode.y + nodeHeight / 2
    const tx = targetNode.x + nodeWidth / 2
    const ty = targetNode.y + nodeHeight / 2

    // 연결점 계산 (노드 테두리)
    let startX, startY, endX, endY
    
    if (Math.abs(tx - sx) > Math.abs(ty - sy)) {
      // 수평 방향 연결
      if (tx > sx) {
        startX = sourceNode.x + nodeWidth
        endX = targetNode.x
      } else {
        startX = sourceNode.x
        endX = targetNode.x + nodeWidth
      }
      startY = sy
      endY = ty
    } else {
      // 수직 방향 연결
      if (ty > sy) {
        startY = sourceNode.y + nodeHeight
        endY = targetNode.y
      } else {
        startY = sourceNode.y
        endY = targetNode.y + nodeHeight
      }
      startX = sx
      endX = tx
    }

    const isParentChild = relation.type === "parent-child"
    const color = isParentChild ? "#8b5cf6" : "#0ea5e9" // purple for parent-child, blue for sequence
    
    // 베지어 커브 계산
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    return (
      <g key={relation.id} className="cursor-pointer group">
        {/* 연결선 */}
        <path
          d={`M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${midY} T ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={isParentChild ? "none" : "5,5"}
          markerEnd={`url(#arrow-${isParentChild ? 'parent' : 'sequence'})`}
          className="transition-all group-hover:stroke-[3]"
        />
        {/* 관계 타입 라벨 */}
        <foreignObject x={midX - 30} y={midY - 12} width={60} height={24}>
          <div 
            className="flex items-center justify-center"
            onClick={() => removeRelation(relation.id)}
          >
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] cursor-pointer transition-all hover:scale-110",
                isParentChild 
                  ? "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100" 
                  : "bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100"
              )}
            >
              {isParentChild ? "모-자" : "전→후"}
              <X className="h-2.5 w-2.5 ml-0.5 opacity-0 group-hover:opacity-100" />
            </Badge>
          </div>
        </foreignObject>
      </g>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": case "completed": return "border-green-300 bg-green-50"
      case "in-progress": return "border-blue-300 bg-blue-50"
      case "pending": case "waiting": return "border-amber-300 bg-amber-50"
      default: return "border-gray-300 bg-gray-50"
    }
  }

  return (
    <div className={cn("relative border rounded-lg overflow-hidden bg-muted/20", className)}>
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/90 backdrop-blur rounded-lg border p-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-1">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-3 bg-background/90 backdrop-blur rounded-lg border px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-purple-500" />
          <span className="text-[10px] text-muted-foreground">모-자 관계</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-sky-500" />
          <span className="text-[10px] text-muted-foreground">전-후 관계</span>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="relative w-full h-[400px] overflow-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative min-w-full min-h-full"
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: '0 0',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`
          }}
        >
          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrow-parent" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
              <marker id="arrow-sequence" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9" />
              </marker>
            </defs>
            
            {/* 기존 연결선 */}
            {relations.map(relation => {
              const sourceNode = nodes.find(n => n.id === relation.sourceId)
              const targetNode = nodes.find(n => n.id === relation.targetId)
              if (!sourceNode || !targetNode) return null
              return renderConnection(sourceNode, targetNode, relation)
            })}
            
            {/* 연결 중인 선 */}
            {connecting && (
              <line
                x1={connecting.startX}
                y1={connecting.startY}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {/* Event Nodes */}
          {nodes.map(node => (
            <ContextMenu key={node.id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "absolute w-[200px] p-3 rounded-lg border-2 cursor-move transition-shadow select-none",
                    getStatusColor(node.status),
                    draggingNode === node.id && "shadow-lg ring-2 ring-primary"
                  )}
                  style={{ left: node.x, top: node.y }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{node.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px]">{node.id}</Badge>
                        <Badge variant="secondary" className="text-[9px]">{node.status}</Badge>
                      </div>
                      {/* Due Date 입력 */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <input
                          type="date"
                          value={node.dueDate || ""}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateDueDate(node.id, e.target.value)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="text-[10px] bg-transparent border-none p-0 h-4 w-[90px] text-muted-foreground focus:text-foreground focus:outline-none cursor-pointer"
                          placeholder="Due Date"
                        />
                        {node.dueDate && (
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(node.dueDate) < new Date() ? "(지남)" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* 연결 핸들 */}
                    <button
                      className="shrink-0 w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                      onMouseDown={(e) => startConnection(e, node.id)}
                      title="드래그하여 다른 이벤트와 연결"
                    >
                      <Link2 className="h-3 w-3 text-primary" />
                    </button>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => startConnection({ stopPropagation: () => {} } as any, node.id)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  관계 연결
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  className="text-destructive"
                  onClick={() => onRemoveEvent?.(node.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  이벤트 제거
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">연결된 이벤트가 없습니다</p>
                <p className="text-xs mt-1">이벤트를 추가하고 관계를 설정하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Relation Type Dialog */}
      <Dialog open={showRelationDialog} onOpenChange={setShowRelationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              관계 유형 선택
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={newRelationType} onValueChange={(v) => setNewRelationType(v as any)}>
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="parent-child" id="parent-child" className="mt-1" />
                <Label htmlFor="parent-child" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">모-자 관계</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    상위 이벤트에서 파생된 하위 이벤트를 나타냅니다
                  </p>
                </Label>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer mt-2">
                <RadioGroupItem value="sequence" id="sequence" className="mt-1" />
                <Label htmlFor="sequence" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-sky-600" />
                    <span className="font-medium">전-후 관계</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    시간 순서상 선행/후행 관계를 나타냅니다
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelationDialog(false)}>
              취소
            </Button>
            <Button onClick={addRelation}>
              관계 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
