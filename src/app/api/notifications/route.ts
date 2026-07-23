import { NextResponse } from "next/server";
import { getCurrentManager } from "@/lib/session";
import { getNotifications, getUnreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const manager = await getCurrentManager();
  const [items, unread] = await Promise.all([
    getNotifications(manager.id),
    getUnreadCount(manager.id),
  ]);
  return NextResponse.json({
    unread,
    items: items.slice(0, 8).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}
