"use server";

import { prisma } from "@/lib/db";
import { getCurrentRep } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function markAllReadRep() {
  const rep = await getCurrentRep();
  await prisma.notification.updateMany({
    where: { userId: rep.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/rep/notifications");
  revalidatePath("/rep/profile");
}
