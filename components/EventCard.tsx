import { EventSummary } from "../types";

export default function EventCard({ event }: { event: EventSummary }) {
  const date = new Date(event.dates.start.dateTime).toLocaleString();

  return (
    <div className="border p-3 rounded hover:bg-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-4 ">
        <img
          src={event.logoUrl}
          alt={event.name}
          className="w-32 h-18 object-contain"
        />
        <div>
          <div className="text-lg font-semibold">{event.name}</div>
          <div className="text-sm text-gray-600">{date}</div>
        </div>
      </div>
      <div className="text-right pr-4">
        <div className="text-lg">${event.latestLowestPrice}</div>
        <div className="text-xs whitespace-nowrap">
          {new Date(event.lastUpdated)
            .toISOString()
            .split(".")[0]
            .replace("T", " ")}
        </div>
      </div>
    </div>
  );
}
