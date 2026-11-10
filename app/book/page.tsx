"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface AddOn {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
}

interface AvailabilityResponse {
  date: string;
  serviceId: number;
  durationMinutes: number;
  availableTimes: string[];
  error?: string;
}

type BookingStep = "service" | "addons" | "datetime" | "customer";

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(price: number) {
  return `BBD $${Number(price).toFixed(2)}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-BB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("serviceId") ?? "";
  const bookingOptionsRef = useRef<HTMLDivElement>(null);
  const shouldScrollToStepRef = useRef(false);

  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [pendingServiceName, setPendingServiceName] = useState("");
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(true);

  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [datesWithAvailability, setDatesWithAvailability] = useState<string[]>([]);
  const [loadingCalendarAvailability, setLoadingCalendarAvailability] =
    useState(false);
  const [selectedTime, setSelectedTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  const selectedService = services.find(
    (service) => service.id === Number(selectedServiceId)
  );

  const selectedAddOns = addOns.filter((addOn) =>
    selectedAddOnIds.includes(addOn.id)
  );

  const totalPrice =
    Number(selectedService?.price ?? 0) +
    selectedAddOns.reduce(
      (total, addOn) => total + Number(addOn.price),
      0
    );

  const totalDuration =
    Number(selectedService?.duration_minutes ?? 0) +
    selectedAddOns.reduce(
      (total, addOn) => total + Number(addOn.duration_minutes ?? 0),
      0
    );

  const groupedServices = useMemo(() => {
    const groups = new Map<string, Service[]>();

    services.forEach((service) => {
      const existing = groups.get(service.name) ?? [];
      existing.push(service);
      groups.set(service.name, existing);
    });

    return Array.from(groups.entries()).map(([name, options]) => ({
      name,
      options: options.sort(
        (a, b) => a.duration_minutes - b.duration_minutes
      ),
      description:
        options.find((item) => item.description)?.description ?? null,
      minDuration: Math.min(
        ...options.map((item) => item.duration_minutes)
      ),
      maxDuration: Math.max(
        ...options.map((item) => item.duration_minutes)
      ),
      minPrice: Math.min(...options.map((item) => Number(item.price))),
    }));
  }, [services]);

  const durationOptions = services
    .filter((service) => service.name === pendingServiceName)
    .sort((a, b) => a.duration_minutes - b.duration_minutes);

  // Load Services
  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load services.");
        }

        setServices(data.services ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load services."
        );
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, []);

  // Load Add-Ons
  useEffect(() => {
    async function loadAddOns() {
      try {
        const response = await fetch("/api/add-ons");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load add-ons.");
        }

        setAddOns(data.addOns ?? data.addons ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load add-ons."
        );
      } finally {
        setLoadingAddOns(false);
      }
    }

    loadAddOns();
  }, []);

  // Restore a service passed in the URL, e.g. /book?serviceId=4
  useEffect(() => {
    if (!services.length || !initialServiceId) return;

    const service = services.find(
      (item) => item.id === Number(initialServiceId)
    );

    if (service) {
      setSelectedServiceId(String(service.id));
      setSelectedServiceName(service.name);
    }
  }, [services, initialServiceId]);

  // Load Available Times
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setAvailableTimes([]);
      setSelectedTime("");
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      setLoadingTimes(true);
      setError("");
      setAvailableTimes([]);
      setSelectedTime("");

      try {
        const params = new URLSearchParams({
          serviceId: selectedServiceId,
          date: selectedDate,
          addOnIds: selectedAddOnIds.join(","),
        });

        const response = await fetch(`/api/availability?${params}`);
        const data: AvailabilityResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load available times."
          );
        }

        if (!cancelled) {
          setAvailableTimes(data.availableTimes ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load available times."
          );
        }
      } finally {
        if (!cancelled) setLoadingTimes(false);
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId, selectedDate, totalDuration]);

  // Load Calendar Availability
  useEffect(() => {
    if (!selectedServiceId) {
      setDatesWithAvailability([]);
      setLoadingCalendarAvailability(false);
      return;
    }

    let cancelled = false;

    async function loadCalendarAvailability() {
      setLoadingCalendarAvailability(true);

      const params = new URLSearchParams({
        serviceId: selectedServiceId,
        durationMinutes: String(totalDuration),
      });

      try {
        const response = await fetch(
          `/api/calendar-availability?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to load calendar availability.");
        }

        const data = await response.json();

        if (!cancelled) {
          setDatesWithAvailability(data.datesWithAvailability ?? []);
        }
      } catch (err) {
        console.error("Calendar availability error:", err);

        if (!cancelled) {
          setDatesWithAvailability([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCalendarAvailability(false);
        }
      }
    }

    loadCalendarAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId, totalDuration]);

  // Scroll to top on current step change
  useEffect(() => {
    if (!shouldScrollToStepRef.current) return;

    shouldScrollToStepRef.current = false;

    bookingOptionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentStep]);

  function chooseServiceName(name: string) {
    setError("");
    setPendingServiceName(name);
    setDurationModalOpen(true);
  }

  function chooseDuration(service: Service) {
    const changedService = selectedServiceId !== String(service.id);

    setSelectedServiceName(service.name);
    setSelectedServiceId(String(service.id));
    setDurationModalOpen(false);
    setPendingServiceName("");

    if (changedService) {
      setSelectedDate("");
      setSelectedTime("");
      setAvailableTimes([]);
    }
  }

  function goToStep(step: BookingStep) {
    setError("");

    if (step !== currentStep) {
      shouldScrollToStepRef.current = true;
      setCurrentStep(step);
    }
  }

  function handleContinue() {
    setError("");

    let nextStep: BookingStep | null = null;

    if (currentStep === "service") {
      if (!selectedService) {
        setError("Please choose a service and duration first.");
        return;
      }

      nextStep = "addons";
    } else if (currentStep === "addons") {
      nextStep = "datetime";
    } else if (currentStep === "datetime") {
      if (!selectedDate || !selectedTime) {
        setError("Please select a date and available time.");
        return;
      }

      nextStep = "customer";
    }

    if (nextStep) {
      shouldScrollToStepRef.current = true;
      setCurrentStep(nextStep);
    }
  }

  function handleBack() {
    let previousStep: BookingStep | null = null;

    if (currentStep === "addons") {
      previousStep = "service";
    } else if (currentStep === "datetime") {
      previousStep = "addons";
    } else if (currentStep === "customer") {
      previousStep = "datetime";
    }

    if (previousStep) {
      setError("");
      shouldScrollToStepRef.current = true;
      setCurrentStep(previousStep);
    }
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-BB", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime) {
      setError("Please complete your service, date, and time selection.");
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setError("Please complete all required contact information.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          selectedAddOnIds,
          date: selectedDate,
          time: selectedTime,
          customerName,
          customerEmail,
          customerPhone,
          customerNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to book your appointment.");
      }

      // Booking request was accepted.
      setShowBookingSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const customerInfoValid =
    customerName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) &&
    customerPhone.trim().length > 0;

  const previewButtonDisabled =
    currentStep === "service"
      ? !selectedService
      : currentStep === "addons"
        ? false
        : currentStep === "datetime"
          ? !selectedDate || !selectedTime
          : !customerInfoValid || isSubmitting;

  const previewButtonLabel =
    currentStep === "service"
      ? "Continue to add-ons"
      : currentStep === "addons"
        ? "Continue to date & time"
        : currentStep === "datetime"
          ? "Continue to your details"
          : isSubmitting
            ? "Submitting booking..."
            : "Confirm Booking";

  return (
    <main className="min-h-screen bg-[#faf9fc] px-4 py-10 pb-32 text-gray-800 sm:px-6 lg:pb-10">
      <div className="mx-auto max-w-7xl">
        <a
          href="/"
          className="text-sm font-medium text-purple-700 hover:text-purple-900"
        >
          ← Back to home
        </a>

        <header className="mb-8 mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-700">
            Restoration Refuge Massage Studio
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-gray-900">
            Book Your Massage
          </h1>
          <p className="mt-3 text-gray-600">
            Choose your treatment, appointment time, and contact details.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap justify-center gap-2 text-sm">
          {(["service", "addons", "datetime", "customer"] as BookingStep[]).map(
            (step, index) => {
              const labels = ["1. Service", "Add-Ons", "3. Date & time", "4. Your details"];
              const active = currentStep === step;

              return (
                <div
                  key={step}
                  className={`rounded-full px-4 py-2 ${
                    active
                      ? "bg-purple-700 font-semibold text-white"
                      : "bg-white text-gray-500 ring-1 ring-gray-200"
                  }`}
                >
                  {labels[index]}
                </div>
              );
            }
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div
            ref={bookingOptionsRef}
            className="min-w-0 scroll-mt-24 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8"
          >
            {currentStep === "service" && (
              <section>
                <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                  Choose your massage
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Select a treatment to see its available durations and prices.
                </p>

                {loadingServices ? (
                  <p className="text-gray-500">Loading services...</p>
                ) : groupedServices.length === 0 ? (
                  <p className="text-gray-500">
                    No services are currently available.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {groupedServices.map((group) => {
                      const selected = selectedServiceName === group.name;

                      const durationLabel =
                        group.minDuration === group.maxDuration
                          ? `${group.minDuration} minutes`
                          : `${group.minDuration}–${group.maxDuration} minutes`;

                      return (
                        <button
                          key={group.name}
                          type="button"
                          onClick={() => chooseServiceName(group.name)}
                          className={`w-full rounded-2xl border p-5 text-left transition hover:border-purple-400 hover:bg-purple-50/50 ${
                            selected
                              ? "border-purple-600 bg-purple-50 ring-1 ring-purple-300"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {group.name}
                              </h3>
                              <p className="mt-1 text-sm text-purple-700">
                                {durationLabel}
                              </p>

                              {group.description && (
                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                  {group.description}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 sm:text-right">
                              <p className="text-xs text-gray-500">From</p>
                              <p className="text-lg font-bold text-purple-800">
                                {formatCurrency(group.minPrice)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                            <span className="text-sm font-medium text-purple-700">
                              {selected
                                ? "Selected — choose duration again"
                                : "Select service"}
                            </span>
                            <span aria-hidden="true" className="text-purple-700">
                              →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {currentStep === "addons" && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Enhance your treatment
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    Add an optional extra to personalize your experience.
                  </p>
                </div>

                {loadingAddOns ? (
                  <p className="text-gray-500">Loading add-ons...</p>
                ) : addOns.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-4 text-gray-600">
                    No add-ons are currently available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addOns.map((addOn) => {
                      const selected = selectedAddOnIds.includes(addOn.id);

                      return (
                        <button
                          key={addOn.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedAddOnIds((current) =>
                              selected
                                ? current.filter((id) => id !== addOn.id)
                                : [...current, addOn.id]
                            );
                          }}
                          className={`w-full rounded-2xl border p-5 text-left transition ${
                            selected
                              ? "border-purple-600 bg-purple-50 ring-1 ring-purple-300"
                              : "border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50/50"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                selected
                                  ? "border-purple-700 bg-purple-700 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {selected && "✓"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="font-semibold text-gray-900">
                                  {addOn.name}
                                </h3>

                                <span className="font-semibold text-purple-800">
                                  +{formatCurrency(Number(addOn.price))}
                                </span>
                              </div>

                              {addOn.description && (
                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                  {addOn.description}
                                </p>
                              )}

                              {addOn.duration_minutes != null &&
                                addOn.duration_minutes > 0 && (
                                  <p className="mt-2 text-xs text-purple-700">
                                    Adds {addOn.duration_minutes} minutes
                                  </p>
                                )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAddOnIds([])}
                  className="mt-5 text-sm font-medium text-gray-500 hover:text-purple-700"
                >
                  Clear selections
                </button>
              </section>
            )}

            {currentStep === "datetime" && (
              <section>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Choose date & time
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Select a date, then choose one of the available appointment
                      times.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep("service")}
                    className="shrink-0 text-sm font-medium text-purple-700 hover:underline"
                  >
                    Change service
                  </button>
                </div>

                {!selectedService ? (
                  <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
                    Choose a service and duration first.
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center rounded-2xl border border-purple-100 bg-white p-3 sm:p-6">
                      <DayPicker
                        mode="single"
                        selected={
                          selectedDate
                            ? new Date(`${selectedDate}T12:00:00`)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return;

                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(date.getDate()).padStart(2, "0");

                          setSelectedDate(`${year}-${month}-${day}`);
                          setSelectedTime("");
                        }}
                        disabled={[
                          { before: new Date(`${getLocalDateString()}T00:00:00`) },
                          {
                            after: (() => {
                              const date = new Date(
                                `${getLocalDateString()}T12:00:00`
                              );
                              date.setDate(date.getDate() + 90);
                              return date;
                            })(),
                          },
                        ]}
                        showOutsideDays
                        className="mx-auto"
                        modifiers={{
                          hasAvailability: (date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");

                            return datesWithAvailability.includes(
                              `${year}-${month}-${day}`
                            );
                          },
                        }}
                        modifiersClassNames={{
                          hasAvailability: "font-semibold text-green-700",
                        }}
                        classNames={{
                          selected: "bg-purple-700 text-white rounded-full",
                          today: "font-bold text-purple-700",
                          disabled: "text-gray-300 cursor-not-allowed",
                        }}
                      />
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-500">
                      {loadingCalendarAvailability
                        ? "Checking available dates..."
                        : "Dates with availability are highlighted."}
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-6">
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        {selectedDate
                          ? `Available times — ${formatDate(selectedDate)}`
                          : "Available times"}
                      </h3>

                      {!selectedDate ? (
                        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                          Select a date on the calendar to view available times.
                        </p>
                      ) : loadingTimes ? (
                        <p className="rounded-xl bg-purple-50 p-4 text-center text-sm text-purple-800">
                          Checking available appointments...
                        </p>
                      ) : availableTimes.length === 0 ? (
                        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-600">
                          No appointment times available for this date. Try
                          another date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {availableTimes.map((time) => {
                            const active = selectedTime === time;

                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                aria-pressed={active}
                                className={`rounded-xl border px-4 py-3 font-semibold transition ${
                                  active
                                    ? "border-purple-700 bg-purple-700 text-white"
                                    : "border-purple-200 text-purple-900 hover:border-purple-500 hover:bg-purple-50"
                                }`}
                              >
                                {formatTime(time)} {active ? "✓" : ""}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}

            {currentStep === "customer" && (
              <form onSubmit={handleSubmit}>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Your information
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      We’ll use these details to contact you about your booking
                      request.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep("datetime")}
                    className="shrink-0 text-sm font-medium text-purple-700 hover:underline"
                  >
                    Change date/time
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-2 block text-sm font-medium"
                    >
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-email"
                      className="mb-2 block text-sm font-medium"
                    >
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="mb-2 block text-sm font-medium"
                    >
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-notes"
                      className="mb-2 block text-sm font-medium"
                    >
                      Notes <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      id="customer-notes"
                      rows={4}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Anything you'd like us to know before your appointment?"
                      className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  No payment is required at this stage. Your appointment request
                  will need therapist confirmation.
                </p>

                {error && (
                  <p
                    role="alert"
                    className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!customerInfoValid || isSubmitting}
                  className="mt-6 w-full rounded-xl bg-purple-700 px-6 py-4 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting booking..." : "Confirm Booking"}
                </button>
              </form>
            )}

            {error && currentStep !== "customer" && (
              <p
                role="alert"
                className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {currentStep !== "service" && (
              <button
                type="button"
                onClick={handleBack}
                className="mt-6 rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Sticky booking preview */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Booking preview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your appointment details
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Service
                    </p>

                    {selectedService && (
                      <button
                        type="button"
                        onClick={() => goToStep("service")}
                        className="text-sm font-medium text-purple-700 hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {selectedService ? (
                    <>
                      <p className="mt-1 font-semibold text-gray-900">
                        {selectedService.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {totalDuration} minutes total
                      </p>
                      <p className="mt-1 font-semibold text-purple-800">
                        {formatCurrency(Number(selectedService.price))}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">
                      No service selected
                    </p>
                  )}
                </div>

                {selectedAddOns.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Add-ons
                      </p>

                      <button
                        type="button"
                        onClick={() => goToStep("addons")}
                        className="text-sm font-medium text-purple-700 hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {selectedAddOns.map((addOn) => (
                        <div
                          key={addOn.id}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="text-gray-700">{addOn.name}</span>
                          <span className="font-medium text-gray-900">
                            +{formatCurrency(Number(addOn.price))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date & time
                    </p>

                    {(selectedDate || selectedTime) && (
                      <button
                        type="button"
                        onClick={() => goToStep("datetime")}
                        className="text-sm font-medium text-purple-700 hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {selectedDate ? (
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(selectedDate)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">
                      Date not selected
                    </p>
                  )}

                  {selectedTime ? (
                    <p className="text-sm text-gray-700">
                      {formatTime(selectedTime)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Time not selected</p>
                  )}
                </div>

                <div className="border-t border-purple-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">
                      Estimated total
                    </span>
                    <span className="text-lg font-bold text-purple-900">
                      {selectedService
                        ? formatCurrency(Number(totalPrice))
                        : "—"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Payment will be handled later. Booking requests are pending
                    therapist confirmation.
                  </p>
                </div>
              </div>

              {currentStep !== "customer" && (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={previewButtonDisabled}
                  className="mt-6 w-full rounded-xl bg-purple-700 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {previewButtonLabel}
                </button>
              )}

              {currentStep === "customer" && (
                <div className="mt-6 rounded-xl bg-purple-50 p-4 text-sm text-purple-900">
                  Complete the required fields, then use{" "}
                  <strong>Confirm Booking</strong> in the form.
                </div>
              )}
            </div>
          </aside>

          {/* Mobile booking preview */}
          {currentStep !== "customer" && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-purple-100 bg-white/95 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_15px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden">
            <div className="mx-auto max-w-7xl">

              {/* Compact booking summary */}
              <div className="mb-3 flex items-center justify-between gap-4">

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {selectedService
                      ? selectedService.name
                      : "Choose a massage"}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {selectedService
                      ? `${totalDuration} minutes`
                      : "Your booking summary"}
                    {selectedAddOns.length > 0 &&
                      ` · ${selectedAddOns.length} add-on${selectedAddOns.length > 1 ? "s" : ""}`}
                  </p>

                  {selectedDate && selectedTime && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {selectedDate} · {formatTime(selectedTime)}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-500">
                    Estimated total
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {selectedService
                      ? formatCurrency(totalPrice)
                      : "—"}
                  </p>
                </div>

              </div>

              {/* Continue button */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={previewButtonDisabled}
                className="w-full rounded-xl bg-purple-700 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {previewButtonLabel}
              </button>

            </div>
          </div>
        )}
        </div>
      </div>

      {/* Duration selection modal */}
      {durationModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDurationModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duration-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3
              id="duration-modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              Choose your duration
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {pendingServiceName} — select the duration and price.
            </p>

            <div className="mt-5 space-y-3">
              {durationOptions.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => chooseDuration(service)
                  }
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:border-purple-500 hover:bg-purple-50 ${
                    selectedServiceId === String(service.id)
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-gray-900">
                      {service.duration_minutes} minutes
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      {service.name}
                    </span>
                  </span>

                  <span className="shrink-0 font-semibold text-purple-800">
                    {formatCurrency(Number(service.price))}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDurationModalOpen(false)}
              className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Booking request success modal */}
      {showBookingSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-success-title"
            className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-8 w-8 text-green-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12.5 9.5 17 19 7"
                />
              </svg>
            </div>

            <h2
              id="booking-success-title"
              className="mt-5 text-2xl font-semibold text-gray-900"
            >
              Booking Request Submitted!
            </h2>

            <p className="mt-3 leading-6 text-gray-600">
              Thank you for choosing Restoration Refuge Massage Studio.
              Your booking request has been successfully submitted.
            </p>

            <div className="mt-5 rounded-xl bg-purple-50 p-4 text-left">
              <p className="font-semibold text-purple-900">
                What happens next?
              </p>

              <ul className="mt-2 space-y-2 text-sm leading-5 text-purple-900">
                <li>• You will receive an email regarding your booking request.</li>
                <li>
                  • Please wait for confirmation from your therapist before
                  considering your appointment confirmed.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-6 w-full rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white transition hover:bg-purple-800"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#faf9fc] p-12 text-center">
          Loading booking page...
        </main>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}