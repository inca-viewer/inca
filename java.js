// synthetic media/stories/worlds
// captionmania paradise engineering


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
  let incaBusy = ''							// messaging to server
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
  let fade = 0								// hide myPic
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
  let trigger = 0.8							// trigger to show seekbar
  let listSize = 0
  let favIndex = 0
  let matchIndex = 0
  let searchTerm = ''
  let timestamps = []
  let currentPreviewItem = null;
  let blocks = []
  let lastBlock = 0
  let lastVoice = ''
  let lastText = ''
  let previewMode = 0
  let editingBlock = null
  let originalPlayerSrc = ''
  let projectMedia = { defaultSrc: null }
  let userPlay = 0
  let predictBuffer = '';
  let predictor = { words: {} }
  let scaleY = (innerHeight > innerWidth) ? 0.5 : 0.4			// myPlayer height (screen ratio)

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

  window.addEventListener('pageshow', (e) => {				// user browser navigation sync up
    if (e.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {inca('Reload',3,0)}})
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('keydown', keyDown)
  document.addEventListener('dragstart', () => gesture = 1)
  document.addEventListener('drop', (e) => {Click = 0; gesture = 0; if (overEditor) activateBlock(e.target.closest('.text-block'),0)})
  myPlayer.addEventListener('ended', nextMedia)
  myVoice.addEventListener('ended', nextCaption)
  myVoice.addEventListener('timeupdate', voiceProgress)
  myPlayer.addEventListener('timeupdate', playerProgress)
  window.addEventListener('beforeunload', (e) => {if (playing && editing) e.preventDefault()})
  myNav.addEventListener('wheel', wheelEvent)
  myNav.addEventListener('mouseleave', () => myNav.style.display = myDefault.style.display = myAlt.style.display = null)
  myStart.addEventListener('wheel', wheelEvent)
  myStart.addEventListener('mouseenter', () => {			// play short sample
    if (!Click && editingBlock) {
      myVoice.currentTime = 0 
      let current = myPlayer.currentTime; userPlay = 1; if (!editingBlock._voice?.src) myPlayer.muted = defMute
      setTimeout(() => {userPlay = 0; myPlayer.currentTime = current},1200)}})
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState=='visible' && folder=='Downloads' && !selected && !playing) inca('Reload',2,index)})
  myInca.addEventListener('mouseenter', () => {
    const isAlt = myAlt.style.display === 'block'			// toggle context menus
    myAlt.style.display = isAlt ? '' : 'block'
    myDefault.style.display = isAlt ? 'block' : 'none'})
  searchHeader.addEventListener('wheel', nextMatch)
  mediaContent.addEventListener('mouseleave', () => {mediaContent.style.display = 'none'})
  searchHeader.addEventListener('mouseleave', () => {searchInput.placeholder='🔍︎'})
  searchHeader.addEventListener('click', (e) => {
    searchTerm = searchInput.value = ''; blocks.forEach(b => {b.style.color = ''; b.textContent = b.textContent})})
  searchHeader.addEventListener('mouseenter', (e) => {
    let sel = window.getSelection().toString()
    if (sel) {searchTerm = searchInput.value = sel}
    else searchInput.placeholder='❤'})
  searchInput.addEventListener('input', newSearch)
  viewport.addEventListener('input', () => {
    if (editingBlock?.innerText.length < 3) editingBlock.dataset.start = myPlayer.currentTime
    editing = 1; userPlay = 0 }, { passive: true })


  function mouseDown(e) {
    longClick = gesture = 0
    if (e.key == 'F22') Click = lastClick = 3
    else if (e.button != 2) Click = lastClick = e.button + 1
    if (Click == 2) e.preventDefault()					// forward and back mouse buttons
    xRef = xPos; yRef = yPos
    clickMedia = overMedia
    clickTimer = setTimeout( function() { 
      longClick = Click; clickEvent(e)},280)}				// detect long click


  function mouseUp(e) {
    if (!Click) return							// stop re-entry also if new page load
    clearTimeout(clickTimer)						// longClick timer
    if (!longClick) clickEvent(e)					// process click event
    longClick = wheel = gesture = 0
    setTimeout(() => Click = 0,20)}


  function keyDown(e) {							// keyboard events
    if (e.key == 'Enter' && captions) {e.preventDefault(); e.stopImmediatePropagation(); splitIfNeeded(e)} // new block above not below issue
//    if (e.key == 'Enter' && captions) {e.preventDefault(); e.stopImmediatePropagation(); setTimeout(() => splitIfNeeded(e),10)}
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
    if (captions && lastClick == 1) overBlock = e.target.closest('.text-block') || 0
    let emotion = '[' + e.target.dataset.tag + '] '
    if (e.target.closest('#emotionSub')) document.execCommand('insertText', false, emotion)
    if (!playing && !listView && longClick && !gesture && overMedia && !overTitle) popThumb()	// pop thumb out of flow
    if (['myCut', 'myCopy', 'myPaste'].includes(id)) {
      lastId.focus()
      inca('CutCopyPaste',id); return}
    if (longClick == 1 && !gesture && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (['myIndex', 'myMp3', 'myMp4', 'myJoin', 'myJpg', 'mySrt'].includes(id)) {Ffmpeg(id); cue = 0; return}
    if (id == 'myClone') {newClone(); return}
    if (id == 'myLoudnorm') {inca('loudNorm',0,index); return}
    if (id == 'myInca') {inca('Settings'); return}
    if (id == 'myStart' && editingBlock) {editingBlock.dataset.start = myPlayer.currentTime; editing = 1; return}
    if (id == 'ribbon' && !longClick) {viewport.scrollTo({top:0,behavior:'smooth'}); return}
    if (id == 'myFavorite') {addFavorite(); return}
    if (id == 'myDelete') if (selected || type) {inca('Delete','',index); return}
    if (id == 'myMute' || id == 'myMute2') {defMute ^= 1; inca('Mute', defMute); myPlayer.muted = defMute; return}
    if (id == 'myPause' || id == 'myPause2') {defPause ^= 1; inca('Pause',defPause); userPlay ^= 1; return}
    if (id == 'myPitch' || id == 'myPitch2') {setPitch(pitch ^= 1); return}
    if (id == 'mySpeed' || id == 'mySpeed2') {updateCue('rate',1); return}
    if (id == 'myDelay') {editingBlock._delay = 0; return}
    if (id == 'myRate') {editingBlock._rate = 1; return}
    if (id == 'myVol') {editingBlock._volume = 1; return}
    if (id == 'mySkinny') {updateCue('skinny',1); return}
    if (id == 'myFlip') {Flip(); return}
    if (id == 'myElevenLabs' || id == 'myChatterbox') Chatterbox(id)
    if (id == 'myCancel') {
      if (!editing) {captions = 1; activateBlock(editingBlock,1); editingBlock.scrollIntoView({block: 'center' }); return}
      else if (myCancel.innerHTML != 'Sure ?') myCancel.innerHTML = 'Sure ?' 
      else { editing = 0; closePlayer() }}
    if (id == 'myBookmark') {
      editingBlock.dataset.fav = editingBlock.dataset.fav === '1' ? '0' : '1';
      editing = 1; overBlock = editingBlock}
    if (id == 'myExport') {
      let txt = blocks.map(b => b.innerText.trim()).filter(Boolean).join('\n\n').replaceAll('#', '𝌇')
      inca('Export', txt, index)}
    if (lastClick == 4) {mouseBack(); return}						// Back Click

    if (lastClick == 3) {
      if (gesture) return
      if (overEditor) {
        lastId = editingBlock
        myVoice.currentTime = 0
        if (overBlock) {
          activateBlock(overBlock, 0)
          if (overBlock.innerText.length > 1) myPlayer.currentTime = overBlock.dataset.start}
        if (longClick) Chatterbox(id)
        populateVoices()
        myNav.classList.add('editor-mode')} 
      else myNav.classList.remove('editor-mode')
      if (!longClick && !myNav.style.display) {
        myNav.style.display = 'block'; myNav.style.left = xPos-90+'px'; myNav.style.top = yPos-32+'px'; delay = 200; return}
      if (longClick || captions) return}

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
      myPlayer.style.opacity = overMedia = 0}

    if (lastClick == 1) {
      if (document.getElementById('osk')?.contains(document.elementFromPoint(xPos, yPos))) return
      predictBuffer = ''
      if (longClick && (overTitle || ['myInput', 'caption-search-input', 'inp', 'myVoiceInput'].includes(id))) osk()
      if (id.includes('search-input')) return
      if (captions && !overMedia) {
        const wasOsk = document.getElementById('osk')
        const block = overBlock ? overBlock : editingBlock
        if (id != 'myMask') {myVoice.currentTime = 0; myPlayer.currentTime = block.dataset.start}
        if (captions == 1) {captions = 2; activateBlock(block)}
        if (longClick && overBlock && !gesture) {osk(); activateBlock(block, 0); return}
        if (overBlock && overBlock !== editingBlock) {activateBlock(block, 1); return}
        else if (myPlayer.currentTime >= block._end) {
          if (overEditor && (!document.getElementById('osk') || id == 'viewport')) {activateBlock(block, 1); return}
          else {userPlay = 0; return}}
        else if (wasOsk && overBlock) {userPlay = 0; return}}
       if (overTitle && (longClick || overTitle == 2)) {
         if (overTitle != 2) title.value = title.defaultValue.trim()
         overTitle = 2; lastMedia = index; return}
      if (!playing && id != title.id) {
        if (!overTitle && longClick && myPanel.matches(':hover')) return 
        if (id == 'myCue' || (overMedia && thumb.src.slice(-3) == 'm3u')
        || (longClick && ((overMedia && type == 'document')
        || (favicon && favicon.matches(':hover')))) 
        || (overMedia && thumb.src.endsWith('.pdf'))) {Click = 0; inca('Notepad',id,index,favicon.matches(':hover')); return}}
      if (!longClick) {
        if (id == 'mySelect') {if (type) {sel(index)} else selectAll(); return}
        if (id == 'myCap') {capButton(); return}
        if (id == 'myCue' && playing) {cue = Math.round(100*myPlayer.currentTime)/100; return}
        if (!playing && !overMedia && !myNav.style.display) return}
      if (myNav.matches(':hover') || gesture) return}
    if (!getStart(id)) return
    if (lastClick == 1 && overBlock) return
    if (!playing && lastClick == 2) return
    if (playing && lastClick == 1) {
      if (type == 'document') return
      if (!longClick && id.includes('thumb')) {Param(); start = defStart}}  		// play popped thumb
    if (lastClick) Play()}


  function getStart(id) {
    if (lastClick == 3) {
      if (!playing && !overMedia) {myNav.style.display = null; index = lastMedia; start = lastSeek; return 1}
      if (myNav.style.display && type == 'video') {myNav.style.display = null; thumbSheet ^= 1; start = lastSeek; return 1}}
    if (lastClick == 2 || !dur) start = defStart
    if (!thumbSheet && playing && ym > trigger && overMedia || yw > 0.98) {
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
    else if (!longClick && lastClick == 1 && playing) {userPlay ^= 1; return}
    if (lastClick && lastClick != 2) thumbSheet = 0
    if (!gesture) return 1}								// return and continue


  function Play() {
    if (editing) return
    closePic()
    Param()
    positionMedia(0)
    thumb.pause()
    userPlay = 0
    editor.style.transition = null
    editor.style.opacity = 0
    if (!thumbSheet && type != 'image' && lastClick) myPlayer.style.opacity = 0		// fade in player
    if (!thumbSheet || type == 'image') myPlayer.poster = thumb.poster
    else if (!playing) lastSeek = defStart
    if (playlist.match('/inca/music/')) myPlayer.muted = 0
    else myPlayer.muted = defMute
    if (!thumbSheet) {
      if (favicon.matches(':hover')) getSrt(1)
      else if (overTitle && Click && blocks.length) previewMode ? getSrt(lastBlock) : getSrt(1)
      else if (captions || type == 'document') getSrt()}
    if (el = document.getElementById('title'+lastMedia)) el.style.color = null
    title.style.color = 'pink'
    if (type == 'document' || type == 'audio' || playlist.match('/inca/music/')) scaleY = 0.25
    if (playlist.match('/inca/music/') && !thumbSheet) {start = 0; myPlayer.muted = 0}
    if (type == 'audio' && !captions) myPlayer.style.borderBottom = '1px solid pink'
    else myPlayer.style.border = null
    if (pitch || myPlayer.context) {setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    if (captions && pitch || myVoice.context) {setupContext(myVoice); myVoice.jungle.setPitchOffset(semiToneTranspose(pitch))}
    playing = index
    fade = 0
    zoom = 1
    lastMedia = index
    myPic.style.top = '-999px'
    let syncStart = start								// because seekbar overwrites start
    if (!thumbSheet && dur && !cue && !captions) {myPlayer.currentTime = syncStart; userPlay = 1}
    setTimeout(async () => {
      if (!captions && !thumbSheet && defPause && !playlist.match('/inca/music/')) {myPlayer.currentTime = syncStart; userPlay = 0}
      if (!more && lastIndex < listSize && index > lastIndex - 9) inca('More', lastIndex)
      if (lastClick) positionMedia(0.4)
      myVig.style.visibility = myPlayer.style.visibility = 'visible'
      myPlayer.style.opacity = 0.99							// chrome transition bug
      myVig.style.opacity = 1
      if (!thumbSheet) await inca('History', myPlayer.currentTime.toFixed(1), lastMedia)},100)}


  function mouseMove(e) {
    let id = e.target.id								// id under cursor
    overBlock = e.target.closest('.text-block') || 0
    overEditor = !overMedia && captions && id != 'myMask' ? 1 : 0
    if (overBlock) lastId = overBlock
    if (innerHeight == outerHeight) {xPos = e.screenX; yPos = e.screenY} 		// fullscreen detection/offsets
    else {xPos = e.clientX; yPos = e.clientY}
    myAlert.style.left = mySelected.style.left = xPos + 30 +'px'
    myAlert.style.top = mySelected.style.top = yPos + 20 +'px'
    let x = Math.abs(xPos-xRef)								// gesture (Click + slide)
    let y = Math.abs(yPos-yRef)
    cursor = overMedia ? 12 : 4
    seekbar()
    if (x + y > 7 && !gesture && Click) {						// do once on gesture start
      gesture = 1
      if (!playing && overMedia && zoom > 1) popThumb()
      if (!playing && overMedia && !longClick && zoom == 1 && !myNav.style.display) sel(index)}
    if (!gesture || !Click) {gesture = 0; return}
    const wasOsk = document.getElementById('osk')
    if (gesture == 1 && y > x + 1) gesture = 2						// enable player move
    if (id == 'editor') editing = 1
    if (id.includes('thumb') && thumb.style.pop > 1) {					// move popped thumb
        thumb.style.left = parseInt(thumb.style.left || 0) + xPos - xRef + 'px'
        thumb.style.top =  parseInt(thumb.style.top || 0) + yPos - yRef + 'px'}
    else if (Click == 1 && (gesture == 3 || id.includes('osk'))){			// move osk
        gesture = 3
        wasOsk.style.left = parseInt(wasOsk.style.left || 0) + xPos - xRef + 'px'
        wasOsk.style.top =  parseInt(wasOsk.style.top || 0) + yPos - yRef + 'px'}
    else if (playing && (Click == 1 || gesture == 2 || delay == 1) && (overMedia || !overEditor || id == 'viewport')) {
      if (thumbSheet) {xyz[0] += xPos - xRef ; xyz[1] +=  yPos - yRef}
      else {mediaX += xPos - xRef; mediaY += yPos - yRef}				// move myPlayer
      positionMedia(0)}
    if (gesture) xRef = xPos; yRef = yPos}


  function wheelEvent(e) {
    if (e.target.closest('#voiceSub')) return						// scroll within submenu
    if (e.target.closest('#emotionSub')) return
    event.preventDefault()									// stop html scrolling
    let id = e.target.id 								// faster hover detection
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < delay) return
    let wheelUp = wheelDir * e.deltaY > 0
    let factor = 1 + (wheelUp ? wheel : -wheel) / 1500
    if (['myType', 'myAlpha', 'myDate', 'mySize', 'myDuration', 'mySearch'].includes(id)) {
      if (wheelUp) filt++
      else if (filt) filt--								// filter
      if ((id == 'myAlpha' || id == 'mySearch') && filt > 26) filt = 26
      if (id == 'myType' && filt > 4) filt = 4
      filter(id); delay = 90}
    else if (id == 'mySpeed') { 							// rate
      let val = editingBlock?._rate ?? rate
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
      thumb.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'
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
      thumb.style.opacity = 1
      Param(); thumb.load()								// show poster or sheet
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
      positionMedia(0); delay = 140}
    else if (Click && playing) { 							// zoom myPlayer
      let x = rect.left+rect.width/2-xPos
      let y = rect.top+rect.height / 2 - yPos
      let z = clickMedia && Click && (xm < 0.2 || xm > 0.8 || ym < 0.2 || ym > 0.8) ? wheel / 1300 : 0
      let array = thumbSheet ? [...xyz] : [mediaX, mediaY, scaleY]
      array[0] += x * z * (wheelUp ? 1 : -1)
      array[1] += y * z * (wheelUp ? 1 : -1)
      array[2] *= factor
      if (array[2] < 0.16) array[2] = 0.16
      thumbSheet ? (xyz = array) : ([mediaX, mediaY, scaleY] = array)
      if (Click == 3) {delay = 1} else delay = 20					// 1 - allows player xy move
      positionMedia()}
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
      else { myPlayer.currentTime += (wheelUp ? 0.02 : -0.02); delay = 60 }}		// nudge start time
    else if (!thumbSheet) {								// seek
      delay = 124
      let interval = 0.2
      if (dur > 200 && (overMedia && ym > trigger || yw > 0.9)) interval = 0.8	
      else if (!userPlay || (captions && id == 'myMask')) interval = 0.02
      interval = wheelUp ? interval : -interval
      if (playing) {
        myPlayer.currentTime += interval
        if (editingBlock?._voice?.src) {
          if (!wheelUp && !myVoice.currentTime) nextCaption(-1) 
          else myVoice.currentTime += interval
          if (myVoice.currentTime >= myVoice.duration) nextCaption()
          if (myPlayer.currentTime >= editingBlock?._end) playerProgress()
          voiceProgress()}
        if (type == 'document') nextCaption(e.deltaY)
        else if (dur) myPlayer.addEventListener('seeked', () => delay = 40, {once: true})}  // min. 40
      else if (zoom != 1) thumb.currentTime += interval					// popped thumb
      if (!playing) fade = 3								// hide seekbar in thumb popout
      else cursor = 12									// show seekbar & dur too
      thumb.pause()}
    wheel = 0}


  function timerEvent() { 								// every 94mS
    xw = xPos / innerWidth
    yw = yPos / innerHeight
    let top = 0; let el = thumb
    if (overTitle != 2) { overTitle = title.matches(':hover') ? 1 : 0; if (!overTitle) previewMode = 0 }
    if (overTitle == 1) title.classList.add('preview')
    if (playing) el = myPlayer
    else if (overTitle) el = title
    rect = el.getBoundingClientRect()
    if (!more && lastIndex < listSize && myContent.scrollTop > myContent.scrollHeight - 2 * innerHeight) inca('More', lastIndex)
    xm = (xPos - rect.left) / rect.width
    ym = (yPos - rect.top) / rect.height
    if (delay >= 30) delay -= 10							// wheel/timer blocking
    else myAlert.innerText = ''
    if (wheel >= 10) wheel -= 10
    if (fade) fade--									// seekbar holdback
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
      mySpeed.innerHTML = currentRate == 1 ? 'Speed' : `Speed ${currentRate.toFixed(2)}`
      mySkinny.innerHTML = skinny == 1 ? 'Skinny' : `Skinny ${skinny.toFixed(2)}`
      mySelect.innerHTML = 'Select '+index
      myPlayer.style.outline = title.style.outline
      myFlip.innerHTML = 'Flip'}
    else {
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
    mySpeed.style.color = currentRate == 1 ? null : 'red'
    myPitch.style.color = pitch ? 'red' : null
    myPause.style.color = defPause ? 'red' : null
    myMute.style.color = defMute ? 'red' : null
    myPause2.innerHTML = defPause ? "⏸" : ''
    myMute2.innerHTML = defMute ? "🔇︎" : ''
    myPitch2.innerHTML = pitch ? "♪" : ''
    mySpeed2.innerHTML = defRate !=1 ? "s" : ''
    if (!overMedia || overMedia && ym < trigger) fade = 3
    seekbar()
    if (playing || !overTitle) {title.classList.remove('preview'); title.value = title.defaultValue}
    if (playing) {
      myCancel.innerText = editing ? (myCancel.innerText !== 'Sure ?' ? '✕' : 'Sure ?') : '⌒'
      myCancel.style.color = myCancel.innerText == '⌒' ? 'pink' : 'red'
      userPlay ? myPlayer.play() : myPlayer.pause()
      userPlay && !!editingBlock?._voice?.src ? myVoice.play() : myVoice.pause()
      positionMedia(0)
      if (captions) showStart()
      myVol.innerHTML = editingBlock?._volume == 1 ? 'Volume' : `Volume ${editingBlock?._volume*100}`
      myDelay.innerHTML = editingBlock?._delay == 0 ? 'Delay' : `Delay ${editingBlock?._delay*1000}`
      myRate.innerHTML = editingBlock?._rate == 1 ? 'Speed' : `Speed ${editingBlock?._rate}`
      myVoice.playbackRate = editingBlock?._rate || 1
      myPlayer.playbackRate = editingBlock?._voice?.src ? rate : editingBlock?._rate || rate
      myMask.style.pointerEvents = 'auto'
      if (dur && !thumbSheet) lastSeek = myPlayer.currentTime
      if (playlist.match('/inca/music/') && scaleY < 0.27) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
      if (myPlayer.duration) dur = myPlayer.duration
      if (cues.innerHTML && !thumbSheet && type !='image' && dur) myCues(myPlayer.currentTime)}
    else {
      if (overTitle == 1 && favicon.innerText.includes('©') && !blocks.length) getPreview()
      if (blocks.length && overTitle && overTitle != 2) {
        let idx = Math.floor(xm * blocks.length)
        const block = blocks[Math.min(idx, blocks.length - 1)]
        previewMode = xm > 0.4 && !previewMode ? 1 : previewMode
        previewMode = xm < 0.4 && previewMode ? 2 : previewMode
        if (!previewMode) title.value = title.defaultValue
        else if (previewMode == 1) title.value = lastText
        else { title.value = block.innerText.trim(); lastBlock = block.dataset.num }}
      myInca.textContent = '...'
      myMask.style.pointerEvents = null
      if (zoom > 1 && overMedia) myMask.style.opacity = 0.9
      else myMask.style.opacity = 0
      if (!myNav.style.display && !listView && thumb.readyState === 4 && ym < trigger && overMedia && zoom == 1) thumb.play()}}


  function positionMedia(time) {							// position myPlayer in window
    myPanel.style.top = '50px'
    myView.style.top = '200px'
    let sheetSize = aspect > 1 ? 1.4 : 1
    if (!mediaX) {
      mediaX = screen.width / 2
      mediaY = screen.height / 2
      xyz = [mediaX, mediaY, sheetSize]}
    let x = mediaX
    let y = mediaY
    let z = scaleY
    y = captions == 2 ? y - 200 : y							// media moved up to fit captions
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
    if (editor.offsetWidth > 0) {
      editor.style.left = (edRect.left + edRect.width / 2 - editor.offsetWidth / 2) + 'px'
      editor.style.top  = (edRect.bottom + 8) + 'px'
      editor.style.transform = 'none'}}


  function seekbar() {									// seekbar bar beneath player
    navButtons()
    let cueX = rect.left
    let pos = playing ? myPlayer.currentTime : thumb.currentTime
    pos = Math.round(100*pos) / 100
    let cueW = rect.width * pos / dur
    if (cue && cue <= pos) {
      cueX = rect.left + rect.width * cue / dur
      cueW = rect.width * (pos - cue) / dur
      if (cue > pos - 3) cueW = rect.width * (dur - cue) / dur}
    else if (cue) {
      cueX = rect.left + rect.width * pos / dur
      cueW = rect.width * (cue - pos) / dur
      if (cue < pos + 3) {cueX = rect.left; cueW = rect.width * pos / dur}}
    if (rect.bottom > innerHeight) mySeek.style.top = innerHeight - 15 +'px'
    else mySeek.style.top = rect.top + rect.height - 6 + 'px'
    mySeek.style.left = cueX + 'px'
    if (cue || (cursor >= 5 && playing && dur) || (ym > trigger && overMedia && !fade && dur) && !title.matches(':hover')) {
      mySeek.style.background = cue ? 'red' : null
      if (!playing && xm<1) cueW = rect.width * xm
      cueW = Math.min(cueW, rect.width)
      mySeek.style.width = cueW + 'px'
      if (dur) mySeek.style.opacity = 1
      if (xm>0 && xm<1 && ym > trigger && ym < 1 && !thumbSheet && delay < 30) myPic.style.opacity = 1
      else myPic.style.opacity = 0
      myPic.style.top = rect.top + rect.height - myPic.offsetHeight + 'px'
      if (rect.width > 240) myPic.style.left = xPos - skinny * myPic.offsetWidth / 2 + 'px'
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
      let filename = thumb.src.match(/\/([^\/]+?)(?:\.[^.]*?)?$/)[1]
      let path = thumb.poster.replace(/\/posters\//, '/thumbs/').replace(/\/[^\/]*$/, '')
      sheetUrl = path + '/' + filename + '.jpg'
      if (settings.view > 30) thumb.poster = sheetUrl					// show sheets instead of posters
      else thumb.poster = thumb.poster.replace(/\/thumbs\//, '/posters/')
      if (thumbSheet) {myPlayer.poster = sheetUrl; myPlayer.load()}
      else myPlayer.poster = null
      if (myPlayer.src != thumb.src) myPlayer.src = thumb.src
      myPic.style.backgroundImage = 'url(\"'+sheetUrl+'\")'}				// use 6x6 thumbsheet as poster
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
    thumb.style.transform = 'scale('+skinny*zoom+','+zoom+')'
    if (listView) {thumb.style.translate = '180px -' + (thumb.offsetHeight - 7) + 'px'}
    if (thumb.offsetWidth > 160) {myPic.style.width = '160px'; myPic.style.height = 160 / aspect +'px'}    
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


  function inca(command,value,select,address) {
    more = 4
    if (incaBusy) return
    incaBusy = '1'
    try {
        let messages = ''
        for (i = 1; el = document.getElementById('thumb'+i); i++) {
          if ((el.style.rate || el.style.skinny) && !el.style.posted) {
            messages += '#editCues#'+el.style.rate+','+el.style.skinny+','+'#'+i+'#';
            el.style.posted = 1}}
        if (select) {select += ','} else select = ''
        if (selected) select = selected
        value = typeof value === 'string' ? value.replaceAll('#', '𝌇') : value ?? ''
        if (!address) address = ''
        if (command == 'Delete' || command == 'Rename' || value.toString().includes('|myMp4') || (select && command == 'Path')) {
          selected = ''
          for (x of select.split(',')) if (el = document.getElementById('thumb'+x)) el.remove()}
        messages += '#'+command+'#'+value+'#'+select+'#'+address
        return fetch('http://localhost:3000/generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
          .then(response => {if (response.status === 204) {return null} return response.text()})
          .then(data => {
            if (data) {
              const type = data.substring(0, data.indexOf('|'))
              const content = data.substring(data.indexOf('|') + 1)
              if (type == 'html') {
                myView.insertAdjacentHTML('beforeend', content)
                while (Param(lastIndex)) lastIndex++}
              else if (type == 'address') {
                if (lastClick === 2) window.open(content, '_blank')
                else window.location.href = content}
              return content}
            return null})
          .catch(err => { return null })
          .finally(() => { incaBusy = '' })}
        finally {}}


  function Param(i) {								// get media parameters
    i ||= index
    myPlayer.poster = myPlayer.src = ''
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
    if (thumb.src != vid.src) thumb.src = vid.src
    dur = Number(params[2]) || thumb.duration || 0				// duration
    size = Number(params[3])							// file size
    skinny = 1
    rate = dur ? defRate : 1
    if (cues && cues.innerHTML) myCues(0)					// get 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x				// custom css holds edits
    x = Number(thumb.style.skinny); if (x) skinny = x
    zoom = thumb.style.pop || 1
    setThumb()   								// src, thumbSheet
    return 1}


  function globals(fo, wd, mu, pa, so, fi, lv, se, pl, ix, ls) {		// import globals from inca.exe
    folder = fo; filt = fi; wheelDir = wd; defPause = pa; listView = lv; selected = se; playlist = pl; listSize = ls
    defMute = (mu == 'yes') ? 1 : 0
    settings = JSON.parse(localStorage.getItem(folder) || '{}')
    settings.pageWidth = (isNaN(settings.pageWidth) || settings.pageWidth > innerWidth) ? '700' : settings.pageWidth
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
    for (lastIndex = 1; Param(lastIndex); lastIndex++) {}			// process null cues (eg. skinny, start, rate)		
    if (!ix) index = 1
    else index = ix
    lastMedia = index								// set htm thumb widths and heights
    Param()									// initialise current media
    if (ix && title) {								// eg. after switch thumbs/listview
      title.style.opacity = 1							// highlight thumb
      title.style.color = 'pink'
      title.scrollIntoView({ block: 'center' })}}


  function myCues(time) { 							// media scrolls, speed, skinny, pauses etc.
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k = 0; k<x.length; k++) {						// process each line entry
      let el = x[k].split('|')							// time[0] cue[1] value[2] period[3]
      if (el[1] && 1*el[0] > time-0.1 && 1*el[0] < time+0.1) {
        if (el[1] == 'next') {lastClick = 2; clickEvent(0)}
        else if (el[1] == 'goto' && userPlay) {myPlayer.currentTime = start = 1*el[2]}
        else if (el[1] == 'rate') rate = 1*el[2] || defRate
        else if (el[1] == 'skinny') {skinny = 1*el[2] || 1; if(time) positionMedia(2)}
        else if (el[1] == 'pause') {userPlay = 0; if (el[2]) setTimeout(function(){userPlay = 1},1000*el[2])}}}}


  function getSrt(scroll) {
    lastBlock = scroll
    const src = document.getElementById('dat' + index)?.getAttribute('data');
    if (!src || editor.style.display === 'flex') return
    editor.style.display = 'flex'
    captions = captions ? captions : 2
      fetch(src)
        .then(response => {return response.text()})
        .then(data => {openEditor(data)})
      .catch(() => {openEditor('')})}						// new caption


  function getPreview() { 							// captions in title el
    const src = document.getElementById('dat' + index)?.getAttribute('data');
    if (src.length > 25) {							// not just http://localhost:3000/
      fetch(src)
        .then(response => {return response.text()})
        .then(data => {
          blocks = []
          const parsed = parseInputText(data)
          if (parsed?.blocks?.length) {
            parsed.blocks.forEach(b => {addBlock(b.number || (blocks.length + 1), b.startTime || 0, b.text || '')})
            lastBlock = parseInputText(data)?.lastSelectedId || 1
            lastText = blocks[lastBlock - 1].innerText}})}}


  function updateCue(item, val) {						// rate, skinny, cues 
    val = Math.round(1000 * val) / 1000
    if (editingBlock && item == 'rate') {
      editingBlock._rate = myPlayer.playbackRate = myVoice.playbackRate = val; editing = 1; return}
    thumb.style[item] = val
    thumb.style.posted = 0
    if (item == 'skinny') {skinny = val; thumb.style.transform = 'scale('+val+',1)'}
    if (type) {if (!playing) Param(); positionMedia(0.2); if (item == 'rate') rate = val}
    else if (item == 'rate') {rate = defRate = val; settings.defRate = String(defRate); localStorage.setItem(folder, JSON.stringify(settings))}}


  function navButtons() {							// innerHTML values
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
    if (cue && thumb.style.skinny) myCap.innerHTML = 'Cue Skinny ' + skinny
    else if (cue && thumb.style.rate) myCap.innerHTML = 'Cue Speed ' + rate
    else if (cue && end != dur) myCap.innerHTML = 'GoTo ' + formatTime(end)
    if (cue) myDur.innerHTML = formatTime(time)+' - '+formatTime(end)
    else if (dur && playing) myDur.innerHTML = formatTime(myPlayer.currentTime)+' - '+formatTime(dur)
    else if (dur) myDur.innerHTML = formatTime(dur)
    else myDur.innerHTML = ''}


  function capButton() {							// context menu Caption button
    start = myPlayer.currentTime
    let x = cue+'|goto|'+start.toFixed(1)
    if (thumb.style.skinny) x = cue+'|skinny|'+thumb.style.skinny+'\n'+lastSeek.toFixed(1)+'|skinny|1'
    if (thumb.style.rate) x = cue+'|rate|'+thumb.style.rate+'\n'+lastSeek.toFixed(1)+'|rate|1'
    thumb.style.skinny = thumb.style.rate = 0
    if (cue) inca('addCue', x, index)						// add cues to media
    else {getSrt(); Play()}}


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
    inca('Favorite', start.toFixed(1), index)
    favicon.innerHTML = '&#10084'}						// heart symbol on htm thumb


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
    else if (overTitle > 1) overTitle = 0
    else if (thumb.style.pop > 1) closePic()
    else if (longClick) window.close()
    else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)			// else scroll to page top
    else {inca('Reload',2,0)}}							// or finally, reload page & clear selected


  function overThumb(id) {
    if (zoom == 1) thumb.src = ''						// release media from server
    if (Click) return								// faster for click & slide selecting
    index = id
    Param(id)
    blocks = []									// for preview
    previewMode = 0
    thumb.style.opacity = 1
    if (settings.view <= 30 && zoom == 1 && !title.matches(':hover')) {
      thumb.load(); thumb.playbackRate = 0.7; thumb.currentTime = start = defStart + 0.04}}


  function nextMedia() {							// myPlayer ended
    if (playlist.match('/inca/music/')) {
      if (Param(index += 1)) {Play(); userPlay = 1} else closePlayer(); return}
    else if (!defPause && delay < 30 && type != 'audio' && !longClick) {getStart(); userPlay = 1}	// replay media
    else {myPlayer.currentTime = dur+2; userPlay = 0; delay = 60}}	// stay at end


  function closePlayer() {
    closeOsk()
    if (editing) {
      incaBusy = ''								// must not fail
      let json = makeJSON().replaceAll('#', '𝌇')				// because # is used as delimiter
      inca('Edited', json, index)}						// save edited text 
    else inca('Reload', 0, index)
    closePic()
    myPlayer.muted = myVoice.muted = true
    Click = playing = start = captions = thumbSheet = cue = editing = overTitle = 0
    mySeek.style.width = myVig.style.opacity = myPlayer.style.opacity = editor.style.opacity = 0
    editingBlock = editor.style.display = myNav.style.display = null
    myVig.style.visibility = myPlayer.style.visibility = null
    myMask.style = myDur.innerHTML = myVoice.src = myPlayer.src = ''
    thumb.scrollIntoView({ block: 'nearest' })}


  function closePic() {thumb.style.pop = 1; myPic.style = thumb.style = ''; Param()}
  function Flip() {xPos = 0; skinny *=- 1; thumb.style.skinny = skinny; Param(); positionMedia(0.4)}
  function Time(z) {if (z < 0) return '0:00'; let y = Math.floor(z%60); let x = ':'+y; if (y<10) {x = ':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i = 1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function popThumb() {
    if (type == 'document' || favicon.matches(':hover')) return
    thumb.style.zIndex = 4900 + Zindex++
    if (zoom > 1) return
    zoom = 1.2
    thumb.style.pop = zoom
    thumb.style.position = 'fixed'
    thumb.style.left = xPos - thumb.offsetWidth * xm +'px'
    thumb.style.top = yPos - thumb.offsetHeight * ym +'px'
    thumb.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'}






  function openEditor(text) {
    originalPlayerSrc = decodeURIComponent(type === 'video' ? myPlayer.src : thumb.src)
    captions = type === 'image' && text ? 1 : 2;
    lastBlock = type === 'image' ? 1 : lastBlock;
    editor.style.transition = 'opacity 1s'
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
      if (b.media) block._media = { src: b.media };
      if (b.voice) block._voice = { src: b.voice };
        lastVoice = b.voiceName || lastVoice
        block._voiceName = b.voiceName || ''
        block._volume = b.volume || 1
        block._rate = b.rate || 1
        block._delay = b.delay || 0});
    projectMedia.defaultSrc = originalPlayerSrc || null;
    if (projectMedia.defaultSrc) swapPlayerMedia(projectMedia.defaultSrc, 0)
    let first = blocks[0];
    const lastNum = lastBlock > 0 ? lastBlock : (parsed.lastSelectedId || 0)
    if (!blocks.length) first = addBlock(1, start || 0, ' ')
    else if (lastNum > 0) first = blocks.find(b => Number(b.dataset.num) === Number(lastNum)) || blocks[0]
    if (longClick != 3) setTimeout(() => {
      overMedia = 0
      activateBlock(first, !defPause)
      first.scrollIntoView({ block: 'center' })}, 100)
    myPlayer.currentTime = first.dataset.start
    if (!blocks.length) addBlock(1, myPlayer.currentTime, 'new caption')
    matchCountSpan.textContent = ''
    if (parsed.ui) {editor.style.width = parsed.ui.width || ''; editor.style.height = parsed.ui.height || ''}
    setTimeout(() => {editing = 0; first.focus(); if (defPause) {userPlay = 0}}, 600)}







const activateBlock = (block, play) => {
  if (!blocks.length) blocks = [...document.querySelectorAll('.text-block')]
  if (overBlock) blocks.forEach(b => {
    b.style.color = '';									// remove search word highlights
    b.querySelectorAll('mark').forEach( m => { 
      while(m.firstChild) m.parentNode.insertBefore(m.firstChild,m); m.remove()})})
  mediaHeader.textContent = title.value || null
  lastVoice = editingBlock?._voiceName || lastVoice;
  block.style.setProperty('--progress', '0%')
  block.style.transition = '0.4s'
  block._end = block.nextElementSibling?.dataset.start
  const isSameBlock = editingBlock === block
  const media = getEffectiveMedia(block);
  const time = isSameBlock ? myPlayer.currentTime : parseFloat(block.dataset.start)
  swapPlayerMedia(media?.src || originalPlayerSrc, time || 0)
  if (block._voice?.src) {
    if (!isSameBlock && decodeURIComponent(myVoice.src) != block._voice.src) myVoice.src = block._voice.src
    myPlayer.muted = true; myVoice.muted = defMute
    block.classList.add('has-voice')}
  else {
    block.classList.remove('has-voice');
    myVoice.muted = true; myPlayer.muted = defMute}
  if (!isSameBlock) {
    document.querySelectorAll('.text-block.editing').forEach(b => b.classList.remove('editing'));
    block.classList.add('editing');
    editingBlock = block;
    timestamps = blocks.map(b => ({
      sec: parseFloat(b.dataset.start) || 0,
      top: b.offsetTop,
      block: b}))}
  myPlayer.volume = myVoice.volume = block._volume || 1
  userPlay = play
  if (captions == 1) {									// compact captions
    const rec = editingBlock.getBoundingClientRect()
    editor.style.height = rec.height + 'px'
    editor.style.resize = 'none'
    editor.style.pointerEvents = 'none'
    editor.style.background = 'transparent'
    block.style.background = 'transparent'
    viewport.style.overflowY = 'hidden' }
  else {										// caption editor mode
    viewport.style.overflowY = ''
    editor.style.height = '360px'
    block.style.background = ''
    editor.style.pointerEvents = ''
    editor.style.background = ''
    editor.style.resize = ''}
  block.dataset.hasMedia = (block._voice?.src || myPlayer.src.includes('mp4')) ? "1" : "0"}


 


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

  function shortFormatTime(sec) {
    if (!sec) return '- : -- . -';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return `${m} : ${s.replace('.', ' . ')}`;
  }

  function createBlock(num, startSec, text, fav, extra = {}) {
    const block = document.createElement('pre');
    block.className = 'text-block';
    block.dataset.num = num;
    block.dataset.start = startSec;
    block.contentEditable = true;
    block.textContent = text;
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
    return block;
  }

  function estimateSplitTime(originalSec, partIndex, totalParts, originalText) {
    if (partIndex === 0) return originalSec;
    const roughTotalDur = Math.max(2, Math.min(8, originalText.length / 18));
    return originalSec + (partIndex / totalParts) * roughTotalDur;
  }


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
    if (longClick) {
      blocks.forEach(b => {if ((b._voiceName || 'None') == myVoiceHeader.textContent) b._voiceName = name})
      myAlert.innerText = name + ' > ' + myVoiceHeader.textContent
      delay = 212}
    editingBlock._voiceName = myVoiceHeader.textContent = name
    myNav.style.display = 'none'}


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
    if (Click || changed) {positionMedia(0); myPlayer.style.opacity = 0; positionMedia(2); myPlayer.style.opacity = 1}}


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
        const url = 'http://localhost:3000/' + path.replace(/\\/g, '/').split('/').map(s => encodeURIComponent(s)).join('/');
        return { url, startSec, name, short };
      }).filter(i => i.url && !i.name.endsWith('.txt') && !i.name.endsWith('.m3u'));
      items.reverse();
      mediaContent.innerHTML = '';

    const none = document.createElement('div');
    none.textContent = 'None';
    none.style.marginLeft = '1.7em';

  none.onclick = () => {
    let lastSrc = editingBlock?._voice?.src || null;
    if (editingBlock) {
        delete editingBlock._media;
        if (editingBlock._voice?.src) delete editingBlock._voice.src
    } else projectMedia.defaultSrc = null
    swapPlayerMedia(originalPlayerSrc, myPlayer.currentTime);
    editing = 1;
    setTimeout(() => {
        mediaContent.style.display = 'none';
        const currentBlock = editingBlock;
        myPlayer.currentTime = currentBlock.dataset.start;
        activateBlock(currentBlock, 1);
        if (lastSrc) inca('addHistory', lastSrc)}, 20)}

    mediaContent.appendChild(none);

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
            userPlay = 1;
          }
          myVoice.muted = true
          myPlayer.load();
        });

        row.addEventListener('mouseleave', () => {
          if (currentPreviewItem === row) {
            myPlayer.src = originalPlayerSrc;
            myPlayer.poster = '';
            myPlayer.load();
            userPlay = 0
            currentPreviewItem = null;
          }
        });

        label.addEventListener('click', () => {
          setTimeout(() => {mediaContent.style.display = 'none'}, 10)
          const mediaObj = { src: item.url, name: item.short };
          if (editingBlock) {
            if (row.dataset.isVoiceAsset === 'true') {
            if (!editingBlock._voice) editingBlock._voice = {};
            editingBlock._voice.src = item.url;
            editingBlock._voiceName = editingBlock._voiceName || lastVoice || '';
              myVoice.src = item.url}
            else {
              editingBlock._media = mediaObj;
              editingBlock.dataset.start = item.startSec
              }
            editing = 1;
          } else projectMedia.defaultSrc = mediaObj.src
          swapPlayerMedia(mediaObj.src, item.startSec);
          mediaContent.style.display = 'none'
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
  const current = editingBlock?._voiceName || '';
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
    if (name === current) { row.style.color = 'pink' }
    row.onmousedown = () => {Timer = setTimeout(() => {longClick = 1; selectVoice(name)},300)};
    row.onmouseup = () => {clearTimeout(Timer); if (!longClick) selectVoice(name)};
    voiceSub.appendChild(row);
  });
  addGap();
  inca('getVoices', 0, index)?.then(result => {
    if (!result) return;
    result.split('|').filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).forEach(name => {
      const row = document.createElement('div');
      row.textContent = name;
      if (name === current) { row.style.color = 'pink' }
      row.onmousedown = () => {Timer = setTimeout(() => {longClick = 1; selectVoice(name)},300)};
      row.onmouseup = () => {clearTimeout(Timer); if (!longClick) selectVoice(name)};
      voiceSub.appendChild(row);
      });
    })
  }


function makeJSON() {
  const data = {
    defaultMedia: projectMedia.defaultSrc ? {
      src: projectMedia.defaultSrc.replace(/\\/g, '/')
    } : null,    ui: {
      width: editor.style.width,
      height: editor.style.height
    },
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
  return JSON.stringify(data, null, 2);
}



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
    return { blocks: blocksOut };
  }


  function parseSrtTimeFlexible(t) {
    t = t.replace(',', '.').trim();
    const parts = t.split(':').map(p => parseFloat(p) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(t) || 0;
  }


function splitIfNeeded(e) {
    if (!editingBlock) return;
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
        const newNode = document.createTextNode('\n')
        range.deleteContents()
        range.insertNode(newNode)
        range.setStartAfter(newNode)
        range.collapse(true)
        if (afterText.trim() === '') {
            const zwspNode = document.createTextNode('\u200B')
            range.insertNode(zwspNode)
            range.setStartAfter(zwspNode)
            range.collapse(true)}
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
        startSec + 0.5,
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
  userPlay = 0
  if (captions) editing = 1
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
if (atStart) {document.execCommand('forwardDelete'); return}
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


  function voiceProgress () {								// voice progress bar
    if (editingBlock && editingBlock._voice?.src) {
      progress = (myVoice.currentTime / myVoice.duration || 0) * 100
      editingBlock.style.setProperty('--progress', progress + '%')}}


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
      inp.remove() 
      let name = inp.value.trim() || 'clone'
      if (name = name.charAt(0).toUpperCase() + name.slice(1)) {
        if (editingBlock) {
          editingBlock._voiceName = name
          activateBlock(editingBlock, 0)}
        inca('newClone', myPlayer.currentTime.toFixed(1), index, name)}}}


  function nextMatch(e) {
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < delay) return
    delay = 200; wheel = 0;
    if (!searchHeader.matches(':hover')) {if (mediaContent.style.display == 'none') nextCaption(e.deltaY); return}
    userPlay = 0
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


  function Chatterbox(id) {
    if (overBlock) editingBlock = overBlock
    const voiceName = editingBlock._voiceName || lastVoice || 'Tracy'
    if (!voiceName) return
    let block = editingBlock
    myPlayer.currentTime = editingBlock.dataset.start
    let last = block?._voice?.src || projectMedia.defaultSrc
    let text = block.innerText.trim()
    let provider = 'chatterbox'
    if (id == 'myElevenLabs') provider = 'chatterbox'
    userPlay = 0
    delay = 100; myAlert.innerText = voiceName + ' ...'
    fetch("http://localhost:3000/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName, text, provider, title: title?.defaultValue.trim() })})
          .then(async res => {if (!res.ok) alert('chatterbox not responding'); return res.json()})
          .then(data => data.path)
          .then(path => {
            if (!block._voice) block._voice = {}
            block._voice.src = myVoice.src = path
            block._voiceName = voiceName
            block._rate = 1
            editing = 1
            activateBlock(block, 1)
            if (voiceName) inca('addHistory',last,0,path)})}


function playerProgress() {
  if (!captions || !playing || !!editingBlock?._voice?.src || myNav.style.display || ribbon.matches(':hover')) return
  const currentBlock = blocks.findLast(b => b.dataset.start <= myPlayer.currentTime)
  const nextBlock = currentBlock.nextElementSibling
  if (nextBlock) {
    const currentStart = currentBlock.dataset.start
    const nextStart = nextBlock?.dataset.start
    if (currentBlock !== editingBlock && myPlayer.currentTime < editingBlock.dataset.start) {
      activateBlock(currentBlock, userPlay)
      currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
    progress = ((myPlayer.currentTime - currentStart) / (nextStart - currentStart)) * 100
    progress = Math.max(0, Math.min(100, progress))
    currentBlock.style.setProperty('--progress', progress + '%')
    if (myNav.style.display) return}							//   || !userPlay
  if (!nextBlock || myPlayer.currentTime > editingBlock._end) {
    if (overEditor || overBlock === editingBlock) { progress = 100; userPlay = 0; timerEvent() }
    else {activateBlock(currentBlock, userPlay); currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' })}}}


function nextCaption(dir) {
  if (ribbon.matches(':hover')) return							// new media preview
  if (overEditor) userPlay = 0
  if (!captions || myNav.style.display || overEditor) return
  let next = dir < 0 
    ? (editingBlock?.previousElementSibling || blocks[0])
    : (editingBlock?.nextElementSibling || blocks[0])
  activateBlock(next, userPlay)
  if (dir < 0 && next._voice?.src) myVoice.currentTime = 1
  next.scrollIntoView({ behavior: 'smooth', block: 'center' })}



