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

    // [New] AI 미션 제안 (구체적인 목표 제시)
    if (user.creditScore < 950) {
         counterfactuals.push({
            type: 'mission',
            text: '2달 안에 신용점수 60점과 소득 안정성 17%를 높여 대출 한도가 지금 보다 2,000만원 높은 상품에 도전해보세요.',
            action: 'mission_challenge',
            label: '미션 도전하기'
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

    // 자산 정보 가져오기 (페르소나 데이터 활용)
    let totalAssets = 0;
    const personaData = localStorage.getItem('trustFinPersona');
    if (personaData) {
        const persona = JSON.parse(personaData);
        if (persona.accounts) {
            totalAssets = persona.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        }
    }

    // 각 상품별 계산 수행
    const results = loanProducts.map(product => {
        const analysis = calculateMatchScore({ ...user, income, creditScore, totalAssets }, product);
        
        // 예상 금리 및 한도 (단순 시뮬레이션)
        // 신용점수가 높을수록 금리 인하
        let rateDiscount = (creditScore - 600) * 0.005;
        
        // [XAI 핵심] AI 분석에 의한 추가 금리 할인 (사회초년생 우대)
        if (user.employmentType === 'regular' && creditScore < 750) {
            rateDiscount += 0.5; // 0.5%p 추가 할인
        }
        const finalRate = (product.baseRate - rateDiscount).toFixed(2);
        const finalLimit = Math.floor(income * product.limitFactor);

        return {
            ...product,
            matchScore: analysis.score,
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

    if (intent === 'limit') {
        // 한도 상향 니즈
        if (purpose === 'housing') return { type: 'mission', text: '주택 담보 가치 인정 범위 내에서 한도를 높이기 위해 소득 증빙을 강화해보세요.', action: 'mission_challenge', label: '주택 자금 한도 상향' };
        if (purpose === 'business') return { type: 'mission', text: '매출 증빙 자료를 보완하여 사업자 대출 한도를 높여보세요.', action: 'mission_challenge', label: '사업 자금 한도 상향' };
        
        const targetScore = Math.min(user.creditScore + 30, 1000);
        return {
            type: 'mission',
            text: `신용점수를 ${targetScore}점까지 올리고 부채를 줄여 신용대출 한도를 높여보세요.`,
            action: 'mission_challenge',
            label: '신용대출 한도 상향'
        };
    } else if (intent === 'rate') {
        // 금리 인하 니즈
        if (purpose === 'refinance') return { type: 'mission', text: '성실 상환 이력을 쌓아 대환 대출 전용 우대 금리를 적용받아보세요.', action: 'mission_challenge', label: '대환 대출 금리 인하' };
        if (purpose === 'housing') return { type: 'mission', text: '거래 실적을 쌓아 주택 담보 대출 금리 우대를 받아보세요.', action: 'mission_challenge', label: '주택 대출 금리 인하' };
        
        return {
            type: 'mission',
            text: `마이데이터로 자산 건전성을 입증하고 우대 금리 조건을 달성해보세요.`,
            action: 'mission_challenge',
            label: '우대 금리 도전'
        };
    } else if (intent === 'period') {
        // 기간 연장 니즈
        if (purpose === 'business') return { type: 'mission', text: '사업 지속성을 입증하여 대출 만기 연장을 준비하세요.', action: 'mission_challenge', label: '사업 대출 기간 연장' };
        return {
            type: 'mission',
            text: `신용도를 유지하고 연체 없는 금융 생활로 대출 만기 연장 심사를 통과하세요.`,
            action: 'mission_challenge',
            label: '대출 기간 연장'
        };
    } else if (intent === 'method') {
        // 상환 방식 변경 니즈
        if (purpose === 'housing') return { type: 'mission', text: '거치 기간 활용이나 상환 방식 변경을 위해 신용도를 관리하세요.', action: 'mission_challenge', label: '주택 대출 상환 관리' };
        return {
            type: 'mission',
            text: `안정적인 소득 흐름을 입증하여 상환 방식을 변경해보세요.`,
            action: 'mission_challenge',
            label: '상환 방식 변경'
        };
    }
    return null;
}

// 4. 대출 신청 및 알림 시스템
const ApplicationManager = {
    // 대출 신청 (시뮬레이션)
    applyProduct: function(productId) {
        const product = loanProducts.find(p => p.id === productId);
        if (!product) return;

        console.log(`[System] '${product.productName}' 신청이 접수되었습니다. 심사가 진행됩니다.`);

        // 심사 진행 UI 표시
        this.showProgressUI(product.productName);

        // 실제 상태 변경은 각 페이지(home.html 등)의 로드 시점이나 
        // 폴링(Polling) 로직에서 타임스탬프를 체크하여 처리합니다.
    },

    // 상태 변경 감지 및 처리
    updateStatus: function(productId, newStatus) {
        // 이 메서드는 이제 외부(Polling 로직)에서 호출되거나, 
        // 알림 발송 전용으로 사용됩니다.
        console.log(`[System] 상품ID(${productId}) 상태 처리: ${newStatus}`);
    },

    // 알림 발송 (Notification API)
    sendNotification: function(productName) {
        const title = "대출 심사 완료";
        const body = `'${productName}'의 심사가 완료되었습니다. 결과를 확인해주세요.`;

        if (!("Notification" in window)) {
            alert(`${title}\n${body}`);
        }
        else if (Notification.permission === "granted") {
            new Notification(title, { body: body });
        }
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    new Notification(title, { body: body });
                }
            });
        } else {
            // 권한이 거부된 경우 alert로 대체
            alert(`${title}\n${body}`);
        }
    },

    // UI 관련 메서드 (Progress Bar)
    showProgressUI: function(productName) {
        // 기존 모달 제거
        const existingModal = document.getElementById('progress-modal');
        if (existingModal) existingModal.remove();

        // 모달 생성 (JS로 동적 스타일링 및 생성)
        const modal = document.createElement('div');
        modal.id = 'progress-modal';
        modal.style.cssText = `
            position: fixed; inset: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: flex-end;
            z-index: 9999; backdrop-filter: blur(12px);
        `;
        
        // Backdrop click to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeProgressUI();
            }
        };

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 1.5rem 1.5rem 0 0; width: 100%; max-width: 448px; box-shadow: 0 -10px 25px rgba(0,0,0,0.1); animation: slideUp 0.3s ease-out forwards;">
                <style>
                    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
                </style>
                <div style="width: 48px; height: 6px; background-color: #e5e7eb; border-radius: 9999px; margin: 0 auto 1.5rem auto;"></div>
                <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">${productName}</h3>
                <p style="margin-bottom: 1rem; color: #4b5563;">심사가 진행 중입니다. 잠시만 기다려주세요.</p>
                <div style="width: 100%; background: #e5e7eb; height: 0.75rem; border-radius: 9999px; overflow: hidden;">
                    <div id="progress-bar" style="width: 0%; height: 100%; background: #1D4ED8; transition: width 0.2s linear;"></div>
                </div>
                <p id="progress-text" style="text-align: right; margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">0%</p>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // 스크롤 잠금
        if (typeof toggleBackgroundScale === 'function') toggleBackgroundScale(true);
        
        // 드래그 닫기 로직 추가
        const content = modal.firstElementChild;
        let startY = 0;
        let isDragging = false;

        content.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            content.style.transition = 'none';
        }, { passive: true });

        content.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const diff = e.touches[0].clientY - startY;
            if (diff > 0) {
                e.preventDefault();
                content.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: false });

        content.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            content.style.transition = 'transform 0.3s ease-out';
            if (e.changedTouches[0].clientY - startY > 100) {
                content.style.transform = 'translateY(100%)';
                setTimeout(() => this.closeProgressUI(), 300);
            } else {
                content.style.transform = '';
            }
        });

        this.startProgressAnimation();
    },

    startProgressAnimation: function() {
        let progress = 0;
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-text');
        
        // 1분(60000ms) 동안 100% 채우기 -> 600ms마다 1% 증가
        this.progressInterval = setInterval(() => {
            if (progress >= 99) {
                clearInterval(this.progressInterval);
            } else {
                progress++;
                if (bar) bar.style.width = `${progress}%`;
                if (text) text.innerText = `${progress}%`;
            }
        }, 600);
    },

    completeProgressUI: function() {
        clearInterval(this.progressInterval);
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-text');
        const modal = document.getElementById('progress-modal');

        if (bar) bar.style.width = '100%';
        if (text) text.innerText = '100%';

        // 0.5초 후 모달 닫기
        setTimeout(() => {
            if (modal) modal.remove();
        }, 500);
    },

    closeProgressUI: function() {
        clearInterval(this.progressInterval);
        const modal = document.getElementById('progress-modal');
        if (modal) {
            const content = modal.firstElementChild;
            // 드래그로 닫히는 중이 아닐 때만 애니메이션 적용 (여기서는 간단히 항상 적용하되, 드래그 로직과 충돌 주의)
            // RecommendLogic의 드래그 로직은 직접 구현되어 있으므로, 여기서 애니메이션을 강제하면 됨
            content.style.animation = 'slideDown 0.3s ease-out forwards';
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = ''; // 스크롤 잠금 해제
                if (typeof toggleBackgroundScale === 'function') toggleBackgroundScale(false);
            }, 300);
        }
    }
};
