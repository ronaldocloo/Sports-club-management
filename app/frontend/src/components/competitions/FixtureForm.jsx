import { useState } from 'react'
import { Button, Input, Modal, Select } from '../ui'
import { errorMessage } from '../../api/client'

const empty = { home: '', away: '', date: '', time: '', round: 'Group Stage', venue: '', officials: '' }

// Schedules a match between two teams registered in the competition.
function FixtureForm({ open, teams, defaultVenue, onClose, onSubmit }) {
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setV(empty); setErrors({}); onClose() }
  const options = teams.map((t) => ({ value: String(t.teamId), label: t.team }))

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.home) err.home = 'Select the home team.'
    if (!v.away) err.away = 'Select the away team.'
    else if (v.away === v.home) err.away = 'A team cannot play itself.'
    if (!v.date) err.date = 'Pick a date.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSubmit({ homeTeamId: v.home, awayTeamId: v.away, date: v.date, time: v.time, round: v.round.trim(), venue: v.venue.trim() || defaultVenue, officials: v.officials.trim() })
      close()
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't schedule this fixture.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Schedule fixture"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="fixture-form" loading={saving}>Schedule</Button></>}>
      <form id="fixture-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Select label="Home team" required options={options} placeholder="Select team" value={v.home} onChange={set('home')} error={errors.home} />
        <Select label="Away team" required options={options} placeholder="Select team" value={v.away} onChange={set('away')} error={errors.away} />
        <Input label="Date" required type="date" value={v.date} onChange={set('date')} error={errors.date} />
        <Input label="Time" type="time" value={v.time} onChange={set('time')} />
        <Input label="Round" value={v.round} onChange={set('round')} hint="Final, semi-final and third-place rounds are excluded from the league table." />
        <Input label="Venue" value={v.venue} onChange={set('venue')} placeholder={defaultVenue} />
        <div className="sm:col-span-2"><Input label="Officials" value={v.officials} onChange={set('officials')} /></div>
        {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{errors.submit}</p>}
      </form>
    </Modal>
  )
}

export default FixtureForm
