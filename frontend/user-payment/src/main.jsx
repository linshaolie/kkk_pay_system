import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: red;">渲染错误</h1>
      <pre>${error.message}\n${error.stack}</pre>
    </div>
  `;
}
