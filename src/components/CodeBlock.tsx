import { highlight, type Kind } from "@/lib/highlight";
import { CopyButton } from "./CopyButton";

/** Numbered, highlighted lines. Each line carries its index so CSS can stagger the reveal. */
export function CodeLines({ code, kind, label }: { code: string; kind: Kind; label?: string }) {
  return (
    <pre className="code-body" aria-label={label} tabIndex={0}>
      {code.split("\n").map((line, i) => (
        <span className="ln" key={i} style={{ "--i": i } as React.CSSProperties}>
          <span className="ln-no" aria-hidden>{i + 1}</span>
          <code>{highlight(line, kind) || " "}</code>
        </span>
      ))}
    </pre>
  );
}

/** A code window: title bar with the file name, optional copy button, and the lines. */
export function CodeBlock({ file, kind, code, labels, caption, tone, reveal = true, delay = 0 }: {
  file: string;
  kind: Kind;
  code: string;
  labels?: { copy: string; copied: string };
  caption?: string;
  /** Tints the window edge: `bad` for the failing example, `good` for the passing one. */
  tone?: "good" | "bad";
  reveal?: boolean;
  delay?: number;
}) {
  return (
    <figure className={`code-win${tone ? ` ${tone}` : ""}`} {...(reveal ? { "data-reveal": "", style: { "--i": delay } as React.CSSProperties } : {})}>
      <figcaption className="code-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="code-file">{file}</span>
        {labels && <CopyButton text={code} labels={labels} />}
      </figcaption>
      <CodeLines code={code} kind={kind} label={file} />
      {caption && <p className="code-cap">{caption}</p>}
    </figure>
  );
}
