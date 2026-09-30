const base =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50'

function FormField({ label, required, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      )}
    </label>
  )
}

export function Input({ label, required, error, hint, className = '', ...props }) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <input className={`${base} ${error ? 'border-red-400' : 'border-gray-300 focus:border-blue-500'} ${className}`} aria-invalid={!!error} {...props} />
    </FormField>
  )
}

export function Select({ label, required, error, hint, options = [], placeholder = 'Select…', ...props }) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <select className={`${base} ${error ? 'border-red-400' : 'border-gray-300 focus:border-blue-500'}`} aria-invalid={!!error} {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o
          return <option key={opt.value} value={opt.value}>{opt.label}</option>
        })}
      </select>
    </FormField>
  )
}

export default FormField
