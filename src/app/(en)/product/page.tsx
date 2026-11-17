import { InnerPageView, pageMetadata } from "@/components/Pages";

export const metadata = pageMetadata("product", "en");

export default function Page() {
  return <InnerPageView page="product" lang="en" />;
}
