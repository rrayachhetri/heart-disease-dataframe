import { api, toQueryError } from './apiSlice';
import { fetchModelInfo, fetchDatasetComparison, type DatasetComparisonResponse } from './predictApi';
import type { ModelInfo } from '../../types';

export const predictApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getModelInfo: builder.query<ModelInfo, void>({
      queryFn: async () => {
        try {
          return { data: await fetchModelInfo() };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['ModelInfo'],
    }),
    getDatasetComparison: builder.query<DatasetComparisonResponse, void>({
      queryFn: async () => {
        try {
          return { data: await fetchDatasetComparison() };
        } catch (err) {
          return toQueryError(err);
        }
      },
      providesTags: ['DatasetComparison'],
    }),
  }),
});

export const { useGetModelInfoQuery, useGetDatasetComparisonQuery } = predictApiSlice;
