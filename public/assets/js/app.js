/* Exam Photo Resizer: crops to exact pixels, then searches JPEG quality to land inside a KB range. */
(function () {
  const { dropZone, download, baseName } = window.Tool;
  const $ = s => document.querySelector(s);

  const PRESETS = {
    photo:    { w: 200, h: 230, min: 20, max: 50 },
    sign:     { w: 140, h: 60,  min: 10, max: 20 },
    thumb:    { w: 240, h: 240, min: 20, max: 50 },
    passport: { w: 413, h: 531, min: 20, max: 100 },
  };

  const canvas = $('#canvas'), ctx = canvas.getContext('2d');
  const W = $('#w'), H = $('#h'), MIN = $('#minKb'), MAX = $('#maxKb');
  const zoom = $('#zoom'), gray = $('#gray'), stamp = $('#stamp');
  const stampName = $('#stampName'), stampDate = $('#stampDate');
  const status = $('#status'), dl = $('#dl');

  let img = null, fileName = 'photo';
  let offX = 0, offY = 0;  // pan offset in output pixels
  let result = null;       // final JPEG blob
  let job = 0;             // cancels stale encodes when settings change quickly

  stampDate.value = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY, what most Indian forms expect

  function applyPreset() {
    const p = PRESETS[$('#preset').value];
    if (p) { W.value = p.w; H.value = p.h; MIN.value = p.min; MAX.value = p.max; }
    gray.checked = $('#preset').value === 'sign';
    offX = offY = 0;
    render();
  }
  $('#preset').addEventListener('change', applyPreset);
  [W, H, MIN, MAX].forEach(el => el.addEventListener('input', () => { $('#preset').value = 'custom'; render(); }));
  [zoom, gray, stampName, stampDate].forEach(el => el.addEventListener('input', render));
  stamp.addEventListener('change', () => { $('#stampFields').hidden = !stamp.checked; render(); });

  dropZone($('#drop'), files => {
    const file = files.find(f => f.type.startsWith('image/'));
    if (!file) return;
    const i = new Image();
    i.onload = () => { img = i; fileName = baseName(file.name); offX = offY = 0; zoom.value = 1; $('#adjust').hidden = false; render(); };
    i.onerror = () => { status.innerHTML = '<span class="err">This file could not be opened as an image. Try a JPG or PNG.</span>'; };
    i.src = URL.createObjectURL(file);
  });

  /* Drag to pan */
  let drag = null;
  canvas.addEventListener('pointerdown', e => { if (!img) return; drag = { x: e.clientX, y: e.clientY, ox: offX, oy: offY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const scale = canvas.width / canvas.getBoundingClientRect().width; // screen px → output px
    offX = drag.ox + (e.clientX - drag.x) * scale;
    offY = drag.oy + (e.clientY - drag.y) * scale;
    draw();
  });
  canvas.addEventListener('pointerup', () => { if (drag) { drag = null; render(); } });

  /** Paint the photo into the canvas at exact output size. Returns false if not ready. */
  function draw() {
    const w = Math.max(20, parseInt(W.value, 10) || 0), h = Math.max(20, parseInt(H.value, 10) || 0);
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    if (!img) return false;

    const strip = stamp.checked ? Math.round(h * 0.16) : 0;
    const areaH = h - strip;
    // "Cover" fit, then zoom; keep the photo covering the frame while panning.
    const s = Math.max(w / img.width, areaH / img.height) * parseFloat(zoom.value);
    const dw = img.width * s, dh = img.height * s;
    offX = Math.min(Math.max(offX, (w - dw) / 2), (dw - w) / 2);
    offY = Math.min(Math.max(offY, (areaH - dh) / 2), (dh - areaH) / 2);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, areaH); ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (w - dw) / 2 + offX, (areaH - dh) / 2 + offY, dw, dh);
    ctx.restore();

    if (gray.checked) {
      const d = ctx.getImageData(0, 0, w, areaH), px = d.data;
      for (let i = 0; i < px.length; i += 4) { const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; px[i] = px[i + 1] = px[i + 2] = y; }
      ctx.putImageData(d, 0, 0);
    }

    if (strip) {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, areaH, w, strip);
      ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lines = [stampName.value.trim(), stampDate.value.trim()].filter(Boolean);
      const fs = Math.max(8, Math.floor(strip / (lines.length > 1 ? 2.4 : 1.6)));
      ctx.font = `bold ${fs}px Arial, sans-serif`;
      lines.forEach((t, n) => ctx.fillText(t, w / 2, areaH + strip * (lines.length > 1 ? (n === 0 ? 0.3 : 0.72) : 0.5), w - 6));
    }
    $('#outPx').textContent = `${w}×${h}`;
    return true;
  }

  const toJpeg = q => new Promise(r => canvas.toBlob(r, 'image/jpeg', q));

  /** Grow a JPEG to at least `target` bytes with comment (COM) segments. The picture itself is unchanged;
      this is for forms that reject small files such as plain signatures. */
  async function padJpeg(blob, target) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const parts = [bytes.subarray(0, 2)]; // SOI marker
    let need = target - bytes.length;
    while (need > 0) {
      const len = Math.min(65533, Math.max(1, need - 4)); // segment = FF FE + 2-byte length + data
      const seg = new Uint8Array(4 + len);
      seg[0] = 0xFF; seg[1] = 0xFE; seg[2] = (len + 2) >> 8; seg[3] = (len + 2) & 0xFF;
      seg.fill(0x20, 4);
      parts.push(seg);
      need -= seg.length;
    }
    parts.push(bytes.subarray(2));
    return new Blob(parts, { type: 'image/jpeg' });
  }

  async function render() {
    const my = ++job;
    result = null; dl.disabled = true;
    if (!draw()) { $('#outKb').textContent = '—'; return; }
    status.textContent = 'Fitting file size…';

    const minB = (parseFloat(MIN.value) || 0) * 1024, maxB = (parseFloat(MAX.value) || Infinity) * 1024;
    // Binary search on JPEG quality for the largest file that is still under the max.
    let lo = 0.05, hi = 0.98, best = null, bestQ = 0;
    const top = await toJpeg(hi);
    if (my !== job) return;
    if (top.size <= maxB) { best = top; bestQ = hi; }
    else {
      for (let i = 0; i < 9; i++) {
        const q = (lo + hi) / 2, b = await toJpeg(q);
        if (my !== job) return;
        if (b.size <= maxB) { best = b; bestQ = q; lo = q; } else hi = q;
      }
      if (!best) { const b = await toJpeg(0.05); if (my !== job) return; best = b; bestQ = 0.05; }
    }

    let padded = false;
    if (best.size < minB && best.size <= maxB) {
      // Aim a little above the minimum so rounding on the form's side does not reject it.
      best = await padJpeg(best, Math.min(maxB, minB + 512));
      if (my !== job) return;
      padded = true;
    }

    result = best;
    const kb = best.size / 1024;
    $('#outKb').textContent = `${kb.toFixed(1)} KB`;
    dl.disabled = false;
    if (best.size > maxB) {
      status.innerHTML = `<span class="warn">Still above ${MAX.value} KB at the lowest quality.</span> Try a smaller width and height.`;
    } else {
      const note = padded ? ' Small image, so the file was padded up to the minimum size (the picture is unchanged).' : '';
      status.innerHTML = `<span class="good">✓ Ready.</span> ${canvas.width}×${canvas.height} px, ${kb.toFixed(1)} KB, JPG quality ${Math.round(bestQ * 100)}.${note}`;
    }
  }

  dl.addEventListener('click', () => result && download(result, `${fileName}-${canvas.width}x${canvas.height}.jpg`));

  applyPreset();
})();
