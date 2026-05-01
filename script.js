// =====================================================
// أسر كريم للسيراميك — script.js (Firebase Module)
// =====================================================
// --- Sub-Categories Core Structure (Hardcoded as requested) ---
const STATIC_SUB_CATEGORIES = [
    { parent: 'سيراميك', name: 'حوائط', short: 'حوائط' },
    { parent: 'سيراميك', name: 'أرضيات', short: 'أرضيات' },
    { parent: 'سيراميك', name: 'أوت دور', short: 'أوت دور' },
    { parent: 'سيراميك', name: 'باركيه', short: 'باركيه' },
    { parent: 'سيراميك', name: 'وزر ستانلس', short: 'وزر' },

    { parent: 'بورسلين', name: 'هندي', short: 'هندي' },
    { parent: 'بورسلين', name: 'سعودي', short: 'سعودي' },
    { parent: 'بورسلين', name: 'يوروسيلوكس', short: 'يوروسيلوكس' },
    { parent: 'بورسلين', name: 'إليجانت', short: 'إليجانت' },
    { parent: 'بورسلين', name: 'باركيه', short: 'باركيه' },

    { parent: 'أدوات صحية', name: 'طقم حمام كامل', short: 'طقم كامل' },
    { parent: 'أدوات صحية', name: 'مراحيض', short: 'مراحيض' },
    { parent: 'أدوات صحية', name: 'أحواض', short: 'أحواض' },
    { parent: 'أدوات صحية', name: 'خزانات دفن', short: 'خزانات' },

    { parent: 'خلاطات مياه', name: 'طقم خلاطات', short: 'طقم' },
    { parent: 'خلاطات مياه', name: 'خلاط حوض', short: 'حوض' },
    { parent: 'خلاطات مياه', name: 'خلاط بانيو/دش', short: 'بانيو/دش' },
    { parent: 'خلاطات مياه', name: 'خلاط مطبخ', short: 'مطبخ' },
    { parent: 'خلاطات مياه', name: 'أنظمة دفن', short: 'دفن' },

    { parent: 'أحواض مطبخ', name: 'أحواض مطبخ مصري', short: 'مصري' },
    { parent: 'أحواض مطبخ', name: 'أحواض مطبخ مستورد', short: 'مستورد' },
    { parent: 'أحواض مطبخ', name: 'أحواض مطبخ جرانيت', short: 'جرانيت' },

    { parent: 'بانيوهات', name: 'بانيوهات شاسيه', short: 'شاسيه' },
    { parent: 'بانيوهات', name: 'بانيوهات عادية', short: 'عادية' },
    { parent: 'بانيوهات', name: 'بانيوهات قدم', short: 'قدم' },
    { parent: 'بانيوهات', name: 'بانيوهات جاكوزي', short: 'جاكوزي' },

    { parent: 'باركيه', name: 'HDF', short: 'HDF' },
    { parent: 'باركيه', name: 'SPC', short: 'SPC' },

    { parent: 'أبواب مصفحة', name: 'تركي', short: 'تركي' },
    { parent: 'أبواب مصفحة', name: 'صيني', short: 'صيني' },
    { parent: 'أبواب مصفحة', name: 'أبواب غرف', short: 'غرف' }
];

window.allSubCategories = [...STATIC_SUB_CATEGORIES];

import { db, collection, addDoc, onSnapshot, query, doc, getDocs, orderBy, where, updateDoc } from './firebase-config.js';

// --- Global State ---
let userProducts = [];
let allBrands = [];
let dynamicSubCategories = [];
let cart = [];
try {
    const saved = localStorage.getItem('aser_cart');
    if (saved) cart = JSON.parse(saved);
} catch (e) {
    console.error("Cart retrieval failed:", e);
    cart = [];
}

window.currentCategory = 'الكل';
let currentFilterType = 'all';
let currentPriceTag = 'all';
let currentBrandFilter = 'all';
let productLimit = 40; // Default limit for performance
let allProducts = []; // To store all products for filtering and pagination

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
window.handleHeroSearch = handleHeroSearch;
window.openAllBrandsModal = openAllBrandsModal;
window.closeAllBrandsModal = closeAllBrandsModal;
window.filterByBrand = filterByBrand;
window.clearBrandFilter = clearBrandFilter;
window.loadMoreProducts = loadMoreProducts;
window.openScanner = openScanner;
window.closeScanner = closeScanner;
window.calculateCartons = calculateCartons;
window.selectModalGrade = selectModalGrade;
window.selectModalColor = selectModalColor;
window.renderProducts = renderProducts;
window.handleCategoryClick = handleCategoryClick;
window.handleSubCategoryClick = handleSubCategoryClick;
window.toggleSubCardMenu = toggleSubCardMenu;
window.changeSubCategoryImage = changeSubCategoryImage;
window.changeSubCategoryName = changeSubCategoryName;
window.openScanner = openScanner;
window.closeScanner = closeScanner;

// --- Sub-Category Data ---
// Sub-category data logic is now unified using STATIC_SUB_CATEGORIES and Firestore.
const DEFAULT_SUB_IMG = 'bathroom_design.jpeg';


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

function isProductInCart(productId) {
    return cart.some(item => item.id === productId);
}

function addToCart(productDataOrId) {
    let finalData;
    let isElement = false;

    if (typeof productDataOrId === 'string') { // Called with ID
        finalData = userProducts.find(p => p.id === productDataOrId);
    } else if (productDataOrId && productDataOrId.nodeType === 1) { // Called with 'this' (element)
        isElement = true;
        const card = productDataOrId.closest('.product-card');
        if (card) {
            const id = card.querySelector('.plus-btn').onclick.toString().match(/'([^']+)'/)[1];
            finalData = userProducts.find(p => p.id === id);
        }
    } else { // Called with product object
        finalData = productDataOrId;
    }

    if (!finalData) return;

    if (isProductInCart(finalData.id)) {
        showToast(`"${finalData.name}" موجود بالفعل في السلة!`);
        return;
    }

    console.log('Adding to cart:', finalData.name);
    cart.push(finalData);
    updateCartUI();
    showToast(finalData.name);

    if (isElement) {
        const button = productDataOrId;
        button.classList.add('added');
        button.textContent = '✓';
    } else {
        const button = document.querySelector(`.plus-btn[onclick*="'${finalData.id}'"]`);
        if (button) {
            button.classList.add('added');
            button.textContent = '✓';
        }
    }

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
    const p = userProducts.find(x => x.id === id);
    if (p) addToCart(p);
}

function removeFromCart(index) {
    const removedProductId = cart[index].id;
    cart.splice(index, 1);
    updateCartUI();

    const button = document.querySelector(`.plus-btn[onclick*="'${removedProductId}'"]`);
    if (button) {
        button.classList.remove('added');
        button.textContent = '+';
    }
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
        const docRef = await addDoc(collection(db, "orders"), orderData);
        let message = `*طلب جديد من: ${name}*\n`;
        message += `📍 العنوان: ${gov} - ${city} - ${address}\n`;
        message += `📞 هواتف: ${phone1} / ${phone2}\n`;
        message += `💳 الدفع: ${payment}\n\n`;
        message += `*المنتجات:*\n`;
        cart.forEach((item, idx) => {
            message += `${idx + 1}. ${item.name} (${item.price} ج.م)\n`;
            if (item.image) message += `🔗 صورة المنتج: ${item.image}\n`;
        });
        message += `\n*الإجمالي: ${orderData.totalAmount}*`;
        const encoded = encodeURIComponent(message);

        alert('تم تأكيد طلبك بنجاح. شكراً لك، سنتواصل معك قريباً!');

        cart = [];
        localStorage.removeItem('aser_cart');
        updateCartUI();
        closeCheckoutModal();
        btn.disabled = false;
        btn.textContent = 'تأكيد الطلب';

        window.open(`https://wa.me/201000539427?text=${encoded}`, '_blank');
    } catch (error) {
        alert('حدث خطأ أثناء حفظ الطلب: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'تأكيد الطلب';
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

// --- Search Logic ---
function initSearch() {
    const searchConfigs = [
        { inputId: 'header-search', resultsId: 'header-search-results' },
        { inputId: 'hero-search-input', resultsId: 'hero-search-results' }
    ];

    searchConfigs.forEach(config => {
        const input = document.getElementById(config.inputId);
        const resultsContainer = document.getElementById(config.resultsId);

        if (input) {
            input.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();

                searchConfigs.forEach(other => {
                    if (other.inputId !== config.inputId) {
                        const otherInput = document.getElementById(other.inputId);
                        if (otherInput && otherInput.value !== e.target.value) {
                            otherInput.value = e.target.value;
                        }
                    }
                });

                if (term === '') {
                    resultsContainer.classList.remove('active');
                    resultsContainer.innerHTML = '';
                    window.isSearching = false;
                    renderProducts(window.currentCategory || 'الكل');
                    return;
                }

                window.isSearching = true;
                const results = userProducts.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const cat = (p.category || '').toLowerCase();
                    const type = (p.type || '').toLowerCase();
                    const brand = (p.brand || '').toLowerCase();
                    return name.includes(term) || cat.includes(term) || type.includes(term) || brand.includes(term);
                });

                renderLiveResults(results, resultsContainer);
                displaySearchResults(results);
            });

            input.addEventListener('blur', () => {
                setTimeout(() => resultsContainer.classList.remove('active'), 200);
            });
            input.addEventListener('focus', () => {
                if (input.value.trim().length > 0) resultsContainer.classList.add('active');
            });
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-results-container')) {
            document.querySelectorAll('.live-search-results').forEach(el => el.classList.remove('active'));
        }
    });
}

function renderLiveResults(results, container) {
    if (!container) return;
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = `<div class="no-results-msg">لا توجد نتائج مطابقة لبحثك.</div>`;
    } else {
        const limitedResults = results.slice(0, 15);
        limitedResults.forEach(p => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.onclick = (e) => {
                e.stopPropagation();
                openProductModalById(p.id);
                container.classList.remove('active');
            };
            div.innerHTML = `
                <img src="${p.image}" alt="${p.name}">
                <div class="search-item-info">
                    <h4>${p.name}</h4>
                    <p>${Number(p.price).toLocaleString()} جنيه</p>
                </div>
            `;
            container.appendChild(div);
        });
    }
    container.classList.add('active');
}

function handleHeroSearch() {
    const input = document.getElementById('hero-search-input');
    const term = input ? input.value.trim() : '';
    if (term === '') return;

    const productsSection = document.getElementById('products');
    if (productsSection) {
        const headerH = document.getElementById('site-header')?.offsetHeight || 70;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function displaySearchResults(results) {
    const grid = document.getElementById('general-products-grid');
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
    const displayPrice = p.price || p.priceG1 || p.priceG2 || 0;
    const oldPrice = p.oldPrice || 0;
    const discount = (oldPrice && Number(oldPrice) > Number(displayPrice))
        ? Math.round(((Number(oldPrice) - Number(displayPrice)) / Number(oldPrice)) * 100)
        : 0;

    let gradeClass = '';
    if (p.grade === 'فرز أول') gradeClass = 'grade-first';
    else if (p.grade === 'فرز ثاني') gradeClass = 'grade-second';
    else if (p.grade === 'فرز ثالث') gradeClass = 'grade-third';

    const gradeBadge = p.grade ? `<span class="status-badge ${gradeClass}">${p.grade}</span>` : '';
    const cartonInfo = p.metersPerCarton ? `<span class="carton-badge">${p.metersPerCarton} م²/كرتونة</span>` : '';

    const trItems = [];
    const tlItems = [];
    const brItems = [];
    const blItems = [];

    const addItem = (pos, html) => {
        if (pos === 'tr') trItems.push(html);
        else if (pos === 'tl') tlItems.push(html);
        else if (pos === 'br') brItems.push(html);
        else if (pos === 'bl') blItems.push(html);
        else trItems.push(html);
    };

    if (p.status && p.status !== 'none' && p.status !== 'عادي') {
        const label = p.status === 'limited' ? 'الكمية محدودة' : (p.status === 'new' ? 'جديد' : p.status);
        const cls = (p.status === 'limited' || p.status === 'الكمية محدودة') ? 'limited-badge' : 'new-badge gold-badge';
        addItem(p.posStatus || 'tr', `<span class="status-badge ${cls}">${label}</span>`);
    }

    if (p.preorder) {
        addItem(p.posPreorder || 'tl', `<span class="status-badge preorder-badge">طلب مسبق</span>`);
    }

    if (p.grade) {
        addItem(p.posGrade || 'bl', gradeBadge);
    }

    if (discount > 0) {
        addItem(p.posDiscount || 'tr', `<span class="status-badge discount-badge-top" style="background:#ef4444; color:white;">خصم ${discount}%</span>`);
    }

    return `
        <div class="product-card">
            <div class="product-img-wrap" onclick="openProductModalById('${safeId}')">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                <div class="card-badges-top">
                    <div class="badge-tr">${trItems.join('')}</div>
                    <div class="badge-tl">${tlItems.join('')}</div>
                    <div class="badge-br">${brItems.join('')}</div>
                    <div class="badge-bl">${blItems.join('')}</div>
                </div>
            </div>
            <div class="product-info" onclick="openProductModalById('${safeId}')">
                <div class="product-pills">
                    ${p.brand ? `<span class="product-brand">${p.brand}</span>` : ''}
                    ${p.type ? `<span class="product-type">${p.type}</span>` : ''}
                </div>
                <h3 class="product-name">${p.name}</h3>

                <div class="product-card-details">
                    ${cartonInfo}
                </div>

                <div class="product-price-row">
                    <div class="old-price-wrapper">
                        ${oldPrice ? `<span class="old-price">${Number(oldPrice).toLocaleString()} ج.م</span>` : ''}
                    </div>
                    <span class="cur-price">${Number(displayPrice).toLocaleString()} ج.م</span>
                </div>
            </div>
            <button class="plus-btn ${isProductInCart(safeId) ? 'added' : ''}" onclick="event.stopPropagation(); addToCartById('${safeId}')">
                ${isProductInCart(safeId) ? '✓' : '+'}
            </button>
        </div>
    `;
}

function renderProducts(categoryFilter = undefined) {
    const grid = document.getElementById('general-products-grid');
    if (!grid) return;

    if (categoryFilter !== undefined) window.currentCategory = categoryFilter;

    let sourceProducts = userProducts;
    if (window.currentBrand) {
        sourceProducts = userProducts.filter(p => (p.brand || '').toLowerCase() === window.currentBrand.toLowerCase());
    }

    let generalProducts = [];
    let mostSoldProducts = [];
    let newArrivalsProducts = [];

    if (window.currentCategory === 'الكل' && !window.currentBrand) {
        sourceProducts.forEach(p => {
            const sec = p.section || '';
            if (sec === 'most_sold' || sec === 'الأكثر مبيعاً') mostSoldProducts.push(p);
            else if (sec === 'new_arrivals' || sec === 'وصل حديثاً') newArrivalsProducts.push(p);
            else generalProducts.push(p);
        });
    } else if (window.currentCategory === 'الكل' && window.currentBrand) {
        generalProducts = sourceProducts;
    } else {
        generalProducts = sourceProducts.filter(p => {
            if (window.currentCategory === 'خلاطات مياه' && p.category === 'خلاطات') {
                if (window.currentSubCategory && window.currentSubCategory !== 'الكل') {
                    return p.subCategory === window.currentSubCategory;
                }
                return true;
            }
            if (p.category === window.currentCategory) {
                if (window.currentSubCategory && window.currentSubCategory !== 'الكل') {
                    return p.subCategory === window.currentSubCategory;
                }
                return true;
            }
            return false;
        });
    }

    if (window.currentType && window.currentType !== 'الكل') {
        generalProducts = generalProducts.filter(p => p.type === window.currentType);
    }
    if (window.currentPriceTag && window.currentPriceTag !== 'الكل') {
        generalProducts = generalProducts.filter(p => p.priceTag === window.currentPriceTag);
    }

    const generalGrid = document.getElementById('general-products-grid');
    const mostSoldGrid = document.getElementById('most-sold-grid');
    const newArrivalsGrid = document.getElementById('new-arrivals-grid');
    const mostSoldSection = document.getElementById('most-sold');
    const newArrivalsSection = document.querySelector('.new-arrivals-section');

    if (generalGrid) generalGrid.innerHTML = '';
    if (mostSoldGrid) mostSoldGrid.innerHTML = '';
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = '';

    allProducts = generalProducts;
    const toShow = generalProducts.slice(0, productLimit);

    if (toShow.length === 0 && (window.currentCategory !== 'الكل' || window.currentBrand)) {
        if (generalGrid) generalGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد منتجات في هذا القسم حالياً.</p>`;
    } else {
        toShow.forEach(p => {
            if (generalGrid) generalGrid.insertAdjacentHTML('beforeend', createProductCardHTML(p));
        });
    }

    const viewMoreWrap = document.querySelector('#products .view-more-wrap');
    if (viewMoreWrap) viewMoreWrap.style.display = (generalProducts.length > productLimit) ? 'block' : 'none';

    if (window.currentCategory === 'الكل' && !window.currentBrand) {
        if (mostSoldSection) mostSoldSection.style.display = 'block';
        if (newArrivalsSection) newArrivalsSection.style.display = 'block';

        if (mostSoldProducts.length === 0) {
            if (mostSoldGrid) mostSoldGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد منتجات مضافة لهذا القسم.</p>`;
        } else {
            mostSoldProducts.forEach(p => {
                if (mostSoldGrid) mostSoldGrid.insertAdjacentHTML('beforeend', createProductCardHTML(p));
            });
        }
        if (newArrivalsProducts.length === 0) {
            if (newArrivalsGrid) newArrivalsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد منتجات مضافة لهذا القسم.</p>`;
        } else {
            newArrivalsProducts.forEach(p => {
                if (newArrivalsGrid) newArrivalsGrid.insertAdjacentHTML('beforeend', createProductCardHTML(p));
            });
        }
    } else {
        if (mostSoldSection) mostSoldSection.style.display = 'none';
        if (newArrivalsSection) newArrivalsSection.style.display = 'none';
    }

    const titleEl = document.querySelector('#products .section-title');
    const heroWrap = document.getElementById('category-hero-wrap');

    renderBrandBanner();
    if (window.currentCategory !== 'الكل') {
        renderSubCategories(window.currentCategory);
    } else {
        const heroWrap = document.getElementById('category-hero-wrap');
        if (heroWrap) heroWrap.innerHTML = '';
    }
    populateFilters(window.currentCategory === 'الكل' && !window.currentBrand ? sourceProducts : generalProducts);
    observeFadeElements();
}

function loadHeroTags() {
    const container = document.getElementById('hero-tags-container');
    if (!container) return;
    onSnapshot(query(collection(db, "hero_tags"), orderBy("createdAt", "desc")), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach(docSnap => {
            const tag = docSnap.data();
            const span = document.createElement('span');
            span.className = 'hero-tag';
            span.textContent = tag.label;
            span.onclick = () => {
                const searchInput = document.getElementById('hero-search-input');
                if (searchInput) {
                    searchInput.value = tag.label;
                    handleHeroSearch();
                }
            };
            container.appendChild(span);
        });
    });
}



function handleCategoryClick(catName) {
    window.currentCategory = catName;
    window.currentSubCategory = 'الكل';
    window.currentType = 'الكل';
    window.currentPriceTag = 'الكل';

    renderProducts(catName);

    const productsSection = document.getElementById('products');
    if (productsSection) {
        const headerH = document.getElementById('site-header')?.offsetHeight || 64;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function handleSubCategoryClick(subCatName) {
    if (window.currentSubCategory === subCatName) {
        window.currentSubCategory = 'الكل';
    } else {
        window.currentSubCategory = subCatName;
    }
    renderProducts(window.currentCategory);
}

function renderSubCategories(catName) {
    const heroWrap = document.getElementById('category-hero-wrap');
    if (!heroWrap) return;

    // Merge hardcoded and dynamic subcategories
    const staticSubs = STATIC_SUB_CATEGORIES.filter(s => s.parent === catName).map(s => ({ 
        name: s.name.trim(), 
        short: (s.short || s.name).trim(),
        image: DEFAULT_SUB_IMG 
    }));
    
    const dynamicSubs = dynamicSubCategories
        .filter(s => s.parent === catName)
        .map(s => ({ 
            name: s.name.trim(), 
            short: (s.short || s.name).trim(),
            image: s.image || DEFAULT_SUB_IMG 
        }));

    // Prioritize dynamic (Firestore) subcategories, then add static ones if they don't exist in dynamic
    const combinedSubs = [...dynamicSubs];
    staticSubs.forEach(ss => {
        if (!combinedSubs.find(ds => ds.name === ss.name)) {
            combinedSubs.push(ss);
        }
    });

    const subs = combinedSubs;
    // Get current products for this category to count
    const catProducts = userProducts.filter(p => {
        if (catName === 'خلاطات مياه') return p.category === 'خلاطات' || p.category === 'خلاطات مياه';
        return p.category === catName;
    });

    if (!subs) {
        heroWrap.innerHTML = `
            <div class="category-hero">
                <h1>${catName}</h1>
                <span class="product-count">${catProducts.length} منتج</span>
            </div>
        `;
        return;
    }

    let html = `
        <div class="category-hero">
            <h1>${catName}</h1>
            <span class="product-count">${catProducts.length} منتج</span>
            
            <div class="category-description-box">
                تسوق أفضل منتجات ${catName} بأسعار تنافسية من المشرقي. أكثر من ${catProducts.length} منتج متوفر من أفضل الماركات مع الشحن لجميع محافظات مصر وإمكانية التقسيط.
            </div>

            <div class="hero-stats-bar">
                <div class="stat-pill">
                    <img src="https://www.google.com/favicon.ico" class="google-icon" alt="Google">
                    <span>4.8</span>
                    <span class="stars-gold">★★★★★</span>
                    <span style="color:#888; margin-right:4px;">8,618+ تقييم</span>
                </div>
                <div style="width:1.5px; height:18px; background:#e2e8f0;"></div>
                <div class="stat-pill">
                    <span style="color:#22c55e;">✓</span>
                    <span>منتجات أصلية 100%</span>
                </div>
            </div>

            <div class="sub-navigation-wrapper">
                <h3 class="sub-nav-title">تصفح الأقسام الفرعية</h3>
                <div class="sub-categories-scroll">
    `;
    
    subs.forEach(sub => {
        const count = catProducts.filter(p => p.subCategory === sub.name).length;
        const isActive = window.currentSubCategory === sub.name;
        const isAdmin = window.location.pathname.includes('dashboard.html') || window.isAdminMode || sessionStorage.getItem('aser_admin') === 'true';

        html += `
            <div class="sub-nav-card ${isActive ? 'active' : ''}" onclick="handleSubCategoryClick('${sub.name}')">
                ${isAdmin ? `
                <div class="sub-card-admin-btn" onclick="event.stopPropagation(); toggleSubCardMenu(event, this)">
                    <span></span>
                    <span></span>
                </div>
                <div class="sub-card-admin-menu">
                    <div class="sub-admin-opt" onclick="event.stopPropagation(); changeSubCategoryImage('${sub.name}', '${catName}')">
                        <span>تغيير الصورة</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                    <div class="sub-admin-opt" onclick="event.stopPropagation(); changeSubCategoryName('${sub.name}', '${catName}')">
                        <span>تغيير الاسم</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                </div>
                ` : ''}
                <div class="sub-card-img">
                    <img src="${sub.image}" alt="${sub.name}">
                </div>
                <div class="sub-card-body">
                    <div class="sub-name">${sub.short || sub.name}</div>
                    <div class="sub-count">${count} منتج</div>
                </div>
            </div>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;

    heroWrap.innerHTML = html;
}

function loadMoreProducts() {
    productLimit += 40;
    renderProducts();
}

// --- Admin Sub-Category Management Utils ---
function toggleSubCardMenu(event, btn) {
    const menus = document.querySelectorAll('.sub-card-admin-menu');
    const menu = btn.nextElementSibling;
    const isShow = menu.classList.contains('show');
    
    menus.forEach(m => m.classList.remove('show'));
    if (!isShow) menu.classList.add('show');

    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

async function changeSubCategoryImage(subName, parentName) {
    const newUrl = prompt(`أدخل رابط الصورة الجديد للقسم "${subName}":`);
    if (newUrl === null) return;
    if (!newUrl.trim()) {
        alert("يرجى إدخال رابط صحيح.");
        return;
    }

    try {
        const q = query(collection(db, "sub_categories"), where("parent", "==", parentName), where("name", "==", subName));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            await updateDoc(doc(db, "sub_categories", snap.docs[0].id), { image: newUrl.trim(), updatedAt: new Date() });
        } else {
            // If it was a hardcoded one and not in DB yet, create it
            await addDoc(collection(db, "sub_categories"), { parent: parentName, name: subName, image: newUrl.trim(), createdAt: new Date() });
        }
        
        alert("✅ تم تحديث الصورة بنجاح!");
        location.reload(); // Refresh to show changes
    } catch (err) {
        console.error(err);
        alert("❌ حدث خطأ: " + err.message);
    }
}

async function changeSubCategoryName(subName, parentName) {
    const newName = prompt(`أدخل الاسم الجديد للقسم "${subName}":`, subName);
    if (newName === null || newName.trim() === subName) return;
    if (!newName.trim()) return;

    try {
        const q = query(collection(db, "sub_categories"), where("parent", "==", parentName), where("name", "==", subName));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            await updateDoc(doc(db, "sub_categories", snap.docs[0].id), { name: newName.trim(), updatedAt: new Date() });
        } else {
            await addDoc(collection(db, "sub_categories"), { parent: parentName, name: newName.trim(), createdAt: new Date() });
        }
        
        // Update all products that belong to this sub-category
        const pq = query(collection(db, "products"), where("category", "==", parentName), where("subCategory", "==", subName));
        const pSnap = await getDocs(pq);
        const updates = pSnap.docs.map(d => updateDoc(doc(db, "products", d.id), { subCategory: newName.trim() }));
        await Promise.all(updates);
        
        alert(`✅ تم تحديث الاسم بنجاح! تم تحديث ${updates.length} منتج.`);
        location.reload();
    } catch (err) {
        console.error(err);
        alert("❌ حدث خطأ: " + err.message);
    }
}

function renderBrandBanner() {
    const existingBanner = document.getElementById('brand-filter-banner');
    if (existingBanner) existingBanner.remove();
    if (!window.currentBrand) return;

    const productsSection = document.getElementById('products');
    if (!productsSection) return;

    const banner = document.createElement('div');
    banner.id = 'brand-filter-banner';
    banner.className = 'brand-filter-banner';
    banner.innerHTML = `
        <span>📌 عرض منتجات ماركة: <strong>${window.currentBrand}</strong></span>
        <button onclick="clearBrandFilter()">إلغاء الفلتر ✕</button>
    `;
    productsSection.insertBefore(banner, productsSection.querySelector('.filter-controls') || productsSection.querySelector('.products-grid'));
}

function populateFilters(products) {
    const typeRow = document.getElementById('type-filters');
    const priceRow = document.getElementById('price-filters');
    if (!typeRow || !priceRow) return;

    const currentProducts = products || [];
    const types = [...new Set(currentProducts.filter(p => p.type).map(p => p.type))];
    const priceTags = [...new Set(currentProducts.filter(p => p.priceTag).map(p => p.priceTag))];

    if (types.length > 0) {
        typeRow.innerHTML = `<span class="filter-label">النوع:</span>` +
            `<span class="filter-pill ${window.currentType === 'الكل' ? 'active' : ''}" onclick="filterByAttr('type', 'الكل', this)">الكل</span>` +
            types.map(t => `<span class="filter-pill ${window.currentType === t ? 'active' : ''}" onclick="filterByAttr('type', '${t}', this)">${t}</span>`).join('');
    } else typeRow.innerHTML = '';

    if (priceTags.length > 0) {
        priceRow.innerHTML = `<span class="filter-label">السعر:</span>` +
            `<span class="filter-pill ${window.currentPriceTag === 'الكل' ? 'active' : ''}" onclick="filterByAttr('priceTag', 'الكل', this)">الكل</span>` +
            priceTags.map(pt => `<span class="filter-pill ${window.currentPriceTag === pt ? 'active' : ''}" onclick="filterByAttr('priceTag', '${pt}', this)">${pt}</span>`).join('');
    } else priceRow.innerHTML = '';
}

function filterByAttr(attr, value) {
    if (attr === 'type') window.currentType = value;
    if (attr === 'priceTag') window.currentPriceTag = value;
    renderProducts();
}

function filterByBrand(brandName) {
    window.currentBrand = brandName;
    window.currentCategory = 'الكل';
    window.currentType = 'الكل';
    window.currentPriceTag = 'الكل';
    renderProducts('الكل');
    closeAllBrandsModal();
    const productsSection = document.getElementById('products');
    if (productsSection) {
        const headerH = document.getElementById('site-header')?.offsetHeight || 64;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function clearBrandFilter() {
    window.currentBrand = null;
    renderProducts('الكل');
}

function loadBrands() {
    const brandsScroll = document.getElementById('brands-scroll');
    const allBrandsGrid = document.getElementById('all-brands-grid');
    if (!brandsScroll) return;

    onSnapshot(query(collection(db, "brands")), (snapshot) => {
        allBrands = [];
        snapshot.forEach(docSnap => allBrands.push({ id: docSnap.id, ...docSnap.data() }));

        brandsScroll.innerHTML = '';
        if (allBrands.length === 0) return;

        allBrands.slice(0, 12).forEach(b => {
            const div = document.createElement('div');
            div.className = 'brand-circle';
            div.onclick = () => filterByBrand(b.name);
            div.innerHTML = `
                <span class="brand-img-wrap"><img src="${b.image}" alt="${b.name}"></span>
                <div class="brand-label">${b.label || b.name}</div>
            `;
            brandsScroll.appendChild(div);
        });

        if (allBrandsGrid) {
            allBrandsGrid.innerHTML = '';
            allBrands.forEach(b => {
                const item = document.createElement('div');
                item.className = 'all-brand-item';
                item.onclick = () => filterByBrand(b.name);
                item.innerHTML = `<img src="${b.image}" alt="${b.name}"><span>${b.label || b.name}</span>`;
                allBrandsGrid.appendChild(item);
            });
        }
    });
}

function openAllBrandsModal() {
    const modal = document.getElementById('all-brands-modal');
    const overlay = document.getElementById('all-brands-overlay');
    if (modal) { modal.classList.add('show'); overlay.classList.add('show'); }
}

function closeAllBrandsModal() {
    const modal = document.getElementById('all-brands-modal');
    const overlay = document.getElementById('all-brands-overlay');
    if (modal) { modal.classList.remove('show'); overlay.classList.remove('show'); }
}


// --- Product Modal Logic ---
let currentModalProduct = null;
let currentModalGrade = 1;
let currentModalColor = null;

function openProductModal(p) {
    if (!p) return;
    currentModalProduct = p;
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (!modal) return;

    document.getElementById('modal-name').textContent = p.name;
    document.getElementById('modal-type').textContent = p.type || p.category;

    const gradeContainer = document.getElementById('grade-selection-container');
    const btnG1 = document.getElementById('btn-grade-1');
    const btnG2 = document.getElementById('btn-grade-2');
    const btnG3 = document.getElementById('btn-grade-3');
    const colorContainer = document.getElementById('color-selection-container');
    const colorListUI = document.getElementById('modal-color-list');

    if (p.priceG1 || p.priceG2 || p.priceG3) {
        gradeContainer.style.display = 'block';
        if (btnG1) btnG1.style.display = p.priceG1 ? 'inline-block' : 'none';
        if (btnG2) btnG2.style.display = p.priceG2 ? 'inline-block' : 'none';
        if (btnG3) btnG3.style.display = p.priceG3 ? 'inline-block' : 'none';
    } else {
        gradeContainer.style.display = 'none';
    }

    if (p.colors && p.colors.length > 0) {
        colorContainer.style.display = 'block';
        colorListUI.innerHTML = '';
        p.colors.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'grade-btn';
            btn.textContent = c.name;
            btn.dataset.color = c.name;
            btn.onclick = () => selectModalColor(c.name);
            colorListUI.appendChild(btn);
        });
        currentModalColor = p.colors[0].name;
    } else {
        colorContainer.style.display = 'none';
        currentModalColor = null;
    }

    const calcContainer = document.getElementById('calculator-container');
    const calcInput = document.getElementById('calc-meters');
    if (p.metersPerCarton) {
        if (calcContainer) calcContainer.style.display = 'block';
        if (calcInput) calcInput.value = '';
        document.getElementById('calc-factor').textContent = p.metersPerCarton;
    } else if (calcContainer) calcContainer.style.display = 'none';

    if (p.priceG1) {
        selectModalGrade(1);
    } else if (p.priceG2) {
        selectModalGrade(2);
    } else if (p.priceG3) {
        selectModalGrade(3);
    } else if (currentModalColor) {
        selectModalColor(currentModalColor);
    } else {
        const standardPrice = p.price || 0;
        document.getElementById('modal-cur-price').textContent = `${Number(standardPrice).toLocaleString()} جنيه`;
        document.getElementById('modal-old-price').textContent = p.oldPrice ? `${Number(p.oldPrice).toLocaleString()} ج.م` : '';
        document.getElementById('modal-grade').textContent = p.grade || '-';
        updateModalActions(standardPrice, p.grade || '', '');
    }

    document.getElementById('modal-brand').textContent = p.brand || '-';
    document.getElementById('modal-size').textContent = p.size || '-';

    const cartonSpecBox = document.getElementById('spec-carton-box');
    if (cartonSpecBox) {
        if (p.metersPerCarton) {
            cartonSpecBox.style.display = 'block';
            document.getElementById('modal-carton-info').textContent = `${p.metersPerCarton} م²`;
        } else cartonSpecBox.style.display = 'none';
    }

    const descText = document.getElementById('modal-desc-text');
    const descBlock = document.getElementById('modal-description');
    if (p.description) { descText.textContent = p.description; descBlock.style.display = 'block'; }
    else descBlock.style.display = 'none';

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

    modal.classList.add('show');
    overlay.classList.add('show');
}

function selectModalGrade(gradeNum) {
    currentModalGrade = gradeNum;
    const p = currentModalProduct;
    let price;
    let gradeName;
    if (gradeNum === 1) { price = p.priceG1; gradeName = 'فرز أول'; }
    else if (gradeNum === 2) { price = p.priceG2; gradeName = 'فرز ثاني'; }
    else { price = p.priceG3; gradeName = 'فرز ثالث'; }

    document.getElementById('modal-cur-price').textContent = `${Number(price).toLocaleString()} جنيه`;
    document.getElementById('modal-grade').textContent = gradeName;
    if (document.getElementById('btn-grade-1')) document.getElementById('btn-grade-1').classList.toggle('active', gradeNum === 1);
    if (document.getElementById('btn-grade-2')) document.getElementById('btn-grade-2').classList.toggle('active', gradeNum === 2);
    if (document.getElementById('btn-grade-3')) document.getElementById('btn-grade-3').classList.toggle('active', gradeNum === 3);
    updateModalActions(price, gradeName, currentModalColor || '');
}

function selectModalColor(colorName) {
    currentModalColor = colorName;
    const p = currentModalProduct;
    const colorObj = p.colors.find(c => c.name === colorName);
    let price = colorObj?.price || (currentModalGrade ? (currentModalGrade === 1 ? p.priceG1 : (currentModalGrade === 2 ? p.priceG2 : p.priceG3)) : p.price);
    document.getElementById('modal-cur-price').textContent = `${Number(price).toLocaleString()} جنيه`;
    document.querySelectorAll('#modal-color-list .grade-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.color === colorName));
    const gradeLabel = currentModalGrade === 1 ? 'فرز أول' : (currentModalGrade === 2 ? 'فرز ثاني' : (currentModalGrade === 3 ? 'فرز ثالث' : p.grade || ''));
    updateModalActions(price, gradeLabel, colorName);
}

function updateModalActions(price, gradeLabel, colorLabel) {
    const p = currentModalProduct;
    const addBtn = document.getElementById('modal-add-btn');
    const pricePerMeterSpan = document.getElementById('calc-price-per-meter');
    if (pricePerMeterSpan) pricePerMeterSpan.textContent = price;

    addBtn.onclick = () => {
        const itemToAdd = { ...p, price: price, grade: gradeLabel, color: colorLabel };
        const calcInput = document.getElementById('calc-meters');
        const calcCartonsSpan = document.getElementById('calc-cartons');
        if (calcInput && calcInput.value && !isNaN(parseFloat(calcInput.value))) {
            itemToAdd.requestedMeters = calcInput.value;
            itemToAdd.cartons = calcCartonsSpan.textContent;
            itemToAdd.name = `${itemToAdd.name} [${itemToAdd.cartons} كرتونة]`;
        }
        addToCart(itemToAdd);
        closeProductModal();
    };

    const waLink = document.getElementById('modal-wa-link');
    let msg = `مرحباً آسر كريم، أود الاستفسار عن منتج: ${p.name}`;
    if (gradeLabel) msg += `\nالفرز: ${gradeLabel}`;
    if (colorLabel) msg += `\nاللون: ${colorLabel}`;
    const calcInput = document.getElementById('calc-meters');
    const calcCartonsSpan = document.getElementById('calc-cartons');
    if (calcInput && calcInput.value && !isNaN(parseFloat(calcInput.value))) msg += `\nالكمية: ${calcInput.value} متر (${calcCartonsSpan.textContent} كرتونة)`;
    msg += `\nالسعر: ${Number(price).toLocaleString()} ج.م`;
    waLink.href = `https://wa.me/201000539427?text=${encodeURIComponent(msg)}`;
}

function calculateCartons() {
    const p = currentModalProduct;
    if (!p || !p.metersPerCarton) return;
    const input = document.getElementById('calc-meters');
    const resultBox = document.getElementById('calc-result-box');
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) {
        const factor = parseFloat(p.metersPerCarton);
        const cartons = Math.ceil(val / factor);
        const actualMeters = (cartons * factor).toFixed(3);
        document.getElementById('calc-cartons').textContent = cartons;
        document.getElementById('calc-actual-meters').textContent = actualMeters;
        resultBox.style.display = 'block';
        const currentPrice = currentModalGrade ? (currentModalGrade === 1 ? p.priceG1 : p.priceG2) : p.price;
        document.getElementById('modal-cur-price').textContent = `${Number(actualMeters * currentPrice).toLocaleString()} جنيه (إجمالي)`;
    } else resultBox.style.display = 'none';
}

// --- Scanner Logic ---
let html5QrCode = null;
function openScanner() {
    const modal = document.getElementById('scanner-modal');
    const overlay = document.getElementById('scanner-overlay');
    if (modal) { modal.classList.add('show'); overlay.classList.add('show'); }

    html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText) => {
        console.log("[Scanner] Scanned text:", decodedText);
        let idToFind = null;
        try {
            if (decodedText.startsWith('http')) {
                const url = new URL(decodedText);
                idToFind = url.searchParams.get('product');
            } else {
                idToFind = decodedText.trim();
            }
        } catch (e) {
            idToFind = decodedText.trim();
        }

        if (idToFind) {
            const found = userProducts.find(x => x.id === idToFind);
            if (found) {
                stopScanner();
                closeScanner();
                openProductModal(found);
            } else {
                console.warn("[Scanner] Product not found in database:", idToFind);
            }
        }
    };
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 280, height: 280 } },
        qrCodeSuccessCallback
    ).catch(err => {
        console.error("[Scanner] Start failed:", err);
        alert("فشل تشغيل الكاميرا. يرجى التأكد من منح الأذونات.");
        closeScanner();
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(() => { });
}

function closeScanner() {
    stopScanner();
    const modal = document.getElementById('scanner-modal');
    const overlay = document.getElementById('scanner-overlay');
    if (modal) { modal.classList.remove('show'); overlay.classList.remove('show'); }
}

function openProductModalById(id) {
    const p = userProducts.find(x => x.id === id);
    if (p) openProductModal(p);
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (modal) { modal.classList.remove('show'); overlay.classList.remove('show'); }
}

function observeFadeElements() {
    const fadeElements = document.querySelectorAll('.feature-card, .category-card, .product-card, .stat-item, .service-card, .brand-circle, .all-brand-item');
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

function loadDynamicSubCategories() {
    onSnapshot(collection(db, "sub_categories"), (snapshot) => {
        dynamicSubCategories = [];
        snapshot.forEach(docSnap => {
            dynamicSubCategories.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Update window.allSubCategories for other parts of the app
        // Update window.allSubCategories for other parts of the app
        window.allSubCategories = [...STATIC_SUB_CATEGORIES];
        dynamicSubCategories.forEach(ds => {
            const exists = STATIC_SUB_CATEGORIES.some(s => s.name.trim() === ds.name.trim() && s.parent.trim() === ds.parent.trim());
            if (!exists) window.allSubCategories.push(ds);
        });

        if (window.currentCategory && window.currentCategory !== 'الكل') {
            renderProducts(window.currentCategory);
        }
    });
}

function init() {
    loadHeroTags();
    loadBrands();
    loadDynamicSubCategories();
    onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
        userProducts = [];
        snapshot.forEach(docSnap => userProducts.push({ id: docSnap.id, ...docSnap.data() }));
        if (!window.isSearching) renderProducts(window.currentCategory);
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product');
        if (productId) setTimeout(() => openProductModalById(productId), 800);
    });
    initSearch();
    updateCartUI();
}
init();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            // Check for updates periodically or on navigation
            reg.update();

            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'activated' && navigator.serviceWorker.controller) {
                        console.log('[PWA] Update installed and active.');
                    }
                };
            };
        }).catch(err => console.error('[PWA] Registration Failed', err));
    });

    // This event fires when the new service worker takes over (after skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('[PWA] Controller changed, reloading page for update...');
        window.location.reload();
    });
}

