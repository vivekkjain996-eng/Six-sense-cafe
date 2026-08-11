import webpush from "web-push";
import { db } from "@/lib/db";

const vapidConfigured = Boolean(
  process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
}

export async function notifyWaitersOfCall(restaurantId: string, tableNumber: number) {
  if (!vapidConfigured) return;

  const subscriptions = await db.pushSubscription.findMany({
    where: { adminUser: { restaurantId, role: "WAITER" } },
  });

  const payload = JSON.stringify({
    title: "🔔 Waiter called",
    body: `Table ${tableNumber} needs a waiter`,
    url: "/waiter",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Browser unsubscribed or the subscription expired — stop trying it.
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}

const REPEAT_NOTIFY_INTERVAL_MS = 20_000;

// A single push per call is easy to miss on a locked phone. This is called
// from the polling endpoints that already run every few seconds (the
// customer's own session poll, and the admin/waiter live-tables poll) so an
// unacknowledged call keeps re-buzzing without needing a separate scheduler —
// there's no persistent server process on Vercel to run one for free.
export async function maybeRepeatWaiterCallNotification(table: {
  id: string;
  tableNumber: number;
  restaurantId: string;
  session: { id: string; waiterCallRequestedAt: Date | null; waiterCallLastNotifiedAt: Date | null } | null;
}) {
  const session = table.session;
  if (!session?.waiterCallRequestedAt) return;

  const lastNotified = session.waiterCallLastNotifiedAt ?? session.waiterCallRequestedAt;
  if (Date.now() - lastNotified.getTime() < REPEAT_NOTIFY_INTERVAL_MS) return;

  await notifyWaitersOfCall(table.restaurantId, table.tableNumber);

  // No-ops harmlessly if the call was acknowledged in the meantime, since
  // waiterCallRequestedAt would already be null by the time this runs.
  await db.tableSession
    .updateMany({
      where: { id: session.id, waiterCallRequestedAt: { not: null } },
      data: { waiterCallLastNotifiedAt: new Date() },
    })
    .catch(() => {});
}
