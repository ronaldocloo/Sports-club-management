import AthleteList from '../athletes/AthleteList'

function TeamRoster({ athletes = [] }) {
  return (
    <div>
      <h3 className="mb-2 font-medium">Roster</h3>
      <AthleteList athletes={athletes} />
    </div>
  )
}

export default TeamRoster
