import { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  updateProfile,
  updatePicture,
  removePicture,
} from '../apis/userApi';
import {
  SettingsSection,
  SettingsRow,
  Notice,
  inputClass,
  primaryBtn,
  secondaryBtn,
} from './SettingsUI';
import PhotoAdjuster from './PhotoAdjuster';
import { ViewablePhoto } from '../components/PhotoViewer';

// Kept in sync with the server (utils/avatar.js), which re-checks everything.
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

function Avatar({ user }) {
  return user?.picture ? (
    <img
      src={user.picture}
      alt=""
      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <span className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-linear-to-br from-primary to-violet-500 text-white text-2xl font-bold">
      {user?.name?.[0]?.toUpperCase() || '·'}
    </span>
  );
}

function ProfileSettings() {
  const { user, refreshUser } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoMsg, setPhotoMsg] = useState('');

  // Free the temporary preview URL when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearPending() {
    setPendingFile(null);
    setPreviewUrl('');
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;
    setPhotoError('');
    setPhotoMsg('');
    if (!ACCEPTED.includes(file.type)) {
      clearPending();
      return setPhotoError('Choose a JPEG, PNG or WebP image.');
    }
    if (file.size > MAX_BYTES) {
      clearPending();
      return setPhotoError('That image is too large. The maximum is 5 MB.');
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSavePhoto(adjustedFile) {
    if (!adjustedFile || photoBusy) return;
    setPhotoError('');
    setPhotoMsg('');
    setPhotoBusy(true);
    try {
      await updatePicture(adjustedFile);
      await refreshUser();
      clearPending();
      setPhotoMsg('Profile photo updated.');
    } catch (err) {
      setPhotoError(
        err.response?.data?.error || 'Could not update your photo.',
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleRemovePhoto() {
    if (photoBusy) return;
    setPhotoError('');
    setPhotoMsg('');
    setPhotoBusy(true);
    try {
      await removePicture();
      await refreshUser();
      setPhotoMsg('Profile photo removed.');
    } catch (err) {
      setPhotoError(
        err.response?.data?.error || 'Could not remove your photo.',
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  const trimmed = name.trim();
  const dirty = trimmed !== (user?.name || '');

  async function handleSave(e) {
    e.preventDefault();
    if (trimmed.length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile(trimmed);
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update your name.');
    } finally {
      setSaving(false);
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <SettingsSection
        title="Profile"
        description="Your name is shown to people you share files with."
      >
        <div className="flex items-center gap-4 py-4">
          <ViewablePhoto src={user?.picture} name={user?.name}>
            <Avatar user={user} />
          </ViewablePhoto>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">
              {user?.name}
            </p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
              />
              {!pendingFile && (
                <>
                  <button
                    type="button"
                    className={secondaryBtn}
                    onClick={() => fileRef.current?.click()}
                    disabled={photoBusy}
                  >
                    Change photo
                  </button>
                  {user?.hasCustomPicture && (
                    <button
                      type="button"
                      className={secondaryBtn}
                      onClick={handleRemovePhoto}
                      disabled={photoBusy}
                    >
                      {photoBusy ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              {pendingFile
                ? 'Adjusting your new photo below.'
                : 'JPEG, PNG or WebP, up to 5 MB. Click your photo to view it.'}
            </p>
          </div>
        </div>

        {photoError && <Notice>{photoError}</Notice>}
        {photoMsg && <Notice kind="success">{photoMsg}</Notice>}

        {pendingFile && (
          <PhotoAdjuster
            key={previewUrl}
            src={previewUrl}
            fileType={pendingFile.type}
            busy={photoBusy}
            onSave={handleSavePhoto}
            onCancel={clearPending}
          />
        )}

        <form onSubmit={handleSave} className="py-4 flex flex-col gap-3">
          <div>
            <label
              htmlFor="settings-name"
              className="block mb-1.5 text-[13px] font-semibold text-text"
            >
              Full name
            </label>
            <input
              id="settings-name"
              className={`${inputClass} max-w-md`}
              value={name}
              maxLength={100}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          {error && <Notice>{error}</Notice>}
          {saved && !dirty && <Notice kind="success">Name updated.</Notice>}
          <div>
            <button
              type="submit"
              className={primaryBtn}
              disabled={saving || !dirty}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Account information"
        description="These details can't be changed from here."
      >
        <SettingsRow label="Email" hint="Used to sign in and receive codes.">
          {user?.email}
        </SettingsRow>
        <SettingsRow label="Role">{user?.role}</SettingsRow>
        <SettingsRow label="Member since">{memberSince}</SettingsRow>
      </SettingsSection>
    </>
  );
}

export default ProfileSettings;