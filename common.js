/**
 * common.js
 * 공통 설정 및 유틸리티
 */

// Tailwind CSS 공통 설정
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    gray: {
                        50: '#F3F3F3',  /* Awwwards Light Bg */
                        100: '#E7E7E7',
                        200: '#D1D1D1',
                        300: '#B0B0B0',
                        400: '#888888',
                        500: '#6D6D6D',
                        600: '#5D5D5D',
                        700: '#4F4F4F',
                        800: '#222222', /* Awwwards Dark Card */
                        900: '#222222', /* Awwwards Dark Bg */
                    },
                    black: '#222222',
                    white: '#ffffff',
                    deepBlue: '#4353FF', /* Awwwards Electric Blue */
            },
            borderRadius: {
                'card': '14px',
                },
                boxShadow: {
                    'md': '0 3px 4px -1px rgb(0 0 0 / 0.1), 0 1px 3px -1px rgb(0 0 0 / 0.1)',
                    'lg': '0 7px 10px -2px rgb(0 0 0 / 0.1), 0 3px 4px -3px rgb(0 0 0 / 0.1)',
                    'xl': '0 14px 18px -4px rgb(0 0 0 / 0.1), 0 6px 7px -4px rgb(0 0 0 / 0.1)',
                    '2xl': '0 18px 35px -8px rgb(0 0 0 / 0.25)',
                },
                fontFamily: {
                    sans: ['Pretendard', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
                },
                animation: {
                    'slide-in-right': 'slideInRight 0.5s ease-out forwards',
                    'swing': 'swing 3s ease-in-out infinite',
                    'slide-up': 'slideUp 0.3s ease-out forwards',
                    'slide-down': 'slideDown 0.3s ease-out forwards'
                },
                keyframes: {
                    slideInRight: {
                        '0%': { opacity: '0', transform: 'translateX(20px)' },
                        '100%': { opacity: '1', transform: 'translateX(0)' }
                    },
                    swing: {
                        '0%, 100%': { transform: 'rotate(0deg)' },
                        '20%': { transform: 'rotate(15deg)' },
                        '40%': { transform: 'rotate(-10deg)' },
                        '60%': { transform: 'rotate(5deg)' },
                        '80%': { transform: 'rotate(-5deg)' }
                    },
                    slideUp: {
                        '0%': { transform: 'translateY(100%)' },
                        '100%': { transform: 'translateY(0)' }
                    },
                    slideDown: {
                        '0%': { transform: 'translateY(0)' },
                        '100%': { transform: 'translateY(100%)' }
                    }
                }
            }
        }
    };
}

/**
 * 공통 UI 초기화 및 렌더링
 * @param {string} activePage - 현재 활성화된 페이지 ('home', 'assets', 'notification', 'menu')
 */
function initCommonUI(activePage) {
    injectGlobalStyles();
    initTheme();
    renderBottomNav(activePage);
    updateNotificationBadge();
    if (window.lucide) window.lucide.createIcons();
    initAwwwardsEffects(); // Initialize Awwwards style effects
}

// 테마 초기화
function initTheme() {
    const savedTheme = localStorage.getItem('trustFinTheme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    setMetaThemeColor(getThemeColor());
}

// 전역 스타일 주입 (CSS Transition 등)
function injectGlobalStyles() {
    const styleId = 'trustfin-global-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

        body {
            font-family: "Pretendard", "Inter", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
            letter-spacing: -0.015em;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body, body *:not(script):not(style) {
            transition-property: background-color, border-color, color, fill, stroke, text-decoration-color;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 300ms;
        }

        /* Hide Scrollbar Globally for App-like feel */
        ::-webkit-scrollbar {
            display: none;
        }
        * { -ms-overflow-style: none; scrollbar-width: none; }

        /* --- Awwwards Style Implementation --- */
        :root {
            --primary-black: #222222;
            --accent-color: #4353FF;
            --bg-light: #F3F3F3;
            --bg-card: #FFFFFF;
            --text-main: #0D0D0D;
            --text-sub: #666666;
            --font-main: "Pretendard", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --transition-smooth: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Dark Mode Variables */
        html.dark {
            --primary-black: #ffffff;
            --bg-light: #222222;
            --bg-card: #222222;
            --text-main: #FFFFFF;
            --text-sub: #999999;
        }

        /* 1. Navigation Bar Styles */
        .awwwards-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1rem;
            height: 4rem;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            background-color: transparent;
            transition: background-color 0.5s ease, box-shadow 0.5s ease;
            font-family: var(--font-main);
            letter-spacing: -0.02em;
        }
        .awwwards-nav.scrolled {
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .dark .awwwards-nav.scrolled {
            background-color: rgba(31, 41, 55, 0.95);
        }

        /* Hover Line Animation */
        .nav-item-link {
            position: relative;
            padding-bottom: 4px;
        }
        .nav-item-link::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0%;
            height: 2px;
            background-color: var(--accent-color);
            transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-item-link:hover::after {
            width: 100%;
        }

        /* 2. Card UI Animation */
        .awwwards-card {
            transition: var(--transition-smooth) !important;
            will-change: transform, box-shadow;
        }
        .awwwards-card:hover {
            transform: translateY(-8px) scale(1.01);
            box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }

        /* Utility for GSAP reveal */
        .reveal-on-scroll {
            opacity: 0; /* Hidden initially */
        }

        /* 3. Awwwards Button Style */
        .btn-awwwards {
            background-color: var(--primary-black);
            color: var(--bg-card);
            border: 1px solid var(--primary-black);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-awwwards:hover {
            background-color: transparent;
            color: var(--primary-black);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        html.dark .btn-awwwards:hover {
            box-shadow: 0 10px 20px rgba(255,255,255,0.1);
        }
    `;
    document.head.appendChild(style);
}

// 테마 토글
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('trustFinTheme', isDark ? 'dark' : 'light');
    setMetaThemeColor(getThemeColor());
    
    // 토글 스위치 UI 업데이트
    const toggleBg = document.getElementById('themeToggleBg');
    const toggleDot = document.getElementById('themeToggleDot');
    
    if (toggleBg && toggleDot) {
        if (isDark) {
            toggleBg.classList.remove('bg-gray-200');
            toggleBg.classList.add('bg-deepBlue');
            toggleDot.classList.add('translate-x-5');
        } else {
            toggleBg.classList.add('bg-gray-200');
            toggleBg.classList.remove('bg-deepBlue');
            toggleDot.classList.remove('translate-x-5');
        }
    }
}

// 하단 내비게이션 렌더링
function renderBottomNav(activePage) {
    if (!activePage) return;

    const nav = document.createElement('nav');
    nav.className = "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 z-50 pb-1 transition-colors duration-300";
    
    const items = [
        { id: 'home', label: '홈', icon: 'home', link: 'home.html' },
        { id: 'assets', label: '자산', icon: 'pie-chart', link: 'assets.html' },
        { id: 'menu', label: '전체', icon: 'menu', link: 'menu.html' }
    ];

    nav.innerHTML = items.map(item => {
        const isActive = activePage === item.id;
        const colorClass = isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300';
        const hrefAttr = item.link ? `href="${item.link}"` : `onclick="${item.action}"`;
        const tag = item.link ? 'a' : 'button';

        return `
            <${tag} ${hrefAttr} class="flex flex-col items-center ${colorClass} w-full h-full justify-center">
                <div class="relative">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                    <span id="badge-${item.id}" class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full hidden"></span>
                </div>
                <span class="text-[10px] mt-1 font-medium">${item.label}</span>
            </${tag}>
        `;
    }).join('');

    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.appendChild(nav);
    } else {
        document.body.appendChild(nav);
    }
}

// 로그아웃 함수
function logout() {
    const personaData = localStorage.getItem('trustFinPersona');
    let isGuest = false;
    let confirmMsg = '로그아웃 하시겠습니까?';

    if (personaData) {
        const persona = JSON.parse(personaData);
        if (persona.id === 'guest') {
            isGuest = true;
            confirmMsg = '게스트 모드를 종료하시겠습니까?';
        }
    }

    if (confirm(confirmMsg)) {
        if (isGuest) {
            localStorage.removeItem('trustFinNotifications');
            localStorage.removeItem('trustFinTransactions');
            localStorage.removeItem('trustFinMyLoans');
            localStorage.removeItem('selectedCard');
            localStorage.removeItem('newDepositAmount');
        }
        localStorage.removeItem('trustFinPersona');
        localStorage.removeItem('trustFinUserData');
        window.location.href = 'login.html';
    }
}

// 알림 뱃지 업데이트 (숫자 표시)
function updateNotificationBadge() {
    const notifications = JSON.parse(localStorage.getItem('trustFinNotifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('badge-notification');

    if (badge) {
        if (unreadCount > 0) {
            badge.classList.remove('hidden');
            badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            badge.classList.add('hidden');
        }
    }
}

// 클립보드 복사 함수
function copyToClipboard(text, event) {
    if (event) event.stopPropagation(); // 부모 요소의 클릭 이벤트 전파 방지
    
    if (!text) return;

    // Clipboard API 사용
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showGlobalToast('계좌번호가 복사되었습니다.');
        }).catch(err => {
            console.error('복사 실패:', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback: execCommand 사용 (구형 브라우저 호환)
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // 스크롤 방지
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) showGlobalToast('계좌번호가 복사되었습니다.');
        else alert('복사에 실패했습니다.');
    } catch (err) {
        alert('복사에 실패했습니다.');
    }
    document.body.removeChild(textArea);
}

// 전역 토스트 메시지 표시
function showGlobalToast(message) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 -translate-y-24 bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all duration-500 z-[100] opacity-0 pointer-events-none';
        toast.innerHTML = `
            <div class="w-5 h-5 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400 dark:text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <span class="text-sm font-bold"></span>
        `;
        document.body.appendChild(toast);
    }
    
    toast.querySelector('span').innerText = message;
    
    // 애니메이션 실행
    requestAnimationFrame(() => {
        toast.classList.remove('-translate-y-24', 'opacity-0');
    });

    // 3초 후 숨김
    setTimeout(() => {
        toast.classList.add('-translate-y-24', 'opacity-0');
    }, 3000);
}

// 은행 로고 URL 반환
function getBankLogoUrl(bankName) {
    const logoMap = {
        '국민은행': 'https://static.toss.im/icons/png/4x/icon-bank-kb.png',
        '신한은행': 'https://static.toss.im/icons/png/4x/icon-bank-shinhan.png',
        '우리은행': 'https://static.toss.im/icons/png/4x/icon-bank-woori.png',
        '하나은행': 'https://static.toss.im/icons/png/4x/icon-bank-hana.png',
        '카카오뱅크': 'https://static.toss.im/icons/png/4x/icon-bank-kakaobank.png',
        '토스뱅크': 'https://static.toss.im/icons/png/4x/icon-bank-toss.png',
        '현대캐피탈': 'https://static.toss.im/icons/png/4x/icon-card-hyundai.png',
        '삼성카드': 'https://static.toss.im/icons/png/4x/icon-card-samsung.png',
        '현대카드': 'https://static.toss.im/icons/png/4x/icon-card-hyundai.png',
        '신한카드': 'https://static.toss.im/icons/png/4x/icon-card-shinhan.png',
        '국민카드': 'https://static.toss.im/icons/png/4x/icon-card-kb.png',
        '롯데카드': 'https://static.toss.im/icons/png/4x/icon-card-lotte.png',
        '우리카드': 'https://static.toss.im/icons/png/4x/icon-card-woori.png',
        '하나카드': 'https://static.toss.im/icons/png/4x/icon-card-hana.png'
    };
    return logoMap[bankName] || `https://via.placeholder.com/40?text=${bankName ? bankName[0] : 'B'}`;
}

// 이미지 로드 실패 시 핸들러 (Fallback)
function handleImageError(img, fallbackText) {
    img.onerror = null; // 무한 루프 방지
    const text = fallbackText || (img.alt ? img.alt[0] : 'B');
    img.src = `https://via.placeholder.com/40?text=${text}`;
}

// 바텀시트 드래그 닫기 기능 초기화
function initBottomSheetDrag(modalId, closeCallback) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const content = modal.querySelector('.bg-white');
    if (!content) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    content.addEventListener('touchstart', (e) => {
        // 내용이 스크롤된 상태라면 드래그 방지
        if (content.scrollTop > 0) return;
        
        startY = e.touches[0].clientY;
        isDragging = true;
        content.style.transition = 'none';
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) { // 아래로 드래그할 때만
            if (e.cancelable) e.preventDefault();
            content.style.transform = `translateY(${diff}px)`;
        }
    }, { passive: false });

    content.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        content.style.transition = 'transform 0.3s ease-out';

        const diff = currentY - startY;
        if (diff > 100) { // 100px 이상 드래그 시 닫기
            content.style.transform = 'translateY(100%)';
            setTimeout(() => {
                closeCallback(false); // 애니메이션 없이 닫기 (이미 드래그로 내려감)
                // 닫힌 후 트랜스폼 초기화 (다음 오픈을 위해)
                setTimeout(() => { content.style.transform = ''; }, 100);
            }, 300);
        } else {
            content.style.transform = '';
        }
    });
}

// 3D 배경 스케일 효과 토글
function toggleBackgroundScale(isOpen) {
    const appContent = document.getElementById('app-content');
    if (appContent) {
        if (isOpen) {
            appContent.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.3s, opacity 0.3s';
            appContent.style.transform = 'scale(0.92) translateY(10px)';
            appContent.style.borderRadius = '16px';
            appContent.style.opacity = '0.8';
            appContent.style.overflow = 'hidden';
            document.body.style.backgroundColor = '#222222'; // 깊이감을 위한 검은 배경
            setMetaThemeColor('#222222');
        } else {
            appContent.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s, opacity 0.4s';
            appContent.style.transform = '';
            appContent.style.borderRadius = '';
            appContent.style.opacity = '';
            appContent.style.overflow = '';
            setTimeout(() => { document.body.style.backgroundColor = ''; }, 400);
            setMetaThemeColor(getThemeColor());
        }
    }
}

// 메타 태그 색상 설정
function setMetaThemeColor(color) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }
    meta.content = color;
}

// 현재 테마 색상 반환 (헤더 기준)
function getThemeColor() {
    return document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff';
}

// 계좌 상세 화면으로 이동
function goToAccountDetail(bankName) {
    localStorage.setItem('selectedAccountBank', bankName);
    location.href = 'transaction_history.html';
}

// --- 송금 모달 공통 로직 ---
let currentTransferBank = '';

function openTransferModal(bankName, event) {
    if (event) event.stopPropagation();
    currentTransferBank = bankName;
    const nameEl = document.getElementById('transferBankName');
    const amountEl = document.getElementById('transferAmount');
    
    if (nameEl) nameEl.innerText = `${bankName} 계좌에서 송금`;
    if (amountEl) amountEl.value = '';
    
    const modal = document.getElementById('transferModal');
    if (!modal) return;
    
    const content = modal.querySelector('.bg-white');
    if (content) content.classList.add('animate-slide-up');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof toggleBackgroundScale === 'function') toggleBackgroundScale(true);
}

function closeTransferModal(animate = true) {
    const modal = document.getElementById('transferModal');
    if (!modal) return;
    const content = modal.querySelector('.bg-white');
    currentTransferBank = '';
    
    if (animate && content) {
        content.classList.remove('animate-slide-up');
        content.classList.add('animate-slide-down');
        setTimeout(() => {
            modal.classList.add('hidden');
            content.classList.remove('animate-slide-down');
            document.body.style.overflow = '';
            if (typeof toggleBackgroundScale === 'function') toggleBackgroundScale(false);
        }, 300);
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (typeof toggleBackgroundScale === 'function') toggleBackgroundScale(false);
    }
}

function submitTransfer() {
    const amountInput = document.getElementById('transferAmount');
    if (!amountInput) return;
    const amount = parseInt(amountInput.value);

    if (!amount || amount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }

    const personaData = localStorage.getItem('trustFinPersona');
    if (personaData) {
        const persona = JSON.parse(personaData);
        const account = persona.accounts.find(acc => acc.bank === currentTransferBank);

        if (account) {
            if (account.balance < amount) {
                alert('잔액이 부족합니다.');
                return;
            }
            
            account.balance -= amount;
            localStorage.setItem('trustFinPersona', JSON.stringify(persona));

            const now = new Date();
            const dateStr = `${now.getMonth() + 1}.${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const newNoti = {
                type: 'transfer',
                title: '송금 완료',
                message: `${currentTransferBank} 계좌에서 ${amount.toLocaleString()}원을 송금했습니다.`,
                date: dateStr
            };
            const notifications = JSON.parse(localStorage.getItem('trustFinNotifications') || '[]');
            notifications.unshift(newNoti);
            localStorage.setItem('trustFinNotifications', JSON.stringify(notifications));
            
            alert(`${amount.toLocaleString()}원을 송금했습니다.`);
            closeTransferModal();
            if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
            
            // 데이터 갱신 콜백 (각 페이지에서 정의)
            if (typeof refreshData === 'function') refreshData();
        }
    }
}

// --- Awwwards Style Logic ---

function initAwwwardsEffects() {
    initNavScrollEffect();
    initGSAPAnimations();
}

// 1. Navigation Scroll Effect
function initNavScrollEffect() {
    const nav = document.querySelector('.awwwards-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// 3. GSAP Scroll Reveal
function initGSAPAnimations() {
    // Load GSAP CDN dynamically
    if (!window.gsap) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
        script.onload = () => {
            const stScript = document.createElement('script');
            stScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js";
            stScript.onload = () => {
                gsap.registerPlugin(ScrollTrigger);
                runGSAPLogic();
            };
            document.head.appendChild(stScript);
        };
        document.head.appendChild(script);
    } else {
        runGSAPLogic();
    }
}

function runGSAPLogic() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (elements.length === 0) return;

    elements.forEach((el, index) => {
        gsap.fromTo(el, 
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });
}