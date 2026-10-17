(() => {
  const navs = document.querySelectorAll(".nav-links");
  let activeNav = null;
  let startX = 0;
  let startScrollLeft = 0;
  let activePointerId = null;
  let dragging = false;
  let suppressClick = false;

  navs.forEach((nav) => {
    nav.addEventListener("dragstart", (event) => event.preventDefault());
    nav.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      activeNav = nav;
      activePointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = nav.scrollLeft;
      dragging = false;
    });

    nav.addEventListener("click", (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
  });

  document.addEventListener("pointermove", (event) => {
    if (!activeNav || event.pointerType !== "mouse") return;
    const distance = event.clientX - startX;
    if (!dragging && Math.abs(distance) < 4) return;

    dragging = true;
    activeNav.classList.add("is-dragging");
    activeNav.scrollLeft = startScrollLeft - distance;
  });

  const finishDrag = (event) => {
    if (!activeNav || event.pointerId !== activePointerId) return;
    activeNav.classList.remove("is-dragging");
    activeNav = null;
    activePointerId = null;
    if (dragging) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    dragging = false;
  };

  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
})();
