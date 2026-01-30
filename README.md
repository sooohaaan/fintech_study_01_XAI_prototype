# TrustFin - AI 기반 투명한 핀테크 서비스 (Prototype)

**TrustFin**은 금융 서비스의 불투명성(Blackbox)을 해결하기 위해 기획된 **'설명 가능한 AI(XAI) 대출 추천 서비스'** 프로토타입입니다. 
사용자의 데이터가 어떻게 분석되어 결과가 도출되었는지 시각적으로 설명하여 금융 소비자의 신뢰를 확보하는 것을 목표로 합니다.

## 🎨 프로젝트 컨셉 & 디자인
*   **Core Value**: Trust & Transparent (신뢰와 투명성)
*   **Theme Color**: 
    *   `Deep Blue (#1D4ED8)`: 금융의 신뢰감과 안정감
    *   `Electric Purple (#7C3AED)`: AI 분석 및 인사이트 강조 (Point)
*   **UX Strategy**: 복잡한 금융 데이터를 Progress Bar와 요약 리포트로 시각화

## 🛠 기술 스택 (Tech Stack)
*   **Frontend**: HTML5, CSS3
*   **Styling**: Tailwind CSS (CDN 방식) - 반응형 웹 구현
*   **Scripting**: Vanilla JavaScript (ES6+)
*   **Icons**: Lucide Icons
*   **Data Storage**: Browser LocalStorage (서버 없이 데이터 흐름 시뮬레이션)

## 📂 파일 구성 및 기능

### 1. `index.html` (입력)
*   연소득, 신용점수, 대출 목적, 고용 형태를 입력받습니다.
*   입력된 데이터는 `localStorage`에 저장되어 다음 단계로 전달됩니다.
*   Tailwind CSS를 활용한 깔끔한 폼 디자인과 유효성 검사가 적용되었습니다.

### 2. `recommendLogic.js` (로직)
*   가상의 은행 상품 데이터베이스(DB)를 포함하고 있습니다.
*   **매칭 알고리즘**: 사용자 입력값(신용점수, 소득 등)과 상품 특성(태그)을 비교하여 `Match Score`를 계산합니다.
*   소득 구간 및 신용 등급에 따른 금리/한도 보정 로직이 포함되어 있습니다.

### 3. `result.html` (결과)
*   계산된 매칭 점수 순으로 추천 상품 카드를 나열합니다.
*   가장 적합한 상품에는 `Best Match` 배지가 부착됩니다.
*   **CTA**: 'AI 분석 리포트 보기' 버튼을 통해 상세 페이지 유입을 유도합니다.

### 4. `xai_detail.html` (상세/XAI)
*   **투명성 확보**: 분석에 사용된 사용자 데이터를 상단에 요약 노출합니다.
*   **시각화**: 신용점수, 소득 안정성, 직군 적합도 등 3가지 요소의 기여도를 애니메이션 그래프로 보여줍니다.
*   **동적 코멘트**: 상황에 맞는 AI 종합 의견 텍스트를 자동 생성합니다.

## 🚀 실행 방법 (How to Run)

이 프로젝트는 별도의 Node.js 설치나 빌드 과정이 필요 없습니다.

1.  이 저장소를 클론(Clone)하거나 다운로드합니다.
2.  **VS Code**에서 폴더를 엽니다.
3.  `Live Server` 확장 프로그램을 설치합니다.
4.  `index.html` 파일에서 우클릭 후 **"Open with Live Server"**를 선택합니다.
5.  브라우저에서 데이터 입력 후 전체 흐름을 체험합니다.

## 🔍 주요 구현 포인트 (Code Highlights)
*   **데이터 흐름**: `index.html` -> `localStorage` -> `recommendLogic.js` -> `result.html` -> `xai_detail.html`로 이어지는 데이터 파이프라인 구축.
*   **XAI 시각화**: CSS Transition과 JS `setInterval`을 활용하여 분석 결과가 실시간으로 계산되는 듯한 UX 구현.
*   **반응형 디자인**: 모바일(Mobile) 환경을 최우선으로 고려한 UI 배치.

---
*Created by Gemini Code Assist & 5-Year Web3 Planner*
