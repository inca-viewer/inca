// incorporate infinite talk when 50GB disk is free


  let wheel = 0								// wheel count
  let wheelTime = 0							// date() of wheel event
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
  let Click = 0								// state is cleared after clk up
  let lastClick = 0							// state is preserved after up
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
  let editorX = 0
  let editorY = 0
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
  let trigger = 0.8							// trigger to show seekbar
  let listSize = 0
  let favIndex = 0
  let matchIndex = 0
  let searchTerm = ''
  let timestamps = []
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
  let scrollY = 0
  let isScrolling = 0
  let predictBuffer = '';
  let predictor = { words: {} }
  let currentPreviewItem = null;
  let server = 'http://localhost:3000/'
  let projectMedia = { defaultSrc: null, ui: {} }
  let scaleY = (innerHeight > innerWidth) ? 0.6 : 0.5			// myPlayer height (screen ratio)
  let timeout = 0
  let timeout1 = 0
  let leftVoice = ''
  let rightVoice = ''
  let centerVoice = ''
  let faceZoom = 1
  let voiceFaceLeft = null
  let voiceFaceRight = null
  let voiceFaceCenter = null

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


  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('keydown', keyDown)
  myContent.addEventListener('scroll', () => seekTimer = cursor = 0)
  document.addEventListener('dragstart', () => gesture = 1)
  document.addEventListener('drop', (e) => {Click = 0; gesture = 0; if (overEditor) activateBlock(e.target.closest('.text-block'),0)})
  myPlayer.addEventListener('ended', nextMedia)
  myVoice.addEventListener('ended', nextCaption)
  myPlayer.addEventListener('timeupdate', playerProgress)
  window.addEventListener('beforeunload', (e) => {if (playing && editing) e.preventDefault()})
  myNav.addEventListener('wheel', wheelEvent)
  myNav.addEventListener('mouseleave', () => {
    if (editingBlock && myPlayer.paused) {
     if (editingBlock.dataset.start != myPlayer.currentTime) editing = 1
      editingBlock.dataset.start = myPlayer.currentTime}
    myNav.style.display = myDefault.style.display = myAlt.style.display = null
    if (thumb.style.rate || thumb.style.skinny) {
      let x = thumb.style.rate + ',' + thumb.style.skinny
      let y = playing ? myPlayer.currentTime : 0
      if (type) inca('addCue', x, index, y)}})
  myStart.addEventListener('wheel', wheelEvent)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState=='visible' && folder=='Downloads' && !selected && !playing) inca('Reload',2,index)})
  myInca.addEventListener('mouseenter', () => {
    const isAlt = myAlt.style.display === 'block'			// toggle context menus
    myAlt.style.display = isAlt ? '' : 'block'
    myDefault.style.display = isAlt ? 'block' : 'none'})
  searchHeader.addEventListener('wheel', nextMatch)
  mediaContent.addEventListener('mouseleave', () => {
    mediaContent.style.display = 'none'
    document.getElementById('voice-faces')?.style.removeProperty('display')
    updateBlockAlignments()})
  searchHeader.addEventListener('mouseleave', () => searchInput.placeholder='🔍︎')
  searchHeader.addEventListener('click', (e) => {
    searchTerm = searchInput.value = ''; blocks.forEach(b => {b.style.color = ''; b.textContent = b.textContent})})
  searchHeader.addEventListener('mouseenter', (e) => {
    let sel = window.getSelection().toString()
    if (sel) {searchTerm = searchInput.value = sel}
    else searchInput.placeholder='❤'})
  searchInput.addEventListener('input', newSearch)
  viewport.addEventListener('input', () => {editing = 1; syncPlay = 0 })
  viewport.addEventListener('wheel', wheelEvent)
  viewport.addEventListener('scroll', scrollActivate)
  editor.addEventListener('wheel', wheelEvent)				// face zoom


  function mouseDown(e) {
    longClick = gesture = 0
    if (e.key == 'F22') Click = lastClick = 3
    else if (e.button != 2) Click = lastClick = e.button + 1
    if (Click == 2) e.preventDefault()					// forward and back mouse buttons
    xRef = xPos; yRef = yPos
    clickMedia = overMedia
    timeout = setTimeout(() => {longClick = Click; clickEvent(e)},280)}	// detect long click


  function mouseUp(e) {
    if (!Click) return							// stop re-entry also if new page load
    clearTimeout(timeout)						// longClick timer
    if (!longClick) clickEvent(e)					// process click event
    longClick = wheel = gesture = Click = 0}


  function keyDown(e) {							// keyboard events
    if (e.key == 'Enter' && captions) {e.preventDefault(); e.stopImmediatePropagation(); splitIfNeeded(e)}
    else if (e.key == 'Enter' && !playing) {
      if (overTitle == 2) inca('Rename', title.value, lastMedia)	// rename title
      else inca('SearchBox','','',myInput.value)}			// search for media
    else if (e.key == 'F22') mouseDown(e)				// R click down
    else if (e.key == 'F23') mouseUp(e)					// R click up
    else if (e.key == 'F24' || (e.code == 'ArrowLeft' && e.shiftKey)) mouseBack()
    else if ((e.key == 'ArrowUp' || e.key == 'ArrowDown') && e.shiftKey && captions && editingBlock) moveBlock(e)
    else if (e.key === 'Backspace') Backspace(e)
    else if (!overTitle && !captions && playing) {
      if (e.key == 'ArrowRight') myPlayer.currentTime += 10
      else if (e.key == 'ArrowLeft') myPlayer.currentTime -= 10
      else if (e.key == 'ArrowDown') {longClick = 0; lastClick = 2; clickEvent(e)}
      else if (e.key == 'ArrowUp') {lastClick = longClick = 2; clickEvent(e)}}}


  async function clickEvent(e) {
    delay = 80;										// 80 max
    let id = e.target.id								// id under cursor
    let emotion = '[' + e.target.dataset.tag + '] '
    if (e.target.closest('#emotionSub')) document.execCommand('insertText', false, emotion)
    if (e.target.closest('#voice-faces') || e.target.classList.contains('voice-face')) { newVoice(e); return }
    if (captions) overBlock = document.elementFromPoint(xPos, yPos)?.closest('.text-block') || 0
    if (!playing && !listView && longClick && !gesture && overMedia && !overTitle) popThumb()	// pop thumb out of flow
    if (['myCut', 'myCopy', 'myPaste'].includes(id)) {
      if (lastId) lastId.focus()
      const media = !playing && overMedia ? index : ''					// cutcopypaste text or files
      inca('CutCopyPaste',id,media); return}
    if (longClick == 1 && !gesture && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (['myIndex', 'myMp3', 'myMp4', 'myJoin', 'myJpg', 'mySrt'].includes(id)) {Ffmpeg(id); cue = 0; return}
    if (id == 'myClone') {newClone(); return}
    if (id == 'myLoudnorm') {inca('loudNorm',0,index); return}
    if (id == 'myInca') {inca('Settings'); return}
    if (id == 'ribbon') {viewport.scrollTo({top:0,behavior:'smooth'}); return}
    if (id == 'myStart' && editingBlock) { myPlayer.currentTime = editingBlock.dataset.start; editing = 1; return}
    if (id == 'myFavorite') {addFavorite(); return}
    if (id == 'myDelete') if (selected || type) {inca('Delete','',index); return}
    if (id == 'myMute' || id == 'myMute2') {defMute ^= 1; inca('Mute', defMute); myPlayer.muted = defMute; return}
    if (id == 'myPause' || id == 'myPause2') {defPause ^= 1; inca('Pause',defPause); syncPlay ^= 1; return}
    if (id == 'myPitch' || id == 'myPitch2') {setPitch(pitch ^= 1); return}
    if (id == 'mySpeed' || id == 'mySpeed2') {updateCue('rate',1); return}
    if (id == 'myVol') {editingBlock._volume = 1; editing = 1; return}
    if (id == 'myDelay') {editingBlock._delay = 0; editing = 1; return}
    if (id == 'myRate') {editingBlock._rate = 1; editing = captions; return}
    if (id == 'mySkinny') {updateCue('skinny',1); editing = captions; return}
    if (id == 'myFlip') {Flip(); return}
    if (id == 'myElevenLabs' || id == 'myChatterbox') Chatterbox(id)
    if (id == 'myCancel') {
      if (!editing) {captions = 1; activateBlock(editingBlock,0); editingBlock.scrollIntoView({block: 'center' }); return}
      else if (myCancel.innerHTML != 'Sure ?') myCancel.innerHTML = 'Sure ?' 
      else { editing = 0; closePlayer() }
      return}
    if (id == 'myBookmark') {
      editingBlock.dataset.fav = editingBlock.dataset.fav === '1' ? '0' : '1';
      editing = 1; overBlock = editingBlock}
    if (id == 'myExport') {
      let txt = blocks.map(b => b.innerText.trim()).filter(Boolean).join('\n\n').replaceAll('#', '𝌇')
      inca('Export', txt, index)}
    if (lastClick == 4) {mouseBack(); return}						// Back Click

    if (lastClick == 3) {								// right click
      if (gesture) return
      if (overEditor) {
        lastId = editingBlock
        myVoice.currentTime = 0
        if (overBlock) {myPlayer.currentTime = overBlock.dataset.start; activateBlock(overBlock, 0)}
        if (longClick && ym > 0.2) Chatterbox()
        populateVoices()
        myNav.classList.add('editor-mode')} 
      else myNav.classList.remove('editor-mode')
      if (!longClick && !myNav.style.display) {
        myNav.style.display = 'block'; myNav.style.left = xPos-90+'px'; myNav.style.top = yPos-32+'px'; delay = 200; return}
      if (longClick) return}

    if (lastClick == 2) {  								// Middle click
      if (editing) return
      blocks = []
      viewport.innerHTML = ''
      editor.style.display = null							// allow new srt
      if (editing || myMenu.matches(':hover') || myPanel.matches(':hover')) return
      if (zoom > 1) {Play(); return}
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// list/thumb view
      if (longClick) {index--} else index++						// next media
      if (!Param()) {index = lastMedia; closePlayer(); return}
      setThumb()
      myPlayer.style.opacity = overMedia = 0}

    if (lastClick == 1) {
      if (document.getElementById('osk')?.contains(document.elementFromPoint(xPos, yPos))) return
      predictBuffer = ''
      if (longClick && (overTitle || ['myInput', 'caption-search-input', 'inp', 'myVoiceInput'].includes(id))) osk()
      if (id.includes('search-input')) return
      if (id == 'myCap') {capButton(); return}
      if (id == 'myCue' && playing) {
        cue = myPlayer.currentTime = Math.max(0.01, +myPlayer.currentTime.toFixed(2)); syncPlay = 0; return}
      if (captions && !overMedia) {
        const wasOsk = document.getElementById('osk')
        const block = overBlock ? overBlock : editingBlock
        if (id == 'viewport') window.getSelection().removeAllRanges()
        if (longClick && !gesture && overEditor && xm < 0.95 && ym > 0.3) {syncPlay = userPlay = 0; osk()}
        if (overBlock && overBlock !== editingBlock) {
          lastBlock = block.dataset.num; userPlay = syncPlay = 1; activateBlock(block, !longClick); return}
        if (captions == 1) {
          editor.style.pointerEvents = 'auto'
          overBlock = document.elementFromPoint(xPos, yPos)?.closest('.text-block') || 0
          editor.style.pointerEvents = 'none'
          if (overBlock) {captions = 2; activateBlock(block)}}
        if (!longClick) {
          if (id == 'myMask' && myPlayer.currentTime < block._end && myPlayer.paused) {userPlay ^= 1; syncPlay = userPlay; return}
          if (wasOsk && overBlock == editingBlock || (!userPlay && syncPlay && !overEditor)) userPlay = syncPlay = 0
          else {
            const paused = editingBlock?._voice?.src ? myVoice.paused : myPlayer.paused
            if (paused) {
              userPlay = 1
              myVoice.currentTime = 0
              myPlayer.currentTime = +editingBlock.dataset.start}
            else userPlay ^= 1
            syncPlay = userPlay}
          return}}

      if (!title.matches(':hover') && overTitle == 2) {closeOsk(); overTitle = 0; return}
      if (overTitle && (longClick || overTitle == 2)) {
        if (overTitle != 2) title.value = title.defaultValue.trim()
        overTitle = 2; lastMedia = index; return}
      if (!playing && id != title.id && !gesture) {
        if (!overTitle && longClick && myPanel.matches(':hover')) return 
        if (id == 'myCue' || (overMedia && thumb.src.slice(-3) == 'm3u')
        || (longClick && ((overMedia && type == 'document')
        || (favicon && favicon.matches(':hover')))) 
        || (overMedia && thumb.src.endsWith('.pdf'))) {Click = 0; inca('Notepad',id,index,favicon.matches(':hover')); return}}
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
      if (!playing && !overMedia) {myNav.style.display = null; index = lastMedia; start = lastSeek; return 1}
      if (myNav.style.display && type == 'video') {myNav.style.display = null; thumbSheet ^= 1; start = lastSeek; setThumb(); return 1}}
    if (lastClick == 2 || !dur) start = defStart
    else if (zoom > 1) start = thumb.currentTime || start
    if (!thumbSheet && playing && ym > trigger && overMedia || yw > 0.95) {
      if (longClick) {if (xm < 0.5) {myPlayer.currentTime = 0} else myPlayer.currentTime = defStart}
      else myPlayer.currentTime = start
      if (!Click && captions && editingBlock?._voice?.src) nextCaption(-1)		// wheel only
      return }
    if (longClick && longClick != 2 && !title.matches(':hover')) return
    if (dur < 200 && start < defStart + 2 && !playlist && !favicon.textContent.includes('\u2764')) start = 0
    if (!playing && !longClick && overMedia && !dur) return 1				// show image or text files
    if (myPlayer.currentTime > dur - 0.5) myPlayer.load()				// restart media
    if (!longClick && thumbSheet && id != 'myPic') {					// clicked thumb on 6x6 thumbsheet
      if (skinny < 0) xm = 1-xm								// if flipped media
      let row = Math.floor(ym * 6)							// get media seek time from thumbsheet xy
      let col = Math.ceil(xm * 6)
      let offset = dur > 60 ? 20 : 0							// skip movie credits...
      let ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200								// see index() in inca.ahk to explain
      if (overMedia && yw < 0.9) start = (offset - (ps * offset) + dur * ps)}
    else if (!longClick && lastClick == 1 && playing) {userPlay = syncPlay ^= 1; return}
    if (lastClick && lastClick != 2) thumbSheet = 0
    if (!gesture) return 1}								// return and continue


  function Play() {
    if (editing) return
    closePic()
    Param()
    thumb.pause()
    syncPlay = 0
    userPlay = !defPause
    editor.style.transition = null
    editor.style.opacity = 0
    if (!thumbSheet && lastClick) myPlayer.style.opacity = 0				// fade in player
    if (!thumbSheet || type == 'image') myPlayer.poster = thumb.poster
    else if (!playing) lastSeek = defStart
    if (playlist.match('/inca/music/')) myPlayer.muted = 0
    else myPlayer.muted = defMute
    if (!thumbSheet) {
      if (favicon.matches(':hover')) getSrt(1)
      else if (overTitle && Click && favicon.innerText.includes('©')) previewMode ? getSrt() : getSrt(1)
      else if (captions || type == 'document') getSrt()}
    if (el = document.getElementById('title'+lastMedia)) el.style.color = el.style.fontWeight = ''
    title.style.color = 'pink'; title.style.fontWeight = 'bold'
    if (playlist.match('/inca/music/') && !thumbSheet) {start = 0; myPlayer.muted = 0}
    if (type == 'audio' && !captions) myPlayer.style.borderBottom = '1px solid pink'
    else myPlayer.style.border = null
    if (pitch || myPlayer.context) {setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    if (captions && pitch || myVoice.context) {setupContext(myVoice); myVoice.jungle.setPitchOffset(semiToneTranspose(pitch))}
    playing = index
    seekTimer = 0
    zoom = 1
    lastMedia = index
    setThumb()
    positionMedia(0)
    myPic.style.top = '-999px'
    let syncStart = start								// because seekbar overwrites start
    if (!thumbSheet && dur && !cue && !captions) {myPlayer.currentTime = syncStart; syncPlay = 1}
    setTimeout(async () => {
      if (!captions && !thumbSheet && defPause && !playlist.match('/inca/music/')) {myPlayer.currentTime = syncStart; syncPlay = 0}
      if (!more && lastIndex < listSize && index > lastIndex - 9) inca('More', lastIndex)
      if (lastClick) positionMedia(0.4)
      myVig.style.visibility = myPlayer.style.visibility = 'visible'
      myPlayer.style.opacity = 0.98							// 0.98 fixes browser transition bug?
      myVig.style.opacity = 1
      if (!thumbSheet) await inca('History', myPlayer.currentTime.toFixed(1), lastMedia)},100)}


  function mouseMove(e) {
    let id = e.target.id
    overBlock = e.target.closest('.text-block') || 0
    overEditor = !overMedia && captions && id != 'myMask' ? 1 : 0
    if (overBlock) lastId = overBlock
    if (innerHeight == outerHeight) {xPos = e.screenX; yPos = e.screenY}
    else {xPos = e.clientX; yPos = e.clientY}
    myAlert.style.left = mySelected.style.left = xPos + 30 +'px'
    myAlert.style.top = mySelected.style.top = yPos + 20 +'px'
    let x = Math.abs(xPos-xRef)
    let y = Math.abs(yPos-yRef)
    cursor = overMedia ? 12 : 4
    seekbar()
    if (x + y > 7 && !gesture && Click) {
      gesture = 1
      if (!playing && overMedia && zoom > 1) popThumb()
      if (!playing && overMedia && !longClick && zoom == 1 && !myNav.style.display) sel(index)}
    if (!gesture || !Click) {gesture = 0; return}
    const wasOsk = document.getElementById('osk')
    if (gesture == 1 && y > x + 1) gesture = 2
    if (id == 'editor') editing = 1
    if (thumb.style.pop > 1) {
      const wrap = thumb.parentElement
      wrap.style.left = parseInt(wrap.style.left||0) + xPos - xRef + 'px'
      wrap.style.top  = parseInt(wrap.style.top ||0) + yPos - yRef + 'px'}
    else if (Click == 1 && (gesture == 3 || id.includes('osk'))) {
      gesture = 3
      wasOsk.style.left = parseInt(wasOsk.style.left || 0) + xPos - xRef + 'px'
      wasOsk.style.top  = parseInt(wasOsk.style.top || 0) + yPos - yRef + 'px'}
    else if (playing && (Click == 1 || gesture == 2 || delay == 1)) {
      const dx = xPos - xRef, dy = yPos - yRef
      if (thumbSheet) { xyz[0] += dx; xyz[1] += dy }
      else if (!overBlock) {
        if (id == 'myMask' || (id == 'viewport' && ym < 0.2))  {mediaX += dx; mediaY += dy}
        else if (overMedia) {
          mediaX += dx; mediaY += dy
          if (captions) { editorX -= dx; editorY -= dy }}
        if (captions && (overMedia || id == 'myMask' || id == 'viewport')) editing = 1}
      positionMedia(0)}
    if (gesture) {
      xRef = xPos; yRef = yPos
      if (captions == 2) projectMedia.uiHeight = editor.style.height}}


  function wheelEvent(e) {
    let id = e.target.id 								// faster hover detection
    if (e.target.closest('#voiceSub')) return						// scroll within submenu
    if (e.target.closest('#emotionSub')) return
    if (e.target.closest('.dropdown-content')) return
    if (overEditor && ym > 0.2 && !myNav.style.display && !overMedia) {wheel = 0; return} // allow viewport scroll
    e.preventDefault()									// stop default scroll
    if (!Click && captions && !myNav.style.display && id == 'myMask') {
      if (Math.abs(e.deltaY) > 1 && Date.now() - wheelTime > 600) {			// hysteresis
        wheelTime = Date.now()
        let x = userPlay; userPlay = 1; nextCaption(e.deltaY, 1); userPlay = x		// scroll caption blocks
        myPlayer.currentTime = editingBlock.dataset.start}
        return}
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < delay) return
    let wheelUp = wheelDir * e.deltaY > 0
    if (longClick && e.target.closest('#voice-faces')) {				// face zoom
      faceZoom = Math.max(1, Math.min(2.5, faceZoom * (wheelUp ? 1.03 : 0.97)))
      document.getElementById('voice-faces')?.style.setProperty('--fz', faceZoom)
      wheel = 0; delay = 12}
    if (overEditor && !myNav.style.display && !overMedia) return
    let factor = 1 + (wheelUp ? wheel : -wheel) / 1500
    if (['myType', 'myAlpha', 'myDate', 'mySize', 'myDuration', 'mySearch'].includes(id)) {
      if (wheelUp) filt++
      else if (filt) filt--								// filter
      if ((id == 'myAlpha' || id == 'mySearch') && filt > 26) filt = 26
      if (id == 'myType' && filt > 4) filt = 4
      filter(id); delay = 90}
    else if (id == 'mySpeed') { 							// rate
      let val = cue ? rate : (editingBlock?._rate ?? rate)
      if (wheelUp) {val -= 0.01} else val += 0.01
      updateCue('rate',val); delay = 80}
    else if (id == 'mySkinny' && type) {						// skinny
      if (wheelUp) {skinny -= 0.01} else skinny += 0.01
      updateCue('skinny',skinny); delay = 80}
    else if (id.includes('thumb') && overMedia && Click && zoom > 1) {			// zoom thumb
      if (wheelUp) zoom *= factor
      else if (zoom > 1.04) zoom *= factor
      else {zoom = 1; delay = 100; closePic(); delay = 4444; return}
      thumb.style.pop = zoom
      thumb.parentElement.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'
      start = thumb.currentTime
      delay = 8}
    else if (id == 'myThumbs' || (!playing && Click)) { 				// zoom all thumbs
      let z = wheel/1500
      let view = settings.view
      if (view < 300 && wheelUp) view *= 1+z
      else if (!wheelUp) view /= 1+z
      if (view < 8) view = 8
      settings.view = String(view)
      myView.style.setProperty('--max-size', view + 'em')
      localStorage.setItem(folder, JSON.stringify(settings))
      Param(); thumb.load()								// show poster or sheet
      thumb.parentElement.style.opacity = thumb.style.opacity = 1
      myContent.scrollTo(0,0)
      delay = 9}
    else if (id == 'myWidth' && !playing) {						// page width
      let x = 1*myView.style.width.slice(0,-2); let z = wheel/2000
      if (!wheelUp) x *= 1+z
      else if (wheelUp && x / 1+z > 100) x /= 1+z
      if (x > innerWidth-20) x = innerWidth - 20
      myView.style.width = x.toFixed(2)+'px'
      settings.pageWidth = String(x); localStorage.setItem(folder, JSON.stringify(settings))
      delay = 8}
    else if (id == 'mySelect' && !captions) {
      Click = longClick = lastClick = 0
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index-- 				// next - previous
      else if (Param() && playing) { start = defStart; Play() }
      if (!thumbSheet) myPlayer.currentTime = start
      setThumb(); positionMedia(0); delay = 140}
    else if (id == 'myDelay' && overEditor) {						// caption delay
      editing = 1
      delay = 140
      let pause = editingBlock._delay || 0
      if (wheelUp) pause += 0.1
      else if (pause >= 0.1) pause -= 0.1
      pause = Math.round(pause * 10) / 10
      editingBlock._delay = pause}
    else if (id == 'myRate' && overEditor) {						// caption speed
      editing = 1
      delay = 140
      let speed = editingBlock._rate || 1
      if (!wheelUp) speed += 0.01
      else if (speed >= 0.1) speed -= 0.01
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
    else if (id == 'myStart' && captions && editingBlock) {				// moving block position
      if (e.clientX - myNav.offsetLeft < 40) {
        editingBlock.dataset.start = myPlayer.currentTime
        let currentIndex = blocks.indexOf(editingBlock)
        let newIndex = currentIndex + (wheelUp ? 1 : -1)
        if (newIndex < 0) newIndex = 0
        if (newIndex >= blocks.length) newIndex = blocks.length - 1
        if (newIndex !== currentIndex) activateBlock(blocks[newIndex], 0)
        myVoiceHeader.textContent = editingBlock._voiceName
        myPlayer.currentTime = editingBlock.dataset.start
        editingBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        delay = 333}
      else if (e.clientX - myNav.offsetLeft < 70) { myPlayer.currentTime += (wheelUp ? 1 : -1); delay = 60 }
      else { myPlayer.currentTime += (wheelUp ? 0.02 : -0.02); delay = 74}
      if (myPlayer.currentTime >= dur) myPlayer.currentTime = dur}			// nudge start time
    else if (playing && Click) {
      let x = rect.left+rect.width/2-xPos 						// zoom myPlayer
      let y = rect.top+rect.height / 2 - yPos
      let z = clickMedia && Click && (xm < 0.15 || xm > 0.8 || ym < 0.15 || ym > 0.8) ? wheel / 1300 : 0
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
      delay = 124
      let interval = 0.06								// seek
      if (dur > 200) interval = 0.2
      if (dur > 200 && (overMedia && ym > trigger || yw > 0.95)) interval = 1	
      else if (!syncPlay && !(captions && id == 'myMask')) interval = 0.02
      interval = wheelUp ? interval : -interval
      if (playing) {
        myPlayer.currentTime += interval
        if (dur) myPlayer.addEventListener('seeked', () => delay = 40, {once: true})}	// min. 40
      else if (zoom != 1) thumb.currentTime += interval; 				// popped thumb
      if (!playing) seekTimer = 0							// hide seekbar in thumb popout
      else seekTimer = 5								// force seekbar while seeking
      thumb.pause()}
    wheel = 0}


  function timerEvent() { 								// every 94mS
    xw = xPos / innerWidth
    yw = yPos / innerHeight
    if (overTitle != 2) { overTitle = title.matches(':hover') ? 1 : 0; if (!overTitle) previewMode = 0 }
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
    if (delay >= 30) delay -= 10							// wheel/timer blocking
    else myAlert.innerText = ''
    if (wheel >= 10) wheel -= 10
    if (more) more--									// lazy loading holdback
    if (cursor) cursor--								// cursor hide timer
    mySelected.textContent = String(selected).includes(',') ? selected.split(',').length - 1 : ''
    if (!playing || thumbSheet || overTitle) myBody.style.cursor = null			// show default cursor
    else if (!cursor) myBody.style.cursor = 'none'					// hide cursor
    else myBody.style.cursor = 'crosshair'						// moving cursor over player
    if ((listView && thumb.style.opacity == 1) || favicon.matches(':hover') || myPic.matches(':hover')) overMedia = index
    else if (overMedia && myNav.style.display || myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else if (!listView && title.matches(':hover')) overMedia = index
    else if (!overMedia && !playing) type = ''
    else overMedia = 0
    mySpeed.innerHTML = mySkinny.innerHTML = null
    let currentRate = editingBlock?._voice?.src ? myVoice.playbackRate : rate
    if (type) {
      mySpeed.style.color = currentRate == 1 ? null : 'red'
      mySpeed.innerHTML = currentRate == 1 ? 'Speed' : `Speed ${currentRate.toFixed(2)}`
      mySkinny.innerHTML = skinny == 1 ? 'Skinny' : `Skinny ${skinny.toFixed(2)}`
      mySelect.innerHTML = 'Select '+index
      myPlayer.style.outline = title.style.outline
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
    myInput.style.color = myInput.value ? 'red' : null
    mySkinny.style.color = skinny == 1 ? null : 'red'
    myPitch.style.color = pitch ? 'red' : null
    myPause.style.color = defPause ? 'red' : null
    myMute.style.color = defMute ? 'red' : null
    myPause2.innerHTML = defPause ? "⏸" : ''
    myMute2.innerHTML = defMute ? "🔇︎" : ''
    myPitch2.innerHTML = pitch ? "♪" : ''
    mySpeed2.innerHTML = defRate !=1 ? "s" : ''
    seekTimer = ((overMedia && (ym > trigger || yw > 0.95)) || overTitle == 1) 
      ? Math.min(seekTimer + 1, 5) 
      : Math.max(seekTimer - 1, 0)
    seekbar()
    if (playing || !overTitle) {
      title.classList.remove('preview'); title.value = title.defaultValue; title.style.height = ''}
    if (playing) {
      edPause.style.opacity = !userPlay ? 1 : 0
      edPause.textContent = !userPlay ? '⏸' : ' '
      if (editingBlock?._voice?.src) progress = 100 * myVoice.currentTime / myVoice.duration
      else if (editingBlock) {
        progress = 100 * (myPlayer.currentTime - editingBlock.dataset.start) / (editingBlock._end - editingBlock.dataset.start)}
      progress = Math.max(0, Math.min(100, progress))
      if (captions && (dur || editingBlock?._voice?.src)) {
        editingBlock?.style.setProperty('--progress', progress + '%')
        editingBlock?.classList.toggle('paused', !userPlay)}
      myCancel.innerText = editing ? (myCancel.innerText !== 'Sure ?' ? '✕' : 'Sure ?') : '⌒'
      myCancel.style.color = myCancel.innerText == '⌒' ? 'pink' : 'red'
      syncPlay ? myPlayer.play().catch(() => {}) : myPlayer.pause()
      syncPlay && !!editingBlock?._voice?.src
        ? myVoice.play().catch(() => {})
        : myVoice.pause()
      positionMedia(0)
      if (captions) { showStart() }
      myVol.innerHTML = editingBlock?._volume == 1 ? 'Volume' : `Volume ${editingBlock?._volume*100}`
      myDelay.innerHTML = editingBlock?._delay == 0 ? 'Delay' : `Delay ${editingBlock?._delay*1000}`
      myRate.innerHTML = editingBlock?._rate == 1 ? 'Speed' : `Speed ${editingBlock?._rate}`
      myVoice.playbackRate = editingBlock?._rate || 1
      myPlayer.playbackRate = mediaContent.style.display == 'flex' ? 1 : rate
      myMask.style.pointerEvents = 'auto'
      if (dur && !thumbSheet) lastSeek = myPlayer.currentTime
      if (playlist.match('/inca/music/') && scaleY < 0.6) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
      if (myPlayer.duration) dur = myPlayer.duration
      if (cues.innerHTML && !thumbSheet && type !='image' && dur) myCues(myPlayer.currentTime)}
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
      if (cursor && type == 'video' && zoom == 1 && thumb.matches(':hover')) {
        if (!thumb.readyState) {thumb.load(); thumb.currentTime = defStart + 0.04}
        if (thumb.readyState === 4 && thumb.paused && !overTitle) thumb.play()}
      title.style.height = previewMode || overTitle == 2 ? '4em' : ''
      title.style.overflowY = previewMode || overTitle == 2 ? 'auto' : ''
      title.style.width = listView ? '100%' : ''
      myInca.textContent = '...'
      myMask.style.pointerEvents = null
      if (zoom > 1 && overMedia) myMask.style.opacity = 0.9
      else myMask.style.opacity = 0}}


  function positionMedia(time) {							// position myPlayer in window
    myPanel.style.top = '50px'
    myView.style.top = '200px'
    let sheetSize = aspect > 1 ? 1.4 : 1
    if (!mediaX) {
      mediaX = screen.width / 2
      mediaY = captions ? screen.height / 3 : screen.height / 2
      xyz = [mediaX, mediaY, sheetSize]}
    let x = mediaX, y = mediaY
    let z = (captions == 2 && !projectMedia.ui.scaleY) ? 0.5 * scaleY : scaleY
    if (type == 'document' || type == 'audio' || playlist.match('/inca/music/')) z *= 0.5
    if (thumbSheet) { x = xyz[0]; y = xyz[1]; z = xyz[2] }
    skinny = thumb.style.skinny || skinny
    myPlayer.style.transition = 'opacity ' + time + 's, transform ' + time + 's'
    myVig.style.transition = 'opacity ' + time/4 + 's, transform ' + time + 's'
    myPlayer.style.left = myVig.style.left = (x - (window.screenX || 0)) - myPlayer.offsetWidth / 2 + "px"
    myPlayer.style.top  = myVig.style.top  = (y - (outerHeight - innerHeight)) - myPlayer.offsetHeight / 2 + "px"
    myPlayer.style.transform = myVig.style.transform = "scale(" + skinny * z + "," + z + ")"
    myVig.style.setProperty('--scale', 20/z + 'px')
    myVig.style.width = myPlayer.style.width
    myVig.style.height = myPlayer.style.height
    void myPlayer.offsetWidth
    const edRect = myPlayer.getBoundingClientRect()
    const ox = captions == 1 ? 0 : editorX
    const oy = captions == 1 ? 0 : editorY
    editor.style.left = (edRect.left + edRect.width / 2 - editor.offsetWidth / 2 + ox) + 'px'
    editor.style.top  = (edRect.bottom + 8 + oy) + 'px'
    editor.style.transform = 'none'}


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
      if (xm>0 && xm<1 && (ym > trigger || yw > 0.95) && ym < 1 && !thumbSheet && delay < 30) myPic.style.opacity = 1
      else myPic.style.opacity = 0
      if (type == 'video' && (!sheetUrl || myPic.style.backgroundImage === '')) setThumb()  // lazy loading thumbSheet
      myPic.style.top = Math.min(rect.top + rect.height, innerHeight) - myPic.offsetHeight + 'px'
      if (playing) myPic.style.left = xPos - skinny * myPic.offsetWidth / 2 + 'px'
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
    myPic.style.backgroundImage = null
    if (type == 'video') {
      const match = thumb.src.match(/\/([^\/]+?)(?:\.[^.]*?)?$/);
      const filename = match ? match[1] : null;
      let path = thumb.poster.replace(/\/posters\//, '/thumbs/').replace(/\/[^\/]*$/, '')
      sheetUrl = path + '/' + filename + '.jpg'
      if (settings.view > 30) thumb.poster = sheetUrl					// show sheets instead of posters
      else thumb.poster = thumb.poster.replace(/\/thumbs\//, '/posters/')
      if (thumbSheet) {myPlayer.poster = sheetUrl; myPlayer.load()}
      else myPlayer.poster = null
      if (myPlayer.src != thumb.src) myPlayer.src = thumb.src
      myPic.style.backgroundImage = 'url(\"'+sheetUrl+'\")'}						// use 6x6 thumbsheet as poster
    else if (type == 'audio') myPlayer.src = thumb.src
    else myPlayer.src = null
    if (!thumbSheet && dur) myPlayer.currentTime = start
    aspect = thumb.offsetWidth/thumb.offsetHeight
    trigger = aspect > 1 ? 0.7 : 0.8							// when to show seekbar - ym
    let x = y = z = innerHeight
    if (aspect < 1) {x = z*aspect} else y = z/aspect					// portrait or landscape - normalised size
    myPlayer.style.width = x +'px'; myPlayer.style.height = y +'px'			// normalise player size
    myVig.style.width = myPic.style.width = thumb.offsetWidth + 'px'
    myVig.style.height = myPic.style.height = thumb.offsetHeight + 'px'
    thumb.parentElement.style.transform = 'scale('+skinny*zoom+','+zoom+')'
    myPic.style.transform = 'scale('+skinny+',1)'
    myPic.style.backgroundPosition = '0% 0%'}						// sets to frame 1 of 6x6 thumbSheet


  function filter(id) {									// for htm ribbon headings
    let ch = String.fromCharCode(filt + 65)
    let el = document.getElementById('my'+ch)
    if (id == 'mySearch') {el.scrollIntoView(); return}					// search letter in top menu
    let units = ''; let x = filt							// eg 30 minutes, 2 months, alpha 'A'
    el = document.getElementById(id)
    if (id == 'myType') {x = ''; units = { 1: 'Video', 2: 'Image', 3: 'Audio', 4: 'Fav' }[filt] || units}
    if (id == 'myAlpha') x = String.fromCharCode(filt + 64)
    if (id == 'mySize') {x *= 10; units = " Mb"}
    if (id == 'myDate') units = " months"
    if (id == 'myDuration') units = " minutes"
    el.style.color = filt ? 'red' : 'pink'
    el.innerHTML = filt ? x+' '+units : id.slice(2)
    if (myType.innerHTML != 'Type') myType.style.color = 'red'}


  function inca(command,value,select,address) {					// server messaging to inca.ahk
    more = 4
    if (incaBusy) return
    incaBusy = true
    try {
        if (select) {select += ','} else select = ''
        if (selected) select = selected
        value = typeof value === 'string' ? value.replaceAll('#', '𝌇') : value ?? ''
        if (!address) address = ''
        if (command == 'Delete' || command == 'Rename' || value.toString().includes('|myMp4') || (select && command == 'Path')) {
          selected = ''
          for (x of select.split(',')) if (el = document.getElementById('thumb'+x)) el.remove()}
        let messages = '#'+command+'#'+value+'#'+select+'#'+address
        return fetch(server + 'generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
          .then(response => {if (response.status === 204) {return null} return response.text()})
          .then(data => {
            if (data) {
              const type = data.substring(0, data.indexOf('|'))
              const content = data.substring(data.indexOf('|') + 1)
              if (type == 'html') {
                myView.insertAdjacentHTML('beforeend', content)
                while (Param(lastIndex)) {setThumb(); lastIndex++}}
              else if (type == 'address') {
                if (lastClick === 2) window.open(content, '_blank')
                else window.location.href = content}
              return content}
            return null})
          .catch(err => { return null })
          .finally(() => { incaBusy = false })}
        finally {}}


  function Param(i) {								// get media parameters
    i ||= index
    if (!playing) myPlayer.poster = myPlayer.src = ''				// release from server
    if (!(document.getElementById('thumb'+i))) return				// end of media list
    if (!(favicon = document.getElementById('myFavicon'+i))) favicon = '' 	// fav or cc icon
    if (overTitle != 2) {
      title.classList.remove('preview')
      title.value = title.defaultValue}
    thumb = document.getElementById('thumb'+i)					// htm thumb element
    entry = document.getElementById('entry'+i)					// thumb and title container
    if (overTitle != 2) title = document.getElementById('title'+i)		// htm title element
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
    return 1}


  function globals(fo, wd, mu, pa, so, fi, lv, se, pl, ix, ls) {		// import globals from inca.exe
    folder = fo; filt = fi; wheelDir = wd; defPause = pa; listView = lv; selected = se; playlist = pl; listSize = ls
    defMute = (mu == 'yes') ? 1 : 0
    settings = JSON.parse(localStorage.getItem(folder) || '{}')
    settings.pageWidth = (isNaN(settings.pageWidth) || settings.pageWidth > innerWidth) ? '640' : settings.pageWidth
    settings.view = (isNaN(settings.view) || settings.view < 6 || settings.view > 300) ? '10' : settings.view
    settings.defRate = (isNaN(settings.defRate) || settings.defRate < 0.2 || settings.defRate > 5) ? '1' : settings.defRate
    settings.pitch = settings.pitch == 1 ? 1 : 0
    myView.style.width = parseFloat(settings.pageWidth) + 'px'
    myView.style.setProperty('--max-size', settings.view + 'em')
    defRate = parseFloat(settings.defRate)
    pitch = parseFloat(settings.pitch)
    filter('my'+so)								// show filter heading in red
    for (x of selected.split(',')) {
      if(el = document.getElementById('title'+x)) {el.style.outline = '1px solid red'; el.style.opacity = 1}}
    for (lastIndex = 1; Param(lastIndex); lastIndex++) {setThumb()}		// process null cues (eg. skinny, start, rate)
    if (!ix) index = 1
    else index = ix
    lastMedia = index								// set htm thumb widths and heights
    Param()									// initialise current media
    if (ix && title) {								// eg. after switch thumbs/listview
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


  function getSrt(scroll) {
    lastBlock = scroll
    const src = document.getElementById('dat' + index)?.getAttribute('data');
    if (editor.style.display === 'flex') editor.style.opacity = 1		// resume visible after Play()
    if (!src || editor.style.display === 'flex') return
    editor.style.display = 'flex'
    captions = captions ? captions : 2
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
    if (editingBlock && item == 'rate' && !cue) {
      editingBlock._rate = myPlayer.playbackRate = myVoice.playbackRate = val; editing = 1; return}
    if (type) {
      thumb.style[item] = val
      if (item == 'skinny') {skinny = val; thumb.parentElement.style.transform = 'scale('+val+',1)'}
      if (!playing) Param(); positionMedia(0.2); if (item == 'rate') rate = val}
    else if (item == 'rate') {rate = defRate = val; settings.defRate = String(defRate); localStorage.setItem(folder, JSON.stringify(settings))}}


  function updateContext() {							// innerHTML values
    if (!type || type == 'document') {myCue.innerHTML = myCap.innerHTML = ''; return}
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
    myNav.style.display = null
    start = defStart = myPlayer.currentTime
    let x = cue+'|goto|'+start.toFixed(1)
    if (cue) inca('Goto', x, index)						// add goto cue to media
    else {captions = 1; if (playing) {getSrt()} else Play()}}


  function sel(i) {								// highlight selected media in html
    if (!i || !Click || overTitle || (gesture && Click == 3)) return
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
    let target = cue + '|' + id + '|' + skinny + '|' + playing + '|' + decodeURIComponent(myPlayer.src) + '|' + myPlayer.currentTime.toFixed(2)
    let select = playing || selected || overMedia || 0
    inca('Ffmpeg', target, select, (myPlayer.currentTime === dur ? dur - 0.1 : myPlayer.currentTime).toFixed(2))}


  function formatTime(seconds) {
    let h = Math.floor(seconds / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return h ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`}


  function getWidth(text) {
    var span = document.createElement('span')
    span.innerText = text
    span.style.whiteSpace = 'nowrap'
    span.style.fontSize = '1.2em'
    document.body.appendChild(span)
    var width = span.offsetWidth
    document.body.removeChild(span)
    return width}


  function mouseBack() {
    overTitle = 0
    if (closeOsk()) return
    else if (playing) closePlayer()
    else if (thumb.style.pop > 1) closePic()
    else if (longClick) window.close()
    else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)			// else scroll to page top
    else {inca('Reload',2,0)}}							// or finally, reload page & clear selected


  function overThumb(id) {
    if (zoom == 1) thumb.src = ''						// release media from server
    if (Click) return								// faster for click & slide selecting
    index = id
    sheetUrl = ''
    Param(id)}


  function nextMedia() {							// myPlayer ended
    if (captions) return
    if (playlist.match('/inca/music/')) {
      if (Param(index += 1)) {Play(); syncPlay = 1} else closePlayer(); return}
    else if (!defPause && delay < 30 && type != 'audio' && !longClick) {getStart(); syncPlay = 1}	// replay media
    else {myPlayer.currentTime = dur + 2; syncPlay = 0; delay = 60}}		// stay at end


  async function closePlayer() {
    closeOsk()
    try {
      if (editing) {
        editing = 0
        let json = makeJSON().replaceAll('#', '𝌇')
        await inca('Edited', json, index)}}
    finally {
      try { closePic() } catch (_) {}
      const faces = document.getElementById('voice-faces')
      if (faces) faces.style.display = 'none'
      myPlayer.muted = myVoice.muted = true
      Click = playing = start = captions = thumbSheet = cue = overTitle = editorX = editorY = mediaX = 0
      mySeek.style.width = myVig.style.opacity = myPlayer.style.opacity = editor.style.opacity = 0
      myPanel.style.top = myView.style.top = ''
      myMask.style = myDur.innerHTML = myVoice.src = myPlayer.src = ''
      editingBlock = editor.style.display = myNav.style.display = null
      myVig.style.visibility = myPlayer.style.visibility = null
      scaleY = (innerHeight > innerWidth) ? 0.6 : 0.5
      setThumb()
      try { thumb.scrollIntoView({ block: 'nearest' }) } catch (_) {}}}


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

  function Flip() {xPos = 0; skinny *=- 1; thumb.style.skinny = skinny; Param(); setThumb(); positionMedia(0.4)}

  function Time(z) {if (z < 0) return '0:00'; let y = Math.floor(z%60); let x = ':'+y; if (y<10) {x = ':0'+y}; return Math.floor(z/60)+x}








  function openEditor(text) {
    projectMedia.defaultSrc = originalPlayerSrc = decodeURIComponent(type === 'image' ? thumb.poster : thumb.src)
    if (type === 'image' && text) captions = 1
    lastBlock = type === 'image' ? 1 : lastBlock
    leftVoice = rightVoice = centerVoice = ''
    editor.style.transition = 'opacity 1s'
    editor.style.height = 0
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
        b.text || '',
        b.fav || 0,
        b);
      lastVoice = b.voiceName || lastVoice
      block._voiceName = b.voiceName || ''
      block._volume = b.volume || 1
      block._rate = b.rate || 1
      block._delay = b.delay || 0
      if (b.media) block._media = { src: b.media };
      if (b.voice) block._voice = { src: b.voice };
      else lastVoice = block._voiceName = ''});
    if (projectMedia.defaultSrc) swapPlayerMedia(projectMedia.defaultSrc, 0)
    overMedia = 0
    if (!lastBlock) lastBlock = parsed?.lastSelectedId || 1
    let first = blocks[lastBlock - 1] || blocks[0];
    if (first.innerHTML == 'new caption') first.dataset.start = defStart
    activateBlock(first, userPlay)
    myPlayer.currentTime = first.dataset.start
    first.scrollIntoView({ block: 'center' })
    matchCountSpan.textContent = ''
    setTimeout(() => updateBlockAlignments(),10)
    projectMedia.ui = parsed.ui || {}
    if (parsed.ui) {
      const u = parsed.ui
      if (captions == 2) {
        editor.style.width = u.width || '500px'
        editor.style.height = u.height || '360px'
        projectMedia.uiHeight = editor.style.height
        if (u.editorX) { editorX = u.editorX; editorY = u.editorY }}
      if (u.mediaX) { mediaX = u.mediaX; mediaY = u.mediaY }
      if (u.scaleY > 0) scaleY = u.scaleY
      positionMedia(0)}
    setTimeout(() => {editing = 0; first.focus(); if (defPause) {syncPlay = 0}}, 600)}







const activateBlock = (block, play) => {
  const startDelay = Click ? 0 : block._delay * 1000 || 0
  block.style.setProperty('--progress', '0%')
  if (!blocks.length) blocks = [...document.querySelectorAll('.text-block')]
  if (overBlock && searchTerm) blocks.forEach(b => {
    b.style.color = '';									// remove search word highlights
    b.querySelectorAll('mark').forEach( m => { 
      while(m.firstChild) m.parentNode.insertBefore(m.firstChild,m); m.remove()})})
  mediaHeader.textContent = title.value || null
  lastVoice = editingBlock?._voiceName || lastVoice;
  const next = +(block.nextElementSibling?.dataset.start || 0)
  block._end = next > +block.dataset.start ? next : (dur || Infinity)
  const isSameBlock = editingBlock === block
  const media = getEffectiveMedia(block);
  const time = isSameBlock ? myPlayer.currentTime : parseFloat(block.dataset.start)
  if (!userPlay) myPlayer.currentTime = parseFloat(block.dataset.start)
  swapPlayerMedia(media?.src || originalPlayerSrc, time || 0)
  if (block._voice?.src) {
    if (!isSameBlock && decodeURIComponent(myVoice.src) != block._voice.src) myVoice.src = block._voice.src.replace(/#/g, '%23')
    myPlayer.muted = true; myVoice.muted = defMute
    block.classList.add('has-voice')}
  else {
    block.classList.remove('has-voice');
    myVoice.muted = true; myPlayer.muted = defMute}
  if (!isSameBlock) {
    if (editingBlock) editingBlock.classList.remove('editing', 'paused')
    block.classList.add('editing');
    editingBlock = block}
  myPlayer.volume = myVoice.volume = block._volume || 1
  if (userPlay && !overEditor) {if (!syncPlay) syncPlay = 0; setTimeout(() => syncPlay = play, startDelay)}
  else syncPlay = play
  if (captions == 1) {									// compact captions
    const rec = editingBlock.getBoundingClientRect()
    editor.style.height = rec.height + 4 + 'px'
    editor.style.resize = 'none'
    editor.style.pointerEvents = 'none'
    editor.style.background = 'transparent'
    block.style.background = 'transparent'
    viewport.style.overflowY = 'hidden' }
  else {										// caption editor mode
    viewport.style.overflowY = ''
    editor.style.height = projectMedia.uiHeight || '360px'
    block.style.background = ''
    editor.style.pointerEvents = ''
    editor.style.background = ''
    editor.style.resize = ''}
  block.dataset.hasMedia = (!!block._voice?.src || dur) ? "1" : "0"
  updateBlockAlignments()
  updateFaceHighlights()}






function ensureVoiceFaces() {
  if (document.getElementById('voice-faces')) return
  const container = document.createElement('div')
  container.id = 'voice-faces'
  editor.appendChild(container)
  const mk = (side) => {
    const wrap = document.createElement('div')
    wrap.className = 'voice-face-wrap'
    const img = document.createElement('img')
    img.className = 'voice-face'
    img.dataset.side = side
    img.alt = side + ' voice'
    img.draggable = false
    const nameEl = document.createElement('div')
    nameEl.className = 'voice-face-name'
    wrap.appendChild(img)
    wrap.appendChild(nameEl)
    container.appendChild(wrap)
    img.nameEl = nameEl
    return img
  }
  voiceFaceLeft   = mk('left')
  voiceFaceCenter = mk('center')
  voiceFaceRight  = mk('right')}


function updateBlockAlignments() {
  ensureVoiceFaces()
  const container = document.getElementById('voice-faces')
  if (!container) return
  if (!editor || editor.style.display === 'none' || !editor.offsetWidth || !captions) {
    container.style.display = 'none'
    return}
  const unique = []
  blocks.forEach(b => {
    const v = (b._voiceName || '').trim()
    if (v && !unique.includes(v)) unique.push(v)})
  if (!leftVoice   && unique[0]) leftVoice   = unique[0]
  if (!rightVoice  && unique[1]) rightVoice  = unique[1]
  if (!centerVoice && unique[2]) centerVoice = unique[2]
  unique.forEach(v => {
    if (v !== leftVoice && v !== centerVoice && v !== rightVoice) {
      if (!leftVoice)   leftVoice   = v
      else if (!rightVoice)  rightVoice  = v
      else if (!centerVoice) centerVoice = v}})
  if (leftVoice)  voiceFaceLeft.src  = `/inca/cache/voices/${encodeURIComponent(leftVoice)}.jpg`
  if (rightVoice) voiceFaceRight.src = `/inca/cache/voices/${encodeURIComponent(rightVoice)}.jpg`
  if (centerVoice) voiceFaceCenter.src = `/inca/cache/voices/${encodeURIComponent(centerVoice)}.jpg`
  container.style.display = (leftVoice || rightVoice || centerVoice) ? 'flex' : 'none'
  if (voiceFaceLeft?.nameEl)   voiceFaceLeft.nameEl.textContent   = leftVoice   || ''
  if (voiceFaceRight?.nameEl)  voiceFaceRight.nameEl.textContent  = rightVoice  || ''
  if (voiceFaceCenter?.nameEl) voiceFaceCenter.nameEl.textContent = centerVoice || ''
  voiceFaceLeft.parentElement.style.display   = leftVoice   ? '' : 'none'
  voiceFaceRight.parentElement.style.display  = rightVoice  ? '' : 'none'
  voiceFaceCenter.parentElement.style.display = centerVoice ? '' : 'none'}


function updateFaceHighlights() {
  if (!voiceFaceLeft) return
  const activeV = (editingBlock?._voiceName || '').trim()
  const isLeft   = activeV && activeV === leftVoice
  const isRight  = activeV && activeV === rightVoice
  const isCenter = activeV && activeV === centerVoice
  voiceFaceLeft.classList.toggle('active',   !!isLeft)
  voiceFaceRight.classList.toggle('active',  !!isRight)
  voiceFaceCenter.classList.toggle('active', !!isCenter)}


  function parseSrtTime(t) {
    const [h, m, s_ms] = t.split(':');
    const [s, ms] = s_ms.replace(',', '.').split('.');
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms || 0) / 1000}

  function parseSrtTimeShort(t) {
    const [m, s_ms] = t.split(':');
    const [s, ms] = s_ms.replace(',', '.').split('.');
    return parseInt(m) * 60 + parseInt(s) + (parseInt(ms || 0) / 1000)}

  function shortFormatTime(sec) {
    if (!sec) return '- : -- . -';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return `${m} : ${s.replace('.', ' . ')}`}

  function createBlock(num, startSec, text, fav, extra = {}) {
    const block = document.createElement('pre');
    block.className = 'text-block';
    block.dataset.num = num;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text || '\u200B'
    block.dataset.fav = fav || '0';
    if (extra.media) block._media = { src: extra.media };
    if (extra.voice) block._voice = { src: extra.voice, name: extra.voiceName || '' };
    block._volume = extra.volume || 1
    block._rate = extra.rate || 1
    block._delay = extra.delay || 0
    if (block._voice?.src) block.classList.add('has-voice');
    return block}

  function addBlock(num, startSec, text, fav, cues = {}) {
    const block = createBlock(num, startSec, text, fav, cues);
    viewport.appendChild(block);
    blocks.push(block);
    return block}

  function estimateSplitTime(originalSec, partIndex, totalParts, originalText) {
    if (partIndex === 0) return originalSec;
    const roughTotalDur = Math.max(2, Math.min(8, originalText.length / 18));
    return originalSec + (partIndex / totalParts) * roughTotalDur}


  function getEffectiveMedia(block = null) {
    if (block?._media?.src) return block._media;
    return projectMedia.defaultSrc ? { src: projectMedia.defaultSrc } : null;}


  function renumberBlocks() {
    blocks = Array.from(viewport.children)
    blocks.forEach((b, i) => b.dataset.num = i + 1)
    void viewport.offsetHeight}


  function selectVoice(name) {
    if (!name || !editingBlock) return
    editing = 1
    editingBlock._voiceName = myVoiceHeader.textContent = name
    myNav.style.display = 'none'
    updateBlockAlignments()
    updateFaceHighlights()
    Chatterbox()
    setTimeout(() => syncPlay = 0,20)}


  function swapPlayerMedia(src, time) {
    try { src = decodeURIComponent(src) } catch(e) {}
    const changed = decodeURIComponent(myPlayer.src) !== src ? 1 : 0
    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(src);
    if (isImage) {
      myPlayer.src = '';
      myPlayer.poster = src.split('/').map((s,i) => i < 3 ? s : encodeURIComponent(s)).join('/');
      myPlayer.load()} 
    else {
      myPlayer.poster = '';
      if (changed) {
        myPlayer.src = src.split('/').map((s,i) => i < 3 ? s : encodeURIComponent(s)).join('/');
        myPlayer.load()}}
    if (Click || changed || editingBlock?._voice?.src) myPlayer.currentTime = time
    if (Click || changed) { positionMedia(0); if (lastClick) positionMedia(0.4) }}


  function showStart() {
    let num = editingBlock?.dataset.num
    let current = Math.round(100 * myPlayer.currentTime) / 100
    let offset = Math.round(1000 * (current - editingBlock?.dataset.start))
    if (offset < -10)
      { myStart.style.color = 'red'; myStart.textContent = num + '\u2003\u2003' + shortFormatTime(current) }
    else if (offset > 10)
      { myStart.style.color = 'lightgreen'; myStart.textContent = num + '\u2003\u2003' + shortFormatTime(current) }
    else {myStart.style.color = null; myStart.textContent = current ? num + '\u2003\u2003' + shortFormatTime(current) : '- : -- . -'}}


  document.querySelector('#media-header').addEventListener('click', async (e) => {
    e.stopPropagation()
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
    none.textContent = 'None';
    none.style.marginLeft = '1.7em';

    none.onclick = (e) => {
      e.stopPropagation();
      mediaContent.style.display = 'none'
      let lastSrc = editingBlock?._voice?.src || null;
      if (editingBlock) {
        delete editingBlock._media
        delete editingBlock._voice
        delete editingBlock._voiceName
        activateBlock(editingBlock, 1)
        setTimeout(() => myPlayer.currentTime = editingBlock.dataset.start,20)
        if (lastSrc) inca('addHistory', lastSrc) 
       editing = 1}}

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
          myPlayer.load();
        });

        row.addEventListener('mouseleave', () => {
          if (mediaContent.style.display != 'none') {
            myPlayer.src = originalPlayerSrc.replace(/#/g, '%23')
            myPlayer.poster = ''
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
          swapPlayerMedia(mediaObj.src, item.startSec);
          activateBlock(editingBlock, 1)
          if (!editingBlock._voice?.src) myPlayer.currentTime = editingBlock.dataset.start
        });
      });
    } catch (_) {
      mediaContent.innerHTML = '<div style="color:#ffc0cb66;padding:8px;">No media</div>';
    }
  });


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
  captions = 2
  activateBlock(editingBlock, 0)
  scaleY = projectMedia.ui?.scaleY > 0 ? scaleY : scaleY * 0.5 
  const data = {
    defaultMedia: originalPlayerSrc
      ? { src: decodeURIComponent(originalPlayerSrc).replace(/\\/g, '/') }
      : null,
    ui: { width: editor.style.width, height: editor.style.height, mediaX, mediaY, editorX, editorY, scaleY },
    lastSelectedId: editingBlock ? parseInt(editingBlock.dataset.num) : 0,
    blocks: blocks.map(b => {
      const start = parseFloat(b.dataset.start);
      return {
        number: parseInt(b.dataset.num),
        startTime: isNaN(start) ? null : start.toFixed(1),
        fav: b.dataset.fav === '1' ? 1 : 0,
        text: b.innerText.trim(),
        media: b._media?.src ? b._media.src.replace(/\\/g, '/') : null,
        voice: b._voice?.src ? b._voice.src.replace(/\\/g, '/') : null,
        voiceName: b._voiceName,
        volume: b._volume,
        rate: b._rate,
        delay: b._delay
      };
    })
  };
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
      let startSec = i * 3.5; 
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
    const beforeText = preRange.toString().replace(/\r\n/g, '\n').replace(/\u200B/g, '')
    const fullText = block.innerText.replace(/\r\n/g, '\n').replace(/\u200B/g, '')
    const afterText = fullText.substring(beforeText.length)
    const isSecondEnter = beforeText.endsWith('\n')
    if (!isSecondEnter) {
      const node = document.createTextNode('\n\u200B')
      range.deleteContents()
      range.insertNode(node)
      range.setStart(node, 1)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      editing = 1
      return}
    const part1 = beforeText.replace(/\n+$/, '').replace(/\u200B/g, '')
    const part2 = afterText.replace(/^\n+/, '').replace(/\u200B/g, '')
    if (!part1.trim() && !part2.trim()) return
    const startSec = parseFloat(block.dataset.start) || 0
    const nextSibling = block.nextSibling
    const idx = blocks.indexOf(block)
    block.textContent = part1
    const newBlock = createBlock(
        null,
        startSec + 2,
        part2,
        '0',
        {})
    if (part2 === '') newBlock.innerHTML = ' '
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
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
    setTimeout(() => { newBlock.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 100)}


function Backspace(e) {
  e.preventDefault()
  syncPlay = 0
  if (captions) editing = 1
  if (overBlock && editingBlock.textContent.endsWith('\u200B')) document.execCommand('Delete')
  const sel = window.getSelection()
  let atStart = false
  if (sel.rangeCount && editingBlock) {
    const range = sel.getRangeAt(0)
    if (range.collapsed) {
      const preRange = document.createRange()
      preRange.selectNodeContents(editingBlock)
      preRange.setEnd(range.startContainer, range.startOffset)
      atStart = preRange.toString().replace(/\u200B/g, '') === ''}}
  if (captions && e.target.id !== 'caption-search-input' && atStart) {
    const prev = editingBlock?.previousElementSibling
    if (prev) {
      const prevText = prev.textContent.replace(/\u200B/g, '')
      const currText = editingBlock.textContent.replace(/\u200B/g, '')
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
  if (overBlock && atStart) {document.execCommand('forwardDelete'); return}
  document.execCommand('delete')}


  function moveBlock(e) {
      const s = e.key == 'ArrowUp' ? editingBlock.previousElementSibling : editingBlock.nextElementSibling
      if (!s) return
      if (e.key == 'ArrowUp') viewport.insertBefore(editingBlock, editingBlock.previousElementSibling)
      else viewport.insertBefore(editingBlock, editingBlock.nextElementSibling.nextElementSibling)
      const t = editingBlock.dataset.start; editingBlock.dataset.start = s.dataset.start; s.dataset.start = t
      renumberBlocks(); editingBlock.focus(); editing = 1
      setTimeout(() => {
        activateBlock(editingBlock, 0)
        editingBlock.scrollIntoView({ behavior: 'smooth', block: 'center' })},100)}


  function newClone() {
    let inp = document.createElement('input')
    inp.className = 'voice-input'
    inp.id = 'myVoiceInput'
    inp.value = editingBlock?._voiceName || ''
    inp.placeholder = 'new voice'
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
    newSearch()
    if (!searchTerm || searchTerm.length < 3) {
      const favs = blocks.filter(b => b.dataset.fav === '1')				// bookmark search
      if (!favs.length) return
      favIndex = (favIndex + (e.deltaY > 0 ? 1 : -1) + favs.length) % favs.length
      matchCountSpan.textContent = `${favIndex + 1} : ${favs.length}`
      favs[favIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
      return}
    const term = searchInput.value.trim().toLowerCase();
    matches = blocks.filter(b => b.innerHTML.toLowerCase().includes(term))
    if (!matches.length) return
    matchIndex = (matchIndex + (e.deltaY > 0 ? 1 : -1) + matches.length) % matches.length
    matchCountSpan.textContent = String(matchIndex + 1) + ' : ' + String(matches.length)
    matches[matchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })}


  function newSearch() {
    const term = searchInput.value.trim().toLowerCase()
    if (term) searchTerm = term
    if (term.length < 3) {matchIndex = 0; blocks.forEach(b => {if (b.querySelector('mark')) b.innerHTML = b.innerText}); return}
    matches = blocks.filter(b => b.innerText.toLowerCase().includes(term))
    matches.forEach(b => {
        const text = b.innerText
        const lowerText = text.toLowerCase()
        const idx = lowerText.indexOf(term)
        b.innerHTML = text.slice(0, idx) + '<mark>' + text.slice(idx, idx + term.length) + '</mark>' + text.slice(idx + term.length)})
    blocks.filter(b => !matches.includes(b)).forEach(b => {if (b.querySelector('mark')) b.innerHTML = b.innerText})
    matchCountSpan.textContent = matches.length > 0 ? `1 : ${matches.length}` : '0 : 0'
    if (matches.length) matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' })}


  function newVoice(e) {
    if (longClick) return
    const side = e.target.dataset.side
    const name = side === 'left' ? leftVoice : side === 'center' ? centerVoice : rightVoice
    if (!name || !editingBlock) return
    editingBlock._voiceName = name
    editing = 1
    updateBlockAlignments()
    updateFaceHighlights()
    Chatterbox()}


  function Chatterbox(id) {
    if (overBlock) editingBlock = overBlock
    const voiceName = editingBlock._voiceName || lastVoice || 'Tracy'
    let block = editingBlock
    myPlayer.currentTime = editingBlock.dataset.start
    let last = block?._voice?.src || projectMedia.defaultSrc
    let text = block.innerText.trim()
    let provider = 'chatterbox'
    if (id == 'myElevenLabs') provider = 'chatterbox'
    syncPlay = 0
    delay = 100
    block.style.outline = '1.8px dotted green'
    fetch(server + 'generate-voice', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName, text, provider, title: title?.defaultValue.trim() })})
          .then(async res => {if (!res.ok) throw 0; return res.json()})
          .then(data => data.path)
          .then(path => {
            block.style.outline = ''
            if (!block._voice) block._voice = {}
            myVoice.src = path.replace(/#/g, '%23')
            block._voice.src = path
            block._voiceName = voiceName
            block._rate = 1
            editing = 1
            activateBlock(block, 1)
            userPlay = 1
            inca('addHistory',last,0,path)})
          .catch(() => {block.style.outline = ''; alert('chatterbox not responding')})}


  function scrollActivate() {
    if (isScrolling || wheel || Click || captions == 1) return
    isScrolling = 1
    clearTimeout(timeout1)
    timeout1 = setTimeout(() => isScrolling = 0, 100)
    if (!captions) return
    const mid = viewport.getBoundingClientRect().top + 220
    let best = null
    for (const b of blocks) if (b.getBoundingClientRect().top + 10 <= mid) best = b; else break
    if (!best || best === editingBlock) {scrollY = viewport.scrollTop; return}
    if (lastBlock) {
      const locked = blocks.find(b => b.dataset.num == lastBlock)
      const scrollingDown = viewport.scrollTop > scrollY
      if (locked) {
        const lockedTop = locked.getBoundingClientRect().top + 10
        if ((scrollingDown && lockedTop > mid) || (!scrollingDown && lockedTop < mid)) { scrollY = viewport.scrollTop; return}}
    lastBlock = 0}
    if (Math.abs(viewport.scrollTop - scrollY) < 40) return
    scrollY = viewport.scrollTop
    Click = 1
    myPlayer.currentTime = best.dataset.start
    activateBlock(best, userPlay)
    Click = 0}


  function playerProgress() {
    if (isScrolling || !captions || !playing || myNav.style.display || mediaContent.style.display === 'flex') return
    const currentBlock = blocks.findLast(b => b.dataset.start <= myPlayer.currentTime)
    const nextBlock = currentBlock.nextElementSibling
    if (nextBlock) {
      const currentStart = currentBlock.dataset.start
      const nextStart = nextBlock?.dataset.start
      if (currentBlock !== editingBlock && myPlayer.currentTime < editingBlock.dataset.start && editingBlock.dataset.start < dur) {
        activateBlock(currentBlock, userPlay)
        currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
    if (myPlayer.currentTime > editingBlock._end) {
//      if (editingBlock._voice?.src && !myVoice.ended) return   			// let voice finish
if (editingBlock._voice?.src) return
      if (overEditor && !overMedia || (!userPlay && !overEditor && !overMedia)) { syncPlay = 0; return }
      else { activateBlock(currentBlock, userPlay); currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}}


  function nextCaption(dir, force) {
    syncPlay = 0
    if (ribbon.matches(':hover') || !userPlay) return				// media dropdown previews
    if (!captions || myNav.style.display) return
    if (overEditor && !force && !overMedia) return
    let next = dir < 0
      ? (editingBlock?.previousElementSibling || editingBlock)
      : (editingBlock?.nextElementSibling || editingBlock)
    activateBlock(next, userPlay)
    next.scrollIntoView({ behavior: 'smooth', block: 'center' })}






