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
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot
} from "firebase/firestore";
import { 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Save, 
  Trash2, 
  History, 
  ClipboardList, 
  BarChart3, 
  X, 
  Shield, 
  AlertCircle, 
  Check, 
  Coins, 
  Send,
  Users,
  Download,
  DollarSign,
  ShieldCheck,
  UserPlus,
  Key,
  Filter
} from 'lucide-react';

// ------------------------------------------------------------------
// Firebase 配置 (處理編譯相容性)
// ------------------------------------------------------------------
const getApiKey = () => {
  try {
    // 優先嘗試從 Vite 環境變數讀取，若無則回傳預設值
    return import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCT5JS5VRx4HaAkjPuEgm-CPaqn4sjY9NY";
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
// 常數與預設資料
// ------------------------------------------------------------------
const DEFECT_PAGES = ["吧檯", "外場", "櫃台", "缺失"]; 
const DUTY_PAGES = ["值班經理能力", "個人職能表現", "業績與KPI達成"]; 
const DEFAULT_CATEGORIES = [...DEFECT_PAGES, ...DUTY_PAGES];

const DEFAULT_STAFF = ["店長", "早班人員A", "晚班人員B"];
const INITIAL_ADMIN = { username: "himmel0724", password: "angel0724" };

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
  const [page, setPage] = useState('defects'); 
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
    checkerName: '',
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
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // ----------------------------------------------------------------
  // 1. 身份驗證與資料監聽
  // ----------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth Fail:", e); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubAdmins = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'admins'), (snap) => {
      if (snap.empty) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', INITIAL_ADMIN.username), INITIAL_ADMIN);
      } else {
        setAdminList(snap.docs.map(d => d.data()));
      }
    }, (err) => console.error("權限錯誤:", err));

    const unsubItems = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'items'), (snap) => {
      if (snap.empty) setChecklistItems(DEFAULT_ITEMS);
      else setChecklistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { setLoading(false); });

    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (snap) => {
      setStaffList(snap.empty ? DEFAULT_STAFF : snap.docs.map(d => d.data().name));
    }, (err) => console.error("名單錯誤:", err));

    return () => { unsubAdmins(); unsubItems(); unsubStaff(); };
  }, [user]);

  // ----------------------------------------------------------------
  // 2. 後台匯總彙整
  // ----------------------------------------------------------------
  useEffect(() => {
    if (isAdmin && user) {
      const unsubReports = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), (snap) => {
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const monthFiltered = raw.filter(r => r.dateStr && r.dateStr.startsWith(statsMonth));
        const historyData = filterStaff === 'all' ? monthFiltered : monthFiltered.filter(r => r.staffName === filterStaff);
        
        setHistoryLogs(historyData.sort((a, b) => b.timestamp - a.timestamp));

        const map = {};
        monthFiltered.forEach(r => {
          if (!map[r.staffName]) {
            map[r.staffName] = { name: r.staffName, defects: 0, pay: 0, reports: 0, defectDetail: {} };
          }
          map[r.staffName].reports += 1;
          map[r.staffName].defects += (r.defectCount || 0);
          map[r.staffName].pay += (r.totalAmount || 0);
          if (r.type === 'defect' && r.uncheckedItems) {
            r.uncheckedItems.forEach(it => { map[r.staffName].defectDetail[it] = (map[r.staffName].defectDetail[it] || 0) + 1; });
          }
        });
        setMonthlyStats(Object.values(map).sort((a, b) => b.defects - a.defects));
      });
      return () => unsubReports();
    }
  }, [isAdmin, user, statsMonth, filterStaff]);

  // ----------------------------------------------------------------
  // 3. 匯出與提交邏輯
  // ----------------------------------------------------------------
  const exportData = (exportType) => {
    let csvContent = "\uFEFF"; 
    let fileName = "";
    const staffData = filterStaff !== 'all' ? monthlyStats.find(s => s.name === filterStaff) : null;

    if (exportType === 'staff_defects' && filterStaff !== 'all') {
      fileName = `${statsMonth}_${filterStaff}_缺失分析.csv`;
      csvContent += `員工,${filterStaff}\n統計月份,${statsMonth}\n總缺失項,${staffData?.defects || 0}\n\n缺失熱點統計\n項目內容,累積次數\n`;
      Object.entries(staffData?.defectDetail || {}).sort((a,b)=>b[1]-a[1]).forEach(([it, co]) => { csvContent += `"${it}",${co}\n`; });
    } else if (exportType === 'boss_bonus' && filterStaff !== 'all') {
      fileName = `${statsMonth}_${filterStaff}_薪資津貼報表.csv`;
      csvContent += `輪值店長,${filterStaff}\n考評月份,${statsMonth}\n應發津貼總計,$${staffData?.pay || 0}\n\n詳細明細\n日期,達成項數,單筆加給,管理員備註\n`;
      historyLogs.filter(l => l.type === 'duty').forEach(log => { csvContent += `${log.dateStr},${log.dutyCount},${log.totalAmount},"${log.manualNote || ''}"\n`; });
    } else {
      fileName = `${statsMonth}_全體彙整表.csv`;
      csvContent += `考評月份,${statsMonth}\n\n員工姓名,查核次數,累計缺失,累計津貼\n`;
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
    if (!formData.staffName) { alert(`請選擇姓名`); return; }
    
    const isDefect = type === 'defect';
    const items = checklistItems.filter(i => (isDefect ? DEFECT_PAGES : DUTY_PAGES).includes(i.category) && formData.checkedItems[i.id]);
    
    const report = {
      type,
      timestamp: new Date(),
      dateStr: formData.date,
      staffName: formData.staffName,
      checkerName: formData.checkerName || '本人',
      defectCount: isDefect ? items.length : 0,
      uncheckedItems: isDefect ? items.map(i => i.text) : [],
      dutyCount: !isDefect ? items.length : 0,
      totalAmount: !isDefect ? items.reduce((s, i) => s + (i.value || 0), 0) : 0,
      manualNote: formData.manualNote
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), report);
      setLastSubmitType(type);
      setView('success');
    } catch (e) { alert("儲存失敗，請檢查連線。"); }
  };

  // ----------------------------------------------------------------
  // 4. UI 渲染
  // ----------------------------------------------------------------
  const Header = () => (
    <div className="bg-[#1a1a1a] text-[#c5a065] p-5 text-center border-b-4 border-[#c5a065] shadow-md sticky top-0 z-[100] safe-top">
      <h1 className="text-xl font-bold tracking-wider text-white font-serif">歐樂沃城堡門市</h1>
      <p className="text-[10px] text-gray-500 tracking-[0.2em] font-medium uppercase mt-0.5">{view === 'admin' ? '管理者控制中心' : (page === 'defects' ? 'SOP 缺失查核系統' : '輪值加給系統')}</p>
      {view === 'main' && <button onClick={() => setView('login')} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-gray-600 transition-colors hover:text-white"><Settings size={22} /></button>}
      {view === 'admin' && <button onClick={() => { setIsAdmin(false); setView('main'); setFilterStaff('all'); }} className="absolute top-1/2 -translate-y-1/2 right-4 bg-red-900/30 text-red-500 px-3 py-1 rounded-full text-xs font-black border border-red-900/20">登出</button>}
    </div>
  );

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c5a065] mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold">系統載入中...</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-xl text-center border">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center justify-center gap-2"><Shield size={20}/> 權限驗證</h2>
            <div className="space-y-4">
              <input type="text" placeholder="管理者帳號" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold" value={loginUser} onChange={e=>setLoginUser(e.target.value)} />
              <input type="password" placeholder="登入密碼" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold" value={loginPass} onChange={e=>setLoginPass(e.target.value)} />
              <button onClick={() => {
                const found = adminList.find(a => a.username === loginUser && a.password === loginPass);
                if (found) { setIsAdmin(true); setView('admin'); } else { alert("驗證失敗"); }
              }} className="w-full py-4 bg-[#c5a065] text-white rounded-2xl font-bold shadow-lg active:scale-95">登入系統</button>
              <button onClick={()=>setView('main')} className="w-full py-2 text-gray-400 font-bold text-sm">返回填寫頁</button>
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
        <div className="max-w-4xl mx-auto mt-4 px-4 space-y-4">
          <div className="flex bg-white rounded-2xl shadow-sm p-1 border overflow-x-auto gap-1">
            {[
              {id:'stats', label:'績效統計', icon: BarChart3},
              {id:'staff', label:'員工管理', icon: Users},
              {id:'items', label:'標準維護', icon: ClipboardList},
              {id:'admins', label:'帳號管理', icon: ShieldCheck},
              {id:'history', label:'報表歷史', icon: History}
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-[#c5a065] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><tab.icon size={16} /><span>{tab.label}</span></button>
            ))}
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm min-h-[500px] border border-gray-100">
            {(activeTab === 'stats' || activeTab === 'history') && (
              <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-gray-50 rounded-2xl border">
                <div className="flex-1"><label className="text-[10px] font-black text-gray-400 pl-1 uppercase">月份</label><input type="month" value={statsMonth} onChange={e=>setStatsMonth(e.target.value)} className="w-full p-2 border-none rounded-lg font-bold bg-white mt-1 shadow-sm outline-none" /></div>
                <div className="flex-1"><label className="text-[10px] font-black text-gray-400 pl-1 uppercase">對象</label><select value={filterStaff} onChange={e=>setFilterStaff(e.target.value)} className="w-full p-2 border-none rounded-lg font-bold bg-white mt-1 shadow-sm outline-none"><option value="all">全體回報彙總</option>{staffList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold border-l-4 border-[#c5a065] pl-2 text-gray-800">月度分析</h3>
                  {filterStaff === 'all' ? (
                    <button onClick={() => exportData('all')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm"><Download size={14}/> 匯出彙總</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => exportData('staff_defects')} className="bg-red-500 text-white px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm"><ClipboardList size={14}/> 缺失統計</button>
                      <button onClick={() => exportData('boss_bonus')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm"><DollarSign size={14}/> 津貼報表</button>
                    </div>
                  )}
                </div>
                {filterStaff === 'all' ? (
                  <div className="space-y-3">{monthlyStats.map(s => (<div key={s.name} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100"><div><p className="font-bold text-gray-800">{s.name}</p><p className="text-[10px] text-gray-400">總回報 {s.reports} 次</p></div><div className="text-right"><p className="text-lg font-black text-red-500 leading-none mb-1">{s.defects} 缺失</p><p className="text-lg font-black text-green-600 leading-none">${s.pay} 加給</p></div></div>))}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100 shadow-sm"><p className="text-[10px] text-red-400 font-bold uppercase">總缺失項</p><p className="text-4xl font-black text-red-600 mt-1">{staffStats?.defects || 0}</p></div>
                      <div className="bg-green-50 p-4 rounded-2xl text-center border border-green-100 shadow-sm"><p className="text-[10px] text-green-400 font-bold uppercase">累計獎金</p><p className="text-4xl font-black text-green-600 mt-1">${staffStats?.pay || 0}</p></div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-3 text-left">各項缺失累積排行</th><th className="p-3 text-right w-20">次數</th></tr></thead>
                        <tbody className="divide-y">
                          {Object.entries(staffStats?.defectDetail || {}).sort((a,b)=>b[1]-a[1]).map(([it, co]) => (<tr key={it} className="hover:bg-gray-50"><td className="p-3 text-gray-700 leading-tight">{it}</td><td className="p-3 text-right font-black text-red-500">{co}</td></tr>))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 帳號權限管理 - 移除密碼顯示 */}
            {activeTab === 'admins' && (
              <div className="space-y-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-[#c5a065]/50 shadow-sm">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-700"><UserPlus size={18}/> 新增管理權限</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input type="text" value={newAdminUser} onChange={e=>setNewAdminUser(e.target.value)} className="p-3 bg-white shadow-inner rounded-xl font-bold border-none outline-none" placeholder="新帳號" />
                    <input type="text" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} className="p-3 bg-white shadow-inner rounded-xl font-bold border-none outline-none" placeholder="登入密碼" />
                  </div>
                  <button onClick={async () => {
                    if(!newAdminUser || !newAdminPass) return;
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', newAdminUser), { username: newAdminUser, password: newAdminPass });
                    setNewAdminUser(''); setNewAdminPass('');
                  }} className="w-full py-3 bg-[#1a1a1a] text-[#c5a065] rounded-xl font-bold shadow-lg active:scale-95 transition-all">確認授權</button>
                </div>
                
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-gray-400 pl-1 uppercase tracking-widest">目前權限名單</p>
                   {adminList.map(a => (
                     <div key={a.username} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-[#c5a065]/10 rounded-full text-[#c5a065]"><ShieldCheck size={18}/></div>
                           <p className="font-bold text-gray-800">{a.username}</p>
                        </div>
                        {adminList.length > 1 ? (
                          <button onClick={async () => {
                            if(confirm(`確定移除 ${a.username} 的管理權限？`)) {
                              await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', a.username));
                            }
                          }} className="p-2 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded italic">最後帳號不可刪除</span>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* 員工與項目管理 */}
            {activeTab === 'staff' && (
              <div className="space-y-4"><div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase">名單管理</p><div className="flex gap-2 mt-2"><input type="text" value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="flex-1 p-3 bg-white shadow-sm rounded-xl font-bold outline-none" placeholder="輸入姓名" /><button onClick={async () => { if(!newStaffName) return; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaffName), { name: newStaffName }); setNewStaffName(''); }} className="px-6 bg-[#c5a065] text-white rounded-xl font-bold active:scale-95">新增</button></div></div><div className="grid grid-cols-2 gap-2">{staffList.map(s => (<div key={s} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm font-bold text-gray-700">{s}<button onClick={async () => { if(confirm(`確定刪除 ${s}？`)) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s)); }} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button></div>))}</div></div>
            )}
            {activeTab === 'items' && (
              <div className="space-y-4"><div className="p-4 bg-gray-50 rounded-2xl border border-dashed text-xs text-gray-400 font-bold uppercase"><p>檢查與加給標準維護</p><select id="itCat" className="w-full p-3 bg-white rounded-xl mt-2 shadow-sm text-gray-700 outline-none">{DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select><input id="itTex" type="text" className="w-full p-3 bg-white rounded-xl mt-2 shadow-sm text-gray-700 font-bold outline-none" placeholder="輸入規則內容" /><button onClick={async () => { const t = document.getElementById('itTex').value; const c = document.getElementById('itCat').value; if(!t) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'items'), { text: t, category: c }); document.getElementById('itTex').value = ''; }} className="w-full py-3 bg-[#c5a065] text-white rounded-xl font-bold mt-2">存入系統</button></div><div className="divide-y border border-gray-100 rounded-2xl overflow-hidden">{checklistItems.map(it => (<div key={it.id} className="p-3 bg-white flex justify-between items-center gap-2 border-b last:border-0"><div className="flex-1"><span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded mr-2 uppercase tracking-tighter">{it.category}</span><span className="text-sm text-gray-600 leading-tight">{it.text}</span></div><button onClick={async () => { if(confirm('確定刪除？')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'items', it.id)); }} className="text-red-200 hover:text-red-500"><X size={16}/></button></div>))}</div></div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-3"><h3 className="font-bold border-l-4 border-[#c5a065] pl-2 text-gray-800 mb-4">{filterStaff === 'all' ? '歷史明細全覽' : `${filterStaff} 的回報歷史`}</h3><div className="space-y-3">{historyLogs.map(log => (<div key={log.id} className={`p-4 rounded-2xl border-l-4 shadow-sm border-gray-100 ${log.type === 'defect' ? 'border-red-400 bg-red-50/50' : 'border-green-400 bg-green-50/50'}`}><div className="flex justify-between items-start mb-1"><p className="font-bold text-sm text-gray-800">{log.dateStr} - {log.staffName}</p><p className="text-[8px] font-black text-gray-400 uppercase bg-white/50 px-2 py-0.5 rounded-full">{log.type === 'defect' ? '缺失' : '加給'}</p></div>{log.type === 'defect' ? (<p className="text-xs text-red-500 font-bold leading-relaxed">缺失：{log.defectCount} 項 ({log.uncheckedItems?.join('、') || '無'})</p>) : (<p className="text-xs text-green-600 font-bold leading-relaxed">加給：${log.totalAmount} (達成 {log.dutyCount} 項任務)</p>)}{log.manualNote && <p className="text-[10px] text-gray-400 mt-2 bg-white/30 p-2 rounded-lg italic">備註：{log.manualNote}</p>}</div>))}</div></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 主填寫流程 ---
  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => setPage('defects')} className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center transition-all border-2 ${page === 'defects' ? 'bg-white border-[#c5a065] text-[#c5a065] shadow-lg scale-105 z-10' : 'bg-gray-50 border-transparent text-gray-400'}`}><AlertCircle size={20} /><span className="text-xs mt-1">缺失查核</span></button>
        <button onClick={() => setPage('duty')} className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center transition-all border-2 ${page === 'duty' ? 'bg-white border-green-500 text-green-600 shadow-lg scale-105 z-10' : 'bg-gray-50 border-transparent text-gray-400'}`}><Coins size={20} /><span className="text-xs mt-1">輪值加給</span></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 space-y-4">
          <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase pl-2">查核日期</label><input type="date" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase pl-2">{page === 'duty' ? '輪值店長' : '查核員工'}</label><select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none appearance-none text-gray-700" value={formData.staffName} onChange={e=>setFormData({...formData, staffName: e.target.value})}><option value="">點擊選擇人員</option>{staffList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>

        {page === 'defects' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {DEFECT_PAGES.map(cat => {
              const items = checklistItems.filter(i => i.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="space-y-3"><h3 className="text-[11px] font-black text-gray-400 px-4 flex items-center gap-2 tracking-widest uppercase font-bold"><div className="w-1.5 h-3 bg-[#c5a065] rounded-full"></div> {cat}</h3><div className="bg-white rounded-[2rem] shadow-sm overflow-hidden divide-y divide-gray-50 border border-gray-100">{items.map(it => (<div key={it.id} onClick={() => handleCheck(it.id)} className={`p-5 flex items-center gap-4 cursor-pointer transition-all ${formData.checkedItems[it.id] ? 'bg-red-50/50' : 'active:bg-gray-50'}`}><div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${formData.checkedItems[it.id] ? 'bg-red-500 border-red-500 shadow-lg scale-110' : 'bg-white border-gray-200'}`}>{formData.checkedItems[it.id] ? <X size={18} className="text-white" /> : <div className="w-1 h-1 bg-gray-200 rounded-full"></div>}</div><span className={`text-[15px] flex-1 ${formData.checkedItems[it.id] ? 'text-red-600 font-black' : 'text-gray-600 font-medium'}`}>{it.text}</span></div>))}</div></div>
              );
            })}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md z-[100] border-t safe-bottom flex items-center justify-center gap-4 shadow-2xl"><div className="max-w-2xl w-full flex items-center gap-4"><div className="flex-1"><p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">當前缺失項</p><p className="text-2xl font-black text-red-500 leading-none">{checklistItems.filter(i => DEFECT_PAGES.includes(i.category) && formData.checkedItems[i.id]).length}<span className="text-xs ml-1 font-bold">項</span></p></div><button onClick={() => handleSubmit('defect')} className="flex-[1.5] md:flex-none md:w-64 py-3.5 bg-[#1a1a1a] text-[#c5a065] rounded-xl font-bold shadow-lg active:scale-95 border border-[#c5a065]/20 text-sm flex items-center justify-center gap-2"><Send size={16} /> 缺失提交</button></div></div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {DUTY_PAGES.map(cat => {
              const items = checklistItems.filter(i => i.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="space-y-3"><h3 className="text-[11px] font-black text-gray-400 px-4 flex items-center gap-2 tracking-widest uppercase font-bold"><div className="w-1.5 h-3 bg-green-500 rounded-full"></div> {cat}</h3><div className="bg-white rounded-[2rem] shadow-sm overflow-hidden divide-y divide-gray-50 border border-gray-100">{items.map(it => (<div key={it.id} onClick={() => handleCheck(it.id)} className={`p-5 flex items-center gap-4 cursor-pointer transition-all ${formData.checkedItems[it.id] ? 'bg-green-50' : 'active:bg-gray-50'}`}><div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${formData.checkedItems[it.id] ? 'bg-green-500 border-green-500 shadow-lg scale-110' : 'bg-white border-gray-200'}`}>{formData.checkedItems[it.id] ? <Check size={18} className="text-white" /> : <div className="w-1 h-1 bg-gray-200 rounded-full"></div>}</div><div className="flex-1 text-gray-600"><p className={`text-[15px] leading-tight ${formData.checkedItems[it.id] ? 'text-green-700 font-black' : 'font-medium'}`}>{it.text}</p><p className="text-[10px] font-bold uppercase mt-1 text-green-500">+ ${it.value} 加給</p></div></div>))}</div></div>
              );
            })}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md z-[100] border-t safe-bottom flex items-center justify-center gap-4 shadow-2xl"><div className="max-w-2xl w-full flex items-center gap-4"><div className="flex-1"><p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">總津貼金額</p><p className="text-2xl font-black text-green-600 leading-none"><span className="text-base font-bold mr-0.5">$</span>{checklistItems.filter(i => DUTY_PAGES.includes(i.category) && formData.checkedItems[i.id]).reduce((s,i)=>s+(i.value||0),0)}</p></div><button onClick={() => handleSubmit('duty')} className="flex-[1.5] md:flex-none md:w-64 py-3.5 bg-[#1a1a1a] text-[#c5a065] rounded-xl font-bold shadow-lg active:scale-95 border border-[#c5a065]/20 text-sm flex items-center justify-center gap-2"><Coins size={16} /> 輪值提交</button></div></div>
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl space-y-2 border border-gray-200 shadow-sm"><label className="text-[10px] font-black text-red-400 flex items-center gap-1 pl-2 uppercase tracking-widest font-bold"><AlertTriangle size={14}/> 異常匯報或備註 (選填)</label><textarea placeholder="請在此輸入相關細節說明..." className="w-full p-4 bg-gray-50 border-none rounded-2xl h-24 text-sm resize-none outline-none text-gray-700" value={formData.manualNote} onChange={e=>setFormData({...formData, manualNote: e.target.value})} /></div>
      </div>

      {/* 成功彈窗 */}
      {view === 'success' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[200] backdrop-blur-md">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="text-6xl mb-6">{lastSubmitType === 'defect' ? '🚨' : '💰'}</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">上報成功！</h2>
            <div className="bg-gray-50 p-6 rounded-3xl mb-8 space-y-2 border border-gray-100">{lastSubmitType === 'defect' ? (<p className="text-red-500 font-bold text-lg">缺失次數：{checklistItems.filter(i => DEFECT_PAGES.includes(i.category) && formData.checkedItems[i.id]).length} 項</p>) : (<p className="text-green-600 font-black text-3xl">$ {checklistItems.filter(i => DUTY_PAGES.includes(i.category) && formData.checkedItems[i.id]).reduce((s,i)=>s+(i.value||0),0)}</p>)}<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">已同步至雲端</p></div>
            <div className="space-y-4"><button onClick={() => {
                let t = `【多那之回報】\n日期：${formData.date}\n👤 人員：${formData.staffName}\n`;
                if (lastSubmitType === 'defect') {
                  const items = checklistItems.filter(i => DEFECT_PAGES.includes(i.category) && formData.checkedItems[i.id]);
                  t += `⚠️ 缺失：${items.length} 項\n${items.map(i => `- ${i.text}`).join('\n')}\n`;
                } else {
                  const items = checklistItems.filter(i => DUTY_PAGES.includes(i.category) && formData.checkedItems[i.id]);
                  t += `✅ 達成：${items.length} 項\n💰 津貼：$${items.reduce((s,i)=>s+(i.value||0),0)}\n`;
                }
                if (formData.manualNote) t += `📝 備註：${formData.manualNote}`;
                navigator.clipboard.writeText(t); alert("回報文字已複製！");
              }} className="w-full bg-[#c5a065] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95"><ClipboardList size={18} /> 複製 Line 回報</button><button onClick={() => window.location.reload()} className="w-full text-gray-400 font-bold text-sm hover:text-gray-600">返回首頁</button></div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-top { padding-top: env(safe-area-inset-top); }
        .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 1.5rem); }
        body { -webkit-tap-highlight-color: transparent; overscroll-behavior-y: contain; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        select, input, textarea { font-size: 16px !important; }
      `}} />
    </div>
  );
}