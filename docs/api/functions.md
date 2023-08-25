# Functions

```typescript
type custom-property-name = `--${string}`
type selector = string // Any css selector or identifier (used as id)
type condition = string // empty string, 0, 'false', "'false'" and "\"false\"" are all false, the rest are fine. Don't ask.
type duration = number | `${number}ms` | `${number}s`
```

## get-var
Get css custom property from an element

NOTE: Avoid using `var` inside cssx expressions.

```typescript
function get-var(custom-property-name): string
function get-var(selector, custom-property-name): string
```

## update
Update a css custom property on an element

```typescript
function update(custom-property-name, string): void
function update(selector, custom-property-name, string): string
```


## js-eval
Evaluate any js expression. Easy escape hatch into writing the worst code humanly possible.

```typescript
function js-eval(string): string
```


## if
If expression. You know how this one goes. If truthy, it'll pick the second argument, else the third.

```typescript
function if(condition, any, any): any
```


## delay
Wait a bit.

```typescript
function delay(duration): void
```

Examples for input -
- `delay(100)`: wait for 100 milliseconds
- `delay(100ms)`: wait for 100 milliseconds
- `delay(5s)`: wait for 5 seconds
- `delay(0.5s)`: wait for 500 milliseconds


## load-cssx


## set-attr


## attr


## prevent-default


## request


## add-children


## remove-element


## call-method


## map


## call


## func


