"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles, Code2, Zap, Settings, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Groq Coder! 🎉",
    description: "Your AI-powered code generation assistant. Let's take a quick tour to help you get started.",
    icon: <Sparkles className="w-6 h-6 text-pink-400" />,
  },
  {
    title: "Describe Your Idea",
    description: "Just type what you want to build in plain English. Be as specific or creative as you like - 'Build a portfolio website' or 'Create a todo app with dark mode'.",
    icon: <Code2 className="w-6 h-6 text-purple-400" />,
    highlight: "prompt-input",
  },
  {
    title: "Lightning Fast Generation",
    description: "Powered by Groq LPU™ and 20+ free AI models. Your code generates in seconds, not minutes. No API keys needed - just start building!",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
  },
  {
    title: "Customize Settings",
    description: "Switch between models (Llama, DeepSeek, Qwen, and more) to find what works best for your project. All models are completely free.",
    icon: <Settings className="w-6 h-6 text-blue-400" />,
    highlight: "settings-button",
  },
  {
    title: "Save & Share",
    description: "Publish your projects to the community gallery. Share with friends, fork others' work, and build together. Your creations, your control.",
    icon: <Share2 className="w-6 h-6 text-green-400" />,
  },
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem("groq-coder-onboarding-complete", "true");
      onComplete();
    }, 300);
  };

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-500 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            {step.icon}
          </div>

          {/* Step indicator */}
          <div className="text-xs text-neutral-500 mb-2">
            Step {currentStep + 1} of {tourSteps.length}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>

          {/* Description */}
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-neutral-500 hover:text-white"
            >
              Skip tour
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6"
            >
              {isLastStep ? "Get Started" : "Next"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pb-6">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-pink-500 w-6"
                  : index < currentStep
                  ? "bg-purple-500"
                  : "bg-neutral-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("groq-coder-onboarding-complete");
    if (!completed) {
      // Small delay to let the page load
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}
