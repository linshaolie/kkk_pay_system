const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  ORDER_BY_ID: (orderId) => `${API_BASE_URL}/orders/${orderId}`,
};

import { defineChain } from 'viem';

// Monad 链配置
export const MONAD_CHAIN = defineChain({
  id: 41454, // Monad Testnet Chain ID（请根据实际网络调整）
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
    public: { http: [import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://testnet.monad.xyz' },
  },
  testnet: true,
});

// 支付合约地址
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// WalletConnect 项目 ID
export const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';
