"use client";

import Footer from "../(withNavbar)/_homeElement/Footer";
import Navbar from "../(withNavbar)/_homeElement/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col w-full overflow-x-hidden hide-scrollbar h-screen ">
      <Navbar />
      
        {children}
      
      <Footer />
    </div>
  );
}
