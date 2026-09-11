import { useEffect, useState } from 'react'
import { getTeams } from '../api/teams'
import TeamList from '../components/teams/TeamList'

function TeamsPage() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    getTeams().then(setTeams)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Teams</h1>
      <TeamList teams={teams} />
    </div>
  )
}

export default TeamsPage
