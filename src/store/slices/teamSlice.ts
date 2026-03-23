import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "@/lib/http";

export interface TeamListItem {
  id: string;
  name: string;
  ownerId: string;
  role: string;
  credits: number;
  seats: number;
  creditsResetAt: string | null;
  memberCount: number;
  projectCount: number;
}

export interface TeamMemberItem {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { email: string | null; displayName: string | null; photoURL: string | null };
}

export interface TeamDetail {
  id: string;
  name: string;
  ownerId: string;
  credits: number;
  seats: number;
  creditsResetAt: string | null;
  billingInterval: string | null;
  createdAt: string;
  members: TeamMemberItem[];
  _count: { projects: number };
}

export interface TeamInviteItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter: { displayName: string | null; email: string | null };
}

export interface PendingInviteItem {
  id: string;
  token: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  team: { id: string; name: string };
  inviter: { displayName: string | null; email: string | null };
}

interface TeamState {
  teams: TeamListItem[];
  teamsLoading: boolean;
  activeTeam: TeamDetail | null;
  activeTeamLoading: boolean;
  invites: TeamInviteItem[];
  pendingInvites: PendingInviteItem[];
}

const initialState: TeamState = {
  teams: [],
  teamsLoading: false,
  activeTeam: null,
  activeTeamLoading: false,
  invites: [],
  pendingInvites: [],
};

export const fetchUserTeams = createAsyncThunk(
  "team/fetchUserTeams",
  async (userId: string) => {
    const { data } = await http.get(`/api/teams?userId=${encodeURIComponent(userId)}`);
    return (data.teams ?? []) as TeamListItem[];
  },
);

export const createTeam = createAsyncThunk(
  "team/createTeam",
  async ({ userId, name }: { userId: string; name: string }) => {
    const { data } = await http.post("/api/teams", { userId, name });
    return data as { id: string; name: string };
  },
);

export const fetchTeamDetail = createAsyncThunk(
  "team/fetchTeamDetail",
  async ({ teamId, userId }: { teamId: string; userId: string }) => {
    const { data } = await http.get(
      `/api/teams/${teamId}?userId=${encodeURIComponent(userId)}`,
    );
    return data.team as TeamDetail;
  },
);

export const fetchTeamInvites = createAsyncThunk(
  "team/fetchTeamInvites",
  async ({ teamId, userId }: { teamId: string; userId: string }) => {
    const { data } = await http.get(
      `/api/teams/${teamId}/invites?userId=${encodeURIComponent(userId)}`,
    );
    return (data.invites ?? []) as TeamInviteItem[];
  },
);

export const sendTeamInvite = createAsyncThunk(
  "team/sendTeamInvite",
  async ({
    teamId,
    userId,
    email,
    role,
  }: {
    teamId: string;
    userId: string;
    email: string;
    role?: string;
  }) => {
    const { data } = await http.post(`/api/teams/${teamId}/invites`, {
      userId,
      email,
      role,
    });
    return data;
  },
);

export const removeTeamMember = createAsyncThunk(
  "team/removeTeamMember",
  async ({
    teamId,
    userId,
    memberId,
  }: {
    teamId: string;
    userId: string;
    memberId: string;
  }) => {
    await http.delete(`/api/teams/${teamId}/members`, {
      data: { userId, memberId },
    });
    return memberId;
  },
);

export const updateTeamMemberRole = createAsyncThunk(
  "team/updateMemberRole",
  async ({
    teamId,
    userId,
    memberId,
    role,
  }: {
    teamId: string;
    userId: string;
    memberId: string;
    role: string;
  }) => {
    await http.patch(`/api/teams/${teamId}/members`, {
      userId,
      memberId,
      role,
    });
    return { memberId, role };
  },
);

export const fetchPendingInvitesForUser = createAsyncThunk(
  "team/fetchPendingInvites",
  async (userId: string) => {
    const { data } = await http.get(
      `/api/teams/invites?userId=${encodeURIComponent(userId)}`,
    );
    return (data.invites ?? []) as PendingInviteItem[];
  },
);

export const respondToTeamInvite = createAsyncThunk(
  "team/respondToInvite",
  async ({
    userId,
    token,
    action,
  }: {
    userId: string;
    token: string;
    action: "accept" | "decline";
  }) => {
    const { data } = await http.post("/api/teams/invites", {
      userId,
      token,
      action,
    });
    return { token, action, teamId: data.teamId, teamName: data.teamName };
  },
);

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserTeams.pending, (state) => {
        state.teamsLoading = true;
      })
      .addCase(fetchUserTeams.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.teamsLoading = false;
      })
      .addCase(fetchUserTeams.rejected, (state) => {
        state.teamsLoading = false;
      })
      .addCase(fetchTeamDetail.pending, (state) => {
        state.activeTeamLoading = true;
      })
      .addCase(fetchTeamDetail.fulfilled, (state, action) => {
        state.activeTeam = action.payload;
        state.activeTeamLoading = false;
      })
      .addCase(fetchTeamDetail.rejected, (state) => {
        state.activeTeamLoading = false;
      })
      .addCase(fetchTeamInvites.fulfilled, (state, action) => {
        state.invites = action.payload;
      })
      .addCase(fetchPendingInvitesForUser.fulfilled, (state, action) => {
        state.pendingInvites = action.payload;
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        if (state.activeTeam) {
          state.activeTeam.members = state.activeTeam.members.filter(
            (m) => m.id !== action.payload,
          );
        }
      })
      .addCase(updateTeamMemberRole.fulfilled, (state, action) => {
        if (state.activeTeam) {
          const member = state.activeTeam.members.find(
            (m) => m.id === action.payload.memberId,
          );
          if (member) member.role = action.payload.role;
        }
      })
      .addCase(respondToTeamInvite.fulfilled, (state, action) => {
        state.pendingInvites = state.pendingInvites.filter(
          (i) => i.token !== action.payload.token,
        );
      });
  },
});

export default teamSlice.reducer;
