// lib/web3/providers.js
import { ethers } from "ethers";

// Function to get Ethereum provider
export const getEthereumProvider = async () => {
  // Check if window is defined (browser environment)
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error('User denied account access:', error);
      throw new Error('User denied account access');
    }
  } else {
    throw new Error('No Ethereum browser extension detected. Please install MetaMask or similar.');
  }
};

// Function to get connected wallet address
export const getWalletAddress = async () => {
  try {
    const provider = await getEthereumProvider();
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error('Error getting wallet address:', error);
    throw error;
  }
};

// Function to sign a message with wallet
export const signMessage = async (message) => {
  try {
    const provider = await getEthereumProvider();
    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};
