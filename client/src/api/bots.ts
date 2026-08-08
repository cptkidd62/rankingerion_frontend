import axios from "axios";

const API_URL = 'http://localhost:3000/bots'

export const botsApi = {
  async create(payload: { name: string, file: any }, userId: number) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('file', payload.file);
    formData.append('userId', String(userId));
    const response = await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response
  },
  async delete(id: number) {
    const response = await axios.delete(`${API_URL}/${id}`)
    return response
  },
  async fetch() {
    const response = await axios.get(API_URL)
    return response
  },
  async getFile(id: number) {
    const response = await axios.get(`${API_URL}/${id}/file`, {
      responseType: 'blob',
    })
    return response
  },
  async updateName(id: number, name: string) {
    const response = await axios.patch(`${API_URL}/${id}`, { name })
    return response
  }
}
