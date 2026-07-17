import type {HttpService} from '@script-development/fs-http';
import type {ComputedRef, ShallowRef} from 'vue';

import {NotLoggedInError} from '@shared/errors/not-logged-in';
import {isAxiosError} from 'axios';
import {computed, shallowRef} from 'vue';

import type {AuthService, Credentials, RegistrationData} from './types';

export const createAuthService = <Profile extends {id: number}>(httpService: HttpService): AuthService<Profile> => {
    const userRef: ShallowRef<Profile | null> = shallowRef(null);

    const isLoggedIn = computed(() => userRef.value !== null);
    const user: ComputedRef<Profile | null> = computed(() => userRef.value);

    const userId = (): number => {
        const currentUser = userRef.value;
        if (!currentUser) throw new NotLoggedInError();

        return currentUser.id;
    };

    const register = async (registrationData: RegistrationData): Promise<void> => {
        const {data} = await httpService.postRequest<Profile>('/register', registrationData);
        userRef.value = data;
    };

    const login = async (loginData: Credentials): Promise<void> => {
        const {data} = await httpService.postRequest<Profile>('/login', loginData);
        userRef.value = data;
    };

    const clearUser = (): void => {
        userRef.value = null;
    };

    const logout = async (): Promise<void> => {
        try {
            await httpService.postRequest('/logout', {});
        } catch (error) {
            // A rejected logout (expired session -> 401/419, network failure)
            // must still log the user out locally — keeping logged-in chrome
            // over a dead session strands the user. Transport errors are
            // swallowed so callers can proceed to the login redirect;
            // non-axios errors are programming errors and stay loud.
            if (!isAxiosError(error)) throw error;
        } finally {
            clearUser();
        }
    };

    const checkIfLoggedIn = async (): Promise<void> => {
        try {
            const {data} = await httpService.getRequest<Profile>('/me');
            userRef.value = data;
        } catch (error) {
            // Boot must never be blocked by the /me probe: any transport-level
            // failure (401, 5xx, network down, timeout) degrades to "not
            // logged in" — the auth guard keeps protecting authOnly routes.
            // Non-axios errors are programming errors and stay loud.
            if (!isAxiosError(error)) throw error;

            clearUser();
        }
    };

    return {isLoggedIn, user, userId, register, login, logout, clearUser, checkIfLoggedIn};
};
