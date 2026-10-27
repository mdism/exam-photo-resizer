/* Shared helpers for the shaikhismail.com free tools: theme toggle, drop zones, downloads. */
(function () {
  const root = document.documentElement;
  const KEY = 'theme';
  try { const t = localStorage.getItem(KEY); if (t) root.dataset.theme = t; } catch (e) {}

  const btn = document.getElementById('themeBtn');
  if (btn) {
    const isDark = () => root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const paint = () => { btn.textContent = isDark() ? '☀' : '☾'; btn.title = isDark() ? 'Light theme' : 'Dark theme'; };
    btn.addEventListener('click', () => {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem(KEY, root.dataset.theme); } catch (e) {}
      paint();
    });
    paint();
  }

  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /** Wire a <label class="drop"> containing an <input type=file> to a callback receiving File[]. */
  function dropZone(label, onFiles) {
    const input = label.querySelector('input[type=file]');
    input.addEventListener('change', () => { if (input.files.length) onFiles([...input.files]); input.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => label.addEventListener(ev, e => { e.preventDefault(); label.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => label.addEventListener(ev, e => { e.preventDefault(); label.classList.remove('over'); }));
    label.addEventListener('drop', e => { if (e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]); });
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function baseName(name) { return name.replace(/\.[^.]+$/, ''); }

  window.Tool = { dropZone, formatBytes, download, baseName };
})();
