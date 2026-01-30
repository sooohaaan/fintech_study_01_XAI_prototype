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
