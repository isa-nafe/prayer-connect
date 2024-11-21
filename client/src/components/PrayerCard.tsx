import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Prayer } from "@db/schema";
import { format } from "date-fns";
import { usePrayers } from "../hooks/use-prayers";
import { Users, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PrayerChat } from "./PrayerChat";

interface PrayerCardProps {
  prayer: Prayer & { attendeeCount?: number };
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const { joinPrayer } = usePrayers();
  const [chatOpen, setChatOpen] = useState(false);

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
          {typeof prayer.attendeeCount === 'number' ? prayer.attendeeCount : 1} attending
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => joinPrayer(prayer.id)}
        >
          Join Prayer
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setChatOpen(true)}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </CardFooter>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl p-0">
          <PrayerChat prayerId={prayer.id} onClose={() => setChatOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
