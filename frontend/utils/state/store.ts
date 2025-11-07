import { configureStore } from '@reduxjs/toolkit'
import documentReducer from '../slices/documents';
import authReducer from '../slices/auth';

export const makeStore = () => {
  return configureStore({
    reducer: {
      document: documentReducer,
      auth: authReducer
    }
  })
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
