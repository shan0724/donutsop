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
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { 
  Settings, 
  Trash2, 
  History, 
  ClipboardList, 
  BarChart3, 
  X, 
  Check, 
  Coins, 
  Send,
  Users,
  Download,
  DollarSign,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  AlertCircle,
  Key
} from 'lucide-react';

// ------------------------------------------------------------------
// Firebase 配置
// ------------------------------------------------------------------
const getApiKey = () => {
  try {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) 
      || "AIzaSyCT5JS5VRx4HaAkjPuEgm-CPaqn4sjY9NY";
  } catch (e) {
    return "AIzaSyCT5JS5VRx4HaAkjPuEgm-CPaqn4sjY9NY";
  }
};

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: getApiKey(),
      authDomain: "donutsop-e207c.firebaseapp.com",
      projectId: "donutsop-e207c",
      storageBucket: "donutsop-e207c.firebasestorage.app",
      messagingSenderId: "1052194354902",
      appId: "1:1052194354902:web:d5524c0d2583769c6d3b77"
    };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'donutes-olowo-castle';

// ------------------------------------------------------------------
// 常數與名單
// ------------------------------------------------------------------
const DEFECT_PAGES = ["吧檯", "外場", "櫃台", "缺失"]; 
const DUTY_PAGES = ["值班經理能力", "個人職能表現", "業績與KPI達成"]; 
const DEFAULT_CATEGORIES = [...DEFECT_PAGES, ...DUTY_PAGES];

const DEFAULT_STAFF = ["芳玟", "宣如", "葦芸", "思榆"];
const INITIAL_ADMIN = { username: "himmel0724", password: "angel0724" };
const LOGO_URL = "https://i.postimg.cc/Yqkyt94q/352653153_1294597047840225_8043764672305305974_n.jpg";

const DEFAULT_ITEMS = [
  { id: 'b1', text: '12/26起飲料沒有貼標籤不準出杯', category: '吧檯' },
  { id: 'b2', text: '先貼標籤再製作，避免重複飲料', category: '吧檯' },
  { id: 'b3', text: '紅茶與烏龍一律用蒸氣棒加熱到滾', category: '吧檯' },
  { id: 'b4', text: '洗桶子時請把貼紙撕掉', category: '吧檯' },
  { id: 'b5', text: '開封日期跟有效日期更新', category: '吧檯' },
  { id: 'b6', text: '冰淇淋餅乾拿完蓋子馬上蓋起來', category: '吧檯' },
  { id: 'b7', text: '保久乳紙箱分類與塑膠套撕除', category: '吧檯' },
  { id: 'f1', text: '小蛋盤一律擦完撕下色豆再收', category: '外場' },
  { id: 'f2', text: '乾貨進貨請當日歸貨完', category: '外場' },
  { id: 'f3', text: '拆封紙箱四邊割掉', category: '外場' },
  { id: 'c1', text: '正確選擇多那之登入', category: '櫃台' },
  { id: 'c2', text: '發票號碼低於100號提早告知', category: '櫃台' },
  { id: 'c3', text: '假日落實各站一台收銀機與正確交班', category: '櫃台' },
  { id: 'e1', text: '個人儀容(指甲/飾品/制服/口罩)不符規定', category: '缺失' },
  { id: 'm1', text: '店內營運協調與排班管理', category: '值班經理能力', value: 1000 },
  { id: 'm2', text: '危機處理與即時決策', category: '值班經理能力', value: 1000 },
  { id: 'm3', text: '店內整潔與流程維持', category: '值班經理能力', value: 1000 },
  { id: 'm4', text: '顧客關係維護與現場氛圍營造', category: '值班經理能力', value: 1000 },
  { id: 'm5_1', text: '門市庫存檢視(確實下單物料相關物料)', category: '值班經理能力', value: 1000 },
  { id: 'm5_2', text: '門市安庫調整(安庫數量視淡旺季調整)', category: '值班經理能力', value: 1000 },
  { id: 'm6', text: '每日業績&事項匯報', category: '值班經理能力', value: 1500 },
  { id: 'p1', text: '專業技能熟練度', category: '個人職能表現', value: 1000 },
  { id: 'p2', text: '主動性與責任感', category: '個人職能表現', value: 1000 },
  { id: 'k1', text: '麵包下架率控管(3.0%~5.0%)', category: '業績與KPI達成', value: 1000 },
  { id: 'k2', text: '慕斯蛋糕下架率控管(1.0%~3.0%)', category: '業績與KPI達成', value: 1000 },
  { id: 'k3', text: '人事成本管控 (人事成本 < 14.0%)', category: '業績與KPI達成', value: 1500 },
  { id: 'k4', text: '進階人事成本管控 (人事成本 < 12.0%)', category: '業績與KPI達成', value: 2000 },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('check'); 
  const [view, setView] = useState('main'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSubmitType, setLastSubmitType] = useState(''); 
  
  const [staffList, setStaffList] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [adminList, setAdminList] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substr(0, 10),
    staffName: '',
    checkedItems: {}, 
    manualNote: '',
  });

  const [activeTab, setActiveTab] = useState('stats'); 
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [historyLogs, setHistoryLogs] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [statsMonth, setStatsMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newStaffName, setNewStaffName] = useState('');
  const [filterStaff, setFilterStaff] = useState('all');
  
  // 新增管理員相關 State
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  const [isStaffEditMode, setIsStaffEditMode] = useState(false);
  const [isItemEditMode, setIsItemEditMode] = useState(false);

  const [newItemText, setNewItemText] = useState('');
  const [newItemCat, setNewItemCat] = useState('吧檯');
  const [newItemValue, setNewItemValue] = useState(1000);

  // 自訂 Confirm Modal 狀態
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Toast 狀態
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // --- 初始化手機圖示與標題 ---
  useEffect(() => {
    document.title = "多那之歐樂沃城堡門市";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/jpeg';
    link.rel = 'apple-touch-icon';
    link.href = LOGO_URL;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  // --- 身份驗證 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Firebase Auth Fail:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- 資料同步 ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubAdmins = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'admins'), (snap) => {
      if (snap.empty) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', INITIAL_ADMIN.username), INITIAL_ADMIN);
      } else {
        setAdminList(snap.docs.map(d => d.data()));
      }
    });

    const unsubItems = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'items'), (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_ITEMS.forEach(item => {
           const ref = doc(db, 'artifacts', appId, 'public', 'data', 'items', item.id);
           batch.set(ref, item);
        });
        batch.commit();
        setChecklistItems(DEFAULT_ITEMS);
      }
      else {
        setChecklistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    });

    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_STAFF.forEach(name => {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'staff', name);
          batch.set(ref, { name });
        });
        batch.commit();
      } else {
        setStaffList(snap.docs.map(d => d.data().name));
      }
    });

    return () => { unsubAdmins(); unsubItems(); unsubStaff(); };
  }, [user]);

  // --- 後台彙整 ---
  useEffect(() => {
    if (isAdmin && user) {
      const unsubReports = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), (snap) => {
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const monthFiltered = raw.filter(r => r.dateStr && r.dateStr.startsWith(statsMonth));
        const historyData = filterStaff === 'all' ? monthFiltered : monthFiltered.filter(r => r.staffName === filterStaff);
        setHistoryLogs(historyData.sort((a, b) => b.timestamp - a.timestamp));
        const map = {};
        monthFiltered.forEach(r => {
          if (!map[r.staffName]) map[r.staffName] = { name: r.staffName, defects: 0, pay: 0, reports: 0, defectDetail: {} };
          map[r.staffName].reports += 1;
          map[r.staffName].defects += (r.defectCount || 0);
          map[r.staffName].pay += (r.totalAmount || 0);
          if (r.type === 'check' && r.uncheckedItems) {
            r.uncheckedItems.forEach(it => { map[r.staffName].defectDetail[it] = (map[r.staffName].defectDetail[it] || 0) + 1; });
          }
        });
        setMonthlyStats(Object.values(map).sort((a, b) => b.defects - a.defects));
      });
      return () => unsubReports();
    }
  }, [isAdmin, user, statsMonth, filterStaff]);

  // --- 報表匯出 ---
  const exportData = (exportType) => {
    let csvContent = "\uFEFF"; 
    let fileName = "";
    const staffData = filterStaff !== 'all' ? monthlyStats.find(s => s.name === filterStaff) : null;
    if (exportType === 'staff_defects' && filterStaff !== 'all') {
      fileName = `${statsMonth}_${filterStaff}_查核分析.csv`;
      csvContent += `員工,${filterStaff}\n月份,${statsMonth}\n累計項數,${staffData?.defects || 0}\n\n缺失熱點排行\n項目,次數\n`;
      Object.entries(staffData?.defectDetail || {}).sort((a,b)=>b[1]-a[1]).forEach(([it, co]) => { csvContent += `"${it}",${co}\n`; });
    } else if (exportType === 'boss_bonus' && filterStaff !== 'all') {
      fileName = `${statsMonth}_${filterStaff}_加給報表.csv`;
      csvContent += `人員,${filterStaff}\n月份,${statsMonth}\n總獎金,$${staffData?.pay || 0}\n\n明細\n日期,達成數,金額,備註\n`;
      historyLogs.filter(l => l.type === 'duty').forEach(log => { csvContent += `${log.dateStr},${log.dutyCount},${log.totalAmount},"${log.manualNote || ''}"\n`; });
    } else {
      fileName = `${statsMonth}_全體彙整表.csv`;
      csvContent += `月份,${statsMonth}\n\n姓名,次數,查核,加給\n`;
      monthlyStats.forEach(s => { csvContent += `${s.name},${s.reports},${s.defects},${s.pay}\n`; });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheck = (id) => {
    setFormData(prev => ({ ...prev, checkedItems: { ...prev.checkedItems, [id]: !prev.checkedItems[id] } }));
  };

  const handleSubmit = async (type) => {
    if (!user) return;
    if (!formData.staffName) { showToast(`請選擇對象`, 'error'); return; }
    const isCheck = type === 'check';
    const items = checklistItems.filter(i => (isCheck ? DEFECT_PAGES : DUTY_PAGES).includes(i.category) && formData.checkedItems[i.id]);
    const report = {
      type,
      timestamp: new Date(),
      dateStr: formData.date,
      staffName: formData.staffName,
      defectCount: isCheck ? items.length : 0,
      uncheckedItems: isCheck ? items.map(i => i.text) : [],
      dutyCount: !isCheck ? items.length : 0,
      totalAmount: !isCheck ? items.reduce((s, i) => s + (i.value || 0), 0) : 0,
      manualNote: formData.manualNote
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), report);
      setLastSubmitType(type);
      setView('success');
    } catch (e) { showToast("發送失敗", 'error'); }
  };

  const Header = () => (
    <div className="bg-[#1a1a1a] text-[#c5a065] p-5 text-center border-b-4 border-[#c5a065] shadow-md sticky top-0 z-[50] safe-top">
      <h1 className="text-xl font-bold tracking-widest text-white font-serif mb-0.5 uppercase">多那之歐樂沃城堡門市</h1>
      <p className="text-[10px] text-[#c5a065] tracking-[0.2em] font-bold uppercase opacity-80">
        {view === 'admin' ? 'Management Dashboard' : (page === 'check' ? '查核系統' : '輪值評分系統')}
      </p>
      {view === 'main' && <button onClick={() => setView('login')} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-gray-500 hover:text-white transition-all"><Settings size={22} /></button>}
      {view === 'admin' && <button onClick={() => { setIsAdmin(false); setView('main'); setFilterStaff('all'); }} className="absolute top-1/2 -translate-y-1/2 right-4 bg-red-900/30 text-red-500 px-3 py-1 rounded-full text-xs font-black border border-red-900/20 active:scale-95 transition-all">登出</button>}
    </div>
  );

  // --- 自訂 Confirm Modal Component ---
  const ConfirmDialog = () => {
    if (!confirmModal.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 text-center transform transition-all scale-100">
          <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-black text-gray-800 mb-2">{confirmModal.title}</h3>
          <p className="text-gray-500 text-sm mb-6 font-bold">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button onClick={closeConfirm} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-sm active:scale-95 transition-transform">
              取消
            </button>
            <button 
              onClick={async () => {
                await confirmModal.onConfirm();
                closeConfirm();
              }} 
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-sm shadow-lg active:scale-95 transition-transform"
            >
              確認刪除
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Toast Component ---
  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[250] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300 font-bold text-sm ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
        {toast.type === 'error' ? <AlertCircle size={18}/> : <Check size={18}/>}
        {toast.message}
      </div>
    );
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <img src={LOGO_URL} className="w-16 h-16 rounded-full animate-pulse shadow-xl" alt="Loading" />
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header />
        <ToastNotification />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl text-center border">
            <img src={LOGO_URL} className="w-20 h-20 rounded-full mx-auto mb-6 shadow-xl" alt="Logo" />
            <h2 className="text-xl font-black mb-8 text-gray-800">身分權限驗證</h2>
            <div className="space-y-4">
              <input type="text" placeholder="管理者帳號" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold" value={loginUser} onChange={e=>setLoginUser(e.target.value)} />
              <input type="password" placeholder="密碼" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold" value={loginPass} onChange={e=>setLoginPass(e.target.value)} />
              <button onClick={() => {
                const found = adminList.find(a => a.username === loginUser && a.password === loginPass);
                if (found) { setIsAdmin(true); setView('admin'); } else { showToast("帳號或密碼錯誤", 'error'); }
              }} className="w-full py-4 bg-[#c5a065] text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all">登入系統</button>
              <button onClick={()=>setView('main')} className="w-full py-2 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors">返回</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    const staffStats = filterStaff !== 'all' ? monthlyStats.find(s => s.name === filterStaff) : null;
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        <Header />
        <ConfirmDialog />
        <ToastNotification />
        <div className="max-w-4xl mx-auto mt-6 px-4 space-y-4">
          <div className="flex bg-white rounded-2xl shadow-md p-1 border overflow-x-auto gap-1">
            {[{id:'stats', label:'數據統計', icon: BarChart3}, {id:'staff', label:'員工管理', icon: Users}, {id:'items', label:'標準維護', icon: ClipboardList}, {id:'admins', label:'帳號權限', icon: ShieldCheck}, {id:'history', label:'報表歷史', icon: History}].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsStaffEditMode(false); setIsItemEditMode(false); }} className={`flex-1 py-3 rounded-xl text-[11px] font-black flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-[#c5a065] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}><tab.icon size={18} /><span>{tab.label}</span></button>
            ))}
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm min-h-[500px] border border-gray-100">
            {(activeTab === 'stats' || activeTab === 'history') && (
              <div className="flex flex-col md:flex-row gap-3 mb-8 p-5 bg-gray-50 rounded-3xl border">
                <div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">月份</label><input type="month" value={statsMonth} onChange={e=>setStatsMonth(e.target.value)} className="w-full p-3 border-none rounded-xl font-bold bg-white mt-1 shadow-sm outline-none" /></div>
                <div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">人員</label><select value={filterStaff} onChange={e=>setFilterStaff(e.target.value)} className="w-full p-3 border-none rounded-xl font-bold bg-white mt-1 shadow-sm outline-none"><option value="all">全體回報彙總</option>{staffList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center"><h3 className="font-black border-l-4 border-[#c5a065] pl-3 text-gray-800">數據統計</h3>{filterStaff === 'all' ? (<button onClick={() => exportData('all')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-sm"><Download size={14}/> 匯出全體</button>) : (<div className="flex gap-2"><button onClick={() => exportData('staff_defects')} className="bg-red-500 text-white px-3 py-2 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-sm"><ClipboardList size={14}/> 查核表</button><button onClick={() => exportData('boss_bonus')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-sm"><DollarSign size={14}/> 津貼表</button></div>)}</div>
                {filterStaff === 'all' ? (
                  <div className="space-y-3">{monthlyStats.map(s => (<div key={s.name} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border"><div><p className="font-black text-gray-800 text-lg">{s.name}</p><p className="text-[10px] text-gray-400 uppercase">回報 {s.reports} 次</p></div><div className="text-right"><p className="text-xl font-black text-red-500 leading-none mb-1">{s.defects} 紀錄</p><p className="text-xl font-black text-green-600 leading-none">${s.pay} 加給</p></div></div>))}</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 p-6 rounded-3xl text-center border border-red-100 shadow-sm"><p className="text-[10px] text-red-400 font-black uppercase mb-1">查核累計</p><p className="text-4xl font-black text-red-600">{staffStats?.defects || 0}</p></div>
                      <div className="bg-green-50 p-6 rounded-3xl text-center border border-green-100 shadow-sm"><p className="text-[10px] text-green-400 font-black uppercase mb-1">當月加給</p><p className="text-4xl font-black text-green-600">${staffStats?.pay || 0}</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-black border-l-4 border-[#c5a065] pl-3 text-gray-800">歷史紀錄管理</h3><span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded-lg">{historyLogs.length} 筆資料</span></div>
                <div className="space-y-3">
                  {historyLogs.map(log => (
                    <div key={log.id} className={`p-4 bg-white border rounded-2xl shadow-sm flex justify-between items-center gap-3 ${log.type === 'check' ? 'border-red-100' : 'border-green-100'}`}>
                       <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-2 h-10 rounded-full ${log.type === 'check' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <div className="min-w-0">
                             <p className="font-black text-gray-800 text-sm flex items-center gap-2">
                               {log.staffName} 
                               <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded">{log.dateStr}</span>
                             </p>
                             <p className="text-xs text-gray-500 truncate font-bold mt-0.5">
                               {log.type === 'check' ? `⚠️ 缺失 ${log.defectCount} 項` : `💰 津貼 $${log.totalAmount}`}
                               {log.manualNote && <span className="text-gray-300 mx-1">|</span>}
                               {log.manualNote && <span className="text-gray-400">{log.manualNote}</span>}
                             </p>
                          </div>
                       </div>
                       <button 
                         onClick={() => openConfirm("刪除紀錄", `確定要刪除 ${log.staffName} 於 ${log.dateStr} 的這筆 ${log.type === 'check' ? '查核' : '津貼'} 紀錄嗎？`, async () => {
                           await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', log.id));
                           showToast("紀錄已刪除");
                         })}
                         className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  ))}
                  {historyLogs.length === 0 && <div className="text-center py-12 text-gray-300 font-black">本月無相關紀錄</div>}
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3"><div className={`p-1.5 rounded-lg ${isItemEditMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{isItemEditMode ? <Unlock size={16}/> : <Lock size={16}/>}</div><div><p className="text-sm font-bold text-gray-800">標準刪除鎖</p><p className="text-[10px] text-gray-400">{isItemEditMode ? '解除鎖定' : '目前鎖定中'}</p></div></div>
                  <button onClick={() => setIsItemEditMode(!isItemEditMode)} className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isItemEditMode ? 'bg-red-500' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isItemEditMode ? 'translate-x-6' : ''}`} /></button>
                </div>
                <div className="p-5 bg-gray-50 rounded-3xl border border-dashed border-[#c5a065]/30">
                  <div className="space-y-3">
                    <select value={newItemCat} onChange={e=>setNewItemCat(e.target.value)} className="w-full p-3 bg-white rounded-xl shadow-sm outline-none font-bold text-gray-700 text-sm">{DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <input type="text" value={newItemText} onChange={e=>setNewItemText(e.target.value)} className="w-full p-3 bg-white rounded-xl shadow-sm outline-none font-bold text-gray-700 text-sm" placeholder="描述內容..." />
                    {DUTY_PAGES.includes(newItemCat) && (
                      <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100"><DollarSign size={18} className="text-green-600"/><input type="number" value={newItemValue} onChange={e=>setNewItemValue(e.target.value)} className="bg-transparent w-full outline-none font-black text-green-700 text-lg" placeholder="金額" /></div>
                    )}
                    <button onClick={async () => { if(!newItemText) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'items'), { text: newItemText, category: newItemCat, ...(DUTY_PAGES.includes(newItemCat) ? { value: Number(newItemValue) } : {}) }); setNewItemText(''); showToast("新增成功"); }} className="w-full py-4 bg-[#c5a065] text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all">存入標準庫</button>
                  </div>
                </div>
                <div className="divide-y border border-gray-100 rounded-3xl overflow-hidden shadow-sm">{checklistItems.map(it => (<div key={it.id} className="p-4 bg-white flex justify-between items-center gap-2"><div><div className="flex items-center gap-2 mb-1"><span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-tighter uppercase ${DUTY_PAGES.includes(it.category) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{it.category}</span>{it.value && <span className="text-[10px] font-bold text-green-500"><DollarSign size={10} className="inline"/>{it.value}</span>}</div><p className="text-sm text-gray-600 font-bold leading-tight">{it.text}</p></div>{isItemEditMode && (
                  <button 
                    onClick={() => openConfirm("刪除項目", "確定要刪除此標準嗎？此操作無法復原。", async () => {
                      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'items', it.id));
                      showToast("刪除成功");
                    })} 
                    className="text-red-400 p-2 active:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={20}/>
                  </button>
                )}</div>))}</div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                  <div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg ${isStaffEditMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{isStaffEditMode ? <Unlock size={16}/> : <Lock size={16}/>}</div><div><p className="text-sm font-bold text-gray-800">名單鎖定</p><p className="text-[10px] text-gray-400 font-bold">{isStaffEditMode ? '可刪除人員' : '鎖定中'}</p></div></div>
                  <button onClick={() => setIsStaffEditMode(!isStaffEditMode)} className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isStaffEditMode ? 'bg-red-500' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isStaffEditMode ? 'translate-x-6' : ''}`} /></button>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 shadow-sm"><div className="flex gap-2"><input type="text" value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="flex-1 p-3 bg-white shadow-sm rounded-xl font-black outline-none text-sm" placeholder="姓名..." /><button onClick={async () => { if(!newStaffName) return; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaffName), { name: newStaffName }); setNewStaffName(''); showToast("人員已新增"); }} className="px-6 bg-[#c5a065] text-white rounded-xl font-black active:scale-95 shadow-lg">新增</button></div></div>
                <div className="grid grid-cols-2 gap-2">{staffList.map(s => (<div key={s} className={`p-4 bg-white border rounded-2xl flex justify-between items-center shadow-sm transition-all ${isStaffEditMode ? 'border-red-100' : 'border-gray-100'}`}><span className="font-black text-gray-700 text-sm">{s}</span>{isStaffEditMode && (
                  <button 
                    onClick={() => openConfirm("刪除人員", `確定要刪除 ${s} 嗎？`, async () => {
                      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s));
                      showToast("人員已刪除");
                    })} 
                    className="text-red-400 p-2 active:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18}/>
                  </button>
                )}</div>))}</div>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 shadow-sm space-y-3">
                   <p className="text-sm font-black text-gray-700 flex items-center gap-2"><Key size={16} /> 新增管理員</p>
                   <div className="flex flex-col gap-2">
                     <input type="text" value={newAdminUser} onChange={e=>setNewAdminUser(e.target.value)} className="w-full p-3 bg-white shadow-sm rounded-xl font-black outline-none text-sm" placeholder="帳號" />
                     <input type="text" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} className="w-full p-3 bg-white shadow-sm rounded-xl font-black outline-none text-sm" placeholder="密碼" />
                     <button onClick={async () => { 
                        if(!newAdminUser || !newAdminPass) return; 
                        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', newAdminUser), { username: newAdminUser, password: newAdminPass }); 
                        setNewAdminUser(''); setNewAdminPass(''); 
                        showToast("管理員已新增"); 
                     }} className="w-full py-3 bg-[#c5a065] text-white rounded-xl font-black active:scale-95 shadow-lg">新增權限</button>
                   </div>
                </div>
                <div className="space-y-2">
                  {adminList.map(admin => (
                    <div key={admin.username} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-black text-gray-700 text-sm">{admin.username}</p>
                        <p className="text-xs text-gray-400 font-bold">密碼: {admin.password}</p>
                      </div>
                      {admin.username !== INITIAL_ADMIN.username && (
                        <button 
                          onClick={() => openConfirm("刪除管理員", `確定要移除 ${admin.username} 的管理權限嗎？`, async () => {
                            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', admin.username));
                            showToast("管理員已刪除");
                          })} 
                          className="text-red-400 p-2 active:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 主填寫流程 ---
  return (
    <div className="min-h-screen bg-gray-100 pb-36">
      <Header />
      <ToastNotification />
      <div className="max-w-2xl mx-auto px-4 mt-6 grid grid-cols-2 gap-4">
        <button onClick={() => setPage('check')} className={`py-5 rounded-[2rem] font-black flex flex-col items-center justify-center transition-all border-4 ${page === 'check' ? 'bg-white border-[#c5a065] text-[#c5a065] shadow-2xl scale-105 z-10' : 'bg-gray-50 border-transparent text-gray-400 opacity-60'}`}><AlertCircle size={22} /><span className="text-[12px] mt-1 font-black">查核系統</span></button>
        <button onClick={() => setPage('duty')} className={`py-5 rounded-[2rem] font-black flex flex-col items-center justify-center transition-all border-4 ${page === 'duty' ? 'bg-white border-green-500 text-green-600 shadow-2xl scale-105 z-10' : 'bg-gray-50 border-transparent text-gray-400 opacity-60'}`}><Coins size={22} /><span className="text-[12px] mt-1 font-black">輪值評分</span></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-200 space-y-6">
          <div className="space-y-1"><label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">日期</label><input type="date" className="w-full p-4 bg-gray-50 border-none rounded-[1.8rem] font-black text-gray-700 outline-none shadow-inner" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">查核人員</label><select className="w-full p-4 bg-gray-50 border-none rounded-[1.8rem] font-black outline-none appearance-none text-gray-700 shadow-inner" value={formData.staffName} onChange={e=>setFormData({...formData, staffName: e.target.value})}><option value="">點擊選擇人員</option>{staffList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>

        {page === 'check' ? (
          <div className="space-y-6">
            {DEFECT_PAGES.map(cat => {
              const items = checklistItems.filter(i => i.category === cat);
              if (!items.length) return null;
              return (<div key={cat} className="space-y-3"><h3 className="text-[12px] font-black text-gray-500 px-5 flex items-center gap-3 font-black tracking-widest"><div className="w-1.5 h-4 bg-[#c5a065] rounded-full"></div> {cat}</h3><div className="bg-white rounded-[2.8rem] shadow-md overflow-hidden divide-y divide-gray-50 border border-gray-100">{items.map(it => (<div key={it.id} onClick={() => handleCheck(it.id)} className={`p-6 flex items-center gap-5 cursor-pointer transition-all ${formData.checkedItems[it.id] ? 'bg-red-50/60' : 'active:bg-gray-100/50'}`}><div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${formData.checkedItems[it.id] ? 'bg-red-500 border-red-500 shadow-lg scale-110' : 'bg-white border-gray-200'}`}>{formData.checkedItems[it.id] ? <X size={20} className="text-white font-black" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>}</div><span className={`text-[16px] flex-1 font-bold ${formData.checkedItems[it.id] ? 'text-red-700 font-black' : 'text-gray-600'}`}>{it.text}</span></div>))}</div></div>);
            })}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/95 backdrop-blur-xl z-[100] border-t-2 border-gray-100 safe-bottom flex items-center justify-center gap-6 shadow-2xl"><div className="max-w-2xl w-full flex items-center gap-6"><div className="flex-1 pl-10"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">查核項數</p><p className="text-3xl font-black text-red-600 leading-none">{checklistItems.filter(i => DEFECT_PAGES.includes(i.category) && formData.checkedItems[i.id]).length}<span className="text-[14px] ml-1.5 font-black uppercase text-gray-300">Items</span></p></div><button onClick={() => handleSubmit('check')} className="w-36 py-2 bg-[#1a1a1a] text-[#c5a065] rounded-xl font-black shadow-xl active:scale-95 transition-all text-sm"><Send size={16} className="inline mr-1" /> 提交</button></div></div>
          </div>
        ) : (
          <div className="space-y-6">
            {DUTY_PAGES.map(cat => {
              const items = checklistItems.filter(i => i.category === cat);
              if (!items.length) return null;
              return (<div key={cat} className="space-y-3"><h3 className="text-[12px] font-black text-gray-500 px-5 flex items-center gap-3 font-black tracking-widest"><div className="w-1.5 h-4 bg-green-500 rounded-full"></div> {cat}</h3><div className="bg-white rounded-[2.8rem] shadow-md overflow-hidden divide-y divide-gray-50 border border-gray-100">{items.map(it => (<div key={it.id} onClick={() => handleCheck(it.id)} className={`p-6 flex items-center gap-5 cursor-pointer transition-all ${formData.checkedItems[it.id] ? 'bg-green-50/60' : 'active:bg-gray-100/50'}`}><div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${formData.checkedItems[it.id] ? 'bg-green-500 border-green-500 shadow-lg scale-110' : 'bg-white border-gray-200'}`}>{formData.checkedItems[it.id] ? <Check size={20} className="text-white font-black" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>}</div><div className="flex-1 text-gray-600"><p className={`text-[16px] font-bold ${formData.checkedItems[it.id] ? 'text-green-800 font-black' : ''}`}>{it.text}</p><p className="text-[11px] font-black uppercase mt-1 text-green-500">+ ${it.value} 津貼</p></div></div>))}</div></div>);
            })}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/95 backdrop-blur-xl z-[100] border-t-2 border-gray-100 safe-bottom flex items-center justify-center gap-6 shadow-2xl"><div className="max-w-2xl w-full flex items-center gap-6"><div className="flex-1 pl-10"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">累計津貼</p><p className="text-3xl font-black text-green-600 leading-none"><span className="text-[16px] font-black mr-1">$</span>{checklistItems.filter(i => DUTY_PAGES.includes(i.category) && formData.checkedItems[i.id]).reduce((s,i)=>s+(i.value||0),0)}</p></div><button onClick={() => handleSubmit('duty')} className="w-36 py-2 bg-[#1a1a1a] text-[#c5a065] rounded-xl font-black shadow-xl active:scale-95 transition-all text-sm"><Coins size={16} className="inline mr-1" /> 提交</button></div></div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2.5rem] space-y-3 border border-gray-200 shadow-sm mb-10"><label className="text-[11px] font-black text-red-500 flex items-center gap-2 pl-2 uppercase font-black"><AlertTriangle size={16} /> 備註 (選填)</label><textarea placeholder="輸入詳細內容..." className="w-full p-5 bg-gray-50 border-none rounded-[1.8rem] h-32 text-sm outline-none text-gray-700 shadow-inner font-bold" value={formData.manualNote} onChange={e=>setFormData({...formData, manualNote: e.target.value})} /></div>
      </div>

      {/* 成功彈窗 */}
      {view === 'success' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[200] backdrop-blur-xl">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-7xl mb-8">{lastSubmitType === 'check' ? '🚨' : '💰'}</div>
            <h2 className="text-3xl font-black mb-3 text-gray-800 tracking-tight">上報完成！</h2>
            <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-10 space-y-3 border border-gray-100 text-center shadow-inner">
               {lastSubmitType === 'check' ? (
                 <p className="text-red-500 font-black text-xl">紀錄項目：{checklistItems.filter(i => DEFECT_PAGES.includes(i.category) && formData.checkedItems[i.id]).length} 項</p>
               ) : (
                 <p className="text-green-600 font-black text-4xl">$ {checklistItems.filter(i => DUTY_PAGES.includes(i.category) && formData.checkedItems[i.id]).reduce((s,i)=>s+(i.value||0),0)}</p>
               )}
            </div>
            <div className="space-y-4">
              <button onClick={() => {
                let t = `【回報】\n日期：${formData.date}\n👤 對象：${formData.staffName}\n`;
                if (lastSubmitType === 'check') {
                  const items = checklistItems.filter(i => DEFECT_PAGES.includes(i.category) && formData.checkedItems[i.id]);
                  t += `⚠️ 紀錄：${items.length} 項\n${items.map(i => `- ${i.text}`).join('\n')}\n`;
                } else {
                  const items = checklistItems.filter(i => DUTY_PAGES.includes(i.category) && formData.checkedItems[i.id]);
                  t += `✅ 津貼：${items.length} 項\n💰 金額：$${items.reduce((s,i)=>s+(i.value||0),0)}\n`;
                }
                if (formData.manualNote) t += `📝 備註：${formData.manualNote}`;
                document.execCommand('copy'); showToast("成功複製文字！");
              }} className="w-full bg-[#c5a065] text-white py-5 rounded-[1.5rem] font-black shadow-2xl active:scale-95 transition-all">複製 Line 回報</button>
              <button onClick={() => window.location.reload()} className="w-full text-gray-400 font-black text-xs pt-2 uppercase tracking-widest hover:text-gray-600">回首頁</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-top { padding-top: env(safe-area-inset-top); }
        .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 1.5rem); }
        body { -webkit-tap-highlight-color: transparent; overscroll-behavior-y: contain; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f9fafb; }
        select, input, textarea { font-size: 16px !important; }
      `}} />
    </div>
  );
}
