import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/permissions";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trophy, Users, Plus } from "lucide-react";
import { getTeams, createTeam } from "../api/teams";
import { Button, ErrorState, PageHeader, TableSkeleton, useToast } from "../components/ui";
import TeamForm from "../components/teams/TeamForm";
import TeamList from "../components/teams/TeamList";

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("loading");
  const [formOpen, setFormOpen] = useState(false);
  const { push } = useToast();
  const { user } = useAuth();
  const isAdmin = ["Admin", "SuperAdmin"].includes(normalizeRole(user?.role));

  const load = useCallback(() => {
    setStatus("loading");
    getTeams()
      .then((data) => { setTeams(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(values) {
    const created = await createTeam({ name: values.name, sport: values.sport, coachName: values.coachName });
    setTeams((list) => [created, ...list]);
    push("Team created");
  }

  const filteredTeams = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return teams;

    return teams.filter((team) => {
      const name = (team.teamName || "").toLowerCase();
      const sport = (team.sport || "").toLowerCase();
      const id = String(team.teamId || "").toLowerCase();

      return (
        name.includes(query) ||
        sport.includes(query) ||
        id.includes(query)
      );
    });
  }, [teams, search]);

  const sportsCount = new Set(
    teams.map((team) => team.sport).filter(Boolean)
  ).size;

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Management" title="Teams" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Management" title="Teams" />
        <ErrorState title="Couldn't load teams" onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Teams
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage sports teams and view their details.
          </p>
        </div>

        {isAdmin && <Button icon={Plus} onClick={() => setFormOpen(true)}>Add Team</Button>}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Teams</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {teams.length}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Trophy size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sports</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {sportsCount}
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <Trophy size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Showing</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {filteredTeams.length}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <Users size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search teams by name, sport or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Team List */}
      {filteredTeams.length > 0 ? (
        <TeamList teams={filteredTeams} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Trophy className="mx-auto text-gray-300" size={40} />

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No teams found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Try changing your search or add a new team.
          </p>
        </div>
      )}
      <TeamForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

export default TeamsPage;