import axios from "axios";
import { API_BASE_URL } from "./url";

const API_URL = API_BASE_URL + '/users'

export const usersApi = {
  async uploadProfileImage(file: any, userId: number) {
    console.log(file);
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(API_URL + '/' + userId + '/img', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response
  },

  async fetchAllProfileImages() {
    const response = await axios.get(API_URL + '/imgs')
    return response
  }
}
