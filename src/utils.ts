import { Product, ProductInstance } from './types';

/**
 * Calculates the number of days remaining until the product's official expiration date.
 */
export function calculateDaysToExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  
  if (isNaN(expiry.getTime())) return 9999;
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates Period After Opening (PAO) expiry.
 * Returns the expiry date, remaining days, and whether it has expired.
 */
export function calculatePaoExpiry(openedDateStr: string | undefined, paoMonths: number | undefined) {
  if (!openedDateStr || !paoMonths || paoMonths <= 0) return null;
  const opened = new Date(openedDateStr);
  if (isNaN(opened.getTime())) return null;
  
  // Calculate expiry date by adding PAO months to opening date
  const expiryDate = new Date(opened);
  expiryDate.setMonth(expiryDate.getMonth() + paoMonths);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  
  const yyyy = expiryDate.getFullYear();
  const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
  const dd = String(expiryDate.getDate()).padStart(2, '0');
  
  return {
    expiryDate: `${yyyy}-${mm}-${dd}`,
    daysLeft,
    isExpired,
    daysOverdue: Math.max(0, -daysLeft)
  };
}

interface ExpiredPaoItem {
  product: Product;
  instance: ProductInstance;
  expiryDate: string;
  daysOverdue: number;
}

/**
 * Checks all active products and finds items that are '使用中' and have exceeded their PAO period.
 */
export function checkAllOpenedExpiredProducts(products: Product[]): ExpiredPaoItem[] {
  const expiredItems: ExpiredPaoItem[] = [];
  
  products.forEach(product => {
    if (product.status !== 'active') return;
    
    product.instances.forEach(instance => {
      if (instance.usage === '使用中' && instance.paoMonths && instance.openedDate) {
        const pao = calculatePaoExpiry(instance.openedDate, instance.paoMonths);
        if (pao && pao.isExpired) {
          expiredItems.push({
            product,
            instance,
            expiryDate: pao.expiryDate,
            daysOverdue: pao.daysOverdue
          });
        }
      }
    });
  });
  
  return expiredItems;
}
