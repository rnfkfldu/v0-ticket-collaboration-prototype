import type { TicketCategoryField } from "./types"

export const TICKET_CATEGORY_TEMPLATES: Record<string, TicketCategoryField[]> = {
  Trouble: [
    {
      label: "문제 현상",
      placeholder: "어떤 문제가 발생했는지 구체적으로 기술해주세요...",
      required: true,
    },
    {
      label: "원인 파악",
      placeholder: "문제의 근본 원인을 분석해주세요...",
      required: true,
    },
    {
      label: "원인 분석",
      placeholder: "왜 이런 원인이 발생했는지 상세히 분석해주세요...",
      required: true,
    },
    {
      label: "해결 방안",
      placeholder: "문제를 어떻게 해결했는지 설명해주세요...",
      required: true,
    },
    {
      label: "결과 확인",
      placeholder: "해결 후 결과를 확인하고 기록해주세요...",
      required: true,
    },
  ],
  Improvement: [
    {
      label: "개선 아이디어",
      placeholder: "어떤 개선을 제안하는지 설명해주세요...",
      required: true,
    },
    {
      label: "아이디어 검증",
      placeholder: "제안한 아이디어의 타당성을 검증해주세요...",
      required: true,
    },
    {
      label: "경제성 평가",
      placeholder: "비용 대비 효과를 분석해주세요...",
      required: true,
    },
    {
      label: "테스트 계획",
      placeholder: "어떻게 테스트할 것인지 계획을 작성해주세요...",
      required: false,
    },
    {
      label: "실행 결과",
      placeholder: "개선 사항을 적용한 결과를 기록해주세요...",
      required: true,
    },
  ],
  Change: [
    {
      label: "변경 요청 내용",
      placeholder: "어떤 변경이 필요한지 설명해주세요...",
      required: true,
    },
    {
      label: "변경 사유",
      placeholder: "왜 이 변경이 필요한지 설명해주세요...",
      required: true,
    },
    {
      label: "영향 분석",
      placeholder: "변경이 다른 시스템에 미칠 영향을 분석해주세요...",
      required: true,
    },
    {
      label: "변경 계획",
      placeholder: "변경을 어떻게 진행할 것인지 계획을 작성해주세요...",
      required: true,
    },
    {
      label: "변경 완료 확인",
      placeholder: "변경 사항이 정상적으로 적용되었는지 확인해주세요...",
      required: true,
    },
  ],
  Analysis: [
    {
      label: "분석 목적",
      placeholder: "무엇을 분석하려는지 명확히 설명해주세요...",
      required: true,
    },
    {
      label: "데이터 수집",
      placeholder: "어떤 데이터를 수집했는지 기록해주세요...",
      required: true,
    },
    {
      label: "분석 방법",
      placeholder: "어떤 방법으로 분석했는지 설명해주세요...",
      required: true,
    },
    {
      label: "분석 결과",
      placeholder: "분석을 통해 발견한 내용을 기록해주세요...",
      required: true,
    },
    {
      label: "결론 및 제안",
      placeholder: "분석 결과를 바탕으로 한 결론과 제안사항을 작성해주세요...",
      required: true,
    },
  ],
}

export function getTemplateForCategory(category: string): TicketCategoryField[] {
  return TICKET_CATEGORY_TEMPLATES[category] || []
}
