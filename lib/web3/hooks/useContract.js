// lib/web3/hooks/useContract.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import stakingABI from '../abis/stakingABI.json';
import usdcABI from '../abis/usdcABI.json';

export function useContract() {
  const [stakingContract, setStakingContract] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkName, setNetworkName] = useState(null);
  const [chainId, setChainId] = useState(null);

  const STAKING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;
  const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS;

  // Function to initialize provider and contracts
  const initializeProvider = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && window.ethereum) {
        // Initialize Ethers provider with Web3Provider
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        // Get network information
        const network = await ethProvider.getNetwork();
        setChainId(network.chainId);
        setNetworkName(network.name);

        try {
          // Request account access and get signer
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            const ethSigner = await ethProvider.getSigner();
            setSigner(ethSigner);
            setIsConnected(true);

            // Initialize contract with signer for write operations
            if (STAKING_CONTRACT_ADDRESS && USDC_CONTRACT_ADDRESS) {
              const stakingContractWithSigner = new ethers.Contract(
                STAKING_CONTRACT_ADDRESS,
                stakingABI,
                ethSigner
              );
              setStakingContract(stakingContractWithSigner);

              const usdcContractWithSigner = new ethers.Contract(
                USDC_CONTRACT_ADDRESS,
                usdcABI,
                ethSigner
              );
              setUsdcContract(usdcContractWithSigner);
            } else {
              setError("Contract addresses not configured in environment");
            }
          } else {
            setIsConnected(false);
            // Initialize read-only contracts with provider
            initializeReadOnlyContracts(ethProvider);
          }
        } catch (signerError) {
          console.log("Wallet connection not available:", signerError.message);
          setIsConnected(false);
          // Initialize read-only contracts with provider
          initializeReadOnlyContracts(ethProvider);
        }
      } else {
        setError('No Ethereum provider detected. Please install MetaMask.');
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Error initializing contracts:', err);
      setError(err.message || 'Failed to initialize contracts');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize read-only contract instances
  const initializeReadOnlyContracts = (provider) => {
    if (STAKING_CONTRACT_ADDRESS && USDC_CONTRACT_ADDRESS) {
      const stakingContractReadOnly = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        stakingABI,
        provider
      );
      setStakingContract(stakingContractReadOnly);

      const usdcContractReadOnly = new ethers.Contract(
        USDC_CONTRACT_ADDRESS,
        usdcABI,
        provider
      );
      setUsdcContract(usdcContractReadOnly);
    }
  };

  // Connect wallet function that can be called from UI
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await initializeProvider(); // Reinitialize after connection
        return true;
      } catch (error) {
        console.error("User denied account access", error);
        setError("Please connect your wallet to continue");
        return false;
      }
    } else {
      setError('Please install MetaMask to use this feature');
      return false;
    }
  };

// Update this function to properly detect local development networks
const checkNetwork = async () => {
  if (!provider) return false;
  
  try {
    const network = await provider.getNetwork();
    console.log("Current network:", {
      chainId: network.chainId.toString(),
      name: network.name
    });
    
    // Hardhat local network uses chainId 31337
    return network.chainId.toString() === "1337" || "31337";
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

  // Switch to Local Network
  const switchToLocalNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // Chain ID for local network in hex (1337)
      });
      
      // Reinitialize provider after switching networks
      setTimeout(() => {
        initializeProvider();
      }, 1000);
      
      return true;
    } catch (switchError) {
      // If the network is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x539',
              chainName: 'Localhost 8545',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545/'],
              blockExplorerUrls: []
            }],
          });
          
          // Reinitialize provider after adding network
          setTimeout(() => {
            initializeProvider();
          }, 1000);
          
          return true;
        } catch (addError) {
          console.error("Error adding local network:", addError);
          return false;
        }
      }
      console.error("Error switching network:", switchError);
      return false;
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeProvider();

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = () => {
        // Re-initialize on account change
        initializeProvider();
      };

      const handleChainChanged = () => {
        // Reload the page on chain change as recommended by MetaMask
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    stakingContract,
    usdcContract,
    provider,
    signer,
    isConnected,
    isLoading,
    error,
    networkName,
    chainId,
    connectWallet,
    checkNetwork,
    switchToLocalNetwork
  };
}