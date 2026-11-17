import type { Category } from "../audit/types";
import type { Lang } from "./index";

export type Cell = boolean | string;

export interface Plan {
  id: "free" | "starter" | "growth" | "agency";
  name: string;
  tagline: string;
  featured?: boolean;
  cta: string;
}

export interface ContextItem {
  fact: string;
  title: string;
  body: string;
  source: string;
  href: string;
}

type Status = "pass" | "warn" | "fail";

const en = {
  meta: {
    title: "Quovra — AI search visibility audit and measurement",
    description: "Open-source GEO toolkit. Audit how AI assistants read your site in 22 checks, get ready-to-ship fixes, and measure share of voice with confidence intervals.",
    ogTitle: "Quovra — AI search visibility, measured with confidence intervals",
    ogDescription: "Audit how AI assistants read your site, ship the fixes, and measure the result. Open source.",
  },
  nav: { product: "Product", solutions: "Who it's for", workflow: "How it works", developers: "Developers", pricing: "Pricing", method: "Methodology", methodHref: "/methodology", cta: "Run free audit", switchLabel: "TR", switchHref: "/tr" },
  pages: {
    product: { metaTitle: "Product — Quovra", title: "Check, fix and track how AI sees you.", lead: "Check your site, get the fixes, track your mentions.", description: "Quovra checks how AI assistants read your site in 22 checks, writes the fixes for you and tracks how often ChatGPT and Claude recommend you." },
    solutions: { metaTitle: "Who it's for — Quovra", title: "For anyone whose customers ask AI.", lead: "If the assistant can't read you, it recommends someone else.", description: "AI visibility for local businesses, e-commerce, agencies and SaaS teams: see if ChatGPT recommends you and fix what it can't read." },
    workflow: { metaTitle: "How it works — Quovra", title: "From first scan to measured result in four steps.", lead: "Four steps, each with a concrete result.", description: "Scan your site, apply the ready-made fixes, verify the score and measure how often AI assistants recommend you, with confidence intervals." },
    pricing: { metaTitle: "Pricing — Quovra", title: "Start free. Upgrade when you want proof over time.", lead: "Paid plans are in early access, at launch prices.", description: "Free AI visibility audits, and paid plans for weekly tracking in ChatGPT and Claude. Prices in USD, EUR, GBP and TRY." },
    developers: { metaTitle: "Developers — Quovra", title: "For developers and technical teams.", lead: "API, CLI and CI. Open source under AGPL-3.0.", description: "Run Quovra's AI visibility audit from an API, the CLI or CI, fail deploys on regressions, and self-host the open-source engine." },
  },
  explore: {
    title: "Find what you need",
    lead: "",
    more: "Learn more",
    items: [
      { page: "product", icon: "scan", title: "Product", body: "The site check, the ready-made fixes and AI mention tracking." },
      { page: "solutions", icon: "team", title: "Who it's for", body: "Local businesses, e-commerce, agencies and software teams." },
      { page: "workflow", icon: "probe", title: "How it works", body: "Four steps from first scan to a result you can trust." },
      { page: "pricing", icon: "fix", title: "Pricing", body: "Free audits, plans for weekly tracking and a done-for-you setup." },
    ] as { page: "product" | "solutions" | "workflow" | "pricing"; icon: "scan" | "team" | "probe" | "fix"; title: string; body: string }[],
  },
  hero: {
    badge: "Free AI visibility check",
    badgeNote: "No sign-up",
    title: "When customers ask AI, does it recommend you?",
    titleEm: "does it recommend you?",
    lead: "Quovra shows whether ChatGPT and other assistants can read your site, what to fix, and how often they recommend you.",
    secondary: "How we measure",
    trust: ["Open source and transparent", "Reports in English and Turkish", "Never touches your site"],
  },
  terminal: {
    file: "zsh",
    tag: "Illustrative output",
    replay: "Replay",
    header: "Quovra GEO audit",
    checks: [
      ["FAIL", "llms.txt guide for AI agents", "0/6", "No /llms.txt found.", "Publish /llms.txt: a Markdown summary of who you are with links to your most important pages. Quovra generates one for you."],
      ["PASS", "Content visible without JavaScript", "10/10", "", ""],
      ["WARN", "AI search & assistant crawlers can reach you", "7.5/15", "Blocked: OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User. These agents fetch pages to answer users in real time.", "Remove the Disallow rules for these user agents in robots.txt. Blocking them makes you invisible in their answers."],
    ] as [string, string, string, string, string][],
    more: "# 19 more checks not shown",
    blockedLabel: "Blocked AI agents:",
    blocked: "OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User",
    gate: "# exit code 1: score 74 is below --min-score=80, the deploy stops",
    summary: "Animated command-line example: an audit of a fictional site scores 74 out of 100 and the CI gate stops the deploy.",
  },
  answer: {
    app: "AI assistant",
    question: "Can you recommend a good dental implant clinic in Istanbul?",
    intro: "Here are three well-reviewed options:",
    picks: ["Bright Smile Dental", "Istanbul Implant Center", "Dentalia Clinic"],
    you: "Your clinic",
    missing: "not mentioned",
    note: "Illustrative answer. Quovra measures this with your own customers' questions.",
  },
  agents: {
    label: "robots.txt access checked for {n} AI agents",
    purpose: { search: "search", "user-fetch": "user fetch", training: "training" } as Record<"search" | "user-fetch" | "training", string>,
  },
  sample: {
    label: "Sample data",
    site: "smiledental.example",
    report: "AI visibility report",
    scope: "10 pages",
    metrics: [
      ["AI visibility score", "74", "/100", "Grade B"],
      ["Checks passed", "14", "/22", "8 need attention, 3 failing"],
      ["Pages scanned", "10", "", "Site average 71"],
      ["Share of voice", "20%", "", "95% CI 4–62%, 1 of 5 answers"],
    ] as [string, string, string, string][],
    chartTitle: "Points by category",
    chartUnit: "earned / available",
    tableTitle: "Findings",
    tableCount: "5 of 22 checks",
    cols: ["Check", "Category", "Points", "Status"],
    rows: [
      ["AI search & assistant crawlers can reach you", "access", "7.5/15", "warn"],
      ["llms.txt guide for AI agents", "access", "0/6", "fail"],
      ["Answers real questions (FAQ)", "structure", "2/4", "warn"],
      ["Statistics & cited sources", "content", "0/3", "fail"],
      ["Content visible without JavaScript", "content", "10/10", "pass"],
    ] as [string, Category, string, Status][],
    note: "Illustrative data for a fictional site, not a customer result.",
  },
  facts: {
    label: "Key facts",
    items: [
      ["22", "checks of what AI can read on your site"],
      ["14", "AI crawlers checked against your robots.txt"],
      ["95%", "confidence interval, so changes are real, not noise"],
      ["45%", "of consumers ask AI for local recommendations"],
    ] as [string, string][],
  },
  why: {
    kicker: "Why Quovra",
    title: "Assistants answer from what they can read. If they can't read you, they name someone else.",
    lead: "An assistant gives one answer with two or three names. Quovra checks if it can reach, understand and trust you.",
    stages: [
      ["01", "Crawl", "Can the bot reach you?", "robots.txt · llms.txt · sitemap"],
      ["02", "Parse", "Can it read the page?", "HTML without JavaScript · JSON-LD · headings"],
      ["03", "Cite", "Does it have a reason to quote you?", "authorship · statistics · sources · freshness"],
    ] as [string, string, string, string][],
    browser: { file: "browser · after JavaScript runs", caption: "What your visitor sees" },
    crawler: { file: "AI crawler · HTTP response", caption: "What most AI crawlers receive" },
    browserCode: `<h1>Smile Dental</h1>
<p>Implant and cosmetic dentistry in Istanbul.</p>
<ul>
  <li>Dental implants</li>
  <li>Teeth whitening</li>
  <li>212 reviews · 4.8 average</li>
</ul>`,
    crawlerCode: `<!doctype html>
<html lang="en">
  <body>
    <div id="root"></div>
    <script src="/app.js"></script>
  </body>
</html>`,
    verdict: { status: "FAIL", title: "Content visible without JavaScript", points: "0/10", detail: "0 words in the raw HTML." },
  },
  capabilities: {
    title: "Check, fix, track. In plain language.",
    lead: "Every finding comes with the change that fixes it.",
    items: [
      { title: "Site check", body: "Reads your pages like an AI crawler and scores what it can access, understand and trust.", scope: "22 checks · 100 points · up to 10 pages per scan" },
      { title: "Ready-made fixes", body: "Ready-to-paste llms.txt, structured data and crawler rules. Or let us set them up.", scope: "llms.txt · structured data · robots.txt" },
      { title: "AI mention tracking", body: "Asks ChatGPT and Claude your customers' questions and shows how often you are recommended.", scope: "ChatGPT · Claude · more engines planned" },
      { title: "Reports you can share", body: "PDF, share link and score badge. Developers get an API.", scope: "PDF · share link · badge · API" },
    ],
  },
  workflow: {
    title: "From first scan to measured result in four steps.",
    lead: "Four steps, each with a concrete result.",
    outLabel: "Output:",
    items: [
      { step: "Step 1", time: "≈ 10 seconds", file: "terminal", code: `$ npm run audit -- smiledental.example
Score 74/100  Grade B
FAIL llms.txt guide for AI agents (0/6)`, title: "Scan", body: "Enter your address. 22 checks in about 10 seconds.", out: "a scored report with fixes" },
      { step: "Step 2", time: "Your release cycle", file: "public/robots.txt", code: `  User-agent: OAI-SearchBot
- Disallow: /
+ Allow: /
  User-agent: PerplexityBot
- Disallow: /
+ Allow: /`, title: "Fix", body: "Apply the fixes yourself, give them to your web team, or let us do it.", out: "files to review" },
      { step: "Step 3", time: "Every deploy", file: ".github/workflows/geo.yml", code: `- name: GEO audit
  run: npm run audit -- smiledental.example --min-score=80
# exit code 1 below 80: the job fails, the deploy waits`, title: "Verify", body: "Scan again and watch the score move.", out: "before/after score" },
      { step: "Step 4", time: "On demand", file: "POST /api/probe", code: `{
  "brand": "Smile Dental",
  "totalAnswers": 5,
  "shareOfVoice": 20,
  "confidence": [4, 62]
}`, title: "Measure", body: "Ask your customers' questions, several times each.", out: "share of voice, rank and competitors" },
    ],
  },
  code: {
    title: "Output you can read before you ship it.",
    lead: "Plain files you can read before you ship them.",
    caption: "Example output for a fictional site.",
    tabs: { robots: "robots.txt", llms: "llms.txt", jsonld: "JSON-LD", api: "API", cli: "CLI" },
    comments: {
      robots: "# Before: AI search bots blocked. After: allowed.",
      llms: "# Generated from your own site, ready to publish at /llms.txt",
      jsonld: "<!-- States who you are in machine-readable form -->",
      api: "# One request, a full GEO audit back as JSON",
      cli: "# Fail your deploy if AI visibility drops",
    },
  },
  measure: {
    kicker: "AI Mention Probe",
    title: "One AI answer is luck. Many answers are a measurement.",
    lead: "Answers change from try to try, so every question is asked several times. Move the slider to see why.",
    demo: {
      file: "interval, computed live",
      answers: "Answers collected",
      mentions: "Answers that name your brand",
      share: "Share of voice",
      interval: "95% interval",
      width: "Interval width",
      pts: "pts",
      presets: "Same 20%, more answers",
      of: "of",
      note: "Calculated in your browser with the same wilson() function the probe uses.",
    },
    codeFile: "src/lib/probe/stats.ts",
    codeCaption: "The function behind every interval in a report.",
    points: [
      ["Asked several times", "Assistants answer differently each time."],
      ["A range, not a guess", "A narrow range means a real result."],
      ["Real progress, not noise", "Proof you can show your boss or client."],
    ] as [string, string][],
  },
  segments: {
    kicker: "Who it's for",
    title: "For anyone whose customers ask AI.",
    lead: "If the assistant can't read you, it recommends someone else.",
    askLabel: "Your customers ask",
    planLabel: "Good fit:",
    items: [
      { icon: "local", title: "Local businesses", who: "Clinics · restaurants · hotels · lawyers · salons", ask: "\u201cWhich dentist near me is best for implants?\u201d", points: ["See if ChatGPT names you for local questions", "Check that AI can read your address, opening hours and services on your site", "Done-for-you setup if you have no web team"], plan: "Starter + setup service" },
      { icon: "store", title: "E-commerce", who: "Online stores · brands · D2C", ask: "\u201cWhat's the best running shoe under $100?\u201d", points: ["Check that product data (price, stock, rating) is readable by AI", "Get ready for shopping inside ChatGPT and other assistants", "Track the competitors recommended instead of you"], plan: "Growth" },
      { icon: "team", title: "Agencies & consultants", who: "SEO · digital · PR agencies, freelancers", ask: "\u201cWhy does ChatGPT recommend our competitor?\u201d", points: ["Win new clients with a free scan as your opening slide", "Sell GEO as a new monthly service", "White-label PDF reports for up to 15 client sites"], plan: "Agency" },
      { icon: "ci", title: "SaaS & developers", who: "Software companies · product and web teams", ask: "\u201cWhat's the best invoicing tool for freelancers?\u201d", points: ["Run the check from an API, the command line or CI", "Fail a deploy when AI visibility drops", "Open source: inspect every check and weight"], plan: "Free CLI + Growth" },
    ] as { icon: "local" | "store" | "team" | "ci"; title: string; who: string; ask: string; points: string[]; plan: string }[],
  },
  developers: {
    title: "For developers and technical teams",
    lead: "API, CLI and CI. Open source under AGPL-3.0.",
    items: [
      ["API and CLI", "POST /api/audit returns JSON or Markdown."],
      ["CI gate", "--min-score stops a deploy when the score drops."],
      ["Open scoring", "Every check and weight is in the repo."],
      ["Safe by design", "Private networks blocked, requests limited, nothing stored."],
      ["Self-hosting", "Docker image included. Commercial licenses available."],
    ] as [string, string][],
  },
  context: {
    title: "What is changing in search",
    lead: "Published figures, linked to their sources.",
    items: [
      { fact: "Feb 2026", title: "Ads arrived in ChatGPT", body: "Sponsored suggestions now sit under answers in the US. Organic mentions get harder to win.", source: "Segwise, 2026", href: "https://segwise.ai/blog/chatgpt-ads-2026-guide.md" },
      { fact: "Shopify · Etsy", title: "Products show up in ChatGPT", body: "These catalogs are included automatically; other stores need crawlable pages or a feed.", source: "Alhena, 2026", href: "https://alhena.ai/blog/chatgpt-shopping-product-feed-guide/" },
      { fact: "133 vs 11", title: "Reviews decide local answers", body: "AI-visible local businesses averaged 133 Google reviews; invisible ones averaged 11.", source: "Insites, 10,000 US businesses", href: "https://www.insites.com/ai-whitepaper" },
      { fact: "45%", title: "Locals ask AI first", body: "Share of consumers using AI for local recommendations, up from 6% a year earlier.", source: "BrightLocal via Local Falcon", href: "https://www.localfalcon.com/blog/the-ai-visibility-crisis-why-83-percent-of-restaurants-dont-exist-in-chatgpt" },
    ] as ContextItem[],
  },
  references: {
    title: "Reference projects",
    problem: "Problem",
    approach: "Approach",
    result: "Result",
  },
  pricing: {
    kicker: "Pricing",
    title: "Start free. Upgrade when you want proof over time.",
    lead: "Paid plans are in early access, at launch prices.",
    monthly: "Monthly",
    yearly: "Yearly",
    save: "2 months free",
    perMonth: "/mo",
    currencyLabel: "Currency",
    billedYearly: "billed yearly",
    plans: [
      { id: "free", name: "Free", tagline: "Audit any site, any time", cta: "Run a free audit" },
      { id: "starter", name: "Starter", tagline: "For one business", cta: "Join early access" },
      { id: "growth", name: "Growth", tagline: "For growing brands", featured: true, cta: "Join early access" },
      { id: "agency", name: "Agency", tagline: "For agencies & teams", cta: "Join early access" },
    ] as Plan[],
    popular: "Most popular",
    tableTitle: "Compare plans",
    soon: "soon",
    service: { title: "Rather have us fix it?", body: "We implement every fix from your audit on up to 10 pages: llms.txt, structured data, robots.txt and FAQ content, with one round of revisions. Delivered within 10 business days of getting access to your site.", priceFrom: "One-time, from {price}", cta: "Request setup" },
  },
  faq: {
    title: "Questions",
    items: [
      { q: "What is GEO?", a: "Generative Engine Optimization: making your site easy for AI assistants to access, parse and cite. SEO competes for a position on a results page; GEO competes to be named inside the answer." },
      { q: "Why not just ask ChatGPT myself?", a: "One answer is an anecdote. Identical prompts return different answers, so Quovra asks each question several times and reports a confidence interval. It also audits the technical causes: crawler access, rendering and structured data." },
      { q: "Which AI assistants do you measure?", a: "ChatGPT (with web search, like the app) and Claude today; Gemini, Perplexity and Google AI Overviews are planned. Answers through the API can differ slightly from the consumer apps, which the methodology page states." },
      { q: "I'm not technical. Can I still use it?", a: "Yes. The report explains every finding in plain language and gives you the exact change. You can hand it to whoever manages your website, or ask us to set it up for you." },
      { q: "Does blocking GPTBot hurt me?", a: "GPTBot collects training data, so blocking it is a legitimate licensing choice and costs 2 points. Blocking search and user agents such as OAI-SearchBot or ChatGPT-User removes you from live answers and costs up to 15." },
      { q: "Can I run it on my own infrastructure?", a: "Yes. Quovra is AGPL-3.0 and ships with a Dockerfile. Free audits are processed in memory and not persisted. If you offer a modified version as a network service you must publish your changes; commercial licenses are available." },
      { q: "Can I use it in CI?", a: "Yes. The CLI exits with code 1 when the score is below --min-score, for example npm run audit -- example.com --min-score=70. The same audit is available as POST /api/audit." },
    ],
  },
  cta: {
    or: "or",
    secondary: "Have us fix it for you",
    title: "Stay visible in the age of AI answers.",
    body: "Our goal is simple: when your customer asks an assistant, your name is in the answer. We measure your site, fix what holds it back and prove the result.",
    button: "Run a free audit",
  },
  footer: {
    tagline: "Open-source toolkit for AI search visibility.",
    cols: [
      { title: "Product", links: [["Free audit", "/#top"], ["Product", "/product"], ["Who it's for", "/solutions"], ["How it works", "/how-it-works"], ["Pricing", "/pricing"]] },
      { title: "Resources", links: [["GEO guide", "/guide"], ["Methodology", "/methodology"], ["Developers", "/developers"], ["GitHub", "REPO"]] },
      { title: "Company", links: [["Investors", "/investors"], ["Softmain", "https://softmain.com.tr"], ["Türkçe", "/tr"]] },
    ],
    legal: "Open-source GEO toolkit · AGPL-3.0",
    madeBy: "A product by",
  },
};

export type LandingDict = typeof en;

const tr: LandingDict = {
  meta: {
    title: "Quovra — Yapay zekâ arama görünürlüğü denetimi ve ölçümü",
    description: "Açık kaynak GEO aracı. Yapay zekâ asistanlarının sitenizi nasıl okuduğunu 22 kontrolle denetler, hazır düzeltmeler üretir, görünürlük payını güven aralığıyla ölçer.",
    ogTitle: "Quovra — Yapay zekâ arama görünürlüğü, güven aralığıyla ölçülür",
    ogDescription: "Yapay zekâ asistanlarının sitenizi nasıl okuduğunu denetleyin, düzeltmeleri uygulayın, sonucu ölçün. Açık kaynak.",
  },
  nav: { product: "Ürün", solutions: "Kimin için", workflow: "Nasıl çalışır", developers: "Geliştiriciler", pricing: "Fiyatlar", method: "Yöntem", methodHref: "/tr/yontem", cta: "Ücretsiz denetle", switchLabel: "EN", switchHref: "/" },
  pages: {
    product: { metaTitle: "Ürün — Quovra", title: "Yapay zekânın sizi nasıl gördüğünü kontrol edin, düzeltin, takip edin.", lead: "Sitenizi kontrol edin, düzeltmeleri alın, anılmanızı takip edin.", description: "Quovra, yapay zekâ asistanlarının sitenizi nasıl okuduğunu 22 kontrolle denetler, düzeltmeleri sizin için yazar ve ChatGPT ile Claude'un sizi ne sıklıkla önerdiğini takip eder." },
    solutions: { metaTitle: "Kimin için — Quovra", title: "Müşterisi yapay zekâya soran herkes için.", lead: "Asistan sizi okuyamıyorsa başkasını önerir.", description: "Yerel işletmeler, e-ticaret, ajanslar ve yazılım ekipleri için yapay zekâ görünürlüğü: ChatGPT sizi öneriyor mu görün, okuyamadığını düzeltin." },
    workflow: { metaTitle: "Nasıl çalışır — Quovra", title: "İlk taramadan ölçülmüş sonuca dört adımda.", lead: "Dört adım, her biri somut bir sonuçla.", description: "Sitenizi tarayın, hazır düzeltmeleri uygulayın, puanı doğrulayın ve yapay zekâ asistanlarının sizi ne sıklıkla önerdiğini güven aralığıyla ölçün." },
    pricing: { metaTitle: "Fiyatlar — Quovra", title: "Ücretsiz başlayın. Zaman içinde kanıt istediğinizde yükseltin.", lead: "Ücretli paketler lansman fiyatıyla erken erişimde.", description: "Ücretsiz yapay zekâ görünürlük denetimi ve ChatGPT ile Claude'da haftalık takip için ücretli paketler. TL, USD, EUR ve GBP fiyatlar." },
    developers: { metaTitle: "Geliştiriciler — Quovra", title: "Geliştiriciler ve teknik ekipler için.", lead: "API, CLI ve CI. AGPL-3.0 ile açık kaynak.", description: "Quovra'nın yapay zekâ görünürlük denetimini API, CLI ya da CI'dan çalıştırın, gerilemede yayını durdurun, açık kaynak motoru kendi sunucunuzda barındırın." },
  },
  explore: {
    title: "Aradığınızı bulun",
    lead: "",
    more: "Devamını okuyun",
    items: [
      { page: "product", icon: "scan", title: "Ürün", body: "Site kontrolü, hazır düzeltmeler ve yapay zekâda anılma takibi." },
      { page: "solutions", icon: "team", title: "Kimin için", body: "Yerel işletmeler, e-ticaret, ajanslar ve yazılım ekipleri." },
      { page: "workflow", icon: "probe", title: "Nasıl çalışır", body: "İlk taramadan güvenilir sonuca dört adım." },
      { page: "pricing", icon: "fix", title: "Fiyatlar", body: "Ücretsiz denetim, haftalık takip paketleri ve anahtar teslim kurulum." },
    ] as { page: "product" | "solutions" | "workflow" | "pricing"; icon: "scan" | "team" | "probe" | "fix"; title: string; body: string }[],
  },
  hero: {
    badge: "Ücretsiz yapay zekâ görünürlük testi",
    badgeNote: "Üyelik yok",
    title: "Müşterileriniz yapay zekâya sorduğunda sizi öneriyor mu?",
    titleEm: "sizi öneriyor mu?",
    lead: "Quovra, ChatGPT ve benzeri asistanların sitenizi okuyup okuyamadığını, neyi düzeltmeniz gerektiğini ve sizi ne sıklıkla önerdiklerini gösterir.",
    secondary: "Nasıl ölçüyoruz?",
    trust: ["Açık kaynak ve şeffaf", "Türkçe rapor", "Sitenize dokunmaz"],
  },
  terminal: {
    file: "zsh",
    tag: "Örnek çıktı",
    replay: "Tekrar oynat",
    header: "Quovra GEO audit",
    checks: [
      ["FAIL", "Yapay zekâ ajanları için llms.txt rehberi", "0/6", "/llms.txt bulunamadı.", "/llms.txt yayınlayın: kim olduğunuzu anlatan ve en önemli sayfalarınıza link veren kısa bir Markdown özeti. Quovra sizin için hazırlıyor."],
      ["PASS", "İçerik JavaScript olmadan görünüyor", "10/10", "", ""],
      ["WARN", "Yapay zekâ arama ve asistan botları sitenize erişebiliyor", "7.5/15", "Engellenenler: OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User. Bu botlar kullanıcılara anlık cevap vermek için sayfaları okur.", "robots.txt dosyasında bu botlar için yazılmış Disallow kurallarını kaldırın. Engellerseniz bu asistanların cevaplarında hiç görünmezsiniz."],
    ] as [string, string, string, string, string][],
    more: "# 19 kontrol daha, burada gösterilmiyor",
    blockedLabel: "Blocked AI agents:",
    blocked: "OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User",
    gate: "# çıkış kodu 1: puan 74, --min-score=80 eşiğinin altında; dağıtım durur",
    summary: "Animasyonlu komut satırı örneği: kurgusal bir sitenin denetimi 100 üzerinden 74 puan alır ve CI kapısı dağıtımı durdurur.",
  },
  answer: {
    app: "Yapay zekâ asistanı",
    question: "İstanbul'da iyi bir implant kliniği önerir misin?",
    intro: "Yorumları iyi olan üç seçenek:",
    picks: ["Parlak Gülüş Diş Kliniği", "İstanbul İmplant Merkezi", "Dentalia Klinik"],
    you: "Sizin kliniğiniz",
    missing: "anılmadı",
    note: "Temsilî cevap. Quovra bunu kendi müşterilerinizin sorularıyla ölçer.",
  },
  agents: {
    label: "{n} yapay zekâ botu için robots.txt erişimi denetlenir",
    purpose: { search: "arama", "user-fetch": "kullanıcı isteği", training: "eğitim" } as Record<"search" | "user-fetch" | "training", string>,
  },
  sample: {
    label: "Örnek veri",
    site: "gulusdis.example",
    report: "Yapay zekâ görünürlük raporu",
    scope: "10 sayfa",
    metrics: [
      ["Yapay zekâ görünürlük puanı", "74", "/100", "Not B"],
      ["Geçen kontrol", "14", "/22", "8'i dikkat istiyor, 3'ü başarısız"],
      ["Taranan sayfa", "10", "", "Site ortalaması 71"],
      ["Görünürlük payı", "%20", "", "%95 güven aralığı %4–62, 5 cevabın 1'i"],
    ] as [string, string, string, string][],
    chartTitle: "Kategoriye göre puan",
    chartUnit: "alınan / toplam",
    tableTitle: "Bulgular",
    tableCount: "22 kontrolden 5'i",
    cols: ["Kontrol", "Kategori", "Puan", "Durum"],
    rows: [
      ["Yapay zekâ arama ve asistan botları sitenize erişebiliyor", "access", "7,5/15", "warn"],
      ["Yapay zekâ ajanları için llms.txt rehberi", "access", "0/6", "fail"],
      ["Gerçek soruları cevaplıyor (SSS)", "structure", "2/4", "warn"],
      ["İstatistik ve kaynak gösterme", "content", "0/3", "fail"],
      ["İçerik JavaScript olmadan görünüyor", "content", "10/10", "pass"],
    ] as [string, Category, string, Status][],
    note: "Kurgusal bir site için örnek veridir, müşteri sonucu değildir.",
  },
  facts: {
    label: "Öne çıkan bilgiler",
    items: [
      ["22", "kontrolle, yapay zekânın sitenizden ne okuyabildiği"],
      ["14", "yapay zekâ botu için robots.txt erişim kontrolü"],
      ["%95", "güven aralığı: değişim gerçek mi, gürültü mü, bilirsiniz"],
      ["%45", "tüketicinin yerel öneri için yapay zekâya sorma oranı"],
    ] as [string, string][],
  },
  why: {
    kicker: "Neden Quovra",
    title: "Asistanlar okuyabildiklerinden cevap verir. Sizi okuyamazlarsa başkasını anarlar.",
    lead: "Asistan iki üç isimli tek bir cevap verir. Quovra sizi bulup anlayıp güvenebildiğini kontrol eder.",
    stages: [
      ["01", "Tara", "Bot size ulaşabiliyor mu?", "robots.txt · llms.txt · site haritası"],
      ["02", "Ayrıştır", "Sayfayı okuyabiliyor mu?", "JavaScript'siz HTML · JSON-LD · başlıklar"],
      ["03", "Alıntıla", "Sizi anmak için bir nedeni var mı?", "yazar bilgisi · istatistik · kaynaklar · güncellik"],
    ] as [string, string, string, string][],
    browser: { file: "tarayıcı · JavaScript çalıştıktan sonra", caption: "Ziyaretçinizin gördüğü" },
    crawler: { file: "yapay zekâ botu · HTTP yanıtı", caption: "Yapay zekâ botlarının çoğunun aldığı" },
    browserCode: `<h1>Gülüş Diş Kliniği</h1>
<p>İstanbul'da implant ve estetik diş hekimliği.</p>
<ul>
  <li>Diş implantı</li>
  <li>Diş beyazlatma</li>
  <li>212 yorum · ortalama 4,8</li>
</ul>`,
    crawlerCode: `<!doctype html>
<html lang="tr">
  <body>
    <div id="root"></div>
    <script src="/app.js"></script>
  </body>
</html>`,
    verdict: { status: "FAIL", title: "İçerik JavaScript olmadan görünüyor", points: "0/10", detail: "Ham HTML'de 0 kelime var." },
  },
  capabilities: {
    title: "Kontrol et, düzelt, takip et. Anlaşılır bir dille.",
    lead: "Her bulgu, onu düzelten değişiklikle gelir.",
    items: [
      { title: "Site kontrolü", body: "Sayfalarınızı yapay zekâ botu gibi okur; neye erişip neyi anladığını ve neye güvendiğini puanlar.", scope: "22 kontrol · 100 puan · taramada en fazla 10 sayfa" },
      { title: "Hazır düzeltmeler", body: "Kopyala-yapıştır llms.txt, yapısal veri ve bot kuralları. Ya da kurulumu bize bırakın.", scope: "llms.txt · yapısal veri · robots.txt" },
      { title: "Yapay zekâda anılma takibi", body: "Müşteri sorularınızı ChatGPT ve Claude'a sorar, ne sıklıkla önerildiğinizi gösterir.", scope: "ChatGPT · Claude · diğer motorlar planlı" },
      { title: "Paylaşılabilir raporlar", body: "PDF, paylaşım bağlantısı ve puan rozeti. Geliştiricilere API.", scope: "PDF · paylaşım bağlantısı · rozet · API" },
    ],
  },
  workflow: {
    title: "İlk taramadan ölçülmüş sonuca dört adımda.",
    lead: "Dört adım, her biri somut bir sonuçla.",
    outLabel: "Çıktı:",
    items: [
      { step: "Adım 1", time: "≈ 10 saniye", file: "terminal", code: `$ npm run audit -- gulusdis.example --lang=tr
Score 74/100  Grade B
FAIL Yapay zekâ ajanları için llms.txt rehberi (0/6)`, title: "Tara", body: "Adresinizi girin. 22 kontrol, yaklaşık 10 saniye.", out: "düzeltmeli puan raporu" },
      { step: "Adım 2", time: "Sürüm döngünüz", file: "public/robots.txt", code: `  User-agent: OAI-SearchBot
- Disallow: /
+ Allow: /
  User-agent: PerplexityBot
- Disallow: /
+ Allow: /`, title: "Düzelt", body: "Düzeltmeleri kendiniz uygulayın, ekibinize verin ya da bize bırakın.", out: "incelenecek dosyalar" },
      { step: "Adım 3", time: "Her dağıtım", file: ".github/workflows/geo.yml", code: `- name: GEO audit
  run: npm run audit -- gulusdis.example --min-score=80
# 80'in altında çıkış kodu 1: iş başarısız olur, dağıtım bekler`, title: "Doğrula", body: "Yeniden tarayın, puanın değiştiğini görün.", out: "öncesi/sonrası puan" },
      { step: "Adım 4", time: "İstek üzerine", file: "POST /api/probe", code: `{
  "brand": "Gülüş Diş",
  "totalAnswers": 5,
  "shareOfVoice": 20,
  "confidence": [4, 62]
}`, title: "Ölç", body: "Müşteri sorularınızı birkaç kez sorun.", out: "görünürlük payı, sıra ve rakipler" },
    ],
  },
  code: {
    title: "Yayına almadan önce okuyabileceğiniz çıktı.",
    lead: "Yayına almadan önce okuyabileceğiniz düz dosyalar.",
    caption: "Kurgusal bir site için örnek çıktı.",
    tabs: { robots: "robots.txt", llms: "llms.txt", jsonld: "JSON-LD", api: "API", cli: "CLI" },
    comments: {
      robots: "# Önce: yapay zekâ arama botları engelli. Sonra: izinli.",
      llms: "# Sitenizden üretildi, /llms.txt adresinde yayınlamaya hazır",
      jsonld: "<!-- Kim olduğunuzu makinelerin okuyabileceği biçimde belirtir -->",
      api: "# Tek istek, JSON olarak tam bir GEO denetimi",
      cli: "# Yapay zekâ görünürlüğü düşerse dağıtımı durdur",
    },
  },
  measure: {
    kicker: "AI Mention Probe",
    title: "Tek bir yapay zekâ cevabı şanstır. Çok sayıda cevap ölçümdür.",
    lead: "Cevaplar her denemede değişir; bu yüzden her soru birkaç kez sorulur. Farkı görmek için kaydırın.",
    demo: {
      file: "aralık, canlı hesaplanır",
      answers: "Toplanan cevap",
      mentions: "Markanızı anan cevap",
      share: "Görünürlük payı",
      interval: "%95 aralık",
      width: "Aralık genişliği",
      pts: "puan",
      presets: "Aynı %20, daha fazla cevap",
      of: "/",
      note: "Probe'un kullandığı wilson() fonksiyonuyla tarayıcınızda hesaplanır.",
    },
    codeFile: "src/lib/probe/stats.ts",
    codeCaption: "Raporlardaki her aralığın arkasındaki fonksiyon.",
    points: [
      ["Birkaç kez sorulur", "Asistanlar her seferinde farklı cevap verir."],
      ["Tahmin değil, aralık", "Dar aralık, gerçek bir sonuç demektir."],
      ["Gürültü değil, gerçek ilerleme", "Yöneticinize ya da müşterinize gösterebileceğiniz kanıt."],
    ] as [string, string][],
  },
  segments: {
    kicker: "Kimin için",
    title: "Müşterisi yapay zekâya soran herkes için.",
    lead: "Asistan sizi okuyamıyorsa başkasını önerir.",
    askLabel: "Müşterileriniz soruyor",
    planLabel: "Uygun paket:",
    items: [
      { icon: "local", title: "Yerel işletmeler", who: "Klinik · restoran · otel · avukat · güzellik salonu", ask: "\u201cYakınımda implant için en iyi diş hekimi hangisi?\u201d", points: ["Yerel sorularda ChatGPT'nin sizi anıp anmadığını görün", "Sitenizdeki adres, çalışma saatleri ve hizmet bilgisinin yapay zekâca okunabildiğini kontrol edin", "Web ekibiniz yoksa anahtar teslim kurulum"], plan: "Başlangıç + kurulum hizmeti" },
      { icon: "store", title: "E-ticaret", who: "Online mağazalar · markalar · D2C", ask: "\u201c2.000 TL altı en iyi koşu ayakkabısı hangisi?\u201d", points: ["Ürün verisinin (fiyat, stok, puan) yapay zekâca okunabildiğini kontrol edin", "ChatGPT ve diğer asistanlarda alışverişe hazırlanın", "Sizin yerinize önerilen rakipleri takip edin"], plan: "Büyüme" },
      { icon: "team", title: "Ajanslar ve danışmanlar", who: "SEO · dijital · PR ajansları, serbest çalışanlar", ask: "\u201cChatGPT neden rakibimizi öneriyor?\u201d", points: ["Ücretsiz taramayı açılış slaydı yapıp yeni müşteri kazanın", "GEO'yu yeni bir aylık hizmet olarak satın", "15 müşteri sitesine kadar kendi markanızla PDF rapor"], plan: "Ajans" },
      { icon: "ci", title: "SaaS ve geliştiriciler", who: "Yazılım şirketleri · ürün ve web ekipleri", ask: "\u201cSerbest çalışanlar için en iyi fatura programı hangisi?\u201d", points: ["Kontrolü API'den, komut satırından ya da CI'dan çalıştırın", "Yapay zekâ görünürlüğü düşerse yayını durdurun", "Açık kaynak: her kontrolü ve ağırlığı inceleyin"], plan: "Ücretsiz CLI + Büyüme" },
    ] as { icon: "local" | "store" | "team" | "ci"; title: string; who: string; ask: string; points: string[]; plan: string }[],
  },
  developers: {
    title: "Geliştiriciler ve teknik ekipler için",
    lead: "API, CLI ve CI. AGPL-3.0 ile açık kaynak.",
    items: [
      ["API ve CLI", "POST /api/audit JSON ya da Markdown döndürür."],
      ["CI kapısı", "--min-score, puan düşerse yayını durdurur."],
      ["Açık puanlama", "Her kontrol ve ağırlık depoda."],
      ["Güvenli tasarım", "Özel ağlar engelli, istekler sınırlı, hiçbir şey saklanmaz."],
      ["Kendi sunucunuzda", "Docker ile gelir. Ticari lisans mevcut."],
    ] as [string, string][],
  },
  context: {
    title: "Aramada neler değişiyor",
    lead: "Kaynağına bağlı, yayımlanmış veriler.",
    items: [
      { fact: "Şubat 2026", title: "ChatGPT'ye reklam geldi", body: "ABD'de cevapların altında sponsorlu öneriler başladı. Organik olarak anılmak zorlaşıyor.", source: "Segwise, 2026", href: "https://segwise.ai/blog/chatgpt-ads-2026-guide.md" },
      { fact: "Shopify · Etsy", title: "Ürünler ChatGPT'de listeleniyor", body: "Bu platformların katalogları otomatik dahil; diğer mağazaların taranabilir sayfa ya da feed'e ihtiyacı var.", source: "Alhena, 2026", href: "https://alhena.ai/blog/chatgpt-shopping-product-feed-guide/" },
      { fact: "133'e 11", title: "Yerel cevapları yorumlar belirliyor", body: "Yapay zekâda görünen yerel işletmelerin ortalama 133, görünmeyenlerin 11 Google yorumu var.", source: "Insites, ABD'de 10.000 işletme", href: "https://www.insites.com/ai-whitepaper" },
      { fact: "%45", title: "Yerel aramada önce yapay zekâ", body: "Yerel öneri için yapay zekâ kullanan tüketici oranı. Bir yıl önce %6'ydı.", source: "BrightLocal, Local Falcon aracılığıyla", href: "https://www.localfalcon.com/blog/the-ai-visibility-crisis-why-83-percent-of-restaurants-dont-exist-in-chatgpt" },
    ] as ContextItem[],
  },
  references: {
    title: "Referans projeler",
    problem: "Sorun",
    approach: "Yaklaşım",
    result: "Sonuç",
  },
  pricing: {
    kicker: "Fiyatlar",
    title: "Ücretsiz başlayın. Zaman içinde kanıt istediğinizde yükseltin.",
    lead: "Ücretli planlar erken erişimde. Şimdi katılın, lansman fiyatı ömür boyu sizin kalsın.",
    monthly: "Aylık",
    yearly: "Yıllık",
    save: "2 ay bedava",
    perMonth: "/ay",
    currencyLabel: "Para birimi",
    billedYearly: "yıllık faturalanır",
    plans: [
      { id: "free", name: "Ücretsiz", tagline: "Her siteyi, her zaman denetleyin", cta: "Ücretsiz denetle" },
      { id: "starter", name: "Başlangıç", tagline: "Tek işletme için", cta: "Erken erişime katıl" },
      { id: "growth", name: "Büyüme", tagline: "Büyüyen markalar için", featured: true, cta: "Erken erişime katıl" },
      { id: "agency", name: "Ajans", tagline: "Ajanslar ve ekipler için", cta: "Erken erişime katıl" },
    ] as Plan[],
    popular: "En popüler",
    tableTitle: "Paketleri karşılaştırın",
    soon: "yakında",
    service: { title: "Düzeltmeleri biz mi yapalım?", body: "Denetiminizdeki tüm düzeltmeleri 10 sayfaya kadar biz uygularız: llms.txt, yapısal veri, robots.txt ve SSS içeriği, bir revizyon hakkıyla. Sitenize erişim aldıktan sonra 10 iş günü içinde teslim.", priceFrom: "Tek seferlik, başlangıç fiyatı {price}", cta: "Kurulum talep et" },
  },
  faq: {
    title: "Sık sorulan sorular",
    items: [
      { q: "GEO nedir?", a: "Üretken Motor Optimizasyonu: sitenizin yapay zekâ asistanlarınca erişilebilir, ayrıştırılabilir ve alıntılanabilir olmasını sağlamak. SEO sonuç sayfasında sıra için, GEO cevabın içinde anılmak için yarışır." },
      { q: "Neden ChatGPT'ye kendim sormuyorum?", a: "Tek cevap anekdottur. Aynı soru farklı cevaplar döndürür; bu yüzden Quovra her soruyu birkaç kez sorar ve güven aralığı raporlar. Teknik nedenleri de denetler: bot erişimi, işleme ve yapısal veri." },
      { q: "Hangi yapay zekâ asistanlarını ölçüyorsunuz?", a: "Bugün ChatGPT (uygulamadaki gibi web aramalı) ve Claude; Gemini, Perplexity ve Google AI Overviews planlı. API üzerinden alınan cevaplar tüketici uygulamalarından biraz farklı olabilir; yöntem sayfası bunu belirtir." },
      { q: "Teknik bilgim yok, yine de kullanabilir miyim?", a: "Evet. Rapor her bulguyu sade bir dille açıklar ve yapılacak değişikliği verir. Sitenizi yöneten kişiye iletebilir ya da kurulumu bize bırakabilirsiniz." },
      { q: "GPTBot'u engellemek zarar verir mi?", a: "GPTBot eğitim verisi toplar; engellemek meşru bir lisans tercihidir ve 2 puana mal olur. OAI-SearchBot ya da ChatGPT-User gibi arama ve kullanıcı botlarını engellemek sizi canlı cevaplardan çıkarır ve 15 puana kadar mal olur." },
      { q: "Kendi altyapımda çalıştırabilir miyim?", a: "Evet. Quovra AGPL-3.0 lisanslıdır ve Dockerfile ile gelir. Ücretsiz denetimler bellekte işlenir ve kalıcı saklanmaz. Değiştirilmiş sürümü ağ hizmeti olarak sunarsanız değişiklikleri yayımlamanız gerekir; ticari lisans mevcuttur." },
      { q: "CI içinde kullanabilir miyim?", a: "Evet. CLI, puan --min-score değerinin altındaysa 1 koduyla çıkar; örneğin npm run audit -- example.com --min-score=70. Aynı denetim POST /api/audit olarak da kullanılabilir." },
    ],
  },
  cta: {
    or: "ya da",
    secondary: "Düzeltmeleri bize bırakın",
    title: "Yapay zekâ çağında görünür kalın.",
    body: "Amacımız basit: müşteriniz bir asistana sorduğunda cevapta sizin adınız geçsin. Sitenizi ölçüyor, sizi geride bırakanı düzeltiyor ve sonucu kanıtlıyoruz.",
    button: "Ücretsiz denetle",
  },
  footer: {
    tagline: "Yapay zekâ arama görünürlüğü için açık kaynak araç seti.",
    cols: [
      { title: "Ürün", links: [["Ücretsiz denetim", "/tr#top"], ["Ürün", "/tr/urun"], ["Kimin için", "/tr/kimin-icin"], ["Nasıl çalışır", "/tr/nasil-calisir"], ["Fiyatlar", "/tr/fiyatlar"]] },
      { title: "Kaynaklar", links: [["GEO rehberi", "/tr/rehber"], ["Yöntem", "/tr/yontem"], ["Geliştiriciler", "/tr/gelistiriciler"], ["GitHub", "REPO"]] },
      { title: "Şirket", links: [["Yatırımcılar", "/tr/yatirimci"], ["Softmain", "https://softmain.com.tr"], ["English", "/"]] },
    ],
    legal: "Açık kaynak GEO aracı · AGPL-3.0",
    madeBy: "Bir ürünüdür",
  },
};

export const LANDING: Record<Lang, LandingDict> = { en, tr };
