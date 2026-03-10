import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PortalIndexPage() {
  const session = await auth();
  redirect(session?.user ? "/portal/reports" : "/portal/login");
}
