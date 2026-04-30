// import-schools-web.js - 使用 Firebase Web SDK（不需要服務帳戶金鑰）
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase 配置（從您的專案取得）
const firebaseConfig = {
  apiKey: "AIzaSyAYDW2bjAt9v45SIV0jIXzVKZ11jyLT8xk",
  authDomain: "lilai-student-tracker-60af2.firebaseapp.com",
  projectId: "lilai-student-tracker-60af2",
  storageBucket: "lilai-student-tracker-60af2.firebasestorage.app",
  messagingSenderId: "407689547416",
  appId: "1:407689547416:web:3aeddde5aa1823ad2e4aed"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 學校資料
const schools = [
  {
    name: "EC English Dublin",
    code: "EC",
    country: "Ireland",
    city: "Dublin",
    base_tuition: 1200,
    price_tier_1: 80,
    price_tier_2: 75,
    price_tier_3: 70,
    course_registration_fee: 100,
    material_fee: 50,
    medical_insurance_fee: 80,
    exam_fee: 180,
    learner_protection: 60,
    commission_percentage: 15,
    promotions: [],
    required_fields: [],
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    name: "Kaplan International English Dublin",
    code: "KAPLAN",
    country: "Ireland",
    city: "Dublin",
    base_tuition: 1350,
    price_tier_1: 90,
    price_tier_2: 85,
    price_tier_3: 80,
    course_registration_fee: 120,
    material_fee: 60,
    medical_insurance_fee: 90,
    exam_fee: 200,
    learner_protection: 70,
    commission_percentage: 18,
    promotions: [],
    required_fields: [],
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    name: "EF English Center Dublin",
    code: "EF",
    country: "Ireland",
    city: "Dublin",
    base_tuition: 1100,
    price_tier_1: 75,
    price_tier_2: 70,
    price_tier_3: 65,
    course_registration_fee: 90,
    material_fee: 45,
    medical_insurance_fee: 75,
    exam_fee: 170,
    learner_protection: 55,
    commission_percentage: 12,
    promotions: [],
    required_fields: [],
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    name: "Language Studies International",
    code: "LSI",
    country: "Ireland",
    city: "Dublin",
    base_tuition: 1150,
    price_tier_1: 82,
    price_tier_2: 78,
    price_tier_3: 72,
    course_registration_fee: 95,
    material_fee: 48,
    medical_insurance_fee: 82,
    exam_fee: 175,
    learner_protection: 58,
    commission_percentage: 14,
    promotions: [],
    required_fields: [],
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    name: "IIS Language School",
    code: "IIS",
    country: "Ireland",
    city: "Dublin",
    base_tuition: 1050,
    price_tier_1: 72,
    price_tier_2: 68,
    price_tier_3: 62,
    course_registration_fee: 85,
    material_fee: 42,
    medical_insurance_fee: 72,
    exam_fee: 160,
    learner_protection: 52,
    commission_percentage: 13,
    promotions: [],
    required_fields: [],
    created_at: new Date().toISOString(),
    is_active: true
  }
];

async function importSchools() {
  try {
    console.log('🚀 開始匯入學校資料...');
    
    const schoolsRef = collection(db, 'schools');
    let successCount = 0;
    
    for (const school of schools) {
      await addDoc(schoolsRef, school);
      successCount++;
      console.log(`✅ 已新增：${school.name}`);
    }
    
    console.log(`\n✅ 完成！成功匯入 ${successCount} / ${schools.length} 個學校`);
    console.log('📊 學校清單:');
    schools.forEach(school => {
      console.log(`  - ${school.name} (${school.code})`);
    });
    
  } catch (error) {
    console.error('❌ 匯入失敗:', error);
    process.exit(1);
  }
}

importSchools();
