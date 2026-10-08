# Review page sections

`build.mjs` injects every `*.js` file here, in filename order, into `template.html` at `/*SECTIONS_JS*/`.

Each file registers a section:

```js
window.SPEC_SECTIONS.push({
  id: "example",
  title: "Example",
  render(spec, report) {
    return "<p>Shown after the built-in sections.</p>";
  },
});
```

Return `null` from `render` to skip the section. Add `NN-area.js` for a later lane. Do not edit `template.html` to add a section.
