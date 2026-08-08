import axios from "axios";

const API_URL = 'http://localhost:3000/config'

export const configApi = {
  async getConfig() {
    const response = await axios.get(`${API_URL}`)
    return response
  }
}