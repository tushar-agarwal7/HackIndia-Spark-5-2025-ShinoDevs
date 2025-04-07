// lib/web3/hooks/useYield.js
import { useState, useEffect } from 'react';

export function useYield(stakedAmount, yieldPercentage, durationDays) {
  const [projectedReward, setProjectedReward] = useState(0);
  const [dailyYield, setDailyYield] = useState(0);
  const [apy, setApy] = useState(0);
  
  useEffect(() => {
    const calculateYield = () => {
      if (!stakedAmount || !yieldPercentage || !durationDays) {
        setProjectedReward(0);
        setDailyYield(0);
        setApy(0);
        return;
      }
      
      // Parse inputs to ensure numerical operations
      const stake = parseFloat(stakedAmount);
      const yieldPct = parseFloat(yieldPercentage);
      const duration = parseInt(durationDays);
      
      if (isNaN(stake) || isNaN(yieldPct) || isNaN(duration) || duration <= 0) {
        return;
      }
      
      // Calculate projected reward
      const yieldAmount = (stake * yieldPct) / 100;
      const totalReward = stake + yieldAmount;
      setProjectedReward(totalReward);
      
      // Calculate daily yield
      const daily = yieldAmount / duration;
      setDailyYield(daily);
      
      // Calculate APY
      const yearlyYield = (yieldAmount / duration) * 365;
      const calculatedApy = (yearlyYield / stake) * 100;
      setApy(calculatedApy);
    };
    
    calculateYield();
  }, [stakedAmount, yieldPercentage, durationDays]);
  
  return {
    projectedReward,
    dailyYield,
    apy
  };
}