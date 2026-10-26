export default {
  defaultSeverity: "warning",
  extends: ["stylelint-config-standard", "stylelint-config-css-modules"],
  rules: {
    "nesting-selector-no-missing-scoping-root": null,
    "property-no-deprecated": null,
    "selector-attribute-quotes": ["always", { disableFix: true }],
    "alpha-value-notation": "number",
    "media-feature-range-notation": "prefix",
    "import-notation": null,
  },
};
