import { useCallback, useEffect, useState } from 'react'

// Runs an async loader on mount. status: 'loading' | 'ready' | 'error'.
export default function useAsync(loader) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    setStatus('loading')
    loader().then((d) => { setData(d); setStatus('ready') }).catch(() => setStatus('error'))
  }, [loader])

  useEffect(() => { load() }, [load])

  return { data, setData, status, reload: load }
}
