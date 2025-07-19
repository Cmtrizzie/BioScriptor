import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add Firebase auth headers if user is authenticated
  const user = auth.currentUser;
  
  // In development mode, check for demo user
  const demoUser = localStorage.getItem('demo_user');
  if (demoUser && import.meta.env.DEV) {
    const parsedUser = JSON.parse(demoUser);
    headers['x-firebase-uid'] = parsedUser.uid;
    headers['x-firebase-email'] = parsedUser.email;
    headers['x-firebase-display-name'] = parsedUser.displayName;
    headers['x-firebase-photo-url'] = parsedUser.photoURL;
  } else if (user) {
    headers['x-firebase-uid'] = user.uid;
    headers['x-firebase-email'] = user.email || '';
    headers['x-firebase-display-name'] = user.displayName || '';
    headers['x-firebase-photo-url'] = user.photoURL || '';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add Firebase auth headers if user is authenticated
    const user = auth.currentUser;
    
    // In development mode, check for demo user
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser && import.meta.env.DEV) {
      const parsedUser = JSON.parse(demoUser);
      headers['x-firebase-uid'] = parsedUser.uid;
      headers['x-firebase-email'] = parsedUser.email;
      headers['x-firebase-display-name'] = parsedUser.displayName;
      headers['x-firebase-photo-url'] = parsedUser.photoURL;
    } else if (user) {
      headers['x-firebase-uid'] = user.uid;
      headers['x-firebase-email'] = user.email || '';
      headers['x-firebase-display-name'] = user.displayName || '';
      headers['x-firebase-photo-url'] = user.photoURL || '';
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
