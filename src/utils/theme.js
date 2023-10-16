import { waitForDOMContentLoaded } from "./async-utils";
import { store } from "./store-instance";

const MAIN_PRIMARY_COLOR = "#2a0a5baa";
const GLASS_EFFECT_COLOR = "#FFFFFFAA";

const DEFAULT_COLORS = {
  "action-color": MAIN_PRIMARY_COLOR,
  "action-label-color": MAIN_PRIMARY_COLOR,
  "action-color-disabled": MAIN_PRIMARY_COLOR,
  "action-color-highlight": MAIN_PRIMARY_COLOR,
  "action-text-color": MAIN_PRIMARY_COLOR,
  "action-subtitle-color": MAIN_PRIMARY_COLOR,
  "notice-background-color": GLASS_EFFECT_COLOR,
  "notice-text-color": MAIN_PRIMARY_COLOR,
  "favorited-color": MAIN_PRIMARY_COLOR,
  "nametag-color": MAIN_PRIMARY_COLOR,
  "nametag-volume-color": MAIN_PRIMARY_COLOR,
  "nametag-text-color": MAIN_PRIMARY_COLOR,
  "nametag-border-color": MAIN_PRIMARY_COLOR,
  "nametag-border-color-raised-hand": MAIN_PRIMARY_COLOR
};

let config = process.env.APP_CONFIG;

if (!config && process.env.STORYBOOK_APP_CONFIG) {
  config = JSON.parse(process.env.STORYBOOK_APP_CONFIG);
}

if (!config) {
  config = window.APP_CONFIG;
}

if (config?.theme?.error) {
  console.error(
    `Custom themes failed to load.\n${config.theme.error}\nIf you are an admin, reconfigure your themes in the admin panel.`
  );
}

const themes = config?.theme?.themes || [];

function getDarkModeQuery() {
  if (typeof window.matchMedia !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)");
  } else {
    return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
  }
}

function registerDarkModeQuery(changeListener) {
  const darkModeQuery = getDarkModeQuery();

  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener("change", changeListener);
  } else {
    darkModeQuery.addListener(changeListener);
  }

  const removeListener = () => {
    if (darkModeQuery.removeEventListener) {
      darkModeQuery.removeEventListener("change", changeListener);
    } else {
      darkModeQuery.removeListener(changeListener);
    }
  };

  return [darkModeQuery, removeListener];
}

function getDefaultTheme() {
  return themes.find(t => t.default) || themes[0];
}

function tryGetTheme(themeId) {
  if (!Array.isArray(themes)) return;

  const theme = themeId && themes.find(t => t.id === themeId);
  if (theme) {
    return theme;
  } else {
    const darkMode = getDarkModeQuery().matches;
    return (darkMode && themes.find(t => t.darkModeDefault)) || getDefaultTheme();
  }
}

function getCurrentTheme() {
  const preferredThemeId = store.state?.preferences?.theme;
  return tryGetTheme(preferredThemeId);
}

function getThemeColor(name) {
  const theme = getCurrentTheme();
  return theme?.variables?.[name] || config?.theme?.[name] || DEFAULT_COLORS[name];
}

function updateTextButtonColors() {
  const actionColor = getThemeColor("action-color");
  const actionHoverColor = getThemeColor("action-color-highlight");

  if (document.querySelector("#rounded-text-button")) {
    document
      .querySelector("#rounded-text-button")
      .setAttribute(
        "text-button",
        `textHoverColor: ${actionHoverColor}; textColor: ${actionColor}; backgroundColor: ${GLASS_EFFECT_COLOR}; backgroundHoverColor: ${GLASS_EFFECT_COLOR};`
      );

    document
      .querySelector("#rounded-button")
      .setAttribute(
        "text-button",
        `textHoverColor: ${actionHoverColor}; textColor: ${actionColor}; backgroundColor: ${GLASS_EFFECT_COLOR}; backgroundHoverColor: ${GLASS_EFFECT_COLOR};`
      );

    document
      .querySelector("#rounded-text-action-button")
      .setAttribute(
        "text-button",
        `textHoverColor: ${actionColor}; textColor: ${actionColor}; backgroundColor: ${actionHoverColor}; backgroundHoverColor: ${actionHoverColor}`
      );

    document
      .querySelector("#rounded-action-button")
      .setAttribute(
        "text-button",
        `textHoverColor: ${actionColor}; textColor: ${actionColor}; backgroundColor: ${actionHoverColor}; backgroundHoverColor: ${actionHoverColor}`
      );
  }
}

function applyThemeToBody() {
  const theme = getCurrentTheme();
  document.body.setAttribute("data-theme", theme.name.toLowerCase().includes("dark") ? "dark" : "light");
}

function onThemeChanged(listener) {
  store.addEventListener("themechanged", listener);
  const [_darkModeQuery, removeDarkModeListener] = registerDarkModeQuery(listener);

  return () => {
    store.removeEventListener("themechanged", listener);
    removeDarkModeListener();
  };
}

waitForDOMContentLoaded().then(() => {
  if (process.env.NODE) {
    return;
  }

  const theme = getCurrentTheme();
  if (theme && theme.name.toLowerCase().includes("dark")) {
    document.body.setAttribute("data-theme", "dark");
  } else {
    document.body.setAttribute("data-theme", "light");
  }

  updateTextButtonColors();
  onThemeChanged(() => {
    updateTextButtonColors();
    applyThemeToBody();
  });
});

function applyThemeToTextButton(el, highlighted) {
  el.setAttribute(
    "text-button",
    "backgroundColor",
    highlighted ? getThemeColor("action-color-highlight") : getThemeColor("action-color")
  );
  el.setAttribute(
    "text-button",
    "backgroundHoverColor",
    highlighted ? GLASS_EFFECT_COLOR : getThemeColor("action-color-highlight")
  );
}

export {
  applyThemeToTextButton,
  getCurrentTheme,
  getDefaultTheme,
  getThemeColor,
  onThemeChanged,
  applyThemeToBody,
  registerDarkModeQuery,
  themes,
  tryGetTheme
};