// server optimization security
// maybe add a .bak to m3u, txt files saved
// change folder structure help / apps etc
// server set to 0.0.0.0 from 127.0.0.1
// firewall wf.msc inbound rule, create ASUS hotspot and connect other machine to it
// localhost to 192.168.137.1 in ahk
// safari swipes etc not work and mouse back not work on windows client 
// server lockups
// can favs and processed remove paths entirely




  let entry = 0								// thumb container
  let thumb = 0								// thumb element
  let title = 0								// title element
  let srt = 0								// txt or subtitle element
  let favicon = ''							// favorite or cc icon
  let capTime = ''							// srt time element
  let capText = ''							// srt caption text element
  let wheel = 0								// wheel count
  let wheelDir = 0							// wheel direction
  let index = 1								// thumb index (e.g. thumb14)
  let view = 14								// thumb size (em)
  let listView = 0							// list or thumb view
  let page = 1								// html media page
  let pages = 1								// how many htm pages of media
  let filt = 0								// media list filter
  let playlist								// full .m3u filepath
  let captions = 0							// captions enabled
  let type = ''								// audio, video, image, document...
  let cue = 0								// cue time ref
  let cues = ''								// list of cue actions at media times
  let playing = 0							// myPlayer active
  let thumbSheet = 0							// 6x6 thumbsheet mode
  let Click = 0								// state is cleared after clk up
  let lastClick = 0							// state is preserved after up
  let navStart = 0							// last myPlayer time
  let lastMedia = ''							// previous media
  let longClick = 0							// state is preserved
  let gesture = 0							// click and slide event
  let searchbox = ''							// search input field
  let renamebox = ''							// media rename input field
  let selected = ''							// list of selected media in page
  let overMedia = 0							// over thumb or myPlayer
  let overText = 0							// text input fields, allow cut paste
  let editing = 0							// editing text active
  let messages = ''							// message digest to inca.exe
  let Zindex = 3							// element zIndex
  let rect								// element dimensions
  let size = 0								// file size (from inca)
  let dur = 0								// duration (from inca)
  let rate = 1								// myPlayer speed
  let skinny = 1							// media width
  let scaleX								// myPlayer width (skinny)
  let scaleY								// myPlayer height (screen ratio)
  let zoom = 1								// context myPic zoom
  let xw = 0.5								// cursor over window ratio
  let yw = 0.5
  let xm = 0								// cursor over media ratio
  let ym = 0
  let xpos = 0								// cursor xy in pixels
  let ypos = 0
  let Xref = 0								// click cursor xy
  let Yref = 0
  let timout = 0							// -- every 90mS  eg for hide cursor
  let block = 0								// block wheel timer
  let aspect = 1							// media width to height ratio
  let mediaX = 0							// centre of myPlayer
  let mediaY = 0
  let Xoff = 0								// fullscreen offsets
  let Yoff = 0
  let Zoff = 94								// top menu fullscreen offset
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed
  let pitch = 0								// default pitch
  let muted = 0
  let defPause = 0							// default pause state
  let pause = 0								// current pause state
  let items = ['&hellip;', 'mp4', 'mp3', 'Join', 'Vibe']		// ribbon drop down menu
  let ix = 0								// index to items
  let observer								// see if myPlayer is visible


  let intervalTimer = setInterval(timerEvent,90)			// background tasks every 90mS
  if (innerHeight>innerWidth) {scaleX=0.64; scaleY=0.64}		// screen is portrait
  else {scaleX=0.5; scaleY=0.5}


  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('keydown', keyDown)
  myPlayer.addEventListener('ended', mediaEnded)
  document.addEventListener('contextmenu', (e) => {if (yw > 0.05 && !overText) e.preventDefault()})


  function mouseDown(e) {
    longClick = gesture = 0
    Click = lastClick = e.button+1
    if (Click == 2) e.preventDefault()					// forward and back mouse buttons
    timout=6; Xref=xpos; Yref=ypos
    clickTimer = setTimeout(function() {				// detect long click
      longClick = Click; clickEvent(e)},300)}


  function mouseUp(e) {
    if (!Click) return							// stop re-entry also if new page load
    if (!myInput.matches(':hover'))
      myInput.value = window.getSelection().toString() || myInput.value	// click to select text
    clearTimeout(clickTimer)						// longClick timer
    if (!longClick) clickEvent(e)					// process click event
    Click=0; wheel=0; gesture=0}


  function keyDown(e) {						// keyboard events
    if (e.key == 'Backspace' && captions && type != 'document') joinCap()
    else if (e.code == 'ArrowRight' && e.altKey) {lastClick=5; clickEvent(e)}
    else if (e.key == 'Pause' || (e.code == 'ArrowLeft' && e.altKey)) mouseBack()
    else if (e.code == 'Space' && !overText) togglePause()
    else if (e.key == 'Enter') searchBox()}


  function clickEvent(e) {
    let id = e.target.id 								// id under cursor
    if (gesture || id == 'myFlip') return
    if (!gesture && longClick == 1 && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (playing && capText && (!capText.innerHTML || capText.innerHTML=="<br>")) {capTime.remove(); capText.remove(); capText=''; return}
    if (longClick==1 && !gesture && !overText && (favicon.matches(':hover') || id=='myCap' || id=='myCue' || type=='document')) {
      Click=0; inca('Notepad',id,index); return}
    if (id == 'myMute' || id == 'mySave' || id == 'myDelete' || id == 'myIndex') return
    if (id == 'myForward') {newCap(0.4); return}					// move caption forward in time
    if (id == 'myBack') {newCap(-0.4); return}
    if (id == 'myFavorite') {addFavorite(); return}
    if (id == 'myPitch') {pitch=0; localStorage.setItem('pitch'+folder, 0); return}
    if (id == 'myMore') {
      if (ix == 0) {inca('Settings'); return}
      if (ix == 1) {inca('mp4', myPlayer.currentTime.toFixed(2), lastMedia, cue); cue=0}
      if (ix == 2) {inca('mp3', myPlayer.currentTime.toFixed(2), lastMedia, cue); cue=0}
      if (ix == 3) inca('Join')
      if (ix == 4) inca('Vibe')
      selected = ''; selectAll(); selectAll()
      return}
    if (lastClick == 3) {								// Right click context
      if (yw < 0.06 || overText) return
      if (!myNav.style.display) {context(e); return}}
    if (lastClick == 4) {mouseBack(); return}						// Back Click
    if (lastClick == 2) {  								// Forward click
      if (editing) inca('Null')								// save text
      if (myMenu.matches(':hover')) return
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// list/thumb view
      else if (longClick) {index--} else index++}					// next, previous media
    if (lastClick == 1) {
      if (!longClick) {
        if (id == 'mySelect') {if (myTitle.value) {sel(index)} else selectAll(); return}
        if (id == 'mySkinny') {updateCue('skinny',1); return}
        if (id == 'mySpeed') {updateCue('rate',1); return}}
      else if (overText) {searchBox(); return}
      if (id == title.id) {thumb.currentTime=thumb.style.start; return}
      if (!playing && !overMedia && !myNav.style.display) return
      if (playing && overText) {playCap(id); return}					// play at caption
      if (longClick && !playing && !overMedia && !myNav.style.display) return
      if (longClick && myTitle.value) {myPlayer.src=myPlayer.poster=''; thumbSheet ^= 1}
      else if (!getStart(id)) return}
    if (!getParameters(index)) {index = lastMedia; closePlayer(); return}		// end of media list
    if (lastClick != 1) thumb.currentTime = thumb.style.start				// default start time
    if (lastClick) Play()}


  function getStart(id) {
    if (myTitle.value && !dur) return 1					// image / text
    if (defPause && myPlayer.currentTime > dur-0.5) myPlayer.load()
    if (id == 'myTitle') thumb.currentTime = thumb.style.start
    else if (id == 'myPic') thumb.currentTime = navStart
    else if (id == 'myNav') thumb.currentTime = 0 			// white space in context menu or thumbsheet
    else if (thumbSheet) {						// clicked thumb on 6x6 thumbsheet
      if (skinny < 0) xm = 1-xm						// if flipped media
      let row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
      let col = Math.ceil(xm * 6)
      let offset = dur > 60 ? 20 : 0					// skip movie credits...
      let ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200						// see index() in inca.ahk to explain
      if (!overMedia) thumb.currentTime = 0.1
      else thumb.currentTime = offset - (ps * offset) + dur * ps
      thumbSheet = 0}
    else if (playing && overMedia && (ym > 0.9 || yw > 0.95)) {
      if (xm < 0.1) myPlayer.currentTime = thumb.style.start
      else myPlayer.currentTime = xm * dur
      myPlayer.play(); return}						// return and quit
    else if (playing) {togglePause(); return}
    else if (myNav.style.display) return
    return 1}								// return and continue


  function Play() {
    positionMedia(0)
    myPlayer.style.opacity = 0
    if (!playing && !playlist && !favicon.textContent.includes('\u2764') && dur < 200) thumb.currentTime = 0
    if (!thumbSheet) {
      myPlayer.poster=thumb.poster
      let x = thumb.style.start
      if (thumb.currentTime > x && thumb.currentTime < x + 1.2) thumb.currentTime = x
      myPlayer.currentTime=thumb.currentTime}
    thumb.pause()
    myPlayer.pause()
    myPlayer.muted = muted
    if (el=document.getElementById('title'+lastMedia)) el.style.color=null
    title.style.opacity = 1; title.style.color='pink'
    if ((el=document.getElementById('srt'+lastMedia)) && playing && index!=lastMedia) {	// hide last caption
      el.style.display = null
      if (captions && srt.innerHTML && lastClick==2) openCap()}		// next / back
    lastMedia = index
    pause = defPause
    if (scaleY < 0.17) scaleY = 0.5					// return zoom after captions
    if (lastClick) myNav.style.display=null
    myMask.style.pointerEvents='auto'					// stop overThumb() triggering
    if (!longClick && lastClick==1 && srt.innerHTML && (favicon.matches(':hover') || type=='document')) openCap()
    if ((captions && srt.innerHTML) || type=='audio' || playlist.match('/inca/music/')) scaleY=0.16
    if (playlist.match('/inca/music/')) {pause=0; myPlayer.muted=0}
    if (!thumbSheet && dur && !pause && !cue) myPlayer.play()
    myPlayer.style.zIndex=Zindex
    if (thumb.src.slice(-3)=='txt') srt.style.padding = 0
    if (thumb.src.slice(-3)=='mp3') myPlayer.style.borderBottom = '2px solid pink'
    else myPlayer.style.border=null
    observer = new IntersectionObserver(([entry]) => {if (!entry.isIntersecting) mediaX = mediaY = 500}).observe(myPlayer)
    if (lastClick) positionMedia(1)					// fade up
    if (pitch || myPlayer.context) {					// from pitch.js in inca\cache\apps
      setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    myPlayer.style.opacity = 1
    myPlayer.volume=0.1							// triggers volume fadeup
    myCues('scroll')							// scroll to last position in document
    playing=1; block = 160}


  function mouseMove(e) {
    if (innerHeight==outerHeight) {xpos=e.screenX; ypos=e.screenY}	// fullscreen detection/offsets
    else {xpos=e.clientX; ypos=e.clientY}
    timout=6
    setPic()								// in context menu sets thumb sprite
    mySelected.style.left = xpos +30 +'px'
    mySelected.style.top = ypos -20 +'px'
    let x = Math.abs(xpos-Xref)
    let y = Math.abs(ypos-Yref)
    if (x+y > 7 && Click && !gesture) {					// gesture (Click + slide)
      gesture = 1
      if (captions && !cues.textContent.match(srt.offsetWidth)) editing = index
      if (!playing && overMedia) sel(index)
      if (myNav.style.display) {x=myNav.getBoundingClientRect(); Xref=(xpos-x.left)/skinny; Yref=ypos-x.top}}
    if (!gesture || !Click) {gesture=''; return}
    if (Click==1 && myPic.matches(':hover')) {myNav.style.left = xpos-Xref+"px"; myNav.style.top = ypos-Yref+"px"}  // move context menu
    else if (Click==1 && playing && (overMedia || !captions)) {		// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.mediaX = mediaX.toFixed(0)
      localStorage.mediaY = mediaY.toFixed(0)
      Xref=xpos; Yref=ypos
      positionMedia(0)}}


  function wheelEvent(e) {
    e.preventDefault()
    let id = e.target.id 						// Use e.target for faster hover detection 
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < block) return
    block=100
    let wheelUp = wheelDir * e.deltaY > 0
    if (id=='myMore') {							// More option list
      if (wheelUp) {ix++} else ix--
      if (ix > 4) ix = 4; if (ix < 0) ix = 0
      myMore.innerHTML = items[ix]}
    else if (id=='myPage') {						// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--}
    else if (id=='myType'||id=='myAlpha'||id=='myDate'||id=='mySize'||id=='myDuration'||id=='mySearch') {
      if (wheelUp) filt++ 
      else if (filt) filt--						// filter
      if ((id=='myAlpha' || id=='mySearch') && filt > 26) filt=26
      if (id=='myType' && filt > 4) filt=4
      filter(id)}
    else if (id =='mySpeed') {						// rate
      if (wheelUp) {rate -= 0.01} else rate += 0.01
      updateCue('rate',rate)}
    else if (id == 'mySkinny' && myTitle.value) {			// skinny
      if (wheelUp) {skinny -= 0.01} else skinny += 0.01
      updateCue('skinny',skinny)}
    else if (id == 'myPitch') {						// pitch
      if (wheelUp) {pitch += 1} else pitch -= 1
      pitch = 1*pitch.toFixed(0)
      localStorage.setItem('pitch'+folder, pitch)
      setupContext(myPlayer)
      myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    else if (id=='myThumbs') { 						// thumb size
      let x=view; let z=wheel/1500
      if (x<98 && wheelUp) x *= 1+z
      else if (!wheelUp) x /= 1+z
      if (x<8) x=8
      view=x; localStorage.setItem('pageView'+folder, x); setWidths(index,36)
      block=8}
    else if (!playing && id=='myWidth') {				// page width
      let x = 1*myView.style.width.slice(0,-2); let z=wheel/2000
      if (wheelUp) x *= 1+z
      else if (!wheelUp && x / 1+z > 100) x /= 1+z
      if (x > innerWidth) x = innerWidth
      myView.style.width = x.toFixed(2)+'px'
      localStorage.setItem('pageWidth'+folder, x)
      block=8}
    else if (id == 'myPic') {  						// zoom context pic
      if (wheelUp) {zoom*=1.1} else if (zoom>1.5) zoom*=0.9
      myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'
      block=80}
    else if (id == 'mySelect' || id == 'myTitle') {
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index-- 		// next - previous
      Click = longClick = lastClick = 0
      if (getParameters(index) && playing) Play()
      if (!thumbSheet) myPlayer.currentTime = thumb.style.start
      positionMedia(0); setPic(); block=140}
    else if (dur && !thumbSheet && (!overMedia || yw>0.8)) {		// seek 
      timout = 6
      interval = 4
      if (wheel < 99) interval = 0.2
      if (dur < 121) interval = 0.1
      if (myPlayer.paused) interval = 0.0333
      if (wheelUp) myPlayer.currentTime += interval
      else if (!wheelUp) myPlayer.currentTime -= interval
      myPlayer.addEventListener('seeked', () => {block=20}, {once: true})
      block=250}
    else if (!myNav.style.display && overMedia) {			// zoom myPlayer
      let x=0; let y=0; let z=0
      z=wheel/2000
      if (scaleY > 0.7) {x = mediaX-xpos; y = mediaY-ypos}
      if (wheelUp) {mediaX+=x*z; mediaY+=y*z; scaleY*=(1+z)}
      else if (!wheelUp) {mediaX-=x*z; mediaY-=y*z; scaleY/=(1+z)}
      if (scaleY<0.16) scaleY=0.16
      scaleX=skinny*scaleY; positionMedia(0); block=20}
    wheel=0}


  function timerEvent() { 						// every 90mS
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    let top = 0; let el = myPlayer
    if (myNav.style.display) el = myPic
    else if (!playing) el = thumb
    rect = el.getBoundingClientRect()
    if (!myNav.matches(':hover')) myNav.style.display = null
    else if (!myTitle.value || type=='document') myNav.style.width = 84 + 'px'
    else {myNav.style.width = rect.width + 100 + 'px'; if (myTitle.matches(':hover')) myPic.style.display='block'}
    if (!myNav.style.display) myTitle.value = (overMedia || playing) ? title.value : ''
    xm = (xpos - rect.left) / rect.width
    ym = (ypos - rect.top) / rect.height
    if (block>=30) block-=10						// wheel blocking 
    if (wheel>=10) wheel-=10
    if (timout) timout--
    navButtons()
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (!playing || thumbSheet || overText) myBody.style.cursor=null	// show default cursor
    else if (!timout) myBody.style.cursor='none'			// hide cursor
    else myBody.style.cursor='crosshair'				// moving cursor over player
    if (editing) {capMenu.style.display='flex'} else capMenu.style.display='none'
    if (captions) Captions()
    if ((listView && thumb.style.opacity==1) || favicon.matches(':hover')) overMedia = index
    else if (myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else overMedia = 0
    if (pages > 1) myPage.innerHTML = page+' of '+pages
    mySkinny.innerHTML = ''
    mySkinny.style.color = null
    mySpeed.innerHTML = defRate === 1 ? 'Speed' : 'Speed ' + defRate
    myPitch.innerHTML = pitch === 0 ? 'Pitch' : 'Pitch ' + pitch
    if (myTitle.value) {
      myFlip.innerHTML = 'Flip'
      mySelect.style.outline = myPlayer.style.outline = title.style.outline
      mySkinny.innerHTML = skinny === 1 ? 'Skinny' : `Skinny ${skinny.toFixed(2)}`
      mySkinny.style.color = skinny === 1 ? null : 'red'
      mySpeed.innerHTML = rate === 1 ? 'Speed' : `Speed ${rate.toFixed(2)}`}
    else myFlip.innerHTML = mySelect.style.outline = null
    if (favicon.innerHTML.match('\u2764')) myFavorite.innerHTML='Fav &#x2764'
    else myFavorite.innerHTML='Fav'
    if (!seekBar()) myProgress.style.height = mySeekbar.style.height = null
    let qty = selected.split(',').length - 1 || 1;
    if (myTitle.value || selected) {myDelete.innerHTML='Delete ' + qty; myIndex.innerHTML='Index ' + qty}
    else {myDelete.innerHTML = null; myIndex.innerHTML = 'Index'}
    if (muted) {myMute.style.color='red'} else myMute.style.color=null
    if (defPause) {myPause.style.color='red'} else myPause.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (!thumbSheet && captions) srt.style.opacity=1
    else srt.style.opacity=null
    if (myPlayer.style.opacity === "0") {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) {myPlayer.volume *= 1.25} else myPlayer.volume = 1	// fade sound in/out
    if (captions && el == myPlayer) {
      if (playing) {top = rect.bottom} else top = 300
      capMenu.style.top = top + 24 + srt.offsetHeight + 'px'; capMenu.style.left = mediaX -Xoff - 85 + 'px'
    srt.style.top = top + 'px'; srt.style.left = mediaX - Xoff - srt.offsetWidth / 2 + 'px'}
    if (playing) {
      positionMedia(0)
      myMask.style.pointerEvents='auto'
      if (playlist.match('/inca/music/')) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
      if (!myNav.style.display && !thumbSheet) thumb.currentTime = myPlayer.currentTime
      if (type!='image' && !dur) dur = myPlayer.duration		// just in case
      if (cues.innerHTML && !thumbSheet && type !='image') myCues(myPlayer.currentTime)
      myPlayer.playbackRate=rate}
    else {
      myMask.style.pointerEvents = null
      if (myNav.style.display) myMask.style.opacity = 0.5
      else myMask.style.opacity=0
      if (thumb.muted) {thumb.playbackRate=0.7} else thumb.playbackRate=1
      if (timout == 4 && overMedia && dur) { if (ym>0.75 && ym<1) {
          if (xm > 0.2) myPlayer.currentTime = thumb.currentTime = dur * xm
          else myPlayer.currentTime = thumb.currentTime = thumb.style.start}}
      if (!listView && thumb.readyState===4 && thumb.duration && overMedia) thumb.play() 
      else thumb.pause()}}


  function positionMedia(time) {					// position myPlayer in window
    if (!screenX) {Xoff = 0; Yoff = 0; myPanel.style.top = 44 + Zoff + 'px'; myView.style.top = '287px'}
    else {Xoff=screenX; Yoff=outerHeight-innerHeight; Zoff=outerHeight-innerHeight; myPanel.style.top='50px'; myView.style.top='200px'}
    if (!mediaX) {mediaX = 1 * (localStorage.mediaX || 500); mediaY = 1 * (localStorage.mediaY || 400)}
    let offset = captions && srt.innerHTML ? 140 : 0
    myPlayer.style.left = (mediaX - Xoff) - myPlayer.offsetWidth / 2 + "px"
    myPlayer.style.top = (mediaY - Yoff) - myPlayer.offsetHeight / 2 - offset + "px"
    myPlayer.style.transition = time + 's'
    skinny = thumb.style.skinny || skinny
    let zoom = scaleY
    if (thumbSheet) if (scaleY<0.5) {zoom=1} else zoom = scaleY * 2
    myPlayer.style.transform = "scale(" + skinny * zoom + "," + zoom + ")"}


  function seekBar() {							// progress bar beneath player
    if (type=='image') return
    let el = myPlayer
    if (myPic.matches(':hover')) el=myPic
    else if (Click || overText || thumbSheet || !playing || !myPlayer.duration || (!timout&&!cue)) return
    let cueX = rect.left
    let x = Math.round(el.currentTime*100)/100
    mySeekbar.style.width = rect.width * xm + 'px'
    let cueW = 0.95 * rect.width * el.currentTime / dur
    if (cue && cue <= x) {
      cueX = mediaX - rect.width / 2 + rect.width * cue / dur
      cueW = rect.width * (el.currentTime - cue) / dur
      if (cue < x + 1 && cue > x - 1) {
        cueW = rect.width * (dur - cue) / dur}}
    else if (cue) {
      cueX = rect.left + rect.width * el.currentTime / dur
      cueW = rect.width * (cue - x) / dur
      if (cue < 1 + x) {
        cueX = rect.left; cueW = rect.width * el.currentTime / dur}}
    if (el==myPic || (overMedia && ym>0.9)) myProgress.style.height = mySeekbar.style.height = '5px'
    else {myProgress.style.height = '5px'; mySeekbar.style.height = null}
    if (rect.bottom > innerHeight) myProgress.style.top = mySeekbar.style.top = innerHeight -15 +'px'
    else myProgress.style.top = mySeekbar.style.top = (rect.top + rect.height - myProgress.offsetHeight) + 'px';
    myProgress.style.left =  mySeekbar.style.left = cueX +'px'
    myProgress.style.width = cueW +'px'
    return 1}


  function setThumb() {							// sets src, poster, thumbsheet & dimensions
    let sheet = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheet src folder
    sheet = sheet.replace("/temp/history/", "/thumbs/")			// in case history playlist
    let time = sheet.split('%20').pop().replace('.jpg', '')		// get fav start time from poster filename
    if (!isNaN(time) && time.length > 2 && time.includes('.')) {	// very likely a 'fav' suffix timestamp
      sheet = sheet.replace('%20' + time, '')}				// so remove timestamp from filename
    if (thumbSheet) {myPlayer.poster = sheet} else myPlayer.poster=''	// use 6x6 thumbsheet as poster
    if (!thumb.src || myPlayer.src!=thumb.src) myPlayer.src=thumb.src
    if (type!='image') myPic.poster=''
    else myPic.poster=thumb.poster
    if (type=='video') myPic.style.backgroundImage = 'url(\"'+sheet+'\")' // use 6x6 thumbsheet for preview sprites
    else myPic.style.backgroundImage = ''
    aspect = thumb.offsetWidth/thumb.offsetHeight
    let x = y = z = innerHeight
    if (aspect < 1) {x=z*aspect} else y=z/aspect			// portrait or landscape - normalised size
    myPlayer.style.width = x +'px'; myPlayer.style.height = y +'px'	// normalise player size
    if (aspect < 1) {y=120; x=120*aspect} else {y=120/aspect; x=120}	// set myPic to max 180px
    myPic.style.width = x + 'px'
    myPic.style.height = y + 'px'					// context menu thumb 
    myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'
    myPic.style.backgroundPosition = '0% 0%'				// sets to frame 1 of 6x6 thumbSheet
    if (thumbSheet) myPlayer.load()					// show poster
    else myPlayer.currentTime=thumb.currentTime}			// fast start play


  function setPic() {							// sets context image based on cursor over myPic
    let x = Math.max(0, Math.min(1, ((xpos - rect.left) / rect.width + 0.02) ** 2 - 0.02))
    let thumbIndex = Math.ceil(x * 35)
    let z = (5 * (thumbIndex + 1) - 1) / 200
    let offset = dur > 60 ? 20 : 0
    navStart = offset - (z * offset) + dur * z
    if (!thumbIndex) {
      navStart = myPic.currentTime = thumb.currentTime			// in case favorite start
      if (ym > 0.8) navStart = myPic.currentTime = thumb.style.start
      if (myPic.src != thumb.src) {myPic.src = thumb.src; myPic.currentTime = thumb.currentTime; return}}
    else myPic.src=''
    if (myPic.matches(':hover'))
       myPic.style.backgroundPosition = `${(thumbIndex % 6) * 20}% ${Math.floor(thumbIndex / 6) * 20}%`
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


  function context(e) {							// right click context menu 
    block=200
    if (!playing) myPic.style.display='block'
    else myPic.style.display=null
    if (overMedia || playing) {navStart = thumb.style.start; myNav.style.background='#0e0c05cc'}
    else {myPic.style.display=null; mySelect.innerHTML='Select'; myNav.style.background=null}
    zoom = 1.5
    myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'	// pop thumb out a little
    if (myTitle.value) {myNav.style.left=xpos-60 + 'px'; myNav.style.top = ypos-28 + 'px'}
    else {myNav.style.left=xpos-68+'px'; myNav.style.top=ypos-28+'px'}
    myNav.style.display='block'}


  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing) {							// text or caption has been edited
      messages += '#Scroll#'+srt.scrollTop.toFixed(0)+'|'+srt.offsetWidth+'|'+srt.offsetHeight+'#'+editing+'#'
      messages += '#capEdit##' + editing + '#' + document.getElementById('srt'+editing).innerHTML.replaceAll('#', '*')
      editing = 0}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if ((el.style.rate || el.style.skinny) && !el.style.posted) {
        messages += '#editCues#'+el.style.rate+','+el.style.skinny+','+'#'+i+'#'; el.style.posted=1}}
    if (!select) {select=''} else {select=select+','}
    if (selected && command != 'Favorite') select = selected
    if (!value) value = ''
    if (!address) address = ''
    if (isNaN(value)) value=value.replaceAll('#', '*')			// because # is used as delimiter
    messages += '#'+command+'#'+value+'#'+select+'#'+address
    if (command=='Delete' || command=='Rename' || (select && command=='Path')) {
      let media = document.querySelectorAll('img[src], video[src], source[src], span.favicon');
      media.forEach(element => {element.src = ''; element.remove()})}
    fetch('http://localhost:3000/generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
      .then(response => {if (response.status === 204) {return} return response.json()})
      .then(data => {
        let newUrl = encodeURI(`http://localhost:3000${data.url}`)
        if (newUrl === window.location.href) window.location.href = newUrl
        else if (window.open(newUrl, '_blank')) if (command != 'SearchBox' && lastClick != 2) window.close()})
    messages=''}


  function getParameters(i) {						// get media parameters
    if (!(document.getElementById('thumb'+i))) return			// end of media list
    if (!(favicon=document.getElementById('myFavicon'+i))) favicon=''	// fav or cc icon
    thumb = document.getElementById('thumb'+i)				// htm thumb element
    entry = document.getElementById('entry'+i)				// thumb and title container
    title = document.getElementById('title'+i)				// htm title element
    cues = document.getElementById('cues'+i)				// media defaults and time cues
    srt = document.getElementById('srt'+i)				// txt or caption element
    let params = entry.dataset.params.split(',')
    type = params[0]							// media type eg. video
    thumb.style.start = Number(params[1]) + 0.02			// start time
    dur = Number(params[2])						// duration
    size = Number(params[3])						// file size
    skinny = 1; rate = defRate						// reset before new cues read
    if (cues && cues.innerHTML) myCues(0)				// get 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x			// custom css holds edits
    x = Number(thumb.style.skinny); if (x) skinny = x
    thumb.style.transform='scale('+skinny+',1)' 			// set thumb width
    if (index) setThumb()   						// src, poster
    return 1}


  function globals(pg, ps, fo, wd, mu, pa, so, fi, lv, se, pl, ix) {	// import globals from inca.exe
    folder=fo; page=pg; pages=ps; filt=fi; wheelDir=wd;
    defPause=pa; listView=lv; selected=se; playlist=pl
    if (mu=='yes') {muted=1} else muted=0
    let key = 'pageWidth'+folder
    let x = localStorage.getItem(key)
    if (isNaN(x) || x<100 || x>innerWidth) localStorage.setItem(key, 600) // default htm width em
    pageWidth = 1*localStorage.getItem(key)
    myView.style.width = 1*localStorage.getItem(key)+'px'
    key = 'pageView'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<6 || x>100) localStorage.setItem(key, 10)		// default thumb size 10em
    view = 1*localStorage.getItem(key)
    key = 'defRate'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<0.2 || x>5) localStorage.setItem(key, 1)		// default speed 1
    defRate = 1*localStorage.getItem(key)
    key = 'pitch'+folder
    x = 1*localStorage.getItem(key)
    if (isNaN(x) || x<1 || x>2) localStorage.setItem(key, 0)		// default pitch 0
    pitch = 1*localStorage.getItem(key)
    filter('my'+so)							// show filter heading in red
    for (x of selected.split(',')) {
      if(el=document.getElementById('title'+x)) {el.style.outline = '0.1px solid red'; el.style.opacity=1}}			
    for (index=0, n=1; getParameters(n); n++) {}			// process null cues (eg. skinny, start, rate)
    if (!ix) index=1
    else index=ix
    lastMedia=ix
    Yoff=outerHeight-innerHeight
    setWidths(1,1000)							// set htm thumb widths and heights 
    getParameters(index)						// initialise current media
    if (ix && title) {							// eg. after switch thumbs/listview
      title.style.opacity=1						// highlight thumb
      title.style.color='pink'
      title.scrollIntoView()						// scroll to thumb
      myContent.scrollBy(0,-400)}}


  function setWidths(start, qty) {					// set thumb sizes in htm
    if (start<16) start=1
    for (i=start; el=document.getElementById('entry'+i); i++) {		// until end of list
      if (i-start>qty) break
      el2 = document.getElementById('thumb'+i)
      x = el2.offsetWidth/el2.offsetHeight				// for portrait/landscape thumb layout
      if (!listView) {
        if (x>1) el.style.width=view+'em'
        else el.style.width=x*view+'em'
        if (x>1) {el.style.height=view/x+'em'} else el.style.height=view+'em'}}}


  function myCues(time) { 						// media scrolls, speed, skinny, pauses etc.
    let src=''; let tm=''						// for swap out media above srt/txt
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k=0; k<x.length; k++) {					// process each line entry
      let el = x[k].split('|')						// time[0] cue[1] value[2] period[3]
      if (el[1]=='scroll' && time=='scroll') {
        if (!srt.scrollTop) srt.scrollTo(0,el[2])			// scroll to text position
        srt.style.width = (el[3] == null || el[3] < 200) ? '200px' : el[3] + 'px'	// text area size
        srt.style.height = (el[4] == null || el[4] < 200) ? '200px' : el[4] + 'px'}
      if (el[1]=='media' && el[3] && srt.scrollTop.toFixed(0) >= 1*el[0]) {src = el[2]; tm = 1*el[3]}	// swap media
      if (el[1] && 1*el[0] > time-0.1 && 1*el[0] < time+0.1) {
        if (el[1]=='next') {lastClick=2; clickEvent(0)}
        else if (el[1]=='goto' && !myPlayer.paused) {myPlayer.currentTime=thumb.style.start=thumb.currentTime=1*el[2];myPlayer.volume=0.1}
        else if (el[1]=='rate') rate = 1*el[2] || defRate
        else if (el[1]=='skinny') {skinny = 1*el[2] || 1; if(time) positionMedia(2)}
        else if (el[1]=='pause') {myPlayer.pause(); if (el[2]) setTimeout(function(){myPlayer.play()},1000*el[2])}}}
    if (type=='document' && playing) insertMedia(src, tm)}


  function Captions() {							// grok refactored code
    if (block > 80) return
    const t = myPlayer.currentTime.toFixed(1), latest = [...document.querySelectorAll(`[id^="my${index}-"]`)]
      .reduce((a, e) => { const x = parseFloat(e.id.split('-')[1]); return x <= t && x > (a?.time ?? -1) ? { e, x } : a}, null)
    if (latest?.e !== capText) {
      if (capText) [capText.style.color, capText.style.transform] = [null, 'none']
      capText = latest?.e || ''; capTime = capText ? capText.previousElementSibling : ''
      capText && ([capText.style.color, capText.style.transform] = ['pink', 'scale(1.1,1.2)'], !overText && srt.scrollTo(0, capText.offsetTop - 20))}}


  function playCap(id, stop) {
    if (ypos > srt.offsetTop && ypos < srt.offsetTop + 12) {srt.scrollTo(0,-5); myPlayer.pause(); return}
    if (!dur || type == 'document') return
    tm = id.split('-')[1]
    if (id.match('my') && (stop || capText.id != id)) myPlayer.currentTime = thumb.currentTime = tm
    if (stop || longClick) myPlayer.pause()
    else if (!id.match('my') || (capText.id==id && !editing)) togglePause()
    else if (!editing || capText.id!=id) myPlayer.play()
    else myPlayer.pause()}


  function openCap() {							// show captions
    captions=1
    srt.style.display='block'
    myNav.style.display=null
    myCues(0)								// scroll to caption
    srt.style.zIndex=Zindex}


  function joinCap() {							// join to cap above
    let text = window.getSelection().getRangeAt(0).toString()
    if (window.getSelection().anchorOffset) return			// cursor not at beginning of caption
    if (text == capText.textContent) capText.textContent = ''
    else if (text) return
    editing = index
    myPlayer.currentTime=1*capTime.previousElementSibling.id.split('-')[1] // set player to previous caption
    capText.previousElementSibling.remove()				// remove timestamp
    capText.previousElementSibling.textContent+=' '+capText.textContent	// add caption to previous caption
    capText.remove()							// remove old caption
    editing = index}


  function updateCue(item, val) {					// rate, skinny, cues  getParameters(index); 
    val = Math.round(1000 * val) / 1000
    thumb.style[item] = val
    thumb.style.posted = 0
    if (item=='skinny') skinny = val
    if (myTitle.value) {if (!playing) getParameters(index); positionMedia(0.2); if (item=='rate') rate = val}
    else if (item=='rate') {defRate = val; localStorage.setItem('defRate'+folder, val)}}


  function newCap(nudge) {
    editing = index
    if (type === 'document' || (nudge && block > 20)) return
    block = 40									// Block rapid click re-entry
    let newText = ''
    if (nudge) {								// Handle nudge (timestamp adjustment)
      if (capTime) myPlayer.currentTime = Number(capTime.id.split('-')[1])
      newText = capText.textContent
      myPlayer.currentTime += nudge
      capTime.remove()
      capText.remove()}
    else if (captions) { 							// Handle caption split at cursor
      capText.style.color = null
      capText.style.transform = 'none'
      const range = window.getSelection().getRangeAt(0)
      let cursor = 0
      for (let i = 0; i < capText.childNodes.length; i++) {
        const node = capText.childNodes[i]
        if (node === range.startContainer) { cursor += range.startOffset; break}
        if (node.nodeType === Node.TEXT_NODE) cursor += node.textContent.length}
      const z = capText.textContent
      newText = z.substring(cursor).trim()
      capText.textContent = z.substring(0, cursor).trim()
      const id1 = Number(capTime.id.split('-')[1])
      const id2 = capText.nextElementSibling ? Number(capText.nextElementSibling.id.split('-')[1]) : id1 + 1
      if (range.startOffset !== z.length) myPlayer.currentTime = id1 + (id2 - id1) * (capText.textContent.length / z.length)}
    if (!newText) newText = '________'
    if (playing) thumb.currentTime = myPlayer.currentTime  			// Create timestamp
    const t = thumb.currentTime.toFixed(1);
    const w = thumb.currentTime.toFixed(3).split('.')
    const minutes = Math.floor(w[0] / 60).toString().padStart(2, '0')
    const seconds = (w[0] % 60).toString().padStart(2, '0')
    let ww = `${minutes}:${seconds},${w[1]}`
    const nextEl = capText?.nextElementSibling
    ww += nextEl ? ` --> ${nextEl.innerHTML.split(' --')[0]}` : ` --> ${ww}`
    const d = document.createElement('d')					 // Create new caption elements
    d.id = `${index}-${t}`
    d.textContent = ww
    const e = document.createElement('e')
    e.id = `my${index}-${t}`
    e.setAttribute('contenteditable', 'true')
    e.textContent = newText; // Plain text, no tags
    if (!srt.innerHTML) {srt.append(d, e); favicon.innerHTML = '\u00a9'}	// Insert caption in chronological order
    else {
      let inserted = false
      const captions = srt.children
      if (!captions.length && capText && (!capText.nextElementSibling||Number(capText.nextElementSibling.id.split('-')[1]) >= Number(t)))
        {srt.insertBefore(d, capText.nextElementSibling || null); srt.insertBefore(e, capText.nextElementSibling || null); inserted=true}
      if (!inserted) {
        for (let i = 0; i < captions.length; i += 2) {
          const timeId = captions[i].id.split('-')[1]
          if (Number(timeId) >= Number(t) && captions[i] !== capTime) {
            srt.insertBefore(d, captions[i])
            srt.insertBefore(e, captions[i + 1] || null)
            inserted = true
            break}}
        if (!inserted) srt.append(d, e)}}
    myNav.style.display = null
    e.focus()
    if (!captions) {openCap(); Play()}
    if (nudge) myPlayer.play()
    else myPlayer.pause()}


  function closePlayer() {
    if (observer) observer.disconnect()
    if (type == 'image') localStorage.cue = thumb.poster+'|0.01\r\n'	// for swapping media in srt/txt files
    else if (type != 'document') localStorage.cue = thumb.src+'|'+thumb.currentTime.toFixed(2)+'\r\n'
    if (!thumbSheet) messages += '#History#'+thumb.currentTime.toFixed(1)+'#'+index+'#'
    if (editing) inca('Reload',index)
    else inca('Null')							// just update history
    positionMedia(0.2)
    Click=0
    playing=0
    captions=0								// in case browser not active
    thumbSheet=0
    myNav.style=''
    myPlayer.style.opacity=0
    setTimeout(function() {						// fadeout before close
      myPlayer.style.zIndex=-1
      myMask.style = ''
      myPlayer.pause()
      srt.style=''
      if (title.getBoundingClientRect().top>innerHeight-50) {
        title.scrollIntoView()						// scroll last media into view
        myContent.scrollBy(0,-400)}},300)}				// time for htm to render


  function navButtons() {						// innerHTML values
    if (!myTitle.value) myCap.innerHTML=''
    else if (type == 'document') myCap.innerHTML='Save Text'
    else if (!srt.innerHTML || captions) {myCap.innerHTML='New Caption'} else myCap.innerHTML='Captions'
    if (!myTitle.value) myCue.innerHTML=''
    else if (playing) {myCue.innerHTML='New Cue'} else myCue.innerHTML='Cues'
    let end = myPlayer.currentTime.toFixed(2)
    if (cue == end) end = dur
    if (cue) myCue.innerHTML = 'Start ' + cue +' '+ 'End '+ end
    else if (type=='document' && playing && localStorage.cue) myCue.innerHTML='Add Media'
    else if (myTitle.value) myCue.innerHTML='Show Cues'
    else myCue.innerHTML=''
    if (cue && thumb.style.skinny) myCap.innerHTML='Cue Skinny ' + skinny
    else if (cue && thumb.style.rate) myCap.innerHTML='Cue Speed ' + rate
    else if (cue && end != dur) myCap.innerHTML='GoTo ' + myPlayer.currentTime.toFixed(2)}


  function cueButton() {						// context menu Cue button
    if (!cue) cue = Math.round(100*thumb.currentTime)/100
    if ((thumb.style.skinny || thumb.style.rate) && !thumb.style.posted) {capButton(); cue = 0}
    else if (type=='document') {					// substitute media in srt/txt
      editing = index
      cues.innerHTML+= srt.scrollTop.toFixed(0) +'|media|'+localStorage.cue
      inca('cueMedia',cues.innerHTML,index)
      localStorage.cue =''
      cue = 0}
    Play()}


  function capButton() {						// context menu Cap button
    let x = cue+'|goto|'+myPlayer.currentTime.toFixed(2)
    if (thumb.style.skinny) x = cue+'|skinny|'+thumb.style.skinny
    if (thumb.style.rate) x = cue+'|rate|'+thumb.style.rate
    thumb.style.skinny = thumb.style.rate = 0
    if (playing && type == 'document') inca('saveText')
    else if (cue) {cue=0; messages += '#addCue#' + x + '#' + index + '#'} // add cues to media
    else if (myTitle.value) if (!srt.innerHTML || captions) {newCap()} else {openCap(); Play()}
    cue = 0}


  function insertMedia(src, tm) {
    if (myPlayer.paused && overText && tm && (myPlayer.src != src || tm != time)) {
      let prevType = type
      if (src.match('.jpg')) type = 'image'
      if (myPlayer.src != src) {
        myPlayer.poster = myPlayer.src = src				// swap out media above srt
        myPlayer.style.height = innerHeight +'px'}			// portrait or landscape - normalised size
      myPlayer.currentTime = tm
      type = prevType
      if (block < 25) block = 100					// block jitter on src replace
      myPlayer.style.opacity = 0
      positionMedia(0)
      positionMedia(3)							// fade new media in
      myPlayer.style.opacity = 1}
    else if (!tm && myPlayer.src != thumb.src) {
      setThumb(); myPlayer.currentTime=thumb.currentTime; myPlayer.poster=thumb.poster}
    positionMedia(0)}


  function sel(i) {							// highlight selected media in html
    if (!i || !Click || (gesture && Click==3) || overText) return
    let x = ','+selected; el = document.getElementById('title' + i);
    if (x.match(','+i+',')) {selected = x.replace(','+i+',',',').slice(1); el.style.outline = null}
    else {selected=selected+i+','; el.style.outline = '0.1px solid red'; el.style.opacity=1}}


  function addFavorite() {
    if (!myTitle.value || gesture) return
    if (!playing && !playlist && !favicon.textContent.includes('\u2764') && dur < 200)
      thumb.currentTime = 0
    let tm = thumb.currentTime.toFixed(2)
    inca('Favorite',tm,index,srt.scrollTop.toFixed(0))			// includes any caption/txt scroll
    favicon.innerHTML='&#10084'}					// heart symbol on htm thumb


  function mediaEnded() {						// media finished playing
    if (playlist.match('/inca/music/')) {if (getParameters(index+=1)) {Play(); myPlayer.play()} else closePlayer(); return}
    else if (!defPause) {myPlayer.currentTime=thumb.style.start; myPlayer.play()}
    else myPlayer.currentTime=dur+2}


  function searchBox() {
      if (renamebox) inca('Rename', renamebox, lastMedia)		// rename media
      else if (longClick && !gesture && overText && !window.getSelection().toString()) inca('Osk')
      else if (!playing && (myInput.matches(':focus') || longClick)) inca('SearchBox','','',myInput.value) // search media on pc
      myPlayer.pause(); longClick=0}


  function mouseBack() {
      if (playing) closePlayer()					// close player and send messages to inca
      else if (longClick) window.close()
      else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)	// else scroll to page top
      else {inca('Reload'); localStorage.cue=''}}			// or finally, reload page & clear selected


  function overThumb(id) {
    if (!thumb.paused) thumb.pause()					// pause previous thumb
    index = id
    if (Click) return							// faster for click & slide selecting
    getParameters(id)
    thumb.volume = 0.6
    thumb.style.opacity = 1
    if (!thumb.currentTime) {thumb.load(); thumb.currentTime = thumb.style.start}}


  function Time(z) {if (z<0) return '0:00'; let y=Math.floor(z%60); let x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {xpos=0; skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; getParameters(index); positionMedia(0.4); setPic()}
  function togglePause() {
    if (type=='document' && !overMedia) return
    if (!thumbSheet && playing && myPlayer.paused) {myPlayer.play()} else myPlayer.pause()
    if (myPlayer.paused) {pause=1} else pause=0}





