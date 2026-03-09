// =====================================================
// أسر كريم للسيراميك — script.js (Firebase Module)
// =====================================================
import { db, collection, addDoc, onSnapshot, query, doc, getDocs } from './firebase-config.js';

// --- Global State ---
let userProducts = [];
let allBrands = [];
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
window.loadMoreProducts = loadMoreProducts; // Export loadMoreProducts

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
            const id = card.querySelector('.plus-btn').onclick.toString().match(/'([^']+)'/)[1]; // Extract ID from onclick
            finalData = userProducts.find(p => p.id === id);
        }
    } else { // Called with product object
        finalData = productDataOrId;
    }

    if (!finalData) return;

    // Check if product is already in cart
    if (isProductInCart(finalData.id)) {
        showToast(`"${finalData.name}" موجود بالفعل في السلة!`);
        return;
    }

    console.log('Adding to cart:', finalData.name);
    cart.push(finalData);
    updateCartUI();
    showToast(finalData.name); // Pass name to toast

    // Visual feedback for the button
    if (isElement) {
        const button = productDataOrId;
        button.classList.add('added');
        button.textContent = '✓';
        setTimeout(() => {
            // button.classList.remove('added'); // Keep it added if it's in cart
            // button.textContent = '+';
        }, 1500);
    } else { // If added by ID, find the button and update it
        const button = document.querySelector(`.plus-btn[onclick*="'${finalData.id}'"]`);
        if (button) {
            button.classList.add('added');
            button.textContent = '✓';
        }
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
// window.addToCartById = addToCartById; // Already exported above

function removeFromCart(index) {
    const removedProductId = cart[index].id;
    cart.splice(index, 1);
    updateCartUI();

    // Update the corresponding product card button
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
            if (item.image) message += `🔗 صورة المنتج: ${item.image}\n`;
        });
        message += `\n*الإجمالي: ${orderData.totalAmount}*`;
        const encoded = encodeURIComponent(message);

        // Success alert
        alert('تم تأكيد طلبك بنجاح. شكراً لك، سنتواصل معك قريباً!');

        cart = [];
        localStorage.removeItem('aser_cart');
        updateCartUI();
        closeCheckoutModal();
        btn.disabled = false;
        btn.textContent = 'تأكيد الطلب';

        // Open WhatsApp
        window.open(`https://wa.me/201000539427?text=${encoded}`, '_blank');
    } catch (error) {
        console.error("Critical error saving order: ", error);
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

                // Sync the other search input
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
                displaySearchResults(results); // Keep existing grid filtering as well
            });

            // Close results on blur after small delay
            input.addEventListener('blur', () => {
                setTimeout(() => resultsContainer.classList.remove('active'), 200);
            });
            input.addEventListener('focus', () => {
                if (input.value.trim().length > 0) resultsContainer.classList.add('active');
            });
        }
    });

    // Handle generic clicks to close search
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
        const limitedResults = results.slice(0, 15); // Show more results
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

    // Trigger scroll
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
    const discount = (p.oldPrice && p.price && Number(p.oldPrice) > Number(p.price)) 
        ? Math.round(((Number(p.oldPrice) - Number(p.price)) / Number(p.oldPrice)) * 100) 
        : 0;
    
    return `
        <div class="product-card">
            <div class="product-img-wrap" onclick="openProductModalById('${safeId}')">
                ${discount > 0 ? `<span class="discount-badge">خصم ${discount}%</span>` : ''}
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                ${p.status === 'limited' ? `<span class="limited-badge">الكمية محدودة</span>` : ''}
                ${p.status === 'new' ? `<span class="new-badge gold-badge">جديد</span>` : ''}
            </div>
            <div class="product-info" onclick="openProductModalById('${safeId}')">
                <div class="product-pills">
                    ${p.brand ? `<span class="product-brand">${p.brand}</span>` : ''}
                    ${p.type ? `<span class="product-type">${p.type}</span>` : ''}
                </div>
                <h3 class="product-name">${p.name}</h3>
                <div class="product-price-row">
                    ${p.oldPrice ? `<span class="old-price">${Number(p.oldPrice).toLocaleString()} ج.م</span>` : ''}
                    <span class="cur-price">${Number(p.price).toLocaleString()} ج.م</span>
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

    // Apply brand filter first if active
    let sourceProducts = userProducts;
    if (window.currentBrand) {
        sourceProducts = userProducts.filter(p => (p.brand || '').toLowerCase() === window.currentBrand.toLowerCase());
    }

    let generalProducts = [];
    let mostSoldProducts = [];
    let newArrivalsProducts = [];

    if (window.currentCategory === 'الكل' && !window.currentBrand) {
        sourceProducts.forEach(p => {
            if (p.section === 'most_sold') {
                mostSoldProducts.push(p);
            } else if (p.section === 'new_arrivals') {
                newArrivalsProducts.push(p);
            } else {
                generalProducts.push(p);
            }
        });
    } else if (window.currentCategory === 'الكل' && window.currentBrand) {
        // If brand is active, show everything in general grid
        generalProducts = sourceProducts;
    } else {
        generalProducts = sourceProducts.filter(p => p.category === window.currentCategory);
    }

    // Apply type and price filters
    if (window.currentType && window.currentType !== 'الكل') {
        generalProducts = generalProducts.filter(p => p.type === window.currentType);
    }
    if (window.currentPriceTag && window.currentPriceTag !== 'الكل') {
        generalProducts = generalProducts.filter(p => p.priceTag === window.currentPriceTag);
    }

    // Handle Grids
    const generalGrid = document.getElementById('general-products-grid');
    const mostSoldGrid = document.getElementById('most-sold-grid');
    const newArrivalsGrid = document.getElementById('new-arrivals-grid');
    const mostSoldSection = document.getElementById('most-sold');
    const newArrivalsSection = document.querySelector('.new-arrivals-section');

    if (generalGrid) generalGrid.innerHTML = '';
    if (mostSoldGrid) mostSoldGrid.innerHTML = '';
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = '';

    // Save for pagination
    allProducts = generalProducts;
    const toShow = generalProducts.slice(0, productLimit);

    if (toShow.length === 0 && (window.currentCategory !== 'الكل' || window.currentBrand)) {
        if (generalGrid) {
            generalGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-weight: 700;">لا توجد منتجات في هذا القسم حالياً.</p>`;
        }
    } else {
        toShow.forEach(p => {
            if (generalGrid) generalGrid.insertAdjacentHTML('beforeend', createProductCardHTML(p));
        });
    }

    // Handle "View More" Button
    const viewMoreWrap = document.querySelector('#products .view-more-wrap');
    if (viewMoreWrap) {
        viewMoreWrap.style.display = (generalProducts.length > productLimit) ? 'block' : 'none';
    }

    // Section Visibility and rendering for 'الكل'
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

    // UI Titles and Backgrounds
    const titleEl = document.querySelector('#products .section-title');
    const heroWrap = document.getElementById('category-hero-wrap');

    if (window.currentCategory === 'الكل') {
        if (titleEl) titleEl.textContent = window.currentBrand ? `منتجات ${window.currentBrand}` : 'منتجاتنا';
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

    renderBrandBanner();
    populateFilters(window.currentCategory === 'الكل' && !window.currentBrand ? sourceProducts : generalProducts);
    observeFadeElements();
}

function loadMoreProducts() {
    productLimit += 40;
    renderProducts(); // Re-render with new limit
}

function renderBrandBanner() {
    // Remove any existing banner
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

    // Use the passed 'products' which are already filtered by category/brand
    const currentProducts = products || []; 
    const types = [...new Set(currentProducts.filter(p => p.type).map(p => p.type))];
    const priceTags = [...new Set(currentProducts.filter(p => p.priceTag).map(p => p.priceTag))];

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

function filterByAttr(attr, value) {
    if (attr === 'type') window.currentType = value;
    if (attr === 'priceTag') window.currentPriceTag = value;
    renderProducts();
}
window.filterByAttr = filterByAttr;

// --- Brand Filter Functions ---
function filterByBrand(brandName) {
    window.currentBrand = brandName;
    window.currentCategory = 'الكل';
    window.currentType = 'الكل';
    window.currentPriceTag = 'الكل';

    // Highlight the active brand
    document.querySelectorAll('.brand-circle, .all-brand-item').forEach(el => {
        el.classList.toggle('active', el.dataset.brand === brandName);
    });

    renderProducts('الكل');

    // Close modal if open
    closeAllBrandsModal();

    // Scroll to products section
    const productsSection = document.getElementById('products');
    if (productsSection) {
        const headerH = document.getElementById('site-header')?.offsetHeight || 64;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function clearBrandFilter() {
    window.currentBrand = null;
    document.querySelectorAll('.brand-circle, .all-brand-item').forEach(el => el.classList.remove('active'));
    renderProducts('الكل');
}

// --- Brands Loading ---
function loadBrands() {
    const brandsScroll = document.getElementById('brands-scroll');
    const allBrandsGrid = document.getElementById('all-brands-grid');
    if (!brandsScroll) return;

    onSnapshot(query(collection(db, "brands")), (snapshot) => {
        allBrands = [];
        snapshot.forEach(docSnap => {
            allBrands.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Render first 6 in homepage
        brandsScroll.innerHTML = '';
        if (allBrands.length === 0) {
            brandsScroll.innerHTML = '<p style="color:#888;text-align:center;width:100%;padding:20px;">لا توجد ماركات مضافة حتى الآن.</p>';
            return;
        }

        const previewBrands = allBrands.slice(0, 12);
        previewBrands.forEach(b => {
            const div = document.createElement('div');
            div.className = 'brand-circle';
            div.dataset.brand = b.name;
            div.onclick = () => filterByBrand(b.name);
            div.innerHTML = `
                <span class="brand-img-wrap">
                    <img src="${b.image}" alt="${b.name}" loading="lazy">
                </span>
                <div class="brand-label">${b.label || b.name}</div>
            `;
            brandsScroll.appendChild(div);
        });

        // Update all brands modal grid
        if (allBrandsGrid) {
            allBrandsGrid.innerHTML = '';
            allBrands.forEach(b => {
                const item = document.createElement('div');
                item.className = 'all-brand-item';
                item.dataset.brand = b.name;
                item.onclick = () => filterByBrand(b.name);
                item.innerHTML = `
                    <img src="${b.image}" alt="${b.name}" loading="lazy">
                    <span>${b.label || b.name}</span>
                `;
                allBrandsGrid.appendChild(item);
            });
        }

        observeFadeElements();
    });
}

function openAllBrandsModal() {
    const modal = document.getElementById('all-brands-modal');
    const overlay = document.getElementById('all-brands-overlay');
    if (modal) modal.classList.add('show');
    if (overlay) overlay.classList.add('show');
}

function closeAllBrandsModal() {
    const modal = document.getElementById('all-brands-modal');
    const overlay = document.getElementById('all-brands-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

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

    const descEl = document.getElementById('modal-description');
    if (descEl) {
        descEl.textContent = p.description || '';
        descEl.style.display = p.description ? 'block' : 'none';
    }

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

// --- Initialize ---

let productOpenedFromURL = false;
function init() {
    loadHeroTags();
    loadBrands();
    onSnapshot(query(collection(db, "products")), (snapshot) => {
        userProducts = [];
        snapshot.forEach(docSnap => userProducts.push({ id: docSnap.id, ...docSnap.data() }));
        if (!window.isSearching) {
            renderProducts(window.currentCategory);
        }

        // Check for product ID in URL and open modal (only once)
        if (!productOpenedFromURL) {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product');
            if (productId) {
                console.log("Found product ID in URL:", productId);
                setTimeout(() => {
                    openProductModalById(productId);
                    productOpenedFromURL = true;
                }, 800);
            }
        }
    });
    initSearch();
    updateCartUI();
    console.log('Asr Karim Website Initialized ✓');
}
init();
