# Element hooks

```css
#my-element {
  --cssx-on-mount: /* code */;
  --cssx-on-update: /* code */;
  --cssx-on-click: /* code */;
}
```


## Mount

Mount is mount. Remember when react used to call it that? Yeah, fun times.
It'll allow you to run code as soon as the element in the dom.

```css
#my-element {
  --cssx-on-mount: add-class('animate');
}
```


## Update

The way you manage state in css-everything is as css custom properties.
Sometimes you may need to react to those changes. That's where the update hook comes in.
The update hook gets called every time a css property on the element is updated via the `update` function.

NOTE: Update hook is only called for the element that gets updated, not it's children.

```css
#my-element {
  background-color: Salmon;
  color: PowderBlue;

  --my-state: false;
  --cssx-on-update: if(get-var(--my-state), add-class('some-state'), remove-class('some-state'));

  --cssx-children: button#my-btn;
}

#my-element.some-state {
  background-color: PapayaWhip;
  color: SeaShell;
}

/* #my-btn has access to --is-visible because it is #my-element's child */
#my-btn {
  --cssx-on-click: update(my-element, --is-visible, if(get-var(--my-state), true, false));
}
```


## Events

Other than the above 2 events, the rest are just standard browser events.

Only the following are supported as of right now as my fingers are typing this out -

- `--cssx-on-click`
- `--cssx-on-focus`
- `--cssx-on-blur`
- `--cssx-on-submit`

Adding support for most other events is pretty trivial. I'm just kinda lazy.


