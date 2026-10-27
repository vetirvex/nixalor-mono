const pickFile = () =>
  new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    // No `accept` filter on purpose: macOS has no system file type for
    // ".excalidraw", so Finder greys those files out. Content is validated instead.
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), {
      once: true,
    });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });

export { pickFile };
