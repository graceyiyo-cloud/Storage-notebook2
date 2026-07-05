/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface ProductInstance {
  id: string;
  qty: number;
  capacity: string;
  usage: '使用中' | '未開封' | '已用完' | '已丟棄';
  expiry: string; // YYYY-MM-DD
  paoMonths?: number; // 開封後可使用月數
  openedDate?: string; // 開封日期 YYYY-MM-DD
  finishedDate?: string; // 用完或丟棄的日期 YYYY-MM-DD
  purchaseDate?: string; // 購買日期 YYYY-MM-DD
  purchasePlace?: string; // 購買地點
  price?: number; // 單價
}

export interface Product {
  id: string;
  category: string; // matches Category.id
  subcategory: string;
  brand: string;
  name: string;
  photo?: string; // base64 string
  photoThumbnail?: string; // tiny base64 string for instant loading
  threshold: number; // 補貨門檻
  instances: ProductInstance[];
  status: 'active' | 'archived';
  archivedAt?: string; // YYYY-MM-DD string or ISO timestamp
}
