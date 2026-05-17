import type {ComputedRef} from 'vue';

export interface Credentials {
    email: string;
    password: string;
}

export interface RegistrationData {
    familyName: string;
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    inviteCode?: string;
}

export interface AuthService<Profile> {
    isLoggedIn: ComputedRef<boolean>;
    user: ComputedRef<Profile | null>;
    userId: () => number;
    register: (data: RegistrationData) => Promise<void>;
    login: (loginData: Credentials) => Promise<void>;
    logout: () => Promise<void>;
    checkIfLoggedIn: () => Promise<void>;
}
