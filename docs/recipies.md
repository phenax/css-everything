# Recipies

Here's some stuff you can do with this


## Fishy HTML

You can set arbitrary html in your content. Any html set directly will not be managed by css-everything.

NOTE: Try to avoid doing this. Please refer to [./security.md](./security.md) for more information.

```css
#my-element {
  --cssx-disgustingly-set-innerhtml: "<script>alert('H@x0r has hacked you')</script>";
}
```


## Spicy forms

```css
#wrapper {
  --cssx-children: form#my-form;
}

#my-form {
  --cssx-on-submit:
    prevent-default()
    add-class('loading')
    request('/some-api', 'PUT')
    remove-class('loading')
  ;

  --cssx-children:
    input#email-input[type="email"][placeholder="Email"]
    input#password-input[type="password"][placeholder="Password"]
    input#submit-btn[type="submit"]
  ;
}

#submit-btn {
  --cssx-text: "Log in";
}
```


## Infinite soup

```css
#my-element {
  --cssx-on-mount: update(--random, '0');
  --cssx-on-update: delay(500ms) update(--random, js-expr('Math.random()'));
}

#my-element::after {
  content: var(--random);
}
```


## Re-usable plates / Components / Instances

```css
#my-element {
  --cssx-on-click:
    add-children(
      my-element,
      instance(#my-component, map(--text: "A new item"))
    )
  ;

  --cssx-children:
    instance(#my-component, map(--text: "First item"))
    instance(#my-component, map(--text: "Second item"))
    instance(#my-component, map(--text: "Third item"))
  ;
}

/* Use data-instance for selecting instances and data-element for selecting children of instances */
[data-instance=my-component] {
  --text: "Some default text";

  --cssx-children: div#child;
}

[data-instance=my-component]::before {
  content: var(--text);
}

[data-element=child] {
  color: 1px solid BlanchedAlmond;
  background-color: DarkGoldenRod;

  --cssx-text: "Some text";
}
```


## Debugging call stack

> WIP docs


