import { configureStore } from '@reduxjs/toolkit'
import documentReducer from '../slices/documents';

export const makeStore = () => {
  return configureStore({
    reducer: {
      document: documentReducer
    }
  })
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];