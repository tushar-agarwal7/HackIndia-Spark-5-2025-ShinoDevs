
  // components/ui/LoadingState.jsx
  import { LoadingSpinner } from './LoadingSpinner';
  
  export default function LoadingState({ 
    message = 'Loading...', 
    size = 'medium',
    height = 'auto'
  }) {
    const heightClass = height === 'auto' ? 'min-h-[100px]' : `h-${height}`;
  
    return (
      <div className={`flex flex-col items-center justify-center ${heightClass} w-full`}>
        <LoadingSpinner size={size} />
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
    );
  }
  