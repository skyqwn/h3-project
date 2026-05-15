import "./globals.css";

// The root layout is a passthrough — <html>/<body> live in
// app/[locale]/layout.tsx so the lang attribute is locale-correct
// and next-intl can wrap the tree with NextIntlClientProvider.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
