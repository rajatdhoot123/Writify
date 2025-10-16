declare module "better-auth/react" {
  interface AuthUser {
    id?: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
  }

  interface UseSessionResult {
    data: { user: AuthUser } | null;
    isPending: boolean;
    error: Error | null;
  }

  export function createAuthClient(config: { baseURL: string; plugins?: unknown[] }): {
    useSession: () => UseSessionResult;
    signOut: () => Promise<void>;
  };
}


