"use client";

import { Suspense } from "react";
import { AppEditor } from "@/components/editor";
import { OnboardingTour, useOnboarding } from "@/components/onboarding-tour";
import Loading from "@/components/loading";

function ProjectsNewContent() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}
      <AppEditor isNew />
    </>
  );
}

export default function ProjectsNewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectsNewContent />
    </Suspense>
  );
}
