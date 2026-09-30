import { AlertTriangle } from 'lucide-react'
import Button from './Button'

function ErrorState({ title = 'Something went wrong', description = "We couldn't load this information. Please try again.", onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-red-100 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

export default ErrorState
