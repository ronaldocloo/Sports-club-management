import { useState } from 'react'
import { errorMessage } from '../../api/client'
import { Button, Input, Modal, Select } from '../ui'

const empty = { name: '', date: '', venue: '', level: '', registrationDeadline: '' }

function CompetitionForm({ open, onClose, onSubmit }) {
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))

  function close() { setV(empty); setErrors({}); setSubmitError(''); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Competition name is required.'
    if (!v.date) err.date = 'Pick a date.'
    if (!v.venue.trim()) err.venue = 'Venue is required.'
    if (!v.level) err.level = 'Select a level.'
    if (v.registrationDeadline && v.date && v.registrationDeadline > v.date) err.registrationDeadline = 'Deadline must be on or before the competition date.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true); setSubmitError('')
    try { await onSubmit({ ...v, name: v.name.trim(), venue: v.venue.trim() }); close() }
    catch (e) { setSubmitError(errorMessage(e, "We couldn't create this competition. Please try again.")) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={close} title="Add competition"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="competition-form" loading={saving}>Add Competition</Button></>}>
      <form id="competition-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Competition name" required value={v.name} onChange={set('name')} error={errors.name} /></div>
        <Input label="Date" required type="date" value={v.date} onChange={set('date')} error={errors.date} />
        <Select label="Level" required options={['Local', 'Regional', 'National', 'International']} placeholder="Select level" value={v.level} onChange={set('level')} error={errors.level} />
        <Input label="Venue" required value={v.venue} onChange={set('venue')} error={errors.venue} />
        <Input label="Registration deadline" type="date" value={v.registrationDeadline} onChange={set('registrationDeadline')} error={errors.registrationDeadline} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{submitError}</p>}
      </form>
    </Modal>
  )
}

export default CompetitionForm
