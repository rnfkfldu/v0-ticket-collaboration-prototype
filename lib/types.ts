export interface Ticket {
  id: string
  title: string
  description: string
  ticketType: "Improvement" | "Trouble" | "Change" | "Analysis" | "Request" | "ModelImprovement" | "ProcessTest"
  priority: "P1" | "P2" | "P3" | "P4"
  impact: "Safety" | "Quality" | "Throughput" | "Cost" | "Energy" | "Operations" | "Yield"
  owner: string
  requester: string
  status: "Open" | "In Progress" | "Blocked" | "Closed"
  createdDate: string
  dueDate: string
  bottleneck?: string
  accessLevel: "Private" | "Team" | "Public"
  allowedTeams?: string[]
  unit?: string
  area?: string
  equipment?: string // Added equipment field
  tags?: string[]
  fromTime?: string
  toTime?: string
  context?: {
    unit: string
    area?: string
    equipment?: string
    tags?: string[]
    timeRange?: string
    notes?: string
  }
  workPackages: WorkPackage[]
  closedDate?: string
  executiveSummary?: string
  categoryFields?: TicketCategoryField[]
  messages: TicketMessage[]
  hasUnreadNotification?: boolean
  additionalDetails?: {
    text: string
    dataBoxes: DataInsertBox[]
  }
  // 모델 개선 요청 전용
  modelRequest?: {
    category: "model-rebuild" | "m2m-network" | "apc-activation"
    targetModel?: string
    receivingTeam?: string
  }
  // 실공정 테스트 전용
  processTest?: {
    hypothesis: string
    testStartDate: string
    testEndDate: string
    targetVariables: string[]
    operatingGuide: string
    feedbackDeadline: string  // testEndDate + 30일
    feedbackContent?: string
    testStatus: "planned" | "in-progress" | "completed" | "feedback-pending" | "closed"
    reviewedByProduction?: boolean
  }
}

export interface WorkPackage {
  id: string
  ticketId: string
  wpType: "Analysis" | "Decision" | "Execution" | "Validation"
  title: string
  description: string
  ownerTeam: string
  assignee?: string // Added assignee field for individual assignment
  status: "Not Started" | "In Progress" | "Blocked" | "Done"
  dueDate: string
  dependency?: string
  blockageReason?: string
  logs: WorkPackageLog[]
  attachments: WorkPackageAttachment[]
}

export interface WorkPackageLog {
  id: string
  author: string
  content: string
  timestamp: string
}

export interface WorkPackageAttachment {
  id: string
  fileName: string
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
}

export interface ProcessData {
  timestamp: string
  mode: string
  throughput: number
  throughputUnit: string
  temperature?: number
  pressure?: number
  kpis: {
    name: string
    value: number
    unit: string
    status: "Normal" | "Warning" | "Critical"
  }[]
  notes?: string
}

export interface TicketCategoryField {
  label: string
  placeholder: string
  required: boolean
}

export interface TicketHandlingData {
  [key: string]: string
}

export interface DataInsertBox {
  id: string
  type: "trend" | "dcs" | "table" | "chart"
  config: {
    tags?: string[]
    timeRange?: string
    graphicType?: string
    title?: string
    unit?: string
    graphicNumber?: string
    rows?: number
    columns?: number
    tableData?: string[][]
    fromDate?: string
    toDate?: string
  }
}

export interface DirectHandlingContent {
  text: string
  dataBoxes: DataInsertBox[]
}

export interface TicketMessage {
  id: string
  ticketId: string
  author: string
  role: "requester" | "assignee" | "system"
  messageType: "opinion" | "inquiry" | "response" | "status_change" | "wp_assignment"
  content: string
  timestamp: string
  attachments?: WorkPackageAttachment[]
  dataBoxes?: DataInsertBox[]
}

export interface TicketInquiry {
  id: string
  content: string
  author: string
  timestamp: string
}
