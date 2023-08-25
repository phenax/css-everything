# Properties

## Children

Property: `--cssx-children`

The way you build out the dom of your application is using the `--cssx-children` property.

```css
#my-element {
  --cssx-children:
    div#my-element.some-class
    input#input-el[type=email][placeholder="Some placeholder"]
    instance(div#my-component, map(--css-prop: "some value"))
  ;
}
```

* `div#my-element.some-class`: div with id = `my-element` and class = `some-class`
* `input#input-el[type=email][placeholder="Some placeholder"]`: input element with input-el id and, `type` and `placeholder` attributes set.
* `instance(div#my-component, map(--css-prop: "some value", --other: "Yo"))`: Creates an instance of `my-component` with the `--css-prop` and `--other` css custom properties set.


## Text

Property: `--cssx-text`

To set the text content of an element, you can use the `--cssx-text` property.

NOTE: As of writing this, `--cssx-text` is only set on mount and is not updated. Will fix that whenever, probably.

```css
#my-element {
  --cssx-text: "Hey. What's up? Dom element here.";
}
```


## Raw HTML

Property: `--cssx-disgustingly-set-innerhtml`

You can set arbitrary html in your content. Any html set directly will not be managed by css-everything.

NOTE: Try to avoid doing this. Please refer to [security.md](../security.md) for more information.

```css
#my-element {
  --cssx-disgustingly-set-innerhtml: "<script>alert('H@x0r has hacked you')</script>";
}
```


## Others

Every other css property on your elements is a piece of state that every one of your children and grand-children can inherit it. Although, the `--cssx-on-update` hook will only be called for the element that was updated.

