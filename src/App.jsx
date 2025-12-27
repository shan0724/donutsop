import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  where,
  getDoc
} from "firebase/firestore";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  User, 
  FileText, 
  LogOut,
  History,
  ClipboardList,
  WifiOff,
  Download,
  BarChart3,
  Pencil,
  X,
  Shield,
  Key,
  Database,
  Target
} from 'lucide-react';

// ------------------------------------------------------------------
// 設定與初始化
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCT5JS5VRx4HaAkjPuEgm-CPaqn4sjY9NY",
  authDomain: "donutsop-e207c.firebaseapp.com",
  projectId: "donutsop-e207c",
  storageBucket: "donutsop-e207c.firebasestorage.app",
  messagingSenderId: "1052194354902",
  appId: "1:1052194354902:web:d5524c0d2583769c6d3b77"
};

// 初始化 Firebase
let db;
let auth;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase 初始化失敗，請確認 Config:", error);
}

// ------------------------------------------------------------------
// 預設資料
// ------------------------------------------------------------------
const DEFAULT_CATEGORIES = ["吧檯", "外場", "櫃台", "輪值店長"];

const DEFAULT_ADMIN = {
  username: "himmel0724",
  password: "angel0724"
};

const DEFAULT_ITEMS = [
  { id: 'b1', text: '12/26起飲料沒有貼標籤不準出杯', category: '吧檯' },
  { id: 'b2', text: '先貼標籤再製作，避免重複飲料', category: '吧檯' },
  { id: 'b3', text: '紅茶與烏龍一律用蒸氣棒加熱到滾', category: '吧檯' },
  { id: 'b4', text: '洗桶子時請把貼紙撕掉', category: '吧檯' },
  { id: 'b5', text: '開封日期跟有效日期請開新包裝就更新', category: '吧檯' },
  { id: 'b6', text: '冰淇淋餅乾拿完蓋子馬上蓋起來', category: '吧檯' },
  { id: 'b7', text: '保久乳紙箱外面的塑膠套請撕掉並分類', category: '吧檯' },
  { id: 'f1', text: '小蛋盤一律擦完撕下色豆再收', category: '外場' },
  { id: 'f2', text: '乾貨進貨請當日歸貨完', category: '外場' },
  { id: 'f3', text: '拆封紙箱(除吸管箱)四邊割掉', category: '外場' },
  { id: 'c1', text: '登入時正確選擇多那之登入', category: '櫃台' },
  { id: 'c2', text: '發票號碼低於100號提早告知', category: '櫃台' },
  { id: 'c3', text: '假日落實各站一台收銀機與正確交班', category: '櫃台' },
  { id: 'd1', text: '下班前窗戶檢查關閉上鎖', category: '輪值店長' },
  { id: 'd2', text: '缺貨價格牌收到籃子放才可下班', category: '輪值店長' },
];

const DEFAULT_STAFF = ["店長", "早班人員A", "晚班人員B"];

// ------------------------------------------------------------------
// 主程式組件
// ------------------------------------------------------------------
export default function App() {
  const [view, setView] = useState('form'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentAdminUser, setCurrentAdminUser] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(false); 

  // 資料狀態
  const [staffList, setStaffList] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [isUsingDefaults, setIsUsingDefaults] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substr(0, 10),
    staffName: '',
    checkerName: '',
    checkedItems: {},
    manualNote: '',
  });

  // Admin Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Admin Dashboard State
  const [activeTab, setActiveTab] = useState('items'); 
  const [historyLogs, setHistoryLogs] = useState([]);
  
  // Admin Item Management
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  
  // Staff Management
  const [newStaffName, setNewStaffName] = useState('');
  const [editingStaffOldName, setEditingStaffOldName] = useState(null); 
  const [editingStaffNewName, setEditingStaffNewName] = useState(''); 
  
  // Stats
  const [statsMonth, setStatsMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [failureThreshold, setFailureThreshold] = useState(3);

  // Admin Account Management
  const [adminList, setAdminList] = useState([]);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // ----------------------------------------------------------------
  // 0. 核心修正：處理 App ID (解決 Invalid collection reference 錯誤)
  // ----------------------------------------------------------------
  const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  // 將斜線、點等特殊符號替換為底線，確保路徑層級正確
  const appId = rawAppId.replace(/[\/.]/g, '_');

  // ----------------------------------------------------------------
  // 1. 處理身份驗證 (Auth)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!auth) {
      console.warn("Auth not initialized, falling back to offline mode.");
      setIsOffline(true);
      setLoading(false);
      fetchData(true);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("自訂 Token 登入失敗，嘗試匿名登入:", tokenError.message);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("最終登入失敗 (進入離線模式):", e.message);
        setIsOffline(true);
        fetchData(true);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsOffline(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------------------
  // 2. 讀取資料
  // ----------------------------------------------------------------
  useEffect(() => {
    if (user && !isOffline) {
      fetchData(false);
    }
  }, [user, isOffline]);

  const fetchData = async (forceOffline = false) => {
    setLoading(true);
    
    if (forceOffline || isOffline || !db) {
      setChecklistItems(DEFAULT_ITEMS);
      setStaffList(DEFAULT_STAFF);
      setLoading(false);
      return;
    }

    try {
      const itemsSnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/items`));
      if (itemsSnapshot.empty) {
        setChecklistItems(DEFAULT_ITEMS);
        setIsUsingDefaults(true); 
      } else {
        const loadedItems = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadedItems.sort((a, b) => a.category.localeCompare(b.category));
        setChecklistItems(loadedItems);
        setIsUsingDefaults(false);
      }

      const staffSnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/staff`));
      if (staffSnapshot.empty) {
        setStaffList(DEFAULT_STAFF);
      } else {
        const loadedStaff = staffSnapshot.docs.map(doc => doc.data().name);
        setStaffList(loadedStaff);
      }
    } catch (e) {
      console.error("資料庫讀取失敗，切換預設資料:", e);
      setChecklistItems(DEFAULT_ITEMS);
      setStaffList(DEFAULT_STAFF);
      setIsOffline(true); 
    }
    setLoading(false);
  };

  // ----------------------------------------------------------------
  // 表單操作邏輯
  // ----------------------------------------------------------------
  const handleCheck = (id) => {
    setFormData(prev => ({
      ...prev,
      checkedItems: {
        ...prev.checkedItems,
        [id]: !prev.checkedItems[id]
      }
    }));
  };

  const calculateScore = () => {
    const total = checklistItems.length;
    const checked = Object.values(formData.checkedItems).filter(Boolean).length;
    return {
      checked,
      total,
      score: total === 0 ? 0 : Math.round((checked / total) * 100),
      isPass: total === 0 ? false : checked === total
    };
  };

  const handleSubmit = async () => {
    if (!formData.staffName) {
      alert("請選擇輪值店長姓名！");
      return;
    }

    const result = calculateScore();
    const uncheckedItems = checklistItems
      .filter(item => !formData.checkedItems[item.id])
      .map(item => item.text);

    const reportData = {
      timestamp: new Date(),
      dateStr: formData.date,
      staffName: formData.staffName,
      checkerName: formData.checkerName || '本人',
      score: result.score,
      isPass: result.isPass,
      uncheckedItems: uncheckedItems,
      manualNote: formData.manualNote,
      fullCheckData: formData.checkedItems
    };

    if (isOffline || !user) {
      alert("⚠️ 離線預覽模式\n\n您的報表已生成，但因 Firebase 驗證未開啟，資料將「不會」儲存到雲端。\n\n請務必在下一步點擊「複製報表」並手動傳送。");
      setView('success');
      return;
    }

    try {
      if (db) {
        await addDoc(collection(db, `artifacts/${appId}/public/data/reports`), reportData);
        setView('success');
      }
    } catch (e) {
      console.error(e);
      alert("上傳失敗 (已轉為離線模式): " + e.message);
      setView('success'); 
    }
  };

  const copyReport = () => {
    const result = calculateScore();
    const unchecked = checklistItems.filter(item => !formData.checkedItems[item.id]);
    
    let text = `【多那之歐樂沃門市回報】\n📅 日期：${formData.date}\n👤 輪值：${formData.staffName}\n📊 分數：${result.score}分 (${result.isPass ? '合格' : '不合格'})\n`;
    
    if (unchecked.length > 0) {
      text += `\n⚠️ 缺失項目：\n${unchecked.map(i => `- ${i.text}`).join('\n')}`;
    }
    
    if (formData.manualNote) {
      text += `\n\n📝 備註/手動缺失：\n${formData.manualNote}`;
    }

    navigator.clipboard.writeText(text);
    alert("報表已複製！可直接貼到 LINE");
  };

  const exportCurrentReportToCSV = () => {
    const result = calculateScore();
    
    let csvContent = "\uFEFF"; 
    csvContent += "檢查報表詳情 (缺失檢討)\n";
    csvContent += `日期,${formData.date}\n`;
    csvContent += `輪值店長,${formData.staffName}\n`;
    csvContent += `評分人,${formData.checkerName}\n`;
    csvContent += `分數,${result.score}\n`;
    csvContent += `結果,${result.isPass ? '合格' : '不合格'}\n`;
    csvContent += `備註,${formData.manualNote.replace(/\n/g, ' ')}\n\n`;
    
    csvContent += "狀態,檢查項目,類別\n";
    
    const sortedItems = [...checklistItems].sort((a, b) => {
      const aChecked = formData.checkedItems[a.id] ? 1 : 0;
      const bChecked = formData.checkedItems[b.id] ? 1 : 0;
      return aChecked - bChecked; 
    });

    sortedItems.forEach(item => {
      const isChecked = formData.checkedItems[item.id];
      const status = isChecked ? "OK" : "❌ No"; 
      const safeText = item.text.replace(/,/g, "，"); 
      csvContent += `${status},${safeText},${item.category}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `缺失檢討表_${formData.date}_${formData.staffName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------------------
  // 後台操作邏輯 (含管理員管理)
  // ----------------------------------------------------------------
  const handleAdminLogin = async () => {
    if (!loginUser || !loginPass) {
      alert("請輸入帳號與密碼");
      return;
    }
    
    const cleanUser = loginUser.trim();
    const cleanPass = loginPass.trim();
    const isDefaultSuperAdmin = (cleanUser === DEFAULT_ADMIN.username && cleanPass === DEFAULT_ADMIN.password);

    if (isOffline || !db) {
       if (isDefaultSuperAdmin) {
         setIsAdmin(true);
         setCurrentAdminUser(cleanUser);
         setView('admin');
         alert("⚠️ 離線模式登入成功 (功能受限)");
         return;
       } else {
         alert("帳號或密碼錯誤 (離線模式僅支援預設管理員)");
         return;
       }
    }

    if (!user) {
      alert("系統正在連線中，請稍候再試...");
      return;
    }
    
    try {
      const adminRef = doc(db, `artifacts/${appId}/public/data/admins`, cleanUser);
      const docSnap = await getDoc(adminRef);

      if (docSnap.exists()) {
        const adminData = docSnap.data();
        if (adminData.password === cleanPass) {
          setIsAdmin(true);
          setCurrentAdminUser(cleanUser);
          setView('admin');
          fetchHistory();
          fetchMonthlyStats(statsMonth);
        } else {
          alert("密碼錯誤，請重新輸入");
        }
      } else {
        if (isDefaultSuperAdmin) {
           await setDoc(adminRef, { username: cleanUser, password: cleanPass, role: 'super_admin' });
           setIsAdmin(true);
           setCurrentAdminUser(cleanUser);
           setView('admin');
           fetchHistory();
           fetchMonthlyStats(statsMonth);
           alert("歡迎！已自動啟用預設管理員帳號。");
        } else {
           alert("帳號不存在，請確認輸入是否正確。");
        }
      }
    } catch (e) {
      console.error("登入錯誤:", e);
      if (isDefaultSuperAdmin) {
          setIsAdmin(true);
          setCurrentAdminUser(cleanUser);
          setView('admin');
          fetchHistory();
          fetchMonthlyStats(statsMonth);
          alert("⚠️ 連線異常，已啟用緊急權限登入。");
      } else {
          alert("登入發生錯誤，請稍後再試。");
      }
    }
  };

  const fetchAdmins = async () => {
    if (!db || !user || isOffline) return;
    try {
      const q = query(collection(db, `artifacts/${appId}/public/data/admins`));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => doc.data());
      setAdminList(list);
    } catch (e) {
      console.error("讀取管理員失敗", e);
    }
  };

  const addAdmin = async () => {
    if (!newAdminUser || !newAdminPass) {
      alert("請輸入完整的帳號與密碼");
      return;
    }
    if (isOffline) { alert("離線模式無法新增管理員"); return; }
    
    const cleanUser = newAdminUser.trim();
    const cleanPass = newAdminPass.trim();

    try {
      const adminRef = doc(db, `artifacts/${appId}/public/data/admins`, cleanUser);
      const docSnap = await getDoc(adminRef);
      if (docSnap.exists()) {
        alert("此管理員帳號已存在");
        return;
      }

      await setDoc(adminRef, { username: cleanUser, password: cleanPass });
      alert(`管理員 ${cleanUser} 新增成功`);
      setNewAdminUser('');
      setNewAdminPass('');
      fetchAdmins();
    } catch (e) {
      alert("新增失敗: " + e.message);
    }
  };

  const deleteAdmin = async (targetUsername) => {
    if (adminList.length <= 1) {
      alert("系統必須保留至少一位管理員，無法刪除！");
      return;
    }

    if (!confirm(`確定要刪除管理員 ${targetUsername} 嗎？此操作無法復原。`)) return;
    
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/admins`, targetUsername));
      
      if (targetUsername === currentAdminUser) {
        alert("您已刪除自己的帳號，將自動登出。");
        setIsAdmin(false);
        setCurrentAdminUser('');
        setView('form');
        setLoginUser('');
        setLoginPass('');
      } else {
        alert("刪除成功");
        fetchAdmins(); 
      }
    } catch (e) {
      alert("刪除失敗: " + e.message);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab, isAdmin]);

  const fetchHistory = async () => {
    if (!db || !user || isOffline) return;
    try {
      const q = query(collection(db, `artifacts/${appId}/public/data/reports`), orderBy("timestamp", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryLogs(logs);
    } catch (e) {
      console.error("歷史讀取失敗", e);
    }
  };

  const fetchMonthlyStats = async (monthStr) => {
    if (!db || !user || isOffline) return;
    const startStr = `${monthStr}-01`;
    const endStr = `${monthStr}-31`;
    try {
      const q = query(
        collection(db, `artifacts/${appId}/public/data/reports`),
        where("dateStr", ">=", startStr),
        where("dateStr", "<=", endStr)
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => doc.data());
      const statsMap = {};
      reports.forEach(r => {
        const name = r.staffName;
        if (!statsMap[name]) {
          statsMap[name] = { name, total: 0, fail: 0, pass: 0, itemsMissed: 0 };
        }
        statsMap[name].total += 1;
        if (r.isPass) statsMap[name].pass += 1;
        else statsMap[name].fail += 1;
        if (r.uncheckedItems && Array.isArray(r.uncheckedItems)) {
          statsMap[name].itemsMissed += r.uncheckedItems.length;
        }
      });
      const statsArray = Object.values(statsMap).sort((a, b) => b.fail - a.fail);
      setMonthlyStats(statsArray);
    } catch (e) {
      console.error("統計讀取失敗", e);
    }
  };

  // Fetch Threshold Setting
  const fetchThreshold = async () => {
    if (!db || !user || isOffline) return;
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/settings`, 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFailureThreshold(docSnap.data().failureThreshold || 3);
      }
    } catch (e) {
      console.error("讀取設定失敗", e);
    }
  };

  // Save Threshold Setting
  const saveThreshold = async () => {
    if (isOffline) {
      alert("離線模式無法儲存設定");
      return;
    }
    try {
      await setDoc(doc(db, `artifacts/${appId}/public/data/settings`, 'config'), {
        failureThreshold: Number(failureThreshold)
      }, { merge: true });
      alert("✅ 考核標準已更新！");
    } catch (e) {
      alert("儲存失敗: " + e.message);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'stats') {
      fetchMonthlyStats(statsMonth);
      fetchThreshold();
    }
  }, [statsMonth, activeTab, isAdmin]);

  // Staff functions
  const addStaff = async () => {
    if (!newStaffName) return;
    if (isOffline) {
      setStaffList([...staffList, newStaffName]);
      setNewStaffName('');
      alert("離線模式：已暫時新增");
      return;
    }
    if (staffList.includes(newStaffName)) {
      alert("名字已存在");
      return;
    }
    try {
      await setDoc(doc(db, `artifacts/${appId}/public/data/staff`, newStaffName), { name: newStaffName });
      setStaffList([...staffList, newStaffName]);
      setNewStaffName('');
    } catch (e) {
      alert("新增失敗: " + e.message);
    }
  };

  const removeStaff = async (name) => {
    if (!confirm(`確定刪除 ${name}?`)) return;
    if (isOffline) {
      setStaffList(staffList.filter(n => n !== name));
      return;
    }
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/staff`, name));
      setStaffList(staffList.filter(n => n !== name));
    } catch (e) {
      alert("刪除失敗: " + e.message);
    }
  };

  // Staff Editing
  const startEditStaff = (name) => {
    setEditingStaffOldName(name);
    setEditingStaffNewName(name);
  };

  const cancelEditStaff = () => {
    setEditingStaffOldName(null);
    setEditingStaffNewName('');
  };

  const saveEditStaff = async () => {
    if (!editingStaffNewName || editingStaffNewName === editingStaffOldName) {
      cancelEditStaff();
      return;
    }
    if (staffList.includes(editingStaffNewName)) {
      alert("此名稱已存在！");
      return;
    }

    if (isOffline) {
      setStaffList(staffList.map(n => n === editingStaffOldName ? editingStaffNewName : n));
      cancelEditStaff();
      return;
    }

    try {
      // 1. Create new doc
      await setDoc(doc(db, `artifacts/${appId}/public/data/staff`, editingStaffNewName), { name: editingStaffNewName });
      // 2. Delete old doc
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/staff`, editingStaffOldName));
      
      // Update local state
      setStaffList(staffList.map(n => n === editingStaffOldName ? editingStaffNewName : n));
      cancelEditStaff();
    } catch (e) {
      alert("修改失敗: " + e.message);
    }
  };

  const addItem = async () => {
    if (!newItemText) return;
    if (isOffline) {
      const newItem = { id: Date.now().toString(), text: newItemText, category: newItemCategory };
      setChecklistItems([...checklistItems, newItem]);
      setNewItemText('');
      alert("離線模式：已暫時新增");
      return;
    }
    try {
      const newItem = { text: newItemText, category: newItemCategory };
      const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/items`), newItem);
      setChecklistItems([...checklistItems, { id: docRef.id, ...newItem }]);
      setNewItemText('');
      alert("✅ 已新增並儲存項目！");
    } catch (e) {
      alert("新增失敗");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingText(item.text || '');
    setEditingCategory(item.category || DEFAULT_CATEGORIES[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingCategory('');
  };

  const saveEdit = async (id) => {
    if (!editingText.trim()) {
      alert("⚠️ 請輸入檢查項目內容，不能為空白。");
      return;
    }
    
    // 離線模式處理
    if (isOffline) {
       setChecklistItems(checklistItems.map(item => 
         item.id === id ? { ...item, text: editingText, category: editingCategory } : item
       ));
       cancelEdit();
       return;
    }

    if (!db) { alert("資料庫連線異常"); return; }
    
    try {
      const itemRef = doc(db, `artifacts/${appId}/public/data/items`, id);
      // 使用 setDoc + merge: true 來處理「更新」或「建立(若不存在)」
      await setDoc(itemRef, { 
        text: editingText, 
        category: editingCategory 
      }, { merge: true });
      
      // 更新本地狀態
      setChecklistItems(checklistItems.map(item => 
         item.id === id ? { ...item, text: editingText, category: editingCategory } : item
      ));
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("儲存失敗: " + e.message);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("確定刪除此檢查項目?")) return;
    if (isOffline) {
      setChecklistItems(checklistItems.filter(item => item.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/items`, id));
      setChecklistItems(checklistItems.filter(item => item.id !== id));
    } catch (e) {
      alert("刪除失敗");
    }
  };

  const initDefaultData = async () => {
    if (isOffline) { alert("離線模式無法寫入資料庫"); return; }
    if(!confirm("確定要將現有的預設資料寫入資料庫嗎？")) return;
    
    setLoading(true);
    try {
      // 寫入員工
      for (const s of DEFAULT_STAFF) {
        await setDoc(doc(db, `artifacts/${appId}/public/data/staff`, s), { name: s });
      }
      // 寫入項目 (使用 ID 作為 doc ID 以防重複)
      for (const item of DEFAULT_ITEMS) {
         await setDoc(doc(db, `artifacts/${appId}/public/data/items`, item.id), item);
      }
      alert("✅ 資料庫初始化完成！現在所有項目皆可正常編輯與儲存。");
      setIsUsingDefaults(false); // 更新狀態
      // 重新讀取確保同步
      fetchData();
    } catch (e) {
      alert("初始化失敗: " + e.message);
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // UI Render
  // ----------------------------------------------------------------
  
  const Header = () => (
    <div className="bg-gray-900 text-[#c5a065] p-5 text-center border-b-4 border-[#c5a065] shadow-md relative">
      <img src="https://i.postimg.cc/632Hw4rR/LOGO.png" alt="LOGO" className="h-16 mx-auto mb-3" />
      <h1 className="text-xl font-bold tracking-wider">歐樂沃城堡門市</h1>
      <div className="flex items-center justify-center gap-2 mt-1">
        <p className="text-xs text-gray-400">SOP 執行與考核系統</p>
        {isOffline && (
          <span className="flex items-center text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded border border-red-700 animate-pulse">
            <WifiOff size={10} className="mr-1"/> 離線模式
          </span>
        )}
      </div>
      
      {!isAdmin && view === 'form' && (
        <button 
          onClick={() => setView('login')} 
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
        >
          <Settings size={20} />
        </button>
      )}
      {isAdmin && (
        <button 
          onClick={() => { setIsAdmin(false); setView('form'); setLoginUser(''); setLoginPass(''); }} 
          className="absolute top-4 right-4 text-red-500 flex items-center gap-1 text-sm font-bold bg-gray-800 px-3 py-1 rounded"
        >
          <LogOut size={16} /> 登出後台
        </button>
      )}
    </div>
  );

  if (loading && !checklistItems.length) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-[#c5a065] font-bold">載入中...</div>;

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">後台管理登入</h2>
          {isOffline && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm text-yellow-800">
              <p className="font-bold">⚠️ 注意：目前為離線模式</p>
              <p>後台修改不會儲存。預設管理員帳號：{DEFAULT_ADMIN.username} / {DEFAULT_ADMIN.password}</p>
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">管理員帳號</label>
              <input 
                type="text" 
                placeholder="請輸入帳號" 
                className="w-full p-3 border rounded text-lg"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">登入密碼</label>
              <input 
                type="password" 
                placeholder="請輸入密碼" 
                className="w-full p-3 border rounded text-lg"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setView('form')} className="flex-1 bg-gray-300 py-3 rounded text-gray-700 font-bold">返回</button>
            <button onClick={handleAdminLogin} className="flex-1 bg-[#c5a065] py-3 rounded text-white font-bold hover:bg-[#b08d55]">登入系統</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 pb-20">
        <Header />
        <div className="max-w-4xl mx-auto mt-6 px-4">
          
          <div className="flex bg-white rounded-lg shadow mb-6 overflow-x-auto">
             <button 
              onClick={() => setActiveTab('items')}
              className={`flex-1 py-4 px-4 text-center font-bold whitespace-nowrap ${activeTab === 'items' ? 'bg-[#c5a065] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ClipboardList className="inline md:mx-2 mb-1" size={18}/> 檢查項目
            </button>
             <button 
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-4 px-4 text-center font-bold whitespace-nowrap ${activeTab === 'stats' ? 'bg-[#c5a065] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <BarChart3 className="inline md:mx-2 mb-1" size={18}/> 月度統計
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-4 px-4 text-center font-bold whitespace-nowrap ${activeTab === 'staff' ? 'bg-[#c5a065] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <User className="inline md:mx-2 mb-1" size={18}/> 員工管理
            </button>
            <button 
              onClick={() => setActiveTab('admins')}
              className={`flex-1 py-4 px-4 text-center font-bold whitespace-nowrap ${activeTab === 'admins' ? 'bg-[#c5a065] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Shield className="inline md:mx-2 mb-1" size={18}/> 管理員設定
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-4 text-center font-bold whitespace-nowrap ${activeTab === 'history' ? 'bg-[#c5a065] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <History className="inline md:mx-2 mb-1" size={18}/> 歷史紀錄
            </button>
          </div>

          {activeTab === 'items' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4 border-l-4 border-[#c5a065] pl-3">新增檢查項目</h3>
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <select 
                  className="p-2 border rounded md:w-1/4"
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                >
                  {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                  type="text" 
                  placeholder="輸入新的規定內容..." 
                  className="flex-1 p-2 border rounded"
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                />
                <button 
                  onClick={addItem}
                  className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus size={18}/> 新增
                </button>
              </div>

              {/* 預設資料提示按鈕 */}
              {isUsingDefaults && !isOffline && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center text-yellow-800 text-sm">
                    <Database size={18} className="mr-2"/>
                    <span>目前顯示為系統預設資料，尚未寫入資料庫。請先寫入才能確保編輯功能正常。</span>
                  </div>
                  <button 
                    onClick={initDefaultData}
                    className="bg-yellow-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-yellow-700 shadow-sm"
                  >
                    寫入預設資料
                  </button>
                </div>
              )}
              
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 border border-gray-100">
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-2 w-full">
                          <div className="flex gap-2">
                            <select 
                              className="p-1 border rounded text-sm w-1/3"
                              value={editingCategory}
                              onChange={e => setEditingCategory(e.target.value)}
                            >
                               {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input 
                              type="text" 
                              className="flex-1 p-1 border rounded text-sm"
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => saveEdit(item.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center"><Save size={12} className="mr-1"/> 儲存</button>
                              <button type="button" onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded text-xs flex items-center"><X size={12} className="mr-1"/> 取消</button>
                          </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-[#c5a065] bg-gray-800 px-2 py-1 rounded mr-2">{item.category}</span>
                          <span className="text-sm text-gray-700">{item.text}</span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button type="button" onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-full" title="編輯">
                            <Pencil size={16}/>
                          </button>
                          <button type="button" onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-full" title="刪除">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold border-l-4 border-[#c5a065] pl-3">員工缺失統計表</h3>
                <div className="flex items-center gap-2">
                  <label className="font-bold text-gray-700">月份：</label>
                  <input 
                    type="month" 
                    value={statsMonth}
                    onChange={(e) => setStatsMonth(e.target.value)}
                    className="p-2 border rounded font-bold text-gray-700"
                  />
                </div>
              </div>

              {/* 新增：考核標準設定 */}
              <div className="mb-6 p-4 bg-gray-50 border rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center text-gray-800">
                  <Target size={20} className="mr-2 text-[#c5a065]"/>
                  <span className="font-bold">考核標準設定：</span>
                  <span className="ml-2 text-sm text-gray-600">當月「不合格」次數達到</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    className="w-20 p-2 border rounded text-center font-bold"
                    value={failureThreshold}
                    onChange={(e) => setFailureThreshold(e.target.value)}
                  />
                  <span className="text-sm text-gray-600">次(含)以上，即取消資格。</span>
                  <button 
                    onClick={saveThreshold}
                    className="bg-[#c5a065] text-white px-4 py-2 rounded font-bold hover:bg-[#b08d55] text-sm ml-2"
                  >
                    儲存設定
                  </button>
                </div>
              </div>

              {monthlyStats.length === 0 ? (
                <div className="text-center py-10 text-gray-400">該月份尚無檢查紀錄</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 border-b-2 border-[#c5a065]">
                        <th className="p-3">姓名</th>
                        <th className="p-3 text-center">檢查總數</th>
                        <th className="p-3 text-center text-green-600">合格次數</th>
                        <th className="p-3 text-center text-red-600">不合格次數</th>
                        <th className="p-3 text-center text-red-800">總缺失項數</th>
                        <th className="p-3 text-center">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((stat) => {
                        const isDisqualified = stat.fail >= failureThreshold;
                        return (
                          <tr key={stat.name} className={`border-b hover:bg-gray-50 ${isDisqualified ? 'bg-red-50' : ''}`}>
                            <td className="p-3 font-bold">{stat.name}</td>
                            <td className="p-3 text-center">{stat.total}</td>
                            <td className="p-3 text-center font-bold text-green-600">{stat.pass}</td>
                            <td className={`p-3 text-center font-bold ${isDisqualified ? 'text-red-600 text-lg' : 'text-gray-600'}`}>{stat.fail}</td>
                            <td className="p-3 text-center font-bold text-red-800 bg-black/5 rounded">{stat.itemsMissed}</td>
                            <td className="p-3 text-center">
                              {isDisqualified ? (
                                <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded font-bold animate-pulse">⚠️ 考核未過</span>
                              ) : (
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">✅ 正常</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4 text-xs text-gray-500">
                    * 「不合格次數」指總分未達 100% 的次數。<br/>
                    * 「總缺失項數」為該月所有檢查表中未勾選項目的總和。
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4 border-l-4 border-[#c5a065] pl-3">員工名單管理</h3>
              <div className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  placeholder="輸入員工姓名..." 
                  className="flex-1 p-2 border rounded"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                />
                <button 
                  onClick={addStaff}
                  className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
                >
                  新增
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {staffList.map((name) => (
                  <div key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                    {editingStaffOldName === name ? (
                      <div className="flex gap-2 w-full">
                        <input 
                          type="text"
                          className="flex-1 p-1 border rounded text-sm"
                          value={editingStaffNewName}
                          onChange={e => setEditingStaffNewName(e.target.value)}
                        />
                        <button type="button" onClick={saveEditStaff} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={16}/></button>
                        <button type="button" onClick={cancelEditStaff} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-gray-700">{name}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => startEditStaff(name)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                          <button type="button" onClick={() => removeStaff(name)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 新增：管理員管理分頁 */}
          {activeTab === 'admins' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4 border-l-4 border-[#c5a065] pl-3">管理員權限設定</h3>
              <div className="bg-blue-50 p-4 rounded mb-6 text-sm text-blue-800">
                <Shield size={16} className="inline mr-1 mb-1"/> 
                此處可新增能登入後台的人員。請妥善保管帳號密碼。
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-gray-50 rounded border">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">新管理員帳號</label>
                  <input 
                    type="text" 
                    placeholder="User ID" 
                    className="w-full p-2 border rounded"
                    value={newAdminUser}
                    onChange={e => setNewAdminUser(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">設定密碼</label>
                  <input 
                    type="text" 
                    placeholder="Password" 
                    className="w-full p-2 border rounded"
                    value={newAdminPass}
                    onChange={e => setNewAdminPass(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                   <button 
                    onClick={addAdmin}
                    className="bg-[#c5a065] text-white px-6 py-2 rounded font-bold hover:bg-[#b08d55] w-full md:w-auto"
                  >
                    <Plus size={18} className="inline mr-1"/> 新增
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-gray-700 mb-3">現有管理員列表</h4>
              <div className="space-y-2">
                {adminList.map((admin) => (
                  <div key={admin.username} className="flex justify-between items-center p-3 bg-white border rounded hover:bg-gray-50 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 p-2 rounded-full"><Key size={16} className="text-gray-600"/></div>
                      <span className="font-bold text-gray-800">{admin.username}</span>
                      {admin.username === currentAdminUser && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">目前登入</span>
                      )}
                    </div>
                     <button onClick={() => deleteAdmin(admin.username)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded" title="刪除權限">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {adminList.length === 0 && <div className="text-gray-400 text-center py-4">載入中...</div>}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4 border-l-4 border-[#c5a065] pl-3">近期檢查紀錄 (最新20筆)</h3>
              {isOffline ? (
                 <div className="text-center py-10 text-gray-500 bg-gray-50 rounded">
                   <WifiOff size={48} className="mx-auto mb-2 text-gray-300"/>
                   <p>離線模式無法讀取雲端歷史紀錄</p>
                 </div>
              ) : (
                <div className="space-y-4">
                  {historyLogs.map((log) => (
                    <div key={log.id} className={`p-4 rounded-lg border-l-4 ${log.isPass ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-lg">{log.dateStr} - {log.staffName}</div>
                          <div className="text-sm text-gray-500">評分者: {log.checkerName}</div>
                        </div>
                        <div className={`text-xl font-bold ${log.isPass ? 'text-green-700' : 'text-red-600'}`}>
                          {log.score}分
                        </div>
                      </div>
                      {log.uncheckedItems && log.uncheckedItems.length > 0 && (
                        <div className="mt-2 text-sm text-gray-700 bg-white/50 p-2 rounded">
                          <strong className="text-red-500">缺失：</strong>
                          <ul className="list-disc list-inside">
                            {log.uncheckedItems.map((u, i) => <li key={i}>{u}</li>)}
                          </ul>
                        </div>
                      )}
                       {log.manualNote && (
                        <div className="mt-2 text-sm text-gray-600 italic border-t pt-1 border-gray-200">
                          備註：{log.manualNote}
                        </div>
                      )}
                    </div>
                  ))}
                  {historyLogs.length === 0 && <div className="text-gray-500 text-center py-10">尚無紀錄</div>}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-20 px-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          {isOffline ? (
             <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={48} className="text-yellow-600" />
             </div>
          ) : (
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle size={48} className="text-green-600" />
             </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isOffline ? "報表已生成 (離線)" : "評分已送出！"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isOffline ? "因未連接雲端，請務必點擊下方按鈕複製內容。" : "資料已安全儲存至雲端。"}
          </p>
          
          <button onClick={copyReport} className="w-full bg-[#c5a065] text-white py-3 rounded font-bold mb-3 hover:bg-[#b08d55] transition">
            <ClipboardList className="inline mr-2" size={18}/>
            複製內容 (貼到 LINE)
          </button>
          
          <button onClick={exportCurrentReportToCSV} className="w-full bg-green-600 text-white py-3 rounded font-bold mb-3 hover:bg-green-700 transition">
             <Download className="inline mr-2" size={18}/>
             下載
          </button>

          <button onClick={() => {
            setFormData({ ...formData, checkedItems: {}, manualNote: '' });
            setView('form');
          }} className="w-full bg-gray-200 text-gray-700 py-3 rounded font-bold">
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header />
      
      <div className="max-w-2xl mx-auto mt-6 px-4">
        {isOffline && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4 text-sm flex items-center">
            <WifiOff size={16} className="mr-2 flex-shrink-0" />
            <div>
              <strong>系統處於離線演示模式</strong>
              <br/>
              您可以正常操作並複製報表，但資料不會儲存到資料庫。(請檢查 Firebase Console 設定)
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-5 mb-4 border-t-4 border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">檢查日期</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded focus:border-[#c5a065] outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">輪值店長 (受評者)</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded focus:border-[#c5a065] outline-none bg-white"
                value={formData.staffName}
                onChange={e => setFormData({...formData, staffName: e.target.value})}
              >
                <option value="">-- 請選擇人員 --</option>
                {staffList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-bold text-gray-700 mb-1">評分人員</label>
               <input 
                type="text" 
                placeholder="請輸入您的姓名"
                className="w-full p-2 border border-gray-300 rounded focus:border-[#c5a065] outline-none"
                value={formData.checkerName}
                onChange={e => setFormData({...formData, checkerName: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {DEFAULT_CATEGORIES.map(category => {
            const items = checklistItems.filter(i => i.category === category);
            if(items.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-l-4 border-[#c5a065] font-bold text-gray-800 flex items-center">
                  <FileText size={18} className="mr-2 text-[#c5a065]"/>
                  {category}
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleCheck(item.id)}
                      className={`flex items-start p-4 cursor-pointer transition-colors hover:bg-gray-50 ${!formData.checkedItems[item.id] ? 'bg-red-50/30' : ''}`}
                    >
                      <div className={`mt-0.5 w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-all ${formData.checkedItems[item.id] ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                        {formData.checkedItems[item.id] && <CheckCircle size={16} className="text-white" />}
                      </div>
                      <div className={`ml-3 text-sm leading-relaxed ${!formData.checkedItems[item.id] ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 mt-6 border-t-4 border-red-400">
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
            <AlertTriangle size={16} className="text-red-500 mr-2" />
            其他缺失 / 手動備註
          </label>
          <textarea 
            className="w-full p-3 border border-gray-300 rounded h-24 focus:border-red-400 outline-none resize-none"
            placeholder="若有表單上沒有的缺失，請在此輸入..."
            value={formData.manualNote}
            onChange={e => setFormData({...formData, manualNote: e.target.value})}
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full mt-8 bg-[#1a1a1a] text-[#c5a065] py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-black transition-transform transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Save size={24} />
          完成評分並上傳
        </button>
        
        <div className="text-center text-gray-400 text-xs mt-4 mb-10">
          &copy; Donutes Olowo Castle - System v2.0
        </div>
      </div>
    </div>
  );
}