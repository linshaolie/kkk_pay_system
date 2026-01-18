import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  useHttps: process.env.USE_HTTPS === 'true',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d',
  },
  
  blockchain: {
    rpcUrl: process.env.MONAD_RPC_URL || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    usdtAddress: process.env.USDT_CONTRACT_ADDRESS || '',
  },
  
  frontend: {
    mobileUrl: process.env.MOBILE_URL || 'http://localhost:5173',
    desktopUrl: process.env.DESKTOP_URL || 'http://localhost:5174',
    paymentUrl: process.env.PAYMENT_URL || 'http://localhost:5175',
  },
};
