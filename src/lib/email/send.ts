import { resend, EMAIL_FROM } from "./client";
import {
  welcomeEmail,
  teamInviteEmail,
  planUpgradeEmail,
  creditsExhaustedEmail,
  teamMemberJoinedEmail,
  magicLinkEmail,
} from "./template";

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch {
    // Silent fail — email is non-critical
  }
}

export async function sendWelcomeEmail(email: string, userName: string) {
  const { subject, html } = welcomeEmail(userName);
  await sendEmail(email, subject, html);
}

export async function sendTeamInviteEmail(
  recipientEmail: string,
  inviterName: string,
  teamName: string,
  inviteToken: string,
) {
  const { subject, html } = teamInviteEmail(inviterName, teamName, inviteToken);
  await sendEmail(recipientEmail, subject, html);
}

export async function sendPlanUpgradeEmail(
  email: string,
  userName: string,
  planName: string,
  credits: number,
) {
  const { subject, html } = planUpgradeEmail(userName, planName, credits);
  await sendEmail(email, subject, html);
}

export async function sendCreditsExhaustedEmail(
  email: string,
  userName: string,
  planName: string,
  resetDate: string | null,
) {
  const { subject, html } = creditsExhaustedEmail(
    userName,
    planName,
    resetDate,
  );
  await sendEmail(email, subject, html);
}

export async function sendTeamMemberJoinedEmail(
  ownerEmail: string,
  ownerName: string,
  memberName: string,
  teamName: string,
) {
  const { subject, html } = teamMemberJoinedEmail(
    ownerName,
    memberName,
    teamName,
  );
  await sendEmail(ownerEmail, subject, html);
}

export async function sendMagicLinkEmail(email: string, signInUrl: string) {
  const { subject, html } = magicLinkEmail(signInUrl);
  await sendEmail(email, subject, html);
}
