/**
 * Copy text from inside the preview iframe.
 *
 * The preview runs in a cross-origin iframe, where the async Clipboard API is
 * refused unless the embedding page grants `clipboard-write`. It throws
 * rather than being absent, so falling back only when it is missing never
 * reached the fallback. A hidden textarea plus `execCommand("copy")` still
 * works there during a click.
 */
const copyWithTextarea = (text: string): void => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("The browser blocked clipboard access.");
    }
  } finally {
    document.body.removeChild(textarea);
  }
};

export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Refused by the iframe's permissions policy; use the fallback.
    }
  }
  copyWithTextarea(text);
};
