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
