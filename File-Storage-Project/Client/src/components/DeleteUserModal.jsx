import { useState } from "react";

function DeleteUserModal({ user, onClose, onSoftDelete, onHardDelete }) {
  const [step, setStep] = useState("choose"); // "choose" | "confirmHard"

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {step === "choose" && (
          <>
            <h2>Delete {user.name}</h2>
            <p className="modal-subtext">
              Choose how you want to remove this user.
            </p>
            <div className="delete-option-list">
              <button
                className="delete-option soft"
                onClick={() => {
                  onSoftDelete(user);
                  onClose();
                }}
              >
                <span className="delete-option-title">Soft Delete</span>
                <span className="delete-option-desc">
                  Deactivates the account. Can be restored later.
                </span>
              </button>

              <button
                className="delete-option hard"
                onClick={() => setStep("confirmHard")}
              >
                <span className="delete-option-title">Permanent Delete</span>
                <span className="delete-option-desc">
                  Removes the user and their data completely.
                </span>
              </button>
            </div>
            <div className="modal-buttons">
              <button className="secondary-button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {step === "confirmHard" && (
          <>
            <h2 className="danger-title">Permanent Delete</h2>
            <p className="modal-subtext">
              Are you sure you want to permanently delete this user? This
              action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                className="secondary-button"
                onClick={() => setStep("choose")}
              >
                Back
              </button>
              <button
                className="danger-button"
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