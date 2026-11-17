import { InnerPageView, pageMetadata } from "@/components/Pages";

export const metadata = pageMetadata("solutions", "en");

export default function Page() {
  return <InnerPageView page="solutions" lang="en" />;
}
