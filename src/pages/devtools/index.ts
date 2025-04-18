try {
  chrome.devtools.panels.create('Dev Tools', 'icon32.png', 'src/pages/panel/index.html');
} catch (e) {
  console.error(e);
}
