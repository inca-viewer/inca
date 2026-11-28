
  let wheel = 0								// wheel count
  let wheelDir = 0		 					// wheel direction
  let index = 1								// thumb index (e.g. thumb14)
  let listView = 0							// list or thumb view
  let filt = 0								// media list filter
  let playlist								// full .m3u filepath
  let captions = 0							// captions enabled
  let type = ''								// audio, video, image, document...
  let cue = 0								// cue time
  let cues = ''								// list of cue actions at media times
  let playing = 0							// myPlayer active
  let thumbSheet = 0							// 6x6 thumbsheet mode
  let sheets = 0								// htm thumbs show 6x6 sheets
  let mouseDown = 0							// state is cleared after mouseup
  let lastClick = 0							// state is preserved after mouseup
  let lastMedia = 0							// previous media
  let lastSeek = 0							// previous media time
  let start = 0								// start time
  let defStart = 0							// default start
  let longClick = 0							// state is preserved
  let gesture = 0							// click and slide event
  let selected = ''							// list of selected media in page
  let overMedia = 0							// over thumb or myPlayer
  let overTitle = 0							// text input fields, allow cut paste
  let overEditor = 0							// over editor panel
  let editing = 0							// 1 = over textarea 2 = editing
  let incaBusy = 0							// messaging to server
  let Zindex = 1							// element zIndex
  let rect								// element dimensions
  let size = 0								// file size (from inca)
  let dur = 0								// duration (from inca)
  let rate = 1								// myPlayer speed
  let skinny = 1							// media width
  let zoom = 1								// context myPic zoom
  let xw = 0.5								// cursor over window ratio
  let yw = 0.5
  let xm = 0								// cursor over media ratio
  let ym = 0
  let xPos = 0								// cursor xy in pixels
  let yPos = 0
  let xRef = 0								// click cursor xy
  let yRef = 0
  let cursor = 0							// hide cursor timer
  let delay = 0								// delay timer events
  let aspect = 1							// media width to height ratio
  let mediaX = 0							// centre of myPlayer
  let mediaY = 0
  let xyz = []								// thumbSheet x,y scaleY
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed
  let defMute = 0							// default mute
  let defPause = 0							// default pause state
  let pitch = 0								// default pitch
  let lastIndex = 0							// for lazy loading more
  let end = 0
  let sheetUrl = ''							// thumbSheet url
  let overBlock = ''							// caption editor block
  let progress = 0							// player progress in block
  let more = 0
  let clickMedia = ''
  let lastId = ''
  let listSize = 0
  let favIndex = -1
  let matchIndex = -1
  let searchTerm = ''
  let blocks = []
  let lastBlock = 0
  let lastVoice = ''
  let lastText = ''
  let previewMode = 0
  let editingBlock = null
  let originalPlayerSrc = ''
  let seekTimer = 0							// hide myPic
  let syncPlay = 0
  let userPlay = 0
  let crawl = 0								// crawl to next block
  let predictBuffer = '';
  let predictor = { words: {} }
  let currentPreviewItem = null;
  let server = 'http://localhost:3000/'
  let projectMedia = { defaultSrc: null, ui: {} }
  let scaleY = (innerHeight > innerWidth) ? 0.65 : 0.55			// myPlayer height (screen ratio)
  let timeout = 0
  let overTimer = 0
  let matches = 0
  let undo = []								// undo snapshots (caption JSON)
  let repl = []								// find & replace: [block, old text]
  let voices = []
  let faceZoom = 1
  let offset = 0
  let nudgeAt = 0, nudgeEnd = 0							// last wheel nudge: time, end side
  let crop = 0

  let entry = document.createElement('div')				// dummy thumb container
  let thumb = document.createElement('div')				// . thumb element
  let title = document.createElement('div')				// . title element
  let favicon = document.createElement('div')				// favorite or cc icon
  let myVoice = document.createElement('audio')
  let intervalTimer = setInterval(timerEvent,94)			// background tasks every 94mS

  const ribbon = document.querySelector('#ribbon')
  const viewport = document.querySelector('#viewport')
  const mediaHeader = document.querySelector('#media-header > .header')
  const mediaContent = document.querySelector('#media-header .dropdown-content')
  const searchHeader = document.querySelector('#search-header')
  const searchInput = document.querySelector('#caption-search-input')
  const matchCountSpan  = document.querySelector('#search-match-count')
  const myPlayerWrap = document.getElementById('myPlayerWrap')
  const myCentre = Object.assign(document.createElement('div'), {id: 'myCentre'})		// tight centre group: width, cancel, undo
  document.getElementById('media-header').after(myCentre); myCentre.append(myCancel)
  myCancel.before(Object.assign(document.createElement('a'), {id: 'myEdWidth', innerHTML: '|&harr;|'}))	// editor width control
  const myUndo = Object.assign(document.createElement('div'), {id: 'myUndo', innerHTML: '<a>&#x21B6;</a><div class="undo-list"></div>'})
  myCancel.after(myUndo)								// undo dropdown, rows built on hover
  const myTimes = Object.assign(document.createElement('div'), {id: 'myTimes', innerHTML: '<span></span><span></span>'})
  document.body.append(myTimes)							// start / end under myPlayer
  const searchOv = Object.assign(document.createElement('div'), {id: 'search-ov'})	// replace mode colours
  searchInput.after(searchOv); searchOv.style.font = getComputedStyle(searchInput).font

  document.addEventListener('mousedown', Click)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('keydown', keyDown)
  myContent.addEventListener('scroll', () => seekTimer = cursor = 0)
  function padTop() { myView.style.paddingTop = Math.max(0, innerHeight - 0.46 * screen.height) + 'px' }
  padTop(); addEventListener('resize', padTop)
  function barLine() { barLine.y = z1.getBoundingClientRect().top }			// top of the bottom bar: thumbs below it are hidden
  function underBar() { return !playing && yPos > barLine.y }				// pointer over the bar, not the thumbs under it
  barLine(); addEventListener('resize', barLine)
  document.addEventListener('dragstart', () => gesture = 1)
  for (const d of [myUndo, mediaHeader.parentElement]) { d.addEventListener('mouseleave', dropLeave); d.addEventListener('mouseenter', dropStay) }
  document.addEventListener('drop', (e) => { mouseDown = 0; gesture = 0; if (overEditor) activateBlock(e.target.closest('.text-block'),0) })
  myPlayer.addEventListener('ended', playerEnded)
  myPlayer.addEventListener('timeupdate', playerProgress)
  myPlayer.addEventListener('play', () => { if (editingBlock) editingBlock._atEnd = 0 })
  myPlayer.addEventListener('loadedmetadata', () => { fitPlayer(myPlayer.videoWidth, myPlayer.videoHeight) })
  document.addEventListener('loadedmetadata', fitThumb, true)
  document.addEventListener('mouseover', thumbHover)
  window.addEventListener('beforeunload', (e) => { if (playing && editing) e.preventDefault() })
  myNav.addEventListener('wheel', wheelEvent, { passive: false })
  myNav.addEventListener('mouseleave', closeContext)

  myPanel.querySelector('.panel').addEventListener('wheel', e => {
    e.preventDefault()
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < delay) return
    panelStep(Math.sign(e.deltaY)); wheel = 0; delay = 150}, { passive: false })
  myStart.addEventListener('wheel', wheelEvent, { passive: false })
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState == 'visible' && folder == 'downloads' && !selected && !playing) inca('Reload',2,index)})
  myInca.addEventListener('mouseenter', () => {
    const isAlt = myAlt.style.display === 'block'					// toggle context menus
    myAlt.style.display = isAlt ? '' : 'block'
    myDefault.style.display = isAlt ? 'block' : 'none'})
  searchHeader.addEventListener('wheel', nextMatch)
  searchHeader.addEventListener('mouseleave', () => {searchInput.placeholder='🔍︎'; const m = repl.at(-1)?.[0] || matchIndex > 0 && matches[matchIndex]; if (m) activateBlock(m, 0)})
  searchHeader.addEventListener('click', (e) => {
    searchTerm = searchInput.value = ''; paintSearch(); blocks.forEach(b => {b.style.color = ''; b.textContent = b.textContent})})
  searchHeader.addEventListener('mouseenter', (e) => {
    let sel = window.getSelection().toString()
    if (sel) {searchTerm = searchInput.value = sel}
    else searchInput.placeholder='❤'})
  searchInput.addEventListener('input', newSearch)
  searchInput.addEventListener('input', paintSearch)
  searchInput.addEventListener('keydown', e => e.key == 'ArrowRight' && replArrow() && e.preventDefault())	// replace mode
  viewport.addEventListener('input', () => {
    editing = 1; userPlay = syncPlay = 0;
    if (editingBlock?.querySelector('.text-block')) editingBlock.innerText = editingBlock.innerText})
  viewport.addEventListener('wheel', wheelEvent)
  editor.addEventListener('wheel', wheelEvent)						// face zoom
  myVoice.addEventListener('ended', () => {
    const b = editingBlock
    if (b?._atEnd) { syncPlay = 0; return }
    if (!b?.nextElementSibling) { if (myPlayer.currentTime >= endOf(b) - 0.05) { userPlay = syncPlay = 0; myPlayer.pause() } return }
    b && playing && dur && !b._atEnd && myPlayer.currentTime < endOf(b) - 0.05 || nextCaption()})
  myPlayer.requestVideoFrameCallback(function onFrame(now, m) {
    const b = editingBlock
    const live = captions && b && playing && !crawl && !overMedia && !myPlayer.paused
    const stop = b && (b._atEnd || overEditor || captions == 1)
    if (live && stop && m.mediaTime >= endOf(b) - 0.01) toEnd(b, 1)
    myPlayer.requestVideoFrameCallback(onFrame)})
  const endOf = b => b._end
  const voiceBusy = b => b?._voice?.src && !myVoice.ended
  const voiceLen = b => b?._voice?.src && isFinite(myVoice.duration) ? myVoice.duration * rate : 0
  const setEnd = (b, t) => {
    const n = b.nextElementSibling
    b._end = +t
    if (n && !b.dataset.end) n.dataset.start = t
    else b.dataset.end = t }
  const toEnd = (b, stay) => {
    b._atEnd = 1; myPlayer.pause()
    if (!voiceBusy(b)) syncPlay = 0
    const e = endOf(b); if (!stay && isFinite(e)) myPlayer.currentTime = e }
  const caret = b => {
    const s = getSelection(); if (!s.isCollapsed || !b?.contains(s.anchorNode)) return
    const r = new Range(); r.selectNodeContents(b); r.setEnd(s.anchorNode, s.anchorOffset)
    const n = r.toString().length, len = b.textContent.trimEnd().length
    return { f: Math.min(n / (len || 1), 1), pos: n >= len ? 'end' : n ? 0 : 'start' }}
  const fitRate = b => {
    const v = b?._voice?.src && myVoice.duration / (b._rate || 1) + (b._delay || 0)
    const r = ((+b?.dataset.end || +b?.nextElementSibling?.dataset.start || b?._end) - b?.dataset.start) / v
    return r > 0 ? Math.min(rate * 1.4, Math.max(rate * 0.6, r)) : rate}
  const trigger = () => {
    if (playing) return Math.min(0.95, Math.max(0.85, 0.85 + (scaleY - 0.5) * 0.2))
    return Math.min(0.9, Math.max(0.75, 0.75 + ((thumb.offsetHeight / innerHeight) - 0.12) * 0.8))}
  const line = () => { const v = viewport.getBoundingClientRect(); return v.top + v.height / 2 - 64 }	// target line, 4em above centre
  const toLine = (b, smooth) => {								// crawl, myMask, search: block onto the target line
    if (!b) return; if (captions == 1) return b.scrollIntoView({ block: 'center' })
    viewport.scrollBy({ top: b.getBoundingClientRect().top - line(), behavior: smooth ? 'smooth' : 'instant' })}
  const mmss = (t, cs) => Math.floor(t / 60) + ':' + (cs ? (t % 60).toFixed(2).padStart(5, '0') : String(Math.floor(t % 60)).padStart(2, '0'))
  const myCrop = Object.assign(document.createElement('div'), {style: 'position:fixed;display:none;border:1px dashed red;pointer-events:none;z-index:9999'})
  const natEnd = b => { const n = b.nextElementSibling; return Math.max(+b.dataset.start, n ? +n.dataset.start || 0 : dur || Infinity) }


  function Click(e) {
    longClick = gesture = 0
    if (e.key == 'F22') mouseDown = lastClick = 3
    else if (e.button != 2) mouseDown = lastClick = e.button + 1
    if (mouseDown == 2) e.preventDefault()						// forward and back mouse buttons
    xRef = xPos; yRef = yPos
    if (underBar()) overMedia = 0							// thumb under the bar: click as empty space
    clickMedia = overMedia
    timeout = setTimeout(() => {longClick = mouseDown; clickEvent(e)},280)}		// detect long click


  function mouseUp(e) {
    if (!mouseDown) return
    clearTimeout(timeout)
    if (crop && cropSend()) { longClick = gesture = mouseDown = 0; return }
    if (!longClick) clickEvent(e)
    longClick = wheel = gesture = mouseDown = 0}


  function keyDown(e) {									// keyboard events
    if (captions && editingBlock && !/^F2[234]$/.test(e.key)) userPlay = syncPlay = 0
    if (e.key == 'Enter' && captions) {e.preventDefault(); e.stopImmediatePropagation(); splitIfNeeded(e)}
    else if (e.key == 'Enter' && !playing) {
      if (overTitle == 2) inca('Rename', title.value, lastMedia)			// rename title
      else inca('SearchBox','','',myInput.value)}					// search for media
    else if (e.key == 'F22') Click(e)							// R click down
    else if (e.key == 'F23') mouseUp(e)							// R click up
    else if (e.key == 'F24' || (e.code == 'ArrowLeft' && e.shiftKey)) mouseBack()
    else if (e.key === 'Backspace') Backspace(e)
    else if (e.key === 'Delete' && captions && editingBlock?.nextElementSibling && caret(editingBlock)?.pos === 'end') mergeNext(e)
    else if (captions && editingBlock && !e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const c = caret(editingBlock)
      let sib = e.key === 'ArrowUp' ? editingBlock.previousElementSibling : editingBlock.nextElementSibling
      if (!sib && e.key === 'ArrowUp' && c?.pos === 'start') {
        sib = createBlock(1, +editingBlock.dataset.start || 0, '', '0')
        editingBlock.before(sib)
        blocks.unshift(sib)
        renumberBlocks()}
      if (sib && ((e.key === 'ArrowUp' && c?.pos === 'start') || (e.key === 'ArrowDown' && c?.pos === 'end'))) {
        e.preventDefault()
        activateBlock(sib, userPlay)
        setTimeout(() => { 
          sib.focus()
          const range = document.createRange()
          range.selectNodeContents(sib)
          range.collapse(e.key === 'ArrowUp')
          getSelection().removeAllRanges()
          getSelection().addRange(range)}, 0)}}
    else if (e.shiftKey && editingBlock && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const sib = e.key === 'ArrowUp' ? editingBlock.previousElementSibling : editingBlock.nextElementSibling
      if (sib) { e.key === 'ArrowUp' ? sib.before(editingBlock) : sib.after(editingBlock); editing = 1} renumberBlocks()}
    else if (!overTitle && !captions && playing) {
      if (e.key == 'ArrowRight') myPlayer.currentTime += 10
      else if (e.key == 'ArrowLeft') myPlayer.currentTime -= 10
      else if (e.key == 'ArrowDown') {longClick = 0; lastClick = 2; clickEvent(e)}
      else if (e.key == 'ArrowUp') {lastClick = longClick = 2; clickEvent(e)}}}


  async function clickEvent(e) {
    delay = 80										// 80 max
    let id = e.target.id								// id under cursor
    let emotion = '[' + e.target.dataset.tag + '] '
    overBlock = document.elementFromPoint(xPos, yPos)?.closest('.text-block') || 0
    let block = overBlock || editingBlock || document.querySelector('.text-block.editing')
    if (document.elementFromPoint(xPos, yPos)?.closest('#voice-faces')) { if (longClick != 1) newVoice(e); return }
    if (e.target.closest('#emotionSub')) {document.execCommand('insertText', false, emotion); myNav.style.display = null; return}
    if (e.target.closest('#soundsSub')) {document.execCommand('insertText', false, emotion); myNav.style.display = null; return}
    if (!playing && !listView && longClick && !gesture && overMedia && !overTitle) popThumb()	// pop thumb out of flow
    if (['myCut', 'myCopy', 'myPaste'].includes(id)) {
      if (lastId) lastId.focus()
      const media = !playing && overMedia ? index : ''					// cutcopypaste text or files
      inca('CutCopyPaste',id,media); return}
    if (longClick == 1 && !gesture && !playing && playlist && selected && overMedia) { inca('Move', overMedia); return }
    if (longClick && !gesture && playing && !captions && !overMedia) myPlayer.currentTime = longClick == 1 ? defStart : 0
    if (['myIndex', 'myMp3', 'myMp4', 'myJoin', 'myJpg', 'mySrt'].includes(id)) { Ffmpeg(id); cue = 0; return }
    if (id == 'myBookmark') { block.dataset.fav = block.dataset.fav === '1' ? '0' : '1'; activateBlock(block, 0); editing = 1 }
    if (id == 'myClone') { newClone(); return }
    if (id == 'myLoudnorm') { inca('loudNorm',0,index); return }
    if (id == 'myInca') { inca('Settings'); return }
    if (id == 'myFavorite') { addFavorite(); return }
    if (id == 'myDelete') if (selected || type) { inca('Delete','',index); return }
    if (id == 'myMute' || id == 'myMute2' || id == 'edPause') { defMute ^= 1; inca('Mute', defMute); myVoice.muted = myPlayer.muted = defMute; return }
    if (id == 'myPause' || id == 'myPause2') { defPause ^= 1; inca('Pause',defPause); syncPlay ^= 1; return }
    if (id == 'myPitch' || id == 'myPitch2') { setPitch(pitch ^= 1); return }
    if (id == 'mySpeed' || id == 'mySpeed2') { updateCue('rate',1); return }
    if (id == 'myVol') { editingBlock._volume = 1; editing = 1; return }
    if (id == 'myDelay') { editingBlock._delay = 0; editing = 1; return }
    if (id == 'myRate') { editingBlock._rate = 1; editing = captions; return }
    if (id == 'mySkinny') { updateCue('skinny',1); editing = captions; return }
    if (id == 'myFlip') { Flip(); return }
    if (id == 'myHelp') { window.open('/inca/cache/icons/help.htm'); return }
    if (id == 'myThumbs' && lastClick == 1) { 
      longClick ? (thumbSheet ^= 1, inca('View', lastMedia)) : (sheets ^= 1, setThumbSize(), sheetPosters()); return }
    if (['myChatterbox','myQwen','myKitten','myElevenLabs'].includes(id)) { Chatterbox(id); return }
    if (lastClick == 1 && dropClick(e.target)) return
    if (id == 'myCancel') {
      if (!editing) {captions = 1; activateBlock(editingBlock,0); toLine(editingBlock); return}
      else if (myCancel.innerHTML != 'Sure ?') myCancel.innerHTML = 'Sure ?' 
      else { editing = 0; closePlayer() }
      return}
    if (id == 'myExport') {
      let txt = blocks.map(b => b.innerText.trim()).filter(Boolean).join('\n\n').replaceAll('#', '𝌇')
      inca('Export', txt, index)}
    if (lastClick == 4) {mouseBack(); return}						// Back Click

    if (lastClick == 3) {								// right click
      if (gesture) return
      if (overEditor) {
        lastId = editingBlock
        if (longClick && (overBlock || ym > 0.3)) Chatterbox()
        else { populateVoices(); if (overBlock) {
          const b = overBlock, atEnd = b === editingBlock && (b._atEnd || myPlayer.currentTime >= b._end - 0.05)
          if (!atEnd) myPlayer.currentTime = b.dataset.start
          activateBlock(b, 0)}}
        myNav.classList.add('editor-mode')} 
      else myNav.classList.remove('editor-mode')
      if (overMedia && type == 'video')
        inca('Thumb', '', index)
      if (!longClick && !myNav.style.display) {
        myNav.style.display = 'block'; myNav.style.left = xPos-90+'px'; myNav.style.top = yPos-32+'px'; delay = 200; return}
      if (longClick) return}

    if (lastClick == 2) {  								// Middle click
      if (editing) return
      blocks = []
      viewport.innerHTML = ''
      editor.style.display = null							// allow new srt
      if (zoom > 1) {Play(); return}
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// list/thumb view
      if (longClick) {index--} else index++						// next media
      if (!Param()) {index = lastMedia; closePlayer(); return}}

    if (lastClick == 1) {
      if (document.getElementById('osk')?.contains(document.elementFromPoint(xPos, yPos))) return
      predictBuffer = ''
      let b = editingBlock
      if (captions == 2 && editingBlock && overMedia && !gesture && ym < trigger()) {
        if (longClick) {
          offset = 0
          const e = xm > 0.5 && b
          if (e) {
            if (e.dataset.end) {
              delete e.dataset.end; e._end = natEnd(e)
              if (e === b && b._atEnd && isFinite(e._end)) myPlayer.currentTime = e._end }
              else { const t = endOf(b); if (isFinite(t)) e.dataset.end = e._end = t }}}
        else {
          const t = +(myPlayer.currentTime - offset).toFixed(2)
          offset = 0
          if (xm > 0.5) { setEnd(b, t); toEnd(b) }
          else { b.dataset.start = Math.max(0, t); b._atEnd = 0; myPlayer.currentTime = b.dataset.start }}
        editing = 1; return}
      if (longClick && (overTitle || ['myInput', 'caption-search-input', 'inp', 'myVoiceInput'].includes(id))) osk()
      if (id.includes('search-input')) return
      if (id == 'myCap') {capButton(); return}
      if (id == 'myCue' && playing) {
        const _t = Math.max(0.01, +myPlayer.currentTime.toFixed(2));
        myPlayer.currentTime = _t;
        cue = _t; syncPlay = 0; return}
      if (captions && !overMedia) {
        const wasOsk = !!document.getElementById('osk')
        if (overEditor && ym < 0.1 && xm < 0.95 && !ribbon.contains(e.target)) { 
          getSelection().removeAllRanges(); viewport.scrollTo({top:0,behavior:'smooth'}); return }	// top 10%: to top, no activate
        if (block) block._atEnd = 0
        if (id == 'viewport') window.getSelection().removeAllRanges()
        if (longClick && !gesture && overEditor && xm < 0.95) { syncPlay = userPlay = 0; osk(); if (!getSelection().isCollapsed) inca('cancelFind') }
        if (overBlock && !gesture && overBlock !== editingBlock) {
          lastBlock = block.dataset.num; userPlay = syncPlay = 1
          activateBlock(block, !longClick)
          return}
        if (captions == 1) {
          editor.style.pointerEvents = 'auto'
          overBlock = document.elementFromPoint(xPos, yPos)?.closest('.text-block') || 0
          editor.style.pointerEvents = 'none'
          if (overBlock && longClick && !gesture) {captions = 2; activateBlock(block); return}}
        if (!longClick) {
          if (overBlock && wasOsk) { myPlayer.currentTime = block.dataset.start; myVoice.currentTime = userPlay = syncPlay = 0; return }
          const voiceLive = editingBlock?._voice?.src && !myVoice.ended
          const paused = voiceLive ? myVoice.paused : myPlayer.paused
          if (paused) userPlay = 1
          else userPlay ^= 1
          syncPlay = userPlay
          if (userPlay && (myPlayer.currentTime >= editingBlock._end - 0.05 || editingBlock._voice?.src && myVoice.ended)) {
            myVoice.currentTime = 0; myPlayer.currentTime = +editingBlock.dataset.start }
          return}}
      if (!title.matches(':hover') && overTitle == 2) {closeOsk(); overTitle = 0; return}
      if (overTitle && (longClick || overTitle == 2)) {
        if (overTitle != 2) title.value = title.defaultValue.trim()
        overTitle = 2; lastMedia = index; return}
      if (!playing && id != title.id && !gesture) {
        if (!overTitle && longClick && myPanel.matches(':hover')) return
        if (overMedia && folder == 'History' && thumb.src.slice(-3) == 'm3u') {
          let p = decodeURIComponent(thumb.src.replace(server, ''))
          inca('Path', '', '', p.replace(/\//g, '\\'))}
        if (id == 'myCue' || overMedia && thumb.src.slice(-3) == 'm3u'
        || (longClick && ((overMedia && type == 'document')
        || (favicon && favicon.matches(':hover')))) 
        || (overMedia && thumb.src.endsWith('.pdf'))) {mouseDown = longClick = 0; inca('Notepad',id,index,favicon.matches(':hover')); return}}
      if (!longClick) {
        if (id == 'mySelect') {if (type) {sel(index)} else {for (i = 1; document.getElementById('thumb'+i); i++) {sel(i)}}; return}
        if (!playing && !overMedia && !myNav.style.display) return}
      if (myNav.matches(':hover') || gesture) return}

    if (!getStart(id)) return
    if (lastClick == 1 && overBlock) return
    if (!playing && lastClick == 2) return
    if (lastClick) Play()}


  function getStart(id) {
    if (lastClick == 3) {
      if (!playing && !overMedia) {index = lastMedia; start = lastSeek; return 1}
      if (myNav.style.display && type == 'video') {thumbSheet ^= 1; start = lastSeek; return 1}}
    if (lastClick == 2 || !dur) start = defStart
    else if (zoom > 1) start = thumb.currentTime || start
    if (playing && !thumbSheet && lastClick != 2 && overMedia && (ym > trigger() || yw > 0.95)) {
      myPlayer.currentTime = start
      if (captions && editingBlock) {
        const b = editingBlock, s = +start.toFixed(2)
        b.dataset.start = s
        if (voiceLen(b)) setEnd(b, +(s + voiceLen(b)).toFixed(2))
        editing = 1 }
      return }
    if (longClick && longClick != 2 && !title.matches(':hover')) return
    if (dur < 200 && start < defStart + 2 && !playlist && !favicon.textContent.includes('\u2764')) start = 0
    if (!playing && !longClick && overMedia && !dur) return 1				// show image or text files
    if (myPlayer.currentTime > dur - 0.5) myPlayer.load()				// restart media
    if (!longClick && (thumbSheet || (sheets && !playing && overMedia && type == 'video')) && id != 'myPic') {	// clicked on 6x6 thumbsheet
      if (overMedia && yw < 0.9) start = sheetTime(xm, ym, dur, skinny)}
    else if (!longClick && lastClick == 1 && playing) {userPlay = syncPlay ^= 1; return}
    if (lastClick && lastClick != 2) thumbSheet = 0
    if (!gesture) return 1}								// return and continue


  function Play() {
    if (editing) return
    closePic()
    Param()
    thumb.pause()
    userPlay = syncPlay = 0
    editor.style.transition = null
    editor.style.opacity = 0
    if (!thumbSheet && lastClick) myPlayerWrap.style.opacity = 0			// fade in player
    if (!thumbSheet || type == 'image' || type == 'audio') myPlayer.poster = thumb.poster
    else if (!playing) lastSeek = defStart
    if (playlist.match('/inca/music/')) myPlayer.muted = 0
    else myPlayer.muted = defMute
    if (!thumbSheet) {
      if (favicon.matches(':hover')) getSrt(0)
      else if (overTitle && mouseDown) previewMode ? getSrt(lastBlock) : getSrt(1)
      else if (captions || type == 'document') getSrt()}
    if (el = document.getElementById('title'+lastMedia)) el.style.color = el.style.fontWeight = ''
    title.style.color = 'pink'; title.style.fontWeight = 'bold'; title.style.opacity = 1
    if (playlist.match('/inca/music/') && !thumbSheet) {start = 0; myPlayer.muted = 0}
    if (type == 'audio' && !captions) myPlayer.style.borderBottom = '1px solid pink'
    else myPlayer.style.border = null
    if (pitch || myPlayer.context) {setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    if (captions && pitch || myVoice.context) {setupContext(myVoice); myVoice.jungle.setPitchOffset(semiToneTranspose(pitch))}
    playing = index
    seekTimer = 0
    zoom = 1
    previewMode = 0
    lastMedia = index
    myPic.style.top = '-999px'
    let syncStart = captions ? 0 : start						// because seekbar overwrites start
    if (!thumbSheet) myPlayer.src = thumb.src
    else {myPlayer.removeAttribute('src'); myPlayer.poster = sheetUrl; myPlayer.load()}
    setTimeout(async () => {
      if (!captions) myPlayer.currentTime = syncStart
      if (!dur || thumbSheet || captions) userPlay = syncPlay = 0
      else userPlay = syncPlay = !(defPause && !playlist.match('/inca/music/'))
      if (!more && lastIndex < listSize && index > lastIndex - 9) inca('More', lastIndex)
      if (lastClick) { positionMedia(0.34); if (lastClick != 2) myNav.style.display = null }
      myPlayerWrap.style.visibility = 'visible'
      myPlayerWrap.style.opacity = 1},124)}


  function mouseMove(e) {
    let id = e.target.id
    if (!myNav.style.display) overEditor = !overMedia && captions && id != 'myMask' ? 1 : 0
    if (innerHeight == outerHeight) {xPos = e.screenX; yPos = e.screenY}
    else {xPos = e.clientX; yPos = e.clientY}
    mySelected.style.left = xPos + 30 +'px'
    mySelected.style.top = yPos + 20 +'px'
    let x = Math.abs(xPos-xRef)
    let y = Math.abs(yPos-yRef)
    cursor = overMedia ? 12 : 4
    seekbar()
    if (x + y > 9 && !gesture && mouseDown) {
      gesture = longClick ? 4 : 1
      gesture = id.includes('osk') ? 3 : gesture
      if (!playing && overMedia && zoom > 1) popThumb()
      if (!playing && overMedia && !longClick && zoom == 1 && !myNav.style.display) sel(index)}
    if (!gesture || !mouseDown) {gesture = 0; return}
    if (gesture == 1 && y > x + 1) gesture = 2
    if (thumb.style.pop > 1 && id.includes('thumb')) {					// move popped thumb
      const wrap = thumb.parentElement
      wrap.style.left = parseInt(wrap.style.left||0) + xPos - xRef + 'px'
      wrap.style.top  = parseInt(wrap.style.top ||0) + yPos - yRef + 'px'}
    else if (gesture == 3) {}								// osk drags itself (osk.js)
    else if (gesture == 4 && playing && myPlayer.paused && !thumbSheet && overMedia && !captions) {
      crop ||= [e.clientX, e.clientY]
      crop[2] = e.clientX; crop[3] = e.clientY
      document.body.append(myCrop)
      myCrop.style.cssText = `position:fixed;z-index:99999;pointer-events:none;border:1px dashed red;left:${Math.min(crop[0], crop[2])}px;top:${Math.min(crop[1], crop[3])}px;width:${Math.abs(crop[2] - crop[0])}px;height:${Math.abs(crop[3] - crop[1])}px`}
    else if (playing && (mouseDown == 1 || gesture == 2 || delay == 1)) {		// move myPlayer
      const dx = xPos - xRef, dy = yPos - yRef
      if (captions) {
        overBlock = document.elementFromPoint(xPos, yPos)?.closest('.text-block') || 0
        if (overBlock && overBlock != editingBlock) activateBlock(overBlock, 0)}
      if (thumbSheet) { xyz[0] += dx; xyz[1] += dy }
      else if (!overBlock && !overEditor) {
        mediaX += dx; mediaY += dy; positionMedia(0)
        if (captions == 2) editing = 1}}
    if (gesture) { xRef = xPos; yRef = yPos }}


  function wheelEvent(e) {
    const under = document.elementFromPoint(xPos, yPos)
    const id = under?.closest('#myNav') ? under.id : e.target.id
    const face = under?.closest('#voice-faces')
    if (id == 'myEdWidth') {								// editor width
      e.preventDefault(); wheel += Math.ceil(Math.abs(e.deltaY)); if (wheel < delay) return
      const z = 1 + wheel / 2000, x = editor.offsetWidth
      editor.style.width = Math.max(250, Math.min(innerWidth - 20, wheelDir * e.deltaY > 0 ? x * z : x / z)).toFixed(0) + 'px'
      editing = 1; wheel = 0; delay = 8; return}
    if (overEditor) {
      if (e.target.closest('#voiceSub, #emotionSub, #soundsSub')) return
      if (e.target.closest('.dropdown-content')) return
      if (xm > 0.1 && !face && !myNav.style.display) return}
    e.preventDefault()									// stop default scroll
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < delay) return
    let wheelUp = wheelDir * e.deltaY > 0
    if (!mouseDown && overEditor && !myNav.style.display && xm < 0.1) {			// scroll blocks
      scrollUntilBlock(e.deltaY); wheel = 0; delay = 284; return}
    if (face) {										// face zoom
      faceZoom = Math.max(1, Math.min(2.5, faceZoom * (wheelUp ? 1.03 : 0.97)))
      document.getElementById('voice-faces')?.style.setProperty('--fz', faceZoom)
      editing = 1; wheel = 0; delay = 12; return}
    if (overEditor && !myNav.style.display && !overMedia) return
    let factor = 1 + (wheelUp ? wheel : -wheel) / 1500
    if (['myType', 'myAlpha', 'myDate', 'mySize', 'myLength', 'mySearch'].includes(id)) {
      if (wheelUp) filt++
      else if (filt) filt--								// filter
      if ((id == 'myAlpha' || id == 'mySearch') && filt > 26) filt = 26
      if (id == 'myType' && filt > 4) filt = 4
      filter(id); delay = 90}
    else if (['myMusic', 'mySub', 'myFol', 'myFav'].includes(id)) {			// page through top panel
      panelOpen(id.slice(2), 1); panelStep(wheelUp ? 1 : -1); delay = 150}
    else if (id == 'mySpeed') { 							// rate
      let val = cue ? rate : (overEditor ? (editingBlock?._rate ?? rate) : rate)
      if (wheelUp) {val -= 0.01} else val += 0.01
      updateCue('rate',val); delay = 80}
    else if (id == 'mySkinny' && type) {						// skinny
      if (wheelUp) {skinny -= 0.01} else skinny += 0.01
      updateCue('skinny',skinny); delay = 80}
    else if (id.includes('thumb') && overMedia && mouseDown && zoom > 1) {		// zoom thumb
      if (wheelUp) zoom *= factor
      else if (zoom > 1.04) zoom *= factor
      else {zoom = 1; delay = 100; closePic(); delay = 4444; return}
      thumb.style.pop = zoom
      thumb.parentElement.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'
      start = thumb.currentTime
      delay = 8}
    else if (id == 'myThumbs' || (!playing && mouseDown)) { 				// zoom all thumbs
      let z = wheel/1500
      let view = settings.view
      if (view < 300 && wheelUp) view *= 1+z
      else if (!wheelUp) view /= 1+z
      if (view < 8) view = 8
      settings.view = String(view)
      const anchor = zoomAnchor()
      setThumbSize()
      localStorage.setItem(folder, JSON.stringify(settings))
      Param(); thumb.load()
      thumb.parentElement.style.opacity = thumb.style.opacity = 1
      zoomKeep(anchor)
      delay = 9}
    else if (id == 'myWidth' && !playing) {						// page width
      let x = 1*myView.style.width.slice(0,-2); let z = wheel/2000
      if (wheelUp) x *= 1+z
      else if (!wheelUp && x / 1+z > 100) x /= 1+z
      if (x > innerWidth-20) x = innerWidth - 20
      myView.style.width = x.toFixed(2)+'px'
      localStorage.setItem('pageWidth', String(x))
      delay = 8}
    else if (id == 'mySelect' && !captions) {
      mouseDown = longClick = lastClick = 0
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index-- 				// next - previous
      else if (Param() && playing) { start = defStart; Play() }
      if (!thumbSheet) myPlayer.currentTime = start
      positionMedia(0); delay = 140}
    else if (id == 'myDelay' && overEditor) {						// caption delay
      editing = 1
      delay = 140
      let pause = editingBlock._delay || 0
      if (wheelUp) pause += 0.1
      else if (pause >= 0.1) pause -= 0.1
      pause = Math.round(pause * 10) / 10
      editingBlock._delay = pause}
    else if (id == 'myRate' && overEditor) {						// caption rate
      editing = 1
      delay = 140
      let speed = editingBlock._rate || 1
      if (!wheelUp) speed += 0.05
      else if (speed >= 0.1) speed -= 0.05
      speed = Math.round(speed * 100) / 100
      editingBlock._rate = speed}
    else if (id == 'myVol' && overEditor) {						// caption volume
      editing = 1
      delay = 140
      let vol = editingBlock._volume || 1
      if (!wheelUp) {if (vol <= 0.9) vol += 0.1}
      else if (vol > 0.1) vol -= 0.1
      vol = Math.round(vol * 10) / 10
      editingBlock._volume = myVoice.volume = vol}
    else if (captions && myNav.style.display) return 
    else if (captions && !mouseDown && captions == 2 && editingBlock && overMedia && ym < trigger()) {
      const b = editingBlock, end = xm > 0.5, d = wheelUp ? 0.02 : -0.02
      const t = Math.min(dur || Infinity, Math.max(end ? +b.dataset.start : 0, +((end ? b._end : +b.dataset.start) + d).toFixed(2)))
      b._atEnd = end ? 1 : 0
      if (end) setEnd(b, t)
      else { b.dataset.start = t; myVoice.currentTime = 0; if (t >= b._end) setEnd(b, +(t + (voiceLen(b) || 1)).toFixed(2)) }
      offset = +(offset + d).toFixed(2)
      nudgeAt = Date.now(); nudgeEnd = end; playerTimes()
      myVoice.currentTime = 0; myPlayer.currentTime = t; editing = 1; delay = 74}
    else if (playing && !myNav.style.display && (mouseDown || ((thumbSheet || type == 'image') && !captions))) {
      let x = rect.left+rect.width/2-(clickMedia ? xPos : innerWidth/2)
      let y = rect.top+rect.height/2-(clickMedia ? yPos : innerHeight/2)		// zoom myPlayer
      let z = mouseDown && clickMedia && overMedia ? wheel / 1300 : 0
      if (captions || !overMedia || !mouseDown) z = 0
      let array = thumbSheet ? [...xyz] : [mediaX, mediaY, scaleY]
      array[0] += x * z * (wheelUp ? 1 : -1)
      array[1] += y * z * (wheelUp ? 1 : -1)
      array[2] *= factor
      array[2] = Math.max(0.15, Math.min(99, array[2]))
      thumbSheet ? (xyz = array) : ([mediaX, mediaY, scaleY] = array)
      if (captions) editing = 1
      delay = 2
      positionMedia(0)}
    else if (!thumbSheet) {
      if (captions && !overMedia) {
        const n = wheelUp ? editingBlock?.nextElementSibling : editingBlock?.previousElementSibling
        if (n) { activateBlock(n, userPlay); toLine(n) }
        wheel = 0; delay = 124; return }
      delay = 124
      let interval = 0.06								// seek
      if (dur > 200) interval = 0.2
      if (dur > 200 && (overMedia && ym > trigger() || yw > 0.95)) interval = 1	
      else if (!syncPlay && !(captions && id == 'myMask')) interval = 0.02
      interval = wheelUp ? interval : -interval
      if (id.includes('thumb') && zoom != 1) thumb.currentTime += interval; 		// popped thumb
      else if (playing && dur) {
        const t = myPlayer.currentTime + interval
        if (t >= dur) syncPlay = 0
        myPlayer.currentTime = Math.min(t, dur - 0.05)
        myPlayer.addEventListener('seeked', () => delay = 40, { once: true })}		// min. 40
      if (!playing) seekTimer = 0							// hide seekbar in thumb popout
      else seekTimer = 5								// force seekbar while seeking
      thumb.pause()}
    wheel = 0}


  function timerEvent() { 								// every 94mS
    xw = xPos / innerWidth
    yw = yPos / innerHeight
 //   if (overTitle != 2) { overTitle = title.matches(':hover') ? 1 : 0; if (!overTitle) previewMode = 0 }
    if (overTitle != 2) { overTitle = title.matches(':hover') && !underBar() ? 1 : 0; if (!overTitle) previewMode = 0 }
    if (overTitle == 1 && seekTimer > 2) title.classList.add('preview')
    let top = 0
    let el = thumb
    if (overEditor && !overMedia && !myNav.style.display) el = editor
    else if (playing) el = myPlayer
    else if (overTitle) el = title
    rect = el.getBoundingClientRect()
    if (!more && lastIndex < listSize && myContent.scrollTop > myContent.scrollHeight - 2 * innerHeight) inca('More', lastIndex)
    xm = (xPos - rect.left) / rect.width
    ym = (yPos - rect.top) / rect.height
    if (delay >= 30) delay -= 10
    if (wheel >= 10) wheel -= 10
    if (more) more--									// lazy loading holdback
    if (cursor) cursor--								// cursor hide timer
    mySelected.textContent = String(selected).includes(',') ? selected.split(',').length - 1 : ''
    viewport.style.cursor = overEditor && xm < 0.1 ? 'n-resize' : null
    if (!playing || thumbSheet || overTitle) myBody.style.cursor = null			// show default cursor
    else if (!cursor) myBody.style.cursor = 'none'					// hide cursor
    else myBody.style.cursor = 'crosshair'						// moving cursor over player
    if (underBar()) { overMedia = 0; type = '' }					// no thumb hover under the bar
    else if ((listView && thumb.style.opacity == 1) || favicon.matches(':hover') || myPic.matches(':hover')) overMedia = index
    else if (overMedia && myNav.style.display || myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else if (!listView && title.matches(':hover')) overMedia = index
    else if (!overMedia && !playing) type = ''
    else overMedia = 0
    mySpeed.innerHTML = mySkinny.innerHTML = null
    let currentRate = (overEditor && editingBlock?._voice?.src ? editingBlock?._rate : rate) || 1
    if (type) {
      mySpeed.style.color = currentRate == 1 ? null : 'red'
      mySpeed.innerHTML = currentRate == 1 ? 'Speed' : `Speed ${currentRate.toFixed(2)}`
      mySkinny.innerHTML = skinny == 1 ? 'Skinny' : `Skinny ${skinny.toFixed(2)}`
      mySelect.innerHTML = 'Select '+index
      myFlip.innerHTML = 'Flip'}
    else {
      mySpeed.style.color = defRate == 1 ? null : 'red'
      mySpeed.innerHTML = defRate === 1 ? 'Speed' : 'Speed ' + defRate
      mySelect.innerHTML = 'Select'
      myFlip.innerHTML = mySelect.style.outline = null}
    if (favicon.innerHTML.match('\u2764')) myFavorite.innerHTML = 'Fav &#x2764'
    else myFavorite.innerHTML = 'Fav'
    let qty = String(selected).split(',').length - 1 || 1
    if (selected || type) {myDelete.innerHTML = `Delete ${qty}`; myDelete.style.color = 'red'}
    else myDelete.innerHTML = null
    mySkinny.style.color = skinny == 1 ? null : 'red'
    myPitch.style.color = pitch ? 'red' : null
    myPause.style.color = defPause ? 'red' : null
    myMute.style.color = defMute ? 'red' : null
    mySpeed2.innerHTML = defRate !=1 ? defRate : ''
    myPause2.innerHTML = defPause ? "⏸" : ''
    myMute2.innerHTML = defMute ? "🔇︎" : ''
    myPitch2.innerHTML = pitch ? "♪" : ''
    mySelect.style.color = (','+selected).includes(','+index+',') ? 'red' : ''
    seekTimer = ((overMedia && (ym > trigger() || yw > 0.95)) || overTitle == 1) 
      ? Math.min(seekTimer + 1, 5) 
      : Math.max(seekTimer - 1, 0)
    positionMedia(0)
    seekbar()
    if (playing || !overTitle) {title.classList.remove('preview'); title.value = title.defaultValue; title.style.height = ''}
    if (playing) {
      myPic.style.maxWidth = '160px'
      myPic.style.maxHeight = 160 / aspect + 'px'
      myPlayerWrap.style.pointerEvents = (myPlayer.src || myPlayer.poster || thumbSheet) ? 'auto' : 'none'
      if (dur || myVoice.duration) edPause.textContent = (userPlay ? '' : '⏸') + (defMute ? '🔇︎' : '')
      else edPause.textContent = ''
      if (editingBlock?._voice?.src) progress = 100 * myVoice.currentTime / myVoice.duration
      else if (editingBlock) {
        progress = 100 * (myPlayer.currentTime - editingBlock.dataset.start) / (editingBlock._end - editingBlock.dataset.start)}
      progress = Math.max(0, Math.min(100, progress))
      if (captions && (dur || editingBlock?._voice?.src)) {
        editingBlock?.style.setProperty('--progress', progress + '%')
        editingBlock?.classList.toggle('paused', !userPlay)}
      myCancel.innerText = editing ? (myCancel.innerText !== 'Sure ?' ? '✕' : 'Sure ?') : '⌒'
      myCancel.style.color = myCancel.innerText == '⌒' ? 'pink' : 'red'
      const atEnd = caret(editingBlock)?.pos === 'end'
      !!editingBlock?._voice?.src && !myVoice.ended && (syncPlay || editingBlock._atEnd)
        ? myVoice.play()
        : myVoice.pause()
      if (captions) { showStart() }
      myVol.innerHTML = editingBlock?._volume == 1 ? 'Volume' : `Volume ${editingBlock?._volume*100}`
      myDelay.innerHTML = editingBlock?._delay == 0 ? 'Delay' : `Delay ${editingBlock?._delay*1000}`
      myRate.innerHTML = editingBlock?._rate == 1 ? 'Speed' : `Speed ${editingBlock?._rate}`
      myVoice.playbackRate = editingBlock?._rate || 1
      myPlayer.playbackRate = mediaContent.style.display == 'flex' ? 1 : captions ? fitRate(editingBlock) : rate
      const nudge = dur && captions == 2 && overMedia && ym < trigger()
      if (nudge) syncPlay = 0
      playerTimes()
      const atStart = !editingBlock?._atEnd && Math.abs(myPlayer.currentTime - editingBlock?.dataset.start) < 0.05
      const parked = xm > 0.5 ? editingBlock?._atEnd : atStart
      if (nudge && editingBlock && delay < 40 && !parked) {
        const b = editingBlock
        offset = 0
        if (xm > 0.5) toEnd(b)
        else { b._atEnd = 0; myPlayer.currentTime = b.dataset.start }}
      if (!syncPlay) { myVoice.pause(); myPlayer.pause() }
      else if (dur && !editingBlock?._atEnd && myPlayer.currentTime < myPlayer.duration) myPlayer.play()
      myMask.style.pointerEvents = 'auto'
      if (dur && !thumbSheet) lastSeek = myPlayer.currentTime
      if (playlist.match('/inca/music/') && scaleY < 0.7) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
      if (myPlayer.duration) dur = myPlayer.duration
      if (cues.innerHTML && !thumbSheet && type !='image' && dur && !myNav.style.display) myCues(myPlayer.currentTime)}
    else {
      if (!overTitle) blocks = []
      if (overTitle == 1 && favicon.innerText.includes('©') && !blocks.length) getPreview()
      if (seekTimer > 3 && blocks.length && overTitle && overTitle != 2) {
        let idx = Math.floor(xm * blocks.length)
        const block = blocks[Math.min(idx, blocks.length - 1)]
        previewMode = xm > 0.6 && !previewMode ? 1 : previewMode
        previewMode = xm < 0.6 && previewMode ? 2 : previewMode
        if (!previewMode) title.value = title.defaultValue
        else if (previewMode == 1) title.value = lastText
        else {title.value = block.innerText.trim(); lastBlock = block.dataset.num }}
      if (cursor && type == 'video' && zoom == 1 && !sheets && thumb.matches(':hover')) {
        if (!thumb.readyState) {thumb.load(); thumb.currentTime = defStart + 0.04}
        if (thumb.readyState === 4 && thumb.paused && !overTitle) thumb.play()}
      title.style.height = overTitle == 2 || (previewMode && !listView) ? '4em' : ''
      title.style.overflowY = previewMode || overTitle == 2 ? 'auto' : ''
      title.style.width = listView ? '100%' : ''
      myInca.textContent = '...'
      myMask.style.pointerEvents = null
      playerTimes()
      if (zoom > 1 && overMedia) myMask.style.opacity = 0.9
      else myMask.style.opacity = 0}}


  function playerTimes() {								// start / end under myPlayer on hover, red while nudged
    const on = (captions == 2 || !captions && ym > 0.8) && playing && overMedia && dur && !thumbSheet && type != 'image'
    myTimes.classList.toggle('on', !!on)
    if (!on) return
    const r = myPlayer.getBoundingClientRect(), b = captions == 2 && editingBlock
    const s = b ? +b.dataset.start || 0 : 0, e = b && isFinite(b._end) ? b._end : dur
    const red = captions && Date.now() - nudgeAt < 700
    myTimes.style.left = r.left + 'px'; myTimes.style.top = r.bottom + 'px'; myTimes.style.width = r.width + 'px'
    myTimes.firstChild.textContent = captions ? mmss(s, red && !nudgeEnd) : rate != 1 ? +(+rate).toFixed(2) : ''
    myTimes.lastChild.textContent = captions ? mmss(e, red && nudgeEnd) : skinny != 1 ? +(+skinny).toFixed(2) : ''
    myTimes.firstChild.classList.toggle('nudge', red && !nudgeEnd)
    myTimes.lastChild.classList.toggle('nudge', red && !!nudgeEnd)
    myTimes.lastChild.classList.toggle('red', !!(b && b.dataset.end))}


  function positionMedia(time) {							// position myPlayer in window
    let sheetSize = aspect > 1 ? 1.4 : 1
    if (!mediaX) {
      mediaX = screen.width / 2
      mediaY = captions ? screen.height / 3 : screen.height / 2
      xyz = [mediaX, mediaY, sheetSize]}
    let x = mediaX, y = mediaY
    let z = (captions == 2 && !projectMedia.ui.scaleY) ? 0.3 * scaleY : scaleY
    if (type == 'document' || type == 'audio' || playlist.match('/inca/music/')) z *= 0.5
    if (thumbSheet) { x = xyz[0]; y = xyz[1]; z = xyz[2] }
    skinny = thumb.style.skinny || skinny
    myPlayerWrap.style.transition = 'opacity ' + time + 's, transform ' + time + 's'
    myPlayerWrap.style.left  = (x - (window.screenX || 0)) - myPlayer.offsetWidth  / 2 + 'px'
    myPlayerWrap.style.top   = (y - (outerHeight - innerHeight)) - myPlayer.offsetHeight / 2 + 'px'
    myPlayerWrap.style.transform = 'scale(' + skinny * z + ',' + z + ')'
    if (myPlayerWrap._z != z) { myPlayerWrap._z = z; clearTimeout(myPlayerWrap._t)	// glow size unscaled, set after zoom settles
      myPlayerWrap._t = setTimeout(() => myPlayerWrap.style.setProperty('--s', 1 / z + 'em'), 400) }
    if (captions == 1) positionEditor()
    setFade()
    void myPlayer.offsetWidth}

  function hasMedia() { return !!(myPlayer.getAttribute('src') || myPlayer.poster) }	// true for jpg (poster) and video; dur is 0 for images

  function setFade() {								// caption fade line = final bottom of player (ignores transition)
    if (!captions) return
    const cs = getComputedStyle(myPlayerWrap), showing = hasMedia() && cs.display != 'none' && cs.visibility != 'hidden' && myPlayerWrap.offsetHeight
    const h = myPlayer.offsetHeight, z = myPlayerWrap._z || 1
    const pb = parseFloat(myPlayerWrap.style.top) + h / 2 + h * z / 2
    viewport.style.setProperty('--fade', (showing ? Math.max(0, pb - viewport.getBoundingClientRect().top) : 0) + 'px')}


  function zoomAnchor() {							
    const z = zoomAnchor, now = Date.now()
    if (!z.el || now - z.t > 600) z.el = [[xPos, yPos], ...[0.5, 0.4, 0.6, 0.3, 0.7].map(f => [innerWidth * f, innerHeight / 2])]
      .map(([x, y]) => document.elementFromPoint(x, y)?.closest('.entry')).find(e => e)?.querySelector('.thumb')
    z.t = now
    return z.el && [z.el, z.el.getBoundingClientRect().top]}


  function zoomKeep(a) { if (a) myContent.scrollTop += a[0].getBoundingClientRect().top - a[1] }	// same screen height after the resize

  function setThumbSize() { myView.style.setProperty('--max-size', (+settings.view * (sheets ? 3 : 1)) + 'em') }

  function thumbHover(e) { if (e.target.classList?.contains('thumb') && e.clientY < barLine.y) requestAnimationFrame(() => thumbInfo(e.target)) }


  function sheetTime(xm, ym, dur, skinny) {					// 6x6 sheet → media time (shared)
    if (skinny < 0) xm = 1 - xm
    const row = Math.floor(ym * 6)
    const col = Math.ceil(xm * 6)
    const offset = dur > 60 ? 20 : 0
    let ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    return offset - (ps * offset) + dur * ps}


  function fitThumb(e) {
    const t = e.target
    if (!t.classList.contains('thumb') || !t.videoHeight) return
    const ratio = t.videoWidth / t.videoHeight
    t.style.width = `min(var(--max-size), calc(var(--max-size) * ${ratio}))`
    requestAnimationFrame(() => thumbInfo(t))}				// label follows the new size


  function thumbInfo(t) {								// faint speed / skinny under a video thumb
    if (listView || playing || t != thumb) return
    let d = entry.querySelector('.thumb-info')
    if (!d) entry.append(d = Object.assign(document.createElement('div'), {className: 'thumb-info', innerHTML: '<span></span><span></span>'}))
    const w = t.parentElement, sw = w.offsetWidth * Math.abs(skinny)			// layout box, so no reflow wait on scale
    d.style.left = w.offsetLeft + (w.offsetWidth - sw) / 2 + 'px'; d.style.width = sw + 'px'; d.style.top = w.offsetTop + w.offsetHeight + 'px'
    d.firstChild.textContent = rate && rate != 1 && rate != defRate ? +(+rate).toFixed(2) : ''	// own speed only
    d.lastChild.textContent = skinny && skinny != 1 ? +(+skinny).toFixed(2) : ''}


  function positionEditor() {								// compact captions sit under myPlayer
    const r = myPlayer.getBoundingClientRect()
    editor.style.left = r.left + r.width / 2 + 'px'
    editor.style.top = r.bottom + 24 + 'px'}


  function seekbar() {									// seekbar bar beneath player
    updateContext()
    let cueX = rect.left
    let pos = playing ? myPlayer.currentTime : thumb.currentTime
    pos = Math.round(100*pos) / 100
    let cueW = rect.width * pos / dur
    if (cue && cue <= pos) {
      cueX = rect.left + rect.width * cue / dur
      cueW = rect.width * (pos - cue) / dur
      if (cue > pos - 0.5) cueW = rect.width * (dur - cue) / dur}
    else if (cue) {
      cueX = rect.left + rect.width * pos / dur
      cueW = rect.width * (cue - pos) / dur
      if (cue < pos + 0.5) {cueX = rect.left; cueW = rect.width * pos / dur}}
    if (rect.bottom > innerHeight) mySeek.style.top = innerHeight - 15 +'px'
    else mySeek.style.top = rect.top + rect.height - 6 + 'px'
    mySeek.style.left = cueX + 'px'
    if (myNav.style.display || cue || (seekTimer > 3 && dur && zoom == 1 && !title.matches(':hover'))) {
      mySeek.style.background = cue ? 'red' : null
      if (!playing && xm<1) cueW = rect.width * xm
      cueW = Math.min(cueW, rect.width)
      mySeek.style.width = cueW + 'px'
      if (dur) mySeek.style.opacity = 1
      if (xm > 0 && xm < 1 && (ym > trigger() || yw > 0.95) && ym < 1 && !thumbSheet && delay < 30) myPic.style.opacity = 1
      else myPic.style.opacity = 0
      const fit = playing && scaleY <= 0.4
      myPic.style.width = (fit ? rect.width : thumb.offsetWidth) + 'px'
      myPic.style.height = (fit ? rect.height : thumb.offsetHeight) + 'px'
      myPic.style.top = Math.min(rect.top + rect.height, innerHeight) - myPic.offsetHeight + 'px'
      if (playing && !fit) myPic.style.left = xPos - skinny * myPic.offsetWidth / 2 + 'px'
      else myPic.style.left = rect.left + rect.width / 2 - skinny * myPic.offsetWidth / 2 + 'px'
      let x = (xPos - rect.left) / rect.width						// set myPic sprite and set start
      let thumbIndex = Math.ceil(x * 35)
      let z = (5 * (thumbIndex + 1) - 1) / 200
      let offset = dur > 60 ? 20 : 0
      let seek = offset - (z * offset) + dur * z					// calculate sprite timestamp
      if (seek >= 0 && seek < dur) start = seek
      if (!thumbIndex || type != 'video') {
        myPic.style.backgroundSize = '100%'
        myPic.style.backgroundImage = 'url(\"'+thumb.poster+'\")'}
      else if (type == 'video') {
        myPic.style.backgroundSize = null
        myPic.style.backgroundImage = 'url(\"'+sheetUrl+'\")'
        myPic.style.backgroundPosition = `${(thumbIndex % 6) * 20}% ${Math.floor(thumbIndex / 6) * 20}%`}
      if (skinny < 0) myPic.style.left = rect.left + rect.width + 'px'}			// media flipped
    else {mySeek.style.opacity = myPic.style.opacity = 0; start = defStart}}


  function setThumb() {									// sets src, poster, thumbsheet & dimensions
    if (type == 'video') {
      const match = thumb.src.match(/\/([^\/]+?)(?:\.[^.]*?)?$/);
      const filename = match ? match[1] : null;
      let path = thumb.poster.replace(/\/posters\//, '/thumbs/').replace(/\/[^\/]*$/, '')
      sheetUrl = path + '/' + filename + '.jpg'
      if (!sheets) thumb.poster = thumb.poster.replace(/\/thumbs\//, '/posters/')
      myPic.style.backgroundImage = 'url(\"'+sheetUrl+'\")'				// use 6x6 thumbsheet as poster
      myPlayer.poster = sheetUrl}
    else myPlayer.removeAttribute('src')
    if (!thumbSheet && dur) myPlayer.currentTime = start
    fitPlayer(thumb.offsetWidth, thumb.offsetHeight)
    myPic.style.width = thumb.offsetWidth + 'px'
    myPic.style.height = thumb.offsetHeight + 'px'
    thumb.parentElement.style.transform = 'scale('+skinny*zoom+','+zoom+')'
    myPic.style.transform = 'scale('+skinny+',1)'
    myPic.style.backgroundPosition = '0% 0%'}						// sets to frame 1 of 6x6 thumbSheet


  function fitPlayer(w, h) {
    if (!w || !h) return
    aspect = w / h
    const z = innerHeight
    myPlayer.style.width = (aspect < 1 ? z * aspect : z) + 'px'
    myPlayer.style.height = (aspect < 1 ? z : z / aspect) + 'px'; setFade()}


  function panelLoad() {								// sections from ahk data: Music Sub Fol Fav + one per search letter
    const d = myPanel.dataset
    const list = s => (s || '').split('|').map((v, i) => [v, i + 1]).filter(e => e[0])	// keep ahk list index
    const base = (v, ext) => { v = v.replace(/\/$/, '').split('/').pop(); return ext ? v.replace(/\.[^.]*$/, '') : v }
    const paths = (s, key, ext) => list(s).map(([v, n]) => { const t = base(v, ext); return {t, k: key + '|' + n, c: 'Path', on: t == d.cur} })
    pnl = {Music: paths(d.music, 'music', 1), Sub: paths(d.sub, 'subs'), Fol: paths(d.fol, 'fol', 1), Fav: paths(d.fav, 'fav', 1)}
    for (const [v, n] of list(d.search)) (pnl[v[0].toUpperCase()] ||= []).push({t: v, k: 'search|' + n, c: 'Search', on: v == d.term})}

  function panelDraw() {								// one page of up to 8 centered entries
    const items = pnl[pnlSec] || [], box = myPanel.querySelector('.innerPanel')
    pnlPg = Math.max(0, Math.min(Math.ceil(items.length / PANEL) - 1, pnlPg))
    box.replaceChildren()
    for (const e of items.slice(pnlPg * PANEL, (pnlPg + 1) * PANEL)) {
      const c = document.createElement('c')
      c.className = 'p2'; c.textContent = e.t; c.dataset.c = e.c; c.dataset.k = e.k; c.dataset.on = e.on ? 1 : ''
      if (e.on) c.style.color = 'pink'
      if (e.t.length < 12) c.style.flexShrink = 0						// short entries never shrink
      box.append(c)}}

  function panelOpen(id, keep) {							// Music, Sub, Fol, Fav or myA (search letter A)
    const s = id.startsWith('my') ? id.slice(2) : id
    if (!pnl[s]?.length) { if (!pnlSec && s != 'Fol') panelOpen('Fol'); return }
    if (s != pnlSec || !keep) pnlPg = 0
    pnlSec = s; panelDraw()
    searchIcon()}

  function searchIcon() {								
    const ch = myPanel.classList.contains('open') && pnlSec.length == 1 && !primed && pnlSec
    mySearch.classList.toggle('letter', !!ch); mySearch.innerHTML = ch || '&#x1F50D;&#xFE0E;'}

  function panelStep(d) {								// next or previous page, stops at section end
    const n = pnlPg + d
    if (n >= 0 && n * PANEL < (pnl[pnlSec] || []).length) { pnlPg = n; panelDraw() }}


  const FILT = {										// ribbon heading label for the wheel filter value
    myType:   f => ['', 'Video', 'Image', 'Audio', 'Fav'][f] || '',
    myAlpha:  f => String.fromCharCode(f + 64),
    mySize:   f => f * 10 + ' Mb',
    myDate:   f => f + ' months',
    myLength: f => f + ' minutes'}

  function filter(id) {									// for htm ribbon headings
    if (id == 'mySearch') return panelOpen('my' + String.fromCharCode(filt + 65))
    const el = document.getElementById(id)
    el.style.color = filt ? 'red' : 'pink'
    if (FILT[id]) el.textContent = filt ? FILT[id](filt) : id.slice(2)
    if (myType.textContent != 'Type') myType.style.color = 'red'}


  function ribbonState() {								// highlight ribbon from body data set by ahk RenderPage
    const {sort = '', toggles = '', lit = ''} = document.body.dataset
    for (const a of myRibbon2.querySelectorAll('a[id]')) {
      const n = a.id.slice(2)
      if (n == sort) a.classList.add('sorted')
      if (toggles.includes(n)) a.classList.add('on')}
    for (const n of lit.split(' ')) if (n) document.getElementById('my' + n)?.classList.add('on')}


  function inca(command,value,select,address) {						// server messaging to inca.ahk
    if (incaBusy) return
    incaBusy = true
    more = 1
    try {
        if (select) {select += ','} else select = ''
        if (selected) select = selected
        value = typeof value === 'string' ? value.replaceAll('#', '𝌇') : value ?? ''
        if (!address) address = ''
        let messages = '#'+command+'#'+value+'#'+select+'#'+address
        return fetch(server + 'generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
          .then(response => {if (response.status === 204) {return null} return response.text()})
          .then(data => {
            if (data) {
              const type = data.substring(0, data.indexOf('|'))
              const content = data.substring(data.indexOf('|') + 1)
              if (type == 'html') {
                const keep = index
                const before = lastIndex
                myView.insertAdjacentHTML('beforeend', content)
                if (sheets) sheetPosters()
                while (Param(lastIndex)) { lastIndex++ }
                if (lastIndex === before) lastIndex = listSize
                Param(keep)}
              else if (type == 'address') {
                if (lastClick === 2) window.open(content, '_blank')
                else window.location.href = content}
              else if (type == 'cues') {
                if (cues) cues.innerHTML = content}
              return content}
            return null})
          .catch(err => { return null })
          .finally(() => { incaBusy = false })}
        finally {}}


  function Param(i) {								// get media parameters
    i = i || index
    if (previewMode && i === index) return
    index = i
    if (zoom == 1) thumb.src = ''						// release media from server
    if (!playing) { myPlayer.poster = ''; myPlayer.removeAttribute('src') }	// release from server
    if (!(document.getElementById('thumb'+i))) return				// end of media list
    if (!(favicon = document.getElementById('myFavicon'+i))) favicon = '' 	// fav or cc icon
    if (overTitle != 2) {							// not renaming title mode
      title.classList.remove('preview')
      title.value = title.defaultValue
      title.style.overflow = ''
      title.style.height = ''
      blocks = []
      title = document.getElementById('title'+i)}				// filename above thumb
    thumb = document.getElementById('thumb'+i)					// htm thumb element
    entry = document.getElementById('entry'+i)					// thumb and title container
    cues = document.getElementById('cues'+i)					// media defaults and time cues
    let vid = document.getElementById('vid'+i)
    let params = entry.dataset.params.split(',')
    type = params[0]								// media type eg. video
    defStart = Number(params[1])
    dur = Number(params[2]) || thumb.duration || 0				// to stop console errors on txt
    if (thumb.src != vid.src) thumb.src = vid.src
    size = Number(params[3])							// file size
    skinny = 1
    rate = dur ? defRate : 1
    if (cues && cues.innerHTML) myCues(0)					// get 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x				// custom css holds edits
    x = Number(thumb.style.skinny); if (x) skinny = x
    zoom = thumb.style.pop || 1
    favIndex = matchIndex = -1
    setThumb()
    return 1}


  function globals(fo, wd, mu, pa, so, fi, lv, se, pl, ix, ls) {		// import globals from inca.exe
    folder = fo; filt = fi; wheelDir = wd; defPause = pa; listView = lv; selected = se; playlist = pl; listSize = ls
    defMute = (mu == 'yes') ? 1 : 0
    settings = JSON.parse(localStorage.getItem(folder) || '{}')
    settings.pageWidth = localStorage.getItem('pageWidth') || '720'
    settings.pageWidth = (isNaN(settings.pageWidth) || settings.pageWidth > innerWidth) ? '720' : settings.pageWidth
    settings.view = (isNaN(settings.view) || settings.view < 6 || settings.view > 300) ? '10' : settings.view
    settings.defRate = (isNaN(settings.defRate) || settings.defRate < 0.2 || settings.defRate > 5) ? '1' : settings.defRate
    settings.pitch = settings.pitch == 1 ? 1 : 0
    myView.style.width = parseFloat(settings.pageWidth) + 'px'
    if (!listView) myView.style.minWidth = 'min-content'
    setThumbSize()
    defRate = parseFloat(settings.defRate)
    pitch = parseFloat(settings.pitch)
    ribbonState()								// ribbon highlight from body data
    filter('my'+so)								// show filter heading in red
    for (x of selected.split(',')) {
      if(el = document.getElementById('title'+x)) {el.style.outline = '1px solid red'; el.style.opacity = 1}}
    for (lastIndex = 1; Param(lastIndex); lastIndex++) {}			// process null cues (eg. skinny, start, rate)
    if (!ix) index = 1
    else index = ix
    lastMedia = index
    Param()									// initialise current media
    if (ix && title) {								// eg. after switch thumbs/listview
      title.style.opacity = 1
      title.style.color = 'pink'						// highlight thumb
      title.style.fontWeight = 'bold'
      title.scrollIntoView({ block: 'center' })}}


  function myCues(time) {
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k = 0; k < x.length; k++) {
      let el = x[k].split('|')							// time[0] cue[1] value[2] period[3]
      if (!el[1]) continue
      let t = +el[0]
      let hit = time === 0 ? t === 0 : (t > time - 0.1 && t < time + 0.1)
      if (!hit) continue
      if (el[1] == 'next') { lastClick = 2; clickEvent(0) }
      else if (el[1] == 'goto' && syncPlay) { myPlayer.currentTime = start = 1 * el[2] }
      else if (el[1] == 'rate') rate = 1 * el[2] || defRate
      else if (el[1] == 'skinny') { skinny = 1 * el[2] || 1; if (time) positionMedia(2) }
      else if (el[1] == 'pause') { syncPlay = 0; if (el[2]) setTimeout(function () { syncPlay = 1 }, 1000 * el[2]) }}}


  function getSrt(scroll = 1) {
    lastBlock = scroll
    const src = document.getElementById('dat' + index)?.getAttribute('data');
    if (editor.style.display === 'flex') editor.style.opacity = 1		// resume visible after Play()
    if (!src || editor.style.display === 'flex') return
    editor.style.display = 'flex'
    captions = captions ? captions : 2
    undo = []
      fetch(src)
        .then(response => {return response.text()})
        .then(data => {openEditor(data)})
      .catch(() => {openEditor('new caption')})}


  function getPreview() { 							// captions in title el
    const thisIndex = index
    const src = document.getElementById('dat' + index)?.getAttribute('data');
    if (src.length > 25) {							// not just server name
      fetch(src)
        .then(response => {return response.text()})
        .then(data => {
          if (index !== thisIndex) return
          blocks = []
          viewport.replaceChildren()
          const parsed = parseInputText(data)
          if (parsed?.blocks?.length) {
            parsed.blocks.forEach(b => {addBlock(b.number || (blocks.length + 1), b.startTime || 0, b.text || '')})
            lastBlock = parseInputText(data)?.lastSelectedId || 1
            lastText = blocks[lastBlock - 1].innerText}})}}


  function updateCue(item, val) {						// rate, skinny, cues 
    val = Math.round(1000 * val) / 1000
    if (overEditor && item == 'rate' && !cue) {
      editingBlock._rate = myVoice.playbackRate = val; editing = 1; return}
    else if (item == 'rate') {
      rate = val
      if (!playing && !overMedia) defRate = val
      settings.defRate = String(defRate)
      localStorage.setItem(folder, JSON.stringify(settings))}
    if (type) {
      thumb.style[item] = val
      if (item == 'skinny') skinny = val
      if (!playing) Param(index)
      positionMedia(0.2)}}


  function updateContext() {							// innerHTML values
    if (!type) {myCue.innerHTML = myCap.innerHTML = ''; return}
    myCap.innerHTML = 'Captions'
    if (playing) {myCue.innerHTML = 'New Cue'} else myCue.innerHTML = 'Cues'
    end = dur.toFixed(2)
    let time = myPlayer.currentTime.toFixed(2)
    if (time > cue + 1) {end = time; time = cue}
    else if (time < cue - 1) end = cue
    else if (time >= cue) time = cue
    else {time = '0.00'; end = cue}
    myCue.innerHTML = (playing && dur) ? 'Add Cue '+formatTime(myPlayer.currentTime) : 'Show Cues'
    if (cue && end != dur) myCap.innerHTML = 'GoTo ' + formatTime(end)
    if (cue) myDur.innerHTML = formatTime(time)+' - '+formatTime(end)
    else if (dur && playing) myDur.innerHTML = formatTime(myPlayer.currentTime)+' - '+formatTime(dur)
    else if (dur) myDur.innerHTML = formatTime(dur)
    else myDur.innerHTML = ''}


  function capButton() {							// context menu Caption button
    if (playing) start = defStart = +myPlayer.currentTime.toFixed(2)
    else start = defStart
    let x = cue+'|goto|'+start.toFixed(1)
    if (cue) inca('Goto', x, index)						// add goto cue to media
    else {captions = 2; if (playing) {getSrt()} else Play()}}


  function sel(i) {								// highlight selected media in html
    if (!i || !mouseDown || overTitle || (gesture && mouseDown == 3)) return
    let x = ','+selected; el = document.getElementById('title' + i);
    if (x.match(','+i+',')) {selected = x.replace(','+i+',',',').slice(1); el.style.outline = null}
    else {selected = selected+i+','; el.style.outline = '1px solid red'; el.style.opacity = 1}}


  function setPitch(val) {
    pitch = val
    settings.pitch = String(val)
    localStorage.setItem(folder, JSON.stringify(settings))
    setupContext(myPlayer)
    myPlayer.jungle.setPitchOffset(semiToneTranspose(val))}


  function addFavorite() {
    if (!type || gesture) return
    if (playing) start = myPlayer.currentTime
    if (!playing && zoom == 1) if (dur < 200) {start = 0.0} else start = defStart
    inca('Favorite', start.toFixed(1),index,index)
    favicon.innerHTML += '&#10084'}						// heart symbol on htm thumb


  function Ffmpeg(id) {
    myNav.style.display = null
    let target = cue + '|' + id + '|' + skinny + '|' + playing + '|' + decodeURIComponent(myPlayer.src) + '|' + myPlayer.currentTime.toFixed(2)
    let select = playing || selected || overMedia || 0
    inca('Ffmpeg', target, select, (myPlayer.currentTime === dur ? dur - 0.1 : myPlayer.currentTime).toFixed(2))}


  function cropSend() {								// drag released → send x,y,w,h fractions + time
    const c = crop, r = myPlayer.getBoundingClientRect()
    crop = 0; myCrop.style.display = 'none'
    if (Math.abs(c[2] - c[0]) < 8 || Math.abs(c[3] - c[1]) < 50) return 0	// tiny drag = normal click
    const f = (v, o, s) => Math.min(1, Math.max(0, (v - o) / s))
    const x = [c[0], c[2]].map(v => f(v, r.left, r.width)), y = [c[1], c[3]].map(v => f(v, r.top, r.height))
    inca('Crop', [Math.min(...x), Math.min(...y), Math.abs(x[0] - x[1]), Math.abs(y[0] - y[1])].map(v => v.toFixed(4)), index, myPlayer.currentTime.toFixed(2))
    return 1}


  function formatTime(seconds) {
    let h = Math.floor(seconds / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return h ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`}


  function sheetPosters() {							// htm video thumbs: poster <-> 6x6 sheet
    for (const v of document.querySelectorAll('video[id^=thumb]')) {
      const i = v.id.slice(5), e = document.getElementById('entry' + i), vid = document.getElementById('vid' + i)
      if (!e?.dataset.params?.startsWith('video') || !vid) continue
      v.dataset.poster0 ||= v.poster
      const name = vid.src.match(/\/([^\/]+?)(?:\.[^.]*?)?$/)?.[1]
      v.poster = sheets ? v.dataset.poster0.replace(/\/posters\//, '/thumbs/').replace(/\/[^\/]*$/, '/') + name + '.jpg' : v.dataset.poster0}}


  function Flip() {xPos = 0; skinny *=- 1; thumb.style.skinny = skinny; Param(); positionMedia(0.4)}


  function mouseBack() {
    overTitle = 0
    if (closeOsk()) return
    else if (playing) closePlayer()
    else if (thumb.style.pop > 1) closePic()
    else if (longClick) window.close()
    else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)			// else scroll to page top
    else {inca('Reload',3,0)}}							// or finally, reload page & clear selected


  function popThumb() {
    thumb.currentTime = defStart
    thumb.play(); thumb.pause()
    if (type == 'document' || favicon.matches(':hover')) return
    let wrap = thumb.parentElement
    wrap.style.zIndex = 4900 + Zindex++
    wrap.classList.add('popped')
    if (zoom > 1) return
    zoom = thumb.style.pop = 1.2
    wrap.style.position = 'fixed'
    wrap.style.left = xPos - thumb.offsetWidth * xm + 'px'
    wrap.style.top  = yPos - thumb.offsetHeight * ym + 'px'
    wrap.style.transform = 'scale(' + Math.abs(skinny) * zoom + ',' + zoom + ')'}


  function closePic() {
    thumb.style.pop = 1
    myPic.style = ''; thumb.style.pop = ''
    const wrap = thumb.parentElement
    wrap.style.position = wrap.style.left = wrap.style.top = wrap.style.zIndex = wrap.style.transform = ''
    wrap.classList.remove('popped')
    Param()}


  function closeContext() {
    myNav.style.display = myDefault.style.display = myAlt.style.display = viewport.style.overflowY = null
    if (overEditor && editingBlock && myPlayer.paused) {
      const b = editingBlock, t = myPlayer.currentTime, n = b.nextElementSibling
      if (b._atEnd || dur && t >= dur - 0.05) {
        if (b._end != t) { editing = b._fit = 1
          const coupled = n && !b.dataset.end
          setEnd(b, t)
          if (coupled && !(+n.dataset.end > t || +n.nextElementSibling?.dataset.start > t)) {	// next block now has no valid end
            n.dataset.end = t + 4
            if (n._voice?.src) Object.assign(new Audio(n._voice.src.replace(/#/g, '%23')), {onloadedmetadata() { n.dataset.end = (t + this.duration / (n._rate || 1) * rate).toFixed(2) }})}}}
      else if (b.dataset.start != t) { editing = b._fit = 1; b.dataset.start = t }} 	// otherwise set start
    else if (thumb.style.rate || thumb.style.skinny) {
      if (type) {
        let x = (thumb.style.rate || '') + ',' + (thumb.style.skinny || '')
        const now = +myPlayer.currentTime.toFixed(2)
        if (cue) {									// cue set → write user cue + reset cue
          const r = x.split(',').map(v => v ? '1.0' : '0').join(',')
          Promise.resolve(inca('addCue', x, index, cue)).then(() => {
            inca('addCue', r, index, now)						// now ≈ cue-0.1 (player paused), so reset fires first
            thumb.style.rate = thumb.style.skinny = ''
            rate = 1; skinny = 1; myPlayer.playbackRate = 1; positionMedia(0.2)})}
        else inca('addCue', x, index, cue)						// plain save (writes 0.00|... if cue=0)
        cue = 0}}}


  async function closePlayer() {
    closeOsk()
    const t = myPlayer.currentTime
    const i = playing || lastMedia
    try {
      if (editing) {editing = 0; let json = makeJSON().replaceAll('#', '𝌇'); await inca('Edited', json, index)}
      if (i && !thumbSheet) await inca('History', t.toFixed(1), i)}
    finally {
      playing = 0
      closePic()
      myPlayer.removeAttribute('src')
      const faces = document.getElementById('voice-faces')
      if (faces) faces.style.display = 'none'
      myPlayer.muted = myVoice.muted = true
      mouseDown = start = captions = thumbSheet = cue = overTitle = mediaX = mySeek.style.width = 0
      myMask.style = myDur.innerHTML = myVoice.src = ''
      overBlock = editingBlock = editor.style.display = myNav.style.display = null
      myPlayerWrap.style.visibility = myPlayer.style.visibility = null
      scaleY = (innerHeight > innerWidth) ? 0.65 : 0.55
      const r = title.getBoundingClientRect();
      if (r.top < 0 + 140 || r.bottom > innerHeight - 80 || r.left < 0 || r.right > innerWidth) title.scrollIntoView({ block: 'center' })}}









function openEditor(text) {
  projectMedia.defaultSrc = originalPlayerSrc = decodeURIComponent(type === 'image' ? thumb.poster : thumb.src)
  mediaX = mediaY = 0
  lastBlock = type === 'image' && lastBlock ? 1 : lastBlock
  voices = []
  editor.style.transition = 'opacity 1s'
  editor.style.width = ''
  editor.style.opacity = 1
  document.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');
  const parsed = parseInputText(text);
  viewport.replaceChildren();
  viewport.innerHTML = '';
  blocks = [];
  (parsed?.blocks || []).forEach(b => {
      const block = addBlock(
      b.number || (blocks.length + 1),
      parseFloat(b.startTime) || 0,
      (b.text || '').replace(/<[^>]*>|[\u200B\u00A0]/g, ' '),
      b.fav || 0,
      b);
    lastVoice = b.voiceName || lastVoice
    block._voiceName = b.voiceName || ''
    block._volume = b.volume || 1
    block._rate = b.rate || 1
    block._delay = b.delay || 0
    if (b.endTime) block.dataset.end = b.endTime
    if (b.voice) block._voice = { src: b.voice };
    else lastVoice = block._voiceName = ''});
  if (projectMedia.defaultSrc) swapMedia(projectMedia.defaultSrc, lastBlock === 1 ? (defStart || 0) : 0)
  overMedia = 0
  if (!lastBlock) lastBlock = parsed?.lastSelectedId || 1
  let first = blocks[lastBlock - 1] || blocks[0];
  if (first.innerHTML == 'new caption') first.dataset.start = defStart
  else if (blocks.length < 3 && !undo.length) captions = 1
  activateBlock(first, userPlay)
  myPlayer.currentTime = first.dataset.start
  matchCountSpan.textContent = ''
  setTimeout(() => updateBlockAlignments(),10)
  projectMedia.ui = parsed.ui || {}
  if (parsed.ui) {
    const u = parsed.ui
    if (captions == 2) {
      faceZoom = u.faceZoom || 1
      document.getElementById('voice-faces')?.style.setProperty('--fz', faceZoom)
      editor.style.width = u.width || ''}
    if (u.mediaX) { mediaX = u.mediaX; mediaY = u.mediaY }
    if (parsed.ui.scaleY > 0) scaleY = parsed.ui.scaleY
    void myPlayerWrap.offsetWidth
    if (u.scaleY > 0) scaleY = u.scaleY}
  setTimeout(() => {editing = 0; first.focus(); toLine(first); syncPlay = 0; undo.length || snap(first, 'opened')}, 240)}







  const activateBlock = (block, play, force) => {
    offset = 0
    if (Chatterbox.busy || searchHeader.matches(':hover')) return
    const startDelay = overEditor ? 0 : block._delay * 1000 || 0
    block.style.setProperty('--progress', '0%')
    if (!blocks.length) blocks = [...document.querySelectorAll('.text-block')]
    if (overBlock && searchTerm) CSS.highlights.delete('search')
    mediaHeader.textContent = title.value || null
    lastVoice = editingBlock?._voiceName || lastVoice;
    block._end = +block.dataset.end || natEnd(block)
    if (force) editingBlock = null
    const isSameBlock = editingBlock === block
    const media = getEffectiveMedia(block);
    const time = isSameBlock ? myPlayer.currentTime : (Number.isFinite(+block.dataset.start) ? +block.dataset.start + 0.04 : 0)
    if (!isSameBlock) block._atEnd = 0
    swapMedia(media?.src || originalPlayerSrc, time || 0)
    if (block._voice?.src) {
      if (!isSameBlock && decodeURIComponent(myVoice.src) != block._voice.src) myVoice.src = block._voice.src.replace(/%/g, '%25').replace(/#/g, '%23')
      myPlayer.muted = true; myVoice.muted = defMute
      block.classList.add('has-voice')}
    else {
      block.classList.remove('has-voice');
      myVoice.muted = true; myPlayer.muted = defMute}
    if (!isSameBlock) {
      if (editingBlock && (undo.dirty || editingBlock._t0 != null && editingBlock.textContent != editingBlock._t0)) snap(editingBlock)
      block._t0 = block.textContent
      if (editingBlock) editingBlock.classList.remove('editing', 'paused')
      block.classList.add('editing');
      editingBlock = block}
    myPlayer.volume = myVoice.volume = block._volume || 1
    if (userPlay && !overEditor && startDelay) setTimeout(() => syncPlay = play, startDelay)
    else syncPlay = play
    if (captions == 1) {								// compact captions
      const rec = block.getBoundingClientRect()
      editor.style.height = rec.height + 'px'
      editor.style.pointerEvents = 'none'
      editor.style.background = 'transparent'
      block.style.backgroundColor = 'transparent'
      block.style.outline = 'none'
      viewport.style.overflowY = 'hidden' }
    else {										// caption editor mode
      viewport.style.overflowY = ''
      editor.style.height = editor.style.top = editor.style.left = ''
      block.style.backgroundColor = ''
      editor.style.pointerEvents = ''
      editor.style.background = ''
      block.style.outline = ''}
    block.dataset.hasMedia = (!!block._voice?.src || hasMedia()) ? "1" : "0"
    setFade()
    updateBlockAlignments()
    updateFaceHighlights()}






  function updateBlockAlignments() {
    const box = document.getElementById('voice-faces') || editor.appendChild(Object.assign(document.createElement('div'), {id: 'voice-faces'}))
    const list = [...new Set(blocks.map(b => (b._voiceName || '').trim()).filter(Boolean))].slice(0, 6)
    if (list + '' !== voices + '') {
      voices = list
      box.replaceChildren(...list.map(v => {
        const w = Object.assign(document.createElement('div'), {className: 'voice-face-wrap', innerHTML: '<img class="voice-face" draggable="false"><div class="voice-face-name"></div>'})
        w.dataset.voice = v; w.firstChild.src = `/inca/cache/voices/${encodeURIComponent(v)}.jpg`; w.lastChild.textContent = v
        return w}))}
    box.style.setProperty('--fz', faceZoom)
    box.style.display = list.length && editor.offsetWidth && captions ? 'flex' : 'none'}


  function updateFaceHighlights(block) {
    const v = ((block || editingBlock)?._voiceName || '').trim()
    document.querySelectorAll('.voice-face-wrap').forEach(w => w.firstChild.classList.toggle('active', w.dataset.voice === v))}


  function swapMedia(src, time) {
    try { src = decodeURIComponent(src) } catch(e) {}
    const newSrc = src.split('/').map((s,i) => i < 3 ? s : encodeURIComponent(s)).join('/')
    const changed = decodeURIComponent(myPlayer.src) !== src ? 1 : 0
    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(src)
    const isText = /\.txt$/i.test(src)
    if (changed && decodeURIComponent(myPlayer.poster || myPlayer.src || '') !== src) myPlayerWrap.style.opacity = 0
    if (isImage) { myPlayer.removeAttribute('src'); myPlayer.poster = newSrc; myPlayer.load() }
    else if (isText) { myPlayer.poster = ''; myPlayer.removeAttribute('src'); myPlayer.load() }
    else { if (type !== 'audio') myPlayer.poster = ''; if (changed) { myPlayer.src = newSrc; myPlayer.load() }}
    const d = Math.abs(myPlayer.currentTime - time)
    if (d > 0.5 || (mouseDown || changed || editingBlock?._voice?.src) && d > 0.02) myPlayer.currentTime = time
    if (mouseDown || changed || isImage) setTimeout(() => { positionMedia(2.4); myPlayerWrap.style.opacity = 1 }, 50)
    if (isImage) { const img = new Image(); img.onload = () => { fitPlayer(img.naturalWidth, img.naturalHeight) }; img.src = newSrc }
    else if (changed && !isText) myPlayer.onloadedmetadata = () => { fitPlayer(myPlayer.videoWidth, myPlayer.videoHeight) }}


  function createBlock(num, startSec, text, fav, extra = {}) {
    const block = document.createElement('pre');
    block.className = 'text-block';
    block.dataset.num = num;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text || ' '
    block.dataset.fav = fav || '0';
    if (extra.media != null) block._media = extra.media ? { src: extra.media } : false
    if (extra.voice) block._voice = { src: extra.voice, name: extra.voiceName || '' };
    block._volume = extra.volume || 1
    block._rate = extra.rate || 1
    block._delay = extra.delay || 0
    if (block._voice?.src) block.classList.add('has-voice');
    return block}


  function shortFormatTime(sec) {
    sec = Number(sec) || 0
    const m = Math.floor(sec / 60)
    const s = (sec % 60).toFixed(1).padStart(4, '0')
    return `${m} : ${s.replace('.', ' . ')}`}

  function addBlock(num, startSec, text, fav, cues = {}) {
    const block = createBlock(num, startSec, text, fav, cues);
    viewport.appendChild(block);
    blocks.push(block);
    return block}

  function getEffectiveMedia(block) {
    for (let b = block; b && b._media !== false; b = b.previousElementSibling)
      if (b._media?.src) return b._media
    return projectMedia.defaultSrc ? { src: projectMedia.defaultSrc } : null}

  function renumberBlocks() {
    blocks = Array.from(viewport.children)
    blocks.forEach((b, i) => b.dataset.num = i + 1)
    void viewport.offsetHeight}

  function selectVoice(name) {
    if (!name || !editingBlock) return
    editingBlock._voiceName = myVoiceHeader.textContent = name
    myNav.style.display = 'none'
    Chatterbox()}

  function showStart() {
    const b = editingBlock
    myStart.style.color = null
    myStart.textContent = b?.dataset.num + '\u2003\u2003' + shortFormatTime(Math.round(100 * myPlayer.currentTime) / 100)}

  function closeMenu() {
    mediaContent.style.display = 'none'
    document.getElementById('voice-faces')?.style.removeProperty('display')
    const media = getEffectiveMedia(editingBlock)
    swapMedia(media?.src || originalPlayerSrc, editingBlock?.dataset.start || 0)
    syncPlay = 0
    currentPreviewItem = null
    updateBlockAlignments()}

  async function historyOpen() {							// history dropdown, opened by click
    if (mediaContent.style.display == 'flex') return
    document.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');
    mediaContent.style.display = 'flex';
    document.getElementById('voice-faces')?.style.setProperty('display', 'none')

    try {
      const resp = await fetch('/inca/fav/History.m3u');
      const historyText = resp.ok ? (await resp.text()).trim() : '';
      const text  = historyText + (historyText ? '\n' : '');
      const lines  = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const items = lines.map(line => {
        const [path, startStr] = line.split('|');
        const startSec = parseFloat(startStr) || 0;
        const name = path.split(/[\\/]/).pop();
        const short = name.length > 60 ? name.slice(0, 60) : name;
        const url = server + path.replace(/\\/g, '/').split('/').map(s => encodeURIComponent(s)).join('/');
        return { url, startSec, name, short };
      }).filter(i => i.url && !i.name.endsWith('.txt') && !i.name.endsWith('.m3u'));
      items.reverse();
      mediaContent.innerHTML = '';

    const none = document.createElement('div');
    none.textContent = 'Default Media';
    none.style.marginLeft = '1.7em';

  none.onclick = (e) => {
    e.stopPropagation();
    mediaContent.style.display = 'none'
    let lastSrc = editingBlock?._voice?.src || null;
    if (editingBlock) {
      const custom = (getEffectiveMedia(editingBlock)?.src || '') !== (projectMedia.defaultSrc || '')
      if (editingBlock._voice && !custom) { delete editingBlock._voice; delete editingBlock._voiceName }
      else editingBlock._media = false
      const prev = editingBlock.previousElementSibling
      const newStart = prev ? (parseFloat(prev.dataset.start) || 0) + 2 : 0
      editingBlock.dataset.start = newStart
      editing = 1
      swapMedia(projectMedia.defaultSrc || originalPlayerSrc, editingBlock.dataset.start)
      activateBlock(editingBlock, 1)
      setTimeout(() => myPlayer.currentTime = editingBlock.dataset.start,20)
      if (lastSrc) inca('addHistory', lastSrc)}}

    mediaContent.appendChild(none)

    items.forEach(item => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '6px';
      row.style.padding = '2px 4px';
      row.style.cursor = 'default';
      if (item.url.includes('.mp3')) row.dataset.isVoiceAsset = 'true'
      const label = document.createElement('span');
      label.textContent = item.short;
      label.style.flex = '1';
      row.append(label);
      mediaContent.appendChild(row);


        row.addEventListener('mouseenter', () => {
          if (currentPreviewItem === row) return;
          currentPreviewItem = row;
          const isImage = /\.(jpe?g|png|gif|webp)$/i.test(item.url);
          if (isImage) myPlayer.poster = item.url;
          else {
            myPlayer.src = item.url;
            myPlayer.currentTime = item.startSec;
            myPlayer.muted = false;
            syncPlay = 1;
          }
          myVoice.muted = true
          myPlayer.load()
        });

        row.addEventListener('mouseleave', () => {
          if (mediaContent.style.display != 'none') {
            myPlayer.src = (getEffectiveMedia(editingBlock)?.src || originalPlayerSrc).replace(/%/g, '%25').replace(/#/g, '%23')
            myPlayer.poster = ''
            myVoice.muted = false; myPlayer.muted = !!editingBlock._voice?.src
            myPlayer.load()
            myPlayer.currentTime = editingBlock.dataset.start
            syncPlay = 0
            currentPreviewItem = null
          }
        });

        label.addEventListener('click', (e) => {
          e.stopPropagation();
          mediaContent.style.display = 'none'
          const mediaObj = { src: item.url, name: item.short };
          if (editingBlock) {
            if (row.dataset.isVoiceAsset === 'true') {
            if (editingBlock._voice?.src) inca('addHistory', editingBlock._voice.src)
            if (!editingBlock._voice) editingBlock._voice = {};
            editingBlock._voice.src = '/' + decodeURIComponent(item.url.replace(/^https?:\/\/[^/]+\/?/i, ''))
              .replace(/\\/g, '/')
              .replace(/^.*?\/inca\//i, 'inca/')
            editingBlock._voiceName = editingBlock._voiceName || lastVoice || '';
              myVoice.src = item.url}
            else {
              editingBlock._media = mediaObj;
              editingBlock.dataset.start = item.startSec
              }
            editing = 1}
          swapMedia(mediaObj.src, item.startSec);
          setTimeout(()=> activateBlock(editingBlock, 1), 100)
          if (!editingBlock._voice?.src) myPlayer.currentTime = editingBlock.dataset.start
        });
      });
    } catch (_) {
      mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:8px;">No media</div>';
    }
  }


  function dropClick(t) {							// click: open / close undo and history lists
    const undoOn = myUndo.classList.contains('open'), histOn = mediaContent.style.display == 'flex'
    if (t.closest('#myUndo > a')) { if (histOn) closeMenu(); undoOn ? undoClose() : undoOpen(); return 1 }
    if (t.closest('#media-header > .header')) { undoClose(); histOn ? closeMenu() : historyOpen(); return 1 }
    if (t.closest('[data-undo]')) { undoPick(t); undoClose(); return 1 }
    if (t.closest('.undo-list, #media-header .dropdown-content')) return 1	// items handle their own clicks
    if (undoOn) undoClose()
    if (histOn) closeMenu()
    return undoOn || histOn}


  function populateVoices() {
    const myVoiceHeader = document.getElementById('myVoiceHeader');
    const voiceSub = document.getElementById('voiceSub');
    voiceSub.innerHTML = '';
    voiceSub.style.padding = '0 1.5em 0 1.2em';
    const current = editingBlock?._voiceName || lastVoice || '';
    myVoiceHeader.textContent = current || 'None';
    const addGap = () => {const gap = document.createElement('div'); gap.style.height = '8px'; voiceSub.appendChild(gap)}
    const none = document.createElement('div');
    none.textContent = 'None';
    none.style.color = '#ffc0cb88';
    none.onclick = () => {
      if (editingBlock) {
        delete editingBlock._voice;
        delete editingBlock._voiceName;
        delete editingBlock.dataset.voiceName;
        editingBlock.classList.remove('has-voice');
        editing = 1;
        lastVoice = ''
        myVoice.pause();
        myVoice.src = '';
        activateBlock(editingBlock, 0);
      }
      myVoiceHeader.textContent = 'None';
    };
    voiceSub.appendChild(none);
    addGap();
    let newSet = new Set()
    blocks.forEach(b => { if (b._voiceName) newSet.add(b._voiceName.trim()) })
    newSet.forEach(name => {
      const row = document.createElement('div');
      row.textContent = name;
      if (name === current) row.style.color = 'pink'
      row.onclick = () => selectVoice(name)
      voiceSub.appendChild(row);
    });
    addGap();
    inca('getVoices', 0, index)?.then(result => {
      if (!result) return;
      result.split('|').filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).forEach(name => {
        const row = document.createElement('div');
        row.textContent = name;
        if (name === current) row.style.color = 'pink'
        row.onclick = () => selectVoice(name)
        voiceSub.appendChild(row);
        });
      })
    }


  function makeJSON() {
    if (captions == 1) { editing = 0; return }
    const data = {
      defaultMedia: originalPlayerSrc
        ? { src: originalPlayerSrc.replace(/\\/g, '/') }
        : null,
      ui: { width: editor.style.width, mediaX, mediaY, 
        scaleY: (captions == 2 && !projectMedia.ui.scaleY) ? 0.3 * scaleY : scaleY, 
        faceZoom},
      lastSelectedId: editingBlock ? parseInt(editingBlock.dataset.num) : 0,
      blocks: blocks.map(b => {
        const start = parseFloat(b.dataset.start);
        return {
          number: parseInt(b.dataset.num),
          startTime: isNaN(start) ? null : start.toFixed(1),
          ...(b.dataset.end && { endTime: b.dataset.end }),
          fav: b.dataset.fav === '1' ? 1 : 0,
          text: b.innerText.trim(),
          media: b._media === false ? false : b._media?.src ? b._media.src.replace(/\\/g, '/') : null,
          voice: b._voice?.src ? b._voice.src.replace(/\\/g, '/') : null,
          voiceName: b._voiceName,
          volume: b._volume,
          rate: b._rate,
          delay: b._delay
        }})}
    return JSON.stringify(data, null, 2)}



  function parseInputText(text) {
    text = text.trim();
    if (!text) return { blocks: [] };
    if (text.startsWith('{') || text.startsWith('[')) {
      try { return JSON.parse(text); } catch (e) {}
    }
    const blocksOut = [];
    const paragraphs = text.split(/\r?\n\r?\n+/)
    paragraphs.forEach((para, i) => {
      const lines = para.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      let startSec = i * 4; 
      let caption  = para.trim();
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
    if (!blocksOut.length && text) {
      blocksOut.push({ number: 1, startTime: 0, text: text, extras: {} });
    }
    return { blocks: blocksOut };}


  function parseSrtTimeFlexible(t) {
    t = t.replace(',', '.').trim();
    const parts = t.split(':').map(p => parseFloat(p) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(t) || 0;}


 function splitIfNeeded(e) {
    if (!editingBlock || e.target.id) return
    e.preventDefault()
    const block = editingBlock
    const sel = window.getSelection()
    if (!sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const preRange = document.createRange()
    preRange.selectNodeContents(block)
    preRange.setEnd(range.startContainer, range.startOffset)
    const beforeText = preRange.toString().replace(/\r\n/g, '\n')
    const fullText = block.innerText.replace(/\r\n/g, '\n')
    const afterText = fullText.substring(beforeText.length)
    const isSecondEnter = beforeText.endsWith('\n') || e.ctrlKey			// Ctrl+Enter splits at once
    if (!isSecondEnter) {
      const left = beforeText.replace(/[ \t]+$/, '')
      const rest = afterText.replace(/^ +/, '')
      block.textContent = (left + '\n' + (rest || '\u200B')) || '\u200B'
      const n = block.firstChild, p = left.length + 1
      range.setStart(n, Math.min(p, n.length)); range.collapse(true)
      sel.removeAllRanges(); sel.addRange(range); editing = 1; return}
    const part1 = beforeText.replace(/\n+$/, '')
    const part2 = afterText.replace(/^[\n ]+/, '')
    if (!part1.trim() && !part2.trim()) return
    const startSec = parseFloat(block.dataset.start) || 0
    const nextSibling = block.nextSibling
    const idx = blocks.indexOf(block)
    block.textContent = part1
    const end = +block.nextElementSibling?.dataset.start || dur || startSec + 4		// time split by text length
    const newBlock = createBlock(null, +(startSec + (end - startSec) * part1.length / ((part1 + part2).length || 1)).toFixed(2), part2, '0', {})
    if (part2 === '' || part2 === '\u200B') newBlock.innerHTML = ' '
    if (block._voice) {
        newBlock._voice = Object.assign({}, block._voice)
        newBlock.dataset.voiceName = block.dataset.voiceName || ''
        newBlock._voice.src = null
    }
    if (block._media) newBlock._media = block._media
    if (block.dataset.rate) newBlock.dataset.rate = block.dataset.rate
    if (block._rate) newBlock._rate = block._rate
    viewport.insertBefore(newBlock, nextSibling)
    blocks.splice(idx + 1, 0, newBlock)
    renumberBlocks()
    activateBlock(newBlock, 0)
    newBlock.focus()
    const newRange = document.createRange()
    newRange.selectNodeContents(newBlock)
    newRange.collapse(false)
    sel.removeAllRanges()
    sel.addRange(newRange)}


  function Backspace(e) {
    e.preventDefault()
    const fromOsk = !e.isTrusted									// new
    syncPlay = 0
    if (captions) editing = 1
    if (!fromOsk && overBlock && editingBlock != overBlock) activateBlock(e.target.closest('.text-block'),0)	// changed
    const sel = window.getSelection()
    let atStart = false
    if (sel.rangeCount && editingBlock) {
      const range = sel.getRangeAt(0)
      if (range.collapsed && editingBlock.contains(range.startContainer)) {
        const preRange = document.createRange()
        preRange.selectNodeContents(editingBlock)
        preRange.setEnd(range.startContainer, range.startOffset)
        atStart = preRange.toString() === ''}}
    if (captions && e.target.id !== 'caption-search-input' && atStart) {				// merge always allowed
      const prev = editingBlock?.previousElementSibling
      if (prev) {
        const prevText = prev.textContent
        const currText = editingBlock.textContent
        const joinAt = prevText.length
        const needsNewline = currText.trim().length > 0 && prevText.length > 0
        prev.textContent = prevText + (needsNewline ? '\n' : '') + currText
        const removed = editingBlock
        editingBlock.remove()
        blocks = blocks.filter(b => b !== removed)
        overBlock = prev
        activateBlock(prev, 0)
        prev.focus()
        const newRange = document.createRange()
        const sel2 = window.getSelection()
        prev.normalize()
        if (prev.firstChild && prev.firstChild.nodeType === 3) {
          const textNode = prev.firstChild
          newRange.setStart(textNode, Math.min(joinAt, textNode.length))}
        else { newRange.selectNodeContents(prev); newRange.collapse(false) }
        newRange.collapse(true)
        sel2.removeAllRanges()
        sel2.addRange(newRange)
        renumberBlocks()
        return}
      return}
    if (!fromOsk && overBlock && atStart) {document.execCommand('forwardDelete'); return}		// changed
    document.execCommand('delete')}


  function mergeNext(e) {								// Delete at end: join next caption, keep first start
    e.preventDefault()
    const b = editingBlock, n = b.nextElementSibling, at = b.textContent.trimEnd().length
    b.textContent = (b.textContent.trimEnd() + ' ' + n.textContent.trim()).trim() || ' '
    n.dataset.end ? b.dataset.end = n.dataset.end : delete b.dataset.end
    n.remove(); renumberBlocks(); editing = 1
    getSelection().collapse(b.firstChild, Math.min(at, b.firstChild.length))}


  function snap(b = editingBlock, label) {						// undo snapshot, skipped if unchanged
    undo.dirty = 0
    if (captions != 2 || !b) return
    const json = makeJSON()
    if (json == undo.at(-1)?.json) return
    undo.push({json, t: Date.now(), text: label || b.textContent.trim() || '-'})
    if (undo.length > 20) undo.shift()}


  function restore(u) {								// reload a snapshot: captions, active caption, scroll
    if (!u) return
    lastBlock = 0; openEditor(u.json); setTimeout(() => editing = 1, 300)}


  function undoOpen() {								// undo dropdown: build rows, newest first
    editor.style.zIndex = 5012; myUndo.classList.add('open')
    myUndo.lastChild.replaceChildren(...undo.map(undoRow).reverse())}


  function undoRow(u, i) {							// one row: minutes ago, caption text
    const r = document.createElement('div'); r.dataset.undo = i
    r.append(Object.assign(document.createElement('b'), {textContent: Math.floor((Date.now() - u.t) / 60000) + 'm'}), Object.assign(document.createElement('span'), {textContent: u.text}))
    return r}


  function undoClose() { editor.style.zIndex = ''; myUndo.classList.remove('open') }


  function dropLeave(e) {							// mouse left icon + list: close after a short grace
    const d = e.currentTarget; clearTimeout(d._t)
    d._t = setTimeout(d == myUndo ? undoClose : () => mediaContent.style.display == 'flex' && closeMenu(), 100)}


  function dropStay(e) { clearTimeout(e.currentTarget._t) }			// back inside within the grace: stay open


  function undoPick(el) { restore(undo[el.closest('[data-undo]').dataset.undo]) }


  function replArrow() {							// search box: Right arrow at end starts replace mode
    const v = searchInput.value
    if (searchInput.selectionStart < v.length || !v.trim() || v.includes('⟶')) return 0
    searchInput.value = v + ' ⟶ '; searchInput.selectionStart = searchInput.selectionEnd = v.length + 3
    paintSearch(); return 1}


  function paintSearch() {							// replace mode: old red, new green (on input only)
    const [a, b] = searchInput.value.split('⟶'), on = b != null
    searchHeader.classList.toggle('repl', on); repl = []
    if (!on) return
    searchOv.replaceChildren(Object.assign(document.createElement('i'), {textContent: a}), '⟶', Object.assign(document.createElement('b'), {textContent: b}))
    searchOv.style.left = searchInput.offsetLeft + 'px'; searchOv.style.width = searchInput.clientWidth + 'px'
    searchOv.scrollLeft = searchInput.scrollLeft}


  function replaceNext(fwd) {							// wheel down: replace in next block, up: undo last
    const [a, b] = searchInput.value.split('⟶').map(s => s.trim())
    if (!fwd) { const r = repl.pop(); if (r) { r[0].textContent = r[1]; toLine(r[0]) } }
    else if (a) {
      const re = new RegExp('(?<!\\w)' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w)', 'gi')	// whole words
      const from = repl.length ? blocks.indexOf(repl.at(-1)[0]) + 1 : 0
      const n = blocks.slice(from).find(x => x.textContent.search(re) >= 0)
      if (!n) return
      repl.push([n, n.textContent])
      n.textContent = n.textContent.replace(re, () => b)
      editing = undo.dirty = 1; toLine(n)}
    matchCountSpan.textContent = repl.length + ' \u2713'}


  function newClone() {
    let inp = document.createElement('input')
    inp.className = 'voice-input'
    inp.id = 'myVoiceInput'
    inp.value = editingBlock?._voiceName || ''
    inp.onblur = () => inp.remove()
    inp.style.padding = '1em'
    inp.style.left = xPos+'px'
    inp.style.top  = yPos+'px'
    document.body.appendChild(inp)
    inp.focus(); inp.select()
    inp.onkeydown = e => { 
      if (e.key == 'F24') inp.remove()
      if (e.key != 'Enter') return
      e.preventDefault()
      e.stopPropagation()
      let name = inp.value.trim() || 'clone'
      if (name = name.charAt(0).toUpperCase() + name.slice(1)) {
        if (editingBlock) { editingBlock._voiceName = name; activateBlock(editingBlock, 0) }
        inca('newClone', myPlayer.currentTime.toFixed(1), index, name)}
      inp.remove()}}


  function nextMatch(e) {
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < delay) return
    delay = 200; wheel = 0;
    if (!searchHeader.matches(':hover')) {if (mediaContent.style.display == 'none') nextCaption(e.deltaY); return}
    syncPlay = 0
    if (searchHeader.classList.contains('repl')) return replaceNext(e.deltaY > 0)
    newSearch()
    if (!searchTerm || searchTerm.length < 3) {
      const favs = blocks.filter(b => b.dataset.fav === '1')				// bookmark search
      if (!favs.length) return
      favIndex = (favIndex + (e.deltaY > 0 ? 1 : -1) + favs.length) % favs.length
      matchCountSpan.textContent = `${favIndex + 1} : ${favs.length}`
      toLine(favs[favIndex])
      activateBlock(favs[favIndex], userPlay)
      return}
    const term = searchInput.value.split('⟶')[0].trim().toLowerCase();
    matches = blocks.filter(b => b.textContent.toLowerCase().includes(term))
    if (!matches.length) return
    matchIndex = (matchIndex + (e.deltaY > 0 ? 1 : -1) + matches.length) % matches.length
    matchCountSpan.textContent = String(matchIndex + 1) + ' : ' + String(matches.length)
    toLine(matches[matchIndex])}



  function newSearch() {
    const term = searchInput.value.split('⟶')[0].trim().toLowerCase()
    if (term) searchTerm = term
    CSS.highlights.delete('search')
    if (term.length < 3) {matchIndex = 0; return}
    const hl = new Highlight()
    matches = blocks.filter(b => {
      const n = b.firstChild, i = n?.data?.toLowerCase().indexOf(term)
      if (!(i >= 0)) return 0
      const r = new Range(); r.setStart(n, i); r.setEnd(n, i + term.length); hl.add(r)
      return 1})
    CSS.highlights.set('search', hl)
    matchCountSpan.textContent = matches.length > 0 ? `1 : ${matches.length}` : '0 : 0'
    if (matches.length) toLine(matches[0])}


  function newVoice() {
    const name = document.elementFromPoint(xPos, yPos)?.closest('.voice-face-wrap')?.dataset.voice
    if (!name || !editingBlock) return
    editingBlock._voiceName = name
    userPlay = 0
    Chatterbox()}


  function Chatterbox(id) {
    myNav.style.display = null
    if (!editingBlock || Chatterbox.busy || gesture) return
    let block = overBlock || editingBlock
    userPlay = syncPlay = block._atEnd = 0
    const voiceName = editingBlock._voiceName || lastVoice || 'Amai'
    block._voiceName = voiceName
    activateBlock(block, 0)
    Chatterbox.busy = 1
    myPlayer.currentTime = block.dataset.start
    let last = block?._voice?.src || projectMedia.defaultSrc
    let text = block.innerText.replace(/<[^>]*>|[\u200B\u00A0]/g, ' ').trim()
    let provider = {myQwen:'qwen', myKitten:'kitten', myElevenLabs:'elevenlabs'}
    [id] || 'chatterbox'
    editing = 1
    delay = 100
    block.style.outline = '1.4px dotted orange'
    fetch(server + 'generate-voice', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName, text, provider, title: title?.defaultValue.trim() })})
          .then(async res => { const data = await res.json(); if (!res.ok) throw data.error || res.status; return data.path })
          .then(path => {
            block.style.outline = ''
            if (!editingBlock) { inca('addHistory', last, 0, path); return }		// editor closed: just save it
            if (!block._voice) block._voice = {}
            myVoice.src = path.replace(/%/g, '%25').replace(/#/g, '%23')
            block._voice.src = path
            block._rate = 1; block._fit = 0
            userPlay = 1
            editing = 1
            myVoice.addEventListener('loadedmetadata', () => {
            if (isFinite(myVoice.duration)) {
              const t = (+block.dataset.start + myVoice.duration * rate).toFixed(2)
              if (!block.dataset.end || !block.nextElementSibling) setEnd(block, t)}	// uncoupled: leave the boundary
            window.getSelection().removeAllRanges()
            activateBlock(block, 1, 1); snap(block)}, { once: true })
            inca('addHistory',last,0,path)})
          .catch(err => {block.style.outline = ''; alert(err || 'chatterbox not responding')})
          .finally(() => { Chatterbox.busy = 0 })}


  function scrollUntilBlock(dir) {								// wheel strip: crawl to next block
    const want = dir > 0 ? editingBlock?.nextElementSibling : editingBlock?.previousElementSibling
    if (crawl || !want) return
    crawl = dir > 0 ? 1 : -1
    lastBlock = 0
    requestAnimationFrame(tick)
    function tick(t) {
      if (!crawl) return
      const dt = tick.t ? Math.min(t - tick.t, 50) : 16; tick.t = t
      let y = viewport.scrollTop
     viewport.scrollTop += crawl * Math.max(1, Math.round(0.2 * dt))		// crawl speed
     const stuck = viewport.scrollTop === y
     let top = want.getBoundingClientRect().top
     if (stuck || (crawl > 0 ? top <= line() : top >= line())) {
        toLine(want); myPlayer.currentTime = +want.dataset.start + 0.04; activateBlock(want, userPlay = 1)
        crawl = 0}
      else requestAnimationFrame(tick)}}


  function playerProgress() {
    const b = editingBlock, t = myPlayer.currentTime
    if (!captions || !b || t === playerProgress.t) return
    playerProgress.t = t
    if (overMedia || myNav.style.display || mediaContent.style.display === 'flex' || crawl || !playing) return
    if (!myPlayer.paused && t >= endOf(b) - 0.02 && (b._atEnd || overEditor || captions == 1)) return toEnd(b)
    const next = b.nextElementSibling
    if (!next || b._atEnd || overEditor || t <= b._end || voiceBusy(b)) return
    activateBlock(next, userPlay)
    toLine(next, 1)}


  function nextCaption(dir, force) {
    syncPlay = 0
    if (ribbon.matches(':hover') || !userPlay) return
    if (!captions || myNav.style.display) return
    if (overEditor && !force && !overMedia) return
    let next = dir < 0 ? (editingBlock?.previousElementSibling) : (editingBlock?.nextElementSibling)
    if (!next || overMedia) {userPlay = 0; return}
    myVoice.currentTime = 0
    activateBlock(next, userPlay)
    toLine(next, 1)}


  function playerEnded() {
    if (!playing || (editingBlock?._voice?.src && !myVoice.ended)) return
    syncPlay = userPlay = 0
    myPlayer.currentTime = myPlayer.duration + 2
    if (playlist.match('/inca/music/')) { if (Param(index += 1)) {Play(); syncPlay = 1 } else closePlayer() }
    else if (!captions && !defPause && delay < 30 && type != 'audio' && !longClick) { getStart(); syncPlay = 1 }
    title.scrollIntoView({ block: 'center' })
    delay = 60}


  // top panel open/close
  const PANEL = 6                                       // entries per page
  let pnl = {}, pnlSec = '', pnlPg = 0, primed = 0      // sections, current section, page
  const icons = [...document.querySelectorAll('#myMusic, #myFav, #myFol, #mySub, #mySearch')]
  const hot = [myPanel, myRibbon1, ...icons]
  let dwell
  icons.forEach(a => {
    a.addEventListener('mouseenter', () => {
      dwell = setTimeout(() => {
        myPanel.classList.add('open')
        a.id == 'mySearch' ? filter('mySearch') : panelOpen(a.id.slice(2))
        searchIcon()}, 200)})
    a.addEventListener('mouseleave', () => clearTimeout(dwell))})
  hot.forEach(e => e.addEventListener('mouseleave', ev => {
    if (!hot.some(x => x.contains(ev.relatedTarget))) (myPanel.classList.remove('open'), searchIcon())}))
  panelLoad()

  const fit = () => myInput.style.fontSize = Math.max(0.65, Math.min(1, myInput.clientWidth / 12 / (myInput.value || myInput.placeholder).length)) + 'em'
  fit()
  for (const ev of ['input', 'click'])
    myInput.addEventListener(ev, () => { primed = !!myInput.value; searchIcon(); fit() })

  myPanel.addEventListener('mousedown', e => {						// top panel entry click
    const c = e.target.closest('c')
    if (c) inca(c.dataset.c, c.dataset.c == 'Path' && c.dataset.on ? '' : index, '', c.dataset.k)})
