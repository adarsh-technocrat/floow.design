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
  user: {
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
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
  async () => {
    const { data } = await http.get("/api/teams");
    return (data.teams ?? []) as TeamListItem[];
  },
);

export const createTeam = createAsyncThunk(
  "team/createTeam",
  async ({ name }: { name: string }) => {
    const { data } = await http.post("/api/teams", { name });
    return data as { id: string; name: string };
  },
);

export const fetchTeamDetail = createAsyncThunk(
  "team/fetchTeamDetail",
  async ({ teamId }: { teamId: string }) => {
    const { data } = await http.get(`/api/teams/${teamId}`);
    return data.team as TeamDetail;
  },
);

export const fetchTeamInvites = createAsyncThunk(
  "team/fetchTeamInvites",
  async ({ teamId }: { teamId: string }) => {
    const { data } = await http.get(`/api/teams/${teamId}/invites`);
    return (data.invites ?? []) as TeamInviteItem[];
  },
);

export const sendTeamInvite = createAsyncThunk(
  "team/sendTeamInvite",
  async ({
    teamId,
    email,
    role,
  }: {
    teamId: string;
    email: string;
    role?: string;
  }) => {
    const { data } = await http.post(`/api/teams/${teamId}/invites`, {
      email,
      role,
    });
    return data;
  },
);

export const removeTeamMember = createAsyncThunk(
  "team/removeTeamMember",
  async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
    await http.delete(`/api/teams/${teamId}/members`, {
      data: { memberId },
    });
    return memberId;
  },
);

export const updateTeamMemberRole = createAsyncThunk(
  "team/updateMemberRole",
  async ({
    teamId,
    memberId,
    role,
  }: {
    teamId: string;
    memberId: string;
    role: string;
  }) => {
    await http.patch(`/api/teams/${teamId}/members`, {
      memberId,
      role,
    });
    return { memberId, role };
  },
);

export const fetchPendingInvitesForUser = createAsyncThunk(
  "team/fetchPendingInvites",
  async () => {
    const { data } = await http.get("/api/teams/invites");
    return (data.invites ?? []) as PendingInviteItem[];
  },
);

export const respondToTeamInvite = createAsyncThunk(
  "team/respondToInvite",
  async ({
    token,
    action,
  }: {
    token: string;
    action: "accept" | "decline";
  }) => {
    const { data } = await http.post("/api/teams/invites", {
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
