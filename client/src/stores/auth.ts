import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "@/types/user";

const API_URL = 'http://localhost:3000/auth'


interface Credentials {
    login: string
    password: string
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        token: localStorage.getItem('token') as string | null,
    }),
    actions: {
        async login({ login, password }: Credentials) {
            axios.post(`${API_URL}/login`, { login, password }).then((response) => {
                this.user = response.data.user;
                this.token = response.data.token;
                if (this.token)
                    localStorage.setItem('token', this.token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            }).catch((error) => {
                console.error('Błąd logowania', error);
            })
        },
        async create(user: User) {
            axios.post(`${API_URL}/signup`, { user }).then((response) => {
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