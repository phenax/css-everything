<center>
  <img src="./media/banner.png" />
</center>

---

A ui framework where you only write turing complete CSS. No HTML, no JS, no build system.

> Disclaimer: Don't use this


## Docs

- [Read the documentation](https://github.com/phenax/css-everything/tree/main/docs/README.md) to become enlightened.
- [Here's how this works](https://github.com/phenax/css-everything/tree/main/docs/how-it-works.md).


## Examples
All the magic starts with adding the renderer script tag to your html and having a `--cssx-children` property set on your `body` -
```html
<script async defer src="https://unpkg.com/@css-everything/render/dist/renderer/index.js"></script>
```

Here are a few live examples for you to try out -
- [Here's a counter example](https://codepen.io/phenax/pen/KKbdZep?editors=1100)
- [Here's a todo app example](https://codepen.io/phenax/pen/QWzWGaV?editors=1100)
- [Here's a clock example](https://codepen.io/phenax/pen/KKbKNeb?editors=1100)
- [More in the examples directory](https://github.com/phenax/css-everything/tree/main/examples)


---


## Frequently Acquisitioned Queries
### Why?
Why not?

### What?
What?

### What time is it?
Why don't you ask that to [this example](https://codepen.io/phenax/pen/KKbKNeb?editors=1100)?

### How does it work?
[Here's how it works](https://github.com/phenax/css-everything/tree/main/docs/how-it-works.md).

### Does it parse the entire css
No. The browser does most of it. Only the fancy `--cssx-*` properties use a custom parser.

