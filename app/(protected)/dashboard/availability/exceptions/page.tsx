"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Therapist {
  id: number;
  display_name: string;
}

interface Location {
  id: number;
  name: string;
}

interface AvailabilityException {
  id: number;
  therapist_id: number;
  therapist_name: string;
  location_id: number;
  location_name: string;
  exception_date: string;
  is_available: number | boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export default function AvailabilityExceptionsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  const [therapistId, setTherapistId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [exceptionDate, setExceptionDate] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [therapistsResponse, locationsResponse, exceptionsResponse] =
        await Promise.all([
          fetch("/api/owner/therapists"),
          fetch("/api/owner/locations"),
          fetch("/api/owner/availability/exceptions"),
        ]);

      const therapistsData = await therapistsResponse.json();
      const locationsData = await locationsResponse.json();
      const exceptionsData = await exceptionsResponse.json();

      if (
        !therapistsResponse.ok ||
        !locationsResponse.ok ||
        !exceptionsResponse.ok
      ) {
        throw new Error(
          therapistsData.error ||
            locationsData.error ||
            exceptionsData.error ||
            "Failed to load availability data."
        );
      }

      const therapistList: Therapist[] =
        therapistsData.therapists ?? [];
      const locationList: Location[] =
        locationsData.locations ?? [];

      setTherapists(therapistList);
      setLocations(locationList);
      setExceptions(exceptionsData.exceptions ?? []);

      setTherapistId((current) =>
        current || String(therapistList[0]?.id ?? "")
      );
      setLocationId((current) =>
        current || String(locationList[0]?.id ?? "")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load availability data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!therapistId || !locationId || !exceptionDate) {
      toast.error("Please select a therapist, location, and date.");
      return;
    }

    if (isAvailable && startTime >= endTime) {
      toast.error("End time must be later than start time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/owner/availability/exceptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            therapistId: Number(therapistId),
            locationId: Number(locationId),
            exceptionDate,
            isAvailable,
            startTime: isAvailable ? startTime : null,
            endTime: isAvailable ? endTime : null,
            reason: reason.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create availability exception."
        );
      }

      toast.success("Availability exception created.");

      setReason("");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create availability exception."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateValue: string) {
    const date = dateValue.slice(0, 10);
    const [year, month, day] = date.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="p-8 text-slate-600">
        Loading availability exceptions...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Availability Exceptions
        </h1>
        <p className="mt-2 text-slate-600">
          Manage days off and special working hours without changing the
          regular weekly schedule.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Add an exception
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="therapist"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Therapist
              </label>
              <select
                id="therapist"
                value={therapistId}
                onChange={(event) => setTherapistId(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
              >
                <option value="">Select therapist</option>
                {therapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Location
              </label>
              <select
                id="location"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
              >
                <option value="">Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="exceptionDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>
              <input
                id="exceptionDate"
                type="date"
                value={exceptionDate}
                onChange={(event) => setExceptionDate(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Reason (optional)
              </label>
              <input
                id="reason"
                type="text"
                maxLength={255}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Day off or public holiday"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="rounded-xl bg-purple-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(event) => setIsAvailable(event.target.checked)}
                className="mt-1 h-4 w-4 accent-purple-700"
              />
              <span>
                <span className="block font-medium text-slate-900">
                  Limited availability
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  Enable this for a date when the therapist can work only
                  during specific hours. Leave unchecked to block the entire
                  day.
                </span>
              </span>
            </label>

            {isAvailable && (
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Available from
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Available until
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !therapists.length || !locations.length}
            className="rounded-lg bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save exception"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Existing exceptions
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {exceptions.length}{" "}
              {exceptions.length === 1 ? "exception" : "exceptions"} configured
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-medium text-purple-800 hover:bg-purple-50"
          >
            Refresh
          </button>
        </div>

        {exceptions.length === 0 ? (
          <p className="mt-6 rounded-lg bg-slate-50 p-5 text-slate-600">
            No availability exceptions have been added yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Therapist</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 font-medium">Availability</th>
                  <th className="px-3 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exception) => {
                  const available =
                    exception.is_available === true ||
                    Number(exception.is_available) === 1;

                  return (
                    <tr
                      key={exception.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-4 text-slate-800">
                        {formatDate(exception.exception_date)}
                      </td>
                      <td className="px-3 py-4 text-slate-800">
                        {exception.therapist_name}
                      </td>
                      <td className="px-3 py-4 text-slate-800">
                        {exception.location_name}
                      </td>
                      <td className="px-3 py-4">
                        {available ? (
                          <span className="font-medium text-green-700">
                            {exception.start_time}–{exception.end_time}
                          </span>
                        ) : (
                          <span className="font-medium text-red-700">
                            Unavailable all day
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {exception.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}