import { Geist } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

import { ConvexClientProvider } from "~/integrations/convex/provider";
import { CurrentUserProvider } from "~/integrations/convex/current-user-provider";
import { ThemeProvider } from "~/integrations/theme/provider";
import "~/styles/globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>
        <html
          lang="en"
          className={`${geist.variable}`}
          suppressHydrationWarning
        >
          <body>
            <CurrentUserProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </CurrentUserProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}
