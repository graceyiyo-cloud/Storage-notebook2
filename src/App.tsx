import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, deleteField, updateDoc, query } from 'firebase/firestore';
import { auth, db, storage, signInWithGoogle, logOut } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { 
  Sparkles, 
  Droplets, 
  Pill, 
  Settings, 
  Camera, 
  Plus, 
  Search, 
  Package, 
  Droplet, 
  Edit3, 
  Archive, 
  Trash2, 
  GripVertical, 
  ListTree, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  X, 
  Info, 
  Calendar,
  Heart,
  Star,
  ShoppingBag,
  ShoppingCart,
  ChevronRight,
  History,
  Type,
  ImageIcon,
  LucideIcon
} from 'lucide-react';
import { Category, Product, ProductInstance } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './data';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  calculateDaysToExpiry, 
  calculatePaoExpiry, 
  checkAllOpenedExpiredProducts 
} from './utils';

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

  return canvas.toDataURL('image/jpeg', 0.8);
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

function MainApp({ user }: { user: User }) {
  // --- Core State ---
  const [categories, setCategories] = useState<Category[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load user data from Firestore on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        let loadedCategories = INITIAL_CATEGORIES;
        
        let rootProducts: Product[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories) {
            loadedCategories = data.categories;
            setCategories(data.categories);
          } else {
            setCategories(INITIAL_CATEGORIES);
          }
          
          // Legacy migration check: if products exist in the root doc, save them for merging
          if (data.products && data.products.length > 0) {
            rootProducts = data.products;
          }
        } else {
          setCategories(INITIAL_CATEGORIES);
        }
        
        // Load products from subcollection
        const productsRef = collection(db, 'users', user.uid, 'products');
        const q = query(productsRef);
        const querySnapshot = await getDocs(q);
        
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
          
          setProducts(Array.from(mergedMap.values()));
        } else if (!docSnap.exists()) {
          // If no user doc exists and no products exist, initialize with defaults
          setProducts(INITIAL_PRODUCTS);
        }

      } catch (err) {
        console.error('Error loading data', err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadUserData();
  }, [user.uid]);

  // Save to Firestore whenever data changes (debounce or just save directly since it's simple)
  useEffect(() => {
    if (!isDataLoaded) return;
    const saveUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        // Save categories to root doc
        await setDoc(userRef, {
          categories,
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

      } catch (err: any) {
        console.error('Error saving data', err);
        setToastMessage(`儲存失敗: ${err.message || String(err)}`);
      }
    };
    saveUserData();
  }, [categories, products, isDataLoaded, user.uid]);

  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    let keys = ['', '', ''];
    try {
      const stored = localStorage.getItem(`cosmetics_gemini_api_keys_${user.uid}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
           keys = [...parsed, '', '', ''].slice(0, 3);
        }
      } else {
        const oldKey = localStorage.getItem('cosmetics_gemini_api_key');
        if (oldKey) {
           keys[0] = oldKey;
        }
      }
    } catch(e) {}
    return keys;
  });
  
  const apiKeyIndexRef = useRef(0);
  const getGeminiApiKey = () => {
    const validKeys = apiKeys.filter(k => k.trim().length > 0);
    if (validKeys.length === 0) return null;
    const key = validKeys[apiKeyIndexRef.current % validKeys.length];
    apiKeyIndexRef.current += 1;
    return key;
  };

  const [appTheme, setAppTheme] = useState<'retro' | 'pixel' | 'minimal'>(() => {
    return (localStorage.getItem('cosmetics_theme') as 'retro' | 'pixel' | 'minimal') || 'retro';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (appTheme === 'pixel') {
      root.setAttribute('data-theme', 'pixel');
    } else if (appTheme === 'minimal') {
      root.setAttribute('data-theme', 'minimal');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [appTheme]);

  const handleThemeChange = (theme: 'retro' | 'pixel' | 'minimal') => {
    setAppTheme(theme);
    localStorage.setItem('cosmetics_theme', theme);
  };

  const [appFontSize, setAppFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('cosmetics_font_size') as 'small' | 'medium' | 'large') || 'small';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (appFontSize === 'small') {
      root.style.fontSize = '16px';
    } else if (appFontSize === 'medium') {
      root.style.fontSize = '18px';
    } else if (appFontSize === 'large') {
      root.style.fontSize = '20px';
    }
  }, [appFontSize]);

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setAppFontSize(size);
    localStorage.setItem('cosmetics_font_size', size);
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return categories[0]?.id || 'makeup';
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set(['prod_1']));

  // --- Gemini API Loading States ---
  const [diagnosticLog, setDiagnosticLog] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [aiStatusText, setAiStatusText] = useState('正在處理圖片...');

  // --- Form Input States ---
  const [formBrand, setFormBrand] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('makeup');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formCapacity, setFormCapacity] = useState('');
  const [formCapacityUnit, setFormCapacityUnit] = useState('ml');
  const [formUsage, setFormUsage] = useState<'使用中' | '未開封' | '已用完' | '已丟棄'>('未開封');
  const [formThreshold, setFormThreshold] = useState<number | string>(0);
  const [formExpiry, setFormExpiry] = useState('');
  const [formPaoMonths, setFormPaoMonths] = useState<string>(''); // PAO 可使用月數
  const [formOpenedDate, setFormOpenedDate] = useState(''); // 開封日期
  const [formFinishedDate, setFormFinishedDate] = useState(''); // 用完或丟棄的日期
  const [formPhoto, setFormPhoto] = useState<string>(''); // Base64 string
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formPurchasePlace, setFormPurchasePlace] = useState('');
  const [formPrice, setFormPrice] = useState('');

  // Product Master Detail View State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'status' | 'purchase' | 'usage'>('status');

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Fullscreen Image Modal State
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Cropper States
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCroppingFormPhoto, setIsCroppingFormPhoto] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  // Editing state
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [isAddingInstanceToExisting, setIsAddingInstanceToExisting] = useState(false);

  // --- Setting View States ---
  const [settingsView, setSettingsView] = useState<'menu' | 'apikey' | 'category' | 'history'>('menu');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('sparkles');
  const [activeCategoryForSub, setActiveCategoryForSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [editingSubCatId, setEditingSubCatId] = useState<string | null>(null);
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [apiKeyInputs, setApiKeyInputs] = useState<string[]>(apiKeys);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = () => {
    localStorage.setItem(`cosmetics_gemini_api_keys_${user.uid}`, JSON.stringify(apiKeyInputs));
    setApiKeys(apiKeyInputs);
    showToast('Gemini API 金鑰儲存成功！');
  };

  // --- Notification Center States ---
  const [expiredPaoItems, setExpiredPaoItems] = useState<any[]>([]);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);

  // --- Drag & Drop Reordering States ---
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedSubIdx, setDraggedSubIdx] = useState<number | null>(null);
  const [draggedSubCatId, setDraggedSubCatId] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const formPhotoInputRef = useRef<HTMLInputElement>(null);

  
  
  // --- Hardware Back Button Handling ---
  const expectedHash = confirmDialog ? '#confirm' 
    : cropImageSrc ? '#crop' 
    : fullscreenImage ? '#image' 
    : showAddForm ? '#add'
    : selectedDetailProduct ? '#detail'
    : (currentTab === 'settings' && settingsView === 'category') ? '#settings-category'
    : (currentTab === 'settings' && settingsView === 'history') ? '#settings-history'
    : (currentTab === 'settings' && settingsView === 'apikey') ? '#settings-apikey'
    : '';

  const getHashDepth = (hash: string) => {
    if (hash === '#confirm') return 5;
    if (hash === '#crop' || hash === '#image') return 4;
    if (hash === '#add' || hash === '#detail') return 3;
    if (hash.startsWith('#settings-')) return 2;
    return 1;
  };

  useEffect(() => {
    const syncUrlToState = () => {
      const currentHash = window.location.hash;
      if (currentHash !== expectedHash) {
        const expectedDepth = getHashDepth(expectedHash);
        const currentDepth = getHashDepth(currentHash);
        
        if (expectedDepth > currentDepth) {
          window.history.pushState(null, '', expectedHash);
        } else if (expectedDepth < currentDepth) {
          // Unwind the stack until it matches
          window.history.back();
        } else {
          window.history.replaceState(null, '', expectedHash);
        }
      }
    };
    
    // Run initially and whenever expectedHash changes
    syncUrlToState();
    
    // Also run when hash changes (e.g. from a back() call unwinding the stack)
    window.addEventListener('hashchange', syncUrlToState);
    return () => window.removeEventListener('hashchange', syncUrlToState);
  }, [expectedHash]);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      
      if (hash === '' || hash === '#') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'menu') setSettingsView('menu');
      } else if (hash === '#settings-category') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'category') setSettingsView('category');
      } else if (hash === '#settings-history') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'history') setSettingsView('history');
      } else if (hash === '#settings-apikey') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'apikey') setSettingsView('apikey');
      } else if (hash === '#add') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setSelectedDetailProduct(null);
      } else if (hash === '#detail') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [settingsView]);

  // --- Side Effects & Persistence ---
  useEffect(() => {
    // Re-evaluate expired PAO products whenever products change
    const expired = checkAllOpenedExpiredProducts(products);
    setExpiredPaoItems(expired);
  }, [products]);

  useEffect(() => {
    // Initial scan for expired items
    const expired = checkAllOpenedExpiredProducts(products);
    setExpiredPaoItems(expired);
  }, []);

  // Sync tab with updated categories if current tab's category was deleted
  useEffect(() => {
    if (!isDataLoaded) return;
    if (currentTab !== 'settings' && currentTab !== 'history' && !categories.some(c => c.id === currentTab)) {
      if (categories.length > 0) {
        setCurrentTab(categories[0].id);
      } else {
        setCurrentTab('settings');
      }
    }
  }, [categories, currentTab, isDataLoaded]);

  // Handle Usage status switch - auto fill open date if usage is '使用中' and it is blank
  useEffect(() => {
    if (formUsage === '使用中' && !formOpenedDate) {
      setFormOpenedDate(new Date().toISOString().split('T')[0]);
    }
    if ((formUsage === '已用完' || formUsage === '已丟棄') && !formFinishedDate) {
      setFormFinishedDate(new Date().toISOString().split('T')[0]);
    }
  }, [formUsage]);

  // --- Toast Manager ---
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- File uploads & Photo Handling ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isFormPhoto: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCropImageSrc(result);
        setIsCroppingFormPhoto(isFormPhoto);
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
        
        // Compress as JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        if (isCroppingFormPhoto) {
          // Upload to Firebase Storage
          const uploadToStorage = async () => {
            if (!user) {
              setToastMessage('請先登入');
              return;
            }
            setIsAnalyzing(true);
            setToastMessage('上傳圖片中...');
            try {
              const storageRef = ref(storage, `users/${user.uid}/products/${Date.now()}.jpg`);
              await uploadString(storageRef, compressedBase64, 'data_url');
              const downloadURL = await getDownloadURL(storageRef);
              setFormPhoto(downloadURL);
              setToastMessage('圖片上傳成功');
            } catch (error: any) {
              console.error('Upload error:', error);
              setToastMessage(`圖片上傳失敗: ${error.message}`);
            } finally {
              setIsAnalyzing(false);
            }
          };
          uploadToStorage();
        } else {
          // Camera scan trigger
          triggerAiScan(compressedBase64, 'image/jpeg');
        }
      };
      img.src = croppedBase64;
    } catch (e) {
      console.error(e);
      showToast('圖片裁切失敗');
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
  };

  // --- API Call: Gemini Web Search & Image Recognition ---
  const triggerAiScan = async (base64Data: string, mimeType: string) => {
    const activeApiKey = getGeminiApiKey();
    if (!activeApiKey) {
      showToast('尚未設定 API Key，請在設定頁面輸入金鑰！');
      return;
    }

    setIsAnalyzing(true);
    setAiStatusText('正在上傳並解析圖片...');

    // Build category options string
    const categoryOptions = categories.map(c => 
      `- ${c.name} (id: ${c.id}), 子分類: ${c.subcategories.join(', ')}`
    ).join('\n');

    try {
      const base64String = base64Data.split(',')[1];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeApiKey}`;
      
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: `分析此化妝品/保養品/商品圖片，辨識出品牌名稱（brand）與產品全名（name），並判斷最合適的主類別（category）與子分類（subcategory）。
如果商品名稱不是中文（如日文、英文、韓文等），請將產品全名（name）翻譯成繁體中文。

請從以下現有分類中，挑選出最適合此產品的主類別 id 與子分類名稱：
${categoryOptions}

回傳嚴格的 JSON 格式，包含四個 key: 
'brand' (字串)
'name' (字串)
'category' (字串，主分類 id)
'subcategory' (字串，子分類名稱)

只回傳純 JSON 內容即可，不要包裝 markdown 三個反引號。` },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64String } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const data = JSON.parse(text.trim());
        setFormBrand(data.brand || '');
        setFormName(data.name || '');
        
        // Find if detected category matches our options
        const matchCat = categories.find(c => c.id === data.category || c.name.includes(data.category));
        if (matchCat) {
          setFormCategory(matchCat.id);
        } else {
          setFormCategory(categories[0]?.id || 'makeup');
        }

        if (data.subcategory) {
          setFormSubcategory(data.subcategory);
        }

        setFormPhoto(base64Data);
        setEditingInstanceId(null);
        setEditingProductId(null);
        
        // Reset secondary form items
        setFormQty(1);
        setFormCapacity('');
        setFormCapacityUnit('ml');
        setFormUsage('未開封');
        setFormThreshold(0);
        setFormExpiry('');
        setFormPaoMonths('');
        setFormOpenedDate(new Date().toISOString().split('T')[0]);
        setFormFinishedDate('');

        setShowAddForm(true);
        showToast('AI 影像辨識成功，已將資料填入表單！');
      } else {
        throw new Error('No parsing results returned.');
      }
    } catch (err) {
      console.error(err);
      showToast('AI 辨識失敗，請檢查 API Key 是否正確。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiWebSearch = async (e: React.MouseEvent) => {
    e.preventDefault();
    const keyword = `${formBrand} ${formName}`.trim();
    if (keyword.length < 2) {
      showToast('請至少輸入品牌或產品名稱再進行搜尋！');
      return;
    }

    const activeApiKey = getGeminiApiKey();
    if (!activeApiKey) {
      showToast('尚未設定 API 金鑰！請至設定頁面設定您的 Gemini API Key。');
      return;
    }

    setIsSearchingAi(true);

    // Build category options string
    const categoryOptions = categories.map(c => 
      `- ${c.name} (id: ${c.id}), 子分類: ${c.subcategories.join(', ')}`
    ).join('\n');

    // Try with Google Search tool first
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeApiKey}`;
      const payload = {
        contents: [{
          parts: [{
            text: `你是一個專業的化妝品與保養品資料庫助理。
請針對使用者輸入的產品關鍵字 "${keyword}" 進行 Google 網路搜尋，尋找其對應的「官方中文/英文品牌名稱」與「官方完整產品全名」（例如：輸入「怪獸唇膏」應帶出品牌「KATE」、產品名「凱婷怪獸級持色唇膏」）。

並請從以下現有分類中，挑選出最適合此產品的分類：
${categoryOptions}

請將網路搜尋得到的確切資訊，以下列嚴格的 JSON 格式回傳：
{
  "brand": "官方品牌中文或英文名稱 (例如 KATE、Dior、雅詩蘭黛、凱婷)",
  "name": "官方完整產品名稱 (例如 凱婷怪獸級持色唇膏、迪奧精萃再生玫瑰微導粉底)",
  "category": "選出的主分類 id (例如 makeup)",
  "subcategory": "選出的子分類名稱 (例如 唇膏)"
}

請務必使用 Google 搜尋工具。
不要回傳任何額外的 Markdown 標籤、註解或說明文字。只回傳 JSON 格式字串。`
          }]
        }],
        tools: [{ googleSearch: {} }],
        generationConfig: { 
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Google Search query failed: ${response.status}`);
      }

      const result = await response.json();
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
        }
        const data = JSON.parse(cleaned);
        if (data.brand) setFormBrand(data.brand);
        if (data.name) setFormName(data.name);
        if (data.category && categories.find(c => c.id === data.category)) {
          setFormCategory(data.category);
        }
        if (data.subcategory) {
          setFormSubcategory(data.subcategory);
        }
        showToast('品名網搜補全完成！');
        return;
      }
    } catch (err) {
      console.warn('Google Search tool failed, trying fallback model generation...', err);
    }

    // Fallback: Try WITHOUT Google Search tool, using pre-trained knowledge
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeApiKey}`;
      const payload = {
        contents: [{
          parts: [{
            text: `你是一個專業的化妝品與保養品資料庫助理。
請針對產品關鍵字 "${keyword}"，根據你的知識庫，查出其對應的「官方中文/英文品牌名稱」與「官方完整產品全名」（例如：輸入「怪獸唇膏」應帶出品牌「KATE」、產品名「凱婷怪獸級持色唇膏」）。

並請從以下現有分類中，挑選出最適合此產品的分類：
${categoryOptions}

請將正確的資訊，以下列嚴格的 JSON 格式回傳：
{
  "brand": "官方品牌中文或英文名稱 (例如 KATE、Dior、雅詩蘭黛、凱婷)",
  "name": "官方完整產品名稱 (例如 凱婷怪獸級持色唇膏、迪奧精萃再生玫瑰微導粉底)",
  "category": "選出的主分類 id (例如 makeup)",
  "subcategory": "選出的子分類名稱 (例如 唇膏)"
}

不要回傳任何額外的 Markdown 標籤、註解或說明文字。只回傳 JSON 格式字串。`
          }]
        }],
        generationConfig: { 
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Fallback model query failed: ${response.status}`);
      }

      const result = await response.json();
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
        }
        const data = JSON.parse(cleaned);
        if (data.brand) setFormBrand(data.brand);
        if (data.name) setFormName(data.name);
        if (data.category && categories.find(c => c.id === data.category)) {
          setFormCategory(data.category);
        }
        if (data.subcategory) {
          setFormSubcategory(data.subcategory);
        }
        showToast('品名 AI 補全完成！');
      } else {
        showToast('未搜尋到更完整的產品資訊。');
      }
    } catch (err) {
      console.error('All search/generation attempts failed:', err);
      showToast('網搜補全失敗，請改為手動輸入。');
    } finally {
      setIsSearchingAi(false);
    }
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
      `確定要刪除「${cat.name}」分類嗎？\n(注意：該分類下的所有商品在主畫面中將暫時無法顯示)`,
      () => {
        setCategories(categories.filter(c => c.id !== catId));
        showToast(`已刪除大分類「${cat.name}」`);
      }
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
      `確定要刪除「${cat.name}」底下的小分類「${subName}」嗎？`,
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
        showToast(`已成功移除小分類「${subName}」`);
      }
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
  const toggleExpandProduct = (prodId: string) => {
    const next = new Set(expandedProductIds);
    if (next.has(prodId)) {
      next.delete(prodId);
    } else {
      next.add(prodId);
    }
    setExpandedProductIds(next);
  };

  const clearForm = () => {
    setFormBrand('');
    setFormName('');
    setFormCategory(currentTab !== 'settings' && currentTab !== 'history' ? currentTab : categories[0]?.id || 'makeup');
    setFormSubcategory('');
    setFormQty(1);
    setFormCapacity('');
    setFormCapacityUnit('ml');
    setFormUsage('未開封');
    setFormThreshold(0);
    setFormExpiry('');
    setFormPaoMonths('');
    setFormOpenedDate(new Date().toISOString().split('T')[0]);
    setFormFinishedDate('');
    setFormPhoto('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormPurchasePlace('');
    setFormPrice('');
    setEditingInstanceId(null);
    setEditingProductId(null);
    setIsEditingMaster(false);
    setIsAddingInstanceToExisting(false);
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

  const handleFormSave = (e: React.FormEvent, forceAsNewInstance = false) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('請輸入產品名稱！');
      return;
    }
    
    if (formQty < 1) {
      showToast('數量必須大於0！');
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

    // A. Edit Master Product Info ONLY (Requirement: Button 3 - editing master info of the product group)
    if (isEditingMaster && editingProductId) {
      const updatedProducts = products.map(prod => {
        if (prod.id === editingProductId) {
          return {
            ...prod,
            category: formCategory,
            subcategory: subcatValue,
            brand: formBrand.trim(),
            name: formName.trim(),
            photo: formPhoto || prod.photo,
            threshold: Number(formThreshold) || 0
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
      showToast('產品大品項資料修改成功！');
      setShowAddForm(false);
      clearForm();
      return;
    }

    // B. Edit Existing Product Instance
    if (editingInstanceId && editingProductId && !forceAsNewInstance) {
      const updatedProducts = products.map(prod => {
        if (prod.id === editingProductId) {
          // If the meta parameters (category, brand, subcategory, name) changed, 
          // we might want to migrate or update them.
          const isMetaChanged = 
            prod.category !== formCategory || 
            prod.subcategory !== subcatValue || 
            prod.brand !== formBrand.trim() || 
            prod.name !== formName.trim();

          if (isMetaChanged) {
            // Remove instance from this product
            const filteredInstances = prod.instances.filter(inst => inst.id !== editingInstanceId);
            return { ...prod, instances: filteredInstances };
          } else {
            // In-place update of instance
            const updatedInstances = prod.instances.flatMap(inst => {
              if (inst.id === editingInstanceId) {
                return Array.from({ length: formQty }).map((_, idx) => ({
                  ...inst,
                  id: idx === 0 ? inst.id : `inst_${Date.now()}_${idx}`,
                  qty: 1,
                  capacity: finalCapacity,
                  usage: formUsage,
                  expiry: formExpiry,
                  paoMonths: paoVal,
                  openedDate: openedVal,
                  finishedDate: finishedVal,
                  purchaseDate: purchaseDateVal,
                  purchasePlace: purchasePlaceVal,
                  price: priceVal
                }));
              }
              return [inst];
            });
            return {
              ...prod,
              photo: formPhoto || prod.photo,
              instances: updatedInstances
            };
          }
        }
        return prod;
      }).filter(p => p.instances.length > 0); // Remove products with 0 instances

      // If meta parameters changed, we insert this instance as new item or group under another matching product
      const isMetaChangedInForm = products.find(p => p.id === editingProductId)?.category !== formCategory ||
                                  products.find(p => p.id === editingProductId)?.subcategory !== subcatValue ||
                                  products.find(p => p.id === editingProductId)?.brand !== formBrand.trim() ||
                                  products.find(p => p.id === editingProductId)?.name !== formName.trim();

      let targetProdId = editingProductId;

      if (isMetaChangedInForm) {
        // Find if there's an existing matching product group to merge into
        const matchProd = updatedProducts.find(p => 
          p.category === formCategory && 
          p.subcategory === subcatValue && 
          p.brand === formBrand.trim() && 
          p.name === formName.trim() && 
          p.status === 'active'
        );

        const newInstances: ProductInstance[] = Array.from({ length: formQty }).map((_, idx) => ({
          id: idx === 0 ? editingInstanceId : `inst_${Date.now()}_${idx}`,
          qty: 1,
          capacity: finalCapacity,
          usage: formUsage,
          expiry: formExpiry,
          paoMonths: paoVal,
          openedDate: openedVal,
          finishedDate: finishedVal,
          purchaseDate: purchaseDateVal,
          purchasePlace: purchasePlaceVal,
          price: priceVal
        }));

        if (matchProd) {
          const matchIndex = updatedProducts.findIndex(p => p.id === matchProd.id);
          updatedProducts[matchIndex] = {
            ...matchProd,
            instances: [...matchProd.instances, ...newInstances],
            photo: formPhoto || matchProd.photo
          };
          targetProdId = matchProd.id;
        } else {
          const newProduct: Product = {
            id: `prod_${Date.now()}`,
            category: formCategory,
            subcategory: subcatValue,
            brand: formBrand.trim(),
            name: formName.trim(),
            photo: formPhoto || undefined,
            status: 'active',
            threshold: Number(formThreshold) || 0,
            instances: newInstances
          };
          updatedProducts.push(newProduct);
          targetProdId = newProduct.id;
        }
      }

      setProducts(updatedProducts);
      const targetProd = updatedProducts.find(p => p.id === targetProdId);
      if (targetProd) setSelectedDetailProduct(targetProd);
      showToast('明細修改成功！');
    } else {
      // C. Create New Product Group or Add Instance to Existing
      const newInstances: ProductInstance[] = Array.from({ length: formQty }).map((_, idx) => ({
        id: `inst_${Date.now()}_${idx}`,
        qty: 1,
        capacity: finalCapacity,
        usage: formUsage,
        expiry: formExpiry,
        paoMonths: paoVal,
        openedDate: openedVal,
        finishedDate: finishedVal,
        purchaseDate: purchaseDateVal,
        purchasePlace: purchasePlaceVal,
        price: priceVal
      }));

      let existingProductIndex = -1;
      if ((isAddingInstanceToExisting || forceAsNewInstance) && editingProductId) {
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
        }
        setProducts(updated);
        // Expand this product to show the new instance
        setExpandedProductIds(prev => {
          const next = new Set(prev);
          next.add(updated[existingProductIndex].id);
          return next;
        });
        setSelectedDetailProduct(updated[existingProductIndex]);
      } else {
        // Create full new product
        const newProd: Product = {
          id: `prod_${Date.now()}`,
          category: formCategory,
          subcategory: subcatValue,
          brand: formBrand.trim(),
          name: formName.trim(),
          photo: formPhoto || undefined,
          status: 'active',
          threshold: Number(formThreshold) || 0,
          instances: newInstances
        };
        setProducts([...products, newProd]);
        setExpandedProductIds(prev => {
          const next = new Set(prev);
          next.add(newProd.id);
          return next;
        });
        setSelectedDetailProduct(newProd);
      }
      showToast(`已成功新增產品：${formName.trim()}`);
    }

    setShowAddForm(false);
    clearForm();
    setCurrentTab(formCategory); // Redirect to corresponding category tab
  };

  const handleEditInstanceTrigger = (prod: Product, inst: ProductInstance) => {
    setEditingProductId(prod.id);
    setEditingInstanceId(inst.id);
    setIsEditingMaster(false);
    setIsAddingInstanceToExisting(false);

    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormQty(inst.qty);
    
    // Parse capacity and unit
    let cap = inst.capacity || '';
    let unit = 'ml';
    if (cap.endsWith('ml')) { unit = 'ml'; cap = cap.slice(0, -2); }
    else if (cap.endsWith('g')) { unit = 'g'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('個')) { unit = '個'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('罐')) { unit = '罐'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('錠')) { unit = '錠'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('顆')) { unit = '顆'; cap = cap.slice(0, -1); }
    setFormCapacity(cap.trim());
    setFormCapacityUnit(unit);

    setFormUsage(inst.usage);
    setFormThreshold(prod.threshold ? String(prod.threshold) : '');
    setFormExpiry(inst.expiry);
    setFormPaoMonths(inst.paoMonths ? String(inst.paoMonths) : '');
    setFormOpenedDate(inst.openedDate || '');
    setFormFinishedDate(inst.finishedDate || '');
    setFormPhoto(prod.photo || '');
    setFormPurchaseDate(inst.purchaseDate || '');
    setFormPurchasePlace(inst.purchasePlace || '');
    setFormPrice(inst.price !== undefined ? String(inst.price) : '');

    setShowAddForm(true);
    // Smooth scroll to form
    setTimeout(() => {
      document.getElementById('manual-add-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditProductMasterTrigger = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditingInstanceId(null); // No specific instance edit, editing master product details!
    setIsEditingMaster(true);
    setIsAddingInstanceToExisting(false);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormPhoto(prod.photo || '');
    // Reset instance specific states to default
    setFormQty(1);
    setFormCapacity('');
    setFormCapacityUnit('ml');
    setFormUsage('未開封');
    setFormThreshold(0);
    setFormExpiry('');
    setFormPaoMonths('');
    setFormOpenedDate(new Date().toISOString().split('T')[0]);
    setFormFinishedDate('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormPurchasePlace('');
    setFormPrice('');

    setShowAddForm(true);
    setSelectedDetailProduct(null); // Close detail screen
    setTimeout(() => {
      document.getElementById('manual-add-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Add same-product as a new instance (Save as new item)
  const handleSaveAsNewInstance = () => {
    // Trigger submit indirectly but tell it to force create new
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleFormSave(fakeEvent, true);
  };

  // Archive a specific product instance (Requirement 4)
  const handleArchiveInstance = (prodId: string, instId: string) => {
    askConfirmation(
      '移至歷史紀錄（封存）',
      '確定要將這個規格明細移到歷史紀錄（封存）嗎？封存後將移至歷史分頁。',
      () => {
        let archivedInstance: ProductInstance | null = null;
        let targetProduct: Product | null = null;

        const nextProducts = products.map(prod => {
          if (prod.id === prodId) {
            targetProduct = prod;
            archivedInstance = prod.instances.find(i => i.id === instId) || null;
            return {
              ...prod,
              instances: prod.instances.filter(i => i.id !== instId)
            };
          }
          return prod;
        }).filter(p => p.instances.length > 0);

        if (archivedInstance && targetProduct) {
          // Create separate archived product group in history
          const newArchivedProd: Product = {
            id: `prod_archived_${Date.now()}`,
            category: (targetProduct as Product).category,
            subcategory: (targetProduct as Product).subcategory,
            brand: (targetProduct as Product).brand,
            name: (targetProduct as Product).name,
            photo: (targetProduct as Product).photo,
            status: 'archived',
            threshold: (targetProduct as Product).threshold,
            instances: [{
              ...(archivedInstance as ProductInstance),
              id: `inst_archived_${Date.now()}`
            }]
          };
          const finalProducts = [...nextProducts, newArchivedProd];
          setProducts(finalProducts);
          showToast('已將該明細歸檔至歷史紀錄！');

          // If the detailed modal is open for this product, sync it or close if empty
          if (selectedDetailProduct && selectedDetailProduct.id === prodId) {
            const updatedDetailedProduct = finalProducts.find(p => p.id === prodId);
            if (updatedDetailedProduct) {
              setSelectedDetailProduct(updatedDetailedProduct);
            } else {
              setSelectedDetailProduct(null);
            }
          }
        }
      }
    );
  };

  // Delete specific product instance
  const handleDeleteInstance = () => {
    if (editingInstanceId && editingProductId) {
      askConfirmation(
        '永久刪除明細',
        '確定要永久刪除此商品明細嗎？此操作無法復原。',
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
          setShowAddForm(false);
          clearForm();
          showToast('明細已成功永久刪除！');

          // If detail modal is open for this product, sync or close
          if (selectedDetailProduct && selectedDetailProduct.id === editingProductId) {
            const updatedDetailedProduct = nextProducts.find(p => p.id === editingProductId);
            if (updatedDetailedProduct) {
              setSelectedDetailProduct(updatedDetailedProduct);
            } else {
              setSelectedDetailProduct(null);
            }
          }
        }
      );
    }
  };

  const handleDeleteInstanceDirect = (prodId: string, instId: string) => {
    askConfirmation(
      '永久刪除明細',
      '確定要永久刪除此規格明細嗎？此操作無法復原。',
      () => {
        const nextProducts = products.map(prod => {
          if (prod.id === prodId) {
            return {
              ...prod,
              instances: prod.instances.filter(i => i.id !== instId)
            };
          }
          return prod;
        }).filter(p => p.instances.length > 0);

        setProducts(nextProducts);
        showToast('規格明細已成功永久刪除！');

        // If detail modal is open, sync or close
        if (selectedDetailProduct && selectedDetailProduct.id === prodId) {
          const updatedDetailedProduct = nextProducts.find(p => p.id === prodId);
          if (updatedDetailedProduct) {
            setSelectedDetailProduct(updatedDetailedProduct);
          } else {
            setSelectedDetailProduct(null);
          }
        }
      }
    );
  };

  // Quick prepopulate form when adding another instance under a product
  const handleAddAnotherInstanceTrigger = (prod: Product) => {
    clearForm();
    setEditingProductId(prod.id); // set this to ensure we know it belongs to an existing product
    setIsAddingInstanceToExisting(true);
    setIsEditingMaster(false);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormUsage('未開封');
    setFormPhoto(prod.photo || '');
    
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById('manual-add-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleRecoverData = async () => {
    try {
      showToast('開始全面掃描資料庫...');
      let log = '';
      let recoveredItems: Product[] = [];
      const addLog = (msg: string) => {
        log += msg + '\n';
        console.log(msg);
      };
      
      addLog(`=== 資料診斷報告 ===`);
      addLog(`User UID: ${user.uid}`);
      
      // 1. Local Storage
      addLog(`[Local Storage 全面掃描]`);
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key) {
             const val = localStorage.getItem(key);
             addLog(`Key: ${key} (長度: ${val?.length})`);
             if (val && val.includes('instances') && val.includes('category')) {
                 try {
                     const parsed = JSON.parse(val);
                     if (Array.isArray(parsed)) {
                         addLog(` -> 解析成功！發現 ${parsed.length} 筆產品資料`);
                         recoveredItems.push(...parsed);
                     }
                 } catch(e) {}
             }
         }
      }
      
      const lsData = localStorage.getItem('cosmetics_products') || localStorage.getItem('products');
      if (lsData) {
         try {
            const parsed = JSON.parse(lsData);
            addLog(`Local Storage 找到 ${parsed.length} 筆資料`);
            recoveredItems.push(...parsed);
         } catch(e) {}
      } else {
         addLog(`Local Storage 沒有資料`);
      }

      // 2. Root Document
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
           const d = userSnap.data();
           addLog(`主檔案存在, 欄位: ${Object.keys(d).join(', ')}`);
           if (d.products && Array.isArray(d.products)) {
              addLog(`主檔案 products 陣列有 ${d.products.length} 筆資料`);
              recoveredItems.push(...d.products);
           }
        }
      } catch (e: any) {
        addLog(`讀取主檔案失敗: ${e.message}`);
      }

      // 3. Subcollection
      try {
        const subRef = collection(db, 'users', user.uid, 'products');
        const subSnap = await getDocs(subRef);
        addLog(`子集合 (products) 有 ${subSnap.size} 筆資料`);
        subSnap.forEach(d => {
           addLog(` - ${d.id}: ${d.data().name} (${d.data().instances?.length || 0} 個明細)`);
           recoveredItems.push(d.data() as Product);
        });
      } catch (e: any) {
        addLog(`讀取子集合失敗: ${e.message}`);
      }

      // Merge recovered
      if (recoveredItems.length > 0) {
         const mergedMap = new Map<string, Product>();
         // Start with current state
         products.forEach(p => mergedMap.set(p.id, p));
         // Add recovered
         recoveredItems.forEach(p => {
            if (!mergedMap.has(p.id)) {
               mergedMap.set(p.id, p);
            } else {
               const existing = mergedMap.get(p.id)!;
               if (p.instances && existing.instances && p.instances.length > existing.instances.length) {
                  mergedMap.set(p.id, p);
               }
            }
         });
         const finalProducts = Array.from(mergedMap.values());
         addLog(`合併後總計: ${finalProducts.length} 筆資料 (原本畫面上有 ${products.length} 筆)`);
         
         if (finalProducts.length > products.length || JSON.stringify(finalProducts) !== JSON.stringify(products)) {
            setProducts(finalProducts);
            showToast(`已成功從歷史紀錄中還原合併資料！`);
         } else {
            showToast(`沒有找到更多遺失的資料。`);
         }
      } else {
         showToast(`沒有找到任何歷史資料。`);
      }
      
      setDiagnosticLog(log);
    } catch (err: any) {
      setDiagnosticLog(`發生未知的錯誤: ${err.message}`);
      showToast('尋找資料時發生錯誤');
    }
  };

  // --- Search Filtering Helper ---
  const activeProducts = products.filter(prod => {
    if (searchKeyword.trim()) {
      if (prod.status !== 'active') return false;
      const term = searchKeyword.toLowerCase();
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
    matchedProds.forEach(p => {
      p.instances.forEach(i => {
        totalQty += i.qty;
      });
    });
    return { count: totalCount, qty: totalQty };
  };

  const getCategoryStats = (categoryId: string) => {
    const matchedProds = products.filter(p => p.status === 'active' && p.category === categoryId);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    matchedProds.forEach(p => {
      p.instances.forEach(i => {
        totalQty += i.qty;
      });
    });
    return { count: totalCount, qty: totalQty };
  };



  // LocalStorage Double Backup
  useEffect(() => {
    if (isDataLoaded) {
       localStorage.setItem('cosmetics_backup_categories', JSON.stringify(categories));
       localStorage.setItem('cosmetics_backup_products', JSON.stringify(products));
    }
  }, [categories, products, isDataLoaded]);

  const handleExportBackup = () => {
    const backupData = {
      categories,
      products,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `cosmetics_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setToastMessage("備份檔已下載，您可以將其上傳至 Google Drive 保存");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.categories && json.products) {
          setCategories(json.categories);
          setProducts(json.products);
          setToastMessage("資料已成功還原！正在同步至雲端...");
          
          // Force save to localStorage immediately
          localStorage.setItem('cosmetics_backup_categories', JSON.stringify(json.categories));
          localStorage.setItem('cosmetics_backup_products', JSON.stringify(json.products));
          
          if (user) {
             const userRef = doc(db, 'users', user.uid);
             await setDoc(userRef, { categories: json.categories, updatedAt: new Date().toISOString() }, { merge: true });
             for (const p of json.products) {
               await setDoc(doc(db, 'users', user.uid, 'products', p.id), p);
             }
          }
        } else {
          setToastMessage("備份檔格式不正確");
        }
      } catch (err) {
        console.error(err);
        setToastMessage("讀取備份檔失敗");
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  // Get current subcategories for selected form category
  const currentFormCategoryObj = categories.find(c => c.id === formCategory);
  const currentFormSubcategories = currentFormCategoryObj ? currentFormCategoryObj.subcategories : [];

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-retro-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-retro-primary animate-pulse" />
          <span className="text-retro-text font-bold text-sm tracking-wider uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  return (

      <div className="min-h-screen bg-retro-bg text-retro-text relative pb-24 font-sans select-none antialiased">
      {/* 1. App Header */}
      <header className="px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] flex justify-between items-center bg-retro-bg/90 backdrop-blur-sm sticky top-0 z-40 border-b border-retro-text/10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
          <span>用品管理系統</span>
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => galleryInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-retro-primary text-retro-card flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all hover:brightness-105"
            title="照片辨識新增"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-retro-primary text-retro-card flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all hover:brightness-105"
            title="拍照辨識新增"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                clearForm();
              } else {
                clearForm();
                setShowAddForm(true);
                setTimeout(() => {
                  document.getElementById('manual-add-form')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="w-11 h-11 rounded-full bg-retro-secondary text-retro-card flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all hover:brightness-105"
            title="手動輸入新增"
          >
            <Plus className="w-5 h-5 transition-transform" style={{ transform: showAddForm ? 'rotate(45deg)' : 'rotate(0)' }} />
          </button>
        </div>
      </header>

      {/* Hidden file triggers */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={(e) => handlePhotoUpload(e, false)}
        accept="image/*" 
        capture="environment" 
        className="hidden"
      />
      <input 
        type="file" 
        ref={galleryInputRef}
        onChange={(e) => handlePhotoUpload(e, false)}
        accept="image/*" 
        className="hidden"
      />

      <div className="max-w-2xl mx-auto px-4 mt-2">
        {/* 2. Expired Notification Banner (Requirement 3) */}
        {expiredPaoItems.length > 0 && showNotificationBanner && (
          <div className="mb-4 p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 shadow-sm relative overflow-hidden animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <div className="font-bold text-sm flex justify-between items-center pr-6">
                  <span>📢 開封過期變質警報！</span>
                </div>
                <p className="text-xs text-red-800 mt-1">
                  以下產品已超出開封後建議使用期限，極易滋生細菌變質，請儘速替換：
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {expiredPaoItems.map((item, idx) => (
                    <li key={idx} className="text-xs flex flex-wrap justify-between items-center bg-red-50 p-2 rounded border border-red-200">
                      <div>
                        <span className="font-semibold text-red-950">[{item.product.brand}] {item.product.name}</span>
                        {item.instance.capacity && <span className="ml-1 text-[10px] bg-red-200 text-red-800 px-1 rounded">{item.instance.capacity}</span>}
                      </div>
                      <div className="text-[11px] font-bold text-red-700">
                        已過期 {item.daysOverdue} 天 (開封: {item.instance.openedDate})
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowNotificationBanner(false)}
              className="absolute top-3 right-3 text-red-600 hover:text-red-950 p-0.5 rounded-full hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. Search Bar */}
        {currentTab !== 'settings' && (
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-text/40 w-4.5 h-4.5" />
            <input 
              type="text" 
              placeholder="搜尋品牌、產品或小分類..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-retro-card rounded-2xl text-sm border border-retro-text/5 focus:outline-none focus:ring-1 focus:ring-retro-primary shadow-inner text-retro-text font-medium"
            />
            {searchKeyword && (
              <button 
                onClick={() => setSearchKeyword('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-retro-text/50 hover:text-retro-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* 4. Dynamic AI Status Loading Overlay */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-stone-900/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-retro-card p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-retro-primary/20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-retro-primary border-t-transparent animate-spin"></div>
                <h3 className="font-bold font-display text-lg tracking-wide flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-5 h-5 text-retro-secondary animate-pulse" />
                  AI 影像辨識中...
                </h3>
                <div className="w-full bg-retro-bg rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-retro-primary h-full animate-progress" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-retro-text/75 font-semibold mt-1">{aiStatusText}</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Add / Edit Product Form */}
        {showAddForm && (
          <div id="manual-add-form" className="mb-6 p-5 bg-retro-card rounded-2xl border border-retro-primary/30 shadow-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-retro-secondary flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {isEditingMaster ? '編輯大品項' : editingInstanceId ? '修改明細資訊' : isAddingInstanceToExisting ? '新增規格明細' : '確認新增品項'}
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddForm(false);
                  clearForm();
                }}
                className="text-retro-text/50 hover:text-retro-text p-1 rounded-full hover:bg-retro-bg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSave} className="space-y-4">
              {/* ====== MASTER PRODUCT FIELDS ====== */}
              {(!editingInstanceId && !isAddingInstanceToExisting) && (
                <div className="space-y-4">
                  {/* Photo Select */}
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1.5">
                      產品照片 (選填)
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        ref={formPhotoInputRef}
                        onChange={(e) => handlePhotoUpload(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        type="button"
                        onClick={() => formPhotoInputRef.current?.click()}
                        className="w-10 h-10 rounded-xl bg-retro-primary text-retro-card flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      {formPhoto ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={formPhoto} 
                            alt="預覽" 
                            className="h-10 w-auto max-w-[4rem] rounded-lg object-cover border border-retro-text/10"
                          />
                          <button 
                            type="button"
                            onClick={() => setFormPhoto('')}
                            className="text-xs text-red-500 font-bold hover:underline"
                          >
                            移除
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-retro-text/40 font-medium">尚未選擇照片</span>
                      )}
                    </div>
                  </div>

                  {/* Main Category & Subcategory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-retro-text/75 mb-1">主類別</label>
                      <select 
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          setFormSubcategory(''); // reset
                        }}
                        className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-retro-text/75 mb-1">子分類</label>
                      <div className="space-y-2">
                        <select 
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
                          className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                        >
                          <option value="">請選擇子分類</option>
                          {currentFormSubcategories.map((sub, idx) => (
                            <option key={idx} value={sub}>{sub}</option>
                          ))}
                          <option value="custom">✍️ 自訂其他...</option>
                        </select>

                        {(formSubcategory !== '' && !currentFormSubcategories.includes(formSubcategory)) && (
                          <input 
                            type="text" 
                            placeholder="請輸入自訂子分類名稱"
                            value={formSubcategory === '自訂子分類' ? '' : formSubcategory}
                            onChange={(e) => setFormSubcategory(e.target.value)}
                            className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Brand Name */}
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1">品牌名稱</label>
                    <input 
                      type="text" 
                      placeholder="請輸入品牌"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>

                  {/* Product Name & AI Web Search Assist */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-retro-text/75">產品名稱</label>
                      {isSearchingAi && <span className="text-[10px] text-retro-primary animate-pulse font-semibold">AI 正在網搜中...</span>}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="請輸入產品名稱"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="flex-1 p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                      />
                      <button 
                        type="button"
                        onClick={handleAiWebSearch}
                        className="w-10 h-10 rounded-xl bg-retro-primary text-retro-card flex items-center justify-center hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
                        title="網路搜尋官方完整品牌與品名"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Threshold */}
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1">補貨門檻數量</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="低於此數量時提醒 (0)"
                      value={formThreshold === 0 ? '' : formThreshold}
                      onChange={(e) => setFormThreshold(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                    <p className="text-[10px] text-retro-text/50 mt-1">此品項所有未開封明細之數量加總低於此設定時，會顯示補貨提醒</p>
                  </div>
                </div>
              )}

              {/* ====== INSTANCE PRODUCT FIELDS ====== */}
              {!isEditingMaster && (
                <div className="space-y-4">
                  {/* Quantity and Capacity */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-retro-text/75 mb-1">數量</label>
                  <input 
                    type="number" 
                    placeholder="例如: 1"
                    value={formQty === 0 ? '' : formQty}
                    onChange={(e) => setFormQty(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-retro-text/75 mb-1">容量</label>
                  <input 
                    type="text" 
                    placeholder="例如: 30"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-retro-text/75 mb-1">單位</label>
                  <select
                    value={formCapacityUnit}
                    onChange={(e) => setFormCapacityUnit(e.target.value)}
                    className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  >
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                    <option value="個">個</option>
                    <option value="罐">罐</option>
                    <option value="錠">錠</option>
                    <option value="顆">顆</option>
                  </select>
                </div>
              </div>

              {/* Usage */}
              <div>
                <label className="block text-xs font-bold text-retro-text/75 mb-1">使用狀態</label>
                <select 
                  value={formUsage}
                  onChange={(e) => setFormUsage(e.target.value as any)}
                  className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                >
                  <option value="使用中">使用中</option>
                  <option value="未開封">未開封</option>
                  <option value="已用完">已用完</option>
                  <option value="已丟棄">已丟棄</option>
                </select>
              </div>

              {/* Requirement 3: Period After Opening (PAO) & Opening Date fields */}
              <div className="grid grid-cols-2 gap-3">
                {/* 開封日期 (只有 未開封 不顯示) */}
                {formUsage !== '未開封' && (
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      開封日期
                    </label>
                    <input 
                      type="date" 
                      value={formOpenedDate}
                      onChange={(e) => setFormOpenedDate(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                )}
                
                {/* 結束日期 (只有 已用完/已丟棄 顯示) */}
                {(formUsage === '已用完' || formUsage === '已丟棄') && (
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      結束日期
                    </label>
                    <input 
                      type="date" 
                      value={formFinishedDate}
                      onChange={(e) => setFormFinishedDate(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                )}

                {/* PAO (未開封 或 使用中 顯示) */}
                {(formUsage === '使用中' || formUsage === '未開封') && (
                  <div className={formUsage === '未開封' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <ClockIcon className="w-3.5 h-3.5" />
                      開封後可使用月數
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="例如: 6, 12, 24"
                      value={formPaoMonths}
                      onChange={(e) => setFormPaoMonths(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-xs font-bold text-retro-text/75 mb-1">有效期限 (到期日)</label>
                <input 
                  type="date" 
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                />
              </div>

              {/* Purchase Records Fields (Requirement 1 - purchase details inputs) */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-retro-primary/80 uppercase tracking-wider block">
                  🛒 購買與價格紀錄 (選填)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1">購買日期</label>
                    <input 
                      type="date" 
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1">單價 (NTD)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="例如: 350"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-retro-text/75 mb-1">購買地點 / 管道</label>
                  <input 
                    type="text" 
                    placeholder="例如: 屈臣氏、MOMO、日本代購..."
                    value={formPurchasePlace}
                    onChange={(e) => setFormPurchasePlace(e.target.value)}
                    className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-retro-secondary text-retro-card font-bold text-sm rounded-xl hover:brightness-105 active:scale-[0.99] transition-all shadow cursor-pointer"
                >
                  {isEditingMaster ? '儲存大品項修改' : editingInstanceId ? '儲存修改' : isAddingInstanceToExisting ? '新增規格明細' : '確認無誤，新增至資料庫'}
                </button>

                {editingInstanceId && (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={handleSaveAsNewInstance}
                      className="py-2.5 bg-retro-primary text-retro-card font-bold text-xs rounded-xl hover:brightness-105 transition-all cursor-pointer"
                      title="保留原明細，以此內容建立一個同商品的新明細項"
                    >
                      另存為新明細 (同品項)
                    </button>
                    <button 
                      type="button"
                      onClick={handleDeleteInstance}
                      className="py-2.5 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-all cursor-pointer"
                    >
                      永久刪除此明細
                    </button>
                  </div>
                )}

                {isEditingMaster && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (editingProductId) {
                        askConfirmation(
                          '刪除大品項',
                          '確定要永久刪除此大品項及其所有購買明細嗎？此操作無法復原。',
                          () => {
                            setProducts(products.filter(p => p.id !== editingProductId));
                            setShowAddForm(false);
                            setSelectedDetailProduct(null);
                            clearForm();
                            showToast('大品項已成功刪除！');
                          }
                        );
                      }
                    }}
                    className="w-full py-2.5 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-all cursor-pointer mt-2"
                  >
                    永久刪除此大品項 (含所有明細)
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* 6. Active Tab Product List / Settings Screen */}
        {currentTab === 'settings' ? (
          /* =================== SETTINGS VIEW =================== */
          <div className="space-y-6 pb-20">
            {settingsView === 'menu' && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold font-display flex items-center gap-2 text-retro-text mb-4">
                  <Settings className="w-5 h-5 text-retro-primary" />
                  設定與分類管理
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setSettingsView('apikey')} className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-retro-primary/10 flex items-center justify-center text-retro-primary">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">設定 Gemini API 金鑰</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" />
                  </button>

                  <button onClick={() => setSettingsView('category')} className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-retro-secondary/10 flex items-center justify-center text-retro-secondary">
                        <ListTree className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">設定與管理分類</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" />
                  </button>

                  <button onClick={() => setSettingsView('history')} className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Archive className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">歷史封存紀錄</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" />
                  </button>

                  <button onClick={() => setSettingsView('backup')} className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      </div>
                      <span className="font-bold text-retro-text text-sm">備份與還原 (可存至 Google Drive)</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" />
                  </button>


                  <div className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">視覺風格設定</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleThemeChange('retro')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appTheme === 'retro' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}`}
                      >復古風</button>
                      <button 
                        onClick={() => handleThemeChange('pixel')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appTheme === 'pixel' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}`}
                      >像素風</button>
                      <button 
                        onClick={() => handleThemeChange('minimal')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appTheme === 'minimal' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}`}
                      >文青風</button>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Type className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">字體大小設定</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleFontSizeChange('small')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appFontSize === 'small' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}`}
                      >小</button>
                      <button 
                        onClick={() => handleFontSizeChange('medium')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appFontSize === 'medium' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}`}
                      >中</button>
                      <button 
                        onClick={() => handleFontSizeChange('large')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appFontSize === 'large' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}`}
                      >大</button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <button onClick={handleRecoverData} className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm hover:border-orange-200 transition-all flex items-center justify-center group cursor-pointer">
                      <span className="font-bold text-orange-600 text-sm">尋找遺失的資料 (資料救援)</span>
                    </button>
                  </div>

                  <div className="mt-2">
                    <button onClick={logOut} className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl shadow-sm hover:border-red-200 transition-all flex items-center justify-center group cursor-pointer">
                      <span className="font-bold text-red-600 text-sm">登出帳號</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settingsView === 'apikey' && (
              <div className="space-y-4 animate-fade-in">
                <button onClick={() => setSettingsView('menu')} className="text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2">
                  <ChevronDown className="w-4 h-4 rotate-90" /> 返回設定選單
                </button>
                {/* Requirement 2: API KEY INPUT */}
                <div className="p-5 bg-retro-card rounded-2xl border border-retro-text/10 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-retro-secondary flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5" />
                Gemini AI 金鑰設定
              </h3>
              <p className="text-xs text-retro-text/60 leading-relaxed font-medium">
                若要使用「自動網搜補全產品」或「相機拍照影像辨識」功能，請在此處設定您的 Gemini API Key。金鑰會安全保存在您的個人瀏覽器中。
              </p>
              <div className="space-y-2">
                {[0, 1, 2].map(idx => (
                  <div key={idx} className="relative flex-1">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      placeholder={`請輸入 GEMINI_API_KEY ${idx + 1}`}
                      value={apiKeyInputs[idx]}
                      onChange={(e) => {
                        const newInputs = [...apiKeyInputs];
                        newInputs[idx] = e.target.value;
                        setApiKeyInputs(newInputs);
                      }}
                      className="w-full py-2 pl-3 pr-10 bg-white border border-retro-text/10 rounded-xl text-xs font-semibold text-retro-text focus:outline-none focus:border-retro-primary"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-retro-text/50 hover:text-retro-text"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 bg-retro-primary text-retro-card text-xs font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    儲存金鑰
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

            {settingsView === 'category' && (
              <div className="space-y-4 animate-fade-in">
                <button onClick={() => setSettingsView('menu')} className="text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2">
                  <ChevronDown className="w-4 h-4 rotate-90" /> 返回設定選單
                </button>
                {/* Requirement 1: EDIT CATEGORY & SUBCATEGORY NESTED LIST */}
                <div className="p-5 bg-retro-card rounded-2xl border border-retro-text/10 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-retro-secondary flex items-center gap-1.5">
                  <ListTree className="w-4.5 h-4.5" />
                  大分類與小分類管理
                </h3>
              </div>
              <p className="text-xs text-retro-text/60 leading-relaxed font-medium">
                可任意新增、編輯、刪減與<b>拖曳排序</b>大分類與小分類。點擊分類卡片旁的<b>「管理小分類」</b>即可編輯、新增、刪除及拖曳該小分類的細項！
              </p>

              {/* Add New Category */}
              <div className="p-3.5 bg-retro-bg/40 rounded-xl border border-retro-text/5 space-y-3">
                <div className="font-bold text-xs text-retro-text/70">新增大分類</div>
                <div className="flex flex-wrap gap-2">
                  <input 
                    type="text" 
                    placeholder="新分類名稱 (例: 隱形眼鏡)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 min-w-[140px] p-2 bg-white border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  />
                  <select 
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="p-2 bg-white border border-retro-text/10 rounded-xl text-xs font-semibold text-retro-text focus:outline-none"
                  >
                    <option value="sparkles">✨ 閃亮</option>
                    <option value="droplets">💧 水滴</option>
                    <option value="pill">💊 膠囊</option>
                    <option value="package">📦 盒子</option>
                    <option value="shopping-bag">🛍️ 購物袋</option>
                    <option value="heart">❤️ 愛心</option>
                    <option value="star">⭐ 星星</option>
                  </select>
                  <button 
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-retro-secondary text-retro-card text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增大分類
                  </button>
                </div>
              </div>

              {/* Main Categories Nested Reordering List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-retro-text/60">大分類清單 (拖曳手把排序)</div>
                <div className="space-y-2.5">
                  {categories.map((cat, idx) => (
                    <div 
                      key={cat.id} 
                      className="border border-retro-text/10 rounded-xl bg-white overflow-hidden shadow-sm transition-all"
                    >
                      {/* Big Category Bar */}
                      <div 
                        draggable
                        onDragStart={(e) => handleCatDragStart(e, idx)}
                        onDragOver={handleCatDragOver}
                        onDrop={(e) => handleCatDrop(e, idx)}
                        className="flex items-center justify-between p-3 bg-stone-50 border-b border-stone-100 hover:bg-stone-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="cursor-grab p-1 hover:bg-stone-200 rounded text-stone-400 active:text-stone-700 hidden sm:block">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col sm:hidden">
                            <button onClick={(e) => { e.stopPropagation(); moveCatUp(idx); }} disabled={idx === 0} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); moveCatDown(idx); }} disabled={idx === categories.length - 1} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm">
                            <CategoryIcon name={cat.icon} className="w-4.5 h-4.5 text-retro-primary" />
                          </span>
                          <span className="font-bold text-sm text-retro-text">{cat.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setActiveCategoryForSub(activeCategoryForSub === cat.id ? null : cat.id)}
                            className="text-[11px] font-bold px-2.5 py-1.5 bg-retro-primary/10 text-retro-primary rounded-lg hover:bg-retro-primary/20 transition-colors flex items-center gap-1"
                          >
                            <ListTree className="w-3.5 h-3.5" />
                            管理小分類 ({cat.subcategories.length})
                          </button>
                          {categories.length > 1 && (
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)} 
                              className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="刪除此大分類"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Small Categories Sub-list (Requirement 1) */}
                      {activeCategoryForSub === cat.id && (
                        <div className="p-3 bg-stone-50/50 border-t border-stone-100/60 space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="text-[11px] font-bold text-retro-secondary flex items-center gap-1">
                              <span>【{cat.name}】的小分類管理</span>
                            </div>
                          </div>

                          {/* Add Subcategory Inline */}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="新小分類名稱 (如: 護底霜)"
                              value={newSubName}
                              onChange={(e) => setNewSubName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubcategory(cat.id);
                              }}
                              className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs text-retro-text focus:outline-none focus:border-retro-primary"
                            />
                            <button 
                              onClick={() => handleAddSubcategory(cat.id)}
                              className="px-3 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Subcategory draggable list */}
                          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {cat.subcategories.map((sub, sIdx) => (
                              <li 
                                key={sIdx}
                                draggable
                                onDragStart={(e) => handleSubDragStart(e, cat.id, sIdx)}
                                onDragOver={handleSubDragOver}
                                onDrop={(e) => handleSubDrop(e, cat.id, sIdx)}
                                className="flex items-center justify-between p-2 bg-white border border-stone-200 rounded-lg text-xs hover:bg-stone-50 transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                                  <div className="cursor-grab p-0.5 text-stone-400 hover:text-stone-600 hidden sm:block">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col sm:hidden">
                                    <button onClick={(e) => { e.stopPropagation(); moveSubCatUp(cat.id, sIdx); }} disabled={sIdx === 0} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); moveSubCatDown(cat.id, sIdx); }} disabled={sIdx === cat.subcategories.length - 1} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                                      <ChevronDown className="w-3.5 h-3.5" />
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
                                      className="flex-1 p-1 py-0.5 border border-stone-400 rounded bg-white text-xs text-stone-800 focus:outline-none"
                                    />
                                  ) : (
                                    <span className="truncate font-semibold text-stone-700">{sub}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {editingSubIdx === sIdx && editingSubCatId === cat.id ? (
                                    <button 
                                      onClick={() => handleSaveSubcategory(cat.id, sIdx)}
                                      className="text-stone-700 hover:text-stone-900 p-0.5"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setEditingSubCatId(cat.id);
                                        setEditingSubIdx(sIdx);
                                        setEditingSubName(sub);
                                      }}
                                      className="text-stone-400 hover:text-stone-700 p-0.5"
                                      title="編輯小分類名稱"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteSubcategory(cat.id, sIdx)}
                                    className="text-red-400 hover:text-red-600 p-0.5"
                                    title="刪除小分類"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </li>
                            ))}
                            {cat.subcategories.length === 0 && (
                              <li className="text-center text-stone-400 text-[10px] py-4 bg-white border border-stone-100 rounded-lg">
                                尚無小分類，請在上方新增
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
            )}

            
            {settingsView === 'backup' && (
              <div className="space-y-4 animate-fade-in">
                <button onClick={() => setSettingsView('menu')} className="text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2">
                  <ChevronDown className="w-4 h-4 rotate-90" /> 返回設定選單
                </button>
                <div className="p-5 bg-retro-card rounded-2xl border border-retro-text/10 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-retro-secondary flex items-center gap-1.5">
                    資料備份與還原
                  </h3>
                  <p className="text-xs text-retro-text/70 leading-relaxed">
                    您可以將所有資料下載成 JSON 備份檔，並將其上傳至您的 Google Drive 保存。未來若需要還原，只要點擊「還原資料」並選擇該備份檔即可。
                  </p>
                  
                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={handleExportBackup}
                      className="w-full flex items-center justify-center gap-2 bg-retro-primary text-white py-3 rounded-xl font-bold hover:bg-retro-primary/90 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      下載備份檔
                    </button>
                    
                    <label className="w-full flex items-center justify-center gap-2 bg-white border border-retro-primary text-retro-primary py-3 rounded-xl font-bold hover:bg-retro-primary/5 transition-all cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      從備份檔還原
                      <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {settingsView === 'history' && (
              <div className="space-y-4 animate-fade-in">
                <button onClick={() => setSettingsView('menu')} className="text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2">
                  <ChevronDown className="w-4 h-4 rotate-90" /> 返回設定選單
                </button>
                <div className="mb-1 bg-retro-card/40 px-3.5 py-2.5 rounded-xl border border-retro-text/5 text-xs text-retro-text font-bold flex items-center justify-between">
                  <span>歷史封存紀錄</span>
                  <span className="text-retro-secondary bg-retro-secondary/10 px-2 py-0.5 rounded-full">
                    {products.filter(p => p.status === 'archived').length} 件
                  </span>
                </div>
                
                {(() => {
                  const archivedProducts = products.filter(p => p.status === 'archived' && (searchKeyword ? p.name.includes(searchKeyword) || p.brand.includes(searchKeyword) : true));
                  if (archivedProducts.length === 0) {
                    return (
                      <div className="text-center py-12 bg-retro-card rounded-2xl border border-retro-text/10">
                        <p className="text-sm text-retro-text/50 font-medium">尚無符合的封存商品</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {archivedProducts.map(prod => (
                        <div key={prod.id}>
                          <ProductCard 
                              product={prod} 
                              onViewDetail={setSelectedDetailProduct}
                              onEdit={handleEditInstanceTrigger}
                              onArchive={handleArchiveInstance}
                              onAddAnother={handleAddAnotherInstanceTrigger}
                              onImageClick={setFullscreenImage}
                              categoryIcon={categories.find(c => c.id === prod.category)?.icon || 'sparkles'}
                            />
                        </div>
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
            {/* Category Stats Indicator */}
            {!searchKeyword.trim() ? (
              <div className="flex justify-between items-center mb-1 bg-retro-card/40 px-3.5 py-2.5 rounded-xl border border-retro-text/5 text-xs text-retro-text">
                <span className="font-bold text-retro-text/80">
                  分類：{categories.find(c => c.id === currentTab)?.name || ''}
                </span>
                <span className="font-semibold text-retro-text/70 flex items-center gap-1">
                  <span>共 {getCategoryStats(currentTab).count} 品項</span>
                  <span className="text-retro-text/30">|</span>
                  <Package className="w-3.5 h-3.5 text-retro-primary" />
                  <span>總庫存 {getCategoryStats(currentTab).qty}</span>
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-1 bg-retro-card/40 px-3.5 py-2.5 rounded-xl border border-retro-text/5 text-xs text-retro-text">
                <span className="font-bold text-retro-text/80">
                  搜尋結果
                </span>
                <span className="font-semibold text-retro-text/70 flex items-center gap-1">
                  <span>共 {activeProducts.length} 品項</span>
                  <span className="text-retro-text/30">|</span>
                  <Package className="w-3.5 h-3.5 text-retro-primary" />
                  <span>總庫存 {activeProducts.reduce((sum, p) => sum + p.instances.reduce((s, i) => s + i.qty, 0), 0)}</span>
                </span>
              </div>
            )}

            {/* Subcategory Nested Product List */}
            {(() => {
              // If searching, render flat list
              if (searchKeyword.trim()) {
                if (activeProducts.length === 0) {
                  return (
                    <div className="text-center py-12 bg-retro-card rounded-2xl border border-retro-text/10">
                      <p className="text-sm text-retro-text/50 font-semibold">尚無符合的商品</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {[...activeProducts]
      .sort((a, b) => {
        const aOpened = a.instances.some(i => i.usage === '使用中') ? 1 : 0;
        const bOpened = b.instances.some(i => i.usage === '使用中') ? 1 : 0;
        return bOpened - aOpened;
      })
      .map(prod => (
                      <div key={prod.id}>
                        <ProductCard 
                          product={prod} 
                          onViewDetail={setSelectedDetailProduct}
                          onEdit={handleEditInstanceTrigger}
                          onArchive={handleArchiveInstance}
                          onAddAnother={handleAddAnotherInstanceTrigger}
                          onImageClick={setFullscreenImage}
                          categoryIcon={categories.find(c => c.id === prod.category)?.icon || 'sparkles'}
                        />
                      </div>
                    ))}
                  </div>
                );
              }

              // Get subcategories of current category
              const currentCatObj = categories.find(c => c.id === currentTab);
              
              // Normal Category Tab with nested subcategory views
              if (!currentCatObj) return null;
              
              // We'll group active products by subcategory
              const predefinedSubcats = currentCatObj.subcategories;
              const usedSubcats = Array.from(new Set(activeProducts.map(p => p.subcategory)));
              const customSubcats = usedSubcats.filter(sub => !predefinedSubcats.includes(sub));
              const allSubcatGroups = [...predefinedSubcats, ...customSubcats];
              
              // Filter to find subcat groups that have matching active filtered products
              const nonAndEmptyGroups = allSubcatGroups.filter(subName => {
                const groupProds = activeProducts
                      .filter(p => p.subcategory === subName)
                      .sort((a, b) => {
                        const aOpened = a.instances.some(i => i.usage === '使用中') ? 1 : 0;
                        const bOpened = b.instances.some(i => i.usage === '使用中') ? 1 : 0;
                        return bOpened - aOpened;
                      });
                return groupProds.length > 0;
              });

              if (nonAndEmptyGroups.length === 0) {
                return (
                  <div className="text-center py-12 bg-retro-card rounded-2xl border border-retro-text/10">
                    <p className="text-sm text-retro-text/50 font-semibold">此分類下尚無符合商品</p>
                    <button 
                      onClick={() => {
                        clearForm();
                        setFormCategory(currentTab);
                        setShowAddForm(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-retro-primary text-retro-card rounded-xl text-xs font-bold shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      新增商品
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {nonAndEmptyGroups.map(subName => {
                    const groupProds = activeProducts
                      .filter(p => p.subcategory === subName)
                      .sort((a, b) => {
                        const aOpened = a.instances.some(i => i.usage === '使用中') ? 1 : 0;
                        const bOpened = b.instances.some(i => i.usage === '使用中') ? 1 : 0;
                        return bOpened - aOpened;
                      });
                    const stats = getSubcategoryStats(subName, currentTab);

                    return (
                      <div key={subName} className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center text-xs text-retro-text/70 font-bold tracking-wider px-1">
                          <span className="text-retro-text/30 mr-1.5 font-normal">└</span>
                          <span>{subName}</span>
                          <span className="ml-auto text-[10px] bg-retro-primary/10 text-retro-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span>{stats.count}件</span>
                            <span className="opacity-40">|</span>
                            <Package className="w-3 h-3" />
                            <span>{stats.qty}</span>
                          </span>
                        </div>

                        <div className="space-y-3">
                          {groupProds.map(prod => (
                            <div key={prod.id}>
                              <ProductCard 
                              product={prod} 
                              onViewDetail={setSelectedDetailProduct}
                              onEdit={handleEditInstanceTrigger}
                              onArchive={handleArchiveInstance}
                              onAddAnother={handleAddAnotherInstanceTrigger}
                              onImageClick={setFullscreenImage}
                              categoryIcon={categories.find(c => c.id === prod.category)?.icon || 'sparkles'}
                            />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 7. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-retro-card border-t border-retro-text/10 flex justify-around items-center pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 max-w-2xl mx-auto overflow-x-auto">
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => handleTabChange(cat.id)}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold min-w-[56px] transition-colors py-1 px-1.5 rounded-lg active:bg-retro-bg/40 ${currentTab === cat.id ? 'text-retro-primary bg-retro-primary/5' : 'text-retro-text/50'}`}
          >
            <CategoryIcon name={cat.icon} className="w-5 h-5" />
            <span className="truncate max-w-[56px]">{cat.name}</span>
          </button>
        ))}
        {/* Fixed Settings Tab */}
        <button 
          onClick={() => handleTabChange('settings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold min-w-[56px] transition-colors py-1 px-1.5 rounded-lg active:bg-retro-bg/40 ${currentTab === 'settings' ? 'text-retro-primary bg-retro-primary/5' : 'text-retro-text/50'}`}
        >
          <Settings className="w-5 h-5" />
          <span>設定</span>
        </button>
      </nav>

      {/* Toast Alert overlay */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-3 bg-stone-900/90 text-white rounded-full text-xs font-bold shadow-lg z-50 pointer-events-none transition-all duration-300 transform scale-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-retro-primary animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* ==================== 8. Detailed Product View Modal (Requirement 1: 完整畫面) ==================== */}
      {selectedDetailProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full h-[100dvh] sm:h-auto sm:max-w-md bg-white sm:border-2 border-retro-text sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[85dvh] animate-slide-up pb-safe">
            {/* Top Bar with Drag Handle for Mobile / Header */}
            <div className="relative pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 px-5 border-b border-retro-text/5 flex items-start gap-4 bg-stone-50/50">
              {selectedDetailProduct.photo ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={selectedDetailProduct.photo} 
                  alt={selectedDetailProduct.name}
                  onClick={() => setFullscreenImage(selectedDetailProduct.photo!)}
                  className="h-18 w-auto max-w-[8rem] rounded-xl object-cover border border-retro-text/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-14 h-18 rounded-xl bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary flex-shrink-0">
                  <CategoryIcon name={categories.find(c => c.id === selectedDetailProduct.category)?.icon || 'sparkles'} className="w-6 h-6 opacity-40" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[10px] font-extrabold text-retro-secondary tracking-widest uppercase block">
                  {selectedDetailProduct.brand}
                </span>
                <h3 className="text-base font-bold text-retro-text leading-snug mt-0.5 line-clamp-2">
                  {selectedDetailProduct.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold bg-retro-primary/10 text-retro-primary px-2.5 py-0.5 rounded-full">
                    {categories.find(c => c.id === selectedDetailProduct.category)?.name || selectedDetailProduct.category}
                  </span>
                  {selectedDetailProduct.subcategory && (
                    <span className="text-[10px] font-bold bg-retro-secondary/5 text-retro-secondary border border-retro-secondary/10 px-2.5 py-0.5 rounded-full">
                      {selectedDetailProduct.subcategory}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedDetailProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer animate-fade-in"
                title="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Middle Nav Buttons */}
            <div className="p-3 bg-stone-100/50 border-b border-retro-text/5 grid grid-cols-4 gap-2 flex-shrink-0">
              <button
                onClick={() => setDetailActiveTab('status')}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all border flex flex-col items-center gap-0.5 cursor-pointer ${
                  detailActiveTab === 'status'
                    ? 'bg-retro-primary text-retro-card border-retro-primary shadow-sm scale-[1.02]'
                    : 'bg-white text-retro-text/60 border-retro-text/5 hover:text-retro-text hover:bg-stone-50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>數量狀況</span>
              </button>

              <button
                onClick={() => setDetailActiveTab('purchase')}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all border flex flex-col items-center gap-0.5 cursor-pointer ${
                  detailActiveTab === 'purchase'
                    ? 'bg-retro-secondary text-retro-card border-retro-secondary shadow-sm scale-[1.02]'
                    : 'bg-white text-retro-text/60 border-retro-text/5 hover:text-retro-text hover:bg-stone-50'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>購買紀錄</span>
              </button>

              <button
                onClick={() => setDetailActiveTab('usage')}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all border flex flex-col items-center gap-0.5 cursor-pointer ${
                  detailActiveTab === 'usage'
                    ? 'bg-amber-600 text-retro-card border-amber-600 shadow-sm scale-[1.02]'
                    : 'bg-white text-retro-text/60 border-retro-text/5 hover:text-retro-text hover:bg-stone-50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>使用紀錄</span>
              </button>

              <button
                onClick={() => handleEditProductMasterTrigger(selectedDetailProduct)}
                className="py-2 px-1 text-[11px] font-bold bg-white text-retro-text/60 hover:text-retro-primary border border-retro-text/5 hover:border-retro-primary/20 rounded-xl transition-all flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>編輯大品項</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {detailActiveTab === 'status' ? (
                /* Tab 1 Content: 商品數量狀況 */
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Overall Restock Warning */}
                  {(() => {
                    const totalUnopened = selectedDetailProduct.instances.filter(inst => inst.usage === '未開封').reduce((sum, inst) => sum + inst.qty, 0);
                    if (selectedDetailProduct.threshold > 0 && totalUnopened <= selectedDetailProduct.threshold) {
                      return (
                        <div className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span>庫存偏低！目前未開封總計 {totalUnopened} 件，已達補貨門檻 ({selectedDetailProduct.threshold} 件)</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Bento Stats Counters */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]">
                      <span className="text-[10px] font-bold text-retro-text/50">總數量</span>
                      <span className="text-xl font-extrabold text-retro-primary font-mono">
                        {selectedDetailProduct.instances.reduce((sum, inst) => sum + inst.qty, 0)}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]">
                      <span className="text-[10px] font-bold text-retro-text/50">開封中數量</span>
                      <span className="text-xl font-extrabold text-green-600 font-mono">
                        {selectedDetailProduct.instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0)}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]">
                      <span className="text-[10px] font-bold text-retro-text/50">最近到期天數</span>
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-extrabold text-amber-600 font-mono leading-none">
                          {(() => {
                            let minDays = 9999;
                            selectedDetailProduct.instances.forEach(inst => {
                              const days = calculateDaysToExpiry(inst.expiry);
                              if (days < minDays) minDays = days;
                            });
                            return minDays !== 9999 ? minDays : '-';
                          })()}
                        </span>
                        {(() => {
                          let closestDate = null;
                          let minDays = 9999;
                          selectedDetailProduct.instances.forEach(inst => {
                            const days = calculateDaysToExpiry(inst.expiry);
                            if (days < minDays && inst.expiry) {
                              minDays = days;
                              closestDate = inst.expiry;
                            }
                          });
                          return minDays !== 9999 && closestDate ? (
                            <span className="text-[9px] font-bold text-retro-text/40 mt-1">
                              {closestDate.replace(/-/g, '/')}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Instances List */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block">
                      📋 規格明細與狀態
                    </span>
                    {[...selectedDetailProduct.instances].sort((a, b) => (b.usage === '使用中' ? 1 : 0) - (a.usage === '使用中' ? 1 : 0)).map((inst, index) => {
                      const daysLeft = calculateDaysToExpiry(inst.expiry);
                      const isUrgent = daysLeft <= 60;
                      const pao = calculatePaoExpiry(inst.openedDate, inst.paoMonths);

                      return (
                        <div key={inst.id} className="p-3 bg-white rounded-xl border border-retro-text/10 space-y-2 shadow-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-retro-text bg-retro-bg/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Package className="w-3 h-3 text-retro-primary" />
                                {inst.qty} 件
                              </span>
                              {inst.capacity && (
                                <span className="text-xs font-bold text-retro-primary bg-retro-primary/10 px-2 py-0.5 rounded-lg">
                                  {inst.capacity}
                                </span>
                              )}
                              
                              {/* The new Usage select replacing the badge */}
                              <div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1 pixel-box">
                                <span className={`w-2 h-2 rounded-full ${inst.usage === '使用中' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></span>
                                <select
                                  value={inst.usage === '未開封' ? '未開封' : '使用中'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'archived') {
                                      handleArchiveInstance(selectedDetailProduct.id, inst.id);
                                    } else {
                                      const nextProducts = products.map(prod => {
                                        if (prod.id === selectedDetailProduct.id) {
                                          return {
                                            ...prod,
                                            instances: prod.instances.map(i => {
                                              if (i.id === inst.id) {
                                                return { 
                                                  ...i, 
                                                  usage: val as any,
                                                  openedDate: val === '使用中' && !i.openedDate ? new Date().toISOString().split('T')[0] : i.openedDate
                                                };
                                              }
                                              return i;
                                            })
                                          };
                                        }
                                        return prod;
                                      });
                                      setProducts(nextProducts);
                                      const updated = nextProducts.find(p => p.id === selectedDetailProduct.id);
                                      if (updated) setSelectedDetailProduct(updated);
                                      showToast(`狀態已變更為：${val === '未開封' ? '未使用' : '已開封'}`);
                                    }
                                  }}
                                  className="text-xs font-bold text-retro-text/80 bg-transparent outline-none cursor-pointer appearance-none pr-3 relative z-10 no-pixel-border"
                                >
                                  <option value="未開封">未使用</option>
                                  <option value="使用中">已開封</option>
                                  <option value="archived">封存</option>
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-1 text-retro-text/40 pointer-events-none" />
                              </div>

                            </div>

                            {/* Instance edit/delete buttons */}
                            {selectedDetailProduct.status !== 'archived' && (
                              <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-0.5">
                                <button 
                                  onClick={() => {
                                    handleEditInstanceTrigger(selectedDetailProduct, inst);
                                    setSelectedDetailProduct(null); // Close modal
                                  }}
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"
                                  title="編輯此規格"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                
                                <span className="w-[1px] h-3 bg-retro-text/10"></span>
                                <button 
                                  onClick={() => handleDeleteInstanceDirect(selectedDetailProduct.id, inst.id)}
                                  className="action-btn-no-pixel text-red-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer"
                                  title="永久刪除此細項"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* PAO Expiry / Date Details Grid */}
                          <div className="rounded-xl overflow-hidden bg-stone-50/50 mt-2 border border-retro-text/10">
                            {/* Row 1: Expiry */}
                            <div className="grid grid-cols-3 divide-x divide-retro-text/10 border-b border-retro-text/10 bg-retro-bg/30 text-[10px] font-bold text-retro-text/60">
                              <div className="px-3 py-1.5 flex items-center">數量 / 容量</div>
                              <div className="px-3 py-1.5 flex items-center">有效期限</div>
                              <div className="px-3 py-1.5 flex items-center">剩餘</div>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-retro-text/10 bg-white text-xs font-bold text-retro-text">
                              <div className="px-3 py-2.5 flex items-center">{inst.qty} / {inst.capacity || '-'}</div>
                              <div className="px-3 py-2.5 flex items-center">{inst.expiry ? inst.expiry : '-'}</div>
                              <div className="px-3 py-2.5 flex items-center justify-between">
                                <span className={isUrgent ? 'text-red-500' : ''}>
                                  {daysLeft !== 9999 ? `${daysLeft} 天` : '-'}
                                </span>
                              </div>
                            </div>

                            {/* Row 2: PAO (Only if in use and has PAO) */}
                            {inst.usage === '使用中' && inst.paoMonths && inst.openedDate && pao && (
                              <>
                                <div className={`grid grid-cols-3 divide-x divide-retro-text/10 border-b border-t border-retro-text/10 text-[10px] font-bold ${pao.isExpired ? 'bg-red-50 text-red-600/70' : 'bg-retro-bg/30 text-retro-text/60'}`}>
                                  <div className="px-3 py-1.5 flex items-center">開封日期</div>
                                  <div className="px-3 py-1.5 flex items-center">使用期限</div>
                                  <div className="px-3 py-1.5 flex items-center">剩餘</div>
                                </div>
                                <div className={`grid grid-cols-3 divide-x divide-retro-text/10 text-xs font-bold ${pao.isExpired ? 'bg-red-50/50 text-red-600' : 'bg-white text-retro-text'}`}>
                                  <div className="px-3 py-2.5 flex items-center">{inst.openedDate}</div>
                                  <div className="px-3 py-2.5 flex items-center">{pao.expiryDate}</div>
                                  <div className="px-3 py-2.5 flex items-center justify-between">
                                    <span>
                                      {pao.isExpired ? `${pao.daysOverdue} 天 (過期)` : `${pao.daysLeft} 天`}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : detailActiveTab === 'purchase' ? (
                /* Tab 2 Content: 購買紀錄 */
                (() => {
                  const allPurchaseInstances = products
                    .filter(p => p.brand === selectedDetailProduct.brand && p.name === selectedDetailProduct.name)
                    .flatMap(p => p.instances.map(inst => ({ ...inst, isArchived: p.status === 'archived' })))
                    .sort((a, b) => {
                      if (a.purchaseDate && b.purchaseDate) {
                        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
                      }
                      return 0;
                    });
                    
                  const instancesWithPurchaseInfo = allPurchaseInstances.filter(inst => inst.purchaseDate || inst.purchasePlace || inst.price !== undefined);

                  return (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-stone-50 px-3 py-2.5 rounded-xl border border-retro-text/5 flex justify-between items-center">
                        <span className="text-xs font-bold text-retro-text/60">購買明細筆數</span>
                        <span className="text-sm font-extrabold text-retro-secondary font-mono">
                          總筆數：{allPurchaseInstances.length} 筆
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block">
                          🛒 每一筆的購買明細紀錄 (含封存)
                        </span>
                        
                        <div className="overflow-hidden rounded-xl border border-retro-text/5 bg-white shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-stone-50 border-b border-retro-text/5 text-[10px] uppercase text-retro-text/50">
                                <th className="p-2.5 font-bold whitespace-nowrap">日期</th>
                                <th className="p-2.5 font-bold whitespace-nowrap">地點</th>
                                <th className="p-2.5 font-bold text-center whitespace-nowrap">數量</th>
                                <th className="p-2.5 font-bold text-right whitespace-nowrap">單價</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-retro-text/5">
                              {allPurchaseInstances.map((inst, index) => {
                                const hasPurchaseInfo = inst.purchaseDate || inst.purchasePlace || inst.price !== undefined;
                                if (!hasPurchaseInfo) return null;
                                return (
                                  <tr key={inst.id} className={`text-xs text-retro-text ${inst.isArchived ? 'opacity-50 grayscale' : ''}`}>
                                    <td className="p-2.5 font-mono">{inst.purchaseDate || '-'}</td>
                                    <td className="p-2.5">{inst.purchasePlace || '-'}</td>
                                    <td className="p-2.5 font-mono text-center">{inst.qty || '-'}</td>
                                    <td className="p-2.5 font-mono font-bold text-right text-retro-secondary">{inst.price !== undefined ? `$${inst.price}` : '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {instancesWithPurchaseInfo.length === 0 && (
                            <div className="py-6 text-center text-xs text-stone-400 font-semibold bg-white">
                              暫無購買紀錄
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-center text-stone-400 font-semibold pt-1">
                        💡 提示：點擊右上角的編輯圖示（數量狀況頁籤中）即可新增購買紀錄
                      </p>
                    </div>
                  );
                })()
              ) : (
                /* Tab 3 Content: 使用紀錄 */
                (() => {
                  const allUsageInstances = products
                    .filter(p => p.brand === selectedDetailProduct.brand && p.name === selectedDetailProduct.name)
                    .flatMap(p => p.instances)
                    .filter(inst => inst.usage === '已用完' || inst.usage === '已丟棄' || (inst.usage === '使用中' && inst.openedDate))
                    .sort((a, b) => {
                      if (a.openedDate && b.openedDate) {
                        return new Date(b.openedDate).getTime() - new Date(a.openedDate).getTime();
                      }
                      return 0;
                    });

                  return (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-stone-50 px-3 py-2.5 rounded-xl border border-retro-text/5 flex justify-between items-center">
                        <span className="text-xs font-bold text-retro-text/60">使用紀錄筆數</span>
                        <span className="text-sm font-extrabold text-amber-600 font-mono">
                          總計：{allUsageInstances.length} 筆
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block">
                          ⌛ 從開封到用完/丟棄的時間
                        </span>
                        
                        <div className="overflow-hidden rounded-xl border border-retro-text/5 bg-white shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-stone-50 border-b border-retro-text/5 text-[10px] uppercase text-retro-text/50">
                                <th className="p-2.5 font-bold whitespace-nowrap">狀態</th>
                                <th className="p-2.5 font-bold whitespace-nowrap">期間</th>
                                <th className="p-2.5 font-bold text-right whitespace-nowrap">花費時間</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-retro-text/5">
                              {allUsageInstances.map(inst => {
                                let durationStr = '-';
                                if (inst.openedDate) {
                                  const endD = (inst.usage === '已用完' || inst.usage === '已丟棄') && inst.finishedDate 
                                    ? new Date(inst.finishedDate) 
                                    : new Date();
                                  const startD = new Date(inst.openedDate);
                                  const diffMs = endD.getTime() - startD.getTime();
                                  if (diffMs >= 0) {
                                    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                    const years = Math.floor(totalDays / 365);
                                    const months = Math.floor((totalDays % 365) / 30);
                                    const days = (totalDays % 365) % 30;
                                    
                                    const parts = [];
                                    if (years > 0) parts.push(`${years}年`);
                                    if (months > 0) parts.push(`${months}個月`);
                                    if (years === 0 && months === 0) parts.push(`${days}天`);
                                    durationStr = parts.join('');
                                  }
                                }
                                
                                return (
                                  <tr key={inst.id} className={`text-xs text-retro-text`}>
                                    <td className="p-2.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        inst.usage === '使用中' ? 'bg-green-100 text-green-700' :
                                        inst.usage === '已用完' ? 'bg-stone-200 text-stone-600' :
                                        'bg-red-100 text-red-600'
                                      }`}>
                                        {inst.usage}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono text-[10px] text-stone-500">
                                      <div>{inst.openedDate || '-'}</div>
                                      <div>~ {inst.finishedDate || (inst.usage === '使用中' ? '至今' : '-')}</div>
                                    </td>
                                    <td className="p-2.5 font-bold text-right text-amber-600">{durationStr}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {allUsageInstances.length === 0 && (
                            <div className="py-6 text-center text-xs text-stone-400 font-semibold bg-white">
                              暫無使用紀錄 (需設定開封日期)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
            )}
            
            {/* Quick add instance footer */}
            {selectedDetailProduct.status !== 'archived' && (
              <div className="p-3 border-t border-retro-text/5 bg-stone-50/80 flex gap-2 flex-shrink-0">
                <button 
                  onClick={() => {
                    handleAddAnotherInstanceTrigger(selectedDetailProduct);
                    setSelectedDetailProduct(null);
                  }}
                  className="w-full py-2.5 bg-retro-secondary hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增此產品的其他庫存/規格
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ==================== 9. Custom Confirmation Dialog (Requirement 2: Resolve iframe window.confirm blocks) ==================== */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-white border-2 border-retro-text rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2 text-retro-secondary">
              <Info className="w-5 h-5 flex-shrink-0 text-retro-primary" />
              <span className="font-extrabold text-sm uppercase tracking-wider">{confirmDialog.title}</span>
            </div>
            <p className="text-xs font-bold text-stone-600 leading-relaxed whitespace-pre-line">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all border border-stone-200 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-2 bg-retro-primary hover:opacity-90 text-retro-card font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Image Cropper Modal ==================== */}
      {cropImageSrc && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center animate-fade-in p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
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
                alt="Crop" 
              />
            </ReactCrop>
          </div>
          <div className="p-6 w-full max-w-md space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCropImageSrc(null);
                  setCroppedAreaPixels(null);
                  setImageRef(null);
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 py-3 bg-retro-primary hover:opacity-90 text-retro-card font-extrabold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
              >
                確定剪裁
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 10. Fullscreen Image Modal ==================== */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            referrerPolicy="no-referrer"
            src={fullscreenImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

// Compact Single Product Card Component (Requirement 1: Click outside total card triggers complete detail view)
function ProductCard({ 
  product, 
  onViewDetail,
  onEdit, 
  onArchive,
  onAddAnother,
  onImageClick,
  categoryIcon
}: { 
  product: Product; 
  onViewDetail: (prod: Product) => void; 
  onEdit: (prod: Product, inst: ProductInstance) => void;
  onArchive: (prodId: string, instId: string) => void;
  onAddAnother: (prod: Product) => void;
  onImageClick?: (url: string) => void;
  categoryIcon: string;
}) {
  const instances = product.instances;
  const isArchived = product.status === 'archived';

  // Find standard shortest expiry days to show on outer circle badge
  let minDaysToExpiry = 9999;
  let closestExpiryDate = '';
  instances.forEach(inst => {
    const days = calculateDaysToExpiry(inst.expiry);
    if (days < minDaysToExpiry) {
      minDaysToExpiry = days;
      closestExpiryDate = inst.expiry;
    }
  });

  // Calculate standard warning styles
  const isUrgent = minDaysToExpiry <= 60;
  const totalQty = instances.reduce((sum, inst) => sum + inst.qty, 0);
  const totalUnopenedQty = instances.filter(inst => inst.usage === '未開封').reduce((sum, inst) => sum + inst.qty, 0);
  const hasInUse = instances.some(inst => inst.usage === '使用中');
  const needsRestock = product.threshold > 0 && totalUnopenedQty <= product.threshold;

  return (
    <div 
      onClick={() => onViewDetail(product)}
      className={`py-3.5 pr-4 pl-1.5 sm:pl-2 rounded-2xl flex items-center justify-between bg-white border border-transparent hover:border-retro-primary/30 shadow-sm transition-all duration-300 cursor-pointer active:scale-[0.99] group relative ${isArchived ? 'opacity-60 grayscale' : ''}`}
      title="點擊進入商品完整畫面"
    >
      <div className="flex gap-2.5 items-center min-w-0 flex-1">
        {/* Thumb */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
          {product.photo ? (
            <img 
              referrerPolicy="no-referrer"
              src={product.photo} 
              alt={product.name}
              onClick={(e) => {
                if (onImageClick) {
                  e.stopPropagation();
                  onImageClick(product.photo!);
                }
              }}
              className="max-w-full max-h-full rounded-lg object-contain border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"
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
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasInUse ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></span>
            {product.brand}
          </span>
          <span className="text-sm font-bold font-display text-retro-text leading-snug truncate group-hover:text-retro-primary transition-colors mt-0.5 flex items-center gap-2">
            <span className="truncate">{product.name}</span>
            {needsRestock && (
              <span className="flex-shrink-0 bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Info className="w-3 h-3" />
                補貨
              </span>
            )}
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-semibold text-retro-text/50 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Package className="w-3 h-3 text-retro-primary" />
              共 {totalQty} 件
            </span>
          </div>
        </div>
      </div>

      {/* Right Circle Expiry Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 ml-2 flex-shrink-0">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-stone-50 border border-retro-text/5 flex flex-col items-center justify-center">
            <span className={`text-sm font-bold leading-none ${isUrgent ? 'text-red-500 font-extrabold' : 'text-retro-primary'}`}>
              {minDaysToExpiry !== 9999 ? minDaysToExpiry : '-'}
            </span>
            <span className="text-[8px] text-retro-text/50 font-bold mt-0.5">天到期</span>
          </div>
          {minDaysToExpiry !== 9999 && closestExpiryDate && (
            <span className="text-[9px] font-bold text-retro-text/40 mt-1">
              {closestExpiryDate.replace(/-/g, '/')}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-retro-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

// Inline mini Clock icon
function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
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
          <h1 className="text-2xl font-bold font-display text-retro-text mb-2">用品管理系統</h1>
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

  return <MainApp user={user} />;
}
