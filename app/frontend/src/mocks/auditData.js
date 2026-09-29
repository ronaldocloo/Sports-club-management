// Sample audit trail. Newest first.
export const auditLog = [
  { id: 1, actor: 'Ronald Ocloo', action: 'created athlete', target: 'Kwame Mensah', kind: 'athlete', time: '2026-09-29T10:42:00' },
  { id: 2, actor: 'Admin', action: 'updated team', target: 'Falcons FC', kind: 'team', time: '2026-09-29T10:38:00' },
  { id: 3, actor: 'Front Desk', action: 'marked payment as paid', target: 'Payment #1024', kind: 'payment', time: '2026-09-29T09:51:00' },
  { id: 4, actor: 'Ronald Ocloo', action: 'approved booking', target: 'Indoor Basketball Court, Wed 16:00', kind: 'facility', time: '2026-09-28T16:15:00' },
  { id: 5, actor: 'Coach Mensah', action: 'recorded attendance for', target: 'Falcons FC training', kind: 'athlete', time: '2026-09-28T09:10:00' },
  { id: 6, actor: 'Ronald Ocloo', action: 'recorded result for', target: 'Tigers FC 1–2 Falcons FC', kind: 'competition', time: '2026-09-27T20:05:00' },
  { id: 7, actor: 'Front Desk', action: 'renewed membership for', target: 'Efua Boateng', kind: 'membership', time: '2026-09-27T11:30:00' },
  { id: 8, actor: 'Ronald Ocloo', action: 'set facility to maintenance', target: 'Olympic Pool', kind: 'facility', time: '2026-09-26T14:20:00' },
  { id: 9, actor: 'Admin', action: 'created competition', target: 'Kwame Cup', kind: 'competition', time: '2026-09-25T13:00:00' },
  { id: 10, actor: 'Ronald Ocloo', action: 'created membership plan', target: 'Premium', kind: 'membership', time: '2026-09-24T10:00:00' },
  { id: 11, actor: 'Front Desk', action: 'registered athlete', target: 'Yaa Serwaa', kind: 'athlete', time: '2026-09-23T15:40:00' },
  { id: 12, actor: 'Ronald Ocloo', action: 'added user', target: 'front.desk2', kind: 'user', time: '2026-09-22T09:00:00' },
  { id: 13, actor: 'Coach Darko', action: 'updated schedule for', target: 'Track Blazers', kind: 'team', time: '2026-09-21T17:25:00' },
  { id: 14, actor: 'Ronald Ocloo', action: 'refunded payment', target: 'Payment #1008', kind: 'payment', time: '2026-09-20T12:10:00' },
  { id: 15, actor: 'Admin', action: 'changed role for', target: 'coach.boateng', kind: 'user', time: '2026-09-19T08:45:00' },
]
