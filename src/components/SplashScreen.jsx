import Logo from "./Logo";

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white dark:bg-background">
      <Logo size="lg" />
      <p className="text-sm text-muted-foreground">The Smarter Way to Bank</p>
    </div>
  );
}
