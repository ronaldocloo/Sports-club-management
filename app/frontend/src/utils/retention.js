// Retention-risk score from 0 (safe) to 100 (very likely to lapse). A plain sum of named factors, so
// each point can be explained. Mirrors the backend's RetentionScorer; used for demo data and tests.
export function scoreRetention(input) {
  const { daysToMembershipEnd, membershipActive, recentAttendance, earlierAttendance, noRecentAttendance, outstandingBalance, membershipAgeDays, hasRenewedBefore } = input
  const factors = []

  if (daysToMembershipEnd === null || daysToMembershipEnd === undefined) {
    factors.push({ label: 'No membership on record', points: 35 })
  } else if (daysToMembershipEnd < 0) {
    factors.push({ label: `Membership ended ${-daysToMembershipEnd} days ago and has not been renewed`, points: 40 })
  } else if (membershipActive) {
    const d = daysToMembershipEnd
    if (d <= 14) factors.push({ label: `Membership ends in ${d} ${d === 1 ? 'day' : 'days'}`, points: 30 })
    else if (d <= 30) factors.push({ label: `Membership ends in ${d} days`, points: 20 })
    else if (d <= 60) factors.push({ label: `Membership ends in ${d} days`, points: 10 })
  }

  if (recentAttendance !== null && recentAttendance !== undefined) {
    const r = recentAttendance
    if (r < 50) factors.push({ label: `Recent attendance is only ${Math.round(r)}%`, points: 25 })
    else if (r < 70) factors.push({ label: `Recent attendance is ${Math.round(r)}%`, points: 15 })
    else if (r < 85) factors.push({ label: `Recent attendance is ${Math.round(r)}%`, points: 5 })
    if (earlierAttendance !== null && earlierAttendance !== undefined && earlierAttendance - r >= 15) {
      factors.push({ label: `Attendance fell ${Math.round(earlierAttendance - r)} points`, points: 15 })
    }
  }
  if (noRecentAttendance) factors.push({ label: 'Has not attended in the last 30 days', points: 10 })
  if (outstandingBalance > 0 && membershipAgeDays > 30) factors.push({ label: `Owes GH₵${Math.round(outstandingBalance)}`, points: outstandingBalance > 100 ? 15 : 10 })
  if (hasRenewedBefore) factors.push({ label: 'Has renewed before', points: -15 })
  if (membershipAgeDays >= 365) factors.push({ label: 'Member for over a year', points: -5 })

  const score = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.points, 0)))
  const band = score >= 60 ? 'High' : score >= 35 ? 'Medium' : 'Low'
  const top = factors.filter((f) => f.points > 0).sort((a, b) => b.points - a.points)[0]
  let action = 'No action needed'
  if (top) {
    const l = top.label
    if (l.startsWith('No membership') || /membership/i.test(l)) action = 'Offer a membership or send a renewal reminder'
    else if (/attend/i.test(l)) action = 'Check in with the athlete about training'
    else if (l.startsWith('Owes')) action = 'Follow up on the unpaid balance'
    else action = 'Review this athlete'
  }
  return { score, band, factors, action }
}
