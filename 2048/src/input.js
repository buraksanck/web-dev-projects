export function bindKeyboard(onMove) {
  const handler = (e) => {
    const key = e.key;
    if (key === 'ArrowUp') onMove('up');
    else if (key === 'ArrowDown') onMove('down');
    else if (key === 'ArrowLeft') onMove('left');
    else if (key === 'ArrowRight') onMove('right');
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export function bindTouch(onMove) {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onStart = (e) => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  };

  const onEnd = (e) => {
    if (!tracking) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const threshold = 24;
    if (Math.max(ax, ay) < threshold) { tracking = false; return; }
    if (ax > ay) onMove(dx > 0 ? 'right' : 'left');
    else onMove(dy > 0 ? 'down' : 'up');
    tracking = false;
  };

  const area = document.getElementById('boardWrapper');
  area.addEventListener('touchstart', onStart, { passive: true });
  area.addEventListener('touchend', onEnd, { passive: true });
  return () => {
    area.removeEventListener('touchstart', onStart);
    area.removeEventListener('touchend', onEnd);
  };
}


