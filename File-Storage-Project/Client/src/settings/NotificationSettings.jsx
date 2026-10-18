import { SettingsSection, SettingsRow, Notice } from './SettingsUI';

function Toggle({ label, checked = false, disabled = true }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-primary' : 'bg-border-strong'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

// Notification preferences have no backend yet, so the switches are shown
// disabled and nothing is saved. Today the only notification that exists is
// "someone shared a file with you" — it is always on (see the bell).
function NotificationSettings() {
  return (
    <>
      <Notice kind="info">
        Preferences can't be changed yet — the server doesn't store them. File-share
        notifications are always on and appear in the bell at the top.
      </Notice>

      <SettingsSection title="File sharing">
        <SettingsRow label="Someone shares a file with me" hint="Shown in the bell and under Shared with me.">
          <Toggle label="Share notifications" checked />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Activity & system">
        <SettingsRow label="Upload completed or failed"><Toggle label="Upload notifications" /></SettingsRow>
        <SettingsRow label="Storage limit warnings"><Toggle label="Storage warnings" /></SettingsRow>
        <SettingsRow label="Security alerts"><Toggle label="Security alerts" /></SettingsRow>
      </SettingsSection>
    </>
  );
}

export default NotificationSettings;