import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { createTrainingSession, deleteTrainingSession, getTrainingSessions, recordAttendance } from '../api/attendance'
import { getTeams } from '../api/teams'
import { errorMessage } from '../api/client'
import { Avatar, Badge, Button, Card, CardHeader, CardSkeleton, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Select, StatCard, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'
import { TODAY_ISO } from '../utils/today'

const STATUSES = ['Present', 'Late', 'Absent', 'Excused']
const tone = { Present: 'bg-emerald-600 text-white', Late: 'bg-amber-500 text-white', Absent: 'bg-red-600 text-white', Excused: 'bg-gray-500 text-white' }
const idle = 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'

function counts(session) {
  const c = { Present: 0, Late: 0, Absent: 0, Excused: 0 }
  session.attendance.forEach((a) => { c[a.status]++ })
  return c
}

function SessionModal({ open, teams, defaultTeamId, onClose, onSave }) {
  const empty = { teamId: '', date: TODAY_ISO, time: '08:00', location: '', notes: '' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setV({ ...empty, teamId: defaultTeamId ? String(defaultTeamId) : '' }) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setErrors({}); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.teamId) err.teamId = 'Select a team.'
    if (!v.date) err.date = 'Pick a date.'
    if (!v.time) err.time = 'Pick a start time.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSave(v)
      close()
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't create this session.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="New training session"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="session-form" loading={saving}>Create Session</Button></>}>
      <form id="session-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Select label="Team" required options={teams.map((t) => ({ value: String(t.teamId), label: t.teamName }))} placeholder="Select team" value={v.teamId} onChange={set('teamId')} error={errors.teamId} /></div>
        <Input label="Date" required type="date" value={v.date} onChange={set('date')} error={errors.date} />
        <Input label="Start time" required type="time" value={v.time} onChange={set('time')} error={errors.time} />
        <div className="sm:col-span-2"><Input label="Location" value={v.location} onChange={set('location')} /></div>
        <div className="sm:col-span-2"><Input label="Notes" value={v.notes} onChange={set('notes')} /></div>
        {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{errors.submit}</p>}
      </form>
    </Modal>
  )
}

function RecordModal({ session, team, onClose, onSave }) {
  const roster = useMemo(() => (team?.roster || []).filter((a) => a.isActive !== false), [team])
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      setMarks(Object.fromEntries(session.attendance.map((a) => [a.athleteId, a.status])))
      setError('')
    }
  }, [session])

  async function save() {
    const entries = roster.filter((a) => marks[a.athleteId]).map((a) => ({ athleteId: a.athleteId, status: marks[a.athleteId] }))
    if (entries.length === 0) return setError('Mark at least one athlete.')
    setSaving(true)
    try {
      await onSave(session, entries)
      onClose()
    } catch (e) {
      setError(errorMessage(e, "We couldn't save attendance."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!session} onClose={onClose} title={session ? `Attendance · ${team?.teamName || 'Team'} · ${formatDate(session.date, { day: 'numeric', month: 'short' })} ${session.time}` : ''}
      footer={<><Button variant="secondary" onClick={() => setMarks(Object.fromEntries(roster.map((a) => [a.athleteId, 'Present'])))}>Mark all present</Button><Button onClick={save} loading={saving}>Save attendance</Button></>}>
      {roster.length === 0 ? (
        <p className="text-sm text-gray-500">This team has no active athletes on its roster.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {roster.map((a) => (
            <li key={a.athleteId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><Avatar name={`${a.firstName} ${a.lastName}`} size={32} /><span className="text-sm font-medium text-gray-900">{a.firstName} {a.lastName}</span></div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Attendance for ${a.firstName} ${a.lastName}`}>
                {STATUSES.map((s) => (
                  <button key={s} type="button" aria-pressed={marks[a.athleteId] === s} onClick={() => setMarks((m) => ({ ...m, [a.athleteId]: s }))}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${marks[a.athleteId] === s ? tone[s] : idle}`}>{s}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Modal>
  )
}

function AttendancePage() {
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('loading')
  const [creating, setCreating] = useState(false)
  const [recording, setRecording] = useState(null)
  const [removing, setRemoving] = useState(null)
  const { push } = useToast()

  const load = useCallback(() => {
    setStatus('loading')
    getTeams()
      .then((t) => { setTeams(t); return getTrainingSessions() })
      .then((s) => { setSessions(s); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [])
  useEffect(() => { load() }, [load])

  const visible = sessions.filter((s) => !teamId || String(s.teamId) === teamId)
  const teamById = (id) => teams.find((t) => t.teamId === id)
  const marked = visible.filter((s) => s.attendance.length > 0)
  const overall = marked.length
    ? Math.round((marked.reduce((sum, s) => { const c = counts(s); return sum + (c.Present + c.Late) / s.attendance.length }, 0) / marked.length) * 100)
    : null

  async function create(values) {
    const created = await createTrainingSession(values)
    setSessions((l) => [created, ...l])
    push('Session created')
    setRecording(created)
  }

  async function save(session, entries) {
    const updated = await recordAttendance(session.id, entries)
    setSessions((l) => l.map((s) => (s.id === session.id ? updated : s)))
    push('Attendance saved')
  }

  async function remove() {
    const target = removing
    setRemoving(null)
    try {
      await deleteTrainingSession(target.id)
      setSessions((l) => l.filter((s) => s.id !== target.id))
      push('Session deleted')
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Management" title="Attendance" description="Record who came to training, session by session."
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>New Session</Button>} />

      {status === 'loading' && <><div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {status === 'error' && <ErrorState title="Couldn't load attendance" onRetry={load} />}

      {status === 'ready' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarCheck} label="Sessions" value={visible.length} note={teamId ? teamById(Number(teamId))?.teamName : 'all teams'} />
            <StatCard icon={ClipboardCheck} tone="green" label="Average attendance" value={overall != null ? `${overall}%` : '—'} note={marked.length ? `${marked.length} sessions recorded` : 'nothing recorded yet'} />
            <StatCard icon={ClipboardCheck} tone="amber" label="To record" value={visible.length - marked.length} note="sessions without attendance" />
          </div>

          <Card>
            <CardHeader title="Training sessions" action={
              <select aria-label="Filter by team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.teamId} value={String(t.teamId)}>{t.teamName}</option>)}
              </select>
            } />
            {visible.length === 0 ? (
              <div className="p-6"><EmptyState icon={CalendarCheck} title="No sessions yet" description="Create a training session, then record who attended."
                action={<Button icon={Plus} onClick={() => setCreating(true)}>New Session</Button>} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['Date', 'Team', 'Location', 'Attendance', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((s) => {
                      const c = counts(s)
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3"><p className="font-medium text-gray-900">{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p><p className="text-xs text-gray-500">{s.time}</p></td>
                          <td className="px-5 py-3 text-gray-700">{teamById(s.teamId)?.teamName || `Team ${s.teamId}`}</td>
                          <td className="px-5 py-3 text-gray-700">{s.location || '—'}</td>
                          <td className="px-5 py-3">
                            {s.attendance.length === 0 ? <Badge tone="amber">Not recorded</Badge> : (
                              <span className="inline-flex flex-wrap gap-1.5"><Badge tone="green">{c.Present} present</Badge>{c.Late > 0 && <Badge tone="amber">{c.Late} late</Badge>}{c.Absent > 0 && <Badge tone="red">{c.Absent} absent</Badge>}{c.Excused > 0 && <Badge tone="gray">{c.Excused} excused</Badge>}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="inline-flex items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setRecording(s)}>{s.attendance.length ? 'Edit' : 'Record'}</Button>
                              <button aria-label="Delete session" onClick={() => setRemoving(s)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <SessionModal open={creating} teams={teams} defaultTeamId={teamId} onClose={() => setCreating(false)} onSave={create} />
      <RecordModal session={recording} team={recording ? teamById(recording.teamId) : null} onClose={() => setRecording(null)} onSave={save} />
      <ConfirmDialog open={!!removing} danger title="Delete this session?" description="Its attendance records will be deleted too. This cannot be undone." confirmLabel="Delete Session" onConfirm={remove} onCancel={() => setRemoving(null)} />
    </div>
  )
}

export default AttendancePage
