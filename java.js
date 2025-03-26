// add server backend node.js
// mypreview 2024 may18
// maybe use wheel blocking on captions update


  let entry = 0								// thumb container
  let thumb = 0								// thumb element
  let title = 0								// title element
  let srt = 0								// txt or subtitle element
  let favicon = ''							// favorite or cc icon
  let capTime = ''							// srt time element
  let capText = ''							// srt caption text element
  let wheel = 0								// mouse wheel count
  let index = 1								// thumb index (e.g. thumb14)
  let view = 14								// thumb size (em)
  let listView = 0							// list or thumb view
  let page = 1								// html media page
  let pages = 1								// how many htm pages of media
  let toggles = 0							// html ribbon headings
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
  let wasEditing = 0							// was editing text
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
  let cursor = 0							// hide cursor timer
  let block = 0								// block wheel timer
  let ratio = 1								// media width to height ratio
  let Xoff = 0								// fullscreen offsets
  let Yoff = 0
  let folder = ''							// browser tab name = media folder
  let defRate = 1							// default speed


  let mediaX = 1*localStorage.mediaX					// myPlayer position
  let mediaY = 1*localStorage.mediaY
  let intervalTimer = setInterval(timerEvent,90)			// background tasks every 90mS
  if (innerHeight>innerWidth) {scaleX=0.64; scaleY=0.64}		// screen is portrait
  else {scaleX=0.5; scaleY=0.5}
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)


  document.addEventListener('keydown', (e) => { 					// keyboard events
    if (e.key == 'Enter') {
      if (renamebox) inca('Rename', renamebox, lastMedia)				// rename media
      else if (myInput.matches(':focus')) inca('SearchBox','','',myInput.value)		// search media on pc
      else if (captions) newCap()}
    else if (e.code == 'Space' && !srt.innerHTML) togglePause()
    else if (e.key == 'Backspace') {if (srt.innerHTML) {joinCap()} else closePlayer()}
    else if (e.key == 'Pause' && e.altKey) {thumbSheet = 1; setPlayer(); Play()}	// mpv player - show thumbsheet
    else if (e.key == 'Pause' && e.shiftKey) {lastClick=3; longClick=3; clickEvent()}	// inca re-map of long right click
    else if (e.key == 'Pause') {							// inca re-map of mouse 'Back' click
      myPic.style.transform = 'scale('+Math.abs(skinny)+',1)'				// reset context image
      if (myNav.style.display) myNav.style.display = null
      else if (playing) closePlayer()							// close player and send messages to inca
      else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)			// else scroll to page top
      else inca('Reload')								// or finally, reload page & clear selected
      Click=0; lastClick=0}}, false) 


  function mouseDown(e) {
    Click=e.button+1; lastClick=Click; longClick=0; cursor=6
    gesture=0; Xref=xpos; Yref=ypos
    if (Click == 2) e.preventDefault()							// middle click
    if (Click == 2 && myPanel.matches(':hover')) return					// inca opens new tab
    clickTimer = setTimeout(function() {longClick = Click; clickEvent()},260)}		// detect long click


  function mouseUp(e) {
    if (!Click) return									// stop re-entry if new page load
    clearTimeout(clickTimer)								// longClick timer
    if (gesture && window.getSelection()) localStorage.cue=''				// used for save text snip
    if (!longClick) clickEvent()							// process click event
    Click=0; wheel=0; gesture=0}


  function clickEvent() {								// functional logic
    if (gesture) return
    let id = document.elementFromPoint(xpos,ypos).id					// id under cursor
    if (longClick && myPanel.matches(':hover')) return					// copy files instead of move
    if (longClick && myRibbon.matches(':hover')) return					// html sends clicks to inca.exe
    if (lastClick == 3 && !longClick) {if (yw > 0.08) context(); return}		// custom context menu
    if (longClick == 3 && type == 'video') thumbSheet ^= 1				// toggle thumbsheet mode
    else if (longClick == 1) thumbSheet = 0
    else if (lastClick && lastClick != 2 && (thumbSheet || id == 'myPic')) {getStart(); return}
    if (lastClick == 1 && !longClick && myNav.matches(':hover') && id!='myNav') return	// but allow togglePause()
    if (lastClick == 1 && title.matches(':hover')) {if (!longClick) thumb.currentTime = thumb.style.start; return}
    if (!gesture && longClick == 1 && !playing && playlist && index && selected) {inca('Move', overMedia); return}
    if (playing && capText && (!capText.innerHTML || capText.innerHTML=="<br>")) {capTime.remove(); capText.remove(); capText=''; return}
    if (id == 'mySave' || id == 'myInput') return
    if (id == 'myForward') {newCap(0.4); return}					// move caption forward in time
    if (id == 'myBack') {newCap(-0.4); return}
if (lastClick == 1 && srt.matches(':hover')) {playCap(); return}				// play at caption
    if (lastClick == 1 && !longClick) {
      if (playing && overMedia && (ym > 0.9 || yw > 0.95)) {if (dur) myPlayer.currentTime = xm * dur; return}
//      else if (srt.matches(':hover')) {playCap(); return}				// play at caption
      else if (playing) {togglePause(); return}
      else if (!entry.matches(':hover')) return}					// not over html thumb/media
    if (longClick && overText && lastClick==1) {myPlayer.pause(); return}
    if (longClick == 1 && !playing && !myNav.style.display && !overMedia) index = lastMedia
    if (lastClick == 2) {								// middle click
      if (editing) inca('Null')
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// switch list/thumb view
      else if (longClick) {index--} else index++}					// next, previous media
    if (lastClick) myPlayer.style.opacity = 0						// fade myPlayer up
    if (!getParameters(index)) {index = lastMedia; closePlayer(); return}		// end of media list
    if (longClick == 2 && myNav.style.display) return
    if (!longClick && !playing && !overMedia && !myNav.style.display) return
    if (longClick==1 && (overMedia || id == 'myPic')) thumb.currentTime = 0.01		// cannot be zero - see getPara.
    else if (longClick==1 && (!overMedia && playing || (!playing && toggles.match('Pause')))) thumb.currentTime = thumb.style.start
    else if (!longClick && id != 'myPic') {						// because thumb indexing adds 20 if dur>61
      if (thumb.style.start < 2 || (dur > 61 && thumb.style.start > 20 && thumb.style.start < 22)) thumb.currentTime=0.01
      else if (Math.abs(thumb.style.start - thumb.currentTime) < 5 || lastClick == 2) thumb.currentTime=thumb.style.start}
    if (longClick == 1 && cue) thumb.currentTime=cue
    Play()}


  function Play() {
    if (!playing) {
      myNav.style.display=null
      if (!mediaX || mediaX<0 || mediaX>innerWidth) mediaX=innerWidth/2
      if (!mediaY || mediaY<0 || mediaY>innerHeight) mediaY=innerHeight/2
      if (!scaleY || scaleY<0.2) scaleY=0.5
      if (scaleY>1.5) scaleY=1.5}
    myPlayer.style.transition = 'opacity 0.6s'
    if (!thumbSheet) myPlayer.currentTime=thumb.currentTime
    let para = myPlayer.currentTime+'|'+skinny+'|'+rate+'|'+1*localStorage.muted	// for if mpv external player
    thumb.pause()
    myPlayer.pause()
    myPlayer.muted = 1*localStorage.muted
    if (el=document.getElementById('title'+lastMedia)) el.style.color=null		// remove highlight on last media
    if ((el=document.getElementById('srt'+lastMedia)) && playing && index!=lastMedia) {	// hide last caption
      el.style.display=null
      if (captions && srt.innerHTML && lastClick==2) openCap()}				// next/back
    lastMedia=index
    if (lastClick==1 && (favicon.matches(':hover') || type=='document')) {
      if (!longClick && srt.innerHTML) openCap()					// show cap or txt in browser
      else {Click=0; inca('Media',0,index,para); return}}				// eg. open in notepad
    if (!thumbSheet && toggles.match('Mpv')) {playing='mpv'; scaleY=0.5; inca('Media',0,index,para); return}
    else playing='browser'
    if (lastClick==2 && playing=='mpv') return						// inca does next/previous media
    if (type=='audio' || playlist.match('/inca/music/')) {scaleY=0.2; looping=0; myPlayer.muted=false}
    if (!thumbSheet && type!='image' && (!toggles.match('Pause') && !captions || longClick==1)) myPlayer.play()
    if (captions && (scaleY==0.5 || scaleY==0.2)) scaleY=0.21				// first time open use small player
    myPlayer.addEventListener('ended', nextMedia)
    if (thumb.src.slice(-3)=='txt') srt.style.padding=0
    if (thumb.src.slice(-3)=='mp3') myPlayer.style.borderBottom='2px solid pink'
    else myPlayer.style.border=null
    title.style.color='pink'
    myPlayer.style.zIndex=Zindex
    myPlayer.style.opacity=1
    myPlayer.volume=0.05						// triggers volume fadeup
    positionMedia(0)
    positionCap()
    block = 60}								// allows time to detect if video can play


  function mouseMove(e) {
    if (innerHeight==outerHeight) {xpos=e.screenX; ypos=e.screenY}	// fullscreen detection/offsets
    else {xpos=e.clientX; ypos=e.clientY}
    cursor=6
    if (myPanel.matches(':hover')) mySelected.style.fontSize='3em'
    else mySelected.style.fontSize=null
    mySelected.style.left = xpos +20 +'px'
    mySelected.style.top = ypos +'px'
    if (myPic.matches(':hover') && type=='video') setPic()		// update context menu preview thumb
    let x = Math.abs(xpos-Xref)
    let y = Math.abs(ypos-Yref)
    if (myTitle.matches(':hover')) return
    if (x+y > 7 && Click==1 && !gesture) {				// gesture (Click + slide)
      gesture=1
      if (!playing && overMedia) sel(index)
      if (myNav.style.display) {x=myNav.getBoundingClientRect(); Xref=(xpos-x.left)/skinny; Yref=ypos-x.top}}
    if (!gesture || !Click) {gesture=''; return}
    if (myNav.style.display) {myNav.style.left = xpos-Xref+"px"; myNav.style.top = ypos-Yref+"px"}  // move context menu
    else if (playing && (overMedia || !captions)) {			// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      Xref=xpos; Yref=ypos
      localStorage.mediaX = mediaX.toFixed(0)
      localStorage.mediaY = mediaY.toFixed(0)
      positionMedia(0)
      positionCap()}}


  function wheelEvent(e, id) {
    e.preventDefault()
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (Click || wheel < block) return
    block=120
    let wheelUp = e.deltaY > 0
    if (id=='myPage') {							// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--}
    else if (id=='myAlpha'||id=='myDate'||id=='myDuration'||id=='mySize'||id=='mySearch') {	// filter
      if (wheelUp) filt++ 
      else if (filt) filt--
      if ((id=='myAlpha' || id=='mySearch') && filt > 25) filt=25
      Filter(id)}
    else if (mySpeed.matches(':hover')) {				// speed
      if (!playing && !myTitle.value) rate = defRate
      if (wheelUp) rate -= 0.01
      else rate += 0.01
      rate = Math.round(100*rate)/100
      if (!playing && !myTitle.value) {defRate=rate; localStorage.setItem('defRate'+folder, rate)}
      else thumb.style.rate=rate}
    else if (mySkinny.matches(':hover') && myTitle.value) {		// skinny
      if (wheelUp) skinny -= 0.01
      else skinny += 0.01
      skinny=Math.round(1000*skinny)/1000
      thumb.style.skinny=skinny						// css holds edited skinny
      getParameters(index)						// so context myPic updated
      positionMedia(0.2)}
    else if (id=='myThumbs') { 						// thumb size
      let x=view; let z=wheel/1000
      if (x<98 && wheelUp) x *= 1+z
      else if (!wheelUp) x /= 1+z
      if (x<8) x=8
      view=x; localStorage.setItem('pageView'+folder, x); setThumbs(index,36)
      block=12}
    else if (!playing && id=='myWidth') {				// page width
      let x = 1*myView.style.width.slice(0,-1)
      if (x>=12 && wheelUp) x-=1
      else if (!wheelUp && x<=98) x+=1
      myView.style.width = x.toFixed(0)+'%'
      localStorage.setItem('pageWidth'+folder, x)
      block=12}
    else if (mySelect.matches(':hover') || myTitle.matches(':hover')) {	// next, previous media
      if (wheelUp) {index++} else if (index>1) index--
      if (!document.getElementById('entry'+index)) index--
      else if (!playing) {getParameters(index); setPic()}
      else {lastClick=0; clickEvent(); myNav.style.display='block'}
      if (myNav.style.display) myPic.style.display='block'
      block=80}
    else if (myPic.matches(':hover')) {  				// zoom context pic
      if (wheelUp) {zoom*=1.1} else zoom*=0.9
      myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'
      block=80}
    else if ((type=='video'||type=='audio') && !thumbSheet && (!overMedia||ym>0.9||yw>0.95)) {	// seek
      if (wheelUp && !myPlayer.paused && myPlayer.currentTime > dur-3) return
      if (dur > 120) interval = 3
      else interval = 0.5
      if (myPlayer.paused) interval = 0.1
      if (wheelUp && myPlayer.currentTime < dur-0.05) myPlayer.currentTime += interval
      else myPlayer.currentTime -= interval}
    else if (!myNav.style.display) {					// zoom myPlayer
      let x=0; let y=0; let z=0
      if (!thumbSheet) z=wheel/800
      if (overMedia && scaleY > 0.7) {x = mediaX-xpos; y = mediaY-ypos}
      if (wheelUp) {mediaX+=x*z; mediaY+=y*z; scaleY*=(1+z)}
      else if (!wheelUp) {mediaX-=x*z; mediaY-=y*z; scaleY/=(1+z)}
      if (scaleY<0.2) scaleY=0.2
      scaleX=skinny*scaleY; positionMedia(0); positionCap(); block=14}
    wheel=0}
 

  function timerEvent() { 						// every 90mS
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    let el = myPlayer
    if (myNav.style.display) el = myPic
    else if (!playing) el = thumb
    rect = el.getBoundingClientRect()
    if (!myNav.matches(':hover')) myNav.style.display=null
    if (myNav.style.display && myTitle.value) myNav.style.width=rect.width+85+'px'
    else myNav.style.width = 85+'px'
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
    if (myThumbs.matches(':hover')) myThumbs.innerHTML=view.toFixed(1)
    else myThumbs.innerHTML='Size'
    myPage.innerHTML = page+' of '+pages
    if (myWidth.matches(':hover')) myWidth.innerHTML=myView.style.width
    else myWidth.innerHTML='Cols'
    myCue.innerHTML='Cues'
    if (!myTitle.value) {								// no media under context menu
      mySkinny.innerHTML=''
      if (defRate==1) {mySpeed.innerHTML='Speed'} else mySpeed.innerHTML=defRate}
    else {
      if (skinny>0.99 && skinny<1.01) {mySkinny.innerHTML='Skinny'} else mySkinny.innerHTML=skinny.toFixed(2)
      if (rate==1) {mySpeed.innerHTML='Speed'} else mySpeed.innerHTML=rate.toFixed(2)}
    if (outerHeight-innerHeight>30) {myMenu.style.display=null; myMask2.style.display=null} 
    else {myMenu.style.display='none'; myMask2.style.display='none'}  			// if fullscreen hide menu 
    if (selected && !Click) mySelected.innerHTML = selected.split(',').length -1
    else if (block<25) mySelected.innerHTML = ''
    if (!seekBar()) myProgress.style.height = mySeekbar.style.height = null
    if (favicon.innerHTML.match('\u2764')) myFavorite.innerHTML='Fav &#x2764'
    else myFavorite.innerHTML='Fav'
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (1*localStorage.muted) {myMute.style.color='red'} else myMute.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (myPlayer.style.opacity==0) {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) {myPlayer.volume *=1.3} else myPlayer.volume = 1	// fade sound in/out 
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'; myPlayer.style.outline='4px solid red'}
    else {mySelect.style.color=null; myPlayer.style.outline=null}
    if (playing && scaleY <= 0.2 && playlist) myMask.style.opacity=0.74
    else if (!playing && myNav.style.display && myTitle.value) myMask.style.opacity=0.6
    else if (playing) myMask.style.opacity=1
    else {myMask.style.opacity=0; myMask.style.pointerEvents=null}
    if (myMask.style.opacity!=0) {myMask.style.pointerEvents='auto'; myMask.style.zIndex=Zindex}
    if (playing=='browser') {
      if (!myNav.style.display && !thumbSheet) lastStart=myPlayer.currentTime
      if (dur && !myPlayer.duration && myPlayer.readyState!==4 && block<25) mySelected.innerHTML='Not found or wrong type'
      if (type!='image' && !dur) dur=myPlayer.duration					// just in case
      myPlayer.playbackRate=rate
      if (type == 'document') myCap.innerHTML='Save Text'
      else if (!srt.innerHTML || srt.style.display) {myCap.innerHTML='New Caption'} else myCap.innerHTML='Captions'
      if (cue) myCue.innerHTML = 'Cue ' + cue +' '+ myPlayer.currentTime.toFixed(2)
      else if (type=='document') if (localStorage.cue) {myCue.innerHTML='Add Media'} else myCue.innerHTML=''
      else myCue.innerHTML = 'New Cue'
      if (cue && thumb.style.skinny) myCap.innerHTML='Cue Skinny ' + skinny
      else if (cue && thumb.style.rate) myCap.innerHTML='Cue Speed ' + rate
      else if (cue) myCap.innerHTML='GoTo ' + myPlayer.currentTime.toFixed(2)
      if (cues.innerHTML && !thumbSheet && type!='image') myCues(myPlayer.currentTime)
      positionMedia(0)} 
    else {
      if (!listView && thumb.readyState===4 && thumb.duration && overMedia) thumb.play() 
      else thumb.pause()
      myCap.innerHTML=''}}


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
      y=0.6*ratio*innerWidth/myPlayer.offsetWidth}
    myPlayer.style.transition = time+'s'
    myPlayer.style.transform = "scale("+skinny*y+","+y+")"}


  function seekBar() {									// progress bar beneath player
    if (type=='image') return
    let el = myPlayer
    if (myPic.matches(':hover')) el=myPic
    else if (overText || thumbSheet || !playing || (ym<0.9 && yw<0.95) || playing=='mpv' || !myPlayer.duration) return
    if (el==myPlayer && ym<0.9 && yw<0.95 && overMedia && !cue && type!='audio') return
    let cueX = rect.left + 7
    let x = Math.round(el.currentTime*100)/100
    mySeekbar.style.width = rect.width * xm + 'px'
    let cueW = 0.95 * rect.width * el.currentTime / dur
    if (cue && cue <= x) {
      cueX = mediaX - rect.width / 2 + rect.width * cue / dur
      cueW = rect.width * (el.currentTime - cue) / dur
      if (cue < x + 0.2 && cue > x - 0.2) {
        cueW = rect.width * (dur - cue) / dur}}
    else if (cue) {
      cueX = rect.left + rect.width * el.currentTime / dur
      cueW = rect.width * (cue - x) / dur
      if (cue < 0.2 + x) {
        cueX = rect.left; cueW = rect.width * el.currentTime / dur}}
    if (overMedia && !cue) myProgress.style.height = mySeekbar.style.height = '8px'
    else if (el == myPic) mySeekbar.style.height = '5px'
    else {myProgress.style.height = '5px'; mySeekbar.style.height = null}
    if (rect.bottom > innerHeight) myProgress.style.top = mySeekbar.style.top = innerHeight -15 +'px'
    else myProgress.style.top = mySeekbar.style.top = (rect.top + rect.height - myProgress.offsetHeight) + 'px';
    myProgress.style.left =  mySeekbar.style.left = cueX +'px'
    myProgress.style.width = cueW +'px'
    return 1}


  function setPlayer() {						// get src, poster, thumbsheet & dimensions
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
    ratio = thumb.offsetWidth/thumb.offsetHeight
    let z = window.screen.availHeight
    if (ratio<1) {y=z; x=z*ratio} else {y=z/ratio; x=z}			// portrait or landscape - normalised size
    myPlayer.style.width = x +'px'					// normalise player size
    el=thumb.getBoundingClientRect()
    myPic.style.height=el.height+'px'					// context menu thumb 
    myPic.style.width=el.height*ratio+'px'
    myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'
    if (thumbSheet) {myPlayer.load(); srt.style.opacity=null}
    else if (!playing) myPlayer.currentTime=thumb.currentTime}		// fast start play


  function setPic() {							// context menu thumb derived from 6x6 thumbsheet
    let x = 0
    let z = myPic.getBoundingClientRect()
    let y = z.width
    if (myPic.matches(':hover')) x=(xpos-z.left)/y
    z = 20 * Math.ceil(x*35)
    y = 20 * Math.floor(z/120)
    z = z % 120
    myPic.style.backgroundPosition=z+'% '+y+'%'				// point to thumb xy coordinate 
    z=5*(Math.ceil(x*35)+1)						// thumb number 1-36
    if (dur > 60) {y = 20} else y=0
    z = (z-1) / 200
    lastStart = y - (z * y) + dur * z
    if (!playing) myPlayer.currentTime=lastStart}


  function getStart() {							// clicked thumb on 6x6 thumbsheet
    if (!myNav.matches(':hover')) myPlayer.style.opacity=0		// fade player up
    positionMedia(0)
    if (dur) myPlayer.poster=''
    if (skinny < 0) xm = 1-xm						// if flipped media
    let row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
    let col = Math.ceil(xm * 6)
    let offset = 0
    let ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200							// see index() in inca.ahk to explain
    if (dur > 60) offset = 20						// skip movie credits...
    if (myPic.matches(':hover')) thumb.currentTime=lastStart
    else if (!longClick) thumb.currentTime=offset - (ps * offset) + dur * ps
    myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"
    thumbSheet=0; Play()
    if (captions) {srt.style.opacity=1; myPlayer.play()}}


  function nextMedia() {						// after media finished playing
    if (!looping) {if (getParameters(index+=1)) {Play()} else closePlayer(); return}
    myPlayer.currentTime=thumb.style.start
    myPlayer.play()}


  function Filter(id) {							// for htm ribbon headings
    let ch = String.fromCharCode(filt + 65)
    let el = document.getElementById('my'+ch)
    if (id == 'mySearch') {el.scrollIntoView(); return}			// search letter in top panel
    let units=''							// eg 30 minutes, 2 months, alpha 'A'
    el = document.getElementById(id)
    if (id == 'myAlpha') {x = ch} else x = filt
    if (id == 'mySize') {x *= 10; units = " Mb"}
    if (id == 'myDate') units = " months"
    if (id == 'myDuration') units = " minutes"
    if (!filt) {el.innerHTML=id.slice(2)}
    else {el.style.color = 'red'; el.innerHTML = x+' '+units}}


  function sel(i) {							// highlight selected media in html
    if (!i || Click==2 || overText) return
    let el=document.getElementById('thumb'+i)
    if (listView) el=document.getElementById('title'+i)
    let x = ','+selected
    if (x.match(","+i+",")) {
      el.style.outline = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.outline = '0.1px solid red'
      else el.style.outline = '1px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}


  function context() {							// right click context menu
    if (playing == 'mpv') return
    block=200
    if (overMedia || playing) {setPic(); myPic.style.display='block'; myNav.style.background='#15110acc'}
    else {myPic.style.display=null; myTitle.value=''; mySelect.innerHTML='Select'; myNav.style.background=null}
    zoom = 1.5
    myPic.style.transform='scale('+Math.abs(skinny)*zoom+','+zoom+')'	// pop thumb out a little
    if (!playing && overMedia) {myNav.style.left=rect.left-74+'px'; myNav.style.top=rect.top-74+'px'}
    else {myNav.style.left=xpos-30+'px'; myNav.style.top=ypos-30+'px'}
    myNav.style.display='block'}


  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing) {							// text or caption has been edited
      let x = document.getElementById('srt'+editing).innerHTML.replaceAll('#', '*')
      messages += '#capEdit#' + srt.scrollTop.toFixed(0) + '#' + editing + '#' + x
      editing = 0; wasEditing = 1}					// used to reload html after myPlayer close
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if (el.style.skinny) messages += '#Skinny#'+el.style.skinny+'#'+i+'#'+cue
      if (el.style.rate) messages += '#Rate#'+el.style.rate+'#'+i+'#'+cue}
    if (!select) {select=''} else {select=select+','}
    if (playing && command=='Favorite') select=index
    else if (selected) select=selected					// selected is super global var
    if (!value) value=''
    if (!address) address=''
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
    rate = defRate
    skinny = 1
    let params = entry.dataset.params.split(',')
    type = params[0]							// media type eg. video
    thumb.style.start = start = Number(params[1]) + 0.02		// start time
    dur = Number(params[2])						// duration
    size = Number(params[3])						// file size
    if (index && !thumb.currentTime) lastStart=thumb.currentTime=thumb.style.start
    if (cues && cues.innerHTML) myCues(0)				// process default 0:00 cues - width, speed etc.
    let x = Number(thumb.style.rate); if (x) rate = x			// custom css variable - rate edited
    x = Number(thumb.style.skinny); if (x) skinny = x			// get any live width edits
    thumb.style.transform='scale('+skinny+',1)' 			// set thumb width
    if (index) setPlayer()   						// src, poster
    return 1}


  function globals(pg, ps, fo, to, so, fi, lv, se, pl, ix) {		// import globals from inca.exe
    folder=fo; page=pg; pages=ps; toggles=to; filt=fi;
    listView=lv; selected=se; playlist=pl
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
    if (isNaN(x) || x<0.2 || x>5) localStorage.setItem(key, 0.95)	// default speed 0.95
    defRate = 1*localStorage.getItem(key)
    Filter('my'+so)							// show filter heading in red
    for (x of selected.split(',')) {if (x && !isNaN(x)) {		// highlight selected media			
      if (lv && (el=document.getElementById('title'+x))) el.style.outline = '0.1px solid red'
      else if (el=document.getElementById('thumb'+x)) el.style.outline = '1.5px solid red'}} 
    for (index=0, n=1; getParameters(n); n++) {}			// process null cues (eg. skinny, start, rate)
    if (!ix) index=1
    else index=ix
    lastMedia=ix
    Xoff=screenLeft
    Yoff=outerHeight-innerHeight
    setThumbs(1,1000)							// set htm thumb widths and heights 
    getParameters(index)						// initialise current media
    if (ix && title) {							// eg. after switch thumbs/listview
      title.style.color='pink'						// highlight thumb
      title.scrollIntoView()						// scroll to thumb
      myContent.scrollBy(0,-400)}}


  function setThumbs(start, qty) {					// set thumb sizes in htm
    if (start<16) start=1
    for (i=start; el=document.getElementById('entry'+i); i++) {		// until end of list
      if (i-start>qty) break
      el2 = document.getElementById('thumb'+i)
      x = el2.offsetWidth/el2.offsetHeight				// for portrait/landscape thumb layout
      if (!listView) {
        if (x>1) el.style.width=view+'em'
        else el.style.width=x*view+'em'
        if (x>1) {el.style.height=view/x+'em'} else el.style.height=view+'em'}}}


  function myCues(time) {						// media scrolls, speed, skinny, pauses etc.
    let src=''; let tm=''						// for swap out media above srt/txt
    let x = cues.innerHTML.split(/[\r\n]/)
    for (k=0; k<x.length; k++) {					// process each line entry
      let el = x[k].split('|')						// time[0] cue[1] value[2] period[3]
      if (el[1]=='scroll' && el[3] && srt.scrollTop.toFixed(0) >= 1*el[0]) {src = el[2]; tm = 1*el[3]}  // swap media
      if (el[1] && 1*el[0] > time-0.1 && 1*el[0] < time+0.1) {
        if (el[1]=='next') {lastClick=2; clickEvent()}
        else if (el[1]=='scroll' && !time && !srt.scrollTop) srt.scrollTo(0,el[2])
        else if (el[1]=='goto' && !myPlayer.paused) {myPlayer.currentTime=thumb.style.start=thumb.currentTime=1*el[2]; myPlayer.volume=0.1}
        else if (el[1]=='rate') {if (isNaN(1*el[2])) {rate=defRate} else {rate=1*el[2]}}
        else if (el[1]=='skinny') {if (isNaN(el[2])) {skinny=1} else {skinny=1*el[2]; if(time) {positionMedia(2)}}}
        else if (el[1]=='pause') {myPlayer.pause(); if (el[2]) setTimeout(function(){myPlayer.play()},1000*el[2])}}}
    if (type=='document' && playing) {
      if (myPlayer.paused && overText && tm && (myPlayer.src != src || tm != time)) {
        myPlayer.style.opacity=0
        if (src.match('.jpg')) type = 'image'
        if (myPlayer.src != src)  myPlayer.poster = myPlayer.src = src	// swap out media above srt
        else if (src && tm != time) myPlayer.currentTime = tm
        if (block < 25) block = 100					// block jitter on src replace
        positionMedia(4)						// fade new media in
        myPlayer.style.opacity=1}
      else if (!tm && myPlayer.src != thumb.src) {setPlayer(); myPlayer.currentTime=thumb.currentTime}}}


  function overThumb(id) {
    if (thumb) thumb.pause()						// pause previous thumb
    index = id
    if (Click) return							// faster for click & slide selecting
    getParameters(id)
    thumb.style.opacity=1						// for listView
    if (thumb.readyState !== 4) thumb.load()				// first use
    thumb.playbackRate=0.6}						// less busy htm thumbs


  function Captions() {							// grok refactored code
    const t = myPlayer.currentTime.toFixed(1), latest = [...document.querySelectorAll(`[id^="my${index}-"]`)]
      .reduce((a, e) => { const x = parseFloat(e.id.split('-')[1]); return x <= t && x > (a?.time ?? -1) ? { e, x } : a}, null)
    if (latest?.e !== capText) {
      if (capText) [capText.style.color, capText.style.transform] = [null, 'none']
      capText = latest?.e || ''; capTime = capText ? capText.previousElementSibling : ''
      capText && ([capText.style.color, capText.style.transform] = ['pink', 'scale(1.1,1.2)'], !overText && srt.scrollTo(0, capText.offsetTop - 20))}}


  function playCap() {
    if (overText && ypos > srt.offsetTop && ypos < srt.offsetTop + 12) return srt.scrollTo(0,0), myPlayer.pause()
    const id = document.elementFromPoint(xpos,ypos).id, tm = id.split('-')[1]
    if (!id.match('my') || (capText.id==id && !editing)) togglePause()
    else if (!editing || capText.id!=id) myPlayer.play()
    else myPlayer.pause()
    if (capText.id!=id && capTime.id!=id && !myPlayer.paused) myPlayer.currentTime = thumb.currentTime = tm
    if (longClick==1) myPlayer.pause()}


  function openCap() {							// show captions
    captions=1
    srt.style.opacity=0
    srt.style.display='block'
    myNav.style.display=null
    myCues(0)								// scroll to caption
    srt.style.zIndex=Zindex
    setTimeout(function() {srt.style.opacity=1},300)}


  function joinCap() {							// join to cap above
    let text = window.getSelection().getRangeAt(0).toString()
    if (window.getSelection().anchorOffset) return			// cursor not at beginning of caption
    if (text == capText.textContent) capText.textContent = ''
    else if (text) return
    myPlayer.currentTime=1*capTime.previousElementSibling.id.split('-')[1] // set player to previous caption
    capText.previousElementSibling.remove()				// remove timestamp
    capText.previousElementSibling.textContent+=' '+capText.textContent	// add caption to previous caption
    capText.remove()							// remove old caption
    editing = index}


  function newCap(nudge) {						// new or edit caption
    if (type=='document' || (nudge && block>20)) {return} else block = 40  // block rapid click re-entry
    let y = ''
    let newText = ''
    editing = index
    if (capTime) myPlayer.currentTime = 1*capTime.id.split('-')[1]	// set player to caption start
    if (nudge) {							// + - buttons to move timestamp up/down
      newText = capText.textContent
      myPlayer.currentTime += nudge
      capTime.remove(); capText.remove()}
    else if (captions && capText.nextElementSibling) {			// split caption at cursor
      capText.style.color = null; capText.style.transform = 'none'
      let cursor = 0
      let offset = 0
      let range = window.getSelection().getRangeAt(0)
      for (let i = 0; i < capText.childNodes.length; i++) {		// Venice.ai created this code fragment
        const node = capText.childNodes[i]
        if (node === range.startContainer) {cursor += range.startOffset; break}
        if (node.nodeType === Node.TEXT_NODE) cursor += node.textContent.length}
      let z = capText.textContent.replace(/<[^>]*>/g,'')
      newText = z.substring(cursor).trim()				// caption text after cut
      capText.textContent = z.substring(0, cursor).trim()		// caption text before cut
      let ratio = capText.textContent.length/z.length			// ratio of text split
      let id1=1*capTime.id.split('-')[1]				// time of original caption
      let id2=1*capText.nextElementSibling.id.split('-')[1]		// time of new caption
      myPlayer.currentTime += (id2-id1)*ratio - 0.5}			// best guess for new timestamp
    if (!newText) newText = '________'
    if (playing) thumb.currentTime = myPlayer.currentTime
    let w = thumb.currentTime.toFixed(3).toString().split('.')		// second and millisecond parts
    let t = thumb.currentTime.toFixed(1)
    let minutes = Math.floor(w[0] / 60).toFixed(0)
    let seconds = (w[0] % 60).toFixed(0)				// create srt style timestamp
    if (minutes<10) minutes='0'+minutes
    if (seconds<10) seconds='0'+seconds
    let ww = minutes+':'+seconds+','+w[1]
    if (el=capText.nextElementSibling) ww = ww+' --> '+ el.innerHTML.split(' --')[0] // use start of next caption
    else ww = ww+' --> '+ww
    if (!srt.innerHTML) {						// first ever caption 
      srt.innerHTML='<d id="'+index+'-'+t+'">'+ww+'</d><e contenteditable="true" id="my'+index+'-'+t+'">'+newText+'</e>'
      favicon.innerHTML='\u00a9'}
    else {
      for (x of srt.innerHTML.split('</e><d id=')) {			// spool through srt entries
        if (z = x.split('id="my'+index+'-')[1]) {			// when time >, splice in
          if (z.split('"')[0] > 1*t) {
            y = y+'<d id="'+index+'-'+t+'">'+ww+'</d><e contenteditable="true" id="my'+index+'-'+t+'">'+newText+'</e>'; t=99999}
          y=y+'<d id='+x+'</e>'}}
      if (t!=99999) y = y+'<d id="'+index+'-'+t+'">'+ww+'</d><e contenteditable="true" id="my'+index+'-'+t+'">'+newText+'</e>'
      srt.innerHTML = y}
    myNav.style.display = null
    if (!captions) {openCap(); Play()}
    else if (nudge) {myPlayer.play()} else myPlayer.pause()
    }


  function closePlayer() {
    if (type == 'image') localStorage.cue = thumb.poster+'|0.01\r\n'	// for swapping media in srt/txt files
    else if (type != 'document') localStorage.cue = thumb.src+'|'+myPlayer.currentTime.toFixed(2)+'\r\n'
    if (!thumbSheet) messages += '#History#'+myPlayer.currentTime.toFixed(1)+'#'+index+'#'
    if (playing=='mpv') inca('closeMpv')
    else if (editing || wasEditing) inca('Reload', index)		// saves edited text and reloads html
    else inca('Null')							// just update history
    positionMedia(0.2)
    cue=0
    Click=0								// in case browser not active
    playing=''
    captions=0
    thumbSheet=0
    srt.style.opacity=null
    myNav.style.display=null
    myPlayer.style.opacity=0
    thumb.currentTime=lastStart
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
    if (!playing) inca('editCue',0,index,0)				// open cues in notepad
    else {
      if (!cue) cue=Math.round(myPlayer.currentTime*100)/100
      if (thumb.style.skinny || thumb.style.rate) capButton()
      else if (type=='document' && localStorage.cue) {			// substitute media in srt/txt
        cues.innerHTML+= srt.scrollTop.toFixed(0) +'|scroll|'+localStorage.cue
        inca('cueText',cues.innerHTML,index)}}
    myNav.style.display=null
    if (dur) myPlayer.pause()}


  function capButton() {						// context menu Cap button
    let x = cue+'|goto|'+myPlayer.currentTime.toFixed(2)
    if (thumb.style.skinny) x = cue+'|skinny|'+thumb.style.skinny
    if (thumb.style.rate) x = cue+'|rate|'+thumb.style.rate
    thumb.style.skinny = thumb.style.rate = 0
    if (playing && type == 'document') inca('saveText')
    else if (cue) inca('addCue', x, index)				// add skinny, rate or goto cue
    else if (myTitle.value) if (!srt.innerHTML || captions) {newCap()} else {openCap(); Play()}
    wasEditing=index; cue=0}


  function positionCap() {
    let rect = myPlayer.getBoundingClientRect()
    if (thumb.src.slice(-3)=='txt') srt.style.height = '24em';
    capMenu.style.top = rect.bottom + 24 + srt.offsetHeight + 'px'; capMenu.style.left = mediaX -85 + 'px'
    srt.style.top = rect.bottom + 'px'; srt.style.left = mediaX-srt.offsetWidth/2 + 'px'}


  function addFavorite() {
    let tm = myPlayer.currentTime.toFixed(1)
    if (longClick) tm = 0						// sets fav start to 0
    else if (!playing) tm = thumb.currentTime.toFixed(1)
    inca('Favorite',tm,index,srt.scrollTop.toFixed(0))			// includes any caption/txt scroll
    if (selected) {sel(index); selected=''}				// clear selected
    favicon.innerHTML='&#10084'}					// heart symbol on htm thumb


  function mute() {
    if (!longClick) {
      myPlayer.volume=0.05; myPlayer.muted=1*localStorage.muted
      myPlayer.muted=!myPlayer.muted; localStorage.muted = 1*myPlayer.muted}}

  function Time(z) {if (z<0) return '0:00'; let y=Math.floor(z%60); let x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; positionMedia(0.4); getParameters(index)}
  function togglePause() {
    if (overText && type=='document') return
    if (!thumbSheet && !longClick && playing && myPlayer.paused) {myPlayer.play()} else myPlayer.pause()}






