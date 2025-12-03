// src/utils/alerts.js
import Swal from "sweetalert2";

// ----------------------------------------
// 1. Basic Success/Error Alert (for messages)
// ----------------------------------------

/**
 * Shows a customizable SweetAlert message.
 * @param {string} title - The title/heading of the alert.
 * @param {string} text - The main body text of the alert.
 * @param {'success'|'error'|'warning'|'info'|'question'} icon - The icon type.
 */
export const showAlert = (title, text, icon = "info") => {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    confirmButtonText: "OK",
    confirmButtonColor: "#6B7CFF", // Customize confirmation button color
    customClass: {
      popup: "custom-swal-popup", // Add a custom class to the popup
    },
  });
};

// ----------------------------------------
// 2. Confirmation Alert (for yes/no actions)
// ----------------------------------------

/**
 * Shows a confirmation dialog, returning a Promise that resolves to the result.
 * @param {string} title - The title/heading of the confirmation.
 * @param {string} text - The main body text explaining the action.
 * @param {'warning'|'question'} icon - The icon type.
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled/dismissed.
 */
export const showConfirm = async (title, text, icon = "warning") => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showCancelButton: true,
    confirmButtonText: "Yes, proceed!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#EF4444", // Red for confirmation
    cancelButtonColor: "#9CA3AF", // Gray for cancel
  });

  return result.isConfirmed;
};

// ---------------------------------------- Error Pop-Up Example ----------------------------------------
/**
 * Example function to demonstrate error pop-up usage.
 * @param {string} errorMessage - The error message to display.
 */
export const showErrorPopup = (errorMessage) => {
  showAlert("Error", errorMessage, "error");
};
