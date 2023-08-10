const UNSET_PROPERTY_VALUE = '<unset>';
const EVENT_HANDLERS = {
  click: '--cssx-on-click',
  load: '--cssx-on-load',
}

const injectStyles = () => {
  const STYLE_TAG_CLASS = 'cssx-style-root';
  if (document.querySelector(`.${STYLE_TAG_CLASS}`)) return;

  const $style = document.createElement('style');
  $style.className = STYLE_TAG_CLASS;

  const properties = [
    '--cssx-children',
    ...Object.values(EVENT_HANDLERS),
  ];

  $style.textContent = `.cssx-layer {
    ${properties.map(p => `${p}: ${UNSET_PROPERTY_VALUE};`).join(' ')}
  }`;

  document.body.appendChild($style);
}

const getPropertyValue = ($element: HTMLElement, prop: string) => {
  const value = `${getComputedStyle($element).getPropertyValue(prop)}`.trim()
  return !value || value === UNSET_PROPERTY_VALUE ? '' : value;
};

const getChildrenIds = ($element: HTMLElement) => {
  const value = getPropertyValue($element, '--cssx-children')
  return value.split(/(\s*,\s*)|\s*/g).filter(Boolean)
}

const handleEvents = ($element: HTMLElement) => {
  Object.entries(EVENT_HANDLERS).forEach(([event, property]) => {
    const handlerExpr = getPropertyValue($element, property);
    if (handlerExpr) {
      // TODO: Parse onclick
      // TODO: attach handler for eval
      console.log(event, handlerExpr);
    }
  });
};

let iters = 0;
const manageElement = ($element: HTMLElement) => {
  if (iters++ > 100) return; // NOTE: Temporary. To prevent infinite rec

  handleEvents($element);

  const $childrenRoot = Object.assign(document.createElement('div'), {
    className: 'cssx-layer',
  });
  $element.appendChild($childrenRoot);

  const childrenIds = getChildrenIds($element);
  for (const id of childrenIds) {
    const $child = Object.assign(document.createElement('div'), { id });
    $childrenRoot.appendChild($child);
    manageElement($child);
  }
}

interface Options {
  root?: HTMLElement;
}
const render = ({ root = document.body }: Options = {}) => {
  injectStyles();
  manageElement(root);
}

render();

