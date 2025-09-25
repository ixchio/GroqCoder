"use client";

import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";

export const NotLogged = () => {
  const { openLoginWindow } = useUser();
  return (
    <section className="max-w-[86rem] py-12 px-4 mx-auto">
      <div className="mt-8 text-center max-w-xl mx-auto">
        <div className="space-y-4 mb-8 text-center mx-auto">
          <h2 className="text-4xl font-bold text-white">
            Oops! You must be logged to continue.
          </h2>
          <p className="text-muted-foreground text-lg mt-1">
            Unfortunately you cannot access DeepSite without being logged
            through your Hugging Face account.
          </p>
        </div>
        <Button size="lg" variant="default" onClick={openLoginWindow}>
          Log In to Continue
        </Button>
      </div>
    </section>
  );
};
