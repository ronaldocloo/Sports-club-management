import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAthleteById } from '../api/athletes'

function AthleteDetailPage() {
  const { athleteId } = useParams()
  const [athlete, setAthlete] = useState(null)

  useEffect(() => {
    getAthleteById(athleteId).then(setAthlete)
  }, [athleteId])

  if (!athlete) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">
        {athlete.firstName} {athlete.lastName}
      </h1>
      <p className="text-gray-500">{athlete.position}</p>
      <p className="text-gray-500">{athlete.email}</p>
      <p className="text-gray-500">{athlete.dateOfBirth}</p>
    </div>
  )
}

export default AthleteDetailPage
