/**
 * RecommendLogic.js
 * 사용자 데이터를 기반으로 대출 상품 추천 및 매칭 점수 계산
 */

// 1. 가상의 은행 상품 데이터베이스
const loanProducts = [
    {
        id: 'p1',
        bankName: '우리은행',
        productName: 'WON 직장인 대출',
        baseRate: 4.5,
        limitFactor: 1.2, // 연소득 대비 한도 비율
        minCredit: 600,
        tags: ['1금융권', '직장인우대'],
        dsrRegulated: true
    },
    {
        id: 'p2',
        bankName: '카카오뱅크',
        productName: '비상금 대출',
        baseRate: 5.1,
        limitFactor: 0.8,
        minCredit: 500,
        tags: ['모바일전용', '간편심사'],
        dsrRegulated: false // 소액 비상금 대출은 DSR 예외
    },
    {
        id: 'p3',
        bankName: '토스뱅크',
        productName: '사장님 대출',
        baseRate: 5.5,
        limitFactor: 1.5,
        minCredit: 550,
        tags: ['사업자전용', '높은한도'],
        dsrRegulated: false // 사업자 대출은 가계대출 DSR 규제 제외
    },
    {
        id: 'p4',
        bankName: '현대캐피탈',
        productName: '신용대출',
        baseRate: 8.9,
        limitFactor: 2.0,
        minCredit: 400,
        tags: ['당일입금', '넉넉한한도'],
        dsrRegulated: true
    },
    {
        id: 'p5',
        bankName: '국민은행',
        productName: 'KB 주택담보대출',
        baseRate: 3.8,
        limitFactor: 4.5, // 주택담보대출은 한도가 높음
        minCredit: 650,
        tags: ['1금융권', '주택자금', '저금리'],
        dsrRegulated: true
    },
    {
        id: 'p6',
        bankName: '신한은행',
        productName: '쏠편한 자동차대출',
        baseRate: 4.9,
        limitFactor: 1.5,
        minCredit: 600,
        tags: ['자동차', '신차/중고차', '모바일전용'],
        dsrRegulated: true
    },
    {
        id: 'p7',
        bankName: '하나은행',
        productName: '청년 전세자금대출',
        baseRate: 3.5,
        limitFactor: 3.0,
        minCredit: 500,
        tags: ['청년우대', '전세자금', '정부지원'],
        dsrRegulated: true
    }
];

// 2. 매칭 점수 계산 알고리즘 (핵심 로직)
function calculateMatchScore(user, product) {
    let score = 70; // 기본 점수
    let contributions = []; // LIME: 각 요인이 점수에 미친 영향 기록
    let counterfactuals = []; // Counterfactual: 점수를 올리기 위한 제안

    // 신용점수 가중치 (+/- 20점)
    if (user.creditScore >= product.minCredit + 200) {
        score += 20;
        contributions.push({ factor: '신용점수', value: 20, desc: '안정적인 신용점수' });
    } else if (user.creditScore >= product.minCredit + 100) {
        score += 10;
        contributions.push({ factor: '신용점수', value: 10, desc: '양호한 신용점수' });
        // 반사실적 설명: 점수가 조금 더 높았다면?
        counterfactuals.push({
            type: 'tip',
            text: `신용점수를 ${product.minCredit + 200 - user.creditScore}점 더 올리면 매칭 점수가 대폭 상승해요.`,
            action: 'credit_tip',
            label: '점수 올리기 팁'
        });
    } else if (user.creditScore < product.minCredit) {
        score -= 30; // 자격 미달 시 대폭 감점
        contributions.push({ factor: '신용점수', value: -30, desc: '기준 점수 미달' });
    }

    // 소득 대비 금리 적합성 (가상 로직)
    // 소득이 높을수록 저금리 상품에 높은 점수
    if (user.income > 5000 && product.baseRate < 5.0) {
        score += 10;
        contributions.push({ factor: '소득', value: 10, desc: '고소득 우대' });
    }

    // [New] 자산 규모 평가
    if (user.totalAssets) {
        if (user.totalAssets >= 100000000) { // 1억 이상
            score += 10;
            contributions.push({ factor: '자산', value: 10, desc: '우수한 자산 건전성' });
        } else if (user.totalAssets >= 30000000) { // 3천만원 이상
            score += 5;
            contributions.push({ factor: '자산', value: 5, desc: '안정적인 보유 자산' });
        }
    }

    // [XAI 핵심] 고용 형태 및 잠재력 평가
    if (user.employmentType === 'business_owner' && product.tags.includes('사업자전용')) {
        score += 15;
        contributions.push({ factor: '직업', value: 15, desc: '사업자 전용 상품' });
    }
    
    // 사회초년생(Persona 1) 케이스: 신용점수는 낮지만 정규직인 경우 AI 가산점 부여
    if (user.employmentType === 'regular') {
        if (product.tags.includes('직장인우대')) {
            score += 15;
            contributions.push({ factor: '직업', value: 15, desc: '직장인 우대' });
        }
        
        // 신용점수가 750점 미만이어도 정규직이면 '미래 소득 잠재력'을 인정하여 추가 점수
        if (user.creditScore < 750) {
            score += 10; 
            contributions.push({ factor: 'AI 분석', value: 10, desc: '미래 소득 잠재력 인정' });
            counterfactuals.push({
                type: 'tip',
                text: '급여 이체 실적을 해당 은행으로 변경하면 우대 금리를 받을 수 있어요.',
                action: 'salary_transfer',
                label: '계좌 변경 안내'
            });
        }
    }

    // 대출 목적에 따른 가중치
    if (user.loanPurpose) {
        let purposeScore = 0;
        if (user.loanPurpose === 'living' && (product.tags.includes('간편심사') || product.tags.includes('당일입금') || product.tags.includes('모바일전용'))) purposeScore = 10;
        if (user.loanPurpose === 'refinance' && (product.tags.includes('1금융권') || product.baseRate < 5.0)) purposeScore = 10;
        
        // 주택자금: 한도가 높은 상품에 가산점
        if (user.loanPurpose === 'housing') {
            if (product.tags.includes('주택자금') || product.tags.includes('전세자금') || product.tags.includes('높은한도') || product.limitFactor >= 2.5) {
                purposeScore = 10;
            }
        }
        
        if (user.loanPurpose === 'business' && product.tags.includes('사업자전용')) purposeScore = 10;
        
        if (purposeScore > 0) {
            score += purposeScore;
            contributions.push({ factor: '대출목적', value: purposeScore, desc: '목적 적합성 우수' });
        }
        
        if (user.loanPurpose === 'refinance') {
             counterfactuals.push({
                type: 'tip',
                text: '기존 고금리 대출을 먼저 상환하면 한도가 늘어날 수 있어요.',
                action: 'repay_sim',
                label: '상환 시뮬레이션'
            });
        }
    }

    // [New] DSR 규제 적용 여부에 따른 평가 (상품 속성 기반)
    // DSR(총부채원리금상환비율) 활용 (페르소나 데이터 사용, 없으면 추정)
    const currentDSR = user.dsr !== undefined ? user.dsr : Math.max(10, (1000 - user.creditScore) / 10);

    if (product.dsrRegulated) {
        // 규제 적용 상품인 경우: DSR이 낮아야 유리
        if (currentDSR < 40) {
            score += 5;
            contributions.push({ factor: 'DSR', value: 5, desc: '여유 있는 상환 여력' });
        } else if (currentDSR >= 40 && currentDSR < 70) {
            score -= 5;
            contributions.push({ factor: 'DSR', value: -5, desc: 'DSR 규제 한도 주의' });
            counterfactuals.push({
                type: 'tip',
                text: 'DSR이 40%를 초과하여 한도가 제한될 수 있습니다. 부채 관리가 필요합니다.',
                action: 'dsr_calc',
                label: 'DSR 관리 팁'
            });
        } else if (currentDSR >= 70) {
            score -= 15; // 규제 한도 초과 위험 시 감점 폭 확대
            contributions.push({ factor: 'DSR', value: -15, desc: 'DSR 규제 한도 초과 위험' });
            counterfactuals.push({
                type: 'tip',
                text: '현재 부채 수준이 높아 DSR 규제 미적용 상품이나 소액 대출을 고려해보세요.',
                action: 'dsr_calc',
                label: 'DSR 계산기'
            });
        }
    } else {
        // 규제 미적용 상품인 경우 (예: 소액, 사업자): DSR이 높아도 감점 없음 + 오히려 추천
        if (currentDSR > 60) {
            score += 10;
            contributions.push({ factor: '규제 미적용', value: 10, desc: 'DSR 규제 예외 상품' });
        }
    }

    // [New] AI 미션 제안 (구체적인 목표 제시) - 사용자 상황별 동적 생성
    if (user.creditScore < 950) {
        let autoSubMissions = [];
        let missionText = '신용점수와 소득 안정성을 높여 더 좋은 조건에 도전해보세요.';

        // 1. 신용점수 구간별 미션 (기초 체력)
        if (user.creditScore <= 650) {
             autoSubMissions.push({ id: 'auto_credit_1', text: '단기 연체 절대 금지 (10만원 이상, 5영업일)', status: 'ready', tracking: { key: 'delinquency', operator: 'eq', value: 0 } });
             autoSubMissions.push({ id: 'auto_credit_2', text: '현금서비스/카드론 사용 자제하기', status: 'ready' });
        } else if (user.creditScore <= 850) {
             autoSubMissions.push({ id: 'auto_credit_1', text: '신용카드 한도 대비 30% 이내로 사용하기', status: 'ready', tracking: { key: 'cardUsageRate', operator: 'lte', value: 30 } });
             autoSubMissions.push({ id: 'auto_credit_2', text: '오래된 신용카드 해지하지 않고 유지하기', status: 'ready' });
        }

        // 2. 직업/소득 형태별 미션 (소득 증빙)
        if (user.employmentType === 'business_owner') {
            autoSubMissions.push({ id: 'auto_job_1', text: '사업자 주거래 통장 매출 입금 실적 늘리기', status: 'ready' });
            autoSubMissions.push({ id: 'auto_job_2', text: '세금(부가세/종소세) 체납 내역 확인 및 정리', status: 'ready' });
        } else if (user.employmentType === 'regular') {
            autoSubMissions.push({ id: 'auto_job_1', text: '주거래 은행으로 급여 이체 통합하기', status: 'ready', tracking: { key: 'salaryTransfer', operator: 'eq', value: true } });
            if (user.income < 3500) {
                 autoSubMissions.push({ id: 'auto_job_2', text: '청년 도약 계좌 등 정책 금융 상품 가입', status: 'ready' });
            } else {
                 autoSubMissions.push({ id: 'auto_job_2', text: '마이데이터로 흩어진 자산 연결하여 신용점수 가점받기', status: 'ready' });
            }
        } else { // Freelancer or Unemployed
            autoSubMissions.push({ id: 'auto_job_1', text: '통신비/공과금 성실 납부 내역 등록 (비금융정보)', status: 'ready' });
            autoSubMissions.push({ id: 'auto_job_2', text: '지역가입자 건강보험료 성실 납부 인증', status: 'ready' });
        }

        // 3. DSR/부채 상황별 미션 (리스크 관리) - 우선순위 높음
        if (currentDSR > 50) {
            missionText = 'DSR(총부채원리금상환비율) 관리가 시급합니다. 부채 다이어트를 시작하세요.';
            // DSR 위험군은 부채 상환 미션을 최우선으로 배치
            const dsrMissions = [
                { id: 'auto_dsr_1', text: '고금리 소액 대출(리볼빙, 현금서비스) 우선 상환', status: 'ready', tracking: { key: 'highInterestLoan', operator: 'eq', value: 0 } },
                { id: 'auto_dsr_2', text: '마이너스 통장 한도 줄이기 (미사용 한도도 부채 포함)', status: 'ready', tracking: { key: 'minusLimit', operator: 'lte', value: 0 } }
            ];
            autoSubMissions = [...dsrMissions, ...autoSubMissions];
        } else if (currentDSR > 30) {
             missionText = '부채 비율을 조금 더 낮추면 한도가 늘어날 수 있습니다.';
             autoSubMissions.push({ id: 'auto_dsr_3', text: '여유 자금으로 원금 일부 중도 상환하기', status: 'ready', tracking: { key: 'dsr', operator: 'lte', value: 30 } });
        }

        // 4. 대출 목적별 특화 미션
        if (user.loanPurpose === 'housing') {
             autoSubMissions.push({ id: 'auto_purpose_1', text: '주택청약종합저축 납입 횟수/금액 늘리기', status: 'ready' });
        } else if (user.loanPurpose === 'business') {
             autoSubMissions.push({ id: 'auto_purpose_1', text: '노란우산공제 가입으로 소득공제/압류방지 준비', status: 'ready' });
        }

        // 중복 제거 (텍스트 기준) 및 최대 3개 제한
        const uniqueMissions = [];
        const seenTexts = new Set();
        for (const m of autoSubMissions) {
            if (!seenTexts.has(m.text)) {
                seenTexts.add(m.text);
                uniqueMissions.push(m);
            }
        }
        autoSubMissions = uniqueMissions.slice(0, 3);

         counterfactuals.push({
            type: 'mission',
            text: missionText,
            action: 'mission_challenge',
            label: '미션 도전하기',
            subMissions: autoSubMissions
        });
    }

    // 점수 보정 (0 ~ 99점 사이로 제한)
    const finalScore = Math.min(Math.max(score, 10), 99);
    
    return {
        score: finalScore,
        contributions,
        counterfactuals
    };
}

// 3. 실행 함수
function getRecommendations() {
    // LocalStorage에서 데이터 가져오기
    const storedData = localStorage.getItem('trustFinUserData');
    if (!storedData) return [];

    const user = JSON.parse(storedData);
    const income = parseInt(user.income);
    const creditScore = parseInt(user.creditScore);

    // 자산 정보 및 포인트 가져오기 (페르소나 데이터 활용)
    let totalAssets = 0;
    let userPoints = 0;
    let userDsr = user.dsr || 0;

    const personaData = localStorage.getItem('trustFinPersona');
    if (personaData) {
        const persona = JSON.parse(personaData);
        if (persona.accounts) {
            totalAssets = persona.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        }
        userPoints = persona.points || 0;
        if (!user.dsr && persona.dsr !== undefined) {
            userDsr = persona.dsr;
        }
    }

    // 각 상품별 계산 수행
    const results = loanProducts.map(product => {
        const analysis = calculateMatchScore({ ...user, income, creditScore, totalAssets, dsr: userDsr }, product);
        
        // 예상 금리 및 한도 (단순 시뮬레이션)
        // 신용점수가 높을수록 금리 인하
        let rateDiscount = (creditScore - 600) * 0.005;
        
        // [XAI 핵심] AI 분석에 의한 추가 금리 할인 (사회초년생 우대)
        if (user.employmentType === 'regular' && creditScore < 750) {
            rateDiscount += 0.5; // 0.5%p 추가 할인
        }

        // [New] 레벨에 따른 추가 혜택 (금리 할인)
        const levelInfo = calculateLevel(userPoints);
        if (levelInfo.level > 1) {
            const levelDiscount = (levelInfo.level - 1) * 0.1; // 레벨당 0.1%p 추가 할인
            rateDiscount += levelDiscount;
            
            // XAI 분석 결과에 혜택 요인 추가
            analysis.contributions.push({ 
                factor: '멤버십', 
                value: 5 * (levelInfo.level - 1), 
                desc: `Lv.${levelInfo.level} 우대 금리 적용` 
            });
            // 매칭 점수 보너스
            analysis.score += 2 * (levelInfo.level - 1);
        }

        const finalRate = (product.baseRate - rateDiscount).toFixed(2);
        
        // [Upgrade] 한도 계산 로직 고도화 (DSR 반영)
        // 1. LTI (Loan To Income) 기준 한도
        let limitByIncome = Math.floor(income * product.limitFactor);

        // 2. DSR (Debt Service Ratio) 기준 한도
        let limitByDSR = Infinity;
        
        if (product.dsrRegulated) {
            const maxDSR = 40; // 1금융권 표준 DSR 40%
            const availableDSR = Math.max(0, maxDSR - userDsr);
            
            if (availableDSR > 0) {
                // 가용 연간 원리금 상환액 = 연소득 * (가용 DSR / 100)
                const availableAnnualRepayment = income * (availableDSR / 100);
                
                // 신용대출 DSR 산정 시 만기 5년 가정 (금융당국 표준)
                // 연간 상환액 ≈ 대출금 * (1/5 + 이자율)
                // 대출금 ≈ 연간 상환액 / (0.2 + 이자율)
                const estimatedAnnualRate = parseFloat(finalRate) / 100;
                limitByDSR = Math.floor(availableAnnualRepayment / (0.2 + estimatedAnnualRate));
            } else {
                limitByDSR = 0; // DSR 한도 초과
            }
        }

        // 최종 한도는 두 기준 중 작은 값 적용
        let finalLimit = Math.min(limitByIncome, limitByDSR);
        
        // 100만원 단위로 절사 (깔끔한 금액 표시)
        if (finalLimit > 100) {
            finalLimit = Math.floor(finalLimit / 100) * 100;
        }

        return {
            ...product,
            matchScore: Math.min(analysis.score, 99), // 점수 상한 99점
            contributions: analysis.contributions,
            counterfactuals: analysis.counterfactuals,
            finalRate: Math.max(finalRate, 3.0), // 최소 금리 3.0% 제한
            finalLimit
        };
    });

    // 매칭 점수 높은 순 정렬
    return results.sort((a, b) => b.matchScore - a.matchScore);
}

// 5. 맞춤형 미션 생성 (사용자 피드백 기반)
function getTailoredMission(user, intent) {
    const purpose = user.loanPurpose || 'living';
    let mission = null;

    if (intent === 'limit') {
        // 한도 상향 니즈
        if (purpose === 'housing') {
            mission = { 
                type: 'mission', 
                text: '주택 담보 가치 인정 범위 내에서 한도를 높이기 위해 소득 증빙을 강화해보세요.', 
                action: 'mission_challenge', 
                label: '주택 자금 한도 상향',
                subMissions: [
                    { text: '국세청 소득금액증명원 발급', status: 'ready' },
                    { text: '주거래 은행 입출금 내역서 준비', status: 'ready' },
                    { text: '기존 담보 대출 상환 조건 확인', status: 'ready' }
                ]
            };
        } else if (purpose === 'business') {
            mission = { 
                type: 'mission', 
                text: '매출 증빙 자료를 보완하여 사업자 대출 한도를 높여보세요.', 
                action: 'mission_challenge', 
                label: '사업 자금 한도 상향',
                subMissions: [
                    { text: '부가세 과세표준증명원 발급', status: 'ready' },
                    { text: '사업자 통장 주거래 실적 쌓기', status: 'ready' },
                    { text: '노란우산공제 가입 내역 확인', status: 'ready' }
                ]
            };
        } else {
            const targetScore = Math.min(user.creditScore + 30, 1000);
            mission = {
                type: 'mission',
                text: `신용점수를 ${targetScore}점까지 올리고 부채를 줄여 신용대출 한도를 높여보세요.`,
                action: 'mission_challenge',
                label: '신용대출 한도 상향',
                subMissions: [
                    { text: 'KCB/NICE 신용점수 상세 조회', status: 'ready', tracking: { key: 'checkedCredit', operator: 'eq', value: true } },
                    { text: '비금융 정보(통신비 등) 납부내역 등록', status: 'ready' },
                    { text: '오래된 신용카드 한도 상향(사용률↓)', status: 'ready', tracking: { key: 'cardUsageRate', operator: 'lte', value: 30 } }
                ]
            };
        }
    } else if (intent === 'rate') {
        // 금리 인하 니즈
        if (purpose === 'refinance') {
            mission = { 
                type: 'mission', 
                text: '성실 상환 이력을 쌓아 대환 대출 전용 우대 금리를 적용받아보세요.', 
                action: 'mission_challenge', 
                label: '대환 대출 금리 인하',
                subMissions: [
                    { text: '기존 대출 6개월 이상 성실 상환', status: 'ready', tracking: { key: 'delinquency', operator: 'eq', value: 0 } },
                    { text: '마이데이터로 타행 대출 연결', status: 'ready' },
                    { text: '금리인하요구권 가능 여부 조회', status: 'ready' }
                ]
            };
        } else if (purpose === 'housing') {
            mission = { 
                type: 'mission', 
                text: '거래 실적을 쌓아 주택 담보 대출 금리 우대를 받아보세요.', 
                action: 'mission_challenge', 
                label: '주택 대출 금리 인하',
                subMissions: [
                    { text: '급여 이체 계좌 변경', status: 'ready' },
                    { text: '주택청약종합저축 월 10만원 납입', status: 'ready' },
                    { text: '신용카드 월 30만원 이상 사용', status: 'ready', tracking: { key: 'cardUsageRate', operator: 'gte', value: 10 } }
                ]
            };
        } else {
            mission = {
                type: 'mission',
                text: `마이데이터로 자산 건전성을 입증하고 우대 금리 조건을 달성해보세요.`,
                action: 'mission_challenge',
                label: '우대 금리 도전',
                subMissions: [
                    { text: '오픈뱅킹으로 전 계좌 연결', status: 'ready', tracking: { key: 'openBanking', operator: 'eq', value: true } },
                    { text: '공과금 자동이체 3건 등록', status: 'ready' },
                    { text: 'TrustFin 멤버십 등급 확인', status: 'ready', tracking: { key: 'checkedMembership', operator: 'eq', value: true } }
                ]
            };
        }
    } else if (intent === 'period') {
        // 기간 연장 니즈
        if (purpose === 'business') {
            mission = { 
                type: 'mission', 
                text: '사업 지속성을 입증하여 대출 만기 연장을 준비하세요.', 
                action: 'mission_challenge', 
                label: '사업 대출 기간 연장',
                subMissions: [
                    { text: '사업자 등록 상태 확인', status: 'ready' },
                    { text: '최근 3개월 매출 내역 증빙', status: 'ready' },
                    { text: '국세/지방세 완납 증명', status: 'ready' }
                ]
            };
        } else {
            mission = {
                type: 'mission',
                text: `신용도를 유지하고 연체 없는 금융 생활로 대출 만기 연장 심사를 통과하세요.`,
                action: 'mission_challenge',
                label: '대출 기간 연장',
                subMissions: [
                    { text: '최근 1년간 연체 이력 확인', status: 'ready' },
                    { text: '만기 1개월 전 알림 설정', status: 'ready' },
                    { text: '소득 변동 사항 업데이트', status: 'ready' }
                ]
            };
        }
    } else if (intent === 'method') {
        // 상환 방식 변경 니즈
        if (purpose === 'housing') {
            mission = { 
                type: 'mission', 
                text: '거치 기간 활용이나 상환 방식 변경을 위해 신용도를 관리하세요.', 
                action: 'mission_challenge', 
                label: '주택 대출 상환 관리',
                subMissions: [
                    { text: '거치 기간 연장 가능 여부 상담', status: 'ready' },
                    { text: '상환 방식별 월 납입금 비교', status: 'ready' },
                    { text: '중도상환수수료 면제 확인', status: 'ready' }
                ]
            };
        } else {
            mission = {
                type: 'mission',
                text: `안정적인 소득 흐름을 입증하여 상환 방식을 변경해보세요.`,
                action: 'mission_challenge',
                label: '상환 방식 변경',
                subMissions: [
                    { text: '재직 증명서 최신화', status: 'ready' },
                    { text: '건강보험자격득실확인서 발급', status: 'ready' },
                    { text: '예상 상환 스케줄 시뮬레이션', status: 'ready' }
                ]
            };
        }
    }

    // 세부 미션에 고유 ID 부여
    if (mission && mission.subMissions) {
        mission.subMissions = mission.subMissions.map((sub, idx) => ({
            id: `sub_${Date.now()}_${idx}`,
            ...sub
        }));
    }

    return mission;
}

// 6. 미션 보상 포인트 계산 (난이도 및 페르소나 상황 반영)
function calculateMissionRewards(mission, persona) {
    let difficulty = 1.0;
    
    // 퍼소나 상황에 따른 난이도 가중치 계산
    if (mission.title.includes('신용')) {
        const score = persona.creditScore || 0;
        if (score < 650) difficulty += 0.5; // 저신용자: 개선 난이도/필요성 높음
        else if (score > 900) difficulty += 0.2; // 고신용자: 추가 상승 난이도
    }
    
    if (mission.title.includes('대출') || mission.title.includes('상환') || mission.title.includes('부채')) {
        const dsr = persona.dsr || 0;
        if (dsr > 40) difficulty += 0.4; // 고부채: 관리 난이도 높음
    }
    
    if (mission.title.includes('주택') || mission.title.includes('자산')) {
        const income = persona.income || 0;
        if (income < 3500) difficulty += 0.3; // 자산 형성 노력 가중치
    }

    // 기본 포인트 설정
    const baseSubPoint = 100;
    const baseFinalPoint = 300;
    
    const subPoint = Math.round(baseSubPoint * difficulty / 10) * 10;
    const finalPoint = Math.round(baseFinalPoint * difficulty / 10) * 10;
    
    return { subPoint, finalPoint, isHighReward: difficulty >= 1.3 };
}

// 7. 레벨 및 목표 포인트 계산 (3,000P 단위)
function calculateLevel(currentPoints) {
    const LEVEL_UNIT = 3000;
    const MAX_LEVEL = 5; // [New] 최대 레벨 제한 (현실적인 금리 할인 한도 고려)

    // 현재 레벨 계산 (1부터 시작)
    let calculatedLevel = Math.floor(currentPoints / LEVEL_UNIT) + 1;
    
    // 최대 레벨 캡 적용
    const level = Math.min(calculatedLevel, MAX_LEVEL);
    
    // 다음 목표 포인트 (UI 표시용: 만렙이어도 포인트 바는 계속 차오르도록 계산)
    const nextGoal = (Math.floor(currentPoints / LEVEL_UNIT) + 1) * LEVEL_UNIT;
    
    return { level, nextGoal, unit: LEVEL_UNIT, isMax: level === MAX_LEVEL };
}
