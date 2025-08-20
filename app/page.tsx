"use client";

import EventCard from "@/components/EventCard";
import { EventSummary } from "../types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function HomePage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/events.json`)
      .then((response) => response.json())
      .then((data) => {
        const sortedEvents = ([...Object.values(data)] as EventSummary[]).sort(
          (a, b) =>
            new Date(a.dates.start.dateTime).getTime() -
            new Date(b.dates.start.dateTime).getTime()
        );
        setEvents(sortedEvents as EventSummary[]);
      });
  }, []);

  const venues = useMemo(() => {
    const venueMap: Record<string, string> = {};
    events.forEach((event) => {
      if (!venueMap[event.venueId]) {
        venueMap[event.venueId] = event.venueName;
      }
    });
    return venueMap;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!selectedVenueId) return events;
    return events.filter((event) => event.venueId === selectedVenueId);
  }, [events, selectedVenueId]);

  if (filteredEvents.length === 0) {
    return <div className="p-4">Loading events...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Upcoming Events</h1>
      <div className="flex gap-2">
        {Object.entries(venues).map(([venueId, venueName]) => (
          <button
            key={venueId}
            onClick={() => {
              if (selectedVenueId === venueId) {
                setSelectedVenueId(null); // Deselect if already selected
              } else {
                setSelectedVenueId(venueId);
              }
            }}
            className={classNames(
              selectedVenueId === venueId
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-100 text-gray-800",
              "flex gap-1 mb-4 text-sm border p-2 rounded  cursor-pointer transition"
            )}
          >
            <h2 className="font-semibold">{venueName}</h2>
            <p className={selectedVenueId === venueId ? "font-semibold" : ""}>
              {events.filter((e) => e.venueId === venueId).length}
            </p>
          </button>
        ))}
      </div>
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <Link key={event.id} href={`/event/${event.id}`}>
            <EventCard event={event} />
          </Link>
        ))}
      </div>
    </div>
  );
}
