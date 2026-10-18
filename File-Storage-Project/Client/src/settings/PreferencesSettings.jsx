import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useTheme } from '../hooks/useTheme';
import { SettingsSection, SettingsRow } from './SettingsUI';

const options = [
  { value: 'light', label: 'Light', icon: FaSun },
  { value: 'dark', label: 'Dark', icon: FaMoon },
  { value: 'system', label: 'System', icon: FaDesktop },
];

function PreferencesSettings() {
  const { preference, setPreference } = useTheme();

  return (
    <SettingsSection title="Appearance" description="Saved in this browser.">
      <SettingsRow label="Theme" hint="System follows your device setting.">
        <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-lg border border-border bg-surface-muted p-0.5">
          {options.map(({ value, label, icon: Icon }) => {
            const active = preference === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPreference(value)}
                className={`inline-flex items-center gap-2 h-9 px-3 rounded-md text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 ${
                  active ? 'bg-surface text-text shadow-card' : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}

export default PreferencesSettings;