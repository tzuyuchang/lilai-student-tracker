import axiosClient from './axiosClient';

// 封裝「取得學校清單」的動作
export const fetchSchools = () => {
  return axiosClient.get('/wp/v2/schools');
};

// 未來如果需要：export const fetchSchoolById = (id) => { ... }