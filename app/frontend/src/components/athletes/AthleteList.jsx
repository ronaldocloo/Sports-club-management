import AthleteCard from './AthleteCard'

function AthleteList({ athletes = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {athletes.map((athlete) => (
        <AthleteCard key={athlete.athleteId} athlete={athlete} />
      ))}
    </div>
  )
}

export default AthleteList
