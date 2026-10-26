/** Platform-aware modifier label for shortcut hints (handlers accept both keys). */
const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

export { MOD_KEY };
