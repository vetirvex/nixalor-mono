import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { highlightCode, tagHighlighter, tags } from "@lezer/highlight";

/** Same token groups as the editor's highlight style (colors: --code-* tokens). */
const highlighter = tagHighlighter([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], class: "tok-keyword" },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], class: "tok-string" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], class: "tok-number" },
  { tag: [tags.comment, tags.meta], class: "tok-comment" },
  {
    tag: [tags.function(tags.variableName), tags.typeName, tags.className],
    class: "tok-function",
  },
  { tag: [tags.propertyName, tags.attributeName], class: "tok-property" },
]);

const getLanguageName = (code: HTMLElement) =>
  /(?:^|\s)language-(\S+)/.exec(code.className)?.[1] ?? null;

/**
 * Highlights fenced code blocks rendered by marked (`<pre><code class="language-x">`)
 * and adds a language label. Grammars load on demand, like in the editor.
 * Text is inserted as text nodes, so no HTML from the note is ever parsed.
 */
const highlightCodeBlocks = async (root: HTMLElement, isCancelled: () => boolean) => {
  const blocks = [...root.querySelectorAll<HTMLElement>("pre > code")];
  for (const code of blocks) {
    const pre = code.parentElement;
    const name = getLanguageName(code);
    if (!pre || !name || pre.dataset.highlighted) {
      continue;
    }
    pre.dataset.highlighted = "true";
    const description = LanguageDescription.matchLanguageName(languages, name, true);

    const label = document.createElement("span");
    label.className = "code-language";
    label.textContent = description?.name ?? name;
    pre.prepend(label);

    if (!description) {
      continue;
    }
    const support = await description.load();
    if (isCancelled()) {
      return;
    }
    const text = code.textContent ?? "";
    const fragment = document.createDocumentFragment();
    highlightCode(
      text,
      support.language.parser.parse(text),
      highlighter,
      (chunk, classes) => {
        if (classes) {
          const span = document.createElement("span");
          span.className = classes;
          span.textContent = chunk;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(chunk));
        }
      },
      () => fragment.appendChild(document.createTextNode("\n"))
    );
    code.replaceChildren(fragment);
  }
};

export { highlightCodeBlocks };
