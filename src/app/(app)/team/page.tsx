"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUserTeams,
  createTeam,
  fetchTeamDetail,
  fetchTeamInvites,
  sendTeamInvite,
  removeTeamMember,
  updateTeamMemberRole,
  fetchPendingInvitesForUser,
  respondToTeamInvite,
} from "@/store/slices/teamSlice";
import { Avatar } from "@/components/ui/Avatar";
import { Users, Plus, Mail, Shield, Crown, Trash2, Check, X } from "lucide-react";

export default function TeamPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const teams = useAppSelector((s) => s.team.teams);
  const teamsLoading = useAppSelector((s) => s.team.teamsLoading);
  const activeTeam = useAppSelector((s) => s.team.activeTeam);
  const activeTeamLoading = useAppSelector((s) => s.team.activeTeamLoading);
  const invites = useAppSelector((s) => s.team.invites);
  const pendingInvites = useAppSelector((s) => s.team.pendingInvites);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    dispatch(fetchUserTeams(user.uid));
    dispatch(fetchPendingInvitesForUser(user.uid));
  }, [user?.uid, dispatch]);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId || !user?.uid) return;
    dispatch(fetchTeamDetail({ teamId: selectedTeamId, userId: user.uid }));
    dispatch(fetchTeamInvites({ teamId: selectedTeamId, userId: user.uid }));
  }, [selectedTeamId, user?.uid, dispatch]);

  const handleCreateTeam = useCallback(async () => {
    if (!user?.uid || !newTeamName.trim()) return;
    setCreating(true);
    const result = await dispatch(createTeam({ userId: user.uid, name: newTeamName.trim() })).unwrap();
    setNewTeamName("");
    setShowCreateForm(false);
    setCreating(false);
    dispatch(fetchUserTeams(user.uid));
    setSelectedTeamId(result.id);
  }, [user?.uid, newTeamName, dispatch]);

  const handleSendInvite = useCallback(async () => {
    if (!user?.uid || !selectedTeamId || !inviteEmail.trim()) return;
    setInviting(true);
    await dispatch(sendTeamInvite({ teamId: selectedTeamId, userId: user.uid, email: inviteEmail.trim(), role: inviteRole })).unwrap();
    setInviteEmail("");
    setInviting(false);
    dispatch(fetchTeamInvites({ teamId: selectedTeamId, userId: user.uid }));
  }, [user?.uid, selectedTeamId, inviteEmail, inviteRole, dispatch]);

  const handleRespondToInvite = useCallback(async (token: string, action: "accept" | "decline") => {
    if (!user?.uid) return;
    await dispatch(respondToTeamInvite({ userId: user.uid, token, action })).unwrap();
    dispatch(fetchUserTeams(user.uid));
  }, [user?.uid, dispatch]);

  const currentUserRole = activeTeam?.members.find((m) => m.userId === user?.uid)?.role;
  const isOwnerOrAdmin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <div className="h-screen w-full bg-surface text-t-primary p-3">
      <div className="h-full w-full rounded-2xl border border-b-secondary bg-surface overflow-hidden flex flex-col">
        <header className="flex h-12 items-center justify-between px-5 border-b border-b-secondary">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-t-tertiary hover:text-t-secondary transition-colors no-underline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>
          <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider">Team</span>
        </header>

        <div className="flex-1 flex items-start justify-center overflow-y-auto px-6 py-12">
          <div className="w-full max-w-3xl">
            <h1 className="text-2xl font-semibold tracking-tight text-t-primary mb-8" style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}>
              Team Management
            </h1>

            {pendingInvites.length > 0 && (
              <div className="mb-6 space-y-2">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div>
                      <p className="text-sm font-medium text-t-primary">
                        You&apos;re invited to join <span className="font-semibold">{invite.team.name}</span>
                      </p>
                      <p className="text-xs text-t-tertiary mt-0.5">
                        Invited by {invite.inviter.displayName || invite.inviter.email} as {invite.role.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRespondToInvite(invite.token, "accept")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-medium text-white hover:bg-emerald-600">
                        <Check className="size-3.5" /> Accept
                      </button>
                      <button onClick={() => handleRespondToInvite(invite.token, "decline")} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-b-secondary px-3 text-xs font-medium text-t-secondary hover:bg-input-bg">
                        <X className="size-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {teamsLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex items-center gap-2 text-sm text-t-tertiary">
                  <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
                  Loading...
                </div>
              </div>
            ) : teams.length === 0 && !showCreateForm ? (
              <div className="rounded-xl border border-b-secondary bg-surface-elevated p-8 text-center">
                <Users className="mx-auto mb-3 size-10 text-t-tertiary opacity-40" />
                <p className="text-sm font-medium text-t-secondary">No teams yet</p>
                <p className="mt-1 text-xs text-t-tertiary">Create a team to collaborate with others.</p>
                <button onClick={() => setShowCreateForm(true)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-btn-primary-bg px-4 text-xs font-semibold text-btn-primary-text hover:opacity-90">
                  <Plus className="size-3.5" /> Create Team
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  {teams.length > 1 ? (
                    <select value={selectedTeamId || ""} onChange={(e) => setSelectedTeamId(e.target.value)} className="rounded-lg border border-b-secondary bg-input-bg px-3 py-2 text-sm text-t-primary outline-none">
                      {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  ) : (
                    <h2 className="text-lg font-semibold text-t-primary">{activeTeam?.name ?? teams[0]?.name}</h2>
                  )}
                  <button onClick={() => setShowCreateForm(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-b-secondary px-3 text-xs font-medium text-t-secondary hover:bg-input-bg">
                    <Plus className="size-3.5" /> New Team
                  </button>
                </div>

                {showCreateForm && (
                  <div className="rounded-xl border border-b-secondary bg-surface-elevated p-4">
                    <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wider text-t-tertiary">Team name</label>
                    <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="My Team" className="w-full rounded-lg border border-b-secondary bg-input-bg px-3 py-2 text-sm text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCreateTeam(); if (e.key === "Escape") setShowCreateForm(false); }} />
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => { setShowCreateForm(false); setNewTeamName(""); }} className="rounded-lg px-3 py-1.5 text-xs text-t-secondary hover:bg-input-bg">Cancel</button>
                      <button onClick={handleCreateTeam} disabled={creating || !newTeamName.trim()} className="rounded-lg bg-btn-primary-bg px-3 py-1.5 text-xs font-medium text-btn-primary-text disabled:opacity-50">{creating ? "Creating..." : "Create"}</button>
                    </div>
                  </div>
                )}

                {activeTeam && !activeTeamLoading && (
                  <>
                    <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary mb-1">Shared Credits</p>
                          <p className="text-xl font-semibold text-t-primary font-mono">{activeTeam.credits.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary mb-1">Seats</p>
                          <p className="text-lg font-semibold text-t-primary">{activeTeam.members.length} / {activeTeam.seats}</p>
                        </div>
                      </div>
                      {activeTeam.creditsResetAt && (
                        <p className="text-xs text-t-tertiary">Resets {new Date(activeTeam.creditsResetAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-t-primary">Members ({activeTeam.members.length})</h3>
                      </div>
                      <div className="space-y-1">
                        {activeTeam.members.map((member) => (
                          <div key={member.id} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-input-bg/50">
                            <Avatar src={member.user.photoURL} email={member.user.email} name={member.user.displayName} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-t-primary truncate">{member.user.displayName || member.user.email || "User"}</p>
                              <p className="text-[11px] text-t-tertiary truncate">{member.user.email}</p>
                            </div>
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${member.role === "OWNER" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : member.role === "ADMIN" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-surface-sunken text-t-tertiary"}`}>
                              {member.role === "OWNER" && <Crown className="size-3" />}
                              {member.role === "ADMIN" && <Shield className="size-3" />}
                              {member.role}
                            </span>
                            {isOwnerOrAdmin && member.role !== "OWNER" && member.userId !== user?.uid && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {currentUserRole === "OWNER" && (
                                  <button onClick={() => dispatch(updateTeamMemberRole({ teamId: activeTeam.id, userId: user!.uid, memberId: member.id, role: member.role === "ADMIN" ? "MEMBER" : "ADMIN" }))} className="rounded p-1 text-t-tertiary hover:bg-input-bg hover:text-t-primary" title={member.role === "ADMIN" ? "Demote to member" : "Promote to admin"}>
                                    <Shield className="size-3.5" />
                                  </button>
                                )}
                                <button onClick={() => dispatch(removeTeamMember({ teamId: activeTeam.id, userId: user!.uid, memberId: member.id }))} className="rounded p-1 text-t-tertiary hover:bg-red-500/10 hover:text-red-500" title="Remove member">
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {isOwnerOrAdmin && (
                      <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                        <h3 className="text-sm font-semibold text-t-primary mb-4">Invite Members</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-t-tertiary" />
                            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="w-full rounded-lg border border-b-secondary bg-input-bg pl-9 pr-3 py-2 text-sm text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary" onKeyDown={(e) => { if (e.key === "Enter") handleSendInvite(); }} />
                          </div>
                          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")} className="rounded-lg border border-b-secondary bg-input-bg px-3 py-2 text-xs font-mono text-t-secondary outline-none">
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button onClick={handleSendInvite} disabled={inviting || !inviteEmail.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-btn-primary-bg px-4 text-xs font-semibold text-btn-primary-text hover:opacity-90 disabled:opacity-50">
                            {inviting ? "Sending..." : "Send Invite"}
                          </button>
                        </div>

                        {invites.length > 0 && (
                          <div className="mt-4 space-y-1">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary mb-2">Pending Invites</p>
                            {invites.map((inv) => (
                              <div key={inv.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-input-bg/50">
                                <div>
                                  <p className="text-[13px] text-t-primary">{inv.email}</p>
                                  <p className="text-[10px] text-t-tertiary">as {inv.role.toLowerCase()} · expires {new Date(inv.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                                </div>
                                <button onClick={() => dispatch({ type: "team/revokeInvite", payload: inv.id })} className="text-xs text-t-tertiary hover:text-red-500">Revoke</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
