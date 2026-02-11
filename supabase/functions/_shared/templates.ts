// SMS message templates — kept short to minimize Twilio segment count.
// Each SMS segment is 160 chars (GSM-7) or 70 chars (Unicode).

export function inviteMessage(params: {
  taskDoerName: string;
  taskName: string;
  inviteToken: string;
  appUrl: string;
}): string {
  return (
    `${params.taskDoerName} chose you to help them stay on track with "${params.taskName}". ` +
    `Accept: ${params.appUrl}/witness/invite/${params.inviteToken} ` +
    `Reply STOP to opt out — Showd`
  );
}

export function followUpMessage(params: {
  taskDoerName: string;
  inviteToken: string;
  appUrl: string;
}): string {
  return (
    `Reminder: ${params.taskDoerName} is still waiting for your support on Showd. ` +
    `Accept: ${params.appUrl}/witness/invite/${params.inviteToken} ` +
    `or ignore to decline — Showd`
  );
}

export function missedTaskMessage(params: {
  taskDoerName: string;
  taskName: string;
}): string {
  return (
    `${params.taskDoerName} missed "${params.taskName}" today. ` +
    `A quick check-in from you could help. — Showd`
  );
}

export function struggledTaskMessage(params: {
  taskDoerName: string;
  taskName: string;
}): string {
  return (
    `${params.taskDoerName} is having a tough day with "${params.taskName}". ` +
    `A kind word might help. — Showd`
  );
}

export function dailySummaryMessage(params: {
  taskDoerName: string;
  completed: number;
  total: number;
  streakInfo?: string;
}): string {
  const rate = params.total > 0 ? Math.round((params.completed / params.total) * 100) : 0;
  let msg = `${params.taskDoerName}'s daily update: ${params.completed}/${params.total} tasks done (${rate}%).`;
  if (params.streakInfo) msg += ` ${params.streakInfo}`;
  msg += ' — Showd';
  return msg;
}

export function weeklySummaryMessage(params: {
  taskDoerName: string;
  completionRate: number;
  longestStreak: number;
}): string {
  return (
    `Weekly update for ${params.taskDoerName}: ${params.completionRate}% completion rate, ` +
    `longest streak: ${params.longestStreak} days. — Showd`
  );
}

export function streakMilestoneMessage(params: {
  taskDoerName: string;
  taskName: string;
  streak: number;
}): string {
  return (
    `${params.taskDoerName} hit a ${params.streak}-day streak on "${params.taskName}"! ` +
    `Your support is working. — Showd`
  );
}
