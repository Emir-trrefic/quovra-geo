import { InnerPageView, pageMetadata } from "@/components/Pages";

export const metadata = pageMetadata("product", "tr");

export default function Page() {
  return <InnerPageView page="product" lang="tr" />;
}
