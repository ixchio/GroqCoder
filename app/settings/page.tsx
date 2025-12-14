"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save, User, Loader2, Sparkles, ExternalLink, Github, Zap, Rocket, FileCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    linkedinUrl: "",
    customRules: "",
  });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      
      const data = await res.json();
      if (data.ok) {
        setFormData({
          name: data.user.name || "",
          bio: data.user.bio || "",
          linkedinUrl: data.user.linkedinUrl || "",
          customRules: data.user.customRules || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          linkedinUrl: formData.linkedinUrl,
          customRules: formData.customRules,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSaveSuccess(true);
        toast.success("Settings saved successfully");
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-glow-pulse delay-1000" />
        </div>
        
        {/* Loading spinner with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative glass rounded-2xl p-8">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-float delay-1000" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl animate-glow-pulse delay-500" />
      </div>

      <div className="relative z-10 p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header with animation */}
          <div className="flex items-center gap-4 animate-fade-in-up">
            <button
              type="button"
              onClick={() => router.back()}
              className="group p-3 glass rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Settings</h1>
              <p className="text-neutral-400 text-sm mt-1">Customize your Groq Coder experience</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div className="glass rounded-2xl p-6 md:p-8 animate-fade-in-up delay-100 hover-lift transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20">
                  <User className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Profile Information
                    <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                  </h2>
                  <p className="text-sm text-neutral-400">Manage your public profile details</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="group">
                  <Label htmlFor="name" className="text-neutral-300 text-sm font-medium mb-2 block">
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="bg-neutral-950/50 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all duration-300 rounded-xl h-12"
                    placeholder="Your display name"
                  />
                </div>

                <div className="group">
                  <Label htmlFor="bio" className="text-neutral-300 text-sm font-medium mb-2 block">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    className="bg-neutral-950/50 border-neutral-800 text-white min-h-[120px] placeholder:text-neutral-600 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all duration-300 rounded-xl resize-none"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <p className="text-xs text-neutral-500 mt-1">{formData.bio.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="group">
                    <Label htmlFor="linkedin" className="text-neutral-300 text-sm font-medium mb-2 flex items-center gap-2">
                      LinkedIn URL
                      <ExternalLink className="w-3 h-3 text-neutral-500" />
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                      className="bg-neutral-950/50 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all duration-300 rounded-xl h-12"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="group">
                    <Label htmlFor="github" className="text-neutral-300 text-sm font-medium mb-2 flex items-center gap-2">
                      GitHub Username
                      <Github className="w-3 h-3 text-neutral-500" />
                    </Label>
                    <Input
                      id="github"
                      value={session?.user?.githubUsername || ""}
                      disabled
                      className="bg-neutral-950/30 border-neutral-800/50 text-neutral-500 cursor-not-allowed rounded-xl h-12"
                      placeholder="Connected via GitHub OAuth"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Automatically set from GitHub login</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Context Section */}
            <div className="glass rounded-2xl p-6 md:p-8 animate-fade-in-up delay-150 hover-lift transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
                  <FileCode className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Project Context
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  </h2>
                  <p className="text-sm text-neutral-400">Define global rules for AI code generation</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <Label htmlFor="customRules" className="text-neutral-300 text-sm font-medium mb-2 block">
                    Global Rules
                  </Label>
                  <Textarea
                    id="customRules"
                    value={formData.customRules}
                    onChange={(e) => handleChange("customRules", e.target.value)}
                    className="bg-neutral-950/50 border-neutral-800 text-white min-h-[150px] placeholder:text-neutral-600 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300 rounded-xl resize-none font-mono text-sm"
                    placeholder="e.g. Always use these colors: #FF6B6B, #4ECDC4, #45B7D1&#10;Use Inter font for headings&#10;Include dark mode support"
                    maxLength={2000}
                  />
                  <p className="text-xs text-neutral-500 mt-1">{formData.customRules.length}/2000 characters</p>
                </div>
                
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <p className="text-sm text-purple-300/80 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    These rules will be included in every AI prompt for consistent code generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Free AI Providers Info Section */}
            <div className="glass rounded-2xl p-6 md:p-8 animate-fade-in-up delay-200 hover-lift transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Free AI Models
                    <Rocket className="w-4 h-4 text-green-400" />
                  </h2>
                  <p className="text-sm text-neutral-400">All models are 100% free - no API keys required!</p>
                </div>
              </div>

              {/* Free providers showcase */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Groq", icon: "⚡", description: "Lightning fast LPU" },
                  { name: "Cerebras", icon: "🧠", description: "Ultra-fast WSE" },
                  { name: "Hugging Face", icon: "🤗", description: "Open models" },
                  { name: "OpenRouter", icon: "🌐", description: "100+ models" },
                ].map((provider) => (
                  <div
                    key={provider.name}
                    className="p-4 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-green-500/30 transition-all duration-300"
                  >
                    <div className="text-2xl mb-2">{provider.icon}</div>
                    <h3 className="font-medium text-white text-sm">{provider.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{provider.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-green-300/80 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  All AI models are provided free of charge. Just start building!
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 animate-fade-in-up delay-300">
              <Button
                type="submit"
                disabled={saving}
                className={`
                  relative overflow-hidden px-8 py-6 text-base font-medium rounded-xl
                  transition-all duration-300 transform hover:scale-105
                  ${saveSuccess 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  }
                  ${saving ? "cursor-not-allowed opacity-80" : ""}
                  shadow-lg hover:shadow-xl hover:shadow-pink-500/20
                `}
              >
                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 animate-shimmer opacity-30" />
                
                <span className="relative flex items-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
