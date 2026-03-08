// First, you must have the db and collection imports available.
// If running from the dashboard.html console, they are usually globally accessible if not namespaced.
// This script is meant to be pasted into the browser console on the dashboard.html page.

async function seedBrands() {
    const brands = [
        { name: 'Ideal Standard', label: 'ايديال ستاندرد', image: 'اديل استندر.jpeg' },
        { name: 'Porcelux', label: 'بورسليوكس', image: 'بورسليوكس.jpeg' },
        { name: 'Beroia', label: 'بيرويا', image: 'ريروي.jpeg' },
        { name: 'Keramica', label: 'كيراميكا', image: 'كرماكا.jpeg' },
        { name: 'Cyril', label: 'سارل / Cyril', image: 'سارل.jpeg' },
        { name: 'Micavit', label: 'ماكافايت', image: 'ماكافايت.jpeg' },
        { name: 'Houses', label: 'هاوسز', image: 'هاوسز.jpeg' },
        { name: 'Tib', label: 'الطيب - Tib', image: 'الطيب.jpeg' },
        { name: 'Abiura', label: 'ابيورا', image: 'ابيورا.jpeg' },
        { name: 'Kevano', label: 'كيفانو', image: 'كيفانو.jpeg' },
        { name: 'Cleopatra', label: 'كليوباترا', image: 'كيلوبترا .jpeg' },
        { name: 'Duravit', label: 'ديورافيت', image: 'دورفات.jpeg' },
        { name: 'Elegant', label: 'الجانت', image: 'الجانت.jpeg' },
        { name: 'Rondy', label: 'روندا', image: 'روندا .jpeg' },
        { name: 'Royal', label: 'رويال', image: 'رويال.jpeg' },
        { name: 'Remas', label: 'ريماس', image: 'ريماس .jpeg' },
        { name: 'Art Ceramic', label: 'سيراميكا ارت', image: 'سيراميكا ارت .jpeg' },
        { name: 'Sanipure', label: 'صان بيور', image: 'صان بيور .jpeg' },
        { name: 'Verdi', label: 'فيديا / Verdi', image: 'فيديا .jpeg' },
        { name: 'Legacy', label: 'لجاسا / Legacy', image: 'لجاسا.jpeg' },
        { name: 'Grohe', label: 'جروهي', image: 'grohe_logo.png' },
        { name: 'Akgur', label: 'أكجور', image: 'akgur_logo.png' },
        { name: 'Al-Amir', label: 'الأمير', image: 'alamir_logo.png' }
    ];

    console.log("Starting brand seeding...");
    for (const b of brands) {
        try {
            // Check if already exists to avoid duplicates
            // (Assuming you have access to db, collection, addDoc from dashboard.html context)
            await addDoc(collection(db, 'brands'), {
                ...b,
                createdAt: new Date()
            });
            console.log(`✅ Added: ${b.name}`);
        } catch (e) {
            console.error(`❌ Failed: ${b.name}`, e);
        }
    }
    console.log("Seeding complete!");
}

seedBrands();
