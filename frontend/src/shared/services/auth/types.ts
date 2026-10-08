import type {ComputedRef} from 'vue';

export interface Credentials {
    email: string;
    password: string;
}

export interface AuthService<Profile> {
    isLoggedIn: ComputedRef<boolean>;
    user: ComputedRef<Profile | null>;
    userId: () => number;
    login: (loginData: Credentials) => Promise<void>;
    logout: () => Promise<void>;
    /**
     * Drop the local user state without touching the server session. Used by
     * the 401 response-error middleware when the session has already expired
     * server-side and there is nothing left to revoke.
     */
    clearUser: () => void;
    checkIfLoggedIn: () => Promise<void>;
}
