/**
 * sessionSlice — tracks activity-based session lifecycle.
 *
 * Rules:
 *  - Session max lifetime:  10 minutes (SESSION_MAX_MS)
 *  - Warning fires at:       8 minutes of inactivity (SESSION_WARN_MS)
 *  - Extend resets the clock from NOW
 *  - expire() clears tokens and marks session as expired
 *
 * The actual browser timers live in SessionManager (a component),
 * keeping the slice pure / serialisable.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearTokens } from '../../sideeffects/api/config';

export const SESSION_MAX_MS  = 2 * 60 * 1000;
export const SESSION_WARN_MS = 1 * 60  * 1000;

type SessionStatus = 'active' | 'warning' | 'expired';

interface SessionState {
  status: SessionStatus;
  /** Unix timestamp (ms) of last recorded user activity */
  lastActivityAt: number;
  /** Seconds remaining shown in the warning banner (counts down 120→0) */
  secondsLeft: number;
}

const now = () => Date.now();

const initialState: SessionState = {
  status: 'active',
  lastActivityAt: now(),
  secondsLeft: SESSION_MAX_MS / 1000,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    /** Called on any user interaction (mouse / key / scroll / touch) */
    recordActivity(state) {
      if (state.status === 'expired') return;
      state.status = 'active';
      state.lastActivityAt = now();
      state.secondsLeft = SESSION_MAX_MS / 1000;
    },

    /** Timer tick: fires every second from SessionManager */
    tick(state) {
      if (state.status === 'expired') return;

      const elapsed = now() - state.lastActivityAt;

      if (elapsed >= SESSION_MAX_MS) {
        state.status = 'expired';
        state.secondsLeft = 0;
        clearTokens();
        return;
      }

      if (elapsed >= SESSION_WARN_MS) {
        state.status = 'warning';
        state.secondsLeft = Math.max(
          0,
          Math.ceil((SESSION_MAX_MS - elapsed) / 1000)
        );
        return;
      }

      state.status = 'active';
      state.secondsLeft = Math.ceil((SESSION_MAX_MS - elapsed) / 1000);
    },

    /** User pressed "Stay logged in" in the warning banner */
    extend(state) {
      if (state.status === 'expired') return;
      state.status = 'active';
      state.lastActivityAt = now();
      state.secondsLeft = SESSION_MAX_MS / 1000;
    },

    /** Explicit logout / token invalidity — immediately expire */
    expire(state) {
      state.status = 'expired';
      state.secondsLeft = 0;
      clearTokens();
    },

    /** Called on fresh login to reset everything */
    reset(state) {
      state.status = 'active';
      state.lastActivityAt = now();
      state.secondsLeft = SESSION_MAX_MS / 1000;
    },

    /** Internal: update secondsLeft from the warning countdown */
    setSecondsLeft(state, action: PayloadAction<number>) {
      state.secondsLeft = action.payload;
    },
  },
});

export const {
  recordActivity,
  tick,
  extend,
  expire,
  setSecondsLeft,
} = sessionSlice.actions;

export const resetSession = sessionSlice.actions.reset;

export default sessionSlice.reducer;
