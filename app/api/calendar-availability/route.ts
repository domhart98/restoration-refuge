import { NextRequest, NextResponse } from "next/server";

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = Number(searchParams.get("serviceId"));

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json(
      { error: "A valid serviceId is required." },
      { status: 400 }
    );
  }

  try {
    const today = new Date();
    const dates: string[] = [];

    for (let offset = 0; offset <= 90; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      const dateString = getLocalDateString(date);

      const response = await fetch(
        new URL(
          `/api/availability?serviceId=${serviceId}&date=${dateString}`,
          request.url
        ),
        { cache: "no-store" }
      );

      if (!response.ok) {
        continue;
      }

      const result = await response.json();

      if (
        Array.isArray(result.availableTimes) &&
        result.availableTimes.length > 0
      ) {
        dates.push(dateString);
      }
    }

    return NextResponse.json({
      serviceId,
      datesWithAvailability: dates,
    });
  } catch (error) {
    console.error("Failed to retrieve calendar availability:", error);

    return NextResponse.json(
      { error: "Unable to retrieve calendar availability." },
      { status: 500 }
    );
  }
}
