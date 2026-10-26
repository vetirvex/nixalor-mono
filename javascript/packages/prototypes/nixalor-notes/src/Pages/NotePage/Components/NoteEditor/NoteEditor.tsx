import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";
import { foldedRanges, foldKeymap, unfoldEffect } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView, keymap, placeholder } from "@codemirror/view";
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";
import { editorHighlighting, editorTheme } from "./editorTheme";
import { foldEffectsForKeys, headingFolds } from "./headingFolds";
import { imageHandling } from "./imageHandling";
import { livePreview, refreshLinks } from "./livePreview";
import {
  toggleBold,
  toggleInlineCode,
  toggleItalic,
  toggleStrikethrough,
} from "./markdownCommands";
import classes from "./NoteEditor.module.css";
import type { NoteEditorHandle, NoteEditorProps } from "./NoteEditorTypes";
import { createWikiLinkCompletion } from "./wikiLinkCompletion";

const NoteEditor = memo(
  forwardRef<NoteEditorHandle, NoteEditorProps>(
    (
      {
        noteId,
        initialContent,
        onChange,
        onOpenLink,
        linkTargets,
        linkExists,
        placeholder: hint,
        imageLabels,
        foldLabel,
        initialFoldedKeys,
        onFoldsChange,
        onTopLineChange,
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const viewRef = useRef<EditorView | null>(null);
      // CodeMirror extensions are created once; they read the latest props via refs.
      const propsRef = useRef({
        noteId,
        onChange,
        onOpenLink,
        linkTargets,
        linkExists,
        imageLabels,
        foldLabel,
        onFoldsChange,
        onTopLineChange,
      });
      propsRef.current = {
        noteId,
        onChange,
        onOpenLink,
        linkTargets,
        linkExists,
        imageLabels,
        foldLabel,
        onFoldsChange,
        onTopLineChange,
      };

      useEffect(() => {
        const view = new EditorView({
          parent: containerRef.current!,
          state: EditorState.create({
            doc: initialContent,
            extensions: [
              history(),
              drawSelection(),
              EditorView.lineWrapping,
              closeBrackets(),
              markdown({ base: markdownLanguage, codeLanguages: languages }),
              autocompletion({
                override: [createWikiLinkCompletion(() => propsRef.current.linkTargets)],
                icons: false,
              }),
              keymap.of([
                { key: "Mod-b", run: toggleBold },
                { key: "Mod-i", run: toggleItalic },
                { key: "Mod-Shift-x", run: toggleStrikethrough },
                { key: "Mod-`", run: toggleInlineCode },
                ...foldKeymap,
                ...closeBracketsKeymap,
                ...markdownKeymap,
                ...historyKeymap,
                ...defaultKeymap,
                indentWithTab,
              ]),
              placeholder(hint),
              editorTheme,
              editorHighlighting,
              livePreview({
                linkExists: (target) => propsRef.current.linkExists(target),
                onOpenLink: (target) => propsRef.current.onOpenLink(target),
                // A getter, so a language switch reaches widgets drawn later.
                get imageLabels() {
                  return propsRef.current.imageLabels;
                },
              }),
              imageHandling(() => propsRef.current.noteId),
              headingFolds({
                getLabel: () => propsRef.current.foldLabel,
                onFoldsChange: (keys) => propsRef.current.onFoldsChange(keys),
              }),
              EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  propsRef.current.onChange(update.state.doc.toString());
                }
              }),
              EditorView.contentAttributes.of({ spellcheck: "true" }),
            ],
          }),
        });
        viewRef.current = view;

        // Restore the sections that were folded last time.
        const restore = foldEffectsForKeys(view.state, initialFoldedKeys);
        if (restore.length) {
          view.dispatch({ effects: restore });
        }

        // Report the topmost visible line, at most once per frame.
        let frame = 0;
        const onScroll = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const block = view.lineBlockAtHeight(view.scrollDOM.scrollTop);
            propsRef.current.onTopLineChange(view.state.doc.lineAt(block.from).number);
          });
        };
        view.scrollDOM.addEventListener("scroll", onScroll, { passive: true });

        return () => {
          cancelAnimationFrame(frame);
          view.scrollDOM.removeEventListener("scroll", onScroll);
          view.destroy();
          viewRef.current = null;
        };
        // The editor owns its document after mount; later prop changes don't reset it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // New/renamed/deleted files change which links resolve — restyle them.
      useEffect(() => {
        viewRef.current?.dispatch({ effects: refreshLinks.of(null) });
      }, [linkTargets]);

      useImperativeHandle(
        ref,
        () => ({
          focus: () => viewRef.current?.focus(),
          scrollToLine: (lineNumber) => {
            const view = viewRef.current;
            if (!view) {
              return;
            }
            const line = view.state.doc.line(
              Math.min(Math.max(1, lineNumber), view.state.doc.lines)
            );
            // Unfold any section that hides the target line.
            const hiding: { from: number; to: number }[] = [];
            foldedRanges(view.state).between(line.from, line.from, (from, to) => {
              if (from < line.from && to >= line.from) {
                hiding.push({ from, to });
              }
            });
            view.dispatch({
              effects: [
                ...hiding.map((range) => unfoldEffect.of(range)),
                EditorView.scrollIntoView(line.from, { y: "start", yMargin: 24 }),
              ],
            });
          },
          setFoldedKeys: (keys) => {
            const view = viewRef.current;
            const effects = view ? foldEffectsForKeys(view.state, keys) : [];
            if (view && effects.length) {
              view.dispatch({ effects });
            }
          },
          setContent: (content) => {
            const view = viewRef.current;
            const current = view?.state.doc.toString();
            if (!view || current === undefined || current === content) {
              return;
            }
            // Replace only the differing middle part so the cursor and undo stay sane.
            let start = 0;
            while (start < current.length && current[start] === content[start]) {
              start++;
            }
            let end = 0;
            while (
              end < current.length - start &&
              end < content.length - start &&
              current[current.length - 1 - end] === content[content.length - 1 - end]
            ) {
              end++;
            }
            view.dispatch({
              changes: {
                from: start,
                to: current.length - end,
                insert: content.slice(start, content.length - end),
              },
            });
          },
        }),
        []
      );

      return <div ref={containerRef} className={classes.noteEditor} />;
    }
  )
);
NoteEditor.displayName = "NoteEditor";

export { NoteEditor };
