import { redirect } from "next/navigation";

// Obliqo now lives inside the dashboard. Old links and bookmarks land there.
export default function OpportunitiesRedirect() {
  redirect("/dashboard/obliqo");
}
