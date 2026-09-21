import { api, toQueryError } from './apiSlice';
import {
  fetchDoctorRecommendations,
  searchLocalDoctors,
  fetchAvailableSlots,
  bookAppointment,
  requestAppointment,
  fetchMyAppointmentRequests,
  fetchMyDoctorProfile,
  updateMyDoctorProfile,
  fetchMySlots,
  createMySlot,
  deleteMySlot,
  type DoctorRecommendation,
  type LocalProvider,
  type AppointmentSlot,
  type AppointmentBooking,
  type AppointmentRequestPayload,
  type AppointmentRequestRecord,
  type DoctorProfileUpdatePayload,
  type SlotCreatePayload,
} from './doctorApi';
import type { DoctorProfile } from '../../types';

export type {
  DoctorRecommendation,
  LocalProvider,
  AppointmentSlot,
  AppointmentBooking,
  AppointmentRequestPayload,
  AppointmentRequestRecord,
  DoctorProfileUpdatePayload,
  SlotCreatePayload,
};

export const doctorApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getDoctorRecommendations: builder.query<DoctorRecommendation[], { insurance: string; specialty?: string }>({
      queryFn: async ({ insurance, specialty }) => {
        try {
          return { data: await fetchDoctorRecommendations(insurance, specialty) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['DoctorRecommendations'],
    }),

    searchLocalDoctors: builder.query<LocalProvider[], { postalCode: string; specialty?: string }>({
      queryFn: async ({ postalCode, specialty }) => {
        try {
          return { data: await searchLocalDoctors(postalCode, specialty) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['LocalDoctors'],
    }),

    getAvailableSlots: builder.query<AppointmentSlot[], string>({
      queryFn: async (doctorId) => {
        try {
          return { data: await fetchAvailableSlots(doctorId) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: (_result, _error, doctorId) => [{ type: 'AvailableSlots', id: doctorId }],
    }),

    bookAppointment: builder.mutation<AppointmentBooking, { doctorId: string; slotId: string; insurance: string }>({
      queryFn: async ({ doctorId, slotId, insurance }) => {
        try {
          return { data: await bookAppointment(doctorId, slotId, insurance) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      invalidatesTags: (_result, _error, { doctorId }) => [{ type: 'AvailableSlots', id: doctorId }],
    }),

    requestAppointment: builder.mutation<AppointmentRequestRecord, AppointmentRequestPayload>({
      queryFn: async (payload) => {
        try {
          return { data: await requestAppointment(payload) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      invalidatesTags: ['AppointmentRequests'],
    }),

    getMyAppointmentRequests: builder.query<AppointmentRequestRecord[], void>({
      queryFn: async () => {
        try {
          return { data: await fetchMyAppointmentRequests() };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['AppointmentRequests'],
    }),

    getMyDoctorProfile: builder.query<DoctorProfile, void>({
      queryFn: async () => {
        try {
          return { data: await fetchMyDoctorProfile() };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['DoctorProfile'],
    }),

    updateMyDoctorProfile: builder.mutation<DoctorProfile, DoctorProfileUpdatePayload>({
      queryFn: async (payload) => {
        try {
          return { data: await updateMyDoctorProfile(payload) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      invalidatesTags: ['DoctorProfile'],
    }),

    getMySlots: builder.query<AppointmentSlot[], void>({
      queryFn: async () => {
        try {
          return { data: await fetchMySlots() };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['MySlots'],
    }),

    createSlot: builder.mutation<AppointmentSlot, SlotCreatePayload>({
      queryFn: async (payload) => {
        try {
          return { data: await createMySlot(payload) };
        } catch (err) {
          return toQueryError(err);
        }
      },
      invalidatesTags: ['MySlots'],
    }),

    deleteSlot: builder.mutation<{ slotId: string }, string>({
      queryFn: async (slotId) => {
        try {
          await deleteMySlot(slotId);
          return { data: { slotId } };
        } catch (err) {
          return toQueryError(err);
        }
      },
      invalidatesTags: ['MySlots'],
    }),
  }),
});

export const {
  useGetDoctorRecommendationsQuery,
  useLazyGetDoctorRecommendationsQuery,
  useSearchLocalDoctorsQuery,
  useLazySearchLocalDoctorsQuery,
  useGetAvailableSlotsQuery,
  useLazyGetAvailableSlotsQuery,
  useBookAppointmentMutation,
  useRequestAppointmentMutation,
  useGetMyAppointmentRequestsQuery,
  useGetMyDoctorProfileQuery,
  useUpdateMyDoctorProfileMutation,
  useGetMySlotsQuery,
  useCreateSlotMutation,
  useDeleteSlotMutation,
} = doctorApiSlice;
