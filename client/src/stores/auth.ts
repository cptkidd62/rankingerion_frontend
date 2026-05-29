import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "@/types/user";
import { api } from "@/api";

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
                console.log('Sukces logowania');
                console.log(this.user);
                return null;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('Błąd logowania', error);
                    return String(error.response!.data.message);
                }
            }
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
        },
        async fetchUser() {
            if (!this.token) return;

            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                const response = await api.auth.me();
                this.user = response.data;
            } catch (error) {
                console.error('Nie udało się pobrać użytkownika, wylogowano', error);
                this.logout(); // token nieprawidłowy / wygasł / użytkownik nie istnieje
            }
        },
    }
})