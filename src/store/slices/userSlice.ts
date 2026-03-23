import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "@/lib/http";

export interface UserPlanState {
  plan: string;
  billingInterval: string | null;
  credits: number;
  creditCap: number;
  creditsResetAt: string | null;
  hasStripeAccount: boolean;
  hasSubscription: boolean;
}

export interface CreditLogEntry {
  id: string;
  action: string;
  amount: number;
  balance: number;
  projectId: string | null;
  projectName: string | null;
  meta: string | null;
  createdAt: string;
}

export interface DailyUsage {
  date: string;
  count: number;
}

interface UserState {
  plan: UserPlanState | null;
  planLoading: boolean;
  creditLogs: CreditLogEntry[];
  creditLogsTotal: number;
  creditLogsOffset: number;
  dailyUsage: DailyUsage[];
  syncStatus: "idle" | "syncing" | "done" | "error";
}

const initialState: UserState = {
  plan: null,
  planLoading: true,
  creditLogs: [],
  creditLogsTotal: 0,
  creditLogsOffset: 0,
  dailyUsage: [],
  syncStatus: "idle",
};

// Sync Firebase user to DB
export const syncUser = createAsyncThunk(
  "user/sync",
  async (payload: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    provider: string | null;
  }) => {
    await http.post("/api/auth/sync", payload);
    return true;
  },
);

// Fetch user plan
export const fetchUserPlan = createAsyncThunk(
  "user/fetchPlan",
  async (userId: string) => {
    const { data } = await http.get(
      `/api/user/plan?userId=${encodeURIComponent(userId)}`,
    );
    if (data.error) throw new Error(data.error);
    return data as UserPlanState;
  },
);

// Fetch daily usage
export const fetchDailyUsage = createAsyncThunk(
  "user/fetchDailyUsage",
  async ({ userId, days = 180 }: { userId: string; days?: number }) => {
    const { data } = await http.get(
      `/api/user/credits/daily?userId=${encodeURIComponent(userId)}&days=${days}`,
    );
    return (data.days ?? []) as DailyUsage[];
  },
);

// Fetch credit logs
export const fetchCreditLogs = createAsyncThunk(
  "user/fetchCreditLogs",
  async ({
    userId,
    limit = 15,
    offset = 0,
  }: {
    userId: string;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await http.get(
      `/api/user/credits?userId=${encodeURIComponent(userId)}&limit=${limit}&offset=${offset}`,
    );
    return {
      logs: (data.logs ?? []) as CreditLogEntry[],
      total: (data.total ?? 0) as number,
      offset,
    };
  },
);

// Open Stripe portal
export const openStripePortal = createAsyncThunk(
  "user/openStripePortal",
  async (userId: string) => {
    const { data } = await http.post("/api/stripe/portal", { userId });
    if (data.url) {
      window.location.href = data.url;
    }
    return data;
  },
);

// Create Stripe checkout session
export const createCheckoutSession = createAsyncThunk(
  "user/createCheckout",
  async ({
    userId,
    plan,
    interval,
  }: {
    userId: string;
    plan: string;
    interval: "monthly" | "yearly";
  }) => {
    const { data } = await http.post("/api/stripe/checkout", {
      userId,
      plan,
      interval,
    });
    if (data.url) {
      window.location.href = data.url;
    }
    return data;
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(syncUser.pending, (state) => {
        state.syncStatus = "syncing";
      })
      .addCase(syncUser.fulfilled, (state) => {
        state.syncStatus = "done";
      })
      .addCase(syncUser.rejected, (state) => {
        state.syncStatus = "error";
      })
      .addCase(fetchUserPlan.pending, (state) => {
        state.planLoading = true;
      })
      .addCase(fetchUserPlan.fulfilled, (state, action) => {
        state.plan = action.payload;
        state.planLoading = false;
      })
      .addCase(fetchUserPlan.rejected, (state) => {
        state.planLoading = false;
      })
      .addCase(fetchDailyUsage.fulfilled, (state, action) => {
        state.dailyUsage = action.payload;
      })
      .addCase(fetchCreditLogs.fulfilled, (state, action) => {
        state.creditLogs = action.payload.logs;
        state.creditLogsTotal = action.payload.total;
        state.creditLogsOffset = action.payload.offset;
      });
  },
});

export default userSlice.reducer;
