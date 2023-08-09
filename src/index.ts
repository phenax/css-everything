const UNSET_PROPERTY_VALUE = '<unset>';

const getPropertyValue = ($element: HTMLElement, prop: string) => {
  const value = `${getComputedStyle($element).getPropertyValue(prop)}`.trim()
  return !value || value === UNSET_PROPERTY_VALUE ? '' : value;
};

const getChildrenIds = ($element: HTMLElement) => {
  const value = getPropertyValue($element, '--cssx-children')
  return value.split(/\s*,\s*/g).filter(Boolean)
}

const handleEvents = ($element: HTMLElement) => {
  const eventHandlers = {
    click: '--cssx-on-click',
    load: '--cssx-on-load',
  }

  Object.entries(eventHandlers).forEach(([event, property]) => {
    const handlerExpr = getPropertyValue($element, property);
    if (handlerExpr) {
      // TODO: Parse onclick
      console.log($element.id, event, handlerExpr);
    }
  });
};

let iters = 0;
const manageElement = ($element: HTMLElement) => {
  if (iters++ > 100) return; // to prevent infinite rec

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


