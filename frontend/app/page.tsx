import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import LandingPage from "./landing/LandingPage";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Divided and Unpopular Hospital and Diagnostic Center — Dhaka",
  description:
    "Consultant-led treatment, full diagnostic laboratory, 24/7 ambulance services and a community blood donor network in Dhaka, Bangladesh. Sign in to access the hospital portal.",
};

export default function Home() {
  return (
    <div className={`${sora.variable} ${inter.variable}`}>
      <LandingPage />
    </div>
  );
}
