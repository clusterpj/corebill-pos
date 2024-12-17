// src/services/api/users.js
import api from './client'

export const usersApi = {
  getAll: (params) => api.get('/v1/users', { params }),
  getById: (id) => api.get(`/v1/users/${id}`),
  create: (userData) => api.post('/v1/users', userData),
  update: (id, userData) => api.put(`/v1/users/${id}`, userData),
  delete: (id) => api.delete(`/v1/users/${id}`)
}