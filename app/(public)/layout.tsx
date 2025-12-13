import Navigation from "@/components/public/navigation";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-black z-1 relative">
      <div className="background__noisy" />
      <Navigation />
      {children}
    </div>
  );
}
