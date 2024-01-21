<center>
  <img src="./media/banner.png" />
</center>

---

A ui framework where you only write turing complete CSS. No HTML, no JS, no build system.

> Disclaimer: Don't use this

## Usage
#### Add script tag to the renderer to your html
```html
<script async defer src="https://unpkg.com/@css-everything/render/dist/renderer/index.js"></script>
```

#### Open up a style tag or link a stylesheet
The renderer by default uses the body element. You can use `:root` to describe the starting point.
Here's a simple counter example:
```css
:root {
  --counter: '0';
  --cssx-children: div#count button#decr button#incr;
}

#count::after { content: "Count: " var(--counter); }

#incr {
  --cssx-on-click: update(':root', --counter, calc(get-var(--counter) + 1));
  --cssx-text: "++";
}
#decr {
  --cssx-on-click: update(':root', --counter, calc(get-var(--counter) - 1));
  --cssx-text: "--";
}
```

## More examples
Here are a few live examples for you to try out -
- [Here's a calculator example](https://codepen.io/phenax/pen/PoLjJmL?editors=1100)
- [Here's a todo app example](https://codepen.io/phenax/pen/QWzWGaV?editors=1100)
- [Here's a simple counter example](https://codepen.io/phenax/pen/KKbdZep?editors=1100)
- [Here's a digital & analog clock example](https://codepen.io/phenax/pen/KKbKNeb?editors=1100)
- [More in the examples directory](https://github.com/phenax/css-everything/tree/main/examples)


## Docs
- [Read the documentation](https://github.com/phenax/css-everything/tree/main/docs/README.md) to become enlightened.
- [Here's how this works](https://github.com/phenax/css-everything/tree/main/docs/how-it-works.md).



---


## Frequently Acquisitioned Queries
### Why?
Why not?

### What?
What?

### What time is it?
You can find the answer with [this example](https://codepen.io/phenax/pen/KKbKNeb?editors=1100).

### How does it work?
[Here's how it works](https://github.com/phenax/css-everything/tree/main/docs/how-it-works.md).

### Is this turing complete?
Yep. Not that you asked, but here's how to calculate factorial of a number.

```css
:root { --cssx-children: div#container; }

#container {
  --factorial: func(--n: number)
    if(lte(get-var(--n), 1), 1,
      calc(
        get-var(--n)
        * call(--factorial, map(--n: calc(get-var(--n) - 1)))
      ));

  --cssx-text: string("7! = ", call(--factorial, map(--n: 7)));
}
```

### Escape hatches?
- If you want to directly render some raw html, you can use `--cssx-disgustingly-set-innerhtml`.
- If you want to run js expressions, you can use the `js-eval` function. Eg: `js-eval("new Date().getSeconds()")`

### Does it need a build step?
No. In fact, this'll probably break if you try to use it with a css preprocessor.

