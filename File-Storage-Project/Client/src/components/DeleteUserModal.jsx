import { useState } from 'react';

function DeleteUserModal({ user, onClose, onSoftDelete, onHardDelete }) {
  const [step, setStep] = useState('choose'); // "choose" | "confirmHard"

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-black/45 backdrop-blur-[2px] flex justify-center items-center z-[999]"
      onClick={onClose}
    >
      <div
        className="bg-surface p-6 w-[90%] max-w-[400px] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'choose' && (
          <>
            <h2 className="mt-0 mb-2 text-lg font-bold text-text">
              Delete {user.name}
            </h2>
            <p className="text-text-muted text-sm mb-4">
              Choose how you want to remove this user.
            </p>
            <div className="flex flex-col gap-2.5 mb-5">
              <button
                className="flex flex-col items-start gap-1 px-4 py-3.5 rounded-[10px] border border-border bg-white cursor-pointer text-left transition-all duration-150 hover:border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  onSoftDelete(user);
                  onClose();
                }}
              >
                <span className="font-bold text-sm text-text">Soft Delete</span>
                <span className="text-[13px] text-text-muted">
                  Deactivates the account. Can be restored later.
                </span>
              </button>

              <button
                className="flex flex-col items-start gap-1 px-4 py-3.5 rounded-[10px] border border-border bg-white cursor-pointer text-left transition-all duration-150 hover:border-red-300 hover:bg-red-50"
                onClick={() => setStep('confirmHard')}
              >
                <span className="font-bold text-sm text-danger">
                  Permanent Delete
                </span>
                <span className="text-[13px] text-text-muted">
                  Removes the user and their data completely.
                </span>
              </button>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                className="px-[15px] py-2 rounded-lg bg-gray-200 text-gray-700 border-none cursor-pointer hover:bg-gray-400 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'confirmHard' && (
          <>
            <h2 className="mt-0 mb-2 text-lg font-bold text-danger">
              Permanent Delete
            </h2>
            <p className="text-text-muted text-sm mb-4">
              Are you sure you want to permanently delete this user? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                className="px-[15px] py-2 rounded-lg bg-gray-200 text-gray-700 border-none cursor-pointer hover:bg-gray-400 transition-colors"
                onClick={() => setStep('choose')}
              >
                Back
              </button>
              <button
                className="px-4 py-2.5 rounded-lg border-none bg-danger text-white font-semibold text-sm cursor-pointer hover:bg-red-700 transition-colors"
                onClick={() => {
                  onHardDelete(user);
                  onClose();
                }}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeleteUserModal;
