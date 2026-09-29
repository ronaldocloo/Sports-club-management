import { useEffect, useState } from 'react'
import { Button, Input, Modal, Select } from '../ui'

const sportOptions = ['Football', 'Basketball', 'Athletics', 'Volleyball', 'Swimming', 'Badminton']
const empty = { firstName: '', lastName: '', dateOfBirth: '', gender: '', sport: '', teamId: '', position: '', email: '', phone: '' }

function validate(v) {
  const e = {}
  if (!v.firstName.trim()) e.firstName = 'First name is required.'
  if (!v.lastName.trim()) e.lastName = 'Last name is required.'
  if (!v.dateOfBirth) e.dateOfBirth = 'Date of birth is required.'
  else if (new Date(v.dateOfBirth) >= new Date()) e.dateOfBirth = 'Date of birth must be in the past.'
  if (!v.gender) e.gender = 'Select a gender.'
  if (!v.sport) e.sport = 'Select a sport.'
  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email address.'
  if (!v.phone.trim()) e.phone = 'Phone number is required.'
  return e
}

// Creates a new athlete, or edits `athlete` when provided.
function AthleteForm({ open, athlete, teams = [], onClose, onSubmit }) {
  const editing = !!athlete
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (open) setValues(athlete ? { ...empty, ...athlete, teamId: athlete.teamId || '', email: athlete.email || '', phone: athlete.phone || '' } : empty)
  }, [open, athlete])

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value, ...(k === 'sport' ? { teamId: '' } : {}) }))
  const teamOptions = teams.filter((t) => !values.sport || t.sport === values.sport).map((t) => ({ value: String(t.teamId), label: t.teamName }))

  function close() { setErrors({}); setSubmitError(''); onClose() }

  async function submit(e) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setSubmitError('')
    try {
      const team = teams.find((t) => String(t.teamId) === String(values.teamId))
      await onSubmit({ ...values, teamId: team?.teamId || null, team: team?.teamName || null })
      close()
    } catch {
      setSubmitError("We couldn't save this athlete. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title={editing ? 'Edit athlete' : 'Add athlete'}
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="athlete-form" loading={saving}>{editing ? 'Save changes' : 'Add Athlete'}</Button></>}>
      <form id="athlete-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="First Name" required value={values.firstName} onChange={set('firstName')} error={errors.firstName} />
        <Input label="Last Name" required value={values.lastName} onChange={set('lastName')} error={errors.lastName} />
        <Input label="Date of Birth" required type="date" value={values.dateOfBirth} onChange={set('dateOfBirth')} error={errors.dateOfBirth} />
        <Select label="Gender" required options={['Male', 'Female', 'Other']} placeholder="Select gender" value={values.gender} onChange={set('gender')} error={errors.gender} />
        <Select label="Sport" required options={sportOptions} placeholder="Select sport" value={values.sport} onChange={set('sport')} error={errors.sport} />
        <Select label="Team" options={teamOptions} placeholder={values.sport ? 'Select team' : 'Select a sport first'} value={String(values.teamId || '')} onChange={set('teamId')} />
        <Input label="Position" value={values.position} onChange={set('position')} />
        <Input label="Phone" required type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} />
        <div className="sm:col-span-2"><Input label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} /></div>
        {submitError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{submitError}</p>}
      </form>
    </Modal>
  )
}

export default AthleteForm
