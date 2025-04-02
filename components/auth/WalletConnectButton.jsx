// components/auth/WalletConnectButton.jsx
'use client';

import { useState } from 'react';
import { getWalletAddress, signMessage } from '@/lib/web3/providers';

export default function WalletConnectButton({ onSuccess, onError }) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // 1. Get wallet address
      const walletAddress = await getWalletAddress();
      
      // 2. Get nonce and message to sign
      const nonceResponse = await fetch(`/api/auth/wallet?address=${walletAddress}`);
      const { message } = await nonceResponse.json();
      
      // 3. Sign the message
      const signature = await signMessage(message);
      
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
      onError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-dark transition-colors"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
