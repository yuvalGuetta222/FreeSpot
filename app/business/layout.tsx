import BusinessBottomNav from "../../components/business/BusinessBottomNav";

export default function BusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen pb-24">
      {children}

      <BusinessBottomNav />
    </div>
  );
}
