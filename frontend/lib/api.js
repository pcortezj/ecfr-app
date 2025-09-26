import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export const getAgencies = async () => {
  const { data } = await axios.get(`${API_BASE}/agencies`);
  return data;
};

export const getTitles = async () => {
  const { data } = await axios.get(`${API_BASE}/titles`);
  return data;
};

export const getTitleMetrics = async (number) => {
  const { data } = await axios.get(`${API_BASE}/titles/${number}/metrics`);
  return data;
};

export const getTitleHistory = async (number) => {
  const { data } = await axios.get(`${API_BASE}/titles/${number}/history`);
  return data;
};

export const getRawText = async (number) => {
  const { data } = await axios.get(`${API_BASE}/titles/${number}/raw`);
  return data.raw_text;
};
