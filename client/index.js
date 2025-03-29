import manifest from '../manifest.json' with { type: 'json' }

const { icons } = manifest;

const PARAM_COLOR = 'color';
const PARAM_BACKGROUND = 'background';
const PARAM_FILTER = 'filter';

const DEFAULT_COLOR = '#000000';
const DEFAULT_BACKGROUND = '#AAAAAA'; // must be 6-digit hex

const searchElement = document.querySelector('#search');
const iconsList = document.querySelector('#icons-list');
const overrideColorElement = document.querySelector('#override-color');
const colorElement = document.querySelector('#color');
const backgroundColorElement = document.querySelector('#background-color');
const iconTemplate = document.querySelector('#icon-template');
const toastElement = document.querySelector('#toast');

const getQueryParams = () => location.search
  .slice(1)
  .split('&')
  .filter(Boolean)
  .map(pair => pair.split('='))
  .reduce((acc, [key, value]) =>
    Object.assign(acc, { [key]: value === undefined ? true : value }), {});

const getQueryParam = key =>
  getQueryParams()[key];

/** A value of undefined will remove the key. */
const setQueryParam = (key, value) => {
  const queryParams = getQueryParams();

  if (!value) {
    delete queryParams[key];
  } else {
    queryParams[key] = value;
  }

  history.pushState(null, null, `${location.pathname}${toQueryString(queryParams)}`);
}

const toQueryString = queryParams =>
  Object.keys(queryParams).length
    ? `?${Object.entries(queryParams)
      .filter(([, value]) => value || value === undefined)
      .map(([key, value]) => value ? `${key}=${value}` : key)
      .join('&')}`
    : '';

const buildIcons = container => {
  iconsList.innerHTML = '';
  iconsList.append(...Object.keys(icons).map(buildIcon));
};

const buildIcon = name => {
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
};

const applyFilter = filter => {
  setQueryParam('filter', filter);
  const trimmed = filter.trim().toLowerCase();

  for (const icon of iconsList.children) {
    icon.classList.toggle('hide', trimmed && !icon.name.toLowerCase().includes(trimmed));
  }
};

const applyBackgroundColor = color => {
  setQueryParam(PARAM_BACKGROUND, color === DEFAULT_BACKGROUND ? undefined : color.slice(1));

  iconsList.style.setProperty('--background', color);
  backgroundColorElement.value = color;
};

const applyColor = (overrideColor, color) => {
  setQueryParam(PARAM_COLOR, !overrideColor ? undefined : color.slice(1));

  iconsList.classList.toggle('masked', overrideColor);
  iconsList.style.setProperty('--color', color);

  colorElement.value = color;
  overrideColorElement.checked = overrideColor;
};

const copyToClipboard = async text => {
  await navigator.clipboard.writeText(text);
};

const showToast = text => {
  toastElement.textContent = text;
  toastElement.classList.add('show');

  setTimeout(() => { toastElement.classList.remove('show'); }, 5000);
};

// Initialize
(function initialize() {
  const color = getQueryParam(PARAM_COLOR);
  const backgroundColor = getQueryParam(PARAM_BACKGROUND);

  applyColor(Boolean(color), color ? `#${color}` : DEFAULT_COLOR);
  applyBackgroundColor(backgroundColor ? `#${backgroundColor}` : DEFAULT_BACKGROUND);

  applyFilter(getQueryParam(PARAM_FILTER) || '');

  buildIcons(iconsList);

  searchElement.addEventListener('input',
    ({ target: { value } }) => { applyFilter(value); });

  overrideColorElement.addEventListener('change',
    ({ target: { checked } }) => { applyColor(checked, colorElement.value); })

  colorElement.addEventListener('input',
    ({ target: { value } }) => { applyColor(overrideColorElement.checked, value); });

  backgroundColorElement.addEventListener('input',
    ({ target: { value } }) => { applyBackgroundColor(value); });

  iconsList.addEventListener('click', async ({ target }) => {
    const item = target.closest('.icon');

    if (!item) return;

    await copyToClipboard(item.name);
    showToast(`Item icon name "${item.name}" copied to clipboard!`);
  });
})();