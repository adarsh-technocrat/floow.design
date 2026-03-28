function baseLayout(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>floow.design</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .preheader { display: none !important; max-height: 0; overflow: hidden; mso-hide: all; }
    .container { max-width: 520px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e8e8ed; overflow: hidden; }
    .header { padding: 32px 32px 24px; }
    .logo { font-size: 15px; font-weight: 700; color: #09090b; letter-spacing: -0.3px; }
    .logo span { color: #a1a1aa; }
    .body { padding: 0 32px 32px; }
    .body h1 { font-size: 20px; font-weight: 600; color: #09090b; margin: 0 0 12px; line-height: 1.3; }
    .body p { font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #18181b; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
    .divider { height: 1px; background: #ededf0; margin: 24px 0; }
    .footer { padding: 24px 32px; background: #fafafa; border-top: 1px solid #ededf0; }
    .footer p { font-size: 11px; color: #a1a1aa; line-height: 1.5; margin: 0; }
    .footer a { color: #a1a1aa; text-decoration: underline; }
    .quiet { font-size: 12px; color: #a1a1aa; font-style: italic; line-height: 1.5; margin: 20px 0 0; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">floow<span>.design</span></div>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>We only email when it matters. No spam, no newsletters, no noise.</p>
        <p style="margin-top: 8px;">
          <a href="https://floow.design">floow.design</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmail(userName: string): {
  subject: string;
  html: string;
} {
  const firstName = userName?.split(" ")[0] || "there";
  return {
    subject: "Welcome to floow.design",
    html: baseLayout(
      `<h1>Hey ${firstName}, welcome aboard.</h1>
      <p>You just joined floow.design — an AI-powered tool that turns your ideas into polished mobile app designs in seconds.</p>
      <p>No tutorials needed. Just describe what you want and watch it come to life.</p>
      <a href="https://floow.design/dashboard" class="btn">Open your dashboard</a>
      <p class="quiet">This is the only welcome email you'll get from us. We respect your inbox.</p>`,
      `Welcome to floow.design — start designing`,
    ),
  };
}

export function teamInviteEmail(
  inviterName: string,
  teamName: string,
  inviteToken: string,
): { subject: string; html: string } {
  return {
    subject: `${inviterName} invited you to ${teamName} on floow.design`,
    html: baseLayout(
      `<h1>You've been invited to a team.</h1>
      <p><strong>${inviterName}</strong> wants you to join <strong>${teamName}</strong> on floow.design.</p>
      <p>As a team member, you'll share projects and AI credits — design together, ship faster.</p>
      <a href="https://floow.design/team?invite=${inviteToken}" class="btn">Accept invite</a>
      <p class="quiet">Not expecting this? Just ignore it. The invite expires in 7 days.</p>`,
      `${inviterName} invited you to ${teamName}`,
    ),
  };
}

export function planUpgradeEmail(
  userName: string,
  planName: string,
  credits: number,
): { subject: string; html: string } {
  const firstName = userName?.split(" ")[0] || "there";
  return {
    subject: `You're now on ${planName} — ${credits.toLocaleString()} credits loaded`,
    html: baseLayout(
      `<h1>Plan upgraded. You're all set, ${firstName}.</h1>
      <p>Your account has been upgraded to <strong>${planName}</strong> with <strong>${credits.toLocaleString()}</strong> AI credits ready to use.</p>
      <p>No action needed — just keep designing. Your credits refresh automatically each billing cycle.</p>
      <a href="https://floow.design/billing" class="btn">View your plan</a>
      <p class="quiet">This is a one-time confirmation. We won't email about billing again unless something needs your attention.</p>`,
      `Upgraded to ${planName} — ${credits.toLocaleString()} credits`,
    ),
  };
}

export function creditsExhaustedEmail(
  userName: string,
  planName: string,
  resetDate: string | null,
): { subject: string; html: string } {
  const firstName = userName?.split(" ")[0] || "there";
  const resetLine = resetDate
    ? `Your credits refresh on <strong>${resetDate}</strong>. If you can't wait, upgrading gives you more credits instantly.`
    : `You can upgrade your plan anytime for more credits.`;
  return {
    subject: "Your AI credits have run out",
    html: baseLayout(
      `<h1>Heads up, ${firstName} — you're out of credits.</h1>
      <p>You've used all your AI credits on the <strong>${planName}</strong> plan. Your existing designs are safe — you just can't generate new ones until credits refresh.</p>
      <p>${resetLine}</p>
      <a href="https://floow.design/pricing" class="btn">See upgrade options</a>
      <p class="quiet">We only send this once per cycle. We hate inbox clutter as much as you do.</p>`,
      `Your ${planName} credits have run out`,
    ),
  };
}

export function teamMemberJoinedEmail(
  ownerName: string,
  memberName: string,
  teamName: string,
): { subject: string; html: string } {
  const firstName = ownerName?.split(" ")[0] || "there";
  return {
    subject: `${memberName} joined ${teamName}`,
    html: baseLayout(
      `<h1>${memberName} is now on your team.</h1>
      <p>Hey ${firstName}, just letting you know that <strong>${memberName}</strong> accepted the invite and joined <strong>${teamName}</strong>.</p>
      <p>They now have access to shared projects and your team's credit pool.</p>
      <a href="https://floow.design/team" class="btn">Manage team</a>
      <p class="quiet">Short and sweet — that's the last you'll hear about this.</p>`,
      `${memberName} joined ${teamName}`,
    ),
  };
}

export function magicLinkEmail(signInUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Sign in to floow.design",
    html: baseLayout(
      `<h1>Your sign-in link</h1>
      <p>Click the button below to sign in to floow.design. This link expires in 10 minutes.</p>
      <a href="${signInUrl}" class="btn">Sign in to floow.design</a>
      <p class="quiet">If you didn't request this, you can safely ignore this email.</p>`,
      "Your floow.design sign-in link",
    ),
  };
}
