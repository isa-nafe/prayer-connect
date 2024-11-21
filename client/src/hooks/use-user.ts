import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: Partial<InsertUser>
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, Partial<InsertUser>>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: async () => {
      try {
        // First close WebSocket connections
        const wsElements = document.querySelectorAll('[data-websocket-connection]');
        wsElements.forEach(el => {
          const ws = (el as any).websocket;
          if (ws && ws.close) ws.close();
        });
        
        // Clear all cached data
        queryClient.clear();
        
        // Perform logout request
        const result = await handleRequest('/api/logout', 'POST');
        
        if (result.ok) {
          // Only redirect on successful logout
          window.location.href = '/';
        }
        
        return result;
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    onMutate: () => {
      // Prevent multiple clicks
      return { previousData: queryClient.getQueryData(['user']) };
    },
    onError: (_, __, context) => {
      // Restore previous data on error
      if (context) {
        queryClient.setQueryData(['user'], context.previousData);
      }
    },
    onSettled: () => {
      // Always clear cache
      queryClient.clear();
    }
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    
  };
}
