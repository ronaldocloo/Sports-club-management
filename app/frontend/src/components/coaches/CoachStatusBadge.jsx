import { Badge } from '../ui'

const tones = { Active: 'green', 'On leave': 'amber', Inactive: 'gray' }

function CoachStatusBadge({ status }) {
  return <Badge tone={tones[status] || 'gray'}>{status}</Badge>
}

export default CoachStatusBadge
