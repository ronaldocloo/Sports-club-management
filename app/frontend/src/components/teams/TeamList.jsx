import TeamCard from './TeamCard'

function TeamList({ teams = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.teamId} team={team} />
      ))}
    </div>
  )
}

export default TeamList
