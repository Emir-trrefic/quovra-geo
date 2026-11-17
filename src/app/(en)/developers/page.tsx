import { InnerPageView, pageMetadata } from "@/components/Pages";

export const metadata = pageMetadata("developers", "en");

export default function Page() {
  return <InnerPageView page="developers" lang="en" />;
}
