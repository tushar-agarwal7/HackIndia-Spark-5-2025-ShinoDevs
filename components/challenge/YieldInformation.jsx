// components/challenge/YieldInformation.jsx
'use client';

import { useState, useEffect } from 'react';
import { useYield } from '@/lib/web3/hooks/useYield';

export default function YieldInformation({ 
  stakedAmount, 
  yieldPercentage, 
  durationDays,
  challengeStartDate,
  isHardcore = false
}) {
  const { projectedReward, dailyYield, apy } = useYield(stakedAmount, yieldPercentage, durationDays);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [earnedToDate, setEarnedToDate] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate time remaining and earned yield to date
    if (challengeStartDate) {
      const updateTimeAndYield = () => {
        const startDate = new Date(challengeStartDate);
        const now = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
        
        // Calculate time remaining
        if (now >= endDate) {
          setTimeRemaining('Completed');
          setProgress(100);
        } else {
          const totalMs = endDate - startDate;
          const elapsedMs = now - startDate;
          const remainingMs = endDate - now;
          
          // Calculate progress
          const calculatedProgress = Math.min(100, (elapsedMs / totalMs) * 100);
          setProgress(calculatedProgress);
          
          // Format time remaining
          const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          setTimeRemaining(`${days}d ${hours}h`);
          
          // Calculate earned yield to date
          const daysPassed = elapsedMs / (1000 * 60 * 60 * 24);
          const earned = dailyYield * Math.min(daysPassed, durationDays);
          setEarnedToDate(earned);
        }
      };
      
      updateTimeAndYield();
      const interval = setInterval(updateTimeAndYield, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [challengeStartDate, durationDays, dailyYield]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h3 className="text-lg font-medium text-slate-800 mb-4">Yield Information</h3>
      
      {isHardcore ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm font-medium">Hardcore Challenge</p>
          <p className="text-xs">Your stake will be forfeited if you fail to meet the challenge requirements.</p>
        </div>
      ) : (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-sm font-medium">No-Loss Challenge</p>
          <p className="text-xs">Your stake will be returned even if you don't complete all requirements.</p>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Staked Amount:</span>
          <span className="font-medium">{formatCurrency(stakedAmount)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Yield Percentage:</span>
          <span className="font-medium text-green-600">{yieldPercentage}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Effective APY:</span>
          <span className="font-medium text-green-600">{apy.toFixed(2)}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Duration:</span>
          <span className="font-medium">{durationDays} days</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Time Remaining:</span>
          <span className="font-medium">{timeRemaining}</span>
        </div>
        
        <div className="mt-2 mb-1">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <hr className="my-3 border-slate-200" />
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Earned to Date:</span>
          <span className="font-medium text-green-600">{formatCurrency(earnedToDate)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Projected Total Reward:</span>
          <span className="font-medium text-green-600">{formatCurrency(projectedReward)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 text-sm">Projected Profit:</span>
          <span className="font-medium text-green-600">{formatCurrency(projectedReward - stakedAmount)}</span>
        </div>
      </div>
    </div>
  );
}