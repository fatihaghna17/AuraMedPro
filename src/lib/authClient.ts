// src/lib/authClient.ts
// Client autentikasi Cloudflare Pages Functions & D1 dengan antarmuka kompatibel Supabase Auth

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    username: string;
    is_guest?: boolean;
    [key: string]: any;
  };
  is_anonymous: boolean;
  profile?: any;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

export interface AuthResponse {
  data: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
  error: Error | null;
}

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';
type AuthStateListener = (event: AuthChangeEvent, session: AuthSession | null) => void;

class AuthClient {
  private currentSession: AuthSession | null = null;
  private listeners: Set<AuthStateListener> = new Set();
  private isCheckingSession = false;

  private notifyListeners(event: AuthChangeEvent, session: AuthSession | null) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, session);
      } catch (err) {
        console.error('[AuthClient] Listener error:', err);
      }
    });
  }

  /**
   * Login dengan username atau email + password
   */
  async signInWithPassword(credentials: { email?: string; username?: string; password: string }): Promise<AuthResponse> {
    try {
      const identifier = credentials.email || credentials.username || '';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier,
          password: credentials.password,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || body.error) {
        return {
          data: { user: null, session: null },
          error: new Error(body.error || 'Login gagal'),
        };
      }

      const session: AuthSession = body.data.session;
      this.currentSession = session;
      this.notifyListeners('SIGNED_IN', session);

      return {
        data: {
          user: session.user,
          session,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: new Error(err.message || 'Network error'),
      };
    }
  }

  /**
   * Masuk sebagai tamu (Guest)
   */
  async signInAnonymously(options?: { options?: { data?: { username?: string; is_guest?: boolean } } }): Promise<AuthResponse> {
    try {
      const customUsername = options?.options?.data?.username;
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: customUsername }),
      });

      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || body.error) {
        return {
          data: { user: null, session: null },
          error: new Error(body.error || 'Gagal masuk sebagai guest'),
        };
      }

      const session: AuthSession = body.data.session;
      this.currentSession = session;
      this.notifyListeners('SIGNED_IN', session);

      return {
        data: {
          user: session.user,
          session,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: new Error(err.message || 'Network error'),
      };
    }
  }

  /**
   * Alias untuk signInAnonymously
   */
  async signInGuest(username?: string): Promise<AuthResponse> {
    return this.signInAnonymously({ options: { data: { username, is_guest: true } } });
  }

  /**
   * Logout user / guest
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[AuthClient] Logout request failed, clearing local state:', err);
    } finally {
      this.currentSession = null;
      this.notifyListeners('SIGNED_OUT', null);
    }
    return { error: null };
  }

  /**
   * Ambil session saat ini dari cookie via endpoint /api/auth/me
   */
  async getSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        this.currentSession = null;
        return { data: { session: null }, error: null };
      }

      const body = (await res.json().catch(() => ({}))) as any;
      const session: AuthSession | null = body.data?.session || null;
      this.currentSession = session;

      return { data: { session }, error: null };
    } catch (err: any) {
      return { data: { session: null }, error: new Error(err.message || 'Network error') };
    }
  }

  /**
   * Ambil data user aktif
   */
  async getUser(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    const { data, error } = await this.getSession();
    return {
      data: { user: data.session?.user || null },
      error,
    };
  }

  /**
   * Listener perubahan status auth (kompatibel dengan Supabase onAuthStateChange)
   */
  onAuthStateChange(callback: AuthStateListener): { data: { subscription: { unsubscribe: () => void } } } {
    this.listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }
}

export const authClient = new AuthClient();
export const auth = authClient; // alias
