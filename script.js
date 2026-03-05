// =====================================================
// أسر كريم للسيراميك — script.js (Firebase Module)
// =====================================================
import { db, collection, addDoc, onSnapshot, query, doc, getDocs } from './firebase-config.js';

// --- Global State ---
let userProducts = [];
let cart = [];
try {
    const saved = localStorage.getItem('aser_cart');
    if (saved) cart = JSON.parse(saved);
} catch (e) {
    console.error("Cart retrieval failed:", e);
    cart = [];
}

window.currentCategory = 'الكل';
window.currentType = 'الكل';
window.currentPriceTag = 'الكل';

// --- Global Function Exports (Important for HTML onclick events) ---
window.addToCart = addToCart;
window.addToCartById = addToCartById;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.toggleMenu = toggleMenu;
window.toggleSearch = toggleSearch;
window.checkoutWhatsApp = checkoutWhatsApp;
window.confirmOrder = confirmOrder;
window.closeCheckoutModal = closeCheckoutModal;
window.showPaymentInfo = showPaymentInfo;
window.closePaymentModal = closePaymentModal;
window.openProductModalById = openProductModalById;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.filterByAttr = filterByAttr;

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
        const itemPrice = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price;
        total += itemPrice || 0;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="item-price">${item.price} جنيه</p>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">حذف</button>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.textContent = total.toLocaleString() + ' جنيه';
    localStorage.setItem('aser_cart', JSON.stringify(cart));
}

function addToCart(productData) {
    if (!productData) return;
    let finalData = productData;

    // Robust check for being called via onclick="addToCart(this)"
    const isElement = productData.nodeType === 1;

    if (isElement) {
        const card = productData.closest('.product-card');
        if (card) {
            const name = card.querySelector('.product-name')?.textContent || 'منتج';
            const price = card.querySelector('.cur-price')?.textContent || '0';
            const image = card.querySelector('img')?.src || '';
            finalData = { name, price, image };
        } else {
            return;
        }
    }

    if (!finalData) return;
    console.log('Adding to cart:', finalData.name);
    cart.push(finalData);
    updateCartUI();
    showToast(finalData.name); // Pass name to toast

    // Visual feedback for the button
    if (isElement) {
        productData.classList.add('added');
        productData.textContent = '✓';
        setTimeout(() => {
            productData.classList.remove('added');
            productData.textContent = '+';
        }, 1500);
    }

    // Automatically open cart to show "it is in front of" the user as requested
    setTimeout(() => {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer && !drawer.classList.contains('open')) {
            drawer.classList.add('open');
            if (overlay) overlay.classList.add('show');
        }
    }, 800);
}

function addToCartById(id) {
    console.log('Add by ID:', id);
    const p = userProducts.find(x => x.id === id);
    if (p) addToCart(p);
}
window.addToCartById = addToCartById;

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
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('checkout-overlay');
    if (modal) modal.classList.add('show');
    if (overlay) overlay.classList.add('show');
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
        console.log("Saving order to Firestore...", orderData);
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Order saved successfully with ID:", docRef.id);

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

        // Success alert to confirm the data reached Firestore
        alert('تم تسجيل طلبك بنجاح وسوف يتم تحويلك الآن للواتساب!');

        cart = [];
        localStorage.removeItem('aser_cart');
        updateCartUI();
        closeCheckoutModal();
        btn.disabled = false;
        btn.textContent = 'تأكيد وإرسال عبر واتساب';

        // Open WhatsApp in a new tab
        window.open(`https://wa.me/201000539427?text=${encoded}`, '_blank');
    } catch (error) {
        console.error("Critical error saving order: ", error);
        alert('حدث خطأ أثناء حفظ الطلب: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'تأكيد وإرسال عبر واتساب';
    }
}

function showToast(name = '') {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;

    if (name) {
        toast.textContent = `تم إضافة "${name}" لسلة المشتريات`;
    } else {
        toast.textContent = 'تم إضافة المنتج لسلة المشتريات بنجاح';
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// --- UI Utilities ---
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('open');
}

function toggleSearch() {
    const drop = document.getElementById('search-bar-drop');
    if (drop) {
        drop.classList.toggle('open');
        if (drop.classList.contains('open')) {
            const input = drop.querySelector('input');
            if (input) input.focus();
        }
    }
}

function showPaymentInfo(method) {
    const modal = document.getElementById('payment-modal');
    const overlay = document.getElementById('payment-overlay');
    const title = document.getElementById('payment-method-title');
    const number = document.getElementById('payment-number');

    if (modal && overlay) {
        title.textContent = `عبر ${method}`;
        if (method === 'فودافون كاش' || method === 'انستا باي' || method === 'فاليو') {
            number.textContent = "01000539888";
        } else {
            number.textContent = "يرجى التواصل لتأكيد الدفع";
        }
        modal.classList.add('show');
        overlay.classList.add('show');
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    const overlay = document.getElementById('payment-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

// --- Hero Tags Logic ---
function loadHeroTags() {
    const container = document.getElementById('hero-tags-container');
    if (!container) return;
    onSnapshot(query(collection(db, "hero_tags")), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach(docSnap => {
            const tag = docSnap.data().label;
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

// --- Search Logic ---
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
                const results = userProducts.filter(p =>
                    p.name.toLowerCase().includes(term) ||
                    (p.category && p.category.toLowerCase().includes(term)) ||
                    (p.type && p.type.toLowerCase().includes(term)) ||
                    (p.brand && p.brand.toLowerCase().includes(term))
                );
                displaySearchResults(results);

                if (id === 'hero-search-input' && term.length > 0) {
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                        const headerH = document.getElementById('site-header')?.offsetHeight || 56;
                        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                }
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
        grid.insertAdjacentHTML('beforeend', createProductCardHTML(p));
    });
}

// --- Product UI ---
function createProductCardHTML(p) {
    const safeId = p.id;
    return `
        <div class="product-card">
            <div class="product-img-wrap" onclick="openProductModalById('${safeId}')">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                ${p.discount ? `<span class="discount-badge">${p.discount}</span>` : ''}
                ${p.status === 'limited' ? `<span class="limited-badge">الكمية محدودة</span>` : ''}
                ${p.status === 'new' ? `<span class="new-badge dark-green">جديد</span>` : ''}
            </div>
            <div class="product-info" onclick="openProductModalById('${safeId}')">
                ${p.type ? `<span class="product-type">${p.type}</span>` : ''}
                <h3 class="product-name">${p.name}</h3>
                <div class="product-price-row">
                    ${p.oldPrice ? `<span class="old-price">ج.م ${p.oldPrice}</span>` : ''}
                    <span class="cur-price">جنيه ${p.price}</span>
                </div>
            </div>
            <button class="plus-btn" onclick="addToCartById('${safeId}')" aria-label="أضف للسلة">+</button>
        </div>
    `;
}

function renderProducts(categoryFilter = 'الكل') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (categoryFilter !== undefined) window.currentCategory = categoryFilter;

    let filtered = userProducts;
    if (window.currentCategory !== 'الكل') {
        filtered = filtered.filter(p => p.category === window.currentCategory);
    }
    if (window.currentType && window.currentType !== 'الكل') {
        filtered = filtered.filter(p => p.type === window.currentType);
    }
    if (window.currentPriceTag && window.currentPriceTag !== 'الكل') {
        filtered = filtered.filter(p => p.priceTag === window.currentPriceTag);
    }

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
        grid.insertAdjacentHTML('beforeend', createProductCardHTML(p));
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
    `;
}

function populateFilters(products) {
    const typeRow = document.getElementById('type-filters');
    const priceRow = document.getElementById('price-filters');
    if (!typeRow || !priceRow) return;

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

function filterByAttr(attr, value) {
    if (attr === 'type') window.currentType = value;
    if (attr === 'priceTag') window.currentPriceTag = value;
    renderProducts();
}
window.filterByAttr = filterByAttr;

// --- Product Modal Logic ---
function openProductModal(p) {
    if (!p) return;
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (!modal) return;

    document.getElementById('modal-name').textContent = p.name;
    document.getElementById('modal-type').textContent = p.type || p.category;
    document.getElementById('modal-cur-price').textContent = `${p.price} جنيه`;
    document.getElementById('modal-old-price').textContent = p.oldPrice ? `${p.oldPrice} ج.م` : '';

    document.getElementById('modal-brand').textContent = p.brand || '-';
    document.getElementById('modal-grade').textContent = p.grade || '-';
    document.getElementById('modal-size').textContent = p.size || '-';

    document.getElementById('spec-brand-box').style.display = p.brand ? 'block' : 'none';
    document.getElementById('spec-grade-box').style.display = p.grade ? 'block' : 'none';
    document.getElementById('spec-size-box').style.display = p.size ? 'block' : 'none';

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

function openProductModalById(id) {
    const p = userProducts.find(x => x.id === id);
    if (p) openProductModal(p);
}
window.openProductModalById = openProductModalById;

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;

// --- Category Filtering ---
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const catName = card.querySelector('.cat-name').textContent.trim();
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

// --- Effects ---
function observeFadeElements() {
    const fadeElements = document.querySelectorAll('.feature-card, .category-card, .product-card, .stat-item, .service-card, .brand-circle');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        fadeObserver.observe(el);
    });
}

// --- Initialize ---

function init() {
    loadHeroTags();
    onSnapshot(query(collection(db, "products")), (snapshot) => {
        userProducts = [];
        snapshot.forEach(docSnap => userProducts.push({ id: docSnap.id, ...docSnap.data() }));
        renderProducts(window.currentCategory);
    });
    initSearch();
    updateCartUI();
    console.log('Asr Karim Website Initialized ✓');
}
init();
