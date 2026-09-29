import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button, EmptyState } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { homeFor } from '../utils/permissions'

function NoAccessPage() {
  const { user } = useAuth()
  return (
    <EmptyState
      icon={ShieldOff}
      title="You don't have access to this page"
      description="Your role doesn't include this section. Contact your club administrator if you think this is a mistake."
      action={<Link to={homeFor(user?.role)}><Button>Go to my home page</Button></Link>}
    />
  )
}

export default NoAccessPage
