import type { ReactNode } from "react";

export type Kind = "diff" | "md" | "json" | "shell" | "html" | "yaml" | "ts";

/**
 * A deliberately small highlighter: enough colour to read well, no dependency.
 * It works one line at a time, which is all the landing page's snippets need.
 */
export function highlight(line: string, kind: Kind): ReactNode {
  if (kind === "html") return html(line);
  if (kind === "ts") return ts(line);
  if (kind === "yaml") return yaml(line);
  if (/^\s*(#|<!--)/.test(line) && kind !== "md") return <span className="tk-com">{line}</span>;
  if (kind === "diff") {
    if (line.startsWith("+")) return <span className="tk-add">{line}</span>;
    if (line.startsWith("-")) return <span className="tk-del">{line}</span>;
    return <span className="tk-dim">{line}</span>;
  }
  if (kind === "md") {
    if (line.startsWith("#")) return <span className="tk-key">{line}</span>;
    if (line.startsWith(">")) return <span className="tk-str">{line}</span>;
    const m = line.match(/^(- \[)([^\]]+)(\]\()([^)]+)(\))$/);
    if (m) return <>{m[1]}<span className="tk-key">{m[2]}</span>{m[3]}<span className="tk-url">{m[4]}</span>{m[5]}</>;
    return line;
  }
  if (kind === "shell") {
    if (line.startsWith("$")) return <><span className="tk-prompt">$</span>{tokens(line.slice(1))}</>;
    const status = line.match(/^(\s*)(PASS|WARN|FAIL)(.*)$/);
    if (status) {
      const cls = status[2] === "PASS" ? "tk-add-fg" : status[2] === "WARN" ? "tk-warn" : "tk-fail";
      return <>{status[1]}<span className={cls}>{status[2]}</span>{tokens(status[3])}</>;
    }
  }
  return tokens(line);
}

/** Strings, numbers and flags: shared by shell, JSON and plain output. */
function tokens(line: string): ReactNode {
  const parts = line.split(/("(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b|--?[a-z-]+)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    if (/^".*"$/.test(p)) return <span key={i} className={isKey(parts, i) ? "tk-key" : "tk-str"}>{p}</span>;
    if (/^\d/.test(p)) return <span key={i} className="tk-num">{p}</span>;
    if (/^--?[a-z]/.test(p)) return <span key={i} className="tk-flag">{p}</span>;
    return p;
  });
}

/** A quoted string is a JSON key when the text right after it starts with a colon. */
function isKey(parts: string[], i: number): boolean {
  return (parts[i + 1] ?? "").trimStart().startsWith(":");
}

function html(line: string): ReactNode {
  const parts = line.split(/(<!--.*?-->|<\/?[A-Za-z][\w-]*|\/?>|"[^"]*")/g);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith("<!--")) return <span key={i} className="tk-com">{p}</span>;
    if (/^<\/?[A-Za-z]/.test(p) || p === ">" || p === "/>") return <span key={i} className="tk-tag">{p}</span>;
    if (p.startsWith('"')) return <span key={i} className="tk-str">{p}</span>;
    // Attribute names sit right before `=`; split() puts them at odd indexes.
    return p.split(/([\w-]+(?==))/g).map((q, j) => (j % 2 ? <span key={j} className="tk-attr">{q}</span> : q));
  });
}

function yaml(line: string): ReactNode {
  if (/^\s*#/.test(line)) return <span className="tk-com">{line}</span>;
  const m = line.match(/^(\s*(?:- )?)([\w.-]+)(:)(.*)$/);
  if (!m) return line;
  const value = m[4].split(/(\$\{\{.*?\}\}|\$[A-Z_]+|--?[a-z-]+|#.*$)/g).map((p, i) => {
    if (!p) return null;
    if (p.startsWith("#")) return <span key={i} className="tk-com">{p}</span>;
    if (p.startsWith("$")) return <span key={i} className="tk-num">{p}</span>;
    if (/^--?[a-z]/.test(p)) return <span key={i} className="tk-flag">{p}</span>;
    return p;
  });
  return <>{m[1]}<span className="tk-key">{m[2]}</span>{m[3]}{value}</>;
}

const TS_WORDS = /\b(export|const|let|async|await|function|return|if|throw|new|import|from|as|type|interface|void|null|true|false)\b/g;

function ts(line: string): ReactNode {
  // One capture group, so split() puts every token (comment, string, number, call name) at an odd index.
  const parts = line.split(/(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*(?=\())/g);
  return parts.map((p, i) => {
    if (i % 2 === 0) {
      return p.split(TS_WORDS).map((q, j) => (j % 2 ? <span key={j} className="tk-kw">{q}</span> : q));
    }
    if (p.startsWith("//")) return <span key={i} className="tk-com">{p}</span>;
    if (/^["'`]/.test(p)) return <span key={i} className="tk-str">{p}</span>;
    if (/^\d/.test(p)) return <span key={i} className="tk-num">{p}</span>;
    return <span key={i} className="tk-fn">{p}</span>;
  });
}
