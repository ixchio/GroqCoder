import { redirect } from "next/navigation";

export default function Auth() {
  // Redirect to the new signin page
  redirect("/auth/signin");
}
