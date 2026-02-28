// =====================================================
// أسر كريم للسيراميك — script.js (Firebase Module)
// =====================================================
import { db, collection, onSnapshot, query } from './firebase-config.js';

// --- Global State ---
let cartCount = 0;
let userProducts = []; // Will be populated from Firebase

// --- Cart State ---
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = cartCount;
}

function addToCart(btn) {
    cartCount++;
    updateCartBadge();
    showToast();
    // Animate button
    if (btn) {
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => { btn.style.transform = ''; }, 180);
    }
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

// Expose functions to global scope (required for onclick in HTML)
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.toggleMenu = toggleMenu;
window.toggleSearch = toggleSearch;

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

// --- Product Data Management (Firebase) ---
function renderProducts(categoryFilter = 'الكل') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    // Clear grid
    grid.innerHTML = '';

    // Track filters
    if (categoryFilter !== undefined) window.currentCategory = categoryFilter;
    if (window.currentCategory === undefined) window.currentCategory = 'الكل';

    let filtered = userProducts;

    // 1. Category Filter
    if (window.currentCategory !== 'الكل') {
        filtered = filtered.filter(p => p.category === window.currentCategory);
    }

    // 2. Type Filter
    if (window.currentType && window.currentType !== 'الكل') {
        filtered = filtered.filter(p => p.type === window.currentType);
    }

    // 3. PriceTag Filter
    if (window.currentPriceTag && window.currentPriceTag !== 'الكل') {
        filtered = filtered.filter(p => p.priceTag === window.currentPriceTag);
    }

    // Update Section Title
    const titleEl = document.querySelector('#products .section-title');
    if (titleEl) titleEl.textContent = (window.currentCategory === 'الكل') ? 'الأكثر مبيعاً' : 'منتجات ' + window.currentCategory;

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد منتجات في هذا القسم حالياً.</p>`;
        return;
    }

    filtered.forEach(p => {
        const productHTML = `
            <div class="product-card">
                <div class="product-img-wrap">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    ${p.discount ? `<span class="discount-badge">${p.discount}</span>` : ''}
                    ${p.status === 'limited' ? `<span class="limited-badge">الكمية محدودة</span>` : ''}
                    ${p.status === 'new' ? `<span class="new-badge dark-green">جديد</span>` : ''}
                </div>
                <div class="product-info">
                    ${p.type ? `<span class="product-type">${p.type}</span>` : ''}
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price-row">
                        ${p.oldPrice ? `<span class="old-price">ج.م ${p.oldPrice}</span>` : ''}
                        <span class="cur-price">جنيه ${p.price}</span>
                    </div>
                </div>
                <button class="plus-btn" onclick="addToCart(this)" aria-label="أضف للسلة">+</button>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', productHTML);
    });

    populateFilters(filtered);
    observeFadeElements();
}

function populateFilters(products) {
    const typeRow = document.getElementById('type-filters');
    const priceRow = document.getElementById('price-filters');
    if (!typeRow || !priceRow) return;

    if (window.currentType === undefined) window.currentType = 'الكل';
    if (window.currentPriceTag === undefined) window.currentPriceTag = 'الكل';

    // Get unique types and price tags from the WHOLE set of products IN THIS CATEGORY
    const categoryProducts = window.currentCategory === 'الكل' ? userProducts : userProducts.filter(p => p.category === window.currentCategory);

    const types = [...new Set(categoryProducts.filter(p => p.type).map(p => p.type))];
    const priceTags = [...new Set(categoryProducts.filter(p => p.priceTag).map(p => p.priceTag))];

    if (types.length > 0) {
        typeRow.innerHTML = `<span class="filter-label">النوع:</span>` +
            `<span class="filter-pill ${window.currentType === 'الكل' ? 'active' : ''}" onclick="filterByAttr('type', 'الكل', this)">الكل</span>` +
            types.map(t => `<span class="filter-pill ${window.currentType === t ? 'active' : ''}" onclick="filterByAttr('type', '${t}', this)">${t}</span>`).join('');
    } else { typeRow.innerHTML = ''; }

    if (priceTags.length > 0) {
        priceRow.innerHTML = `<span class="filter-label">السعر:</span>` +
            `<span class="filter-pill ${window.currentPriceTag === 'الكل' ? 'active' : ''}" onclick="filterByAttr('priceTag', 'الكل', this)">الكل</span>` +
            priceTags.map(pt => `<span class="filter-pill ${window.currentPriceTag === pt ? 'active' : ''}" onclick="filterByAttr('priceTag', '${pt}', this)">${pt}</span>`).join('');
    } else { priceRow.innerHTML = ''; }
}

function filterByAttr(attr, value, el) {
    if (attr === 'type') window.currentType = value;
    if (attr === 'priceTag') window.currentPriceTag = value;

    renderProducts();
}

window.filterByAttr = filterByAttr;

// Initial Listener for Products
const q = query(collection(db, "products"));
onSnapshot(q, (querySnapshot) => {
    userProducts = [];
    querySnapshot.forEach((doc) => {
        userProducts.push(doc.data());
    });
    renderProducts();
});


// --- Category Filtering ---
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const catName = card.querySelector('.cat-name').textContent.trim();

        // Reset sub-filters
        window.currentType = 'الكل';
        window.currentPriceTag = 'الكل';

        renderProducts(catName);

        const productsSection = document.getElementById('products');
        if (productsSection) {
            const headerH = document.getElementById('site-header')?.offsetHeight || 56;
            const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// --- Intersection observer: fade-in on scroll ---
function observeFadeElements() {
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
        if (el.style.opacity === '1') return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        fadeObserver.observe(el);
    });
}

// --- Animated counter for stats ---
function animateCounter(el, target, isDecimal = false) {
    const duration = 1600;
    let start = null;
    const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = Math.floor(eased * target);
        el.textContent = (el.dataset.prefix || '') + value.toLocaleString('ar-EG') + (el.dataset.suffix || '');
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

// --- Loader Handling ---
function hideLoader() {
    const loader = document.getElementById('loader-wrapper');
    if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
    }
}

// Hide on load
window.addEventListener('load', () => {
    setTimeout(hideLoader, 800);
});

// Fallback: Hide after 3.5s anyway to prevent getting stuck
setTimeout(hideLoader, 3500);

// Initialize
updateCartBadge();
observeFadeElements();
console.log('أسر كريم — (Firebase version) initialized ✓');



