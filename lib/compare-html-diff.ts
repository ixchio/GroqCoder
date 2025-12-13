import { defaultHTML } from "./consts";

export const isTheSameHtml = (currentHtml: string): boolean => {
  const normalize = (html: string): string =>
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s+/g, " ")
      .trim();

  return normalize(defaultHTML) === normalize(currentHtml);
};
