import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTeamById } from '../api/teams'

function TeamDetailPage() {
  const { teamId } = useParams()
  const [team, setTeam] = useState(null)

  useEffect(() => {
    getTeamById(teamId).then(setTeam)
  }, [teamId])

  if (!team) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">{team.teamName}</h1>
      <p className="text-gray-500">{team.sport}</p>
      <p className="text-gray-500">Coach: {team.coachName}</p>
    </div>
  )
}

export default TeamDetailPage
