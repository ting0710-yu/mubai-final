import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar as CalendarIcon, DollarSign, Bell, Briefcase, RefreshCw, User, LogOut, ChevronLeft, ChevronRight, Star, AlertCircle, History, X, Clock, CheckCircle2, XCircle, Database, Loader2, BadgeCheck, ClipboardCheck, FileText, Lock, Info } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously, updateProfile } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy, Timestamp, setDoc } from 'firebase/firestore';

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyATncVLAIoz28OJxLKk4zHQInSfqOvCLik",
  authDomain: "xuxu-helper.firebaseapp.com",
  projectId: "xuxu-helper",
  storageBucket: "xuxu-helper.firebasestorage.app",
  messagingSenderId: "1022083747734",
  appId: "1:1022083747734:web:e5ea9af8d1cbc8554e97b7",
  measurementId: "G-8Q10D83PMQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 色票定義 ---
const THEME = {
  bg: 'bg-[#F9F7F2]',
  card: 'bg-white',
  primary: 'bg-[#8B5E3C]',
  primaryHover: 'hover:bg-[#6F4B30]',
  secondary: 'bg-[#D4C5B0]',
  textMain: 'text-[#4A3728]',
  textSub: 'text-[#8D7B68]',
  border: 'border-[#E6E0D4]',
  success: 'text-[#6B8E23]',
  error: 'text-[#CD5C5C]',
};

// --- 設定 ---
const SHOP_LOCATION = { lat: 25.039408, lng: 121.567066, name: "煦煦松仁店", address: "台北市信義區松仁路36號" };
const ALLOWED_RADIUS = 500; 
const HOURLY_WAGE = 210;
const CLOCK_IN_WINDOW_MINUTES = 30; 

// 配合後台的 code 或 shift 欄位
// 加入強制時間設定 (start/end)，用於覆蓋資料庫舊資料
const SHIFT_TYPES = {
  '早班': { color: 'bg-[#D4C5B0] text-[#4A3728]', start: '08:00', end: '12:00' },
  '白班': { color: 'bg-[#E8DCC4] text-[#4A3728]', start: '11:00', end: '15:00' },
  '晚班': { color: 'bg-[#4A3728] text-white',   start: '15:00', end: '19:00' },
  '早':   { color: 'bg-[#D4C5B0] text-[#4A3728]', start: '08:00', end: '12:00' },
  '中':   { color: 'bg-[#E8DCC4] text-[#4A3728]', start: '11:00', end: '15:00' },
  '晚':   { color: 'bg-[#4A3728] text-white',   start: '15:00', end: '19:00' },
  '全班': { color: 'bg-[#8B5E3C] text-white' },
  // 假別樣式
  '事假': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '病假': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '公假': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '喪假': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '婚假': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '特休': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '休假': { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '假':   { color: 'bg-rose-50 text-rose-600 border border-rose-200' },
  '休':   { color: 'bg-slate-100 text-slate-500' },
};

const HOLIDAYS = { '2025-12-25': '聖誕節', '2025-01-01': '元旦' };

// --- 工具函式 ---
const getTaiwanDateStr = () => {
  const d = new Date();
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatCurrency = (amount) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);

const calculateBonus = (hours) => {
  if (hours >= 160) return 2000;
  if (hours >= 120) return 1500;
  if (hours >= 80) return 1000;
  if (hours >= 40) return 500;
  return 0;
};

const getTimeOnDate = (dateStr, timeStr) => {
  if (!timeStr || timeStr === '-') return null;
  const d = new Date(dateStr);
  const [h, m] = timeStr.split(':');
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d;
};

const parseTimeRange = (timeStr) => {
  if (!timeStr || !timeStr.includes('-')) return { start: '00:00', end: '00:00', hours: 0 };
  const [start, end] = timeStr.split('-');
  const s = start.split(':').map(Number);
  const e = end.split(':').map(Number);
  const startH = s[0] + s[1]/60;
  const endH = e[0] + e[1]/60;
  let h = endH - startH;
  if (h < 0) h += 24; 
  return { start, end, hours: h };
};

const calculateEffectiveHours = (log, scheduleList, userName) => {
  if (!log.startTime || !log.endTime) return 0;
  const logDateStr = new Date(log.startTime).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const myShift = scheduleList.find(s => s.date === logDateStr && s.name === userName);
  if (!myShift || myShift.isLeave) return 0;
  const shiftStart = getTimeOnDate(logDateStr, myShift.startTime);
  const shiftEnd = getTimeOnDate(logDateStr, myShift.endTime);
  if (!shiftStart || !shiftEnd) return 0;
  const logStart = new Date(log.startTime);
  const logEnd = new Date(log.endTime);
  const effectiveStart = logStart < shiftStart ? shiftStart : logStart;
  const effectiveEnd = logEnd > shiftEnd ? shiftEnd : logEnd;
  if (effectiveEnd <= effectiveStart) return 0;
  const diffMs = effectiveEnd - effectiveStart;
  return diffMs / 1000 / 60 / 60;
};

// --- 子組件 ---

const LoginView = ({ onLogin, onGuestLogin }) => (
  <div className={`flex flex-col items-center justify-center h-full p-8 ${THEME.bg} space-y-8`}>
    <div className="text-center space-y-2">
      <div className={`w-24 h-24 rounded-full ${THEME.primary} flex items-center justify-center mx-auto shadow-lg mb-4`}>
        <Briefcase size={40} className="text-white" />
      </div>
      <h1 className={`text-3xl font-bold ${THEME.textMain}`}>煦煦小幫手 v3.8</h1>
      <p className={`${THEME.textSub}`}>即時同步班表與薪資 (班表校正版)</p>
    </div>
    <div className="w-full max-w-sm space-y-3">
      <button onClick={onLogin} className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-3">Google 登入</button>
      <button onClick={onGuestLogin} className={`w-full ${THEME.primary} text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:opacity-90 flex items-center justify-center gap-2`}>訪客試用 (推薦)</button>
    </div>
    <div className="text-xs text-slate-400 text-center px-8">請確認已連線至正確的 Firebase 專案</div>
  </div>
);

const HistoryModal = ({ logs, scheduleList, onClose, userName }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl h-[80vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-300`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className={`text-lg font-bold ${THEME.textMain}`}>打卡紀錄核對</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.length === 0 && <p className="text-center text-slate-400 py-4">尚無打卡紀錄</p>}
          {logs.map((log) => {
            const effective = log.endTime ? calculateEffectiveHours(log, scheduleList, userName) : 0;
            const rawDuration = log.duration ? (log.duration / 3600) : 0;
            const isValid = effective > 0;
            const isRunning = !log.endTime;

            return (
              <div key={log.id} className={`bg-slate-50 p-3 rounded-xl border border-slate-100`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold text-slate-700">{new Date(log.startTime).toLocaleDateString()}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${isRunning ? 'bg-blue-100 text-blue-700' : isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isRunning ? <Clock size={10}/> : isValid ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                    {isRunning ? '進行中' : isValid ? '有效' : '異常'}
                  </div>
                </div>
                <div className="flex justify-between items-end text-xs">
                  <div className="text-slate-500">
                    <div>打卡: {new Date(log.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.endTime ? new Date(log.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 strike-through">原始: {rawDuration.toFixed(2)} hr</div>
                    <div className={`font-bold text-sm ${isValid ? THEME.textMain : 'text-slate-400'}`}>核算: {effective.toFixed(2)} hr</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ClockInView = ({ isClockedIn, clockInTime, onClockIn, onClockOut, workDuration, user, logs, scheduleList, isIdentified, employeeName }) => {
  const [distance, setDistance] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [todayShifts, setTodayShifts] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const todayStr = getTaiwanDateStr(); 
    const shifts = scheduleList.filter(s => s.date === todayStr);
    setTodayShifts(shifts);
    return () => clearInterval(timer);
  }, [scheduleList]);

  const getLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) { setLoadingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, SHOP_LOCATION.lat, SHOP_LOCATION.lng);
        setDistance(Math.round(dist));
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false)
    );
  };

  const simulateInStore = () => { setDistance(0); };

  const myTodayShift = useMemo(() => todayShifts.find(s => s.name === employeeName), [todayShifts, employeeName]);

  const checkClockInEligibility = () => {
    if (!distance || distance > ALLOWED_RADIUS) return { valid: false, msg: '不在店鋪範圍內' };
    if (!isIdentified) return { valid: false, msg: '系統無法辨識您的身分，請聯繫店長' };
    if (todayShifts.length === 0) return { valid: false, msg: '今日全店無排班' };
    if (!myTodayShift) return { valid: false, msg: `今日無您的排班 (${employeeName})` };
    if (myTodayShift.isLeave) return { valid: false, msg: '今日您已請假' };

    const now = new Date();
    const shiftStart = getTimeOnDate(myTodayShift.date, myTodayShift.startTime);
    const allowedStart = new Date(shiftStart);
    allowedStart.setMinutes(allowedStart.getMinutes() - CLOCK_IN_WINDOW_MINUTES);
    const shiftEnd = getTimeOnDate(myTodayShift.date, myTodayShift.endTime);

    if (now < allowedStart) return { valid: false, msg: `太早了 (${allowedStart.toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}後)` };
    if (now > shiftEnd) return { valid: false, msg: '班表已過' };
    return { valid: true, msg: '可打卡' };
  };

  const eligibility = checkClockInEligibility();
  const hours = Math.floor(workDuration / 3600);
  const minutes = Math.floor((workDuration % 3600) / 60);
  const seconds = workDuration % 60;

  const handleClockInClick = () => {
    if (eligibility.valid) { onClockIn(); } else { alert(`無法打卡：${eligibility.msg}`); }
  };

  return (
    <div className={`flex flex-col h-full p-4 space-y-6 overflow-y-auto pb-24 ${THEME.bg}`}>
      <div className={`${THEME.card} rounded-2xl p-6 shadow-sm border ${THEME.border}`}>
        <div className="flex justify-between items-start mb-2">
           <div className="flex items-center gap-2">
             <div className={`w-8 h-8 rounded-full ${THEME.secondary} flex items-center justify-center text-white`}><User size={16}/></div>
             <div className="flex flex-col">
                <span className={`text-sm font-medium ${THEME.textMain}`}>{employeeName}</span>
                {isIdentified ? 
                  <span className="text-[10px] text-green-600 flex items-center gap-1"><BadgeCheck size={10}/> 已認證員工</span> :
                  <span className="text-[10px] text-red-500">訪客 / 未配對員工</span>
                }
             </div>
           </div>
           <button onClick={() => setShowHistory(true)} className={`text-xs flex items-center gap-1 ${THEME.textSub} hover:text-[#8B5E3C] px-2 py-1 rounded bg-slate-50`}>
             <History size={14} /> 核對
           </button>
        </div>
        <div className="text-center space-y-2 mt-2">
          <h1 className={`text-5xl font-bold ${THEME.textMain} tabular-nums tracking-tight`}>{currentTime.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className={`${THEME.textSub} text-sm`}>{currentTime.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          
          <div className="mt-4 flex flex-col gap-2">
            {todayShifts.length > 0 ? (
                todayShifts
                .sort((a, b) => {
                    if (a.name === employeeName) return -1;
                    if (b.name === employeeName) return 1;
                    const order = { '早班': 1, '早': 1, '白班': 2, '白': 2, '中': 2, '晚班': 3, '晚': 3 };
                    const oA = order[a.shift] || 99;
                    const oB = order[b.shift] || 99;
                    return oA - oB;
                })
                .map((s, idx) => {
                    const isMe = s.name === employeeName;
                    return (
                        <div key={idx} className={`flex justify-between items-center px-4 py-2 rounded-xl text-xs font-medium border ${isMe ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                                {isMe && <Star size={10} className="text-yellow-300 fill-yellow-300"/>}
                                <span className="font-bold text-sm">{s.name}</span>
                            </div>
                            <span>
                                {s.isLeave ? s.shift : `${s.shift} (${s.startTime}-${s.endTime})`}
                            </span>
                        </div>
                    );
                })
            ) : (
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">今日全店無排班</div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-xl p-4 border bg-white ${THEME.border}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2"><MapPin size={16} className={eligibility.valid ? THEME.success : THEME.textSub} /><span className={`font-medium ${THEME.textMain} text-sm`}>定位打卡</span></div>
          <button onClick={getLocation} disabled={loadingLocation} className={`text-xs px-3 py-1.5 rounded-full border ${THEME.border} ${THEME.textMain} flex items-center gap-1 active:bg-slate-100`}>
            <RefreshCw size={12} className={loadingLocation ? 'animate-spin' : ''} />{distance !== null ? '更新' : '偵測'}
          </button>
        </div>
        <p className={`text-lg font-bold ${eligibility.valid || isClockedIn ? THEME.success : THEME.error}`}>{distance !== null ? `${distance} 公尺` : '--'} <span className="text-xs font-normal ml-2 opacity-70">{distance === null ? '' : (distance <= ALLOWED_RADIUS ? '(範圍內)' : '(太遠了)')}</span></p>
        {!eligibility.valid && !isClockedIn && distance !== null && distance <= ALLOWED_RADIUS && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {eligibility.msg}</p>}
        {(!distance || distance > ALLOWED_RADIUS) && <button onClick={simulateInStore} className="mt-2 text-xs text-blue-400 underline w-full text-right">[測試] 模擬進店</button>}
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-4">
        {!isClockedIn ? (
          <button onClick={handleClockInClick} disabled={distance === null} className={`w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform active:scale-95 border-4 ${eligibility.valid ? 'border-[#8B5E3C] bg-[#8B5E3C] text-white cursor-pointer' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            <Briefcase size={40} className="mb-2 opacity-90" />
            <span className="text-2xl font-bold tracking-widest">上班</span>
            {!eligibility.valid && distance !== null && distance <= ALLOWED_RADIUS && <span className="text-xs mt-1 opacity-70">未達打卡時間</span>}
            {(distance === null || distance > ALLOWED_RADIUS) && <span className="text-xs mt-1 opacity-70">請先定位</span>}
          </button>
        ) : (
          <div className="text-center w-full">
            <div className={`w-48 h-48 mx-auto rounded-full bg-white border-4 border-[#8B5E3C] ${THEME.textMain} flex flex-col items-center justify-center shadow-xl mb-8 relative overflow-hidden`}>
               <div className="absolute inset-0 bg-[#8B5E3C] opacity-5 animate-pulse rounded-full"></div>
               <span className="text-xs text-[#8B5E3C] font-bold mb-1 tracking-widest uppercase">Working</span>
               <span className="text-3xl font-mono font-bold tabular-nums">{hours.toString().padStart(2,'0')}:{minutes.toString().padStart(2,'0')}:{seconds.toString().padStart(2,'0')}</span>
               <span className={`text-xs mt-2 ${THEME.textSub}`}>{new Date(clockInTime).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            <button onClick={onClockOut} className={`w-full max-w-xs ${THEME.primary} text-white font-bold py-4 rounded-xl shadow-md hover:opacity-90`}>下班打卡</button>
          </div>
        )}
      </div>
      {showHistory && <HistoryModal logs={logs} scheduleList={scheduleList} onClose={() => setShowHistory(false)} employeeName={employeeName} />}
    </div>
  );
};

const ScheduleView = ({ scheduleList, user, employeeName }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const leaveStats = useMemo(() => {
    const stats = { '事假': 0, '病假': 0, '生理假': 0, '喪假': 0 };
    scheduleList.forEach(shift => { 
        if (shift.name === employeeName && shift.shift && (shift.shift.includes('假') || shift.shift.includes('休'))) {
            if (shift.shift.includes('事')) stats['事假'] = (stats['事假'] || 0) + 1;
            else if (shift.shift.includes('病')) stats['病假'] = (stats['病假'] || 0) + 1;
            else if (shift.shift.includes('喪')) stats['喪假'] = (stats['喪假'] || 0) + 1;
            else stats['事假'] = (stats['事假'] || 0) + 1;
        }
    });
    return stats;
  }, [scheduleList, employeeName]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push({ day: null });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr, isToday: new Date().toISOString().split('T')[0] === dateStr, isHoliday: HOLIDAYS[dateStr] || null });
    }
    return days;
  }, [currentDate]);

  const changeMonth = (d) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + d, 1));
  
  const getShifts = (d) => {
    const shifts = scheduleList.filter(s => s.date === d);
    return shifts.sort((a, b) => {
        const orderMap = { '早班': 1, '早': 1, '白班': 2, '白': 2, '中': 2, '晚班': 3, '晚': 3 };
        const oA = orderMap[a.shift] || 99;
        const oB = orderMap[b.shift] || 99;
        return oA - oB;
    });
  };

  return (
    <div className={`p-4 pb-24 h-full overflow-y-auto ${THEME.bg}`}>
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className={`text-2xl font-bold ${THEME.textMain}`}>我的班表</h2>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-[#E6E0D4]">
          <button onClick={() => changeMonth(-1)} className={`p-1 ${THEME.textSub}`}><ChevronLeft size={20}/></button>
          <span className={`text-sm font-semibold ${THEME.textMain} w-24 text-center`}>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} className={`p-1 ${THEME.textSub}`}><ChevronRight size={20}/></button>
        </div>
      </div>
      
      {/* 班別說明 Legend - 修正時間 */}
      <div className="mb-4 px-2 py-2 bg-white/60 rounded-lg text-[10px] text-slate-500 flex flex-wrap gap-2 justify-center border border-slate-100">
         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4C5B0]"></span>早班 8:00-12:00</span>
         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E8DCC4]"></span>白班 11:00-15:00</span>
         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A3728]"></span>晚班 15:00-19:00</span>
      </div>

      <div className={`${THEME.card} rounded-2xl shadow-sm border ${THEME.border} overflow-hidden mb-6`}>
        <div className="grid grid-cols-7 bg-[#F5F1E8] border-b border-[#E6E0D4]">{['日','一','二','三','四','五','六'].map((d,i)=><div key={i} className={`py-3 text-center text-xs font-bold ${i===0||i===6?'text-[#8B5E3C]':THEME.textSub}`}>{d}</div>)}</div>
        <div className="grid grid-cols-7 min-h-[300px]">
          {calendarDays.map((item, idx) => {
            if(!item.day) return <div key={idx} className="bg-[#FCFAF7]"></div>;
            const shifts = getShifts(item.dateStr);
            return (
              <div key={idx} className={`min-h-[80px] border-t border-r border-slate-50 p-1 ${item.isToday?'bg-[#FFF9E6]':''}`}>
                <div className="flex justify-between items-start"><span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${item.isToday?'bg-[#8B5E3C] text-white':item.isHoliday?'text-[#CD5C5C]':THEME.textMain}`}>{item.day}</span>{item.isHoliday&&<span className="text-[10px] text-[#CD5C5C] font-bold scale-75 origin-top-right">{item.isHoliday}</span>}</div>
                <div className="mt-1 space-y-1">
                    {shifts.map((s,si) => {
                        const isMe = s.name === employeeName;
                        let style = null;
                        const shiftName = s.shift ? s.shift.trim() : '';
                        
                        if (shiftName.includes('假') || shiftName.includes('休')) style = SHIFT_TYPES['假'].color;
                        else if (shiftName.includes('早')) style = SHIFT_TYPES['早班'].color;
                        else if (shiftName.includes('晚')) style = SHIFT_TYPES['晚班'].color;
                        else if (shiftName.includes('白') || shiftName.includes('中')) style = SHIFT_TYPES['白班'].color;
                        
                        // 修正：同事班表不再變灰，保持原色，但移除「自己」的凸顯效果
                        const finalStyle = isMe ? (style || 'bg-slate-200') + ' border border-black/10 shadow-sm' : (style || 'bg-slate-200 opacity-90');

                        return (
                            <div key={si} className={`text-[10px] rounded px-1 py-0.5 truncate flex flex-col ${finalStyle}`}>
                                <span className="font-bold truncate text-[8px] flex items-center gap-1">
                                    {isMe && <Star size={8} className="text-yellow-500 fill-yellow-500"/>}
                                    {s.name}
                                </span>
                                <span className="opacity-90">{s.shift}</span>
                            </div>
                        );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={`${THEME.card} rounded-2xl shadow-sm border ${THEME.border} p-5`}>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2"><AlertCircle size={18} className="text-[#CD5C5C]" /><h3 className={`font-bold ${THEME.textMain}`}>請假統計 (僅計算您個人)</h3></div>
        <div className="grid grid-cols-4 gap-2 text-center">{Object.entries(leaveStats).map(([t,c])=><div key={t} className="flex flex-col items-center"><span className={`text-2xl font-bold ${c>0?'text-[#CD5C5C]':'text-slate-300'}`}>{c}</span><span className="text-xs text-slate-500">{t}</span></div>)}</div>
      </div>
    </div>
  );
};

const SalaryView = ({ workDuration, logs, scheduleList, employeeName }) => {
  const { earnedHours, futureHours, totalEstimatedHours } = useMemo(() => {
    let earned = 0;
    let future = 0;
    logs.forEach(log => { if (log.endTime) { earned += calculateEffectiveHours(log, scheduleList, employeeName); } });
    
    const todayStr = getTaiwanDateStr();
    scheduleList.forEach(shift => { 
        if (shift.name === employeeName && shift.date > todayStr && !shift.isLeave) { 
            future += parseFloat(shift.hours || 0); 
        } 
    });
    return { earnedHours: earned, futureHours: future, totalEstimatedHours: earned + future };
  }, [workDuration, logs, scheduleList, employeeName]);

  const earnedSalary = Math.floor(earnedHours * HOURLY_WAGE);
  const total = Math.floor(totalEstimatedHours * HOURLY_WAGE);
  const bonus = calculateBonus(totalEstimatedHours);
  const percent = Math.min((totalEstimatedHours / 160) * 100, 100);

  return (
    <div className={`p-4 pb-24 space-y-6 ${THEME.bg} h-full overflow-y-auto`}>
      <h2 className={`text-2xl font-bold ${THEME.textMain} px-1`}>薪資核算</h2>
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${THEME.primary}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-10 -translate-y-10"></div>
        <p className="text-[#D4C5B0] text-sm font-medium mb-1">本月預估 (含獎金)</p>
        <h3 className="text-4xl font-bold mb-4 tracking-tight">{formatCurrency(total + bonus)}</h3>
        <div className="flex gap-4 border-t border-white/20 pt-4">
          <div className="flex-1 border-r border-white/20"><p className="text-xs text-[#D4C5B0] mb-0.5">有效工時薪資</p><p className="font-semibold text-lg">{formatCurrency(earnedSalary)}</p></div>
          <div className="flex-1 pl-4"><p className="text-xs text-[#D4C5B0] mb-0.5">達標獎金</p><p className="font-semibold text-lg text-[#FFD700]">+{formatCurrency(bonus)}</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
         <div className={`${THEME.card} p-4 rounded-xl shadow-sm border ${THEME.border}`}><p className="text-xs text-slate-500 mb-1">有效核算工時</p><p className={`text-xl font-bold ${THEME.textMain}`}>{earnedHours.toFixed(2)} <span className="text-xs font-normal">hr</span></p><p className="text-[10px] text-slate-400 mt-1">扣除早到/晚退/非排班</p></div>
         <div className={`${THEME.card} p-4 rounded-xl shadow-sm border ${THEME.border}`}><p className="text-xs text-slate-500 mb-1">未來預排工時</p><p className={`text-xl font-bold ${THEME.textSub}`}>{futureHours.toFixed(1)} <span className="text-xs font-normal">hr</span></p><p className="text-[10px] text-slate-400 mt-1">您的未來排班</p></div>
      </div>
      <div className={`${THEME.card} p-5 rounded-2xl shadow-sm border ${THEME.border}`}>
        <div className="flex justify-between items-center mb-3"><h4 className={`font-bold ${THEME.textMain} flex items-center gap-2`}><Star size={16} className="text-[#C69C6D] fill-[#C69C6D]" /> 獎金挑戰</h4><span className="text-xs text-[#8B5E3C] font-bold">160h</span></div>
        <div className="relative h-4 bg-[#F2EFE9] rounded-full mb-2 overflow-hidden"><div className="absolute top-0 left-0 h-full bg-[#8B5E3C] transition-all duration-1000" style={{ width: `${percent}%` }}></div>{[25,50,75,100].map(p=><div key={p} className="absolute top-0 h-full border-l border-white/50 w-px" style={{left:`${p}%`}}></div>)}</div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-4"><span>0</span><span>40h</span><span>80h</span><span>120h</span><span>160h</span></div>
        <div className="space-y-2">{[{h:40,b:500,l:'40H↑'},{h:80,b:1000,l:'80H↑'},{h:120,b:1500,l:'120H↑'},{h:160,b:2000,l:'160H↑'}].map(t=><div key={t.h} className={`flex justify-between items-center text-sm p-2 rounded-lg ${totalEstimatedHours>=t.h?'bg-[#FFF9E6]':''}`}><span className={totalEstimatedHours>=t.h?'text-[#8B5E3C] font-bold':'text-slate-400'}>{t.l}</span><span className={totalEstimatedHours>=t.h?'text-[#8B5E3C] font-bold':'text-slate-400'}>+${t.b}</span></div>)}</div>
      </div>
    </div>
  );
};

const ClosingView = ({ user, employeeName }) => {
  const [checks, setChecks] = useState({});
  const [log, setLog] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const handleCheck = (id) => setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  const handleSubmit = async () => {
    const allChecked = CLOSING_CHECKLIST.every(item => checks[item.id]);
    if (!allChecked) { alert("請完成所有檢查項目後再送出！"); return; }
    if (!window.confirm("確定送出閉店報告嗎？")) return;
    setIsSubmitting(true);
    try {
      const today = getTaiwanDateStr();
      await addDoc(collection(db, 'closing_reports'), { date: today, timestamp: new Date().toISOString(), employeeName: employeeName || user?.displayName, uid: user?.uid, checks: checks, log: log });
      setCompleted(true);
      alert("閉店報告已成功送出！辛苦了！");
    } catch (e) { console.error(e); alert("送出失敗: " + e.message); } finally { setIsSubmitting(false); }
  };
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2"><CheckCircle2 size={40} /></div>
        <h2 className={`text-2xl font-bold ${THEME.textMain}`}>閉店完成</h2><p className="text-slate-500">今日檢查表與日誌已歸檔。<br/>辛苦了，早點休息！</p>
        <button onClick={() => setCompleted(false)} className="text-sm text-blue-500 underline mt-4">填寫新的報告</button>
      </div>
    );
  }
  return (
    <div className={`flex flex-col h-full p-4 space-y-4 overflow-y-auto pb-24 ${THEME.bg}`}>
      <div className="flex items-center gap-2 mb-2 px-1"><ClipboardCheck size={24} className={THEME.textMain} /><h2 className={`text-2xl font-bold ${THEME.textMain}`}>閉店檢查</h2></div>
      <div className={`${THEME.card} p-4 rounded-xl border ${THEME.border} shadow-sm`}><div className="text-sm text-slate-500 mb-4 flex justify-between"><span>{getTaiwanDateStr()}</span><span>執行人: {employeeName}</span></div><div className="space-y-3">{CLOSING_CHECKLIST.map(item => (<button key={item.id} onClick={() => handleCheck(item.id)} className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${checks[item.id] ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-slate-200 text-slate-600'}`}><div className="flex items-center gap-3"><span className="text-xl">{item.icon}</span><span className="font-bold">{item.label}</span></div>{checks[item.id] ? <CheckCircle2 size={20} className="text-green-600" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}</button>))}</div></div>
      <div className={`${THEME.card} p-4 rounded-xl border ${THEME.border} shadow-sm`}><div className="flex items-center gap-2 mb-2 text-slate-700 font-bold"><FileText size={18} /><h3>交接日誌 / 備註</h3></div><textarea value={log} onChange={(e) => setLog(e.target.value)} placeholder="例如：珍珠剩半包、二號桌有點晃、明日需叫貨..." className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#8B5E3C]" /></div>
      <button onClick={handleSubmit} disabled={isSubmitting} className={`w-full py-4 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 text-white transition-all ${isSubmitting ? 'bg-slate-400' : 'bg-[#8B5E3C] hover:opacity-90'}`}>{isSubmitting ? <><Loader2 className="animate-spin"/> 傳送中...</> : <><Lock size={20}/> 確認閉店</>}</button>
    </div>
  );
};
// NoticesView omitted for brevity (same as previous)

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [workDuration, setWorkDuration] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [isIdentified, setIsIdentified] = useState(false);

  const [logs, setLogs] = useState([]);
  const [shiftsData, setShiftsData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [notices, setNotices] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!auth) { setLoadingAuth(false); return; }
    onAuthStateChanged(auth, u => { 
        setUser(u);
        setLoadingAuth(false); 
        if (u && !u.email) {
            setEmployeeName("訪客員工");
            setIsIdentified(true);
        }
    });
  }, []);

  const scheduleList = useMemo(() => {
    return [...shiftsData, ...leavesData];
  }, [shiftsData, leavesData]);

  useEffect(() => {
    if (!user || !db) return;
    
    // 1. 監聽員工名單 (Employees)
    const empQ = query(collection(db, 'employees')); 
    const unsubEmp = onSnapshot(empQ, (snap) => {
        const emps = snap.docs.map(d => d.data());
        setEmployees(emps);
        if (user.email) {
            const match = emps.find(e => e.email === user.email);
            if (match) {
                setEmployeeName(match.name);
                setIsIdentified(true);
            } else {
                setEmployeeName(user.displayName);
                setIsIdentified(false);
            }
        }
    }, (e) => console.log('No employees collection found'));

    // 2. 監聽 shifts - 修正：強制覆蓋舊時間
    const shiftsQ = query(collection(db, 'shifts')); 
    const unsubShifts = onSnapshot(shiftsQ, (snap) => {
      const parsedData = snap.docs.map(d => {
        const raw = d.data();
        
        // --- 強制校正邏輯開始 ---
        // 優先讀取程式碼中的標準時間設定
        const stdShift = SHIFT_TYPES[raw.shift] || SHIFT_TYPES[raw.type];
        let startTime, endTime, hours;

        if (stdShift && stdShift.start && stdShift.end) {
            // 如果是標準班別（白/晚/早），強制使用新時間
            startTime = stdShift.start;
            endTime = stdShift.end;
            
            // 重新計算工時
            const s = startTime.split(':').map(Number);
            const e = endTime.split(':').map(Number);
            hours = (e[0] + e[1]/60) - (s[0] + s[1]/60);
        } else {
            // 如果是非常規班別，才使用資料庫裡的 time 欄位
            const parsedTime = parseTimeRange(raw.time);
            startTime = parsedTime.start;
            endTime = parsedTime.end;
            hours = parsedTime.hours;
        }
        // --- 強制校正邏輯結束 ---

        return {
          id: d.id,
          date: raw.date,
          type: raw.shift, 
          shift: raw.shift, 
          name: raw.name,   
          startTime: startTime,
          endTime: endTime,
          hours: hours,
          isLeave: raw.shift && (raw.shift.includes('假') || raw.shift.includes('休'))
        };
      });
      setShiftsData(parsedData);
    }, (error) => console.error("Shifts error:", error));

    const potentialCollections = ['leaves', 'leave', 'leave_requests', 'time_offs'];
    const unsubscribers = [];

    potentialCollections.forEach(colName => {
        const q = query(collection(db, colName));
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const parsedData = snap.docs.map(d => {
                    const raw = d.data();
                    return {
                        id: d.id,
                        date: raw.date,
                        type: raw.type || raw.leaveType || '假', 
                        shift: raw.type || raw.leaveType || '休假', 
                        name: raw.name || raw.userName,   
                        startTime: '-',
                        endTime: '-',
                        hours: 0,
                        isLeave: true
                    };
                });
                setLeavesData(prev => {
                    const others = prev.filter(p => !p.id.startsWith(colName));
                    return [...others, ...parsedData.map(d => ({...d, id: colName + '_' + d.id}))];
                });
            }
        });
        unsubscribers.push(unsub);
    });

    const logsQ = query(collection(db, 'users', user.uid, 'logs'), orderBy('startTime', 'desc'));
    const unsubLogs = onSnapshot(logsQ, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(data);
      const activeLog = data.find(l => !l.endTime);
      if (activeLog) {
        setIsClockedIn(true);
        setClockInTime(new Date(activeLog.startTime));
        setCurrentLogId(activeLog.id);
        setWorkDuration(Math.floor((new Date() - new Date(activeLog.startTime)) / 1000));
      } else {
        setIsClockedIn(false);
        setClockInTime(null);
        setWorkDuration(0);
        setCurrentLogId(null);
      }
    });
    
    const noticesQ = query(collection(db, 'notices'));
    const unsubNotices = onSnapshot(noticesQ, (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { 
        unsubEmp();
        unsubShifts(); 
        unsubLogs(); 
        unsubNotices(); 
        unsubscribers.forEach(u => u());
    };
  }, [user]);

  const handleLogin = async () => { if(auth) try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e){ alert("請改用訪客試用"); }};
  const handleGuestLogin = async () => { if(auth) try { await signInAnonymously(auth); } catch(e){} };
  const handleLogout = () => { if(auth) signOut(auth); };

  useEffect(() => {
    let interval = null;
    if (isClockedIn) interval = setInterval(() => setWorkDuration(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const handleClockIn = async () => {
    if (!db || !user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'logs'), { startTime: new Date().toISOString(), endTime: null, duration: 0 });
    } catch (error) { console.error(error); alert("打卡失敗: 權限不足"); }
  };

  const handleClockOut = async () => {
    if (window.confirm('確定要下班打卡嗎？') && db && user && currentLogId) {
      try {
        const now = new Date();
        const finalDuration = Math.floor((now - clockInTime) / 1000);
        await updateDoc(doc(db, 'users', user.uid, 'logs', currentLogId), { endTime: now.toISOString(), duration: finalDuration });
      } catch (error) { console.error(error); alert("下班打卡失敗: 權限不足"); }
    }
  };

  const navItems = [
    { id: 'home', label: '打卡', icon: MapPin },
    { id: 'schedule', label: '班表', icon: CalendarIcon },
    { id: 'salary', label: '薪資', icon: DollarSign },
    { id: 'closing', label: '閉店', icon: ClipboardCheck },
    { id: 'notices', label: '通知', icon: Bell },
  ];

  if (loadingAuth) return <div className={`h-screen flex items-center justify-center ${THEME.bg} ${THEME.textSub}`}>載入中...</div>;
  if (!user && auth) return <LoginView onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;

  return (
    <div className={`flex flex-col h-screen ${THEME.bg} font-sans ${THEME.textMain}`}>
      <div className="absolute top-4 right-4 z-50"><button onClick={handleLogout} className="p-2 bg-white/50 rounded-full hover:bg-white text-slate-500"><LogOut size={16} /></button></div>
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <ClockInView employeeName={employeeName} isIdentified={isIdentified} isClockedIn={isClockedIn} clockInTime={clockInTime} onClockIn={handleClockIn} onClockOut={handleClockOut} workDuration={workDuration} logs={logs} scheduleList={scheduleList} />}
        {activeTab === 'schedule' && <ScheduleView employeeName={employeeName} scheduleList={scheduleList} />}
        {activeTab === 'salary' && <SalaryView employeeName={employeeName} workDuration={workDuration} logs={logs} scheduleList={scheduleList} />}
        {activeTab === 'closing' && <ClosingView user={user} employeeName={employeeName} />}
        {activeTab === 'notices' && <NoticesView notices={notices} />}
      </main>
      <nav className={`bg-white border-t ${THEME.border} fixed bottom-0 w-full pb-safe z-50`}>
        <div className="flex justify-around items-center h-16">{navItems.map(i=><button key={i.id} onClick={()=>setActiveTab(i.id)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab===i.id?'text-[#8B5E3C]':'text-[#D4C5B0]'}`}><i.icon size={24} strokeWidth={activeTab===i.id?2.5:2}/><span className="text-[10px] font-medium">{i.label}</span></button>)}</div>
      </nav>
      <div className="h-safe-bottom bg-white" />
    </div>
  );
}
