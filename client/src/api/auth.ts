import axios from "axios";
import { API_BASE_URL } from "./url";

const API_URL =  API_BASE_URL + '/auth'

interface Credentials {
    username: string
    password: string
}

export const authApi = {
  async login({ username, password }: Credentials) {
    const response = await axios.post(`${API_URL}/login`, { username, password })
    return response
  },
  async me() {
    const response = await axios.get(`${API_URL}/me`);
    return response
  },
  async password(password: string) {
    const response = await axios.patch(`${API_URL}/me/password`, { password });
    return response
  }
}