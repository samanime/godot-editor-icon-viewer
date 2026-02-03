import manifest from '../manifest.json' with { type: 'json' }

const { icons } = manifest;
const iconsTotal = Object.keys(icons).length;

const PARAM_COLOR = 'color';
const PARAM_BACKGROUND = 'background';
const PARAM_FILTER = 'filter';

const DEFAULT_COLOR = '#000000';
const DEFAULT_BACKGROUND = '#AAAAAA'; // must be 6-digit hex

const searchInput = document.querySelector('#search-bar');
const clearButton = document.querySelector('#clear');
const searchInfo = document.querySelector('#search-info');
const iconsList = document.querySelector('#icons-list');
const overrideColorElement = document.querySelector('#override-color');
const colorElement = document.querySelector('#color');
const backgroundColorElement = document.querySelector('#background-color');
const iconTemplate = document.querySelector('#icon-template');
const toastElement = document.querySelector('#toast');

function getQueryParams() {
  return location.search
    .slice(1)
    .split('&')
    .filter(Boolean)
    .map(pair => pair.split('='))
    .reduce((acc, [key, value]) =>
      Object.assign(acc, { [key]: value === undefined ? true : value }), {});
}

function getQueryParam(key) {
  return getQueryParams()[key];
}

/** A value of undefined will remove the key. */
function setQueryParam(key, value) {
  const queryParams = getQueryParams();

  if (!value) {
    delete queryParams[key];
  } else {
    queryParams[key] = value;
  }

  history.pushState(null, null, `${location.pathname}${toQueryString(queryParams)}`);
}

function toQueryString(queryParams) {
  return Object.keys(queryParams).length
    ? `?${Object.entries(queryParams)
      .filter(([, value]) => value || value === undefined)
      .map(([key, value]) => value ? `${key}=${value}` : key)
      .join('&')}`
    : '';
}

function buildIcons() {
  iconsList.innerHTML = '';
  iconsList.append(...Object.keys(icons).map(buildIcon));
}

function buildIcon(name) {
  const { path } = icons[name];
  const element = iconTemplate.content.cloneNode(true);

  const first = element.firstElementChild;
  first.name = name;
  first.title = name;

  const nameElement = element.querySelector('.name');
  nameElement.textContent = name;

  const image = element.querySelector('img');
  image.src = path;
  image.alt = name;

  element.querySelector('.mask').style.maskImage = `url(${path})`;

  return element;
}

function applyFilter(filter) {
  setQueryParam('filter', filter);
  const trimmed = filter.trim().toLowerCase();

  let count = 0;
  for (const icon of iconsList.children) {
    const hide = trimmed && !icon.name.toLowerCase().includes(trimmed);
    count += hide ? 0 : 1;
    icon.classList.toggle('hide', hide);
  }

  searchInput.value = filter;
  searchInfo.textContent = `Showing ${count} of ${iconsTotal}`;
}

function applyBackgroundColor(color) {
  setQueryParam(PARAM_BACKGROUND, color === DEFAULT_BACKGROUND ? undefined : color.slice(1));

  iconsList.style.setProperty('--background', color);
  backgroundColorElement.value = color;
}

function applyColor(overrideColor, color) {
  setQueryParam(PARAM_COLOR, !overrideColor ? undefined : color.slice(1));

  iconsList.classList.toggle('masked', overrideColor);
  iconsList.style.setProperty('--color', color);

  colorElement.value = color;
  overrideColorElement.checked = overrideColor;
}

function applyVersion(version, repo, commit) {
  const versionElement = document.querySelector('#version');

  versionElement.innerHTML = versionElement.innerHTML
    .replace('%VERSION%', version)
    .replace('%COMMIT%', commit.substring(0, 7))
    .replace('%COMMIT_URL%', `${repo.replace(/\.git$/, '')}/tree/${commit}`);
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function showToast(text) {
  toastElement.textContent = text;
  toastElement.classList.add('show');

  setTimeout(() => { toastElement.classList.remove('show'); }, 5000);
}

// Initialize
(function initialize() {
  const color = getQueryParam(PARAM_COLOR);
  const backgroundColor = getQueryParam(PARAM_BACKGROUND);

  applyColor(Boolean(color), color ? `#${color}` : DEFAULT_COLOR);
  applyBackgroundColor(backgroundColor ? `#${backgroundColor}` : DEFAULT_BACKGROUND);

  buildIcons(iconsList);
  applyFilter(getQueryParam(PARAM_FILTER) || '');
  applyVersion(manifest.version, manifest.repo, manifest.commit);

  searchInput.addEventListener('input',
    ({ target: { value } }) => { applyFilter(value); });

  overrideColorElement.addEventListener('change',
    ({ target: { checked } }) => { applyColor(checked, colorElement.value); })

  colorElement.addEventListener('input',
    ({ target: { value } }) => { applyColor(true, value); });

  backgroundColorElement.addEventListener('input',
    ({ target: { value } }) => { applyBackgroundColor(value); });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    applyColor(false, DEFAULT_COLOR, DEFAULT_BACKGROUND);
    applyBackgroundColor(DEFAULT_BACKGROUND);
    applyFilter('');
  });

  iconsList.addEventListener('click', async ({ target }) => {
    const item = target.closest('.icon');

    if (!item) return;

    await copyToClipboard(item.name);
    showToast(`Item icon name "${item.name}" copied to clipboard!`);
  });
})();