import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllPrayerTimes, getNextPrayer, getPrayerTimesForDate } from "../utils/prayerTimes";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<Array<{name: string; time: Date}>>([]);
  const [nextPrayer, setNextPrayer] = useState<{name: string; time: Date} | null>(null);

  useEffect(() => {
    const times = getAllPrayerTimes();
    setPrayerTimes(times);
    
    const prayers = getPrayerTimesForDate();
    setNextPrayer(getNextPrayer(prayers));

    // Update next prayer every minute
    const interval = setInterval(() => {
      const prayers = getPrayerTimesForDate();
      setNextPrayer(getNextPrayer(prayers));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Prayer Times
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {nextPrayer && (
            <div className="mb-4 p-2 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Next Prayer</p>
              <p className="text-lg font-semibold text-green-900">
                {nextPrayer.name} at {format(nextPrayer.time, "h:mm a")}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {prayerTimes.map((prayer) => (
              <div key={prayer.name} className="flex justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="font-medium">{prayer.name}</span>
                <span className="text-gray-600">{format(prayer.time, "h:mm a")}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
