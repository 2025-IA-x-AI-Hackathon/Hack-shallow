# Petppy

## 프로젝트 소개

[프로젝트 링크](https://shallow-mind.hyki.me)

반려견은 아파도 말하지 못합니다. 오히려 통증을 숨깁니다.

그래서 보호자가 알아차렸을 때는 이미 늦은 경우가 많습니다.

**Petppy**는 일상 대화 속 작은 신호들을 놓치지 않습니다.

"요즘 물을 많이 마시네요", "산책할 때 좀 느린 것 같아요"

이런 사소한 이야기가 조기 발견의 시작이 되고 반려견과 행복한 생활을 이어갈 수 있도록 만듭니다.


## 팀원 소개
| **[김민규 : 42seoul](https://github.com/kimminkyeu)** | **[송근일 : Codyssey](https://github.com/geun1)** | **[김강현 : 42seoul](https://github.com/kanghyki)** |
| :-: | :-: | :-: |
| <a href="https://github.com/kimminkyeu"><img src="https://avatars.githubusercontent.com/kimminkyeu" width=200px /> | <a href="https://github.com/geun1"><img src="https://avatars.githubusercontent.com/geun1" width=200px /> | <a href="https://github.com/kanghyki"><img src="https://avatars.githubusercontent.com/kanghyki" width=200px /> |
| 행동교정 에이전트, FE | 멀티 에이전트 설계, BE | 수의학 에이전트, DevOps |

## 배경

### 반려견의 증상 은폐와 조기 발견의 어려움

반려견은 야생의 생존 본능으로 통증을 숨기는 습성을 가지고 있습니다. ([헬스경향](https://www.k-health.com/news/articleView.html?idxno=66441), [팸타임즈](https://www.famtimes.co.kr/news/articleView.html?idxno=501641))

이 때문에 보호자가 반려견의 미세한 이상 징후를 포착하지 못해 치료 시기를 놓치는 문제가 발생합니다. 통증으로 괴로워하는 모습이 눈에 띈다면 이미 보이는 것보다 훨씬 심각한 상태일 가능성이 높습니다.

만약 미세한 이상 징후를 발견했다고 하더라도, 온라인 상의 파편화된 정보로 인해 정확한 판단이 불가능해 치료 시기를 놓치기도 합니다. 보호자는 인터넷 검색을 통해 정보를 수집하지만, 가장 신뢰할 수 있는 정보원인 수의사와의 소통 기회는 제한적입니다. ([데일리벳](https://www.dailyvet.co.kr/news/industry/187304))


## 문제

#### 조기 발견 실패로 인한 막대한 경제적 손실

##### 치료 시기를 놓치면 비용이 급증합니다

대표적인 소형견 질환인 슬개골 탈구의 경우, 조기에 발견하면 비수술적 관리나 간단한 수술로 해결할 수 있습니다. 하지만 발견이 늦어질수록 치료비가 기하급수적으로 증가합니다. ([펫놀자](https://petnolza.com/강아지-슬개골-탈구-증상과-진단-예방법-수술비용은/), [고양뉴스](https://goyangnews.co.kr/강아지-슬개골-탈구-증상과-뒷모습-14기별-수술비용까/))

**슬개골 탈구 단계별 치료비:**
- **1~2기 (조기)**: 10~150만원, 수술 성공률 100%
- **3기 (중기)**: 120~250만원, 재발률 11%
- **4기 (말기)**: 200~350만원 이상, 재수술 필요 36%

조기에 발견하면 **최대 300만원 이상을 절감**할 수 있으며, 합병증(십자인대 파열, 관절염)도 예방할 수 있습니다.

##### 주요 질병도 마찬가지입니다

신장질환의 경우 조기 관리 시 연간 20~50만원이면 충분하지만, 응급 상황으로 악화되면 100~300만원 이상이 소요됩니다. 특히 신장 조직은 재생이 불가능하기 때문에 조기 진단이 결정적으로 중요합니다. ([데일리벳](https://www.dailyvet.co.kr/news/academy/216990))

**2025년 기준 국내 반려동물 가구의 최근 2년간 평균 치료비는 103만원**으로, 이는 1년 전(58만원)에 비해 약 2배 가까이 증가했습니다. ([한국경제](https://www.hankyung.com/article/202510290541i))

#### 수의사-보호자 간 소통 부족 

보호자의 90%는 동물의료 서비스를 신뢰하지만, 진료 과정에서의 소통 부족 문제가 존재합니다. ([데일리벳](https://www.dailyvet.co.kr/news/practice/236991))

보호자는 "우리 아이의 상태가 어떠한지, 어떤 치료를 받는지, 예상 비용은 얼마인지, 우리 형편에 맞는 치료법은 무엇인지"를 수의사와 충분히 논의하고 싶어합니다. 하지만 제한된 진료 시간 안에 이 모든 것을 다루기는 어렵습니다.

##### 데이터 부재로 인한 문제

**보호자는:**
- 병원 방문 시 정확한 증상 설명이 어렵습니다
- 일상 속 미세한 변화를 기억하고 기록하기 어렵습니다
- 과거 증상과 현재 증상의 연관성을 파악하지 못합니다

**수의사는:**
- 제한된 시간 내에 충분한 병력을 청취하기 어렵습니다
- 보호자의 주관적 설명에만 의존해야 합니다
- 일상 데이터 부족으로 정확한 진단이 어렵습니다

반려동물 건강 관리는 다음과 같은 악순환 구조를 가지고 있습니다:

```
증상 은폐 → 조기 발견 실패 → 치료 시기 지연 → 치료비 급증 (연 100~300만원)
     ↑                                   ↓
데이터 부재 ← 소통 비효율 ← 정보 비대칭 ← 진단 정확도 저하
```

**핵심 문제:**
1. **증상 은폐**: 반려견의 본능으로 초기 징후 파악 불가
2. **데이터 부재**: 체계적인 건강 데이터 축적 시스템 없음
3. **정보 비대칭**: 수의사-보호자 간 효과적 소통 도구 부재
4. **접근성 한계**: 즉각적인 전문가 상담 어려움

## 해결책

우리는 **AI와의 일상 대화**를 통해 이 문제들을 해결합니다.

보호자가 AI와 자연스럽게 대화하는 과정에서:
- "오늘 산책할 때 평소보다 걸음이 느렸어요"
- "요즘 물을 많이 마시는 것 같아요"
- "어제부터 발을 자꾸 핥더라고요"

이런 사소한 이야기들이 **데이터로 축적**되고, 전문 AI 에이전트들이 이를 분석하여 **숨겨진 건강 시그널을 조기에 발견**합니다.

그리고 축적된 데이터를 바탕으로 수의사에게 **구조화된 리포트**를 제공하여:
- 병력 청취 시간을 단축하고
- 진단 정확도를 높이며
- 보호자와의 효과적인 소통을 돕습니다

**기대 효과:**
- 조기 발견으로 **연간 100~300만원** 치료비 절감
- 불필요한 응급 진료 방지로 **추가 비용 절감**
- 진료 효율성 향상 및 보호자 만족도 증대

## 주요 기능
- **4개의 전문 AI 에이전트**
  - 수의사 에이전트: AI-hub 수의사 데이터를 기반으로한 반려견의 건강과 질병에 대한 전문
  - 행동 전문가 에이전트: 반려견 행동 관련 논문 및 리서치 기반 반려동물 행동 분석 전문
  - 영양 전문가 에이전트: 반려견 영양학 관련 논문 및 리서치 기반 식단 및 영양 관리 전문
  - 보고서 생성 에이전트: 상담 내용 종합 리포트 생성 에이전트

- **실시간 채팅 인터페이스**
  - 자연어 기반 대화형 상담
  - 컨텍스트 유지 멀티턴 대화
  - 히스토리 기반 반려견 데이터 수집
  - 위험 감지를 위한 선제적 질문

- **리포트 생성**
  - Markdown 형식 리포트
  - PDF 다운로드 지원
  - 인지하기 어려운 위험 조기 감지 및 분석
  - 상담 내용 종합 분석

- **RAG (Retrieval-Augmented Generation)**
  - 에이전트 별 전문 벡터 데이터 저장
  - 벡터 기반 문서 검색
  - ChromaDB 활용
  - open AI embedding model 사용
  - 정확한 정보 제공


### AI 에이전트 플로우

<img width="916" height="465" alt="Screenshot 2025-11-02 at 14 35 46" src="https://github.com/user-attachments/assets/f374033c-17ea-48f6-a922-5dbe78dceb0c" />

### 개발환경

- `Ubuntu 24.04.3 LTS (GNU/Linux 6.14.0-33-generic x86_64)`
- `python@3.11`
- `Node@v20.17.0`
- `Docker version 28.2.2, build e6534b4`

### 기술 스택

#### Frontend
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MobX](https://img.shields.io/badge/MobX-6.15.0-FF9955?style=for-the-badge&logo=mobx&logoColor=white)

#### Backend
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.4-009688?style=for-the-badge&logo=fastapi&logoColor=white)\
![Uvicorn](https://img.shields.io/badge/Uvicorn-0.30.6-4051B5?style=for-the-badge&logo=uvicorn&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-2.9.2-E92063?style=for-the-badge&logo=pydantic&logoColor=white)

#### AI/ML
![LangChain](https://img.shields.io/badge/LangChain-0.3.27-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1.0.1-FF6B6B?style=for-the-badge)
![OpenAI](https://img.shields.io/badge/OpenAI-2.6.1-412991?style=for-the-badge&logo=openai&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5.18-FF6584?style=for-the-badge)

#### Database
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-FF6584?style=for-the-badge)

#### DevOps
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Docker Hub](https://img.shields.io/badge/Docker_Hub-2496ED?style=for-the-badge&logo=docker&logoColor=white)

#### Tools & Libraries
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)
