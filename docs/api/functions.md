# Functions

```typescript
type custom-property-name = `--${string}`
type selector = string // Any css selector or identifier (used as id)
type condition = string // empty string, 0, 'false', "'false'" and "\"false\"" are all false, the rest are fine. Don't ask.
type duration = number | `${number}ms` | `${number}s`
type pair = string: any
```

===


## Core

### get-var / var
Get css custom property from an element. Basically var but evaluated lazily.

NOTE: Avoid using `var` inside cssx expressions.

```typescript
function get-var(custom-property-name): string
function get-var(custom-property-name, default-value): string
```

Example -
```css
#my-element {
  --cssx-text: get-var(--some-variable);
}
```

### calc
Do some math using the calc syntax. Not 100% compatible but it'll do.

Supported units: rem, em, px, %, ms, s

```typescript
function calc(calc-expr): string
```

Example -
```css
#my-element {
  --cssx-text: calc(1 + 5 * get-var(--some-variable));
}
```


#### update
Update a css custom property on an element

```typescript
function update(custom-property-name, string): void
function update(selector, custom-property-name, string): string
```

Example -
```css
#my-element {
  --cssx-on-click: update(some-el, --text, attr(input-element, 'value'));

  --cssx-children: input#input-element #some-el;
}

#some-el { --text: "default"; }
#some-el::after { content: var(--text); }
```


### if
If expression. You know how this one goes. If truthy, it'll pick the second argument, else the third.

```typescript
function if(condition, any, any): any
```

Example -
```css
#my-element {
  --boolean: false;

  --cssx-on-update:
    update(background-color,
      if(
        get-var(--boolean)
        'DarkGoldenRod',
        'PapayaWhip'
      )
    );
}
```

### map
A constructor function to create a map of key value pairs.

```typescript
function map(...pair): map
```

Example -
```css
#my-element {
  --cssx-children: instance(
    div#some-element,
    map(--prop1: "hello", --prop2: "world")
  );
}
```

### seq
> WIP Docs

### call
Call a "function". A function is any series of expressions defined in a css custom property.

NOTE: Every function call creates a new dom node for computing the result. Dom nodes are the call stack.

```typescript
function call(var-identifier, map): any
```

Example -
```css
#my-element {
  --factorial: if(
    js-eval(string(get-var(--n), '> 1')),
    js-eval(string(
      get-var(--n),
      ' * ',
      call(--factorial, map(--n: js-eval(string(get-var(--n), ' - 1'))))
    )),
    1
  );

  --cssx-on-mount: js-eval(string(
    'console.log("',
      call(--factorial, map(--n: 5)),
    '")'
  ));
}
```

Or let's just go nuts with functions.
Because we use named properties as arguments and css is cascading, all named properties are implicitly available to everything getting called.

> Not a design choice, a design consequence.

So `--left` and `--right` is implicitly available to `--binary-op`.

NOTE: `func` in `--binary-op` doesn't do anything. It's to make the developer feel better.

```css
#my-element {
  --binary-op:
    func(--left, --op, --right)
    js-eval(string(get-var(--left), get-var(--op), get-var(--right)));
  --greater-than: call(--binary-op, map(--op: ' >= '));
  --minus: call(--binary-op, map(--op: ' - '));
  --multiply: call(--binary-op, map(--op: ' * '));

  --factorial: if(call(--greater-than, map(--left: get-var(--n), --right: 1)),
    call(--multiply, map(
      --left: get-var(--n),
      --right: call(--factorial,
        map(--n: call(--minus,
          map(--left: get-var(--n), --right: 1)))
      )
    )),
    1
  );
}
```

### string
Concatenate strings together / Cast a value to string explicitly

```typescript
function string(...string): string
```

```css
#my-element {
  --log-stuff: 'Stuff to log to console';
  --cssx-on-mount: js-eval(string('console.log("', get-var(--log-stuff), '")'));
}
```

### quotify
Add quotes around a value

```typescript
function quotify(string): `'${string}'`
```

```css
#my-element {
  --log-stuff: 'Stuff to log to console';
  --cssx-on-mount: js-eval(string('console.log(', quotify(get-var(--log-stuff)), ')'));
}
```


### unquotify
Remove quotes from a value. No example here, use your imagination.

```typescript
function quotify(string): string
```


### do
Evaluate a series of expressions in sequence and return the last value.

```css
#my-element {
  --cssx-on-mount:
    if(get-var(--some-boolean),
      do(
        add-class(loading),
        delay(1s),
        remove-class(loading)
      ),
      noop(),
    )
  ;
}
```


### try
The standard try/catch as an expression. The error expression is scoped and gets access to a `--error` value.

```css
form#my-form {
  --cssx-on-submit:
    prevent-default()
    add-class(form, 'submitting')
    try(
      do(
        request('/your-api/some-api', 'POST'),
        add-class(form, 'submitted')
      ),
      js-eval(string('alert("', get-var(--error), '")'))
    )
    remove-class(form, 'submitting')
  ;
}
```

### let
Create a binding for use inside a scoped expression.

`--random` is only available within the let binding
```css
#my-element {
  --cssx-on-mount:
    let(--random, js-eval('Math.random()'),
      js-eval('alert("', get-var(--random),'")')
    )
  ;
}
```


===


## Others

### js-eval
Evaluate any js expression. Easy escape hatch directly to hell.

```typescript
function js-eval(string): string
```

### request
> WIP Docs

### delay
Wait a bit.

```typescript
function delay(duration): void
```

Examples for input -
- `delay(100)`: wait for 100 milliseconds
- `delay(100ms)`: wait for 100 milliseconds
- `delay(5s)`: wait for 5 seconds
- `delay(0.5s)`: wait for 500 milliseconds


===


## DOM

### load-cssx
Load more of this abomination into your page


### set-attr


### attr


### add-children


### remove-element


### prevent-default


### call-method


