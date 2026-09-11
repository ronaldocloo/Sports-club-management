function AthleteCard({ athlete }) {
  if (!athlete) return null

  return (
    <div className="rounded border border-gray-200 p-4">
      <h3 className="font-medium">
        {athlete.firstName} {athlete.lastName}
      </h3>
      <p className="text-sm text-gray-500">{athlete.position}</p>
    </div>
  )
}

export default AthleteCard
