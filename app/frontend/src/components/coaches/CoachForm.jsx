import { useState } from 'react'
import { Button, Input, Modal, Select } from '../ui'

const sportOptions = ['Football', 'Basketball', 'Athletics', 'Volleyball', 'Swimming', 'Badminton']
const empty = { firstName: '', lastName: '', sport: '', specialization: '', experienceYears: '', email: '', phone: '' }

function validate(v) {
  const e = {}
  if (!v.firstName.trim()) e.firstName = 'First name is required.'
  if (!v.lastName.trim()) e.lastName = 'Last name is required.'
  if (!v.sport) e.sport = 'Please select a sport.'
  if (!v.email.trim()) e.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email address.'
  if (v.experienceYears !== '' && (Number(v.experienceYears) < 0 || Number(v.experienceYears) > 60)) e.experienceYears = 'Enter a value between 0 and 60.'
  return e
}

function CoachForm({ open, onClose, onSubmit }) {
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  function close() {
    setValues(empty); setErrors({}); setSubmitError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSubmit(values)
      close()
    } catch {
      setSubmitError("We couldn't save this coach. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Coach"
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" form="coach-form" loading={saving}>Add Coach</Button>
        </>
      }
    >
      <form id="coach-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="First Name" required value={values.firstName} onChange={set('firstName')} error={errors.firstName} />
        <Input label="Last Name" required value={values.lastName} onChange={set('lastName')} error={errors.lastName} />
        <Select label="Sport" required options={sportOptions} placeholder="Select sport" value={values.sport} onChange={set('sport')} error={errors.sport} />
        <Input label="Experience (years)" type="number" min="0" value={values.experienceYears} onChange={set('experienceYears')} error={errors.experienceYears} />
        <div className="sm:col-span-2">
          <Input label="Specialization" placeholder="e.g. Goalkeeping" value={values.specialization} onChange={set('specialization')} />
        </div>
        <Input label="Email" required type="email" value={values.email} onChange={set('email')} error={errors.email} />
        <Input label="Phone" type="tel" placeholder="+233 …" value={values.phone} onChange={set('phone')} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{submitError}</p>}
      </form>
    </Modal>
  )
}

export default CoachForm
