import { EventDetails } from "../../../types";

interface Params {
  slug: string;
}

async function getEventData(slug: string): Promise<EventDetails> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/events/${slug}.json`,
    {
      cache: "no-store",
    }
  );
  return res.json();
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEventData(slug);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={event.logoUrl}
          alt={event.name}
          className="w-24 h-24 object-contain"
        />
        <div>
          <a href={event.url} target="_blank" rel="noopener noreferrer">
            <h1 className="text-2xl font-bold">{event.name}</h1>
          </a>
          <p className="text-gray-600">
            {new Date(event.dates.start.dateTime).toLocaleString()}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Price History</h2>
      <ul className="text-sm">
        {event.priceRange.map((p, i) => (
          <li key={i} className="mb-1">
            <span className="font-mono">
              {new Date(p.date).toLocaleString()}
            </span>{" "}
            —
            <span className="ml-2">
              Lowest: ${p.lowestPrice} | Highest: ${p.upperPrice}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
