import { redirect } from "next/navigation";
import { Metadata } from "next";

import { getAuth } from "@/app/actions/auth";

export const revalidate = 1;

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function Auth() {
  const loginRedirectUrl = await getAuth();
  if (loginRedirectUrl) {
    redirect(loginRedirectUrl);
  }

  return (
    <div className="p-4">
      <div className="border bg-red-500/10 border-red-500/20 text-red-500 px-5 py-3 rounded-lg">
        <h1 className="text-xl font-bold">Error</h1>
        <p className="text-sm">
          An error occurred while trying to log in. Please try again later.
        </p>
      </div>
    </div>
  );
}
