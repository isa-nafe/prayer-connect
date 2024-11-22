import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Prayer } from '@db/schema';

type PrayerWithAttendees = Prayer & {
  attendeeCount: number;
};
import { useToast } from '@/hooks/use-toast';

export function usePrayers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: prayers, isLoading, error } = useQuery<PrayerWithAttendees[]>({
    queryKey: ['prayers'],
    queryFn: async () => {
      const response = await fetch('/api/prayers', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch prayers');
      }
      return response.json();
    }
  });

  const createPrayer = useMutation({
    mutationFn: async (data: Omit<Prayer, 'id' | 'creatorId' | 'createdAt'>) => {
      const response = await fetch('/api/prayers', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create prayer meetup');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      toast({
        title: "Success",
        description: "Prayer meetup created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prayer meetup",
        variant: "destructive"
      });
    }
  });

  const joinPrayer = useMutation({
    mutationFn: async (prayerId: number) => {
      const response = await fetch(`/api/prayers/${prayerId}/join`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to join prayer meetup');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      toast({
        title: "Success",
        description: "Joined prayer meetup successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join prayer meetup",
        variant: "destructive"
      });
    }
  });

  return {
    prayers,
    isLoading,
    error,
    createPrayer: createPrayer.mutateAsync,
    joinPrayer: joinPrayer.mutateAsync
  };
}
