import axiosClient from './axiosClient';

// 封裝「送出報名表」的動作
export const submitOrder = (payload) => {
  return axiosClient.post('/lilai/v1/submit-order', payload);
};