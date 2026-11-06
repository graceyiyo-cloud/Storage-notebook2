import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDocFromServer, setDoc, deleteDoc, getDocs, getDocsFromServer, collection, deleteField, updateDoc, query } from 'firebase/firestore';
import { auth, db, storage, signInWithGoogle, logOut } from './firebase';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Sparkles,
  Droplets,
  Pill,
  Settings,
  Camera,
  Plus,
  Search,
  Package,
  Pencil,
  Archive,
  Trash2,
  GripVertical,
  ListTree,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  CircleAlert,
  Heart,
  Star,
  ShoppingBag,
  PackageOpen,
  ImageIcon,
  Ruler,
  DatabaseBackup,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  RefreshCw,
  LucideIcon
} from 'lucide-react';
import { Category, Product, ProductInstance } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_CAPACITY_UNITS } from './data';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  calculateDaysToExpiry, 
  calculatePaoExpiry, 
  checkAllOpenedExpiredProducts 
} from './utils';
import { clearPrivateUserCache, readUserCache, writeUserCache, type CachedUserData } from './localCache';

performance.mark('app-start');

// Helper function to extract cropped image as base64
const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;
  
  const MAX_SIZE = 500;
  let targetWidth = cropWidth;
  let targetHeight = cropHeight;

  if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
    if (targetWidth > targetHeight) {
      targetHeight = (MAX_SIZE / targetWidth) * targetHeight;
      targetWidth = MAX_SIZE;
    } else {
      targetWidth = (MAX_SIZE / targetHeight) * targetWidth;
      targetHeight = MAX_SIZE;
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL('image/webp', 0.8);
};


// --- Cached Image Component ---
// Keep the original URL in memory. The service worker owns the persistent
// response cache, avoiding Cache Storage -> Blob -> object URL conversion.
const memoryImageSources = new Map<string, string>();

const clearMemoryImages = (userId: string) => {
  for (const key of memoryImageSources.keys()) {
    if (key.startsWith(`${userId}:`)) {
      memoryImageSources.delete(key);
    }
  }
};

const CachedImage = ({ src, thumbnail, alt, userId, className, imageClassName, onClick, onPreviewReady, ...props }: any) => {
  const memoryKey = `${userId}:${src}`;
  const initialMemorySource = memoryImageSources.get(memoryKey) || null;
  const [cachedSrc, setCachedSrc] = useState<string | null>(initialMemorySource);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(Boolean(initialMemorySource));
  const containerRef = useRef<HTMLDivElement>(null);
  const previewGeneratedRef = useRef(false);

  const handleImageLoad = async (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    if (thumbnail || !onPreviewReady || previewGeneratedRef.current) return;
    previewGeneratedRef.current = true;
    try {
      const image = event.currentTarget;
      const maxSize = 96;
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      onPreviewReady(canvas.toDataURL('image/webp', 0.72));
    } catch {
      // Some legacy third-party URLs disallow canvas access. Their Cache Storage
      // preview remains the fallback and existing product data is left untouched.
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      // Preload roughly two mobile screens ahead. Images already on screen still
      // enter first because the observer reports them before nearby rows.
      { rootMargin: '1000px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!src || !isVisible) return; // ONLY load if visible

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setCachedSrc(src);
      return;
    }

    memoryImageSources.set(`${userId}:${src}`, src);
    setCachedSrc(src);
  }, [src, isVisible, userId]);

  return (
    <div ref={containerRef} className={`relative ${className || ''} overflow-hidden`} onClick={onClick}>
      {!isLoaded && thumbnail && (
        <img src={thumbnail} alt="thumbnail" className={`absolute inset-0 ${imageClassName || 'w-full h-full object-contain'} opacity-100 transition-opacity duration-300`} />
      )}
      {!isLoaded && !thumbnail && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 rounded-lg animate-pulse">
          <ImageIcon className="w-4 h-4 text-stone-300" />
        </div>
      )}
      {cachedSrc && (
        <img
          src={cachedSrc}
          alt={alt}
          loading="lazy"
          fetchPriority="high"
          decoding="async"
          className={`${imageClassName || 'w-full h-full object-contain'} transition-opacity duration-300 relative z-10 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};

// Helper component to render icons based on category settings
const IconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  droplets: Droplets,
  pill: Pill,
  package: Package,
  'shopping-bag': ShoppingBag,
  heart: Heart,
  star: Star,
  settings: Settings
};

function CategoryIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const IconComponent = IconMap[name] || Sparkles;
  return <IconComponent className={className} />;
}

const CATEGORY_ICON_OPTIONS = ['sparkles', 'droplets', 'pill', 'package', 'shopping-bag', 'heart', 'star'];
const CATEGORY_ICON_LABELS: Record<string, string> = {
  sparkles: '閃亮',
  droplets: '水滴',
  pill: '膠囊',
  package: '盒子',
  'shopping-bag': '購物袋',
  heart: '愛心',
  star: '星星'
};

const APP_VERSION = "2.1v";

// Local calendar date (YYYY-MM-DD). toISOString() would give yesterday's date
// before 08:00 in Taiwan because it is UTC-based.
const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Split a stored capacity such as "30ml" or "8片" into amount and unit.
const splitCapacity = (capacity: string, units: string[]) => {
  const value = (capacity || '').trim();
  const unit = [...units].sort((a, b) => b.length - a.length).find(u => u && value.endsWith(u));
  if (!unit) return { amount: value, unit: '' };
  return { amount: value.slice(0, -unit.length).trim(), unit };
};

const isActiveUsage = (usage: ProductInstance['usage']) => usage === '未開封' || usage === '使用中';

// Earliest upcoming deadline of one item: printed expiry or, once opened, the PAO limit.
const getInstanceDeadline = (inst: ProductInstance) => {
  let days = 9999;
  let date = '';
  if (inst.expiry) {
    days = calculateDaysToExpiry(inst.expiry);
    date = inst.expiry;
  }
  if (inst.usage === '使用中' && inst.paoMonths && inst.openedDate) {
    const pao = calculatePaoExpiry(inst.openedDate, inst.paoMonths);
    if (pao && pao.daysLeft < days) {
      days = pao.daysLeft;
      date = pao.expiryDate;
    }
  }
  return { days, date };
};

const formatDuration = (fromDate?: string, toDate?: string) => {
  if (!fromDate) return '';
  const start = new Date(fromDate);
  const end = toDate ? new Date(toDate) : new Date();
  const diffMs = end.getTime() - start.getTime();
  if (isNaN(diffMs) || diffMs < 0) return '';
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  if (years === 0 && months === 0) return `${totalDays} 天`;
  return `${years > 0 ? `${years} 年` : ''}${months > 0 ? `${months} 個月` : ''}`;
};

const getOwnedProductPhotoPath = (photoUrl: string, userId: string) => {
  try {
    const url = new URL(photoUrl);
    if (url.hostname !== 'firebasestorage.googleapis.com') return null;
    const objectMarker = '/o/';
    const markerIndex = url.pathname.indexOf(objectMarker);
    if (markerIndex < 0) return null;
    const objectPath = decodeURIComponent(url.pathname.slice(markerIndex + objectMarker.length));
    const ownedPrefix = `users/${userId}/products/`;
    return objectPath.startsWith(ownedPrefix) ? objectPath : null;
  } catch {
    return null;
  }
};

const deleteUnreferencedProductPhotos = async (
  userId: string,
  candidateUrls: string[],
  remainingProducts: Product[]
) => {
  const referencedUrls = new Set(remainingProducts.map(product => product.photo).filter(Boolean));
  const failedUrls: string[] = [];
  const unusedUrls = Array.from(new Set(candidateUrls)).filter(url => !referencedUrls.has(url));

  await Promise.all(unusedUrls.map(async (photoUrl) => {
    const objectPath = getOwnedProductPhotoPath(photoUrl, userId);
    if (!objectPath) return;
    try {
      await deleteObject(ref(storage, objectPath));
      if ('caches' in window) {
        const cache = await caches.open(`cosmetics-thumbnails-v1-${userId}`);
        await cache.delete(photoUrl);
      }
    } catch (error: any) {
      if (error?.code !== 'storage/object-not-found') {
        failedUrls.push(photoUrl);
        console.warn('[storage] Unable to delete unused product photo', error);
      }
    }
  }));

  return failedUrls;
};

function MainApp({ user }: { user: User; key?: React.Key }) {
  const initialCacheRef = useRef<CachedUserData | null>(readUserCache(user.uid));
  const initialCache = initialCacheRef.current;
  // --- Core State ---
  const [categories, setCategories] = useState<Category[]>(initialCache?.categories || []);
  const [capacityUnits, setCapacityUnits] = useState<string[]>(initialCache?.capacityUnits || INITIAL_CAPACITY_UNITS);

  const [products, setProducts] = useState<Product[]>(initialCache?.products || []);

  const [isDataLoaded, setIsDataLoaded] = useState(Boolean(initialCache));
  const [syncState, setSyncState] = useState<'refreshing' | 'current' | 'stale'>(initialCache ? 'refreshing' : 'refreshing');
  const [lastSyncedAt, setLastSyncedAt] = useState(initialCache?.syncedAt || '');
  const [refreshToken, setRefreshToken] = useState(0);
  const lastSyncedSignatureRef = useRef(initialCache ? JSON.stringify({
    categories: initialCache.categories,
    capacityUnits: initialCache.capacityUnits,
    products: initialCache.products
  }) : '');
  const hasLocalEditsRef = useRef(false);
  const pendingPhotoCleanupRef = useRef<Set<string>>(new Set());
  const pendingFormUploadRef = useRef<string | null>(null);

  // Load user data from Firestore on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const productsRef = collection(db, 'users', user.uid, 'products');
        performance.mark('cloud-refresh-start');
        const [docSnap, querySnapshot] = await Promise.all([
          getDocFromServer(docRef),
          getDocsFromServer(query(productsRef))
        ]);
        performance.mark('cloud-refresh-end');
        performance.measure('cloud-refresh', 'cloud-refresh-start', 'cloud-refresh-end');
        let loadedCategories = INITIAL_CATEGORIES;
        
        let rootProducts: Product[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories) {
            loadedCategories = data.categories;
          }
          
          // Legacy migration check: if products exist in the root doc, save them for merging
          if (data.products && data.products.length > 0) {
            rootProducts = data.products;
          }
        }
        
        let subProducts: Product[] = [];
        if (!querySnapshot.empty) {
          querySnapshot.forEach((docSnap) => {
            subProducts.push(docSnap.data() as Product);
          });
        }
        
        // Merge root products and subcollection products (prefer newer or unique)
        if (rootProducts.length > 0 || subProducts.length > 0) {
          const mergedMap = new Map<string, Product>();
          
          // Add subcollection products first
          subProducts.forEach(p => mergedMap.set(p.id, p));
          
          // Add/override with root products (since if they were just added in a broken version, they might be here)
          rootProducts.forEach(p => {
             if (!mergedMap.has(p.id)) {
               mergedMap.set(p.id, p);
             } else {
               // If both exist, we could merge instances. For now, just keep the one with more instances or newer
               const existing = mergedMap.get(p.id)!;
               if (p.instances.length > existing.instances.length) {
                 mergedMap.set(p.id, p);
               }
             }
          });
          
          rootProducts = Array.from(mergedMap.values());
        } else if (!docSnap.exists()) {
          // If no user doc exists and no products exist, initialize with defaults
          rootProducts = INITIAL_PRODUCTS;
        }
        const nextCategories = loadedCategories;
        const nextCapacityUnits = docSnap.exists() && docSnap.data().capacityUnits
          ? docSnap.data().capacityUnits
          : INITIAL_CAPACITY_UNITS;
        const nextProducts = rootProducts.length > 0 ? rootProducts : subProducts;
        const syncedAt = new Date().toISOString();
        const nextData = { categories: nextCategories, capacityUnits: nextCapacityUnits, products: nextProducts };
        if (hasLocalEditsRef.current) {
          console.info('[startup] Cloud refresh skipped because local edits are being saved');
          return;
        }
        lastSyncedSignatureRef.current = JSON.stringify(nextData);
        setCategories(nextCategories);
        setCapacityUnits(nextCapacityUnits);
        setProducts(nextProducts);
        setLastSyncedAt(syncedAt);
        writeUserCache(user.uid, { ...nextData, syncedAt });
        setSyncState('current');
        console.info('[startup] Cloud refresh completed', performance.getEntriesByName('cloud-refresh').at(-1)?.duration);
      } catch (err) {
        console.error('Error loading data', err);
        setSyncState('stale');
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadUserData();
  }, [user.uid, refreshToken]);

  useEffect(() => {
    const handleOffline = () => setSyncState('stale');
    const handleOnline = () => {
      setSyncState('refreshing');
      setRefreshToken((value) => value + 1);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    if (!navigator.onLine) handleOffline();
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Save to Firestore whenever data changes (debounce or just save directly since it's simple)
  useEffect(() => {
    if (!isDataLoaded) return;
    const signature = JSON.stringify({ categories, capacityUnits, products });
    if (signature === lastSyncedSignatureRef.current) return;
    hasLocalEditsRef.current = true;
    const timeout = window.setTimeout(() => {
    const saveUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        // Save categories to root doc
        await setDoc(userRef, {
          categories,
          capacityUnits,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Sync products array to subcollection
        const productsRef = collection(db, 'users', user.uid, 'products');
        const snapshot = await getDocs(productsRef);
        
        const existingData = new Map();
        snapshot.forEach(d => existingData.set(d.id, d.data()));
        
        const currentIds = new Set(products.map(p => p.id));
        
        const writePromises = [];
        
        for (const id of existingData.keys()) {
          if (!currentIds.has(id)) {
            writePromises.push(deleteDoc(doc(db, 'users', user.uid, 'products', id)));
          }
        }
        
        for (const product of products) {
          const existing = existingData.get(product.id);
          // Only write if it's new or the data has changed
          if (!existing || JSON.stringify(existing) !== JSON.stringify(product)) {
            const cleanProduct = JSON.parse(JSON.stringify(product));
            writePromises.push(setDoc(doc(db, 'users', user.uid, 'products', product.id), cleanProduct));
          }
        }

        if (writePromises.length > 0) {
          await Promise.all(writePromises);
        }

        // Migration: Remove the old `products` array from the user doc to free up the 1MB limit
        await updateDoc(userRef, {
          products: deleteField()
        }).catch(() => { /* ignore if field doesn't exist */ });

        const syncedAt = new Date().toISOString();
        lastSyncedSignatureRef.current = signature;
        hasLocalEditsRef.current = false;
        setLastSyncedAt(syncedAt);
        setSyncState('current');
        writeUserCache(user.uid, { categories, capacityUnits, products, syncedAt });

        if (pendingPhotoCleanupRef.current.size > 0) {
          const failedUrls = await deleteUnreferencedProductPhotos(
            user.uid,
            Array.from(pendingPhotoCleanupRef.current),
            products
          );
          pendingPhotoCleanupRef.current = new Set(failedUrls);
        }

      } catch (err: any) {
        console.error('Error saving data', err);
        showToast(`儲存失敗: ${err.message || String(err)}`);
      }
    };
    saveUserData();
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [categories, products, capacityUnits, isDataLoaded, user.uid, refreshToken]);

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return categories[0]?.id || 'makeup';
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSearchSubcategory, setSelectedSearchSubcategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Form Input States ---
  const [formBrand, setFormBrand] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('makeup');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formCapacity, setFormCapacity] = useState('');
  const [formCapacityUnit, setFormCapacityUnit] = useState('ml');
  const [formUsage, setFormUsage] = useState<'使用中' | '未開封' | '已用完' | '已丟棄'>('未開封');
  const [formExpiry, setFormExpiry] = useState('');
  const [formPaoMonths, setFormPaoMonths] = useState<string>(''); // PAO 可使用月數
  const [formOpenedDate, setFormOpenedDate] = useState(''); // 開封日期
  const [formFinishedDate, setFormFinishedDate] = useState(''); // 用完或丟棄的日期
  const [formPhoto, setFormPhoto] = useState<string>(''); // Base64 string
  const [formPhotoThumbnail, setFormPhotoThumbnail] = useState<string>(''); // Thumbnail base64
  const [isFormPhotoRemoved, setIsFormPhotoRemoved] = useState(false);
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formPurchasePlace, setFormPurchasePlace] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [showMoreFields, setShowMoreFields] = useState(false);

  // Product detail view: keep only the id so the view always reflects the latest data.
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const selectedDetailProduct = detailProductId ? products.find(p => p.id === detailProductId) || null : null;
  const setSelectedDetailProduct = (product: Product | null) => setDetailProductId(product ? product.id : null);
  const [detailActiveTab, setDetailActiveTab] = useState<'items' | 'records'>('items');

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; confirmLabel?: string; danger?: boolean } | null>(null);

  // Fullscreen Image Modal State
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Cropper States
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const askConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    options: { confirmLabel?: string; danger?: boolean } = {}
  ) => {
    setConfirmDialog({ title, message, onConfirm, ...options });
  };

  // Editing state
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [isAddingInstanceToExisting, setIsAddingInstanceToExisting] = useState(false);

  // --- Setting View States ---
  const [settingsView, setSettingsView] = useState<'menu' | 'category' | 'history' | 'backup' | 'units'>('menu');
  const [newCatName, setNewCatName] = useState('');
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [settingsUnitName, setSettingsUnitName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('sparkles');
  const [activeCategoryForSub, setActiveCategoryForSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [editingSubCatId, setEditingSubCatId] = useState<string | null>(null);
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);
  const [editingSubName, setEditingSubName] = useState('');

  // --- Notification Center States ---
  const expiredPaoItems = useMemo(() => checkAllOpenedExpiredProducts(products), [products]);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [isExpiredListOpen, setIsExpiredListOpen] = useState(false);

  // --- Drag & Drop Reordering States ---
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedSubIdx, setDraggedSubIdx] = useState<number | null>(null);
  const [draggedSubCatId, setDraggedSubCatId] = useState<string | null>(null);

  // Refs
  const formPhotoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // --- Android / browser Back button ---
  // Every open layer owns exactly one history entry, so Back closes only the
  // top-most layer: dialog → photo → form → product detail → settings page /
  // search filter → back to the first category tab. On the first tab with
  // nothing open, Back is left to the platform.
  const homeTab = categories[0]?.id || '';
  const layers: string[] = [];
  if (isDataLoaded && homeTab && currentTab !== homeTab) layers.push('tab');
  if (currentTab !== 'settings' && (searchKeyword.trim() || selectedSearchSubcategory)) layers.push('filter');
  if (currentTab === 'settings' && settingsView !== 'menu') layers.push('settings');
  if (selectedDetailProduct) layers.push('detail');
  if (showAddForm) layers.push('form');
  if (fullscreenImage) layers.push('image');
  if (cropImageSrc) layers.push('crop');
  if (confirmDialog) layers.push('confirm');
  const layersKey = layers.join('/');

  const historyDepthRef = useRef(0);
  const pendingHistoryBackRef = useRef(false);
  const closeTopLayerRef = useRef<() => void>(() => {});
  const syncHistoryRef = useRef<() => void>(() => {});

  closeTopLayerRef.current = () => {
    switch (layers[layers.length - 1]) {
      case 'confirm': setConfirmDialog(null); break;
      case 'crop': handleCropCancel(); break;
      case 'image': setFullscreenImage(null); break;
      case 'form': setShowAddForm(false); clearForm(); break;
      case 'detail': setSelectedDetailProduct(null); break;
      case 'settings': setSettingsView('menu'); break;
      case 'filter': setSearchKeyword(''); setSelectedSearchSubcategory(''); break;
      case 'tab': handleTabChange(homeTab); break;
    }
  };

  syncHistoryRef.current = () => {
    if (pendingHistoryBackRef.current) return; // wait until the previous back() lands
    const target = layers.length;
    const depth = historyDepthRef.current;
    if (target > depth) {
      for (let i = depth; i < target; i++) {
        window.history.pushState({ storageLayer: i + 1 }, '', `#${layers[i]}`);
      }
      historyDepthRef.current = target;
    } else if (target < depth) {
      // Closed in the UI (button, save, swipe): drop the matching history entries.
      pendingHistoryBackRef.current = true;
      historyDepthRef.current = target;
      window.history.go(target - depth);
    } else if (target > 0 && window.location.hash !== `#${layers[target - 1]}`) {
      // Same depth, different screen (e.g. the form closed and the product opened).
      window.history.replaceState(window.history.state, '', `#${layers[target - 1]}`);
    }
  };

  useEffect(() => {
    // After a reload the old #hash no longer matches any open screen: start clean.
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const handlePopState = () => {
      if (pendingHistoryBackRef.current) {
        pendingHistoryBackRef.current = false;
        syncHistoryRef.current();
        return;
      }
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);
      closeTopLayerRef.current();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    syncHistoryRef.current();
  }, [layersKey]);

  // --- Side Effects & Persistence ---

  // Once the current screen is interactive, warm the first four images in each
  // category one-by-one. The service worker persists these responses, so tab
  // switches do not compete for network bandwidth or show empty first-screen cards.
  useEffect(() => {
    if (!isDataLoaded) return;
    let cancelled = false;
    const urls = categories.flatMap((category) => products
      .filter((product) => product.status === 'active' && product.category === category.id && product.photo)
      .slice(0, 4)
      .map((product) => product.photo!));
    const uniqueUrls = Array.from(new Set<string>(urls as string[]));

    const timeout = window.setTimeout(async () => {
      for (const url of uniqueUrls) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = url;
        });
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isDataLoaded, user.uid]);

  // Sync tab with updated categories if current tab's category was deleted
  useEffect(() => {
    if (!isDataLoaded) return;
    if (currentTab !== 'settings' && !categories.some(c => c.id === currentTab)) {
      if (categories.length > 0) {
        setCurrentTab(categories[0].id);
      } else {
        setCurrentTab('settings');
      }
    }
  }, [categories, currentTab, isDataLoaded]);

  // Without a local cache the first tab is only known once the cloud data arrives.
  const hasSetInitialTabRef = useRef(Boolean(initialCache));
  useEffect(() => {
    if (!isDataLoaded || hasSetInitialTabRef.current || categories.length === 0) return;
    hasSetInitialTabRef.current = true;
    setCurrentTab(categories[0].id);
  }, [isDataLoaded, categories]);

  useEffect(() => {
    setSelectedSearchSubcategory('');
  }, [currentTab]);

  // Handle Usage status switch - auto fill open date if usage is '使用中' and it is blank
  useEffect(() => {
    if (formUsage === '使用中' && !formOpenedDate) {
      setFormOpenedDate(todayStr());
    }
    if ((formUsage === '已用完' || formUsage === '已丟棄') && !formFinishedDate) {
      setFormFinishedDate(todayStr());
    }
  }, [formUsage]);

  // --- Toast Manager ---
  const showToast = (msg: string | null, undo?: () => void) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(msg ? { message: msg, undo } : null);
    if (msg) {
      toastTimerRef.current = window.setTimeout(() => setToast(null), undo ? 5000 : 2600);
    }
  };

  // Snapshot-based undo for quick actions (open / used up / move to history).
  const commitWithUndo = (nextProducts: Product[], message: string) => {
    const previousProducts = products;
    setProducts(nextProducts);
    showToast(message, () => {
      setProducts(previousProducts);
      showToast('已復原');
    });
  };

  const queueProductPhotoCleanup = (...photoUrls: Array<string | undefined>) => {
    photoUrls.forEach(photoUrl => {
      if (photoUrl) pendingPhotoCleanupRef.current.add(photoUrl);
    });
  };

  const discardPendingFormUpload = () => {
    const photoUrl = pendingFormUploadRef.current;
    pendingFormUploadRef.current = null;
    if (photoUrl) {
      void deleteUnreferencedProductPhotos(user.uid, [photoUrl], products);
    }
  };

  useEffect(() => {
    if (!showAddForm) discardPendingFormUpload();
  }, [showAddForm]);

  // --- File uploads & Photo Handling ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // Reset input to allow selecting the same file again
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (crop: PixelCrop) => {
    setCroppedAreaPixels(crop);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageRef(e.currentTarget);
    const { width, height } = e.currentTarget;
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    });
    // The crop library only reports pixels after a drag, so seed the default
    // area here; otherwise confirming without touching the frame did nothing.
    setCroppedAreaPixels({ unit: 'px', x: width * 0.1, y: height * 0.1, width: width * 0.8, height: height * 0.8 });
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    
    try {
      if (!imageRef) return;
      const croppedBase64 = await getCroppedImg(imageRef, croppedAreaPixels);
      
      // Close cropper modal
      setCropImageSrc(null);
      setCroppedAreaPixels(null);

      // Now do the same resize logic as before if needed, or just upload the cropped image directly
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress as WebP
        const compressedBase64 = canvas.toDataURL('image/webp', 0.8);

        // Generate tiny thumbnail for instant load
        const thumbCanvas = document.createElement('canvas');
        const THUMB_SIZE = 64;
        let tWidth = img.width;
        let tHeight = img.height;
        if (tWidth > tHeight) {
          tHeight *= THUMB_SIZE / tWidth;
          tWidth = THUMB_SIZE;
        } else {
          tWidth *= THUMB_SIZE / tHeight;
          tHeight = THUMB_SIZE;
        }
        thumbCanvas.width = tWidth;
        thumbCanvas.height = tHeight;
        const tCtx = thumbCanvas.getContext('2d');
        tCtx?.drawImage(img, 0, 0, tWidth, tHeight);
        const thumbBase64 = thumbCanvas.toDataURL('image/webp', 0.5);

        // Upload to Firebase Storage
        const uploadToStorage = async () => {
          if (!user) {
            showToast('請先登入');
            return;
          }
          setIsUploading(true);
          try {
            const storageRef = ref(storage, `users/${user.uid}/products/${Date.now()}.webp`);
            await uploadString(storageRef, compressedBase64, 'data_url', {
              contentType: 'image/webp',
              cacheControl: 'public,max-age=31536000,immutable'
            });
            const downloadURL = await getDownloadURL(storageRef);
            const previousPendingUrl = pendingFormUploadRef.current;
            if (previousPendingUrl && previousPendingUrl !== downloadURL) {
              void deleteUnreferencedProductPhotos(user.uid, [previousPendingUrl], products);
            }
            pendingFormUploadRef.current = downloadURL;
            setFormPhoto(downloadURL);
            setFormPhotoThumbnail(thumbBase64);
            setIsFormPhotoRemoved(false);
          } catch (error: any) {
            console.error('Upload error:', error);
            showToast(`照片上傳失敗：${error.message}`);
          } finally {
            setIsUploading(false);
          }
        };
        uploadToStorage();
      };
      img.src = croppedBase64;
    } catch (e) {
      console.error(e);
      showToast('照片裁切失敗');
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
    setImageRef(null);
  };

  // --- Category Actions & drag/drop Reordering ---
  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCatDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === index) return;
    const newCats = [...categories];
    const draggedCat = newCats[draggedCatIdx];
    newCats.splice(draggedCatIdx, 1);
    newCats.splice(index, 0, draggedCat);
    setCategories(newCats);
    setDraggedCatIdx(null);
    showToast('大分類排序已更新！');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showToast('請輸入大分類名稱！');
      return;
    }
    const newId = `cat_${Date.now()}`;
    const newCat: Category = {
      id: newId,
      name: newCatName.trim(),
      icon: newCatIcon,
      subcategories: []
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    showToast(`已成功建立大分類「${newCat.name}」！`);
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      showToast('至少必須保留一個分類！');
      return;
    }
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    askConfirmation(
      '刪除大分類',
      `刪除「${cat.name}」後，這個分類的商品會暫時不顯示，資料仍會保留。`,
      () => {
        setCategories(categories.filter(c => c.id !== catId));
        showToast(`已刪除「${cat.name}」`);
      },
      { confirmLabel: '刪除', danger: true }
    );
  };

  // --- Subcategory Actions & Reordering (Requirement 1) ---
  const handleSubDragStart = (e: React.DragEvent, categoryId: string, index: number) => {
    setDraggedSubIdx(index);
    setDraggedSubCatId(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSubDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

    const moveCatUp = (index: number) => {
    if (index <= 0) return;
    const newCats = [...categories];
    [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
    setCategories(newCats);
  };
  const moveCatDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const newCats = [...categories];
    [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
    setCategories(newCats);
  };

  const moveSubCatUp = (catId: string, sIdx: number) => {
    if (sIdx <= 0) return;
    setCategories(categories.map(c => {
      if (c.id === catId) {
        const newSubs = [...c.subcategories];
        [newSubs[sIdx - 1], newSubs[sIdx]] = [newSubs[sIdx], newSubs[sIdx - 1]];
        return { ...c, subcategories: newSubs };
      }
      return c;
    }));
  };
  
  const moveSubCatDown = (catId: string, sIdx: number) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        if (sIdx >= c.subcategories.length - 1) return c;
        const newSubs = [...c.subcategories];
        [newSubs[sIdx + 1], newSubs[sIdx]] = [newSubs[sIdx], newSubs[sIdx + 1]];
        return { ...c, subcategories: newSubs };
      }
      return c;
    }));
  };

  const handleSubDrop = (e: React.DragEvent, categoryId: string, index: number) => {
    e.preventDefault();
    if (draggedSubIdx === null || draggedSubCatId !== categoryId || draggedSubIdx === index) return;

    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        const newSubs = [...cat.subcategories];
        const draggedSub = newSubs[draggedSubIdx];
        newSubs.splice(draggedSubIdx, 1);
        newSubs.splice(index, 0, draggedSub);
        return { ...cat, subcategories: newSubs };
      }
      return cat;
    });

    setCategories(updated);
    setDraggedSubIdx(null);
    setDraggedSubCatId(null);
    showToast('小分類拖曳排序已更新！');
  };

  const handleAddSubcategory = (catId: string) => {
    if (!newSubName.trim()) {
      showToast('請輸入小分類名稱！');
      return;
    }
    const updated = categories.map(cat => {
      if (cat.id === catId) {
        if (cat.subcategories.includes(newSubName.trim())) {
          showToast('此小分類名稱已存在於大分類中！');
          return cat;
        }
        return { ...cat, subcategories: [...cat.subcategories, newSubName.trim()] };
      }
      return cat;
    });
    setCategories(updated);
    setNewSubName('');
    showToast(`已在分類中新增小分類「${newSubName.trim()}」`);
  };

  const handleDeleteSubcategory = (catId: string, subIndex: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const subName = cat.subcategories[subIndex];
    askConfirmation(
      '刪除小分類',
      `要刪除「${cat.name}」的「${subName}」嗎？`,
      () => {
        const updated = categories.map(c => {
          if (c.id === catId) {
            return {
              ...c,
              subcategories: c.subcategories.filter((_, idx) => idx !== subIndex)
            };
          }
          return c;
        });
        setCategories(updated);
        showToast(`已刪除「${subName}」`);
      },
      { confirmLabel: '刪除', danger: true }
    );
  };

  const handleSaveSubcategory = (catId: string, subIndex: number) => {
    if (!editingSubName.trim()) {
      showToast('小分類名稱不能為空！');
      return;
    }
    const updated = categories.map(c => {
      if (c.id === catId) {
        const newSubs = [...c.subcategories];
        newSubs[subIndex] = editingSubName.trim();
        return { ...c, subcategories: newSubs };
      }
      return c;
    });
    setCategories(updated);
    setEditingSubCatId(null);
    setEditingSubIdx(null);
    showToast('小分類名稱已成功修改！');
  };

  // --- Product CRUD Actions ---
  const defaultCapacityUnit = capacityUnits.includes('ml') ? 'ml' : (capacityUnits[0] || '');

  const clearForm = () => {
    discardPendingFormUpload();
    setFormBrand('');
    setFormName('');
    setFormCategory(currentTab !== 'settings' ? currentTab : categories[0]?.id || 'makeup');
    setFormSubcategory('');
    setFormQty(1);
    setFormCapacity('');
    setFormCapacityUnit(defaultCapacityUnit);
    setFormUsage('未開封');
    setFormExpiry('');
    setFormPaoMonths('');
    setFormOpenedDate(todayStr());
    setFormFinishedDate('');
    setFormPhoto('');
    setFormPhotoThumbnail('');
    setIsFormPhotoRemoved(false);
    setFormPurchaseDate(todayStr());
    setFormPurchasePlace('');
    setFormPrice('');
    setShowMoreFields(false);
    setShowNewUnitInput(false);
    setNewUnitName('');
    setEditingInstanceId(null);
    setEditingProductId(null);
    setIsEditingMaster(false);
    setIsAddingInstanceToExisting(false);
  };

  // Moves one item into the history list as its own archived record.
  const moveInstanceToHistory = (
    list: Product[],
    prodId: string,
    instId: string,
    patch: Partial<ProductInstance> = {}
  ): Product[] => {
    const product = list.find(p => p.id === prodId);
    const instance = product?.instances.find(i => i.id === instId);
    if (!product || !instance) return list;
    const stamp = Date.now();
    const archivedProduct: Product = {
      id: `prod_archived_${stamp}`,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      name: product.name,
      photo: product.photo,
      photoThumbnail: product.photoThumbnail,
      status: 'archived',
      archivedAt: new Date().toISOString(),
      threshold: product.threshold,
      instances: [{ ...instance, ...patch, id: `inst_archived_${stamp}` }]
    };
    const remaining = list
      .map(p => p.id === prodId ? { ...p, instances: p.instances.filter(i => i.id !== instId) } : p)
      .filter(p => p.instances.length > 0);
    return [...remaining, archivedProduct];
  };

  const handleOpenInstance = (prodId: string, instId: string) => {
    const nextProducts = products.map(prod => prod.id !== prodId ? prod : {
      ...prod,
      instances: prod.instances.map(inst => inst.id !== instId ? inst : {
        ...inst,
        usage: '使用中' as const,
        openedDate: inst.openedDate || todayStr()
      })
    });
    commitWithUndo(nextProducts, '已開封');
  };

  const handleFinishInstance = (prodId: string, instId: string) => {
    const instance = products.find(p => p.id === prodId)?.instances.find(i => i.id === instId);
    if (!instance) return;
    const wasActive = isActiveUsage(instance.usage);
    const patch: Partial<ProductInstance> = wasActive ? { usage: '已用完', finishedDate: todayStr() } : {};
    commitWithUndo(
      moveInstanceToHistory(products, prodId, instId, patch),
      wasActive ? '已用完，移到歷史紀錄' : '已移到歷史紀錄'
    );
  };

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    setShowAddForm(false);
    setSearchKeyword('');
    clearForm();
    if (tabId === 'settings') {
      setSettingsView('menu');
    }
  };

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      showToast('照片還在上傳，請稍候');
      return;
    }
    if (!formName.trim()) {
      showToast('請輸入產品名稱');
      return;
    }

    if (formQty < 1) {
      showToast('數量至少為 1');
      return;
    }

    let subcatValue = formSubcategory.trim();
    if (subcatValue === '自訂子分類' || !subcatValue) {
      subcatValue = '其他';
    }

    // Automatically add custom subcategory to the selected category (Requirement 5)
    setCategories(prev => {
      let isUpdated = false;
      const newCats = prev.map(cat => {
        if (cat.id === formCategory && !cat.subcategories.includes(subcatValue)) {
          isUpdated = true;
          return { ...cat, subcategories: [...cat.subcategories, subcatValue] };
        }
        return cat;
      });
      return isUpdated ? newCats : prev;
    });

    const paoVal = formPaoMonths ? parseInt(formPaoMonths) : undefined;
    const openedVal = (formUsage === '使用中' || formUsage === '已用完' || formUsage === '已丟棄') ? formOpenedDate : undefined;
    const finishedVal = (formUsage === '已用完' || formUsage === '已丟棄') ? formFinishedDate : undefined;

    const purchaseDateVal = formPurchaseDate || undefined;
    const purchasePlaceVal = formPurchasePlace.trim() || undefined;
    const priceVal = formPrice ? parseFloat(formPrice) : undefined;
    const finalCapacity = formCapacity ? `${formCapacity}${formCapacityUnit}` : '';

    // A. Edit the product itself (photo, category, brand, name)
    if (isEditingMaster && editingProductId) {
      const previousPhoto = products.find(prod => prod.id === editingProductId)?.photo;
      const nextPhoto = isFormPhotoRemoved ? undefined : (formPhoto || previousPhoto);
      const updatedProducts = products.map(prod => {
        if (prod.id === editingProductId) {
          return {
            ...prod,
            category: formCategory,
            subcategory: subcatValue,
            brand: formBrand.trim(),
            name: formName.trim(),
            photo: nextPhoto,
            photoThumbnail: isFormPhotoRemoved ? undefined : (formPhotoThumbnail || prod.photoThumbnail)
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
      if (previousPhoto && previousPhoto !== nextPhoto) {
        queueProductPhotoCleanup(previousPhoto);
      }
      pendingFormUploadRef.current = null;
      showToast('已儲存');
      setShowAddForm(false);
      clearForm();
      return;
    }

    const isFinished = formUsage === '已用完' || formUsage === '已丟棄';
    const itemFields = {
      capacity: finalCapacity,
      usage: formUsage,
      expiry: formExpiry,
      paoMonths: paoVal,
      openedDate: openedVal,
      finishedDate: finishedVal,
      purchaseDate: purchaseDateVal,
      purchasePlace: purchasePlaceVal,
      price: priceVal
    };

    // B. Edit one existing item in place
    if (editingInstanceId && editingProductId) {
      const qty = isFinished ? 1 : formQty;
      let updatedProducts = products.map(prod => {
        if (prod.id !== editingProductId) return prod;
        const updatedInstances = prod.instances.flatMap(inst => {
          if (inst.id !== editingInstanceId) return [inst];
          return Array.from({ length: qty }).map((_, idx) => ({
            ...inst,
            id: idx === 0 ? inst.id : `inst_${Date.now()}_${idx}`,
            qty: 1,
            ...itemFields
          }));
        });
        return {
          ...prod,
          photo: formPhoto || prod.photo,
          photoThumbnail: formPhotoThumbnail || prod.photoThumbnail,
          instances: updatedInstances
        };
      });

      // Used up / thrown away items belong in the history list.
      const editedProduct = products.find(p => p.id === editingProductId);
      if (isFinished && editedProduct?.status === 'active') {
        updatedProducts = moveInstanceToHistory(updatedProducts, editingProductId, editingInstanceId);
        showToast('已移到歷史紀錄');
      } else {
        showToast('已儲存');
      }
      setProducts(updatedProducts);
    } else {
      // C. Create a new product, or add items to an existing one
      const newInstances: ProductInstance[] = Array.from({ length: formQty }).map((_, idx) => ({
        id: `inst_${Date.now()}_${idx}`,
        qty: 1,
        ...itemFields
      }));

      let existingProductIndex = -1;
      if (isAddingInstanceToExisting && editingProductId) {
        existingProductIndex = products.findIndex(p => p.id === editingProductId);
      } else {
        existingProductIndex = products.findIndex(p =>
          p.category === formCategory &&
          p.subcategory === subcatValue &&
          p.brand === formBrand.trim() &&
          p.name === formName.trim() &&
          p.status === 'active'
        );
      }

      if (existingProductIndex > -1) {
        const updated = [...products];
        updated[existingProductIndex] = {
          ...updated[existingProductIndex],
          instances: [...updated[existingProductIndex].instances, ...newInstances]
        };
        if (formPhoto) {
          updated[existingProductIndex].photo = formPhoto;
          updated[existingProductIndex].photoThumbnail = formPhotoThumbnail || updated[existingProductIndex].photoThumbnail;
        }
        setProducts(updated);
        setSelectedDetailProduct(updated[existingProductIndex]);
        showToast(isAddingInstanceToExisting ? `已加入 ${formQty} 件` : `已加入「${formName.trim()}」`);
      } else {
        // Create full new product
        const newProd: Product = {
          id: `prod_${Date.now()}`,
          category: formCategory,
          subcategory: subcatValue,
          brand: formBrand.trim(),
          name: formName.trim(),
          photo: formPhoto || undefined,
          photoThumbnail: formPhotoThumbnail || undefined,
          status: 'active',
          threshold: 0,
          instances: newInstances
        };
        setProducts([...products, newProd]);
        setSelectedDetailProduct(newProd);
        showToast(`已新增「${formName.trim()}」`);
      }
    }

    setShowAddForm(false);
    pendingFormUploadRef.current = null;
    clearForm();
    setCurrentTab(formCategory); // Redirect to corresponding category tab
  };

  const handleEditInstanceTrigger = (prod: Product, inst: ProductInstance) => {
    clearForm();
    setEditingProductId(prod.id);
    setEditingInstanceId(inst.id);

    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormQty(inst.qty);
    const { amount, unit } = splitCapacity(inst.capacity, capacityUnits);
    setFormCapacity(amount);
    setFormCapacityUnit(unit);

    setFormUsage(inst.usage);
    setFormExpiry(inst.expiry);
    setFormPaoMonths(inst.paoMonths ? String(inst.paoMonths) : '');
    setFormOpenedDate(inst.openedDate || '');
    setFormFinishedDate(inst.finishedDate || '');
    setFormPhoto(prod.photo || '');
    setFormPhotoThumbnail(prod.photoThumbnail || '');
    setFormPurchaseDate(inst.purchaseDate || '');
    setFormPurchasePlace(inst.purchasePlace || '');
    setFormPrice(inst.price !== undefined ? String(inst.price) : '');
    setShowMoreFields(Boolean(inst.paoMonths || inst.purchaseDate || inst.purchasePlace || inst.price !== undefined));

    setShowAddForm(true);
  };

  const handleEditProductMasterTrigger = (prod: Product) => {
    clearForm();
    setEditingProductId(prod.id);
    setIsEditingMaster(true);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormPhoto(prod.photo || '');
    setFormPhotoThumbnail(prod.photoThumbnail || '');
    setShowAddForm(true);
  };

  const handleRestoreMaster = (archivedProduct: Product) => {
    askConfirmation(
      '還原紀錄',
      `要把「${archivedProduct.name}」放回原本的分類嗎？`,
      () => {
        let updatedProducts = [...products];
        // Remove the archived product from the list
        updatedProducts = updatedProducts.filter(p => p.id !== archivedProduct.id);

        // A used-up / thrown-away item comes back as "in use"
        const restoredInstances = archivedProduct.instances.map(inst => (
          isActiveUsage(inst.usage) ? inst : { ...inst, usage: '使用中' as const, finishedDate: undefined }
        ));

        // Find if there is an active product with the exact same details
        const existingActiveProductIndex = updatedProducts.findIndex(p =>
          p.status === 'active' &&
          p.category === archivedProduct.category &&
          p.brand === archivedProduct.brand &&
          p.name === archivedProduct.name
        );

        if (existingActiveProductIndex >= 0) {
          // Merge instances into the existing active product
          updatedProducts[existingActiveProductIndex] = {
            ...updatedProducts[existingActiveProductIndex],
            instances: [
              ...updatedProducts[existingActiveProductIndex].instances,
              ...restoredInstances
            ]
          };
        } else {
          // No existing active product, just change status back to active
          updatedProducts.push({
            ...archivedProduct,
            status: 'active',
            archivedAt: undefined,
            instances: restoredInstances
          });
        }
        
        setProducts(updatedProducts);
        queueProductPhotoCleanup(archivedProduct.photo);
        showToast('已還原');
      },
      { confirmLabel: '還原' }
    );
  };

  const handleDeleteArchivedProduct = (product: Product) => {
    askConfirmation(
      '永久刪除',
      `「${product.name}」的這筆紀錄會被永久刪除，無法復原。`,
      () => {
        setProducts(products.filter(item => item.id !== product.id));
        queueProductPhotoCleanup(product.photo);
        showToast('已刪除');
      },
      { confirmLabel: '刪除', danger: true }
    );
  };

  // Delete the item being edited
  const handleDeleteInstance = () => {
    if (editingInstanceId && editingProductId) {
      askConfirmation(
        '刪除這一件',
        '刪除後無法復原。用完的話，請改用「用完」，紀錄才會留在歷史裡。',
        () => {
          const nextProducts = products.map(prod => {
            if (prod.id === editingProductId) {
              return {
                ...prod,
                instances: prod.instances.filter(i => i.id !== editingInstanceId)
              };
            }
            return prod;
          }).filter(p => p.instances.length > 0);

          setProducts(nextProducts);
          const removedProduct = products.find(product => product.id === editingProductId);
          if (removedProduct && !nextProducts.some(product => product.id === editingProductId)) {
            queueProductPhotoCleanup(removedProduct.photo);
          }
          setShowAddForm(false);
          clearForm();
          showToast('已刪除');
        },
        { confirmLabel: '刪除', danger: true }
      );
    }
  };

  const handleDeleteProduct = () => {
    if (!editingProductId) return;
    askConfirmation(
      '刪除整個品項',
      '這個品項和底下所有庫存都會被永久刪除，無法復原。',
      () => {
        const removedProduct = products.find(product => product.id === editingProductId);
        setProducts(products.filter(product => product.id !== editingProductId));
        queueProductPhotoCleanup(removedProduct?.photo);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        clearForm();
        showToast('已刪除');
      },
      { confirmLabel: '刪除', danger: true }
    );
  };

  // "再加一瓶": prefill from the latest item of this product
  const handleAddAnotherInstanceTrigger = (prod: Product) => {
    clearForm();
    setEditingProductId(prod.id);
    setIsAddingInstanceToExisting(true);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormPhoto(prod.photo || '');
    setFormPhotoThumbnail(prod.photoThumbnail || '');

    const template = prod.instances[prod.instances.length - 1];
    if (template) {
      const { amount, unit } = splitCapacity(template.capacity, capacityUnits);
      setFormCapacity(amount);
      setFormCapacityUnit(unit);
      setFormPaoMonths(template.paoMonths ? String(template.paoMonths) : '');
      setFormPurchasePlace(template.purchasePlace || '');
      setFormPrice(template.price !== undefined ? String(template.price) : '');
      setShowMoreFields(Boolean(template.paoMonths || template.purchasePlace || template.price !== undefined));
    }

    setShowAddForm(true);
  };

  const currentSearchCategory = categories.find(category => category.id === currentTab);
  const usedSearchSubcategories = Array.from(new Set(products
    .filter(product => product.status === 'active' && product.category === currentTab && product.subcategory)
    .map(product => product.subcategory)));
  const availableSearchSubcategories = currentSearchCategory
    ? [
        ...currentSearchCategory.subcategories.filter(subcategory => usedSearchSubcategories.includes(subcategory)),
        ...usedSearchSubcategories.filter(subcategory => !currentSearchCategory.subcategories.includes(subcategory)),
      ]
    : [];
  const hasSearchFilter = Boolean(searchKeyword.trim() || selectedSearchSubcategory);

  const activeProducts = products.filter(prod => {
    if (hasSearchFilter) {
      if (prod.status !== 'active') return false;
      if (selectedSearchSubcategory && (
        prod.category !== currentTab || prod.subcategory !== selectedSearchSubcategory
      )) return false;
      if (!searchKeyword.trim()) return true;

      const term = searchKeyword.trim().toLowerCase();
      const catName = categories.find(c => c.id === prod.category)?.name || '';
      return (
        prod.brand.toLowerCase().includes(term) ||
        prod.name.toLowerCase().includes(term) ||
        prod.subcategory.toLowerCase().includes(term) ||
        catName.toLowerCase().includes(term)
      );
    }

    if (currentTab === 'history') {
      if (prod.status !== 'archived') return false;
    } else {
      if (prod.status !== 'active') return false;
      if (prod.category !== currentTab) return false;
    }

    return true;
  });

  // Calculate statistics for header and category subheaders
  const getSubcategoryStats = (subName: string, categoryId: string) => {
    const matchedProds = products.filter(p => p.status === 'active' && p.category === categoryId && p.subcategory === subName);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    let openedQty = 0;
    let unopenedQty = 0;
    matchedProds.forEach(p => {
      p.instances.forEach(i => {
        totalQty += i.qty;
        if (i.usage === '使用中') {
          openedQty += i.qty;
        } else if (i.usage === '未開封') {
          unopenedQty += i.qty;
        }
      });
    });
    return { count: totalCount, qty: totalQty, openedQty, unopenedQty };
  };

  const getCategoryStats = (categoryId: string) => {
    const matchedProds = products.filter(p => p.status === 'active' && p.category === categoryId);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    matchedProds.forEach(p => {
      p.instances.forEach(i => {
        if (isActiveUsage(i.usage)) totalQty += i.qty;
      });
    });
    return { count: totalCount, qty: totalQty };
  };



  // LocalStorage Double Backup
  useEffect(() => {
    if (isDataLoaded) {
       localStorage.setItem(`cosmetics_backup_categories_${user.uid}`, JSON.stringify(categories));
       localStorage.setItem(`cosmetics_backup_products_${user.uid}`, JSON.stringify(products));
    }
  }, [categories, products, isDataLoaded]);

  const handleExportBackup = () => {
    const backupData = {
      categories,
      capacityUnits,
      products,
      exportDate: new Date().toISOString()
    };
    // Use text/plain and .txt so that Android's media scanner reliably picks it up and shows it in "Recent" files
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'text/plain' });
    const dataStr = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `cosmetics_backup_${todayStr()}.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setTimeout(() => URL.revokeObjectURL(dataStr), 100);
    showToast('備份檔已下載');
  };

  const applyBackup = async (json: any) => {
    setCategories(json.categories);
    if (json.capacityUnits) setCapacityUnits(json.capacityUnits);
    setProducts(json.products);
    showToast('已還原，正在同步到雲端');

    localStorage.setItem(`cosmetics_backup_categories_${user.uid}`, JSON.stringify(json.categories));
    localStorage.setItem(`cosmetics_backup_products_${user.uid}`, JSON.stringify(json.products));

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { categories: json.categories, updatedAt: new Date().toISOString() }, { merge: true });
      for (const p of json.products) {
        await setDoc(doc(db, 'users', user.uid, 'products', p.id), p);
      }
    } catch (err) {
      console.error(err);
      showToast('雲端同步失敗，稍後會再試');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target.files?.[0];
    target.value = ''; // allow choosing the same file again
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.categories || !json.products) {
          showToast('備份檔格式不正確');
          return;
        }
        const backupDate = json.exportDate ? new Date(json.exportDate).toLocaleDateString() : '';
        askConfirmation(
          '從備份還原',
          `目前的資料會被備份檔${backupDate ? `（${backupDate}）` : ''}取代，共 ${json.products.length} 筆品項。`,
          () => { void applyBackup(json); },
          { confirmLabel: '還原', danger: true }
        );
      } catch (err) {
        console.error(err);
        showToast('讀取備份檔失敗');
      }
    };
    reader.readAsText(file);
  };

  // Get current subcategories for selected form category
  const currentFormCategoryObj = categories.find(c => c.id === formCategory);
  const currentFormSubcategories = currentFormCategoryObj ? currentFormCategoryObj.subcategories : [];

  const handlePreviewReady = (productId: string, preview: string) => {
    setProducts((currentProducts) => {
      const product = currentProducts.find((item) => item.id === productId);
      if (!product || product.photoThumbnail) return currentProducts;
      const nextProducts = currentProducts.map((item) => item.id === productId
        ? { ...item, photoThumbnail: preview }
        : item);
      // Make the generated preview available on the very next launch even if
      // the cloud write is still completing when Android suspends the PWA.
      writeUserCache(user.uid, {
        categories,
        capacityUnits,
        products: nextProducts,
        syncedAt: lastSyncedAt || new Date().toISOString()
      });
      return nextProducts;
    });
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-retro-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-retro-primary animate-pulse" />
          <span className="text-retro-text/60 font-bold text-sm tracking-wider">載入中</span>
        </div>
      </div>
    );
  }

  // --- Shared form styles ---
  const inputClass = 'w-full h-11 px-3 bg-white/70 border border-retro-text/10 rounded-xl text-sm text-retro-text font-medium focus:outline-none focus:border-retro-primary focus:ring-1 focus:ring-retro-primary/30';
  const labelClass = 'block text-xs font-bold text-retro-text/60 mb-1.5';
  const fmtDate = (date?: string) => (date ? date.replace(/-/g, '/') : '—');
  const usageChipClass = (usage: ProductInstance['usage']) =>
    usage === '使用中' ? 'bg-retro-primary/15 text-retro-primary'
      : usage === '未開封' ? 'bg-retro-text/5 text-retro-text/60'
      : usage === '已丟棄' ? 'bg-retro-danger/10 text-retro-danger'
      : 'bg-retro-secondary/10 text-retro-secondary';
  const archivedCount = products.filter(p => p.status === 'archived').length;

  const renderSettingsHeader = (title: string) => (
    <div className="flex items-center gap-1 mb-3 -ml-2">
      <button
        onClick={() => setSettingsView('menu')}
        className="w-10 h-10 rounded-full flex items-center justify-center text-retro-text/60 hover:bg-retro-card active:bg-retro-card transition-colors"
        aria-label="返回設定"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-lg font-bold font-display text-retro-text">{title}</h2>
    </div>
  );

  return (

      <div className="min-h-screen bg-retro-bg text-retro-text relative pb-24 font-sans select-none antialiased">
      {syncState === 'stale' && (
        <div className="sticky top-0 z-50 px-4 py-2 text-center text-xs font-semibold border-b bg-amber-50 text-amber-800 border-amber-200" role="status">
          {`離線中，顯示上次同步的內容${lastSyncedAt ? `（${new Date(lastSyncedAt).toLocaleString()}）` : ''}`}
        </div>
      )}
      {/* 1. App Header */}
      <header className={`px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center bg-retro-bg/90 backdrop-blur-sm sticky z-40 border-b border-retro-text/10 max-w-2xl mx-auto ${syncState === 'stale' ? 'top-8' : 'top-0'}`}>
        <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
          <span>用品管理系統</span>
          {syncState === 'refreshing' && (
            <RefreshCw className="w-4 h-4 text-retro-text/25 animate-spin" aria-label="同步中" />
          )}
        </h1>
        <button
          onClick={() => {
            clearForm();
            setShowAddForm(true);
          }}
          className="w-11 h-11 rounded-full bg-retro-secondary text-retro-card flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all hover:brightness-105"
          aria-label="新增商品"
          title="新增商品"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-3">
        {/* 2. Opened-too-long reminder */}
        {expiredPaoItems.length > 0 && showNotificationBanner && currentTab !== 'settings' && (
          <div className="mb-4 rounded-2xl bg-retro-danger/10 border border-retro-danger/15 text-retro-danger overflow-hidden animate-fade-in">
            <div className="flex items-center">
              <button
                onClick={() => setIsExpiredListOpen(open => !open)}
                className="flex-1 min-w-0 flex items-center gap-2 pl-4 py-3 text-left text-sm font-bold"
                aria-expanded={isExpiredListOpen}
              >
                <CircleAlert className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{expiredPaoItems.length} 件已超過開封期限</span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpiredListOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setShowNotificationBanner(false)}
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-retro-danger/60 hover:text-retro-danger"
                aria-label="關閉提醒"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isExpiredListOpen && (
              <ul className="px-2.5 pb-2.5 space-y-1.5">
                {expiredPaoItems.map((item) => (
                  <li key={item.instance.id}>
                    <button
                      onClick={() => setSelectedDetailProduct(item.product)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/70 hover:bg-white text-left text-xs transition-colors"
                    >
                      <span className="min-w-0 truncate font-semibold text-retro-text">{item.product.brand} {item.product.name}</span>
                      <span className="flex-shrink-0 font-bold">過期 {item.daysOverdue} 天</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 3. Search Bar */}
        {currentTab !== 'settings' && (
          <div className="mb-4 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-text/40 w-4.5 h-4.5 pointer-events-none" />
              <input
                type="text"
                enterKeyHint="search"
                placeholder="搜尋品牌或產品"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-retro-card rounded-2xl text-sm border border-retro-text/5 focus:outline-none focus:ring-1 focus:ring-retro-primary shadow-inner text-retro-text font-medium"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-retro-text/50 hover:text-retro-text"
                  aria-label="清除搜尋文字"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {currentSearchCategory && availableSearchSubcategories.length > 0 && (
              <div className="relative w-32 shrink-0 sm:w-44">
                <select
                  value={selectedSearchSubcategory}
                  onChange={(event) => setSelectedSearchSubcategory(event.target.value)}
                  className="w-full appearance-none truncate bg-retro-card rounded-2xl border border-retro-text/5 py-3 pl-3 pr-8 text-sm font-medium text-retro-text shadow-inner focus:outline-none focus:ring-1 focus:ring-retro-primary"
                  aria-label="選擇子分類"
                >
                  <option value="">全部子分類</option>
                  {availableSearchSubcategories.map(subcategory => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-retro-text/50" />
              </div>
            )}
          </div>
        )}

        {/* 5. Add / Edit Product Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
            <form
              id="manual-add-form"
              onSubmit={handleFormSave}
              className="w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-retro-card rounded-t-3xl sm:rounded-3xl border border-retro-text/10 shadow-2xl animate-slide-up"
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-retro-text/5">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-retro-text">
                    {isEditingMaster ? '編輯品項' : editingInstanceId ? '編輯這一件' : isAddingInstanceToExisting ? '再加一瓶' : '新增商品'}
                  </h3>
                  {(editingInstanceId || isAddingInstanceToExisting) && (
                    <p className="text-xs font-semibold text-retro-text/50 truncate mt-0.5">{formBrand} {formName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    clearForm();
                  }}
                  className="w-9 h-9 -mr-2 -mt-1 flex-shrink-0 rounded-full flex items-center justify-center text-retro-text/50 hover:text-retro-text hover:bg-retro-bg transition-colors"
                  aria-label="關閉"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {/* ====== PRODUCT FIELDS ====== */}
              {(!editingInstanceId && !isAddingInstanceToExisting) && (
                <div className="space-y-4">
                  {/* Photo */}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={formPhotoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => formPhotoInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-16 h-16 flex-shrink-0 rounded-2xl border border-dashed border-retro-text/20 bg-white/60 flex items-center justify-center text-retro-text/40 overflow-hidden hover:border-retro-primary/60 transition-colors"
                      aria-label={formPhoto ? '更換照片' : '加入照片'}
                    >
                      {isUploading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : formPhoto ? (
                        <img src={formPhoto} alt="產品照片" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-bold text-retro-text/60">{isUploading ? '照片上傳中…' : '產品照片'}</span>
                      {formPhoto && !isUploading ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFormPhoto('');
                            setFormPhotoThumbnail('');
                            setIsFormPhotoRemoved(true);
                            discardPendingFormUpload();
                          }}
                          className="text-xs font-bold text-retro-danger hover:underline"
                        >
                          移除照片
                        </button>
                      ) : !isUploading ? (
                        <span className="text-xs text-retro-text/40">選填</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Category & Subcategory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="f-category">主類別</label>
                      <select
                        id="f-category"
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          setFormSubcategory(''); // reset
                        }}
                        className={inputClass}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="f-subcategory">子分類</label>
                      <select
                        id="f-subcategory"
                        value={
                          currentFormSubcategories.includes(formSubcategory)
                            ? formSubcategory
                            : formSubcategory === ''
                              ? ''
                              : 'custom'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setFormSubcategory('自訂子分類');
                          } else {
                            setFormSubcategory(val);
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="">請選擇</option>
                        {currentFormSubcategories.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                        <option value="custom">自訂…</option>
                      </select>
                    </div>
                  </div>

                  {(formSubcategory !== '' && !currentFormSubcategories.includes(formSubcategory)) && (
                    <input
                      type="text"
                      placeholder="自訂子分類名稱"
                      aria-label="自訂子分類名稱"
                      value={formSubcategory === '自訂子分類' ? '' : formSubcategory}
                      onChange={(e) => setFormSubcategory(e.target.value)}
                      className={inputClass}
                    />
                  )}

                  {/* Brand */}
                  <div>
                    <label className={labelClass} htmlFor="f-brand">品牌</label>
                    <input
                      id="f-brand"
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className={labelClass} htmlFor="f-name">產品名稱</label>
                    <input
                      id="f-name"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* ====== ITEM FIELDS ====== */}
              {!isEditingMaster && (
                <div className="space-y-4">
                  {/* Quantity and Capacity */}
                  <div className="grid grid-cols-[1fr_1.3fr_1.2fr] gap-2.5">
                    <div>
                      <label className={labelClass} htmlFor="f-qty">數量</label>
                      <input
                        id="f-qty"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={formQty === 0 ? '' : formQty}
                        onChange={(e) => setFormQty(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="f-capacity">容量</label>
                      <input
                        id="f-capacity"
                        type="text"
                        inputMode="decimal"
                        placeholder="30"
                        value={formCapacity}
                        onChange={(e) => setFormCapacity(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="f-unit">單位</label>
                      <select
                        id="f-unit"
                        value={showNewUnitInput ? 'new' : (formCapacityUnit === '' || capacityUnits.includes(formCapacityUnit) ? formCapacityUnit : 'new')}
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            setShowNewUnitInput(true);
                          } else {
                            setShowNewUnitInput(false);
                            setFormCapacityUnit(e.target.value);
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {capacityUnits.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                        <option value="new">新增單位…</option>
                      </select>
                    </div>
                  </div>

                  {showNewUnitInput && (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input
                        type="text"
                        autoFocus
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        className={inputClass}
                        placeholder="新單位，例如 入"
                        aria-label="新單位名稱"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = newUnitName.trim();
                            if (!val) return;
                            if (!capacityUnits.includes(val)) {
                              setCapacityUnits([...capacityUnits, val]);
                            }
                            setFormCapacityUnit(val);
                            setShowNewUnitInput(false);
                            setNewUnitName('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newUnitName.trim();
                          if (val) {
                            if (!capacityUnits.includes(val)) {
                              setCapacityUnits([...capacityUnits, val]);
                            }
                            setFormCapacityUnit(val);
                          }
                          setShowNewUnitInput(false);
                          setNewUnitName('');
                        }}
                        className="h-11 px-4 flex-shrink-0 bg-retro-primary text-white rounded-xl text-sm font-bold hover:brightness-105 transition-all"
                      >
                        加入
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewUnitInput(false);
                          setNewUnitName('');
                        }}
                        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl text-retro-text/50 hover:bg-retro-bg transition-colors"
                        aria-label="取消新增單位"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Usage */}
                  <div>
                    <span className={labelClass}>狀態</span>
                    <div
                      className={`grid ${editingInstanceId ? 'grid-cols-4' : 'grid-cols-2'} gap-1 p-1 bg-retro-bg/70 rounded-xl`}
                      role="radiogroup"
                      aria-label="狀態"
                    >
                      {(editingInstanceId
                        ? (['未開封', '使用中', '已用完', '已丟棄'] as const)
                        : (['未開封', '使用中'] as const)
                      ).map(option => (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={formUsage === option}
                          onClick={() => setFormUsage(option)}
                          className={`h-9 rounded-lg text-sm font-bold transition-colors ${formUsage === option ? 'bg-white text-retro-text shadow-sm' : 'text-retro-text/45 hover:text-retro-text/70'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={formUsage === '未開封' ? 'col-span-2' : ''}>
                      <label className={labelClass} htmlFor="f-expiry">有效期限</label>
                      <input
                        id="f-expiry"
                        type="date"
                        value={formExpiry}
                        onChange={(e) => setFormExpiry(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    {formUsage !== '未開封' && (
                      <div>
                        <label className={labelClass} htmlFor="f-opened">開封日期</label>
                        <input
                          id="f-opened"
                          type="date"
                          value={formOpenedDate}
                          onChange={(e) => setFormOpenedDate(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}
                    {(formUsage === '已用完' || formUsage === '已丟棄') && (
                      <div className="col-span-2">
                        <label className={labelClass} htmlFor="f-finished">{formUsage === '已丟棄' ? '丟棄日期' : '用完日期'}</label>
                        <input
                          id="f-finished"
                          type="date"
                          value={formFinishedDate}
                          onChange={(e) => setFormFinishedDate(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                  {/* PAO & purchase details */}
                  <div className="rounded-2xl border border-retro-text/10 bg-white/40">
                    <button
                      type="button"
                      onClick={() => setShowMoreFields(open => !open)}
                      aria-expanded={showMoreFields}
                      className="w-full flex items-center gap-2 px-4 h-11 text-left text-sm font-bold text-retro-text/70"
                    >
                      <span className="flex-shrink-0">開封期限與購買資訊</span>
                      {!showMoreFields && (
                        <span className="flex-1 min-w-0 truncate text-right text-xs font-semibold text-retro-text/40">
                          {[
                            formPaoMonths ? `${formPaoMonths} 個月` : '',
                            formPurchasePlace.trim(),
                            formPrice ? `$${formPrice}` : ''
                          ].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-auto transition-transform ${showMoreFields ? 'rotate-180' : ''}`} />
                    </button>
                    {showMoreFields && (
                      <div className="px-4 pb-4 space-y-3 animate-fade-in">
                        {(formUsage === '使用中' || formUsage === '未開封') && (
                          <div>
                            <label className={labelClass} htmlFor="f-pao">開封後可用（月）</label>
                            <input
                              id="f-pao"
                              type="number"
                              inputMode="numeric"
                              min="1"
                              placeholder="6、12、24"
                              value={formPaoMonths}
                              onChange={(e) => setFormPaoMonths(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass} htmlFor="f-purchase-date">購買日期</label>
                            <input
                              id="f-purchase-date"
                              type="date"
                              value={formPurchaseDate}
                              onChange={(e) => setFormPurchaseDate(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass} htmlFor="f-price">單價</label>
                            <input
                              id="f-price"
                              type="number"
                              inputMode="decimal"
                              min="0"
                              placeholder="NT$"
                              value={formPrice}
                              onChange={(e) => setFormPrice(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="f-place">購買地點</label>
                          <input
                            id="f-place"
                            type="text"
                            placeholder="屈臣氏、momo…"
                            value={formPurchasePlace}
                            onChange={(e) => setFormPurchasePlace(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

              <div className="flex items-center gap-2 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-retro-text/5">
                {(editingInstanceId || isEditingMaster) && (
                  <button
                    type="button"
                    onClick={isEditingMaster ? handleDeleteProduct : handleDeleteInstance}
                    className="h-12 px-4 flex-shrink-0 rounded-xl text-sm font-bold text-retro-danger hover:bg-retro-danger/10 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isEditingMaster ? '刪除品項' : '刪除'}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 h-12 bg-retro-secondary text-retro-card font-bold text-sm rounded-xl hover:brightness-105 active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading
                    ? '照片上傳中…'
                    : isEditingMaster || editingInstanceId
                      ? '儲存'
                      : isAddingInstanceToExisting
                        ? '加入'
                        : '新增'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 6. Active Tab Product List / Settings Screen */}
        {currentTab === 'settings' ? (
          /* =================== SETTINGS VIEW =================== */
          <div className="pb-20">
            {settingsView === 'menu' && (
              <div className="space-y-3 animate-fade-in">
                <h2 className="text-xl font-bold font-display text-retro-text px-1 mb-1">設定</h2>
                <div className="bg-white rounded-2xl border border-retro-text/10 divide-y divide-retro-text/5 overflow-hidden">
                  {([
                    { view: 'category', label: '分類管理', icon: ListTree, count: categories.length },
                    { view: 'units', label: '容量單位', icon: Ruler, count: capacityUnits.length },
                    { view: 'history', label: '歷史紀錄', icon: Archive, count: archivedCount },
                    { view: 'backup', label: '備份與還原', icon: DatabaseBackup, count: 0 },
                  ] as const).map(item => (
                    <button
                      key={item.view}
                      onClick={() => setSettingsView(item.view)}
                      className="w-full flex items-center gap-3 px-4 h-14 text-left hover:bg-retro-bg/40 active:bg-retro-bg/60 transition-colors cursor-pointer"
                    >
                      <item.icon className="w-5 h-5 text-retro-primary" />
                      <span className="flex-1 text-sm font-bold text-retro-text">{item.label}</span>
                      {item.count > 0 && <span className="text-xs font-bold text-retro-text/35">{item.count}</span>}
                      <ChevronRight className="w-4 h-4 text-retro-text/30" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={async () => {
                    clearMemoryImages(user.uid);
                    await clearPrivateUserCache(user.uid);
                    await logOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-white border border-retro-text/10 text-sm font-bold text-retro-danger hover:bg-retro-danger/5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  登出
                </button>

                <p className="pt-4 text-center text-[11px] font-bold text-retro-text/30">用品管理系統 {APP_VERSION}</p>
              </div>
            )}

            {settingsView === 'category' && (
              <div className="space-y-4 animate-fade-in">
                {renderSettingsHeader('分類管理')}

                {/* Add New Category */}
                <div className="p-3 bg-white rounded-2xl border border-retro-text/10 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="新的大分類"
                      aria-label="新的大分類名稱"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory();
                      }}
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={handleAddCategory}
                      className="h-11 px-4 flex-shrink-0 bg-retro-secondary text-retro-card text-sm font-bold rounded-xl hover:brightness-105 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      新增
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="分類圖示">
                    {CATEGORY_ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        role="radio"
                        aria-checked={newCatIcon === icon}
                        aria-label={CATEGORY_ICON_LABELS[icon]}
                        onClick={() => setNewCatIcon(icon)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${newCatIcon === icon ? 'bg-retro-primary text-retro-card' : 'bg-retro-bg/60 text-retro-text/45 hover:text-retro-text/70'}`}
                      >
                        <CategoryIcon name={icon} className="w-4.5 h-4.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category list */}
                <div className="space-y-2.5">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="border border-retro-text/10 rounded-2xl bg-white overflow-hidden"
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleCatDragStart(e, idx)}
                        onDragOver={handleCatDragOver}
                        onDrop={(e) => handleCatDrop(e, idx)}
                        className="flex items-center gap-2 pl-2 pr-2 py-2"
                      >
                        <div className="cursor-grab w-8 h-8 items-center justify-center rounded-lg text-retro-text/30 hover:bg-retro-bg/60 hidden sm:flex">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col sm:hidden">
                          <button onClick={(e) => { e.stopPropagation(); moveCatUp(idx); }} disabled={idx === 0} className="w-8 h-6 flex items-center justify-center text-retro-text/40 rounded-md hover:bg-retro-bg/60 disabled:opacity-25" aria-label={`把「${cat.name}」往上移`}>
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveCatDown(idx); }} disabled={idx === categories.length - 1} className="w-8 h-6 flex items-center justify-center text-retro-text/40 rounded-md hover:bg-retro-bg/60 disabled:opacity-25" aria-label={`把「${cat.name}」往下移`}>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <CategoryIcon name={cat.icon} className="w-4.5 h-4.5 text-retro-primary flex-shrink-0" />
                        <span className="flex-1 min-w-0 truncate font-bold text-sm text-retro-text">{cat.name}</span>
                        <button
                          onClick={() => setActiveCategoryForSub(activeCategoryForSub === cat.id ? null : cat.id)}
                          aria-expanded={activeCategoryForSub === cat.id}
                          className={`h-9 px-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${activeCategoryForSub === cat.id ? 'bg-retro-primary text-retro-card' : 'bg-retro-primary/10 text-retro-primary hover:bg-retro-primary/20'}`}
                        >
                          小分類 {cat.subcategories.length}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeCategoryForSub === cat.id ? 'rotate-180' : ''}`} />
                        </button>
                        {categories.length > 1 && (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-retro-text/30 hover:text-retro-danger hover:bg-retro-danger/10 transition-colors"
                            aria-label={`刪除「${cat.name}」`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {activeCategoryForSub === cat.id && (
                        <div className="p-3 bg-retro-bg/30 border-t border-retro-text/5 space-y-2.5 animate-fade-in">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="新的小分類"
                              aria-label="新的小分類名稱"
                              value={newSubName}
                              onChange={(e) => setNewSubName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubcategory(cat.id);
                              }}
                              className={`${inputClass} flex-1 bg-white`}
                            />
                            <button
                              onClick={() => handleAddSubcategory(cat.id)}
                              className="w-11 h-11 flex-shrink-0 bg-retro-primary text-white rounded-xl flex items-center justify-center hover:brightness-105 transition-all cursor-pointer"
                              aria-label="新增小分類"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                            {cat.subcategories.map((sub, sIdx) => (
                              <li
                                key={sIdx}
                                draggable
                                onDragStart={(e) => handleSubDragStart(e, cat.id, sIdx)}
                                onDragOver={handleSubDragOver}
                                onDrop={(e) => handleSubDrop(e, cat.id, sIdx)}
                                className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 bg-white border border-retro-text/5 rounded-xl text-sm"
                              >
                                <div className="cursor-grab w-7 h-8 items-center justify-center text-retro-text/30 hidden sm:flex">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col sm:hidden">
                                  <button onClick={(e) => { e.stopPropagation(); moveSubCatUp(cat.id, sIdx); }} disabled={sIdx === 0} className="w-8 h-5 flex items-center justify-center text-retro-text/40 rounded disabled:opacity-25" aria-label={`把「${sub}」往上移`}>
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); moveSubCatDown(cat.id, sIdx); }} disabled={sIdx === cat.subcategories.length - 1} className="w-8 h-5 flex items-center justify-center text-retro-text/40 rounded disabled:opacity-25" aria-label={`把「${sub}」往下移`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </div>
                                {editingSubIdx === sIdx && editingSubCatId === cat.id ? (
                                  <input
                                    type="text"
                                    value={editingSubName}
                                    onChange={(e) => setEditingSubName(e.target.value)}
                                    onBlur={() => handleSaveSubcategory(cat.id, sIdx)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveSubcategory(cat.id, sIdx);
                                    }}
                                    autoFocus
                                    aria-label="小分類名稱"
                                    className="flex-1 min-w-0 h-9 px-2 border border-retro-primary rounded-lg bg-white text-sm text-retro-text focus:outline-none"
                                  />
                                ) : (
                                  <span className="flex-1 min-w-0 truncate font-semibold text-retro-text/80">{sub}</span>
                                )}
                                {editingSubIdx === sIdx && editingSubCatId === cat.id ? (
                                  <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSaveSubcategory(cat.id, sIdx)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-retro-primary hover:bg-retro-primary/10"
                                    aria-label="儲存名稱"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingSubCatId(cat.id);
                                      setEditingSubIdx(sIdx);
                                      setEditingSubName(sub);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-retro-text/35 hover:text-retro-text hover:bg-retro-bg/60"
                                    aria-label={`重新命名「${sub}」`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteSubcategory(cat.id, sIdx)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg text-retro-text/30 hover:text-retro-danger hover:bg-retro-danger/10"
                                  aria-label={`刪除「${sub}」`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                            {cat.subcategories.length === 0 && (
                              <li className="text-center text-retro-text/35 text-xs font-semibold py-4">
                                還沒有小分類
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settingsView === 'backup' && (
              <div className="space-y-4 animate-fade-in">
                {renderSettingsHeader('備份與還原')}
                <div className="space-y-2.5">
                  <button
                    onClick={handleExportBackup}
                    className="w-full h-14 flex items-center gap-3 px-4 bg-white border border-retro-text/10 rounded-2xl text-left hover:bg-retro-bg/40 transition-colors cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-retro-primary" />
                    <span className="flex-1 text-sm font-bold text-retro-text">下載備份檔</span>
                  </button>
                  <button
                    onClick={() => backupInputRef.current?.click()}
                    className="w-full h-14 flex items-center gap-3 px-4 bg-white border border-retro-text/10 rounded-2xl text-left hover:bg-retro-bg/40 transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-retro-secondary" />
                    <span className="flex-1 text-sm font-bold text-retro-text">從備份檔還原</span>
                  </button>
                  <input ref={backupInputRef} type="file" accept=".json,.txt,application/json,text/plain" className="hidden" onChange={handleImportBackup} />
                </div>
              </div>
            )}

            {settingsView === 'units' && (
              <div className="space-y-4 animate-fade-in">
                {renderSettingsHeader('容量單位')}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settingsUnitName}
                    onChange={(e) => setSettingsUnitName(e.target.value)}
                    placeholder="新的單位"
                    aria-label="新的單位名稱"
                    className={`${inputClass} flex-1 bg-white`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && settingsUnitName.trim()) {
                         const val = settingsUnitName.trim();
                         if (!capacityUnits.includes(val)) {
                           setCapacityUnits([...capacityUnits, val]);
                         }
                         setSettingsUnitName('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                       const val = settingsUnitName.trim();
                       if (val && !capacityUnits.includes(val)) {
                         setCapacityUnits([...capacityUnits, val]);
                       }
                       setSettingsUnitName('');
                    }}
                    className="h-11 px-4 flex-shrink-0 bg-retro-primary text-white rounded-xl text-sm font-bold hover:brightness-105 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    新增
                  </button>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {capacityUnits.map((u, idx) => (
                    <li key={idx} className="flex items-center gap-0.5 pl-3.5 pr-1 h-10 bg-white border border-retro-text/10 rounded-full text-sm font-bold text-retro-text">
                      <span>{u}</span>
                      <button
                        onClick={() => {
                          askConfirmation('刪除單位', `要刪除單位「${u}」嗎？已記錄的容量不受影響。`, () => {
                            setCapacityUnits(capacityUnits.filter(unit => unit !== u));
                          }, { confirmLabel: '刪除', danger: true });
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-retro-text/30 hover:text-retro-danger hover:bg-retro-danger/10 transition-colors"
                        aria-label={`刪除單位「${u}」`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {capacityUnits.length === 0 && (
                    <li className="text-xs font-semibold text-retro-text/35 w-full text-center py-4">還沒有單位</li>
                  )}
                </ul>
              </div>
            )}

            {settingsView === 'history' && (
              <div className="space-y-3 animate-fade-in">
                {renderSettingsHeader('歷史紀錄')}
                {(() => {
                  const archivedProducts = products
                    .filter(p => p.status === 'archived')
                    .sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || ''));
                  if (archivedProducts.length === 0) {
                    return (
                      <p className="text-center py-12 text-sm font-semibold text-retro-text/40">還沒有歷史紀錄</p>
                    );
                  }
                  return (
                    <div className="space-y-2.5">
                      {archivedProducts.map(prod => (
                        <ProductCard
                          key={prod.id}
                          userId={user.uid}
                          onPreviewReady={handlePreviewReady}
                          product={prod}
                          onImageClick={setFullscreenImage}
                          categoryIcon={categories.find(c => c.id === prod.category)?.icon || 'sparkles'}
                          onRestore={handleRestoreMaster}
                          onDelete={handleDeleteArchivedProduct}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          /* =================== MAIN LIST VIEW =================== */
          <div className="space-y-4">
            {(() => {
              const stats = hasSearchFilter
                ? {
                    count: activeProducts.length,
                    qty: activeProducts.reduce((sum, p) => sum + p.instances.reduce((s, i) => s + (isActiveUsage(i.usage) ? i.qty : 0), 0), 0)
                  }
                : getCategoryStats(currentTab);
              return (
                <div className="flex items-center justify-between px-1 text-xs font-bold text-retro-text/45">
                  <span>{hasSearchFilter ? '搜尋結果' : categories.find(c => c.id === currentTab)?.name || ''}</span>
                  <span>{stats.count} 品項 · 庫存 {stats.qty}</span>
                </div>
              );
            })()}

            {(() => {
              const inUseFirst = (a: Product, b: Product) => {
                const aOpened = a.instances.some(i => i.usage === '使用中') ? 1 : 0;
                const bOpened = b.instances.some(i => i.usage === '使用中') ? 1 : 0;
                return bOpened - aOpened;
              };
              const renderCard = (prod: Product) => (
                <ProductCard
                  key={prod.id}
                  userId={user.uid}
                  onPreviewReady={handlePreviewReady}
                  product={prod}
                  onViewDetail={setSelectedDetailProduct}
                  onImageClick={setFullscreenImage}
                  categoryIcon={categories.find(c => c.id === prod.category)?.icon || 'sparkles'}
                />
              );

              // Searching: one flat list
              if (hasSearchFilter) {
                if (activeProducts.length === 0) {
                  return (
                    <p className="text-center py-12 text-sm font-semibold text-retro-text/40">找不到符合的商品</p>
                  );
                }
                return (
                  <div className="space-y-2.5">
                    {[...activeProducts].sort(inUseFirst).map(renderCard)}
                  </div>
                );
              }

              const currentCatObj = categories.find(c => c.id === currentTab);
              if (!currentCatObj) return null;

              // Group by subcategory, in the configured order, then any extra ones
              const predefinedSubcats = currentCatObj.subcategories;
              const usedSubcats = Array.from(new Set(activeProducts.map(p => p.subcategory)));
              const customSubcats = usedSubcats.filter(sub => !predefinedSubcats.includes(sub));
              const groups = [...predefinedSubcats, ...customSubcats]
                .filter(subName => activeProducts.some(p => p.subcategory === subName));

              if (groups.length === 0) {
                return (
                  <div className="text-center py-12">
                    <p className="text-sm text-retro-text/40 font-semibold">這個分類還沒有商品</p>
                    <button
                      onClick={() => {
                        clearForm();
                        setFormCategory(currentTab);
                        setShowAddForm(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 bg-retro-secondary text-retro-card rounded-xl text-sm font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      新增商品
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {groups.map(subName => {
                    const groupProds = activeProducts
                      .filter(p => p.subcategory === subName)
                      .sort(inUseFirst);
                    const stats = getSubcategoryStats(subName, currentTab);

                    return (
                      <section key={subName} className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-xs font-bold text-retro-text/60 tracking-wide">{subName}</h3>
                          <span className="text-[11px] font-bold text-retro-text/45 flex items-center gap-2.5">
                            <span className="flex items-center gap-1" title="未開封">
                              <Package className="w-3.5 h-3.5 text-retro-primary" />
                              {stats.unopenedQty}
                            </span>
                            <span className="flex items-center gap-1" title="使用中">
                              <PackageOpen className="w-3.5 h-3.5 text-emerald-600" />
                              {stats.openedQty}
                            </span>
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {groupProds.map(renderCard)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 7. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-retro-card border-t border-retro-text/10 flex justify-around items-center pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 max-w-2xl mx-auto overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleTabChange(cat.id)}
            aria-current={currentTab === cat.id ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold min-w-[60px] h-12 transition-colors px-1.5 rounded-xl active:bg-retro-bg/40 ${currentTab === cat.id ? 'text-retro-primary bg-retro-primary/10' : 'text-retro-text/45'}`}
          >
            <CategoryIcon name={cat.icon} className="w-5 h-5" />
            <span className="truncate max-w-[60px]">{cat.name}</span>
          </button>
        ))}
        {/* Fixed Settings Tab */}
        <button
          onClick={() => handleTabChange('settings')}
          aria-current={currentTab === 'settings' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold min-w-[60px] h-12 transition-colors px-1.5 rounded-xl active:bg-retro-bg/40 ${currentTab === 'settings' ? 'text-retro-primary bg-retro-primary/10' : 'text-retro-text/45'}`}
        >
          <Settings className="w-5 h-5" />
          <span>設定</span>
        </button>
      </nav>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[130] w-max max-w-[calc(100vw-2rem)] pointer-events-none animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className={`flex items-center gap-2 bg-stone-800/95 text-white rounded-full text-sm font-bold shadow-lg ${toast.undo ? 'pl-4 pr-1.5 py-1.5 pointer-events-auto' : 'px-4 py-2.5'}`}>
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                onClick={() => toast.undo?.()}
                className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                復原
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== 8. Product Detail ==================== */}
      {selectedDetailProduct && (() => {
        const product = selectedDetailProduct;
        const isArchivedProduct = product.status === 'archived';
        const liveItems = product.instances.filter(inst => isActiveUsage(inst.usage));
        const stockQty = liveItems.reduce((sum, inst) => sum + inst.qty, 0);
        const inUseQty = liveItems.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0);
        const nearest = liveItems
          .map(getInstanceDeadline)
          .reduce((best, current) => (current.days < best.days ? current : best), { days: 9999, date: '' });
        const usageOrder: Record<string, number> = { '使用中': 0, '未開封': 1, '已用完': 2, '已丟棄': 3 };
        const sortedItems = [...product.instances].sort((a, b) => (usageOrder[a.usage] ?? 9) - (usageOrder[b.usage] ?? 9));
        const recordDate = (inst: ProductInstance) => inst.purchaseDate || inst.openedDate || inst.finishedDate || '';
        const records = products
          .filter(p => p.brand === product.brand && p.name === product.name)
          .flatMap(p => p.instances)
          .filter(inst => inst.purchaseDate || inst.purchasePlace || inst.price !== undefined || inst.openedDate || inst.finishedDate)
          .sort((a, b) => recordDate(b).localeCompare(recordDate(a)));
        const categoryOfProduct = categories.find(c => c.id === product.category);

        return (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
            <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-md bg-retro-card sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-slide-up">
              {/* Header */}
              <div className="flex items-start gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
                {product.photo ? (
                  <CachedImage
                    src={product.photo}
                    userId={user.uid}
                    thumbnail={product.photoThumbnail}
                    alt={product.name}
                    onClick={() => setFullscreenImage(product.photo!)}
                    className="w-16 h-20 flex-shrink-0 flex items-center justify-center cursor-zoom-in"
                    imageClassName="max-w-full max-h-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-16 h-20 flex-shrink-0 rounded-xl bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary">
                    <CategoryIcon name={categoryOfProduct?.icon || 'sparkles'} className="w-6 h-6 opacity-40" />
                  </div>
                )}

                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[11px] font-bold text-retro-secondary tracking-wider uppercase truncate">{product.brand}</p>
                  <h3 className="text-base font-bold text-retro-text leading-snug mt-0.5 line-clamp-2">{product.name}</h3>
                  <p className="text-xs font-semibold text-retro-text/45 mt-1 truncate">
                    {categoryOfProduct?.name || product.category}
                    {product.subcategory ? ` · ${product.subcategory}` : ''}
                  </p>
                </div>

                <div className="flex items-center -mr-1.5 -mt-0.5 flex-shrink-0">
                  {!isArchivedProduct && (
                    <button
                      onClick={() => handleEditProductMasterTrigger(product)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-retro-text/50 hover:text-retro-text hover:bg-retro-bg transition-colors cursor-pointer"
                      aria-label="編輯品項"
                    >
                      <Pencil className="w-4.5 h-4.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDetailProduct(null)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-retro-text/50 hover:text-retro-text hover:bg-retro-bg transition-colors cursor-pointer"
                    aria-label="關閉"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-1 p-1 bg-retro-bg/70 rounded-xl" role="tablist">
                  {([['items', '庫存'], ['records', records.length ? `紀錄 ${records.length}` : '紀錄']] as const).map(([tab, label]) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={detailActiveTab === tab}
                      onClick={() => setDetailActiveTab(tab)}
                      className={`h-9 rounded-lg text-sm font-bold transition-colors ${detailActiveTab === tab ? 'bg-white text-retro-text shadow-sm' : 'text-retro-text/45 hover:text-retro-text/70'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 space-y-2.5">
                {detailActiveTab === 'items' ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-2xl px-2 py-3 text-center">
                        <p className="text-[11px] font-bold text-retro-text/45">庫存</p>
                        <p className="text-xl font-extrabold text-retro-text font-mono mt-0.5">{stockQty}</p>
                      </div>
                      <div className="bg-white rounded-2xl px-2 py-3 text-center">
                        <p className="text-[11px] font-bold text-retro-text/45">使用中</p>
                        <p className="text-xl font-extrabold text-retro-primary font-mono mt-0.5">{inUseQty}</p>
                      </div>
                      <div className="bg-white rounded-2xl px-2 py-3 text-center">
                        <p className="text-[11px] font-bold text-retro-text/45">最近到期</p>
                        <p className={`text-xl font-extrabold font-mono mt-0.5 ${nearest.days <= 60 ? 'text-retro-danger' : 'text-retro-secondary'}`}>
                          {nearest.days !== 9999 ? nearest.days : '—'}
                          {nearest.days !== 9999 && <span className="text-xs font-bold ml-0.5">天</span>}
                        </p>
                        {nearest.date && <p className="text-[10px] font-bold text-retro-text/35">{fmtDate(nearest.date)}</p>}
                      </div>
                    </div>

                    {sortedItems.map(inst => {
                      const expiryDays = inst.expiry ? calculateDaysToExpiry(inst.expiry) : null;
                      const pao = inst.usage === '使用中' ? calculatePaoExpiry(inst.openedDate, inst.paoMonths) : null;
                      const purchase = [
                        inst.purchaseDate ? fmtDate(inst.purchaseDate) : '',
                        inst.purchasePlace || '',
                        inst.price !== undefined ? `$${inst.price}` : ''
                      ].filter(Boolean).join(' · ');

                      return (
                        <div key={inst.id} className="p-3 bg-white rounded-2xl space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${usageChipClass(inst.usage)}`}>{inst.usage}</span>
                            {inst.capacity && <span className="text-xs font-bold text-retro-text/55">{inst.capacity}</span>}
                            {!isArchivedProduct && (
                              <div className="ml-auto flex items-center gap-1">
                                {inst.usage === '未開封' && (
                                  <button
                                    onClick={() => handleOpenInstance(product.id, inst.id)}
                                    className="h-9 px-3.5 rounded-full bg-retro-primary/15 text-retro-primary text-xs font-bold flex items-center gap-1 hover:bg-retro-primary/25 transition-colors cursor-pointer"
                                  >
                                    <PackageOpen className="w-3.5 h-3.5" />
                                    開封
                                  </button>
                                )}
                                {inst.usage === '使用中' && (
                                  <button
                                    onClick={() => handleFinishInstance(product.id, inst.id)}
                                    className="h-9 px-3.5 rounded-full bg-retro-secondary/15 text-retro-secondary text-xs font-bold flex items-center gap-1 hover:bg-retro-secondary/25 transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    用完
                                  </button>
                                )}
                                {!isActiveUsage(inst.usage) && (
                                  <button
                                    onClick={() => handleFinishInstance(product.id, inst.id)}
                                    className="h-9 px-3.5 rounded-full bg-retro-bg text-retro-text/60 text-xs font-bold flex items-center gap-1 hover:bg-retro-bg/70 transition-colors cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    移到歷史
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditInstanceTrigger(product, inst)}
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-retro-text/35 hover:text-retro-text hover:bg-retro-bg transition-colors cursor-pointer"
                                  aria-label="編輯這一件"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                            <div>
                              <dt className="font-semibold text-retro-text/40">有效期限</dt>
                              <dd className={`font-bold mt-0.5 ${expiryDays !== null && expiryDays <= 60 ? 'text-retro-danger' : 'text-retro-text'}`}>
                                {inst.expiry && expiryDays !== null
                                  ? `${fmtDate(inst.expiry)}・${expiryDays < 0 ? `過期 ${-expiryDays} 天` : `剩 ${expiryDays} 天`}`
                                  : '—'}
                              </dd>
                            </div>
                            {pao ? (
                              <div>
                                <dt className="font-semibold text-retro-text/40">開封後期限</dt>
                                <dd className={`font-bold mt-0.5 ${pao.isExpired ? 'text-retro-danger' : 'text-retro-text'}`}>
                                  {fmtDate(pao.expiryDate)}・{pao.isExpired ? `過期 ${pao.daysOverdue} 天` : `剩 ${pao.daysLeft} 天`}
                                </dd>
                              </div>
                            ) : inst.openedDate && inst.usage !== '未開封' ? (
                              <div>
                                <dt className="font-semibold text-retro-text/40">開封日</dt>
                                <dd className="font-bold mt-0.5 text-retro-text">{fmtDate(inst.openedDate)}</dd>
                              </div>
                            ) : null}
                            {purchase && (
                              <div className="col-span-2">
                                <dt className="font-semibold text-retro-text/40">購買</dt>
                                <dd className="font-bold mt-0.5 text-retro-text/80">{purchase}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      );
                    })}
                  </>
                ) : records.length === 0 ? (
                  <p className="py-12 text-center text-sm font-semibold text-retro-text/40">還沒有購買或使用紀錄</p>
                ) : (
                  records.map(inst => {
                    const duration = inst.openedDate ? formatDuration(inst.openedDate, inst.finishedDate) : '';
                    return (
                      <div key={inst.id} className="p-3 bg-white rounded-2xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full font-bold ${usageChipClass(inst.usage)}`}>{inst.usage}</span>
                          {inst.capacity && <span className="font-bold text-retro-text/55">{inst.capacity}</span>}
                          {inst.price !== undefined && <span className="ml-auto text-sm font-bold text-retro-secondary">${inst.price}</span>}
                        </div>
                        {(inst.purchaseDate || inst.purchasePlace) && (
                          <p className="font-semibold text-retro-text/60">
                            購買　{[inst.purchaseDate ? fmtDate(inst.purchaseDate) : '', inst.purchasePlace || ''].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {inst.openedDate && (
                          <p className="font-semibold text-retro-text/60">
                            使用　{fmtDate(inst.openedDate)} → {inst.finishedDate ? fmtDate(inst.finishedDate) : '至今'}{duration ? `（${duration}）` : ''}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {!isArchivedProduct && (
                <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-retro-text/5">
                  <button
                    onClick={() => handleAddAnotherInstanceTrigger(product)}
                    className="w-full h-12 bg-retro-secondary text-retro-card rounded-xl text-sm font-bold shadow-sm hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    再加一瓶
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ==================== 9. Confirmation Dialog ==================== */}
      {confirmDialog && (
        <div
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-5 space-y-3 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h3 id="confirm-title" className="font-bold text-base text-retro-text">{confirmDialog.title}</h3>
            <p className="text-sm text-retro-text/60 leading-relaxed whitespace-pre-line">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 h-11 bg-retro-bg/70 hover:bg-retro-bg text-retro-text/70 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`flex-1 h-11 text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:brightness-105 cursor-pointer ${confirmDialog.danger ? 'bg-retro-danger' : 'bg-retro-primary'}`}
              >
                {confirmDialog.confirmLabel || '確定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Image Cropper Modal ==================== */}
      {cropImageSrc && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center animate-fade-in p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={onCropComplete}
              className="max-h-[60vh] max-w-full"
            >
              <img
                src={cropImageSrc}
                onLoad={onImageLoad}
                className="max-h-[60vh] object-contain"
                alt="裁切照片"
              />
            </ReactCrop>
          </div>
          <div className="pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] w-full max-w-md flex gap-3">
            <button
              onClick={handleCropCancel}
              className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleCropConfirm}
              className="flex-1 h-12 bg-retro-primary hover:brightness-105 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
            >
              使用照片
            </button>
          </div>
        </div>
      )}

      {/* ==================== 10. Fullscreen Image Modal ==================== */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <CachedImage
            src={fullscreenImage}
            userId={user.uid}
            alt="產品照片"
            className="w-full h-full flex items-center justify-center"
            imageClassName="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-slide-up"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
          <button
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 sm:right-8 w-11 h-11 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            onClick={() => setFullscreenImage(null)}
            aria-label="關閉照片"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

// Compact product card: tap to open the product page
function ProductCard({
  userId,
  onPreviewReady,
  product,
  onViewDetail,
  onImageClick,
  categoryIcon,
  onRestore,
  onDelete
}: {
  userId: string;
  onPreviewReady?: (productId: string, preview: string) => void;
  product: Product;
  onViewDetail?: (prod: Product) => void;
  onImageClick?: (url: string) => void;
  categoryIcon: string;
  onRestore?: (prod: Product) => void;
  onDelete?: (prod: Product) => void;
  key?: React.Key;
}) {
  const instances = product.instances || [];
  const isArchived = product.status === 'archived';
  const liveInstances = instances.filter(inst => isActiveUsage(inst.usage));

  // Nearest deadline (printed expiry or PAO limit) for the circle badge
  let minDaysToExpiry = 9999;
  let closestExpiryDate = '';
  let closestOpenedDate = '';
  let maxDaysSinceOpened = -1;

  liveInstances.forEach(inst => {
    const deadline = getInstanceDeadline(inst);
    if (deadline.days < minDaysToExpiry) {
      minDaysToExpiry = deadline.days;
      closestExpiryDate = deadline.date;
    }

    if (inst.usage === '使用中' && inst.openedDate) {
      const opened = new Date(inst.openedDate);
      const today = new Date();
      if (!isNaN(opened.getTime())) {
        today.setHours(0,0,0,0);
        opened.setHours(0,0,0,0);
        const diff = Math.floor((today.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > maxDaysSinceOpened) {
          maxDaysSinceOpened = diff;
          closestOpenedDate = inst.openedDate;
        }
      }
    }
  });

  const hasAnyExpiry = minDaysToExpiry !== 9999;
  const showOpenedDateFallback = !hasAnyExpiry && closestOpenedDate !== '';
  const isUrgent = minDaysToExpiry <= 60 && hasAnyExpiry;
  const unopenedQty = instances.filter(inst => inst.usage === '未開封').reduce((sum, inst) => sum + inst.qty, 0);
  const inUseQty = instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0);
  const archivedItem = isArchived ? instances[0] : undefined;
  const archivedLabel = archivedItem && !isActiveUsage(archivedItem.usage) ? archivedItem.usage : '已封存';
  const archivedDate = (archivedItem?.finishedDate || product.archivedAt?.split('T')[0] || '').replace(/-/g, '/');
  const canOpen = !isArchived && Boolean(onViewDetail);

  return (
    <div
      onClick={() => { if (canOpen) onViewDetail!(product); }}
      onKeyDown={(e) => {
        if (canOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onViewDetail!(product);
        }
      }}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      className={`py-3 pr-3 pl-2 rounded-2xl flex items-center gap-2.5 bg-white border border-transparent shadow-sm transition-all duration-200 group ${canOpen ? 'cursor-pointer hover:border-retro-primary/30 active:scale-[0.99]' : ''}`}
    >
      {/* Thumb */}
      <div className={`w-12 h-14 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center ${isArchived ? 'opacity-70 grayscale' : ''}`}>
        {product.photo ? (
          <CachedImage
            src={product.photo}
            userId={userId}
            onPreviewReady={(preview: string) => onPreviewReady?.(product.id, preview)}
            thumbnail={product.photoThumbnail}
            alt={product.name}
            onClick={(e: React.MouseEvent) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(product.photo!);
              }
            }}
            className="w-full h-full flex items-center justify-center"
            imageClassName="max-w-full max-h-full rounded-lg object-contain border border-retro-text/10 shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary">
            <CategoryIcon name={categoryIcon} className="w-6 h-6 opacity-40" />
          </div>
        )}
      </div>

      {/* Titles */}
      <div className="flex flex-col justify-start min-w-0 flex-1">
        <span className="text-[10px] font-bold text-retro-secondary tracking-wider uppercase truncate flex items-center gap-1.5">
          {!isArchived && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inUseQty > 0 ? 'bg-green-500' : 'bg-stone-300'}`}></span>
          )}
          {product.brand}
        </span>
        <span className="text-sm font-bold font-display text-retro-text leading-snug truncate mt-0.5">
          {product.name}
        </span>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {!isArchived ? (
            <span className="text-[11px] font-semibold text-retro-text/60 bg-stone-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="flex items-center gap-1" title="未開封">
                <Package className="w-3 h-3 text-retro-primary" />
                {unopenedQty}
              </span>
              {inUseQty > 0 && (
                <>
                  <span className="w-px h-2.5 bg-stone-300"></span>
                  <span className="flex items-center gap-1" title="使用中">
                    <PackageOpen className="w-3 h-3 text-emerald-500" />
                    {inUseQty}
                  </span>
                </>
              )}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-retro-text/50">
              {archivedLabel}{archivedDate ? ` · ${archivedDate}` : ''}
            </span>
          )}
        </div>
      </div>

      {!isArchived ? (
        /* Right Circle Expiry Indicator */
        <div className="flex flex-col items-center justify-center text-center min-w-[4.25rem] flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-stone-50 border border-retro-text/5 flex flex-col items-center justify-center">
            {showOpenedDateFallback ? (
              <>
                <span className="text-sm font-bold leading-none text-retro-primary">
                  {maxDaysSinceOpened}
                </span>
                <span className="text-[8px] text-retro-text/50 font-bold mt-0.5">天已開</span>
              </>
            ) : (
              <>
                <span className={`text-sm font-bold leading-none ${isUrgent ? 'text-retro-danger font-extrabold' : 'text-retro-primary'}`}>
                  {hasAnyExpiry ? minDaysToExpiry : '-'}
                </span>
                <span className="text-[8px] text-retro-text/50 font-bold mt-0.5">天到期</span>
              </>
            )}
          </div>
          {hasAnyExpiry && closestExpiryDate && (
            <span className="text-[9px] font-bold text-retro-text/40 mt-1 whitespace-nowrap">
              {closestExpiryDate.replace(/-/g, '/')}
            </span>
          )}
          {showOpenedDateFallback && closestOpenedDate && (
            <span className="text-[9px] font-bold text-retro-text/40 mt-1 whitespace-nowrap">
              {closestOpenedDate.replace(/-/g, '/')} 開封
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {onRestore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore(product);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-retro-primary hover:bg-retro-primary/10 transition-colors cursor-pointer"
              aria-label={`還原「${product.name}」`}
              title="還原"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-retro-text/30 hover:text-retro-danger hover:bg-retro-danger/10 transition-colors cursor-pointer"
              aria-label={`永久刪除「${product.name}」`}
              title="永久刪除"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const previousUserId = previousUserIdRef.current;
      if (previousUserId && previousUserId !== currentUser?.uid) {
        await clearPrivateUserCache(previousUserId);
      }
      previousUserIdRef.current = currentUser?.uid || null;
      setUser(currentUser);
      setLoading(false);
      performance.mark('auth-state-ready');
      performance.measure('auth-state', 'app-start', 'auth-state-ready');
      console.info('[startup] Auth state ready', performance.getEntriesByName('auth-state').at(-1)?.duration);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-retro-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-retro-primary animate-pulse" />
          <span className="text-retro-text font-bold text-sm tracking-wider uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-retro-text/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-retro-primary/10 rounded-2xl flex items-center justify-center text-retro-primary mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-display text-retro-text mb-2 flex items-center justify-center gap-2">
            <span>用品管理系統</span>
            <span className="text-[11px] font-bold text-retro-primary bg-retro-primary/10 px-2 py-0.5 rounded-lg tracking-normal uppercase font-sans border border-retro-primary/20">{APP_VERSION}</span>
          </h1>
          <p className="text-retro-text/60 text-sm mb-8">
            精緻復古底片風格的化妝品與保養品庫存管理系統，請登入以存取專屬您的帳號資料。
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-retro-text text-white py-4 rounded-xl font-bold hover:bg-retro-text/90 transition-all shadow-md active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 bg-white rounded-full p-0.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    );
  }

  return <MainApp key={user.uid} user={user} />;
}
