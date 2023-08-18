# css-everything
A ui library where you only write CSS. No HTML, no JS, no build system, only CSS (kinda).

> Disclaimer: Don't use this


## Usage

### Docs
WIP. Coming soon maybe?

### Simple example
You can start by adding the script tag for the renderer inside the body
```html
<!-- index.html -->
<html lang="en">
  <head>
    <link href="./style.css" rel="stylesheet" />
  </head>
  <body>
    <script async defer src="https://unpkg.com/@css-everything/render@0.0.1/dist/renderer/index.js"></script>
  </body>
</html>
```

**NOTE:** The HTML needs to have a body element since that is the root of your application by default.

**NOTE_v2:** Styles need to be loaded before the renderer is triggered.

**NOTE_v2_final:** You can load more cssx by using the `load-cssx()` function

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
  --cssx-on-click: update(main-el, --text, "Loading...") delay(1s)
    update(main-el, --text, "Hello world!");
}
```

[Here's the code in action](https://codepen.io/phenax/pen/gOZOLgR?editors=1100)

> "Wow. You couldn't come up with a more boring example if you tried."

Alright. You don't have to be mean about it.
- [Here's a todo example](https://codepen.io/phenax/pen/QWzWGaV?editors=1100)
- [Here's a simple date example](https://codepen.io/phenax/pen/KKbKNeb?editors=1100)
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
It starts by reading the `--cssx-children` property on the body. Which is then parsed and evaluated and the necassary child nodes are created.
For each element that is managed by cssx (i.e. not created via js or html or `--cssx-disgustingly-set-innerhtml` or `js-eval`), we then look for event handler properties present on the node. These properties are parsed and evaluated when the relevant event is triggered.

### Does it parse the entire css
No. The browser does most of it. Only the fancy `--cssx-*` properties use a custom parser.

