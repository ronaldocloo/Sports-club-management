import { useEffect, useMemo, useState } from "react";
import { Search, Users, UserCheck, UserPlus } from "lucide-react";
import { getAthletes } from "../api/athletes";
import AthleteList from "../components/athletes/AthleteList";

function AthletesPage() {
  const [athletes, setAthletes] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAthletes()
      .then(setAthletes)
      .catch(() => setAthletes([]));
  }, []);

  const filteredAthletes = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return athletes;

    return athletes.filter((athlete) => {
      const name = `${athlete.firstName || ""} ${
        athlete.lastName || ""
      }`.toLowerCase();

      const position = (athlete.position || "").toLowerCase();
      const id = String(athlete.athleteId || "").toLowerCase();

      return (
        name.includes(query) ||
        position.includes(query) ||
        id.includes(query)
      );
    });
  }, [athletes, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Athletes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage and view all registered athletes.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
          <UserPlus size={18} />
          Add Athlete
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Athletes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {athletes.length}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Showing</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {filteredAthletes.length}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <UserCheck size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Positions</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {
                  new Set(
                    athletes
                      .map((athlete) => athlete.position)
                      .filter(Boolean)
                  ).size
                }
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
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
            placeholder="Search athletes by name, position or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Athlete List */}
      {filteredAthletes.length > 0 ? (
        <AthleteList athletes={filteredAthletes} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto text-gray-300" size={40} />

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No athletes found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Try changing your search or add a new athlete.
          </p>
        </div>
      )}
    </div>
  );
}

export default AthletesPage;