export function findDivsByText(text) {
  const divs = document.querySelectorAll('div');
  const matchedDivs = [];
  for (const div of divs) {
    if (div.textContent === text) {
      matchedDivs.push(div);
    }
  }
  return matchedDivs.length > 0 ? matchedDivs : null;
}

export function findButtonsByText(text) {
  const buttons = document.querySelectorAll('div[role="button"]');
  const matchedButtons = [];
  for (const button of buttons) {
    if (button.textContent === text) {
      matchedButtons.push(button);
    }
  }
  return matchedButtons.length > 0 ? matchedButtons : null;
}

export const findClosestParent = (element, selector) => {
  let parent = element;
  while (parent.parentNode && !parent.querySelector(selector)) {
    parent = parent.parentNode;
  }
  return parent.querySelector(selector);
};

export function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
