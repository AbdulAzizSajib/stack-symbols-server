export interface SanitizeResult {
  sanitizedSvg: string;
  removedCount: number;
  removedItems: string[];
}

export const sanitizeSvg = (input: string): SanitizeResult => {
  let svg = input.trim();
  const removedItems: string[] = [];
  let removedCount = 0;

  const strip = (pattern: RegExp, label: string) => {
    const matches = svg.match(pattern);
    if (matches) {
      removedCount += matches.length;
      removedItems.push(`${matches.length}x ${label}`);
      svg = svg.replace(pattern, "");
    }
  };

  // 1. DOCTYPE & ENTITY (XXE)
  strip(/<!DOCTYPE[\s\S]*?>/gi, "DOCTYPE declaration");
  strip(/<!ENTITY[\s\S]*?>/gi, "XML ENTITY declaration");

  // 2. XML comments
  strip(/<!--[\s\S]*?-->/g, "XML comment");

  // 3. <script> blocks
  strip(/<script[\s\S]*?<\/script>/gi, "<script> block");
  strip(/<script[^>]*\/>/gi, "<script> self-closing");

  // 4. Dangerous tags
  for (const tag of ["iframe", "object", "embed", "foreignObject"]) {
    strip(new RegExp(`<${tag}[\\s\\S]*?(?:<\\/${tag}>|\\/>)`, "gi"), `<${tag}> element`);
  }

  // 5. Event handler attributes  (onclick=, onload=, onerror= ...)
  strip(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "event handler attribute");

  // 6. Unsafe URI schemes
  strip(
    /\s+(?:href|src|xlink:href|action)\s*=\s*(?:"(?:javascript|vbscript|data\s*:\s*text\/html)[^"]*"|'(?:javascript|vbscript|data\s*:\s*text\/html)[^']*')/gi,
    "unsafe URI scheme",
  );

  // 7. External http/https refs
  strip(
    /\s+(?:xlink:href|href|src)\s*=\s*(?:"https?:[^"]*"|'https?:[^']*')/gi,
    "external reference",
  );

  // 8. Ensure xmlns present
  if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 9. Normalize whitespace
  svg = svg.replace(/\n{3,}/g, "\n\n").trim();

  return { sanitizedSvg: svg, removedCount, removedItems };
};