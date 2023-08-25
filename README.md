<center>
  <img src="./media/banner.png" />
</center>

---

A ui library where you only write CSS. No HTML, no JS, no build system, only CSS (kinda).

> Disclaimer: Don't use this


## Usage

- [Read the documentation](https://github.com/phenax/css-everything/tree/main/docs/README.md) to become enlightened.
- [Here's how this works](https://github.com/phenax/css-everything/tree/main/docs/how-it-works.md).


### Simple example
You can start by adding the script tag for the renderer inside the body

```html
<!-- index.html -->
<html lang="en">
  <head>
    <link href="./style.css" rel="stylesheet" />
  </head>
  <body>
    <script async defer src="https://unpkg.com/@css-everything/render/dist/renderer/index.js"></script>
  </body>
</html>
```

```css
/* style.css */

:root {
  /* creates 2 elements main and button */
  --cssx-children: main#main-el button#my-button;
}

#main-el {
  --text: "<stuff>";
}
#main-el::after {
  content: var(--text);
}

#my-button {
  --cssx-text: "Click me";
  /* On click, waits for 1 second and then updates the --text property #main-el */
  --cssx-on-click:
    update(main-el, --text, "Loading...")
    delay(1s)
    update(main-el, --text, "Hello world!");
}
```

[Here's the code in action](https://codepen.io/phenax/pen/gOZOLgR?editors=1100)

> "Wow. You couldn't come up with a more boring example if you tried."

Alright. You don't have to be mean about it.
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

