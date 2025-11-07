import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthSession } from "@/lib/common.types";

type AuthState = {
  session: AuthSession | null;
  error: string | null;
};

const initialState: AuthState = {
  session: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthSession>) {
      state.session = action.payload;
      state.error = null;
    },
    signOut(state) {
      state.session = null;
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload ?? null;
    }
  }
});

export const { setCredentials, signOut, setAuthError } = authSlice.actions;
export default authSlice.reducer;
