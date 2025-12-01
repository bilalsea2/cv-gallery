import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Hand-Controlled Image Viewer",
    description: "Interactive image gallery controlled by hand gestures",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
