import type { Ticket, WorkPackage, WorkPackageLog, WorkPackageAttachment, TicketMessage } from "./types"
import type { WorkItem } from "./workbench-data"
import { getMockTickets } from "./mock-data"
import { INITIAL_WORK_ITEMS } from "./workbench-data"

const STORAGE_KEY = "tickets"
const STORAGE_VERSION_KEY = "tickets_version"
const CURRENT_VERSION = "v4-quick-inquiry"

// Worklist storage
const WORKLIST_STORAGE_KEY = "worklists"
const WORKLIST_VERSION_KEY = "worklists_version"
const WORKLIST_CURRENT_VERSION = "v1-worklist"

export function getWorklists(): WorkItem[] {
  if (typeof window === "undefined") return INITIAL_WORK_ITEMS

  const storedVersion = localStorage.getItem(WORKLIST_VERSION_KEY)
  if (storedVersion !== WORKLIST_CURRENT_VERSION) {
    localStorage.setItem(WORKLIST_STORAGE_KEY, JSON.stringify(INITIAL_WORK_ITEMS))
    localStorage.setItem(WORKLIST_VERSION_KEY, WORKLIST_CURRENT_VERSION)
    return INITIAL_WORK_ITEMS
  }

  const stored = localStorage.getItem(WORKLIST_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(WORKLIST_STORAGE_KEY, JSON.stringify(INITIAL_WORK_ITEMS))
    return INITIAL_WORK_ITEMS
  }

  return JSON.parse(stored)
}

export function saveWorklist(worklist: WorkItem): void {
  const worklists = getWorklists()
  worklists.unshift(worklist)
  localStorage.setItem(WORKLIST_STORAGE_KEY, JSON.stringify(worklists))
}

export function updateWorklist(worklistId: string, updates: Partial<WorkItem>): void {
  const worklists = getWorklists()
  const index = worklists.findIndex((w) => w.id === worklistId)
  if (index !== -1) {
    worklists[index] = { ...worklists[index], ...updates }
    localStorage.setItem(WORKLIST_STORAGE_KEY, JSON.stringify(worklists))
  }
}

export function getWorklistById(id: string): WorkItem | undefined {
  return getWorklists().find((w) => w.id === id)
}

export function deleteWorklist(worklistId: string): void {
  const worklists = getWorklists()
  const filtered = worklists.filter((w) => w.id !== worklistId)
  localStorage.setItem(WORKLIST_STORAGE_KEY, JSON.stringify(filtered))
}

export function getTickets(): Ticket[] {
  if (typeof window === "undefined") return getMockTickets()

  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
  if (storedVersion !== CURRENT_VERSION) {
    const mockTickets = getMockTickets()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTickets))
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
    return mockTickets
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    const mockTickets = getMockTickets()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTickets))
    return mockTickets
  }

  return JSON.parse(stored)
}

export function resetSystem(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_VERSION_KEY)
  const mockTickets = getMockTickets()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTickets))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
}

export function saveTicket(ticket: Ticket): void {
  const tickets = getTickets()
  tickets.unshift(ticket)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export function updateTicket(ticketId: string, updates: Partial<Ticket>): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function getTicketById(id: string): Ticket | undefined {
  return getTickets().find((t) => t.id === id)
}

export function addWorkPackageToTicket(ticketId: string, workPackage: Omit<WorkPackage, "id">): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    const newWP: WorkPackage = {
      ...workPackage,
      id: `wp-${Date.now()}`,
    }

    tickets[index].workPackages.push(newWP)

    if (workPackage.assignee) {
      const assignmentMessage: TicketMessage = {
        id: `msg-${Date.now()}`,
        ticketId,
        author: "System",
        role: "system",
        messageType: "wp_assignment",
        content: `${workPackage.assignee}님이 ${workPackage.wpType} 워크패키지에 배정되었습니다.`,
        timestamp: new Date().toISOString(),
      }

      if (!tickets[index].messages) {
        tickets[index].messages = []
      }

      tickets[index].messages.push(assignmentMessage)
      tickets[index].hasUnreadNotification = true
    }

    // Update ticket status based on work packages
    const hasBlocked = tickets[index].workPackages.some((wp) => wp.status === "Blocked")
    const allDone = tickets[index].workPackages.every((wp) => wp.status === "Done")
    const hasInProgress = tickets[index].workPackages.some((wp) => wp.status === "In Progress")

    if (allDone && tickets[index].workPackages.length > 0) {
      tickets[index].status = "Closed"
    } else if (hasBlocked) {
      tickets[index].status = "Blocked"
    } else if (hasInProgress) {
      tickets[index].status = "In Progress"
    }

    // Update bottleneck
    const blockedWPs = tickets[index].workPackages.filter((wp) => wp.status === "Blocked")
    if (blockedWPs.length > 0) {
      tickets[index].bottleneck = `${blockedWPs[0].wpType} (${blockedWPs[0].ownerTeam})`
    } else {
      tickets[index].bottleneck = undefined
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function updateWorkPackage(ticketId: string, wpId: string, updates: Partial<WorkPackage>): void {
  const tickets = getTickets()
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex !== -1) {
    const wpIndex = tickets[ticketIndex].workPackages.findIndex((wp) => wp.id === wpId)

    if (wpIndex !== -1) {
      const oldWP = tickets[ticketIndex].workPackages[wpIndex]

      tickets[ticketIndex].workPackages[wpIndex] = {
        ...oldWP,
        ...updates,
      }

      if (updates.assignee && updates.assignee !== oldWP.assignee) {
        const assignmentMessage: TicketMessage = {
          id: `msg-${Date.now()}`,
          ticketId,
          author: "System",
          role: "system",
          messageType: "wp_assignment",
          content: `${updates.assignee}님이 ${oldWP.wpType} 워크패키지에 배정되었습니다.`,
          timestamp: new Date().toISOString(),
        }

        if (!tickets[ticketIndex].messages) {
          tickets[ticketIndex].messages = []
        }

        tickets[ticketIndex].messages.push(assignmentMessage)
        tickets[ticketIndex].hasUnreadNotification = true
      }

      // Update ticket status based on work packages
      const hasBlocked = tickets[ticketIndex].workPackages.some((wp) => wp.status === "Blocked")
      const allDone = tickets[ticketIndex].workPackages.every((wp) => wp.status === "Done")
      const hasInProgress = tickets[ticketIndex].workPackages.some((wp) => wp.status === "In Progress")

      if (allDone && tickets[ticketIndex].workPackages.length > 0) {
        tickets[ticketIndex].status = "Closed"
      } else if (hasBlocked) {
        tickets[ticketIndex].status = "Blocked"
      } else if (hasInProgress) {
        tickets[ticketIndex].status = "In Progress"
      } else {
        tickets[ticketIndex].status = "Open"
      }

      // Update bottleneck
      const blockedWPs = tickets[ticketIndex].workPackages.filter((wp) => wp.status === "Blocked")
      if (blockedWPs.length > 0) {
        tickets[ticketIndex].bottleneck = `${blockedWPs[0].wpType} (${blockedWPs[0].ownerTeam})`
      } else {
        tickets[ticketIndex].bottleneck = undefined
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
    }
  }
}

export function addLogToWorkPackage(
  ticketId: string,
  wpId: string,
  log: Omit<WorkPackageLog, "id" | "timestamp">,
): void {
  const tickets = getTickets()
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex !== -1) {
    const wpIndex = tickets[ticketIndex].workPackages.findIndex((wp) => wp.id === wpId)

    if (wpIndex !== -1) {
      const wp = tickets[ticketIndex].workPackages[wpIndex]
      const newLog: WorkPackageLog = {
        ...log,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
      }

      if (!wp.logs) {
        wp.logs = []
      }

      wp.logs.push(newLog)

      // 이벤트 히스토리에도 메시지 추가
      const historyMessage: TicketMessage = {
        id: `msg-${Date.now()}`,
        ticketId,
        author: log.author,
        role: "assignee",
        messageType: "wp_assignment",
        content: `[${wp.wpType} - ${wp.title}] ${log.content}`,
        timestamp: newLog.timestamp,
      }

      if (!tickets[ticketIndex].messages) {
        tickets[ticketIndex].messages = []
      }

      tickets[ticketIndex].messages.push(historyMessage)

      // 알람 발생
      tickets[ticketIndex].hasUnreadNotification = true

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
    }
  }
}

export function addAttachmentToWorkPackage(
  ticketId: string,
  wpId: string,
  attachment: Omit<WorkPackageAttachment, "id" | "uploadedAt">,
): void {
  const tickets = getTickets()
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex !== -1) {
    const wpIndex = tickets[ticketIndex].workPackages.findIndex((wp) => wp.id === wpId)

    if (wpIndex !== -1) {
      const newAttachment: WorkPackageAttachment = {
        ...attachment,
        id: `att-${Date.now()}`,
        uploadedAt: new Date().toISOString(),
      }

      if (!tickets[ticketIndex].workPackages[wpIndex].attachments) {
        tickets[ticketIndex].workPackages[wpIndex].attachments = []
      }

      tickets[ticketIndex].workPackages[wpIndex].attachments.push(newAttachment)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
    }
  }
}

export function deleteTicket(ticketId: string): void {
  const tickets = getTickets()
  const filtered = tickets.filter((t) => t.id !== ticketId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function closeTicket(ticketId: string): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    if (!tickets[index].messages) {
      tickets[index].messages = []
    }

    // Generate executive summary from work packages
    const wps = tickets[index].workPackages
    const summary =
      wps.length > 0
        ? wps
            .map((wp) => {
              const logSummary =
                wp.logs && wp.logs.length > 0
                  ? `Key activities: ${wp.logs.map((log) => log.content).join("; ")}`
                  : "No logs recorded"

              return `**${wp.wpType} - ${wp.title}** (${wp.ownerTeam})\nStatus: ${wp.status}\n${logSummary}\nAttachments: ${wp.attachments?.length || 0} file(s)`
            })
            .join("\n\n")
        : "이벤트이 종결되었습니다."

    tickets[index].status = "Closed"
    tickets[index].closedDate = new Date().toISOString()
    tickets[index].executiveSummary = summary

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function closeTicketDirect(ticketId: string, summary: string): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    tickets[index].status = "Closed"
    tickets[index].closedDate = new Date().toISOString()
    tickets[index].executiveSummary = summary

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function saveTicketDraft(ticketId: string, draft: string): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    tickets[index].draft = draft
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function convertDirectHandlingToWP(ticketId: string, content: string, dataBoxes?: any[]): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    // 기존 메시지들을 모두 로그로 변환
    const existingLogs: WorkPackageLog[] = []

    if (tickets[index].messages && tickets[index].messages.length > 0) {
      existingLogs.push(
        ...tickets[index].messages.map((msg) => ({
          id: `log-from-msg-${msg.id}`,
          author: msg.author,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      )
    }

    // 현재 작성 중인 내용 추가
    if (content.trim()) {
      existingLogs.push({
        id: `log-${Date.now()}`,
        author: tickets[index].owner,
        content: content,
        timestamp: new Date().toISOString(),
      })
    }

    const newWP: WorkPackage = {
      id: `wp-${Date.now()}`,
      ticketId,
      wpType: "Analysis",
      title: "분석 작업",
      description: "직접 처리에서 전환된 분석 워크패키지",
      ownerTeam: tickets[index].owner,
      status: "In Progress",
      dueDate: tickets[index].dueDate,
      logs: existingLogs,
      attachments: [],
    }

    tickets[index].workPackages.push(newWP)
    tickets[index].status = "In Progress"
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function reopenTicket(ticketId: string): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    tickets[index].status = "Open"
    tickets[index].closedDate = undefined
    // executiveSummary는 유지 (히스토리 참고용)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function addMessageToTicket(ticketId: string, message: Omit<TicketMessage, "id" | "timestamp">): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    const newMessage: TicketMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    if (!tickets[index].messages) {
      tickets[index].messages = []
    }

    tickets[index].messages.push(newMessage)

    if (message.messageType === "opinion") {
      tickets[index].hasUnreadNotification = true
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function markNotificationAsRead(ticketId: string): void {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)

  if (index !== -1) {
    tickets[index].hasUnreadNotification = false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function addInquiryToTicket(ticketId: string, content: string, author: string): void {
  addMessageToTicket(ticketId, {
    ticketId,
    author,
    role: "requester",
    messageType: "inquiry",
    content,
  })

  // 이벤트 상태를 다시 Open으로 변경
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)
  if (index !== -1) {
    tickets[index].status = "Open"
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}

export function sendOpinion(ticketId: string, summary: string, author: string, dataBoxes?: any[]): void {
  addMessageToTicket(ticketId, {
    ticketId,
    author,
    role: "assignee",
    messageType: "opinion",
    content: summary,
    dataBoxes,
  })

  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)
  if (index !== -1) {
    tickets[index].status = "In Progress"
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }
}
