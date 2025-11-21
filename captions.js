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
        background: #1a1a1a20; border-radius:12px;
        box-shadow:0 12px 32px rgba(0,0,0,0.6); position:fixed; left:50%; top:50%;
        transform:translate(-50%,-50%); min-width:300px; min-height:300px;
        resize:both; max-height:80vh; z-index:490; overflow: hidden;
      }
      #caption-editor-module #ribbon {
        background:#1a1a1a20; padding:6px 10px; display:flex; gap:6px;
        align-items:center; flex-wrap:wrap; user-select:none;
        flex-shrink:0; position:relative; z-index:10; justify-content:center;
      }
      #caption-editor-module .dropdown-header { position:relative; display:inline-block; }
      #caption-editor-module .dropdown-header > div:first-child {
        background:#1a1a1a80; color:#ffc0cb99; border-radius:4px; padding:3px 6px;
        font-size:12px; white-space:nowrap; position:relative; z-index:2;
        display:flex; align-items:center; gap:4px;
      }
      #caption-editor-module .dropdown-content {
        position:absolute; bottom:100%; left:0; min-width:100%; background: #1a1a1a;
        border:1px solid #444; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,0.5);
        display:none; z-index:1; padding-bottom:8px; max-height:96px;
        overflow-y:auto; display:flex; flex-direction:column; gap:2px;
      }
      #caption-editor-module .dropdown-content > div {
        padding:4px 8px; font-size:12px; white-space:nowrap;
        border-radius:4px;
      }
      #ribbon .dropdown-header:nth-of-type(2) > div:first-child {
        width: 12em; overflow: hidden; text-overflow: ellipsis;
        white-space: nowrap; display: flex; justify-content: center;
      }
      #caption-editor-module .dropdown-content > div:hover { background: #2a2a2a;}
      #caption-editor-module .caption-viewport {
        flex:1; overflow-y:auto; overflow-x:hidden; padding:16px;
        background: #1a1a1a20; display:flex; flex-direction:column; gap:16px; min-height:0;
        scrollbar-width: thin; scrollbar-color: #ffc0cb30 transparent;
      }
      #caption-editor-module .text-block {
        background: transparent; border-radius:6px; text-align: center;
        white-space:pre-wrap; word-wrap:break-word; font-size:1em; font-family: 'Yu Gothic';
        line-height:1.5; color:#ffc0cb99; outline:none
      }
      #caption-editor-module .text-block.editing { border-right: 0.1px solid pink; }
      #caption-editor-module .text-block:not(.editing) { border-left: none }
      #id-header > div:first-child {display: flex; justify-content: center; align-items: center; cursor: default; }
      #id-display {
        background:transparent; border:none; color:#ffc0cb99; font-size:12px;
        outline:none; min-width:34px;
      }
      #time-header > div:first-child { cursor:pointer; }
      #time-display {
        flex:1; width:70px;
        background:inherit; color:#ffc0cb99; border:none;
        outline:none; text-align:center;
        font-size:12px; font-family:inherit;
        border-radius:4px; padding:2px 0;
        user-select:none;
      }
    </style>
    <div id="editor">
      <div class="caption-viewport" id="viewport"></div>
      <div id="ribbon">
        <div class="dropdown-header" id="id-header"><div id="id-display">--</div></div>
        <div class="dropdown-header"><div>Media</div><div class="dropdown-content"><div>No media</div></div></div>
        <div class="dropdown-header" id="time-header"><div id="time-display">- : -- . -</div></div>
        <div class="dropdown-header"><div>Voice</div><div class="dropdown-content"><div>Sarah</div><div>Tracy</div><div>Michelle</div><div>Brian</div></div></div>
        <div class="dropdown-header"><div>Video</div><div class="dropdown-content"><div>No videos yet</div></div></div>
        <div class="dropdown-header"><div>Style</div><div class="dropdown-content"><div>Normal</div></div></div>
      </div>
    </div>
    <div id="editor-context">
      <a id="editor-new-voice">New Voice</a>
      <a id="editor-paste-text">Paste as new blocks</a>
    </div>
  `;

  document.body.appendChild(container);

  const editor = container.querySelector('#editor');
  const ribbon = container.querySelector('#ribbon');
  const viewport = container.querySelector('#viewport');
  const idDisplay = container.querySelector('#id-display');
  const timeDisplay = container.querySelector('#time-display');
  let blocks = [];
  let editingBlock = null;
  let originalSRT = '';
  let originalPlayerSrc = '';
  let projectMedia = { defaultSrc: null, defaultName: null };
  const mediaHeader = container.querySelector('.dropdown-header:nth-of-type(2)');
  const mediaHeaderDiv = mediaHeader.querySelector('div:first-child');
  const voiceDropdownContent = container.querySelector('#ribbon .dropdown-header:nth-of-type(4) .dropdown-content');
  const voiceHeaderText = container.querySelector('#ribbon .dropdown-header:nth-of-type(4) > div:first-child'); // the "Voice" button text
  let currentVoiceName = 'Voice'; // default

  /* --------------------------------------------------------------
     1. DROPDOWNS
     -------------------------------------------------------------- */
  container.querySelectorAll('.dropdown-header:not(#id-header):not(#time-header)').forEach(header => {
    const content = header.querySelector('.dropdown-content');
    header.addEventListener('mouseenter', () => {
      container.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
      if (content) content.style.display = 'block';
    });
    header.addEventListener('click', () => {if (content) content.style.display = 'none';});
    header.addEventListener('mouseleave', () => {if (content) content.style.display = 'none';});
  });


async function loadVoices() {
  try {
    const resp = await fetch('/inca/assets/voices.json');
    if (!resp.ok) throw '';
    const data = await resp.json();
    voiceDropdownContent.innerHTML = '';
    const noneDiv = document.createElement('div');
    noneDiv.textContent = 'None';
    noneDiv.style.color = '#ffc0cb88';
    noneDiv.onclick = () => {
      if (!editingBlock) return;
      delete editingBlock._voice;
      voiceHeaderText.textContent = 'Voice';
      editing = 1;
    };
    voiceDropdownContent.appendChild(noneDiv);
    data.voices.forEach(v => {
      const div = document.createElement('div');
      div.textContent = v.name;
      div.dataset.voiceId = v.id;
      div.style.padding = '4px 8px';
      div.style.cursor = 'default';
      div.onclick = () => {
        if (!editingBlock) return;
        const text = editingBlock.innerText.trim();
        if (!text) return;

        editingBlock._voice = { id: v.id, name: v.name };
        voiceHeaderText.textContent = v.name;
        editing = 1;
        // inca('ElevenVoice', ...);
      };
      voiceDropdownContent.appendChild(div);
    });
  } catch (e) {
    voiceDropdownContent.innerHTML = '<div style="color:#ffc0cb66;padding:8px;">voices.json not found</div>';
  }
}

function updateVoiceHeader(block) {
  if (block?._voice?.name) {
    voiceHeaderText.textContent = block._voice.name;
  } else {
    voiceHeaderText.textContent = 'Voice';
  }
}

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
    if (!sec || sec === 0) return '-- : - . -'
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return `${m} : ${s.replace('.', ' . ')}`;
  }

  /* --------------------------------------------------------------
     3. BLOCK CREATION
     -------------------------------------------------------------- */
  function addBlock(num, startSec, text, cues = {}) {
    const block = document.createElement('pre');
    block.className = 'text-block';
    block.dataset.num = num;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text;
    block._cues = cues;
    block._media = cues.media || null;
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
      addBlock(1, 0, ' ', {});
      idDisplay.textContent = '--';
      timeDisplay.textContent = '';
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
    const block = document.createElement('pre');
    block.className = 'text-block';
    block.dataset.num = null;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text;
    block._cues = cues;
    block._media = cues.media || null;
    attachBlockListeners(block);
    return block;
  }
  function getEffectiveMedia(forBlock = null) {
    if (forBlock && forBlock._media && forBlock._media.src) {
      return forBlock._media;
    }
    return projectMedia.defaultSrc ? { src: projectMedia.defaultSrc, name: projectMedia.defaultName } : null;
  }

function updateMediaHeader(block = null) {
  const label = document.querySelector('#ribbon .dropdown-header:nth-of-type(2) div:first-child');
  if (!label) return;
  const titleText = ((title?.value || '').trim().substring(0, 24) + (title?.value?.trim()?.length > 24 ? '…' : ''));
  const mediaName = (block?._media?.name || projectMedia.defaultName || '').replace(/\.[^.]+$/, '');
  label.textContent = mediaName || titleText;
}

  function swapPlayerMedia(newSrc, startSec) {
    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(newSrc);
    if (isImage) {
      myPlayer.src = '';
      myPlayer.poster = newSrc.replace(/%/g, '%25').replace(/#/g, '%23').replace(/&/g, '%26');
      myPlayer.load();
    } else {
      myPlayer.poster = ''
      if (newSrc != decodeURIComponent(myPlayer.src)) {
        myPlayer.src = newSrc.replace(/%/g, '%25').replace(/#/g, '%23').replace(/&/g, '%26');
        myPlayer.load();
      }
      myPlayer.currentTime = startSec;
    }
  }

  function attachBlockListeners(block) {
    block.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.text-block.editing').forEach(b => b.classList.remove('editing'));
      editingBlock = block;
      block.classList.add('editing');
      const num = block.dataset.num;
      const start = parseFloat(block.dataset.start) || 0;
      idDisplay.textContent = num;
      timeDisplay.textContent = shortFormatTime(start);
      const eff = getEffectiveMedia(block);
      const src = eff ? eff.src : originalPlayerSrc;
      swapPlayerMedia(src, start);
      myPlayer.currentTime = start
      if (userWantsPlay) myPlayer.play()
      updateMediaHeader(editingBlock);
    });


block.addEventListener('keydown', e => {
  if (e.key !== 'Backspace') return;
  if (window.getSelection().toString() !== '') document.execCommand('delete')
  const range = window.getSelection().getRangeAt(0);
  const charBefore = range.startContainer.textContent[document.getSelection().getRangeAt(0).startOffset - 1]
  if (charBefore === '\n') { document.execCommand('delete'); document.execCommand('insertText', false, '  ')}
  if (range.rangeCount === 0) return;
  const testRange = document.createRange();
  testRange.selectNodeContents(block);
  testRange.setEnd(range.startContainer, range.startOffset);
  if (testRange.toString() !== '') return;
  const prev = block.previousElementSibling;
  if (!prev?.classList.contains('text-block')) return;
  e.preventDefault();
  const prevText = prev.innerText.trim();
  const currText = block.innerText.trim();
  prev.innerText = prevText + '\n' + currText;
  prev.innerHTML = prev.innerText;  // ← Strips all tags, keeps \n
  block.remove();
  blocks = blocks.filter(b => b !== block);
  renumberBlocks();
  editingBlock = prev;
  editingBlock.focus();
  const r = document.getSelection().getRangeAt(0);
  r.setStart(r.startContainer, prevText.length + 1);
  idDisplay.textContent = prev.dataset.num;
  timeDisplay.textContent = shortFormatTime(+prev.dataset.start || 0);
  updateMediaHeader(prev);
  requestAnimationFrame(rebuild);
});

block.addEventListener('input', () => {myPlayer.pause()});

    block.addEventListener('mouseleave', () => {
      const html = block.innerHTML;
      const text = block.innerText.trim();
      if (!text) {
        block.remove();
        blocks = blocks.filter(b => b !== block);
        renumberBlocks();
        requestAnimationFrame(rebuild);
        return;
      }
      const normalized = html
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/&#10;/g, '\n')
        .replace(/<(div|p)[^>]*>/gi, '\n')
        .replace(/<\/(div|p)>/gi, '')
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
        const newBlock = createTextBlock(i === 0 ? startSec : estSec, part, block._cues);
        viewport.insertBefore(newBlock, nextSibling);
        blocks.splice(idx + i, 0, newBlock);
        insertAfterThis = newBlock;
        newBlock.focus()
      });
      if (hasTrailingEmpty) {
        const newCaptionBlock = createTextBlock(0, 'new caption', {});
        const newNext = insertAfterThis ? insertAfterThis.nextSibling : nextSibling;
        viewport.insertBefore(newCaptionBlock, newNext);
        blocks.splice(idx + parts.length, 0, newCaptionBlock);
      }
      renumberBlocks();
      requestAnimationFrame(rebuild);
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
     6. VIEWPORT & HOVER
     -------------------------------------------------------------- */

editor.addEventListener('mouseenter', () => {overEditor = true;});
editor.addEventListener('mouseleave', () => {
  overEditor = false;
  document.querySelectorAll('.text-block.editing').forEach(b => {b.classList.remove('editing')});
});


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
  viewport.addEventListener('mouseleave', () => {
    isHovering = false;
    hoverBlock = null;
  });
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


let isScrolling = false;

function scrollToNearestCaption() {
  if (decodeURIComponent(myPlayer.src) != originalPlayerSrc || isScrolling || overEditor) return;
  const current = myPlayer.currentTime;
  const nearest = timestamps.reduce((prev, curr) =>
    Math.abs(curr.sec - current) < Math.abs(prev.sec - current) ? curr : prev
  );
  const offset = viewport.clientHeight / 2 - nearest.block.offsetHeight / 2;
  viewport.scrollTo({
    top: Math.max(0, nearest.top - offset),
    behavior: 'smooth'
  });
isScrolling = true;
  setTimeout(() => { isScrolling = false; }, 1000);
}


  /* --------------------------------------------------------------
     PLAYER PAUSE-STATE PRESERVATION
     -------------------------------------------------------------- */
  let userWantsPlay = !myPlayer.paused;

  myPlayer.addEventListener('play', () => userWantsPlay = true);
  myPlayer.addEventListener('pause', () => userWantsPlay = false);
  myPlayer.addEventListener('timeupdate', scrollToNearestCaption);

  viewport.addEventListener('mousemove', e => {
    if (editingBlock) return;
    const block = e.target.closest('.text-block');
    if (block && block !== hoverBlock) {
      hoverBlock = block;
      idDisplay.textContent = block.dataset.num;
      const start = parseFloat(block.dataset.start) || 0;
      timeDisplay.textContent = shortFormatTime(start);
      const eff = getEffectiveMedia(block);
      const src = eff ? eff.src : originalPlayerSrc;
      swapPlayerMedia(src, start);
      if (userWantsPlay) myPlayer.play().catch(() => {});
      updateMediaHeader(block);
      updateVoiceHeader(block);
    }
  });

  viewport.addEventListener('mouseleave', () => {
    hoverBlock = null;
  });

  /* --------------------------------------------------------------
     7. TIME DISPLAY (LIVE) + CLICK TO SET BLOCK
     -------------------------------------------------------------- */

  ['play', 'pause', 'seeked', 'timeupdate', 'loadedmetadata'].forEach(evt =>
    myPlayer.addEventListener(evt, updateTimeDisplay));

  function updateTimeDisplay() {
    if (dur && myPlayer.paused && editingBlock && myPlayer.currentTime != editingBlock.dataset.start) timeDisplay.style.color = 'red'
    else timeDisplay.style.color = null
    timeDisplay.textContent = (myPlayer.currentTime && myPlayer.src) ? shortFormatTime(myPlayer.currentTime) : '- : -- . -'
  }

  timeDisplay.addEventListener('click', () => {
    timeDisplay.style.color = null
    if (!editingBlock) return;
    const current = myPlayer.currentTime;
    editingBlock.dataset.start = current;
    timeDisplay.textContent = shortFormatTime(current);
    requestAnimationFrame(rebuild);
    editing = 1;
  });

  /* --------------------------------------------------------------
     MEDIA DROPDOWN
     -------------------------------------------------------------- */
  let mediaCache = null;
  let currentPreviewItem = null;
  const mediaContent = mediaHeader.querySelector('.dropdown-content');

  mediaHeader.addEventListener('mouseenter', async () => {
    container.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    mediaContent.style.display = 'block';
    try {
      const resp = await fetch('/inca/fav/History.m3u');
      if (!resp.ok) {
        mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:4px 8px;">Failed to load</div>';
        return;
      }
      const text = await resp.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) {
        mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:4px 8px;">No media</div>';
        return;
      }
      const allItems = lines.map(line => {
        const [fullPath, startStr] = line.split('|');
        const startSec = parseFloat(startStr) || 0;
        const name = fullPath.split(/[\\/]/).pop();
        const short = name.length > 22 ? name.slice(0, 24) + '...' : name;
        const httpPath = 'http://localhost:3000/' + fullPath.replace(/\\/g, '/');
        return { path: httpPath, startSec, name, short };
      })
      .filter(m => m.path && m.name)
      .filter(m => !m.name.endsWith('.txt') && !m.name.endsWith('.m3u'))
      .filter((() => {
        let titleSeen = false;
        return m => m.name.includes(title.value) ? !titleSeen && (titleSeen = true) : true;
      })());
      const list = allItems;
      mediaContent.innerHTML = '';
      if (!list.length) {
        mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:4px 8px;">No media</div>';
        return;
      }
      mediaContent.insertAdjacentHTML('beforeend', '<div style="margin-left:1.7em">None</div>');
      mediaContent.lastChild.onclick = () => {
        if (editingBlock) editingBlock._media = null;
        else projectMedia.defaultSrc = projectMedia.defaultName = null;
        updateMediaHeader(editingBlock);
        swapPlayerMedia(originalPlayerSrc, myPlayer.currentTime);
        mediaContent.style.display = 'none';
        editing = 1;
      };

      list.forEach(media => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '6px';
        row.style.padding = '2px 4px';
        row.style.borderRadius = '4px';
        row.style.cursor = 'default';
        const muteBtn = document.createElement('span');
        muteBtn.textContent = '🔇';
        muteBtn.style.fontSize = '14px';
        muteBtn.style.cursor = 'pointer';
        muteBtn.dataset.muted = 'true';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${media.short} @ ${media.startSec.toFixed(1)}s`;
        nameSpan.style.flex = '1';
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.userSelect = 'none';
        row.appendChild(muteBtn);
        row.appendChild(nameSpan);
        mediaContent.appendChild(row);
        row.addEventListener('mouseenter', () => {
          if (currentPreviewItem === row) return;
          currentPreviewItem = row;
          const isImage = /\.(jpe?g|png|gif|webp)$/i.test(media.path);
          if (isImage) myPlayer.poster = media.path.replace(/%/g, '%25').replace(/#/g, '%23').replace(/&/g, '%26');
          else myPlayer.src = media.path.replace(/%/g, '%25').replace(/#/g, '%23').replace(/&/g, '%26');
          myPlayer.load();
          if (!isImage) {
            myPlayer.muted = (muteBtn.dataset.muted === 'true');
            myPlayer.currentTime = media.startSec;
            myPlayer.play().catch(() => {});
          updateVoiceHeader(editingBlock);
          }
        });
        row.addEventListener('mouseleave', () => {
          if (currentPreviewItem !== row) return;
          myPlayer.src = originalPlayerSrc;
          myPlayer.poster = ''
          myPlayer.load();
          myPlayer.pause();
          currentPreviewItem = null;
          updateVoiceHeader(editingBlock);
        });
        muteBtn.addEventListener('click', e => {
          e.stopPropagation();
          const willBeMuted = muteBtn.dataset.muted !== 'true';
          muteBtn.dataset.muted = willBeMuted;
          muteBtn.textContent = willBeMuted ? '🔇' : '🔊';
          if (currentPreviewItem === row) {
            myPlayer.muted = willBeMuted;
            if (willBeMuted) myPlayer.pause();
            else myPlayer.play().catch(() => {});
          }
        });
        nameSpan.addEventListener('click', () => {
          const selectedMediaObj = { src: media.path, name: media.short };
          let applyStart = media.startSec;
          if (editingBlock) {
            editingBlock._media = selectedMediaObj;
            const newStart = media.startSec;
            editingBlock.dataset.start = newStart;
            timeDisplay.textContent = shortFormatTime(newStart);
            idDisplay.textContent = editingBlock.dataset.num;
            applyStart = newStart;
            requestAnimationFrame(rebuild);
            if (media.path == originalPlayerSrc) editingBlock._media = null;
            editingBlock = null;
            editing = 1;
          } else {
            projectMedia.defaultSrc = selectedMediaObj.src;
            projectMedia.defaultName = selectedMediaObj.name;
            updateMediaHeader();
          }
          swapPlayerMedia(selectedMediaObj.src, applyStart);
          myPlayer.muted = (muteBtn.dataset.muted === 'true');
          if (!myPlayer.muted) myPlayer.play().catch(() => {});
          updateMediaHeader(editingBlock);
          mediaContent.style.display = 'none';
        });
      });
      mediaCache = list;
    } catch (_) {
      mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:4px 8px;">No media</div>';
    }

  });

  mediaHeader.addEventListener('mouseleave', () => {
    mediaContent.style.display = 'none';
    if (currentPreviewItem) {
      myPlayer.src = originalPlayerSrc;
      myPlayer.load();
      myPlayer.pause();
      currentPreviewItem = null;
    }
  });

  function normalizePathForJSON(path) {
    return path ? path.replace(/\\/g, '/') : path;
  }
  function makeProjectJSON() {
    const project = {
      blocks: blocks.map(b => ({
        number: parseInt(b.dataset.num),
        startTime: b.dataset.start ? parseFloat(b.dataset.start) : null,
        text: b.innerText.trim(),
        extras: {
          ...(b._cues || {}),
          media: b._media ? { src: normalizePathForJSON(b._media.src), name: b._media.name } : null,
          voice: b._voice ? { id: b._voice.id, name: b._voice.name } : null   // ← ADD THIS LINE
        }
      })),
      defaultMedia: projectMedia.defaultSrc ? {
        src: normalizePathForJSON(projectMedia.defaultSrc),
        name: projectMedia.defaultName
      } : null,
      lastSelectedId: editingBlock ? parseInt(editingBlock.dataset.num) : 0,
      ui: {
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
      container.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
      editor.style.display = 'flex';
      originalPlayerSrc = decodeURIComponent(myPlayer.src || '');
      const center = () => {
        editor.style.left = '50%';
        editor.style.top = '50%';
        editor.style.transform = 'translate(-50%,-50%)';
      };
      center();
      window.addEventListener('resize', center);
      loadVoices();
      if (source.trim().startsWith('{')) {
        const data = JSON.parse(source);
        viewport.innerHTML = '';
        blocks = [];
data.blocks.forEach(({ number, startTime, text, extras }) => {
  const block = addBlock(number, startTime, text, extras || {});
  if (extras?.media) block._media = extras.media;
  if (extras?.voice) {
    block._voice = extras.voice;
  }
});
        projectMedia.defaultSrc = data.defaultMedia?.src || null;
        projectMedia.defaultName = data.defaultMedia?.name || null;
        updateMediaHeader();
        if (data.lastSelectedId) {
          const selected = blocks.find(b => parseInt(b.dataset.num) === data.lastSelectedId);
          if (selected) {
            selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { selected.focus()}, 600);
          }
        }
        if (data.ui) Object.assign(editor.style, data.ui);
        if (projectMedia.defaultSrc && myPlayer.src !== projectMedia.defaultSrc) {
          swapPlayerMedia(projectMedia.defaultSrc, 0);
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
      const options = { childList: true, subtree: true, characterData: true };
      const observer = new MutationObserver(() => { editing = 1});
      observer.observe(viewport, options);
      setTimeout(() => editing = 0, 100);
      idDisplay.textContent = '--';
      timeDisplay.textContent = '';
      updateTimeDisplay();
      editor._resize = center;
    },
    close() {
      if (editing === 1) { editing = makeProjectJSON() }
      else editing = 0
      editor.style.display = null;
      if (editor._resize) window.removeEventListener('resize', editor._resize);
    }
  };
  blocks.forEach(attachBlockListeners);
})();