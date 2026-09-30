import { Link } from "react-router-dom";
import { User, ArrowRight } from "lucide-react";

function AthleteCard({ athlete }) {
  if (!athlete) return null;

  const fullName = `${athlete.firstName || ""} ${
    athlete.lastName || ""
  }`.trim();

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Avatar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <User size={22} />
        </div>

        {athlete.position && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            {athlete.position}
          </span>
        )}
      </div>

      {/* Athlete Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {fullName || "Unnamed Athlete"}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Athlete ID: {athlete.athleteId || "N/A"}
        </p>
      </div>

      {/* View Button */}
      <Link
        to={`/athletes/${athlete.athleteId}`}
        className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <span>View Profile</span>
        <ArrowRight
          size={17}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

export default AthleteCard;