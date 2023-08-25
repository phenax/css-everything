# How does it work?
Who knows really? It's just magic for the most part.

## Creating the dom tree

Everything starts with the `body` element (by default).

In your css, you can use `body` or `html` or `:root`. As long as your root (body by default) inherits that property, it's all good.
```css
:root {
  --cssx-children: div#my-element;
}
```

This will create a div inside `body` with the `id` (and `data-element` attribute) of `my-element`.


Let's go deeper...

```css
:root {
  --cssx-children: div#my-element;
}

#my-element {
  --cssx-children: header#div-a main#div-b;
}
```

Now `my-element`, gets 2 children. You can probably figure out what those would look like.

> NOTE: The styles for `#my-element` has to be loaded into the dom before the


You may have already noticed a problem here. If you don't override the --cssx-children property, wouldn't all children of body get access to that?

Well yeah, which is why, we have a `.cssx-layer` element between the parent and children. This element wraps all children and makes it so all the cssx property are unset. This can occasionally make styling a bit difficult but that's a YOU problem for trying to use this.


## Instances
Instances are sort of like components. You can instantiate elements and provide them some custom properties.

NOTE: Instances get unique ids so instances and children of instances cannot not use the id selector for the definition.

```css
#my-element {
  --cssx-children:
    instance(div#user-card, map(--name: "Sugom Afart", --age: 20))
    instance(div#user-card, map(--name: "Leeki Bahol", --age: 69))
    instance(div#user-card, map(--name: "Yamam Aho", --age: 40))
  ;
}

[data-instance=user-card] {
  --name: "default name";
  --age: 0;

  --cssx-children: div#name div#age;
}

[data-element=name]::after {
  /* Using the ::after element to set content via css */
  content: "Name: " var(--name);
}
[data-element=age] {
  /* Using the --cssx-text property because css doesn't like numbers in `content` */
  --cssx-text: string("Age: ", get-var(--age));
}
```



## Custom functions

This is by far the most "fun" aspect of this project. Take a look at the docs for [call](./api/functions.md#call) for the api and examples.

```css
#my-element {
  --factorial:
    func(--n)
    if(
      js-expr(string(get-var(--n), '> 1')),
      js-expr(string(
        get-var(--n),
        ' * ',
        call(--factorial, map(--n: js-expr(string(get-var(--n), ' - 1'))))
      )),
      1
    );

  --cssx-on-mount: js-expr(string(
    'console.log("',
      call(--factorial, map(--n: 5)),
    '")'
  ));
}
```

NOTE: `func` is noop and just exists for documentation. You can also do `func(--a: string, --b: number)` and it'll be valid syntax but ignored at evaluation. So basically, typescript.

The way this works is that it creates a new dom element inside the caller (`#my-element`), which then becomes the scope for the function.
Whatever arguments are passed to call will be added as css properties to this dom element.
Then the expressions inside the function is evaluated within the context of that element.

This means that with `call(--factorial, map(--n: 5))` the dom tree would look something like this.

```html
<div id="my-element">
  <div class="cssx-layer"></div> <!-- This is where the children would go... if you had any, you virgin -->

  <div style="display: none; --n: 5;">
    <div style="display: none; --n: 4;">
      <div style="display: none; --n: 3;">
        <div style="display: none; --n: 2;">
          <div style="display: none; --n: 1;">
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

This is the call stack. This is immedietely deleted as soon as the required computation is completed.

> PRO TIP 1: If you want the tree to persist even after the function is evaluated for debugging, add the `data-debug-stack` attribute to the caller element
> PRO TIP 2: You could style these nodes to have this tree show up in the ui and use the `--cssx-text` property to display the arguments for each recursive function call
> PRO TIP 3: If you're running into infinite loops, good luck. Also, you can add `delay(1s)` at the start to slow things down to debug.


