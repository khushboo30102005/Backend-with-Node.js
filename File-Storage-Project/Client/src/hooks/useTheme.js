import { useSyncExternalStore } from 'react';

// Single source of truth for the theme. Stored value: 'light' | 'dark' | 'system'.
// (index.html applies it before first paint; SidebarFooter and Settings both use this hook.)
const KEY = 'theme';
const listeners = new Set();
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readPreference() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function resolve(pref) {
  if (pref === 'system') return darkQuery().matches ? 'dark' : 'light';
  return pref;
}

function apply() {
  document.documentElement.setAttribute('data-theme', resolve(readPreference()));
}

function emit() {
  apply();
  listeners.forEach((l) => l());
}

let watching = false;
function subscribe(listener) {
  listeners.add(listener);
  if (!watching) {
    darkQuery().addEventListener('change', () => {
      if (readPreference() === 'system') emit();
    });
    watching = true;
  }
  return () => listeners.delete(listener);
}

// Snapshot must be a primitive so React can compare it.
const getSnapshot = () => `${readPreference()}|${resolve(readPreference())}`;

export function setThemePreference(pref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
  emit();
}

export function useTheme() {
  const [preference, resolved] = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => 'system|light',
  ).split('|');
  return { preference, resolved, setPreference: setThemePreference };
}