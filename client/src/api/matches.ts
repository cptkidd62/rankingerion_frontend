import axios from "axios";

const API_URL = 'http://localhost:3000/matches'

export const matchesApi = {
  async fetch() {
    const response = await axios.get(API_URL)
    return response
  }
}