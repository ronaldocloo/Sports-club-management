function CompetitionCard({ competition }) {
  if (!competition) return null

  return (
    <div className="rounded border border-gray-200 p-4">
      <h3 className="font-medium">{competition.competitionName}</h3>
      <p className="text-sm text-gray-500">
        {competition.date} &middot; {competition.location}
      </p>
    </div>
  )
}

export default CompetitionCard
