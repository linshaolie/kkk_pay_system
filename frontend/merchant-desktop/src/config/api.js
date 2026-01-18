const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // 认证
  LOGIN: `${API_BASE_URL}/auth/login`,
  PROFILE: `${API_BASE_URL}/auth/profile`,

  // 订单
  PENDING_ORDERS: `${API_BASE_URL}/orders/merchant/pending`,
  ORDER_BY_ID: (orderId) => `${API_BASE_URL}/orders/${orderId}`,
  CANCEL_ORDER: (orderId) => `${API_BASE_URL}/orders/${orderId}/cancel`,
  TODAY_STATS: `${API_BASE_URL}/orders/merchant/stats/today`,

  // 商品
  PRODUCTS: `${API_BASE_URL}/products`,
};

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
export const PAYMENT_URL = import.meta.env.VITE_PAYMENT_URL || 'http://localhost:5175';
