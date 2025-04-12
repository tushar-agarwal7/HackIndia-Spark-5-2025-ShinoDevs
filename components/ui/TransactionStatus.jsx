// components/ui/TransactionStatus.jsx
import { useState, useEffect } from 'react';

export default function TransactionStatus({
  txHash,
  status,
  network = 'polygon',
  message,
  onClose
}) {
  const [explorerLink, setExplorerLink] = useState('');

  useEffect(() => {
    if (txHash) {
      // Set the appropriate block explorer URL based on network
      const baseUrl =
        network === 'ethereum' ? 'https://etherscan.io/tx/' :
        network === 'polygon' ? 'https://polygonscan.com/tx/' :
        network === 'mumbai' ? 'https://mumbai.polygonscan.com/tx/' :
        network === 'localhost' ? '' : // No block explorer for localhost
        'https://polygonscan.com/tx/'; // Default to polygon
      
      // If using localhost, don't set an explorer link
      if (network === 'localhost') {
        setExplorerLink('');
      } else {
        setExplorerLink(`${baseUrl}${txHash}`);
      }
    }
  }, [txHash, network]);

  const statusColor =
    status === 'success' ? 'text-green-600 bg-green-50 border-green-200' :
    status === 'pending' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
    'text-red-600 bg-red-50 border-red-200';

  const statusIcon =
    status === 'success' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : status === 'pending' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );

  return (
    <div className={`rounded-md border p-4 ${statusColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {statusIcon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-md font-medium">
            {status === 'success' ? 'Transaction Successful' :
            status === 'pending' ? 'Transaction Pending' :
            'Transaction Failed'}
          </h3>
          {message && <p className="mt-1 text-sm">{message}</p>}
          {txHash && explorerLink && (
            <div className="mt-2">
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline"
              >
                View on Block Explorer
              </a>
            </div>
          )}
          {txHash && !explorerLink && network === 'localhost' && (
            <div className="mt-2">
              <span className="text-sm">
                Transaction ID: {txHash.substring(0, 10)}...
              </span>
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}