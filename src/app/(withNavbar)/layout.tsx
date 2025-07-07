"use client";
import DynamicLayout from "./_homeElement/Dynamiclayout";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DynamicLayout>{children}</DynamicLayout>;
}
