import { Template } from "litscript";

export const template: Template = (content, fm, ctx) => {
  const preamble = `---\n${JSON.stringify(
    {
      title: fm.title || "Default Title",
      description: fm.description || "",
    },
    null,
    2,
  )}\n---\n\n`;

  // return front matter + your rendered content
  return preamble + content;
};
