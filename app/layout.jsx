
import RegisterSW from "./register-sw";

export const metadata = {
  title: "SAMBHAV UPSC",
  description: "UPSC Preparation Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SAMBHAV UPSC",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
