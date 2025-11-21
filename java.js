// dont add caption versions
// have an x if media is edited and to wuit like before


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
  let renamebox = ''							// media rename input field
  let selected = ''							// list of selected media in page
  let overMedia = 0							// over thumb or myPlayer
  let overText = 0							// text input fields, allow cut paste
  let editing = 0							// editing text active
  let messages = ''							// message digest to inca.exe
  let Zindex = 1							// element zIndex
  let rect								// element dimensions
  let size = 0								// file size (from inca)
  let dur = 0								// duration (from inca)
  let rate = 1								// myPlayer speed
  let skinny = 1							// media width
  let scaleY								// myPlayer height (screen ratio)
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
  let block = 0								// block timer events
  let aspect = 1							// media width to height ratio
  let mediaX = 0							// centre of myPlayer
  let mediaY = 0
  let xyz = []								// thumbSheet x,y scaleY
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed
  let defMute = 0							// default mute
  let defPause = 0							// default pause state
  let observer								// see if myPlayer is visible
  let pitch = 0								// default pitch
  let list = 0								// computed list size (last index +1)
  let end = 0
  let sheet = ''
  let lastId = ''
  let overEditor = false

  let Sarah = "mJVDL3Jf4JW01l7hCyjI"					// Sarah voice id
  let text = "hi, it's Sarah here."


  let entry = document.createElement('div')				// dummy thumb container
  let thumb = document.createElement('div')				// . thumb element
  let title = document.createElement('div')				// . title element
  let favicon = document.createElement('div')				// favorite or cc icon
  let intervalTimer = setInterval(timerEvent,94)			// background tasks every 94mS

  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('keydown', keyDown)
  myPlayer.addEventListener('ended', mediaEnded)
  window.addEventListener('beforeunload', (e) => {if (playing && editing) e.preventDefault()})
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState=='visible' && folder=='Downloads' && !selected && !playing) inca('Reload',index)})
  if (innerHeight>innerWidth) {scaleY=0.64} else scaleY=0.5		// screen is portrait


  function mouseDown(e) {
    longClick = gesture = 0
    if (e.key == 'Pause' && e.shiftKey) Click = lastClick = 3
    else if (e.button != 2) Click = lastClick = e.button + 1
    if (Click == 2) e.preventDefault()					// forward and back mouse buttons
    xRef = xPos; yRef = yPos
    clickTimer = setTimeout(function() { 
      longClick = Click; clickEvent(e)},280)}				// detect long click


  function mouseUp(e) {
    if (!Click) return							// stop re-entry also if new page load
    if (!playing && !myInput.matches(':hover'))
      myInput.value = window.getSelection().toString() || myInput.value	// paste last search into myInput 
    clearTimeout(clickTimer)						// longClick timer
    if (!longClick) clickEvent(e)					// process click event
    Click = longClick = wheel = gesture = 0}


  function keyDown(e) {							// keyboard events
    if (e.key == 'Enter' && !playing) {
      if (renamebox) inca('Rename', renamebox, lastMedia)		// rename media
      else inca('SearchBox','','',myInput.value)}			// search for media
    else if (e.key == 'Pause' && e.shiftKey) mouseDown(e)		// R click down
    else if (e.key == 'Pause' && e.altKey) mouseUp(e)			// R click up
    else if (e.key == 'Pause' || (e.code == 'ArrowLeft' && e.shiftKey)) mouseBack()
    else if (!overText && !captions && playing) {
      if (e.key == 'ArrowRight') myPlayer.currentTime += 10
      else if (e.key == 'ArrowLeft') myPlayer.currentTime -= 10
      else if (e.key == 'ArrowDown') {longClick = 0; lastClick = 2; clickEvent(e)}
      else if (e.key == 'ArrowUp') {lastClick = longClick = 2; clickEvent(e)}}}


  function clickEvent(e) {
    let id = e.target.id						// id under cursor
    block = 100								// block wheel input straight after click
    if (!playing && longClick && !gesture && overMedia) thumb.style.zIndex = Zindex += 1
    if (['myCut', 'myCopy', 'myPaste'].includes(id)) {myNav.style.display=null; lastId.focus(); inca('CutCopyPaste',id); return}
    if (lastClick != 3 && (gesture || id == 'myInput')) return
    if (longClick == 1 && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (['myIndex', 'myMp3', 'myMp4', 'myJoin', 'myJpg', 'mySrt'].includes(id)) {Ffmpeg(id); return}
    if (id == 'myInca') {if (selected || type) {inca('Delete','',index)} else inca('Settings'); return}
    if (id == 'myFavorite') {addFavorite(); return}
    if (id == 'myMute') {defMute ^= 1; inca('Mute', defMute); myPlayer.muted = defMute; return}
    if (id == 'myPitch') {setPitch(pitch ^= 1); return}
    if (id == 'myPause') {defPause ^= 1; inca('Pause',defPause); Pause(); return}
    if (id == 'myFlip') {Flip(); return}
    if (id == 'myCancel') {Cancel(); return}
    if (lastClick == 3) {
      if (longClick) return
      if (!myNav.style.display) {lastId = e.target; context(e); return}} // my context menu
    if (lastClick == 4) {mouseBack(); return}				// Back Click
    if (lastClick == 2) {  						// Middle click
      if (editing || myMenu.matches(':hover')) return
      if (zoom > 1) {Play(); return}
      else if (!playing && !myNav.style.display) {inca('View',lastMedia); return} // list/thumb view
      if (longClick) {index--} else index++				// next, previous media
      if (!Param()) {index = lastMedia; closePlayer(); return}}		// end of media list
    if (lastClick == 1) {
      if (!playing && id != title.id) {
        if (!overText && longClick && myPanel.matches(':hover')) return 
        if (id == 'myCue' || (overMedia && thumb.src.slice(-3) == 'm3u')
        || (longClick && ((overMedia && type == 'document')
        || (favicon && favicon.matches(':hover')))) 
        || (overMedia && thumb.src.endsWith('.pdf'))) {Click = 0; inca('Notepad',id,index); return}
      if (!playing && longClick && zoom == 1 && overMedia && !gesture) {thumb.style.size = 1.1; Param()}}
      if (!longClick) {
        if (id == 'mySelect') {if (type) {sel(index)} else selectAll(); return}
        if (id == 'mySkinny') {updateCue('skinny',1); return}
        if (id == 'mySpeed') {updateCue('rate',1); return}
        if (id == 'myCap') {capButton(); return}
        if (id == 'myCue' && playing) {cue = Math.round(100*myPlayer.currentTime)/100; return}}
      if (title.matches(':hover') || longClick != 1 && !playing && !overMedia && !myNav.style.display) return}
    if (myNav.style.display && Click == 3) {thumbSheet ^= 1; myNav.style.display = null; start = lastSeek}
    else if (!getStart(id)) return
    if (Click == 3 && !playing && !overMedia) {thumbSheet = 0; index = lastMedia; start = lastSeek}
    if (!playing && lastClick == 2) return
    if (playing && lastClick == 1 && type == 'document') return
    if (lastClick) Play()}


  function getStart(id) {
    if (!longClick && overMedia && !dur) return 1				// show image or text files
    if (lastClick == 2) start = defStart
    if (dur < 200 && start < defStart + 2 && !playlist && !favicon.textContent.includes('\u2764')) start = 0
    if (myPlayer.currentTime > dur - 0.5) myPlayer.load()			// restart media
    if (!longClick && thumbSheet && id != 'myPic') {				// clicked thumb on 6x6 thumbsheet
      if (skinny < 0) xm = 1-xm							// if flipped media
      let row = Math.floor(ym * 6)						// get media seek time from thumbsheet xy
      let col = Math.ceil(xm * 6)
      let offset = dur > 60 ? 20 : 0						// skip movie credits...
      let ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200							// see index() in inca.ahk to explain
      if (overMedia && yw < 0.9) start = (offset - (ps * offset) + dur * ps)
      else start = 0}
    else if (playing && ym > 0.8 && overMedia || yw > 0.98) {
      if (xm < 0.1) {if (longClick) {myPlayer.currentTime = 0} else myPlayer.currentTime = defStart}
      else {myPlayer.currentTime = start}
      return}
    else if (!longClick && lastClick == 1 && id != 'myPic' && playing) {Pause(); return}
    else if (!type || !playing && !overMedia) return
    if (longClick && longClick != 2) return
    if (lastClick && lastClick != 2) thumbSheet = 0
    if (!gesture) return 1}							// return and continue


  function Play() {
    closePic()
    positionMedia(0)
    thumb.pause()
    myPlayer.pause()
    if (!playing && !start) start = lastClick == 1 ? 0.04 : 0.12		 // smoother start
    if (!thumbSheet && type != 'image' && lastClick) myPlayer.style.opacity = 0	 // fade in player
    if (!thumbSheet || type == 'image') {myPlayer.poster = thumb.poster; myPlayer.currentTime = start}
    else if (!playing) lastSeek = defStart
    if (playlist.match('/inca/music/')) myPlayer.muted = 0
    else myPlayer.muted = defMute
    if (captions || favicon.matches(':hover') || type == 'document') openCap()
    if (el = document.getElementById('title'+lastMedia)) el.style.color = null
    title.style.opacity = 1; title.style.color = 'pink'
    lastMedia = index
    if (scaleY < 0.17) scaleY = 0.5						// return zoom after captions
    if (lastClick == 1) myNav.style.display = null
    myMask.style.pointerEvents = 'auto'						// stop overThumb() triggering
    if (captions || type=='audio' || playlist.match('/inca/music/')) scaleY = 0.16
    if (playlist.match('/inca/music/') && !thumbSheet) {myPlayer.currentTime = 0; myPlayer.play(); myPlayer.muted = 0}
    if (type == 'audio') myPlayer.style.borderBottom = '2px solid pink'
    else myPlayer.style.border = null
    if (!thumbSheet) inca('History',start.toFixed(1),index)
    observer = new IntersectionObserver(([entry]) => {if (!entry.isIntersecting) mediaX = mediaY = 500}).observe(myPlayer)
    if (pitch || myPlayer.context) {setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    playing = index
    fade = 0
    zoom = 1
    setTimeout(function() {
      if (!thumbSheet && dur && !defPause && !cue) myPlayer.play()
      if (lastClick) positionMedia(0.2)
      myMask.style.zIndex = Zindex += 1
      myPlayer.style.zIndex = Zindex + 2
      myVig.style.zIndex = Zindex + 3
      myPlayer.style.opacity = 0.99						// chrome transition bug
      myVig.style.opacity = 1},100)}


  function mouseMove(e) {
    if (innerHeight == outerHeight) {xPos = e.screenX; yPos = e.screenY} 	// fullscreen detection/offsets
    else {xPos = e.clientX; yPos = e.clientY}
    mySelected.style.left = xPos +30 +'px'
    mySelected.style.top = yPos -20 +'px'
    let x = Math.abs(xPos-xRef)							// gesture (Click + slide)
    let y = Math.abs(yPos-yRef)
    seekbar()
    cursor = 5
    if (x + y > 9 && !gesture && Click) {gesture=1; if (!longClick&&zoom==1 && !playing && overMedia && !myNav.style.display) sel(index)}
    if (!gesture || !Click) {gesture = 0; return}
    if (y > x + 1) gesture = 2							// enable player move
    if (editor.style.display) editing = 1
    if (!playing && overMedia && zoom > 1) {
      thumb.style.left = parseInt(thumb.style.left || 0) + xPos - xRef + 'px'	// move thumb
      thumb.style.top =  parseInt(thumb.style.top || 0) + yPos - yRef + 'px'}
    else if (e.target.id == 'ribbon') {
      editor.style.left = editor.offsetLeft + xPos - xRef + 'px'		// move caption editor
      editor.style.top = editor.offsetTop + yPos - yRef + 'px'}
    else if (playing && (Click == 1 || gesture == 2 || block == 1) && !(!overMedia && captions)) {
      if (thumbSheet) {xyz[0] += xPos - xRef ; xyz[1] +=  yPos - yRef}
      else {mediaX += xPos - xRef; mediaY += yPos - yRef}			// move myPlayer
      positionMedia(0)}
    if (gesture) xRef = xPos; yRef = yPos}


  function wheelEvent(e) {
    e.preventDefault()							// stop html scrolling
    let id = e.target.id 						// faster hover detection 
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < block) return
    let wheelUp = wheelDir * e.deltaY > 0
    let factor = 1 + (wheelUp ? wheel : -wheel) / 1500
    if (['myType', 'myAlpha', 'myDate', 'mySize', 'myDuration', 'mySearch'].includes(id)) {
      if (wheelUp) filt++
      else if (filt) filt--						// filter
      if ((id == 'myAlpha' || id == 'mySearch') && filt > 26) filt = 26
      if (id == 'myType' && filt > 4) filt = 4
      filter(id); block = 80}
    else if (id == 'mySpeed' && dur) {					// rate
      if (wheelUp) {rate -= 0.01} else rate += 0.01
      updateCue('rate',rate); block = 80}
    else if (id == 'mySkinny' && type) {				// skinny
      if (wheelUp) {skinny -= 0.01} else skinny += 0.01
      updateCue('skinny',skinny); block = 80}
    else if (!playing && overMedia && Click || (zoom > 1 && !dur)) {	// zoom thumb
      if (wheelUp) zoom *= factor
      else if (zoom > 1.02) zoom *= factor
      else {zoom = 1; block = 100; closePic(); return}
      thumb.style.size = zoom
      thumb.style.transition = '0.05s'
      thumb.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'
      start = thumb.currentTime
      block = 8}
    else if (id == 'myThumbs' || (!playing && Click)) { 		// zoom all thumbs
      let z = wheel/1500
      let view = settings.view
      if (view < 300 && wheelUp) view *= 1+z
      else if (!wheelUp) view /= 1+z
      if (view < 8) view = 8
      settings.view = String(view)
      myView.style.setProperty('--max-size', view + 'em')
      localStorage.setItem(folder, JSON.stringify(settings))
      block = 8}
    else if (id == 'myWidth' && !playing) {				// page width
      let x = 1*myView.style.width.slice(0,-2); let z = wheel/2000
      if (wheelUp) x *= 1+z
      else if (!wheelUp && x / 1+z > 100) x /= 1+z
      if (x > innerWidth-20) x = innerWidth - 20
      myView.style.width = x.toFixed(2)+'px'
      settings.pageWidth = String(x); localStorage.setItem(folder, JSON.stringify(settings))
      block = 8}
    else if (id == 'mySelect' && !captions) {
      Click = longClick = lastClick = 0; block = 150
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index-- 		// next - previous
      else if (Param() && playing) {getStart(id); Play()}
      if (!thumbSheet) myPlayer.currentTime = start
      positionMedia(0)}
    else if ((!dur || thumbSheet || longClick) && !overText && playing) { // zoom myPlayer
      let x = 0, y = 0, z = 0
      z = overMedia ? wheel / 1500 : z
      if (scaleY > 0.5) {x = rect.left+rect.width/2-xPos; y = rect.top+rect.height / 2 - yPos}
      let array = thumbSheet ? [...xyz] : [mediaX, mediaY, scaleY]
      array[0] += x * z * (wheelUp ? 1 : -1)
      array[1] += y * z * (wheelUp ? 1 : -1)
      array[2] *= factor
      if (array[2] < 0.16) array[2] = 0.16
      thumbSheet ? (xyz = array) : ([mediaX, mediaY, scaleY] = array)
      if (Click == 3) {block = 1} else block = 20			// 1 - allows player xy move
      positionMedia(0)}
    else if (dur && !thumbSheet) {					// seek
      let interval = 0.1
      if (dur > 200 && overMedia && ym > 0.8) interval = 1	
      else if (myPlayer.paused) interval = 0.0333
      if (wheelUp) thumb.currentTime = myPlayer.currentTime += interval
      else if (!wheelUp) thumb.currentTime = myPlayer.currentTime -= interval
      myPlayer.addEventListener('seeked', () => {block = 40}, {once: true})
      if (!playing) fade = 3
      thumb.pause(); block = 250}
    wheel = 0}


  function timerEvent() { 						// every 94mS
    xw = xPos / innerWidth
    yw = yPos / innerHeight
    let top = 0; let el = thumb
    if (playing) el = myPlayer
    rect = el.getBoundingClientRect()
    let trigger = 1600
    if (listView) trigger = 1200					// continuous scrolling
    if (block < 30 && list <= myList.innerHTML && myContent.scrollHeight && myContent.scrollTop)
      if (myContent.scrollTop > myContent.scrollHeight - trigger) inca('More')
    if (!myNav.matches(':hover')) myNav.style.display = null
    xm = (xPos - rect.left) / rect.width
    ym = (yPos - rect.top) / rect.height
    if (block >= 30) block -= 10					// wheel/timer blocking 
    if (wheel >= 10) wheel -= 10
    if (fade) fade--
    if (cursor) cursor--
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (!playing || thumbSheet || overText) myBody.style.cursor = null	// show default cursor
    else if (!cursor) myBody.style.cursor = 'none'			// hide cursor
    else myBody.style.cursor = 'crosshair'				// moving cursor over player
    if ((listView && thumb.style.opacity == 1) || favicon.matches(':hover') || myPic.matches(':hover')) overMedia = index
    else if (overMedia && myNav.style.display || myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else if (!overMedia && !playing) type = ''
    else overMedia = 0
    mySpeed.innerHTML = mySkinny.innerHTML = null
    if (type) {
      mySpeed.innerHTML = rate == 1 ? 'Speed' : `Speed ${rate.toFixed(2)}`
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
    let qty = selected.split(',').length - 1 || 1
    if (myInca.matches(':hover') && (selected || type)) {myInca.innerHTML = `Delete ${qty}`; myInca.style.color = 'red'}
    else {myInca.innerHTML = '&hellip;'; myInca.style.color = null}
    mySkinny.style.color = skinny == 1 ? null : 'red'
    mySpeed.style.color = rate == 1 ? null : 'red'
    myPitch.style.color = pitch ? 'red' : null
    myPause.style.color = defPause ? 'red' : null
    myMute.style.color = defMute ? 'red' : null
    if (!overMedia || overMedia && ym < 0.8) fade = 2
    seekbar()
    if (playing) {
      positionMedia(0)
      myPlayer.playbackRate = rate
      myMask.style.pointerEvents = 'auto'
      if (dur && !thumbSheet) lastSeek = myPlayer.currentTime
      if (playlist.match('/inca/music/')) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
      if (myPlayer.duration) dur = myPlayer.duration
      if (cues.innerHTML && !thumbSheet && type !='image') myCues(myPlayer.currentTime)}
    else {
      myMask.style.pointerEvents = null
      if (zoom > 1 && overMedia) myMask.style.opacity = 0.3 * zoom
      else myMask.style.opacity = 0
    if (!myNav.style.display && !listView && thumb.readyState === 4 && ym < 0.8 && overMedia && zoom == 1) thumb.play()}}


  function positionMedia(time) {					// position myPlayer in window
    myPanel.style.top = '50px'
    myView.style.top = '200px'
    if (!mediaX) {mediaX = screen.width/2; mediaY = screen.height/2; xyz = [mediaX, mediaY, 1]}
    let x = mediaX; let y = mediaY; let z = scaleY
    if (thumbSheet) {x = xyz[0]; y = xyz[1]; z = xyz[2]}
    let offset = editor.style.display ? 240 : 0				// media moved up to fit captions
    myPlayer.style.left = myVig.style.left = (x - screenX) - myPlayer.offsetWidth / 2 + "px"
    myPlayer.style.top = myVig.style.top = (y - (outerHeight-innerHeight)) - myPlayer.offsetHeight / 2 - offset + "px"
    myPlayer.style.transition = 'opacity ' + time + 's, transform ' + time + 's'
    myVig.style.transition = 'opacity ' + time/4 + 's, transform ' + time + 's'
    skinny = thumb.style.skinny || skinny
    myVig.style.setProperty('--scale', 20/z + 'px')			// vignette to scale with player
    myVig.style.width = myPlayer.style.width
    myVig.style.height = myPlayer.style.height
    myPlayer.style.transform = myVig.style.transform = "scale(" + skinny * z + "," + z + ")"}


  function seekbar() {							// seekbar bar beneath player
    navButtons()
    let cueX = rect.left
    let pos = playing ? myPlayer.currentTime : thumb.currentTime
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
    if (cue || block > 20 && playing && dur || ym > 0.8 && overMedia && !fade && dur) {
      mySeek.style.background = cue ? 'red' : null
      if (!playing && xm<1) cueW = rect.width * xm
      mySeek.style.width = cueW + 'px'
      myPic.style.zIndex = Zindex + 10
      mySeek.style.zIndex = Zindex + 11
      if (dur) mySeek.style.opacity = 1
      if (xm>0 && xm<1 && ym > 0.8 && ym<1 && !thumbSheet && block < 30) myPic.style.opacity = 1
      else myPic.style.opacity = 0
      if (playing || zoom > 1) {
        myPic.style.top = mySeek.offsetTop - thumb.offsetHeight + 'px'
        myPic.style.left = xPos - thumb.offsetWidth/2 + 'px'}
      else {myPic.style.top = rect.top + 'px'; myPic.style.left = rect.left + 'px'}
      setPic()
      return 1}
    else {mySeek.style.opacity = myPic.style.opacity = 0; start = thumb.currentTime || defStart}}


  function setThumb() {							// sets src, poster, thumbsheet & dimensions
    myPic.style.backgroundImage = null
    if (type == 'video') {
      let filename = thumb.src.match(/\/([^\/]+?)(?:\.[^.]*?)?$/)[1]
      let path = thumb.poster.replace(/\/(posters|temp\/history)\//, '/thumbs/').replace(/\/[^\/]*$/, '')
      sheet = path + '/' + filename + '.jpg'
      if (thumbSheet) {myPlayer.poster = sheet; myPlayer.load()}
      else myPlayer.poster = null
      if (myPlayer.src != thumb.src) myPlayer.src = thumb.src
      myPic.style.backgroundImage = 'url(\"'+sheet+'\")'}		// use 6x6 thumbsheet as poster
    else if (type == 'audio') myPlayer.src = thumb.src
    else myPlayer.src = null
    if (!thumbSheet && dur) myPlayer.currentTime = start
    aspect = thumb.offsetWidth/thumb.offsetHeight
    let x = y = z = innerHeight
    if (aspect < 1) {x = z*aspect} else y = z/aspect			// portrait or landscape - normalised size
    myPlayer.style.width = x +'px'; myPlayer.style.height = y +'px'	// normalise player size
    myVig.style.width = myPic.style.width = thumb.offsetWidth + 'px'
    myVig.style.height = myPic.style.height = thumb.offsetHeight + 'px'
    thumb.style.transform = 'scale('+skinny*zoom+','+zoom+')'
    myPic.style.transform = 'scale('+skinny+',1)'
    myPic.style.backgroundPosition = '0% 0%'}				// sets to frame 1 of 6x6 thumbSheet


  function setPic() {							// selects popup seek image based on cursor pos
    let x = (xPos - rect.left) / rect.width
    let thumbIndex = Math.ceil(x * 35)
    let z = (5 * (thumbIndex + 1) - 1) / 200
    let offset = dur > 60 ? 20 : 0
    start = offset - (z * offset) + dur * z
    if (!thumbIndex || type != 'video') {
      myPic.style.backgroundSize = '100%'
      myPic.style.backgroundImage = 'url(\"'+thumb.poster+'\")'}
    else if (type == 'video') {
      myPic.style.backgroundSize = null
      myPic.style.backgroundImage = 'url(\"'+sheet+'\")'
      myPic.style.backgroundPosition = `${(thumbIndex % 6) * 20}% ${Math.floor(thumbIndex / 6) * 20}%`}
    if (skinny < 0) myPic.style.left = rect.left + rect.width + 'px'}	// media flipped


  function filter(id) {							// for htm ribbon headings
    let ch = String.fromCharCode(filt + 65)
    let el = document.getElementById('my'+ch)
    if (id == 'mySearch') {el.scrollIntoView(); return}			// search letter in top menu
    let units = ''; let x = filt					// eg 30 minutes, 2 months, alpha 'A'
    el = document.getElementById(id)
    if (id == 'myType') {x = ''; units = { 1: 'Video', 2: 'Image', 3: 'Audio', 4: 'Fav' }[filt] || units}
    if (id == 'myAlpha') x = String.fromCharCode(filt + 64)
    if (id == 'mySize') {x *= 10; units = " Mb"}
    if (id == 'myDate') units = " months"
    if (id == 'myDuration') units = " minutes"
    el.style.color = filt ? 'red' : 'pink'
    el.innerHTML = filt ? x+' '+units : id.slice(2)
    if (myType.innerHTML != 'Type') myType.style.color = 'red'}


  function inca(command,value,select,address) {				// send java messages to inca.exe
    block = 60								// delay continuous scrolling
    for (i = 1; el = document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if ((el.style.rate || el.style.skinny) && !el.style.posted) {
        messages += '#editCues#'+el.style.rate+','+el.style.skinny+','+'#'+i+'#'; el.style.posted = 1}}
    if (select) {select += ','} else select = ''
    if (selected) select = selected
    if (!value) value = ''
    if (!address) address = ''
    if (command == 'Delete' || command == 'Rename' || value.toString().includes('|myMp4') || (select && command == 'Path')) {
      selected = ''
      if (command == 'Rename') value = value.replaceAll('#', '𝌇')
      for (x of select.split(',')) if (el = document.getElementById('thumb'+x)) el.remove()}	// release media
    messages += '#'+command+'#'+value+'#'+select+'#'+address
    fetch('http://localhost:3000/generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
      .then(response => {if (response.status === 204) {return} return response.text()})
      .then(data => { if (data) {
        if (command == 'More') {myView.insertAdjacentHTML('beforeend', data); for (list = 1; Param(list); list++) {}}
        else window.location.href = data}})
    messages = ''}


  function Param(i) {							// get media parameters
    i ||= index
    myPlayer.poster = myPlayer.src = ''
    if (!(document.getElementById('thumb'+i))) return			// end of media list
    if (!(favicon = document.getElementById('myFavicon'+i))) favicon = '' // fav or cc icon
    thumb = document.getElementById('thumb'+i)				// htm thumb element
    entry = document.getElementById('entry'+i)				// thumb and title container
    title = document.getElementById('title'+i)				// htm title element
    cues = document.getElementById('cues'+i)				// media defaults and time cues
    let vid = document.getElementById('vid'+i)
    let params = entry.dataset.params.split(',')
    type = params[0]							// media type eg. video
    defStart = Number(params[1])
    if (thumb.src != vid.src) thumb.src = vid.src
    dur = Number(params[2]) || thumb.duration || 0			// duration
    size = Number(params[3])						// file size
    skinny = 1
    rate = dur ? defRate : 1
    if (cues && cues.innerHTML) myCues(0)				// get 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x			// custom css holds edits
    x = Number(thumb.style.skinny); if (x) skinny = x
    zoom = thumb.style.size || 1
    setThumb()   							// src, thumbSheet
    return 1}


  function globals(fo, wd, mu, pa, so, fi, lv, se, pl, ix) {		// import globals from inca.exe
    folder = fo; filt = fi; wheelDir = wd; defPause = pa; listView = lv; selected = se; playlist = pl
    defMute = (mu == 'yes') ? 1 : 0
    settings = JSON.parse(localStorage.getItem(folder) || '{}')
    settings.pageWidth = (isNaN(settings.pageWidth) || settings.pageWidth > innerWidth) ? '600' : settings.pageWidth
    settings.view = (isNaN(settings.view) || settings.view < 6 || settings.view > 300) ? '10' : settings.view
    settings.defRate = (isNaN(settings.defRate) || settings.defRate < 0.2 || settings.defRate > 5) ? '1' : settings.defRate
    settings.pitch = settings.pitch == 1 ? 1 : 0
    myView.style.width = parseFloat(settings.pageWidth) + 'px'
    myView.style.setProperty('--max-size', settings.view + 'em')
    defRate = parseFloat(settings.defRate)
    pitch = parseFloat(settings.pitch)
    filter('my'+so)							// show filter heading in red
    for (x of selected.split(',')) {
      if(el = document.getElementById('title'+x)) {el.style.outline = '1px solid red'; el.style.opacity = 1}}
    for (list = 1; Param(list); list++) {}				// process null cues (eg. skinny, start, rate)		
    if (!ix) index = 1
    else index = ix
    lastMedia = index							// set htm thumb widths and heights 
    Param()								// initialise current media
    if (ix && title) {							// eg. after switch thumbs/listview
      title.style.opacity = 1						// highlight thumb
      title.style.color = 'pink'
      title.scrollIntoView()						// scroll to thumb
      myContent.scrollBy(0,-400)}}


  function myCues(time) { 						// media scrolls, speed, skinny, pauses etc.
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k = 0; k<x.length; k++) {					// process each line entry
      let el = x[k].split('|')						// time[0] cue[1] value[2] period[3]
      if (el[1] && 1*el[0] > time-0.1 && 1*el[0] < time+0.1) {
        if (el[1] == 'next') {lastClick = 2; clickEvent(0)}
        else if (el[1] == 'goto' && !myPlayer.paused) {myPlayer.currentTime = start = 1*el[2]}
        else if (el[1] == 'rate') rate = 1*el[2] || defRate
        else if (el[1] == 'skinny') {skinny = 1*el[2] || 1; if(time) positionMedia(2)}
        else if (el[1] == 'pause') {myPlayer.pause(); if (el[2]) setTimeout(function(){myPlayer.play()},1000*el[2])}}}}


  function openCap() {							// show captions
    let src = document.getElementById('dat'+index).getAttribute('data')
    if (!src) return
    captions = 1
    fetch(src)								// txt or caption text
      .then(response => response.text())
      .then(data => {CaptionEditor.open(data)})
    myNav.style.display = null}


  function updateCue(item, val) {					// rate, skinny, cues  Param(); 
    val = Math.round(1000 * val) / 1000
    thumb.style[item] = val
    thumb.style.posted = 0
    if (item == 'skinny') {skinny = val; thumb.style.transform = 'scale('+val+',1)'}
    if (type) {if (!playing) Param(); positionMedia(0.2); if (item == 'rate') rate = val}
    else if (item == 'rate') {defRate = val; settings.defRate = String(defRate); localStorage.setItem(folder, JSON.stringify(settings))}}


  function navButtons() {						// innerHTML values
    if (!type || type == 'document') {myCue.innerHTML = myCap.innerHTML = ''; return}
    myCap.innerHTML = 'Captions'
    if (!document.getElementById('dat'+index).getAttribute('data')) myCap.innerHTML = 'Add Captions'
    else if (captions) myCap.innerHTML = 'Add Caption '+myPlayer.currentTime.toFixed(1)
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


  function capButton() {						// context menu Caption button
    let x = cue+'|goto|'+myPlayer.currentTime.toFixed(1)
    if (thumb.style.skinny) x = cue+'|skinny|'+thumb.style.skinny
    if (thumb.style.rate) x = cue+'|rate|'+thumb.style.rate
    thumb.style.skinny = thumb.style.rate = 0
    if (cue) {cue = 0; messages += '#addCue#' + x + '#' + index + '#'} // add cues to media
    else {captions = 1; Play()}
    cue = 0}


  function sel(i) {							// highlight selected media in html
    if (!i || !Click || overText || (gesture && Click == 3)) return
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
    messages += '#Favorite#'+start.toFixed(1)+'#'+index+'#'
    favicon.innerHTML = '&#10084'}					// heart symbol on htm thumb


  function Ffmpeg(id) {
    let target = cue + '|' + id + '|' + skinny
    let select = selected || overMedia || playing || 0
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


  function mediaEnded() {								// media finished playing
    if (playlist.match('/inca/music/')) {
      if (Param(index += 1)) {Play(); myPlayer.play()} else closePlayer(); return}
    else if (!defPause && block<30 && type != 'audio') {getStart(); myPlayer.play()}	// replay media
    else {myPlayer.currentTime = dur+2; myPlayer.pause(); block = 60}}			// stay at end


  function mouseBack() {
    if (playing) closePlayer()						// close player and send messages to inca
    else if (zoom > 1) closePic()
    else if (longClick) window.close()
    else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)		// else scroll to page top
    else inca('Reload')}						// or finally, reload page & clear selected


  function overThumb(id) {
    if (zoom == 1) thumb.src = ''					// release media from server
    index = id
    if (Click) return							// faster for click & slide selecting
    Param(id)
    thumb.style.opacity = 1
    if (zoom == 1) {thumb.load(); thumb.playbackRate = 0.7; thumb.currentTime = start = defStart + 0.04}}


  function closePlayer() {
    if (editor.style.display) CaptionEditor.close()
    if (observer) observer.disconnect()
    if (editing) {
      editing = editing.replaceAll('#', '𝌇')							// because # is used as delimiter
      inca('capEdit', editing, index)					// save edited text
      editing = 0}
    Click = playing = start = captions = thumbSheet = cue = 0
    myVig.style.opacity = myPlayer.style.opacity = overText = 0
    myMask.style = myDur.innerHTML = myPlayer.src = ''
    myPlayer.style.zIndex = -1}


  function getVoice(voice, text) {					// elevenlabs.ai text to voice call
//  getVoice(Sarah, text).then(audioUrl => {if (audioUrl) {new Audio(audioUrl).play()}})
    let api = ""
    let endpoint = "https://api.elevenlabs.io/v1/text-to-speech/" + voice + "?output_format=mp3_44100_128"
    return fetch(endpoint, {
      method: "POST",
      headers: {"xi-api-key": api, "Content-Type": "application/json"},
      body: JSON.stringify({text: text, model_id: "eleven_v3"})})
      .then(res => res.blob())
      .then(blob => URL.createObjectURL(blob))}


  function context(e) {
    if (overEditor) {myNav.classList.add('editor-mode')} else myNav.classList.remove('editor-mode')
myNav.style.display = 'block'; myNav.style.left = xPos-90+'px'; myNav.style.top = yPos-32+'px'}
  function closePic() {thumb.style.size = 1; myPic.style = thumb.style = ''; Param()}
  function Cancel() {if (myCancel.innerHTML != 'Sure ?') {myCancel.innerHTML = 'Sure ?'} else {editing = 0; inca('Reload',index)}}
  function Flip() {xPos = 0; skinny *=- 1; thumb.style.skinny = skinny; Param(); positionMedia(0.4)}
  function Time(z) {if (z < 0) return '0:00'; let y = Math.floor(z%60); let x = ':'+y; if (y<10) {x = ':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i = 1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function Pause() {if (!editor.matches(':hover') && !thumbSheet && playing && myPlayer.paused) {myPlayer.play()} else myPlayer.pause()}




