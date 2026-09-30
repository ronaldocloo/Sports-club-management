import { useEffect, useState } from 'react'
import { Button, Input, Modal, Select } from '../ui'
import { errorMessage } from '../../api/client'
import { getSports } from '../../api/sports'
import { getCoaches } from '../../api/coaches'

const empty = { name: '', sportId: '', coachId: '' }

// Sports and coaches come from the API so the ids sent on save are real.
function TeamForm({ open, onClose, onSubmit }) {
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sports, setSports] = useState([])
  const [coaches, setCoaches] = useState([])
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value, ...(k === 'sportId' ? { coachId: '' } : {}) }))

  useEffect(() => {
    if (!open) return
    getSports().then(setSports).catch(() => setSports([]))
    getCoaches().then(setCoaches).catch(() => setCoaches([]))
  }, [open])

  const sport = sports.find((s) => String(s.id) === String(v.sportId))
  const coachOptions = coaches
    .filter((c) => c.status === 'Active' && (!sport || !c.sport || c.sport.toLowerCase() === sport.name.toLowerCase()))
    .map((c) => ({ value: String(c.coachId), label: `${c.firstName} ${c.lastName}` }))

  function close() { setV(empty); setErrors({}); setSubmitError(''); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Team name is required.'
    if (!v.sportId) err.sportId = 'Select a sport.'
    if (!v.coachId) err.coachId = 'Select a coach.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true); setSubmitError('')
    try {
      const coach = coaches.find((c) => String(c.coachId) === String(v.coachId))
      await onSubmit({ name: v.name.trim(), sportId: v.sportId, sport: sport?.name, coachId: v.coachId, coachName: coach ? `${coach.firstName} ${coach.lastName}` : '' })
      close()
    } catch (e) {
      setSubmitError(errorMessage(e, "We couldn't create this team. Please try again."))
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={close} title="Add team"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="team-form" loading={saving}>Add Team</Button></>}>
      <form id="team-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="Team name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Select label="Sport" required options={sports.map((s) => ({ value: String(s.id), label: s.name }))} placeholder="Select sport" value={v.sportId} onChange={set('sportId')} error={errors.sportId} />
        <Select label="Coach" required options={coachOptions} placeholder={v.sportId ? 'Select coach' : 'Select a sport first'} value={v.coachId} onChange={set('coachId')} error={errors.coachId} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
      </form>
    </Modal>
  )
}

export default TeamForm
