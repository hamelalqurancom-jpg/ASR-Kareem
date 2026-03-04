// =====================================================
// أسر كريم للسيراميك — script.js (Firebase Module)
// =====================================================
import { db, collection, addDoc, onSnapshot, query } from './firebase-config.js';

// --- Global State ---
let userProducts = [];
let cart = JSON.parse(localStorage.getItem('aser_cart')) || [];

// --- Firebase Real-time Products ---
function loadProductsFromFirebase() {
    onSnapshot(query(collection(db, "products")), (snapshot) => {
        userProducts = [];
        snapshot.forEach(doc => {
            userProducts.push({ id: doc.id, ...doc.data() });
        });
        renderProducts(window.currentCategory || 'الكل');
    });
}
window.loadProductsFromFirebase = loadProductsFromFirebase;

// --- Cart Logic ---
function updateCartUI() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = cart.length;

    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-amount');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">السلة فارغة حالياً</div>';
        if (totalEl) totalEl.textContent = '0 جنيه';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        total += price;
        return `
            <div class="cart-item" style="display: flex; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 4px;">${item.name}</h4>
                    <p style="color: var(--gold); font-weight: 700; font-size: 0.85rem;">${item.price} جنيه</p>
                    <button onclick="removeFromCart(${index})" style="color: #ef4444; font-size: 0.75rem; font-weight: 700; margin-top: 5px;">حذف</button>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.textContent = total.toLocaleString() + ' جنيه';
    localStorage.setItem('aser_cart', JSON.stringify(cart));
}

function addToCart(productDataOrBtn) {
    if (productDataOrBtn instanceof HTMLButtonElement) {
        const card = productDataOrBtn.closest('.product-card');
        const product = {
            name: card.querySelector('.product-name').textContent,
            price: card.querySelector('.cur-price').textContent.replace('جنيه', '').trim(),
            image: card.querySelector('img').src
        };
        cart.push(product);
    } else {
        cart.push(productDataOrBtn);
    }

    updateCartUI();
    showToast();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    // Open checkout modal instead of WhatsApp directly
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('checkout-overlay');
    if (modal) modal.classList.add('show');
    if (overlay) overlay.classList.add('show');

    // Close cart drawer if open
    toggleCart();
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('checkout-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

async function confirmOrder(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('cust-name').value;
    const gov = document.getElementById('cust-gov').value;
    const city = document.getElementById('cust-city').value;
    const address = document.getElementById('cust-address').value;
    const phone1 = document.getElementById('cust-phone1').value;
    const phone2 = document.getElementById('cust-phone2').value;
    const payment = document.getElementById('cust-payment').value;

    // Validation
    if (phone1 === phone2) {
        alert('يرجى إدخال رقمي هاتف مختلفين لسهولة التواصل.');
        return;
    }
    if (phone1.length !== 11 || phone2.length !== 11) {
        alert('يجب أن يتكون رقم الهاتف من 11 رقماً.');
        return;
    }

    const btn = document.getElementById('confirm-order-btn');
    btn.disabled = true;
    btn.textContent = 'جاري الحفظ...';

    const orderData = {
        customerName: name,
        governorate: gov,
        city: city,
        address: address,
        phone1: phone1,
        phone2: phone2,
        paymentMethod: payment,
        items: cart,
        totalAmount: document.getElementById('cart-total-amount').textContent,
        status: 'new',
        createdAt: new Date()
    };

    try {
        // 1. Save to Firebase
        await addDoc(collection(db, "orders"), orderData);

        // 2. Prepare WhatsApp Message
        let message = `*طلب جديد من: ${name}*\n`;
        message += `📍 العنوان: ${gov} - ${city} - ${address}\n`;
        message += `📞 هواتف: ${phone1} / ${phone2}\n`;
        message += `💳 الدفع: ${payment}\n\n`;
        message += `*المنتجات:*\n`;
        cart.forEach((item, idx) => {
            message += `${idx + 1}. ${item.name} (${item.price} ج.م)\n`;
        });
        message += `\n*الإجمالي: ${orderData.totalAmount}*`;

        const encoded = encodeURIComponent(message);

        // 3. Reset and Close
        cart = [];
        localStorage.removeItem('aser_cart');
        updateCartUI();
        closeCheckoutModal();
        btn.disabled = false;
        btn.textContent = 'تأكيد وإرسال عبر واتساب';

        // 4. Open WhatsApp
        window.open(`https://wa.me/201000539427?text=${encoded}`, '_blank');

    } catch (error) {
        console.error("Error saving order: ", error);
        alert('حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.');
        btn.disabled = false;
        btn.textContent = 'تأكيد وإرسال عبر واتساب';
    }
}

// --- Payment Modal ---
function showPaymentInfo(method) {
    const modal = document.getElementById('payment-modal');
    const overlay = document.getElementById('payment-overlay');
    const title = document.getElementById('payment-method-title');
    const number = document.getElementById('payment-number');

    if (title) title.textContent = `الدفع عبر ${method}`;

    if (method === 'انستا باي' || method === 'فودافون كاش') {
        if (number) number.textContent = '01000539888';
    } else {
        if (number) number.textContent = 'تواصل معنا للتفاصيل';
    }

    if (modal) modal.classList.add('show');
    if (overlay) overlay.classList.add('show');
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    const overlay = document.getElementById('payment-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

function showToast() {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// --- Mobile Menu ---
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.toggle('open');
}

// --- Hero Tags Logic ---
function loadHeroTags() {
    const container = document.getElementById('hero-tags-container');
    if (!container) return;

    onSnapshot(query(collection(db, "hero_tags")), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const tag = doc.data().label;
            const a = document.createElement('a');
            a.href = "#";
            a.className = "hero-tag";
            a.textContent = tag;
            a.onclick = (e) => {
                e.preventDefault();
                handleHeroTag(tag);
            };
            container.appendChild(a);
        });
    });
}

function handleHeroTag(tagName) {
    const input = document.getElementById('hero-search-input');
    if (input) {
        input.value = tagName;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
window.handleHeroTag = handleHeroTag;

// --- Search Logic ---
function initSearch() {
    const searchInputs = ['header-search', 'hero-search-input'];
    searchInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();

                // Show products section if we start searching from hero
                if (id === 'hero-search-input' && term.length > 0) {
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                        const headerH = document.getElementById('site-header')?.offsetHeight || 56;
                        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                }

                if (term === '') {
                    renderProducts(window.currentCategory || 'الكل');
                    return;
                }

                const results = userProducts.filter(p =>
                    p.name.toLowerCase().includes(term) ||
                    (p.category && p.category.toLowerCase().includes(term)) ||
                    (p.type && p.type.toLowerCase().includes(term)) ||
                    (p.brand && p.brand.toLowerCase().includes(term))
                );

                displaySearchResults(results);
            });
        }
    });
}

// Expose to window
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkoutWhatsApp = checkoutWhatsApp;
window.showPaymentInfo = showPaymentInfo;
window.closePaymentModal = closePaymentModal;
window.toggleMenu = toggleMenu;
window.toggleSearch = toggleSearch;
window.closeCheckoutModal = closeCheckoutModal;
window.confirmOrder = confirmOrder;

// --- Functional Search Logic ---
function initSearch() {
    const searchInputs = ['header-search', 'hero-search-input'];
    searchInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                if (term === '') {
                    renderProducts(window.currentCategory || 'الكل');
                    return;
                }

                // Filter all products by name, category or brand
                const results = userProducts.filter(p =>
                    p.name.toLowerCase().includes(term) ||
                    (p.category && p.category.toLowerCase().includes(term)) ||
                    (p.type && p.type.toLowerCase().includes(term))
                );

                displaySearchResults(results);
            });
        }
    });
}

function displaySearchResults(results) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (results.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد نتائج مطابقة لبحثك.</p>`;
        return;
    }

    results.forEach(p => {
        const productHTML = `
            <div class="product-card">
                <div class="product-img-wrap">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    ${p.discount ? `<span class="discount-badge">${p.discount}</span>` : ''}
                </div>
                <div class="product-info" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
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

    // Scroll to products if search was from hero
    const productsSection = document.getElementById('products');
    if (productsSection && document.activeElement.id === 'hero-search-input') {
        const headerH = document.getElementById('site-header')?.offsetHeight || 56;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// --- Hero Tags Handler ---
function handleHeroTag(tagName) {
    // Treat tags like direct category or brand filters
    const categoryExists = userProducts.some(p => p.category === tagName);
    if (categoryExists) {
        renderProducts(tagName);
    } else {
        // Filter by brand (type) if not a category
        window.currentCategory = 'الكل';
        window.currentType = tagName;
        renderProducts('الكل');
    }

    const productsSection = document.getElementById('products');
    if (productsSection) {
        const headerH = document.getElementById('site-header')?.offsetHeight || 56;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}
window.handleHeroTag = handleHeroTag;

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

    // Update Section Title & Add Hero if Category
    const titleEl = document.querySelector('#products .section-title');
    const heroWrap = document.getElementById('category-hero-wrap');

    if (window.currentCategory === 'الكل') {
        if (titleEl) titleEl.textContent = 'الأكثر مبيعاً';
        if (heroWrap) heroWrap.innerHTML = '';
        document.getElementById('about')?.style.setProperty('display', 'block');
        document.getElementById('hero')?.style.setProperty('display', 'flex');
    } else {
        if (titleEl) titleEl.textContent = 'منتجات ' + window.currentCategory;
        renderCategoryHero(window.currentCategory);
        // On mobile, maybe hide hero to focus on products
        if (window.innerWidth < 1024) {
            document.getElementById('hero')?.style.setProperty('display', 'none');
            document.getElementById('about')?.style.setProperty('display', 'none');
        }
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد منتجات في هذا القسم حالياً.</p>`;
        return;
    }

    filtered.forEach(p => {
        const productHTML = `
            <div class="product-card">
                <div class="product-img-wrap" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    ${p.discount ? `<span class="discount-badge">${p.discount}</span>` : ''}
                    ${p.status === 'limited' ? `<span class="limited-badge">الكمية محدودة</span>` : ''}
                    ${p.status === 'new' ? `<span class="new-badge dark-green">جديد</span>` : ''}
                </div>
                <div class="product-info" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                    ${p.type ? `<span class="product-type">${p.type}</span>` : ''}
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price-row">
                        ${p.oldPrice ? `<span class="old-price">ج.م ${p.oldPrice}</span>` : ''}
                        <span class="cur-price">جنيه ${p.price}</span>
                    </div>
                </div>
                <button class="plus-btn" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})" aria-label="أضف للسلة">+</button>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', productHTML);
    });

    populateFilters(filtered);
    observeFadeElements();
}

function renderCategoryHero(catName) {
    const wrap = document.getElementById('category-hero-wrap');
    if (!wrap) return;

    const descriptions = {
        'سيراميك': 'تسوق أفضل منتجات السيراميك بأسعار تنافسية من آسر كريم. أكثر من 1000 موديل متوفر من أفضل الماركات مع الشحن لجميع المحافظات.',
        'بورسلين': 'اكتشف روعة البورسلين بتصاميم عصرية تتناسب مع ذوقك الرفيع. متانة وجودة لا تضاهى.',
        'أدوات صحية': 'كل ما يحتاجه حمامك في مكان واحد. أطقم حمامات، دش، ومستلزمات صحية بأفضل الأسعار.',
        'خلاطات مياه': 'خلاطات مياه عالمية بجودة فائقة وضمان حقيقي. جروهي، ايديال ستاندرد، والمزيد.',
        'بانيوهات': 'تسوق أفضل منتجات البانيوهات بأسعار تنافسية من آسر كريم. أكثر من 3000 منتج متوفر من أفضل الماركات مع الشحن لجميع المحافظات.',
        'وحدات حمام': 'وحدات حمام فاخرة تجمع بين الأناقة والاستخدام العملي، متوفرة بمقاسات وألوان متنوعة.'
    };

    const desc = descriptions[catName] || 'تسوق أفضل المنتجات بأعلى جودة وأفضل الأسعار من آسر كريم.';

    wrap.innerHTML = `
        <div class="category-hero">
            <h1>${catName}</h1>
            <p>${desc}</p>
            <div class="category-rating">
                <span style="color:#f59e0b">★★★★★</span>
                <span style="font-weight:700">4.8</span>
                <span style="color:#64748b; font-size:0.9rem">8,374+ تقييم ✅ منتجات أصلية 100%</span>
            </div>
        </div>
        <div class="sub-categories-section">
            <h2 class="sub-categories-title">تصفح الأقسام الفرعية</h2>
            <div class="sub-categories-scroll">
                <div class="sub-cat-card">
                    <div class="sub-cat-name">${catName} مودرن</div>
                    <div class="sub-cat-count">413 منتج</div>
                </div>
                <div class="sub-cat-card">
                    <div class="sub-cat-name">${catName} كلاسيك</div>
                    <div class="sub-cat-count">165 منتج</div>
                </div>
                <div class="sub-cat-card">
                    <div class="sub-cat-name">أحدث الموديلات</div>
                    <div class="sub-cat-count">812 منتج</div>
                </div>
            </div>
        </div>
    `;
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
        typeRow.innerHTML = `<span class="filter-label">الماركة:</span>` +
            `<span class="filter-pill ${window.currentType === 'الكل' ? 'active' : ''}" onclick="filterByAttr('type', 'الكل', this)">الكل</span>` +
            types.map(t => `<span class="filter-pill ${window.currentType === t ? 'active' : ''}" onclick="filterByAttr('type', '${t}', this)">${t}</span>`).join('');
    } else { typeRow.innerHTML = ''; }

    if (priceTags.length > 0) {
        priceRow.innerHTML = `<span class="filter-label">السعر:</span>` +
            `<span class="filter-pill ${window.currentPriceTag === 'الكل' ? 'active' : ''}" onclick="filterByAttr('priceTag', 'الكل', this)">الكل</span>` +
            priceTags.map(pt => `<span class="filter-pill ${window.currentPriceTag === pt ? 'active' : ''}" onclick="filterByAttr('priceTag', '${pt}', this)">${pt}</span>`).join('');
    } else { priceRow.innerHTML = ''; }
}

// --- Product Modal Logic ---
function openProductModal(p) {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (!modal) return;

    // Fill Basic Info
    document.getElementById('modal-name').textContent = p.name;
    document.getElementById('modal-type').textContent = p.type || p.category;
    document.getElementById('modal-cur-price').textContent = `${p.price} جنيه`;
    document.getElementById('modal-old-price').textContent = p.oldPrice ? `${p.oldPrice} ج.م` : '';

    // Fill Specs
    document.getElementById('modal-brand').textContent = p.brand || '-';
    document.getElementById('modal-grade').textContent = p.grade || '-';
    document.getElementById('modal-size').textContent = p.size || '-';

    // Hide spec boxes if empty
    document.getElementById('spec-brand-box').style.display = p.brand ? 'block' : 'none';
    document.getElementById('spec-grade-box').style.display = p.grade ? 'block' : 'none';
    document.getElementById('spec-size-box').style.display = p.size ? 'block' : 'none';

    // Image Gallery
    const mainImg = document.getElementById('modal-main-img');
    const thumbsContainer = document.getElementById('modal-thumbs');
    const images = p.images && p.images.length > 0 ? p.images : [p.image];

    mainImg.src = images[0];
    thumbsContainer.innerHTML = '';

    images.forEach((imgSrc, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${imgSrc}" alt="Thumbnail">`;
        thumb.onclick = () => {
            document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainImg.src = imgSrc;
        };
        thumbsContainer.appendChild(thumb);
    });

    // Actions
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.onclick = () => {
        addToCart(p);
        closeProductModal();
    };

    const waLink = document.getElementById('modal-wa-link');
    const waMsg = encodeURIComponent(`مرحباً آسر كريم، أود الاستفسار عن منتج: ${p.name}\nالسعر: ${p.price} جنيه`);
    waLink.href = `https://wa.me/201000539427?text=${waMsg}`;

    modal.classList.add('show');
    overlay.classList.add('show');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;

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
            const suffix = rawText.includes('+') ? '+' : '';
            const num = parseInt(rawText.replace(/[^0-9]/g, ''), 10);

            if (!isNaN(num)) {
                el.dataset.suffix = suffix;
                animateCounter(el, num);
            }
            statsObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

statNums.forEach(el => statsObserver.observe(el));

// Initialize
updateCartUI();
loadHeroTags();
loadProductsFromFirebase(); // Start loading data
observeFadeElements();
initSearch();
console.log('أسر كريم — (Firebase Sync) initialized ✓');



