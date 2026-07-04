import { Category, Product } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'makeup',
    name: '化妝品',
    icon: 'sparkles',
    subcategories: [
      '妝前乳',
      '粉底液',
      '粉餅',
      '氣墊粉餅',
      '遮瑕膏',
      '蜜粉',
      '眼影',
      '眼線筆',
      '睫毛膏',
      '眉筆',
      '眉粉',
      '染眉膏',
      '唇膏',
      '唇釉',
      '唇蜜',
      '腮紅',
      '修容餅',
      '打亮餅',
      '香水'
    ]
  },
  {
    id: 'skincare',
    name: '保養品',
    icon: 'droplets',
    subcategories: [
      '洗面乳',
      '洗髮精',
      '沐浴乳',
      '化妝水',
      '精華液',
      '乳液',
      '乳霜',
      '護唇膏',
      '隔離霜',
      '防曬乳'
    ]
  },
  {
    id: 'supplement',
    name: '保健品',
    icon: 'pill',
    subcategories: [
      '維他命C',
      '益生菌',
      '膠原蛋白',
      '魚油',
      '綜合維他命'
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    category: 'makeup',
    subcategory: '粉底液',
    brand: 'Dior',
    name: '迪奧精萃再生玫瑰微導粉底',
    photo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=120&q=80',
    status: 'active',
    threshold: 0,
    instances: [
      {
        id: 'inst_1_1',
        qty: 1,
        capacity: '30ml',
        usage: '使用中',
        expiry: '2026-08-14',
        paoMonths: 6,
        openedDate: '2026-02-15' // 已開封 4.5 個月 (尚未過期)
      },
      {
        id: 'inst_1_2',
        qty: 1,
        capacity: '30ml',
        usage: '未開封',
        expiry: '2027-01-01'
      }
    ]
  },
  {
    id: 'prod_2',
    category: 'makeup',
    subcategory: '粉底液',
    brand: 'GIORGIO ARMANI',
    name: '輕透亮絲粉底',
    status: 'active',
    threshold: 2,
    instances: [
      {
        id: 'inst_2_1',
        qty: 1,
        capacity: '30ml',
        usage: '未開封',
        expiry: '2027-06-14'
      }
    ]
  }
];
export const INITIAL_CAPACITY_UNITS = ['ml', 'g', '個', '罐', '錠', '顆', '片', '包', '盒', '支', '條', '瓶'];
