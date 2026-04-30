import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// ⚠️ 請將此處替換為您的實際 Firebase 配置
// 從 Firebase 控制台 → 專案設定 → 您的應用程式 → 配置代碼
const firebaseConfig = {
  apiKey: "AIzaSyAYDW2bjAt9v45SIV0jIXzVKZ11jyLT8xk",
  authDomain: "lilai-student-tracker-60af2.firebaseapp.com",
  projectId: "lilai-student-tracker-60af2",
  storageBucket: "lilai-student-tracker-60af2.firebasestorage.app",
  messagingSenderId: "407689547416",
  appId: "1:407689547416:web:3aeddde5aa1823ad2e4aed",
  measurementId: "G-H36RRQ7BFY"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 导出服务
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
