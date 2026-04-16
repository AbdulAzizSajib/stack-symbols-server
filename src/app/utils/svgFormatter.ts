export interface SvgFormatOptions {
  width?: number;
  height?: number;
}

export const formatSvg = (svgContent: string, options: SvgFormatOptions = {}): string => {
  const { width, height } = options;

  if (width === undefined && height === undefined) return svgContent;

  const svgTagMatch = svgContent.match(/<svg\b([^>]*)>/i);
  if (!svgTagMatch || svgTagMatch.index === undefined) return svgContent;

  const originalAttrs = svgTagMatch[1] ?? "";
  const openingTagEnd = svgTagMatch.index + svgTagMatch[0].length;

  let newAttrs = originalAttrs;
  if (width !== undefined) {
    newAttrs = newAttrs.replace(/\bwidth\s*=\s*"[^"]*"/i, "");
    newAttrs += ` width="${width}"`;
  }
  if (height !== undefined) {
    newAttrs = newAttrs.replace(/\bheight\s*=\s*"[^"]*"/i, "");
    newAttrs += ` height="${height}"`;
  }

  return `<svg${newAttrs}>${svgContent.slice(openingTagEnd)}`;
};
