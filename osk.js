function osk() {
  if (document.getElementById('osk')) return;
  const oskElement = document.createElement('div');
  oskElement.id = 'osk';
  document.body.appendChild(oskElement);
  const keysContainer = document.createElement('div');
  keysContainer.id = 'osk-keys';
  oskElement.appendChild(keysContainer);

  let isShift = false;
  let isNumMode = false;
  let isCtrl = false;
  let lastKeyTime = 0;
  let targetEl = null;
  let savedRange = null;
  let savedSel = null;

  function captureSelection() {
    const active = document.activeElement;
    if (!active) return;
    const isEditable = active.tagName === 'INPUT' ||
                       active.tagName === 'TEXTAREA' ||
                       active.isContentEditable;
    if (!isEditable) return;
    if (oskElement.contains(active)) return;
    targetEl = active;
    if (active.isContentEditable) {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) savedRange = sel.getRangeAt(0).cloneRange();
    } else {
      savedSel = { start: active.selectionStart, end: active.selectionEnd };
    }
  }

  function restoreSelection() {
    if (!targetEl) return false;
    targetEl.focus();
    if (targetEl.isContentEditable && savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    } else if (savedSel) {
      targetEl.selectionStart = savedSel.start;
      targetEl.selectionEnd = savedSel.end;
    }
    return true;
  }

  captureSelection();

  document.addEventListener('selectionchange', captureSelection);
  oskElement._selectionHandler = captureSelection;
  oskElement.addEventListener('mousedown', captureSelection, true);

function updateSuggestions() {
    requestAnimationFrame(() => {
    if (!targetEl) return
    const text = (targetEl.isContentEditable ? targetEl.innerText : targetEl.value).replace(/\u200B/g, '')
    const { words } = predict(text, predictBuffer)
    const btns = suggestionRow.querySelectorAll('.osk-suggestion')
    btns.forEach((btn, i) => {
      if (i < 6) {
        const w = words[i] || ''
        btn.textContent = w
        btn.style.visibility = 'visible'
        btn.onclick = w ? () => insertSuggestion(w) : null}})}
  )}

  function insertSuggestion(s) {
    if (!targetEl || !restoreSelection() || gesture) return
    const text = (targetEl.isContentEditable ? targetEl.innerText : targetEl.value).replace(/\u200B/g, '')
    const partial = predictBuffer || (window.getSelection().anchorNode?.textContent || '').slice(0, window.getSelection().anchorOffset).match(/\S+$/)?.[0] || ''
    if (!s) return
    if (targetEl.isContentEditable) {
      if (partial) {
        const sel = window.getSelection()
        const range = sel.getRangeAt(0)
        range.setStart(range.startContainer, Math.max(0, range.startOffset - partial.length))
        sel.removeAllRanges(); sel.addRange(range)}
      const r = window.getSelection().getRangeAt(0)
      const before = (r.startContainer.textContent?.slice(0, r.startOffset) || '')
      document.execCommand('insertText', false, (before.endsWith(' ') || before === '' ? '' : ' ') + s + ' ')}
else {
    const pos = targetEl.selectionStart ?? targetEl.value.length
    const before = targetEl.value.slice(0, pos)
    const after = targetEl.value.slice(pos)
    const base = partial ? before.slice(0, Math.max(0, before.length - partial.length)) : before
    const prefix = base === '' || base.endsWith(' ') ? '' : ' '
    targetEl.value = base + prefix + s + ' ' + after
    const newPos = (base + prefix + s + ' ').length
    targetEl.selectionStart = targetEl.selectionEnd = newPos}

    predictBuffer = ''
    captureSelection()
    updateSuggestions()
}

  const controlKeys = ["Num","Shift","Space","Del","Back","Enter","Ctrl","↑","↓"];

  let currentLayout = [
    ["q","w","e","r","t","y","u","i","o","p", "Space","Back"],
    ["Ctrl","a","s","d","f","g","h","j","k","l","?",'‹','›',"Enter","Del"],
    ["Shift","z","x","c","v","b","n","m",",",".","!","'",'"',"Num","Shift"]
  ];

let numLayout = [
  ["1","2","3","4","5","6","7","8","9","0","Space","Back"],
  ["@","#","£","$","%","^","&","*","(",")","-","+","=","Enter","Del"],
  ["Shift","~","_","[","]","{","}","\\","?",";",":","↑","↓","Num","Shift"]
];

  function createKeyboard() {
    keysContainer.innerHTML = '';
    const layout = isNumMode ? numLayout : currentLayout;
    layout.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'osk-row';

      row.forEach(key => {
        const btn = document.createElement('button');
        let displayKey = key;
        if (isShift && !controlKeys.includes(key)) {
          displayKey = key.toUpperCase();
        }
        
        btn.textContent = displayKey;
        btn.className = 'osk-key';
        
        if (key === "Space") btn.classList.add('osk-space');
        else  if (key === "Shift") btn.classList.add('osk-shift')
        else  if (key === "Enter") btn.classList.add('osk-enter')
        else  if (key === "Back") btn.classList.add('osk-back')
        else  if (key === "Ctrl") btn.classList.add('osk-ctrl')
        else if (controlKeys.includes(key)) btn.classList.add('osk-control')
        if  (key === "Enter"  ||  key === "Back" ||  key === "Shift" ||  key === "Ctrl")  btn.style.fontSize = '9px'

        if ((key === "Shift" && isShift) || 
            (key === "Ctrl" && isCtrl) || 
            (key === "Num" && isNumMode)) {
          btn.classList.add('active');
        }

        btn.setAttribute('tabindex', '-1');
        btn.addEventListener('mousedown', e => e.preventDefault())

        let pressTimer;
        let repeatTimer;

        btn.addEventListener('mousedown', () => {
          if (!['Shift', 'Num'].includes(key)) return;
          
          pressTimer = setTimeout(() => {
            btn.classList.add('locked');
            if (key === "Shift")  window.shiftLocked = true;
            if (key === "Num")    window.numLocked   = true;
          }, 320);
        });

        btn.addEventListener('mouseup', () => {
          clearTimeout(pressTimer);
          clearTimeout(repeatTimer);
        });

        btn.addEventListener('mouseleave', () => clearTimeout(repeatTimer));

        btn.addEventListener('click', () => {
            handleKey(key, btn);
            setTimeout(() => {
                captureSelection();
                requestAnimationFrame(updateSuggestions);
            }, 8);
        });

        btn.addEventListener('mousedown', () => {
          if (key !== "Back") return;
          
          const repeat = () => {
            handleKey("Back", btn);
            repeatTimer = setTimeout(repeat, 60);
          };
          repeatTimer = setTimeout(repeat, 300);
        });

        rowDiv.appendChild(btn);
      });
      keysContainer.appendChild(rowDiv);
    });
  }

  function handleKey(key, btn) {
    if (!targetEl || gesture) return;
    if (!restoreSelection()) return;
    btn.classList.add('highlight');
    setTimeout(() => btn.classList.remove('highlight'), 120);
    lastKeyTime = Date.now();

    if (key === "Ctrl") { isCtrl = !isCtrl; createKeyboard(); return }
    if (key === "Shift") { isShift = !isShift; if (!isShift) window.shiftLocked = false; createKeyboard(); return }
    if (key === "Num") { isNumMode = !isNumMode; if (!isNumMode) window.numLocked = false; createKeyboard(); return }

    const active = targetEl;
    let char = key;

    if (isCtrl && key.length === 1) {
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'x') {
        document.execCommand('cut');
        isCtrl = false;
        createKeyboard();
        return;
      }

      if (lowerKey === 'c') {
        document.execCommand('copy');
        isCtrl = false;
        createKeyboard();
        return;
      }

      if (lowerKey === 'v') {
        navigator.clipboard.readText().then(text => {
          if (text) document.execCommand('insertText', false, text)
        }).catch(() => {document.execCommand('paste')});
        isCtrl = false;
        createKeyboard();
        return;
      }

      const ev = new KeyboardEvent('keydown', { key: lowerKey, ctrlKey: true, bubbles: true });
      active.dispatchEvent(ev);
      isCtrl = false;
      createKeyboard();
      return;
    }

    if (key === "↑" || key === "↓") {
      const ev = new KeyboardEvent('keydown', { key: key === "↑" ? "ArrowUp" : "ArrowDown", bubbles: true });
      active.dispatchEvent(ev);
      captureSelection();
      return;
    }

if (key === "‹" || key === "›") {
  if (!restoreSelection()) return;
  const active = targetEl;
  const isCE = active.isContentEditable;
  if (isCE) {
    const sel = window.getSelection();
    if (sel.rangeCount) {
      try {
        const dir = (key === "↑" || key === "↓") ? "line" : "character";
        const forward = (key === "↓" || key === "›");
        sel.modify("move", forward ? "forward" : "backward", dir);
      } catch (_) {
      }
    }
  } else {
    let pos = active.selectionStart ?? 0;
    const len = active.value.length;

    if (key === "‹") pos = Math.max(0, pos - 1);
    else if (key === "›") pos = Math.min(len, pos + 1);

    active.selectionStart = active.selectionEnd = pos;
  }
  captureSelection();
  return;
}


    if (key === "Space") char = " ";
    else if (key === "Back") {
      predictBuffer = predictBuffer.slice(0, -1);
      const ev = new KeyboardEvent('keydown', {key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true});
      active.dispatchEvent(ev);
      captureSelection();
      return;
    }
    else if (key === "Del") {
      if (active.isContentEditable) document.execCommand('forwardDelete');
      else {
        let pos = active.selectionStart || 0;
        active.value = active.value.slice(0, pos) + active.value.slice(pos+1);
        active.selectionStart = active.selectionEnd = pos;
      }
      captureSelection();
      return;
    }
    else if (key === "Enter") {
      predictBuffer = '';
      const event = new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', bubbles: true, cancelable: true});
      active.dispatchEvent(event);
      captureSelection();
      return;
    }
    else {
      if (isShift) {
        const shiftMap = {";":":", ",":"<", ".":">", "'":"\"", "-":"_", "?":"/", "£":"~"};
        char = shiftMap[key] || key.toUpperCase();
      } else {
        char = key.toLowerCase();
      }
    }

    if (active.isContentEditable) {
      document.execCommand('insertText', false, char);
    } else {
      let pos = active.selectionStart || active.value.length;
      active.value = active.value.slice(0, pos) + char + active.value.slice(active.selectionEnd);
      active.selectionStart = active.selectionEnd = pos + 1;
    }
    captureSelection();
    if (key === 'Space') predictBuffer = ''; else predictBuffer += char;

    if ((isShift && !window.shiftLocked) || 
        (isCtrl  && !window.ctrlLocked)  || 
        (isNumMode && !window.numLocked)) {
      
      isShift = isCtrl = isNumMode = false;
      window.shiftLocked = window.ctrlLocked = window.numLocked = false;
      createKeyboard();
    }
  }

  const suggestionRow = document.createElement('div');
  suggestionRow.id = 'osk-suggestions';
  
  for (let i = 0; i < 6; i++) {
    const wordBtn = document.createElement('button');
    wordBtn.className = 'osk-key osk-suggestion';
    wordBtn.setAttribute('tabindex', '-1');
    wordBtn.style.visibility = 'visible';
    suggestionRow.appendChild(wordBtn);
  }

//  if (captions) 
oskElement.prepend(suggestionRow);

  if (!oskElement.style.position) oskElement.style.position = 'fixed';

  oskElement.addEventListener('wheel', (e) => {
    if (captions && editingBlock) {
      const vp = document.getElementById('viewport');
      if (vp) {
        vp.scrollBy({
          top: e.deltaY,
          left: e.deltaX || 0,
          behavior: 'auto'
        });
      }
    }
  }, { passive: true });

  if (suggestionRow) {
    suggestionRow.addEventListener('wheel', (e) => {
      if (captions && editingBlock) {
        const vp = document.getElementById('viewport');
        if (vp) vp.scrollBy({ top: e.deltaY, behavior: 'auto' });
      }
    }, { passive: true });
  }

  oskElement.addEventListener('contextmenu', e => e.preventDefault(), true)

  function positionKeyboard() {
    const kbRect = oskElement.getBoundingClientRect();
    const kbHeight = kbRect.height || 220;
    const kbWidth = kbRect.width || 400;
    let left = xPos - kbWidth / 2
    let top = yPos + 20
    if (overBlock) {
      const block = overBlock?.getBoundingClientRect();
      left = block.left + block.width/2 - kbWidth / 2; 
      top = block.bottom + 12}
    oskElement.style.left = left + 'px'
    oskElement.style.top  = top + 'px'
  }
  createKeyboard();
  positionKeyboard();
  buildPredictor()
}

function buildPredictor() {
  predictor.words = {};   // start empty

  // 1. Load from dictionary.txt (optional, but boosted)
  fetch("/inca/cache/apps/dictionary.txt")
    .then(r => {
      if (!r.ok) throw new Error("Dictionary not found");
      return r.text();
    })
    .then(dictText => {
      const dictWords = dictText.replace(/\u200B/g, '').toLowerCase().match(/\b[\w']+\b/g) || [];
      dictWords.forEach(w => {
        predictor.words[w] = (predictor.words[w] || 0) + 8;  // dictionary gets priority
      });
      console.log(`Loaded ${dictWords.length} words from dictionary.txt`);
    })
    .catch(() => {
      console.log("No dictionary.txt found - using only current text");
    })
    .finally(() => {
      // 2. Always include words from current captions/blocks
      const text = blocks.map(b => b.innerText).join(' ').replace(/\u200B/g, '').toLowerCase();
      const currentWords = text.match(/\b[\w']+\b/g) || [];
      currentWords.forEach(w => {
        predictor.words[w] = (predictor.words[w] || 0) + 1;
      });
    });
}

function predict(text, buffer) {
  const sel = window.getSelection();
  const textBefore = sel.rangeCount ?
    (sel.getRangeAt(0).startContainer.textContent?.slice(0, sel.getRangeAt(0).startOffset) || '') : '';
  const partial = (buffer || (textBefore.match(/\S+$/) || [''])[0]).toLowerCase();

  const out = Object.keys(predictor.words)
    .filter(w => w.startsWith(partial))
    .sort((a, b) => (predictor.words[b] || 0) - (predictor.words[a] || 0))
    .slice(0, 6);
  return { words: out };
}

function closeOsk() {
  const oskEl = document.getElementById('osk');
  if (oskEl) {
    if (oskEl._selectionHandler) {
      document.removeEventListener('selectionchange', oskEl._selectionHandler);
    }
    if (oskEl._inputHandler) {
      document.removeEventListener('input', oskEl._inputHandler);
    }
    isShift = isCtrl = isNumMode = false;
    window.shiftLocked = window.ctrlLocked = window.numLocked = false;
    oskEl.remove()
    title.blur()
    return 1
  }
}