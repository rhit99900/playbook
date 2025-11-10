import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthSession } from "@/lib/common.types";

export type UserAuthState = "checking" | "authorized" | "unauthorized";

type AuthState = {
  session: AuthSession | null;
  error: string | null;
  authState: UserAuthState;
};


const initialState: AuthState = {
  session: null,
  error: null,
  authState: 'checking'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthSession>) => {
      state.session = action.payload;
      state.error = null;
    },
    signOut:  (state) => {
      state.session = null;
      state.error = null;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload ?? null;
    },
    setUserAuthState : (state, action: PayloadAction<UserAuthState>) => {
      state.authState = action.payload
    }
  }
});

export const { 
  setCredentials,
  signOut,
  setAuthError,
  setUserAuthState
} = authSlice.actions;
export default authSlice.reducer;
