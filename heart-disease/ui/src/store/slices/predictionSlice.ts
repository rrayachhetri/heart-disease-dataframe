import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { predictHeartDisease } from '../../api/predictApi';
import type { PatientData, PredictionResult, PredictionRecord } from '../../types';

interface PredictionState {
  currentResult: PredictionResult | null;
  currentPatientData: PatientData | null;
  history: PredictionRecord[];
  loading: boolean;
  error: string | null;
}

const savedHistory = localStorage.getItem('predictionHistory');
const initialHistory: PredictionRecord[] = savedHistory ? JSON.parse(savedHistory) : [];

const initialState: PredictionState = {
  currentResult: null,
  currentPatientData: null,
  history: initialHistory,
  loading: false,
  error: null,
};

export const submitPrediction = createAsyncThunk(
  'prediction/submit',
  async (data: PatientData) => {
    const result = await predictHeartDisease(data);
    return { data, result };
  }
);

const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    clearCurrentResult(state) {
      state.currentResult = null;
      state.currentPatientData = null;
    },
    clearHistory(state) {
      state.history = [];
      localStorage.removeItem('predictionHistory');
    },
    removeFromHistory(state, action: PayloadAction<string>) {
      state.history = state.history.filter((r) => r.id !== action.payload);
      localStorage.setItem('predictionHistory', JSON.stringify(state.history));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPrediction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResult = action.payload.result;
        state.currentPatientData = action.payload.data;

        const record: PredictionRecord = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          patientData: action.payload.data,
          result: action.payload.result,
        };
        state.history.unshift(record);
        if (state.history.length > 50) state.history = state.history.slice(0, 50);
        localStorage.setItem('predictionHistory', JSON.stringify(state.history));
      })
      .addCase(submitPrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Prediction failed';
      });
  },
});

export const { clearCurrentResult, clearHistory, removeFromHistory } =
  predictionSlice.actions;
export default predictionSlice.reducer;
