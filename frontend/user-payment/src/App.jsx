import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { config } from './config/wagmi';
import Payment from './pages/Payment';
import Test from './pages/Test';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Setup query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  try {
    return (
      <ErrorBoundary>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
            <Routes>
              <Route path="/test" element={<Test />} />
              <Route path="/pay/:orderId" element={<Payment />} />
              <Route path="/pay" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">缺少订单ID</h1>
                    <p className="text-gray-600 mb-4">请使用完整的支付链接，格式为：/pay/订单ID</p>
                    <a href="/" className="text-blue-600 hover:underline">返回首页</a>
                  </div>
                </div>
              } />
              <Route path="/" element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-gray-800 mb-4">KKK POS 支付系统</h1>
                      <p className="text-gray-600 mb-2">请扫描商家提供的支付二维码</p>
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                        <p className="text-sm text-blue-800">
                          💡 Web3 钱包支付界面已启用
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          配置 WalletConnect 后可进行真实支付
                        </p>
                      </div>
                      <div className="mt-4">
                        <a href="/test" className="text-blue-600 hover:underline">测试页面</a>
                      </div>
                    </div>
                  </div>
                } />
              </Routes>
              <Toaster position="top-center" />
            </BrowserRouter>
          </QueryClientProvider>
        </WagmiProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">应用启动错误</h1>
          <pre className="bg-white p-4 rounded text-left text-sm">{error.message}</pre>
        </div>
      </div>
    );
  }
}

export default App;
