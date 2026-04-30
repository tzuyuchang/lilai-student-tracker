import axios from 'axios';

// 建立並匯出共用的 Axios 實體
const axiosClient = axios.create({
  baseURL: 'https://lilaiireland.com/wp-json',
  params: {
    acf_format: 'standard'
  }
});

// 你未來甚至可以在這裡加上「攔截器 (Interceptors)」，
//用來統一處理全站的 401 登入過期錯誤！

export default axiosClient;