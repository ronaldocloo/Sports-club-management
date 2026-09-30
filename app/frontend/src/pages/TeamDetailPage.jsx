import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Users,
  Trophy,
  UserRound,
  CalendarDays,
} from "lucide-react";
import { getTeamById } from "../api/teams";

function TeamDetailPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    getTeamById(teamId)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-gray-500">Loading team...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-4">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Teams
        </Link>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Shield className="mx-auto text-gray-300" size={42} />

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Team not found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The team you're looking for could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to="/teams"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Teams
      </Link>

      {/* Team Header */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white md:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Shield size={38} />
            </div>

            <div>
              <p className="text-sm font-medium text-blue-100">
                Team Profile
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {team.teamName}
              </h1>

              <p className="mt-1 text-sm text-blue-100">
                {team.sport || "Sport not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Team Information */}
        <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Team ID
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              #{team.teamId}
            </p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Sport
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              {team.sport || "Not specified"}
            </p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Coach
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              {team.coachName || "Not assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Users size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Roster</p>
              <p className="text-2xl font-bold text-gray-900">
                {team.roster?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <Trophy size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Competitions</p>
              <p className="text-2xl font-bold text-gray-900">
                {team.competitions?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <CalendarDays size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-bold text-green-600">
                Active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Roster
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Athletes currently registered to this team.
          </p>
        </div>

        {team.roster?.length > 0 ? (
          <div className="divide-y">
            {team.roster.map((athlete) => (
              <div
                key={athlete.athleteId}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <UserRound size={18} />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {athlete.firstName} {athlete.lastName}
                    </p>

                    <p className="text-xs text-gray-500">
                      {athlete.position || "Athlete"}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-gray-400">
                  #{athlete.athleteId}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto text-gray-300" size={36} />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No athletes in this roster
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Team roster information will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamDetailPage;