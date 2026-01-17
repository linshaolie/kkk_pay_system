const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  ORDER_BY_ID: (orderId) => `${API_BASE_URL}/orders/${orderId}`,
};

import { defineChain } from 'viem';

// Monad 链配置
export const MONAD_CHAIN = defineChain({
  id: 10143, // Monad Devnet Chain ID (根据实际网络确认)
  name: 'Monad Devnet',
  network: 'monad-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  // 如果设置了环境变量，使用指定的 RPC
  // 否则不设置 rpcUrls，让钱包使用它自己配置的 RPC
  // ...(import.meta.env.VITE_MONAD_RPC_URL ? {
  //   rpcUrls: {
  //     default: { http: [import.meta.env.VITE_MONAD_RPC_URL] },
  //     public: { http: [import.meta.env.VITE_MONAD_RPC_URL] },
  //   }
  // } : {}),
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://explorer.monad.xyz' },
  },
  testnet: true,
});

// 支付合约地址
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// WalletConnect 项目 ID
export const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';
