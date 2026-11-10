"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

interface Therapist {
  id: number;
  display_name: string;
}

interface Location {
  id: number;
  name: string;
}

interface AvailabilityRule {
  id: number;
  therapist_id: number;
  therapist_name: string;
  location_id: number;
  location_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string | null;
  effective_until: string | null;
  is_active: number | boolean;
}

const days = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [therapistId, setTherapistId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [availabilityResponse, therapistsResponse, locationsResponse] =
        await Promise.all([
          fetch("/api/owner/availability"),
          fetch("/api/owner/therapists"),
          fetch("/api/owner/locations"),
        ]);

      const availabilityData = await availabilityResponse.json();
      const therapistsData = await therapistsResponse.json();
      const locationsData = await locationsResponse.json();

      if (!availabilityResponse.ok) {
        throw new Error(
          availabilityData.error || "Failed to load availability."
        );
      }

      if (!therapistsResponse.ok) {
        throw new Error(therapistsData.error || "Failed to load therapists.");
      }

      if (!locationsResponse.ok) {
        throw new Error(locationsData.error || "Failed to load locations.");
      }

      setAvailability(availabilityData.availability ?? []);
      setTherapists(therapistsData.therapists ?? []);
      setLocations(locationsData.locations ?? []);

      if (!therapistId && therapistsData.therapists?.length) {
        setTherapistId(String(therapistsData.therapists[0].id));
      }

      if (!locationId && locationsData.locations?.length) {
        setLocationId(String(locationsData.locations[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [therapistId, locationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!therapistId || !locationId) {
      setError("Please create or activate a therapist and location first.");
      return;
    }

    if (startTime >= endTime) {
      setError("The end time must be later than the start time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/owner/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: Number(therapistId),
          locationId: Number(locationId),
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          effectiveFrom: effectiveFrom || null,
          effectiveUntil: effectiveUntil || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save availability.");
      }

      setSuccess("Weekly availability saved.");
      setEffectiveFrom("");
      setEffectiveUntil("");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "No end date";
    return value.slice(0, 10);
  }

  return (
    <main className="min-h-screen bg-[#faf8fc] px-4 py-10 text-gray-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <a
          href="/dashboard"
          className="text-sm font-medium text-purple-700 hover:underline"
        >
          ← Back to dashboard
        </a>

        <header className="mb-8 mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-700">
            Restoration Refuge Massage Studio
          </p>
          <h1 className="mt-2 text-3xl font-bold">Availability</h1>
          <p className="mt-2 text-gray-600">
            Set the regular working hours customers can book.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {success}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Add weekly hours</h2>
          <p className="mt-1 text-sm text-gray-600">
            Add a rule for a particular therapist, location and day.
          </p>

          {loading ? (
            <p className="mt-6 text-gray-600">Loading availability...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Therapist
                  <select
                    value={therapistId}
                    onChange={(event) => setTherapistId(event.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="">Select a therapist</option>
                    {therapists.map((therapist) => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.display_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Location
                  <select
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="">Select a location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Day of the week
                  <select
                    value={dayOfWeek}
                    onChange={(event) => setDayOfWeek(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >
                    {days.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">
                    Start time
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    End time
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Effective from (optional)
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(event) => setEffectiveFrom(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Effective until (optional)
                  <input
                    type="date"
                    value={effectiveUntil}
                    onChange={(event) => setEffectiveUntil(event.target.value)}
                    min={effectiveFrom || undefined}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving || !therapists.length || !locations.length}
                className="rounded-lg bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save availability"}
              </button>

              {(!therapists.length || !locations.length) && (
                <p className="text-sm text-amber-700">
                  An active therapist and location are required before you can
                  add availability.
                </p>
              )}
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Existing availability</h2>

          {loading ? (
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          ) : availability.length === 0 ? (
            <p className="mt-4 text-gray-600">
              No availability rules have been added yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="px-3 py-3 font-medium">Day</th>
                    <th className="px-3 py-3 font-medium">Therapist</th>
                    <th className="px-3 py-3 font-medium">Location</th>
                    <th className="px-3 py-3 font-medium">Hours</th>
                    <th className="px-3 py-3 font-medium">Effective dates</th>
                  </tr>
                </thead>
                <tbody>
                  {availability.map((rule) => (
                    <tr key={rule.id} className="border-b border-gray-100">
                      <td className="px-3 py-3">
                        {days.find((day) => day.value === rule.day_of_week)
                          ?.label ?? "Unknown"}
                      </td>
                      <td className="px-3 py-3">{rule.therapist_name}</td>
                      <td className="px-3 py-3">{rule.location_name}</td>
                      <td className="px-3 py-3">
                        {rule.start_time}–{rule.end_time}
                      </td>
                      <td className="px-3 py-3">
                        {rule.effective_from
                          ? String(rule.effective_from).slice(0, 10)
                          : "Any date"}
                        {" – "}
                        {formatDate(rule.effective_until)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}