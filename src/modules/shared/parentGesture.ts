type ParentGestureOptions = {
  hotspotEl: HTMLElement;
  onTrigger: () => void;
};

const TAP_TARGET_COUNT = 4;
const TAP_WINDOW_MS = 2000;
const ARM_WINDOW_MS = 2600;
const TAP_MOVE_MAX_PX = 18;
const SWIPE_DOWN_MIN_PX = 96;
const SWIPE_SIDE_MAX_PX = 64;

export function bindParentGesture({ hotspotEl, onTrigger }: ParentGestureOptions): void {
  let tapTimes: number[] = [];
  let armedUntil = 0;
  let armTimeoutId: number | null = null;
  let activePointerId: number | null = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerMoved = false;

  const clearArmTimeout = () => {
    if (armTimeoutId !== null) {
      window.clearTimeout(armTimeoutId);
      armTimeoutId = null;
    }
  };

  const syncArmedState = () => {
    const armed = armedUntil > Date.now();
    hotspotEl.classList.toggle('is-armed', armed);
    if (!armed) {
      clearArmTimeout();
    }
  };

  const armGesture = () => {
    armedUntil = Date.now() + ARM_WINDOW_MS;
    syncArmedState();
    clearArmTimeout();
    armTimeoutId = window.setTimeout(() => {
      armedUntil = 0;
      syncArmedState();
    }, ARM_WINDOW_MS + 20);
  };

  const resetPointer = () => {
    activePointerId = null;
    pointerMoved = false;
    pointerStartX = 0;
    pointerStartY = 0;
  };

  const resetGesture = () => {
    tapTimes = [];
    armedUntil = 0;
    syncArmedState();
    resetPointer();
  };

  hotspotEl.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerMoved = false;
    if (typeof hotspotEl.setPointerCapture === 'function') {
      try {
        hotspotEl.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failures and continue with best-effort gesture tracking.
      }
    }
  });

  hotspotEl.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      pointerMoved = true;
    }

    if (
      armedUntil > Date.now() &&
      dy >= SWIPE_DOWN_MIN_PX &&
      Math.abs(dx) <= SWIPE_SIDE_MAX_PX &&
      dy > Math.abs(dx)
    ) {
      resetGesture();
      onTrigger();
    }
  });

  hotspotEl.addEventListener('pointerup', (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    const travel = Math.hypot(dx, dy);

    if (armedUntil <= Date.now() && !pointerMoved && travel <= TAP_MOVE_MAX_PX) {
      const now = Date.now();
      tapTimes = tapTimes.filter((time) => now - time <= TAP_WINDOW_MS);
      tapTimes.push(now);
      if (tapTimes.length >= TAP_TARGET_COUNT) {
        tapTimes = [];
        armGesture();
      }
    }

    if (typeof hotspotEl.releasePointerCapture === 'function') {
      try {
        hotspotEl.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore release failures.
      }
    }

    resetPointer();
  });

  hotspotEl.addEventListener('pointercancel', () => {
    resetPointer();
    syncArmedState();
  });

  hotspotEl.addEventListener('lostpointercapture', () => {
    resetPointer();
    syncArmedState();
  });
}
