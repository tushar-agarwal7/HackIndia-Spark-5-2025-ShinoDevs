// components/ui/ErrorMessage.jsx
export default function ErrorMessage({ 
    message, 
    title = "Error", 
    retry = null,
    dismiss = null,
    variant = "error" // 'error', 'warning', 'info' 
  }) {
    const getColorClasses = () => {
      switch (variant) {
        case 'warning':
          return 'bg-amber-50 border-amber-200 text-amber-800';
        case 'info':
          return 'bg-blue-50 border-blue-200 text-blue-800';
        case 'error':
        default:
          return 'bg-red-50 border-red-200 text-red-800';
      }
    };
  
    const getIcon = () => {
      switch (variant) {
        case 'warning':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          );
        case 'info':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          );
        case 'error':
        default:
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          );
      }
    };
  
    return (
      <div className={`rounded-md border p-4 ${getColorClasses()}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">{title}</h3>
            <div className="mt-2 text-sm">
              <p>{message}</p>
            </div>
            {(retry || dismiss) && (
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  {retry && (
                    <button
                      type="button"
                      onClick={retry}
                      className={`rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        variant === 'error' 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-600' 
                          : variant === 'warning'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 focus:ring-amber-600'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-600'
                      }`}
                    >
                      Try again
                    </button>
                  )}
                  {dismiss && (
                    <button
                      type="button"
                      onClick={dismiss}
                      className="ml-3 rounded-md bg-white px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  