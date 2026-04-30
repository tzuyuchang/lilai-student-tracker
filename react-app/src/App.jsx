import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
} from 'firebase/storage';
import { db, storage } from './firebase';
import './App.css';

// 表單驗證 Schema
const registrationSchema = z.object({
  studentName: z.string().min(2, '姓名至少 2 個字'),
  phone: z.string().min(10, '請輸入有效的手機號碼'),
  email: z.string().email('請輸入有效的 Email'),
  schoolId: z.string().min(1, '請選擇學校'),
  planType: z.enum(['25+8', 'short_term'], { required_error: '請選擇方案類型' }),
  weeks: z.string().min(1, '請輸入週數').refine(val => parseInt(val) > 0, '週數必須大於 0'),
  emergencyContact: z.string().optional(),
  dietaryRequirements: z.string().optional(),
});

function App() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  
  // 檔案狀態
  const [passportFile, setPassportFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 表單控制
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      planType: '25+8',
    }
  });

  const planType = watch('planType');

  // 載入學校清單
  useEffect(() => {
    const q = query(collection(db, 'schools'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schoolsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchools(schoolsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 選擇學校時重置表單
  const handleSchoolChange = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    
    // 重置相關表單欄位
    setValue('weeks', '');
    setPassportFile(null);
    setReceiptFile(null);
  };

  // 計算費用
  const calculatePricing = () => {
    if (!selectedSchool) return null;

    const acf = selectedSchool.acf || selectedSchool;
    let baseTuition = 0;

    const courseRegistrationFee = parseFloat(acf.course_registration_fee || 0);
    const materialFee = parseFloat(acf.material_fee || 0);

    const medicalInsuranceFee = planType === '25+8' ? parseFloat(acf.medical_insurance_fee || 0) : 0;
    const examFee = planType === '25+8' ? parseFloat(acf.exam_fee || 0) : 0;
    const learnerProtection = planType === '25+8' ? parseFloat(acf.learner_protection || 0) : 0;

    if (planType === '25+8') {
      baseTuition = parseFloat(acf.base_tuition || 0);
    } else {
      const weeks = parseInt(watch('weeks') || 0);
      const pricePerWeek = weeks <= 8 ? (acf.price_tier_1 || 0) :
                          weeks <= 12 ? (acf.price_tier_2 || 0) :
                          (acf.price_tier_3 || 0);
      baseTuition = pricePerWeek * weeks;
    }

    // 計算折扣
    let discount = 0;
    const promotions = acf.promotions || [];
    const activePromo = promotions.find(p => 
      p.active && 
      new Date(p.start_date) <= new Date() && 
      new Date(p.end_date) >= new Date()
    );

    if (activePromo) {
      if (activePromo.type === 'percentage') {
        discount = baseTuition * (activePromo.value / 100);
      } else {
        discount = activePromo.value;
      }
    }

    const finalTuition = baseTuition - discount;
    const totalAmount = finalTuition + courseRegistrationFee + materialFee + 
                       medicalInsuranceFee + examFee + learnerProtection;
    const commission = finalTuition * (parseFloat(acf.commission_percentage || 0) / 100);

    return {
      baseTuition,
      courseRegistrationFee,
      materialFee,
      medicalInsuranceFee,
      examFee,
      learnerProtection,
      discount,
      finalTuition,
      totalAmount,
      commission,
      promoName: activePromo?.name
    };
  };

  const pricing = calculatePricing();

  // 檔案上傳處理
  const uploadFile = async (file, studentId) => {
    const fileRef = ref(storage, `students/${studentId}/${file.name}`);
    
    try {
      setUploading(true);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error('上傳失敗:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // 表單提交
  const onSubmit = async (data) => {
    if (!selectedSchool) {
      alert('請選擇學校');
      return;
    }

    if (!passportFile || !receiptFile) {
      alert('請上傳護照和收據檔案');
      return;
    }

    setSubmitting(true);

    try {
      // 生成報名序號
      const studentId = `STU-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // 上傳檔案
      const passportUrl = await uploadFile(passportFile, studentId);
      const receiptUrl = await uploadFile(receiptFile, studentId);

      // 保存學生資料到 Firestore
      const weeksValue = planType === '25+8' ? 25 : parseInt(data.weeks);
      
      await addDoc(collection(db, 'students'), {
        id: studentId,
        student_name: data.studentName,
        phone: data.phone,
        email: data.email,
        school_id: selectedSchool.id,
        plan_type: planType,
        weeks: weeksValue,
        base_tuition: pricing.baseTuition,
        course_registration_fee: pricing.courseRegistrationFee,
        material_fee: pricing.materialFee,
        medical_insurance_fee: pricing.medicalInsuranceFee,
        exam_fee: pricing.examFee,
        learner_protection: pricing.learnerProtection,
        discount: pricing.discount,
        total_amount: pricing.totalAmount,
        commission: pricing.commission,
        current_stage: 1,
        status: 'pending',
        documents: {
          passport: {
            url: passportUrl,
            filename: passportFile.name,
            uploaded_at: new Date().toISOString(),
            status: 'pending'
          },
          receipt: {
            url: receiptUrl,
            filename: receiptFile.name,
            uploaded_at: new Date().toISOString(),
            status: 'pending'
          }
        },
        emergency_contact: data.emergencyContact || '',
        dietary_requirements: data.dietaryRequirements || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setSubmittedId(studentId);
    } catch (error) {
      console.error('提交失敗:', error);
      alert('報名失敗，請稍後再試或聯繫系統管理員');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">系統載入中...</p>
        </div>
      </div>
    );
  }

  if (submittedId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">報名成功！</h2>
            <p className="text-gray-600 mb-6">
              感謝您選擇 Lilai Ireland，您的報名資料已成功提交。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-2">您的報名序號：</p>
              <p className="text-2xl font-bold text-blue-900">{submittedId}</p>
              <p className="text-xs text-blue-600 mt-2">
                請記住此序號，後續查詢進度時需要使用
              </p>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">下一步請注意：</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✅ 我們將在 1-2 個工作天內審核您的報名資料</li>
                <li>✅ 審核通過後會透過 Email 與您聯繫</li>
                <li>✅ 請隨時關注您的 Email 信箱</li>
                <li>✅ 如需查詢進度，請使用上述報名序號</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🎓 Lilai Ireland 報名系統</h1>
          <p className="text-blue-100 mt-1">留遊學代辦進度追蹤系統</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 步驟 1: 選擇學校 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            選擇語言學校
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                請選擇預計報名的語言學校
              </label>
              <select
                {...register('schoolId')}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className={`w-full px-4 py-3 border ${errors.schoolId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
              >
                <option value="">-- 請選擇學校 --</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.title?.rendered || school.name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p className="mt-1 text-sm text-red-600">{errors.schoolId.message}</p>
              )}
            </div>

            {selectedSchool && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-primary mb-2">
                  {selectedSchool.title?.rendered || selectedSchool.name}
                </h3>
                <p className="text-sm text-gray-600">
                  位置：{selectedSchool.city || 'N/A'}
                </p>
              </div>
            )}
          </div>
        </section>

        {selectedSchool && (
          <>
            {/* 步驟 2: 方案選擇 */}
            <section className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
                選擇課程方案
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      value="25+8"
                      {...register('planType')}
                      checked={planType === '25+8'}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 transition-all ${
                      planType === '25+8' 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="font-bold text-gray-900 mb-1">25+8 學生簽證方案</div>
                      <div className="text-sm text-gray-600">25 週語言課 + 8 週工作簽證</div>
                    </div>
                  </label>

                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      value="short_term"
                      {...register('planType')}
                      checked={planType === 'short_term'}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 transition-all ${
                      planType === 'short_term' 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="font-bold text-gray-900 mb-1">短期語言學校</div>
                      <div className="text-sm text-gray-600">1-24 週彈性選擇</div>
                    </div>
                  </label>
                </div>

                {planType === 'short_term' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      請輸入學習週數
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      {...register('weeks')}
                      placeholder="例如：12"
                      className={`w-full px-4 py-3 border ${errors.weeks ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                    />
                    {errors.weeks && (
                      <p className="mt-1 text-sm text-red-600">{errors.weeks.message}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 費用試算 */}
            {pricing && (
              <section className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
                  費用試算明細
                </h2>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <h3 className="font-bold text-lg text-primary mb-4">
                    {selectedSchool.title?.rendered || selectedSchool.name}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">基礎學費：</span>
                      <span className="font-semibold">€{pricing.baseTuition.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">課程註冊費：</span>
                      <span className="font-semibold">€{pricing.courseRegistrationFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">書籍材料費：</span>
                      <span className="font-semibold">€{pricing.materialFee.toLocaleString()}</span>
                    </div>
                    {planType === '25+8' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">醫療保險：</span>
                          <span className="font-semibold">€{pricing.medicalInsuranceFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">英文考試：</span>
                          <span className="font-semibold">€{pricing.examFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">學生保護險：</span>
                          <span className="font-semibold">€{pricing.learnerProtection.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {pricing.discount > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-800">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-zm" />
                        </svg>
                        <span className="font-bold">🎉 {pricing.promoName || '優惠折扣'}：-€{pricing.discount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">總計應付：</span>
                      <span className="text-3xl font-bold text-secondary">€{pricing.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 內部資訊（僅開發者參考） */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  [內部資訊] 預估公司佣金：€{pricing.commission.toFixed(2)}
                </div>
              </section>
            )}

            {/* 步驟 3: 基本資料與檔案上傳 */}
            <section className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
                填寫基本資料與上傳檔案
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      學生英文姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('studentName')}
                      placeholder="例如：WANG XIAO MING"
                      className={`w-full px-4 py-3 border ${errors.studentName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                    />
                    {errors.studentName && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手機號碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="+886912345678"
                      className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="example@email.com"
                      className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      緊急聯絡人
                    </label>
                    <input
                      type="text"
                      {...register('emergencyContact')}
                      placeholder="選填"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    飲食需求（選填）
                  </label>
                  <input
                    type="text"
                    {...register('dietaryRequirements')}
                    placeholder="例如：素食、無麩質..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* 檔案上傳 */}
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-900 mb-4">上傳必要檔案</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        護照掃描檔 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPassportFile(e.target.files[0])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      {passportFile && (
                        <p className="mt-1 text-sm text-green-600">✓ {passportFile.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        繳費收據 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      {receiptFile && (
                        <p className="mt-1 text-sm text-green-600">✓ {receiptFile.name}</p>
                      )}
                    </div>
                  </div>

                  {uploading && (
                    <div className="mt-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">上傳中...</p>
                    </div>
                  )}
                </div>

                {/* 提交按鈕 */}
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full py-4 bg-primary text-white text-lg font-bold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '處理中...' : '確認報名，送出資料'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  提交即代表您同意我們的服務條款與隱私權政策
                </p>
              </form>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">© 2026 Lilai Ireland. All rights reserved.</p>
          <p className="text-xs text-gray-400 mt-2">如有任何問題，請聯繫客服團隊</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
