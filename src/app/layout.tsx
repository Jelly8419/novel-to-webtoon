import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "[서비스명] · 소설을 웹툰으로",
  description: "소설 텍스트를 올리면 같은 그림체와 캐릭터로 화마다 이어지는 웹툰을 그려줍니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
