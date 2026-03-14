import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

function formatDeparture(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ChatsScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const myListing = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const myBooking = useQuery(api.bookings.getMyBooking, { userId: userId! });

  const loading = myListing === undefined || myBooking === undefined;

  // Build chat entries — deduplicate if driver is also rider on same listing
  const chats: { listingId: string; label: string; sublabel: string; direction: string; departureTime: number }[] = [];

  if (myListing) {
    chats.push({
      listingId: myListing._id,
      label: "My Ride (Driver)",
      sublabel: myListing.direction === "GC_TO_HCL" ? "Gaur City → HCL" : "HCL → Gaur City",
      direction: myListing.direction,
      departureTime: myListing.departureTime,
    });
  }

  if (myBooking && myBooking.listingId !== myListing?._id) {
    const listing = myBooking.listing;
    chats.push({
      listingId: myBooking.listingId,
      label: "My Ride (Rider)",
      sublabel: listing.direction === "GC_TO_HCL" ? "Gaur City → HCL" : "HCL → Gaur City",
      direction: listing.direction,
      departureTime: listing.departureTime,
    });
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Chats</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="card animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-8">
            <p className="text-3xl mb-3">💬</p>
            <p className="font-semibold text-gray-700">No active chats</p>
            <p className="text-sm text-gray-400 mt-1">
              Post or join a ride to start chatting with your group.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="mt-4 text-brand-700 font-semibold text-sm"
            >
              Browse Rides
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {chats.map((chat) => (
              <button
                key={chat.listingId}
                onClick={() => navigate(`/chat/${chat.listingId}`)}
                className="card w-full flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{chat.label}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.sublabel} · {formatDeparture(chat.departureTime)}
                  </p>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
