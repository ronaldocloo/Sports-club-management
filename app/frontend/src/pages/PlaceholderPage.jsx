import { useLocation } from 'react-router-dom'
import { Hammer } from 'lucide-react'
import { flatNav } from '../components/layout/navConfig'
import { EmptyState, PageHeader } from '../components/ui'

function PlaceholderPage() {
  const { pathname } = useLocation()
  const current = flatNav.find((n) => n.path === pathname)
  const title = current?.name || 'Page'

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Coming soon" title={title} description={`The ${title.toLowerCase()} module is being built.`} />
      <EmptyState icon={current?.icon || Hammer} title={`${title} is on the way`} description="This section is part of the roadmap and will appear here soon." />
    </div>
  )
}

export default PlaceholderPage
