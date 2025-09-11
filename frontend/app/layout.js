import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "../contexts/DarkModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BlueBank - Your Modern Digital Banking Experience",
  description: "Safe. Simple. Secure digital banking with BlueBank.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8080'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DarkModeProvider>
        {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
