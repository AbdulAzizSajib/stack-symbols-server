const MAX_SVG_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const MALICIOUS_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /<script[\s\S]*?>/gi, label: "<script> tag" },
  { pattern: /on\w+\s*=/gi, label: "event handler attribute (onclick, onload, etc.)" },
  { pattern: /javascript\s*:/gi, label: "javascript: URI" },
  { pattern: /vbscript\s*:/gi, label: "vbscript: URI" },
  { pattern: /<iframe/gi, label: "<iframe> tag" },
  { pattern: /<object/gi, label: "<object> tag" },
  { pattern: /<embed/gi, label: "<embed> tag" },
  { pattern: /xlink:href\s*=\s*["']https?:/gi, label: "external xlink:href" },
  { pattern: /href\s*=\s*["']https?:/gi, label: "external href" },
  { pattern: /src\s*=\s*["']https?:/gi, label: "external src" },
  { pattern: /data\s*:\s*text\/html/gi, label: "data:text/html URI" },
  { pattern: /<!--[\s\S]*?-->/g, label: "XML comment" },
  { pattern: /<!ENTITY/gi, label: "XML ENTITY (XXE risk)" },
  { pattern: /<!DOCTYPE/gi, label: "DOCTYPE declaration" },
];

export interface ValidationResult {
  isValid: boolean;
  hasMalicious: boolean;
  errors: string[];
  warnings: string[];
  detectedThreats: string[];
  fileSizeBytes: number;
}

export const validateSvg = (input: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: false,
    hasMalicious: false,
    errors: [],
    warnings: [],
    detectedThreats: [],
    fileSizeBytes: Buffer.byteLength(input, "utf8"),
  };

  // 1. Size check
  if (result.fileSizeBytes > MAX_SVG_SIZE_BYTES) {
    result.errors.push(
      `File too large: ${(result.fileSizeBytes / 1024 / 1024).toFixed(2)}MB (max 2MB)`,
    );
    return result;
  }

  // 2. Empty check
  const trimmed = input.trim();
  if (!trimmed) {
    result.errors.push("SVG content is empty");
    return result;
  }

  // 3. Valid SVG structure
  if (!/<svg[\s>]/i.test(trimmed)) {
    result.errors.push("Content does not contain a valid <svg> opening tag");
    return result;
  }

  if (!/<\/svg>/i.test(trimmed)) {
    result.errors.push("Content does not contain a closing </svg> tag");
    return result;
  }

  // 4. xmlns warning
  if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(trimmed)) {
    result.warnings.push('Missing xmlns="http://www.w3.org/2000/svg" attribute');
  }

  // 5. Malicious pattern check
  for (const { pattern, label } of MALICIOUS_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(trimmed)) {
      result.hasMalicious = true;
      result.detectedThreats.push(label);
    }
    pattern.lastIndex = 0;
  }

  if (result.errors.length === 0) {
    result.isValid = true;
  }

  return result;
};