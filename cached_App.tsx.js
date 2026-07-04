import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=4508d1f2"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=4508d1f2"; const useState = __vite__cjsImport1_react["useState"]; const useEffect = __vite__cjsImport1_react["useEffect"]; const useRef = __vite__cjsImport1_react["useRef"];
import { onAuthStateChanged } from "/node_modules/.vite/deps/firebase_auth.js?v=4508d1f2";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, deleteField, updateDoc, query } from "/node_modules/.vite/deps/firebase_firestore.js?v=4508d1f2";
import { auth, db, storage, signInWithGoogle, logOut } from "/src/firebase.ts";
import { ref, uploadString, getDownloadURL } from "/node_modules/.vite/deps/firebase_storage.js?v=4508d1f2";
import {
  Sparkles,
  Droplets,
  Pill,
  Settings,
  Camera,
  Plus,
  Search,
  Package,
  Edit3,
  Archive,
  Trash2,
  GripVertical,
  ListTree,
  ChevronDown,
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
  ImageIcon
} from "/node_modules/.vite/deps/lucide-react.js?v=4508d1f2";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from "/src/data.ts";
import Cropper from "/node_modules/.vite/deps/react-easy-crop.js?v=4508d1f2";
import {
  calculateDaysToExpiry,
  calculatePaoExpiry,
  checkAllOpenedExpiredProducts
} from "/src/utils.ts";
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return canvas.toDataURL("image/jpeg", 0.8);
};
const IconMap = {
  sparkles: Sparkles,
  droplets: Droplets,
  pill: Pill,
  package: Package,
  "shopping-bag": ShoppingBag,
  heart: Heart,
  star: Star,
  settings: Settings
};
function CategoryIcon({ name, className = "w-5 h-5" }) {
  const IconComponent = IconMap[name] || Sparkles;
  return /* @__PURE__ */ jsxDEV(IconComponent, { className }, void 0, false, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 96,
    columnNumber: 10
  }, this);
}
function MainApp({ user }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        let loadedCategories = INITIAL_CATEGORIES;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories) {
            loadedCategories = data.categories;
            setCategories(data.categories);
          } else {
            setCategories(INITIAL_CATEGORIES);
          }
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          }
        } else {
          setCategories(INITIAL_CATEGORIES);
        }
        const productsRef = collection(db, "users", user.uid, "products");
        const q = query(productsRef);
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const subProducts = [];
          querySnapshot.forEach((docSnap2) => {
            subProducts.push(docSnap2.data());
          });
          setProducts(subProducts);
        } else if (!docSnap.exists()) {
          setProducts(INITIAL_PRODUCTS);
        }
      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadUserData();
  }, [user.uid]);
  useEffect(() => {
    if (!isDataLoaded) return;
    const saveUserData = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          categories,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
        const productsRef = collection(db, "users", user.uid, "products");
        const snapshot = await getDocs(productsRef);
        const existingData = /* @__PURE__ */ new Map();
        snapshot.forEach((d) => existingData.set(d.id, d.data()));
        const currentIds = new Set(products.map((p) => p.id));
        const writePromises = [];
        for (const id of existingData.keys()) {
          if (!currentIds.has(id)) {
            writePromises.push(deleteDoc(doc(db, "users", user.uid, "products", id)));
          }
        }
        for (const product of products) {
          const existing = existingData.get(product.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(product)) {
            const cleanProduct = JSON.parse(JSON.stringify(product));
            writePromises.push(setDoc(doc(db, "users", user.uid, "products", product.id), cleanProduct));
          }
        }
        if (writePromises.length > 0) {
          await Promise.all(writePromises);
        }
        await updateDoc(userRef, {
          products: deleteField()
        }).catch(() => {
        });
      } catch (err) {
        console.error("Error saving data", err);
        setToastMessage(`儲存失敗: ${err.message || String(err)}`);
      }
    };
    saveUserData();
  }, [categories, products, isDataLoaded, user.uid]);
  const [apiKeys, setApiKeys] = useState(() => {
    let keys = ["", "", ""];
    try {
      const stored = localStorage.getItem(`cosmetics_gemini_api_keys_${user.uid}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          keys = [...parsed, "", "", ""].slice(0, 3);
        }
      } else {
        const oldKey = localStorage.getItem("cosmetics_gemini_api_key");
        if (oldKey) {
          keys[0] = oldKey;
        }
      }
    } catch (e) {
    }
    return keys;
  });
  const apiKeyIndexRef = useRef(0);
  const getGeminiApiKey = () => {
    const validKeys = apiKeys.filter((k) => k.trim().length > 0);
    if (validKeys.length === 0) return null;
    const key = validKeys[apiKeyIndexRef.current % validKeys.length];
    apiKeyIndexRef.current += 1;
    return key;
  };
  const [appTheme, setAppTheme] = useState(() => {
    return localStorage.getItem("cosmetics_theme") || "retro";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (appTheme === "pixel") {
      root.setAttribute("data-theme", "pixel");
    } else if (appTheme === "minimal") {
      root.setAttribute("data-theme", "minimal");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [appTheme]);
  const handleThemeChange = (theme) => {
    setAppTheme(theme);
    localStorage.setItem("cosmetics_theme", theme);
  };
  const [appFontSize, setAppFontSize] = useState(() => {
    return localStorage.getItem("cosmetics_font_size") || "small";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (appFontSize === "small") {
      root.style.fontSize = "16px";
    } else if (appFontSize === "medium") {
      root.style.fontSize = "18px";
    } else if (appFontSize === "large") {
      root.style.fontSize = "20px";
    }
  }, [appFontSize]);
  const handleFontSizeChange = (size) => {
    setAppFontSize(size);
    localStorage.setItem("cosmetics_font_size", size);
  };
  const [currentTab, setCurrentTab] = useState(() => {
    return categories[0]?.id || "makeup";
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [expandedProductIds, setExpandedProductIds] = useState(/* @__PURE__ */ new Set(["prod_1"]));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [aiStatusText, setAiStatusText] = useState("正在處理圖片...");
  const [formBrand, setFormBrand] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("makeup");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formQty, setFormQty] = useState(1);
  const [formCapacity, setFormCapacity] = useState("");
  const [formCapacityUnit, setFormCapacityUnit] = useState("ml");
  const [formUsage, setFormUsage] = useState("使用中");
  const [formThreshold, setFormThreshold] = useState(0);
  const [formExpiry, setFormExpiry] = useState("");
  const [formPaoMonths, setFormPaoMonths] = useState("");
  const [formOpenedDate, setFormOpenedDate] = useState("");
  const [formFinishedDate, setFormFinishedDate] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [formPurchasePlace, setFormPurchasePlace] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [detailActiveTab, setDetailActiveTab] = useState("status");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [isCroppingFormPhoto, setIsCroppingFormPhoto] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);
  const askConfirmation = (title, message, onConfirm) => {
    setConfirmDialog({ title, message, onConfirm });
  };
  const [editingInstanceId, setEditingInstanceId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [isAddingInstanceToExisting, setIsAddingInstanceToExisting] = useState(false);
  const [settingsView, setSettingsView] = useState("menu");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("sparkles");
  const [activeCategoryForSub, setActiveCategoryForSub] = useState(null);
  const [newSubName, setNewSubName] = useState("");
  const [editingSubCatId, setEditingSubCatId] = useState(null);
  const [editingSubIdx, setEditingSubIdx] = useState(null);
  const [editingSubName, setEditingSubName] = useState("");
  const [apiKeyInputs, setApiKeyInputs] = useState(apiKeys);
  const [showApiKey, setShowApiKey] = useState(false);
  const handleSaveApiKey = () => {
    localStorage.setItem(`cosmetics_gemini_api_keys_${user.uid}`, JSON.stringify(apiKeyInputs));
    setApiKeys(apiKeyInputs);
    showToast("Gemini API 金鑰儲存成功！");
  };
  const [expiredPaoItems, setExpiredPaoItems] = useState([]);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [draggedCatIdx, setDraggedCatIdx] = useState(null);
  const [draggedSubIdx, setDraggedSubIdx] = useState(null);
  const [draggedSubCatId, setDraggedSubCatId] = useState(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const formPhotoInputRef = useRef(null);
  const expectedHash = confirmDialog ? "#confirm" : cropImageSrc ? "#crop" : fullscreenImage ? "#image" : showAddForm ? "#add" : selectedDetailProduct ? "#detail" : currentTab === "settings" && settingsView === "category" ? "#settings-category" : currentTab === "settings" && settingsView === "history" ? "#settings-history" : currentTab === "settings" && settingsView === "apikey" ? "#settings-apikey" : "";
  const getHashDepth = (hash) => {
    if (hash === "#confirm") return 5;
    if (hash === "#crop" || hash === "#image") return 4;
    if (hash === "#add" || hash === "#detail") return 3;
    if (hash.startsWith("#settings-")) return 2;
    return 1;
  };
  useEffect(() => {
    const syncUrlToState = () => {
      const currentHash = window.location.hash;
      if (currentHash !== expectedHash) {
        const expectedDepth = getHashDepth(expectedHash);
        const currentDepth = getHashDepth(currentHash);
        if (expectedDepth > currentDepth) {
          window.history.pushState(null, "", expectedHash);
        } else if (expectedDepth < currentDepth) {
          window.history.back();
        } else {
          window.history.replaceState(null, "", expectedHash);
        }
      }
    };
    syncUrlToState();
    window.addEventListener("hashchange", syncUrlToState);
    return () => window.removeEventListener("hashchange", syncUrlToState);
  }, [expectedHash]);
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash === "" || hash === "#") {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== "menu") setSettingsView("menu");
      } else if (hash === "#settings-category") {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== "category") setSettingsView("category");
      } else if (hash === "#settings-history") {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== "history") setSettingsView("history");
      } else if (hash === "#settings-apikey") {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== "apikey") setSettingsView("apikey");
      } else if (hash === "#add") {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setSelectedDetailProduct(null);
      } else if (hash === "#detail") {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [settingsView]);
  useEffect(() => {
    const expired = checkAllOpenedExpiredProducts(products);
    setExpiredPaoItems(expired);
  }, [products]);
  useEffect(() => {
    const expired = checkAllOpenedExpiredProducts(products);
    setExpiredPaoItems(expired);
  }, []);
  useEffect(() => {
    if (!isDataLoaded) return;
    if (currentTab !== "settings" && currentTab !== "history" && !categories.some((c) => c.id === currentTab)) {
      if (categories.length > 0) {
        setCurrentTab(categories[0].id);
      } else {
        setCurrentTab("settings");
      }
    }
  }, [categories, currentTab, isDataLoaded]);
  useEffect(() => {
    if (formUsage === "使用中" && !formOpenedDate) {
      setFormOpenedDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    }
    if ((formUsage === "已用完" || formUsage === "已丟棄") && !formFinishedDate) {
      setFormFinishedDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    }
  }, [formUsage]);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3e3);
  };
  const handlePhotoUpload = (e, isFormPhoto) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setCropImageSrc(result);
        setIsCroppingFormPhoto(isFormPhoto);
      };
      reader.readAsDataURL(file);
    }
  };
  const onCropComplete = (croppedArea, croppedAreaPixels2) => {
    setCroppedAreaPixels(croppedAreaPixels2);
  };
  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      setCropImageSrc(null);
      setCroppedAreaPixels(null);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
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
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        if (isCroppingFormPhoto) {
          const uploadToStorage = async () => {
            if (!user) {
              setToastMessage("請先登入");
              return;
            }
            setIsAnalyzing(true);
            setToastMessage("上傳圖片中...");
            try {
              const storageRef = ref(storage, `users/${user.uid}/products/${Date.now()}.jpg`);
              await uploadString(storageRef, compressedBase64, "data_url");
              const downloadURL = await getDownloadURL(storageRef);
              setFormPhoto(downloadURL);
              setToastMessage("圖片上傳成功");
            } catch (error) {
              console.error("Upload error:", error);
              setToastMessage(`圖片上傳失敗: ${error.message}`);
            } finally {
              setIsAnalyzing(false);
            }
          };
          uploadToStorage();
        } else {
          triggerAiScan(compressedBase64, "image/jpeg");
        }
      };
      img.src = croppedBase64;
    } catch (e) {
      console.error(e);
      showToast("圖片裁切失敗");
    }
  };
  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
  };
  const triggerAiScan = async (base64Data, mimeType) => {
    const activeApiKey = getGeminiApiKey();
    if (!activeApiKey) {
      showToast("尚未設定 API Key，請在設定頁面輸入金鑰！");
      return;
    }
    setIsAnalyzing(true);
    setAiStatusText("正在上傳並解析圖片...");
    const categoryOptions = categories.map(
      (c) => `- ${c.name} (id: ${c.id}), 子分類: ${c.subcategories.join(", ")}`
    ).join("\n");
    try {
      const base64String = base64Data.split(",")[1];
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
            { inlineData: { mimeType: mimeType || "image/jpeg", data: base64String } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      };
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const data = JSON.parse(text.trim());
        setFormBrand(data.brand || "");
        setFormName(data.name || "");
        const matchCat = categories.find((c) => c.id === data.category || c.name.includes(data.category));
        if (matchCat) {
          setFormCategory(matchCat.id);
        } else {
          setFormCategory(categories[0]?.id || "makeup");
        }
        if (data.subcategory) {
          setFormSubcategory(data.subcategory);
        }
        setFormPhoto(base64Data);
        setEditingInstanceId(null);
        setEditingProductId(null);
        setFormQty(1);
        setFormCapacity("");
        setFormCapacityUnit("ml");
        setFormUsage("使用中");
        setFormThreshold(0);
        setFormExpiry("");
        setFormPaoMonths("");
        setFormOpenedDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
        setFormFinishedDate("");
        setShowAddForm(true);
        showToast("AI 影像辨識成功，已將資料填入表單！");
      } else {
        throw new Error("No parsing results returned.");
      }
    } catch (err) {
      console.error(err);
      showToast("AI 辨識失敗，請檢查 API Key 是否正確。");
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleAiWebSearch = async (e) => {
    e.preventDefault();
    const keyword = `${formBrand} ${formName}`.trim();
    if (keyword.length < 2) {
      showToast("請至少輸入品牌或產品名稱再進行搜尋！");
      return;
    }
    const activeApiKey = getGeminiApiKey();
    if (!activeApiKey) {
      showToast("尚未設定 API 金鑰！請至設定頁面設定您的 Gemini API Key。");
      return;
    }
    setIsSearchingAi(true);
    const categoryOptions = categories.map(
      (c) => `- ${c.name} (id: ${c.id}), 子分類: ${c.subcategories.join(", ")}`
    ).join("\n");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Google Search query failed: ${response.status}`);
      }
      const result = await response.json();
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let cleaned = text.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
        }
        const data = JSON.parse(cleaned);
        if (data.brand) setFormBrand(data.brand);
        if (data.name) setFormName(data.name);
        if (data.category && categories.find((c) => c.id === data.category)) {
          setFormCategory(data.category);
        }
        if (data.subcategory) {
          setFormSubcategory(data.subcategory);
        }
        showToast("品名網搜補全完成！");
        return;
      }
    } catch (err) {
      console.warn("Google Search tool failed, trying fallback model generation...", err);
    }
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Fallback model query failed: ${response.status}`);
      }
      const result = await response.json();
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let cleaned = text.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
        }
        const data = JSON.parse(cleaned);
        if (data.brand) setFormBrand(data.brand);
        if (data.name) setFormName(data.name);
        if (data.category && categories.find((c) => c.id === data.category)) {
          setFormCategory(data.category);
        }
        if (data.subcategory) {
          setFormSubcategory(data.subcategory);
        }
        showToast("品名 AI 補全完成！");
      } else {
        showToast("未搜尋到更完整的產品資訊。");
      }
    } catch (err) {
      console.error("All search/generation attempts failed:", err);
      showToast("網搜補全失敗，請改為手動輸入。");
    } finally {
      setIsSearchingAi(false);
    }
  };
  const handleCatDragStart = (e, index) => {
    setDraggedCatIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCatDragOver = (e) => {
    e.preventDefault();
  };
  const handleCatDrop = (e, index) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === index) return;
    const newCats = [...categories];
    const draggedCat = newCats[draggedCatIdx];
    newCats.splice(draggedCatIdx, 1);
    newCats.splice(index, 0, draggedCat);
    setCategories(newCats);
    setDraggedCatIdx(null);
    showToast("大分類排序已更新！");
  };
  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showToast("請輸入大分類名稱！");
      return;
    }
    const newId = `cat_${Date.now()}`;
    const newCat = {
      id: newId,
      name: newCatName.trim(),
      icon: newCatIcon,
      subcategories: []
    };
    setCategories([...categories, newCat]);
    setNewCatName("");
    showToast(`已成功建立大分類「${newCat.name}」！`);
  };
  const handleDeleteCategory = (catId) => {
    if (categories.length <= 1) {
      showToast("至少必須保留一個分類！");
      return;
    }
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    askConfirmation(
      "刪除大分類",
      `確定要刪除「${cat.name}」分類嗎？
(注意：該分類下的所有商品在主畫面中將暫時無法顯示)`,
      () => {
        setCategories(categories.filter((c) => c.id !== catId));
        showToast(`已刪除大分類「${cat.name}」`);
      }
    );
  };
  const handleSubDragStart = (e, categoryId, index) => {
    setDraggedSubIdx(index);
    setDraggedSubCatId(categoryId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleSubDragOver = (e) => {
    e.preventDefault();
  };
  const handleSubDrop = (e, categoryId, index) => {
    e.preventDefault();
    if (draggedSubIdx === null || draggedSubCatId !== categoryId || draggedSubIdx === index) return;
    const updated = categories.map((cat) => {
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
    showToast("小分類拖曳排序已更新！");
  };
  const handleAddSubcategory = (catId) => {
    if (!newSubName.trim()) {
      showToast("請輸入小分類名稱！");
      return;
    }
    const updated = categories.map((cat) => {
      if (cat.id === catId) {
        if (cat.subcategories.includes(newSubName.trim())) {
          showToast("此小分類名稱已存在於大分類中！");
          return cat;
        }
        return { ...cat, subcategories: [...cat.subcategories, newSubName.trim()] };
      }
      return cat;
    });
    setCategories(updated);
    setNewSubName("");
    showToast(`已在分類中新增小分類「${newSubName.trim()}」`);
  };
  const handleDeleteSubcategory = (catId, subIndex) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const subName = cat.subcategories[subIndex];
    askConfirmation(
      "刪除小分類",
      `確定要刪除「${cat.name}」底下的小分類「${subName}」嗎？`,
      () => {
        const updated = categories.map((c) => {
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
  const handleSaveSubcategory = (catId, subIndex) => {
    if (!editingSubName.trim()) {
      showToast("小分類名稱不能為空！");
      return;
    }
    const updated = categories.map((c) => {
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
    showToast("小分類名稱已成功修改！");
  };
  const toggleExpandProduct = (prodId) => {
    const next = new Set(expandedProductIds);
    if (next.has(prodId)) {
      next.delete(prodId);
    } else {
      next.add(prodId);
    }
    setExpandedProductIds(next);
  };
  const clearForm = () => {
    setFormBrand("");
    setFormName("");
    setFormCategory(currentTab !== "settings" && currentTab !== "history" ? currentTab : categories[0]?.id || "makeup");
    setFormSubcategory("");
    setFormQty(1);
    setFormCapacity("");
    setFormCapacityUnit("ml");
    setFormUsage("使用中");
    setFormThreshold(0);
    setFormExpiry("");
    setFormPaoMonths("");
    setFormOpenedDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    setFormFinishedDate("");
    setFormPhoto("");
    setFormPurchaseDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    setFormPurchasePlace("");
    setFormPrice("");
    setEditingInstanceId(null);
    setEditingProductId(null);
    setIsEditingMaster(false);
    setIsAddingInstanceToExisting(false);
  };
  const handleTabChange = (tabId) => {
    setCurrentTab(tabId);
    setShowAddForm(false);
    setSearchKeyword("");
    clearForm();
    if (tabId === "settings") {
      setSettingsView("menu");
    }
  };
  const handleFormSave = (e, forceAsNewInstance = false) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("請輸入產品名稱！");
      return;
    }
    if (formQty < 1) {
      showToast("數量必須大於0！");
      return;
    }
    let subcatValue = formSubcategory.trim();
    if (subcatValue === "自訂子分類" || !subcatValue) {
      subcatValue = "其他";
    }
    setCategories((prev) => {
      let isUpdated = false;
      const newCats = prev.map((cat) => {
        if (cat.id === formCategory && !cat.subcategories.includes(subcatValue)) {
          isUpdated = true;
          return { ...cat, subcategories: [...cat.subcategories, subcatValue] };
        }
        return cat;
      });
      return isUpdated ? newCats : prev;
    });
    const paoVal = formPaoMonths ? parseInt(formPaoMonths) : void 0;
    const openedVal = formUsage === "使用中" || formUsage === "已用完" || formUsage === "已丟棄" ? formOpenedDate : void 0;
    const finishedVal = formUsage === "已用完" || formUsage === "已丟棄" ? formFinishedDate : void 0;
    const purchaseDateVal = formPurchaseDate || void 0;
    const purchasePlaceVal = formPurchasePlace.trim() || void 0;
    const priceVal = formPrice ? parseFloat(formPrice) : void 0;
    const finalCapacity = formCapacity ? `${formCapacity}${formCapacityUnit}` : "";
    if (isEditingMaster && editingProductId) {
      const updatedProducts = products.map((prod) => {
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
      showToast("產品大品項資料修改成功！");
      setShowAddForm(false);
      clearForm();
      return;
    }
    if (editingInstanceId && editingProductId && !forceAsNewInstance) {
      const updatedProducts = products.map((prod) => {
        if (prod.id === editingProductId) {
          const isMetaChanged = prod.category !== formCategory || prod.subcategory !== subcatValue || prod.brand !== formBrand.trim() || prod.name !== formName.trim();
          if (isMetaChanged) {
            const filteredInstances = prod.instances.filter((inst) => inst.id !== editingInstanceId);
            return { ...prod, instances: filteredInstances };
          } else {
            const updatedInstances = prod.instances.flatMap((inst) => {
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
      }).filter((p) => p.instances.length > 0);
      const isMetaChangedInForm = products.find((p) => p.id === editingProductId)?.category !== formCategory || products.find((p) => p.id === editingProductId)?.subcategory !== subcatValue || products.find((p) => p.id === editingProductId)?.brand !== formBrand.trim() || products.find((p) => p.id === editingProductId)?.name !== formName.trim();
      let targetProdId = editingProductId;
      if (isMetaChangedInForm) {
        const matchProd = updatedProducts.find(
          (p) => p.category === formCategory && p.subcategory === subcatValue && p.brand === formBrand.trim() && p.name === formName.trim() && p.status === "active"
        );
        const newInstances = Array.from({ length: formQty }).map((_, idx) => ({
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
          const matchIndex = updatedProducts.findIndex((p) => p.id === matchProd.id);
          updatedProducts[matchIndex] = {
            ...matchProd,
            instances: [...matchProd.instances, ...newInstances],
            photo: formPhoto || matchProd.photo
          };
          targetProdId = matchProd.id;
        } else {
          const newProduct = {
            id: `prod_${Date.now()}`,
            category: formCategory,
            subcategory: subcatValue,
            brand: formBrand.trim(),
            name: formName.trim(),
            photo: formPhoto || void 0,
            status: "active",
            threshold: Number(formThreshold) || 0,
            instances: newInstances
          };
          updatedProducts.push(newProduct);
          targetProdId = newProduct.id;
        }
      }
      setProducts(updatedProducts);
      const targetProd = updatedProducts.find((p) => p.id === targetProdId);
      if (targetProd) setSelectedDetailProduct(targetProd);
      showToast("明細修改成功！");
    } else {
      const newInstances = Array.from({ length: formQty }).map((_, idx) => ({
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
        existingProductIndex = products.findIndex((p) => p.id === editingProductId);
      } else {
        existingProductIndex = products.findIndex(
          (p) => p.category === formCategory && p.subcategory === subcatValue && p.brand === formBrand.trim() && p.name === formName.trim() && p.status === "active"
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
        setExpandedProductIds((prev) => {
          const next = new Set(prev);
          next.add(updated[existingProductIndex].id);
          return next;
        });
        setSelectedDetailProduct(updated[existingProductIndex]);
      } else {
        const newProd = {
          id: `prod_${Date.now()}`,
          category: formCategory,
          subcategory: subcatValue,
          brand: formBrand.trim(),
          name: formName.trim(),
          photo: formPhoto || void 0,
          status: "active",
          threshold: Number(formThreshold) || 0,
          instances: newInstances
        };
        setProducts([...products, newProd]);
        setExpandedProductIds((prev) => {
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
    setCurrentTab(formCategory);
  };
  const handleEditInstanceTrigger = (prod, inst) => {
    setEditingProductId(prod.id);
    setEditingInstanceId(inst.id);
    setIsEditingMaster(false);
    setIsAddingInstanceToExisting(false);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormQty(inst.qty);
    let cap = inst.capacity || "";
    let unit = "ml";
    if (cap.endsWith("ml")) {
      unit = "ml";
      cap = cap.slice(0, -2);
    } else if (cap.endsWith("g")) {
      unit = "g";
      cap = cap.slice(0, -1);
    } else if (cap.endsWith("個")) {
      unit = "個";
      cap = cap.slice(0, -1);
    } else if (cap.endsWith("罐")) {
      unit = "罐";
      cap = cap.slice(0, -1);
    } else if (cap.endsWith("錠")) {
      unit = "錠";
      cap = cap.slice(0, -1);
    } else if (cap.endsWith("顆")) {
      unit = "顆";
      cap = cap.slice(0, -1);
    }
    setFormCapacity(cap.trim());
    setFormCapacityUnit(unit);
    setFormUsage(inst.usage);
    setFormThreshold(prod.threshold ? String(prod.threshold) : "");
    setFormExpiry(inst.expiry);
    setFormPaoMonths(inst.paoMonths ? String(inst.paoMonths) : "");
    setFormOpenedDate(inst.openedDate || "");
    setFormFinishedDate(inst.finishedDate || "");
    setFormPhoto(prod.photo || "");
    setFormPurchaseDate(inst.purchaseDate || "");
    setFormPurchasePlace(inst.purchasePlace || "");
    setFormPrice(inst.price !== void 0 ? String(inst.price) : "");
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById("manual-add-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  const handleEditProductMasterTrigger = (prod) => {
    setEditingProductId(prod.id);
    setEditingInstanceId(null);
    setIsEditingMaster(true);
    setIsAddingInstanceToExisting(false);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormPhoto(prod.photo || "");
    setFormQty(1);
    setFormCapacity("");
    setFormCapacityUnit("ml");
    setFormUsage("使用中");
    setFormThreshold(0);
    setFormExpiry("");
    setFormPaoMonths("");
    setFormOpenedDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    setFormFinishedDate("");
    setFormPurchaseDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    setFormPurchasePlace("");
    setFormPrice("");
    setShowAddForm(true);
    setSelectedDetailProduct(null);
    setTimeout(() => {
      document.getElementById("manual-add-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  const handleSaveAsNewInstance = () => {
    const fakeEvent = { preventDefault: () => {
    } };
    handleFormSave(fakeEvent, true);
  };
  const handleArchiveInstance = (prodId, instId) => {
    askConfirmation(
      "移至歷史紀錄（封存）",
      "確定要將這個規格明細移到歷史紀錄（封存）嗎？封存後將移至歷史分頁。",
      () => {
        let archivedInstance = null;
        let targetProduct = null;
        const nextProducts = products.map((prod) => {
          if (prod.id === prodId) {
            targetProduct = prod;
            archivedInstance = prod.instances.find((i) => i.id === instId) || null;
            return {
              ...prod,
              instances: prod.instances.filter((i) => i.id !== instId)
            };
          }
          return prod;
        }).filter((p) => p.instances.length > 0);
        if (archivedInstance && targetProduct) {
          const newArchivedProd = {
            id: `prod_archived_${Date.now()}`,
            category: targetProduct.category,
            subcategory: targetProduct.subcategory,
            brand: targetProduct.brand,
            name: targetProduct.name,
            photo: targetProduct.photo,
            status: "archived",
            threshold: targetProduct.threshold,
            instances: [{
              ...archivedInstance,
              id: `inst_archived_${Date.now()}`
            }]
          };
          const finalProducts = [...nextProducts, newArchivedProd];
          setProducts(finalProducts);
          showToast("已將該明細歸檔至歷史紀錄！");
          if (selectedDetailProduct && selectedDetailProduct.id === prodId) {
            const updatedDetailedProduct = finalProducts.find((p) => p.id === prodId);
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
  const handleDeleteInstance = () => {
    if (editingInstanceId && editingProductId) {
      askConfirmation(
        "永久刪除明細",
        "確定要永久刪除此商品明細嗎？此操作無法復原。",
        () => {
          const nextProducts = products.map((prod) => {
            if (prod.id === editingProductId) {
              return {
                ...prod,
                instances: prod.instances.filter((i) => i.id !== editingInstanceId)
              };
            }
            return prod;
          }).filter((p) => p.instances.length > 0);
          setProducts(nextProducts);
          setShowAddForm(false);
          clearForm();
          showToast("明細已成功永久刪除！");
          if (selectedDetailProduct && selectedDetailProduct.id === editingProductId) {
            const updatedDetailedProduct = nextProducts.find((p) => p.id === editingProductId);
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
  const handleDeleteInstanceDirect = (prodId, instId) => {
    askConfirmation(
      "永久刪除明細",
      "確定要永久刪除此規格明細嗎？此操作無法復原。",
      () => {
        const nextProducts = products.map((prod) => {
          if (prod.id === prodId) {
            return {
              ...prod,
              instances: prod.instances.filter((i) => i.id !== instId)
            };
          }
          return prod;
        }).filter((p) => p.instances.length > 0);
        setProducts(nextProducts);
        showToast("規格明細已成功永久刪除！");
        if (selectedDetailProduct && selectedDetailProduct.id === prodId) {
          const updatedDetailedProduct = nextProducts.find((p) => p.id === prodId);
          if (updatedDetailedProduct) {
            setSelectedDetailProduct(updatedDetailedProduct);
          } else {
            setSelectedDetailProduct(null);
          }
        }
      }
    );
  };
  const handleAddAnotherInstanceTrigger = (prod) => {
    clearForm();
    setEditingProductId(prod.id);
    setIsAddingInstanceToExisting(true);
    setIsEditingMaster(false);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormUsage("未開封");
    setFormPhoto(prod.photo || "");
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById("manual-add-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  const activeProducts = products.filter((prod) => {
    if (searchKeyword.trim()) {
      if (prod.status !== "active") return false;
      const term = searchKeyword.toLowerCase();
      const catName = categories.find((c) => c.id === prod.category)?.name || "";
      return prod.brand.toLowerCase().includes(term) || prod.name.toLowerCase().includes(term) || prod.subcategory.toLowerCase().includes(term) || catName.toLowerCase().includes(term);
    }
    if (currentTab === "history") {
      if (prod.status !== "archived") return false;
    } else {
      if (prod.status !== "active") return false;
      if (prod.category !== currentTab) return false;
    }
    return true;
  });
  const getSubcategoryStats = (subName, categoryId) => {
    const matchedProds = products.filter((p) => p.status === "active" && p.category === categoryId && p.subcategory === subName);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    matchedProds.forEach((p) => {
      p.instances.forEach((i) => {
        totalQty += i.qty;
      });
    });
    return { count: totalCount, qty: totalQty };
  };
  const getCategoryStats = (categoryId) => {
    const matchedProds = products.filter((p) => p.status === "active" && p.category === categoryId);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    matchedProds.forEach((p) => {
      p.instances.forEach((i) => {
        totalQty += i.qty;
      });
    });
    return { count: totalCount, qty: totalQty };
  };
  const currentFormCategoryObj = categories.find((c) => c.id === formCategory);
  const currentFormSubcategories = currentFormCategoryObj ? currentFormCategoryObj.subcategories : [];
  if (!isDataLoaded) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-retro-bg flex items-center justify-center font-sans", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-8 h-8 text-retro-primary animate-pulse" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1580,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-retro-text font-bold text-sm tracking-wider uppercase", children: "Loading..." }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1581,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1579,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1578,
      columnNumber: 7
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-retro-bg text-retro-text relative pb-24 font-sans select-none antialiased", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] flex justify-between items-center bg-retro-bg/90 backdrop-blur-sm sticky top-0 z-40 border-b border-retro-text/10 max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-bold font-display tracking-tight flex items-center gap-2", children: /* @__PURE__ */ jsxDEV("span", { children: "用品管理系統" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1592,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1591,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => galleryInputRef.current?.click(),
            className: "w-11 h-11 rounded-full bg-retro-primary text-retro-card flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all hover:brightness-105",
            title: "照片辨識新增",
            children: /* @__PURE__ */ jsxDEV(ImageIcon, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1600,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1595,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => fileInputRef.current?.click(),
            className: "w-11 h-11 rounded-full bg-retro-primary text-retro-card flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all hover:brightness-105",
            title: "拍照辨識新增",
            children: /* @__PURE__ */ jsxDEV(Camera, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1607,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1602,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              if (showAddForm) {
                setShowAddForm(false);
                clearForm();
              } else {
                clearForm();
                setShowAddForm(true);
                setTimeout(() => {
                  document.getElementById("manual-add-form")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            },
            className: "w-11 h-11 rounded-full bg-retro-secondary text-retro-card flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all hover:brightness-105",
            title: "手動輸入新增",
            children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-5 h-5 transition-transform", style: { transform: showAddForm ? "rotate(45deg)" : "rotate(0)" } }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1625,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1609,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1594,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1590,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "file",
        ref: fileInputRef,
        onChange: (e) => handlePhotoUpload(e, false),
        accept: "image/*",
        capture: "environment",
        className: "hidden"
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1631,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "file",
        ref: galleryInputRef,
        onChange: (e) => handlePhotoUpload(e, false),
        accept: "image/*",
        className: "hidden"
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1639,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "max-w-2xl mx-auto px-4 mt-2", children: [
      expiredPaoItems.length > 0 && showNotificationBanner && /* @__PURE__ */ jsxDEV("div", { className: "mb-4 p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 shadow-sm relative overflow-hidden animate-fade-in", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsxDEV(AlertTriangle, { className: "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1652,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-sm flex justify-between items-center pr-6", children: /* @__PURE__ */ jsxDEV("span", { children: "📢 開封過期變質警報！" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1655,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1654,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-red-800 mt-1", children: "以下產品已超出開封後建議使用期限，極易滋生細菌變質，請儘速替換：" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1657,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("ul", { className: "mt-2 flex flex-col gap-1.5 max-h-32 overflow-y-auto", children: expiredPaoItems.map((item, idx) => /* @__PURE__ */ jsxDEV("li", { className: "text-xs flex flex-wrap justify-between items-center bg-red-50 p-2 rounded border border-red-200", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-red-950", children: [
                  "[",
                  item.product.brand,
                  "] ",
                  item.product.name
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1664,
                  columnNumber: 25
                }, this),
                item.instance.capacity && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] bg-red-200 text-red-800 px-1 rounded", children: item.instance.capacity }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1665,
                  columnNumber: 52
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1663,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "text-[11px] font-bold text-red-700", children: [
                "已過期 ",
                item.daysOverdue,
                " 天 (開封: ",
                item.instance.openedDate,
                ")"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1667,
                columnNumber: 23
              }, this)
            ] }, idx, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1662,
              columnNumber: 21
            }, this)) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1660,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1653,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1651,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setShowNotificationBanner(false),
            className: "absolute top-3 right-3 text-red-600 hover:text-red-950 p-0.5 rounded-full hover:bg-red-200 transition-colors",
            children: /* @__PURE__ */ jsxDEV(X, { className: "w-4 h-4" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1679,
              columnNumber: 15
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1675,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1650,
        columnNumber: 11
      }, this),
      currentTab !== "settings" && /* @__PURE__ */ jsxDEV("div", { className: "relative mb-5", children: [
        /* @__PURE__ */ jsxDEV(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-retro-text/40 w-4.5 h-4.5" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1687,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            placeholder: "搜尋品牌、產品或小分類...",
            value: searchKeyword,
            onChange: (e) => setSearchKeyword(e.target.value),
            className: "w-full pl-11 pr-4 py-3 bg-retro-card rounded-2xl text-sm border border-retro-text/5 focus:outline-none focus:ring-1 focus:ring-retro-primary shadow-inner text-retro-text font-medium"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1688,
            columnNumber: 13
          },
          this
        ),
        searchKeyword && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setSearchKeyword(""),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-retro-text/50 hover:text-retro-text p-1",
            children: /* @__PURE__ */ jsxDEV(X, { className: "w-4 h-4" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1700,
              columnNumber: 17
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1696,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1686,
        columnNumber: 11
      }, this),
      isAnalyzing && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-stone-900/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-retro-card p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-retro-primary/20", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-full border-4 border-retro-primary border-t-transparent animate-spin" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1711,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("h3", { className: "font-bold font-display text-lg tracking-wide flex items-center gap-1.5 justify-center", children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-5 h-5 text-retro-secondary animate-pulse" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1713,
            columnNumber: 19
          }, this),
          "AI 影像辨識中..."
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1712,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-retro-bg rounded-full h-2 overflow-hidden mt-1", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-retro-primary h-full animate-progress", style: { width: "75%" } }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1717,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1716,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-retro-text/75 font-semibold mt-1", children: aiStatusText }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1719,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1710,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1709,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1708,
        columnNumber: 11
      }, this),
      showAddForm && /* @__PURE__ */ jsxDEV("div", { id: "manual-add-form", className: "mb-6 p-5 bg-retro-card rounded-2xl border border-retro-primary/30 shadow-md animate-fade-in", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-lg font-bold text-retro-secondary flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1730,
              columnNumber: 17
            }, this),
            isEditingMaster ? "編輯大品項" : editingInstanceId ? "修改明細資訊" : isAddingInstanceToExisting ? "新增規格明細" : "確認新增品項"
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1729,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => {
                setShowAddForm(false);
                clearForm();
              },
              className: "text-retro-text/50 hover:text-retro-text p-1 rounded-full hover:bg-retro-bg",
              children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1741,
                columnNumber: 17
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1733,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1728,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("form", { onSubmit: handleFormSave, className: "space-y-4", children: [
          !editingInstanceId && !isAddingInstanceToExisting && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1.5", children: "產品照片 (選填)" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1751,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "file",
                    ref: formPhotoInputRef,
                    onChange: (e) => handlePhotoUpload(e, true),
                    accept: "image/*",
                    className: "hidden"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1755,
                    columnNumber: 23
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: () => formPhotoInputRef.current?.click(),
                    className: "w-10 h-10 rounded-xl bg-retro-primary text-retro-card flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all",
                    children: /* @__PURE__ */ jsxDEV(Camera, { className: "w-4 h-4" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1767,
                      columnNumber: 25
                    }, this)
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1762,
                    columnNumber: 23
                  },
                  this
                ),
                formPhoto ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "img",
                    {
                      src: formPhoto,
                      alt: "預覽",
                      className: "w-10 h-10 rounded-lg object-cover border border-retro-text/10"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1771,
                      columnNumber: 27
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      type: "button",
                      onClick: () => setFormPhoto(""),
                      className: "text-xs text-red-500 font-bold hover:underline",
                      children: "移除"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1776,
                      columnNumber: 27
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1770,
                  columnNumber: 25
                }, this) : /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-retro-text/40 font-medium", children: "尚未選擇照片" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1785,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1754,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1750,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "主類別" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1793,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    value: formCategory,
                    onChange: (e) => {
                      setFormCategory(e.target.value);
                      setFormSubcategory("");
                    },
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium",
                    children: categories.map((cat) => /* @__PURE__ */ jsxDEV("option", { value: cat.id, children: cat.name }, cat.id, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1803,
                      columnNumber: 27
                    }, this))
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1794,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1792,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "子分類" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1809,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "select",
                    {
                      value: currentFormSubcategories.includes(formSubcategory) ? formSubcategory : formSubcategory === "" ? "" : "custom",
                      onChange: (e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setFormSubcategory("自訂子分類");
                        } else {
                          setFormSubcategory(val);
                        }
                      },
                      className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium",
                      children: [
                        /* @__PURE__ */ jsxDEV("option", { value: "", children: "請選擇子分類" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 1829,
                          columnNumber: 27
                        }, this),
                        currentFormSubcategories.map((sub, idx) => /* @__PURE__ */ jsxDEV("option", { value: sub, children: sub }, idx, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 1831,
                          columnNumber: 29
                        }, this)),
                        /* @__PURE__ */ jsxDEV("option", { value: "custom", children: "✍️ 自訂其他..." }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 1833,
                          columnNumber: 27
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1811,
                      columnNumber: 25
                    },
                    this
                  ),
                  formSubcategory !== "" && !currentFormSubcategories.includes(formSubcategory) && /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "text",
                      placeholder: "請輸入自訂子分類名稱",
                      value: formSubcategory === "自訂子分類" ? "" : formSubcategory,
                      onChange: (e) => setFormSubcategory(e.target.value),
                      className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1837,
                      columnNumber: 27
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1810,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1808,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1791,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "品牌名稱" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1851,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  placeholder: "請輸入品牌",
                  value: formBrand,
                  onChange: (e) => setFormBrand(e.target.value),
                  className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1852,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1850,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-1", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-retro-text/75", children: "產品名稱" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1864,
                  columnNumber: 23
                }, this),
                isSearchingAi && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-retro-primary animate-pulse font-semibold", children: "AI 正在網搜中..." }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1865,
                  columnNumber: 41
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1863,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    placeholder: "請輸入產品名稱",
                    value: formName,
                    onChange: (e) => setFormName(e.target.value),
                    className: "flex-1 p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1868,
                    columnNumber: 23
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: handleAiWebSearch,
                    className: "w-10 h-10 rounded-xl bg-retro-primary text-retro-card flex items-center justify-center hover:opacity-90 active:scale-95 transition-all flex-shrink-0",
                    title: "網路搜尋官方完整品牌與品名",
                    children: /* @__PURE__ */ jsxDEV(Search, { className: "w-4 h-4" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1881,
                      columnNumber: 25
                    }, this)
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1875,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1867,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1862,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "補貨門檻數量" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1888,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "number",
                  min: "0",
                  placeholder: "低於此數量時提醒 (0)",
                  value: formThreshold === 0 ? "" : formThreshold,
                  onChange: (e) => setFormThreshold(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0)),
                  className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1889,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-retro-text/50 mt-1", children: "此品項所有未開封明細之數量加總低於此設定時，會顯示補貨提醒" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1897,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1887,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1748,
            columnNumber: 17
          }, this),
          !isEditingMaster && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "數量" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1908,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "number",
                    placeholder: "例如: 1",
                    value: formQty === 0 ? "" : formQty,
                    onChange: (e) => setFormQty(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0)),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1909,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1907,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "容量" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1918,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    placeholder: "例如: 30",
                    value: formCapacity,
                    onChange: (e) => setFormCapacity(e.target.value),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1919,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1917,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "單位" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1928,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    value: formCapacityUnit,
                    onChange: (e) => setFormCapacityUnit(e.target.value),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium",
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "ml", children: "ml" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1934,
                        columnNumber: 21
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "g", children: "g" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1935,
                        columnNumber: 21
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "個", children: "個" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1936,
                        columnNumber: 21
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "罐", children: "罐" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1937,
                        columnNumber: 21
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "錠", children: "錠" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1938,
                        columnNumber: 21
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "顆", children: "顆" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1939,
                        columnNumber: 21
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1929,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1927,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1906,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "使用狀態" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1946,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: formUsage,
                  onChange: (e) => setFormUsage(e.target.value),
                  className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium",
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "使用中", children: "使用中" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1952,
                      columnNumber: 19
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "未開封", children: "未開封" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1953,
                      columnNumber: 19
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "已用完", children: "已用完" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1954,
                      columnNumber: 19
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "已丟棄", children: "已丟棄" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1955,
                      columnNumber: 19
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1947,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1945,
              columnNumber: 15
            }, this),
            (formUsage === "使用中" || formUsage === "已用完" || formUsage === "已丟棄") && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary", children: [
                  /* @__PURE__ */ jsxDEV(Calendar, { className: "w-3.5 h-3.5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1964,
                    columnNumber: 23
                  }, this),
                  "開封日期"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1963,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "date",
                    value: formOpenedDate,
                    onChange: (e) => setFormOpenedDate(e.target.value),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1967,
                    columnNumber: 21
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1962,
                columnNumber: 19
              }, this),
              formUsage === "使用中" ? /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary", children: [
                  /* @__PURE__ */ jsxDEV(ClockIcon, { className: "w-3.5 h-3.5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1977,
                    columnNumber: 25
                  }, this),
                  "開封後可使用月數"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1976,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "number",
                    min: "1",
                    placeholder: "例如: 6, 12, 24",
                    value: formPaoMonths,
                    onChange: (e) => setFormPaoMonths(e.target.value),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1980,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1975,
                columnNumber: 21
              }, this) : /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary", children: [
                  /* @__PURE__ */ jsxDEV(Calendar, { className: "w-3.5 h-3.5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1992,
                    columnNumber: 25
                  }, this),
                  "結束日期"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1991,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "date",
                    value: formFinishedDate,
                    onChange: (e) => setFormFinishedDate(e.target.value),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1995,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1990,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1961,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "有效期限 (到期日)" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2008,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "date",
                  value: formExpiry,
                  onChange: (e) => setFormExpiry(e.target.value),
                  className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2009,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2007,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-extrabold text-retro-primary/80 uppercase tracking-wider block", children: "🛒 購買與價格紀錄 (選填)" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2019,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "購買日期" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2024,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "date",
                      value: formPurchaseDate,
                      onChange: (e) => setFormPurchaseDate(e.target.value),
                      className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2025,
                      columnNumber: 21
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2023,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "單價 (NTD)" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2033,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      min: "0",
                      placeholder: "例如: 350",
                      value: formPrice,
                      onChange: (e) => setFormPrice(e.target.value),
                      className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2034,
                      columnNumber: 21
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2032,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2022,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-bold text-retro-text/75 mb-1", children: "購買地點 / 管道" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2045,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    placeholder: "例如: 屈臣氏、MOMO、日本代購...",
                    value: formPurchasePlace,
                    onChange: (e) => setFormPurchasePlace(e.target.value),
                    className: "w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-semibold"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2046,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2044,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2018,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1904,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 pt-2", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "submit",
                className: "w-full py-3 bg-retro-secondary text-retro-card font-bold text-sm rounded-xl hover:brightness-105 active:scale-[0.99] transition-all shadow cursor-pointer",
                children: isEditingMaster ? "儲存大品項修改" : editingInstanceId ? "儲存修改" : isAddingInstanceToExisting ? "新增規格明細" : "確認無誤，新增至資料庫"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2061,
                columnNumber: 17
              },
              this
            ),
            editingInstanceId && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: handleSaveAsNewInstance,
                  className: "py-2.5 bg-retro-primary text-retro-card font-bold text-xs rounded-xl hover:brightness-105 transition-all cursor-pointer",
                  title: "保留原明細，以此內容建立一個同商品的新明細項",
                  children: "另存為新明細 (同品項)"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2070,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: handleDeleteInstance,
                  className: "py-2.5 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-all cursor-pointer",
                  children: "永久刪除此明細"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2078,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2069,
              columnNumber: 19
            }, this),
            isEditingMaster && /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (editingProductId) {
                    askConfirmation(
                      "刪除大品項",
                      "確定要永久刪除此大品項及其所有購買明細嗎？此操作無法復原。",
                      () => {
                        setProducts(products.filter((p) => p.id !== editingProductId));
                        setShowAddForm(false);
                        setSelectedDetailProduct(null);
                        clearForm();
                        showToast("大品項已成功刪除！");
                      }
                    );
                  }
                },
                className: "w-full py-2.5 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-all cursor-pointer mt-2",
                children: "永久刪除此大品項 (含所有明細)"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2089,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2060,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1745,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1727,
        columnNumber: 11
      }, this),
      currentTab === "settings" ? (
        /* =================== SETTINGS VIEW =================== */
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-6 pb-20", children: [
          settingsView === "menu" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-bold font-display flex items-center gap-2 text-retro-text mb-4", children: [
              /* @__PURE__ */ jsxDEV(Settings, { className: "w-5 h-5 text-retro-primary" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2123,
                columnNumber: 19
              }, this),
              "設定與分類管理"
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2122,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 gap-3", children: [
              /* @__PURE__ */ jsxDEV("button", { onClick: () => setSettingsView("apikey"), className: "p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-xl bg-retro-primary/10 flex items-center justify-center text-retro-primary", children: /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2130,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2129,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text text-sm", children: "設定 Gemini API 金鑰" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2132,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2128,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2134,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2127,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("button", { onClick: () => setSettingsView("category"), className: "p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-xl bg-retro-secondary/10 flex items-center justify-center text-retro-secondary", children: /* @__PURE__ */ jsxDEV(ListTree, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2140,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2139,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text text-sm", children: "設定與管理分類" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2142,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2138,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2144,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2137,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("button", { onClick: () => setSettingsView("history"), className: "p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600", children: /* @__PURE__ */ jsxDEV(Archive, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2150,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2149,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text text-sm", children: "歷史封存紀錄" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2152,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2148,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2154,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2147,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm flex flex-col gap-4", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600", children: /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2160,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2159,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text text-sm", children: "視覺風格設定" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2162,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2158,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => handleThemeChange("retro"),
                      className: `flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appTheme === "retro" ? "border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm" : "border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20"}`,
                      children: "復古風"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2165,
                      columnNumber: 23
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => handleThemeChange("pixel"),
                      className: `flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appTheme === "pixel" ? "border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm" : "border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20"}`,
                      children: "像素風"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2169,
                      columnNumber: 23
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => handleThemeChange("minimal"),
                      className: `flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appTheme === "minimal" ? "border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm" : "border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20"}`,
                      children: "文青風"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2173,
                      columnNumber: 23
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2164,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2157,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm flex flex-col gap-4", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600", children: /* @__PURE__ */ jsxDEV(Type, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2183,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2182,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text text-sm", children: "字體大小設定" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2185,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2181,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => handleFontSizeChange("small"),
                      className: `flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appFontSize === "small" ? "border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm" : "border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20"}`,
                      children: "小"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2188,
                      columnNumber: 23
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => handleFontSizeChange("medium"),
                      className: `flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appFontSize === "medium" ? "border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm" : "border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20"}`,
                      children: "中"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2192,
                      columnNumber: 23
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => handleFontSizeChange("large"),
                      className: `flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${appFontSize === "large" ? "border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm" : "border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20"}`,
                      children: "大"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2196,
                      columnNumber: 23
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2187,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2180,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "mt-6", children: /* @__PURE__ */ jsxDEV("button", { onClick: logOut, className: "w-full p-4 bg-red-50 border border-red-100 rounded-2xl shadow-sm hover:border-red-200 transition-all flex items-center justify-center group cursor-pointer", children: /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-red-600 text-sm", children: "登出帳號" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2205,
                columnNumber: 23
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2204,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2203,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2126,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2121,
            columnNumber: 15
          }, this),
          settingsView === "apikey" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setSettingsView("menu"), className: "text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2", children: [
              /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-4 h-4 rotate-90" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2215,
                columnNumber: 19
              }, this),
              " 返回設定選單"
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2214,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-5 bg-retro-card rounded-2xl border border-retro-text/10 shadow-sm space-y-3", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-bold text-retro-secondary flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4.5 h-4.5" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2220,
                  columnNumber: 17
                }, this),
                "Gemini AI 金鑰設定"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2219,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-retro-text/60 leading-relaxed font-medium", children: "若要使用「自動網搜補全產品」或「相機拍照影像辨識」功能，請在此處設定您的 Gemini API Key。金鑰會安全保存在您的個人瀏覽器中。" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2223,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
                [0, 1, 2].map((idx) => /* @__PURE__ */ jsxDEV("div", { className: "relative flex-1", children: [
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: showApiKey ? "text" : "password",
                      placeholder: `請輸入 GEMINI_API_KEY ${idx + 1}`,
                      value: apiKeyInputs[idx],
                      onChange: (e) => {
                        const newInputs = [...apiKeyInputs];
                        newInputs[idx] = e.target.value;
                        setApiKeyInputs(newInputs);
                      },
                      className: "w-full py-2 pl-3 pr-10 bg-white border border-retro-text/10 rounded-xl text-xs font-semibold text-retro-text focus:outline-none focus:border-retro-primary"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2229,
                      columnNumber: 21
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      type: "button",
                      onClick: () => setShowApiKey(!showApiKey),
                      className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-retro-text/50 hover:text-retro-text",
                      children: showApiKey ? /* @__PURE__ */ jsxDEV(EyeOff, { className: "w-4 h-4" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2245,
                        columnNumber: 37
                      }, this) : /* @__PURE__ */ jsxDEV(Eye, { className: "w-4 h-4" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2245,
                        columnNumber: 70
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2240,
                      columnNumber: 21
                    },
                    this
                  )
                ] }, idx, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2228,
                  columnNumber: 19
                }, this)),
                /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end pt-1", children: /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: handleSaveApiKey,
                    className: "px-4 py-2 bg-retro-primary text-retro-card text-xs font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxDEV(Check, { className: "w-3.5 h-3.5" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2254,
                        columnNumber: 21
                      }, this),
                      "儲存金鑰"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2250,
                    columnNumber: 19
                  },
                  this
                ) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2249,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2226,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2218,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2213,
            columnNumber: 15
          }, this),
          settingsView === "category" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setSettingsView("menu"), className: "text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2", children: [
              /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-4 h-4 rotate-90" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2266,
                columnNumber: 19
              }, this),
              " 返回設定選單"
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2265,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-5 bg-retro-card rounded-2xl border border-retro-text/10 shadow-sm space-y-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-bold text-retro-secondary flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxDEV(ListTree, { className: "w-4.5 h-4.5" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2272,
                  columnNumber: 19
                }, this),
                "大分類與小分類管理"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2271,
                columnNumber: 17
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2270,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-retro-text/60 leading-relaxed font-medium", children: [
                "可任意新增、編輯、刪減與",
                /* @__PURE__ */ jsxDEV("b", { children: "拖曳排序" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2277,
                  columnNumber: 29
                }, this),
                "大分類與小分類。點擊分類卡片旁的",
                /* @__PURE__ */ jsxDEV("b", { children: "「管理小分類」" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2277,
                  columnNumber: 56
                }, this),
                "即可編輯、新增、刪除及拖曳該小分類的細項！"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2276,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "p-3.5 bg-retro-bg/40 rounded-xl border border-retro-text/5 space-y-3", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-xs text-retro-text/70", children: "新增大分類" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2282,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "text",
                      placeholder: "新分類名稱 (例: 隱形眼鏡)",
                      value: newCatName,
                      onChange: (e) => setNewCatName(e.target.value),
                      className: "flex-1 min-w-[140px] p-2 bg-white border border-retro-text/10 rounded-xl text-xs text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2284,
                      columnNumber: 19
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "select",
                    {
                      value: newCatIcon,
                      onChange: (e) => setNewCatIcon(e.target.value),
                      className: "p-2 bg-white border border-retro-text/10 rounded-xl text-xs font-semibold text-retro-text focus:outline-none",
                      children: [
                        /* @__PURE__ */ jsxDEV("option", { value: "sparkles", children: "✨ 閃亮" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2296,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "droplets", children: "💧 水滴" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2297,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "pill", children: "💊 膠囊" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2298,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "package", children: "📦 盒子" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2299,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "shopping-bag", children: "🛍️ 購物袋" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2300,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "heart", children: "❤️ 愛心" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2301,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "star", children: "⭐ 星星" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2302,
                          columnNumber: 21
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2291,
                      columnNumber: 19
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: handleAddCategory,
                      className: "px-3 py-2 bg-retro-secondary text-retro-card text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2308,
                          columnNumber: 21
                        }, this),
                        "新增大分類"
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2304,
                      columnNumber: 19
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2283,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2281,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "text-xs font-bold text-retro-text/60", children: "大分類清單 (拖曳手把排序)" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2316,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-2.5", children: categories.map((cat, idx) => /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    className: "border border-retro-text/10 rounded-xl bg-white overflow-hidden shadow-sm transition-all",
                    children: [
                      /* @__PURE__ */ jsxDEV(
                        "div",
                        {
                          draggable: true,
                          onDragStart: (e) => handleCatDragStart(e, idx),
                          onDragOver: handleCatDragOver,
                          onDrop: (e) => handleCatDrop(e, idx),
                          className: "flex items-center justify-between p-3 bg-stone-50 border-b border-stone-100 hover:bg-stone-100/50 transition-colors",
                          children: [
                            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                              /* @__PURE__ */ jsxDEV("div", { className: "cursor-grab p-1 hover:bg-stone-200 rounded text-stone-400 active:text-stone-700", children: /* @__PURE__ */ jsxDEV(GripVertical, { className: "w-4 h-4" }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2333,
                                columnNumber: 29
                              }, this) }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2332,
                                columnNumber: 27
                              }, this),
                              /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: /* @__PURE__ */ jsxDEV(CategoryIcon, { name: cat.icon, className: "w-4.5 h-4.5 text-retro-primary" }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2336,
                                columnNumber: 29
                              }, this) }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2335,
                                columnNumber: 27
                              }, this),
                              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-sm text-retro-text", children: cat.name }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2338,
                                columnNumber: 27
                              }, this)
                            ] }, void 0, true, {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 2331,
                              columnNumber: 25
                            }, this),
                            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
                              /* @__PURE__ */ jsxDEV(
                                "button",
                                {
                                  onClick: () => setActiveCategoryForSub(activeCategoryForSub === cat.id ? null : cat.id),
                                  className: "text-[11px] font-bold px-2.5 py-1.5 bg-retro-primary/10 text-retro-primary rounded-lg hover:bg-retro-primary/20 transition-colors flex items-center gap-1",
                                  children: [
                                    /* @__PURE__ */ jsxDEV(ListTree, { className: "w-3.5 h-3.5" }, void 0, false, {
                                      fileName: "/app/applet/src/App.tsx",
                                      lineNumber: 2346,
                                      columnNumber: 29
                                    }, this),
                                    "管理小分類 (",
                                    cat.subcategories.length,
                                    ")"
                                  ]
                                },
                                void 0,
                                true,
                                {
                                  fileName: "/app/applet/src/App.tsx",
                                  lineNumber: 2342,
                                  columnNumber: 27
                                },
                                this
                              ),
                              categories.length > 1 && /* @__PURE__ */ jsxDEV(
                                "button",
                                {
                                  onClick: () => handleDeleteCategory(cat.id),
                                  className: "text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors",
                                  title: "刪除此大分類",
                                  children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-4 h-4" }, void 0, false, {
                                    fileName: "/app/applet/src/App.tsx",
                                    lineNumber: 2355,
                                    columnNumber: 31
                                  }, this)
                                },
                                void 0,
                                false,
                                {
                                  fileName: "/app/applet/src/App.tsx",
                                  lineNumber: 2350,
                                  columnNumber: 29
                                },
                                this
                              )
                            ] }, void 0, true, {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 2341,
                              columnNumber: 25
                            }, this)
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2324,
                          columnNumber: 23
                        },
                        this
                      ),
                      activeCategoryForSub === cat.id && /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-stone-50/50 border-t border-stone-100/60 space-y-3", children: [
                        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsxDEV("div", { className: "text-[11px] font-bold text-retro-secondary flex items-center gap-1", children: /* @__PURE__ */ jsxDEV("span", { children: [
                          "【",
                          cat.name,
                          "】的小分類管理"
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2366,
                          columnNumber: 31
                        }, this) }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2365,
                          columnNumber: 29
                        }, this) }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2364,
                          columnNumber: 27
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                          /* @__PURE__ */ jsxDEV(
                            "input",
                            {
                              type: "text",
                              placeholder: "新小分類名稱 (如: 護底霜)",
                              value: newSubName,
                              onChange: (e) => setNewSubName(e.target.value),
                              onKeyDown: (e) => {
                                if (e.key === "Enter") handleAddSubcategory(cat.id);
                              },
                              className: "flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs text-retro-text focus:outline-none focus:border-retro-primary"
                            },
                            void 0,
                            false,
                            {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 2372,
                              columnNumber: 29
                            },
                            this
                          ),
                          /* @__PURE__ */ jsxDEV(
                            "button",
                            {
                              onClick: () => handleAddSubcategory(cat.id),
                              className: "px-3 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                              children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5" }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2386,
                                columnNumber: 31
                              }, this)
                            },
                            void 0,
                            false,
                            {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 2382,
                              columnNumber: 29
                            },
                            this
                          )
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2371,
                          columnNumber: 27
                        }, this),
                        /* @__PURE__ */ jsxDEV("ul", { className: "space-y-1.5 max-h-56 overflow-y-auto pr-1", children: [
                          cat.subcategories.map((sub, sIdx) => /* @__PURE__ */ jsxDEV(
                            "li",
                            {
                              draggable: true,
                              onDragStart: (e) => handleSubDragStart(e, cat.id, sIdx),
                              onDragOver: handleSubDragOver,
                              onDrop: (e) => handleSubDrop(e, cat.id, sIdx),
                              className: "flex items-center justify-between p-2 bg-white border border-stone-200 rounded-lg text-xs hover:bg-stone-50 transition-colors",
                              children: [
                                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 flex-1 min-w-0 mr-2", children: [
                                  /* @__PURE__ */ jsxDEV("div", { className: "cursor-grab p-0.5 text-stone-400 hover:text-stone-600", children: /* @__PURE__ */ jsxDEV(GripVertical, { className: "w-3.5 h-3.5" }, void 0, false, {
                                    fileName: "/app/applet/src/App.tsx",
                                    lineNumber: 2403,
                                    columnNumber: 37
                                  }, this) }, void 0, false, {
                                    fileName: "/app/applet/src/App.tsx",
                                    lineNumber: 2402,
                                    columnNumber: 35
                                  }, this),
                                  editingSubIdx === sIdx && editingSubCatId === cat.id ? /* @__PURE__ */ jsxDEV(
                                    "input",
                                    {
                                      type: "text",
                                      value: editingSubName,
                                      onChange: (e) => setEditingSubName(e.target.value),
                                      onBlur: () => handleSaveSubcategory(cat.id, sIdx),
                                      onKeyDown: (e) => {
                                        if (e.key === "Enter") handleSaveSubcategory(cat.id, sIdx);
                                      },
                                      autoFocus: true,
                                      className: "flex-1 p-1 py-0.5 border border-stone-400 rounded bg-white text-xs text-stone-800 focus:outline-none"
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName: "/app/applet/src/App.tsx",
                                      lineNumber: 2406,
                                      columnNumber: 37
                                    },
                                    this
                                  ) : /* @__PURE__ */ jsxDEV("span", { className: "truncate font-semibold text-stone-700", children: sub }, void 0, false, {
                                    fileName: "/app/applet/src/App.tsx",
                                    lineNumber: 2418,
                                    columnNumber: 37
                                  }, this)
                                ] }, void 0, true, {
                                  fileName: "/app/applet/src/App.tsx",
                                  lineNumber: 2401,
                                  columnNumber: 33
                                }, this),
                                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
                                  editingSubIdx === sIdx && editingSubCatId === cat.id ? /* @__PURE__ */ jsxDEV(
                                    "button",
                                    {
                                      onClick: () => handleSaveSubcategory(cat.id, sIdx),
                                      className: "text-stone-700 hover:text-stone-900 p-0.5",
                                      children: /* @__PURE__ */ jsxDEV(Check, { className: "w-3.5 h-3.5" }, void 0, false, {
                                        fileName: "/app/applet/src/App.tsx",
                                        lineNumber: 2428,
                                        columnNumber: 39
                                      }, this)
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName: "/app/applet/src/App.tsx",
                                      lineNumber: 2424,
                                      columnNumber: 37
                                    },
                                    this
                                  ) : /* @__PURE__ */ jsxDEV(
                                    "button",
                                    {
                                      onClick: () => {
                                        setEditingSubCatId(cat.id);
                                        setEditingSubIdx(sIdx);
                                        setEditingSubName(sub);
                                      },
                                      className: "text-stone-400 hover:text-stone-700 p-0.5",
                                      title: "編輯小分類名稱",
                                      children: /* @__PURE__ */ jsxDEV(Edit3, { className: "w-3.5 h-3.5" }, void 0, false, {
                                        fileName: "/app/applet/src/App.tsx",
                                        lineNumber: 2440,
                                        columnNumber: 39
                                      }, this)
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName: "/app/applet/src/App.tsx",
                                      lineNumber: 2431,
                                      columnNumber: 37
                                    },
                                    this
                                  ),
                                  /* @__PURE__ */ jsxDEV(
                                    "button",
                                    {
                                      onClick: () => handleDeleteSubcategory(cat.id, sIdx),
                                      className: "text-red-400 hover:text-red-600 p-0.5",
                                      title: "刪除小分類",
                                      children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-3.5 h-3.5" }, void 0, false, {
                                        fileName: "/app/applet/src/App.tsx",
                                        lineNumber: 2448,
                                        columnNumber: 37
                                      }, this)
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName: "/app/applet/src/App.tsx",
                                      lineNumber: 2443,
                                      columnNumber: 35
                                    },
                                    this
                                  )
                                ] }, void 0, true, {
                                  fileName: "/app/applet/src/App.tsx",
                                  lineNumber: 2422,
                                  columnNumber: 33
                                }, this)
                              ]
                            },
                            sIdx,
                            true,
                            {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 2393,
                              columnNumber: 31
                            },
                            this
                          )),
                          cat.subcategories.length === 0 && /* @__PURE__ */ jsxDEV("li", { className: "text-center text-stone-400 text-[10px] py-4 bg-white border border-stone-100 rounded-lg", children: "尚無小分類，請在上方新增" }, void 0, false, {
                            fileName: "/app/applet/src/App.tsx",
                            lineNumber: 2454,
                            columnNumber: 31
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2391,
                          columnNumber: 27
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2363,
                        columnNumber: 25
                      }, this)
                    ]
                  },
                  cat.id,
                  true,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2319,
                    columnNumber: 21
                  },
                  this
                )) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2317,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2315,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2269,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2264,
            columnNumber: 15
          }, this),
          settingsView === "history" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setSettingsView("menu"), className: "text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2", children: [
              /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-4 h-4 rotate-90" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2472,
                columnNumber: 19
              }, this),
              " 返回設定選單"
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2471,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "mb-1 bg-retro-card/40 px-3.5 py-2.5 rounded-xl border border-retro-text/5 text-xs text-retro-text font-bold flex items-center justify-between", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "歷史封存紀錄" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2475,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-retro-secondary bg-retro-secondary/10 px-2 py-0.5 rounded-full", children: [
                products.filter((p) => p.status === "archived").length,
                " 件"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2476,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2474,
              columnNumber: 17
            }, this),
            (() => {
              const archivedProducts = products.filter((p) => p.status === "archived" && (searchKeyword ? p.name.includes(searchKeyword) || p.brand.includes(searchKeyword) : true));
              if (archivedProducts.length === 0) {
                return /* @__PURE__ */ jsxDEV("div", { className: "text-center py-12 bg-retro-card rounded-2xl border border-retro-text/10", children: /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-retro-text/50 font-medium", children: "尚無符合的封存商品" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2486,
                  columnNumber: 25
                }, this) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2485,
                  columnNumber: 23
                }, this);
              }
              return /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: archivedProducts.map((prod) => /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV(
                ProductCard,
                {
                  product: prod,
                  onViewDetail: setSelectedDetailProduct,
                  onEdit: handleEditInstanceTrigger,
                  onArchive: handleArchiveInstance,
                  onAddAnother: handleAddAnotherInstanceTrigger,
                  onImageClick: setFullscreenImage,
                  categoryIcon: categories.find((c) => c.id === prod.category)?.icon || "sparkles"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2494,
                  columnNumber: 27
                },
                this
              ) }, prod.id, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2493,
                columnNumber: 25
              }, this)) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2491,
                columnNumber: 21
              }, this);
            })()
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2470,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2119,
          columnNumber: 11
        }, this)
      ) : (
        /* =================== MAIN LIST VIEW =================== */
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          !searchKeyword.trim() ? /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-1 bg-retro-card/40 px-3.5 py-2.5 rounded-xl border border-retro-text/5 text-xs text-retro-text", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text/80", children: [
              "分類：",
              categories.find((c) => c.id === currentTab)?.name || ""
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2517,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-retro-text/70 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxDEV("span", { children: [
                "共 ",
                getCategoryStats(currentTab).count,
                " 品項"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2521,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-retro-text/30", children: "|" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2522,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(Package, { className: "w-3.5 h-3.5 text-retro-primary" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2523,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "總庫存 ",
                getCategoryStats(currentTab).qty
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2524,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2520,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2516,
            columnNumber: 15
          }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-1 bg-retro-card/40 px-3.5 py-2.5 rounded-xl border border-retro-text/5 text-xs text-retro-text", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-retro-text/80", children: "搜尋結果" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2529,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-retro-text/70 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxDEV("span", { children: [
                "共 ",
                activeProducts.length,
                " 品項"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2533,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-retro-text/30", children: "|" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2534,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(Package, { className: "w-3.5 h-3.5 text-retro-primary" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2535,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "總庫存 ",
                activeProducts.reduce((sum, p) => sum + p.instances.reduce((s, i) => s + i.qty, 0), 0)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2536,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2532,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2528,
            columnNumber: 15
          }, this),
          (() => {
            if (searchKeyword.trim()) {
              if (activeProducts.length === 0) {
                return /* @__PURE__ */ jsxDEV("div", { className: "text-center py-12 bg-retro-card rounded-2xl border border-retro-text/10", children: /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-retro-text/50 font-semibold", children: "尚無符合的商品" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2548,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2547,
                  columnNumber: 21
                }, this);
              }
              return /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: activeProducts.map((prod) => /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV(
                ProductCard,
                {
                  product: prod,
                  onViewDetail: setSelectedDetailProduct,
                  onEdit: handleEditInstanceTrigger,
                  onArchive: handleArchiveInstance,
                  onAddAnother: handleAddAnotherInstanceTrigger,
                  onImageClick: setFullscreenImage,
                  categoryIcon: categories.find((c) => c.id === prod.category)?.icon || "sparkles"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2556,
                  columnNumber: 25
                },
                this
              ) }, prod.id, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2555,
                columnNumber: 23
              }, this)) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2553,
                columnNumber: 19
              }, this);
            }
            const currentCatObj = categories.find((c) => c.id === currentTab);
            if (!currentCatObj) return null;
            const predefinedSubcats = currentCatObj.subcategories;
            const usedSubcats = Array.from(new Set(activeProducts.map((p) => p.subcategory)));
            const customSubcats = usedSubcats.filter((sub) => !predefinedSubcats.includes(sub));
            const allSubcatGroups = [...predefinedSubcats, ...customSubcats];
            const nonAndEmptyGroups = allSubcatGroups.filter((subName) => {
              const groupProds = activeProducts.filter((p) => p.subcategory === subName);
              return groupProds.length > 0;
            });
            if (nonAndEmptyGroups.length === 0) {
              return /* @__PURE__ */ jsxDEV("div", { className: "text-center py-12 bg-retro-card rounded-2xl border border-retro-text/10", children: [
                /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-retro-text/50 font-semibold", children: "此分類下尚無符合商品" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2592,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => {
                      clearForm();
                      setFormCategory(currentTab);
                      setShowAddForm(true);
                    },
                    className: "mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-retro-primary text-retro-card rounded-xl text-xs font-bold shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2601,
                        columnNumber: 23
                      }, this),
                      "新增商品"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2593,
                    columnNumber: 21
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2591,
                columnNumber: 19
              }, this);
            }
            return /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: nonAndEmptyGroups.map((subName) => {
              const groupProds = activeProducts.filter((p) => p.subcategory === subName);
              const stats = getSubcategoryStats(subName, currentTab);
              return /* @__PURE__ */ jsxDEV("div", { className: "space-y-2.5 animate-fade-in", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center text-xs text-retro-text/70 font-bold tracking-wider px-1", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-retro-text/30 mr-1.5 font-normal", children: "└" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2617,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: subName }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2618,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "ml-auto text-[10px] bg-retro-primary/10 text-retro-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxDEV("span", { children: [
                      stats.count,
                      "件"
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2620,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "opacity-40", children: "|" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2621,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV(Package, { className: "w-3 h-3" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2622,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: stats.qty }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2623,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2619,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2616,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: groupProds.map((prod) => /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV(
                  ProductCard,
                  {
                    product: prod,
                    onViewDetail: setSelectedDetailProduct,
                    onEdit: handleEditInstanceTrigger,
                    onArchive: handleArchiveInstance,
                    onAddAnother: handleAddAnotherInstanceTrigger,
                    onImageClick: setFullscreenImage,
                    categoryIcon: categories.find((c) => c.id === prod.category)?.icon || "sparkles"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2630,
                    columnNumber: 31
                  },
                  this
                ) }, prod.id, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2629,
                  columnNumber: 29
                }, this)) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2627,
                  columnNumber: 25
                }, this)
              ] }, subName, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2615,
                columnNumber: 23
              }, this);
            }) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2609,
              columnNumber: 17
            }, this);
          })()
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2513,
          columnNumber: 11
        }, this)
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1647,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("nav", { className: "fixed bottom-0 left-0 right-0 bg-retro-card border-t border-retro-text/10 flex justify-around items-center pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 max-w-2xl mx-auto overflow-x-auto", children: [
      categories.map((cat) => /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => handleTabChange(cat.id),
          className: `flex flex-col items-center gap-1 text-[10px] font-bold min-w-[56px] transition-colors py-1 px-1.5 rounded-lg active:bg-retro-bg/40 ${currentTab === cat.id ? "text-retro-primary bg-retro-primary/5" : "text-retro-text/50"}`,
          children: [
            /* @__PURE__ */ jsxDEV(CategoryIcon, { name: cat.icon, className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2660,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "truncate max-w-[56px]", children: cat.name }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2661,
              columnNumber: 13
            }, this)
          ]
        },
        cat.id,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2655,
          columnNumber: 11
        },
        this
      )),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => handleTabChange("settings"),
          className: `flex flex-col items-center gap-1 text-[10px] font-bold min-w-[56px] transition-colors py-1 px-1.5 rounded-lg active:bg-retro-bg/40 ${currentTab === "settings" ? "text-retro-primary bg-retro-primary/5" : "text-retro-text/50"}`,
          children: [
            /* @__PURE__ */ jsxDEV(Settings, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2669,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("span", { children: "設定" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2670,
              columnNumber: 11
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2665,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 2653,
      columnNumber: 7
    }, this),
    toastMessage && /* @__PURE__ */ jsxDEV("div", { className: "fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-3 bg-stone-900/90 text-white rounded-full text-xs font-bold shadow-lg z-50 pointer-events-none transition-all duration-300 transform scale-100 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxDEV(Info, { className: "w-4 h-4 text-retro-primary animate-pulse" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 2677,
        columnNumber: 11
      }, this),
      toastMessage
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 2676,
      columnNumber: 9
    }, this),
    selectedDetailProduct && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full h-[100dvh] sm:h-auto sm:max-w-md bg-white sm:border-2 border-retro-text sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[85dvh] animate-slide-up pb-safe", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "relative pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 px-5 border-b border-retro-text/5 flex items-start gap-4 bg-stone-50/50", children: [
        selectedDetailProduct.photo ? /* @__PURE__ */ jsxDEV(
          "img",
          {
            referrerPolicy: "no-referrer",
            src: selectedDetailProduct.photo,
            alt: selectedDetailProduct.name,
            onClick: () => setFullscreenImage(selectedDetailProduct.photo),
            className: "w-14 h-18 rounded-xl object-cover border border-retro-text/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2689,
            columnNumber: 17
          },
          this
        ) : /* @__PURE__ */ jsxDEV("div", { className: "w-14 h-18 rounded-xl bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary flex-shrink-0", children: /* @__PURE__ */ jsxDEV(CategoryIcon, { name: categories.find((c) => c.id === selectedDetailProduct.category)?.icon || "sparkles", className: "w-6 h-6 opacity-40" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2698,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2697,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0 pr-6", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-extrabold text-retro-secondary tracking-widest uppercase block", children: selectedDetailProduct.brand }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2703,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-bold text-retro-text leading-snug mt-0.5 line-clamp-2", children: selectedDetailProduct.name }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2706,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 mt-2 flex-wrap", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold bg-retro-primary/10 text-retro-primary px-2.5 py-0.5 rounded-full", children: categories.find((c) => c.id === selectedDetailProduct.category)?.name || selectedDetailProduct.category }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2710,
              columnNumber: 19
            }, this),
            selectedDetailProduct.subcategory && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold bg-retro-secondary/5 text-retro-secondary border border-retro-secondary/10 px-2.5 py-0.5 rounded-full", children: selectedDetailProduct.subcategory }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2714,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2709,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 2702,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setSelectedDetailProduct(null),
            className: "absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer animate-fade-in",
            title: "關閉",
            children: /* @__PURE__ */ jsxDEV(X, { className: "w-4 h-4" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2727,
              columnNumber: 17
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2722,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 2687,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-stone-100/50 border-b border-retro-text/5 grid grid-cols-4 gap-2 flex-shrink-0", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setDetailActiveTab("status"),
            className: `py-2 px-1 text-[11px] font-bold rounded-xl transition-all border flex flex-col items-center gap-0.5 cursor-pointer ${detailActiveTab === "status" ? "bg-retro-primary text-retro-card border-retro-primary shadow-sm scale-[1.02]" : "bg-white text-retro-text/60 border-retro-text/5 hover:text-retro-text hover:bg-stone-50"}`,
            children: [
              /* @__PURE__ */ jsxDEV(Package, { className: "w-3.5 h-3.5" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2741,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "數量狀況" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2742,
                columnNumber: 17
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2733,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setDetailActiveTab("purchase"),
            className: `py-2 px-1 text-[11px] font-bold rounded-xl transition-all border flex flex-col items-center gap-0.5 cursor-pointer ${detailActiveTab === "purchase" ? "bg-retro-secondary text-retro-card border-retro-secondary shadow-sm scale-[1.02]" : "bg-white text-retro-text/60 border-retro-text/5 hover:text-retro-text hover:bg-stone-50"}`,
            children: [
              /* @__PURE__ */ jsxDEV(ShoppingCart, { className: "w-3.5 h-3.5" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2753,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "購買紀錄" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2754,
                columnNumber: 17
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2745,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setDetailActiveTab("usage"),
            className: `py-2 px-1 text-[11px] font-bold rounded-xl transition-all border flex flex-col items-center gap-0.5 cursor-pointer ${detailActiveTab === "usage" ? "bg-amber-600 text-retro-card border-amber-600 shadow-sm scale-[1.02]" : "bg-white text-retro-text/60 border-retro-text/5 hover:text-retro-text hover:bg-stone-50"}`,
            children: [
              /* @__PURE__ */ jsxDEV(History, { className: "w-3.5 h-3.5" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2765,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "使用紀錄" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2766,
                columnNumber: 17
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2757,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => handleEditProductMasterTrigger(selectedDetailProduct),
            className: "py-2 px-1 text-[11px] font-bold bg-white text-retro-text/60 hover:text-retro-primary border border-retro-text/5 hover:border-retro-primary/20 rounded-xl transition-all flex flex-col items-center gap-0.5 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxDEV(Edit3, { className: "w-3.5 h-3.5" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2773,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "編輯大品項" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2774,
                columnNumber: 17
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2769,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 2732,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
        detailActiveTab === "status" ? (
          /* Tab 1 Content: 商品數量狀況 */
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
            (() => {
              const totalUnopened = selectedDetailProduct.instances.filter((inst) => inst.usage === "未開封").reduce((sum, inst) => sum + inst.qty, 0);
              if (selectedDetailProduct.threshold > 0 && totalUnopened <= selectedDetailProduct.threshold) {
                return /* @__PURE__ */ jsxDEV("div", { className: "text-xs font-bold text-red-500 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-2 shadow-sm", children: [
                  /* @__PURE__ */ jsxDEV(Info, { className: "w-4 h-4 flex-shrink-0" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2790,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: [
                    "庫存偏低！目前未開封總計 ",
                    totalUnopened,
                    " 件，已達補貨門檻 (",
                    selectedDetailProduct.threshold,
                    " 件)"
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2791,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2789,
                  columnNumber: 25
                }, this);
              }
              return null;
            })(),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-2.5", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-retro-text/50", children: "總數量" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2801,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-extrabold text-retro-primary font-mono", children: selectedDetailProduct.instances.reduce((sum, inst) => sum + inst.qty, 0) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2802,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2800,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-retro-text/50", children: "開封中數量" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2807,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-extrabold text-green-600 font-mono", children: selectedDetailProduct.instances.filter((inst) => inst.usage === "使用中").reduce((sum, inst) => sum + inst.qty, 0) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2808,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2806,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-retro-text/50", children: "最近到期天數" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2813,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-extrabold text-amber-600 font-mono leading-none", children: (() => {
                    let minDays = 9999;
                    selectedDetailProduct.instances.forEach((inst) => {
                      const days = calculateDaysToExpiry(inst.expiry);
                      if (days < minDays) minDays = days;
                    });
                    return minDays !== 9999 ? minDays : "-";
                  })() }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2815,
                    columnNumber: 25
                  }, this),
                  (() => {
                    let closestDate = null;
                    let minDays = 9999;
                    selectedDetailProduct.instances.forEach((inst) => {
                      const days = calculateDaysToExpiry(inst.expiry);
                      if (days < minDays && inst.expiry) {
                        minDays = days;
                        closestDate = inst.expiry;
                      }
                    });
                    return minDays !== 9999 && closestDate ? /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold text-retro-text/40 mt-1", children: closestDate.replace(/-/g, "/") }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2836,
                      columnNumber: 29
                    }, this) : null;
                  })()
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2814,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2812,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2799,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block", children: "📋 規格明細與狀態" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 2847,
                columnNumber: 21
              }, this),
              selectedDetailProduct.instances.map((inst, index) => {
                const daysLeft = calculateDaysToExpiry(inst.expiry);
                const isUrgent = daysLeft <= 60;
                const pao = calculatePaoExpiry(inst.openedDate, inst.paoMonths);
                return /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-xl border border-retro-text/10 space-y-2 shadow-xs", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-retro-text bg-retro-bg/40 px-2 py-0.5 rounded-lg flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxDEV(Package, { className: "w-3 h-3 text-retro-primary" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2860,
                          columnNumber: 33
                        }, this),
                        inst.qty,
                        " 件"
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2859,
                        columnNumber: 31
                      }, this),
                      inst.capacity && /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-retro-primary bg-retro-primary/10 px-2 py-0.5 rounded-lg", children: inst.capacity }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2864,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1 pixel-box", children: [
                        /* @__PURE__ */ jsxDEV("span", { className: `w-2 h-2 rounded-full ${inst.usage === "使用中" ? "bg-green-500 animate-pulse" : "bg-stone-300"}` }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2871,
                          columnNumber: 33
                        }, this),
                        /* @__PURE__ */ jsxDEV(
                          "select",
                          {
                            value: inst.usage === "未開封" ? "未開封" : "使用中",
                            onChange: (e) => {
                              const val = e.target.value;
                              if (val === "archived") {
                                handleArchiveInstance(selectedDetailProduct.id, inst.id);
                              } else {
                                const nextProducts = products.map((prod) => {
                                  if (prod.id === selectedDetailProduct.id) {
                                    return {
                                      ...prod,
                                      instances: prod.instances.map((i) => {
                                        if (i.id === inst.id) {
                                          return {
                                            ...i,
                                            usage: val,
                                            openedDate: val === "使用中" && !i.openedDate ? (/* @__PURE__ */ new Date()).toISOString().split("T")[0] : i.openedDate
                                          };
                                        }
                                        return i;
                                      })
                                    };
                                  }
                                  return prod;
                                });
                                setProducts(nextProducts);
                                const updated = nextProducts.find((p) => p.id === selectedDetailProduct.id);
                                if (updated) setSelectedDetailProduct(updated);
                                showToast(`狀態已變更為：${val === "未開封" ? "未使用" : "已開封"}`);
                              }
                            },
                            className: "text-xs font-bold text-retro-text/80 bg-transparent outline-none cursor-pointer appearance-none pr-3 relative z-10 no-pixel-border",
                            children: [
                              /* @__PURE__ */ jsxDEV("option", { value: "未開封", children: "未使用" }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2905,
                                columnNumber: 35
                              }, this),
                              /* @__PURE__ */ jsxDEV("option", { value: "使用中", children: "已開封" }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2906,
                                columnNumber: 35
                              }, this),
                              /* @__PURE__ */ jsxDEV("option", { value: "archived", children: "封存" }, void 0, false, {
                                fileName: "/app/applet/src/App.tsx",
                                lineNumber: 2907,
                                columnNumber: 35
                              }, this)
                            ]
                          },
                          void 0,
                          true,
                          {
                            fileName: "/app/applet/src/App.tsx",
                            lineNumber: 2872,
                            columnNumber: 33
                          },
                          this
                        ),
                        /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-3 h-3 absolute right-1 text-retro-text/40 pointer-events-none" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2909,
                          columnNumber: 33
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2870,
                        columnNumber: 31
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2858,
                      columnNumber: 29
                    }, this),
                    selectedDetailProduct.status !== "archived" && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-0.5", children: [
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: () => {
                            handleEditInstanceTrigger(selectedDetailProduct, inst);
                            setSelectedDetailProduct(null);
                          },
                          className: "action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer",
                          title: "編輯此規格",
                          children: /* @__PURE__ */ jsxDEV(Edit3, { className: "w-3 h-3" }, void 0, false, {
                            fileName: "/app/applet/src/App.tsx",
                            lineNumber: 2925,
                            columnNumber: 35
                          }, this)
                        },
                        void 0,
                        false,
                        {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2917,
                          columnNumber: 33
                        },
                        this
                      ),
                      /* @__PURE__ */ jsxDEV("span", { className: "w-[1px] h-3 bg-retro-text/10" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2928,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: () => handleDeleteInstanceDirect(selectedDetailProduct.id, inst.id),
                          className: "action-btn-no-pixel text-red-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer",
                          title: "永久刪除此細項",
                          children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-3 h-3" }, void 0, false, {
                            fileName: "/app/applet/src/App.tsx",
                            lineNumber: 2934,
                            columnNumber: 35
                          }, this)
                        },
                        void 0,
                        false,
                        {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2929,
                          columnNumber: 33
                        },
                        this
                      )
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2916,
                      columnNumber: 31
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2857,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl overflow-hidden bg-stone-50/50 mt-2 border border-retro-text/10", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 divide-x divide-retro-text/10 border-b border-retro-text/10 bg-retro-bg/30 text-[10px] font-bold text-retro-text/60", children: [
                      /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-1.5 flex items-center", children: "數量 / 容量" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2944,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-1.5 flex items-center", children: "有效期限" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2945,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-1.5 flex items-center", children: "剩餘" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2946,
                        columnNumber: 31
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2943,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 divide-x divide-retro-text/10 bg-white text-xs font-bold text-retro-text", children: [
                      /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2.5 flex items-center", children: [
                        inst.qty,
                        " / ",
                        inst.capacity || "-"
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2949,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2.5 flex items-center", children: inst.expiry ? inst.expiry : "-" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2950,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2.5 flex items-center justify-between", children: /* @__PURE__ */ jsxDEV("span", { className: isUrgent ? "text-red-500" : "", children: daysLeft !== 9999 ? `${daysLeft} 天` : "-" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2952,
                        columnNumber: 33
                      }, this) }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2951,
                        columnNumber: 31
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2948,
                      columnNumber: 29
                    }, this),
                    inst.usage === "使用中" && inst.paoMonths && inst.openedDate && pao && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                      /* @__PURE__ */ jsxDEV("div", { className: `grid grid-cols-3 divide-x divide-retro-text/10 border-b border-t border-retro-text/10 text-[10px] font-bold ${pao.isExpired ? "bg-red-50 text-red-600/70" : "bg-retro-bg/30 text-retro-text/60"}`, children: [
                        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-1.5 flex items-center", children: "開封日期" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2962,
                          columnNumber: 35
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-1.5 flex items-center", children: "使用期限" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2963,
                          columnNumber: 35
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-1.5 flex items-center", children: "剩餘" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2964,
                          columnNumber: 35
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2961,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: `grid grid-cols-3 divide-x divide-retro-text/10 text-xs font-bold ${pao.isExpired ? "bg-red-50/50 text-red-600" : "bg-white text-retro-text"}`, children: [
                        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2.5 flex items-center", children: inst.openedDate }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2967,
                          columnNumber: 35
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2.5 flex items-center", children: pao.expiryDate }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2968,
                          columnNumber: 35
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2.5 flex items-center justify-between", children: /* @__PURE__ */ jsxDEV("span", { children: pao.isExpired ? `${pao.daysOverdue} 天 (過期)` : `${pao.daysLeft} 天` }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2970,
                          columnNumber: 37
                        }, this) }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 2969,
                          columnNumber: 35
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 2966,
                        columnNumber: 33
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 2960,
                      columnNumber: 31
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 2941,
                    columnNumber: 27
                  }, this)
                ] }, inst.id, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 2856,
                  columnNumber: 25
                }, this);
              })
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2846,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 2782,
            columnNumber: 17
          }, this)
        ) : detailActiveTab === "purchase" ? (
          /* Tab 2 Content: 購買紀錄 */
          (() => {
            const allPurchaseInstances = products.filter((p) => p.brand === selectedDetailProduct.brand && p.name === selectedDetailProduct.name).flatMap((p) => p.instances.map((inst) => ({ ...inst, isArchived: p.status === "archived" }))).sort((a, b) => {
              if (a.purchaseDate && b.purchaseDate) {
                return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
              }
              return 0;
            });
            const instancesWithPurchaseInfo = allPurchaseInstances.filter((inst) => inst.purchaseDate || inst.purchasePlace || inst.price !== void 0);
            return /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "bg-stone-50 px-3 py-2.5 rounded-xl border border-retro-text/5 flex justify-between items-center", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-retro-text/60", children: "購買明細筆數" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3001,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-extrabold text-retro-secondary font-mono", children: [
                  "總筆數：",
                  allPurchaseInstances.length,
                  " 筆"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3002,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3e3,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block", children: "🛒 每一筆的購買明細紀錄 (含封存)" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3008,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "overflow-hidden rounded-xl border border-retro-text/5 bg-white shadow-xs", children: [
                  /* @__PURE__ */ jsxDEV("table", { className: "w-full text-left border-collapse", children: [
                    /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "bg-stone-50 border-b border-retro-text/5 text-[10px] uppercase text-retro-text/50", children: [
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold whitespace-nowrap", children: "日期" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3016,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold whitespace-nowrap", children: "地點" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3017,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold text-center whitespace-nowrap", children: "數量" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3018,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold text-right whitespace-nowrap", children: "單價" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3019,
                        columnNumber: 33
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 3015,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 3014,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-retro-text/5", children: allPurchaseInstances.map((inst, index) => {
                      const hasPurchaseInfo = inst.purchaseDate || inst.purchasePlace || inst.price !== void 0;
                      if (!hasPurchaseInfo) return null;
                      return /* @__PURE__ */ jsxDEV("tr", { className: `text-xs text-retro-text ${inst.isArchived ? "opacity-50 grayscale" : ""}`, children: [
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5 font-mono", children: inst.purchaseDate || "-" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3028,
                          columnNumber: 37
                        }, this),
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5", children: inst.purchasePlace || "-" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3029,
                          columnNumber: 37
                        }, this),
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5 font-mono text-center", children: inst.qty || "-" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3030,
                          columnNumber: 37
                        }, this),
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5 font-mono font-bold text-right text-retro-secondary", children: inst.price !== void 0 ? `$${inst.price}` : "-" }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3031,
                          columnNumber: 37
                        }, this)
                      ] }, inst.id, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3027,
                        columnNumber: 35
                      }, this);
                    }) }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 3022,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 3013,
                    columnNumber: 27
                  }, this),
                  instancesWithPurchaseInfo.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "py-6 text-center text-xs text-stone-400 font-semibold bg-white", children: "暫無購買紀錄" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 3038,
                    columnNumber: 29
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3012,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3007,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-center text-stone-400 font-semibold pt-1", children: "💡 提示：點擊右上角的編輯圖示（數量狀況頁籤中）即可新增購買紀錄" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3045,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 2999,
              columnNumber: 21
            }, this);
          })()
        ) : (
          /* Tab 3 Content: 使用紀錄 */
          (() => {
            const allUsageInstances = products.filter((p) => p.brand === selectedDetailProduct.brand && p.name === selectedDetailProduct.name).flatMap((p) => p.instances).filter((inst) => inst.usage === "已用完" || inst.usage === "已丟棄" || inst.usage === "使用中" && inst.openedDate).sort((a, b) => {
              if (a.openedDate && b.openedDate) {
                return new Date(b.openedDate).getTime() - new Date(a.openedDate).getTime();
              }
              return 0;
            });
            return /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 animate-fade-in", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "bg-stone-50 px-3 py-2.5 rounded-xl border border-retro-text/5 flex justify-between items-center", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-retro-text/60", children: "使用紀錄筆數" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3068,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-extrabold text-amber-600 font-mono", children: [
                  "總計：",
                  allUsageInstances.length,
                  " 筆"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3069,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3067,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block", children: "⌛ 從開封到用完/丟棄的時間" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3075,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "overflow-hidden rounded-xl border border-retro-text/5 bg-white shadow-xs", children: [
                  /* @__PURE__ */ jsxDEV("table", { className: "w-full text-left border-collapse", children: [
                    /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "bg-stone-50 border-b border-retro-text/5 text-[10px] uppercase text-retro-text/50", children: [
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold whitespace-nowrap", children: "狀態" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3083,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold whitespace-nowrap", children: "期間" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3084,
                        columnNumber: 33
                      }, this),
                      /* @__PURE__ */ jsxDEV("th", { className: "p-2.5 font-bold text-right whitespace-nowrap", children: "花費時間" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3085,
                        columnNumber: 33
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 3082,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 3081,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-retro-text/5", children: allUsageInstances.map((inst) => {
                      let durationStr = "-";
                      if (inst.openedDate) {
                        const endD = (inst.usage === "已用完" || inst.usage === "已丟棄") && inst.finishedDate ? new Date(inst.finishedDate) : /* @__PURE__ */ new Date();
                        const startD = new Date(inst.openedDate);
                        const diffMs = endD.getTime() - startD.getTime();
                        if (diffMs >= 0) {
                          const totalDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
                          const years = Math.floor(totalDays / 365);
                          const months = Math.floor(totalDays % 365 / 30);
                          const days = totalDays % 365 % 30;
                          const parts = [];
                          if (years > 0) parts.push(`${years}年`);
                          if (months > 0) parts.push(`${months}個月`);
                          if (years === 0 && months === 0) parts.push(`${days}天`);
                          durationStr = parts.join("");
                        }
                      }
                      return /* @__PURE__ */ jsxDEV("tr", { className: `text-xs text-retro-text`, children: [
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5", children: /* @__PURE__ */ jsxDEV("span", { className: `px-1.5 py-0.5 rounded text-[10px] font-bold ${inst.usage === "使用中" ? "bg-green-100 text-green-700" : inst.usage === "已用完" ? "bg-stone-200 text-stone-600" : "bg-red-100 text-red-600"}`, children: inst.usage }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3114,
                          columnNumber: 39
                        }, this) }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3113,
                          columnNumber: 37
                        }, this),
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5 font-mono text-[10px] text-stone-500", children: [
                          /* @__PURE__ */ jsxDEV("div", { children: inst.openedDate || "-" }, void 0, false, {
                            fileName: "/app/applet/src/App.tsx",
                            lineNumber: 3123,
                            columnNumber: 39
                          }, this),
                          /* @__PURE__ */ jsxDEV("div", { children: [
                            "~ ",
                            inst.finishedDate || (inst.usage === "使用中" ? "至今" : "-")
                          ] }, void 0, true, {
                            fileName: "/app/applet/src/App.tsx",
                            lineNumber: 3124,
                            columnNumber: 39
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3122,
                          columnNumber: 37
                        }, this),
                        /* @__PURE__ */ jsxDEV("td", { className: "p-2.5 font-bold text-right text-amber-600", children: durationStr }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 3126,
                          columnNumber: 37
                        }, this)
                      ] }, inst.id, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 3112,
                        columnNumber: 35
                      }, this);
                    }) }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 3088,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 3080,
                    columnNumber: 27
                  }, this),
                  allUsageInstances.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "py-6 text-center text-xs text-stone-400 font-semibold bg-white", children: "暫無使用紀錄 (需設定開封日期)" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 3133,
                    columnNumber: 29
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3079,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3074,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3066,
              columnNumber: 21
            }, this);
          })()
        ),
        selectedDetailProduct.status !== "archived" && /* @__PURE__ */ jsxDEV("div", { className: "p-3 border-t border-retro-text/5 bg-stone-50/80 flex gap-2 flex-shrink-0", children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              handleAddAnotherInstanceTrigger(selectedDetailProduct);
              setSelectedDetailProduct(null);
            },
            className: "w-full py-2.5 bg-retro-secondary hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3154,
                columnNumber: 19
              }, this),
              "新增此產品的其他庫存/規格"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3147,
            columnNumber: 17
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3146,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 2779,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 2685,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 2684,
      columnNumber: 9
    }, this),
    confirmDialog && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-xs bg-white border-2 border-retro-text rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 animate-slide-up", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-retro-secondary", children: [
        /* @__PURE__ */ jsxDEV(Info, { className: "w-5 h-5 flex-shrink-0 text-retro-primary" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3169,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "font-extrabold text-sm uppercase tracking-wider", children: confirmDialog.title }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3170,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3168,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-bold text-stone-600 leading-relaxed whitespace-pre-line", children: confirmDialog.message }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3172,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setConfirmDialog(null),
            className: "flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all border border-stone-200 cursor-pointer",
            children: "取消"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3176,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              confirmDialog.onConfirm();
              setConfirmDialog(null);
            },
            className: "flex-1 py-2 bg-retro-primary hover:opacity-90 text-retro-card font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer",
            children: "確定"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3182,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3175,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3167,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3166,
      columnNumber: 9
    }, this),
    cropImageSrc && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-stone-900/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center animate-fade-in", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "relative w-full h-[60vh] sm:h-[70vh] bg-black", children: /* @__PURE__ */ jsxDEV(
        Cropper,
        {
          image: cropImageSrc,
          crop,
          zoom,
          aspect: cropAspect,
          onCropChange: setCrop,
          onCropComplete,
          onZoomChange: setZoom
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3200,
          columnNumber: 13
        },
        this
      ) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3199,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "p-6 w-full max-w-md space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-3", children: [
          { label: "正方形 1:1", value: 1 },
          { label: "直式 3:4", value: 3 / 4 },
          { label: "橫式 4:3", value: 4 / 3 },
          { label: "寬螢幕 16:9", value: 16 / 9 }
        ].map((ratio) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setCropAspect(ratio.value),
            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${cropAspect === ratio.value ? "bg-retro-primary text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`,
            children: ratio.label
          },
          ratio.label,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3218,
            columnNumber: 17
          },
          this
        )) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3211,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4 text-white", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-medium whitespace-nowrap", children: "縮放" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3228,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "range",
              value: zoom,
              min: 1,
              max: 3,
              step: 0.1,
              "aria-labelledby": "Zoom",
              onChange: (e) => {
                setZoom(Number(e.target.value));
              },
              className: "flex-1 accent-retro-primary"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3229,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3227,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "flex-1 py-3 rounded-xl border border-white/20 text-white font-bold tracking-wider hover:bg-white/10 transition-colors",
              onClick: handleCropCancel,
              children: "取消"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3243,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "flex-1 py-3 rounded-xl bg-retro-primary text-white font-bold tracking-wider hover:brightness-110 transition-all shadow-lg",
              onClick: handleCropConfirm,
              children: "確認裁切"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3249,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3242,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3210,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3198,
      columnNumber: 9
    }, this),
    fullscreenImage && /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in cursor-zoom-out",
        onClick: () => setFullscreenImage(null),
        children: [
          /* @__PURE__ */ jsxDEV(
            "img",
            {
              referrerPolicy: "no-referrer",
              src: fullscreenImage,
              alt: "Fullscreen preview",
              className: "max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-slide-up",
              onClick: (e) => e.stopPropagation()
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3266,
              columnNumber: 11
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors",
              onClick: () => setFullscreenImage(null),
              children: /* @__PURE__ */ jsxDEV(X, { className: "w-6 h-6" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3277,
                columnNumber: 13
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3273,
              columnNumber: 11
            },
            this
          )
        ]
      },
      void 0,
      true,
      {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3262,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 1588,
    columnNumber: 5
  }, this);
}
function ProductCard({
  product,
  onViewDetail,
  onEdit,
  onArchive,
  onAddAnother,
  onImageClick,
  categoryIcon
}) {
  const instances = product.instances;
  const isArchived = product.status === "archived";
  let minDaysToExpiry = 9999;
  let closestExpiryDate = "";
  instances.forEach((inst) => {
    const days = calculateDaysToExpiry(inst.expiry);
    if (days < minDaysToExpiry) {
      minDaysToExpiry = days;
      closestExpiryDate = inst.expiry;
    }
  });
  const isUrgent = minDaysToExpiry <= 60;
  const totalQty = instances.reduce((sum, inst) => sum + inst.qty, 0);
  const totalUnopenedQty = instances.filter((inst) => inst.usage === "未開封").reduce((sum, inst) => sum + inst.qty, 0);
  const hasInUse = instances.some((inst) => inst.usage === "使用中");
  const needsRestock = product.threshold > 0 && totalUnopenedQty <= product.threshold;
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      onClick: () => onViewDetail(product),
      className: `p-4 rounded-2xl flex items-center justify-between bg-white border border-transparent hover:border-retro-primary/30 shadow-sm transition-all duration-300 cursor-pointer active:scale-[0.99] group relative ${isArchived ? "opacity-60 grayscale" : ""}`,
      title: "點擊進入商品完整畫面",
      children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3.5 items-center min-w-0 flex-1", children: [
          product.photo ? /* @__PURE__ */ jsxDEV(
            "img",
            {
              referrerPolicy: "no-referrer",
              src: product.photo,
              alt: product.name,
              onClick: (e) => {
                if (onImageClick) {
                  e.stopPropagation();
                  onImageClick(product.photo);
                }
              },
              className: "w-11 h-14 rounded-lg object-cover border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3333,
              columnNumber: 11
            },
            this
          ) : /* @__PURE__ */ jsxDEV("div", { className: "w-11 h-14 rounded-lg bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary flex-shrink-0", children: /* @__PURE__ */ jsxDEV(CategoryIcon, { name: categoryIcon, className: "w-5 h-5 opacity-40" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3347,
            columnNumber: 13
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3346,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col justify-start min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-retro-secondary tracking-wider uppercase truncate flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxDEV("span", { className: `w-2 h-2 rounded-full flex-shrink-0 ${hasInUse ? "bg-green-500 animate-pulse" : "bg-stone-300"}` }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3354,
                columnNumber: 13
              }, this),
              product.brand
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3353,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-bold font-display text-retro-text leading-snug truncate group-hover:text-retro-primary transition-colors mt-0.5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "truncate", children: product.name }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3358,
                columnNumber: 13
              }, this),
              needsRestock && /* @__PURE__ */ jsxDEV("span", { className: "flex-shrink-0 bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5", children: [
                /* @__PURE__ */ jsxDEV(Info, { className: "w-3 h-3" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 3361,
                  columnNumber: 17
                }, this),
                "補貨"
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3360,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3357,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mt-1.5", children: /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-semibold text-retro-text/50 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1", children: [
              /* @__PURE__ */ jsxDEV(Package, { className: "w-3 h-3 text-retro-primary" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3368,
                columnNumber: 15
              }, this),
              "共 ",
              totalQty,
              " 件"
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3367,
              columnNumber: 13
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3366,
              columnNumber: 11
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3352,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3330,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 ml-3 flex-shrink-0", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-full bg-stone-50 border border-retro-text/5 flex flex-col items-center justify-center", children: [
              /* @__PURE__ */ jsxDEV("span", { className: `text-sm font-bold leading-none ${isUrgent ? "text-red-500 font-extrabold" : "text-retro-primary"}`, children: minDaysToExpiry !== 9999 ? minDaysToExpiry : "-" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3379,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[8px] text-retro-text/50 font-bold mt-0.5", children: "天到期" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3382,
                columnNumber: 13
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3378,
              columnNumber: 11
            }, this),
            minDaysToExpiry !== 9999 && closestExpiryDate && /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold text-retro-text/40 mt-1", children: closestExpiryDate.replace(/-/g, "/") }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3385,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3377,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-4 h-4 text-stone-300 group-hover:text-retro-primary group-hover:translate-x-0.5 transition-all" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 3390,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3376,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3325,
      columnNumber: 5
    },
    this
  );
}
function ClockIcon({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsxDEV(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      children: [
        /* @__PURE__ */ jsxDEV("circle", { cx: "12", cy: "12", r: "10" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3409,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV("polyline", { points: "12 6 12 12 16 14" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3410,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3399,
      columnNumber: 5
    },
    this
  );
}
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-retro-bg flex items-center justify-center font-sans", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-8 h-8 text-retro-primary animate-pulse" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3431,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-retro-text font-bold text-sm tracking-wider uppercase", children: "Loading..." }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3432,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3430,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3429,
      columnNumber: 7
    }, this);
  }
  if (!user) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-retro-bg flex flex-col items-center justify-center p-6 font-sans", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-retro-text/10 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 bg-retro-primary/10 rounded-2xl flex items-center justify-center text-retro-primary mb-6", children: /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-8 h-8" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3443,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3442,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-bold font-display text-retro-text mb-2", children: "用品管理系統" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3445,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-retro-text/60 text-sm mb-8", children: "精緻復古底片風格的化妝品與保養品庫存管理系統，請登入以存取專屬您的帳號資料。" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 3446,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: signInWithGoogle,
          className: "w-full flex items-center justify-center gap-3 bg-retro-text text-white py-4 rounded-xl font-bold hover:bg-retro-text/90 transition-all shadow-md active:scale-[0.98]",
          children: [
            /* @__PURE__ */ jsxDEV("svg", { viewBox: "0 0 24 24", className: "w-5 h-5 bg-white rounded-full p-0.5", xmlns: "http://www.w3.org/2000/svg", children: [
              /* @__PURE__ */ jsxDEV("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3454,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3455,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3456,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 3457,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 3453,
              columnNumber: 13
            }, this),
            "使用 Google 帳號登入"
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 3449,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3441,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 3440,
      columnNumber: 7
    }, this);
  }
  return /* @__PURE__ */ jsxDEV(MainApp, { user }, void 0, false, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 3466,
    columnNumber: 10
  }, this);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFwcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IG9uQXV0aFN0YXRlQ2hhbmdlZCwgVXNlciB9IGZyb20gJ2ZpcmViYXNlL2F1dGgnO1xuaW1wb3J0IHsgZG9jLCBnZXREb2MsIHNldERvYywgZGVsZXRlRG9jLCBnZXREb2NzLCBjb2xsZWN0aW9uLCBkZWxldGVGaWVsZCwgdXBkYXRlRG9jLCBxdWVyeSB9IGZyb20gJ2ZpcmViYXNlL2ZpcmVzdG9yZSc7XG5pbXBvcnQgeyBhdXRoLCBkYiwgc3RvcmFnZSwgc2lnbkluV2l0aEdvb2dsZSwgbG9nT3V0IH0gZnJvbSAnLi9maXJlYmFzZSc7XG5pbXBvcnQgeyByZWYsIHVwbG9hZFN0cmluZywgZ2V0RG93bmxvYWRVUkwgfSBmcm9tICdmaXJlYmFzZS9zdG9yYWdlJztcbmltcG9ydCB7IFxuICBTcGFya2xlcywgXG4gIERyb3BsZXRzLCBcbiAgUGlsbCwgXG4gIFNldHRpbmdzLCBcbiAgQ2FtZXJhLCBcbiAgUGx1cywgXG4gIFNlYXJjaCwgXG4gIFBhY2thZ2UsIFxuICBEcm9wbGV0LCBcbiAgRWRpdDMsIFxuICBBcmNoaXZlLCBcbiAgVHJhc2gyLCBcbiAgR3JpcFZlcnRpY2FsLCBcbiAgTGlzdFRyZWUsIFxuICBDaGV2cm9uRG93biwgXG4gIENoZXZyb25VcCwgXG4gIENoZWNrLCBcbiAgRXllLCBcbiAgRXllT2ZmLCBcbiAgQWxlcnRUcmlhbmdsZSwgXG4gIFgsIFxuICBJbmZvLCBcbiAgQ2FsZW5kYXIsXG4gIEhlYXJ0LFxuICBTdGFyLFxuICBTaG9wcGluZ0JhZyxcbiAgU2hvcHBpbmdDYXJ0LFxuICBDaGV2cm9uUmlnaHQsXG4gIEhpc3RvcnksXG4gIFR5cGUsXG4gIEltYWdlSWNvbixcbiAgTHVjaWRlSWNvblxufSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQ2F0ZWdvcnksIFByb2R1Y3QsIFByb2R1Y3RJbnN0YW5jZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgSU5JVElBTF9DQVRFR09SSUVTLCBJTklUSUFMX1BST0RVQ1RTIH0gZnJvbSAnLi9kYXRhJztcbmltcG9ydCBDcm9wcGVyIGZyb20gJ3JlYWN0LWVhc3ktY3JvcCc7XG5pbXBvcnQgeyBcbiAgY2FsY3VsYXRlRGF5c1RvRXhwaXJ5LCBcbiAgY2FsY3VsYXRlUGFvRXhwaXJ5LCBcbiAgY2hlY2tBbGxPcGVuZWRFeHBpcmVkUHJvZHVjdHMgXG59IGZyb20gJy4vdXRpbHMnO1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZXh0cmFjdCBjcm9wcGVkIGltYWdlIGFzIGJhc2U2NFxuY29uc3QgZ2V0Q3JvcHBlZEltZyA9IGFzeW5jIChpbWFnZVNyYzogc3RyaW5nLCBwaXhlbENyb3A6IGFueSk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gIGltYWdlLnNyYyA9IGltYWdlU3JjO1xuICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGltYWdlLm9ubG9hZCA9IHJlc29sdmU7XG4gIH0pO1xuXG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICBpZiAoIWN0eCkge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gMmQgY29udGV4dCcpO1xuICB9XG5cbiAgY2FudmFzLndpZHRoID0gcGl4ZWxDcm9wLndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gcGl4ZWxDcm9wLmhlaWdodDtcblxuICBjdHguZHJhd0ltYWdlKFxuICAgIGltYWdlLFxuICAgIHBpeGVsQ3JvcC54LFxuICAgIHBpeGVsQ3JvcC55LFxuICAgIHBpeGVsQ3JvcC53aWR0aCxcbiAgICBwaXhlbENyb3AuaGVpZ2h0LFxuICAgIDAsXG4gICAgMCxcbiAgICBwaXhlbENyb3Aud2lkdGgsXG4gICAgcGl4ZWxDcm9wLmhlaWdodFxuICApO1xuXG4gIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgMC44KTtcbn07XG5cbi8vIEhlbHBlciBjb21wb25lbnQgdG8gcmVuZGVyIGljb25zIGJhc2VkIG9uIGNhdGVnb3J5IHNldHRpbmdzXG5jb25zdCBJY29uTWFwOiBSZWNvcmQ8c3RyaW5nLCBMdWNpZGVJY29uPiA9IHtcbiAgc3BhcmtsZXM6IFNwYXJrbGVzLFxuICBkcm9wbGV0czogRHJvcGxldHMsXG4gIHBpbGw6IFBpbGwsXG4gIHBhY2thZ2U6IFBhY2thZ2UsXG4gICdzaG9wcGluZy1iYWcnOiBTaG9wcGluZ0JhZyxcbiAgaGVhcnQ6IEhlYXJ0LFxuICBzdGFyOiBTdGFyLFxuICBzZXR0aW5nczogU2V0dGluZ3Ncbn07XG5cbmZ1bmN0aW9uIENhdGVnb3J5SWNvbih7IG5hbWUsIGNsYXNzTmFtZSA9IFwidy01IGgtNVwiIH06IHsgbmFtZTogc3RyaW5nOyBjbGFzc05hbWU/OiBzdHJpbmcgfSkge1xuICBjb25zdCBJY29uQ29tcG9uZW50ID0gSWNvbk1hcFtuYW1lXSB8fCBTcGFya2xlcztcbiAgcmV0dXJuIDxJY29uQ29tcG9uZW50IGNsYXNzTmFtZT17Y2xhc3NOYW1lfSAvPjtcbn1cblxuZnVuY3Rpb24gTWFpbkFwcCh7IHVzZXIgfTogeyB1c2VyOiBVc2VyIH0pIHtcbiAgLy8gLS0tIENvcmUgU3RhdGUgLS0tXG4gIGNvbnN0IFtjYXRlZ29yaWVzLCBzZXRDYXRlZ29yaWVzXSA9IHVzZVN0YXRlPENhdGVnb3J5W10+KFtdKTtcblxuICBjb25zdCBbcHJvZHVjdHMsIHNldFByb2R1Y3RzXSA9IHVzZVN0YXRlPFByb2R1Y3RbXT4oW10pO1xuXG4gIGNvbnN0IFtpc0RhdGFMb2FkZWQsIHNldElzRGF0YUxvYWRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gTG9hZCB1c2VyIGRhdGEgZnJvbSBGaXJlc3RvcmUgb24gbW91bnRcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBsb2FkVXNlckRhdGEgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkb2NSZWYgPSBkb2MoZGIsICd1c2VycycsIHVzZXIudWlkKTtcbiAgICAgICAgY29uc3QgZG9jU25hcCA9IGF3YWl0IGdldERvYyhkb2NSZWYpO1xuICAgICAgICBsZXQgbG9hZGVkQ2F0ZWdvcmllcyA9IElOSVRJQUxfQ0FURUdPUklFUztcbiAgICAgICAgXG4gICAgICAgIGlmIChkb2NTbmFwLmV4aXN0cygpKSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGRvY1NuYXAuZGF0YSgpO1xuICAgICAgICAgIGlmIChkYXRhLmNhdGVnb3JpZXMpIHtcbiAgICAgICAgICAgIGxvYWRlZENhdGVnb3JpZXMgPSBkYXRhLmNhdGVnb3JpZXM7XG4gICAgICAgICAgICBzZXRDYXRlZ29yaWVzKGRhdGEuY2F0ZWdvcmllcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldENhdGVnb3JpZXMoSU5JVElBTF9DQVRFR09SSUVTKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gTGVnYWN5IG1pZ3JhdGlvbiBjaGVjazogaWYgcHJvZHVjdHMgZXhpc3QgaW4gdGhlIHJvb3QgZG9jLCB1c2UgdGhlbSBpbml0aWFsbHlcbiAgICAgICAgICBpZiAoZGF0YS5wcm9kdWN0cyAmJiBkYXRhLnByb2R1Y3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNldFByb2R1Y3RzKGRhdGEucHJvZHVjdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRDYXRlZ29yaWVzKElOSVRJQUxfQ0FURUdPUklFUyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIExvYWQgcHJvZHVjdHMgZnJvbSBzdWJjb2xsZWN0aW9uXG4gICAgICAgIGNvbnN0IHByb2R1Y3RzUmVmID0gY29sbGVjdGlvbihkYiwgJ3VzZXJzJywgdXNlci51aWQsICdwcm9kdWN0cycpO1xuICAgICAgICBjb25zdCBxID0gcXVlcnkocHJvZHVjdHNSZWYpO1xuICAgICAgICBjb25zdCBxdWVyeVNuYXBzaG90ID0gYXdhaXQgZ2V0RG9jcyhxKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghcXVlcnlTbmFwc2hvdC5lbXB0eSkge1xuICAgICAgICAgIGNvbnN0IHN1YlByb2R1Y3RzOiBQcm9kdWN0W10gPSBbXTtcbiAgICAgICAgICBxdWVyeVNuYXBzaG90LmZvckVhY2goKGRvY1NuYXApID0+IHtcbiAgICAgICAgICAgIHN1YlByb2R1Y3RzLnB1c2goZG9jU25hcC5kYXRhKCkgYXMgUHJvZHVjdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2V0UHJvZHVjdHMoc3ViUHJvZHVjdHMpO1xuICAgICAgICB9IGVsc2UgaWYgKCFkb2NTbmFwLmV4aXN0cygpKSB7XG4gICAgICAgICAgLy8gSWYgbm8gdXNlciBkb2MgZXhpc3RzIGFuZCBubyBwcm9kdWN0cyBleGlzdCwgaW5pdGlhbGl6ZSB3aXRoIGRlZmF1bHRzXG4gICAgICAgICAgc2V0UHJvZHVjdHMoSU5JVElBTF9QUk9EVUNUUyk7XG4gICAgICAgIH1cblxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZGF0YScsIGVycik7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRJc0RhdGFMb2FkZWQodHJ1ZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBsb2FkVXNlckRhdGEoKTtcbiAgfSwgW3VzZXIudWlkXSk7XG5cbiAgLy8gU2F2ZSB0byBGaXJlc3RvcmUgd2hlbmV2ZXIgZGF0YSBjaGFuZ2VzIChkZWJvdW5jZSBvciBqdXN0IHNhdmUgZGlyZWN0bHkgc2luY2UgaXQncyBzaW1wbGUpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFpc0RhdGFMb2FkZWQpIHJldHVybjtcbiAgICBjb25zdCBzYXZlVXNlckRhdGEgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB1c2VyUmVmID0gZG9jKGRiLCAndXNlcnMnLCB1c2VyLnVpZCk7XG4gICAgICAgIC8vIFNhdmUgY2F0ZWdvcmllcyB0byByb290IGRvY1xuICAgICAgICBhd2FpdCBzZXREb2ModXNlclJlZiwge1xuICAgICAgICAgIGNhdGVnb3JpZXMsXG4gICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfSwgeyBtZXJnZTogdHJ1ZSB9KTtcblxuICAgICAgICAvLyBTeW5jIHByb2R1Y3RzIGFycmF5IHRvIHN1YmNvbGxlY3Rpb25cbiAgICAgICAgY29uc3QgcHJvZHVjdHNSZWYgPSBjb2xsZWN0aW9uKGRiLCAndXNlcnMnLCB1c2VyLnVpZCwgJ3Byb2R1Y3RzJyk7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90ID0gYXdhaXQgZ2V0RG9jcyhwcm9kdWN0c1JlZik7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBleGlzdGluZ0RhdGEgPSBuZXcgTWFwKCk7XG4gICAgICAgIHNuYXBzaG90LmZvckVhY2goZCA9PiBleGlzdGluZ0RhdGEuc2V0KGQuaWQsIGQuZGF0YSgpKSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjdXJyZW50SWRzID0gbmV3IFNldChwcm9kdWN0cy5tYXAocCA9PiBwLmlkKSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCB3cml0ZVByb21pc2VzID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGlkIG9mIGV4aXN0aW5nRGF0YS5rZXlzKCkpIHtcbiAgICAgICAgICBpZiAoIWN1cnJlbnRJZHMuaGFzKGlkKSkge1xuICAgICAgICAgICAgd3JpdGVQcm9taXNlcy5wdXNoKGRlbGV0ZURvYyhkb2MoZGIsICd1c2VycycsIHVzZXIudWlkLCAncHJvZHVjdHMnLCBpZCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBwcm9kdWN0cykge1xuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZXhpc3RpbmdEYXRhLmdldChwcm9kdWN0LmlkKTtcbiAgICAgICAgICAvLyBPbmx5IHdyaXRlIGlmIGl0J3MgbmV3IG9yIHRoZSBkYXRhIGhhcyBjaGFuZ2VkXG4gICAgICAgICAgaWYgKCFleGlzdGluZyB8fCBKU09OLnN0cmluZ2lmeShleGlzdGluZykgIT09IEpTT04uc3RyaW5naWZ5KHByb2R1Y3QpKSB7XG4gICAgICAgICAgICBjb25zdCBjbGVhblByb2R1Y3QgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHByb2R1Y3QpKTtcbiAgICAgICAgICAgIHdyaXRlUHJvbWlzZXMucHVzaChzZXREb2MoZG9jKGRiLCAndXNlcnMnLCB1c2VyLnVpZCwgJ3Byb2R1Y3RzJywgcHJvZHVjdC5pZCksIGNsZWFuUHJvZHVjdCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3cml0ZVByb21pc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh3cml0ZVByb21pc2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1pZ3JhdGlvbjogUmVtb3ZlIHRoZSBvbGQgYHByb2R1Y3RzYCBhcnJheSBmcm9tIHRoZSB1c2VyIGRvYyB0byBmcmVlIHVwIHRoZSAxTUIgbGltaXRcbiAgICAgICAgYXdhaXQgdXBkYXRlRG9jKHVzZXJSZWYsIHtcbiAgICAgICAgICBwcm9kdWN0czogZGVsZXRlRmllbGQoKVxuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7IC8qIGlnbm9yZSBpZiBmaWVsZCBkb2Vzbid0IGV4aXN0ICovIH0pO1xuXG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzYXZpbmcgZGF0YScsIGVycik7XG4gICAgICAgIHNldFRvYXN0TWVzc2FnZShg5YSy5a2Y5aSx5pWXOiAke2Vyci5tZXNzYWdlIHx8IFN0cmluZyhlcnIpfWApO1xuICAgICAgfVxuICAgIH07XG4gICAgc2F2ZVVzZXJEYXRhKCk7XG4gIH0sIFtjYXRlZ29yaWVzLCBwcm9kdWN0cywgaXNEYXRhTG9hZGVkLCB1c2VyLnVpZF0pO1xuXG4gIGNvbnN0IFthcGlLZXlzLCBzZXRBcGlLZXlzXSA9IHVzZVN0YXRlPHN0cmluZ1tdPigoKSA9PiB7XG4gICAgbGV0IGtleXMgPSBbJycsICcnLCAnJ107XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0b3JlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBjb3NtZXRpY3NfZ2VtaW5pX2FwaV9rZXlzXyR7dXNlci51aWR9YCk7XG4gICAgICBpZiAoc3RvcmVkKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2Uoc3RvcmVkKTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyc2VkKSkge1xuICAgICAgICAgICBrZXlzID0gWy4uLnBhcnNlZCwgJycsICcnLCAnJ10uc2xpY2UoMCwgMyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG9sZEtleSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjb3NtZXRpY3NfZ2VtaW5pX2FwaV9rZXknKTtcbiAgICAgICAgaWYgKG9sZEtleSkge1xuICAgICAgICAgICBrZXlzWzBdID0gb2xkS2V5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7fVxuICAgIHJldHVybiBrZXlzO1xuICB9KTtcbiAgXG4gIGNvbnN0IGFwaUtleUluZGV4UmVmID0gdXNlUmVmKDApO1xuICBjb25zdCBnZXRHZW1pbmlBcGlLZXkgPSAoKSA9PiB7XG4gICAgY29uc3QgdmFsaWRLZXlzID0gYXBpS2V5cy5maWx0ZXIoayA9PiBrLnRyaW0oKS5sZW5ndGggPiAwKTtcbiAgICBpZiAodmFsaWRLZXlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3Qga2V5ID0gdmFsaWRLZXlzW2FwaUtleUluZGV4UmVmLmN1cnJlbnQgJSB2YWxpZEtleXMubGVuZ3RoXTtcbiAgICBhcGlLZXlJbmRleFJlZi5jdXJyZW50ICs9IDE7XG4gICAgcmV0dXJuIGtleTtcbiAgfTtcblxuICBjb25zdCBbYXBwVGhlbWUsIHNldEFwcFRoZW1lXSA9IHVzZVN0YXRlPCdyZXRybycgfCAncGl4ZWwnIHwgJ21pbmltYWwnPigoKSA9PiB7XG4gICAgcmV0dXJuIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY29zbWV0aWNzX3RoZW1lJykgYXMgJ3JldHJvJyB8ICdwaXhlbCcgfCAnbWluaW1hbCcpIHx8ICdyZXRybyc7XG4gIH0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBpZiAoYXBwVGhlbWUgPT09ICdwaXhlbCcpIHtcbiAgICAgIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ3BpeGVsJyk7XG4gICAgfSBlbHNlIGlmIChhcHBUaGVtZSA9PT0gJ21pbmltYWwnKSB7XG4gICAgICByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsICdtaW5pbWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXRoZW1lJyk7XG4gICAgfVxuICB9LCBbYXBwVGhlbWVdKTtcblxuICBjb25zdCBoYW5kbGVUaGVtZUNoYW5nZSA9ICh0aGVtZTogJ3JldHJvJyB8ICdwaXhlbCcgfCAnbWluaW1hbCcpID0+IHtcbiAgICBzZXRBcHBUaGVtZSh0aGVtZSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Nvc21ldGljc190aGVtZScsIHRoZW1lKTtcbiAgfTtcblxuICBjb25zdCBbYXBwRm9udFNpemUsIHNldEFwcEZvbnRTaXplXSA9IHVzZVN0YXRlPCdzbWFsbCcgfCAnbWVkaXVtJyB8ICdsYXJnZSc+KCgpID0+IHtcbiAgICByZXR1cm4gKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjb3NtZXRpY3NfZm9udF9zaXplJykgYXMgJ3NtYWxsJyB8ICdtZWRpdW0nIHwgJ2xhcmdlJykgfHwgJ3NtYWxsJztcbiAgfSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCByb290ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIGlmIChhcHBGb250U2l6ZSA9PT0gJ3NtYWxsJykge1xuICAgICAgcm9vdC5zdHlsZS5mb250U2l6ZSA9ICcxNnB4JztcbiAgICB9IGVsc2UgaWYgKGFwcEZvbnRTaXplID09PSAnbWVkaXVtJykge1xuICAgICAgcm9vdC5zdHlsZS5mb250U2l6ZSA9ICcxOHB4JztcbiAgICB9IGVsc2UgaWYgKGFwcEZvbnRTaXplID09PSAnbGFyZ2UnKSB7XG4gICAgICByb290LnN0eWxlLmZvbnRTaXplID0gJzIwcHgnO1xuICAgIH1cbiAgfSwgW2FwcEZvbnRTaXplXSk7XG5cbiAgY29uc3QgaGFuZGxlRm9udFNpemVDaGFuZ2UgPSAoc2l6ZTogJ3NtYWxsJyB8ICdtZWRpdW0nIHwgJ2xhcmdlJykgPT4ge1xuICAgIHNldEFwcEZvbnRTaXplKHNpemUpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjb3NtZXRpY3NfZm9udF9zaXplJywgc2l6ZSk7XG4gIH07XG5cbiAgY29uc3QgW2N1cnJlbnRUYWIsIHNldEN1cnJlbnRUYWJdID0gdXNlU3RhdGU8c3RyaW5nPigoKSA9PiB7XG4gICAgcmV0dXJuIGNhdGVnb3JpZXNbMF0/LmlkIHx8ICdtYWtldXAnO1xuICB9KTtcblxuICBjb25zdCBbc2VhcmNoS2V5d29yZCwgc2V0U2VhcmNoS2V5d29yZF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtzaG93QWRkRm9ybSwgc2V0U2hvd0FkZEZvcm1dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbdG9hc3RNZXNzYWdlLCBzZXRUb2FzdE1lc3NhZ2VdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtleHBhbmRlZFByb2R1Y3RJZHMsIHNldEV4cGFuZGVkUHJvZHVjdElkc10gPSB1c2VTdGF0ZTxTZXQ8c3RyaW5nPj4obmV3IFNldChbJ3Byb2RfMSddKSk7XG5cbiAgLy8gLS0tIEdlbWluaSBBUEkgTG9hZGluZyBTdGF0ZXMgLS0tXG4gIGNvbnN0IFtpc0FuYWx5emluZywgc2V0SXNBbmFseXppbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaXNTZWFyY2hpbmdBaSwgc2V0SXNTZWFyY2hpbmdBaV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthaVN0YXR1c1RleHQsIHNldEFpU3RhdHVzVGV4dF0gPSB1c2VTdGF0ZSgn5q2j5Zyo6JmV55CG5ZyW54mHLi4uJyk7XG5cbiAgLy8gLS0tIEZvcm0gSW5wdXQgU3RhdGVzIC0tLVxuICBjb25zdCBbZm9ybUJyYW5kLCBzZXRGb3JtQnJhbmRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZm9ybU5hbWUsIHNldEZvcm1OYW1lXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2Zvcm1DYXRlZ29yeSwgc2V0Rm9ybUNhdGVnb3J5XSA9IHVzZVN0YXRlKCdtYWtldXAnKTtcbiAgY29uc3QgW2Zvcm1TdWJjYXRlZ29yeSwgc2V0Rm9ybVN1YmNhdGVnb3J5XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2Zvcm1RdHksIHNldEZvcm1RdHldID0gdXNlU3RhdGUoMSk7XG4gIGNvbnN0IFtmb3JtQ2FwYWNpdHksIHNldEZvcm1DYXBhY2l0eV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtmb3JtQ2FwYWNpdHlVbml0LCBzZXRGb3JtQ2FwYWNpdHlVbml0XSA9IHVzZVN0YXRlKCdtbCcpO1xuICBjb25zdCBbZm9ybVVzYWdlLCBzZXRGb3JtVXNhZ2VdID0gdXNlU3RhdGU8J+S9v+eUqOS4rScgfCAn5pyq6ZaL5bCBJyB8ICflt7LnlKjlrownIHwgJ+W3suS4n+ajhCc+KCfkvb/nlKjkuK0nKTtcbiAgY29uc3QgW2Zvcm1UaHJlc2hvbGQsIHNldEZvcm1UaHJlc2hvbGRdID0gdXNlU3RhdGU8bnVtYmVyIHwgc3RyaW5nPigwKTtcbiAgY29uc3QgW2Zvcm1FeHBpcnksIHNldEZvcm1FeHBpcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZm9ybVBhb01vbnRocywgc2V0Rm9ybVBhb01vbnRoc10gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTsgLy8gUEFPIOWPr+S9v+eUqOaciOaVuFxuICBjb25zdCBbZm9ybU9wZW5lZERhdGUsIHNldEZvcm1PcGVuZWREYXRlXSA9IHVzZVN0YXRlKCcnKTsgLy8g6ZaL5bCB5pel5pyfXG4gIGNvbnN0IFtmb3JtRmluaXNoZWREYXRlLCBzZXRGb3JtRmluaXNoZWREYXRlXSA9IHVzZVN0YXRlKCcnKTsgLy8g55So5a6M5oiW5Lif5qOE55qE5pel5pyfXG4gIGNvbnN0IFtmb3JtUGhvdG8sIHNldEZvcm1QaG90b10gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTsgLy8gQmFzZTY0IHN0cmluZ1xuICBjb25zdCBbZm9ybVB1cmNoYXNlRGF0ZSwgc2V0Rm9ybVB1cmNoYXNlRGF0ZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtmb3JtUHVyY2hhc2VQbGFjZSwgc2V0Rm9ybVB1cmNoYXNlUGxhY2VdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZm9ybVByaWNlLCBzZXRGb3JtUHJpY2VdID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFByb2R1Y3QgTWFzdGVyIERldGFpbCBWaWV3IFN0YXRlXG4gIGNvbnN0IFtzZWxlY3RlZERldGFpbFByb2R1Y3QsIHNldFNlbGVjdGVkRGV0YWlsUHJvZHVjdF0gPSB1c2VTdGF0ZTxQcm9kdWN0IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtkZXRhaWxBY3RpdmVUYWIsIHNldERldGFpbEFjdGl2ZVRhYl0gPSB1c2VTdGF0ZTwnc3RhdHVzJyB8ICdwdXJjaGFzZScgfCAndXNhZ2UnPignc3RhdHVzJyk7XG5cbiAgLy8gQ3VzdG9tIENvbmZpcm1hdGlvbiBEaWFsb2cgU3RhdGVcbiAgY29uc3QgW2NvbmZpcm1EaWFsb2csIHNldENvbmZpcm1EaWFsb2ddID0gdXNlU3RhdGU8eyB0aXRsZTogc3RyaW5nOyBtZXNzYWdlOiBzdHJpbmc7IG9uQ29uZmlybTogKCkgPT4gdm9pZCB9IHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gRnVsbHNjcmVlbiBJbWFnZSBNb2RhbCBTdGF0ZVxuICBjb25zdCBbZnVsbHNjcmVlbkltYWdlLCBzZXRGdWxsc2NyZWVuSW1hZ2VdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gQ3JvcHBlciBTdGF0ZXNcbiAgY29uc3QgW2Nyb3BJbWFnZVNyYywgc2V0Q3JvcEltYWdlU3JjXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbaXNDcm9wcGluZ0Zvcm1QaG90bywgc2V0SXNDcm9wcGluZ0Zvcm1QaG90b10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtjcm9wLCBzZXRDcm9wXSA9IHVzZVN0YXRlKHsgeDogMCwgeTogMCB9KTtcbiAgY29uc3QgW3pvb20sIHNldFpvb21dID0gdXNlU3RhdGUoMSk7XG4gIGNvbnN0IFtjcm9wcGVkQXJlYVBpeGVscywgc2V0Q3JvcHBlZEFyZWFQaXhlbHNdID0gdXNlU3RhdGU8YW55PihudWxsKTtcbiAgY29uc3QgW2Nyb3BBc3BlY3QsIHNldENyb3BBc3BlY3RdID0gdXNlU3RhdGU8bnVtYmVyPigxKTtcblxuICBjb25zdCBhc2tDb25maXJtYXRpb24gPSAodGl0bGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBvbkNvbmZpcm06ICgpID0+IHZvaWQpID0+IHtcbiAgICBzZXRDb25maXJtRGlhbG9nKHsgdGl0bGUsIG1lc3NhZ2UsIG9uQ29uZmlybSB9KTtcbiAgfTtcblxuICAvLyBFZGl0aW5nIHN0YXRlXG4gIGNvbnN0IFtlZGl0aW5nSW5zdGFuY2VJZCwgc2V0RWRpdGluZ0luc3RhbmNlSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtlZGl0aW5nUHJvZHVjdElkLCBzZXRFZGl0aW5nUHJvZHVjdElkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbaXNFZGl0aW5nTWFzdGVyLCBzZXRJc0VkaXRpbmdNYXN0ZXJdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaXNBZGRpbmdJbnN0YW5jZVRvRXhpc3RpbmcsIHNldElzQWRkaW5nSW5zdGFuY2VUb0V4aXN0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyAtLS0gU2V0dGluZyBWaWV3IFN0YXRlcyAtLS1cbiAgY29uc3QgW3NldHRpbmdzVmlldywgc2V0U2V0dGluZ3NWaWV3XSA9IHVzZVN0YXRlPCdtZW51JyB8ICdhcGlrZXknIHwgJ2NhdGVnb3J5JyB8ICdoaXN0b3J5Jz4oJ21lbnUnKTtcbiAgY29uc3QgW25ld0NhdE5hbWUsIHNldE5ld0NhdE5hbWVdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbmV3Q2F0SWNvbiwgc2V0TmV3Q2F0SWNvbl0gPSB1c2VTdGF0ZSgnc3BhcmtsZXMnKTtcbiAgY29uc3QgW2FjdGl2ZUNhdGVnb3J5Rm9yU3ViLCBzZXRBY3RpdmVDYXRlZ29yeUZvclN1Yl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW25ld1N1Yk5hbWUsIHNldE5ld1N1Yk5hbWVdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZWRpdGluZ1N1YkNhdElkLCBzZXRFZGl0aW5nU3ViQ2F0SWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtlZGl0aW5nU3ViSWR4LCBzZXRFZGl0aW5nU3ViSWR4XSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZWRpdGluZ1N1Yk5hbWUsIHNldEVkaXRpbmdTdWJOYW1lXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2FwaUtleUlucHV0cywgc2V0QXBpS2V5SW5wdXRzXSA9IHVzZVN0YXRlPHN0cmluZ1tdPihhcGlLZXlzKTtcbiAgY29uc3QgW3Nob3dBcGlLZXksIHNldFNob3dBcGlLZXldID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGhhbmRsZVNhdmVBcGlLZXkgPSAoKSA9PiB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYGNvc21ldGljc19nZW1pbmlfYXBpX2tleXNfJHt1c2VyLnVpZH1gLCBKU09OLnN0cmluZ2lmeShhcGlLZXlJbnB1dHMpKTtcbiAgICBzZXRBcGlLZXlzKGFwaUtleUlucHV0cyk7XG4gICAgc2hvd1RvYXN0KCdHZW1pbmkgQVBJIOmHkemRsOWEsuWtmOaIkOWKn++8gScpO1xuICB9O1xuXG4gIC8vIC0tLSBOb3RpZmljYXRpb24gQ2VudGVyIFN0YXRlcyAtLS1cbiAgY29uc3QgW2V4cGlyZWRQYW9JdGVtcywgc2V0RXhwaXJlZFBhb0l0ZW1zXSA9IHVzZVN0YXRlPGFueVtdPihbXSk7XG4gIGNvbnN0IFtzaG93Tm90aWZpY2F0aW9uQmFubmVyLCBzZXRTaG93Tm90aWZpY2F0aW9uQmFubmVyXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIC8vIC0tLSBEcmFnICYgRHJvcCBSZW9yZGVyaW5nIFN0YXRlcyAtLS1cbiAgY29uc3QgW2RyYWdnZWRDYXRJZHgsIHNldERyYWdnZWRDYXRJZHhdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtkcmFnZ2VkU3ViSWR4LCBzZXREcmFnZ2VkU3ViSWR4XSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZHJhZ2dlZFN1YkNhdElkLCBzZXREcmFnZ2VkU3ViQ2F0SWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gUmVmc1xuICBjb25zdCBmaWxlSW5wdXRSZWYgPSB1c2VSZWY8SFRNTElucHV0RWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IGdhbGxlcnlJbnB1dFJlZiA9IHVzZVJlZjxIVE1MSW5wdXRFbGVtZW50PihudWxsKTtcbiAgY29uc3QgZm9ybVBob3RvSW5wdXRSZWYgPSB1c2VSZWY8SFRNTElucHV0RWxlbWVudD4obnVsbCk7XG5cbiAgXG4gIFxuICAvLyAtLS0gSGFyZHdhcmUgQmFjayBCdXR0b24gSGFuZGxpbmcgLS0tXG4gIGNvbnN0IGV4cGVjdGVkSGFzaCA9IGNvbmZpcm1EaWFsb2cgPyAnI2NvbmZpcm0nIFxuICAgIDogY3JvcEltYWdlU3JjID8gJyNjcm9wJyBcbiAgICA6IGZ1bGxzY3JlZW5JbWFnZSA/ICcjaW1hZ2UnIFxuICAgIDogc2hvd0FkZEZvcm0gPyAnI2FkZCdcbiAgICA6IHNlbGVjdGVkRGV0YWlsUHJvZHVjdCA/ICcjZGV0YWlsJ1xuICAgIDogKGN1cnJlbnRUYWIgPT09ICdzZXR0aW5ncycgJiYgc2V0dGluZ3NWaWV3ID09PSAnY2F0ZWdvcnknKSA/ICcjc2V0dGluZ3MtY2F0ZWdvcnknXG4gICAgOiAoY3VycmVudFRhYiA9PT0gJ3NldHRpbmdzJyAmJiBzZXR0aW5nc1ZpZXcgPT09ICdoaXN0b3J5JykgPyAnI3NldHRpbmdzLWhpc3RvcnknXG4gICAgOiAoY3VycmVudFRhYiA9PT0gJ3NldHRpbmdzJyAmJiBzZXR0aW5nc1ZpZXcgPT09ICdhcGlrZXknKSA/ICcjc2V0dGluZ3MtYXBpa2V5J1xuICAgIDogJyc7XG5cbiAgY29uc3QgZ2V0SGFzaERlcHRoID0gKGhhc2g6IHN0cmluZykgPT4ge1xuICAgIGlmIChoYXNoID09PSAnI2NvbmZpcm0nKSByZXR1cm4gNTtcbiAgICBpZiAoaGFzaCA9PT0gJyNjcm9wJyB8fCBoYXNoID09PSAnI2ltYWdlJykgcmV0dXJuIDQ7XG4gICAgaWYgKGhhc2ggPT09ICcjYWRkJyB8fCBoYXNoID09PSAnI2RldGFpbCcpIHJldHVybiAzO1xuICAgIGlmIChoYXNoLnN0YXJ0c1dpdGgoJyNzZXR0aW5ncy0nKSkgcmV0dXJuIDI7XG4gICAgcmV0dXJuIDE7XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBzeW5jVXJsVG9TdGF0ZSA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRIYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgICBpZiAoY3VycmVudEhhc2ggIT09IGV4cGVjdGVkSGFzaCkge1xuICAgICAgICBjb25zdCBleHBlY3RlZERlcHRoID0gZ2V0SGFzaERlcHRoKGV4cGVjdGVkSGFzaCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnREZXB0aCA9IGdldEhhc2hEZXB0aChjdXJyZW50SGFzaCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoZXhwZWN0ZWREZXB0aCA+IGN1cnJlbnREZXB0aCkge1xuICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCAnJywgZXhwZWN0ZWRIYXNoKTtcbiAgICAgICAgfSBlbHNlIGlmIChleHBlY3RlZERlcHRoIDwgY3VycmVudERlcHRoKSB7XG4gICAgICAgICAgLy8gVW53aW5kIHRoZSBzdGFjayB1bnRpbCBpdCBtYXRjaGVzXG4gICAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShudWxsLCAnJywgZXhwZWN0ZWRIYXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLy8gUnVuIGluaXRpYWxseSBhbmQgd2hlbmV2ZXIgZXhwZWN0ZWRIYXNoIGNoYW5nZXNcbiAgICBzeW5jVXJsVG9TdGF0ZSgpO1xuICAgIFxuICAgIC8vIEFsc28gcnVuIHdoZW4gaGFzaCBjaGFuZ2VzIChlLmcuIGZyb20gYSBiYWNrKCkgY2FsbCB1bndpbmRpbmcgdGhlIHN0YWNrKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgc3luY1VybFRvU3RhdGUpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHN5bmNVcmxUb1N0YXRlKTtcbiAgfSwgW2V4cGVjdGVkSGFzaF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlUG9wU3RhdGUgPSAoKSA9PiB7XG4gICAgICBjb25zdCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgICBcbiAgICAgIGlmIChoYXNoID09PSAnJyB8fCBoYXNoID09PSAnIycpIHtcbiAgICAgICAgc2V0Q29uZmlybURpYWxvZyhudWxsKTtcbiAgICAgICAgc2V0Q3JvcEltYWdlU3JjKG51bGwpO1xuICAgICAgICBzZXRGdWxsc2NyZWVuSW1hZ2UobnVsbCk7XG4gICAgICAgIHNldFNob3dBZGRGb3JtKGZhbHNlKTtcbiAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KG51bGwpO1xuICAgICAgICBpZiAoc2V0dGluZ3NWaWV3ICE9PSAnbWVudScpIHNldFNldHRpbmdzVmlldygnbWVudScpO1xuICAgICAgfSBlbHNlIGlmIChoYXNoID09PSAnI3NldHRpbmdzLWNhdGVnb3J5Jykge1xuICAgICAgICBzZXRDb25maXJtRGlhbG9nKG51bGwpO1xuICAgICAgICBzZXRDcm9wSW1hZ2VTcmMobnVsbCk7XG4gICAgICAgIHNldEZ1bGxzY3JlZW5JbWFnZShudWxsKTtcbiAgICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgICBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QobnVsbCk7XG4gICAgICAgIGlmIChzZXR0aW5nc1ZpZXcgIT09ICdjYXRlZ29yeScpIHNldFNldHRpbmdzVmlldygnY2F0ZWdvcnknKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzaCA9PT0gJyNzZXR0aW5ncy1oaXN0b3J5Jykge1xuICAgICAgICBzZXRDb25maXJtRGlhbG9nKG51bGwpO1xuICAgICAgICBzZXRDcm9wSW1hZ2VTcmMobnVsbCk7XG4gICAgICAgIHNldEZ1bGxzY3JlZW5JbWFnZShudWxsKTtcbiAgICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgICBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QobnVsbCk7XG4gICAgICAgIGlmIChzZXR0aW5nc1ZpZXcgIT09ICdoaXN0b3J5Jykgc2V0U2V0dGluZ3NWaWV3KCdoaXN0b3J5Jyk7XG4gICAgICB9IGVsc2UgaWYgKGhhc2ggPT09ICcjc2V0dGluZ3MtYXBpa2V5Jykge1xuICAgICAgICBzZXRDb25maXJtRGlhbG9nKG51bGwpO1xuICAgICAgICBzZXRDcm9wSW1hZ2VTcmMobnVsbCk7XG4gICAgICAgIHNldEZ1bGxzY3JlZW5JbWFnZShudWxsKTtcbiAgICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgICBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QobnVsbCk7XG4gICAgICAgIGlmIChzZXR0aW5nc1ZpZXcgIT09ICdhcGlrZXknKSBzZXRTZXR0aW5nc1ZpZXcoJ2FwaWtleScpO1xuICAgICAgfSBlbHNlIGlmIChoYXNoID09PSAnI2FkZCcpIHtcbiAgICAgICAgc2V0Q29uZmlybURpYWxvZyhudWxsKTtcbiAgICAgICAgc2V0Q3JvcEltYWdlU3JjKG51bGwpO1xuICAgICAgICBzZXRGdWxsc2NyZWVuSW1hZ2UobnVsbCk7XG4gICAgICAgIHNldFNlbGVjdGVkRGV0YWlsUHJvZHVjdChudWxsKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzaCA9PT0gJyNkZXRhaWwnKSB7XG4gICAgICAgIHNldENvbmZpcm1EaWFsb2cobnVsbCk7XG4gICAgICAgIHNldENyb3BJbWFnZVNyYyhudWxsKTtcbiAgICAgICAgc2V0RnVsbHNjcmVlbkltYWdlKG51bGwpO1xuICAgICAgICBzZXRTaG93QWRkRm9ybShmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIGhhbmRsZVBvcFN0YXRlKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgaGFuZGxlUG9wU3RhdGUpO1xuICB9LCBbc2V0dGluZ3NWaWV3XSk7XG5cbiAgLy8gLS0tIFNpZGUgRWZmZWN0cyAmIFBlcnNpc3RlbmNlIC0tLVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIFJlLWV2YWx1YXRlIGV4cGlyZWQgUEFPIHByb2R1Y3RzIHdoZW5ldmVyIHByb2R1Y3RzIGNoYW5nZVxuICAgIGNvbnN0IGV4cGlyZWQgPSBjaGVja0FsbE9wZW5lZEV4cGlyZWRQcm9kdWN0cyhwcm9kdWN0cyk7XG4gICAgc2V0RXhwaXJlZFBhb0l0ZW1zKGV4cGlyZWQpO1xuICB9LCBbcHJvZHVjdHNdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIEluaXRpYWwgc2NhbiBmb3IgZXhwaXJlZCBpdGVtc1xuICAgIGNvbnN0IGV4cGlyZWQgPSBjaGVja0FsbE9wZW5lZEV4cGlyZWRQcm9kdWN0cyhwcm9kdWN0cyk7XG4gICAgc2V0RXhwaXJlZFBhb0l0ZW1zKGV4cGlyZWQpO1xuICB9LCBbXSk7XG5cbiAgLy8gU3luYyB0YWIgd2l0aCB1cGRhdGVkIGNhdGVnb3JpZXMgaWYgY3VycmVudCB0YWIncyBjYXRlZ29yeSB3YXMgZGVsZXRlZFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaXNEYXRhTG9hZGVkKSByZXR1cm47XG4gICAgaWYgKGN1cnJlbnRUYWIgIT09ICdzZXR0aW5ncycgJiYgY3VycmVudFRhYiAhPT0gJ2hpc3RvcnknICYmICFjYXRlZ29yaWVzLnNvbWUoYyA9PiBjLmlkID09PSBjdXJyZW50VGFiKSkge1xuICAgICAgaWYgKGNhdGVnb3JpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBzZXRDdXJyZW50VGFiKGNhdGVnb3JpZXNbMF0uaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Q3VycmVudFRhYignc2V0dGluZ3MnKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtjYXRlZ29yaWVzLCBjdXJyZW50VGFiLCBpc0RhdGFMb2FkZWRdKTtcblxuICAvLyBIYW5kbGUgVXNhZ2Ugc3RhdHVzIHN3aXRjaCAtIGF1dG8gZmlsbCBvcGVuIGRhdGUgaWYgdXNhZ2UgaXMgJ+S9v+eUqOS4rScgYW5kIGl0IGlzIGJsYW5rXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGZvcm1Vc2FnZSA9PT0gJ+S9v+eUqOS4rScgJiYgIWZvcm1PcGVuZWREYXRlKSB7XG4gICAgICBzZXRGb3JtT3BlbmVkRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSk7XG4gICAgfVxuICAgIGlmICgoZm9ybVVzYWdlID09PSAn5bey55So5a6MJyB8fCBmb3JtVXNhZ2UgPT09ICflt7LkuJ/mo4QnKSAmJiAhZm9ybUZpbmlzaGVkRGF0ZSkge1xuICAgICAgc2V0Rm9ybUZpbmlzaGVkRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSk7XG4gICAgfVxuICB9LCBbZm9ybVVzYWdlXSk7XG5cbiAgLy8gLS0tIFRvYXN0IE1hbmFnZXIgLS0tXG4gIGNvbnN0IHNob3dUb2FzdCA9IChtc2c6IHN0cmluZykgPT4ge1xuICAgIHNldFRvYXN0TWVzc2FnZShtc2cpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2V0VG9hc3RNZXNzYWdlKG51bGwpO1xuICAgIH0sIDMwMDApO1xuICB9O1xuXG4gIC8vIC0tLSBGaWxlIHVwbG9hZHMgJiBQaG90byBIYW5kbGluZyAtLS1cbiAgY29uc3QgaGFuZGxlUGhvdG9VcGxvYWQgPSAoZTogUmVhY3QuQ2hhbmdlRXZlbnQ8SFRNTElucHV0RWxlbWVudD4sIGlzRm9ybVBob3RvOiBib29sZWFuKSA9PiB7XG4gICAgY29uc3QgZmlsZSA9IGUudGFyZ2V0LmZpbGVzPy5bMF07XG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIub25sb2FkZW5kID0gKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSByZWFkZXIucmVzdWx0IGFzIHN0cmluZztcbiAgICAgICAgc2V0Q3JvcEltYWdlU3JjKHJlc3VsdCk7XG4gICAgICAgIHNldElzQ3JvcHBpbmdGb3JtUGhvdG8oaXNGb3JtUGhvdG8pO1xuICAgICAgfTtcbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBvbkNyb3BDb21wbGV0ZSA9IChjcm9wcGVkQXJlYTogYW55LCBjcm9wcGVkQXJlYVBpeGVsczogYW55KSA9PiB7XG4gICAgc2V0Q3JvcHBlZEFyZWFQaXhlbHMoY3JvcHBlZEFyZWFQaXhlbHMpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUNyb3BDb25maXJtID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY3JvcEltYWdlU3JjIHx8ICFjcm9wcGVkQXJlYVBpeGVscykgcmV0dXJuO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjcm9wcGVkQmFzZTY0ID0gYXdhaXQgZ2V0Q3JvcHBlZEltZyhjcm9wSW1hZ2VTcmMsIGNyb3BwZWRBcmVhUGl4ZWxzKTtcbiAgICAgIFxuICAgICAgLy8gQ2xvc2UgY3JvcHBlciBtb2RhbFxuICAgICAgc2V0Q3JvcEltYWdlU3JjKG51bGwpO1xuICAgICAgc2V0Q3JvcHBlZEFyZWFQaXhlbHMobnVsbCk7XG5cbiAgICAgIC8vIE5vdyBkbyB0aGUgc2FtZSByZXNpemUgbG9naWMgYXMgYmVmb3JlIGlmIG5lZWRlZCwgb3IganVzdCB1cGxvYWQgdGhlIGNyb3BwZWQgaW1hZ2UgZGlyZWN0bHlcbiAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IE1BWF9XSURUSCA9IDgwMDtcbiAgICAgICAgY29uc3QgTUFYX0hFSUdIVCA9IDgwMDtcbiAgICAgICAgbGV0IHdpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICBsZXQgaGVpZ2h0ID0gaW1nLmhlaWdodDtcblxuICAgICAgICBpZiAod2lkdGggPiBoZWlnaHQpIHtcbiAgICAgICAgICBpZiAod2lkdGggPiBNQVhfV0lEVEgpIHtcbiAgICAgICAgICAgIGhlaWdodCAqPSBNQVhfV0lEVEggLyB3aWR0aDtcbiAgICAgICAgICAgIHdpZHRoID0gTUFYX1dJRFRIO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoaGVpZ2h0ID4gTUFYX0hFSUdIVCkge1xuICAgICAgICAgICAgd2lkdGggKj0gTUFYX0hFSUdIVCAvIGhlaWdodDtcbiAgICAgICAgICAgIGhlaWdodCA9IE1BWF9IRUlHSFQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBjdHg/LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8gQ29tcHJlc3MgYXMgSlBFR1xuICAgICAgICBjb25zdCBjb21wcmVzc2VkQmFzZTY0ID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIDAuOCk7XG5cbiAgICAgICAgaWYgKGlzQ3JvcHBpbmdGb3JtUGhvdG8pIHtcbiAgICAgICAgICAvLyBVcGxvYWQgdG8gRmlyZWJhc2UgU3RvcmFnZVxuICAgICAgICAgIGNvbnN0IHVwbG9hZFRvU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgICBzZXRUb2FzdE1lc3NhZ2UoJ+iri+WFiOeZu+WFpScpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRJc0FuYWx5emluZyh0cnVlKTtcbiAgICAgICAgICAgIHNldFRvYXN0TWVzc2FnZSgn5LiK5YKz5ZyW54mH5LitLi4uJyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzdG9yYWdlUmVmID0gcmVmKHN0b3JhZ2UsIGB1c2Vycy8ke3VzZXIudWlkfS9wcm9kdWN0cy8ke0RhdGUubm93KCl9LmpwZ2ApO1xuICAgICAgICAgICAgICBhd2FpdCB1cGxvYWRTdHJpbmcoc3RvcmFnZVJlZiwgY29tcHJlc3NlZEJhc2U2NCwgJ2RhdGFfdXJsJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGRvd25sb2FkVVJMID0gYXdhaXQgZ2V0RG93bmxvYWRVUkwoc3RvcmFnZVJlZik7XG4gICAgICAgICAgICAgIHNldEZvcm1QaG90byhkb3dubG9hZFVSTCk7XG4gICAgICAgICAgICAgIHNldFRvYXN0TWVzc2FnZSgn5ZyW54mH5LiK5YKz5oiQ5YqfJyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VwbG9hZCBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgICAgIHNldFRvYXN0TWVzc2FnZShg5ZyW54mH5LiK5YKz5aSx5pWXOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICBzZXRJc0FuYWx5emluZyhmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICB1cGxvYWRUb1N0b3JhZ2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDYW1lcmEgc2NhbiB0cmlnZ2VyXG4gICAgICAgICAgdHJpZ2dlckFpU2Nhbihjb21wcmVzc2VkQmFzZTY0LCAnaW1hZ2UvanBlZycpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaW1nLnNyYyA9IGNyb3BwZWRCYXNlNjQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIHNob3dUb2FzdCgn5ZyW54mH6KOB5YiH5aSx5pWXJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUNyb3BDYW5jZWwgPSAoKSA9PiB7XG4gICAgc2V0Q3JvcEltYWdlU3JjKG51bGwpO1xuICAgIHNldENyb3BwZWRBcmVhUGl4ZWxzKG51bGwpO1xuICB9O1xuXG4gIC8vIC0tLSBBUEkgQ2FsbDogR2VtaW5pIFdlYiBTZWFyY2ggJiBJbWFnZSBSZWNvZ25pdGlvbiAtLS1cbiAgY29uc3QgdHJpZ2dlckFpU2NhbiA9IGFzeW5jIChiYXNlNjREYXRhOiBzdHJpbmcsIG1pbWVUeXBlOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBhY3RpdmVBcGlLZXkgPSBnZXRHZW1pbmlBcGlLZXkoKTtcbiAgICBpZiAoIWFjdGl2ZUFwaUtleSkge1xuICAgICAgc2hvd1RvYXN0KCflsJrmnKroqK3lrpogQVBJIEtlee+8jOiri+WcqOioreWumumggemdoui8uOWFpemHkemRsO+8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldElzQW5hbHl6aW5nKHRydWUpO1xuICAgIHNldEFpU3RhdHVzVGV4dCgn5q2j5Zyo5LiK5YKz5Lim6Kej5p6Q5ZyW54mHLi4uJyk7XG5cbiAgICAvLyBCdWlsZCBjYXRlZ29yeSBvcHRpb25zIHN0cmluZ1xuICAgIGNvbnN0IGNhdGVnb3J5T3B0aW9ucyA9IGNhdGVnb3JpZXMubWFwKGMgPT4gXG4gICAgICBgLSAke2MubmFtZX0gKGlkOiAke2MuaWR9KSwg5a2Q5YiG6aGeOiAke2Muc3ViY2F0ZWdvcmllcy5qb2luKCcsICcpfWBcbiAgICApLmpvaW4oJ1xcbicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJhc2U2NFN0cmluZyA9IGJhc2U2NERhdGEuc3BsaXQoJywnKVsxXTtcbiAgICAgIGNvbnN0IHVybCA9IGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzL2dlbWluaS0yLjUtZmxhc2g6Z2VuZXJhdGVDb250ZW50P2tleT0ke2FjdGl2ZUFwaUtleX1gO1xuICAgICAgXG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICBjb250ZW50czogW3tcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBwYXJ0czogW1xuICAgICAgICAgICAgeyB0ZXh0OiBg5YiG5p6Q5q2k5YyW5aad5ZOBL+S/nemkiuWTgS/llYblk4HlnJbniYfvvIzovqjorZjlh7rlk4HniYzlkI3nqLHvvIhicmFuZO+8ieiIh+eUouWTgeWFqOWQje+8iG5hbWXvvInvvIzkuKbliKTmlrfmnIDlkIjpgannmoTkuLvpoZ7liKXvvIhjYXRlZ29yee+8ieiIh+WtkOWIhumhnu+8iHN1YmNhdGVnb3J577yJ44CCXG7lpoLmnpzllYblk4HlkI3nqLHkuI3mmK/kuK3mlofvvIjlpoLml6XmlofjgIHoi7HmlofjgIHpn5PmlofnrYnvvInvvIzoq4vlsIfnlKLlk4HlhajlkI3vvIhuYW1l77yJ57+76K2v5oiQ57mB6auU5Lit5paH44CCXG5cbuiri+W+nuS7peS4i+ePvuacieWIhumhnuS4re+8jOaMkemBuOWHuuacgOmBqeWQiOatpOeUouWTgeeahOS4u+mhnuWIpSBpZCDoiIflrZDliIbpoZ7lkI3nqLHvvJpcbiR7Y2F0ZWdvcnlPcHRpb25zfVxuXG7lm57lgrPlmrTmoLznmoQgSlNPTiDmoLzlvI/vvIzljIXlkKvlm5vlgIsga2V5OiBcbidicmFuZCcgKOWtl+S4silcbiduYW1lJyAo5a2X5LiyKVxuJ2NhdGVnb3J5JyAo5a2X5Liy77yM5Li75YiG6aGeIGlkKVxuJ3N1YmNhdGVnb3J5JyAo5a2X5Liy77yM5a2Q5YiG6aGe5ZCN56ixKVxuXG7lj6rlm57lgrPntJQgSlNPTiDlhaflrrnljbPlj6/vvIzkuI3opoHljIXoo50gbWFya2Rvd24g5LiJ5YCL5Y+N5byV6Jmf44CCYCB9LFxuICAgICAgICAgICAgeyBpbmxpbmVEYXRhOiB7IG1pbWVUeXBlOiBtaW1lVHlwZSB8fCAnaW1hZ2UvanBlZycsIGRhdGE6IGJhc2U2NFN0cmluZyB9IH1cbiAgICAgICAgICBdXG4gICAgICAgIH1dLFxuICAgICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7IHJlc3BvbnNlTWltZVR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBFcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIGNvbnN0IHRleHQgPSByZXN1bHQuY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xuICAgICAgXG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZSh0ZXh0LnRyaW0oKSk7XG4gICAgICAgIHNldEZvcm1CcmFuZChkYXRhLmJyYW5kIHx8ICcnKTtcbiAgICAgICAgc2V0Rm9ybU5hbWUoZGF0YS5uYW1lIHx8ICcnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEZpbmQgaWYgZGV0ZWN0ZWQgY2F0ZWdvcnkgbWF0Y2hlcyBvdXIgb3B0aW9uc1xuICAgICAgICBjb25zdCBtYXRjaENhdCA9IGNhdGVnb3JpZXMuZmluZChjID0+IGMuaWQgPT09IGRhdGEuY2F0ZWdvcnkgfHwgYy5uYW1lLmluY2x1ZGVzKGRhdGEuY2F0ZWdvcnkpKTtcbiAgICAgICAgaWYgKG1hdGNoQ2F0KSB7XG4gICAgICAgICAgc2V0Rm9ybUNhdGVnb3J5KG1hdGNoQ2F0LmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRGb3JtQ2F0ZWdvcnkoY2F0ZWdvcmllc1swXT8uaWQgfHwgJ21ha2V1cCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuc3ViY2F0ZWdvcnkpIHtcbiAgICAgICAgICBzZXRGb3JtU3ViY2F0ZWdvcnkoZGF0YS5zdWJjYXRlZ29yeSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRGb3JtUGhvdG8oYmFzZTY0RGF0YSk7XG4gICAgICAgIHNldEVkaXRpbmdJbnN0YW5jZUlkKG51bGwpO1xuICAgICAgICBzZXRFZGl0aW5nUHJvZHVjdElkKG51bGwpO1xuICAgICAgICBcbiAgICAgICAgLy8gUmVzZXQgc2Vjb25kYXJ5IGZvcm0gaXRlbXNcbiAgICAgICAgc2V0Rm9ybVF0eSgxKTtcbiAgICAgICAgc2V0Rm9ybUNhcGFjaXR5KCcnKTtcbiAgICAgICAgc2V0Rm9ybUNhcGFjaXR5VW5pdCgnbWwnKTtcbiAgICAgICAgc2V0Rm9ybVVzYWdlKCfkvb/nlKjkuK0nKTtcbiAgICAgICAgc2V0Rm9ybVRocmVzaG9sZCgwKTtcbiAgICAgICAgc2V0Rm9ybUV4cGlyeSgnJyk7XG4gICAgICAgIHNldEZvcm1QYW9Nb250aHMoJycpO1xuICAgICAgICBzZXRGb3JtT3BlbmVkRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSk7XG4gICAgICAgIHNldEZvcm1GaW5pc2hlZERhdGUoJycpO1xuXG4gICAgICAgIHNldFNob3dBZGRGb3JtKHRydWUpO1xuICAgICAgICBzaG93VG9hc3QoJ0FJIOW9seWDj+i+qOitmOaIkOWKn++8jOW3suWwh+izh+aWmeWhq+WFpeihqOWWru+8gScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBwYXJzaW5nIHJlc3VsdHMgcmV0dXJuZWQuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICBzaG93VG9hc3QoJ0FJIOi+qOitmOWkseaVl++8jOiri+aqouafpSBBUEkgS2V5IOaYr+WQpuato+eiuuOAgicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRJc0FuYWx5emluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUFpV2ViU2VhcmNoID0gYXN5bmMgKGU6IFJlYWN0Lk1vdXNlRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3Qga2V5d29yZCA9IGAke2Zvcm1CcmFuZH0gJHtmb3JtTmFtZX1gLnRyaW0oKTtcbiAgICBpZiAoa2V5d29yZC5sZW5ndGggPCAyKSB7XG4gICAgICBzaG93VG9hc3QoJ+iri+iHs+Wwkei8uOWFpeWTgeeJjOaIlueUouWTgeWQjeeoseWGjemAsuihjOaQnOWwi++8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZUFwaUtleSA9IGdldEdlbWluaUFwaUtleSgpO1xuICAgIGlmICghYWN0aXZlQXBpS2V5KSB7XG4gICAgICBzaG93VG9hc3QoJ+WwmuacquioreWumiBBUEkg6YeR6ZGw77yB6KuL6Iez6Kit5a6a6aCB6Z2i6Kit5a6a5oKo55qEIEdlbWluaSBBUEkgS2V544CCJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0SXNTZWFyY2hpbmdBaSh0cnVlKTtcblxuICAgIC8vIEJ1aWxkIGNhdGVnb3J5IG9wdGlvbnMgc3RyaW5nXG4gICAgY29uc3QgY2F0ZWdvcnlPcHRpb25zID0gY2F0ZWdvcmllcy5tYXAoYyA9PiBcbiAgICAgIGAtICR7Yy5uYW1lfSAoaWQ6ICR7Yy5pZH0pLCDlrZDliIbpoZ46ICR7Yy5zdWJjYXRlZ29yaWVzLmpvaW4oJywgJyl9YFxuICAgICkuam9pbignXFxuJyk7XG5cbiAgICAvLyBUcnkgd2l0aCBHb29nbGUgU2VhcmNoIHRvb2wgZmlyc3RcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvZ2VtaW5pLTMuNS1mbGFzaDpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7YWN0aXZlQXBpS2V5fWA7XG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICBjb250ZW50czogW3tcbiAgICAgICAgICBwYXJ0czogW3tcbiAgICAgICAgICAgIHRleHQ6IGDkvaDmmK/kuIDlgIvlsIjmpa3nmoTljJblpp3lk4HoiIfkv53ppIrlk4Hos4fmlpnluqvliqnnkIbjgIJcbuiri+mHneWwjeS9v+eUqOiAhei8uOWFpeeahOeUouWTgemXnOmNteWtlyBcIiR7a2V5d29yZH1cIiDpgLLooYwgR29vZ2xlIOe2sui3r+aQnOWwi++8jOWwi+aJvuWFtuWwjeaHieeahOOAjOWumOaWueS4reaWhy/oi7Hmloflk4HniYzlkI3nqLHjgI3oiIfjgIzlrpjmlrnlrozmlbTnlKLlk4HlhajlkI3jgI3vvIjkvovlpoLvvJrovLjlhaXjgIzmgKrnjbjllIfoho/jgI3mh4nluLblh7rlk4HniYzjgIxLQVRF44CN44CB55Si5ZOB5ZCN44CM5Yex5am35oCq542457Sa5oyB6Imy5ZSH6IaP44CN77yJ44CCXG5cbuS4puiri+W+nuS7peS4i+ePvuacieWIhumhnuS4re+8jOaMkemBuOWHuuacgOmBqeWQiOatpOeUouWTgeeahOWIhumhnu+8mlxuJHtjYXRlZ29yeU9wdGlvbnN9XG5cbuiri+Wwh+e2sui3r+aQnOWwi+W+l+WIsOeahOeiuuWIh+izh+ioiu+8jOS7peS4i+WIl+WatOagvOeahCBKU09OIOagvOW8j+WbnuWCs++8mlxue1xuICBcImJyYW5kXCI6IFwi5a6Y5pa55ZOB54mM5Lit5paH5oiW6Iux5paH5ZCN56ixICjkvovlpoIgS0FUReOAgURpb3LjgIHpm4XoqanomK3pu5vjgIHlh7HlqbcpXCIsXG4gIFwibmFtZVwiOiBcIuWumOaWueWujOaVtOeUouWTgeWQjeeosSAo5L6L5aaCIOWHseWpt+aAqueNuOe0muaMgeiJsuWUh+iGj+OAgei/quWlp+eyvuiQg+WGjeeUn+eOq+eRsOW+ruWwjueyieW6lSlcIixcbiAgXCJjYXRlZ29yeVwiOiBcIumBuOWHuueahOS4u+WIhumhniBpZCAo5L6L5aaCIG1ha2V1cClcIixcbiAgXCJzdWJjYXRlZ29yeVwiOiBcIumBuOWHuueahOWtkOWIhumhnuWQjeeosSAo5L6L5aaCIOWUh+iGjylcIlxufVxuXG7oq4vli5nlv4Xkvb/nlKggR29vZ2xlIOaQnOWwi+W3peWFt+OAglxu5LiN6KaB5Zue5YKz5Lu75L2V6aGN5aSW55qEIE1hcmtkb3duIOaomeexpOOAgeiou+ino+aIluiqquaYjuaWh+Wtl+OAguWPquWbnuWCsyBKU09OIOagvOW8j+Wtl+S4suOAgmBcbiAgICAgICAgICB9XVxuICAgICAgICB9XSxcbiAgICAgICAgdG9vbHM6IFt7IGdvb2dsZVNlYXJjaDoge30gfV0sXG4gICAgICAgIGdlbmVyYXRpb25Db25maWc6IHsgXG4gICAgICAgICAgcmVzcG9uc2VNaW1lVHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBHb29nbGUgU2VhcmNoIHF1ZXJ5IGZhaWxlZDogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIGxldCB0ZXh0ID0gcmVzdWx0LmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dDtcblxuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgbGV0IGNsZWFuZWQgPSB0ZXh0LnRyaW0oKTtcbiAgICAgICAgaWYgKGNsZWFuZWQuc3RhcnRzV2l0aCgnYGBgJykpIHtcbiAgICAgICAgICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9eYGBgW2EtekEtWl0qXFxuLywgJycpLnJlcGxhY2UoL1xcbmBgYCQvLCAnJykudHJpbSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGNsZWFuZWQpO1xuICAgICAgICBpZiAoZGF0YS5icmFuZCkgc2V0Rm9ybUJyYW5kKGRhdGEuYnJhbmQpO1xuICAgICAgICBpZiAoZGF0YS5uYW1lKSBzZXRGb3JtTmFtZShkYXRhLm5hbWUpO1xuICAgICAgICBpZiAoZGF0YS5jYXRlZ29yeSAmJiBjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBkYXRhLmNhdGVnb3J5KSkge1xuICAgICAgICAgIHNldEZvcm1DYXRlZ29yeShkYXRhLmNhdGVnb3J5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5zdWJjYXRlZ29yeSkge1xuICAgICAgICAgIHNldEZvcm1TdWJjYXRlZ29yeShkYXRhLnN1YmNhdGVnb3J5KTtcbiAgICAgICAgfVxuICAgICAgICBzaG93VG9hc3QoJ+WTgeWQjee2suaQnOijnOWFqOWujOaIkO+8gScpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0dvb2dsZSBTZWFyY2ggdG9vbCBmYWlsZWQsIHRyeWluZyBmYWxsYmFjayBtb2RlbCBnZW5lcmF0aW9uLi4uJywgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjazogVHJ5IFdJVEhPVVQgR29vZ2xlIFNlYXJjaCB0b29sLCB1c2luZyBwcmUtdHJhaW5lZCBrbm93bGVkZ2VcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvZ2VtaW5pLTMuNS1mbGFzaDpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7YWN0aXZlQXBpS2V5fWA7XG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICBjb250ZW50czogW3tcbiAgICAgICAgICBwYXJ0czogW3tcbiAgICAgICAgICAgIHRleHQ6IGDkvaDmmK/kuIDlgIvlsIjmpa3nmoTljJblpp3lk4HoiIfkv53ppIrlk4Hos4fmlpnluqvliqnnkIbjgIJcbuiri+mHneWwjeeUouWTgemXnOmNteWtlyBcIiR7a2V5d29yZH1cIu+8jOagueaTmuS9oOeahOefpeitmOW6q++8jOafpeWHuuWFtuWwjeaHieeahOOAjOWumOaWueS4reaWhy/oi7Hmloflk4HniYzlkI3nqLHjgI3oiIfjgIzlrpjmlrnlrozmlbTnlKLlk4HlhajlkI3jgI3vvIjkvovlpoLvvJrovLjlhaXjgIzmgKrnjbjllIfoho/jgI3mh4nluLblh7rlk4HniYzjgIxLQVRF44CN44CB55Si5ZOB5ZCN44CM5Yex5am35oCq542457Sa5oyB6Imy5ZSH6IaP44CN77yJ44CCXG5cbuS4puiri+W+nuS7peS4i+ePvuacieWIhumhnuS4re+8jOaMkemBuOWHuuacgOmBqeWQiOatpOeUouWTgeeahOWIhumhnu+8mlxuJHtjYXRlZ29yeU9wdGlvbnN9XG5cbuiri+Wwh+ato+eiuueahOizh+ioiu+8jOS7peS4i+WIl+WatOagvOeahCBKU09OIOagvOW8j+WbnuWCs++8mlxue1xuICBcImJyYW5kXCI6IFwi5a6Y5pa55ZOB54mM5Lit5paH5oiW6Iux5paH5ZCN56ixICjkvovlpoIgS0FUReOAgURpb3LjgIHpm4XoqanomK3pu5vjgIHlh7HlqbcpXCIsXG4gIFwibmFtZVwiOiBcIuWumOaWueWujOaVtOeUouWTgeWQjeeosSAo5L6L5aaCIOWHseWpt+aAqueNuOe0muaMgeiJsuWUh+iGj+OAgei/quWlp+eyvuiQg+WGjeeUn+eOq+eRsOW+ruWwjueyieW6lSlcIixcbiAgXCJjYXRlZ29yeVwiOiBcIumBuOWHuueahOS4u+WIhumhniBpZCAo5L6L5aaCIG1ha2V1cClcIixcbiAgXCJzdWJjYXRlZ29yeVwiOiBcIumBuOWHuueahOWtkOWIhumhnuWQjeeosSAo5L6L5aaCIOWUh+iGjylcIlxufVxuXG7kuI3opoHlm57lgrPku7vkvZXpoY3lpJbnmoQgTWFya2Rvd24g5qiZ57Gk44CB6Ki76Kej5oiW6Kqq5piO5paH5a2X44CC5Y+q5Zue5YKzIEpTT04g5qC85byP5a2X5Liy44CCYFxuICAgICAgICAgIH1dXG4gICAgICAgIH1dLFxuICAgICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7IFxuICAgICAgICAgIHJlc3BvbnNlTWltZVR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFsbGJhY2sgbW9kZWwgcXVlcnkgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgbGV0IHRleHQgPSByZXN1bHQuY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xuXG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBsZXQgY2xlYW5lZCA9IHRleHQudHJpbSgpO1xuICAgICAgICBpZiAoY2xlYW5lZC5zdGFydHNXaXRoKCdgYGAnKSkge1xuICAgICAgICAgIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL15gYGBbYS16QS1aXSpcXG4vLCAnJykucmVwbGFjZSgvXFxuYGBgJC8sICcnKS50cmltKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoY2xlYW5lZCk7XG4gICAgICAgIGlmIChkYXRhLmJyYW5kKSBzZXRGb3JtQnJhbmQoZGF0YS5icmFuZCk7XG4gICAgICAgIGlmIChkYXRhLm5hbWUpIHNldEZvcm1OYW1lKGRhdGEubmFtZSk7XG4gICAgICAgIGlmIChkYXRhLmNhdGVnb3J5ICYmIGNhdGVnb3JpZXMuZmluZChjID0+IGMuaWQgPT09IGRhdGEuY2F0ZWdvcnkpKSB7XG4gICAgICAgICAgc2V0Rm9ybUNhdGVnb3J5KGRhdGEuY2F0ZWdvcnkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLnN1YmNhdGVnb3J5KSB7XG4gICAgICAgICAgc2V0Rm9ybVN1YmNhdGVnb3J5KGRhdGEuc3ViY2F0ZWdvcnkpO1xuICAgICAgICB9XG4gICAgICAgIHNob3dUb2FzdCgn5ZOB5ZCNIEFJIOijnOWFqOWujOaIkO+8gScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvd1RvYXN0KCfmnKrmkJzlsIvliLDmm7TlrozmlbTnmoTnlKLlk4Hos4foqIrjgIInKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0FsbCBzZWFyY2gvZ2VuZXJhdGlvbiBhdHRlbXB0cyBmYWlsZWQ6JywgZXJyKTtcbiAgICAgIHNob3dUb2FzdCgn57ay5pCc6KOc5YWo5aSx5pWX77yM6KuL5pS554K65omL5YuV6Ly45YWl44CCJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzU2VhcmNoaW5nQWkoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyAtLS0gQ2F0ZWdvcnkgQWN0aW9ucyAmIGRyYWcvZHJvcCBSZW9yZGVyaW5nIC0tLVxuICBjb25zdCBoYW5kbGVDYXREcmFnU3RhcnQgPSAoZTogUmVhY3QuRHJhZ0V2ZW50LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgc2V0RHJhZ2dlZENhdElkeChpbmRleCk7XG4gICAgZS5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9ICdtb3ZlJztcbiAgfTtcblxuICBjb25zdCBoYW5kbGVDYXREcmFnT3ZlciA9IChlOiBSZWFjdC5EcmFnRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlQ2F0RHJvcCA9IChlOiBSZWFjdC5EcmFnRXZlbnQsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKGRyYWdnZWRDYXRJZHggPT09IG51bGwgfHwgZHJhZ2dlZENhdElkeCA9PT0gaW5kZXgpIHJldHVybjtcbiAgICBjb25zdCBuZXdDYXRzID0gWy4uLmNhdGVnb3JpZXNdO1xuICAgIGNvbnN0IGRyYWdnZWRDYXQgPSBuZXdDYXRzW2RyYWdnZWRDYXRJZHhdO1xuICAgIG5ld0NhdHMuc3BsaWNlKGRyYWdnZWRDYXRJZHgsIDEpO1xuICAgIG5ld0NhdHMuc3BsaWNlKGluZGV4LCAwLCBkcmFnZ2VkQ2F0KTtcbiAgICBzZXRDYXRlZ29yaWVzKG5ld0NhdHMpO1xuICAgIHNldERyYWdnZWRDYXRJZHgobnVsbCk7XG4gICAgc2hvd1RvYXN0KCflpKfliIbpoZ7mjpLluo/lt7Lmm7TmlrDvvIEnKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVBZGRDYXRlZ29yeSA9ICgpID0+IHtcbiAgICBpZiAoIW5ld0NhdE5hbWUudHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoJ+iri+i8uOWFpeWkp+WIhumhnuWQjeeose+8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBuZXdJZCA9IGBjYXRfJHtEYXRlLm5vdygpfWA7XG4gICAgY29uc3QgbmV3Q2F0OiBDYXRlZ29yeSA9IHtcbiAgICAgIGlkOiBuZXdJZCxcbiAgICAgIG5hbWU6IG5ld0NhdE5hbWUudHJpbSgpLFxuICAgICAgaWNvbjogbmV3Q2F0SWNvbixcbiAgICAgIHN1YmNhdGVnb3JpZXM6IFtdXG4gICAgfTtcbiAgICBzZXRDYXRlZ29yaWVzKFsuLi5jYXRlZ29yaWVzLCBuZXdDYXRdKTtcbiAgICBzZXROZXdDYXROYW1lKCcnKTtcbiAgICBzaG93VG9hc3QoYOW3suaIkOWKn+W7uueri+Wkp+WIhumhnuOAjCR7bmV3Q2F0Lm5hbWV944CN77yBYCk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRGVsZXRlQ2F0ZWdvcnkgPSAoY2F0SWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChjYXRlZ29yaWVzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzaG93VG9hc3QoJ+iHs+WwkeW/hemgiOS/neeVmeS4gOWAi+WIhumhnu+8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjYXQgPSBjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBjYXRJZCk7XG4gICAgaWYgKCFjYXQpIHJldHVybjtcbiAgICBhc2tDb25maXJtYXRpb24oXG4gICAgICAn5Yiq6Zmk5aSn5YiG6aGeJyxcbiAgICAgIGDnorrlrpropoHliKrpmaTjgIwke2NhdC5uYW1lfeOAjeWIhumhnuWXju+8n1xcbijms6jmhI/vvJroqbLliIbpoZ7kuIvnmoTmiYDmnInllYblk4HlnKjkuLvnlavpnaLkuK3lsIfmmqvmmYLnhKHms5Xpoa/npLopYCxcbiAgICAgICgpID0+IHtcbiAgICAgICAgc2V0Q2F0ZWdvcmllcyhjYXRlZ29yaWVzLmZpbHRlcihjID0+IGMuaWQgIT09IGNhdElkKSk7XG4gICAgICAgIHNob3dUb2FzdChg5bey5Yiq6Zmk5aSn5YiG6aGe44CMJHtjYXQubmFtZX3jgI1gKTtcbiAgICAgIH1cbiAgICApO1xuICB9O1xuXG4gIC8vIC0tLSBTdWJjYXRlZ29yeSBBY3Rpb25zICYgUmVvcmRlcmluZyAoUmVxdWlyZW1lbnQgMSkgLS0tXG4gIGNvbnN0IGhhbmRsZVN1YkRyYWdTdGFydCA9IChlOiBSZWFjdC5EcmFnRXZlbnQsIGNhdGVnb3J5SWQ6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgIHNldERyYWdnZWRTdWJJZHgoaW5kZXgpO1xuICAgIHNldERyYWdnZWRTdWJDYXRJZChjYXRlZ29yeUlkKTtcbiAgICBlLmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVN1YkRyYWdPdmVyID0gKGU6IFJlYWN0LkRyYWdFdmVudCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVTdWJEcm9wID0gKGU6IFJlYWN0LkRyYWdFdmVudCwgY2F0ZWdvcnlJZDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChkcmFnZ2VkU3ViSWR4ID09PSBudWxsIHx8IGRyYWdnZWRTdWJDYXRJZCAhPT0gY2F0ZWdvcnlJZCB8fCBkcmFnZ2VkU3ViSWR4ID09PSBpbmRleCkgcmV0dXJuO1xuXG4gICAgY29uc3QgdXBkYXRlZCA9IGNhdGVnb3JpZXMubWFwKGNhdCA9PiB7XG4gICAgICBpZiAoY2F0LmlkID09PSBjYXRlZ29yeUlkKSB7XG4gICAgICAgIGNvbnN0IG5ld1N1YnMgPSBbLi4uY2F0LnN1YmNhdGVnb3JpZXNdO1xuICAgICAgICBjb25zdCBkcmFnZ2VkU3ViID0gbmV3U3Vic1tkcmFnZ2VkU3ViSWR4XTtcbiAgICAgICAgbmV3U3Vicy5zcGxpY2UoZHJhZ2dlZFN1YklkeCwgMSk7XG4gICAgICAgIG5ld1N1YnMuc3BsaWNlKGluZGV4LCAwLCBkcmFnZ2VkU3ViKTtcbiAgICAgICAgcmV0dXJuIHsgLi4uY2F0LCBzdWJjYXRlZ29yaWVzOiBuZXdTdWJzIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gY2F0O1xuICAgIH0pO1xuXG4gICAgc2V0Q2F0ZWdvcmllcyh1cGRhdGVkKTtcbiAgICBzZXREcmFnZ2VkU3ViSWR4KG51bGwpO1xuICAgIHNldERyYWdnZWRTdWJDYXRJZChudWxsKTtcbiAgICBzaG93VG9hc3QoJ+Wwj+WIhumhnuaLluabs+aOkuW6j+W3suabtOaWsO+8gScpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUFkZFN1YmNhdGVnb3J5ID0gKGNhdElkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIW5ld1N1Yk5hbWUudHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoJ+iri+i8uOWFpeWwj+WIhumhnuWQjeeose+8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVkID0gY2F0ZWdvcmllcy5tYXAoY2F0ID0+IHtcbiAgICAgIGlmIChjYXQuaWQgPT09IGNhdElkKSB7XG4gICAgICAgIGlmIChjYXQuc3ViY2F0ZWdvcmllcy5pbmNsdWRlcyhuZXdTdWJOYW1lLnRyaW0oKSkpIHtcbiAgICAgICAgICBzaG93VG9hc3QoJ+atpOWwj+WIhumhnuWQjeeoseW3suWtmOWcqOaWvOWkp+WIhumhnuS4re+8gScpO1xuICAgICAgICAgIHJldHVybiBjYXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgLi4uY2F0LCBzdWJjYXRlZ29yaWVzOiBbLi4uY2F0LnN1YmNhdGVnb3JpZXMsIG5ld1N1Yk5hbWUudHJpbSgpXSB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNhdDtcbiAgICB9KTtcbiAgICBzZXRDYXRlZ29yaWVzKHVwZGF0ZWQpO1xuICAgIHNldE5ld1N1Yk5hbWUoJycpO1xuICAgIHNob3dUb2FzdChg5bey5Zyo5YiG6aGe5Lit5paw5aKe5bCP5YiG6aGe44CMJHtuZXdTdWJOYW1lLnRyaW0oKX3jgI1gKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVEZWxldGVTdWJjYXRlZ29yeSA9IChjYXRJZDogc3RyaW5nLCBzdWJJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgY2F0ID0gY2F0ZWdvcmllcy5maW5kKGMgPT4gYy5pZCA9PT0gY2F0SWQpO1xuICAgIGlmICghY2F0KSByZXR1cm47XG4gICAgY29uc3Qgc3ViTmFtZSA9IGNhdC5zdWJjYXRlZ29yaWVzW3N1YkluZGV4XTtcbiAgICBhc2tDb25maXJtYXRpb24oXG4gICAgICAn5Yiq6Zmk5bCP5YiG6aGeJyxcbiAgICAgIGDnorrlrpropoHliKrpmaTjgIwke2NhdC5uYW1lfeOAjeW6leS4i+eahOWwj+WIhumhnuOAjCR7c3ViTmFtZX3jgI3ll47vvJ9gLFxuICAgICAgKCkgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGVkID0gY2F0ZWdvcmllcy5tYXAoYyA9PiB7XG4gICAgICAgICAgaWYgKGMuaWQgPT09IGNhdElkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAuLi5jLFxuICAgICAgICAgICAgICBzdWJjYXRlZ29yaWVzOiBjLnN1YmNhdGVnb3JpZXMuZmlsdGVyKChfLCBpZHgpID0+IGlkeCAhPT0gc3ViSW5kZXgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgfSk7XG4gICAgICAgIHNldENhdGVnb3JpZXModXBkYXRlZCk7XG4gICAgICAgIHNob3dUb2FzdChg5bey5oiQ5Yqf56e76Zmk5bCP5YiG6aGe44CMJHtzdWJOYW1lfeOAjWApO1xuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlU2F2ZVN1YmNhdGVnb3J5ID0gKGNhdElkOiBzdHJpbmcsIHN1YkluZGV4OiBudW1iZXIpID0+IHtcbiAgICBpZiAoIWVkaXRpbmdTdWJOYW1lLnRyaW0oKSkge1xuICAgICAgc2hvd1RvYXN0KCflsI/liIbpoZ7lkI3nqLHkuI3og73ngrrnqbrvvIEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlZCA9IGNhdGVnb3JpZXMubWFwKGMgPT4ge1xuICAgICAgaWYgKGMuaWQgPT09IGNhdElkKSB7XG4gICAgICAgIGNvbnN0IG5ld1N1YnMgPSBbLi4uYy5zdWJjYXRlZ29yaWVzXTtcbiAgICAgICAgbmV3U3Vic1tzdWJJbmRleF0gPSBlZGl0aW5nU3ViTmFtZS50cmltKCk7XG4gICAgICAgIHJldHVybiB7IC4uLmMsIHN1YmNhdGVnb3JpZXM6IG5ld1N1YnMgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjO1xuICAgIH0pO1xuICAgIHNldENhdGVnb3JpZXModXBkYXRlZCk7XG4gICAgc2V0RWRpdGluZ1N1YkNhdElkKG51bGwpO1xuICAgIHNldEVkaXRpbmdTdWJJZHgobnVsbCk7XG4gICAgc2hvd1RvYXN0KCflsI/liIbpoZ7lkI3nqLHlt7LmiJDlip/kv67mlLnvvIEnKTtcbiAgfTtcblxuICAvLyAtLS0gUHJvZHVjdCBDUlVEIEFjdGlvbnMgLS0tXG4gIGNvbnN0IHRvZ2dsZUV4cGFuZFByb2R1Y3QgPSAocHJvZElkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBuZXh0ID0gbmV3IFNldChleHBhbmRlZFByb2R1Y3RJZHMpO1xuICAgIGlmIChuZXh0Lmhhcyhwcm9kSWQpKSB7XG4gICAgICBuZXh0LmRlbGV0ZShwcm9kSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LmFkZChwcm9kSWQpO1xuICAgIH1cbiAgICBzZXRFeHBhbmRlZFByb2R1Y3RJZHMobmV4dCk7XG4gIH07XG5cbiAgY29uc3QgY2xlYXJGb3JtID0gKCkgPT4ge1xuICAgIHNldEZvcm1CcmFuZCgnJyk7XG4gICAgc2V0Rm9ybU5hbWUoJycpO1xuICAgIHNldEZvcm1DYXRlZ29yeShjdXJyZW50VGFiICE9PSAnc2V0dGluZ3MnICYmIGN1cnJlbnRUYWIgIT09ICdoaXN0b3J5JyA/IGN1cnJlbnRUYWIgOiBjYXRlZ29yaWVzWzBdPy5pZCB8fCAnbWFrZXVwJyk7XG4gICAgc2V0Rm9ybVN1YmNhdGVnb3J5KCcnKTtcbiAgICBzZXRGb3JtUXR5KDEpO1xuICAgIHNldEZvcm1DYXBhY2l0eSgnJyk7XG4gICAgc2V0Rm9ybUNhcGFjaXR5VW5pdCgnbWwnKTtcbiAgICBzZXRGb3JtVXNhZ2UoJ+S9v+eUqOS4rScpO1xuICAgIHNldEZvcm1UaHJlc2hvbGQoMCk7XG4gICAgc2V0Rm9ybUV4cGlyeSgnJyk7XG4gICAgc2V0Rm9ybVBhb01vbnRocygnJyk7XG4gICAgc2V0Rm9ybU9wZW5lZERhdGUobmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pO1xuICAgIHNldEZvcm1GaW5pc2hlZERhdGUoJycpO1xuICAgIHNldEZvcm1QaG90bygnJyk7XG4gICAgc2V0Rm9ybVB1cmNoYXNlRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSk7XG4gICAgc2V0Rm9ybVB1cmNoYXNlUGxhY2UoJycpO1xuICAgIHNldEZvcm1QcmljZSgnJyk7XG4gICAgc2V0RWRpdGluZ0luc3RhbmNlSWQobnVsbCk7XG4gICAgc2V0RWRpdGluZ1Byb2R1Y3RJZChudWxsKTtcbiAgICBzZXRJc0VkaXRpbmdNYXN0ZXIoZmFsc2UpO1xuICAgIHNldElzQWRkaW5nSW5zdGFuY2VUb0V4aXN0aW5nKGZhbHNlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVUYWJDaGFuZ2UgPSAodGFiSWQ6IHN0cmluZykgPT4ge1xuICAgIHNldEN1cnJlbnRUYWIodGFiSWQpO1xuICAgIHNldFNob3dBZGRGb3JtKGZhbHNlKTtcbiAgICBzZXRTZWFyY2hLZXl3b3JkKCcnKTtcbiAgICBjbGVhckZvcm0oKTtcbiAgICBpZiAodGFiSWQgPT09ICdzZXR0aW5ncycpIHtcbiAgICAgIHNldFNldHRpbmdzVmlldygnbWVudScpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVGb3JtU2F2ZSA9IChlOiBSZWFjdC5Gb3JtRXZlbnQsIGZvcmNlQXNOZXdJbnN0YW5jZSA9IGZhbHNlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghZm9ybU5hbWUudHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoJ+iri+i8uOWFpeeUouWTgeWQjeeose+8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICBpZiAoZm9ybVF0eSA8IDEpIHtcbiAgICAgIHNob3dUb2FzdCgn5pW46YeP5b+F6aCI5aSn5pa8MO+8gScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzdWJjYXRWYWx1ZSA9IGZvcm1TdWJjYXRlZ29yeS50cmltKCk7XG4gICAgaWYgKHN1YmNhdFZhbHVlID09PSAn6Ieq6KiC5a2Q5YiG6aGeJyB8fCAhc3ViY2F0VmFsdWUpIHtcbiAgICAgIHN1YmNhdFZhbHVlID0gJ+WFtuS7lic7XG4gICAgfVxuXG4gICAgLy8gQXV0b21hdGljYWxseSBhZGQgY3VzdG9tIHN1YmNhdGVnb3J5IHRvIHRoZSBzZWxlY3RlZCBjYXRlZ29yeSAoUmVxdWlyZW1lbnQgNSlcbiAgICBzZXRDYXRlZ29yaWVzKHByZXYgPT4ge1xuICAgICAgbGV0IGlzVXBkYXRlZCA9IGZhbHNlO1xuICAgICAgY29uc3QgbmV3Q2F0cyA9IHByZXYubWFwKGNhdCA9PiB7XG4gICAgICAgIGlmIChjYXQuaWQgPT09IGZvcm1DYXRlZ29yeSAmJiAhY2F0LnN1YmNhdGVnb3JpZXMuaW5jbHVkZXMoc3ViY2F0VmFsdWUpKSB7XG4gICAgICAgICAgaXNVcGRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4geyAuLi5jYXQsIHN1YmNhdGVnb3JpZXM6IFsuLi5jYXQuc3ViY2F0ZWdvcmllcywgc3ViY2F0VmFsdWVdIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhdDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGlzVXBkYXRlZCA/IG5ld0NhdHMgOiBwcmV2O1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGFvVmFsID0gZm9ybVBhb01vbnRocyA/IHBhcnNlSW50KGZvcm1QYW9Nb250aHMpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IG9wZW5lZFZhbCA9IChmb3JtVXNhZ2UgPT09ICfkvb/nlKjkuK0nIHx8IGZvcm1Vc2FnZSA9PT0gJ+W3sueUqOWujCcgfHwgZm9ybVVzYWdlID09PSAn5bey5Lif5qOEJykgPyBmb3JtT3BlbmVkRGF0ZSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBmaW5pc2hlZFZhbCA9IChmb3JtVXNhZ2UgPT09ICflt7LnlKjlrownIHx8IGZvcm1Vc2FnZSA9PT0gJ+W3suS4n+ajhCcpID8gZm9ybUZpbmlzaGVkRGF0ZSA6IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHB1cmNoYXNlRGF0ZVZhbCA9IGZvcm1QdXJjaGFzZURhdGUgfHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHB1cmNoYXNlUGxhY2VWYWwgPSBmb3JtUHVyY2hhc2VQbGFjZS50cmltKCkgfHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHByaWNlVmFsID0gZm9ybVByaWNlID8gcGFyc2VGbG9hdChmb3JtUHJpY2UpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGZpbmFsQ2FwYWNpdHkgPSBmb3JtQ2FwYWNpdHkgPyBgJHtmb3JtQ2FwYWNpdHl9JHtmb3JtQ2FwYWNpdHlVbml0fWAgOiAnJztcblxuICAgIC8vIEEuIEVkaXQgTWFzdGVyIFByb2R1Y3QgSW5mbyBPTkxZIChSZXF1aXJlbWVudDogQnV0dG9uIDMgLSBlZGl0aW5nIG1hc3RlciBpbmZvIG9mIHRoZSBwcm9kdWN0IGdyb3VwKVxuICAgIGlmIChpc0VkaXRpbmdNYXN0ZXIgJiYgZWRpdGluZ1Byb2R1Y3RJZCkge1xuICAgICAgY29uc3QgdXBkYXRlZFByb2R1Y3RzID0gcHJvZHVjdHMubWFwKHByb2QgPT4ge1xuICAgICAgICBpZiAocHJvZC5pZCA9PT0gZWRpdGluZ1Byb2R1Y3RJZCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5wcm9kLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IGZvcm1DYXRlZ29yeSxcbiAgICAgICAgICAgIHN1YmNhdGVnb3J5OiBzdWJjYXRWYWx1ZSxcbiAgICAgICAgICAgIGJyYW5kOiBmb3JtQnJhbmQudHJpbSgpLFxuICAgICAgICAgICAgbmFtZTogZm9ybU5hbWUudHJpbSgpLFxuICAgICAgICAgICAgcGhvdG86IGZvcm1QaG90byB8fCBwcm9kLnBob3RvLFxuICAgICAgICAgICAgdGhyZXNob2xkOiBOdW1iZXIoZm9ybVRocmVzaG9sZCkgfHwgMFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2Q7XG4gICAgICB9KTtcbiAgICAgIHNldFByb2R1Y3RzKHVwZGF0ZWRQcm9kdWN0cyk7XG4gICAgICBzaG93VG9hc3QoJ+eUouWTgeWkp+WTgemgheizh+aWmeS/ruaUueaIkOWKn++8gScpO1xuICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQi4gRWRpdCBFeGlzdGluZyBQcm9kdWN0IEluc3RhbmNlXG4gICAgaWYgKGVkaXRpbmdJbnN0YW5jZUlkICYmIGVkaXRpbmdQcm9kdWN0SWQgJiYgIWZvcmNlQXNOZXdJbnN0YW5jZSkge1xuICAgICAgY29uc3QgdXBkYXRlZFByb2R1Y3RzID0gcHJvZHVjdHMubWFwKHByb2QgPT4ge1xuICAgICAgICBpZiAocHJvZC5pZCA9PT0gZWRpdGluZ1Byb2R1Y3RJZCkge1xuICAgICAgICAgIC8vIElmIHRoZSBtZXRhIHBhcmFtZXRlcnMgKGNhdGVnb3J5LCBicmFuZCwgc3ViY2F0ZWdvcnksIG5hbWUpIGNoYW5nZWQsIFxuICAgICAgICAgIC8vIHdlIG1pZ2h0IHdhbnQgdG8gbWlncmF0ZSBvciB1cGRhdGUgdGhlbS5cbiAgICAgICAgICBjb25zdCBpc01ldGFDaGFuZ2VkID0gXG4gICAgICAgICAgICBwcm9kLmNhdGVnb3J5ICE9PSBmb3JtQ2F0ZWdvcnkgfHwgXG4gICAgICAgICAgICBwcm9kLnN1YmNhdGVnb3J5ICE9PSBzdWJjYXRWYWx1ZSB8fCBcbiAgICAgICAgICAgIHByb2QuYnJhbmQgIT09IGZvcm1CcmFuZC50cmltKCkgfHwgXG4gICAgICAgICAgICBwcm9kLm5hbWUgIT09IGZvcm1OYW1lLnRyaW0oKTtcblxuICAgICAgICAgIGlmIChpc01ldGFDaGFuZ2VkKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgaW5zdGFuY2UgZnJvbSB0aGlzIHByb2R1Y3RcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkSW5zdGFuY2VzID0gcHJvZC5pbnN0YW5jZXMuZmlsdGVyKGluc3QgPT4gaW5zdC5pZCAhPT0gZWRpdGluZ0luc3RhbmNlSWQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4ucHJvZCwgaW5zdGFuY2VzOiBmaWx0ZXJlZEluc3RhbmNlcyB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJbi1wbGFjZSB1cGRhdGUgb2YgaW5zdGFuY2VcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWRJbnN0YW5jZXMgPSBwcm9kLmluc3RhbmNlcy5mbGF0TWFwKGluc3QgPT4ge1xuICAgICAgICAgICAgICBpZiAoaW5zdC5pZCA9PT0gZWRpdGluZ0luc3RhbmNlSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh7IGxlbmd0aDogZm9ybVF0eSB9KS5tYXAoKF8sIGlkeCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgIC4uLmluc3QsXG4gICAgICAgICAgICAgICAgICBpZDogaWR4ID09PSAwID8gaW5zdC5pZCA6IGBpbnN0XyR7RGF0ZS5ub3coKX1fJHtpZHh9YCxcbiAgICAgICAgICAgICAgICAgIHF0eTogMSxcbiAgICAgICAgICAgICAgICAgIGNhcGFjaXR5OiBmaW5hbENhcGFjaXR5LFxuICAgICAgICAgICAgICAgICAgdXNhZ2U6IGZvcm1Vc2FnZSxcbiAgICAgICAgICAgICAgICAgIGV4cGlyeTogZm9ybUV4cGlyeSxcbiAgICAgICAgICAgICAgICAgIHBhb01vbnRoczogcGFvVmFsLFxuICAgICAgICAgICAgICAgICAgb3BlbmVkRGF0ZTogb3BlbmVkVmFsLFxuICAgICAgICAgICAgICAgICAgZmluaXNoZWREYXRlOiBmaW5pc2hlZFZhbCxcbiAgICAgICAgICAgICAgICAgIHB1cmNoYXNlRGF0ZTogcHVyY2hhc2VEYXRlVmFsLFxuICAgICAgICAgICAgICAgICAgcHVyY2hhc2VQbGFjZTogcHVyY2hhc2VQbGFjZVZhbCxcbiAgICAgICAgICAgICAgICAgIHByaWNlOiBwcmljZVZhbFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gW2luc3RdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAuLi5wcm9kLFxuICAgICAgICAgICAgICBwaG90bzogZm9ybVBob3RvIHx8IHByb2QucGhvdG8sXG4gICAgICAgICAgICAgIGluc3RhbmNlczogdXBkYXRlZEluc3RhbmNlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2Q7XG4gICAgICB9KS5maWx0ZXIocCA9PiBwLmluc3RhbmNlcy5sZW5ndGggPiAwKTsgLy8gUmVtb3ZlIHByb2R1Y3RzIHdpdGggMCBpbnN0YW5jZXNcblxuICAgICAgLy8gSWYgbWV0YSBwYXJhbWV0ZXJzIGNoYW5nZWQsIHdlIGluc2VydCB0aGlzIGluc3RhbmNlIGFzIG5ldyBpdGVtIG9yIGdyb3VwIHVuZGVyIGFub3RoZXIgbWF0Y2hpbmcgcHJvZHVjdFxuICAgICAgY29uc3QgaXNNZXRhQ2hhbmdlZEluRm9ybSA9IHByb2R1Y3RzLmZpbmQocCA9PiBwLmlkID09PSBlZGl0aW5nUHJvZHVjdElkKT8uY2F0ZWdvcnkgIT09IGZvcm1DYXRlZ29yeSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzLmZpbmQocCA9PiBwLmlkID09PSBlZGl0aW5nUHJvZHVjdElkKT8uc3ViY2F0ZWdvcnkgIT09IHN1YmNhdFZhbHVlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHMuZmluZChwID0+IHAuaWQgPT09IGVkaXRpbmdQcm9kdWN0SWQpPy5icmFuZCAhPT0gZm9ybUJyYW5kLnRyaW0oKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzLmZpbmQocCA9PiBwLmlkID09PSBlZGl0aW5nUHJvZHVjdElkKT8ubmFtZSAhPT0gZm9ybU5hbWUudHJpbSgpO1xuXG4gICAgICBsZXQgdGFyZ2V0UHJvZElkID0gZWRpdGluZ1Byb2R1Y3RJZDtcblxuICAgICAgaWYgKGlzTWV0YUNoYW5nZWRJbkZvcm0pIHtcbiAgICAgICAgLy8gRmluZCBpZiB0aGVyZSdzIGFuIGV4aXN0aW5nIG1hdGNoaW5nIHByb2R1Y3QgZ3JvdXAgdG8gbWVyZ2UgaW50b1xuICAgICAgICBjb25zdCBtYXRjaFByb2QgPSB1cGRhdGVkUHJvZHVjdHMuZmluZChwID0+IFxuICAgICAgICAgIHAuY2F0ZWdvcnkgPT09IGZvcm1DYXRlZ29yeSAmJiBcbiAgICAgICAgICBwLnN1YmNhdGVnb3J5ID09PSBzdWJjYXRWYWx1ZSAmJiBcbiAgICAgICAgICBwLmJyYW5kID09PSBmb3JtQnJhbmQudHJpbSgpICYmIFxuICAgICAgICAgIHAubmFtZSA9PT0gZm9ybU5hbWUudHJpbSgpICYmIFxuICAgICAgICAgIHAuc3RhdHVzID09PSAnYWN0aXZlJ1xuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IG5ld0luc3RhbmNlczogUHJvZHVjdEluc3RhbmNlW10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBmb3JtUXR5IH0pLm1hcCgoXywgaWR4KSA9PiAoe1xuICAgICAgICAgIGlkOiBpZHggPT09IDAgPyBlZGl0aW5nSW5zdGFuY2VJZCA6IGBpbnN0XyR7RGF0ZS5ub3coKX1fJHtpZHh9YCxcbiAgICAgICAgICBxdHk6IDEsXG4gICAgICAgICAgY2FwYWNpdHk6IGZpbmFsQ2FwYWNpdHksXG4gICAgICAgICAgdXNhZ2U6IGZvcm1Vc2FnZSxcbiAgICAgICAgICBleHBpcnk6IGZvcm1FeHBpcnksXG4gICAgICAgICAgcGFvTW9udGhzOiBwYW9WYWwsXG4gICAgICAgICAgb3BlbmVkRGF0ZTogb3BlbmVkVmFsLFxuICAgICAgICAgIGZpbmlzaGVkRGF0ZTogZmluaXNoZWRWYWwsXG4gICAgICAgICAgcHVyY2hhc2VEYXRlOiBwdXJjaGFzZURhdGVWYWwsXG4gICAgICAgICAgcHVyY2hhc2VQbGFjZTogcHVyY2hhc2VQbGFjZVZhbCxcbiAgICAgICAgICBwcmljZTogcHJpY2VWYWxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGlmIChtYXRjaFByb2QpIHtcbiAgICAgICAgICBjb25zdCBtYXRjaEluZGV4ID0gdXBkYXRlZFByb2R1Y3RzLmZpbmRJbmRleChwID0+IHAuaWQgPT09IG1hdGNoUHJvZC5pZCk7XG4gICAgICAgICAgdXBkYXRlZFByb2R1Y3RzW21hdGNoSW5kZXhdID0ge1xuICAgICAgICAgICAgLi4ubWF0Y2hQcm9kLFxuICAgICAgICAgICAgaW5zdGFuY2VzOiBbLi4ubWF0Y2hQcm9kLmluc3RhbmNlcywgLi4ubmV3SW5zdGFuY2VzXSxcbiAgICAgICAgICAgIHBob3RvOiBmb3JtUGhvdG8gfHwgbWF0Y2hQcm9kLnBob3RvXG4gICAgICAgICAgfTtcbiAgICAgICAgICB0YXJnZXRQcm9kSWQgPSBtYXRjaFByb2QuaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbmV3UHJvZHVjdDogUHJvZHVjdCA9IHtcbiAgICAgICAgICAgIGlkOiBgcHJvZF8ke0RhdGUubm93KCl9YCxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBmb3JtQ2F0ZWdvcnksXG4gICAgICAgICAgICBzdWJjYXRlZ29yeTogc3ViY2F0VmFsdWUsXG4gICAgICAgICAgICBicmFuZDogZm9ybUJyYW5kLnRyaW0oKSxcbiAgICAgICAgICAgIG5hbWU6IGZvcm1OYW1lLnRyaW0oKSxcbiAgICAgICAgICAgIHBob3RvOiBmb3JtUGhvdG8gfHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgICAgICAgIHRocmVzaG9sZDogTnVtYmVyKGZvcm1UaHJlc2hvbGQpIHx8IDAsXG4gICAgICAgICAgICBpbnN0YW5jZXM6IG5ld0luc3RhbmNlc1xuICAgICAgICAgIH07XG4gICAgICAgICAgdXBkYXRlZFByb2R1Y3RzLnB1c2gobmV3UHJvZHVjdCk7XG4gICAgICAgICAgdGFyZ2V0UHJvZElkID0gbmV3UHJvZHVjdC5pZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZXRQcm9kdWN0cyh1cGRhdGVkUHJvZHVjdHMpO1xuICAgICAgY29uc3QgdGFyZ2V0UHJvZCA9IHVwZGF0ZWRQcm9kdWN0cy5maW5kKHAgPT4gcC5pZCA9PT0gdGFyZ2V0UHJvZElkKTtcbiAgICAgIGlmICh0YXJnZXRQcm9kKSBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QodGFyZ2V0UHJvZCk7XG4gICAgICBzaG93VG9hc3QoJ+aYjue0sOS/ruaUueaIkOWKn++8gScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDLiBDcmVhdGUgTmV3IFByb2R1Y3QgR3JvdXAgb3IgQWRkIEluc3RhbmNlIHRvIEV4aXN0aW5nXG4gICAgICBjb25zdCBuZXdJbnN0YW5jZXM6IFByb2R1Y3RJbnN0YW5jZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogZm9ybVF0eSB9KS5tYXAoKF8sIGlkeCkgPT4gKHtcbiAgICAgICAgaWQ6IGBpbnN0XyR7RGF0ZS5ub3coKX1fJHtpZHh9YCxcbiAgICAgICAgcXR5OiAxLFxuICAgICAgICBjYXBhY2l0eTogZmluYWxDYXBhY2l0eSxcbiAgICAgICAgdXNhZ2U6IGZvcm1Vc2FnZSxcbiAgICAgICAgZXhwaXJ5OiBmb3JtRXhwaXJ5LFxuICAgICAgICBwYW9Nb250aHM6IHBhb1ZhbCxcbiAgICAgICAgb3BlbmVkRGF0ZTogb3BlbmVkVmFsLFxuICAgICAgICBmaW5pc2hlZERhdGU6IGZpbmlzaGVkVmFsLFxuICAgICAgICBwdXJjaGFzZURhdGU6IHB1cmNoYXNlRGF0ZVZhbCxcbiAgICAgICAgcHVyY2hhc2VQbGFjZTogcHVyY2hhc2VQbGFjZVZhbCxcbiAgICAgICAgcHJpY2U6IHByaWNlVmFsXG4gICAgICB9KSk7XG5cbiAgICAgIGxldCBleGlzdGluZ1Byb2R1Y3RJbmRleCA9IC0xO1xuICAgICAgaWYgKChpc0FkZGluZ0luc3RhbmNlVG9FeGlzdGluZyB8fCBmb3JjZUFzTmV3SW5zdGFuY2UpICYmIGVkaXRpbmdQcm9kdWN0SWQpIHtcbiAgICAgICAgZXhpc3RpbmdQcm9kdWN0SW5kZXggPSBwcm9kdWN0cy5maW5kSW5kZXgocCA9PiBwLmlkID09PSBlZGl0aW5nUHJvZHVjdElkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4aXN0aW5nUHJvZHVjdEluZGV4ID0gcHJvZHVjdHMuZmluZEluZGV4KHAgPT4gXG4gICAgICAgICAgcC5jYXRlZ29yeSA9PT0gZm9ybUNhdGVnb3J5ICYmIFxuICAgICAgICAgIHAuc3ViY2F0ZWdvcnkgPT09IHN1YmNhdFZhbHVlICYmIFxuICAgICAgICAgIHAuYnJhbmQgPT09IGZvcm1CcmFuZC50cmltKCkgJiYgXG4gICAgICAgICAgcC5uYW1lID09PSBmb3JtTmFtZS50cmltKCkgJiZcbiAgICAgICAgICBwLnN0YXR1cyA9PT0gJ2FjdGl2ZSdcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4aXN0aW5nUHJvZHVjdEluZGV4ID4gLTEpIHtcbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IFsuLi5wcm9kdWN0c107XG4gICAgICAgIHVwZGF0ZWRbZXhpc3RpbmdQcm9kdWN0SW5kZXhdID0ge1xuICAgICAgICAgIC4uLnVwZGF0ZWRbZXhpc3RpbmdQcm9kdWN0SW5kZXhdLFxuICAgICAgICAgIGluc3RhbmNlczogWy4uLnVwZGF0ZWRbZXhpc3RpbmdQcm9kdWN0SW5kZXhdLmluc3RhbmNlcywgLi4ubmV3SW5zdGFuY2VzXVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZm9ybVBob3RvKSB7XG4gICAgICAgICAgdXBkYXRlZFtleGlzdGluZ1Byb2R1Y3RJbmRleF0ucGhvdG8gPSBmb3JtUGhvdG87XG4gICAgICAgIH1cbiAgICAgICAgc2V0UHJvZHVjdHModXBkYXRlZCk7XG4gICAgICAgIC8vIEV4cGFuZCB0aGlzIHByb2R1Y3QgdG8gc2hvdyB0aGUgbmV3IGluc3RhbmNlXG4gICAgICAgIHNldEV4cGFuZGVkUHJvZHVjdElkcyhwcmV2ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gbmV3IFNldChwcmV2KTtcbiAgICAgICAgICBuZXh0LmFkZCh1cGRhdGVkW2V4aXN0aW5nUHJvZHVjdEluZGV4XS5pZCk7XG4gICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgIH0pO1xuICAgICAgICBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QodXBkYXRlZFtleGlzdGluZ1Byb2R1Y3RJbmRleF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ3JlYXRlIGZ1bGwgbmV3IHByb2R1Y3RcbiAgICAgICAgY29uc3QgbmV3UHJvZDogUHJvZHVjdCA9IHtcbiAgICAgICAgICBpZDogYHByb2RfJHtEYXRlLm5vdygpfWAsXG4gICAgICAgICAgY2F0ZWdvcnk6IGZvcm1DYXRlZ29yeSxcbiAgICAgICAgICBzdWJjYXRlZ29yeTogc3ViY2F0VmFsdWUsXG4gICAgICAgICAgYnJhbmQ6IGZvcm1CcmFuZC50cmltKCksXG4gICAgICAgICAgbmFtZTogZm9ybU5hbWUudHJpbSgpLFxuICAgICAgICAgIHBob3RvOiBmb3JtUGhvdG8gfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIHN0YXR1czogJ2FjdGl2ZScsXG4gICAgICAgICAgdGhyZXNob2xkOiBOdW1iZXIoZm9ybVRocmVzaG9sZCkgfHwgMCxcbiAgICAgICAgICBpbnN0YW5jZXM6IG5ld0luc3RhbmNlc1xuICAgICAgICB9O1xuICAgICAgICBzZXRQcm9kdWN0cyhbLi4ucHJvZHVjdHMsIG5ld1Byb2RdKTtcbiAgICAgICAgc2V0RXhwYW5kZWRQcm9kdWN0SWRzKHByZXYgPT4ge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KHByZXYpO1xuICAgICAgICAgIG5leHQuYWRkKG5ld1Byb2QuaWQpO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9KTtcbiAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KG5ld1Byb2QpO1xuICAgICAgfVxuICAgICAgc2hvd1RvYXN0KGDlt7LmiJDlip/mlrDlop7nlKLlk4HvvJoke2Zvcm1OYW1lLnRyaW0oKX1gKTtcbiAgICB9XG5cbiAgICBzZXRTaG93QWRkRm9ybShmYWxzZSk7XG4gICAgY2xlYXJGb3JtKCk7XG4gICAgc2V0Q3VycmVudFRhYihmb3JtQ2F0ZWdvcnkpOyAvLyBSZWRpcmVjdCB0byBjb3JyZXNwb25kaW5nIGNhdGVnb3J5IHRhYlxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUVkaXRJbnN0YW5jZVRyaWdnZXIgPSAocHJvZDogUHJvZHVjdCwgaW5zdDogUHJvZHVjdEluc3RhbmNlKSA9PiB7XG4gICAgc2V0RWRpdGluZ1Byb2R1Y3RJZChwcm9kLmlkKTtcbiAgICBzZXRFZGl0aW5nSW5zdGFuY2VJZChpbnN0LmlkKTtcbiAgICBzZXRJc0VkaXRpbmdNYXN0ZXIoZmFsc2UpO1xuICAgIHNldElzQWRkaW5nSW5zdGFuY2VUb0V4aXN0aW5nKGZhbHNlKTtcblxuICAgIHNldEZvcm1CcmFuZChwcm9kLmJyYW5kKTtcbiAgICBzZXRGb3JtTmFtZShwcm9kLm5hbWUpO1xuICAgIHNldEZvcm1DYXRlZ29yeShwcm9kLmNhdGVnb3J5KTtcbiAgICBzZXRGb3JtU3ViY2F0ZWdvcnkocHJvZC5zdWJjYXRlZ29yeSk7XG4gICAgc2V0Rm9ybVF0eShpbnN0LnF0eSk7XG4gICAgXG4gICAgLy8gUGFyc2UgY2FwYWNpdHkgYW5kIHVuaXRcbiAgICBsZXQgY2FwID0gaW5zdC5jYXBhY2l0eSB8fCAnJztcbiAgICBsZXQgdW5pdCA9ICdtbCc7XG4gICAgaWYgKGNhcC5lbmRzV2l0aCgnbWwnKSkgeyB1bml0ID0gJ21sJzsgY2FwID0gY2FwLnNsaWNlKDAsIC0yKTsgfVxuICAgIGVsc2UgaWYgKGNhcC5lbmRzV2l0aCgnZycpKSB7IHVuaXQgPSAnZyc7IGNhcCA9IGNhcC5zbGljZSgwLCAtMSk7IH1cbiAgICBlbHNlIGlmIChjYXAuZW5kc1dpdGgoJ+WAiycpKSB7IHVuaXQgPSAn5YCLJzsgY2FwID0gY2FwLnNsaWNlKDAsIC0xKTsgfVxuICAgIGVsc2UgaWYgKGNhcC5lbmRzV2l0aCgn572QJykpIHsgdW5pdCA9ICfnvZAnOyBjYXAgPSBjYXAuc2xpY2UoMCwgLTEpOyB9XG4gICAgZWxzZSBpZiAoY2FwLmVuZHNXaXRoKCfpjKAnKSkgeyB1bml0ID0gJ+mMoCc7IGNhcCA9IGNhcC5zbGljZSgwLCAtMSk7IH1cbiAgICBlbHNlIGlmIChjYXAuZW5kc1dpdGgoJ+mhhicpKSB7IHVuaXQgPSAn6aGGJzsgY2FwID0gY2FwLnNsaWNlKDAsIC0xKTsgfVxuICAgIHNldEZvcm1DYXBhY2l0eShjYXAudHJpbSgpKTtcbiAgICBzZXRGb3JtQ2FwYWNpdHlVbml0KHVuaXQpO1xuXG4gICAgc2V0Rm9ybVVzYWdlKGluc3QudXNhZ2UpO1xuICAgIHNldEZvcm1UaHJlc2hvbGQocHJvZC50aHJlc2hvbGQgPyBTdHJpbmcocHJvZC50aHJlc2hvbGQpIDogJycpO1xuICAgIHNldEZvcm1FeHBpcnkoaW5zdC5leHBpcnkpO1xuICAgIHNldEZvcm1QYW9Nb250aHMoaW5zdC5wYW9Nb250aHMgPyBTdHJpbmcoaW5zdC5wYW9Nb250aHMpIDogJycpO1xuICAgIHNldEZvcm1PcGVuZWREYXRlKGluc3Qub3BlbmVkRGF0ZSB8fCAnJyk7XG4gICAgc2V0Rm9ybUZpbmlzaGVkRGF0ZShpbnN0LmZpbmlzaGVkRGF0ZSB8fCAnJyk7XG4gICAgc2V0Rm9ybVBob3RvKHByb2QucGhvdG8gfHwgJycpO1xuICAgIHNldEZvcm1QdXJjaGFzZURhdGUoaW5zdC5wdXJjaGFzZURhdGUgfHwgJycpO1xuICAgIHNldEZvcm1QdXJjaGFzZVBsYWNlKGluc3QucHVyY2hhc2VQbGFjZSB8fCAnJyk7XG4gICAgc2V0Rm9ybVByaWNlKGluc3QucHJpY2UgIT09IHVuZGVmaW5lZCA/IFN0cmluZyhpbnN0LnByaWNlKSA6ICcnKTtcblxuICAgIHNldFNob3dBZGRGb3JtKHRydWUpO1xuICAgIC8vIFNtb290aCBzY3JvbGwgdG8gZm9ybVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hbnVhbC1hZGQtZm9ybScpPy5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICB9LCAxMDApO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUVkaXRQcm9kdWN0TWFzdGVyVHJpZ2dlciA9IChwcm9kOiBQcm9kdWN0KSA9PiB7XG4gICAgc2V0RWRpdGluZ1Byb2R1Y3RJZChwcm9kLmlkKTtcbiAgICBzZXRFZGl0aW5nSW5zdGFuY2VJZChudWxsKTsgLy8gTm8gc3BlY2lmaWMgaW5zdGFuY2UgZWRpdCwgZWRpdGluZyBtYXN0ZXIgcHJvZHVjdCBkZXRhaWxzIVxuICAgIHNldElzRWRpdGluZ01hc3Rlcih0cnVlKTtcbiAgICBzZXRJc0FkZGluZ0luc3RhbmNlVG9FeGlzdGluZyhmYWxzZSk7XG4gICAgc2V0Rm9ybUJyYW5kKHByb2QuYnJhbmQpO1xuICAgIHNldEZvcm1OYW1lKHByb2QubmFtZSk7XG4gICAgc2V0Rm9ybUNhdGVnb3J5KHByb2QuY2F0ZWdvcnkpO1xuICAgIHNldEZvcm1TdWJjYXRlZ29yeShwcm9kLnN1YmNhdGVnb3J5KTtcbiAgICBzZXRGb3JtUGhvdG8ocHJvZC5waG90byB8fCAnJyk7XG4gICAgLy8gUmVzZXQgaW5zdGFuY2Ugc3BlY2lmaWMgc3RhdGVzIHRvIGRlZmF1bHRcbiAgICBzZXRGb3JtUXR5KDEpO1xuICAgIHNldEZvcm1DYXBhY2l0eSgnJyk7XG4gICAgc2V0Rm9ybUNhcGFjaXR5VW5pdCgnbWwnKTtcbiAgICBzZXRGb3JtVXNhZ2UoJ+S9v+eUqOS4rScpO1xuICAgIHNldEZvcm1UaHJlc2hvbGQoMCk7XG4gICAgc2V0Rm9ybUV4cGlyeSgnJyk7XG4gICAgc2V0Rm9ybVBhb01vbnRocygnJyk7XG4gICAgc2V0Rm9ybU9wZW5lZERhdGUobmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pO1xuICAgIHNldEZvcm1GaW5pc2hlZERhdGUoJycpO1xuICAgIHNldEZvcm1QdXJjaGFzZURhdGUobmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pO1xuICAgIHNldEZvcm1QdXJjaGFzZVBsYWNlKCcnKTtcbiAgICBzZXRGb3JtUHJpY2UoJycpO1xuXG4gICAgc2V0U2hvd0FkZEZvcm0odHJ1ZSk7XG4gICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KG51bGwpOyAvLyBDbG9zZSBkZXRhaWwgc2NyZWVuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFudWFsLWFkZC1mb3JtJyk/LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH0sIDEwMCk7XG4gIH07XG5cbiAgLy8gQWRkIHNhbWUtcHJvZHVjdCBhcyBhIG5ldyBpbnN0YW5jZSAoU2F2ZSBhcyBuZXcgaXRlbSlcbiAgY29uc3QgaGFuZGxlU2F2ZUFzTmV3SW5zdGFuY2UgPSAoKSA9PiB7XG4gICAgLy8gVHJpZ2dlciBzdWJtaXQgaW5kaXJlY3RseSBidXQgdGVsbCBpdCB0byBmb3JjZSBjcmVhdGUgbmV3XG4gICAgY29uc3QgZmFrZUV2ZW50ID0geyBwcmV2ZW50RGVmYXVsdDogKCkgPT4ge30gfSBhcyBSZWFjdC5Gb3JtRXZlbnQ7XG4gICAgaGFuZGxlRm9ybVNhdmUoZmFrZUV2ZW50LCB0cnVlKTtcbiAgfTtcblxuICAvLyBBcmNoaXZlIGEgc3BlY2lmaWMgcHJvZHVjdCBpbnN0YW5jZSAoUmVxdWlyZW1lbnQgNClcbiAgY29uc3QgaGFuZGxlQXJjaGl2ZUluc3RhbmNlID0gKHByb2RJZDogc3RyaW5nLCBpbnN0SWQ6IHN0cmluZykgPT4ge1xuICAgIGFza0NvbmZpcm1hdGlvbihcbiAgICAgICfnp7voh7Pmrbflj7LntIDpjITvvIjlsIHlrZjvvIknLFxuICAgICAgJ+eiuuWumuimgeWwh+mAmeWAi+imj+agvOaYjue0sOenu+WIsOatt+WPsue0gOmMhO+8iOWwgeWtmO+8ieWXju+8n+WwgeWtmOW+jOWwh+enu+iHs+att+WPsuWIhumggeOAgicsXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGxldCBhcmNoaXZlZEluc3RhbmNlOiBQcm9kdWN0SW5zdGFuY2UgfCBudWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHRhcmdldFByb2R1Y3Q6IFByb2R1Y3QgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdCBuZXh0UHJvZHVjdHMgPSBwcm9kdWN0cy5tYXAocHJvZCA9PiB7XG4gICAgICAgICAgaWYgKHByb2QuaWQgPT09IHByb2RJZCkge1xuICAgICAgICAgICAgdGFyZ2V0UHJvZHVjdCA9IHByb2Q7XG4gICAgICAgICAgICBhcmNoaXZlZEluc3RhbmNlID0gcHJvZC5pbnN0YW5jZXMuZmluZChpID0+IGkuaWQgPT09IGluc3RJZCkgfHwgbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIC4uLnByb2QsXG4gICAgICAgICAgICAgIGluc3RhbmNlczogcHJvZC5pbnN0YW5jZXMuZmlsdGVyKGkgPT4gaS5pZCAhPT0gaW5zdElkKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHByb2Q7XG4gICAgICAgIH0pLmZpbHRlcihwID0+IHAuaW5zdGFuY2VzLmxlbmd0aCA+IDApO1xuXG4gICAgICAgIGlmIChhcmNoaXZlZEluc3RhbmNlICYmIHRhcmdldFByb2R1Y3QpIHtcbiAgICAgICAgICAvLyBDcmVhdGUgc2VwYXJhdGUgYXJjaGl2ZWQgcHJvZHVjdCBncm91cCBpbiBoaXN0b3J5XG4gICAgICAgICAgY29uc3QgbmV3QXJjaGl2ZWRQcm9kOiBQcm9kdWN0ID0ge1xuICAgICAgICAgICAgaWQ6IGBwcm9kX2FyY2hpdmVkXyR7RGF0ZS5ub3coKX1gLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICh0YXJnZXRQcm9kdWN0IGFzIFByb2R1Y3QpLmNhdGVnb3J5LFxuICAgICAgICAgICAgc3ViY2F0ZWdvcnk6ICh0YXJnZXRQcm9kdWN0IGFzIFByb2R1Y3QpLnN1YmNhdGVnb3J5LFxuICAgICAgICAgICAgYnJhbmQ6ICh0YXJnZXRQcm9kdWN0IGFzIFByb2R1Y3QpLmJyYW5kLFxuICAgICAgICAgICAgbmFtZTogKHRhcmdldFByb2R1Y3QgYXMgUHJvZHVjdCkubmFtZSxcbiAgICAgICAgICAgIHBob3RvOiAodGFyZ2V0UHJvZHVjdCBhcyBQcm9kdWN0KS5waG90byxcbiAgICAgICAgICAgIHN0YXR1czogJ2FyY2hpdmVkJyxcbiAgICAgICAgICAgIHRocmVzaG9sZDogKHRhcmdldFByb2R1Y3QgYXMgUHJvZHVjdCkudGhyZXNob2xkLFxuICAgICAgICAgICAgaW5zdGFuY2VzOiBbe1xuICAgICAgICAgICAgICAuLi4oYXJjaGl2ZWRJbnN0YW5jZSBhcyBQcm9kdWN0SW5zdGFuY2UpLFxuICAgICAgICAgICAgICBpZDogYGluc3RfYXJjaGl2ZWRfJHtEYXRlLm5vdygpfWBcbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb25zdCBmaW5hbFByb2R1Y3RzID0gWy4uLm5leHRQcm9kdWN0cywgbmV3QXJjaGl2ZWRQcm9kXTtcbiAgICAgICAgICBzZXRQcm9kdWN0cyhmaW5hbFByb2R1Y3RzKTtcbiAgICAgICAgICBzaG93VG9hc3QoJ+W3suWwh+ipsuaYjue0sOatuOaqlOiHs+att+WPsue0gOmMhO+8gScpO1xuXG4gICAgICAgICAgLy8gSWYgdGhlIGRldGFpbGVkIG1vZGFsIGlzIG9wZW4gZm9yIHRoaXMgcHJvZHVjdCwgc3luYyBpdCBvciBjbG9zZSBpZiBlbXB0eVxuICAgICAgICAgIGlmIChzZWxlY3RlZERldGFpbFByb2R1Y3QgJiYgc2VsZWN0ZWREZXRhaWxQcm9kdWN0LmlkID09PSBwcm9kSWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QgPSBmaW5hbFByb2R1Y3RzLmZpbmQocCA9PiBwLmlkID09PSBwcm9kSWQpO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgLy8gRGVsZXRlIHNwZWNpZmljIHByb2R1Y3QgaW5zdGFuY2VcbiAgY29uc3QgaGFuZGxlRGVsZXRlSW5zdGFuY2UgPSAoKSA9PiB7XG4gICAgaWYgKGVkaXRpbmdJbnN0YW5jZUlkICYmIGVkaXRpbmdQcm9kdWN0SWQpIHtcbiAgICAgIGFza0NvbmZpcm1hdGlvbihcbiAgICAgICAgJ+awuOS5heWIqumZpOaYjue0sCcsXG4gICAgICAgICfnorrlrpropoHmsLjkuYXliKrpmaTmraTllYblk4HmmI7ntLDll47vvJ/mraTmk43kvZznhKHms5Xlvqnljp/jgIInLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV4dFByb2R1Y3RzID0gcHJvZHVjdHMubWFwKHByb2QgPT4ge1xuICAgICAgICAgICAgaWYgKHByb2QuaWQgPT09IGVkaXRpbmdQcm9kdWN0SWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAuLi5wcm9kLFxuICAgICAgICAgICAgICAgIGluc3RhbmNlczogcHJvZC5pbnN0YW5jZXMuZmlsdGVyKGkgPT4gaS5pZCAhPT0gZWRpdGluZ0luc3RhbmNlSWQpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvZDtcbiAgICAgICAgICB9KS5maWx0ZXIocCA9PiBwLmluc3RhbmNlcy5sZW5ndGggPiAwKTtcblxuICAgICAgICAgIHNldFByb2R1Y3RzKG5leHRQcm9kdWN0cyk7XG4gICAgICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgICAgIGNsZWFyRm9ybSgpO1xuICAgICAgICAgIHNob3dUb2FzdCgn5piO57Sw5bey5oiQ5Yqf5rC45LmF5Yiq6Zmk77yBJyk7XG5cbiAgICAgICAgICAvLyBJZiBkZXRhaWwgbW9kYWwgaXMgb3BlbiBmb3IgdGhpcyBwcm9kdWN0LCBzeW5jIG9yIGNsb3NlXG4gICAgICAgICAgaWYgKHNlbGVjdGVkRGV0YWlsUHJvZHVjdCAmJiBzZWxlY3RlZERldGFpbFByb2R1Y3QuaWQgPT09IGVkaXRpbmdQcm9kdWN0SWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QgPSBuZXh0UHJvZHVjdHMuZmluZChwID0+IHAuaWQgPT09IGVkaXRpbmdQcm9kdWN0SWQpO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRGVsZXRlSW5zdGFuY2VEaXJlY3QgPSAocHJvZElkOiBzdHJpbmcsIGluc3RJZDogc3RyaW5nKSA9PiB7XG4gICAgYXNrQ29uZmlybWF0aW9uKFxuICAgICAgJ+awuOS5heWIqumZpOaYjue0sCcsXG4gICAgICAn56K65a6a6KaB5rC45LmF5Yiq6Zmk5q2k6KaP5qC85piO57Sw5ZeO77yf5q2k5pON5L2c54Sh5rOV5b6p5Y6f44CCJyxcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dFByb2R1Y3RzID0gcHJvZHVjdHMubWFwKHByb2QgPT4ge1xuICAgICAgICAgIGlmIChwcm9kLmlkID09PSBwcm9kSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIC4uLnByb2QsXG4gICAgICAgICAgICAgIGluc3RhbmNlczogcHJvZC5pbnN0YW5jZXMuZmlsdGVyKGkgPT4gaS5pZCAhPT0gaW5zdElkKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHByb2Q7XG4gICAgICAgIH0pLmZpbHRlcihwID0+IHAuaW5zdGFuY2VzLmxlbmd0aCA+IDApO1xuXG4gICAgICAgIHNldFByb2R1Y3RzKG5leHRQcm9kdWN0cyk7XG4gICAgICAgIHNob3dUb2FzdCgn6KaP5qC85piO57Sw5bey5oiQ5Yqf5rC45LmF5Yiq6Zmk77yBJyk7XG5cbiAgICAgICAgLy8gSWYgZGV0YWlsIG1vZGFsIGlzIG9wZW4sIHN5bmMgb3IgY2xvc2VcbiAgICAgICAgaWYgKHNlbGVjdGVkRGV0YWlsUHJvZHVjdCAmJiBzZWxlY3RlZERldGFpbFByb2R1Y3QuaWQgPT09IHByb2RJZCkge1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QgPSBuZXh0UHJvZHVjdHMuZmluZChwID0+IHAuaWQgPT09IHByb2RJZCk7XG4gICAgICAgICAgaWYgKHVwZGF0ZWREZXRhaWxlZFByb2R1Y3QpIHtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkRGV0YWlsUHJvZHVjdCh1cGRhdGVkRGV0YWlsZWRQcm9kdWN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgLy8gUXVpY2sgcHJlcG9wdWxhdGUgZm9ybSB3aGVuIGFkZGluZyBhbm90aGVyIGluc3RhbmNlIHVuZGVyIGEgcHJvZHVjdFxuICBjb25zdCBoYW5kbGVBZGRBbm90aGVySW5zdGFuY2VUcmlnZ2VyID0gKHByb2Q6IFByb2R1Y3QpID0+IHtcbiAgICBjbGVhckZvcm0oKTtcbiAgICBzZXRFZGl0aW5nUHJvZHVjdElkKHByb2QuaWQpOyAvLyBzZXQgdGhpcyB0byBlbnN1cmUgd2Uga25vdyBpdCBiZWxvbmdzIHRvIGFuIGV4aXN0aW5nIHByb2R1Y3RcbiAgICBzZXRJc0FkZGluZ0luc3RhbmNlVG9FeGlzdGluZyh0cnVlKTtcbiAgICBzZXRJc0VkaXRpbmdNYXN0ZXIoZmFsc2UpO1xuICAgIHNldEZvcm1CcmFuZChwcm9kLmJyYW5kKTtcbiAgICBzZXRGb3JtTmFtZShwcm9kLm5hbWUpO1xuICAgIHNldEZvcm1DYXRlZ29yeShwcm9kLmNhdGVnb3J5KTtcbiAgICBzZXRGb3JtU3ViY2F0ZWdvcnkocHJvZC5zdWJjYXRlZ29yeSk7XG4gICAgc2V0Rm9ybVVzYWdlKCfmnKrplovlsIEnKTtcbiAgICBzZXRGb3JtUGhvdG8ocHJvZC5waG90byB8fCAnJyk7XG4gICAgXG4gICAgc2V0U2hvd0FkZEZvcm0odHJ1ZSk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFudWFsLWFkZC1mb3JtJyk/LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH0sIDEwMCk7XG4gIH07XG5cbiAgLy8gLS0tIFNlYXJjaCBGaWx0ZXJpbmcgSGVscGVyIC0tLVxuICBjb25zdCBhY3RpdmVQcm9kdWN0cyA9IHByb2R1Y3RzLmZpbHRlcihwcm9kID0+IHtcbiAgICBpZiAoc2VhcmNoS2V5d29yZC50cmltKCkpIHtcbiAgICAgIGlmIChwcm9kLnN0YXR1cyAhPT0gJ2FjdGl2ZScpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IHRlcm0gPSBzZWFyY2hLZXl3b3JkLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBjYXROYW1lID0gY2F0ZWdvcmllcy5maW5kKGMgPT4gYy5pZCA9PT0gcHJvZC5jYXRlZ29yeSk/Lm5hbWUgfHwgJyc7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBwcm9kLmJyYW5kLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModGVybSkgfHxcbiAgICAgICAgcHJvZC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModGVybSkgfHxcbiAgICAgICAgcHJvZC5zdWJjYXRlZ29yeS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRlcm0pIHx8XG4gICAgICAgIGNhdE5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyh0ZXJtKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFRhYiA9PT0gJ2hpc3RvcnknKSB7XG4gICAgICBpZiAocHJvZC5zdGF0dXMgIT09ICdhcmNoaXZlZCcpIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHByb2Quc3RhdHVzICE9PSAnYWN0aXZlJykgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKHByb2QuY2F0ZWdvcnkgIT09IGN1cnJlbnRUYWIpIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgLy8gQ2FsY3VsYXRlIHN0YXRpc3RpY3MgZm9yIGhlYWRlciBhbmQgY2F0ZWdvcnkgc3ViaGVhZGVyc1xuICBjb25zdCBnZXRTdWJjYXRlZ29yeVN0YXRzID0gKHN1Yk5hbWU6IHN0cmluZywgY2F0ZWdvcnlJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbWF0Y2hlZFByb2RzID0gcHJvZHVjdHMuZmlsdGVyKHAgPT4gcC5zdGF0dXMgPT09ICdhY3RpdmUnICYmIHAuY2F0ZWdvcnkgPT09IGNhdGVnb3J5SWQgJiYgcC5zdWJjYXRlZ29yeSA9PT0gc3ViTmFtZSk7XG4gICAgY29uc3QgdG90YWxDb3VudCA9IG1hdGNoZWRQcm9kcy5sZW5ndGg7XG4gICAgbGV0IHRvdGFsUXR5ID0gMDtcbiAgICBtYXRjaGVkUHJvZHMuZm9yRWFjaChwID0+IHtcbiAgICAgIHAuaW5zdGFuY2VzLmZvckVhY2goaSA9PiB7XG4gICAgICAgIHRvdGFsUXR5ICs9IGkucXR5O1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgY291bnQ6IHRvdGFsQ291bnQsIHF0eTogdG90YWxRdHkgfTtcbiAgfTtcblxuICBjb25zdCBnZXRDYXRlZ29yeVN0YXRzID0gKGNhdGVnb3J5SWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1hdGNoZWRQcm9kcyA9IHByb2R1Y3RzLmZpbHRlcihwID0+IHAuc3RhdHVzID09PSAnYWN0aXZlJyAmJiBwLmNhdGVnb3J5ID09PSBjYXRlZ29yeUlkKTtcbiAgICBjb25zdCB0b3RhbENvdW50ID0gbWF0Y2hlZFByb2RzLmxlbmd0aDtcbiAgICBsZXQgdG90YWxRdHkgPSAwO1xuICAgIG1hdGNoZWRQcm9kcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgcC5pbnN0YW5jZXMuZm9yRWFjaChpID0+IHtcbiAgICAgICAgdG90YWxRdHkgKz0gaS5xdHk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4geyBjb3VudDogdG90YWxDb3VudCwgcXR5OiB0b3RhbFF0eSB9O1xuICB9O1xuXG4gIC8vIEdldCBjdXJyZW50IHN1YmNhdGVnb3JpZXMgZm9yIHNlbGVjdGVkIGZvcm0gY2F0ZWdvcnlcbiAgY29uc3QgY3VycmVudEZvcm1DYXRlZ29yeU9iaiA9IGNhdGVnb3JpZXMuZmluZChjID0+IGMuaWQgPT09IGZvcm1DYXRlZ29yeSk7XG4gIGNvbnN0IGN1cnJlbnRGb3JtU3ViY2F0ZWdvcmllcyA9IGN1cnJlbnRGb3JtQ2F0ZWdvcnlPYmogPyBjdXJyZW50Rm9ybUNhdGVnb3J5T2JqLnN1YmNhdGVnb3JpZXMgOiBbXTtcblxuICBpZiAoIWlzRGF0YUxvYWRlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1yZXRyby1iZyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBmb250LXNhbnNcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgIDxTcGFya2xlcyBjbGFzc05hbWU9XCJ3LTggaC04IHRleHQtcmV0cm8tcHJpbWFyeSBhbmltYXRlLXB1bHNlXCIgLz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXJldHJvLXRleHQgZm9udC1ib2xkIHRleHQtc20gdHJhY2tpbmctd2lkZXIgdXBwZXJjYXNlXCI+TG9hZGluZy4uLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1yZXRyby1iZyB0ZXh0LXJldHJvLXRleHQgcmVsYXRpdmUgcGItMjQgZm9udC1zYW5zIHNlbGVjdC1ub25lIGFudGlhbGlhc2VkXCI+XG4gICAgICB7LyogMS4gQXBwIEhlYWRlciAqL31cbiAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicHgtNSBweS01IHB0LVttYXgoMS4yNXJlbSxlbnYoc2FmZS1hcmVhLWluc2V0LXRvcCkpXSBmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgYmctcmV0cm8tYmcvOTAgYmFja2Ryb3AtYmx1ci1zbSBzdGlja3kgdG9wLTAgei00MCBib3JkZXItYiBib3JkZXItcmV0cm8tdGV4dC8xMCBtYXgtdy0yeGwgbXgtYXV0b1wiPlxuICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIGZvbnQtZGlzcGxheSB0cmFja2luZy10aWdodCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxzcGFuPueUqOWTgeeuoeeQhuezu+e1sTwvc3Bhbj5cbiAgICAgICAgPC9oMT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGdhbGxlcnlJbnB1dFJlZi5jdXJyZW50Py5jbGljaygpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0xMSBoLTExIHJvdW5kZWQtZnVsbCBiZy1yZXRyby1wcmltYXJ5IHRleHQtcmV0cm8tY2FyZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGhvdmVyOmJyaWdodG5lc3MtMTA1XCJcbiAgICAgICAgICAgIHRpdGxlPVwi54Wn54mH6L6o6K2Y5paw5aKeXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8SW1hZ2VJY29uIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBmaWxlSW5wdXRSZWYuY3VycmVudD8uY2xpY2soKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMTEgaC0xMSByb3VuZGVkLWZ1bGwgYmctcmV0cm8tcHJpbWFyeSB0ZXh0LXJldHJvLWNhcmQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBob3ZlcjpicmlnaHRuZXNzLTEwNVwiXG4gICAgICAgICAgICB0aXRsZT1cIuaLjeeFp+i+qOitmOaWsOWinlwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPENhbWVyYSBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoc2hvd0FkZEZvcm0pIHtcbiAgICAgICAgICAgICAgICBzZXRTaG93QWRkRm9ybShmYWxzZSk7XG4gICAgICAgICAgICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICAgICAgICAgICAgc2V0U2hvd0FkZEZvcm0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFudWFsLWFkZC1mb3JtJyk/LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTExIGgtMTEgcm91bmRlZC1mdWxsIGJnLXJldHJvLXNlY29uZGFyeSB0ZXh0LXJldHJvLWNhcmQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBob3ZlcjpicmlnaHRuZXNzLTEwNVwiXG4gICAgICAgICAgICB0aXRsZT1cIuaJi+WLlei8uOWFpeaWsOWinlwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy01IGgtNSB0cmFuc2l0aW9uLXRyYW5zZm9ybVwiIHN0eWxlPXt7IHRyYW5zZm9ybTogc2hvd0FkZEZvcm0gPyAncm90YXRlKDQ1ZGVnKScgOiAncm90YXRlKDApJyB9fSAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICB7LyogSGlkZGVuIGZpbGUgdHJpZ2dlcnMgKi99XG4gICAgICA8aW5wdXQgXG4gICAgICAgIHR5cGU9XCJmaWxlXCIgXG4gICAgICAgIHJlZj17ZmlsZUlucHV0UmVmfVxuICAgICAgICBvbkNoYW5nZT17KGUpID0+IGhhbmRsZVBob3RvVXBsb2FkKGUsIGZhbHNlKX1cbiAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiIFxuICAgICAgICBjYXB0dXJlPVwiZW52aXJvbm1lbnRcIiBcbiAgICAgICAgY2xhc3NOYW1lPVwiaGlkZGVuXCJcbiAgICAgIC8+XG4gICAgICA8aW5wdXQgXG4gICAgICAgIHR5cGU9XCJmaWxlXCIgXG4gICAgICAgIHJlZj17Z2FsbGVyeUlucHV0UmVmfVxuICAgICAgICBvbkNoYW5nZT17KGUpID0+IGhhbmRsZVBob3RvVXBsb2FkKGUsIGZhbHNlKX1cbiAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiIFxuICAgICAgICBjbGFzc05hbWU9XCJoaWRkZW5cIlxuICAgICAgLz5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYXgtdy0yeGwgbXgtYXV0byBweC00IG10LTJcIj5cbiAgICAgICAgey8qIDIuIEV4cGlyZWQgTm90aWZpY2F0aW9uIEJhbm5lciAoUmVxdWlyZW1lbnQgMykgKi99XG4gICAgICAgIHtleHBpcmVkUGFvSXRlbXMubGVuZ3RoID4gMCAmJiBzaG93Tm90aWZpY2F0aW9uQmFubmVyICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTQgcC00IHJvdW5kZWQteGwgYmctcmVkLTEwMCBib3JkZXIgYm9yZGVyLXJlZC0zMDAgdGV4dC1yZWQtOTAwIHNoYWRvdy1zbSByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQgZ2FwLTIuNVwiPlxuICAgICAgICAgICAgICA8QWxlcnRUcmlhbmdsZSBjbGFzc05hbWU9XCJ3LTUgaC01IHRleHQtcmVkLTYwMCBmbGV4LXNocmluay0wIG10LTAuNSBhbmltYXRlLWJvdW5jZVwiIC8+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbSBmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHItNlwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+8J+ToiDplovlsIHpgY7mnJ/ororos6rorabloLHvvIE8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJlZC04MDAgbXQtMVwiPlxuICAgICAgICAgICAgICAgICAg5Lul5LiL55Si5ZOB5bey6LaF5Ye66ZaL5bCB5b6M5bu66K2w5L2/55So5pyf6ZmQ77yM5qW15piT5ruL55Sf57Sw6I+M6K6K6LOq77yM6KuL5YSY6YCf5pu/5o+b77yaXG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJtdC0yIGZsZXggZmxleC1jb2wgZ2FwLTEuNSBtYXgtaC0zMiBvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgICAgICAgICAgIHtleHBpcmVkUGFvSXRlbXMubWFwKChpdGVtLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGxpIGtleT17aWR4fSBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZsZXggZmxleC13cmFwIGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgYmctcmVkLTUwIHAtMiByb3VuZGVkIGJvcmRlciBib3JkZXItcmVkLTIwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIHRleHQtcmVkLTk1MFwiPlt7aXRlbS5wcm9kdWN0LmJyYW5kfV0ge2l0ZW0ucHJvZHVjdC5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLmluc3RhbmNlLmNhcGFjaXR5ICYmIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTEgdGV4dC1bMTBweF0gYmctcmVkLTIwMCB0ZXh0LXJlZC04MDAgcHgtMSByb3VuZGVkXCI+e2l0ZW0uaW5zdGFuY2UuY2FwYWNpdHl9PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LXJlZC03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIOW3sumBjuacnyB7aXRlbS5kYXlzT3ZlcmR1ZX0g5aSpICjplovlsIE6IHtpdGVtLmluc3RhbmNlLm9wZW5lZERhdGV9KVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dOb3RpZmljYXRpb25CYW5uZXIoZmFsc2UpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMyByaWdodC0zIHRleHQtcmVkLTYwMCBob3Zlcjp0ZXh0LXJlZC05NTAgcC0wLjUgcm91bmRlZC1mdWxsIGhvdmVyOmJnLXJlZC0yMDAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiAzLiBTZWFyY2ggQmFyICovfVxuICAgICAgICB7Y3VycmVudFRhYiAhPT0gJ3NldHRpbmdzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBtYi01XCI+XG4gICAgICAgICAgICA8U2VhcmNoIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtNCB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdGV4dC1yZXRyby10ZXh0LzQwIHctNC41IGgtNC41XCIgLz5cbiAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLmkJzlsIvlk4HniYzjgIHnlKLlk4HmiJblsI/liIbpoZ4uLi5cIlxuICAgICAgICAgICAgICB2YWx1ZT17c2VhcmNoS2V5d29yZH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTZWFyY2hLZXl3b3JkKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHBsLTExIHByLTQgcHktMyBiZy1yZXRyby1jYXJkIHJvdW5kZWQtMnhsIHRleHQtc20gYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzUgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLXJldHJvLXByaW1hcnkgc2hhZG93LWlubmVyIHRleHQtcmV0cm8tdGV4dCBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAge3NlYXJjaEtleXdvcmQgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNlYXJjaEtleXdvcmQoJycpfSBcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSByaWdodC0zIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby10ZXh0IHAtMVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiA0LiBEeW5hbWljIEFJIFN0YXR1cyBMb2FkaW5nIE92ZXJsYXkgKi99XG4gICAgICAgIHtpc0FuYWx5emluZyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIGJnLXN0b25lLTkwMC84NSB6LTUwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNiBiYWNrZHJvcC1ibHVyLXNtXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXJldHJvLWNhcmQgcC02IHJvdW5kZWQtMnhsIG1heC13LXNtIHctZnVsbCB0ZXh0LWNlbnRlciBzaGFkb3ctMnhsIGJvcmRlciBib3JkZXItcmV0cm8tcHJpbWFyeS8yMFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgcm91bmRlZC1mdWxsIGJvcmRlci00IGJvcmRlci1yZXRyby1wcmltYXJ5IGJvcmRlci10LXRyYW5zcGFyZW50IGFuaW1hdGUtc3BpblwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJmb250LWJvbGQgZm9udC1kaXNwbGF5IHRleHQtbGcgdHJhY2tpbmctd2lkZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICA8U3BhcmtsZXMgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LXJldHJvLXNlY29uZGFyeSBhbmltYXRlLXB1bHNlXCIgLz5cbiAgICAgICAgICAgICAgICAgIEFJIOW9seWDj+i+qOitmOS4rS4uLlxuICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctcmV0cm8tYmcgcm91bmRlZC1mdWxsIGgtMiBvdmVyZmxvdy1oaWRkZW4gbXQtMVwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1yZXRyby1wcmltYXJ5IGgtZnVsbCBhbmltYXRlLXByb2dyZXNzXCIgc3R5bGU9e3sgd2lkdGg6ICc3NSUnIH19PjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yZXRyby10ZXh0Lzc1IGZvbnQtc2VtaWJvbGQgbXQtMVwiPnthaVN0YXR1c1RleHR9PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiA1LiBBZGQgLyBFZGl0IFByb2R1Y3QgRm9ybSAqL31cbiAgICAgICAge3Nob3dBZGRGb3JtICYmIChcbiAgICAgICAgICA8ZGl2IGlkPVwibWFudWFsLWFkZC1mb3JtXCIgY2xhc3NOYW1lPVwibWItNiBwLTUgYmctcmV0cm8tY2FyZCByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXJldHJvLXByaW1hcnkvMzAgc2hhZG93LW1kIGFuaW1hdGUtZmFkZS1pblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgbWItNFwiPlxuICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJvbGQgdGV4dC1yZXRyby1zZWNvbmRhcnkgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8U3BhcmtsZXMgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICAgICAge2lzRWRpdGluZ01hc3RlciA/ICfnt6jovK/lpKflk4HpoIUnIDogZWRpdGluZ0luc3RhbmNlSWQgPyAn5L+u5pS55piO57Sw6LOH6KiKJyA6IGlzQWRkaW5nSW5zdGFuY2VUb0V4aXN0aW5nID8gJ+aWsOWinuimj+agvOaYjue0sCcgOiAn56K66KqN5paw5aKe5ZOB6aCFJ31cbiAgICAgICAgICAgICAgPC9oMz5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCIgXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby10ZXh0IHAtMSByb3VuZGVkLWZ1bGwgaG92ZXI6YmctcmV0cm8tYmdcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVGb3JtU2F2ZX0gY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICAgIHsvKiA9PT09PT0gTUFTVEVSIFBST0RVQ1QgRklFTERTID09PT09PSAqL31cbiAgICAgICAgICAgICAgeyghZWRpdGluZ0luc3RhbmNlSWQgJiYgIWlzQWRkaW5nSW5zdGFuY2VUb0V4aXN0aW5nKSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgICAgIHsvKiBQaG90byBTZWxlY3QgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0Lzc1IG1iLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIOeUouWTgeeFp+eJhyAo6YG45aGrKVxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZj17Zm9ybVBob3RvSW5wdXRSZWZ9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGhhbmRsZVBob3RvVXBsb2FkKGUsIHRydWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZm9ybVBob3RvSW5wdXRSZWYuY3VycmVudD8uY2xpY2soKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLXhsIGJnLXJldHJvLXByaW1hcnkgdGV4dC1yZXRyby1jYXJkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Q2FtZXJhIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIHtmb3JtUGhvdG8gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtmb3JtUGhvdG99IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdD1cIumgkOimvVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLWxnIG9iamVjdC1jb3ZlciBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvMTBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZvcm1QaG90bygnJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJlZC01MDAgZm9udC1ib2xkIGhvdmVyOnVuZGVybGluZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDnp7vpmaRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJldHJvLXRleHQvNDAgZm9udC1tZWRpdW1cIj7lsJrmnKrpgbjmk4fnhafniYc8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIE1haW4gQ2F0ZWdvcnkgJiBTdWJjYXRlZ29yeSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuS4u+mhnuWIpTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtQ2F0ZWdvcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybUNhdGVnb3J5KGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybVN1YmNhdGVnb3J5KCcnKTsgLy8gcmVzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcC0yLjUgYmctd2hpdGUvNTAgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQteGwgdGV4dC1zbSB0ZXh0LXJldHJvLXRleHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yZXRyby1wcmltYXJ5IGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y2F0ZWdvcmllcy5tYXAoY2F0ID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2NhdC5pZH0gdmFsdWU9e2NhdC5pZH0+e2NhdC5uYW1lfTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC83NSBtYi0xXCI+5a2Q5YiG6aGePC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGb3JtU3ViY2F0ZWdvcmllcy5pbmNsdWRlcyhmb3JtU3ViY2F0ZWdvcnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGZvcm1TdWJjYXRlZ29yeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBmb3JtU3ViY2F0ZWdvcnkgPT09ICcnIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICcnIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdjdXN0b20nXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gZS50YXJnZXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gJ2N1c3RvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEZvcm1TdWJjYXRlZ29yeSgn6Ieq6KiC5a2Q5YiG6aGeJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEZvcm1TdWJjYXRlZ29yeSh2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj7oq4vpgbjmk4flrZDliIbpoZ48L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2N1cnJlbnRGb3JtU3ViY2F0ZWdvcmllcy5tYXAoKHN1YiwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2lkeH0gdmFsdWU9e3N1Yn0+e3N1Yn08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjdXN0b21cIj7inI3vuI8g6Ieq6KiC5YW25LuWLi4uPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgeyhmb3JtU3ViY2F0ZWdvcnkgIT09ICcnICYmICFjdXJyZW50Rm9ybVN1YmNhdGVnb3JpZXMuaW5jbHVkZXMoZm9ybVN1YmNhdGVnb3J5KSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIuiri+i8uOWFpeiHquioguWtkOWIhumhnuWQjeeosVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1TdWJjYXRlZ29yeSA9PT0gJ+iHquioguWtkOWIhumhnicgPyAnJyA6IGZvcm1TdWJjYXRlZ29yeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1TdWJjYXRlZ29yeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogQnJhbmQgTmFtZSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuWTgeeJjOWQjeeosTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi6KuL6Ly45YWl5ZOB54mMXCJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybUJyYW5kfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybUJyYW5kKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcC0yLjUgYmctd2hpdGUvNTAgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQteGwgdGV4dC1zbSB0ZXh0LXJldHJvLXRleHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yZXRyby1wcmltYXJ5IGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogUHJvZHVjdCBOYW1lICYgQUkgV2ViIFNlYXJjaCBBc3Npc3QgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBtYi0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC83NVwiPueUouWTgeWQjeeosTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAge2lzU2VhcmNoaW5nQWkgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1yZXRyby1wcmltYXJ5IGFuaW1hdGUtcHVsc2UgZm9udC1zZW1pYm9sZFwiPkFJIOato+WcqOe2suaQnOS4rS4uLjwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLoq4vovLjlhaXnlKLlk4HlkI3nqLFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1OYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtTmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcC0yLjUgYmctd2hpdGUvNTAgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQteGwgdGV4dC1zbSB0ZXh0LXJldHJvLXRleHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yZXRyby1wcmltYXJ5IGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUFpV2ViU2VhcmNofVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0xMCBoLTEwIHJvdW5kZWQteGwgYmctcmV0cm8tcHJpbWFyeSB0ZXh0LXJldHJvLWNhcmQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleC1zaHJpbmstMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIue2sui3r+aQnOWwi+WumOaWueWujOaVtOWTgeeJjOiIh+WTgeWQjVwiXG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNlYXJjaCBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIFRocmVzaG9sZCAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuijnOiyqOmWgOaqu+aVuOmHjzwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCIgXG4gICAgICAgICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLkvY7mlrzmraTmlbjph4/mmYLmj5DphpIgKDApXCJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybVRocmVzaG9sZCA9PT0gMCA/ICcnIDogZm9ybVRocmVzaG9sZH1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1UaHJlc2hvbGQoZS50YXJnZXQudmFsdWUgPT09ICcnID8gMCA6IE1hdGgubWF4KDAsIHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKSB8fCAwKSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtcmV0cm8tdGV4dC81MCBtdC0xXCI+5q2k5ZOB6aCF5omA5pyJ5pyq6ZaL5bCB5piO57Sw5LmL5pW46YeP5Yqg57i95L2O5pa85q2k6Kit5a6a5pmC77yM5pyD6aGv56S66KOc6LKo5o+Q6YaSPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgey8qID09PT09PSBJTlNUQU5DRSBQUk9EVUNUIEZJRUxEUyA9PT09PT0gKi99XG4gICAgICAgICAgICAgIHshaXNFZGl0aW5nTWFzdGVyICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICAgICAgey8qIFF1YW50aXR5IGFuZCBDYXBhY2l0eSAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuaVuOmHjzwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIiBcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLkvovlpoI6IDFcIlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybVF0eSA9PT0gMCA/ICcnIDogZm9ybVF0eX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtUXR5KGUudGFyZ2V0LnZhbHVlID09PSAnJyA/IDAgOiBNYXRoLm1heCgwLCBwYXJzZUludChlLnRhcmdldC52YWx1ZSkgfHwgMCkpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcC0yLjUgYmctd2hpdGUvNTAgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQteGwgdGV4dC1zbSB0ZXh0LXJldHJvLXRleHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yZXRyby1wcmltYXJ5IGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuWuuemHjzwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi5L6L5aaCOiAzMFwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtQ2FwYWNpdHl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybUNhcGFjaXR5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0Lzc1IG1iLTFcIj7llq7kvY08L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybUNhcGFjaXR5VW5pdH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtQ2FwYWNpdHlVbml0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJtbFwiPm1sPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJnXCI+Zzwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwi5YCLXCI+5YCLPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCLnvZBcIj7nvZA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIumMoFwiPumMoDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwi6aGGXCI+6aGGPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFVzYWdlICovfVxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuS9v+eUqOeLgOaFizwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPHNlbGVjdCBcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtVXNhZ2V9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1Vc2FnZShlLnRhcmdldC52YWx1ZSBhcyBhbnkpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIuS9v+eUqOS4rVwiPuS9v+eUqOS4rTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIuacqumWi+WwgVwiPuacqumWi+WwgTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIuW3sueUqOWujFwiPuW3sueUqOWujDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIuW3suS4n+ajhFwiPuW3suS4n+ajhDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogUmVxdWlyZW1lbnQgMzogUGVyaW9kIEFmdGVyIE9wZW5pbmcgKFBBTykgJiBPcGVuaW5nIERhdGUgZmllbGRzICovfVxuICAgICAgICAgICAgICB7KGZvcm1Vc2FnZSA9PT0gJ+S9v+eUqOS4rScgfHwgZm9ybVVzYWdlID09PSAn5bey55So5a6MJyB8fCBmb3JtVXNhZ2UgPT09ICflt7LkuJ/mo4QnKSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0Lzc1IG1iLTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgdGV4dC1yZXRyby1zZWNvbmRhcnlcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8Q2FsZW5kYXIgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIOmWi+WwgeaXpeacn1xuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImRhdGVcIiBcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybU9wZW5lZERhdGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtT3BlbmVkRGF0ZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIHtmb3JtVXNhZ2UgPT09ICfkvb/nlKjkuK0nID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LXJldHJvLXNlY29uZGFyeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPENsb2NrSWNvbiBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICDplovlsIHlvozlj6/kvb/nlKjmnIjmlbhcbiAgICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbj1cIjFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLkvovlpoI6IDYsIDEyLCAyNFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybVBhb01vbnRoc31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybVBhb01vbnRocyhlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcC0yLjUgYmctd2hpdGUvNTAgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQteGwgdGV4dC1zbSB0ZXh0LXJldHJvLXRleHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yZXRyby1wcmltYXJ5IGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC83NSBtYi0xIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHRleHQtcmV0cm8tc2Vjb25kYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Q2FsZW5kYXIgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAg57WQ5p2f5pel5pyfXG4gICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1GaW5pc2hlZERhdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1GaW5pc2hlZERhdGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHsvKiBFeHBpcmF0aW9uIERhdGUgKi99XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC83NSBtYi0xXCI+5pyJ5pWI5pyf6ZmQICjliLDmnJ/ml6UpPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiIFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1FeHBpcnl9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1FeHBpcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQtc20gdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LXNlbWlib2xkXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogUHVyY2hhc2UgUmVjb3JkcyBGaWVsZHMgKFJlcXVpcmVtZW50IDEgLSBwdXJjaGFzZSBkZXRhaWxzIGlucHV0cykgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWV4dHJhYm9sZCB0ZXh0LXJldHJvLXByaW1hcnkvODAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGJsb2NrXCI+XG4gICAgICAgICAgICAgICAgICDwn5uSIOizvOiyt+iIh+WDueagvOe0gOmMhCAo6YG45aGrKVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuizvOiyt+aXpeacnzwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiIFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtUHVyY2hhc2VEYXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybVB1cmNoYXNlRGF0ZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQteHMgdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LXNlbWlib2xkXCJcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC83NSBtYi0xXCI+5Zau5YO5IChOVEQpPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIiBcbiAgICAgICAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIuS+i+WmgjogMzUwXCJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybVByaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybVByaWNlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcC0yLjUgYmctd2hpdGUvNTAgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQteGwgdGV4dC14cyB0ZXh0LXJldHJvLXRleHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yZXRyby1wcmltYXJ5IGZvbnQtc2VtaWJvbGRcIlxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNzUgbWItMVwiPuizvOiyt+WcsOm7niAvIOeuoemBkzwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi5L6L5aaCOiDlsYjoh6PmsI/jgIFNT01P44CB5pel5pys5Luj6LO8Li4uXCJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1QdXJjaGFzZVBsYWNlfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1QdXJjaGFzZVBsYWNlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJnLXdoaXRlLzUwIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQteHMgdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LXNlbWlib2xkXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBBY3Rpb24gQnV0dG9ucyAqL31cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMiBwdC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTMgYmctcmV0cm8tc2Vjb25kYXJ5IHRleHQtcmV0cm8tY2FyZCBmb250LWJvbGQgdGV4dC1zbSByb3VuZGVkLXhsIGhvdmVyOmJyaWdodG5lc3MtMTA1IGFjdGl2ZTpzY2FsZS1bMC45OV0gdHJhbnNpdGlvbi1hbGwgc2hhZG93IGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nTWFzdGVyID8gJ+WEsuWtmOWkp+WTgemgheS/ruaUuScgOiBlZGl0aW5nSW5zdGFuY2VJZCA/ICflhLLlrZjkv67mlLknIDogaXNBZGRpbmdJbnN0YW5jZVRvRXhpc3RpbmcgPyAn5paw5aKe6KaP5qC85piO57SwJyA6ICfnorroqo3nhKHoqqTvvIzmlrDlop7oh7Pos4fmlpnluqsnfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAge2VkaXRpbmdJbnN0YW5jZUlkICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVNhdmVBc05ld0luc3RhbmNlfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB5LTIuNSBiZy1yZXRyby1wcmltYXJ5IHRleHQtcmV0cm8tY2FyZCBmb250LWJvbGQgdGV4dC14cyByb3VuZGVkLXhsIGhvdmVyOmJyaWdodG5lc3MtMTA1IHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIuS/neeVmeWOn+aYjue0sO+8jOS7peatpOWFp+WuueW7uueri+S4gOWAi+WQjOWVhuWTgeeahOaWsOaYjue0sOmghVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICDlj6blrZjngrrmlrDmmI7ntLAgKOWQjOWTgemghSlcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlRGVsZXRlSW5zdGFuY2V9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHktMi41IGJnLXJlZC01MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgdGV4dC14cyByb3VuZGVkLXhsIGhvdmVyOmJnLXJlZC02MDAgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAg5rC45LmF5Yiq6Zmk5q2k5piO57SwXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgIHtpc0VkaXRpbmdNYXN0ZXIgJiYgKFxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdGluZ1Byb2R1Y3RJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNrQ29uZmlybWF0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAn5Yiq6Zmk5aSn5ZOB6aCFJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ+eiuuWumuimgeawuOS5heWIqumZpOatpOWkp+WTgemgheWPiuWFtuaJgOacieizvOiyt+aYjue0sOWXju+8n+atpOaTjeS9nOeEoeazleW+qeWOn+OAgicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRQcm9kdWN0cyhwcm9kdWN0cy5maWx0ZXIocCA9PiBwLmlkICE9PSBlZGl0aW5nUHJvZHVjdElkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2hvd0FkZEZvcm0oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkRGV0YWlsUHJvZHVjdChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhckZvcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93VG9hc3QoJ+Wkp+WTgemgheW3suaIkOWKn+WIqumZpO+8gScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIuNSBiZy1yZWQtNTAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHRleHQteHMgcm91bmRlZC14bCBob3ZlcjpiZy1yZWQtNjAwIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyIG10LTJcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICDmsLjkuYXliKrpmaTmraTlpKflk4HpoIUgKOWQq+aJgOacieaYjue0sClcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiA2LiBBY3RpdmUgVGFiIFByb2R1Y3QgTGlzdCAvIFNldHRpbmdzIFNjcmVlbiAqL31cbiAgICAgICAge2N1cnJlbnRUYWIgPT09ICdzZXR0aW5ncycgPyAoXG4gICAgICAgICAgLyogPT09PT09PT09PT09PT09PT09PSBTRVRUSU5HUyBWSUVXID09PT09PT09PT09PT09PT09PT0gKi9cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNiBwYi0yMFwiPlxuICAgICAgICAgICAge3NldHRpbmdzVmlldyA9PT0gJ21lbnUnICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTQgYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIGZvbnQtZGlzcGxheSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXJldHJvLXRleHQgbWItNFwiPlxuICAgICAgICAgICAgICAgICAgPFNldHRpbmdzIGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC1yZXRyby1wcmltYXJ5XCIgLz5cbiAgICAgICAgICAgICAgICAgIOioreWumuiIh+WIhumhnueuoeeQhlxuICAgICAgICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNldHRpbmdzVmlldygnYXBpa2V5Jyl9IGNsYXNzTmFtZT1cInAtNCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvMTAgcm91bmRlZC0yeGwgc2hhZG93LXNtIGhvdmVyOmJvcmRlci1yZXRyby1wcmltYXJ5LzUwIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBncm91cCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEwIGgtMTAgcm91bmRlZC14bCBiZy1yZXRyby1wcmltYXJ5LzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtcmV0cm8tcHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNwYXJrbGVzIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQgdGV4dC1zbVwiPuioreWumiBHZW1pbmkgQVBJIOmHkemRsDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LXJldHJvLXRleHQvMzAgZ3JvdXAtaG92ZXI6dGV4dC1yZXRyby1wcmltYXJ5IGdyb3VwLWhvdmVyOnRyYW5zbGF0ZS14LTEgdHJhbnNpdGlvbi1hbGxcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0U2V0dGluZ3NWaWV3KCdjYXRlZ29yeScpfSBjbGFzc05hbWU9XCJwLTQgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBob3Zlcjpib3JkZXItcmV0cm8tcHJpbWFyeS81MCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ3JvdXAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMCBoLTEwIHJvdW5kZWQteGwgYmctcmV0cm8tc2Vjb25kYXJ5LzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtcmV0cm8tc2Vjb25kYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8TGlzdFRyZWUgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dCB0ZXh0LXNtXCI+6Kit5a6a6IiH566h55CG5YiG6aGePC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodCBjbGFzc05hbWU9XCJ3LTUgaC01IHRleHQtcmV0cm8tdGV4dC8zMCBncm91cC1ob3Zlcjp0ZXh0LXJldHJvLXByaW1hcnkgZ3JvdXAtaG92ZXI6dHJhbnNsYXRlLXgtMSB0cmFuc2l0aW9uLWFsbFwiIC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRTZXR0aW5nc1ZpZXcoJ2hpc3RvcnknKX0gY2xhc3NOYW1lPVwicC00IGJnLXdoaXRlIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLTJ4bCBzaGFkb3ctc20gaG92ZXI6Ym9yZGVyLXJldHJvLXByaW1hcnkvNTAgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdyb3VwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLXhsIGJnLXN0b25lLTEwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXN0b25lLTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEFyY2hpdmUgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dCB0ZXh0LXNtXCI+5q235Y+y5bCB5a2Y57SA6YyEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodCBjbGFzc05hbWU9XCJ3LTUgaC01IHRleHQtcmV0cm8tdGV4dC8zMCBncm91cC1ob3Zlcjp0ZXh0LXJldHJvLXByaW1hcnkgZ3JvdXAtaG92ZXI6dHJhbnNsYXRlLXgtMSB0cmFuc2l0aW9uLWFsbFwiIC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBmbGV4IGZsZXgtY29sIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLXhsIGJnLXN0b25lLTEwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXN0b25lLTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNwYXJrbGVzIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQgdGV4dC1zbVwiPuimluimuumiqOagvOioreWumjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVUaGVtZUNoYW5nZSgncmV0cm8nKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0yLjUgdGV4dC1zbSBmb250LWJvbGQgcm91bmRlZC14bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXIgJHthcHBUaGVtZSA9PT0gJ3JldHJvJyA/ICdib3JkZXItcmV0cm8tcHJpbWFyeSBiZy1yZXRyby1wcmltYXJ5LzEwIHRleHQtcmV0cm8tcHJpbWFyeSBzaGFkb3ctc20nIDogJ2JvcmRlci1yZXRyby10ZXh0LzEwIGJnLXdoaXRlIHRleHQtcmV0cm8tdGV4dC81MCBob3Zlcjp0ZXh0LXJldHJvLXRleHQgaG92ZXI6Ym9yZGVyLXJldHJvLXRleHQvMjAnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgPuW+qeWPpOmiqDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVUaGVtZUNoYW5nZSgncGl4ZWwnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0yLjUgdGV4dC1zbSBmb250LWJvbGQgcm91bmRlZC14bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXIgJHthcHBUaGVtZSA9PT0gJ3BpeGVsJyA/ICdib3JkZXItcmV0cm8tcHJpbWFyeSBiZy1yZXRyby1wcmltYXJ5LzEwIHRleHQtcmV0cm8tcHJpbWFyeSBzaGFkb3ctc20nIDogJ2JvcmRlci1yZXRyby10ZXh0LzEwIGJnLXdoaXRlIHRleHQtcmV0cm8tdGV4dC81MCBob3Zlcjp0ZXh0LXJldHJvLXRleHQgaG92ZXI6Ym9yZGVyLXJldHJvLXRleHQvMjAnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgPuWDj+e0oOmiqDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVUaGVtZUNoYW5nZSgnbWluaW1hbCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTIuNSB0ZXh0LXNtIGZvbnQtYm9sZCByb3VuZGVkLXhsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlciAke2FwcFRoZW1lID09PSAnbWluaW1hbCcgPyAnYm9yZGVyLXJldHJvLXByaW1hcnkgYmctcmV0cm8tcHJpbWFyeS8xMCB0ZXh0LXJldHJvLXByaW1hcnkgc2hhZG93LXNtJyA6ICdib3JkZXItcmV0cm8tdGV4dC8xMCBiZy13aGl0ZSB0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby10ZXh0IGhvdmVyOmJvcmRlci1yZXRyby10ZXh0LzIwJ31gfVxuICAgICAgICAgICAgICAgICAgICAgID7mlofpnZLpoqg8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBmbGV4IGZsZXgtY29sIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLXhsIGJnLXN0b25lLTEwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXN0b25lLTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFR5cGUgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dCB0ZXh0LXNtXCI+5a2X6auU5aSn5bCP6Kit5a6aPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUZvbnRTaXplQ2hhbmdlKCdzbWFsbCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTIuNSB0ZXh0LXNtIGZvbnQtYm9sZCByb3VuZGVkLXhsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlciAke2FwcEZvbnRTaXplID09PSAnc21hbGwnID8gJ2JvcmRlci1yZXRyby1wcmltYXJ5IGJnLXJldHJvLXByaW1hcnkvMTAgdGV4dC1yZXRyby1wcmltYXJ5IHNoYWRvdy1zbScgOiAnYm9yZGVyLXJldHJvLXRleHQvMTAgYmctd2hpdGUgdGV4dC1yZXRyby10ZXh0LzUwIGhvdmVyOnRleHQtcmV0cm8tdGV4dCBob3Zlcjpib3JkZXItcmV0cm8tdGV4dC8yMCd9YH1cbiAgICAgICAgICAgICAgICAgICAgICA+5bCPPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUZvbnRTaXplQ2hhbmdlKCdtZWRpdW0nKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0yLjUgdGV4dC1zbSBmb250LWJvbGQgcm91bmRlZC14bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXIgJHthcHBGb250U2l6ZSA9PT0gJ21lZGl1bScgPyAnYm9yZGVyLXJldHJvLXByaW1hcnkgYmctcmV0cm8tcHJpbWFyeS8xMCB0ZXh0LXJldHJvLXByaW1hcnkgc2hhZG93LXNtJyA6ICdib3JkZXItcmV0cm8tdGV4dC8xMCBiZy13aGl0ZSB0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby10ZXh0IGhvdmVyOmJvcmRlci1yZXRyby10ZXh0LzIwJ31gfVxuICAgICAgICAgICAgICAgICAgICAgID7kuK08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlRm9udFNpemVDaGFuZ2UoJ2xhcmdlJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4LTEgcHktMi41IHRleHQtc20gZm9udC1ib2xkIHJvdW5kZWQteGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyICR7YXBwRm9udFNpemUgPT09ICdsYXJnZScgPyAnYm9yZGVyLXJldHJvLXByaW1hcnkgYmctcmV0cm8tcHJpbWFyeS8xMCB0ZXh0LXJldHJvLXByaW1hcnkgc2hhZG93LXNtJyA6ICdib3JkZXItcmV0cm8tdGV4dC8xMCBiZy13aGl0ZSB0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby10ZXh0IGhvdmVyOmJvcmRlci1yZXRyby10ZXh0LzIwJ31gfVxuICAgICAgICAgICAgICAgICAgICAgID7lpKc8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC02XCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17bG9nT3V0fSBjbGFzc05hbWU9XCJ3LWZ1bGwgcC00IGJnLXJlZC01MCBib3JkZXIgYm9yZGVyLXJlZC0xMDAgcm91bmRlZC0yeGwgc2hhZG93LXNtIGhvdmVyOmJvcmRlci1yZWQtMjAwIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdyb3VwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtcmVkLTYwMCB0ZXh0LXNtXCI+55m75Ye65biz6JmfPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHtzZXR0aW5nc1ZpZXcgPT09ICdhcGlrZXknICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTQgYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRTZXR0aW5nc1ZpZXcoJ21lbnUnKX0gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0LzUwIGhvdmVyOnRleHQtcmV0cm8tcHJpbWFyeSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSB0cmFuc2l0aW9uLWNvbG9ycyBjdXJzb3ItcG9pbnRlciBtYi0yXCI+XG4gICAgICAgICAgICAgICAgICA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPVwidy00IGgtNCByb3RhdGUtOTBcIiAvPiDov5Tlm57oqK3lrprpgbjllq5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICB7LyogUmVxdWlyZW1lbnQgMjogQVBJIEtFWSBJTlBVVCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNSBiZy1yZXRyby1jYXJkIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCBzaGFkb3ctc20gc3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXNlY29uZGFyeSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPFNwYXJrbGVzIGNsYXNzTmFtZT1cInctNC41IGgtNC41XCIgLz5cbiAgICAgICAgICAgICAgICBHZW1pbmkgQUkg6YeR6ZGw6Kit5a6aXG4gICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yZXRyby10ZXh0LzYwIGxlYWRpbmctcmVsYXhlZCBmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgIOiLpeimgeS9v+eUqOOAjOiHquWLlee2suaQnOijnOWFqOeUouWTgeOAjeaIluOAjOebuOapn+aLjeeFp+W9seWDj+i+qOitmOOAjeWKn+iDve+8jOiri+WcqOatpOiZleioreWumuaCqOeahCBHZW1pbmkgQVBJIEtleeOAgumHkemRsOacg+WuieWFqOS/neWtmOWcqOaCqOeahOWAi+S6uueAj+imveWZqOS4reOAglxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgICAge1swLCAxLCAyXS5tYXAoaWR4ID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpZHh9IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT17c2hvd0FwaUtleSA/IFwidGV4dFwiIDogXCJwYXNzd29yZFwifVxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtg6KuL6Ly45YWlIEdFTUlOSV9BUElfS0VZICR7aWR4ICsgMX1gfVxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXthcGlLZXlJbnB1dHNbaWR4XX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0lucHV0cyA9IFsuLi5hcGlLZXlJbnB1dHNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5wdXRzW2lkeF0gPSBlLnRhcmdldC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEFwaUtleUlucHV0cyhuZXdJbnB1dHMpO1xuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIgcGwtMyBwci0xMCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvMTAgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0FwaUtleSghc2hvd0FwaUtleSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgcmlnaHQtMi41IHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby10ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIHtzaG93QXBpS2V5ID8gPEV5ZU9mZiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz4gOiA8RXllIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPn1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgcHQtMVwiPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU2F2ZUFwaUtleX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLXJldHJvLXByaW1hcnkgdGV4dC1yZXRyby1jYXJkIHRleHQteHMgZm9udC1ib2xkIHJvdW5kZWQteGwgaG92ZXI6YnJpZ2h0bmVzcy0xMDUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPENoZWNrIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgICAg5YSy5a2Y6YeR6ZGwXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7c2V0dGluZ3NWaWV3ID09PSAnY2F0ZWdvcnknICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTQgYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRTZXR0aW5nc1ZpZXcoJ21lbnUnKX0gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0LzUwIGhvdmVyOnRleHQtcmV0cm8tcHJpbWFyeSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSB0cmFuc2l0aW9uLWNvbG9ycyBjdXJzb3ItcG9pbnRlciBtYi0yXCI+XG4gICAgICAgICAgICAgICAgICA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPVwidy00IGgtNCByb3RhdGUtOTBcIiAvPiDov5Tlm57oqK3lrprpgbjllq5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICB7LyogUmVxdWlyZW1lbnQgMTogRURJVCBDQVRFR09SWSAmIFNVQkNBVEVHT1JZIE5FU1RFRCBMSVNUICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC01IGJnLXJldHJvLWNhcmQgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIHRleHQtcmV0cm8tc2Vjb25kYXJ5IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxMaXN0VHJlZSBjbGFzc05hbWU9XCJ3LTQuNSBoLTQuNVwiIC8+XG4gICAgICAgICAgICAgICAgICDlpKfliIbpoZ7oiIflsI/liIbpoZ7nrqHnkIZcbiAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJldHJvLXRleHQvNjAgbGVhZGluZy1yZWxheGVkIGZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAg5Y+v5Lu75oSP5paw5aKe44CB57eo6Lyv44CB5Yiq5rib6IiHPGI+5ouW5puz5o6S5bqPPC9iPuWkp+WIhumhnuiIh+Wwj+WIhumhnuOAgum7nuaTiuWIhumhnuWNoeeJh+aXgeeahDxiPuOAjOeuoeeQhuWwj+WIhumhnuOAjTwvYj7ljbPlj6/nt6jovK/jgIHmlrDlop7jgIHliKrpmaTlj4rmi5bmm7PoqbLlsI/liIbpoZ7nmoTntLDpoIXvvIFcbiAgICAgICAgICAgICAgPC9wPlxuXG4gICAgICAgICAgICAgIHsvKiBBZGQgTmV3IENhdGVnb3J5ICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMy41IGJnLXJldHJvLWJnLzQwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzUgc3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC14cyB0ZXh0LXJldHJvLXRleHQvNzBcIj7mlrDlop7lpKfliIbpoZ48L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi5paw5YiG6aGe5ZCN56ixICjkvos6IOmaseW9ouecvOmPoSlcIlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17bmV3Q2F0TmFtZX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdDYXROYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LVsxNDBweF0gcC0yIGJnLXdoaXRlIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIHRleHQteHMgdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPHNlbGVjdCBcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld0NhdEljb259XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0TmV3Q2F0SWNvbihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvMTAgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZVwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzcGFya2xlc1wiPuKcqCDploPkuq48L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImRyb3BsZXRzXCI+8J+SpyDmsLTmu7Q8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBpbGxcIj7wn5KKIOiGoOWbijwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGFja2FnZVwiPvCfk6Yg55uS5a2QPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzaG9wcGluZy1iYWdcIj7wn5uN77iPIOizvOeJqeiiizwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiaGVhcnRcIj7inaTvuI8g5oSb5b+DPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzdGFyXCI+4q2QIOaYn+aYnzwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVBZGRDYXRlZ29yeX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0yIGJnLXJldHJvLXNlY29uZGFyeSB0ZXh0LXJldHJvLWNhcmQgdGV4dC14cyBmb250LWJvbGQgcm91bmRlZC14bCBob3ZlcjpvcGFjaXR5LTkwIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICDmlrDlop7lpKfliIbpoZ5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogTWFpbiBDYXRlZ29yaWVzIE5lc3RlZCBSZW9yZGVyaW5nIExpc3QgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNjBcIj7lpKfliIbpoZ7muIXllq4gKOaLluabs+aJi+aKiuaOkuW6jyk8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMi41XCI+XG4gICAgICAgICAgICAgICAgICB7Y2F0ZWdvcmllcy5tYXAoKGNhdCwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICAgICAga2V5PXtjYXQuaWR9IFxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCByb3VuZGVkLXhsIGJnLXdoaXRlIG92ZXJmbG93LWhpZGRlbiBzaGFkb3ctc20gdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIEJpZyBDYXRlZ29yeSBCYXIgKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnU3RhcnQ9eyhlKSA9PiBoYW5kbGVDYXREcmFnU3RhcnQoZSwgaWR4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ092ZXI9e2hhbmRsZUNhdERyYWdPdmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Ecm9wPXsoZSkgPT4gaGFuZGxlQ2F0RHJvcChlLCBpZHgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMyBiZy1zdG9uZS01MCBib3JkZXItYiBib3JkZXItc3RvbmUtMTAwIGhvdmVyOmJnLXN0b25lLTEwMC81MCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1cnNvci1ncmFiIHAtMSBob3ZlcjpiZy1zdG9uZS0yMDAgcm91bmRlZCB0ZXh0LXN0b25lLTQwMCBhY3RpdmU6dGV4dC1zdG9uZS03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R3JpcFZlcnRpY2FsIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDYXRlZ29yeUljb24gbmFtZT17Y2F0Lmljb259IGNsYXNzTmFtZT1cInctNC41IGgtNC41IHRleHQtcmV0cm8tcHJpbWFyeVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc20gdGV4dC1yZXRyby10ZXh0XCI+e2NhdC5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVDYXRlZ29yeUZvclN1YihhY3RpdmVDYXRlZ29yeUZvclN1YiA9PT0gY2F0LmlkID8gbnVsbCA6IGNhdC5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHB4LTIuNSBweS0xLjUgYmctcmV0cm8tcHJpbWFyeS8xMCB0ZXh0LXJldHJvLXByaW1hcnkgcm91bmRlZC1sZyBob3ZlcjpiZy1yZXRyby1wcmltYXJ5LzIwIHRyYW5zaXRpb24tY29sb3JzIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxMaXN0VHJlZSBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAg566h55CG5bCP5YiG6aGeICh7Y2F0LnN1YmNhdGVnb3JpZXMubGVuZ3RofSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtjYXRlZ29yaWVzLmxlbmd0aCA+IDEgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVEZWxldGVDYXRlZ29yeShjYXQuaWQpfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtcmVkLTQwMCBob3Zlcjp0ZXh0LXJlZC02MDAgcC0xLjUgcm91bmRlZC1sZyBob3ZlcjpiZy1yZWQtNTAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLliKrpmaTmraTlpKfliIbpoZ5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBTbWFsbCBDYXRlZ29yaWVzIFN1Yi1saXN0IChSZXF1aXJlbWVudCAxKSAqL31cbiAgICAgICAgICAgICAgICAgICAgICB7YWN0aXZlQ2F0ZWdvcnlGb3JTdWIgPT09IGNhdC5pZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMyBiZy1zdG9uZS01MC81MCBib3JkZXItdCBib3JkZXItc3RvbmUtMTAwLzYwIHNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtcmV0cm8tc2Vjb25kYXJ5IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7jgJB7Y2F0Lm5hbWV944CR55qE5bCP5YiG6aGe566h55CGPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQWRkIFN1YmNhdGVnb3J5IElubGluZSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi5paw5bCP5YiG6aGe5ZCN56ixICjlpoI6IOitt+W6lemcnClcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld1N1Yk5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE5ld1N1Yk5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIGhhbmRsZUFkZFN1YmNhdGVnb3J5KGNhdC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIHAtMiBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCByb3VuZGVkLWxnIHRleHQteHMgdGV4dC1yZXRyby10ZXh0IGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcmV0cm8tcHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlQWRkU3ViY2F0ZWdvcnkoY2F0LmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgYmctc3RvbmUtNzAwIGhvdmVyOmJnLXN0b25lLTgwMCB0ZXh0LXdoaXRlIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFN1YmNhdGVnb3J5IGRyYWdnYWJsZSBsaXN0ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwic3BhY2UteS0xLjUgbWF4LWgtNTYgb3ZlcmZsb3cteS1hdXRvIHByLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2F0LnN1YmNhdGVnb3JpZXMubWFwKChzdWIsIHNJZHgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzSWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnU3RhcnQ9eyhlKSA9PiBoYW5kbGVTdWJEcmFnU3RhcnQoZSwgY2F0LmlkLCBzSWR4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnT3Zlcj17aGFuZGxlU3ViRHJhZ092ZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJvcD17KGUpID0+IGhhbmRsZVN1YkRyb3AoZSwgY2F0LmlkLCBzSWR4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMiBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCByb3VuZGVkLWxnIHRleHQteHMgaG92ZXI6Ymctc3RvbmUtNTAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtMSBtaW4tdy0wIG1yLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1cnNvci1ncmFiIHAtMC41IHRleHQtc3RvbmUtNDAwIGhvdmVyOnRleHQtc3RvbmUtNjAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R3JpcFZlcnRpY2FsIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1N1YklkeCA9PT0gc0lkeCAmJiBlZGl0aW5nU3ViQ2F0SWQgPT09IGNhdC5pZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRpbmdTdWJOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRpbmdTdWJOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlU3ViY2F0ZWdvcnkoY2F0LmlkLCBzSWR4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVN1YmNhdGVnb3J5KGNhdC5pZCwgc0lkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcC0xIHB5LTAuNSBib3JkZXIgYm9yZGVyLXN0b25lLTQwMCByb3VuZGVkIGJnLXdoaXRlIHRleHQteHMgdGV4dC1zdG9uZS04MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRydW5jYXRlIGZvbnQtc2VtaWJvbGQgdGV4dC1zdG9uZS03MDBcIj57c3VifTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1N1YklkeCA9PT0gc0lkeCAmJiBlZGl0aW5nU3ViQ2F0SWQgPT09IGNhdC5pZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVNhdmVTdWJjYXRlZ29yeShjYXQuaWQsIHNJZHgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXN0b25lLTcwMCBob3Zlcjp0ZXh0LXN0b25lLTkwMCBwLTAuNVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDaGVjayBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTdWJDYXRJZChjYXQuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTdWJJZHgoc0lkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1N1Yk5hbWUoc3ViKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zdG9uZS00MDAgaG92ZXI6dGV4dC1zdG9uZS03MDAgcC0wLjVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIue3qOi8r+Wwj+WIhumhnuWQjeeosVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0MyBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVEZWxldGVTdWJjYXRlZ29yeShjYXQuaWQsIHNJZHgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1yZWQtNDAwIGhvdmVyOnRleHQtcmVkLTYwMCBwLTAuNVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIuWIqumZpOWwj+WIhumhnlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2F0LnN1YmNhdGVnb3JpZXMubGVuZ3RoID09PSAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciB0ZXh0LXN0b25lLTQwMCB0ZXh0LVsxMHB4XSBweS00IGJnLXdoaXRlIGJvcmRlciBib3JkZXItc3RvbmUtMTAwIHJvdW5kZWQtbGdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5bCa54Sh5bCP5YiG6aGe77yM6KuL5Zyo5LiK5pa55paw5aKeXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7c2V0dGluZ3NWaWV3ID09PSAnaGlzdG9yeScgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNCBhbmltYXRlLWZhZGUtaW5cIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNldHRpbmdzVmlldygnbWVudScpfSBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNTAgaG92ZXI6dGV4dC1yZXRyby1wcmltYXJ5IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyIG1iLTJcIj5cbiAgICAgICAgICAgICAgICAgIDxDaGV2cm9uRG93biBjbGFzc05hbWU9XCJ3LTQgaC00IHJvdGF0ZS05MFwiIC8+IOi/lOWbnuioreWumumBuOWWrlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWItMSBiZy1yZXRyby1jYXJkLzQwIHB4LTMuNSBweS0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvNSB0ZXh0LXhzIHRleHQtcmV0cm8tdGV4dCBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj7mrbflj7LlsIHlrZjntIDpjIQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXJldHJvLXNlY29uZGFyeSBiZy1yZXRyby1zZWNvbmRhcnkvMTAgcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIHtwcm9kdWN0cy5maWx0ZXIocCA9PiBwLnN0YXR1cyA9PT0gJ2FyY2hpdmVkJykubGVuZ3RofSDku7ZcbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFyY2hpdmVkUHJvZHVjdHMgPSBwcm9kdWN0cy5maWx0ZXIocCA9PiBwLnN0YXR1cyA9PT0gJ2FyY2hpdmVkJyAmJiAoc2VhcmNoS2V5d29yZCA/IHAubmFtZS5pbmNsdWRlcyhzZWFyY2hLZXl3b3JkKSB8fCBwLmJyYW5kLmluY2x1ZGVzKHNlYXJjaEtleXdvcmQpIDogdHJ1ZSkpO1xuICAgICAgICAgICAgICAgICAgaWYgKGFyY2hpdmVkUHJvZHVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS0xMiBiZy1yZXRyby1jYXJkIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXJldHJvLXRleHQvNTAgZm9udC1tZWRpdW1cIj7lsJrnhKHnrKblkIjnmoTlsIHlrZjllYblk4E8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgICAgICAgIHthcmNoaXZlZFByb2R1Y3RzLm1hcChwcm9kID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtwcm9kLmlkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFByb2R1Y3RDYXJkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdD17cHJvZH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblZpZXdEZXRhaWw9e3NldFNlbGVjdGVkRGV0YWlsUHJvZHVjdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRWRpdD17aGFuZGxlRWRpdEluc3RhbmNlVHJpZ2dlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQXJjaGl2ZT17aGFuZGxlQXJjaGl2ZUluc3RhbmNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25BZGRBbm90aGVyPXtoYW5kbGVBZGRBbm90aGVySW5zdGFuY2VUcmlnZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25JbWFnZUNsaWNrPXtzZXRGdWxsc2NyZWVuSW1hZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUljb249e2NhdGVnb3JpZXMuZmluZChjID0+IGMuaWQgPT09IHByb2QuY2F0ZWdvcnkpPy5pY29uIHx8ICdzcGFya2xlcyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIC8qID09PT09PT09PT09PT09PT09PT0gTUFJTiBMSVNUIFZJRVcgPT09PT09PT09PT09PT09PT09PSAqL1xuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICB7LyogQ2F0ZWdvcnkgU3RhdHMgSW5kaWNhdG9yICovfVxuICAgICAgICAgICAgeyFzZWFyY2hLZXl3b3JkLnRyaW0oKSA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgbWItMSBiZy1yZXRyby1jYXJkLzQwIHB4LTMuNSBweS0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvNSB0ZXh0LXhzIHRleHQtcmV0cm8tdGV4dFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvODBcIj5cbiAgICAgICAgICAgICAgICAgIOWIhumhnu+8mntjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBjdXJyZW50VGFiKT8ubmFtZSB8fCAnJ31cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LXJldHJvLXRleHQvNzAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPuWFsSB7Z2V0Q2F0ZWdvcnlTdGF0cyhjdXJyZW50VGFiKS5jb3VudH0g5ZOB6aCFPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yZXRyby10ZXh0LzMwXCI+fDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxQYWNrYWdlIGNsYXNzTmFtZT1cInctMy41IGgtMy41IHRleHQtcmV0cm8tcHJpbWFyeVwiIC8+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj7nuL3luqvlrZgge2dldENhdGVnb3J5U3RhdHMoY3VycmVudFRhYikucXR5fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgbWItMSBiZy1yZXRyby1jYXJkLzQwIHB4LTMuNSBweS0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvNSB0ZXh0LXhzIHRleHQtcmV0cm8tdGV4dFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvODBcIj5cbiAgICAgICAgICAgICAgICAgIOaQnOWwi+e1kOaenFxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIHRleHQtcmV0cm8tdGV4dC83MCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+5YWxIHthY3RpdmVQcm9kdWN0cy5sZW5ndGh9IOWTgemghTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcmV0cm8tdGV4dC8zMFwiPnw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8UGFja2FnZSBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNSB0ZXh0LXJldHJvLXByaW1hcnlcIiAvPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+57i95bqr5a2YIHthY3RpdmVQcm9kdWN0cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5pbnN0YW5jZXMucmVkdWNlKChzLCBpKSA9PiBzICsgaS5xdHksIDApLCAwKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHsvKiBTdWJjYXRlZ29yeSBOZXN0ZWQgUHJvZHVjdCBMaXN0ICovfVxuICAgICAgICAgICAgeygoKSA9PiB7XG4gICAgICAgICAgICAgIC8vIElmIHNlYXJjaGluZywgcmVuZGVyIGZsYXQgbGlzdFxuICAgICAgICAgICAgICBpZiAoc2VhcmNoS2V5d29yZC50cmltKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aXZlUHJvZHVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTEyIGJnLXJldHJvLWNhcmQgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXJldHJvLXRleHQvNTAgZm9udC1zZW1pYm9sZFwiPuWwmueEoeespuWQiOeahOWVhuWTgTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICAgICAge2FjdGl2ZVByb2R1Y3RzLm1hcChwcm9kID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cHJvZC5pZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8UHJvZHVjdENhcmQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3Q9e3Byb2R9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvblZpZXdEZXRhaWw9e3NldFNlbGVjdGVkRGV0YWlsUHJvZHVjdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25FZGl0PXtoYW5kbGVFZGl0SW5zdGFuY2VUcmlnZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkFyY2hpdmU9e2hhbmRsZUFyY2hpdmVJbnN0YW5jZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25BZGRBbm90aGVyPXtoYW5kbGVBZGRBbm90aGVySW5zdGFuY2VUcmlnZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkltYWdlQ2xpY2s9e3NldEZ1bGxzY3JlZW5JbWFnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlJY29uPXtjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBwcm9kLmNhdGVnb3J5KT8uaWNvbiB8fCAnc3BhcmtsZXMnfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gR2V0IHN1YmNhdGVnb3JpZXMgb2YgY3VycmVudCBjYXRlZ29yeVxuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Q2F0T2JqID0gY2F0ZWdvcmllcy5maW5kKGMgPT4gYy5pZCA9PT0gY3VycmVudFRhYik7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBOb3JtYWwgQ2F0ZWdvcnkgVGFiIHdpdGggbmVzdGVkIHN1YmNhdGVnb3J5IHZpZXdzXG4gICAgICAgICAgICAgIGlmICghY3VycmVudENhdE9iaikgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBXZSdsbCBncm91cCBhY3RpdmUgcHJvZHVjdHMgYnkgc3ViY2F0ZWdvcnlcbiAgICAgICAgICAgICAgY29uc3QgcHJlZGVmaW5lZFN1YmNhdHMgPSBjdXJyZW50Q2F0T2JqLnN1YmNhdGVnb3JpZXM7XG4gICAgICAgICAgICAgIGNvbnN0IHVzZWRTdWJjYXRzID0gQXJyYXkuZnJvbShuZXcgU2V0KGFjdGl2ZVByb2R1Y3RzLm1hcChwID0+IHAuc3ViY2F0ZWdvcnkpKSk7XG4gICAgICAgICAgICAgIGNvbnN0IGN1c3RvbVN1YmNhdHMgPSB1c2VkU3ViY2F0cy5maWx0ZXIoc3ViID0+ICFwcmVkZWZpbmVkU3ViY2F0cy5pbmNsdWRlcyhzdWIpKTtcbiAgICAgICAgICAgICAgY29uc3QgYWxsU3ViY2F0R3JvdXBzID0gWy4uLnByZWRlZmluZWRTdWJjYXRzLCAuLi5jdXN0b21TdWJjYXRzXTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIEZpbHRlciB0byBmaW5kIHN1YmNhdCBncm91cHMgdGhhdCBoYXZlIG1hdGNoaW5nIGFjdGl2ZSBmaWx0ZXJlZCBwcm9kdWN0c1xuICAgICAgICAgICAgICBjb25zdCBub25BbmRFbXB0eUdyb3VwcyA9IGFsbFN1YmNhdEdyb3Vwcy5maWx0ZXIoc3ViTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBQcm9kcyA9IGFjdGl2ZVByb2R1Y3RzLmZpbHRlcihwID0+IHAuc3ViY2F0ZWdvcnkgPT09IHN1Yk5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cFByb2RzLmxlbmd0aCA+IDA7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGlmIChub25BbmRFbXB0eUdyb3Vwcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS0xMiBiZy1yZXRyby1jYXJkIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMFwiPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtcmV0cm8tdGV4dC81MCBmb250LXNlbWlib2xkXCI+5q2k5YiG6aGe5LiL5bCa54Sh56ym5ZCI5ZWG5ZOBPC9wPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyRm9ybSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybUNhdGVnb3J5KGN1cnJlbnRUYWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2hvd0FkZEZvcm0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtdC0zIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHB4LTQgcHktMiBiZy1yZXRyby1wcmltYXJ5IHRleHQtcmV0cm8tY2FyZCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdyBob3ZlcjpicmlnaHRuZXNzLTEwNSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIOaWsOWinuWVhuWTgVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS02XCI+XG4gICAgICAgICAgICAgICAgICB7bm9uQW5kRW1wdHlHcm91cHMubWFwKHN1Yk5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cFByb2RzID0gYWN0aXZlUHJvZHVjdHMuZmlsdGVyKHAgPT4gcC5zdWJjYXRlZ29yeSA9PT0gc3ViTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gZ2V0U3ViY2F0ZWdvcnlTdGF0cyhzdWJOYW1lLCBjdXJyZW50VGFiKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtzdWJOYW1lfSBjbGFzc05hbWU9XCJzcGFjZS15LTIuNSBhbmltYXRlLWZhZGUtaW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgdGV4dC14cyB0ZXh0LXJldHJvLXRleHQvNzAgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHB4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yZXRyby10ZXh0LzMwIG1yLTEuNSBmb250LW5vcm1hbFwiPuKUlDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e3N1Yk5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIHRleHQtWzEwcHhdIGJnLXJldHJvLXByaW1hcnkvMTAgdGV4dC1yZXRyby1wcmltYXJ5IHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57c3RhdHMuY291bnR95Lu2PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wYWNpdHktNDBcIj58PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQYWNrYWdlIGNsYXNzTmFtZT1cInctMyBoLTNcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntzdGF0cy5xdHl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2dyb3VwUHJvZHMubWFwKHByb2QgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtwcm9kLmlkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQcm9kdWN0Q2FyZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3Q9e3Byb2R9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25WaWV3RGV0YWlsPXtzZXRTZWxlY3RlZERldGFpbFByb2R1Y3R9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkVkaXQ9e2hhbmRsZUVkaXRJbnN0YW5jZVRyaWdnZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkFyY2hpdmU9e2hhbmRsZUFyY2hpdmVJbnN0YW5jZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQWRkQW5vdGhlcj17aGFuZGxlQWRkQW5vdGhlckluc3RhbmNlVHJpZ2dlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uSW1hZ2VDbGljaz17c2V0RnVsbHNjcmVlbkltYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlJY29uPXtjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBwcm9kLmNhdGVnb3J5KT8uaWNvbiB8fCAnc3BhcmtsZXMnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pKCl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIDcuIEJvdHRvbSBOYXZpZ2F0aW9uIEJhciAqL31cbiAgICAgIDxuYXYgY2xhc3NOYW1lPVwiZml4ZWQgYm90dG9tLTAgbGVmdC0wIHJpZ2h0LTAgYmctcmV0cm8tY2FyZCBib3JkZXItdCBib3JkZXItcmV0cm8tdGV4dC8xMCBmbGV4IGp1c3RpZnktYXJvdW5kIGl0ZW1zLWNlbnRlciBwdC0yLjUgcGItW21heCgwLjYyNXJlbSxlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSkpXSBweC0yIHNoYWRvdy1bMF8tNHB4XzIwcHhfcmdiYSgwLDAsMCwwLjA1KV0gei00MCBtYXgtdy0yeGwgbXgtYXV0byBvdmVyZmxvdy14LWF1dG9cIj5cbiAgICAgICAge2NhdGVnb3JpZXMubWFwKGNhdCA9PiAoXG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIGtleT17Y2F0LmlkfVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlVGFiQ2hhbmdlKGNhdC5pZCl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgbWluLXctWzU2cHhdIHRyYW5zaXRpb24tY29sb3JzIHB5LTEgcHgtMS41IHJvdW5kZWQtbGcgYWN0aXZlOmJnLXJldHJvLWJnLzQwICR7Y3VycmVudFRhYiA9PT0gY2F0LmlkID8gJ3RleHQtcmV0cm8tcHJpbWFyeSBiZy1yZXRyby1wcmltYXJ5LzUnIDogJ3RleHQtcmV0cm8tdGV4dC81MCd9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Q2F0ZWdvcnlJY29uIG5hbWU9e2NhdC5pY29ufSBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRydW5jYXRlIG1heC13LVs1NnB4XVwiPntjYXQubmFtZX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICkpfVxuICAgICAgICB7LyogRml4ZWQgU2V0dGluZ3MgVGFiICovfVxuICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVRhYkNoYW5nZSgnc2V0dGluZ3MnKX1cbiAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgbWluLXctWzU2cHhdIHRyYW5zaXRpb24tY29sb3JzIHB5LTEgcHgtMS41IHJvdW5kZWQtbGcgYWN0aXZlOmJnLXJldHJvLWJnLzQwICR7Y3VycmVudFRhYiA9PT0gJ3NldHRpbmdzJyA/ICd0ZXh0LXJldHJvLXByaW1hcnkgYmctcmV0cm8tcHJpbWFyeS81JyA6ICd0ZXh0LXJldHJvLXRleHQvNTAnfWB9XG4gICAgICAgID5cbiAgICAgICAgICA8U2V0dGluZ3MgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgPHNwYW4+6Kit5a6aPC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvbmF2PlxuXG4gICAgICB7LyogVG9hc3QgQWxlcnQgb3ZlcmxheSAqL31cbiAgICAgIHt0b2FzdE1lc3NhZ2UgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGJvdHRvbS0yMCBsZWZ0LTEvMiAtdHJhbnNsYXRlLXgtMS8yIHB4LTUgcHktMyBiZy1zdG9uZS05MDAvOTAgdGV4dC13aGl0ZSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LWxnIHotNTAgcG9pbnRlci1ldmVudHMtbm9uZSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgdHJhbnNmb3JtIHNjYWxlLTEwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxJbmZvIGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1yZXRyby1wcmltYXJ5IGFuaW1hdGUtcHVsc2VcIiAvPlxuICAgICAgICAgIHt0b2FzdE1lc3NhZ2V9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qID09PT09PT09PT09PT09PT09PT09IDguIERldGFpbGVkIFByb2R1Y3QgVmlldyBNb2RhbCAoUmVxdWlyZW1lbnQgMTog5a6M5pW055Wr6Z2iKSA9PT09PT09PT09PT09PT09PT09PSAqL31cbiAgICAgIHtzZWxlY3RlZERldGFpbFByb2R1Y3QgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc3RvbmUtOTAwLzQwIGJhY2tkcm9wLWJsdXIteHMgei01MCBmbGV4IGl0ZW1zLWVuZCBzbTppdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC0wIHNtOnAtNCBhbmltYXRlLWZhZGUtaW5cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBoLVsxMDBkdmhdIHNtOmgtYXV0byBzbTptYXgtdy1tZCBiZy13aGl0ZSBzbTpib3JkZXItMiBib3JkZXItcmV0cm8tdGV4dCBzbTpyb3VuZGVkLTN4bCBvdmVyZmxvdy1oaWRkZW4gc2hhZG93LTJ4bCBmbGV4IGZsZXgtY29sIG1heC1oLVsxMDBkdmhdIHNtOm1heC1oLVs4NWR2aF0gYW5pbWF0ZS1zbGlkZS11cCBwYi1zYWZlXCI+XG4gICAgICAgICAgICB7LyogVG9wIEJhciB3aXRoIERyYWcgSGFuZGxlIGZvciBNb2JpbGUgLyBIZWFkZXIgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHB0LVttYXgoMS41cmVtLGVudihzYWZlLWFyZWEtaW5zZXQtdG9wKSldIHBiLTQgcHgtNSBib3JkZXItYiBib3JkZXItcmV0cm8tdGV4dC81IGZsZXggaXRlbXMtc3RhcnQgZ2FwLTQgYmctc3RvbmUtNTAvNTBcIj5cbiAgICAgICAgICAgICAge3NlbGVjdGVkRGV0YWlsUHJvZHVjdC5waG90byA/IChcbiAgICAgICAgICAgICAgICA8aW1nIFxuICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k9XCJuby1yZWZlcnJlclwiXG4gICAgICAgICAgICAgICAgICBzcmM9e3NlbGVjdGVkRGV0YWlsUHJvZHVjdC5waG90b30gXG4gICAgICAgICAgICAgICAgICBhbHQ9e3NlbGVjdGVkRGV0YWlsUHJvZHVjdC5uYW1lfVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RnVsbHNjcmVlbkltYWdlKHNlbGVjdGVkRGV0YWlsUHJvZHVjdC5waG90byEpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0xNCBoLTE4IHJvdW5kZWQteGwgb2JqZWN0LWNvdmVyIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCBzaGFkb3ctc20gY3Vyc29yLXBvaW50ZXIgaG92ZXI6c2NhbGUtMTA1IHRyYW5zaXRpb24tdHJhbnNmb3JtXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNCBoLTE4IHJvdW5kZWQteGwgYmctcmV0cm8tcHJpbWFyeS8xMCBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItcmV0cm8tcHJpbWFyeS8zMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXJldHJvLXByaW1hcnkgZmxleC1zaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgPENhdGVnb3J5SWNvbiBuYW1lPXtjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBzZWxlY3RlZERldGFpbFByb2R1Y3QuY2F0ZWdvcnkpPy5pY29uIHx8ICdzcGFya2xlcyd9IGNsYXNzTmFtZT1cInctNiBoLTYgb3BhY2l0eS00MFwiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wIHByLTZcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWV4dHJhYm9sZCB0ZXh0LXJldHJvLXNlY29uZGFyeSB0cmFja2luZy13aWRlc3QgdXBwZXJjYXNlIGJsb2NrXCI+XG4gICAgICAgICAgICAgICAgICB7c2VsZWN0ZWREZXRhaWxQcm9kdWN0LmJyYW5kfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQgbGVhZGluZy1zbnVnIG10LTAuNSBsaW5lLWNsYW1wLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZERldGFpbFByb2R1Y3QubmFtZX1cbiAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtdC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIGJnLXJldHJvLXByaW1hcnkvMTAgdGV4dC1yZXRyby1wcmltYXJ5IHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIHtjYXRlZ29yaWVzLmZpbmQoYyA9PiBjLmlkID09PSBzZWxlY3RlZERldGFpbFByb2R1Y3QuY2F0ZWdvcnkpPy5uYW1lIHx8IHNlbGVjdGVkRGV0YWlsUHJvZHVjdC5jYXRlZ29yeX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZERldGFpbFByb2R1Y3Quc3ViY2F0ZWdvcnkgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgYmctcmV0cm8tc2Vjb25kYXJ5LzUgdGV4dC1yZXRyby1zZWNvbmRhcnkgYm9yZGVyIGJvcmRlci1yZXRyby1zZWNvbmRhcnkvMTAgcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7c2VsZWN0ZWREZXRhaWxQcm9kdWN0LnN1YmNhdGVnb3J5fVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogQ2xvc2UgQnV0dG9uICovfVxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNlbGVjdGVkRGV0YWlsUHJvZHVjdChudWxsKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00IHctOCBoLTggcm91bmRlZC1mdWxsIGJnLXN0b25lLTEwMCBob3ZlcjpiZy1zdG9uZS0yMDAgdGV4dC1zdG9uZS01MDAgaG92ZXI6dGV4dC1zdG9uZS04MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdHJhbnNpdGlvbi1jb2xvcnMgY3Vyc29yLXBvaW50ZXIgYW5pbWF0ZS1mYWRlLWluXCJcbiAgICAgICAgICAgICAgICB0aXRsZT1cIumXnOmWiVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIE1pZGRsZSBOYXYgQnV0dG9ucyAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0zIGJnLXN0b25lLTEwMC81MCBib3JkZXItYiBib3JkZXItcmV0cm8tdGV4dC81IGdyaWQgZ3JpZC1jb2xzLTQgZ2FwLTIgZmxleC1zaHJpbmstMFwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RGV0YWlsQWN0aXZlVGFiKCdzdGF0dXMnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweS0yIHB4LTEgdGV4dC1bMTFweF0gZm9udC1ib2xkIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgYm9yZGVyIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGdhcC0wLjUgY3Vyc29yLXBvaW50ZXIgJHtcbiAgICAgICAgICAgICAgICAgIGRldGFpbEFjdGl2ZVRhYiA9PT0gJ3N0YXR1cydcbiAgICAgICAgICAgICAgICAgICAgPyAnYmctcmV0cm8tcHJpbWFyeSB0ZXh0LXJldHJvLWNhcmQgYm9yZGVyLXJldHJvLXByaW1hcnkgc2hhZG93LXNtIHNjYWxlLVsxLjAyXSdcbiAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUgdGV4dC1yZXRyby10ZXh0LzYwIGJvcmRlci1yZXRyby10ZXh0LzUgaG92ZXI6dGV4dC1yZXRyby10ZXh0IGhvdmVyOmJnLXN0b25lLTUwJ1xuICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPFBhY2thZ2UgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPuaVuOmHj+eLgOazgTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERldGFpbEFjdGl2ZVRhYigncHVyY2hhc2UnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweS0yIHB4LTEgdGV4dC1bMTFweF0gZm9udC1ib2xkIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgYm9yZGVyIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGdhcC0wLjUgY3Vyc29yLXBvaW50ZXIgJHtcbiAgICAgICAgICAgICAgICAgIGRldGFpbEFjdGl2ZVRhYiA9PT0gJ3B1cmNoYXNlJ1xuICAgICAgICAgICAgICAgICAgICA/ICdiZy1yZXRyby1zZWNvbmRhcnkgdGV4dC1yZXRyby1jYXJkIGJvcmRlci1yZXRyby1zZWNvbmRhcnkgc2hhZG93LXNtIHNjYWxlLVsxLjAyXSdcbiAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUgdGV4dC1yZXRyby10ZXh0LzYwIGJvcmRlci1yZXRyby10ZXh0LzUgaG92ZXI6dGV4dC1yZXRyby10ZXh0IGhvdmVyOmJnLXN0b25lLTUwJ1xuICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPFNob3BwaW5nQ2FydCBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+6LO86LK357SA6YyEPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RGV0YWlsQWN0aXZlVGFiKCd1c2FnZScpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB5LTIgcHgtMSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBib3JkZXIgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTAuNSBjdXJzb3ItcG9pbnRlciAke1xuICAgICAgICAgICAgICAgICAgZGV0YWlsQWN0aXZlVGFiID09PSAndXNhZ2UnXG4gICAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTYwMCB0ZXh0LXJldHJvLWNhcmQgYm9yZGVyLWFtYmVyLTYwMCBzaGFkb3ctc20gc2NhbGUtWzEuMDJdJ1xuICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZSB0ZXh0LXJldHJvLXRleHQvNjAgYm9yZGVyLXJldHJvLXRleHQvNSBob3Zlcjp0ZXh0LXJldHJvLXRleHQgaG92ZXI6Ymctc3RvbmUtNTAnXG4gICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8SGlzdG9yeSBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+5L2/55So57SA6YyEPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlRWRpdFByb2R1Y3RNYXN0ZXJUcmlnZ2VyKHNlbGVjdGVkRGV0YWlsUHJvZHVjdCl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHktMiBweC0xIHRleHQtWzExcHhdIGZvbnQtYm9sZCBiZy13aGl0ZSB0ZXh0LXJldHJvLXRleHQvNjAgaG92ZXI6dGV4dC1yZXRyby1wcmltYXJ5IGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC81IGhvdmVyOmJvcmRlci1yZXRyby1wcmltYXJ5LzIwIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTAuNSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8RWRpdDMgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPue3qOi8r+Wkp+WTgemghTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFNjcm9sbGFibGUgQ29udGVudCBCb2R5ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtNCBzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAge2RldGFpbEFjdGl2ZVRhYiA9PT0gJ3N0YXR1cycgPyAoXG4gICAgICAgICAgICAgICAgLyogVGFiIDEgQ29udGVudDog5ZWG5ZOB5pW46YeP54uA5rOBICovXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTQgYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIHsvKiBPdmVyYWxsIFJlc3RvY2sgV2FybmluZyAqL31cbiAgICAgICAgICAgICAgICAgIHsoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFVub3BlbmVkID0gc2VsZWN0ZWREZXRhaWxQcm9kdWN0Lmluc3RhbmNlcy5maWx0ZXIoaW5zdCA9PiBpbnN0LnVzYWdlID09PSAn5pyq6ZaL5bCBJykucmVkdWNlKChzdW0sIGluc3QpID0+IHN1bSArIGluc3QucXR5LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRGV0YWlsUHJvZHVjdC50aHJlc2hvbGQgPiAwICYmIHRvdGFsVW5vcGVuZWQgPD0gc2VsZWN0ZWREZXRhaWxQcm9kdWN0LnRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtcmVkLTUwMCBiZy1yZWQtNTAgYm9yZGVyIGJvcmRlci1yZWQtMTAwIHAtMi41IHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxJbmZvIGNsYXNzTmFtZT1cInctNCBoLTQgZmxleC1zaHJpbmstMFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPuW6q+WtmOWBj+S9ju+8geebruWJjeacqumWi+Wwgee4veioiCB7dG90YWxVbm9wZW5lZH0g5Lu277yM5bey6YGU6KOc6LKo6ZaA5qq7ICh7c2VsZWN0ZWREZXRhaWxQcm9kdWN0LnRocmVzaG9sZH0g5Lu2KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICB9KSgpfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQmVudG8gU3RhdHMgQ291bnRlcnMgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTMgZ2FwLTIuNVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXN0b25lLTUwIHAtMi41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzUgdGV4dC1jZW50ZXIgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW4gbWluLWgtWzcwcHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC81MFwiPue4veaVuOmHjzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtZXh0cmFib2xkIHRleHQtcmV0cm8tcHJpbWFyeSBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZERldGFpbFByb2R1Y3QuaW5zdGFuY2VzLnJlZHVjZSgoc3VtLCBpbnN0KSA9PiBzdW0gKyBpbnN0LnF0eSwgMCl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zdG9uZS01MCBwLTIuNSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC81IHRleHQtY2VudGVyIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIG1pbi1oLVs3MHB4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNTBcIj7plovlsIHkuK3mlbjph488L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWV4dHJhYm9sZCB0ZXh0LWdyZWVuLTYwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZERldGFpbFByb2R1Y3QuaW5zdGFuY2VzLmZpbHRlcihpbnN0ID0+IGluc3QudXNhZ2UgPT09ICfkvb/nlKjkuK0nKS5yZWR1Y2UoKHN1bSwgaW5zdCkgPT4gc3VtICsgaW5zdC5xdHksIDApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc3RvbmUtNTAgcC0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvNSB0ZXh0LWNlbnRlciBmbGV4IGZsZXgtY29sIGp1c3RpZnktYmV0d2VlbiBtaW4taC1bNzBweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0LzUwXCI+5pyA6L+R5Yiw5pyf5aSp5pW4PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1leHRyYWJvbGQgdGV4dC1hbWJlci02MDAgZm9udC1tb25vIGxlYWRpbmctbm9uZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWluRGF5cyA9IDk5OTk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWREZXRhaWxQcm9kdWN0Lmluc3RhbmNlcy5mb3JFYWNoKGluc3QgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF5cyA9IGNhbGN1bGF0ZURheXNUb0V4cGlyeShpbnN0LmV4cGlyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF5cyA8IG1pbkRheXMpIG1pbkRheXMgPSBkYXlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtaW5EYXlzICE9PSA5OTk5ID8gbWluRGF5cyA6ICctJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2xvc2VzdERhdGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWluRGF5cyA9IDk5OTk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRGV0YWlsUHJvZHVjdC5pbnN0YW5jZXMuZm9yRWFjaChpbnN0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXlzID0gY2FsY3VsYXRlRGF5c1RvRXhwaXJ5KGluc3QuZXhwaXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF5cyA8IG1pbkRheXMgJiYgaW5zdC5leHBpcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkRheXMgPSBkYXlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERhdGUgPSBpbnN0LmV4cGlyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWluRGF5cyAhPT0gOTk5OSAmJiBjbG9zZXN0RGF0ZSA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNDAgbXQtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2Nsb3Nlc3REYXRlLnJlcGxhY2UoLy0vZywgJy8nKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIERldGFpbGVkIEluc3RhbmNlcyBMaXN0ICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1leHRyYWJvbGQgdGV4dC1yZXRyby10ZXh0LzUwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBibG9ja1wiPlxuICAgICAgICAgICAgICAgICAgICAgIPCfk4sg6KaP5qC85piO57Sw6IiH54uA5oWLXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkRGV0YWlsUHJvZHVjdC5pbnN0YW5jZXMubWFwKChpbnN0LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRheXNMZWZ0ID0gY2FsY3VsYXRlRGF5c1RvRXhwaXJ5KGluc3QuZXhwaXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VyZ2VudCA9IGRheXNMZWZ0IDw9IDYwO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhbyA9IGNhbGN1bGF0ZVBhb0V4cGlyeShpbnN0Lm9wZW5lZERhdGUsIGluc3QucGFvTW9udGhzKTtcblxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aW5zdC5pZH0gY2xhc3NOYW1lPVwicC0zIGJnLXdoaXRlIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHNwYWNlLXktMiBzaGFkb3cteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dCBiZy1yZXRyby1iZy80MCBweC0yIHB5LTAuNSByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQYWNrYWdlIGNsYXNzTmFtZT1cInctMyBoLTMgdGV4dC1yZXRyby1wcmltYXJ5XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2luc3QucXR5fSDku7ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpbnN0LmNhcGFjaXR5ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby1wcmltYXJ5IGJnLXJldHJvLXByaW1hcnkvMTAgcHgtMiBweS0wLjUgcm91bmRlZC1sZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpbnN0LmNhcGFjaXR5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogVGhlIG5ldyBVc2FnZSBzZWxlY3QgcmVwbGFjaW5nIHRoZSBiYWRnZSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXIgYmctc3RvbmUtMTAwIGhvdmVyOmJnLXN0b25lLTIwMCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIHRyYW5zaXRpb24tY29sb3JzIG1sLTEgcGl4ZWwtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7aW5zdC51c2FnZSA9PT0gJ+S9v+eUqOS4rScgPyAnYmctZ3JlZW4tNTAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXN0b25lLTMwMCd9YH0+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2luc3QudXNhZ2UgPT09ICfmnKrplovlsIEnID8gJ+acqumWi+WwgScgOiAn5L2/55So5LitJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gJ2FyY2hpdmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVBcmNoaXZlSW5zdGFuY2Uoc2VsZWN0ZWREZXRhaWxQcm9kdWN0LmlkLCBpbnN0LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRQcm9kdWN0cyA9IHByb2R1Y3RzLm1hcChwcm9kID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvZC5pZCA9PT0gc2VsZWN0ZWREZXRhaWxQcm9kdWN0LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5wcm9kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXM6IHByb2QuaW5zdGFuY2VzLm1hcChpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaS5pZCA9PT0gaW5zdC5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmksIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2FnZTogdmFsIGFzIGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbmVkRGF0ZTogdmFsID09PSAn5L2/55So5LitJyAmJiAhaS5vcGVuZWREYXRlID8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0gOiBpLm9wZW5lZERhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRQcm9kdWN0cyhuZXh0UHJvZHVjdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkID0gbmV4dFByb2R1Y3RzLmZpbmQocCA9PiBwLmlkID09PSBzZWxlY3RlZERldGFpbFByb2R1Y3QuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXBkYXRlZCkgc2V0U2VsZWN0ZWREZXRhaWxQcm9kdWN0KHVwZGF0ZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93VG9hc3QoYOeLgOaFi+W3suiuiuabtOeCuu+8miR7dmFsID09PSAn5pyq6ZaL5bCBJyA/ICfmnKrkvb/nlKgnIDogJ+W3sumWi+WwgSd9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvODAgYmctdHJhbnNwYXJlbnQgb3V0bGluZS1ub25lIGN1cnNvci1wb2ludGVyIGFwcGVhcmFuY2Utbm9uZSBwci0zIHJlbGF0aXZlIHotMTAgbm8tcGl4ZWwtYm9yZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCLmnKrplovlsIFcIj7mnKrkvb/nlKg8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwi5L2/55So5LitXCI+5bey6ZaL5bCBPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImFyY2hpdmVkXCI+5bCB5a2YPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPVwidy0zIGgtMyBhYnNvbHV0ZSByaWdodC0xIHRleHQtcmV0cm8tdGV4dC80MCBwb2ludGVyLWV2ZW50cy1ub25lXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogSW5zdGFuY2UgZWRpdC9kZWxldGUgYnV0dG9ucyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c2VsZWN0ZWREZXRhaWxQcm9kdWN0LnN0YXR1cyAhPT0gJ2FyY2hpdmVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGJnLXN0b25lLTUwIHJvdW5kZWQtbGcgcHgtMiBweS0wLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVFZGl0SW5zdGFuY2VUcmlnZ2VyKHNlbGVjdGVkRGV0YWlsUHJvZHVjdCwgaW5zdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QobnVsbCk7IC8vIENsb3NlIG1vZGFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhY3Rpb24tYnRuLW5vLXBpeGVsIHRleHQtcmV0cm8tcHJpbWFyeSBob3Zlcjp0ZXh0LXJldHJvLXNlY29uZGFyeSBwLTAuNSB0cmFuc2l0aW9uLWNvbG9ycyBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLnt6jovK/mraTopo/moLxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVkaXQzIGNsYXNzTmFtZT1cInctMyBoLTNcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInctWzFweF0gaC0zIGJnLXJldHJvLXRleHQvMTBcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlRGVsZXRlSW5zdGFuY2VEaXJlY3Qoc2VsZWN0ZWREZXRhaWxQcm9kdWN0LmlkLCBpbnN0LmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhY3Rpb24tYnRuLW5vLXBpeGVsIHRleHQtcmVkLTQwMCBob3Zlcjp0ZXh0LXJlZC02MDAgcC0wLjUgdHJhbnNpdGlvbi1jb2xvcnMgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi5rC45LmF5Yiq6Zmk5q2k57Sw6aCFXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFBBTyBFeHBpcnkgLyBEYXRlIERldGFpbHMgR3JpZCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIG92ZXJmbG93LWhpZGRlbiBiZy1zdG9uZS01MC81MCBtdC0yIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBSb3cgMTogRXhwaXJ5ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMyBkaXZpZGUteCBkaXZpZGUtcmV0cm8tdGV4dC8xMCBib3JkZXItYiBib3JkZXItcmV0cm8tdGV4dC8xMCBiZy1yZXRyby1iZy8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0LzYwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMS41IGZsZXggaXRlbXMtY2VudGVyXCI+5pW46YePIC8g5a656YePPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMS41IGZsZXggaXRlbXMtY2VudGVyXCI+5pyJ5pWI5pyf6ZmQPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMS41IGZsZXggaXRlbXMtY2VudGVyXCI+5Ymp6aSYPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGRpdmlkZS14IGRpdmlkZS1yZXRyby10ZXh0LzEwIGJnLXdoaXRlIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIuNSBmbGV4IGl0ZW1zLWNlbnRlclwiPntpbnN0LnF0eX0gLyB7aW5zdC5jYXBhY2l0eSB8fCAnLSd9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMi41IGZsZXggaXRlbXMtY2VudGVyXCI+e2luc3QuZXhwaXJ5ID8gaW5zdC5leHBpcnkgOiAnLSd9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMi41IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2lzVXJnZW50ID8gJ3RleHQtcmVkLTUwMCcgOiAnJ30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2RheXNMZWZ0ICE9PSA5OTk5ID8gYCR7ZGF5c0xlZnR9IOWkqWAgOiAnLSd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFJvdyAyOiBQQU8gKE9ubHkgaWYgaW4gdXNlIGFuZCBoYXMgUEFPKSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aW5zdC51c2FnZSA9PT0gJ+S9v+eUqOS4rScgJiYgaW5zdC5wYW9Nb250aHMgJiYgaW5zdC5vcGVuZWREYXRlICYmIHBhbyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGdyaWQgZ3JpZC1jb2xzLTMgZGl2aWRlLXggZGl2aWRlLXJldHJvLXRleHQvMTAgYm9yZGVyLWIgYm9yZGVyLXQgYm9yZGVyLXJldHJvLXRleHQvMTAgdGV4dC1bMTBweF0gZm9udC1ib2xkICR7cGFvLmlzRXhwaXJlZCA/ICdiZy1yZWQtNTAgdGV4dC1yZWQtNjAwLzcwJyA6ICdiZy1yZXRyby1iZy8zMCB0ZXh0LXJldHJvLXRleHQvNjAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgZmxleCBpdGVtcy1jZW50ZXJcIj7plovlsIHml6XmnJ88L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMS41IGZsZXggaXRlbXMtY2VudGVyXCI+5L2/55So5pyf6ZmQPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSBmbGV4IGl0ZW1zLWNlbnRlclwiPuWJqemkmDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BncmlkIGdyaWQtY29scy0zIGRpdmlkZS14IGRpdmlkZS1yZXRyby10ZXh0LzEwIHRleHQteHMgZm9udC1ib2xkICR7cGFvLmlzRXhwaXJlZCA/ICdiZy1yZWQtNTAvNTAgdGV4dC1yZWQtNjAwJyA6ICdiZy13aGl0ZSB0ZXh0LXJldHJvLXRleHQnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yLjUgZmxleCBpdGVtcy1jZW50ZXJcIj57aW5zdC5vcGVuZWREYXRlfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yLjUgZmxleCBpdGVtcy1jZW50ZXJcIj57cGFvLmV4cGlyeURhdGV9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIuNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cGFvLmlzRXhwaXJlZCA/IGAke3Bhby5kYXlzT3ZlcmR1ZX0g5aSpICjpgY7mnJ8pYCA6IGAke3Bhby5kYXlzTGVmdH0g5aSpYH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICkgOiBkZXRhaWxBY3RpdmVUYWIgPT09ICdwdXJjaGFzZScgPyAoXG4gICAgICAgICAgICAgICAgLyogVGFiIDIgQ29udGVudDog6LO86LK357SA6YyEICovXG4gICAgICAgICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFsbFB1cmNoYXNlSW5zdGFuY2VzID0gcHJvZHVjdHNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihwID0+IHAuYnJhbmQgPT09IHNlbGVjdGVkRGV0YWlsUHJvZHVjdC5icmFuZCAmJiBwLm5hbWUgPT09IHNlbGVjdGVkRGV0YWlsUHJvZHVjdC5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcChwID0+IHAuaW5zdGFuY2VzLm1hcChpbnN0ID0+ICh7IC4uLmluc3QsIGlzQXJjaGl2ZWQ6IHAuc3RhdHVzID09PSAnYXJjaGl2ZWQnIH0pKSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5wdXJjaGFzZURhdGUgJiYgYi5wdXJjaGFzZURhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShiLnB1cmNoYXNlRGF0ZSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoYS5wdXJjaGFzZURhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlc1dpdGhQdXJjaGFzZUluZm8gPSBhbGxQdXJjaGFzZUluc3RhbmNlcy5maWx0ZXIoaW5zdCA9PiBpbnN0LnB1cmNoYXNlRGF0ZSB8fCBpbnN0LnB1cmNoYXNlUGxhY2UgfHwgaW5zdC5wcmljZSAhPT0gdW5kZWZpbmVkKTtcblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTQgYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zdG9uZS01MCBweC0zIHB5LTIuNSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC81IGZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1yZXRyby10ZXh0LzYwXCI+6LO86LK35piO57Sw562G5pW4PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWV4dHJhYm9sZCB0ZXh0LXJldHJvLXNlY29uZGFyeSBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAg57i9562G5pW477yae2FsbFB1cmNoYXNlSW5zdGFuY2VzLmxlbmd0aH0g562GXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1leHRyYWJvbGQgdGV4dC1yZXRyby10ZXh0LzUwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBibG9ja1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICDwn5uSIOavj+S4gOethueahOizvOiyt+aYjue0sOe0gOmMhCAo5ZCr5bCB5a2YKVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC81IGJnLXdoaXRlIHNoYWRvdy14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtbGVmdCBib3JkZXItY29sbGFwc2VcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiYmctc3RvbmUtNTAgYm9yZGVyLWIgYm9yZGVyLXJldHJvLXRleHQvNSB0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgdGV4dC1yZXRyby10ZXh0LzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIuNSBmb250LWJvbGQgd2hpdGVzcGFjZS1ub3dyYXBcIj7ml6XmnJ88L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0yLjUgZm9udC1ib2xkIHdoaXRlc3BhY2Utbm93cmFwXCI+5Zyw6buePC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMi41IGZvbnQtYm9sZCB0ZXh0LWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcFwiPuaVuOmHjzwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIuNSBmb250LWJvbGQgdGV4dC1yaWdodCB3aGl0ZXNwYWNlLW5vd3JhcFwiPuWWruWDuTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT1cImRpdmlkZS15IGRpdmlkZS1yZXRyby10ZXh0LzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHthbGxQdXJjaGFzZUluc3RhbmNlcy5tYXAoKGluc3QsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc1B1cmNoYXNlSW5mbyA9IGluc3QucHVyY2hhc2VEYXRlIHx8IGluc3QucHVyY2hhc2VQbGFjZSB8fCBpbnN0LnByaWNlICE9PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzUHVyY2hhc2VJbmZvKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtpbnN0LmlkfSBjbGFzc05hbWU9e2B0ZXh0LXhzIHRleHQtcmV0cm8tdGV4dCAke2luc3QuaXNBcmNoaXZlZCA/ICdvcGFjaXR5LTUwIGdyYXlzY2FsZScgOiAnJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIuNSBmb250LW1vbm9cIj57aW5zdC5wdXJjaGFzZURhdGUgfHwgJy0nfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yLjVcIj57aW5zdC5wdXJjaGFzZVBsYWNlIHx8ICctJ308L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMi41IGZvbnQtbW9ubyB0ZXh0LWNlbnRlclwiPntpbnN0LnF0eSB8fCAnLSd9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIuNSBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcmlnaHQgdGV4dC1yZXRyby1zZWNvbmRhcnlcIj57aW5zdC5wcmljZSAhPT0gdW5kZWZpbmVkID8gYCQke2luc3QucHJpY2V9YCA6ICctJ308L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7aW5zdGFuY2VzV2l0aFB1cmNoYXNlSW5mby5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHktNiB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc3RvbmUtNDAwIGZvbnQtc2VtaWJvbGQgYmctd2hpdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOaaq+eEoeizvOiyt+e0gOmMhFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWNlbnRlciB0ZXh0LXN0b25lLTQwMCBmb250LXNlbWlib2xkIHB0LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIPCfkqEg5o+Q56S677ya6bue5pOK5Y+z5LiK6KeS55qE57eo6Lyv5ZyW56S677yI5pW46YeP54uA5rOB6aCB57Gk5Lit77yJ5Y2z5Y+v5paw5aKe6LO86LK357SA6YyEXG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSkoKVxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIC8qIFRhYiAzIENvbnRlbnQ6IOS9v+eUqOe0gOmMhCAqL1xuICAgICAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhbGxVc2FnZUluc3RhbmNlcyA9IHByb2R1Y3RzXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIocCA9PiBwLmJyYW5kID09PSBzZWxlY3RlZERldGFpbFByb2R1Y3QuYnJhbmQgJiYgcC5uYW1lID09PSBzZWxlY3RlZERldGFpbFByb2R1Y3QubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAocCA9PiBwLmluc3RhbmNlcylcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihpbnN0ID0+IGluc3QudXNhZ2UgPT09ICflt7LnlKjlrownIHx8IGluc3QudXNhZ2UgPT09ICflt7LkuJ/mo4QnIHx8IChpbnN0LnVzYWdlID09PSAn5L2/55So5LitJyAmJiBpbnN0Lm9wZW5lZERhdGUpKVxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChhLm9wZW5lZERhdGUgJiYgYi5vcGVuZWREYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoYi5vcGVuZWREYXRlKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShhLm9wZW5lZERhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNCBhbmltYXRlLWZhZGUtaW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXN0b25lLTUwIHB4LTMgcHktMi41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzUgZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXRleHQvNjBcIj7kvb/nlKjntIDpjITnrYbmlbg8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtZXh0cmFib2xkIHRleHQtYW1iZXItNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICDnuL3oqIjvvJp7YWxsVXNhZ2VJbnN0YW5jZXMubGVuZ3RofSDnrYZcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LWV4dHJhYm9sZCB0ZXh0LXJldHJvLXRleHQvNTAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGJsb2NrXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIOKMmyDlvp7plovlsIHliLDnlKjlrowv5Lif5qOE55qE5pmC6ZaTXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzUgYmctd2hpdGUgc2hhZG93LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1sZWZ0IGJvcmRlci1jb2xsYXBzZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy1zdG9uZS01MCBib3JkZXItYiBib3JkZXItcmV0cm8tdGV4dC81IHRleHQtWzEwcHhdIHVwcGVyY2FzZSB0ZXh0LXJldHJvLXRleHQvNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMi41IGZvbnQtYm9sZCB3aGl0ZXNwYWNlLW5vd3JhcFwiPueLgOaFizwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIuNSBmb250LWJvbGQgd2hpdGVzcGFjZS1ub3dyYXBcIj7mnJ/plpM8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0yLjUgZm9udC1ib2xkIHRleHQtcmlnaHQgd2hpdGVzcGFjZS1ub3dyYXBcIj7oirHosrvmmYLplpM8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtcmV0cm8tdGV4dC81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7YWxsVXNhZ2VJbnN0YW5jZXMubWFwKGluc3QgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZHVyYXRpb25TdHIgPSAnLSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnN0Lm9wZW5lZERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmREID0gKGluc3QudXNhZ2UgPT09ICflt7LnlKjlrownIHx8IGluc3QudXNhZ2UgPT09ICflt7LkuJ/mo4QnKSAmJiBpbnN0LmZpbmlzaGVkRGF0ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoaW5zdC5maW5pc2hlZERhdGUpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0RCA9IG5ldyBEYXRlKGluc3Qub3BlbmVkRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlmZk1zID0gZW5kRC5nZXRUaW1lKCkgLSBzdGFydEQuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaWZmTXMgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG90YWxEYXlzID0gTWF0aC5mbG9vcihkaWZmTXMgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeWVhcnMgPSBNYXRoLmZsb29yKHRvdGFsRGF5cyAvIDM2NSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb250aHMgPSBNYXRoLmZsb29yKCh0b3RhbERheXMgJSAzNjUpIC8gMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF5cyA9ICh0b3RhbERheXMgJSAzNjUpICUgMzA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhcnMgPiAwKSBwYXJ0cy5wdXNoKGAke3llYXJzfeW5tGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vbnRocyA+IDApIHBhcnRzLnB1c2goYCR7bW9udGhzfeWAi+aciGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHllYXJzID09PSAwICYmIG1vbnRocyA9PT0gMCkgcGFydHMucHVzaChgJHtkYXlzfeWkqWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb25TdHIgPSBwYXJ0cy5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17aW5zdC5pZH0gY2xhc3NOYW1lPXtgdGV4dC14cyB0ZXh0LXJldHJvLXRleHRgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bMTBweF0gZm9udC1ib2xkICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdC51c2FnZSA9PT0gJ+S9v+eUqOS4rScgPyAnYmctZ3JlZW4tMTAwIHRleHQtZ3JlZW4tNzAwJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdC51c2FnZSA9PT0gJ+W3sueUqOWujCcgPyAnYmctc3RvbmUtMjAwIHRleHQtc3RvbmUtNjAwJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JnLXJlZC0xMDAgdGV4dC1yZWQtNjAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2luc3QudXNhZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yLjUgZm9udC1tb25vIHRleHQtWzEwcHhdIHRleHQtc3RvbmUtNTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+e2luc3Qub3BlbmVkRGF0ZSB8fCAnLSd9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+fiB7aW5zdC5maW5pc2hlZERhdGUgfHwgKGluc3QudXNhZ2UgPT09ICfkvb/nlKjkuK0nID8gJ+iHs+S7iicgOiAnLScpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIuNSBmb250LWJvbGQgdGV4dC1yaWdodCB0ZXh0LWFtYmVyLTYwMFwiPntkdXJhdGlvblN0cn08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7YWxsVXNhZ2VJbnN0YW5jZXMubGVuZ3RoID09PSAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB5LTYgdGV4dC1jZW50ZXIgdGV4dC14cyB0ZXh0LXN0b25lLTQwMCBmb250LXNlbWlib2xkIGJnLXdoaXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICDmmqvnhKHkvb/nlKjntIDpjIQgKOmcgOioreWumumWi+WwgeaXpeacnylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSkoKVxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgey8qIFF1aWNrIGFkZCBpbnN0YW5jZSBmb290ZXIgKi99XG4gICAgICAgICAgICB7c2VsZWN0ZWREZXRhaWxQcm9kdWN0LnN0YXR1cyAhPT0gJ2FyY2hpdmVkJyAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0zIGJvcmRlci10IGJvcmRlci1yZXRyby10ZXh0LzUgYmctc3RvbmUtNTAvODAgZmxleCBnYXAtMiBmbGV4LXNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQWRkQW5vdGhlckluc3RhbmNlVHJpZ2dlcihzZWxlY3RlZERldGFpbFByb2R1Y3QpO1xuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERldGFpbFByb2R1Y3QobnVsbCk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIuNSBiZy1yZXRyby1zZWNvbmRhcnkgaG92ZXI6Ymctc3RvbmUtODAwIHRleHQtd2hpdGUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBzaGFkb3cgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICAgICAgICDmlrDlop7mraTnlKLlk4HnmoTlhbbku5bluqvlrZgv6KaP5qC8XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiA9PT09PT09PT09PT09PT09PT09PSA5LiBDdXN0b20gQ29uZmlybWF0aW9uIERpYWxvZyAoUmVxdWlyZW1lbnQgMjogUmVzb2x2ZSBpZnJhbWUgd2luZG93LmNvbmZpcm0gYmxvY2tzKSA9PT09PT09PT09PT09PT09PT09PSAqL31cbiAgICAgIHtjb25maXJtRGlhbG9nICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIGJnLXN0b25lLTkwMC81MCBiYWNrZHJvcC1ibHVyLXhzIHotWzEwMF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGFuaW1hdGUtZmFkZS1pblwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LXhzIGJnLXdoaXRlIGJvcmRlci0yIGJvcmRlci1yZXRyby10ZXh0IHJvdW5kZWQtMnhsIG92ZXJmbG93LWhpZGRlbiBzaGFkb3ctMnhsIHAtNSBzcGFjZS15LTQgYW5pbWF0ZS1zbGlkZS11cFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXJldHJvLXNlY29uZGFyeVwiPlxuICAgICAgICAgICAgICA8SW5mbyBjbGFzc05hbWU9XCJ3LTUgaC01IGZsZXgtc2hyaW5rLTAgdGV4dC1yZXRyby1wcmltYXJ5XCIgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1leHRyYWJvbGQgdGV4dC1zbSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj57Y29uZmlybURpYWxvZy50aXRsZX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc3RvbmUtNjAwIGxlYWRpbmctcmVsYXhlZCB3aGl0ZXNwYWNlLXByZS1saW5lXCI+XG4gICAgICAgICAgICAgIHtjb25maXJtRGlhbG9nLm1lc3NhZ2V9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTIgcHQtMlwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q29uZmlybURpYWxvZyhudWxsKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcHktMiBiZy1zdG9uZS0xMDAgaG92ZXI6Ymctc3RvbmUtMjAwIHRleHQtc3RvbmUtNzAwIGZvbnQtYm9sZCB0ZXh0LXhzIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgYm9yZGVyIGJvcmRlci1zdG9uZS0yMDAgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg5Y+W5raIXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZy5vbkNvbmZpcm0oKTtcbiAgICAgICAgICAgICAgICAgIHNldENvbmZpcm1EaWFsb2cobnVsbCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcHktMiBiZy1yZXRyby1wcmltYXJ5IGhvdmVyOm9wYWNpdHktOTAgdGV4dC1yZXRyby1jYXJkIGZvbnQtZXh0cmFib2xkIHRleHQteHMgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctc20gY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg56K65a6aXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qID09PT09PT09PT09PT09PT09PT09IEltYWdlIENyb3BwZXIgTW9kYWwgPT09PT09PT09PT09PT09PT09PT0gKi99XG4gICAgICB7Y3JvcEltYWdlU3JjICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIGJnLXN0b25lLTkwMC85NSBiYWNrZHJvcC1ibHVyLW1kIHotWzEyMF0gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgaC1bNjB2aF0gc206aC1bNzB2aF0gYmctYmxhY2tcIj5cbiAgICAgICAgICAgIDxDcm9wcGVyXG4gICAgICAgICAgICAgIGltYWdlPXtjcm9wSW1hZ2VTcmN9XG4gICAgICAgICAgICAgIGNyb3A9e2Nyb3B9XG4gICAgICAgICAgICAgIHpvb209e3pvb219XG4gICAgICAgICAgICAgIGFzcGVjdD17Y3JvcEFzcGVjdH1cbiAgICAgICAgICAgICAgb25Dcm9wQ2hhbmdlPXtzZXRDcm9wfVxuICAgICAgICAgICAgICBvbkNyb3BDb21wbGV0ZT17b25Dcm9wQ29tcGxldGV9XG4gICAgICAgICAgICAgIG9uWm9vbUNoYW5nZT17c2V0Wm9vbX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTYgdy1mdWxsIG1heC13LW1kIHNwYWNlLXktNFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ+ato+aWueW9oiAxOjEnLCB2YWx1ZTogMSB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICfnm7TlvI8gMzo0JywgdmFsdWU6IDMvNCB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICfmqavlvI8gNDozJywgdmFsdWU6IDQvMyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICflr6zonqLluZUgMTY6OScsIHZhbHVlOiAxNi85IH1cbiAgICAgICAgICAgICAgXS5tYXAocmF0aW8gPT4gKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIGtleT17cmF0aW8ubGFiZWx9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRDcm9wQXNwZWN0KHJhdGlvLnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1jb2xvcnMgJHtjcm9wQXNwZWN0ID09PSByYXRpby52YWx1ZSA/ICdiZy1yZXRyby1wcmltYXJ5IHRleHQtd2hpdGUnIDogJ2JnLXdoaXRlLzEwIHRleHQtd2hpdGUvNzAgaG92ZXI6Ymctd2hpdGUvMjAnfWB9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3JhdGlvLmxhYmVsfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCB0ZXh0LXdoaXRlXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gd2hpdGVzcGFjZS1ub3dyYXBcIj7nuK7mlL48L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e3pvb219XG4gICAgICAgICAgICAgICAgbWluPXsxfVxuICAgICAgICAgICAgICAgIG1heD17M31cbiAgICAgICAgICAgICAgICBzdGVwPXswLjF9XG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbGxlZGJ5PVwiWm9vbVwiXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBzZXRab29tKE51bWJlcihlLnRhcmdldC52YWx1ZSkpXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYWNjZW50LXJldHJvLXByaW1hcnlcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTRcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcHktMyByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMjAgdGV4dC13aGl0ZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgaG92ZXI6Ymctd2hpdGUvMTAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUNyb3BDYW5jZWx9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDlj5bmtohcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIHB5LTMgcm91bmRlZC14bCBiZy1yZXRyby1wcmltYXJ5IHRleHQtd2hpdGUgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIGhvdmVyOmJyaWdodG5lc3MtMTEwIHRyYW5zaXRpb24tYWxsIHNoYWRvdy1sZ1wiXG4gICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlQ3JvcENvbmZpcm19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDnorroqo3oo4HliIdcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogPT09PT09PT09PT09PT09PT09PT0gMTAuIEZ1bGxzY3JlZW4gSW1hZ2UgTW9kYWwgPT09PT09PT09PT09PT09PT09PT0gKi99XG4gICAgICB7ZnVsbHNjcmVlbkltYWdlICYmIChcbiAgICAgICAgPGRpdiBcbiAgICAgICAgICBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIGJnLXN0b25lLTkwMC85MCBiYWNrZHJvcC1ibHVyLW1kIHotWzExMF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGFuaW1hdGUtZmFkZS1pbiBjdXJzb3Item9vbS1vdXRcIlxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZ1bGxzY3JlZW5JbWFnZShudWxsKX1cbiAgICAgICAgPlxuICAgICAgICAgIDxpbWcgXG4gICAgICAgICAgICByZWZlcnJlclBvbGljeT1cIm5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgIHNyYz17ZnVsbHNjcmVlbkltYWdlfSBcbiAgICAgICAgICAgIGFsdD1cIkZ1bGxzY3JlZW4gcHJldmlld1wiIFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibWF4LXctZnVsbCBtYXgtaC1mdWxsIG9iamVjdC1jb250YWluIHJvdW5kZWQtbGcgc2hhZG93LTJ4bCBhbmltYXRlLXNsaWRlLXVwXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgIC8+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIHRvcC00IHJpZ2h0LTQgc206dG9wLTggc206cmlnaHQtOCB3LTEwIGgtMTAgYmctYmxhY2svNTAgdGV4dC13aGl0ZSByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaG92ZXI6YmctYmxhY2svODAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RnVsbHNjcmVlbkltYWdlKG51bGwpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNiBoLTZcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8vIENvbXBhY3QgU2luZ2xlIFByb2R1Y3QgQ2FyZCBDb21wb25lbnQgKFJlcXVpcmVtZW50IDE6IENsaWNrIG91dHNpZGUgdG90YWwgY2FyZCB0cmlnZ2VycyBjb21wbGV0ZSBkZXRhaWwgdmlldylcbmZ1bmN0aW9uIFByb2R1Y3RDYXJkKHsgXG4gIHByb2R1Y3QsIFxuICBvblZpZXdEZXRhaWwsXG4gIG9uRWRpdCwgXG4gIG9uQXJjaGl2ZSxcbiAgb25BZGRBbm90aGVyLFxuICBvbkltYWdlQ2xpY2ssXG4gIGNhdGVnb3J5SWNvblxufTogeyBcbiAgcHJvZHVjdDogUHJvZHVjdDsgXG4gIG9uVmlld0RldGFpbDogKHByb2Q6IFByb2R1Y3QpID0+IHZvaWQ7IFxuICBvbkVkaXQ6IChwcm9kOiBQcm9kdWN0LCBpbnN0OiBQcm9kdWN0SW5zdGFuY2UpID0+IHZvaWQ7XG4gIG9uQXJjaGl2ZTogKHByb2RJZDogc3RyaW5nLCBpbnN0SWQ6IHN0cmluZykgPT4gdm9pZDtcbiAgb25BZGRBbm90aGVyOiAocHJvZDogUHJvZHVjdCkgPT4gdm9pZDtcbiAgb25JbWFnZUNsaWNrPzogKHVybDogc3RyaW5nKSA9PiB2b2lkO1xuICBjYXRlZ29yeUljb246IHN0cmluZztcbn0pIHtcbiAgY29uc3QgaW5zdGFuY2VzID0gcHJvZHVjdC5pbnN0YW5jZXM7XG4gIGNvbnN0IGlzQXJjaGl2ZWQgPSBwcm9kdWN0LnN0YXR1cyA9PT0gJ2FyY2hpdmVkJztcblxuICAvLyBGaW5kIHN0YW5kYXJkIHNob3J0ZXN0IGV4cGlyeSBkYXlzIHRvIHNob3cgb24gb3V0ZXIgY2lyY2xlIGJhZGdlXG4gIGxldCBtaW5EYXlzVG9FeHBpcnkgPSA5OTk5O1xuICBsZXQgY2xvc2VzdEV4cGlyeURhdGUgPSAnJztcbiAgaW5zdGFuY2VzLmZvckVhY2goaW5zdCA9PiB7XG4gICAgY29uc3QgZGF5cyA9IGNhbGN1bGF0ZURheXNUb0V4cGlyeShpbnN0LmV4cGlyeSk7XG4gICAgaWYgKGRheXMgPCBtaW5EYXlzVG9FeHBpcnkpIHtcbiAgICAgIG1pbkRheXNUb0V4cGlyeSA9IGRheXM7XG4gICAgICBjbG9zZXN0RXhwaXJ5RGF0ZSA9IGluc3QuZXhwaXJ5O1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQ2FsY3VsYXRlIHN0YW5kYXJkIHdhcm5pbmcgc3R5bGVzXG4gIGNvbnN0IGlzVXJnZW50ID0gbWluRGF5c1RvRXhwaXJ5IDw9IDYwO1xuICBjb25zdCB0b3RhbFF0eSA9IGluc3RhbmNlcy5yZWR1Y2UoKHN1bSwgaW5zdCkgPT4gc3VtICsgaW5zdC5xdHksIDApO1xuICBjb25zdCB0b3RhbFVub3BlbmVkUXR5ID0gaW5zdGFuY2VzLmZpbHRlcihpbnN0ID0+IGluc3QudXNhZ2UgPT09ICfmnKrplovlsIEnKS5yZWR1Y2UoKHN1bSwgaW5zdCkgPT4gc3VtICsgaW5zdC5xdHksIDApO1xuICBjb25zdCBoYXNJblVzZSA9IGluc3RhbmNlcy5zb21lKGluc3QgPT4gaW5zdC51c2FnZSA9PT0gJ+S9v+eUqOS4rScpO1xuICBjb25zdCBuZWVkc1Jlc3RvY2sgPSBwcm9kdWN0LnRocmVzaG9sZCA+IDAgJiYgdG90YWxVbm9wZW5lZFF0eSA8PSBwcm9kdWN0LnRocmVzaG9sZDtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgXG4gICAgICBvbkNsaWNrPXsoKSA9PiBvblZpZXdEZXRhaWwocHJvZHVjdCl9XG4gICAgICBjbGFzc05hbWU9e2BwLTQgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJnLXdoaXRlIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQgaG92ZXI6Ym9yZGVyLXJldHJvLXByaW1hcnkvMzAgc2hhZG93LXNtIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtWzAuOTldIGdyb3VwIHJlbGF0aXZlICR7aXNBcmNoaXZlZCA/ICdvcGFjaXR5LTYwIGdyYXlzY2FsZScgOiAnJ31gfVxuICAgICAgdGl0bGU9XCLpu57mk4rpgLLlhaXllYblk4HlrozmlbTnlavpnaJcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMy41IGl0ZW1zLWNlbnRlciBtaW4tdy0wIGZsZXgtMVwiPlxuICAgICAgICB7LyogVGh1bWIgKi99XG4gICAgICAgIHtwcm9kdWN0LnBob3RvID8gKFxuICAgICAgICAgIDxpbWcgXG4gICAgICAgICAgICByZWZlcnJlclBvbGljeT1cIm5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgIHNyYz17cHJvZHVjdC5waG90b30gXG4gICAgICAgICAgICBhbHQ9e3Byb2R1Y3QubmFtZX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChvbkltYWdlQ2xpY2spIHtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIG9uSW1hZ2VDbGljayhwcm9kdWN0LnBob3RvISk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTExIGgtMTQgcm91bmRlZC1sZyBvYmplY3QtY292ZXIgYm9yZGVyIGJvcmRlci1yZXRyby10ZXh0LzEwIHNoYWRvdy1zbSBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIlxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTExIGgtMTQgcm91bmRlZC1sZyBiZy1yZXRyby1wcmltYXJ5LzEwIGJvcmRlciBib3JkZXItZGFzaGVkIGJvcmRlci1yZXRyby1wcmltYXJ5LzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtcmV0cm8tcHJpbWFyeSBmbGV4LXNocmluay0wXCI+XG4gICAgICAgICAgICA8Q2F0ZWdvcnlJY29uIG5hbWU9e2NhdGVnb3J5SWNvbn0gY2xhc3NOYW1lPVwidy01IGgtNSBvcGFjaXR5LTQwXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVGl0bGVzICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wganVzdGlmeS1zdGFydCBtaW4tdy0wIGZsZXgtMVwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXJldHJvLXNlY29uZGFyeSB0cmFja2luZy13aWRlciB1cHBlcmNhc2UgdHJ1bmNhdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgZmxleC1zaHJpbmstMCAke2hhc0luVXNlID8gJ2JnLWdyZWVuLTUwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy1zdG9uZS0zMDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgIHtwcm9kdWN0LmJyYW5kfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCBmb250LWRpc3BsYXkgdGV4dC1yZXRyby10ZXh0IGxlYWRpbmctc251ZyB0cnVuY2F0ZSBncm91cC1ob3Zlcjp0ZXh0LXJldHJvLXByaW1hcnkgdHJhbnNpdGlvbi1jb2xvcnMgbXQtMC41IGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0cnVuY2F0ZVwiPntwcm9kdWN0Lm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAge25lZWRzUmVzdG9jayAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTAgYmctcmVkLTEwMCB0ZXh0LXJlZC02MDAgdGV4dC1bOXB4XSBmb250LWJvbGQgcHgtMS41IHB5LTAuNSByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0wLjVcIj5cbiAgICAgICAgICAgICAgICA8SW5mbyBjbGFzc05hbWU9XCJ3LTMgaC0zXCIgLz5cbiAgICAgICAgICAgICAgICDoo5zosqhcbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtdC0xLjVcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtc2VtaWJvbGQgdGV4dC1yZXRyby10ZXh0LzUwIGJnLXN0b25lLTEwMCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgPFBhY2thZ2UgY2xhc3NOYW1lPVwidy0zIGgtMyB0ZXh0LXJldHJvLXByaW1hcnlcIiAvPlxuICAgICAgICAgICAgICDlhbEge3RvdGFsUXR5fSDku7ZcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFJpZ2h0IENpcmNsZSBFeHBpcnkgSW5kaWNhdG9yICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBtbC0zIGZsZXgtc2hyaW5rLTBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMiBoLTEyIHJvdW5kZWQtZnVsbCBiZy1zdG9uZS01MCBib3JkZXIgYm9yZGVyLXJldHJvLXRleHQvNSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdGV4dC1zbSBmb250LWJvbGQgbGVhZGluZy1ub25lICR7aXNVcmdlbnQgPyAndGV4dC1yZWQtNTAwIGZvbnQtZXh0cmFib2xkJyA6ICd0ZXh0LXJldHJvLXByaW1hcnknfWB9PlxuICAgICAgICAgICAgICB7bWluRGF5c1RvRXhwaXJ5ICE9PSA5OTk5ID8gbWluRGF5c1RvRXhwaXJ5IDogJy0nfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOHB4XSB0ZXh0LXJldHJvLXRleHQvNTAgZm9udC1ib2xkIG10LTAuNVwiPuWkqeWIsOacnzwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7bWluRGF5c1RvRXhwaXJ5ICE9PSA5OTk5ICYmIGNsb3Nlc3RFeHBpcnlEYXRlICYmIChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtcmV0cm8tdGV4dC80MCBtdC0xXCI+XG4gICAgICAgICAgICAgIHtjbG9zZXN0RXhwaXJ5RGF0ZS5yZXBsYWNlKC8tL2csICcvJyl9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LXN0b25lLTMwMCBncm91cC1ob3Zlcjp0ZXh0LXJldHJvLXByaW1hcnkgZ3JvdXAtaG92ZXI6dHJhbnNsYXRlLXgtMC41IHRyYW5zaXRpb24tYWxsXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBJbmxpbmUgbWluaSBDbG9jayBpY29uXG5mdW5jdGlvbiBDbG9ja0ljb24oeyBjbGFzc05hbWUgPSBcInctNCBoLTRcIiB9OiB7IGNsYXNzTmFtZT86IHN0cmluZyB9KSB7XG4gIHJldHVybiAoXG4gICAgPHN2ZyBcbiAgICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBcbiAgICAgIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBcbiAgICAgIGZpbGw9XCJub25lXCIgXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBcbiAgICAgIHN0cm9rZVdpZHRoPVwiMlwiIFxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgXG4gICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZX1cbiAgICA+XG4gICAgICA8Y2lyY2xlIGN4PVwiMTJcIiBjeT1cIjEyXCIgcj1cIjEwXCIgLz5cbiAgICAgIDxwb2x5bGluZSBwb2ludHM9XCIxMiA2IDEyIDEyIDE2IDE0XCIgLz5cbiAgICA8L3N2Zz5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKCkge1xuICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZTxVc2VyIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBvbkF1dGhTdGF0ZUNoYW5nZWQoYXV0aCwgKGN1cnJlbnRVc2VyKSA9PiB7XG4gICAgICBzZXRVc2VyKGN1cnJlbnRVc2VyKTtcbiAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bnN1YnNjcmliZTtcbiAgfSwgW10pO1xuXG4gIGlmIChsb2FkaW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGJnLXJldHJvLWJnIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGZvbnQtc2Fuc1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgPFNwYXJrbGVzIGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1yZXRyby1wcmltYXJ5IGFuaW1hdGUtcHVsc2VcIiAvPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcmV0cm8tdGV4dCBmb250LWJvbGQgdGV4dC1zbSB0cmFja2luZy13aWRlciB1cHBlcmNhc2VcIj5Mb2FkaW5nLi4uPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICBpZiAoIXVzZXIpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gYmctcmV0cm8tYmcgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC02IGZvbnQtc2Fuc1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC13LW1kIHctZnVsbCBiZy13aGl0ZSBwLTggcm91bmRlZC0zeGwgc2hhZG93LXhsIGJvcmRlciBib3JkZXItcmV0cm8tdGV4dC8xMCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IGJnLXJldHJvLXByaW1hcnkvMTAgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1yZXRyby1wcmltYXJ5IG1iLTZcIj5cbiAgICAgICAgICAgIDxTcGFya2xlcyBjbGFzc05hbWU9XCJ3LTggaC04XCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIGZvbnQtZGlzcGxheSB0ZXh0LXJldHJvLXRleHQgbWItMlwiPueUqOWTgeeuoeeQhuezu+e1sTwvaDE+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1yZXRyby10ZXh0LzYwIHRleHQtc20gbWItOFwiPlxuICAgICAgICAgICAg57K+57e75b6p5Y+k5bqV54mH6aKo5qC855qE5YyW5aad5ZOB6IiH5L+d6aSK5ZOB5bqr5a2Y566h55CG57O757Wx77yM6KuL55m75YWl5Lul5a2Y5Y+W5bCI5bGs5oKo55qE5biz6Jmf6LOH5paZ44CCXG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIG9uQ2xpY2s9e3NpZ25JbldpdGhHb29nbGV9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgYmctcmV0cm8tdGV4dCB0ZXh0LXdoaXRlIHB5LTQgcm91bmRlZC14bCBmb250LWJvbGQgaG92ZXI6YmctcmV0cm8tdGV4dC85MCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLVswLjk4XVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgY2xhc3NOYW1lPVwidy01IGgtNSBiZy13aGl0ZSByb3VuZGVkLWZ1bGwgcC0wLjVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMjIuNTYgMTIuMjVjMC0uNzgtLjA3LTEuNTMtLjItMi4yNUgxMnY0LjI2aDUuOTJjLS4yNiAxLjM3LTEuMDQgMi41My0yLjIxIDMuMzF2Mi43N2gzLjU3YzIuMDgtMS45MiAzLjI4LTQuNzQgMy4yOC04LjA5elwiIGZpbGw9XCIjNDI4NUY0XCIvPlxuICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEyIDIzYzIuOTcgMCA1LjQ2LS45OCA3LjI4LTIuNjZsLTMuNTctMi43N2MtLjk4LjY2LTIuMjMgMS4wNi0zLjcxIDEuMDYtMi44NiAwLTUuMjktMS45My02LjE2LTQuNTNIMi4xOHYyLjg0QzMuOTkgMjAuNTMgNy43IDIzIDEyIDIzelwiIGZpbGw9XCIjMzRBODUzXCIvPlxuICAgICAgICAgICAgICA8cGF0aCBkPVwiTTUuODQgMTQuMDljLS4yMi0uNjYtLjM1LTEuMzYtLjM1LTIuMDlzLjEzLTEuNDMuMzUtMi4wOVY3LjA3SDIuMThDMS40MyA4LjU1IDEgMTAuMjIgMSAxMnMuNDMgMy40NSAxLjE4IDQuOTNsMi44NS0yLjIyLjgxLS42MnpcIiBmaWxsPVwiI0ZCQkMwNVwiLz5cbiAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMiA1LjM4YzEuNjIgMCAzLjA2LjU2IDQuMjEgMS42NGwzLjE1LTMuMTVDMTcuNDUgMi4wOSAxNC45NyAxIDEyIDEgNy43IDEgMy45OSAzLjQ3IDIuMTggNy4wN2wzLjY2IDIuODRjLjg3LTIuNiAzLjMtNC41MyA2LjE2LTQuNTN6XCIgZmlsbD1cIiNFQTQzMzVcIi8+XG4gICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIOS9v+eUqCBHb29nbGUg5biz6Jmf55m75YWlXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiA8TWFpbkFwcCB1c2VyPXt1c2VyfSAvPjtcbn1cbiJdLCJtYXBwaW5ncyI6IkFBK0ZTLFNBZ3pGcUIsVUFoekZyQjtBQS9GVCxTQUFnQixVQUFVLFdBQVcsY0FB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