import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prayer } from "@db/schema";
import { format } from "date-fns";
import { usePrayers } from "../hooks/use-prayers";
import { Users } from "lucide-react";

interface PrayerCardProps {
  prayer: Prayer & { attendeeCount?: number };
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const { joinPrayer } = usePrayers();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          Prayer at {prayer.musallahLocation}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600">
          {format(new Date(prayer.prayerTime), "MMM d, h:mm a")}
        </p>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-1" />
          {prayer.attendeeCount || 1} attending
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => joinPrayer(prayer.id)}
        >
          Join Prayer
        </Button>
      </CardFooter>
    </Card>
  );
}
