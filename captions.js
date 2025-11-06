;(function () {
  const old = document.getElementById('caption-editor-module');
  if (old) old.remove();
  const container = document.createElement('div');
  container.id = 'caption-editor-module';
  container.style.cssText = 'all:initial; font-family:system-ui,sans-serif; color:#ffc0cbbb;';
  container.innerHTML = `
    <style>
      #caption-editor-module * { box-sizing:border-box; margin:0; padding:0; }
      #caption-editor-module #editor {
        display:none; flex-direction:column; width:560px; max-width:100%; height:400px;
        background:#11111180; border-radius:12px; overflow:hidden;
        box-shadow:0 12px 32px rgba(0,0,0,0.6); position:fixed; left:50%; top:50%;
        transform:translate(-50%,-50%); min-width:300px; min-height:300px;
        resize:both; max-height:80vh; z-index:9999;
      }
      #caption-editor-module #ribbon {
        background:#1a1a1a40; padding:6px 10px; display:flex; gap:6px;
        align-items:center; flex-wrap:wrap; user-select:none;
        flex-shrink:0; position:relative; z-index:10; justify-content:center;
      }
      #caption-editor-module .dropdown-header { position:relative; display:inline-block; }
      #caption-editor-module .dropdown-header > div:first-child {
        background:#1a1a1ac0; color:#ffc0cb99; border-radius:4px; padding:3px 6px;
        font-size:12px; white-space:nowrap; position:relative; z-index:2;
        display:flex; align-items:center; gap:4px;
      }
      #caption-editor-module .dropdown-content {
        position:absolute; bottom:100%; left:0; min-width:100%; background:#222;
        border:1px solid #444; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,0.5);
        display:none; z-index:1; padding-bottom:8px;
      }
      #caption-editor-module .dropdown-content > div {
        padding:4px 8px; font-size:12px; white-space:nowrap;
        border-radius:4px;
      }
      #caption-editor-module .dropdown-content > div:hover { background:#00ff88; color:#000; }
      #caption-editor-module .caption-viewport {
        flex:1; overflow-y:auto; overflow-x:hidden; padding:16px;
        background:#1a1a1a40; display:flex; flex-direction:column; gap:16px; min-height:0;
        scrollbar-width: thin; scrollbar-color: #ffc0cb30 transparent;
      }
      #caption-editor-module .text-block {
        padding:12px; background:#1a1a1a30; border-radius:6px;
        white-space:pre-wrap; word-wrap:break-word; font-size:15px;
        line-height:1.5; color:#ffc0cb99; outline:none;
      }
      .text-block.editing {
        background: #1a1a1a90 !important;
        border-radius: 6px;
      }
      /* ID display */
      #id-header > div:first-child {
        display: flex; justify-content: center; align-items: center; cursor: default;
      }
      #id-display {
        background:transparent; border:none; color:#ffc0cb99; font-size:12px;
        outline:none; min-width:34px;
      }
      #time-header > div:first-child { cursor:text; }
      #time-field {
        flex:1; width:70px;
        background:inherit; color:#ffc0cb99; border:none;
        outline:none; text-align:center;
        font-size:12px; font-family:inherit;
        border-radius:4px;
      }
      /* Nudge */
      #nudge-header > div:first-child { justify-content:center; }
      #nudge-wrapper { display:flex; gap:2px; }
      #nudge-wrapper button {
        width:12px; height:12px; font-size:12px; line-height:1;
        padding:0; border:none; background:#1a1a1ac0; color:#ffc0cb99;
        border-radius:2px;
      }
      #nudge-wrapper button:hover { background:#00ff88; color:#000; }
    </style>
    <div id="editor">
      <div class="caption-viewport" id="viewport"></div>
      <div id="ribbon">
        <div class="dropdown-header"><div>Voice</div><div class="dropdown-content"><div>Sarah</div><div>Tracy</div><div>Michelle</div><div>Brian</div></div></div>
        <div class="dropdown-header"><div>Video</div><div class="dropdown-content"><div>No videos yet</div></div></div>
        <div class="dropdown-header"><div>Style</div><div class="dropdown-content"><div>Normal</div></div></div>
        <div class="dropdown-header"><div>Media</div><div class="dropdown-content"><div>No media</div></div></div>
        <div class="dropdown-header" id="id-header">
          <div id="id-display">--</div>
        </div>
        <div class="dropdown-header" id="time-header">
        <input type="text" id="time-field" placeholder="- : -- . -">
        </div>
        <div class="dropdown-header" id="nudge-header">
          <div id="nudge-wrapper">
            <button id="nudge-down" type="button">-</button>
            <button id="nudge-up" type="button">+</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  const editor = container.querySelector('#editor');
  const ribbon = container.querySelector('#ribbon');
  const viewport = container.querySelector('#viewport');
  const idDisplay = container.querySelector('#id-display');
  const timeField = container.querySelector('#time-field');
  const nudgeDown = container.querySelector('#nudge-down');
  const nudgeUp = container.querySelector('#nudge-up');
  let blocks = [];
  let editingBlock = null;
  let originalSRT = '';  // For potential future use

  // Simple observer: Just sets flag to 1 on changes
const observer = new MutationObserver(() => { if (editingBlock) editing = 1});

  observer.observe(viewport, {
    childList: true, // Catches adds/removes (splits/merges)
    subtree: true, // Deep-watch blocks
    characterData: true, // Text edits/typing
  });

  /* --------------------------------------------------------------
     1. DROPDOWNS
     -------------------------------------------------------------- */
  container.querySelectorAll('.dropdown-header:not(#id-header):not(#time-header):not(#nudge-header)').forEach(header => {
    const content = header.querySelector('.dropdown-content');
    header.addEventListener('mouseenter', () => {
      container.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
      if (content) content.style.display = 'block';
    });
    header.addEventListener('mouseleave', () => {
      if (content) content.style.display = 'none';
    });
  });
  /* --------------------------------------------------------------
     2. TIME HELPERS
     -------------------------------------------------------------- */
  function parseSrtTime(t) {
    const [h, m, s_ms] = t.split(':');
    const [s, ms] = s_ms.replace(',', '.').split('.');
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms || 0) / 1000;
  }
  function parseSrtTimeShort(t) {
    const [m, s_ms] = t.split(':');
    const [s, ms] = s_ms.replace(',', '.').split('.');
    return parseInt(m) * 60 + parseInt(s) + (parseInt(ms || 0) / 1000);
  }
  function parseShortTime(t) {
    const [m, s] = t.split(':');
    return parseInt(m) * 60 + parseFloat(s);
  }
  function formatTime(sec) {
    if (sec === 0) return '00:00:00.000';
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }
  function shortFormatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return `${m} : ${s.replace('.', ' . ')}`;
  }
  function msToSec(ms) { return ms / 1000; }
  /* --------------------------------------------------------------
     3. BLOCK CREATION
     -------------------------------------------------------------- */
  function addBlock(num, startSec, text, cues = {}) {
    const block = document.createElement('div');
    block.className = 'text-block';
    block.dataset.num = num;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text;
    block._cues = cues;
    attachBlockListeners(block);
    viewport.appendChild(block);
    blocks.push(block);
    return block;
  }
  /* --------------------------------------------------------------
     4. PARSING
     -------------------------------------------------------------- */
  function initContent(rawText = '') {
    viewport.innerHTML = '';
    blocks = [];
    if (!rawText.trim()) {
      addBlock(1, 0, 'No text provided.');
      idDisplay.textContent = '--';
      timeField.value = '';
      rebuild();
      return;
    }
    const lines = rawText.split(/\r?\n/);
    let i = 0, cueNum = 0, inSrt = false;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (/^\d+$/.test(line)) {
        inSrt = true;
        cueNum = parseInt(line);
        i++;
        if (i >= lines.length) break;
        const timeLine = lines[i].trim();
        let start = 0;
        const longMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) -->/);
        if (longMatch) start = parseSrtTime(longMatch[1]);
        else {
          const shortMatch = timeLine.match(/(\d{1,2}:\d{1,2}[.,]\d{1,3}) -->/);
          if (shortMatch) start = parseSrtTimeShort(shortMatch[1]);
        }
        i++;
        const textLines = [];
        while (i < lines.length) {
          const txt = lines[i];
          if (txt.trim() === '' || /^\d+$/.test(txt.trim())) break;
          textLines.push(txt);
          i++;
        }
        const text = textLines.join('\n').trim();
        if (text) addBlock(cueNum, start, text, {});
        continue;
      }
      if (!inSrt) {
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i]);
          i++;
        }
        const text = textLines.join('\n').trim();
        if (text) {
          cueNum++;
          addBlock(cueNum, 0, text, {});
        }
        while (i < lines.length && lines[i].trim() === '') i++;
        continue;
      }
      i++;
    }
    if (blocks.length === 0) addBlock(1, 0, 'No captions found.', {});
    requestAnimationFrame(() => viewport.scrollTop = 0);
    rebuild();
  }
  /* --------------------------------------------------------------
     5. EDITING HELPERS
     -------------------------------------------------------------- */
  function createTextBlock(startSec, text, cues = {}) {
    const block = document.createElement('div');
    block.className = 'text-block';
    block.dataset.num = null;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text;
    block._cues = cues;
    attachBlockListeners(block);
    return block;
  }
  function attachBlockListeners(block) {
    // CLICK: Enter editing mode
    block.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.text-block.editing').forEach(b => b.classList.remove('editing'));
      editingBlock = block;
      block.classList.add('editing');
      const num = block.dataset.num;
      const start = parseFloat(block.dataset.start) || 0;
      idDisplay.textContent = num;
      timeField.value = shortFormatTime(start);
      myPlayer.currentTime = start;
    });
    // BACKSPACE MERGE
    block.addEventListener('keydown', e => {
      if (e.key !== 'Backspace') return;
      const sel = window.getSelection();
      if (sel.rangeCount === 0 || !sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const testRange = document.createRange();
      testRange.selectNodeContents(block);
      testRange.setEnd(range.startContainer, range.startOffset);
      if (testRange.toString() !== '') return;
      const prevBlock = block.previousElementSibling;
      if (!prevBlock || !prevBlock.classList.contains('text-block')) return;
      e.preventDefault();
      const currentText = block.textContent.trim();
      if (currentText) {
        const prevText = prevBlock.textContent;
        prevBlock.textContent = prevText + '\n' + currentText;
      }
      const newRange = document.createRange();
      newRange.selectNodeContents(prevBlock);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
      block.remove();
      blocks = blocks.filter(b => b !== block);
      renumberBlocks();
      rebuild();
    });
    // SPLIT ON MOUSELEAVE (skip if editing)
    block.addEventListener('mouseleave', () => {
      const html = block.innerHTML;
      const text = block.textContent.trim();
      if (!text) {
        block.remove();
        blocks = blocks.filter(b => b !== block);
        renumberBlocks();
        rebuild();
        return;
      }
      const normalized = html
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<\/?div[^>]*>/gi, '')
        .replace(/\n\s*\n/g, '\n\n');
      const fullParts = normalized.split('\n\n').map(p => p.trim());
      const hasTrailingEmpty = normalized.endsWith('\n\n');
      if (hasTrailingEmpty && fullParts[fullParts.length - 1] === '') fullParts.pop();
      const parts = fullParts.filter(p => p);
      if (parts.length < 2 && !hasTrailingEmpty) return;
      const startSec = parseFloat(block.dataset.start) || 0;
      const nextSibling = block.nextSibling;
      const idx = blocks.indexOf(block);
      block.remove();
      blocks = blocks.filter(b => b !== block);
      let insertAfterThis = null;
      parts.forEach((part, i) => {
        const estSec = estimateSplitTime(startSec, i, parts.length, text);
        const newBlock = createTextBlock(i === 0 ? startSec : estSec, part);
        viewport.insertBefore(newBlock, nextSibling);
        blocks.splice(idx + i, 0, newBlock);
        insertAfterThis = newBlock;
      });
      if (hasTrailingEmpty) {
        const newCaptionBlock = createTextBlock(0, 'new caption');
        const newNext = insertAfterThis ? insertAfterThis.nextSibling : nextSibling;
        viewport.insertBefore(newCaptionBlock, newNext);
        blocks.splice(idx + parts.length, 0, newCaptionBlock);
      }
      renumberBlocks();
      rebuild();
    });
  }
  function estimateSplitTime(originalSec, partIndex, totalParts, originalText) {
    if (partIndex === 0) return originalSec;
    const roughTotalDur = Math.max(2, Math.min(8, originalText.length / 18));
    return originalSec + (partIndex / totalParts) * roughTotalDur;
  }
  function renumberBlocks() {
    blocks.forEach((b, i) => b.dataset.num = i + 1);
  }
  /* --------------------------------------------------------------
     6. VIEWPORT & EDITING CHECK
     -------------------------------------------------------------- */
  function isElementInViewport(el, container) {
    const r = el.getBoundingClientRect(), c = container.getBoundingClientRect();
    return r.top >= c.top && r.bottom <= c.bottom;
  }
  viewport.addEventListener('scroll', () => {
    if (editingBlock && !isElementInViewport(editingBlock, viewport)) {
      editingBlock.classList.remove('editing');
      editingBlock = null;
      rebuild();
    }
  });
  let timestamps = [], isHovering = false;
  viewport.addEventListener('mouseenter', () => isHovering = true);
  viewport.addEventListener('mouseleave', () => isHovering = false);
  const rebuild = () => {
    timestamps = blocks.map(b => ({
      sec: parseFloat(b.dataset.start) || 0,
      top: b.offsetTop,
      block: b
    })).sort((a, b) => a.sec - b.sec);
  };
  const origInit = initContent;
  initContent = txt => { origInit(txt); rebuild(); };
  let hoverBlock = null;
  viewport.addEventListener('mousemove', e => {
    if (editingBlock) return;
    const block = e.target.closest('.text-block');
    if (block && block !== hoverBlock) {
      hoverBlock = block;
      idDisplay.textContent = block.dataset.num;
      timeField.value = shortFormatTime(parseFloat(block.dataset.start) || 0);
      myPlayer.currentTime = parseFloat(block.dataset.start) || 0;
    }
  });
  viewport.addEventListener('mouseleave', () => { hoverBlock = null; });
  /* --------------------------------------------------------------
     7. TIME & NUDGE — USING <input>
     -------------------------------------------------------------- */
  function commitTime() {
    if (!editingBlock) return;
    const timeStr = timeField.value.replace(/[^\d:.]/g, '');
    let sec = 0;
    try {
      sec = parseShortTime(timeStr) || 0;
    } catch (_) {}
    editingBlock.dataset.start = sec;
    idDisplay.textContent = editingBlock.dataset.num;
    timeField.value = shortFormatTime(sec);
    rebuild();
  }
  timeField.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      timeField.blur();
    }
  });
  timeField.addEventListener('blur', commitTime);
  function nudge(ms) {
    if (!editingBlock) return;
    let sec = parseFloat(editingBlock.dataset.start) || 0;
    sec = Math.max(0, sec + msToSec(ms));
    editingBlock.dataset.start = sec;
    idDisplay.textContent = editingBlock.dataset.num;
    timeField.value = shortFormatTime(sec);
    myPlayer.currentTime = sec;
    rebuild();
  }
  nudgeDown.addEventListener('click', e => { e.stopPropagation(); nudge(-100); });
  nudgeUp.addEventListener('click', e => { e.stopPropagation(); nudge(+100); });

  // Helper to serialize current state to JSON string
  function makeProjectJSON() {
    const project = {
      blocks: blocks.map(b => ({
        number: parseInt(b.dataset.num),
        startTime: parseFloat(b.dataset.start),
        text: b.textContent.trim(),
        extras: b._cues || {}
      })),

        lastSelectedId: editingBlock ? parseInt(editingBlock.dataset.num) : 0,

      ui: {  // NEW: Save size/position
        width: editor.style.width,
        height: editor.style.height,
        left: editor.style.left,
        top: editor.style.top,
        transform: editor.style.transform
      }
    };
    return JSON.stringify(project, null, 2);
  }

  /* --------------------------------------------------------------
     8. GLOBAL API
     -------------------------------------------------------------- */
  window.CaptionEditor = {
open(source = '') {
  editor.style.display = 'flex';
  const center = () => {
    editor.style.left = '50%';
    editor.style.top = '50%';
    editor.style.transform = 'translate(-50%,-50%)';
  };
  center();
  window.addEventListener('resize', center);
  
if (source.trim().startsWith('{')) {
  const data = JSON.parse(source);
  viewport.innerHTML = '';  // Just clear, no initContent
  blocks = [];  // Reset array
  data.blocks.forEach(({ number, startTime, text, extras }) => {
    addBlock(number, startTime, text, extras || {});
  });
  if (data.lastSelectedId) {
    const selected = blocks.find(b => parseInt(b.dataset.num) === data.lastSelectedId);
    selected.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  if (data.ui) {
    Object.assign(editor.style, data.ui);
  }
} else {
    originalSRT = source;
    initContent(source);
    editor.style.width = '560px';
    editor.style.height = '400px';
    editor.style.left = '50%';
    editor.style.top = '50%';
    editor.style.transform = 'translate(-50%,-50%)';
  }
  
  idDisplay.textContent = '--';
  timeField.value = '';
  editing = 0;
  editor._resize = center;
},
    close() {
      if (editing === 1) {
        editing = makeProjectJSON();  // Set to full JSON string
      } else if (editing === 0) {
        editing = '';  // Clean: Empty
      }
      editor.style.display = 'none';
      if (editor._resize) window.removeEventListener('resize', editor._resize);
    },
    save(filename = 'project.cue.json') {
      const jsonText = makeProjectJSON();
      const blob = new Blob([jsonText], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };
  blocks.forEach(attachBlockListeners);
})();