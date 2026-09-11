import { useEffect, useState } from 'react'
import { getAthletes } from '../api/athletes'
import AthleteList from '../components/athletes/AthleteList'

function AthletesPage() {
  const [athletes, setAthletes] = useState([])

  useEffect(() => {
    getAthletes().then(setAthletes)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Athletes</h1>
      <AthleteList athletes={athletes} />
    </div>
  )
}

export default AthletesPage
