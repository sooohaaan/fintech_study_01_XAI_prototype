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
        tags: ['1금융권', '직장인우대']
    },
    {
        id: 'p2',
        bankName: '카카오뱅크',
        productName: '비상금 대출',
        baseRate: 5.1,
        limitFactor: 0.8,
        minCredit: 500,
        tags: ['모바일전용', '간편심사']
    },
    {
        id: 'p3',
        bankName: '토스뱅크',
        productName: '사장님 대출',
        baseRate: 5.5,
        limitFactor: 1.5,
        minCredit: 550,
        tags: ['사업자전용', '높은한도']
    },
    {
        id: 'p4',
        bankName: '현대캐피탈',
        productName: '신용대출',
        baseRate: 8.9,
        limitFactor: 2.0,
        minCredit: 400,
        tags: ['당일입금', '넉넉한한도']
    }
];

// 2. 매칭 점수 계산 알고리즘 (핵심 로직)
function calculateMatchScore(user, product) {
    let score = 70; // 기본 점수

    // 신용점수 가중치 (+/- 20점)
    if (user.creditScore >= product.minCredit + 200) score += 20;
    else if (user.creditScore >= product.minCredit + 100) score += 10;
    else if (user.creditScore < product.minCredit) score -= 30; // 자격 미달 시 대폭 감점

    // 소득 대비 금리 적합성 (가상 로직)
    // 소득이 높을수록 저금리 상품에 높은 점수
    if (user.income > 5000 && product.baseRate < 5.0) score += 10;

    // 고용 형태 및 상품 특성 매칭
    if (user.employmentType === 'business_owner' && product.tags.includes('사업자전용')) score += 15;
    if (user.employmentType === 'regular' && product.tags.includes('직장인우대')) score += 15;

    // 점수 보정 (0 ~ 99점 사이로 제한)
    return Math.min(Math.max(score, 10), 99);
}

// 3. 실행 함수
function getRecommendations() {
    // LocalStorage에서 데이터 가져오기
    const storedData = localStorage.getItem('trustFinUserData');
    if (!storedData) return [];

    const user = JSON.parse(storedData);
    const income = parseInt(user.income);
    const creditScore = parseInt(user.creditScore);

    // 각 상품별 계산 수행
    const results = loanProducts.map(product => {
        const matchScore = calculateMatchScore({ ...user, income, creditScore }, product);
        
        // 예상 금리 및 한도 (단순 시뮬레이션)
        // 신용점수가 높을수록 금리 인하
        const finalRate = (product.baseRate - (creditScore - 600) * 0.005).toFixed(2);
        const finalLimit = Math.floor(income * product.limitFactor);

        return {
            ...product,
            matchScore,
            finalRate: Math.max(finalRate, 3.0), // 최소 금리 3.0% 제한
            finalLimit
        };
    });

    // 매칭 점수 높은 순 정렬
    return results.sort((a, b) => b.matchScore - a.matchScore);
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
