import './globals.css';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MasterPasswordProvider } from './contexts/MasterPasswordContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vault - Password Manager & TOTP Authenticator",
  description: "Secure password management and TOTP authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <MasterPasswordProvider>
          {children}
        </MasterPasswordProvider>
      </body>
    </html>
  );
}
