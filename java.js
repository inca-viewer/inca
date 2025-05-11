

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
  let playing = ''							// myPlayer or mpv active
  let thumbSheet = 0							// 6x6 thumbsheet mode
  let looping = 1							// play next or loop media
  let Click = 0								// state is cleared after clk up
  let lastClick = 0							// state is preserved after up
  let lastStart = 0							// last myPlayer time
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
  let pitch = 1								// media pitch
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
  let cursor = 0							// hide cursor timout (x 100mS)
  let block = 0								// block wheel timer
  let aspect = 1							// media width to height ratio
  let Xoff = 0								// fullscreen offsets
  let Yoff = 0
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed
  let muted = 0
  let lastYpos = 0							// to stop stutter scrolling thumbs
  let defPause = 0							// default pause state
  let pause = 0								// current pause state
  let mpv = 0								// default player


  let mediaX = isNaN(1*localStorage.mediaX) ? 400 : 1*localStorage.mediaX  // myPlayer position
  let mediaY = isNaN(1*localStorage.mediaY) ? 400 : 1*localStorage.mediaY
  let intervalTimer = setInterval(timerEvent,90)			// background tasks every 90mS
  if (innerHeight>innerWidth) {scaleX=0.64; scaleY=0.64}		// screen is portrait
  else {scaleX=0.5; scaleY=0.5}
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('contextmenu', (e) => {if (yw > 0.08 && !overText) e.preventDefault()})
  document.addEventListener('paste', (e) => {
    const text = e.clipboardData.getData('text');
    if (!isNaN(text)) {e.preventDefault(); thumb.currentTime = text; thumb.currentTime = text}}, false)
  document.addEventListener('keydown', (e) => { 					// keyboard events
    if (e.key == 'Enter') {
      if (type != 'document') e.preventDefault()					// stop cr entering caption
      if (renamebox) inca('Rename', renamebox, lastMedia)				// rename media
      else if (myInput.matches(':focus')) inca('SearchBox','','',myInput.value)		// search media on pc
      else if (captions) newCap()}
    else if (e.code == 'Space' && !srt.innerHTML) togglePause()
    else if (e.key == 'Backspace') {if (srt.innerHTML) {joinCap()} else closePlayer()}
    else if (e.key == 'Pause' && e.shiftKey) {thumbSheet ^= 1; Play()}			// long RClick - show thumbsheet
    else if (e.key == 'Pause') {							// mouse Back Click - inca re-map 
      if (myNav.style.display) myNav.style.display=null				
      else if (playing) closePlayer()							// close player and send messages to inca
      else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)			// else scroll to page top
      else inca('Reload')								// or finally, reload page & clear selected
      Click=0; lastClick=0}}, false) 


  function mouseDown(e) {
    longClick = gesture = 0
    Click = lastClick = e.button+1
    cursor=6; Xref=xpos; Yref=ypos
    if (Click == 2) e.preventDefault()							// middle click
    clickTimer = setTimeout(function() {longClick = Click; clickEvent(e)},260)}		// detect long click


  function mouseUp(e) {
    if (!Click) return									// stop re-entry also if new page load
    clearTimeout(clickTimer)								// longClick timer
    if (gesture && window.getSelection()) localStorage.cue=''				// used for save text snip
    if (!longClick) clickEvent(e)							// process click event
    Click=0; wheel=0; gesture=0}


  function clickEvent(e) {
    let id = e.target.closest('a')?.id || e.target.id 					// id under cursor
    if (gesture || id == 'myTitle') return
    if (longClick && overText && lastClick==1) {myPlayer.pause(); longClick=0}		// osk triggered
    if (!gesture && longClick == 1 && !playing && playlist && selected && overMedia) {inca('Move', overMedia); return}
    if (playing && capText && (!capText.innerHTML || capText.innerHTML=="<br>")) {capTime.remove(); capText.remove(); capText=''; return}
    if (id == 'myCue' && longClick) {Click=0; inca('openCues',0,index); return}		// open cues in notepad
    if (id == 'mySave' || id == 'myInput') return
    if (id == 'myForward') {newCap(0.4); return}					// move caption forward in time
    if (id == 'myBack') {newCap(-0.4); return}
    if (myPanel.matches(':hover')|| myRibbon.matches(':hover')) {Click=0; return}	// inca opens new tab
    if (lastClick == 3) {								// right click context
      if (yw < 0.08 || overText) return
      if (!myNav.style.display) {context(); return}}
    if (lastClick == 2) {  								// middle click
      if (myPanel.matches(':hover')) {Click=0; return}					// inca opens new tab
      if (editing) inca('Null')								// save text
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// switch list/thumb view
      else if (longClick) {index--} else index++					// next, previous media
      if (myNav.matches(':hover')) {getParameters(index); setPic(1); lastClick=0}}	// seek in context menu
    if (lastClick == 1) {
      if (longClick && !playing && !overMedia && !myNav.style.display) return
      if (id == 'mySkinny') {skinny = updateCue('skinny',1); return}
      if (id == 'mySpeed') {rate = updateCue('rate',1); return}
      if (id == 'myPitch') {pitch = updateCue('pitch',1); return}
      if (id == 'myNav')  thumb.currentTime = thumb.style.start				// return start to default
      if (longClick == 1 || thumbSheet || id == 'myPic' || id == 'myNav') {getStart(id); return}
      if (myNav.matches(':hover')) return
      if (srt.matches(':hover') && dur) {playCap(id); return}				// play at caption
      if (title.matches(':hover')) {thumb.currentTime = thumb.style.start; return}
      if (!playing && !overMedia && !myNav.style.display) {selected.split(',').forEach(item => sel(item)); return}
      if (playing && overMedia && (ym > 0.9 || yw > 0.95)) {if (dur) myPlayer.currentTime = xm * dur; return}
      else if (playing) {togglePause(); return}
      else if (!entry.matches(':hover')) return}					// not over html thumb/media
    if (!getParameters(index)) {index = lastMedia; closePlayer(); return}		// end of media list
    if (lastClick) Play()}


  function Play(play) {
    if (!playing) {
      if (!mediaX || mediaX<0 || mediaX>innerWidth) mediaX=innerWidth/2
      if (!mediaY || mediaY<0 || mediaY>innerHeight) mediaY=innerHeight/2}
    myPlayer.style.transition = 'opacity 0.6s'
    myPlayer.style.opacity = 0
    myNav.style.display=null
    let ext = thumb.src.split('.').pop()
    if (!thumbSheet) {
      let x = thumb.style.start
      if (thumb.currentTime > x && thumb.currentTime < x + 1.2) thumb.currentTime = x
      myPlayer.currentTime=thumb.currentTime}
    else setThumb()
    thumb.pause()
    myPlayer.pause()
    myPlayer.muted = muted
    if (el=document.getElementById('title'+lastMedia)) el.style.color = null
    title.style.color = 'pink'; title.style.background = '#1b1814'
    if ((el=document.getElementById('srt'+lastMedia)) && playing && index!=lastMedia) {	// hide last caption
      el.style.display = null
      if (captions && srt.innerHTML && lastClick==2) openCap()}		// next/back
    lastMedia = index
    playing='browser'
    if (play) pause = 0
    else pause = defPause
    if (!longClick && lastClick==1 && srt.innerHTML && (favicon.matches(':hover') || type=='document')) openCap()
    if (type=='audio' || playlist.match('/inca/music/')) {pause=0; scaleY=0.2; looping=0; myPlayer.muted=0}
    if (longClick==1 && (favicon.matches(':hover') || myCap.matches(':hover'))) playing = ''
    else if (ext=='js' || ext=='ahk' || ext=='css' || ext=='ini') playing = ''		// so opens in notepad
    else if (mpv && type!='image' && !playlist.match('/inca/music/') && type!='document' && !thumbSheet) playing='mpv'
    let mpvPara = myPlayer.currentTime+'|'+skinny+'|'+rate+'|'+pitch+'|'+captions+'|'+playing+'|'+pause
    if (playing != 'browser' && !thumbSheet) {myPlayer.load(); Click=0; inca('Media',index,'',mpvPara); return}
    else if (!thumbSheet && type!='image' && !pause && !captions && !cue) myPlayer.play()
    if (captions && (scaleY==0.5 || scaleY==0.2)) scaleY = 0.21		// first time open use small player
    myPlayer.addEventListener('ended', nextMedia)
    if (ext=='txt') srt.style.padding = 0
    if (ext=='mp3') myPlayer.style.borderBottom = '2px solid pink'
    else myPlayer.style.border=null
    if (playing != 'mpv' || thumbSheet) myPlayer.style.opacity=1
    myPlayer.volume=0.1							// triggers volume fadeup
    positionMedia(0)
    block = 60}								// allows time to detect if video can play


  function mouseMove(e) {
    if (innerHeight==outerHeight) {xpos=e.screenX; ypos=e.screenY}	// fullscreen detection/offsets
    else {xpos=e.clientX; ypos=e.clientY}
    cursor=6
    if (myPic.matches(':hover') && type == 'video') setPic()
    if (selected && myPanel.matches(':hover')) {mySelected.innerHTML = selected.split(',').length -1; mySelected.style.fontSize='2em'}
    else {mySelected.innerHTML = ''; mySelected.style.fontSize=null}
    mySelected.style.left = xpos +30 +'px'
    mySelected.style.top = ypos -20 +'px'
    let x = Math.abs(xpos-Xref)
    let y = Math.abs(ypos-Yref)
    if (x+y > 7 && Click && !gesture) {					// gesture (Click + slide)
      gesture = 1
      if (!playing && overMedia || thumbSheet) sel(index)
      if (myNav.style.display) {x=myNav.getBoundingClientRect(); Xref=(xpos-x.left)/skinny; Yref=ypos-x.top}}
    if (!gesture || !Click) {gesture=''; return}
    if (Click==1 && myPic.matches(':hover')) {myNav.style.left = xpos-Xref+"px"; myNav.style.top = ypos-Yref+"px"}  // move context menu
    else if (Click==1 && playing && (overMedia || !captions)) {		// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      Xref=xpos; Yref=ypos
      localStorage.mediaX = mediaX.toFixed(0)
      localStorage.mediaY = mediaY.toFixed(0)
      positionMedia(0)}}



  function wheelEvent(e) {
    e.preventDefault()
    let id = e.target.closest('a')?.id || e.target.id 			// Use e.target for hover detection
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (wheel < block) return
    block=120
    let wheelUp = wheelDir * e.deltaY > 0
    if (id=='myPage') {							// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--}
    else if (wheel > 40 && (id=='myType'||id=='myAlpha'||id=='myDate'||id=='mySize'||id=='myDuration'||id=='mySearch')) {  // filter
      if (wheelUp) filt++ 
      else if (filt) filt--
      if ((id=='myAlpha' || id=='mySearch') && filt > 25) filt=25
      Filter(id)}
    else if (id =='mySpeed') {						// rate
      if (wheelUp) {rate -= 0.01} else rate += 0.01
      rate = updateCue('rate',rate)
      if (!playing && !myTitle.value) {defRate = rate; localStorage.setItem('defRate'+folder, rate)}
      else thumb.style.rate = rate}
    else if (id == 'mySkinny' && myTitle.value) {			// skinny
      if (wheelUp) {skinny -= 0.01} else skinny += 0.01
      skinny = updateCue('skinny',skinny)}
    else if (id == 'myPitch' && myTitle.value) {			// pitch
      if (wheelUp) {pitch += 0.05} else if (pitch > 1) pitch -= 0.05
      pitch = updateCue('pitch',pitch)}
    else if (id=='myThumbs') { 						// thumb size
      let x=view; let z=wheel/1000
      if (x<98 && wheelUp) x *= 1+z
      else if (!wheelUp) x /= 1+z
      if (x<8) x=8
      view=x; localStorage.setItem('pageView'+folder, x); setWidths(index,36)
      block=12}
    else if (!playing && id=='myWidth') {				// page width
      let x = 1*myView.style.width.slice(0,-1)
      if (x>=12 && wheelUp) x-=1
      else if (!wheelUp && x<=98) x+=1
      myView.style.width = x.toFixed(0)+'%'
      localStorage.setItem('pageWidth'+folder, x)
      block=12}
    else if (id == 'myPic') {  						// zoom context pic
      if (wheelUp) {zoom*=1.1} else if (zoom>1.5) zoom*=0.9
      myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'
      setPic()
      block=80}
    else if (id == 'mySelect' || id == 'myTitle' || thumbSheet || (type=='image'&&!overMedia)) {
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index--  		// next, previous media
      else if (!playing) {getParameters(index); setPic()}
      else {longClick=lastClick=0; clickEvent(e)}
      positionMedia(0); block=140}
    else if ((type=='video'||type=='audio') && !thumbSheet && (!overMedia || yw>0.8)) {  // seek 
      cursor = 6
      if (dur > 200) interval = 1.2
      else interval = 0.6
      if (myPlayer.paused) interval = 0.1
      if (wheelUp && myPlayer.currentTime < myPlayer.duration - interval) myPlayer.currentTime += interval
      else if (!wheelUp) myPlayer.currentTime -= interval
      if (myPlayer.currentTime > myPlayer.duration - 1) myPlayer.pause()}
    else if (!myNav.style.display) {					// zoom myPlayer
      let x=0; let y=0; let z=0
      if (!thumbSheet) z=wheel/2000
      if (overMedia && scaleY > 0.7) {x = mediaX-xpos; y = mediaY-ypos}
      if (wheelUp) {mediaX+=x*z; mediaY+=y*z; scaleY*=(1+z)}
      else if (!wheelUp) {mediaX-=x*z; mediaY-=y*z; scaleY/=(1+z)}
      if (scaleY<0.2) scaleY=0.2
      scaleX=skinny*scaleY; positionMedia(0); block=20}
    wheel=0}


  function timerEvent() { 						// every 90mS
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    let top = 0; let el = myPlayer
    if (myNav.style.display) el = myPic
    else if (!playing) el = thumb
    rect = el.getBoundingClientRect()
    if (!myNav.matches(':hover') && myNav.style.display) myNav.style.display=null
    if (myNav.style.display && myTitle.value) myNav.style.width=rect.width+100+'px'
    else myNav.style.width = 84+'px'
    xm = (xpos - rect.left) / rect.width
    ym = (ypos - rect.top) / rect.height
    if (block>=30) block-=10						// wheel blocking 
    if (wheel>=10) wheel-=10
    if (cursor) cursor--
    if (!playing || thumbSheet || overText) myBody.style.cursor=null	// show default cursor
    else if (!cursor) myBody.style.cursor='none'			// hide cursor
    else myBody.style.cursor='crosshair'				// moving cursor over player
    if (editing) {capMenu.style.display='flex'} else capMenu.style.display='none'
    if (captions) Captions()
    if ((listView && thumb.style.opacity==1) || favicon.matches(':hover')) overMedia = index
    else if (myPlayer.matches(':hover') || thumb.matches(':hover')) overMedia = index
    else overMedia = 0
    myPage.innerHTML = page+' of '+pages
    mySkinny.innerHTML = myPitch.innerHTML = ''
    if (defRate==1) {mySpeed.innerHTML='Speed'} else mySpeed.innerHTML=defRate
    if (myTitle.value) {								// media exists
      mySelect.style.outline = myPlayer.style.outline = title.style.outline
      if (skinny==1) {mySkinny.innerHTML='Skinny'} else mySkinny.innerHTML=skinny.toFixed(2)
      if (rate==1) {mySpeed.innerHTML='Speed'} else mySpeed.innerHTML=rate.toFixed(2)
      if (pitch==1) {myPitch.innerHTML='Pitch'} else myPitch.innerHTML=pitch.toFixed(2)}
    else mySelect.style.outline=null
    if (outerHeight-innerHeight>30) {myMenu.style.display=null; myMask2.style.display=null} 
    else {myMenu.style.display='none'; myMask2.style.display='none'}  			// if fullscreen hide menu 
    if (!seekBar()) myProgress.style.height = mySeekbar.style.height = null
    if (favicon.innerHTML.match('\u2764')) myFavorite.innerHTML='Fav &#x2764'
    else myFavorite.innerHTML='Fav'
    if (selected) {myDelete.style.color='red'; myDelete.innerHTML='Delete ' + (selected.split(',').length -1)}
    else if (myTitle.value) {myDelete.style.color=null; myDelete.innerHTML='Delete'}
    else myDelete.innerHTML=''
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (muted) {myMute.style.color='red'} else myMute.style.color=null
    if (mpv) {myMpv.style.color='red'} else myMpv.style.color=null
    if (defPause) {myPause.style.color='red'} else myPause.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (playing && scaleY <= 0.2 && (playlist || type=='audio')) myMask.style.opacity=0.74
    else if (myNav.style.display) myMask.style.opacity=0.62
    else if (playing) myMask.style.opacity=1
    else {myMask.style.opacity=0; myMask.style.pointerEvents=null}
    if (myMask.style.opacity!=0) {myMask.style.pointerEvents='auto'; myMask.style.zIndex=Zindex}
    if (!thumbSheet && captions) srt.style.opacity=1
    else srt.style.opacity=null
    if (myPlayer.style.opacity === "0") {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) {myPlayer.volume *= 1.25} else myPlayer.volume = 1	// fade sound in/out
    if (captions && el == myPlayer) {
      if (playing == 'browser') {top = rect.bottom} else top = 300
      capMenu.style.top = top + 24 + srt.offsetHeight + 'px'; capMenu.style.left = mediaX -85 + 'px'
      srt.style.top = top + 'px'; srt.style.left = mediaX-srt.offsetWidth/2 + 'px'}
    showCues()
    if (playing=='browser') {
      myPlayer.style.zIndex=Zindex
      if (!myNav.style.display && !thumbSheet) thumb.currentTime=myPlayer.currentTime
      if (dur && !myPlayer.duration && myPlayer.readyState!==4 && type=='video' && block<25 && !thumbSheet) {
        mySelected.innerHTML='try mpv player'}
      if (type!='image' && !dur) dur=myPlayer.duration					// just in case
      myPlayer.playbackRate=rate
      if (cues.innerHTML && !thumbSheet && type!='image') myCues(myPlayer.currentTime)
      positionMedia(0)} 
    else {
      if (thumb.muted) {thumb.playbackRate=0.6} else thumb.playbackRate=1
      if (!listView && thumb.readyState===4 && thumb.duration && overMedia && !defPause) thumb.play() 
      else thumb.pause()}}


  function positionMedia(time) {							// position myPlayer in window
    if (screenLeft && !Xoff) {Xoff=screenLeft; Yoff=outerHeight-innerHeight; mediaX-=Xoff; mediaY-=Yoff}
    else if (!screenLeft && Xoff) {mediaX+=Xoff; mediaY+=Yoff; Xoff=0}
    myPlayer.style.left = mediaX - myPlayer.offsetWidth/2 +"px"
    let offset = 0
    if (captions && srt.innerHTML) offset = 140						// move player up for caption beneath
    myPlayer.style.top = mediaY - myPlayer.offsetHeight/2 - offset +"px"
    let y = scaleY
    if (thumbSheet) {
      myPlayer.style.left = innerWidth/2 - myPlayer.offsetWidth/2 +"px"
      myPlayer.style.top = innerHeight/2 - myPlayer.offsetHeight/2 +"px"
      y=0.6*aspect*innerWidth/myPlayer.offsetWidth}
    myPlayer.style.transition = time + 's'
    myPlayer.style.transform = "scale("+skinny*y+","+y+")"}


  function seekBar() {									// progress bar beneath player
    if (type=='image') return
    let el = myPlayer
    if (myPic.matches(':hover')) el=myPic
    else if (Click || overText || thumbSheet || !playing || playing=='mpv' || !myPlayer.duration || (!cursor&&!cue)) return
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
    if (myPlayer.paused && !cue) myProgress.style.height=0
    return 1}


  function setThumb() {							// sets src, poster, thumbsheet & dimensions
    myTitle.value=title.value
    if (type=='video') mySelect.innerHTML='Select '+index+' '+Time(dur)+' '+size+'mB'
    else mySelect.innerHTML='Select '+index+' Pic '+size+'kB'
    let x = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheet src folder
    x = x.replace("/temp/history/", "/thumbs/")				// in case history playlist
    let y = x.split('%20').pop().replace('.jpg', '')			// get fav start time from poster filename
    if (!isNaN(y) && y.length > 2 && y.includes('.')) {			// very likely a 'fav' suffix timestamp
      x = x.replace('%20' + y, '')}					// so remove timestamp from filename
    if (thumbSheet) myPlayer.poster = x					// to get the 6x6 thumbsheet file name
    else if (type=='video') myPlayer.poster=''
    if (!thumb.src || myPlayer.src!=thumb.src) {
      myPlayer.src=thumb.src; if (!thumbSheet) myPlayer.poster=thumb.poster}
    if (type!='image') myPic.poster=''
    else myPic.poster=thumb.poster
    if (type=='video') myPic.style.backgroundImage = 'url(\"'+x+'\")'	// use 6x6 thumbsheet src for preview sprites
    else myPic.style.backgroundImage = ''
    aspect = thumb.offsetWidth/thumb.offsetHeight
    let z = window.screen.availHeight
    if (aspect < 1) {y=z; x=z*aspect} else {y=z/aspect; x=z}		// portrait or landscape - normalised size
    myPlayer.style.width = x +'px'					// normalise player size
    if (aspect < 1) {y=120; x=120*aspect} else {y=120/aspect; x=120}	// set myPic to max 180px
    myPic.style.width = x + 'px'
    myPic.style.height = y + 'px'					// context menu thumb 
    myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'
    myPic.style.backgroundPosition = '0% 0%'				// sets to frame 1 of 6x6 thumbSheet
    if (thumbSheet) myPlayer.load()
    else if (!playing) myPlayer.currentTime=thumb.currentTime}		// fast start play


  function setPic(reset) {						// sets context image based on cursor over myPic
    let y = myPic.getBoundingClientRect()
    let x = Math.max(0, Math.min(1, ((xpos - y.left) / y.width + 0.02) ** 2 - 0.02))
    let thumbIndex = 0
    if (!reset) thumbIndex = Math.ceil(x * 35)
    const z = (5 * (thumbIndex + 1) - 1) / 200
    const offset = dur > 60 ? 20 : 0
    lastStart = offset - (z * offset) + dur * z
    if (!thumbIndex) {
      if (myPic.src != thumb.src) myPic.src = thumb.src
      lastStart = myPic.currentTime = thumb.currentTime
      return}
    else myPic.src=''
    myPic.style.backgroundPosition = `${(thumbIndex % 6) * 20}% ${Math.floor(thumbIndex / 6) * 20}%`
    myPic.style.transform = `scale(${skinny * zoom},${zoom})`
    myPic.style.left = (skinny < 0 ? y.width : 0) + 'px'}


  function getStart(id) {						// clicked thumb on 6x6 thumbsheet
    if (!myNav.matches(':hover')) myPlayer.style.opacity=0		// fade player up
    else if (!captions) setPic()					// set myPic to cursor pos
    positionMedia(0)
    if (dur) myPlayer.poster=''
    if (skinny < 0) xm = 1-xm						// if flipped media
    let row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
    let col = Math.ceil(xm * 6)
    let offset = 0
    let ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200							// see index() in inca.ahk to explain
    if (dur > 60) offset = 20						// skip movie credits...
    if (id == 'myNav' && lastClick==1) lastStart = thumb.currentTime	// over 'white space', return to time
    else if (id == 'myPic') thumb.currentTime = lastStart
    else thumb.currentTime = offset - (ps * offset) + dur * ps
    myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"
    if (longClick==1) thumb.currentTime = 1
    if (lastStart != thumb.currentTime || longClick) Play(1) 
    else Play(0)								// overide pause
    if (captions) myPlayer.play()
    thumbSheet = 0}


  function Filter(id) {							// for htm ribbon headings
    let ch = String.fromCharCode(filt + 65)
    let el = document.getElementById('my'+ch)
    if (id == 'mySearch') {el.scrollIntoView(); return}			// search letter in top panel
    let units = ''; let x = filt					// eg 30 minutes, 2 months, alpha 'A'
    el = document.getElementById(id)
    if (id == 'myType') {x=''; units='Audio'; if (filt==1) {units='Video'} else if (filt==2) units='Image'}
    if (id == 'myAlpha') x = ch
    if (id == 'mySize') {x *= 10; units = " Mb"}
    if (id == 'myDate') units = " months"
    if (id == 'myDuration') units = " minutes"
    if (!filt) {el.innerHTML = id.slice(2); el.style.color = 'pink'}
    else {el.style.color = 'red'; el.innerHTML = x+' '+units}
    if (myType.innerHTML != 'Type') myType.style.color = 'red'}


  function context() {							// right click context menu 
    block=200
    if (!thumbSheet) myPlayer.pause()
    if (overMedia || playing) {lastStart=thumb.style.start; setPic(1); myPic.style.display='block'; myNav.style.background='#15110acc'}
    else {myPic.style.display=null; myTitle.value=''; mySelect.innerHTML='Select'; myNav.style.background=null}
    zoom = 1.5
    myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'	// pop thumb out a little
    if (overMedia || playing) {myNav.style.left=xpos-85 + 'px'; myNav.style.top = ypos-85 + 'px'}
    else {myNav.style.left=xpos-68+'px'; myNav.style.top=ypos-28+'px'}
    myNav.style.display='block'
    if (playing && !captions) closePlayer()}


  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing && command != 'mpvTime') {				// text or caption has been edited
      messages += '#capEdit##' + editing + '#' + document.getElementById('srt'+editing).innerHTML.replaceAll('#', '*')
      editing = 0}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if ((el.style.rate || el.style.skinny || el.style.pitch) && !el.style.posted) {
        messages += '#editCues#'+el.style.rate+','+el.style.skinny+','+el.style.pitch+'#'+i+'#'; el.style.posted=1}}
    if (!select) {select=''} else {select=select+','}
    if (playing && command=='Favorite') select = index
    else if (selected) select = selected				// selected is super global var
    if (!value) value = ''
    if (!address) address = ''
    if (isNaN(value)) value=value.replaceAll('#', '*')			// because # is used as delimiter
    messages += '#'+command+'#'+value+'#'+select+'#'+address
    navigator.clipboard.writeText(messages)				// send messages to inca
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
    lastStart = thumb.style.start = Number(params[1]) + 0.02		// start time
    dur = Number(params[2])						// duration
    size = Number(params[3])						// file size
    if (index && !thumb.currentTime) lastStart=thumb.currentTime=thumb.style.start
    skinny = 1; pitch = 1; rate = defRate				// reset before new cues read
    if (cues && cues.innerHTML) myCues(0)				// get 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x			// custom css holds edits
    x = Number(thumb.style.skinny); if (x) skinny = x
    x = Number(thumb.style.pitch); if (x) pitch = x
    thumb.style.transform='scale('+skinny+',1)' 			// set thumb width
    if (index) setThumb()   						// src, poster
    return 1}


  function globals(pg, ps, fo, wd, mu, mv, pa, so, fi, lv, se, pl, ix) { // import globals from inca.exe
    folder=fo; page=pg; pages=ps; filt=fi; wheelDir=wd; mpv=mv;
    defPause=pa; listView=lv; selected=se; playlist=pl
    if (mu=='yes') {muted=1} else muted=0
    let key = 'pageWidth'+folder
    let x = localStorage.getItem(key)
    if (isNaN(x) || x<20 || x>100) localStorage.setItem(key, 60)	// default htm width 60%
    pageWidth = 1*localStorage.getItem(key)
    myView.style.width = 1*localStorage.getItem(key)+'%'
    key = 'pageView'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<6 || x>100) localStorage.setItem(key, 10)		// default thumb size 10em
    view = 1*localStorage.getItem(key)
    key = 'defRate'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<0.2 || x>5) localStorage.setItem(key, 1)		// default speed 1
    defRate = 1*localStorage.getItem(key)
    Filter('my'+so)							// show filter heading in red
    for (x of selected.split(',')) {if(el=document.getElementById('title'+x)) el.style.outline = '0.1px solid red'}			
    for (index=0, n=1; getParameters(n); n++) {}			// process null cues (eg. skinny, start, rate)
    if (!ix) index=1
    else index=ix
    lastMedia=ix
    Xoff=screenLeft
    Yoff=outerHeight-innerHeight
    setWidths(1,1000)							// set htm thumb widths and heights 
    getParameters(index)						// initialise current media
    if (ix && title) {							// eg. after switch thumbs/listview
      title.style.color='pink'						// highlight thumb
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
      if (el[1]=='scroll' && !time && !srt.scrollTop) {
        srt.scrollTo(0,el[2])						// scroll to text position
        if (el[3] > 100 && el[4] < 600) {srt.style.width=el[3]+'px'; srt.style.height=el[4]+'px'}} // resize textarea
      if (el[1]=='media' && el[3] && srt.scrollTop.toFixed(0) >= 1*el[0]) {src = el[2]; tm = 1*el[3]}  // swap media
      if (el[1] && 1*el[0] > time-0.1 && 1*el[0] < time+0.1) {
        if (el[1]=='next') {lastClick=2; clickEvent(0)}
        else if (el[1]=='goto' && !myPlayer.paused) {myPlayer.currentTime=thumb.style.start=thumb.currentTime=1*el[2]; myPlayer.volume=0.1}
        else if (el[1]=='rate') {if (isNaN(1*el[2])) {rate=defRate} else {rate=1*el[2]}}
        else if (el[1]=='skinny') {if (isNaN(1*el[2])) {skinny=1} else {skinny=1*el[2]; if(time) {positionMedia(2)}}}
        else if (el[1]=='pitch') {if (isNaN(1*el[2])) {pitch=1} else {pitch=1*el[2]}}
        else if (el[1]=='pause') {myPlayer.pause(); if (el[2]) setTimeout(function(){myPlayer.play()},1000*el[2])}}}
    if (type=='document' && playing) {
      if (myPlayer.paused && overText && tm && (myPlayer.src != src || tm != time)) {
        myPlayer.style.opacity = 0
        if (src.match('.jpg')) type = 'image'
        if (myPlayer.src != src)  myPlayer.poster = myPlayer.src = src	// swap out media above srt
        else if (src && tm != time) myPlayer.currentTime = tm
        if (block < 25) block = 100					// block jitter on src replace
        positionMedia(0)
        positionMedia(3)						// fade new media in
        myPlayer.style.opacity=1}
      else if (!tm && myPlayer.src != thumb.src) {setThumb(); myPlayer.currentTime=thumb.currentTime}}}


  function showCues() {
    if (!myTitle.value) myCap.innerHTML=''
    else if (type == 'document') myCap.innerHTML='Save Text'
    else if (!srt.innerHTML || captions) {myCap.innerHTML='New Caption'} else myCap.innerHTML='Captions'
    if (myTitle.value) {myCue.innerHTML='New Cue'} else myCue.innerHTML='' 
    let end = myPlayer.currentTime.toFixed(2)
    if (cue == end) end = dur
    if (cue) myCue.innerHTML = 'Start ' + cue +' '+ 'End '+ end
    else if (type=='document') if (localStorage.cue) {myCue.innerHTML='Add Media'} else myCue.innerHTML=''
    if (cue && thumb.style.skinny) myCap.innerHTML='Cue Skinny ' + skinny
    else if (cue && thumb.style.rate) myCap.innerHTML='Cue Speed ' + rate
    else if (cue && end != dur) myCap.innerHTML='GoTo ' + myPlayer.currentTime.toFixed(2)}


  function Captions() {							// grok refactored code
    if (block > 80) return
    const t = myPlayer.currentTime.toFixed(1), latest = [...document.querySelectorAll(`[id^="my${index}-"]`)]
      .reduce((a, e) => { const x = parseFloat(e.id.split('-')[1]); return x <= t && x > (a?.time ?? -1) ? { e, x } : a}, null)
    if (latest?.e !== capText) {
      if (capText) [capText.style.color, capText.style.transform] = [null, 'none']
      capText = latest?.e || ''; capTime = capText ? capText.previousElementSibling : ''
      capText && ([capText.style.color, capText.style.transform] = ['pink', 'scale(1.1,1.2)'], !overText && srt.scrollTo(0, capText.offsetTop - 20))}}


  function playCap(id, stop) {
    if (overText && ypos > srt.offsetTop && ypos < srt.offsetTop + 12) {srt.scrollTo(0,0); myPlayer.pause(); return}
    tm = id.split('-')[1]
    if (id.match('my') && (stop || capText.id != id)) myPlayer.currentTime = thumb.currentTime = tm
    else tm=0								// mpv to 'not' reset time
    if (stop || longClick) myPlayer.pause()
    else if (!id.match('my') || (capText.id==id && !editing)) togglePause()
    else if (!editing || capText.id!=id) myPlayer.play()
    else myPlayer.pause()
    if (mpv) inca('mpvTime', tm, myPlayer.paused)}


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

 
  function updateCue(item, val) {					// rate, skinny, pitch cues
    val = Math.round(1000 * val) / 1000
    thumb.style[item] = val
    thumb.style.posted = 0
    if (myTitle.value) {getParameters(index); positionMedia(0.2); setPic()}
    return val}


  function newCap(nudge) {
    if (type === 'document' || (nudge && block > 20)) return
    block = 40; // Block rapid click re-entry
    let newText = ''
    editing = index;
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
      for (let i = 0; i < captions.length; i += 2) {
        const timeId = captions[i].id.split('-')[1]
        if (Number(timeId) >= Number(t)) {
          srt.insertBefore(d, captions[i])
          srt.insertBefore(e, captions[i + 1] || null)
          inserted = true
          break}}
      if (!inserted) srt.append(d, e)}
    myNav.style.display = null
    e.focus()
    if (!captions) {openCap(); Play()}
    if (mpv) inca('mpvTime', myPlayer.currentTime, '', nudge)
    else if (nudge) myPlayer.play()
    else myPlayer.pause()}


  function closePlayer() { 
    if (type == 'image') localStorage.cue = thumb.poster+'|0.01\r\n'	// for swapping media in srt/txt files
    else if (type != 'document') localStorage.cue = thumb.src+'|'+thumb.currentTime.toFixed(2)+'\r\n'
    if (type=='document') {						// save height, width & scrollTop
      let top = srt.scrollTop.toFixed(0); let width = srt.offsetWidth; let height = srt.offsetHeight
      cues.textContent = cues.textContent.replace(/scroll\|\d+\|\d+\|\d+/, `scroll|${top}|${width}|${height}`)
      messages += '#Scroll#'+top+'|'+width+'|'+height+'#'+index+'#'}
    if (!thumbSheet) messages += '#History#'+thumb.currentTime.toFixed(1)+'#'+index+'#'
    if (playing == 'mpv') inca('closeMpv')
    else inca('Null')							// just update history
    positionMedia(0.2)
    Click=0
    playing=''
    captions=0								// in case browser not active
    thumbSheet=0
    myPlayer.style.opacity=0
    myPlayer.removeEventListener('ended', nextMedia)
    setTimeout(function() {						// fadeout before close
      myPlayer.style.zIndex=-1
      myMask.style.opacity=0
      myPlayer.pause()
      srt.style=''
      if (title.getBoundingClientRect().top>innerHeight-50) {
        title.scrollIntoView()						// scroll last media into view
        myContent.scrollBy(0,-400)}},200)}


  function cueButton() {						// context menu Cue button
    if (!cue) cue = Math.round(100*thumb.currentTime)/100
    if ((thumb.style.skinny || thumb.style.rate) && !thumb.style.posted) {capButton(); cue = 0}
    else if (type=='document' && localStorage.cue) {			// substitute media in srt/txt
      cues.innerHTML+= srt.scrollTop.toFixed(0) +'|media|'+localStorage.cue
      inca('cueMedia',cues.innerHTML,index)
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


  function sel(i) {							// highlight selected media in html
    if (!i || !Click || (gesture && Click==3) || overText || myPanel.matches(':hover')) return
    let x = ','+selected; el = document.getElementById('title' + i);
    if (x.match(','+i+',')) {selected = x.replace(','+i+',',',').slice(1); el.style.outline = null}
    else {selected=selected+i+','; el.style.outline = '0.1px solid red'}}


  function addFavorite() {
    let tm = thumb.currentTime.toFixed(2)
    inca('Favorite',tm,index,srt.scrollTop.toFixed(0))			// includes any caption/txt scroll
    if (selected) {sel(index); selected=''}				// clear selected
    favicon.innerHTML='&#10084'}					// heart symbol on htm thumb


  function nextMedia() { 						// after media finished playing
    if (!looping) {if (getParameters(index+=1)) {Play(1)} else closePlayer(); return}
    myPlayer.currentTime=thumb.style.start
    myPlayer.play(1)}


  function overThumb(id) {
    if (!thumb.paused) thumb.pause()					// pause previous thumb
    index = id
    if (Click) return							// faster for click & slide selecting
    getParameters(id)
    thumb.volume=1
    thumb.style.opacity=1
    if (lastYpos != ypos && thumb.readyState !== 4) thumb.load()	// first use with scroll blocking
    if (view > 30 && dur) {thumb.controls=1} else thumb.controls=0
    lastYpos = ypos}


  function Time(z) {if (z<0) return '0:00'; let y=Math.floor(z%60); let x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {xpos=0; skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; positionMedia(0.4); getParameters(index); setPic(1)}
  function togglePause() {
    if (overText && type=='document') return
    if (!thumbSheet && playing && myPlayer.paused) {myPlayer.play()} else myPlayer.pause()
    if (myPlayer.paused) {pause=1} else pause=0}






