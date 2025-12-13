import { defaultHTML } from "@/lib/consts";
import { HtmlHistory, Page } from "@/types";
import { useState } from "react";

export const useEditor = (initialPages?: Page[], initialPrompts?: string[], initialHtmlStorage?: string) => {
  /**
   * State to manage the HTML content of the editor.
   * This will be the main content that users edit.
   */
  const [pages, setPages] = useState<Array<Page>>(initialPages ??[
    {
      path: "index.html",
      html: initialHtmlStorage ?? defaultHTML,
    },
  ]);
  /**
   * State to manage the history of HTML edits.
   * This will store previous versions of the HTML content along with metadata. (not saved to DB)
   */
  const [htmlHistory, setHtmlHistory] = useState<HtmlHistory[]>([]);

  /**
   * State to manage the prompts used for generating HTML content.
   * This can be used to track what prompts were used in the editor.
   */
  const [prompts, setPrompts] = useState<string[]>(
    initialPrompts ?? []
  );


  return {
    htmlHistory,
    setHtmlHistory,
    prompts,
    pages,
    setPages,
    setPrompts,
  };
};
