const BASE = 'https://dummyjson.com';

const STORE_NAMES = ['Green Market', 'Farm Bazaar', 'Fresh Corner', 'Veggie World', 'Harvest Home'];
const STORE_IDS   = ['s1', 's2', 's3', 's4', 's5'];

function transform(p, index) {
  const discount      = Math.max(Math.round(p.discountPercentage), 5);
  const priceQAR      = Math.max(Math.round(p.price * 3.64), 3);
  const originalPrice = Math.round(priceQAR / (1 - discount / 100));
  return {
    id:            String(p.id),
    name:          p.title,
    price:         priceQAR,
    originalPrice,
    discount,
    image:         p.thumbnail,
    rating:        p.rating,
    reviews:       Math.max(p.stock * 4, 12),
    store:         STORE_NAMES[index % STORE_NAMES.length],
    storeId:       STORE_IDS[index % STORE_IDS.length],
    unit:          'Pcs',
  };
}

// Single shared promise so parallel callers never double-fetch
let _groceriesPromise = null;

export function fetchGroceries() {
  if (!_groceriesPromise) {
    _groceriesPromise = fetch(`${BASE}/products/category/groceries?limit=50`)
      .then((r) => r.json())
      .then((json) => (json.products || []).map((p, i) => transform(p, i)))
      .catch((e) => { _groceriesPromise = null; throw e; });
  }
  return _groceriesPromise;
}

const STORE_META = [
  { id: 's1', name: 'Green Market',  rating: 4.8, time: '20-30 min', fee: 'Free',   dist: '1.2 km', isOpen: true,  cashback: 5, minOrder: 'QAR 30', tags: ['Organic', 'Fresh'],     logo: 'https://ui-avatars.com/api/?name=Green+Market&background=B8975A&color=FAF7F2&size=128'  },
  { id: 's2', name: 'Farm Bazaar',   rating: 4.6, time: '25-35 min', fee: '5 QAR',  dist: '2.5 km', isOpen: true,  cashback: 0, minOrder: 'QAR 50', tags: ['Fruits', 'Vegetables'], logo: 'https://ui-avatars.com/api/?name=Farm+Bazaar&background=7A5C2E&color=FAF7F2&size=128'   },
  { id: 's3', name: 'Fresh Corner',  rating: 4.9, time: '15-25 min', fee: 'Free',   dist: '0.8 km', isOpen: true,  cashback: 3, minOrder: 'QAR 25', tags: ['Daily', 'Dairy'],       logo: 'https://ui-avatars.com/api/?name=Fresh+Corner&background=5C3D00&color=FAF7F2&size=128'  },
  { id: 's4', name: 'Veggie World',  rating: 4.5, time: '30-40 min', fee: '8 QAR',  dist: '3.1 km', isOpen: false, cashback: 2, minOrder: 'QAR 40', tags: ['Veggies', 'Herbs'],     logo: 'https://ui-avatars.com/api/?name=Veggie+World&background=3D2B00&color=FAF7F2&size=128'  },
  { id: 's5', name: 'Harvest Home',  rating: 4.7, time: '35-45 min', fee: 'Free',   dist: '1.9 km', isOpen: true,  cashback: 7, minOrder: 'QAR 35', tags: ['Organic', 'Fruits'],    logo: 'https://ui-avatars.com/api/?name=Harvest+Home&background=B8975A&color=FAF7F2&size=128'  },
];

// Reuses the same fetched groceries — no extra network call
export async function fetchStores() {
  const products = await fetchGroceries();
  return STORE_META.map((meta, i) => ({
    ...meta,
    cover: products[i * 5]?.image || products[i]?.image || products[0]?.image || '',
  }));
}
