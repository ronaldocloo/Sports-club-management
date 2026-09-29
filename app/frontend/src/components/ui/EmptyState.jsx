import { Inbox } from 'lucide-react'

function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
