// redux/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { removeFirebaseTokenAndClearSession } from "@/lib/notification";

interface User {
  id: string;
  email: string;
  role: string;
  status?: string;
  fullName?: string;
  profilePic?: string;
  name?: string;
  avatar?: string;
  companyName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tempToken: string | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
}


const initialState: AuthState = {
  user: null,
  token: null,
  tempToken: null,
  isAuthenticated: false,
  isLoggingOut: false,
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Helper: local data clear ───
function clearLocalData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("persist:hirehubja-auth");
    localStorage.removeItem("foregroundNotifications");
  }
  if (typeof document !== "undefined") {
    document.cookie = "auth-token=; path=/; max-age=0";
    document.cookie = "user-role=; path=/; max-age=0";
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("signup_email");
  }
}

// ─── Async Thunk: API call + local clear ───
export const logoutAsync = createAsyncThunk(
  "auth/logoutAsync",
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;

    // API call
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      console.warn("Logout API call failed, proceeding with local logout.");
    }

    // Firebase token clear
    try {
      await removeFirebaseTokenAndClearSession(token);
    } catch {
      console.warn("Firebase token clear failed.");
    }

    // local data clear
    clearLocalData();

    return true;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.tempToken = null;
      state.isAuthenticated = true;
      state.isLoggingOut = false;

      if (typeof document !== "undefined") {
        document.cookie = `auth-token=${action.payload.token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `user-role=${action.payload.user.role}; path=/; max-age=2592000; SameSite=Lax`;
      }
    },
    setTempToken: (state, action: PayloadAction<string | null>) => {
      state.tempToken = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.tempToken = null;
      state.isAuthenticated = false;
      state.isLoggingOut = false;
      clearLocalData();
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.isLoggingOut = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoggingOut = false;
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoggingOut = false;
      });
  },
});

export const { login, logout, updateUser, setTempToken } = authSlice.actions;
export default authSlice.reducer;