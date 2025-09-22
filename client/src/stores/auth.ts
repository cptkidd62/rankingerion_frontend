import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "@/types/user";

const API_URL = 'http://localhost:3000/auth'

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
        async login({ username, password }: Credentials): Promise<string | null> {
            return axios.post(`${API_URL}/login`, { username, password }).then((response) => {
                this.user = response.data.user;
                this.token = response.data.token;
                if (this.token)
                    localStorage.setItem('token', this.token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                console.log('Sukces logowania');
                console.log(this.user);
                return null;
            }).catch((error) => {
                console.error('Błąd logowania', error);
                return error.response.data.message;
            })
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
                const response = await axios.get(`${API_URL}/me`);
                this.user = response.data;
            } catch (error) {
                console.error('Nie udało się pobrać użytkownika, wylogowano', error);
                this.logout(); // token nieprawidłowy / wygasł / użytkownik nie istnieje
            }
        },
    }
})