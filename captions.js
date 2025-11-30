
/* ===================================================================
   CAPTION EDITOR MODULE
   =================================================================== */


/* ===================================================================
   IMPORTED GLOBALS - overEditor, editing, myPlayer, myCancel
   =================================================================== */


;(function () {
  /* ------------------------------------------------------------------
     0. SETUP & DOM INJECTION
     ------------------------------------------------------------------ */
  const old = document.getElementById('caption-editor-module');
  if (old) old.remove();

  const container = document.createElement('div');
  container.id = 'caption-editor-module';
  container.style.cssText = 'all:initial; font-family:system-ui,sans-serif; color:#ffc0cbbb;';

  container.innerHTML = `
    <style>
      #caption-editor-module * { box-sizing:border-box; margin:0; padding:0; }
      #editor { display:none; flex-direction:column; width:500px; max-width:100%; height:24em;
        background:#080707; border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.6);
        position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index: 5002;
        min-width:250px; min-height:160px; resize:both; max-height:80vh; overflow:hidden; }
      #ribbon { background:#1a1a1a20; padding:6px 8px; display:flex; gap:6px; align-items:center;
        flex-wrap:wrap; user-select:none; flex-shrink:0; justify-content:center;}
      .dropdown { position:relative; display:inline-block;}
      .dropdown > .header {
        background: #1a1a1a80; color: #ffc0cb99; border-radius:6px; height: 1.6em;
        font-size:12px; white-space:nowrap; display:flex; align-items:center; cursor:default;
      }
      .dropdown-content {
        position: absolute; bottom:100%; min-width:50%; background: #1a1a1a;
        box-shadow:0 4px 12px rgba(0,0,0,0.5); border-radius: 6px;
        display:none; z-index:1; padding-bottom:8px; 
        overflow-y:auto; flex-direction:column; gap:2px; 
      }
      .dropdown-content > div {
        font-size:12.5px; white-space:nowrap; cursor:default; border-radius: 10px;
      }
      .dropdown-content > div:hover { background:#2a2a2a; }
.caption-viewport {
  flex:1; 
  overflow-y:auto; 
  padding:1em; 
  background:#1a1a1a20;
  display:flex; 
  flex-direction:column; 
  gap:1.1em; 
  min-height:0;
  scrollbar-width:thin; 
  scrollbar-color:#ffc0cb30 transparent; 
  overflow-x: hidden;
  position: relative;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black        6%,
    black        94%,
    transparent  100%
  );
}
      .text-block {
        background:transparent; border-radius:6px; text-align:center; white-space:pre-wrap;
        word-wrap:break-word; font-size:1em; font-family:'Yu Gothic'; line-height:1.5;
        color:#ffc0cb99; outline:none; width: 92%; align-self: center;
      }
      .text-block.editing { border-left: 0.1px solid #ffc0cb40; border-right: 0.1px solid #ffc0cb40; }
      #voice-header > .header { width:8em; justify-content:center; padding: 0 1em }
      #voice-header .dropdown-content {height: 8em; padding: 0.5em 0.5em; line-height: 1.6; }
      #media-header > .header { width:12em; overflow:hidden; text-overflow:ellipsis; justify-content:center; }
      #media-header .dropdown-content {height: 10.4em; padding: 0.5em 0.5em; translate: -5em}
      #id-display { 
        background:transparent; border:none; color:#ffc0cb99; font-size:12px;
        outline:none; min-width:34px; text-align:center; }
      #time-display {
        width:70px; background:inherit; color:#ffc0cb99; border:none; outline:none;
        text-align:center; font-size:12px; font-family:inherit; border-radius:4px;
        user-select:none; cursor:pointer;
      }
      #myCancel {
        position: absolute; top: 0.5em; right: 0;
        visibility:hidden; text-align:center; min-width:3.5em; color:red;
        transition:0.6s; background:#1a1a1a00; cursor:pointer; font-size: 0.85em;
      }
    </style>

    <div id="editor">
      <div class="caption-viewport" id="viewport"></div>
      <div id="ribbon">
        <div id='myCancel' class="dropdown-header" onmouseout="this.innerHTML='✕'">✕</div>

        <div id="id-header" class="dropdown">
          <div class="header"><div id="id-display">--</div></div>
        </div>

        <div id="media-header" class="dropdown">
          <div class="header">Media</div>
          <div class="dropdown-content"><div>No media</div></div>
        </div>

        <div id="voice-header" class="dropdown">
          <div class="header">Voice</div>
          <div class="dropdown-content">
            <div>Sarah</div><div>Tracy</div><div>Michelle</div><div>Brian</div>
          </div>
        </div>
        <div id="time-header" class="dropdown">
          <div class="header"><div id="time-display">- : -- . -</div></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  /* ------------------------------------------------------------------
     1. CORE ELEMENTS
     ------------------------------------------------------------------ */
  const editor   = container.querySelector('#editor');
  const viewport = container.querySelector('#viewport');
  viewport.style.paddingTop    = '6em';
  viewport.style.paddingBottom = '7em';
  const ribbon = container.querySelector('#ribbon');
  const idDisplay = container.querySelector('#id-display');
  const timeDisplay = container.querySelector('#time-display');

  const mediaHeader = container.querySelector('#media-header > .header');
  const mediaContent = container.querySelector('#media-header .dropdown-content');
  const voiceHeaderText = container.querySelector('#voice-header > .header');
  const voiceContent = container.querySelector('#voice-header .dropdown-content');

  let originalSrt = '';
  let blocks = [];
  let editingBlock = null;
  let originalPlayerSrc = '';
  let projectMedia = { defaultSrc: null };
  let currentVoiceName = 'Voice';

  let timestamps = [];
  let hoverBlock = null;
  let isScrolling = false;
  let userWantsPlay = false;
  let currentPreviewItem = null;

  /* ------------------------------------------------------------------
     2. DROPDOWN BEHAVIOR (now robust via class + data)
     ------------------------------------------------------------------ */
  container.querySelectorAll('.dropdown').forEach(dropdown => {
    const header = dropdown.querySelector('.header');
    const content = dropdown.querySelector('.dropdown-content');
    if (!header || dropdown.id === 'id-header' || dropdown.id === 'time-header') return;

    const show = () => {
      container.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');
      if (content) content.style.display = 'flex';
    };
    const hide = () => { if (content) content.style.display = 'none'; };

    dropdown.addEventListener('click', show);
    dropdown.addEventListener('mouseleave', hide);
  });

  /* ------------------------------------------------------------------
     3. TIME UTILITIES
     ------------------------------------------------------------------ */
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
  function formatTime(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }
  function shortFormatTime(sec) {
    if (!sec) return '- : -- . -';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return `${m} : ${s.replace('.', ' . ')}`;
  }

  /* ------------------------------------------------------------------
     4. BLOCK MANAGEMENT
     ------------------------------------------------------------------ */
  function createBlock(num, startSec, text, cues = {}) {
    const block = document.createElement('pre');
    block.className = 'text-block';
    block.dataset.num = num;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text;
    block._cues = cues;
    block._media = cues.media || null;
    block._voice = cues.voice || null;
    attachBlockListeners(block);
    return block;
  }

  function addBlock(num, startSec, text, cues = {}) {
    const block = createBlock(num, startSec, text, cues);
    viewport.appendChild(block);
    blocks.push(block);
    return block;
  }

  function estimateSplitTime(originalSec, partIndex, totalParts, originalText) {
    if (partIndex === 0) return originalSec;
    const roughTotalDur = Math.max(2, Math.min(8, originalText.length / 18));
    return originalSec + (partIndex / totalParts) * roughTotalDur;
  }
  function renumberBlocks() {
    blocks.forEach((b, i) => b.dataset.num = i + 1);
  }

  function rebuildTimestamps() {
    timestamps = blocks.map(b => ({
      sec: parseFloat(b.dataset.start) || 0,
      top: b.offsetTop,
      block: b
    })).sort((a, b) => a.sec - b.sec);
  }

  /* ------------------------------------------------------------------
     5. MEDIA & VOICE HANDLING
     ------------------------------------------------------------------ */
  function getEffectiveMedia(block = null) {
    if (block?._media?.src) return block._media;
    return projectMedia.defaultSrc ? { src: projectMedia.defaultSrc } : null;}


function updateMediaHeader() {mediaHeader.textContent = (editingBlock?._media?.name || originalSrt).replace(/\.[^.]+$/, '');}

function updateVoiceHeader(block) {
  if (!block?._voice) {
    voiceHeaderText.textContent = 'Voice';
    return;
  }
  if (block._voice.name) {
    voiceHeaderText.textContent = block._voice.name;
  } else {
    voiceHeaderText.textContent = 'Voice';
  }
}

  async function loadVoices() {
    try {
      const resp = await fetch('/inca/assets/voices.json');
      if (!resp.ok) throw '';
      const data = await resp.json();
      voiceContent.innerHTML = '';
      const none = document.createElement('div');
      none.textContent = 'None';
      none.style.color = '#ffc0cb88';
      none.onclick = () => {
        if (editingBlock) { delete editingBlock._voice; updateVoiceHeader(editingBlock); editing = 1; }
      };
      voiceContent.appendChild(none);

      data.voices.forEach(v => {
        const div = document.createElement('div');
        div.textContent = v.name;
        div.dataset.voiceId = v.id;
div.onclick = () => {
  if (!editingBlock) return;
  editingBlock._voice = { 
    src: editingBlock._voice?.src || null,
    id: v.id, 
    name: v.name 
  };
  updateVoiceHeader(editingBlock);
  editing = 1;
};
        voiceContent.appendChild(div);
      });
    } catch (e) {
      voiceContent.innerHTML = '<div style="color:#ffc0cb66;padding:8px;">voices.json not found</div>';
    }
  }


  /* ------------------------------------------------------------------
     6. PLAYER SYNC & INTERACTION
     ------------------------------------------------------------------ */
  function swapPlayerMedia(src, time) {
    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(src);
    if (isImage) {
      myPlayer.src = '';
      myPlayer.poster = src;
      myPlayer.load();
    } else {
      myPlayer.poster = '';
      if (decodeURIComponent(myPlayer.src) !== src) myPlayer.src = src;
    }
    myPlayer.currentTime = time;
 }

  function scrollToNearestCaption() {
    if (decodeURIComponent(myPlayer.src) !== originalPlayerSrc || isScrolling || overEditor) return;
    const current = myPlayer.currentTime;
    const nearest = timestamps.reduce((a, b) =>
      Math.abs(b.sec - current) < Math.abs(a.sec - current) ? b : a
    );
    const offset = viewport.clientHeight / 2 - nearest.block.offsetHeight / 2;
    viewport.scrollTo({ top: Math.max(0, nearest.top - offset), behavior: 'smooth' });
    isScrolling = true;
    setTimeout(() => isScrolling = false, 1000);
  }



const activateBlock = (block, options = {}) => {
  const { edit = false, play = userWantsPlay } = options;
  if ((editingBlock && !edit) || longClick) return;
  const isSameBlock = (editingBlock === block);
  idDisplay.textContent = block.dataset.num;
  timeDisplay.textContent = shortFormatTime(parseFloat(block.dataset.start) || 0);
  const media = getEffectiveMedia(block);
  if (isSameBlock) swapPlayerMedia(media?.src || originalPlayerSrc, myPlayer.currentTime || 0);
  else swapPlayerMedia(media?.src || originalPlayerSrc, parseFloat(block.dataset.start) || 0);
  if (block._voice?.src) {
    myPlayer.muted = true;
    myPic.muted = defMute;
    myPic.src = block._voice.src;
    if (!isSameBlock && play) {
      myPic.currentTime = 0;
      myPlayer.play();
      myPic.play();}
    else {myPic.pause(); myPlayer.pause()}
  } 
  else {
    myPic.muted = true;
    myPlayer.muted = defMute;
    myPic.pause();
    myPic.src = '';
    if (!isSameBlock && play) myPlayer.play();
    else {myPic.pause(); myPlayer.pause()}
  }
  if (edit && !isSameBlock) {
    document.querySelectorAll('.text-block.editing').forEach(b => b.classList.remove('editing'));
    block.classList.add('editing');
    editingBlock = block;
    if (block._voice?.src && play) {
      myPic.currentTime = 0;
      myPic.play();
    }
  updateMediaHeader();
  updateVoiceHeader(block);
  }
};


/* ------------------------------------------------------------------
     7. BLOCK EVENT LISTENERS – FINAL SIMPLE & BULLETPROOF VERSION
   ------------------------------------------------------------------ */
function attachBlockListeners(block) {

  viewport.addEventListener('click', () => {
    if (editingBlock) {
      editingBlock.classList.remove('editing');
      splitIfNeeded(editingBlock);       // ← split before losing focus
      editingBlock = null;
    }
  });

  block.addEventListener('mouseenter', () => {
    activateBlock(block, { edit: false, play: userWantsPlay });
  });

  block.addEventListener('click', e => {
    e.stopPropagation();
    if (editingBlock && editingBlock !== block) {splitIfNeeded(editingBlock)}
    editingBlock?.classList.remove('editing');
    block.classList.add('editing');
 //   editingBlock = block;
    activateBlock(block, { edit: true, play: true });
  });

  block.addEventListener('keydown', e => {
    if (e.key !== 'Backspace') return;
    if (window.getSelection().toString()) return; // selection → let browser delete

    const range = window.getSelection().getRangeAt(0);
    if (range.startOffset !== 0) return;

    const prev = block.previousElementSibling;
    if (!prev?.classList.contains('text-block')) return;

    e.preventDefault();
    prev.focus();
    const len = prev.innerText.length;
    prev.innerText += '\n' + block.innerText;
    prev.innerHTML = prev.innerHTML; // preserve <br> → \n

    block.remove();
    blocks = blocks.filter(b => b !== block);
    renumberBlocks();
    requestAnimationFrame(() => {
      const r = document.createRange();
      r.setStart(prev.firstChild || prev, len + 1);
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    });
  });

  block.addEventListener('input', () => 
    requestAnimationFrame(() => myPlayer.pause())
  );

  function splitIfNeeded(blockToSplit) {
    const html = blockToSplit.innerHTML;
    const text = blockToSplit.innerText.trim();
    if (!text) {
      blockToSplit.remove();
      blocks = blocks.filter(b => b !== blockToSplit);
      renumberBlocks();
      rebuildTimestamps();
      return;
    }

    let normalized = html
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<(div|p)[^>]*>/gi, '\n')
      .replace(/<\/(div|p)>/gi, '')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\n\n+/g, '\n\n')
      .trim();

    const hasTrailingEmpty = html.endsWith('<br>') || /<br>\s*$/i.test(html);
    if (hasTrailingEmpty) normalized = normalized.replace(/\n\n$/, '');

    const parts = normalized.split('\n\n').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 1 && !hasTrailingEmpty) return;

    const startSec = parseFloat(blockToSplit.dataset.start) || 0;
    const nextSibling = blockToSplit.nextSibling;
    const idx = blocks.indexOf(blockToSplit);

    blockToSplit.remove();
    blocks = blocks.filter(b => b !== blockToSplit);

    parts.forEach((part, i) => {
      const newBlock = createBlock(
        null,
        i === 0 ? startSec : startSec + i * 2.5,
        part,
        { media: blockToSplit._media, voice: blockToSplit._voice }
      );
      viewport.insertBefore(newBlock, nextSibling);
      blocks.splice(idx + i, 0, newBlock);
    });

    if (hasTrailingEmpty) {
      const empty = createBlock(null, 0, ' ', {});
      viewport.insertBefore(empty, nextSibling);
      blocks.splice(idx + parts.length, 0, empty);
      empty.focus();
    }

    renumberBlocks();
    rebuildTimestamps();
    editing = 1;
  }
}

  /* ------------------------------------------------------------------
     8. PLAYER STATE TRACKING
     ------------------------------------------------------------------ */

  myPlayer.addEventListener('timeupdate', () => {
    scrollToNearestCaption();
    updateTimeDisplay();
  });
  ['play', 'pause', 'seeked', 'loadedmetadata'].forEach(evt =>
    myPlayer.addEventListener(evt, updateTimeDisplay)
  );

  function updateTimeDisplay() {
    const current = myPlayer.currentTime;
    timeDisplay.textContent = current ? shortFormatTime(current) : '- : -- . -';
    if (editingBlock && myPlayer.paused && Math.abs(current - (parseFloat(editingBlock.dataset.start) || 0)) > 0.1) {
      timeDisplay.style.color = 'red';
    } else {
      timeDisplay.style.color = null;
    }
  }

  timeDisplay.addEventListener('click', () => {
    if (!editingBlock) return;
    timeDisplay.style.color = null;
    editingBlock.dataset.start = myPlayer.currentTime;
    timeDisplay.textContent = shortFormatTime(myPlayer.currentTime);
    rebuildTimestamps();
    editing = 1;
  });

  /* ------------------------------------------------------------------
     9. MEDIA DROPDOWN POPULATION
     ------------------------------------------------------------------ */
  container.querySelector('#media-header').addEventListener('click', async () => {
    container.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');
    mediaContent.style.display = 'flex';

    try {

const folderName = originalSrt;
const resp = await fetch('/inca/fav/History.m3u');
const historyText = resp.ok ? (await resp.text()).trim() : '';
const text  = historyText + (historyText ? '\n' : '');
const lines  = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
if (!lines.length) throw '';

      const items = lines.map(line => {
        const [path, startStr] = line.split('|');
        const startSec = parseFloat(startStr) || 0;
        const name = path.split(/[\\/]/).pop();
        const short = name.length > 60 ? name.slice(0, 60) + '...' : name;
        const url = 'http://localhost:3000/' + path.replace(/\\/g, '/');
        return { url, startSec, name, short };
      }).filter(i => i.url && !i.name.endsWith('.txt') && !i.name.endsWith('.m3u'));

      mediaContent.innerHTML = '';
      const none = document.createElement('div');
      none.textContent = 'None';
      none.style.marginLeft = '1.7em';
      none.onclick = () => {
        if (editingBlock) editingBlock._media = null;
        else { projectMedia.defaultSrc = null; }
        updateMediaHeader();
        swapPlayerMedia(originalPlayerSrc, myPlayer.currentTime);
        editing = 1;
      };
      mediaContent.appendChild(none);

items.forEach(item => {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '6px';
  row.style.padding = '2px 4px';
  row.style.cursor = 'default';

if (item.url.includes('.mp3')) {row.style.borderLeft = '0.2px solid pink'; row.dataset.isVoiceAsset = 'true';}


        const mute = document.createElement('span');
        mute.textContent = '🔇';
        mute.style.fontSize = '14px';
        mute.dataset.muted = 'true';

        const label = document.createElement('span');
        label.textContent = `${item.short} @ ${item.startSec.toFixed(1)}s`;
        label.style.flex = '1';

        row.append(mute, label);
        mediaContent.appendChild(row);

        row.addEventListener('mouseenter', () => {
          if (currentPreviewItem === row) return;
          currentPreviewItem = row;
          const isImage = /\.(jpe?g|png|gif|webp)$/i.test(item.url);
          if (isImage) myPlayer.poster = item.url;
          else {
            myPlayer.src = item.url;
            myPlayer.currentTime = item.startSec;
            myPlayer.muted = mute.dataset.muted === 'true';
            myPlayer.play().catch(() => {});
          }
          myPlayer.load();
        });

        row.addEventListener('mouseleave', () => {
          if (currentPreviewItem === row) {
            myPlayer.src = originalPlayerSrc;
            myPlayer.poster = '';
            myPlayer.load();
            myPlayer.pause();
            currentPreviewItem = null;
          }
        });

        mute.addEventListener('click', e => {
          e.stopPropagation();
          const muted = mute.dataset.muted !== 'true';
          mute.dataset.muted = muted;
          mute.textContent = muted ? '🔇' : '🔊';
myPlayer.play()
          if (currentPreviewItem === row) myPlayer.muted = muted;
        });

        label.addEventListener('click', () => {
          const mediaObj = { src: item.url, name: item.short };
          if (editingBlock) {
            if (row.dataset.isVoiceAsset === 'true') {
              editingBlock._voice = { 
                src: item.url,
                name: editingBlock._voice?.name || null,
                id: editingBlock._voice?.id || null
                }
              updateVoiceHeader(editingBlock);
              }
            else {
              editingBlock._media = mediaObj;
              editingBlock.dataset.start = item.startSec;
              timeDisplay.textContent = shortFormatTime(item.startSec);
              rebuildTimestamps();
              }
            editingBlock = null;
            editing = 1;
          } else {
            projectMedia.defaultSrc = mediaObj.src;
          }
          updateMediaHeader();
          swapPlayerMedia(mediaObj.src, item.startSec);
          myPlayer.muted = mute.dataset.muted === 'true';
          if (!myPlayer.muted) myPlayer.play().catch(() => {});
        });
      });

mediaContent.scrollTop = mediaContent.scrollHeight;

    } catch (_) {
      mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:8px;">No media</div>';
    }
  });


function makeProjectJSON() {
  const data = {
    ui: {
      width: editor.style.width,
      height: editor.style.height,
      left: editor.style.left,
      top: editor.style.top,
      transform: editor.style.transform
    },
    defaultMedia: projectMedia.defaultSrc ? {
      src: projectMedia.defaultSrc.replace(/\\/g, '/')
    } : null,
    lastSelectedId: editingBlock ? parseInt(editingBlock.dataset.num) : 0,
    blocks: blocks.map(b => ({
      number: parseInt(b.dataset.num),
      startTime: parseFloat(b.dataset.start) || null,
      text: b.innerText.trim(),
      extras: {
        media: b._media ? { src: b._media.src.replace(/\\/g, '/'), name: b._media.name } : null,
        voice: b._voice ? {
          src: b._voice.src ? b._voice.src.replace(/\\/g, '/') : null,
          id: b._voice.id || null,
          name: b._voice.name || null
        } : null
      }
    }))
  };
  return JSON.stringify(data, null, 2);
}


  /* ------------------------------------------------------------------
     Helper: super-robust parser (JSON → SRT → plain text)
     ------------------------------------------------------------------ */
  function parseInputText(text) {          // ← changed to normal function declaration
    text = text.trim();
    if (!text) return { blocks: [] };

    // 1. Try JSON first
    if (text.startsWith('{') || text.startsWith('[')) {
      try { return JSON.parse(text); } catch (e) {}
    }

    const blocksOut = [];
    const paragraphs = text.split(/\r?\n\r?\n+/);   // double enter = new caption

    paragraphs.forEach((para, i) => {
      const lines = para.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;

      let startSec = i * 3.5;           // auto-spacing for plain text
      let caption  = para.trim();

      // SRT detection
      if (/^\d+$/.test(lines[0])) {
        const m = (lines[1] || '').match(/(\d{1,2}:[\d.,:]+)\s*--?>\s*\d/);
        if (m) {
          startSec = parseSrtTimeFlexible(m[1]);
          caption  = lines.slice(2).join('\n');
        }
      } else {
        const m = lines[0].match(/^(\d{1,2}:[\d.,:]+)\s*--?>\s*\d/);
        if (m) {
          startSec = parseSrtTimeFlexible(m[1]);
          caption  = lines.slice(1).join('\n');
        }
      }

      if (caption.trim()) {
        blocksOut.push({
          number: blocksOut.length + 1,
          startTime: startSec,
          text: caption.trim(),
          extras: {}
        });
      }
    });

    // Fallback – one big block if nothing matched
    if (!blocksOut.length && text) {
      blocksOut.push({ number: 1, startTime: 0, text: text, extras: {} });
    }

    return { blocks: blocksOut };
  }

  /* ------------------------------------------------------------------
     Flexible SRT time parser
     ------------------------------------------------------------------ */
  function parseSrtTimeFlexible(t) {
    t = t.replace(',', '.').trim();
    const parts = t.split(':').map(p => parseFloat(p) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(t) || 0;
  }




  /* ------------------------------------------------------------------
     11. PUBLIC API
     ------------------------------------------------------------------ */
  window.CaptionEditor = {
    open(src = '', text = '') {
      originalSrt = src.split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
      editor.style.display = 'flex';
      if (type == 'video') originalPlayerSrc = decodeURIComponent(myPlayer.src || '');
      else originalPlayerSrc = decodeURIComponent(myPlayer.poster || '');
      userWantsPlay = !defPause;

      const center = () => {
        editor.style.left = '50%';
        editor.style.top = '50%';
        editor.style.transform = 'translate(-50%,-50%)';
      };
      center();
      window.addEventListener('resize', center);

      loadVoices();
      container.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');

      const parsed = parseInputText(text);

      viewport.innerHTML = '';
      blocks = [];

      parsed.blocks.forEach(b => {
        const block = addBlock(
          b.number || (blocks.length + 1),
          b.startTime || 0,
          b.text || '',
          b.extras || {}
        );
        if (b.extras?.media) block._media = b.extras.media;
        if (b.extras?.voice) block._voice = b.extras.voice;
      });

      updateMediaHeader();
      projectMedia.defaultSrc = originalPlayerSrc || null;
      if (projectMedia.defaultSrc) swapPlayerMedia(projectMedia.defaultSrc, 0);

      if (parsed.lastSelectedId) {
        const blk = blocks.find(b => +b.dataset.num === parsed.lastSelectedId);
        if (blk) setTimeout(() => blk.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
      }

      if (parsed.ui) Object.assign(editor.style, parsed.ui);
      if (!blocks.length) addBlock(1, myPlayer.currentTime, 'new caption');
      rebuildTimestamps();

      editor.style.height = Math.min(blocks.length * 3, 24) + 'em';
      viewport.style.padding = blocks.length < 4 ? '2em 1em' : '6em 1em 7em 1em';
      const ui = parsed.ui || {};
      Object.assign(editor.style, ui);

      editor.style.top = myPlayer.offsetTop + myPlayer.offsetHeight + 'px'

      const observer = new MutationObserver(() => editing = 1);
      observer.observe(viewport, { childList: true, subtree: true, characterData: true });
      editor._mutationObserver = observer;
      editor._resize = center;
    },

    close() {
      if (editor._mutationObserver) editor._mutationObserver.disconnect();
      if (editing === 1) editing = makeProjectJSON();
      else editing = 0;
      editingBlock = null
      overEditor = false;
      editor.style.display = null
    }
  };

  editor.addEventListener('mouseenter', () => overEditor = true);
  editor.addEventListener('mouseleave', () => overEditor = false);

  function isElementInViewport(el, container) {
    const r = el.getBoundingClientRect(), c = container.getBoundingClientRect();
    return r.top >= c.top && r.bottom <= c.bottom;
  }

})();