import { InnerPageView, pageMetadata } from "@/components/Pages";

export const metadata = pageMetadata("pricing", "en");

export default function Page() {
  return <InnerPageView page="pricing" lang="en" />;
}
