import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import api from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera } from 'lucide-react';

export default function Scan() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [codeReader, setCodeReader] = useState(null);
  const [videoStream, setVideoStream] = useState(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    setCodeReader(reader);

    startScanning(reader);

    // 组件卸载时清理资源
    return () => {
      if (reader) {
        reader.reset();
      }
      // 停止视频流
      stopVideoStream();
    };
  }, []);

  // 停止视频流
  const stopVideoStream = () => {
    const video = document.getElementById('video');
    if (video && video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  const startScanning = async (reader) => {
    try {
      const videoInputDevices = await reader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        toast.error('未检测到摄像头');
        return;
      }

      // 优先使用后置摄像头
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

      reader.decodeFromVideoDevice(selectedDeviceId, 'video', async (result, err) => {
        if (result) {
          // 立即停止扫描，避免重复触发
          setScanning(false);
          reader.reset(); // 释放 ZXing 资源
          stopVideoStream(); // 停止视频流
          await handleScanResult(result.getText());
        }
      });
    } catch (error) {
      console.error('扫码错误:', error);
      toast.error('扫码功能启动失败');
    }
  };

  const handleScanResult = async (productId) => {
    try {
      toast.loading('创建订单中...', { id: 'creating' });
      
      const response = await api.post(API_ENDPOINTS.ORDERS, {
        productId: productId,
      });

      toast.success('订单创建成功！', { id: 'creating' });
      
      // 返回首页
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败，请重试');
      // 失败后重新启动扫描
      setScanning(true);
      if (codeReader) {
        startScanning(codeReader);
      }
    }
  };

  const handleManualInput = () => {
    // 先停止摄像头
    if (codeReader) {
      codeReader.reset();
    }
    stopVideoStream(); // 停止视频流
    setScanning(false);
    
    const productId = prompt('请输入商品ID：K001');
    if (productId && productId.trim()) {
      // 用户输入了有效的商品ID，提交订单
      handleScanResult(productId.trim());
    } else {
      // 用户取消或输入为空，重新启动扫描
      setScanning(true);
      if (codeReader) {
        startScanning(codeReader);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (codeReader) {
                codeReader.reset();
              }
              stopVideoStream(); // 停止视频流
              navigate('/');
            }}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">扫描商品条码</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Scanner */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <video
          id="video"
          className="w-full h-full object-cover"
          style={{ display: scanning ? 'block' : 'none' }}
        />
        
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-white/50 rounded-lg">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
        <button
          onClick={handleManualInput}
          className="w-full bg-white text-black py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          手动输入商品ID
        </button>
        <p className="text-center text-white/70 text-sm mt-4">
          将条码对准扫描框
        </p>
      </div>
    </div>
  );
}
