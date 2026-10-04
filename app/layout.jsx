import "./globals.css";

export const metadata = {
  title: "SAMBHAV UPSC",
  description: "UPSC Preparation Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
