// lib/web3/staking.js
import { ethers } from 'ethers';
import stakingABI from './abis/stakingABI.json';

const STAKING_CONTRACT_ADDRESS = process.env.STAKING_CONTRACT_ADDRESS;
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
const PROVIDER_URL = process.env.PROVIDER_URL;

export async function processStaking(transactionHash, amount, userWalletAddress) {
  try {
    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt || !receipt.status) {
      return { success: false, error: 'Transaction failed or not found' };
    }
    
    // Get transaction
    const transaction = await provider.getTransaction(transactionHash);
    
    // Verify it's interacting with our staking contract
    if (transaction.to.toLowerCase() !== STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      return { success: false, error: 'Transaction is not interacting with the staking contract' };
    }
    
    // Decode the transaction data to verify it's a staking function and the correct amount
    const stakingContract = new ethers.Contract(
      STAKING_CONTRACT_ADDRESS,
      stakingABI,
      provider
    );
    
    // Look for relevant events in the logs
    const stakingEvents = receipt.logs
      .filter(log => log.address.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase())
      .map(log => {
        try {
          return stakingContract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(event => event && event.name === 'StakeReceived');
    
    if (stakingEvents.length === 0) {
      return { success: false, error: 'No staking event found in transaction' };
    }
    
    // Verify the event details
    const stakingEvent = stakingEvents[0];
    const eventStaker = stakingEvent.args.staker.toLowerCase();
    const eventAmount = stakingEvent.args.amount;
    
    if (eventStaker !== userWalletAddress.toLowerCase()) {
      return { success: false, error: 'Staker address does not match user wallet' };
    }
    
    // Convert amounts for comparison (USDC has 6 decimals)
    const expectedAmount = ethers.parseUnits(amount.toString(), 6);
    
    // Compare as strings instead of using .eq()
    if (eventAmount.toString() !== expectedAmount.toString()) {
      return { success: false, error: 'Staked amount does not match required amount' };
    }
    
    return { success: true, transactionHash };
  } catch (error) {
    console.error('Error verifying staking transaction:', error);
    return { success: false, error: 'Failed to verify staking transaction' };
  }
}


export async function processUnstaking(userChallengeId, userId, walletAddress) {
    try {
      // Get user challenge data
      const userChallenge = await prisma.userChallenge.findUnique({
        where: { 
          id: userChallengeId,
          userId
        },
        include: {
          challenge: true
        }
      });
      
      if (!userChallenge) {
        return { success: false, error: 'Challenge not found' };
      }
      
      // Connect to provider
      const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
      
      // Load private key from environment variables (securely stored)
      const privateKey = process.env.STAKING_ADMIN_PRIVATE_KEY;
      if (!privateKey) {
        return { success: false, error: 'Missing contract admin credentials' };
      }
      
      // Create signer
      const signer = new ethers.Wallet(privateKey, provider);
      
      // Initialize contract
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        stakingABI,
        signer
      );
      
      // For non-hardcore challenges, call withdrawFromChallenge
      if (!userChallenge.challenge.isHardcore) {
        // Prepare transaction
        const tx = await stakingContract.withdrawFromChallenge(
          userChallenge.id, // Use challenge ID as identifier
          walletAddress, // User's wallet address
          { gasLimit: 300000 }
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        if (!receipt || !receipt.status) {
          return { success: false, error: 'Transaction failed' };
        }
        
        return { 
          success: true, 
          transactionHash: receipt.hash,
          amount: userChallenge.stakedAmount
        };
      } else {
        return { success: false, error: 'Cannot unstake from hardcore challenges' };
      }
    } catch (error) {
      console.error('Error processing unstaking:', error);
      return { success: false, error: 'Failed to process unstaking' };
    }
  }
  
// Enhanced implementation of processRewardDistribution function
export async function processRewardDistribution(userChallengeId, userId, walletAddress, rewardAmount) {
  try {
    // Get user challenge data
    const userChallenge = await prisma.userChallenge.findUnique({
      where: { 
        id: userChallengeId,
        userId
      },
      include: {
        challenge: true
      }
    });
    
    if (!userChallenge) {
      return { success: false, error: 'Challenge not found' };
    }
    
    // Check if there's already a transaction hash for this challenge
    if (userChallenge.completionTxHash) {
      // Verify if the transaction was successful
      try {
        const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
        const receipt = await provider.getTransactionReceipt(userChallenge.completionTxHash);
        
        if (receipt && receipt.status) {
          return { 
            success: true, 
            transactionHash: userChallenge.completionTxHash,
            alreadyProcessed: true
          };
        }
      } catch (txCheckError) {
        console.error('Error checking existing transaction:', txCheckError);
        // If we can't verify, continue with creating a new transaction
      }
    }
    
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    
    // Load private key from environment variables (securely stored)
    const privateKey = process.env.STAKING_ADMIN_PRIVATE_KEY;
    if (!privateKey) {
      return { success: false, error: 'Missing contract admin credentials' };
    }
    
    // Create signer
    const signer = new ethers.Wallet(privateKey, provider);
    
    // Initialize contract
    const stakingContract = new ethers.Contract(
      STAKING_CONTRACT_ADDRESS,
      stakingABI,
      signer
    );
    
    // Check contract balance to ensure it has enough USDC to pay out
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      usdcABI,
      provider
    );
    
    const contractBalance = await usdcContract.balanceOf(STAKING_CONTRACT_ADDRESS);
    const requiredAmount = ethers.parseUnits(rewardAmount.toString(), 6); // USDC has 6 decimals
    
    if (contractBalance < requiredAmount) {
      return { success: false, error: 'Insufficient contract balance for reward distribution' };
    }
    
    // Calculate yield percentage in basis points (e.g., 5% = 500 basis points)
    const yieldPercentage = Math.round(userChallenge.challenge.yieldPercentage * 100);
    
    // Add retry logic for transaction
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} to complete challenge ${userChallengeId}`);
        
        // Call completeChallenge function
        const tx = await stakingContract.completeChallenge(
          walletAddress, // User's wallet address
          userChallenge.challengeId, // Challenge ID
          yieldPercentage, // Yield in basis points
          { 
            gasLimit: 500000,
            // Increment gas price slightly on retries to help with stuck transactions
            maxFeePerGas: attempts > 0 ? undefined : undefined, // Will use market rate on first try
            maxPriorityFeePerGas: attempts > 0 ? (1000000000 * (attempts + 1)) : undefined // Increment priority fee on retries
          }
        );
        
        console.log(`Transaction submitted: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        if (!receipt || !receipt.status) {
          throw new Error('Transaction failed');
        }
        
        // Find ChallengeCompleted event
        const completeEvent = receipt.logs
          .filter(log => log.address.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase())
          .map(log => {
            try {
              return stakingContract.interface.parseLog(log);
            } catch (e) {
              return null;
            }
          })
          .filter(event => event && event.name === 'ChallengeCompleted')[0];
        
        if (!completeEvent) {
          throw new Error('No completion event found in transaction');
        }
        
        return { 
          success: true, 
          transactionHash: receipt.hash,
          reward: rewardAmount
        };
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        lastError = error;
        attempts++;
        
        // Wait before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000 * attempts)); // Incremental backoff
        }
      }
    }
    
    return { success: false, error: lastError?.message || 'Failed to process reward distribution after multiple attempts' };
  } catch (error) {
    console.error('Error processing reward distribution:', error);
    return { success: false, error: 'Failed to process reward distribution' };
  }
}