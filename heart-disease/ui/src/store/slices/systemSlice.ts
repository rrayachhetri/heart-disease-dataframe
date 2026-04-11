/**
 * systemSlice — global availability state.
 *
 * When any API call fails with a network error or 5xx,
 * the error boundary dispatches setUnavailable(reason).
 *
 * The SystemUnavailablePage reads this state and shows the outage screen.
 * Automatic retry: the page polls /api/health every 15 s
 * and dispatches clearUnavailable() once the backend is reachable again.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UnavailableReason = 'api_down' | 'model_not_loaded' | 'network' | null;

interface SystemState {
  unavailable: boolean;
  reason: UnavailableReason;
  /** ISO timestamp of when outage was first detected */
  detectedAt: string | null;
}

const initialState: SystemState = {
  unavailable: false,
  reason: null,
  detectedAt: null,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setUnavailable(state, action: PayloadAction<UnavailableReason>) {
      state.unavailable = true;
      state.reason = action.payload;
      state.detectedAt = new Date().toISOString();
    },
    clearUnavailable(state) {
      state.unavailable = false;
      state.reason = null;
      state.detectedAt = null;
    },
  },
});

export const { setUnavailable, clearUnavailable } = systemSlice.actions;
export default systemSlice.reducer;
