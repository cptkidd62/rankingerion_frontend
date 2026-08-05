import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "@/types/user";
import { api } from "@/api";
import router from "@/router";

interface Credentials {
    username: string
    password: string
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        token: localStorage.getItem('token') as string | null,
    }),
    actions: {
        async login({ username, password }: Credentials): Promise<string | null | undefined> {
            try {
                const response = await api.auth.login({ username, password })
                this.user = response.data.user;
                this.token = response.data.token;
                if (this.token)
                    localStorage.setItem('token', this.token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                console.log('Sign in success');
                console.log(this.user);
                return null;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('Sign in error', error);
                    return String(error.response!.data.message);
                }
            }
        },
        async logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            await router.replace('/signin')
        },
        async fetchUser() {
            if (!this.token) return;

            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                const response = await api.auth.me();
                this.user = response.data;
            } catch (error) {
                console.error('Failed fetching user, logged out', error);
                await this.logout(); // token nieprawidłowy / wygasł / użytkownik nie istnieje
            }
        },
    }
})