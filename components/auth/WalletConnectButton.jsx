// components/auth/WalletConnectButton.jsx
'use client';

import { useState, useEffect } from 'react';
import { getWalletAddress, signMessage } from '@/lib/web3/providers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function WalletConnectButton({ onSuccess, onError }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle', 'connecting', 'signing', 'verifying'
  
  // Reset connection if network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleNetworkChange = () => {
        // Reset connection status if network changes during connection
        if (connectionStatus !== 'idle') {
          setConnectionStatus('idle');
          setIsConnecting(false);
          onError('Network changed. Please try connecting again.');
        }
      };
      
      window.ethereum.on('chainChanged', handleNetworkChange);
      window.ethereum.on('accountsChanged', handleNetworkChange);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleNetworkChange);
        window.ethereum.removeListener('accountsChanged', handleNetworkChange);
      };
    }
  }, [connectionStatus, onError]);
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      
      // 1. Get wallet address
      const walletAddress = await getWalletAddress();
      setConnectionStatus('signing');
      
      // 2. Get nonce and message to sign
      const nonceResponse = await fetch(`/api/auth/wallet?address=${walletAddress}`);
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.error || 'Failed to get authentication nonce');
      }
      
      const { message } = await nonceResponse.json();
      
      // 3. Sign the message
      const signature = await signMessage(message);
      setConnectionStatus('verifying');
      
      // 4. Verify signature and authenticate
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress, signature }),
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok) {
        throw new Error(authData.error || 'Authentication failed');
      }
      
      // 5. Call onSuccess with data
      onSuccess({
        walletAddress,
        isNewUser: authData.user.isNewUser
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Provide more helpful error messages based on error type
      if (error.code === 4001) {
        onError('You rejected the connection request. Please approve the connection in your wallet.');
      } else if (error.message.includes('already pending')) {
        onError('A wallet connection request is already pending. Please check your wallet.');
      } else if (error.message.includes('network')) {
        onError('Network error. Please check your internet connection and try again.');
      } else {
        onError(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
      setConnectionStatus('idle');
    }
  };
  
  const getButtonText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'signing':
        return 'Please sign message...';
      case 'verifying':
        return 'Verifying signature...';
      default:
        return 'Connect Wallet';
    }
  };
  
  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 px-6 rounded-lg font-medium hover:from-cyan-600 hover:to-teal-600 transition-colors disabled:opacity-70"
    >
      {isConnecting && <LoadingSpinner size="small" color="white" className="mr-2" />}
      {getButtonText()}
    </button>
  );
}