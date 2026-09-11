import CompetitionCard from './CompetitionCard'

function CompetitionList({ competitions = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {competitions.map((competition) => (
        <CompetitionCard
          key={competition.competitionId}
          competition={competition}
        />
      ))}
    </div>
  )
}

export default CompetitionList
