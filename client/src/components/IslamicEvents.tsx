import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { getIslamicEvents } from "../utils/islamicEvents";
import { format } from "date-fns";

export function IslamicEvents() {
  const events = getIslamicEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Islamic Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-transparent hover:from-green-100 transition-colors"
            >
              <h3 className="font-semibold text-green-800">{event.name}</h3>
              <p className="text-sm text-gray-600">{event.description}</p>
              <div className="mt-1 text-sm">
                <span className="text-green-700">{event.hijriDate}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-gray-600">
                  {format(event.date, "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
