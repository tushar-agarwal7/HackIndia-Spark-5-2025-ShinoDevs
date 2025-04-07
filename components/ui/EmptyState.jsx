
  
  // components/ui/EmptyState.jsx
  export default function EmptyState({
    title = 'No data found',
    message = 'There are no items to display at this time.',
    icon = null,
    action = null
  }) {
    return (
      <div className="text-center p-8 border border-gray-200 rounded-lg bg-white">
        {icon || (
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{message}</p>
        {action && (
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={action.onClick}
            >
              {action.icon && (
                <span className="mr-2">{action.icon}</span>
              )}
              {action.text}
            </button>
          </div>
        )}
      </div>
    );
  }
