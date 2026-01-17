import { createConfig } from 'wagmi';
import { http } from 'viem'; // http 从 viem 导入，不是 wagmi
import { injected, metaMask } from 'wagmi/connectors';
import { MONAD_CHAIN } from './index';

// Get RPC URL - 确保安全访问
let rpcUrl = 'https://testnet-rpc.monad.xyz';
try {
  if (MONAD_CHAIN?.rpcUrls?.default?.http?.[0]) {
    rpcUrl = MONAD_CHAIN.rpcUrls.default.http[0];
  }
} catch (error) {
  console.warn('Failed to get RPC URL from chain config:', error);
}

// Create wagmi config
export const config = createConfig({
  chains: [MONAD_CHAIN],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [MONAD_CHAIN.id]: http(rpcUrl),
  },
});
