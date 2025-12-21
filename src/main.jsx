import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { 
  BookOpen, 
  Calculator, 
  Package, 
  HelpCircle, 
  Wrench, 
  Plus, 
  Minus, 
  Search, 
  ChefHat,
  Droplet,
  Thermometer,
  Info,
  ShieldAlert,
  ClipboardList,
  Flame,
  ArrowLeft,
  Coffee,
  Layers,
  Sparkles,
  Utensils,
  RefreshCw,
  Trash2,
  Database,
  Box,
  Snowflake,
  Milk,
  Candy,
  User,
  History,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  increment,
  query,
  writeBatch,
  getDocs,
  addDoc
} from 'firebase/firestore';

// --- 1. Firebase 設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyB2chVdcyUo5VnAmdtsLtedYyxN2sevOMw",
  authDomain: "mubai-20992.firebaseapp.com",
  projectId: "mubai-20992",
  storageBucket: "mubai-20992.firebasestorage.app",
  messagingSenderId: "424210919088",
  appId: "1:424210919088:web:431af5145383cca5815575",
  measurementId: "G-D8BF48KC4N"
};

// 初始化 Firebase (防止重複初始化)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // 忽略重複初始化錯誤
}

const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mubai-store'; // 固定資料庫路徑

// --- 2. 常數與資料設定 ---
const STORE_PASSWORD = "8888";
const SYRUP_IDS = ["syrup_manual", "sugar_water", "red_sugar_syrup", "mango_syrup"];

// 配方資料
const RECIPES = [
  {
    id: "syrup_manual", name: "手工糖漿", category: "topping", baseServings: 1, unit: "份 (標準鍋)",
    steps: ["準備設備：電磁爐、厚底鍋、篩網、水壺。", "將全部材料放入鍋中。", "電磁爐開大火 3500 煮開。", "轉小火 800 續煮 15 分鐘。", "過程不需要攪拌，也不要蓋蓋子。", "煮好後過濾保存。"],
    ingredients: [{ name: "黃冰糖", amount: 1600, unit: "g" }, { name: "麥芽糖", amount: 80, unit: "g" }, { name: "熱水", amount: 1680, unit: "g" }, { name: "檸檬汁", amount: 12, unit: "g" }],
    equipment: "電磁爐、厚底鍋、篩網、水壺", notes: "過程不攪拌、不蓋蓋子", storage: "冷藏保存"
  },
  {
    id: "sugar_water", name: "糖水", category: "topping", baseServings: 1, unit: "份",
    steps: ["準備設備", "材料混合加熱至溶解"],
    ingredients: [{ name: "熱水", amount: 500, unit: "g" }, { name: "砂糖", amount: 400, unit: "g" }, { name: "檸檬汁", amount: 0.5, unit: "g" }],
    equipment: "電磁爐、厚底鍋", notes: "簡單混合加熱", storage: "冷藏"
  },
  {
    id: "red_sugar_syrup", name: "紅糖漿", category: "topping", baseServings: 1, unit: "份",
    steps: ["炒化糖", "煮沸", "轉小火"],
    ingredients: [{ name: "片紅糖", amount: 140, unit: "g" }, { name: "黑糖", amount: 60, unit: "g" }, { name: "熱水", amount: 200, unit: "g" }, { name: "檸檬汁", amount: 0.6, unit: "g" }],
    equipment: "厚底鍋", notes: "需炒化", storage: "冷藏"
  },
  { id: "mango_syrup", name: "芒果漿", category: "topping", baseServings: 1, unit: "份", steps: ["所有材料混合均勻"], ingredients: [{ name: "淺色芒果漿", amount: 350, unit: "g" }, { name: "手工糖漿", amount: 20, unit: "g" }, { name: "水", amount: 10, unit: "g" }, { name: "檸檬水", amount: 0.6, unit: "g" }], equipment: "水壺", notes: "不耐放", storage: "冷藏" },
  { id: "lotus_seeds", name: "蓮子", category: "topping", baseServings: 1, unit: "份", steps: ["放入蒸架、放入鍋中", "閉氣煮13分鐘"], ingredients: [{ name: "蓮子", amount: 1000, unit: "g" }, { name: "砂糖", amount: 300, unit: "g" }, { name: "水", amount: 2600, unit: "適量" }], equipment: "高壓鍋", notes: "閉氣壓", storage: "糖水保存" },
  { id: "lotus_root", name: "蓮藕片", category: "topping", baseServings: 1, unit: "份", steps: ["蓮藕切片1公分厚，全部材料放入高壓鍋", "有聲音後25分鐘，關火洩氣", "再翻炒收汁約30分鐘", "3200大火煮掉一半水", "轉中火1200煮至粘稠"], ingredients: [{ name: "蓮藕", amount: 1500, unit: "g" }, { name: "砂糖", amount: 135, unit: "g" }, { name: "片紅糖", amount: 105, unit: "g" }, { name: "水", amount: 1500, unit: "g" }], equipment: "高壓鍋", notes: "收汁", storage: "冷藏" },
  { id: "barley", name: "薏仁", category: "topping", baseServings: 1, unit: "份", steps: ["所有材料放置高壓鍋煮", "有聲音後30分鐘", "洩氣瀝乾水"], ingredients: [{ name: "薏仁", amount: 1000, unit: "g" }, { name: "水", amount: 4500, unit: "g" }, { name: "砂糖", amount: 200, unit: "g" }], equipment: "高壓鍋", notes: "閉氣", storage: "瀝乾" },
  { id: "chestnut", name: "栗子", category: "topping", baseServings: 1, unit: "份", steps: ["水沒過栗子加入冰糖", "大火3500煮沸轉1600煮20分鐘"], ingredients: [{ name: "栗子", amount: 2500, unit: "g" }, { name: "黃冰糖", amount: 500, unit: "g" }], equipment: "鍋", notes: "撈浮沫", storage: "原湯" },
  { id: "red_bean", name: "紅豆 (顆粒)", category: "topping", baseServings: 1, unit: "份", steps: ["所有材料放入高壓鍋，有聲音後25分鐘", "關閉悶10分鐘"], ingredients: [{ name: "紅豆", amount: 400, unit: "g" }, { name: "砂糖", amount: 120, unit: "g" }, { name: "水", amount: 1170, unit: "g" }, { name: "檸檬汁", amount: 1, unit: "g" }], equipment: "高壓鍋", notes: "常溫浸泡", storage: "瀝乾" },
  { id: "red_bean_paste", name: "紅豆沙", category: "base", baseServings: 1, unit: "份", steps: ["除了陳皮外其餘材料放入高壓鍋，有聲音後煮25分鐘", "再加1500水再煮25分鐘，悶十分鐘後放入陳皮", "取一半紅豆少部分水用破壁機打成泥狀，再倒回去拌勻"], ingredients: [{ name: "紅豆", amount: 400, unit: "g" }, { name: "砂糖", amount: 100, unit: "g" }, { name: "水", amount: 2000, unit: "g" }, { name: "檸檬汁", amount: 20, unit: "g" }, { name: "陳皮", amount: 3, unit: "g" }], equipment: "高壓鍋", notes: "綿密", storage: "當天" },
  { id: "cassava", name: "木薯", category: "topping", baseServings: 1, unit: "份", steps: ["所有材料放置高壓鍋煮，有聲音後90分鐘"], ingredients: [{ name: "木薯", amount: 200, unit: "g" }, { name: "水", amount: 800, unit: "g" }, { name: "砂糖", amount: 50, unit: "g" }, { name: "片紅糖", amount: 50, unit: "g" }], equipment: "高壓鍋", notes: "閉氣", storage: "原湯" },
  { id: "taro_chunks", name: "芋頭塊", category: "topping", baseServings: 1, unit: "份", steps: ["所有材料放進高壓鍋，聽到聲音12分鐘", "洩氣後馬上攤涼"], ingredients: [{ name: "芋頭塊", amount: 400, unit: "g" }, { name: "砂糖", amount: 100, unit: "g" }, { name: "片紅糖", amount: 30, unit: "g" }, { name: "水", amount: 1000, unit: "g" }], equipment: "高壓鍋", notes: "放氣", storage: "冷藏" },
  { id: "sticky_rice_balls", name: "糯米球", category: "topping", baseServings: 1, unit: "份", steps: ["白糯米、紫米先浸泡", "高壓鍋25分鐘", "洩氣後倒入砂糖快速拌勻"], ingredients: [{ name: "水", amount: 500, unit: "g" }, { name: "白糯米", amount: 75, unit: "g" }, { name: "紫米", amount: 150, unit: "g" }, { name: "砂糖", amount: 20, unit: "g" }], equipment: "高壓鍋", notes: "預泡", storage: "冷藏" },
  { id: "taro_paste", name: "芋泥", category: "topping", baseServings: 1, unit: "份", steps: ["芋泥蒸軟，放置盆中倒入黃油，用餘溫拌開", "再加入其他材料用打蛋器打勻", "不超過五分鐘"], ingredients: [{ name: "芋泥(蒸熟)", amount: 1500, unit: "g" }, { name: "砂糖", amount: 145, unit: "g" }, { name: "淡奶", amount: 290, unit: "g" }, { name: "牛奶", amount: 300, unit: "g" }, { name: "黃油", amount: 36, unit: "g" }, { name: "煉乳", amount: 55, unit: "g" }, { name: "紫薯粉", amount: 7, unit: "g" }], equipment: "蒸籠", notes: "勤做", storage: "平盤" },
  { id: "mochi_milk", name: "鮮奶米麻薯", category: "topping", baseServings: 1, unit: "份", steps: ["材料混合均勻，用小火1600攪拌", "兩分鐘粘稠後關火，放入糯米攪拌均勻"], ingredients: [{ name: "木薯澱粉", amount: 20, unit: "g" }, { name: "糯米粉", amount: 80, unit: "g" }, { name: "砂糖", amount: 20, unit: "g" }, { name: "牛奶", amount: 250, unit: "g" }, { name: "鮮奶油", amount: 75, unit: "g" }, { name: "鹽", amount: 1, unit: "g" }, { name: "糯米(熟)", amount: 60, unit: "g" }], equipment: "鍋", notes: "不停攪拌", storage: "常溫" },
  { id: "sweet_potato_chunks", name: "地瓜塊", category: "topping", baseServings: 1, unit: "份", steps: ["放入鍋中、放入片糖", "水沫過地瓜", "水滾煮7分鐘"], ingredients: [{ name: "地瓜", amount: 500, unit: "g" }, { name: "紅片糖", amount: 92, unit: "g" }, { name: "水", amount: 2000, unit: "g" }], equipment: "鍋子", notes: "閉氣", storage: "湯保存" },
  { id: "oat_grains", name: "燕麥粒", category: "topping", baseServings: 1, unit: "份", steps: ["所有材料進高壓鍋，放氣30分鐘"], ingredients: [{ name: "燕麥粒", amount: 250, unit: "g" }, { name: "砂糖", amount: 50, unit: "g" }, { name: "水", amount: 1500, unit: "g" }], equipment: "高壓鍋", notes: "放氣", storage: "-" },
  { id: "tofu_skin", name: "腐皮", category: "topping", baseServings: 1, unit: "份", steps: ["洗淨煮兩遍"], ingredients: [{ name: "乾腐皮", amount: 200, unit: "g" }], equipment: "鍋", notes: "換水", storage: "冷水" },
  
  // Bases
  { id: "soy_milk_base", name: "豆漿湯底", category: "base", baseServings: 1, unit: "份", steps: ["混合加熱"], ingredients: [{ name: "豆漿", amount: 390, unit: "g" }, { name: "黃冰糖", amount: 16, unit: "g" }], equipment: "鍋", notes: "糖化", storage: "冷藏" },
  { id: "milk_soup_base", name: "鮮奶湯底", category: "base", baseServings: 1, unit: "份", steps: ["所有材料拌勻"], ingredients: [{ name: "牛奶", amount: 3000, unit: "g" }, { name: "手工糖漿", amount: 250, unit: "g" }, { name: "咖奶", amount: 300, unit: "g" }, { name: "淡奶油", amount: 300, unit: "g" }, { name: "水", amount: 750, unit: "g" }], equipment: "壺", notes: "混合", storage: "冷藏" },
  { id: "white_fungus_base", name: "銀耳湯底", category: "base", baseServings: 1, unit: "份", steps: ["銀耳先泡水一小時，洗淨", "大火3500煮40分鐘", "銀耳水持平就要補水1000-1500cc，每次補水前打蛋器打發"], ingredients: [{ name: "銀耳", amount: 70, unit: "g" }, { name: "砂糖", amount: 600, unit: "g" }, { name: "水", amount: 2000, unit: "g" }, { name: "補水", amount: 1500, unit: "g" }], equipment: "鍋", notes: "補水", storage: "冷藏" },
  { id: "coconut_milk_base_a", name: "椰奶湯底 A", category: "base", baseServings: 1, unit: "份", steps: ["水、椰子粉、砂糖先煮化", "加入椰漿、牛奶拌勻即可"], ingredients: [{ name: "水", amount: 120, unit: "g" }, { name: "椰子粉", amount: 50, unit: "g" }, { name: "砂糖", amount: 6, unit: "g" }, { name: "椰漿", amount: 5, unit: "g" }, { name: "牛奶", amount: 20, unit: "g" }], equipment: "鍋", notes: "煮粉", storage: "冷藏" },
  { id: "coconut_milk_base_b", name: "椰奶湯底 B", category: "base", baseServings: 1, unit: "份", steps: ["全部材料混合即可"], ingredients: [{ name: "淡奶油", amount: 90, unit: "g" }, { name: "椰漿", amount: 90, unit: "g" }, { name: "牛奶", amount: 150, unit: "g" }, { name: "旺仔", amount: 200, unit: "g" }, { name: "手工糖漿", amount: 10, unit: "g" }], equipment: "壺", notes: "混合", storage: "冷藏" },
  { id: "milk_tea_base", name: "奶茶湯底", category: "base", baseServings: 1, unit: "份", steps: ["茶葉＋熱水取茶湯，悶泡10分", "將其餘材料混即可"], ingredients: [{ name: "阿薩姆茶葉", amount: 6, unit: "g" }, { name: "熱水", amount: 300, unit: "g" }, { name: "牛奶", amount: 60, unit: "g" }, { name: "砂糖", amount: 30, unit: "g" }, { name: "黑白淡奶", amount: 70, unit: "g" }, { name: "奶咖", amount: 40, unit: "g" }, { name: "紅糖漿", amount: 20, unit: "g" }], equipment: "壺", notes: "悶泡", storage: "冷藏" },
  { id: "grass_jelly_base", name: "仙草湯底", category: "base", baseServings: 1, unit: "份", steps: ["茶葉＋熱水取茶湯，悶泡10分", "將其餘材料混即可"], ingredients: [{ name: "阿薩姆茶葉", amount: 6, unit: "g" }, { name: "熱水", amount: 300, unit: "g" }, { name: "牛奶", amount: 60, unit: "g" }, { name: "砂糖", amount: 30, unit: "g" }, { name: "黑白淡奶", amount: 70, unit: "g" }, { name: "奶咖", amount: 40, unit: "g" }, { name: "紅糖漿", amount: 25, unit: "g" }, { name: "仙草汁", amount: 2, unit: "g" }], equipment: "壺", notes: "混合", storage: "冷藏" },
  { id: "coconut_juice_milk", name: "椰汁椰奶", category: "base", baseServings: 1, unit: "份", steps: ["椰肉、椰水、水、糖先用破壁機30秒打勻", "再加入其他材料拌勻"], ingredients: [{ name: "新鮮椰肉", amount: 120, unit: "g" }, { name: "椰水", amount: 200, unit: "g" }, { name: "水", amount: 100, unit: "g" }, { name: "砂糖", amount: 5, unit: "g" }, { name: "椰漿", amount: 15, unit: "g" }, { name: "牛奶", amount: 40, unit: "g" }, { name: "煉乳", amount: 10, unit: "g" }], equipment: "破壁機", notes: "打勻", storage: "冷藏" },
  { id: "double_skin_milk", name: "皺皮奶", category: "base", baseServings: 1, unit: "份", steps: ["待更新"], ingredients: [{ name: "紅皮雞蛋(全蛋)", amount: 125, unit: "g" }, { name: "蛋清", amount: 295, unit: "g" }, { name: "牛奶", amount: 1260, unit: "g" }, { name: "淡奶油", amount: 32.5, unit: "g" }, { name: "砂糖", amount: 75, unit: "g" }], equipment: "烤箱", notes: "烤溫", storage: "冷藏" },
  { id: "double_skin_jelly", name: "雙皮奶凍花", category: "base", baseServings: 1, unit: "份", steps: ["吉利丁泡冷水軟化五分鐘", "其餘材料加熱至55度關火", "加入泡好的吉利丁攪拌均勻倒入模具"], ingredients: [{ name: "牛奶", amount: 300, unit: "g" }, { name: "砂糖", amount: 30, unit: "g" }, { name: "淡奶油", amount: 120, unit: "g" }, { name: "吉利丁", amount: 10, unit: "g" }], equipment: "鍋", notes: "溫度", storage: "冷凍" },
  { id: "creme_brulee", name: "焦糖布蕾", category: "base", baseServings: 1, unit: "份", steps: ["牛奶、淡奶油小火2000加熱至60度關火", "慢慢倒入布丁粉攪拌到無顆粒再加熱至80度關火", "倒入模具放涼冷藏"], ingredients: [{ name: "牛奶", amount: 400, unit: "g" }, { name: "淡奶油", amount: 400, unit: "g" }, { name: "布丁粉", amount: 100, unit: "g" }], equipment: "鍋", notes: "溫度", storage: "冷藏" },
  { id: "tofu_pudding", name: "豆酪", category: "base", baseServings: 1, unit: "份", steps: ["先將豆漿粉、蒟蒻粉、糖混合均勻備用", "水加熱到80-90度，關火", "倒入粉類拌勻，浸泡十分鐘", "再將淡奶油、牛奶倒入混合開火2000", "加熱到80度關火，過篩後倒入模具", "倒入模具放涼冷藏"], ingredients: [{ name: "蒟蒻粉", amount: 48, unit: "g" }, { name: "豆漿粉", amount: 300, unit: "g" }, { name: "熱水", amount: 1680, unit: "g" }, { name: "牛奶", amount: 1080, unit: "g" }, { name: "淡奶油", amount: 180, unit: "g" }, { name: "砂糖", amount: 120, unit: "g" }], equipment: "鍋", notes: "混合", storage: "冷藏" },
  { id: "autumn_pear", name: "秋冬梨", category: "base", baseServings: 1, unit: "份", steps: ["所有材料放入高壓鍋，水沒過梨", "聽到聲音後計時20分鐘", "放涼後進冰箱"], ingredients: [{ name: "鴨梨", amount: 9, unit: "顆" }, { name: "黃冰糖", amount: 150, unit: "g" }, { name: "水", amount: 1500, unit: "g" }], equipment: "高壓鍋", notes: "不可回冰", storage: "冷藏" },
  { id: "sesame_paste", name: "芝麻糊", category: "base", baseServings: 1, unit: "份", steps: ["除了糖外將其他材料放入破壁機中高速打5-8分鐘", "過濾後再加入砂糖放入鍋中加熱", "約五分鐘可糊化"], ingredients: [{ name: "水", amount: 1100, unit: "g" }, { name: "熟黑芝麻", amount: 120, unit: "g" }, { name: "白糯米", amount: 50, unit: "g" }, { name: "砂糖", amount: 70, unit: "g" }], equipment: "破壁機", notes: "現做", storage: "保溫" },
  { id: "water_chestnut", name: "馬蹄沙", category: "base", baseServings: 1, unit: "份", steps: ["馬蹄切碎備用", "750g水、黃片糖加熱煮化糖，加入馬蹄煮沸", "將芡水慢慢倒入攪勻", "隔冰水降溫"], ingredients: [{ name: "馬蹄", amount: 200, unit: "g" }, { name: "水", amount: 750, unit: "g" }, { name: "黃片糖", amount: 150, unit: "g" }, { name: "馬蹄粉", amount: 15, unit: "g" }], equipment: "鍋", notes: "降溫", storage: "冷藏" },
  { id: "aunt_drink", name: "姨媽熱飲", category: "base", baseServings: 1, unit: "份", steps: ["取茶湯250g，將所有材料拌勻即可", "出品可加玫瑰花瓣、紅棗片、枸杞等"], ingredients: [{ name: "阿薩姆紅茶", amount: 5, unit: "g" }, { name: "熱水", amount: 300, unit: "g" }, { name: "牛奶", amount: 90, unit: "g" }, { name: "奶咖", amount: 25, unit: "g" }, { name: "黑糖漿", amount: 20, unit: "g" }, { name: "薑汁", amount: 10, unit: "g" }], equipment: "鍋", notes: "現點現做", storage: "現做" }
];

const DRY_GOODS_DATA = [
  { name: "【乾貨】砂糖", unit: "包(1kg)", category: "dry_sugar" },
  { name: "【乾貨】紅片糖", unit: "箱(10kg)", category: "dry_sugar" },
  { name: "【乾貨】麥芽糖", unit: "罐", category: "dry_sugar" },
  { name: "【乾貨】黑糖", unit: "包", category: "dry_sugar" },
  { name: "【乾貨】冰糖", unit: "包", category: "dry_sugar" },
  { name: "【乾貨】鹽", unit: "包", category: "dry_sugar" },
  { name: "【乾貨】糯米粉", unit: "包", category: "dry_sugar" },
  { name: "【乾貨】木薯粉", unit: "包", category: "dry_sugar" },
  { name: "【乾貨】豆漿(原液)", unit: "罐", category: "dry_dairy" },
  { name: "【乾貨】鮮奶油", unit: "罐", category: "dry_dairy" },
  { name: "【乾貨】牛奶", unit: "罐", category: "dry_dairy" },
  { name: "【乾貨】生木薯", unit: "袋", category: "dry_frozen" },
  { name: "【乾貨】生蓮藕片", unit: "袋", category: "dry_frozen" },
  { name: "【乾貨】生芋圓", unit: "包", category: "dry_frozen" },
  { name: "【乾貨】生湯圓", unit: "包", category: "dry_frozen" },
  { name: "【乾貨】芋泥包", unit: "包", category: "dry_frozen" },
  { name: "【乾貨】薏仁", unit: "袋(50斤)", category: "dry_pantry" },
  { name: "【乾貨】紅豆", unit: "袋(50斤)", category: "dry_pantry" },
  { name: "【乾貨】燕麥粒", unit: "袋(50斤)", category: "dry_pantry" },
  { name: "【乾貨】圓糯米", unit: "袋(50斤)", category: "dry_pantry" },
  { name: "【乾貨】紫米", unit: "袋(50斤)", category: "dry_pantry" },
  { name: "【乾貨】蓮子", unit: "包(450g)", category: "dry_pantry" },
  { name: "【乾貨】芝麻", unit: "包(500g)", category: "dry_pantry" },
  { name: "【乾貨】銀耳碎", unit: "包(500g)", category: "dry_pantry" },
  { name: "【乾貨】乾豆皮", unit: "包", category: "dry_pantry" },
  { name: "【乾貨】紅棗", unit: "包", category: "dry_pantry" },
  { name: "【乾貨】枸杞", unit: "包", category: "dry_pantry" },
  { name: "【乾貨】陳皮", unit: "包", category: "dry_pantry" }
];

const QA_DATA = [
  { q: "紅豆煮不爛怎麼辦？", a: "請確保紅豆有提前浸泡至少 4 小時。煮的時候水要滾才下豆，加水只能加熱水。" },
  { q: "客人反映糖水太甜？", a: "請確認配方比例。若標準比例仍覺得甜，可提供少量溫開水。" },
  { q: "雪耳不出膠怎麼辦？", a: "剪碎一點，小火慢燉不少於 1.5 小時。" },
  { q: "外帶杯蓋蓋不緊？", a: "擦拭杯緣後再蓋，或更換杯蓋。" }
];

const OPENING_SOP = ["一到店換裝整理儀容", "開工作燈、開冷氣", "基本環境檢查", "檢查吧台、操作台", "確認冰箱溫度", "洗手、戴手套", "看今日清單"];
const PRESSURE_COOKER_SAFETY = ["禁止手提鍋蓋移動。", "務必等待洩氣完畢。", "清洗洩壓閥。", "擦乾鍋外。", "氣壓閥未立起請通報。", "禁止煮濃稠/易溢出食材。", "內容物不可超過一半。", "嚴重警告：不當使用恐致爆炸。"];
const WORK_ENVIRONMENT_RULES = ["擦拭高壓鍋外觀。", "工作區無糖漬。", "地板乾燥。", "隨手清洗器具。"];
const STOVE_CLEANING_GUIDE = [{ title: "清潔工具", desc: "陶瓷/塑膠用海綿，鐵鍋用鋼刷。" }, { title: "電磁爐", desc: "保持通風，面板不燙時擦拭。" }, { title: "電陶爐", desc: "務必冷卻後用濕布擦拭。" }];
const EQUIPMENT_DATA = [
  { id: 2, name: "平冷冰箱", cycle: "每週", task: "清洗內外，檢查溫度。" },
  { id: 3, name: "淨水器", cycle: "每月", task: "檢查濾芯顏色。" },
  { id: 5, name: "製冰機", cycle: "每月", task: "拆洗濾網。" },
  { id: 6, name: "直立式冰箱", cycle: "每週", task: "檢查並倒掉接水盤積水。" }
];

// --- 3. 元件定義 (Components) ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 border-2 border-amber-200">
        <h3 className="text-lg font-bold text-stone-800 mb-3 text-center">確認操作</h3>
        <p className="text-sm text-stone-600 mb-6 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-500 font-bold">取消</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-amber-600 text-white font-bold shadow-lg">確定</button>
        </div>
      </div>
    </div>
  );
};

const EquipmentModule = () => {
  return (
    <div className="p-4 pb-24 max-w-md mx-auto space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-amber-800 mb-4 flex items-center"><ClipboardList className="mr-2" /> 早晨開店 SOP</h2>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-100">
          <ul className="space-y-3">
            {OPENING_SOP.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0 mt-0.5"></span>
                <span className="text-stone-700 font-medium">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-amber-800 mb-3 flex items-center"><Sparkles className="mr-2" /> 工作環境與衛生規範</h2>
        <div className="bg-amber-50 p-5 rounded-xl shadow-sm border border-amber-200">
          <ul className="space-y-3 text-amber-900 text-sm leading-relaxed">
            {WORK_ENVIRONMENT_RULES.map((rule, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-red-700 mb-3 flex items-center"><ShieldAlert className="mr-2" /> 高壓鍋安全規範</h2>
        <div className="bg-red-50 p-5 rounded-xl shadow-sm border border-red-200">
          <ul className="space-y-3 text-red-900 text-sm leading-relaxed">
            {PRESSURE_COOKER_SAFETY.map((rule, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-stone-700 mb-3 flex items-center"><Flame className="mr-2" /> 爐具使用與清潔</h2>
        <div className="grid gap-3">
          {STOVE_CLEANING_GUIDE.map((guide, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-1">{guide.title}</h3>
              <p className="text-sm text-stone-600 whitespace-pre-line">{guide.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-stone-700 mb-3 flex items-center"><Wrench className="mr-2" /> 定期保養</h2>
        <div className="grid gap-3">
          {EQUIPMENT_DATA.map((eq) => (
            <div key={eq.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-stone-800">{eq.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600">{eq.cycle}</span>
              </div>
              <p className="text-stone-600 text-xs">{eq.task}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const RecipeModule = () => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [targetServings, setTargetServings] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredRecipes = RECIPES.filter(r => {
    const matchSearch = r.name.includes(searchTerm);
    const matchCategory = filterCategory === 'all' || r.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getBatchWeight = (recipe) => {
    return recipe.ingredients.reduce((acc, curr) => {
      if (curr.unit === 'g' || curr.unit === 'ml' || curr.unit.includes('g')) {
        return acc + curr.amount;
      }
      return acc; 
    }, 0);
  };

  const getDisplayAmount = (ing, recipe, servings, mult) => {
     const isBatchMode = SYRUP_IDS.includes(recipe.id);
     let val = 0;
     if (isBatchMode) {
        val = ing.amount * mult;
     } else {
        const batchWeight = getBatchWeight(recipe);
        let servingSize = recipe.category === 'base' ? 450 : 40;
        const totalTargetWeight = servings * servingSize;
        const ratio = batchWeight > 0 ? totalTargetWeight / batchWeight : 1;
        val = ing.amount * ratio;
     }
     
     if (ing.unit === 'g' || ing.unit === 'ml') {
        if (val >= 1000) return (val/1000).toFixed(2) + " kg";
        return Math.round(val);
     }
     return (val).toFixed(1);
  };

  const getDisplayUnit = (ing, val) => {
      if ((ing.unit === 'g' || ing.unit === 'ml') && typeof val === 'string' && val.includes('kg')) return '';
      return ing.unit;
  };

  const isBatchMode = selectedRecipe && SYRUP_IDS.includes(selectedRecipe.id);

  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-800 mb-4 flex items-center">
        <ChefHat className="mr-2" /> 配方製作
      </h2>

      {!selectedRecipe ? (
        <>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilterCategory('all')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${filterCategory === 'all' ? 'bg-amber-600 text-white shadow-md' : 'bg-white border'}`}>全部</button>
            <button onClick={() => setFilterCategory('base')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 ${filterCategory === 'base' ? 'bg-amber-600 text-white shadow-md' : 'bg-white border'}`}><Coffee size={16} /> 湯底</button>
            <button onClick={() => setFilterCategory('topping')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 ${filterCategory === 'topping' ? 'bg-amber-600 text-white shadow-md' : 'bg-white border'}`}><Layers size={16} /> 小料</button>
          </div>

          <input className="w-full p-2 mb-4 border rounded-lg" placeholder="搜尋..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="grid gap-3">{filteredRecipes.map(r => (
            <button key={r.id} onClick={() => { setSelectedRecipe(r); setMultiplier(1); setTargetServings(30); }} className="bg-white p-4 rounded-xl shadow-sm border text-left">
              <h3 className="font-bold text-lg">{r.name}</h3>
              <p className="text-xs text-stone-500">標準: {r.unit}</p>
            </button>
          ))}</div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border p-5 space-y-6">
           <div className="flex justify-between items-center"><h3 className="font-bold text-xl">{selectedRecipe.name}</h3><button onClick={() => setSelectedRecipe(null)} className="bg-stone-100 px-3 py-1 rounded-full text-sm">返回</button></div>
           
           <div className="bg-amber-50 p-4 rounded-lg">
             {isBatchMode ? (
               <>
                 <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center"><Calculator size={16} className="mr-1"/> 製作倍率 (標準為 1 鍋)</label>
                 <div className="flex items-center gap-2">
                   <button onClick={() => setMultiplier(m => Math.max(0.25, m - 0.25))} className="w-10 h-10 flex items-center justify-center bg-white border border-amber-300 rounded-lg text-amber-600 font-bold">-</button>
                   <input type="number" step="0.1" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value) || 0)} className="flex-1 p-2 text-xl font-bold text-center border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 text-amber-900 bg-white" />
                   <button onClick={() => setMultiplier(m => m + 0.25)} className="w-10 h-10 flex items-center justify-center bg-white border border-amber-300 rounded-lg text-amber-600 font-bold">+</button>
                   <span className="font-medium text-stone-600 whitespace-nowrap">鍋/份</span>
                 </div>
               </>
             ) : (
               <>
                 <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center"><Calculator size={16} className="mr-1"/> 今日預計出餐份數 (人)</label>
                 <div className="flex items-center gap-2 mb-2">
                   <button onClick={() => setTargetServings(m => Math.max(1, m - 5))} className="w-10 h-10 flex items-center justify-center bg-white border border-amber-300 rounded-lg text-amber-600 font-bold">-5</button>
                   <input type="number" value={targetServings} onChange={(e) => setTargetServings(parseInt(e.target.value) || 0)} className="flex-1 p-2 text-xl font-bold text-center border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 text-amber-900 bg白" />
                   <button onClick={() => setTargetServings(m => m + 5)} className="w-10 h-10 flex items-center justify-center bg-white border border-amber-300 rounded-lg text-amber-600 font-bold">+5</button>
                 </div>
                 <div className="text-xs text-amber-700 text-center font-medium bg-amber-100 py-1 rounded">計算基準：{selectedRecipe.category === 'base' ? '每碗 450g' : '每份 40g'} × {targetServings} 人 = 總需 {((selectedRecipe.category === 'base' ? 450 : 40) * targetServings / 1000).toFixed(1)} kg</div>
               </>
             )}
           </div>

           <div>
             <h4 className="font-bold text-stone-700 mb-3 border-b pb-1 flex items-center"><Package size={18} className="mr-1.5 text-amber-600"/> 所需食材 (已換算)</h4>
             <ul className="space-y-2 bg-stone-50 p-3 rounded-lg">
               {selectedRecipe.ingredients.map((ing, idx) => {
                 const displayVal = getDisplayAmount(ing, selectedRecipe, targetServings, multiplier);
                 return (
                   <li key={idx} className="flex justify-between items-center py-1 border-b border-stone-200 last:border-0">
                     <span className="text-stone-600 font-medium">{ing.name}</span>
                     <span className="font-mono font-bold text-amber-700 text-lg">{displayVal}<small className="text-sm font-normal text-stone-500 ml-1">{getDisplayUnit(ing, displayVal)}</small></span>
                   </li>
                 );
               })}
             </ul>
           </div>

           {selectedRecipe.equipment && (
             <div>
               <h4 className="font-bold text-stone-700 mb-2 border-b pb-1 flex items-center"><Wrench size={18} className="mr-1.5 text-stone-500"/> 設備需求</h4>
               <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded border border-stone-100">{selectedRecipe.equipment}</p>
             </div>
           )}

           <div>
             <h4 className="font-bold text-stone-700 mb-3 border-b pb-1 flex items-center"><BookOpen size={18} className="mr-1.5 text-amber-600"/> 製作流程</h4>
             <ol className="space-y-3">
               {selectedRecipe.steps.map((step, idx) => (
                 <li key={idx} className="flex gap-3 text-stone-700 text-sm leading-relaxed">
                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mt-0.5">{idx + 1}</span>
                   <span>{step}</span>
                 </li>
               ))}
             </ol>
           </div>

           <div className="grid grid-cols-2 gap-3">
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
               <h5 className="font-bold text-blue-800 text-xs mb-1 flex items-center"><Info size={14} className="mr-1"/> 重點備註</h5>
               <p className="text-xs text-blue-900 leading-snug">{selectedRecipe.notes || "無"}</p>
             </div>
             <div className="bg-green-50 p-3 rounded-lg border border-green-100">
               <h5 className="font-bold text-green-800 text-xs mb-1 flex items-center"><Thermometer size={14} className="mr-1"/> 保存方式</h5>
               <p className="text-xs text-green-900 leading-snug">{selectedRecipe.storage || "詳見標準規範"}</p>
             </div>
           </div>

           <button onClick={() => setSelectedRecipe(null)} className="w-full mt-6 bg-stone-100 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"><ArrowLeft size={20} /> 返回列表</button>
        </div>
      )}
    </div>
  );
};

const InventoryModule = ({ user, appId, operatorName }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError("無法載入資料");
      setLoading(false);
    });
    return () => unsub();
  }, [user, appId]);

  const updateStock = async (id, delta, name, unit) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', id), { quantity: increment(delta) });
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
      timestamp: new Date().toISOString(), operator: operatorName, itemName: name, change: delta, unit: unit, action: 'update'
    });
  };

  const zeroStock = async (id, name, unit) => {
    if (confirmId === id) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', id), { quantity: 0 });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { timestamp: new Date().toISOString(), operator: operatorName, itemName: name, change: '歸零', unit: unit, action: 'reset' });
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  const performReset = async () => {
    setLoading(true);
    setShowResetConfirm(false);
    try {
        const col = collection(db, 'artifacts', appId, 'public', 'data', 'inventory');
        const snap = await getDocs(col);
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        
        // Use FULL list for reset
        [...RECIPES, ...DRY_GOODS_DATA].forEach(i => {
           // Determine quantity logic: Dry goods have defaults, recipes (prepared) default to 0 or a safe prep amount
           const qty = i.quantity || (i.category?.startsWith('dry') ? 5 : 0);
           batch.set(doc(col), { name: i.name, quantity: qty, unit: i.unit, category: i.category || 'unknown' });
        });
        
        await batch.commit();
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { timestamp: new Date().toISOString(), operator: '系統', itemName: '全庫存', change: '重置', unit: '', action: 'reset' });
    } catch (e) {
        console.error("Reset failed", e);
        setError("重置失敗");
    } finally {
        setLoading(false);
    }
  };

  const filtered = items.filter(i => {
    const cat = i.category || 'unknown';
    if (filter === 'all') return true;
    if (['dry_sugar', 'dry_dairy', 'dry_frozen', 'dry_pantry'].includes(filter)) return cat === filter;
    return cat === filter;
  });

  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-amber-800 flex items-center"><Package className="mr-2"/> 庫存</h2>
        <button onClick={() => setShowResetConfirm(true)} className="p-2 bg-red-100 text-red-600 rounded-full"><RefreshCw size={20}/></button>
      </div>
      
      <ConfirmModal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} onConfirm={performReset} message="確定要重置庫存嗎？這將會清空並重新匯入所有品項。" />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {['all', 'base', 'topping', 'dry_sugar', 'dry_dairy', 'dry_frozen', 'dry_pantry'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${filter === f ? 'bg-amber-600 text-white' : 'bg-white border'}`}>
            {f === 'all' ? '全部' : f === 'base' ? '湯底' : f === 'topping' ? '小料' : f === 'dry_sugar' ? '糖/粉' : f === 'dry_dairy' ? '奶類' : f === 'dry_frozen' ? '冷凍' : '常溫'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-10">載入中...</div> : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isBulk = item.unit && item.unit.includes('50斤');
            const isDry = item.category && item.category.startsWith('dry_');
            const isBase = item.category === 'base';
            const isTopping = item.category === 'topping';
            
            return (
              <div key={item.id} className="bg-white p-3 rounded-xl border shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-800">{item.name}</span>
                  <span className="font-bold text-xl text-amber-800">{Number(item.quantity).toFixed(2).replace(/\.00$/, '')} <small className="text-xs text-stone-500">{item.unit}</small></span>
                </div>
                <div className="flex justify-end gap-2 items-center">
                   <button onClick={() => zeroStock(item.id, item.name, item.unit)} className={`h-8 px-2 rounded flex items-center ${confirmId === item.id ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-400'}`}>{confirmId === item.id ? <span className="text-xs font-bold">確定?</span> : <Trash2 size={14}/>}</button>
                   {isBulk ? (
                     <div className="flex gap-1 overflow-x-auto no-scrollbar">
                       <button onClick={() => updateStock(item.id, -0.33, item.name, item.unit)} className="bg-stone-100 px-2 py-1 rounded text-xs whitespace-nowrap">-1/3</button>
                       <button onClick={() => updateStock(item.id, -0.5, item.name, item.unit)} className="bg-stone-100 px-2 py-1 rounded text-xs whitespace-nowrap">-半</button>
                       <button onClick={() => updateStock(item.id, -0.8, item.name, item.unit)} className="bg-stone-100 px-2 py-1 rounded text-xs whitespace-nowrap">-八分</button>
                       <button onClick={() => updateStock(item.id, -1, item.name, item.unit)} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">-1</button>
                     </div>
                   ) : isDry ? (
                     <>
                       <button onClick={() => updateStock(item.id, -1, item.name, item.unit)} className="bg-stone-100 w-8 h-8 rounded flex items-center justify-center font-bold">-1</button>
                       <button onClick={() => updateStock(item.id, 1, item.name, item.unit)} className="bg-amber-100 w-8 h-8 rounded text-amber-800 flex items-center justify-center font-bold">+1</button>
                     </>
                   ) : (
                     <button onClick={() => updateStock(item.id, isBase ? -200 : -40, item.name, item.unit)} className={`px-3 py-1 h-8 rounded text-sm font-bold flex items-center ${isBase ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                       -1{isBase ? '碗' : '份'}
                     </button>
                   )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && items.length > 0 && <div className="text-center text-stone-400 mt-10">無此分類項目</div>}
          {items.length === 0 && (
              <div className="text-center py-10 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                  <p className="text-stone-500 mb-2">資料庫目前是空的</p>
                  <button onClick={() => setShowResetConfirm(true)} className="text-amber-600 font-bold underline">點此匯入預設資料</button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

const LogModule = ({ user, appId }) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'));
    const unsub = onSnapshot(q, s => {
      const d = s.docs.map(x => x.data());
      d.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(d.slice(0,50));
    });
    return () => unsub();
  }, [user, appId]);

  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
       <h2 className="text-2xl font-bold text-amber-800 mb-4"><History className="inline mr-2"/> 日誌 (近50筆)</h2>
       <div className="space-y-2">
         {logs.map((l, i) => (
           <div key={i} className="bg-white p-3 rounded-lg border text-sm flex justify-between">
             <div><span className="font-bold">{l.itemName}</span> <span className={l.action === 'reset' ? 'text-red-500' : 'text-green-600'}>{l.change}</span> {l.unit}</div>
             <div className="text-right text-xs text-stone-400"><div>{new Date(l.timestamp).toLocaleString()}</div><div>{l.operator}</div></div>
           </div>
         ))}
       </div>
    </div>
  );
};

const QAModule = () => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center"><HelpCircle className="mr-2" /> 員工問與答</h2>
      <div className="space-y-3">
        {QA_DATA.map((item, idx) => (
          <div key={idx} className="bg-white border border-stone-100 rounded-xl shadow-sm overflow-hidden">
            <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="w-full text左 p-4 flex justify-between items-center bg-white hover:bg-stone-50 transition"><span className="font-bold text-stone-700 flex gap-2"><span className="text-amber-500">Q.</span>{item.q}</span><span className={`transform transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}>▼</span></button>
            {openIndex === idx && <div className="p-4 bg-amber-50 text-stone-700 text-sm leading-relaxed border-t border-amber-100"><span className="font-bold text-amber-700 mr-1">A.</span>{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const Navigation = ({ activeTab, onTabClick }) => {
  const tabs = [
    { id: 'recipes', icon: ChefHat, label: '配方製作' },
    { id: 'inventory', icon: Package, label: '庫存管理' },
    { id: 'history', icon: History, label: '操作日誌' },
    { id: 'equipment', icon: Wrench, label: '設備保養' },
    { id: 'qa', icon: HelpCircle, label: '問與答' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => onTabClick(tab.id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === tab.id ? 'text-amber-600' : 'text-stone-400'}`}>
              <Icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Auth Modal
const AuthModal = ({ isOpen, onClose, onLogin, tempName, setTempName }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return setError('請輸入您的姓名');
    if (password !== STORE_PASSWORD) return setError('密碼錯誤');
    onLogin(tempName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 border-2 border-amber-200">
        <h3 className="text-xl font-bold text-stone-800 mb-6 text-center">員工登入</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full p-2 border rounded" placeholder="姓名 (例如: 神力女超人)" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="密碼" />
            {error && <div className="text-red-500 text-xs">{error}</div>}
            <div className="flex gap-2"><button type="button" onClick={onClose} className="flex-1 border p-2 rounded">取消</button><button type="submit" className="flex-1 bg-amber-600 text-white p-2 rounded">確認</button></div>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function SweetSoupApp() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [user, setUser] = useState(null);
  const [operatorName, setOperatorName] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const init = async () => {
      await signInAnonymously(auth).catch(e => console.error("Auth Failed", e));
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleTab = (id) => {
    if((id === 'inventory' || id === 'history') && !isAuth) setAuthOpen(true);
    else setActiveTab(id);
  };

  const handleLogin = (name) => {
    setOperatorName(name);
    setIsAuth(true);
    setAuthOpen(false);
    setActiveTab('inventory');
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-amber-800 flex items-center"><Droplet className="mr-2"/> 木白匠幫手</h1>
        <div onClick={() => !isAuth && setAuthOpen(true)} className="text-xs bg-stone-100 px-2 py-1 rounded-full cursor-pointer">
          {isAuth ? <span className="text-green-600 flex items-center"><User size={12} className="mr-1"/>{operatorName}</span> : <span className="text-stone-400 flex items-center"><Lock size={12} className="mr-1"/>未登入</span>}
        </div>
      </header>

      <main className="animate-fade-in">
        {activeTab === 'recipes' && <RecipeModule />}
        {activeTab === 'inventory' && <InventoryModule user={user} appId={appId} operatorName={operatorName} />}
        {activeTab === 'history' && <LogModule user={user} appId={appId} />}
        {activeTab === 'equipment' && <EquipmentModule />}
        {activeTab === 'qa' && <QAModule />}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} tempName={tempName} setTempName={setTempName} />
      <Navigation activeTab={activeTab} onTabClick={handleTab} />
    </div>
  );
}

// 🔚 把 App 真正掛到 #root 上
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SweetSoupApp />
  </React.StrictMode>
);
