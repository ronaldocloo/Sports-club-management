import { useState } from 'react'
import { Button, Input, Modal } from '../ui'

function ResultModal({ fixture, onClose, onSave }) {
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const h = Number(home)
    const a = Number(away)
    if (home === '' || away === '' || h < 0 || a < 0 || !Number.isInteger(h) || !Number.isInteger(a)) {
      setError('Enter whole-number scores (0 or more) for both teams.')
      return
    }
    onSave(fixture.id, h, a)
  }

  return (
    <Modal
      open={!!fixture}
      onClose={onClose}
      title="Record result"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="result-form">Save Result</Button>
        </>
      }
    >
      {fixture && (
        <form id="result-form" onSubmit={submit} noValidate className="space-y-4">
          <p className="text-sm text-gray-500">{fixture.round} · {fixture.venue}</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label={fixture.home} type="number" min="0" required value={home} onChange={(e) => setHome(e.target.value)} />
            <Input label={fixture.away} type="number" min="0" required value={away} onChange={(e) => setAway(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </Modal>
  )
}

export default ResultModal
