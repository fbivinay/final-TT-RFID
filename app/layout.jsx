import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import LayoutShell from "@/components/LayoutShell";

export const metadata = {
  title: "Trend Trackers | Smart RFID Inventory",
  description: "Retail analytics dashboard for Texs Mart RFID inventory intelligence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
