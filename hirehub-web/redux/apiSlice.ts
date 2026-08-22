// redux/apiSlice.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // x-no-auth flag থাকলে Redux token inject করা হবে না
    if (headers.get('x-no-auth')) {
      headers.delete('x-no-auth');
      return headers;
    }

    const state = getState() as RootState;
    const token = state.auth.token || state.auth.tempToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithTransform: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.data) {
    const res = result.data as any;

    if (res && typeof res === 'object') {
      const inner = res.data;

      // Jobs endpoint: data.recommended  data.other
      if (inner && (inner.recommended !== undefined || inner.other !== undefined)) {
        return { data: inner };
      }

      // Standard paginated: { data: [...], meta: {...} }
      if (inner !== undefined && res.meta !== undefined) {
        return { data: { data: inner, meta: res.meta } };
      }

      if (inner !== undefined) {
        return { data: inner };
      }
    }

    return { data: res };
  }

  if (result.error) {
    const err = result.error as any;

    if (err.status === 401) {
      // ✅ 401 Unauthorized handle (Token expire / invalid hole logout korbe)
      api.dispatch({ type: 'auth/logout' });
      
      if (typeof document !== 'undefined') {
        document.cookie = "auth-token=; path=/; max-age=0";
        document.cookie = "user-role=; path=/; max-age=0";
      }
      
      if (typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/auth/signin')) {
            window.location.href = `/auth/signin?from=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    const errorData = err.data as any;
    return {
      error: {
        status: err.status,
        data: {
          message: errorData?.message ?? 'Something went wrong',
          errors: errorData?.errors ?? null,
        },
      },
    };
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithTransform,
  tagTypes: [
    'Job', 'Profile', 'Notification', 'Application', 'Interview',
    'Payment', 'JobSeeker', 'Conversation', 'Message', 'Subscription',
    'support', 'publicJob',
  ],
  endpoints: () => ({}),
});