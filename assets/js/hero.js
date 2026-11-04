window.Hero = (function () {
  "use strict";

  const COLS = 11;
  const ROWS = 9;
  const DURATION = 2600;
  const RADIUS = 110;
  const PATH = [[0, 8], [1, 8], [2, 7], [3, 7], [4, 6], [5, 5], [6, 5], [7, 4], [8, 3], [9, 2], [10, 1]];

  function seeded(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function mount(canvas, options) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return function () {};

    const styles = getComputedStyle(document.documentElement);
    const colorDot = styles.getPropertyValue("--hero-dot").trim() || "#8a8d96";
    const colorLine = styles.getPropertyValue("--hero-line").trim() || "rgba(255,255,255,.08)";
    const colorAccent = styles.getPropertyValue("--accent").trim() || "#d6b882";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = reduced || Boolean(options && options.instant);

    const rand = seeded(20240611);
    const pathKeys = new Set(PATH.map(function (p) { return p[0] + ":" + p[1]; }));
    const points = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        points.push({
          c: c,
          r: r,
          cx: rand(),
          cy: rand(),
          mix: 0,
          path: pathKeys.has(c + ":" + r),
          x: 0,
          y: 0
        });
      }
    }

    let width = 0;
    let height = 0;
    let start = 0;
    let frame = 0;
    let visible = true;
    let pointer = null;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      schedule();
    }

    function gridPos(p) {
      const padX = width * 0.08;
      const padY = height * 0.1;
      return [
        padX + (p.c / (COLS - 1)) * (width - padX * 2),
        padY + (p.r / (ROWS - 1)) * (height - padY * 2)
      ];
    }

    function step(now) {
      frame = 0;
      if (!start) start = now;
      const progress = instant ? 1 : Math.min((now - start) / DURATION, 1);
      const order = ease(progress);
      let settling = progress < 1;

      for (const p of points) {
        const g = gridPos(p);
        let target = 0;
        if (pointer && !reduced) {
          const dx = g[0] - pointer[0];
          const dy = g[1] - pointer[1];
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < RADIUS) target = Math.pow(1 - d / RADIUS, 1.6) * 0.55;
        }
        p.mix += (target - p.mix) * 0.12;
        if (Math.abs(target - p.mix) > 0.002) settling = true;
        const chaos = Math.max(1 - order, p.mix);
        p.x = g[0] + (p.cx * width - g[0]) * chaos;
        p.y = g[1] + (p.cy * height - g[1]) * chaos;
        p.order = 1 - chaos;
      }

      draw(order);
      if (settling && visible) schedule();
    }

    function draw(order) {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = colorLine;
      ctx.beginPath();
      for (const p of points) {
        if (p.c < COLS - 1) {
          const right = points[p.r * COLS + p.c + 1];
          const a = Math.min(p.order, right.order);
          if (a > 0.6) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(right.x, right.y);
          }
        }
        if (p.r < ROWS - 1) {
          const down = points[(p.r + 1) * COLS + p.c];
          const a = Math.min(p.order, down.order);
          if (a > 0.6) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(down.x, down.y);
          }
        }
      }
      ctx.globalAlpha = Math.max(0, (order - 0.6) / 0.4);
      ctx.stroke();

      const pathPoints = PATH.map(function (k) { return points[k[1] * COLS + k[0]]; });
      const reveal = Math.max(0, (order - 0.75) / 0.25);
      if (reveal > 0) {
        const count = Math.max(1, Math.floor(reveal * pathPoints.length));
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = colorAccent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < count; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        ctx.stroke();
      }

      for (const p of points) {
        const accent = p.path && reveal > 0;
        ctx.globalAlpha = accent ? 1 : 0.35 + p.order * 0.45;
        ctx.fillStyle = accent ? colorAccent : colorDot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, accent ? 2.6 : 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(step);
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      pointer = [e.clientX - rect.left, e.clientY - rect.top];
      schedule();
    }

    function onLeave() {
      pointer = null;
      schedule();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    });
    visibilityObserver.observe(canvas);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return function destroy() {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }

  return { mount: mount };
})();
