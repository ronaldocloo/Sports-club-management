import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

const ToastContext = createContext({ push: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-lg">
            {t.tone === 'error' ? <XCircle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
