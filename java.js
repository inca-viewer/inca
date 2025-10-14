
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
  let wasMedia = 0							// was over thumb or myPlayer
  let overText = 0							// text input fields, allow cut paste
  let editing = 0							// editing text active
  let messages = ''							// message digest to inca.exe
  let Zindex = 3							// element zIndex
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
  let timout = 0							// -- every 94mS  eg for hide cursor
  let block = 0								// block timer events
  let aspect = 1							// media width to height ratio
  let mediaX = 0							// centre of myPlayer
  let mediaY = 0
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed
  let defMute = 0							// default mute
  let defPause = 0							// default pause state
  let observer								// see if myPlayer is visible
  let pitch = 0								// default pitch
  let list = 0								// computed list size (last index +1)
  let timestamps = []
  let time = 0
  let end = 0
  let sheet = ''


  let srt = document.createElement('textarea')				// . txt or subtitle element
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
  document.addEventListener('contextmenu', (e) => {if (yw > 0.05) e.preventDefault()})
  window.addEventListener('beforeunload', (e) => {if (playing && editing) e.preventDefault()})
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState=='visible' && folder=='Downloads' && !selected && !editing) inca('Reload',index)})
  if (innerHeight>innerWidth) {scaleY=0.64} else scaleY=0.5		// screen is portrait


  function mouseDown(e) {
    longClick = gesture = 0
    wasMedia = overMedia
    if (e.key == 'Pause' && e.shiftKey) Click = lastClick = 3
    else Click = lastClick = e.button + 1
    if (Click == 2) e.preventDefault()					// forward and back mouse buttons
    xRef = xPos; yRef = yPos
    clickTimer = setTimeout(function() {
      longClick = Click; clickEvent(e)},300)}				// detect long click


  function mouseUp(e) {
    if (!Click) return							// stop re-entry also if new page load
    if (!playing && !myInput.matches(':hover'))
      myInput.value = window.getSelection().toString() || myInput.value	// paste last search into myInput 
    clearTimeout(clickTimer)						// longClick timer
    if (!longClick) clickEvent(e)					// process click event
    Click = longClick = wheel = gesture = 0}


  function keyDown(e) {							// keyboard events
    longClick = 0
    if (e.key == 'Enter' && !playing) {
      if (renamebox) inca('Rename', renamebox, lastMedia)		// rename media
      else inca('SearchBox','','',myInput.value)}			// search for media
    else if (e.key == 'Pause' && e.shiftKey) mouseDown(e)
    else if (e.key == 'Pause' || (e.code == 'ArrowLeft' && e.shiftKey)) mouseBack()
    else if (!overText && !captions && playing) {
      if (e.key == 'ArrowRight') myPlayer.currentTime += 10
      else if (e.key == 'ArrowLeft') myPlayer.currentTime -= 10
      else if (e.key == 'ArrowDown') {lastClick = 2; clickEvent(e)}
      else if (e.key == 'ArrowUp') {lastClick = longClick = 2; clickEvent(e)}}}


  function clickEvent(e) {
    let id = e.target.id 								// id under cursor
    if (gesture || id == 'myInput') return
    if (longClick == 1 && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (['myIndex', 'myMp4', 'myMp3', 'myJoin'].includes(id)) {Ffmpeg(id); return}
    if (id == 'myInca') {inca('Settings'); return}
    if (id == 'myDelete') {inca('Delete','',index); return}
    if (id == 'myFavorite') {addFavorite(); return}
    if (id == 'myMute') {defMute ^= 1; inca('Mute', defMute); myPlayer.muted = defMute; return}
    if (id == 'myPitch') {setPitch(pitch ^= 1); return}
    if (id == 'myPause') {defPause ^= 1; inca('Pause',defPause); Pause(); return}
    if (id == 'myFlip') {Flip(); return}
    if (id == 'myCancel') {Cancel(); return}
    if (lastClick == 3 && !longClick) {							// Right click context
      if (yw < 0.06) return
      if (!myNav.style.display) {context(e); return}
      if (!myTitle.value) return}
    if (lastClick == 4) {mouseBack(); return}						// Back Click
    if (lastClick == 2) {  								// Middle click
      if (editing) {inca('Null'); return}						// save text
      if (myMenu.matches(':hover')) return
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// list/thumb view
      if (!thumbSheet && lastClick) messages += '#History#'+start.toFixed(1)+'#'+index+'#'
      if (longClick) {index--} else index++						// next, previous media
      if (!getParameters(index)) {index = lastMedia; closePlayer(); return}}		// end of media list
    if (lastClick == 1) {
      if (!playing && id != title.id) {
        if (!overText && longClick && myPanel.matches(':hover')) return 
        if (id == 'myCue' || (overMedia && thumb.src.slice(-3) == 'm3u')
        || (longClick && ((overMedia && type == 'document')
        || (favicon && favicon.matches(':hover')))) 
        || (overMedia && thumb.src.endsWith('.pdf'))) {Click = 0; inca('Notepad',id,index); return}}
      if (!longClick) {
        if (id == 'mySelect') {if (myTitle.value) {sel(index)} else selectAll(); return}
        if (id == 'mySkinny') {updateCue('skinny',1); return}
        if (id == 'mySpeed') {updateCue('rate',1); return}
        if (id == 'myCap') {capButton(); return}
        if (id == 'myCue' && playing) {cueButton(); return}
        if (overText && yPos < srt.offsetTop + 12) {srt.scrollTo(0,-5); return}}	// scroll to top of text
      if (title.matches(':hover') || longClick != 1 && !playing && !overMedia && !myNav.style.display) return}
    if (lastClick == 3 || longClick == 3) {thumbSheet ^= 1; myNav.style.display = null; lastSeek = myPlayer.currentTime}
    else if (!getStart(id)) return
    if (!playing && lastClick == 2) return
    if (playing && lastClick == 1 && type == 'document') return
    getParameters(index)
    if (captions || favicon.matches(':hover') || type == 'document') openCap()
    if (lastClick) Play()}


  function getStart(id) {
    if (!thumbSheet) start = defStart
    if (overMedia && !dur || longClick == 2) return 1				// show image or text files
    if (!longClick && id != 'myPic' && dur < 200 && !playlist && !favicon.textContent.includes('\u2764')) start = 0
    if (myPlayer.currentTime > dur-0.5) myPlayer.load()			// restart media
    if (longClick != 1 && thumbSheet && id != 'myPic') {		// clicked thumb on 6x6 thumbsheet
      if (skinny < 0) xm = 1-xm						// if flipped media
      let row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
      let col = Math.ceil(xm * 6)
      let offset = dur > 60 ? 20 : 0					// skip movie credits...
      let ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200						// see index() in inca.ahk to explain
      if (overMedia) start = (offset - (ps * offset) + dur * ps)}
    else if (ym>0.95 && ym<1.05 && xm>0 && xm<1 || (yw > 0.95 && yw < 0.99)) {
      if (xm < 0.1) {if (longClick) {myPlayer.currentTime = 0} else myPlayer.currentTime = defStart}
      else {myPlayer.currentTime = xm * dur; timout = 8}
      return}
    else if (!longClick && lastClick == 1 && id != 'myPic' && playing) {Pause(); return}
    else if (longClick == 1 && !playing) {if (!overMedia) {index = lastMedia; start = lastSeek} else start = 0}
    else if (!myTitle.value || !playing && !overMedia || longClick) return
    if (lastClick && lastClick != 2) thumbSheet = 0
    if (!gesture) return 1}						// return and continue


  function Play() {
    positionMedia(0)
    thumb.pause()
    myPlayer.pause()
    if (!start) start = lastClick == 1 ? 0.04 : 0.12				 // smoother start
    if (!thumbSheet && type != 'image' && lastClick) myPlayer.style.opacity = 0	 // fade in player
    if (!thumbSheet || type == 'image') {myPlayer.poster = thumb.poster; myPlayer.currentTime = start}
    if (playlist.match('/inca/music/')) myPlayer.muted = 0
    else myPlayer.muted = defMute
    if (el = document.getElementById('title'+lastMedia)) el.style.color = null
    title.style.opacity = 1; title.style.color = 'pink'
    lastMedia = index
    if (scaleY < 0.17) scaleY = 0.5					// return zoom after captions
    if (lastClick == 1) myNav.style.display = null
    myMask.style.pointerEvents = 'auto'					// stop overThumb() triggering
    if (captions || type=='audio' || playlist.match('/inca/music/')) scaleY = 0.16
    if (playlist.match('/inca/music/') && !thumbSheet) {myPlayer.currentTime = 0; myPlayer.play(); myPlayer.muted = 0}
    if (type == 'audio') myPlayer.style.borderBottom = '2px solid pink'
    else myPlayer.style.border = null
    observer = new IntersectionObserver(([entry]) => {if (!entry.isIntersecting) mediaX = mediaY = 500}).observe(myPlayer)
    if (pitch || myPlayer.context) {setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    playing = index
    block = 150
    setTimeout(function() {
      if (captions) {convertSrt(); myCues(999); srt.addEventListener('scroll', capTime)}
      else if (!thumbSheet && dur && !defPause && !cue) myPlayer.play()
      if (lastClick) positionMedia(0.2)
      myPlayer.style.zIndex = Zindex
      myVig.style.zIndex = Zindex+1
      myPlayer.style.opacity = 0.99					// chrome transition bug
      myVig.style.opacity = 1},40)}


  function mouseMove(e) {
    if (innerHeight == outerHeight) {xPos = e.screenX; yPos = e.screenY} 	// fullscreen detection/offsets
    else {xPos = e.clientX; yPos = e.clientY}
    timout = 8
    if (myNav.style.display) setPic()						// in context menu sets thumb sprite
    mySelected.style.left = xPos +30 +'px'
    mySelected.style.top = yPos -20 +'px'
    let x = Math.abs(xPos-xRef)
    let y = Math.abs(yPos-yRef)
    if (x + y > 7 && !gesture && Click) {gesture = 1				// gesture (Click + slide)
      if (!playing && overMedia && !myNav.style.display) sel(index)
      if (myNav.style.display) {x = myNav.getBoundingClientRect(); xRef = (xPos-x.left)/skinny; yRef = yPos-x.top}}
    if (!gesture || !Click) {gesture = 0; return}
    else if (captions && !cues.textContent.match(srt.offsetWidth)) editing = 1	// textarea size changed
    if (y > x + 1) gesture = 2							// enable player move
    if (Click == 1 || gesture == 2) {
      if (myNav.style.display) {myNav.style.left = xPos-xRef+"px"; myNav.style.top = yPos-yRef+"px"}  // move context menu
      else if (playing && !overText) {						// move myPlayer
        mediaX += xPos - xRef
        mediaY += yPos - yRef
        positionMedia(0)}}
    if (gesture) xRef = xPos; yRef = yPos}


  function wheelEvent(e) {
    e.preventDefault()
    let id = e.target.id 						// Use e.target for faster hover detection 
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < block) return
    block = 100
    let wheelUp = wheelDir * e.deltaY > 0
    if (['myType', 'myAlpha', 'myDate', 'mySize', 'myDuration', 'mySearch'].includes(id)) {
      if (wheelUp) filt++ 
      else if (filt) filt--						// filter
      if ((id == 'myAlpha' || id == 'mySearch') && filt > 26) filt = 26
      if (id == 'myType' && filt > 4) filt = 4
      filter(id)}
    else if (id == 'mySpeed') {						// rate
      if (wheelUp) {rate -= 0.01} else rate += 0.01
      updateCue('rate',rate)}
    else if (id == 'mySkinny' && myTitle.value) {			// skinny
      if (wheelUp) {skinny -= 0.01} else skinny += 0.01
      updateCue('skinny',skinny)}
    else if (id == 'myThumbs') { 					// thumb size
      let z = wheel/1500
      let view = settings.view
      if (view < 98 && wheelUp) view *= 1+z
      else if (!wheelUp) view /= 1+z
      if (view < 8) view = 8
      settings.view = String(view)
      myView.style.setProperty('--max-size', view + 'em')
      localStorage.setItem(folder, JSON.stringify(settings))
      block = 8}
    else if (!playing && id == 'myWidth') {				// page width
      let x = 1*myView.style.width.slice(0,-2); let z = wheel/2000
      if (wheelUp) x *= 1+z
      else if (!wheelUp && x / 1+z > 100) x /= 1+z
      if (x > innerWidth-20) x = innerWidth - 20
      myView.style.width = x.toFixed(2)+'px'
      settings.pageWidth = String(x); localStorage.setItem(folder, JSON.stringify(settings))
      block = 8}
    else if (id == 'myPic') {  						// zoom context pic
      if (wheelUp) {zoom *= 1.1} else if (zoom > 1) zoom *= 0.9
      myPic.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'
      block = 80}
    else if (id == 'mySelect' || id == 'myTitle') {
      Click = longClick = lastClick = 0; block = 150
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index-- 		// next - previous
      if (getParameters(index) && playing) {getStart(id); Play()}
      if (!thumbSheet) myPlayer.currentTime = start
      positionMedia(0)}
    else if (!dur || thumbSheet || Click && !myNav.style.display) {	// zoom myPlayer
      let x = 0; let y = 0; let z = 0
      if (wasMedia) z = wheel/2000
      if (scaleY > 0.5) {x = rect.left+rect.width/2-xPos; y = rect.top+rect.height / 2 - yPos}
      if (wheelUp) {mediaX += x*z; mediaY += y*z; scaleY *= (1 + wheel / 2000)}
      else if (!wheelUp) {mediaX -= x*z; mediaY -= y*z; scaleY /= (1 + wheel / 2000)}
      if (scaleY<0.16) scaleY = 0.16
      if (thumbSheet && scaleY<0.4) scaleY = 0.4
      positionMedia(0); block = 20}
    else if (dur && !thumbSheet) {
      let interval = 0.1
      if (dur > 200 && ym>0.95 && ym<1.05) interval = 1			// seek
      else if (myPlayer.paused) interval = 0.0333
      if (wheelUp) myPlayer.currentTime += interval
      else if (!wheelUp) myPlayer.currentTime -= interval
      myPlayer.addEventListener('seeked', () => {block = 40}, {once: true})
      timout = 4; block = 250}
    wheel = 0}


  function timerEvent() { 						// every 94mS
    xw = xPos / innerWidth
    yw = yPos / innerHeight
    let top = 0; let el = myPlayer
    if (myNav.style.display) el = myPic
    else if (!playing) el = thumb
    rect = el.getBoundingClientRect()
    myTitle.value = (overMedia || playing) ? title.value : ''
    let trigger = 1600
    if (listView) trigger = 1200					// continuous scrolling
    if (block<30 && list <= myList.innerHTML && myContent.scrollHeight && myContent.scrollTop)
      if (myContent.scrollTop > myContent.scrollHeight - trigger) inca('More')
    if (!myNav.matches(':hover')) myNav.style.display = null
    else if (!myTitle.value || type == 'document') myNav.style.width = 84 + 'px'
    else {myNav.style.width = rect.width + 100 + 'px'; if (myTitle.matches(':hover')) myPic.style.display = 'block'}
    xm = (xPos - rect.left) / rect.width
    ym = (yPos - rect.top) / rect.height
    if (block >= 30) block -= 10					// wheel/timer blocking 
    if (wheel >= 10) wheel -= 10
    if (timout) timout--
    navButtons()
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (!playing || thumbSheet || overText) myBody.style.cursor = null	// show default cursor
    else if (!timout) myBody.style.cursor = 'none'			// hide cursor
    else myBody.style.cursor = 'crosshair'				// moving cursor over player
    if (editing) {capMenu.style.display = 'flex'} else capMenu.style.display = 'none'
    if ((listView && thumb.style.opacity == 1) || favicon.matches(':hover')) overMedia = index
    else if (overMedia && myNav.style.display || myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else overMedia = 0
    mySkinny.innerHTML = null
    mySkinny.style.color = null
    mySpeed.innerHTML = defRate === 1 ? 'Speed' : 'Speed ' + defRate
    if (myTitle.value) {
      myFlip.innerHTML = 'Flip'
      myTitle.style.visibility = null
      myTitle.style.top = '0em'
      mySelect.innerHTML = 'Select '+index
      mySelect.style.outline = myPlayer.style.outline = title.style.outline
      mySkinny.innerHTML = skinny === 1 ? 'Skinny' : `Skinny ${skinny.toFixed(2)}`
      mySkinny.style.color = skinny === 1 ? null : 'red'
      mySpeed.innerHTML = rate === 1 ? 'Speed' : `Speed ${rate.toFixed(2)}`}
    else {myTitle.style.visibility='hidden'; mySelect.innerHTML = 'Select'; myFlip.innerHTML = mySelect.style.outline = null}
    if (favicon.innerHTML.match('\u2764')) myFavorite.innerHTML = 'Fav &#x2764'
    else myFavorite.innerHTML = 'Fav'
    if (!dur || !seekbar()) mySeek.style.opacity = null
    else if (cue) myDur.innerHTML = formatTime(time)+' - '+formatTime(end)
    else if (myNav.matches(':hover')) myDur.innerHTML = formatTime(dur)+' - '+formatTime(start)
    else myDur.innerHTML = formatTime(dur)+' - '+formatTime(myPlayer.currentTime)
    let qty = selected.split(',').length - 1 || 1;
    if (myTitle.value || selected) myDelete.innerHTML = 'Delete ' + qty
    else myDelete.innerHTML = null
    if (pitch) {myPitch.style.color = 'red'} else myPitch.style.color = null
    if (defMute) {myMute.style.color = 'red'} else myMute.style.color = null
    if (defPause) {myPause.style.color = 'red'} else myPause.style.color = null
    if (skinny<0) {myFlip.style.color = 'red'} else myFlip.style.color = null
    if (!thumbSheet && captions) srt.style.opacity = 1
    if (captions && el == myPlayer) {
      if (playing) {top = rect.bottom} else top = 300
      capMenu.style.top = top + 24 + srt.offsetHeight + 'px'; capMenu.style.left = mediaX -screenX - 85 + 'px'
    srt.style.top = top + 'px'; srt.style.left = mediaX - screenX - srt.offsetWidth / 2 + 'px'}
    if (playing) {
      positionMedia(0)
      myPlayer.playbackRate = rate
      myMask.style.pointerEvents = 'auto'
      if (playlist.match('/inca/music/')) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
    if (captions && !overText && !editing || myPlayer.currentTime == start) for (let i = 1; i < timestamps.length; i++) {
        if (timestamps[i][0] > myPlayer.currentTime) {srt.scrollTo(0, timestamps[i-1][1]); break}}
      if (myPlayer.duration) dur = myPlayer.duration
      if (cues.innerHTML && !thumbSheet && type !='image') myCues(myPlayer.currentTime)}
    else {
      myMask.style.pointerEvents = null
      if (myNav.style.display) myMask.style.opacity = 0.5
      else myMask.style.opacity = 0
      if (!listView && thumb.readyState === 4 && thumb.duration && overMedia) thumb.play()}}


  function positionMedia(time) {					// position myPlayer in window
    myPanel.style.top = '50px'
    myView.style.top = '200px'
    if (!mediaX) {mediaX = screen.width/2; mediaY = screen.height/2}
    let offset = captions && srt.value ? 140 : 0
    myPlayer.style.left = myVig.style.left = (mediaX - screenX) - myPlayer.offsetWidth / 2 + "px"
    myPlayer.style.top = myVig.style.top = (mediaY - (outerHeight-innerHeight)) - myPlayer.offsetHeight / 2 - offset + "px"
    myPlayer.style.transition = 'opacity ' + time + 's, transform ' + time + 's'
    myVig.style.transition = 'opacity ' + time/4 + 's, transform ' + time + 's'
    skinny = thumb.style.skinny || skinny
    let z = scaleY
    if (thumbSheet) z = scaleY * 2
    myVig.style.setProperty('--scale', 20/z + 'px')			// vignette to scale with player
    myPlayer.style.transform = myVig.style.transform = "scale(" + skinny * z + "," + z + ")"}


  function seekbar() {							// seekbar bar beneath player
    let cueX = rect.left
    let pos = Math.round(myPlayer.currentTime*10)/10
    let cueW = rect.width * pos / dur
    if (myPic.matches(':hover')) cueW = rect.width * xm
    mySeek.style.width = cueW + 'px'
    if (cue && cue <= pos) {
      cueX = rect.left + rect.width * cue / dur
      cueW = rect.width * (pos - cue) / dur
      if (cue < pos + 1 && cue > pos - 1) {
        cueW = rect.width * (dur - cue) / dur}}
    else if (cue) {
      cueX = rect.left + rect.width * pos / dur
      cueW = rect.width * (cue - pos) / dur
      if (cue < 1 + pos) {cueX = rect.left; cueW = rect.width * pos / dur}}
    if (rect.bottom > innerHeight) mySeek.style.top = innerHeight - 15 +'px'
    else mySeek.style.top = rect.top + rect.height - 6 + 'px'
    mySeek.style.left = cueX + 'px'
    if (ym > 0.95 && ym < 1.05 && xm > 0 && xm < 1) timout = 4
    if (!myNav.style.display && !cue && (Click || !playing || !timout || (overMedia && ym< 0.95))) return
    if (yw>0.95 || (ym>0.95 && ym<1.05 && xm>0 && xm<1) && !myNav.style.display) mySeek.style.height = '6px'
    else mySeek.style.height = null
    if (!playing && !myPic.matches(':hover')) mySeek.style.background = 'none'
    else if (cue) mySeek.style.background = 'red'
    else mySeek.style.background = null
    mySeek.style.opacity = 0.8
    return 1}


  function setThumb() {							// sets src, poster, thumbsheet & dimensions
    myPic.style.backgroundImage = null
    if (type == 'video') {
      let filename = thumb.src.match(/\/([^\/]+?)(?:\.[^.]*?)?$/)[1]
      let path = thumb.poster.replace(/\/(posters|temp\/history)\//, '/thumbs/').replace(/\/[^\/]*$/, '')
      sheet = path + '/' + filename + '.jpg'
      if (thumbSheet) {myPlayer.poster = sheet; myPlayer.load()}
      else myPlayer.poster = null
      if (myPlayer.src != thumb.src) myPlayer.src = thumb.src
      myPic.style.backgroundImage = 'url(\"'+sheet+'\")'}			// use 6x6 thumbsheet as poster
    else if (type == 'audio') myPlayer.src = thumb.src
    else myPlayer.src = null
    if (!thumbSheet && dur) myPlayer.currentTime = start
    aspect = thumb.offsetWidth/thumb.offsetHeight
    let x = y = z = innerHeight
    if (aspect < 1) {x = z*aspect} else y = z/aspect			// portrait or landscape - normalised size
    myPlayer.style.width = x +'px'; myPlayer.style.height = y +'px'	// normalise player size
    myVig.style.width = x +'px'; myVig.style.height = y +'px'		// vignette
    if (aspect < 1) {y = 150; x = 150*aspect} else {y = 150/aspect; x = 150}	// initial context image size
    myPic.style.width = x + 'px'
    myPic.style.height = y + 'px'					// context menu thumb 
    myPic.style.transform = 'scale('+Math.abs(skinny)*zoom+','+zoom+')'
    myPic.style.backgroundPosition = '0% 0%'				// sets to frame 1 of 6x6 thumbSheet
    if (myNav.style.display) setPic()}


  function setPic() {							// sets context image based on cursor over myPic
    let x = Math.max(0, Math.min(1, ((xPos - rect.left) / rect.width + 0.02) ** 2 - 0.02))
    let thumbIndex = Math.ceil(x * 35)
    let z = (5 * (thumbIndex + 1) - 1) / 200
    let offset = dur > 60 ? 20 : 0
    start = offset - (z * offset) + dur * z
    if (!thumbIndex || !myPic.matches(':hover') || type != 'video') {
        myPic.style.backgroundSize = '100%'
        myPic.style.backgroundImage = 'url(\"'+thumb.poster+'\")'}
    else if (type == 'video') {
      myPic.style.backgroundSize = null
      myPic.style.backgroundImage = 'url(\"'+sheet+'\")'
      myPic.style.backgroundPosition = `${(thumbIndex % 6) * 20}% ${Math.floor(thumbIndex / 6) * 20}%`}
    myPic.style.transform = `scale(${skinny * zoom},${zoom})`
    myPic.style.left = (skinny < 0 ? rect.width : 0) + 'px'}


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
    if (!filt) {el.innerHTML = id.slice(2); el.style.color = 'pink'}
    else {el.style.color = 'red'; el.innerHTML = x+' '+units}
    if (myType.innerHTML != 'Type') myType.style.color = 'red'}


  function inca(command,value,select,address) {				// send java messages to inca.exe
    block = 60								// temp block continuous scrolling
    for (i = 1; el = document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if ((el.style.rate || el.style.skinny) && !el.style.posted) {
        messages += '#editCues#'+el.style.rate+','+el.style.skinny+','+'#'+i+'#'; el.style.posted = 1}}
    if (!select) {select = ''} else {select += ','}
    if (selected) select = selected
    if (!value) value = ''
    if (!address) address = ''
    if (command == 'Delete' || command == 'Rename' || value.toString().includes('|myMp4') || (select && command == 'Path')) {
      selected = ''
      for (x of select.split(',')) if (el = document.getElementById('thumb'+x)) el.remove()}	// release media
    messages += '#'+command+'#'+value+'#'+select+'#'+address
    fetch('http://localhost:3000/generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
      .then(response => {if (response.status === 204) {return} return response.text()})
      .then(data => { if (data) {
        if (command == 'More') {myView.insertAdjacentHTML('beforeend', data); for (list = 1; getParameters(list); list++) {}}
        else window.location.href = data}})
    messages = ''}


  function getParameters(i) {						// get media parameters
    srt.style = myPlayer.poster = thumb.src = myPlayer.src = ''
    if (!(document.getElementById('thumb'+i))) return			// end of media list
    if (!(favicon = document.getElementById('myFavicon'+i))) favicon = '' // fav or cc icon
    thumb = document.getElementById('thumb'+i)				// htm thumb element
    entry = document.getElementById('entry'+i)				// thumb and title container
    title = document.getElementById('title'+i)				// htm title element
    cues = document.getElementById('cues'+i)				// media defaults and time cues
    srt = document.getElementById('srt'+i)				// txt or caption element
    let params = entry.dataset.params.split(',')
    type = params[0]							// media type eg. video
    defStart = Number(params[1])
    thumb.src = thumb.dataset.altSrc
    dur = Number(params[2]) || thumb.duration || 0			// duration
    size = Number(params[3])						// file size
    skinny = 1; rate = defRate						// reset before new cues read
    if (cues && cues.innerHTML) myCues(0)				// get 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x			// custom css holds edits
    x = Number(thumb.style.skinny); if (x) skinny = x
    thumb.style.transform = 'scale('+skinny+',1)' 			// set thumb width
    setThumb()   							// src, thumbSheet
    return 1}


  function globals(fo, wd, mu, pa, so, fi, lv, se, pl, ix) {		// import globals from inca.exe
    folder = fo; filt = fi; wheelDir = wd; defPause = pa; listView = lv; selected = se; playlist = pl
    if (mu == 'yes') {defMute = 1} else defMute = 0
    settings = JSON.parse(localStorage.getItem(folder) || '{}')
    settings.pageWidth = (isNaN(settings.pageWidth) || settings.pageWidth > innerWidth) ? '600' : settings.pageWidth
    settings.view = (isNaN(settings.view) || settings.view < 6 || settings.view > 100) ? '10' : settings.view
    settings.defRate = (isNaN(settings.defRate) || settings.defRate < 0.2 || settings.defRate > 5) ? '1' : settings.defRate
    settings.pitch = settings.pitch == 0 ? 0 : 1
    myView.style.width = parseFloat(settings.pageWidth) + 'px'
    myView.style.setProperty('--max-size', settings.view + 'em')
    defRate = parseFloat(settings.defRate)
    pitch = parseFloat(settings.pitch)
    filter('my'+so)							// show filter heading in red
    for (x of selected.split(',')) {
      if(el = document.getElementById('title'+x)) {el.style.outline = '1px solid red'; el.style.opacity = 1}}
    for (list = 1; getParameters(list); list++) {}			// process null cues (eg. skinny, start, rate)		
    if (!ix) index = 1
    else index = ix
    lastMedia = index							// set htm thumb widths and heights 
    getParameters(index)						// initialise current media
    if (ix && title) {							// eg. after switch thumbs/listview
      title.style.opacity = 1						// highlight thumb
      title.style.color = 'pink'
      title.scrollIntoView()						// scroll to thumb
      myContent.scrollBy(0,-400)}}


  function myCues(time) { 						// media scrolls, speed, skinny, pauses etc.
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k = 0; k<x.length; k++) {					// process each line entry
      let el = x[k].split('|')						// time[0] cue[1] value[2] period[3]
      if (el[1] == 'scroll' && time == 999) {
        if (type == 'document') srt.scrollTo(0,el[2])			// scroll to text position once only
        srt.style.width = (el[3] < 160 ? 360 : el[3]) + 'px'
        srt.style.height = (el[4] < 60 ? 160 : el[4]) + 'px'}
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
      .then(data => {srt.value = data || ''})
    srt.style.display = 'block'
    myNav.style.display = null
    srt.style.zIndex = Zindex}


  function updateCue(item, val) {					// rate, skinny, cues  getParameters(index); 
    val = Math.round(1000 * val) / 1000
    thumb.style[item] = val
    thumb.style.posted = 0
    if (item == 'skinny') {skinny = val; thumb.style.transform = 'scale('+val+',1)'}
    if (myTitle.value) {if (!playing) getParameters(index); positionMedia(0.2); if (item == 'rate') rate = val}
    else if (item == 'rate') {defRate = val; settings.defRate = String(defRate); localStorage.setItem(folder, JSON.stringify(settings))}}


  function closePlayer() {
    lastSeek = myPlayer.currentTime
    if (observer) observer.disconnect()
    if (captions) srt.removeEventListener('scroll', capTime)
    if (!thumbSheet) messages += '#History#'+lastSeek.toFixed(1)+'#'+index+'#'
    if (editing) saveText()						// text file or caption has been edited
    mySeek.style.height = 0
    myVig.style.opacity = 0
    if (thumbSheet) {zoom = 1.8} else zoom = 0.9
    myPlayer.style.transition = 'opacity 0.25s, transform 0.25s'
    myVig.style.transition = 'opacity 0.4s, transform 0.4s'
    myPlayer.style.transform = myVig.style.transform = 'scale('+scaleY*skinny*zoom+','+scaleY*zoom+')'
    cue = Click = playing = start = captions = thumbSheet = 0
    myDur.innerHTML = ''
    overText = 0
    srt.style = myNav.style = ''
    myPlayer.style.opacity = 0
    setTimeout(function() {						// fadeout before close
      myPlayer.style.zIndex = -1
      myMask.style = ''
      zoom = 1
      myPlayer.pause()
      if (title.getBoundingClientRect().top>innerHeight-50) {
        title.scrollIntoView()						// scroll last media into view
        myContent.scrollBy(0,-400)}},300)}				// time for htm to render


  function navButtons() {						// innerHTML values
    if (!myTitle.value || type == 'document') {myCue.innerHTML = myCap.innerHTML = ''; return}
    myCap.innerHTML = 'Captions'
    if (!srt.value) myCap.innerHTML = 'Add Captions'
    else if (captions) myCap.innerHTML = 'Add Caption '+myPlayer.currentTime.toFixed(1)
    if (playing) {myCue.innerHTML = 'New Cue'} else myCue.innerHTML = 'Cues'
    end = dur.toFixed(1)
    time = myPlayer.currentTime.toFixed(1)
    if (time > cue + 1) {end = time; time = cue}
    else if (time < cue - 1) end = cue
    else if (time >= cue) time = cue
    else {time = '0.0'; end = cue}
    if (cue) myCue.innerHTML = ''
    else if (playing && dur) myCue.innerHTML = 'Add Cue '+formatTime(myPlayer.currentTime)
    else myCue.innerHTML = 'Show Cues'
    if (cue && thumb.style.skinny) myCap.innerHTML = 'Cue Skinny ' + skinny
    else if (cue && thumb.style.rate) myCap.innerHTML = 'Cue Speed ' + rate
    else if (cue && end != dur) myCap.innerHTML = 'GoTo ' + formatTime(end)}


  function cueButton() {						// context menu Cue button
    if ((thumb.style.skinny || thumb.style.rate) && !thumb.style.posted) {capButton(); cue = 0}
    else if (!cue) {cue = 0.1 + Math.round(10*myPlayer.currentTime)/10; return}
    Play()}


  function capButton() {						// context menu Caption button
    x = cue+'|goto|'+myPlayer.currentTime.toFixed(1)
    if (thumb.style.skinny) x = cue+'|skinny|'+thumb.style.skinny
    if (thumb.style.rate) x = cue+'|rate|'+thumb.style.rate
    thumb.style.skinny = thumb.style.rate = 0
    if (cue) {cue = 0; messages += '#addCue#' + x + '#' + index + '#'} // add cues to media
    else if (captions) {editing = srt.scrollTop; srt.focus(); srt.setRangeText('\n' + myPlayer.currentTime.toFixed(2)+ '\n\n')}
    else if (myTitle.value) if (!srt.value || captions) {inca('newCap',0,index)} else {openCap(); Play()}
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
    if (!myTitle.value || gesture) return
    if (!playing && dur < 200) myPlayer.currentTime = 0
    inca('Favorite',myPlayer.currentTime.toFixed(1),index,srt.scrollTop.toFixed(0))
    favicon.innerHTML = '&#10084'}					// heart symbol on htm thumb


  function mediaEnded() {						// media finished playing
    if (playlist.match('/inca/music/')) {
      if (getParameters(index += 1)) {Play(); myPlayer.play()} else closePlayer(); return}
      else if (block<30) {myPlayer.currentTime = start; myPlayer.play()}
      else {myPlayer.currentTime = dur+2; myPlayer.pause(); block = 60}}


  function mouseBack() {
    if (playing) closePlayer()						// close player and send messages to inca
    else if (longClick) window.close()
    else if (myNav.style.display) myNav.style.display = null
    else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)	// else scroll to page top
    else inca('Reload')}						// or finally, reload page & clear selected


  function overThumb(id) {
    index = id
    if (Click) return							// faster for click & slide selecting
    getParameters(id)
    thumb.style.opacity = 1
    if (!listView) {thumb.load(); thumb.currentTime = defStart + 0.04}}


  function context(e) {							// right click context menu
    block = 200
    zoom = 1
    myNav.style.display = 'block'
    mouseMove(e)
    if (myTitle.value) {myPic.style.display = 'block'; myNav.style.left = xPos-70 + 'px'; myNav.style.top = yPos-24 + 'px'}
    else {myPic.style.display = null; myNav.style.left = xPos-68+'px'; myNav.style.top = yPos-28+'px'}}


  function Ffmpeg(id) {
    let target = cue + '|' + id
    let select = selected || overMedia || playing || 0
    inca('Ffmpeg', target, select, myPlayer.currentTime.toFixed(1))}


  function capTime() {							// from srt scroll listener
    if (overText) {							// set player time to scrolled caption
      for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i][1] > srt.scrollTop) {myPlayer.currentTime = timestamps[i][0]; timout = 12; break}}}}


  function saveText() {
    srt.value = srt.value.replaceAll('#', '𝌇')							// because # is used as delimiter
    messages += '#Scroll#'+editing.toFixed(0)+'|'+srt.offsetWidth+'|'+srt.offsetHeight+'#'+index+'#'
    messages += '#capEdit#' + srt.value + '#' + index + '#'		// edited text
    editing = 0
    inca('Null',index,'',1)}						// send messages (render htm keep index highlight)


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


  function convertSrt() {
    if (type == 'document') return
    let lines = srt.value.trim().split('\n')
    srt.value = ''
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\d+$/)) continue
      let match = lines[i].match(/^(?:(\d{2}):)?(\d{2}):(\d{2}),(\d{3})\s-->\s/)
      if (match) {
        let [hours, minutes, seconds, milliseconds] = match.slice(1).map(val => Number(val) || 0)
        let totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
        srt.value += totalSeconds.toFixed(1) + '\n'}
      else srt.value += lines[i] + '\n'}
    getTimestamps()}


  function getTimestamps() {
    let ht = 20
    let time = 0
    timestamps = []
    let scroll = -54
    let array = srt.value.split('\n')
    for (let i = 0, j = 0; i < array.length; i++) {
      if (!array[i].length) {scroll += ht; continue}
      if (/^\d+\.\d$/.test(array[i])) {scroll += ht; time = array[i]; continue}
      scroll += ht * Math.ceil(getWidth(array[i]) / (srt.offsetWidth - 31))
      timestamps[j++] = [time, scroll.toFixed(0)]}}


  function Cancel() {if (myCancel.innerHTML != 'Sure ?') {myCancel.innerHTML = 'Sure ?'} else {editing = 0; inca('Reload',index)}}
  function Flip() {xPos = 0; skinny *=- 1; thumb.style.skinny = skinny; getParameters(index); positionMedia(0.4)}
  function Time(z) {if (z<0) return '0:00'; let y = Math.floor(z%60); let x = ':'+y; if (y<10) {x = ':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i = 1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function Pause() {if (!(editing && overText) && !thumbSheet && playing && myPlayer.paused) {myPlayer.play()} else myPlayer.pause()}




