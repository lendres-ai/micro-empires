export default function AuthLayout({
  children,
}: {
  children: any;
}) {
  return (
    <div className="w-full flex justify-center py-10 bg-background">
      {children}
    </div>
  );
}
