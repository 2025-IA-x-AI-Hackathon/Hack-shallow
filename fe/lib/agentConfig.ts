export interface AgentConfig {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const AGENTS: Record<string, AgentConfig> = {
  veterinarian: {
    name: '수의학 전문가',
    icon: '🩺',
    color: 'blue',
    description: '반려견의 건강과 질병에 대한 전문 지식',
  },
  behavior: {
    name: '행동 교정 전문가',
    icon: '🐕',
    color: 'green',
    description: '반려견의 행동 패턴과 교정 방법',
  },
  nutrition: {
    name: '영양 전문가',
    icon: '🍖',
    color: 'orange',
    description: '반려견의 영양과 식단 관리',
  },
  report: {
    name: '보고서 전문가',
    icon: '📊',
    color: 'purple',
    description: '건강 데이터 요약 및 보고서 작성',
  },
  general: {
    name: '일반 상담',
    icon: '💬',
    color: 'gray',
    description: '일반적인 반려견 케어 상담',
  },
};

export const getAgentConfig = (agentType: string | null): AgentConfig => {
  if (!agentType) {
    return AGENTS.general;
  }
  return AGENTS[agentType] || AGENTS.general;
};

// Tailwind color class mappings for agents
export interface AgentColorClasses {
  border: string;
  bg: string;
  text: string;
}

const COLOR_MAPPINGS: Record<string, AgentColorClasses> = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
  gray: {
    border: 'border-gray-500',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
  },
};

export const getAgentColorClasses = (color: string): AgentColorClasses => {
  return COLOR_MAPPINGS[color] || COLOR_MAPPINGS.gray;
};
