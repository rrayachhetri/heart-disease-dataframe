import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { login as apiLogin, register as apiRegister, getMe } from '../../api/authApi';
import { clearTokens } from '../../api/config';
import type { AuthUser, LoginPayload, RegisterPayload } from '../../types';

interface AuthState {
  user: AuthUser | null;
  avatarUrl: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  avatarUrl: localStorage.getItem('avatarUrl') ?? null,
  loading: false,
  error: null,
  initialized: false,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      await apiLogin(payload);
      return await getMe();
    } catch (e: unknown) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      return await apiRegister(payload);
    } catch (e: unknown) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const loadCurrentUser = createAsyncThunk(
  'auth/loadCurrentUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('access_token');
    if (!token) return rejectWithValue('no token');
    try {
      return await getMe();
    } catch {
      clearTokens();
      return rejectWithValue('session expired');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      clearTokens();
    },
    clearAuthError(state) {
      state.error = null;
    },
    setAvatarUrl(state, action: PayloadAction<string | null>) {
      state.avatarUrl = action.payload;
      if (action.payload) {
        localStorage.setItem('avatarUrl', action.payload);
      } else {
        localStorage.removeItem('avatarUrl');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // load from token
      .addCase(loadCurrentUser.pending, (state) => { state.loading = true; })
      .addCase(loadCurrentUser.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.initialized = true;
      });
  },
});

export const { logout, clearAuthError, setAvatarUrl } = authSlice.actions;
export default authSlice.reducer;
