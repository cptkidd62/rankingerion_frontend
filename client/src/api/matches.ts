import axios from "axios";
import { API_BASE_URL } from "./url";

const API_URL = API_BASE_URL + '/matches'

export const matchesApi = {
  async fetch() {
    const response = await axios.get(API_URL)
    return response
  }
}