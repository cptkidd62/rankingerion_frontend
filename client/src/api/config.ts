import axios from "axios";
import { API_BASE_URL } from "./url";

const API_URL = API_BASE_URL + '/config'

export const configApi = {
  async getConfig() {
    const response = await axios.get(`${API_URL}`)
    return response
  }
}