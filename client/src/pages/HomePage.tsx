import { useUser } from "../hooks/use-user";
import { usePrayers } from "../hooks/use-prayers";
import { Button } from "@/components/ui/button";
import { PrayerCard } from "../components/PrayerCard";
import { IslamicEvents } from "../components/IslamicEvents";
import { PrayerTimes } from "../components/PrayerTimes";
import { CreatePrayerDialog } from "../components/CreatePrayerDialog";
import { useState } from "react";
import { Loader2, LogOut, Plus } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useUser();
  const { prayers, isLoading, error } = usePrayers();
const handleLogout = async () => {
  try {
    // Disable logout button
    const logoutButton = document.querySelector('[data-logout-button]');
    if (logoutButton) {
      (logoutButton as HTMLButtonElement).disabled = true;
    }
    
    await logout();
  } catch (error) {
    console.error('Logout failed:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to logout",
      variant: "destructive"
    });
    
    // Re-enable button on error
    const logoutButton = document.querySelector('[data-logout-button]');
    if (logoutButton) {
      (logoutButton as HTMLButtonElement).disabled = false;
    }
  }
};
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="border-b bg-white/50 backdrop-blur-sm fixed top-0 w-full z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-800">SFU Prayer Connect</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">Prayer Meetups</h2>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Prayer Meetup
              </Button>
            </div>

            {error ? (
          <div className="flex justify-center p-8">
            <div className="text-red-600">Failed to load prayers. Please try again later.</div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prayers?.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        )}
          </div>
          <div className="space-y-8">
            <PrayerTimes />
            <IslamicEvents />
          </div>
        </div>
      </main>

      <CreatePrayerDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
