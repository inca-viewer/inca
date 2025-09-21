
// panel losing orientation until scroll signal
// media not play if no dur
// re index allfavs
// zoom not center is offset
// index no selected does folder no force
// escape from indexing


  let wheel = 0								// wheel count
  let wheelDir = 0		 					// wheel direction
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
  let lastMedia = ''							// previous media
  let lastSeek = 0							// previous media time
  let navStart = 0							// new start time
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
  let timout = 0							// -- every 94mS  eg for hide cursor
  let block = 0								// block wheel timer
  let aspect = 1							// media width to height ratio
  let mediaX = 0							// centre of myPlayer
  let mediaY = 0
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed
  let defMute = 0							// default mute
  let defPause = 0							// default pause state
  let observer								// see if myPlayer is visible
  let lastLine = 0							// last addMedia event
  let pitch = 0								// default pitch

  let srt = document.createElement('div')				// . txt or subtitle element
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
  if (innerHeight>innerWidth) {scaleY=0.64} else scaleY=0.5		// screen is portrait


  function mouseDown(e) {
    longClick = gesture = 0
    Click = lastClick = e.button+1
    if (Click == 2) e.preventDefault()					// forward and back mouse buttons
    timout=6; Xref=xpos; Yref=ypos
    clickTimer = setTimeout(function() {				// detect long click
      longClick = Click; clickEvent(e)},300)}


  function mouseUp(e) {
    if (!Click) return							// stop re-entry also if new page load
    if (!playing && !myInput.matches(':hover'))
      myInput.value = window.getSelection().toString() || myInput.value	// text into searchbox
    clearTimeout(clickTimer)						// longClick timer
    if (!longClick) clickEvent(e)					// process click event
    Click = longClick = wheel = gesture = 0}


  function keyDown(e) {							// keyboard events
    longClick = 0
    if (e.key == 'Enter') searchBox()
    else if (e.key == 'Pause' || (e.code == 'ArrowLeft' && e.shiftKey)) mouseBack()
    else if (e.code == 'Space' && !editing) togglePause()
    else if (!overText && !captions && playing) {
      if (e.key == 'ArrowRight') myPlayer.currentTime += 10
      else if (e.key == 'ArrowLeft') myPlayer.currentTime -= 10
      else if (e.key == 'ArrowDown') {lastClick = 2; clickEvent(e)}
      else if (e.key == 'ArrowUp') {lastClick = longClick = 2; clickEvent(e)}}}


  function clickEvent(e) {
    let id = e.target.id 								// id under cursor
    if (gesture || id == 'myFlip') return
    if (!gesture && longClick == 1 && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (['myMute', 'myPause', 'mySave', 'myCancel', 'myDelete', 'myIndex', 'myInca'].includes(id)) return
    if (myOptions.matches(':hover')) return
    if (id == 'myPitch') {setPitch(0); return}
    if (id == 'myFavorite') {addFavorite(); return}
    if (lastClick == 3) {								// Right click context
      if (yw < 0.06) return
      if (!myNav.style.display) {context(e); return}}
    if (lastClick == 4) {mouseBack(); return}						// Back Click
    if (lastClick == 2) {  								// Middle click
      if (editing) {inca('Null'); return}						// save text
      if (myMenu.matches(':hover')) return
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// list/thumb view
      if (!thumbSheet) messages += '#History#'+thumb.style.start.toFixed(1)+'#'+index+'#'
      if (longClick) {index--} else index++						// next, previous media
      srt.style=''
      if (!getParameters(index)) {index = lastMedia; closePlayer(); return}}		// end of media list
    if (lastClick == 1) {
      if (!playing && id != title.id) {
        if (!overText && longClick && myPanel.matches(':hover')) return 
        if (id=='myCue' || (overMedia && thumb.src.slice(-3)=='m3u')
        || (longClick && ((overMedia && type=='document')
        || (favicon && favicon.matches(':hover')))) 
        || (overMedia && thumb.src.endsWith('.pdf'))) {Click=0; inca('Notepad',id,index); return}}
      if (!longClick) {
        if (id == 'mySelect') {if (myTitle.value) {sel(index)} else selectAll(); return}
        if (id == 'mySkinny') {updateCue('skinny',1); return}
        if (id == 'mySpeed') {updateCue('rate',1); return}
        if (id == 'myCap') {capButton(); return}
        if (id == 'myCue' && playing) {cueButton(); return}
        if (overText && ypos < srt.offsetTop + 12) {srt.scrollTo(0,-5); return}}	// scroll to top of text
      else if (overText) {searchBox(); return}
      if (title.matches(':hover') || longClick!=1 && !playing && !overMedia && !myNav.style.display) return
      if (longClick && myTitle.value) thumbSheet ^= 1
      else if (!getStart(id)) return}
    getParameters(index)
    if (playing && type=='document') return
    if (srt.value && (captions || favicon.matches(':hover') || type=='document')) openCap()
    if (lastClick) Play()}


  function getStart(id) {
    let sheet = thumbSheet; thumbSheet = 0
    if (!dur) return 1
    if (defPause && myPlayer.currentTime > dur-0.5) myPlayer.load()
    if (sheet) {							// clicked thumb on 6x6 thumbsheet
      if (skinny < 0) xm = 1-xm						// if flipped media
      let row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
      let col = Math.ceil(xm * 6)
      let offset = dur > 60 ? 20 : 0					// skip movie credits...
      let ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200						// see index() in inca.ahk to explain
      if (overMedia) navStart = (offset - (ps * offset) + dur * ps)}
    else if (playing && overMedia && (ym > 0.9 || (yw > 0.95 && yw < 0.98))) {
      if (xm < 0.1) myPlayer.currentTime = 0
      else myPlayer.currentTime = xm * dur
      return}
    else if (id!='myPic' && playing) {togglePause(); return}
    else if (longClick==1) {index = lastMedia; navStart = lastSeek}	// resume last media
    return 1}								// return and continue


  function Play() {
    positionMedia(0)
    if (lastClick) myPlayer.style.opacity = 0				// fade in player
    if (dur < 200 && !navStart && !playing && !playlist && !longClick && !favicon.textContent.includes('\u2764')) navStart=0
    else if (!navStart && !longClick) navStart = thumb.style.start
    if (!thumbSheet) {myPlayer.poster = thumb.poster; myPlayer.currentTime = navStart}
    thumb.pause()
    myPlayer.pause()
    if (playlist.match('/inca/music/')) myPlayer.muted=0
    else myPlayer.muted = defMute
    if (el=document.getElementById('title'+lastMedia)) el.style.color=null
    title.style.opacity = 1; title.style.color='pink'
    lastMedia = index
    if (scaleY < 0.17) scaleY = 0.5					// return zoom after captions
    if (lastClick) myNav.style.display=null
    myMask.style.pointerEvents='auto'					// stop overThumb() triggering
    if (captions || type=='audio' || playlist.match('/inca/music/')) scaleY=0.16
    if (playlist.match('/inca/music/') && !thumbSheet) {myPlayer.play(); myPlayer.muted=0}
    if (lastClick && !captions && !thumbSheet && dur && !defPause && !cue) myPlayer.play()
    setTimeout(function() {if (lastClick) positionMedia(0.4); myPlayer.style.opacity=1},100)
    myPlayer.style.zIndex=Zindex
    if (captions) srt.addEventListener('scroll', addMedia)
    if (type == 'audio') myPlayer.style.borderBottom = '2px solid pink'
    else myPlayer.style.border=null
    observer = new IntersectionObserver(([entry]) => {if (!entry.isIntersecting) mediaX = mediaY = 500}).observe(myPlayer)
    if (pitch || myPlayer.context) {					// from pitch.js in inca\cache\apps
      setupContext(myPlayer); myPlayer.jungle.setPitchOffset(semiToneTranspose(pitch))}
    myCues('scroll')							// scroll to last position in document
    playing=1; block = 160}


  function mouseMove(e) {
    if (innerHeight==outerHeight) {xpos=e.screenX; ypos=e.screenY}	// fullscreen detection/offsets
    else {xpos=e.clientX; ypos=e.clientY}
    timout=6
    if (myNav.style.display) setPic()					// in context menu sets thumb sprite
    mySelected.style.left = xpos +30 +'px'
    mySelected.style.top = ypos -20 +'px'
    let x = Math.abs(xpos-Xref)
    let y = Math.abs(ypos-Yref)
    if (x+y > 7 && Click && !gesture) {					// gesture (Click + slide)
      gesture = 1
      if (!playing && overMedia && !myNav.style.display) sel(index)
      if (myNav.style.display) {x=myNav.getBoundingClientRect(); Xref=(xpos-x.left)/skinny; Yref=ypos-x.top}}
    if (!gesture || !Click) {gesture=''; return}
    else if (captions && !cues.textContent.match(srt.offsetWidth)) editing = index
    if (Click==1 && myPic.matches(':hover')) {myNav.style.left = xpos-Xref+"px"; myNav.style.top = ypos-Yref+"px"}  // move context menu
    else if (Click==1 && playing && (overMedia || !captions)) {		// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      Xref=xpos; Yref=ypos
      positionMedia(0)}}


  function wheelEvent(e) {
    e.preventDefault()
    let id = e.target.id 						// Use e.target for faster hover detection 
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < block) return
    block=100
    let wheelUp = wheelDir * e.deltaY > 0
    if (id=='myPage') {							// htm page
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
      if (wheelUp) {pitch = 1} else pitch = 0
      pitch = 1*pitch.toFixed(0)
      setPitch(pitch)}
    else if (id=='myThumbs') { 						// thumb size
      let x=view; let z=wheel/1500
      if (x<98 && wheelUp) x *= 1+z
      else if (!wheelUp) x /= 1+z
      if (x<8) x=8
      view=x; settings.view = String(x); localStorage.setItem(folder, JSON.stringify(settings)); setWidths(index,36)
      block=8}
    else if (!playing && id=='myWidth') {				// page width
      let x = 1*myView.style.width.slice(0,-2); let z=wheel/2000
      if (wheelUp) x *= 1+z
      else if (!wheelUp && x / 1+z > 100) x /= 1+z
      if (x > innerWidth) x = innerWidth
      myView.style.width = x.toFixed(2)+'px'
      settings.pageWidth = String(x); localStorage.setItem(folder, JSON.stringify(settings))
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
      let interval = 1
      if (dur < 121) interval = 0.1
      if (myPlayer.paused) interval = 0.0333
      if (wheelUp) myPlayer.currentTime += interval
      else if (!wheelUp) myPlayer.currentTime -= interval
      myPlayer.addEventListener('seeked', () => {block=20}, {once: true})
      block=250}
    else if (!myNav.style.display) {					// zoom myPlayer
      let x=0; let y=0; let z=0
      z=wheel/2000
      if (scaleY > 0.7) {x = mediaX-xpos; y = mediaY-ypos}
      if (wheelUp) {mediaX+=x*z; mediaY+=y*z; scaleY*=(1+z)}
      else if (!wheelUp) {mediaX-=x*z; mediaY-=y*z; scaleY/=(1+z)}
      if (scaleY<0.16) scaleY=0.16
      if (thumbSheet && scaleY<0.4) scaleY=0.4
      positionMedia(0); block=20}
    wheel=0}


  function timerEvent() { 						// every 94mS
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    let top = 0; let el = myPlayer
    if (myNav.style.display) el = myPic
    else if (!playing) el = thumb
    rect = el.getBoundingClientRect()
    if (!myNav.matches(':hover')) myNav.style.display = null
    else if (!myTitle.value || type=='document') myNav.style.width = 84 + 'px'
    else {myNav.style.width = rect.width + 100 + 'px'; if (myTitle.matches(':hover')) myPic.style.display='block'}
    if (!myNav.style.display) {zoom=1; myTitle.value = (overMedia || playing) ? title.value : ''}
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
    if ((listView && thumb.style.opacity==1) || favicon.matches(':hover')) overMedia = index
    else if (overMedia && myNav.style.display || myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else overMedia = 0
    if (pages > 1) myPage.innerHTML = page+' of '+pages
    mySkinny.innerHTML = null
    mySkinny.style.color = null
    mySpeed.innerHTML = defRate === 1 ? 'Speed' : 'Speed ' + defRate
    myPitch.innerHTML = pitch === 0 ? 'Pitch' : 'Pitch ' + pitch
    if (myTitle.value) {
      myFlip.innerHTML = 'Flip'
      myTitle.value = title.value
      mySelect.innerHTML = 'Select '+index
      mySelect.style.outline = myPlayer.style.outline = title.style.outline
      mySkinny.innerHTML = skinny === 1 ? 'Skinny' : `Skinny ${skinny.toFixed(2)}`
      mySkinny.style.color = skinny === 1 ? null : 'red'
      mySpeed.innerHTML = rate === 1 ? 'Speed' : `Speed ${rate.toFixed(2)}`}
    else {mySelect.innerHTML = 'Select'; myFlip.innerHTML = mySelect.style.outline = null}
    if (favicon.innerHTML.match('\u2764')) myFavorite.innerHTML='Fav &#x2764'
    else myFavorite.innerHTML='Fav'
    if (!seekBar()) myProgress.style.height = null
    let qty = selected.split(',').length - 1 || 1;
    if (myTitle.value || selected) myDelete.innerHTML='Delete ' + qty
    else myDelete.innerHTML = null
    if (defMute) {myMute.style.color='red'} else myMute.style.color=null
    if (defPause) {myPause.style.color='red'} else myPause.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (!thumbSheet && captions) srt.style.opacity=1
    if (captions && el == myPlayer) {
      if (playing) {top = rect.bottom} else top = 300
      capMenu.style.top = top + 24 + srt.offsetHeight + 'px'; capMenu.style.left = mediaX -screenX - 85 + 'px'
    srt.style.top = top + 'px'; srt.style.left = mediaX - screenX - srt.offsetWidth / 2 + 'px'}
    if (playing) {
      positionMedia(0)
      if (!thumbSheet) dur = myPlayer.duration
      myMask.style.pointerEvents='auto'
      if (playlist.match('/inca/music/')) myMask.style.opacity = 0.7
      else myMask.style.opacity = 1
      if (cues.innerHTML && !thumbSheet && type !='image') myCues(myPlayer.currentTime)
      myPlayer.playbackRate = rate}
    else {
      myMask.style.pointerEvents = null
      if (myNav.style.display) myMask.style.opacity = 0.5
      else myMask.style.opacity = 0
      if (thumb.muted) {thumb.playbackRate = 0.7} else thumb.playbackRate = 1
      if (!listView && thumb.readyState===4 && thumb.duration && overMedia) thumb.play()
      else thumb.pause()}}


  function positionMedia(time) {					// position myPlayer in window
    myPanel.style.top='50px'
    myView.style.top='200px'
    if (!mediaX) {mediaX = screen.width/2; mediaY = screen.height/2}
    mediaX = Math.max(0, Math.min(innerWidth, mediaX)); mediaY = Math.max(0, Math.min(innerHeight, mediaY))
    let offset = captions && srt.value ? 140 : 0
    myPlayer.style.left = (mediaX - screenX) - myPlayer.offsetWidth / 2 + "px"
    myPlayer.style.top = (mediaY - (outerHeight-innerHeight)) - myPlayer.offsetHeight / 2 - offset + "px"
    myPlayer.style.transition = type === 'image' ? 'opacity ' + time + 's' : time + 's'
    skinny = thumb.style.skinny || skinny
    let zoom = scaleY
    if (thumbSheet) zoom = scaleY * 2
    myPlayer.style.transform = "scale(" + skinny * zoom + "," + zoom + ")"}


  function seekBar() {							// progress bar beneath player
    if (type=='image') return
    let el = myPlayer
    let cueX = rect.left
    let pos = Math.round(el.currentTime*10)/10
    let cueW = rect.width * pos / dur
    if (myPic.matches(':hover')) {el = myPic; cueW = rect.width * xm}
    else if (Click || overText || thumbSheet || !playing || !myPlayer.duration || (!timout && !cue)) return
    if (cue) myProgress.style.background = 'red'
    else myProgress.style.background = null
    if (cue && cue <= pos) {
      cueX = rect.left + rect.width * cue / dur
      cueW = rect.width * (pos - cue) / dur
      if (cue < pos + 1 && cue > pos - 1) {
        cueW = rect.width * (dur - cue) / dur}}
    else if (cue) {
      cueX = rect.left + rect.width * pos / dur
      cueW = rect.width * (cue - pos) / dur
      if (cue < 1 + pos) {cueX = rect.left; cueW = rect.width * pos / dur}}
    myProgress.style.height = '5px'
    if (rect.bottom > innerHeight) myProgress.style.top = innerHeight - 15 +'px'
    else myProgress.style.top = (rect.top + rect.height - myProgress.offsetHeight) + 'px';
    myProgress.style.left = cueX + 'px'
    myProgress.style.width = cueW + 'px'
    return 1}


  function setThumb() {							// sets src, poster, thumbsheet & dimensions
    let sheet = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheet src folder
    sheet = sheet.replace("/temp/history/", "/thumbs/")			// in case history playlist
    let time = sheet.split('%20').pop().replace('.jpg', '')		// get fav start time from poster filename
    if (!isNaN(time) && time.length > 2 && time.includes('.')) {	// very likely a 'fav' suffix timestamp
      sheet = sheet.replace('%20' + time, '')}				// so remove timestamp from filename
    if (thumbSheet) myPlayer.poster = sheet				// use 6x6 thumbsheet as poster
    else if (type=='image') myPlayer.src = myPic.poster = thumb.poster
    else if (myPlayer.src != thumb.src) {myPlayer.src = thumb.src; myPic.poster = thumb.poster}
    if (type=='video') myPic.style.backgroundImage='url(\"'+sheet+'\")' // use 6x6 thumbsheet for preview sprites
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
    else myPlayer.currentTime=thumb.style.start}			// fast start play


  function setPic() {							// sets context image based on cursor over myPic
    let x = Math.max(0, Math.min(1, ((xpos - rect.left) / rect.width + 0.02) ** 2 - 0.02))
    let thumbIndex = Math.ceil(x * 35)
    let z = (5 * (thumbIndex + 1) - 1) / 200
    let offset = dur > 60 ? 20 : 0
    navStart = offset - (z * offset) + dur * z
    if (!thumbIndex || !myPic.matches(':hover')) {myPic.poster=thumb.poster; navStart = thumb.style.start}
    else if (type == 'video') myPic.poster = ''
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


  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing && command != 'Osk') {					// text or caption has been edited
      messages += '#Scroll#'+srt.scrollTop.toFixed(0)+'|'+srt.offsetWidth+'|'+srt.offsetHeight+'#'+editing+'#'
      messages += '#capEdit##' + editing + '#' + document.getElementById('srt'+editing).value.replaceAll('#', '𝌇')
      editing = 0}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if ((el.style.rate || el.style.skinny) && !el.style.posted) {
        messages += '#editCues#'+el.style.rate+','+el.style.skinny+','+'#'+i+'#'; el.style.posted=1}}
    if (!select) {select=''} else {select+=','}
    if (selected) select = selected
    if (!value) value = ''
    if (!address) address = ''
    if (isNaN(value)) value=value.replaceAll('#', '*')			// because # is used as delimiter
    if (command=='Delete' || command=='Rename' || (select && command=='Path')) {
      for (x of select.split(',')) if (el=document.getElementById('thumb'+x)) el.remove()}	// release media
    messages += '#'+command+'#'+value+'#'+select+'#'+address
    if (document.querySelector('link[rel="icon"]').href.includes('file:///')) navigator.clipboard.writeText(messages)
    else {fetch('http://localhost:3000/generate-html', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: messages})
      .then(response => {if (response.status === 204) {return} return response.json()})
      .then(data => {
        let newUrl = encodeURI(`http://localhost:3000${data.url}`)
        if (command == 'SearchBox' || lastClick == 2 && command=='Path') window.open(newUrl)	// new tab
        else window.location.href = newUrl})}							// replace tab
    messages=''}


  function getParameters(i) {						// get media parameters
    if (!(document.getElementById('thumb'+i))) return			// end of media list
    if (!(favicon=document.getElementById('myFavicon'+i))) favicon=''	// fav or cc icon
    thumb = document.getElementById('thumb'+i)				// htm thumb element
    entry = document.getElementById('entry'+i)				// thumb and title container
    title = document.getElementById('title'+i)				// htm title element
    cues = document.getElementById('cues'+i)				// media defaults and time cues
    srt = document.getElementById('srt'+i)				// txt or caption element
    thumb.src = thumb.dataset.altSrc
    let params = entry.dataset.params.split(',')
    type = params[0]							// media type eg. video
    thumb.style.start = Number(params[1])				// start time
    dur = Number(params[2]) || thumb.duration				// duration
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
    if (mu=='yes') {defMute=1} else defMute=0
    settings = JSON.parse(localStorage.getItem(folder) || '{}')
    settings.pageWidth = (isNaN(settings.pageWidth) || settings.pageWidth > innerWidth) ? '600' : settings.pageWidth
    settings.view = (isNaN(settings.view) || settings.view < 6 || settings.view > 100) ? '10' : settings.view
    settings.defRate = (isNaN(settings.defRate) || settings.defRate < 0.2 || settings.defRate > 5) ? '1' : settings.defRate
    settings.pitch = (isNaN(settings.pitch) || settings.pitch < -2 || settings.pitch > 2) ? '0' : settings.pitch
    myView.style.width = parseFloat(settings.pageWidth) + 'px'
    view = parseFloat(settings.view)
    defRate = parseFloat(settings.defRate)
    pitch = parseFloat(settings.pitch)
    filter('my'+so)							// show filter heading in red
    for (x of selected.split(',')) {
      if(el=document.getElementById('title'+x)) {el.style.outline = '0.1px solid red'; el.style.opacity=1}}			
    for (index=0, n=1; getParameters(n); n++) {}			// process null cues (eg. skinny, start, rate)
    if (!ix) index=1
    else index=ix
    lastMedia=ix
    setWidths(1,1000)							// set htm thumb widths and heights 
    getParameters(index)						// initialise current media
    if (ix && title) {							// eg. after switch thumbs/listview
      title.style.opacity=1						// highlight thumb
      title.style.color='pink'
      title.scrollIntoView()						// scroll to thumb
      myContent.scrollBy(0,-400)}}


  function setWidths(start, qty) {					// set thumb sizes in htm
    if (listView) return
    if (start<16) start=1
    for (i=start; el=document.getElementById('entry'+i); i++) {		// until end of list
      if (i-start>qty) break
      el2 = document.getElementById('thumb'+i)
      x = el2.offsetWidth/el2.offsetHeight				// for portrait/landscape thumb layout
      if (x>1) el.style.width=view+'em'
      else el.style.width=x*view+'em'}}


  function myCues(time) { 						// media scrolls, speed, skinny, pauses etc.
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k=0; k<x.length; k++) {					// process each line entry
      let el = x[k].split('|')						// time[0] cue[1] value[2] period[3]
      if (el[1]=='scroll' && time=='scroll') {
        if (!srt.scrollTop) srt.scrollTo(0,el[2])			// scroll to text position
        srt.style.width = (el[3] < 160 ? 360 : el[3]) + 'px'
        srt.style.height = (el[4] < 60 ? 160 : el[4]) + 'px'}
      if (el[1] && 1*el[0] > time-0.1 && 1*el[0] < time+0.1) {
        if (el[1]=='next') {lastClick=2; clickEvent(0)}
        else if (el[1]=='goto' && !myPlayer.paused) {myPlayer.currentTime=thumb.style.start=1*el[2]}
        else if (el[1]=='rate') rate = 1*el[2] || defRate
        else if (el[1]=='skinny') {skinny = 1*el[2] || 1; if(time) positionMedia(2)}
        else if (el[1]=='pause') {myPlayer.pause(); if (el[2]) setTimeout(function(){myPlayer.play()},1000*el[2])}}}}


  function openCap() {							// show captions
    captions = 1
    srt.style.display = 'block'
    myNav.style.display = null
    myCues(0)								// scroll to caption
    srt.style.zIndex = Zindex}


  function updateCue(item, val) {					// rate, skinny, cues  getParameters(index); 
    val = Math.round(1000 * val) / 1000
    thumb.style[item] = val
    thumb.style.posted = 0
    if (item=='skinny') {skinny = val; thumb.style.transform='scale('+val+',1)'}
    if (myTitle.value) {if (!playing) getParameters(index); positionMedia(0.2); if (item=='rate') rate = val}
    else if (item=='rate') {defRate = val; settings.defRate = String(defRate); localStorage.setItem(folder, JSON.stringify(settings))}}


  function closePlayer() {
    lastSeek = myPlayer.currentTime
    if (observer) observer.disconnect()
    if (captions) srt.removeEventListener('scroll', addMedia)
    if (!thumbSheet) messages += '#History#'+lastSeek.toFixed(1)+'#'+index+'#'
    if (editing) inca('Reload',index)
    else inca('Null')							// just update history
    positionMedia(0.2)
    cue = 0
    Click = 0
    playing = 0
    navStart = 0
    captions = 0							// in case browser not active
    thumbSheet = 0
    srt.style = ''
    myNav.style = ''
    myPlayer.style.opacity = 0
    setTimeout(function() {						// fadeout before close
      myPlayer.style.zIndex = -1
      myMask.style = ''
      myPlayer.pause()
      if (title.getBoundingClientRect().top>innerHeight-50) {
        title.scrollIntoView()						// scroll last media into view
        myContent.scrollBy(0,-400)}},200)}				// time for htm to render


  function navButtons() {						// innerHTML values
    if (!myTitle.value) myCap.innerHTML=''
    else if (type == 'document') myCap.innerHTML='Save Text'
    myCap.innerHTML='Captions'
    if (!srt.value) myCap.innerHTML='Add Captions'
    else if (captions) myCap.innerHTML='Add Caption '+myPlayer.currentTime.toFixed(1)
    if (!myTitle.value) myCap.innerHTML = myCue.innerHTML = null
    else if (playing) {myCue.innerHTML='New Cue'} else myCue.innerHTML='Cues'
    let end = dur.toFixed(1)
    let time = myPlayer.currentTime.toFixed(1)
    if (time > cue + 1) {end = time; time = cue}
    else if (time < cue - 1) end = cue
    else if (time >= cue) time = cue
    else {time = '0.0'; end = cue}
    if (cue) myCue.innerHTML = 'Start ' + time +' '+ 'End '+ end
    else if (type=='document' && playing) myCue.innerHTML='Add Media'
    else if (myTitle.value && playing) myCue.innerHTML='Add Cue '+myPlayer.currentTime.toFixed(1)
    else if (myTitle.value) myCue.innerHTML='Show Cues'
    else myCue.innerHTML=null
    if (cue && thumb.style.skinny) myCap.innerHTML='Cue Skinny ' + skinny
    else if (cue && thumb.style.rate) myCap.innerHTML='Cue Speed ' + rate
    else if (cue && end != dur) myCap.innerHTML='GoTo ' + myPlayer.currentTime.toFixed(1)}


  function cueButton() {						// context menu Cue button
    if ((thumb.style.skinny || thumb.style.rate) && !thumb.style.posted) {capButton(); cue = 0}
    else if (type=='document') {srt.focus(); inca('addMedia')}		// paste last media into text file
    else if (!cue) {cue = Math.round(10*myPlayer.currentTime)/10; return}
    Play()}


  function capButton() {						// context menu Caption button
    x = cue+'|goto|'+myPlayer.currentTime.toFixed(1)
    if (thumb.style.skinny) x = cue+'|skinny|'+thumb.style.skinny
    if (thumb.style.rate) x = cue+'|rate|'+thumb.style.rate
    thumb.style.skinny = thumb.style.rate = 0
    if (cue) {cue=0; messages += '#addCue#' + x + '#' + index + '#'} // add cues to media
    else if (captions) {editing=index; srt.focus(); srt.setRangeText('\n' + myPlayer.currentTime.toFixed(2)+ '\n\n')}
    else if (myTitle.value) if (!srt.value || captions) {inca('newCap',0,index)} else {openCap(); Play()}
    cue = 0}


  function sel(i) {							// highlight selected media in html
    if (!i || !Click || (gesture && Click==3) || overText) return
    let x = ','+selected; el = document.getElementById('title' + i);
    if (x.match(','+i+',')) {selected = x.replace(','+i+',',',').slice(1); el.style.outline = null}
    else {selected=selected+i+','; el.style.outline = '0.1px solid red'; el.style.opacity=1}}


  function setPitch(val) {
      pitch = val
      settings.pitch = String(val)
      localStorage.setItem(folder, JSON.stringify(settings))
      setupContext(myPlayer)
      myPlayer.jungle.setPitchOffset(semiToneTranspose(val))}


  function addFavorite() {
    if (!myTitle.value || gesture) return
    if (!playing && dur < 200)
      myPlayer.currentTime = 0
    inca('Favorite',myPlayer.currentTime.toFixed(1),index,srt.scrollTop.toFixed(0))
    favicon.innerHTML='&#10084'}					// heart symbol on htm thumb


  function addMedia() {
    let lines = srt.value.split('\n')
    let lineHeight = parseFloat(getComputedStyle(srt).lineHeight) || 18.4
    let visibleLines = Math.floor(srt.scrollTop / lineHeight)
    let currentLine = lines[visibleLines]
    if (currentLine != lastLine) {
      lastLine = currentLine
      if (/^-?\d*\.?\d+$/.test(currentLine.trim())) myPlayer.currentTime = currentLine
      else if (currentLine.includes('://')) {
        let [file, time] = currentLine.split('|')
        if (!file.includes(myPlayer.src)) {
          myPlayer.src = file.replaceAll('#', '%23')
          if (myPlayer.src.match('.jpg')) myPlayer.poster=myPlayer.src
          else myPlayer.currentTime = time
          myPlayer.style.opacity = 0
          positionMedia(0)
          positionMedia(3)						// fade new media in
          myPlayer.style.opacity = 1}}}}


  function mediaEnded() {						// media finished playing
    if (playlist.match('/inca/music/')) {
      if (getParameters(index+=1)) {Play(); myPlayer.play()} else closePlayer(); return}
    else if (!defPause) {myPlayer.currentTime=thumb.style.start; myPlayer.play()}
    else myPlayer.currentTime=dur+2}


  function searchBox() {
      if (renamebox) inca('Rename', renamebox, lastMedia)		// rename media
      else if (longClick && !gesture && overText && !window.getSelection().toString()) inca('Osk')
      else if (!playing && (myInput.matches(':focus') || longClick)) inca('SearchBox','',index,myInput.value) // search media on pc
      myPlayer.pause(); longClick=0}


  function mouseBack() {
      if (playing) closePlayer()					// close player and send messages to inca
      else if (longClick) window.close()
      else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)	// else scroll to page top
      else inca('Reload')}						// or finally, reload page & clear selected


  function overThumb(id) {
    index = id
    if (Click) return							// faster for click & slide selecting
    getParameters(id)
    thumb.style.opacity = 1
    thumb.load()
    thumb.currentTime = thumb.style.start + 0.04}


  function context(e) {							// right click context menu
    block=200
    myNav.style.display='block'
    if (myTitle.value) {myPic.style.display='block'; myNav.style.left=xpos-76 + 'px'; myNav.style.top = ypos-42 + 'px'}
    else {myPic.style.display=null; myNav.style.left=xpos-68+'px'; myNav.style.top=ypos-28+'px'}}


  function Time(z) {if (z<0) return '0:00'; let y=Math.floor(z%60); let x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {xpos=0; skinny*=-1; thumb.style.skinny=skinny; getParameters(index); positionMedia(0.4); setPic()}
  function togglePause() {
    if (!overText && !thumbSheet && playing && myPlayer.paused) {myPlayer.play()} else myPlayer.pause()}





