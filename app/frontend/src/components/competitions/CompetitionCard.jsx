import { Link } from "react-router-dom";
import Badge from "../ui/Badge";
import { statusTone } from "../../utils/competition";
import {
  Trophy,
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";

function CompetitionCard({ competition }) {
  if (!competition) return null;

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
          <Trophy size={23} />
        </div>

        <Badge tone={statusTone[competition.status] || "blue"}>
          {competition.status || "Scheduled"}
        </Badge>
      </div>

      {/* Competition Name */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {competition.competitionName || "Unnamed Competition"}
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          Competition #{competition.competitionId || "N/A"}
        </p>
      </div>

      {/* Details */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <CalendarDays size={17} className="text-gray-400" />
          <span>{competition.date || "Date not specified"}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <MapPin size={17} className="text-gray-400" />
          <span>{competition.location || "Location not specified"}</span>
        </div>
      </div>

      {/* View Button */}
      <Link
        to={`/competitions/${competition.competitionId}`}
        className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <span>View Competition</span>

        <ArrowRight
          size={17}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

export default CompetitionCard;