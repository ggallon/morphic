export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col space-y-3 px-8 pb-14 pt-12 sm:px-12 md:space-y-4 md:pb-24 md:pt-14">
      {children}
    </div>
  );
}
