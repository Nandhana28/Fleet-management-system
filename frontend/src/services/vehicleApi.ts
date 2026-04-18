import api from './api'

export const getVehicles = () =>
  api.get('/vehicles').then(res => res.data.vehicles || res.data)

export const getVehicle = (id: string) =>
  api.get(`/vehicles/${id}`).then(res => res.data)

export const getVehicleTrips = (id: string) =>
  api.get(`/vehicles/${id}/trips`).then(res => res.data)