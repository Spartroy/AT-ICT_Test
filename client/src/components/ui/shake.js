// Mac-style "wrong password" shake for every invalid control inside `root`.
// Call it right after the errors are set; it waits for React to paint the invalid state, and restarts
// the animation each time so a second empty submit shakes again.
export function shakeInvalid(root) {
  if (!root) return;
  setTimeout(() => {
    const targets = root.querySelectorAll('.is-invalid .ui-input, .ui-check-wrap.is-invalid .ui-check');
    targets.forEach(el => el.classList.remove('is-shaking'));
    // eslint-disable-next-line no-unused-expressions
    root.offsetWidth; // restart the animation
    targets.forEach(el => el.classList.add('is-shaking'));
  }, 30);
}
