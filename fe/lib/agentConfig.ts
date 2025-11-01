export interface AgentConfig {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const AGENTS: Record<string, AgentConfig> = {
  veterinary: {
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
