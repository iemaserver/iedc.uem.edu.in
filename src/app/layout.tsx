import type { Metadata } from "next";
import { Gideon_Roman} from "next/font/google";
import "./globals.css";
import Providers from "@/lib/provider";


const gideonRoman = Gideon_Roman({
  variable: "--font-gideon-roman",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${gideonRoman.className} antialiased`}
      >
        <Providers>


        {children}

        </Providers>
      </body>
    </html>
  );
}
