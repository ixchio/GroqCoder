export const htmlTagToText = (tagName: string): string => {
  switch (tagName.toLowerCase()) {
    case "h1":
      return "Heading 1";
    case "h2":
      return "Heading 2";
    case "h3":
      return "Heading 3";
    case "h4":
      return "Heading 4";
    case "h5":
      return "Heading 5";
    case "h6":
      return "Heading 6";
    case "p":
      return "Text Paragraph";
    case "span":
      return "Inline Text";
    case "button":
      return "Button";
    case "input":
      return "Input Field";
    case "select":
      return "Select Dropdown";
    case "textarea":
      return "Text Area";
    case "form":
      return "Form";
    case "table":
      return "Table";
    case "thead":
      return "Table Header";
    case "tbody":
      return "Table Body";
    case "tr":
      return "Table Row";
    case "th":
      return "Table Header Cell";
    case "td":
      return "Table Data Cell";
    case "nav":
      return "Navigation";
    case "header":
      return "Header";
    case "footer":
      return "Footer";
    case "section":
      return "Section";
    case "article":
      return "Article";
    case "aside":
      return "Aside";
    case "div":
      return "Block";
    case "main":
      return "Main Content";
    case "details":
      return "Details";
    case "summary":
      return "Summary";
    case "code":
      return "Code Snippet";
    case "pre":
      return "Preformatted Text";
    case "kbd":
      return "Keyboard Input";
    case "label":
      return "Label";
    case "canvas":
      return "Canvas";
    case "svg":
      return "SVG Graphic";
    case "video":
      return "Video Player";
    case "audio":
      return "Audio Player";
    case "iframe":
      return "Embedded Frame";
    case "link":
      return "Link";
    case "a":
      return "Link";
    case "img":
      return "Image";
    case "ul":
      return "Unordered List";
    case "ol":
      return "Ordered List";
    case "li":
      return "List Item";
    case "blockquote":
      return "Blockquote";
    default:
      return tagName.charAt(0).toUpperCase() + tagName.slice(1);
  }
};
