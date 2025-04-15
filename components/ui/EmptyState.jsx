export default function EmptyState({
  title = "No data found",
  message = "There are no items to display at this time.",
  icon = null,
  action = null,
}) {
  return (
    <div className="text-center p-8 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-center">
        {icon || (
          <svg
            className="h-14 w-14 text-cyan-500 opacity-80"
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
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-800">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{message}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            className="cursor-pointer inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300"
            onClick={action.onClick}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.text}
          </button>
        </div>
      )}
    </div>
  );
}
