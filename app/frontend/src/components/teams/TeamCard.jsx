function TeamCard({ team }) {
  if (!team) return null

  return (
    <div className="rounded border border-gray-200 p-4">
      <h3 className="font-medium">{team.teamName}</h3>
      <p className="text-sm text-gray-500">{team.sport}</p>
    </div>
  )
}

export default TeamCard
