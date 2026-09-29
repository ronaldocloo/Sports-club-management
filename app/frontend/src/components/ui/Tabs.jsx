function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((t) => {
        const tab = typeof t === 'string' ? { value: t, label: t } : t
        const active = value === tab.value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-1.5 text-xs text-gray-400">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
