// =====================================================
// أسر كريم للسيراميك — script.js
// =====================================================

// --- Cart State ---
let cartCount = 0;

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = cartCount;
}

function addToCart(btn) {
    cartCount++;
    updateCartBadge();
    showToast();
    // Animate button
    btn.style.transform = 'scale(0.85)';
    setTimeout(() => { btn.style.transform = ''; }, 180);
}

function showToast() {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function toggleCart() {
    showToast();
}

// --- Mobile Menu ---
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.toggle('open');
    // Close search if open
    const search = document.getElementById('search-bar-drop');
    if (search) search.classList.remove('open');
}

// --- Search ---
function toggleSearch() {
    const search = document.getElementById('search-bar-drop');
    if (!search) return;
    search.classList.toggle('open');
    // Close menu if open
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.remove('open');
    if (search.classList.contains('open')) {
        const input = document.getElementById('header-search');
        if (input) input.focus();
    }
}

// Close menu/search when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('mobile-menu');
    const menuBtn = document.getElementById('menu-btn');
    const searchDrop = document.getElementById('search-bar-drop');
    const searchToggle = document.getElementById('search-toggle');

    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.classList.remove('open');
        }
    }
    if (searchDrop && searchDrop.classList.contains('open')) {
        if (!searchDrop.contains(e.target) && !searchToggle.contains(e.target)) {
            searchDrop.classList.remove('open');
        }
    }
});

// --- Header scroll shadow ---
window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    if (!header) return;
    if (window.scrollY > 10) {
        header.style.boxShadow = '0 2px 16px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
});

// --- Brands carousel click ---
document.querySelectorAll('.brand-circle').forEach(circle => {
    circle.addEventListener('click', () => {
        document.querySelectorAll('.brand-circle').forEach(c => c.classList.remove('active'));
        circle.classList.add('active');
    });
});

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const headerH = document.getElementById('site-header')?.offsetHeight || 56;
            const top = target.getBoundingClientRect().top + window.scrollY - headerH;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// --- Intersection observer: fade-in on scroll ---
const fadeElements = document.querySelectorAll(
    '.feature-card, .category-card, .product-card, .stat-item, .service-card, .brand-circle'
);
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    fadeObserver.observe(el);
});

// --- Animated counter for stats ---
function animateCounter(el, target, isDecimal = false) {
    const duration = 1600;
    let start = null;
    const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = Math.floor(eased * target);
        el.textContent = el.dataset.prefix + value.toLocaleString('ar-EG') + (el.dataset.suffix || '');
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

const statNums = document.querySelectorAll('.stat-num');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const rawText = el.textContent.trim();
            const prefix = rawText.startsWith('+') ? '+' : '';
            const num = parseInt(rawText.replace(/[^0-9]/g, ''), 10);

            if (!isNaN(num)) {
                el.dataset.prefix = prefix;
                animateCounter(el, num);
            }
            statsObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

statNums.forEach(el => statsObserver.observe(el));

// Initialize
updateCartBadge();
console.log('أسر كريم — initialized ✓');
