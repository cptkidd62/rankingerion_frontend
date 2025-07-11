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
        async login({ username, password }: Credentials) {
            axios.post(`${API_URL}/login`, { username, password }).then((response) => {
                this.user = response.data.user;
                this.token = response.data.token;
                if (this.token)
                    localStorage.setItem('token', this.token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            }).catch((error) => {
                console.error('Błąd logowania', error);
            })
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
        },
    }
})