import Swal from "sweetalert2";

// type TParams = { func: () => void; okay?: string; object?: string };

export const sweetAlertConfirmation = ({ func, okay, object, conColor }) => {
  Swal.fire({
    text: `Are you sure you want to ${object || "logout"}?`,
    showCancelButton: true,
    confirmButtonText: okay || "Confirm",
    cancelButtonText: "Cancel",
    showConfirmButton: true,
    confirmButtonColor: conColor || "red",
    reverseButtons: true,
    customClass: {
      confirmButton: "text-white  font-normal py-2 px-4 rounded-full w-40",
      cancelButton: "py-2 px-4 font-normal  rounded-full w-40",
    },
  }).then((res) => {
    if (res.isConfirmed) {
      func();
    }
  });
};