import { useState } from 'react'
import { Button, Input, Modal, Select } from '../ui'
import { mockCoaches } from '../../mocks/coachData'

const sportOptions = ['Football', 'Basketball', 'Athletics', 'Volleyball', 'Swimming', 'Badminton']
const empty = { name: '', sport: '', coachName: '' }

function TeamForm({ open, onClose, onSubmit }) {
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const coaches = mockCoaches.filter((c) => c.status === 'Active' && (!v.sport || c.sport === v.sport)).map((c) => `${c.firstName} ${c.lastName}`)

  function close() { setV(empty); setErrors({}); setSubmitError(''); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Team name is required.'
    if (!v.sport) err.sport = 'Select a sport.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true); setSubmitError('')
    try { await onSubmit({ ...v, name: v.name.trim() }); close() }
    catch { setSubmitError("We couldn't create this team. Please try again.") }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={close} title="Add team"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="team-form" loading={saving}>Add Team</Button></>}>
      <form id="team-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="Team name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Select label="Sport" required options={sportOptions} placeholder="Select sport" value={v.sport} onChange={set('sport')} error={errors.sport} />
        <Select label="Coach" options={coaches} placeholder="Select coach" value={v.coachName} onChange={set('coachName')} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
      </form>
    </Modal>
  )
}

export default TeamForm
