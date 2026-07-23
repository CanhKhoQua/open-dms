"use server";

import { prisma } from "@/lib/db";
import { getCurrentManager } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function markAllReadManager() {
  const mgr = await getCurrentManager();
  await prisma.notification.updateMany({
    where: { userId: mgr.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/manager/notifications");
  revalidatePath("/manager");
}
