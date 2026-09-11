import { useEffect, useState } from 'react'
import { getCompetitions } from '../api/competitions'
import CompetitionList from '../components/competitions/CompetitionList'

function CompetitionsPage() {
  const [competitions, setCompetitions] = useState([])

  useEffect(() => {
    getCompetitions().then(setCompetitions)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Competitions</h1>
      <CompetitionList competitions={competitions} />
    </div>
  )
}

export default CompetitionsPage
