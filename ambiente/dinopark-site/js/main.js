function maintenance() {
  alert("Em manutenção!");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-maintenance]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      maintenance();
    });
  });

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      alert("Mensagem registrada! Este formulário é demonstrativo e não envia dados.");
      form.reset();
    });
  }
});
