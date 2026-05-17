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

    const logout = async (): Promise<void> => {
        await httpService.postRequest('/logout', {});
        userRef.value = null;
    };

    const checkIfLoggedIn = async (): Promise<void> => {
        try {
            const {data} = await httpService.getRequest<Profile>('/me');
            userRef.value = data;
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 401) {
                userRef.value = null;

                return;
            }

            throw error;
        }
    };

    return {isLoggedIn, user, userId, register, login, logout, checkIfLoggedIn};
};
