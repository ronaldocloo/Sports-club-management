import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/permissions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Trophy,
  CalendarDays,
  MapPin,
  Plus,
} from "lucide-react";
import { getCompetitions, createCompetition } from "../api/competitions";
import { Button, ErrorState, PageHeader, TableSkeleton, useToast } from "../components/ui";
import CompetitionForm from "../components/competitions/CompetitionForm";
import CompetitionList from "../components/competitions/CompetitionList";

function CompetitionsPage() {
  const [competitions, setCompetitions] = useState([]);
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("loading");
  const [formOpen, setFormOpen] = useState(false);
  const { push } = useToast();
  const { user } = useAuth();
  const isAdmin = ["Admin", "SuperAdmin"].includes(normalizeRole(user?.role));

  const load = useCallback(() => {
    setStatus("loading");
    getCompetitions()
      .then((data) => { setCompetitions(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(values) {
    const created = await createCompetition(values);
    setCompetitions((list) => [created, ...list]);
    push("Competition created");
  }

  const filteredCompetitions = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return competitions;

    return competitions.filter((competition) => {
      const name = (
        competition.competitionName || ""
      ).toLowerCase();

      const location = (
        competition.location || ""
      ).toLowerCase();

      const id = String(
        competition.competitionId || ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        location.includes(query) ||
        id.includes(query)
      );
    });
  }, [competitions, search]);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Management" title="Competitions" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Management" title="Competitions" />
        <ErrorState title="Couldn't load competitions" onRetry={load} />
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
            Competitions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage competitions, events, schedules and locations.
          </p>
        </div>

        {isAdmin && <Button icon={Plus} onClick={() => setFormOpen(true)}>Add Competition</Button>}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Competitions
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {competitions.length}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <Trophy size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Upcoming
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {
                  competitions.filter((c) => c.status === "Upcoming" || c.status === "Ongoing").length
                }
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <CalendarDays size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Locations
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {
                  new Set(
                    competitions
                      .map((competition) => competition.location)
                      .filter(Boolean)
                  ).size
                }
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <MapPin size={21} />
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
            placeholder="Search competitions by name, location or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Results */}
      {filteredCompetitions.length > 0 ? (
        <CompetitionList competitions={filteredCompetitions} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Trophy
            className="mx-auto text-gray-300"
            size={40}
          />

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No competitions found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Try changing your search or add a new competition.
          </p>
        </div>
      )}
      <CompetitionForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

export default CompetitionsPage;