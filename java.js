// Debugging - use mySelected.innerHTML or alert()


  var intervalTimer							// every 100mS
  var entry = 0								// current thumb htm container
  var thumb = 0								// current thumb element
  var title = 0								// title element
  var vtt = 0								// whole text/subtitle element
  var myVtt								// current caption element
  var wheel = 0								// mouse wheel count
  var index = 1								// thumb index (e.g. thumb14)
  var view = 14								// thumb size (em)
  var listView = 0							// list or thumb view
  var page = 1								// html media page
  var pages = 1								// how many htm pages of media
  var toggles = 0							// html ribbon headings
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var captions = 0							// captions enabled
  var type = ''								// audio, video, image, document
  var cue = 0								// cue point time
  var cueList = ''							// cue list file - appended by vtt text at play()
  var playing = ''							// myPlayer or mpv active
  var thumbSheet = 0							// 6x6 thumbsheet mode
  var looping = 1							// play next or loop media
  var Click = 0								// state is cleared after up
  var lastClick = 0							// state is preserved after up
  var lastStart = 0							// last myPlayer time
  var longClick = 0							// state is preserved
  var gesture = 0							// state is preserved
  var searchbox = ''							// search input field
  var renamebox = ''							// media rename input field
  var selected = ''							// list of selected media in page
  var overMedia = 0							// over thumb or myPlayer
  var overText = 0							// text input fields, allow cut paste
  var editing = 0							// editing textarea active
  var messages = ''							// history, width, speed & caption edits
  var Zindex = 3							// element layer
  var rect								// myPlayer dimensions
  var size = 0								// file size (from inca)
  var dur = 0								// duration (from inca)
  var rate = 1								// myPlayer speed
  var skinny = 1							// media width
  var scaleX = 0.5							// myPlayer width (skinny)
  var scaleY = 0.5							// myPlayer size
  var zoom = 1								// context myPic zoom
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var cursor								// hide cursor timer
  var block = 0								// block wheel timer
  var ratio = 1								// media width to height ratio
  var Xoff = 0								// fullscreen offsets
  var Yoff = 0
  var folder = ''							// web page name / media folder
  var defRate = 1							// default speed
  var lastMedia
  var mediaX = 1*localStorage.mediaX					// myPlayer position
  var mediaY = 1*localStorage.mediaY


  if (innerHeight>innerWidth) scaleY=0.64				// portrait style screen
  scaleX=scaleY
  intervalTimer = setInterval(timerEvent,100)				// background tasks every 100mS
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)


  document.addEventListener('keydown', (e) => { 					// keyboard events
    if (e.key=='Enter') {
      if (renamebox) inca('Rename', renamebox, lastMedia)				// rename media
      else if (myInput.matches(':focus')) inca('SearchBox','','',myInput.value)		// search media on pc
      else if (type=='document') {var x=thumb.scrollTop; setTimeout(function(){thumb.scrollTo(0,x)},100)}}
    else if (e.code=='Space' && !vtt.innerHTML) togglePause()
    else if (e.key=='Backspace' && playing && !vtt.innerHTML) {closePlayer(); inca('Close')}
    else if (e.key=='Pause' && e.altKey) {thumbSheet=1; setPlayer(); Play()}		// mpv player - show thumbsheet
    else if (e.key=='Pause' && e.shiftKey) {lastClick=3;longClick=3;clickEvent()}	// inca re-map of long right click
    else if (e.key=='Pause') {								// inca re-map of mouse 'Back' click
      myPic.style.transform='scale('+skinny+',1)'					// reset context image
      if (myNav.style.display) myNav.style.display=null
      else if (playing) {inca('Close'); closePlayer()}					// close player and send messages to inca
      else if (myContent.scrollTop > 50) myContent.scrollTo(0,0)			// else scroll to page top
      else inca('Reload',2)								// or finally, reload page & clear selected
      Click=0; lastClick=0}}, false) 


  function mouseDown(e) {								// detect long click
    Click=e.button+1; lastClick=Click; longClick=0; cursor=6
    gesture=0; Xref=xpos; Yref=ypos; block=100
    if (Click==2) e.preventDefault()							// middle click
    if (Click==2 && myPanel.matches(':hover')) return					// browser opens new tab
    clickTimer=setTimeout(function() {longClick=Click; clickEvent()},260)}


  function mouseUp(e) {
    if (!Click) return									// stop re-entry if new page load
    clearTimeout(clickTimer)
    if (Click==3 && !gesture && !longClick && yw>0.05 && !overText) context(e)		// new context menu
    if (!longClick) clickEvent()							// process click event
    Click=0; wheel=0; gesture=0}							// longClick timer


  function clickEvent() {								// functional logic
    if (gesture) return
    if (mySave.matches(':hover') || myInput.matches(':hover')) return
    if (lastClick && myTitle.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return					// copy files instead of move
    if (longClick && myRibbon.matches(':hover')) return
    if (myFavorite.matches(':hover')) {addFavorite(); return}
    if (document.getElementById('myFavicon'+index).matches(':hover')) {openCap(); myPlayer.pause(); return}
    if (title.matches(':hover')) {if (!longClick) thumb.currentTime=thumb.style.start ;return}
    if (!gesture && longClick==1 && !playing && playlist && index && selected) {inca('Move', overMedia); return}
    if (longClick==1 && playing && overText && type!='document') {vttPlay(); return}
    if (!longClick && lastClick==1) {
      if (thumbSheet) {getStart(); return}
      else if (myPlayer.matches(':hover') && ((ym<1 && ym>0.9) || yw>0.95)) {myPlayer.currentTime=xm*dur; return}
      if (myPic.matches(':hover')) {thumbSheet=0; thumb.currentTime=lastStart}
      else if (myNav.matches(':hover')) return
      else if (playing) {togglePause(); return}
      else if (!playing && !overMedia) return}
    if (longClick && overText && lastClick==1) {myPlayer.pause(); return}
    if (lastClick==3 && !longClick) return						// right click
    if (longClick==3 && type=='video') if (thumbSheet) {thumbSheet=0} else {thumbSheet=1; thumb.currentTime=lastStart}
    if (longClick==1 && !overMedia && !playing && !myNav.style.display) index = lastMedia
    if (lastClick==2) {									// middle click
      if (!playing && !myNav.style.display) {inca('View',lastMedia); return}		// switch list/thumb view
      else if (longClick) {index--} else index++}					// next, previous media
    if (!getParameters(index)) {index=lastMedia; closePlayer(); return}			// end of media list
    if (longClick==2 && myNav.style.display) return
    if (longClick==1 && (!overMedia&&playing || (!playing&&toggles.match('Pause')))) thumb.currentTime=thumb.style.start
    else if (longClick==1 && overMedia) thumb.currentTime=0.01				// cannot be zero - see getPara.
    else if (!longClick && lastClick==1 && !myPic.matches(':hover') && (thumb.style.start<2 || (dur>61 && thumb.style.start>20 && thumb.style.start<22))) thumb.currentTime=0.01						// because thumb indexing adds 20 if dur>61
    else if (!longClick && !myPic.matches(':hover') && Math.abs(thumb.style.start-thumb.currentTime) < 5 || lastClick==2) thumb.currentTime=thumb.style.start
    if (longClick==1 && cue) thumb.currentTime=cue
    if (longClick==1) thumbSheet=0
    Play()}


  function Play() {
    if (!mediaX || mediaX<0 || mediaX>innerWidth) mediaX=innerWidth/2
    if (!mediaY || mediaY<0 || mediaY>innerHeight) mediaY=innerHeight/2
    if (!scaleY || scaleY<0.2) scaleY=0.5
    if (scaleY>1.5) scaleY=1.5
    positionMedia(0)									// stabilize myPlayer position
    if (!playing) myNav.style.display=null
    myPlayer.style.transition = 'opacity 1s'
    if (!thumbSheet) myPlayer.currentTime=thumb.currentTime
    var para = myPlayer.currentTime+'|'+skinny+'|'+rate+'|'+1*localStorage.muted	// for if external player
    thumb.pause()
    myPlayer.pause()
    myPlayer.muted = 1*localStorage.muted
    if (el=document.getElementById('title'+lastMedia)) el.style.color=null		// remove highlight on last media
    if ((el=document.getElementById('vtt'+lastMedia)) && playing && index!=lastMedia) {	// hide last caption
      el.style.display=null; if (captions && vtt.innerHTML && lastClick==2) openCap()}	// next/back
    lastMedia=index
    if (!thumbSheet && toggles.match('Mpv')) {playing='mpv'; scaleY=0.5}
    else playing='browser'
    if (!thumbSheet && lastClick!=2) messages=messages+'#History#'+myPlayer.currentTime.toFixed(1)+'#'+index+'#' 
    if (lastClick==2 && playing=='mpv') return						// inca does next/previous media
    if (playing=='mpv' || thumb.src.slice(-3)=='mid') inca('Media',0,index,para)
    if (type=='document' && !captions) openCap()
    if (type=='audio' || playlist.match('/inca/music/')) {
      scaleY=0.2; looping=0; myPlayer.muted=false; if (!thumbSheet) myPlayer.poster=thumb.poster}
    if (playing=='browser' && !thumbSheet && type!='image' && !toggles.match('Pause')) myPlayer.play()
    if (captions && scaleY==0.5) scaleY=0.24						// first time open use small player
    myPlayer.addEventListener('ended', nextMedia)
    if (thumb.src.slice(-3)=='mp3') myPlayer.style.borderBottom='1px solid salmon'
    else myPlayer.style.border=null
    if (playing=='browser') myPlayer.style.opacity=1
    title.style.color='lightsalmon'
    myPlayer.style.zIndex=Zindex
    myPlayer.volume=0.05						// triggers volume fadeup
    if (looping) looping=1}


  function mouseMove(e) {
    if (screenLeft) {xpos=e.clientX; ypos=e.clientY}			// fullscreen detection/offsets
    else {xpos=e.screenX; ypos=e.screenY}
    cursor=6
    if (myPanel.matches(':hover')) mySelected.style.fontSize='3em'
    else mySelected.style.fontSize=null
    mySelected.style.left = xpos +20 +'px'
    mySelected.style.top = ypos +'px'
    if (myPic.matches(':hover') && type=='video') setPic()		// update context menu preview thumb
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (myTitle.matches(':hover')) return
    if (x+y > 7 && Click==1 && !gesture) {				// gesture (Click + slide)
      gesture=1
      if (!playing && !overText && overMedia) sel(index)
      if (myNav.style.display) {x=myNav.getBoundingClientRect(); Xref=(xpos-x.left)/skinny; Yref=ypos-x.top}}
    if (!gesture || !Click) return
    if (myNav.style.display) {						// move context menu
      myNav.style.left = xpos-Xref+"px"; myNav.style.top = ypos-Yref+"px"}
    else if (playing && !overText) {					// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      Xref=xpos; Yref=ypos
      localStorage.mediaX = mediaX.toFixed(0)
      localStorage.mediaY = mediaY.toFixed(0)
      positionMedia(0)}}


  function wheelEvent(e, id) {
    e.preventDefault()
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (Click || wheel < block) return
    block=120
    var wheelUp=false
    if (e.deltaY > 0) wheelUp=true
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
      if (!playing || screenLeft) getParameters(index)
      positionMedia(0.2)}
    else if (id=='myThumbs') { 						// thumb size
      var x=view; var z=wheel/1000
      if (x<98 && wheelUp) x *= 1+z
      else if (!wheelUp) x /= 1+z
      if (x<8) x=8
      view=x; localStorage.setItem('pageView'+folder, x); setThumbs(index,36)
      block=12}
    else if (!playing && id=='myWidth') {				// page width
      var x = 1*myView.style.width.slice(0,-1)
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
      block=80}
    else if (myPic.matches(':hover')) {  				// zoom context pic
      if (wheelUp) {zoom*=1.1} else zoom*=0.9
      myPic.style.transform='scale('+skinny*zoom+','+zoom+')'
      block=80}
    else if ((type=='video'||type=='audio') && !thumbSheet && (!overMedia||yw>0.95||ym>0.95)) {	// seek
      if (wheelUp && !myPlayer.paused && myPlayer.currentTime > dur-3) return
      if (dur > 120) interval = 3
      else interval = 0.5
      if (myPlayer.paused) interval = 0.04
      if (wheelUp && myPlayer.currentTime < dur-0.05) myPlayer.currentTime += interval
      else myPlayer.currentTime -= interval}
    else if (!myNav.style.display) {					// zoom myPlayer
      var x=0; var y=0; var z=0
      if (!thumbSheet) z=wheel/800
      if (overMedia && scaleY>1) {x = mediaX-xpos; y = mediaY-ypos}
      if (wheelUp) {mediaX+=x*z; mediaY+=y*z; scaleY*=(1+z)}
      else if (!wheelUp && scaleY) {mediaX-=x*z; mediaY-=y*z; scaleY/=(1+z)}
      if (scaleY<0.2) scaleY=0.2
      scaleX=skinny*scaleY; positionMedia(0); block=14}
    wheel=0}
 

  function timerEvent() { 						// every 100mS 
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (myNav.style.display) {el=myPic; myNav.style.width=rect.width+60+'px'}
    else if (playing=='browser') el=myPlayer
    else el=thumb
    rect = el.getBoundingClientRect()
    xm = (xpos - rect.left) / rect.width
    ym = (ypos - rect.top) / rect.height
    if (block>=30) block-=10						// wheel blocking 
    if (wheel>=10) wheel-=10
    if (cursor) cursor--
    if (!playing || thumbSheet || overText) myBody.style.cursor=null	// hide cursor
    else if (!cursor) myBody.style.cursor='none'
    else myBody.style.cursor='crosshair'
    if (captions) Captions()
    if (!vtt.innerHTML || vtt.style.display) {myCap.innerHTML='New Caption'} else myCap.innerHTML='Captions'
    mySave.style.top=rect.bottom+5+'px'; mySave.style.left=mediaX+10+'px'
    myCancel.style.top=rect.bottom+5+'px'; myCancel.style.left=mediaX-50+'px'
    if (editing) {mySave.style.display='block'; myCancel.style.display='block'} 
    else {mySave.style.display=null; myCancel.style.display=null}
    if (myPlayer.matches(':hover') || thumb.matches(':hover') || (listView && thumb.style.opacity==1)) overMedia=index
    else overMedia=0
    if (myThumbs.matches(':hover')) myThumbs.innerHTML=view.toFixed(1)
    else myThumbs.innerHTML='Size'
    myPage.innerHTML = page+' of '+pages
    if (myWidth.matches(':hover')) myWidth.innerHTML=myView.style.width
    else myWidth.innerHTML='Cols'
    if (!myNav.matches(':hover')) myNav.style.display=null
    myCue.innerHTML='Cue'
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
    if (!thumb) return
    if (type!='image' && !thumbSheet && playing!='mpv' && myPlayer.duration) seekBar()
    else mySeekbar.style.width=null
    if (document.getElementById('myFavicon'+index).innerHTML.match('\u2764')) myFavorite.innerHTML='Fav &#x2764'
    else myFavorite.innerHTML='Fav'
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (1*localStorage.muted) {myMute.style.color='red'} else myMute.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (myPlayer.style.opacity==0) {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) myPlayer.volume *= 1.3		// fade sound in/out 
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'; myPlayer.style.outline='4px solid red'}
    else {mySelect.style.color=null; myPlayer.style.outline=null}
    if (playing && scaleY <= 0.2) myMask.style.opacity=0.74
    else if (!playing && myNav.style.display && myTitle.value) {myMask.style.opacity=0.6}
    else if (playing) myMask.style.opacity=1
    else {myMask.style.opacity=0; myMask.style.pointerEvents=null}
    if (myMask.style.opacity!=0) {myMask.style.pointerEvents='auto'; myMask.style.zIndex=Zindex}
    if (playing=='browser') {
      if (!myNav.style.display) lastStart=myPlayer.currentTime
      if (type=='video' && !myPlayer.duration && myPlayer.readyState!==4 && block<25) mySelected.innerHTML='File missing or wrong type'
      if (type!='image' && !dur) dur=myPlayer.duration			// just in case
      myPlayer.playbackRate=rate
      if (cue) {myCue.innerHTML='Goto '+myPlayer.currentTime.toFixed(2)} 
      if (cueList && !thumbSheet && myPlayer.currentTime>0.1) Cues(index, myPlayer.currentTime)
      positionMedia(0)}							// in case fullscreen 
    else if (!listView && thumb.readyState===4 && thumb.duration && overMedia) {thumb.play()} else thumb.pause()}


  function positionMedia(time) {					// position myPlayer in window
    if (screenLeft && !Xoff) {Xoff=screenLeft; Yoff=outerHeight-innerHeight; mediaX-=Xoff; mediaY-=Yoff}
    else if (!screenLeft && Xoff) {mediaX+=Xoff; mediaY+=Yoff; Xoff=0}
    myPlayer.style.left = mediaX - myPlayer.offsetWidth/2 +"px"
    myPlayer.style.top = mediaY - myPlayer.offsetHeight/2 +"px"
    var y = scaleY
    if (looping>1) y*=(1+looping/14)
    if (thumbSheet) y=0.55*ratio*innerWidth/myPlayer.offsetWidth
    var x=skinny*y
    myPlayer.style.transition = time+'s'
    myPlayer.style.transform = "scale("+x+","+y+")"}


  function seekBar() {							// progress bar beneath player
    if (myNav.style.display) {el=myPic} else el=myPlayer
    if (el==myPlayer && overMedia && ym<0.95 && yw<0.95 && !cue && type!='audio') {mySeekbar.style.width=null; return}
    if (!playing && !myPic.matches(':hover')) {mySeekbar.style.width=null; return}
    var cueX = rect.left + 7
    var x = Math.round(el.currentTime*100)/100
    var cueW = 0.95*rect.width*el.currentTime/dur
    if (cue && cue<=x) {
      cueX = mediaX - rect.width/2 + rect.width * cue/dur
      cueW = rect.width*(el.currentTime-cue)/dur
      if (cue<x+0.2 && cue>x-0.2) {
        cueW = rect.width*(dur-cue)/dur}}
    else if (cue) {
      cueX = rect.left + rect.width*el.currentTime/dur
      cueW = rect.width*(cue - x)/dur
      if (cue < 0.2+x) {
        cueX = rect.left; cueW = rect.width*el.currentTime/dur}}
    if (myPic.matches(':hover')) {
      mySeekbar.style.top = rect.bottom +5 +'px'
      mySeekbar.style.left = rect.left +'px'
      mySeekbar.style.width = rect.width*lastStart/dur +'px'}
    else {
      if (rect.bottom<innerHeight) mySeekbar.style.top = rect.bottom -3 +'px'
      else mySeekbar.style.top = innerHeight -5 +'px'
      mySeekbar.style.left = cueX +'px'
      mySeekbar.style.width = cueW +'px'}}


  function setPlayer() {						// get src, poster, thumbsheet & dimensions
    myTitle.value=title.value
    if (type=='image') mySelect.innerHTML='Select '+index+' Pic '+size+'kB'
    else mySelect.innerHTML='Select '+index+' '+Time(dur)+' '+size+'mB'
    var x = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheet src folder
    var y = x.split('%20').pop().replace('.jpg', '')			// get fav start time from poster filename
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
    if (ratio<1) {y=innerHeight; x=innerHeight*ratio}			// portrait - normalised size
    else {y=innerHeight/ratio; x=innerHeight}				// landscape - normalised size
    myPlayer.style.width = x +'px'
    myPlayer.style.height = y +'px'
    myPlayer.style.top = mediaY-y/2 +'px'				// myPlayer position
    myPlayer.style.left = mediaX-x/2 +'px'
    el=thumb.getBoundingClientRect()
    myPic.style.height=el.height+'px'					// context menu thumb
    myPic.style.width=el.height*ratio+'px'
    myPic.style.transform='scale('+skinny*zoom+','+zoom+')'
    if (thumbSheet) {myPlayer.load(); vtt.style.display='none'}
    else if (!playing) myPlayer.currentTime=thumb.currentTime}		// fast start play


  function setPic() {							// context menu thumb derived from 6x6 thumbsheet
    var x = 0
    var z = myPic.getBoundingClientRect()
    var y = z.width
    if (myPic.matches(':hover')) x=(xpos-z.left)/y
    z = 20 * Math.ceil(x*35)
    y = 20 * Math.floor(z/120)
    z = z % 120
    myPic.style.backgroundPosition=z+'% '+y+'%'				// point to thumb %xy coordinate 
    z=5*(Math.ceil(x*35)+1)						// thumb number
    if (dur > 60) {y = 20} else y=0
    z = (z-1) / 200
    lastStart = y - (z * y) + dur * z
    if (!playing) myPlayer.currentTime=lastStart}


  function getStart() {							// clicked thumb on 6x6 thumbsheet
    myPlayer.style.opacity=0
    positionMedia(0)
    myPlayer.poster=''
    if (skinny < 0) xm = 1-xm						// if flipped media
    var row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
    var col = Math.ceil(xm * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200							// see index() in inca.ahk to explain
    if (dur > 60) offset = 20						// skip movie credits...
    if (longClick!=1) thumb.currentTime=offset - (ps * offset) + dur * ps
    myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"
    thumbSheet=0; Play()}


  function addFavorite() {
    var x = myPlayer.currentTime.toFixed(1)
    if (longClick) x = 0						// sets fav start to 0
    else if (!playing) x = thumb.currentTime.toFixed(1)
    inca('Favorite',x,index,vtt.scrollTop.toFixed(0))			// includes any caption/txt scroll
    document.getElementById('myFavicon'+index).innerHTML='&#10084'}	// heart symbol on htm thumb


  function nextMedia() {						// after media finished playing
    if (!looping) {if (getParameters(index+=1)) {Play()} else closePlayer(); return}
    looping+=1								// zoom each loop
    if (!longClick && rate > 0.40) rate-=0.05				// slower each loop
    myPlayer.currentTime=thumb.style.start
    positionMedia(1.6)
    myPlayer.play()}


  function Filter(id) {							// for htm ribbon headings
    var ch = String.fromCharCode(filt + 65)
    var el = document.getElementById('my'+ch)
    if (id == 'mySearch') {el.scrollIntoView(); return}			// search letter in top panel
    var units=''							// eg 30 minutes, 2 months, alpha 'A'
    el = document.getElementById(id)
    if (id == 'myAlpha') {x = ch} else x = filt
    if (id == 'mySize') {x *= 10; units = " Mb"}
    if (id == 'myDate') units = " months"
    if (id == 'myDuration') units = " minutes"
    if (!filt) {el.style.color=null; el.innerHTML=id.slice(2)}
    else {el.style.color = 'red'; el.innerHTML = x+' '+units}}


  function sel(i) {							// highlight selected media
    if (!i || Click==2) return
    var el=document.getElementById('thumb'+i)
    if (listView) el=document.getElementById('title'+i)
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.outline = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.outline = '0.1px solid red'
      else el.style.outline = '1px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}


  function context(e) {							// right click context menu
    if (playing == 'mpv') return
    zoom = 1.1
    myPic.style.transform='scale('+skinny*zoom+','+zoom+')'		// pop thumb out a little
    if (overMedia || playing) myPic.style.display='block'
    else {myPic.style.display=null; myNav.style.width=null; myTitle.value=''; mySelect.innerHTML='Select'}
    if (!playing && overMedia) {myNav.style.left=rect.left-50+'px'; myNav.style.top=rect.top-70+'px'}
    else {myNav.style.left=xpos-30+'px'; myNav.style.top=ypos-30+'px'}
    myNav.style.display='block'; setPic()}


  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing) {							// text or caption has been edited
      el=document.getElementById('vtt'+editing)
      var x=el.innerHTML.replaceAll('#', '*') 				// text cannot have # inside
      messages=messages+'#Vtt#'+el.scrollTop.toFixed(0)+'#'+editing+'#'+x
      editing=0}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if (el.style.skinny) messages = messages + '#Skinny#'+el.style.skinny+'#'+i+'#'+cue
      if (el.style.rate) messages = messages + '#Rate#'+el.style.rate+'#'+i+'#'+cue}
    if (!select) {select=''} else {select=select+','}
    if (selected && command!='Close' && command!='Reload') select=selected // selected is global value
    if (!value) value=''
    if (!address) address=''
    if (isNaN(value)) value=value.replaceAll('#', '*')			// because # is used as delimiter
    messages=messages+'#'+command+'#'+value+'#'+select+'#'+address
    navigator.clipboard.writeText(messages)				// send messages to inca
    messages=''}


  function getParameters(i) {						// set media parameters
    if (!(document.getElementById('thumb'+i))) return			// end of media list
    thumb=document.getElementById('thumb'+i)
    entry=document.getElementById('entry'+i)
    title=document.getElementById('title'+i)
    vtt=document.getElementById('vtt'+i)
    rate = defRate
    skinny = 1
    var x = thumb['ondrag'].toString().split(',')			// trick to get media parameters from htm element
    type = x[1].replaceAll('\'', '').trim()				// eg video, image
    thumb.style.start=1*x[3].trim()+0.02				// smoother thumb start in chrome
    dur = 1*x[4].trim()							// in case video is wmv, avi etc
    if (index && !thumb.currentTime) thumb.currentTime=thumb.style.start
    size = 1*x[5]							// file size
    cueList = x[2].replaceAll('\'', '').trim()
    if (cueList) Cues(i,0)   						// process 0:00 cues - width, speed etc.
    if (x=1*thumb.style.rate) rate=x					// custom css variable - rate edited
    if (x=1*thumb.style.skinny) skinny=x				// get any live width edits
    thumb.style.transform='scale('+skinny+',1)' 			// has been edited
    if (index) setPlayer()   						// src, poster
    block=90; return 1}							// allows time to detect if video can play


  function globals(pg, ps, fo, to, so, fi, lv, se, pl, ix) {		// import globals from inca.exe
    folder=fo; page=pg; pages=ps; toggles=to; filt=fi;
    listView=lv; selected=se; playlist=pl
    var key = 'pageWidth'+folder
    var x = localStorage.getItem(key)
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
      title.style.color='lightsalmon'					// highlight thumb
      title.scrollIntoView()						// scroll to thumb
      myContent.scrollBy(0,-400)}}


  function setThumbs(start, qty) {					// set thumb sizes in htm
    if (start<16) start=1
    for (i=start; el=document.getElementById('entry'+i); i++) {		// until end of list
      if (i-start>qty) break						// start at last thumb size
      el2 = document.getElementById('thumb'+i)
      x = el2.offsetWidth/el2.offsetHeight				// for portrait/landscape thumb layout
      if (!listView) {
        if (x>1) el.style.width=view+'em'
        else el.style.width=x*view+'em'
        if (x>1) {el.style.height=view/x+'em'} else el.style.height=view+'em'}}}


  function Cues(j, time) {						// process media cues- captions, speed, skinny, pauses etc.
    var x = cueList.split('#1')						// get each line entry
    for (k=0; k<x.length; k++) {					// for each line entry
      var entry = x[k].split('#2')					// time[0] cue[1] value[2] period[3]
      if (entry[1] && 1*entry[0] > time-0.1 && 1*entry[0] < time+0.1) {
        if (entry[1]=='next') {lastClick=2; clickEvent()}
        else if (entry[1]=='scroll' && time<0) vtt.scrollTo(0,entry[2])
        else if (entry[1]=='goto') {myPlayer.currentTime=thumb.style.start=thumb.currentTime=1*entry[2]; myPlayer.volume=0.001}
        else if (entry[1]=='rate' && looping<2) {if (isNaN(1*entry[2])) {rate=defRate} else {rate=1*entry[2]}}
        else if (entry[1]=='skinny') {if (isNaN(entry[2])) {skinny=1} else {skinny=1*entry[2]; if(time) {positionMedia(entry[3])}}}
        else if (entry[1]=='pause') {myPlayer.pause(); if (entry[2]) setTimeout(function(){myPlayer.play()},1000*entry[2])}}}}


  function newCue() {
    myNav.style.display=null
    if (!playing) inca('EditCue',0,index,0)
    else { myPlayer.pause()
      if (!cue) cue=Math.round(myPlayer.currentTime*100)/100
      else {inca('addCue', myPlayer.currentTime.toFixed(2), index, cue); cue=0}}}


  function overThumb(id) {
    thumb.pause()							// pause previous thumb
    index = id
    getParameters(id)
    thumb.style.opacity=1						// for listView
    if (thumb.readyState !== 4) thumb.load()				// first use
    thumb.playbackRate=0.6}						// less busy htm thumbs


  function mute() {
    if (!longClick) {
      myPlayer.volume=0.05; myPlayer.muted=1*localStorage.muted
      myPlayer.muted=!myPlayer.muted; localStorage.muted = 1*myPlayer.muted}}


  function Captions() { 						// track & highlight vtt Captions
    thumb.playbackRate=1
    vtt.style.top=myPlayer.getBoundingClientRect().bottom +'px'
    vtt.style.left=mediaX-vtt.offsetWidth/2 +'px'
    var x = index+'-'+myPlayer.currentTime.toFixed(1)
    if (el=document.getElementById('my'+x)) {
      el.style.background='black'; el.style.color='lightsalmon'
      if (el != myVtt) {if(myVtt) {myVtt.style.color=null; myVtt.style.transform='none'} myVtt=el}
      if (!thumb.paused || !myPlayer.paused) document.getElementById(x).scrollIntoView()}}


  function vttPlay() {
    if (longClick==3) newCap()
    else {
      var id = document.elementFromPoint(xpos,ypos).id
      var tm = id.split('-')[1]
      if (id.match('my')) myPlayer.pause()
      else if (!isNaN(tm)) {myPlayer.currentTime=thumb.currentTime=tm; myPlayer.play()}}}


  function openCap() {							// show captions
    captions=1
    vtt.style.display='block'
    Cues(index,-0.01)							// scroll to last
    vtt.style.zIndex=Zindex
    setTimeout(function() {vtt.style.opacity=1},100)
    if (!playing) Play()
    myNav.style.display=null}


  function newCap() {							// caption button in context menu
    var y=''								// slice new caption into vtt.innerHTML
    var w=thumb.currentTime.toFixed(3).toString().split('.')		// second and millisecond parts
    var t=thumb.currentTime.toFixed(1)
    var minutes = w[0] / 60
    var seconds = w[0] % 60						// create vtt style timestamp
    if (minutes<10) minutes='0'+minutes.toFixed(0)
    if (seconds<10) seconds='0'+seconds.toFixed(0)
    var ww = minutes+':'+seconds+'.'+w[1]
    ww = ww+' --> '+ww
    if (!vtt.innerHTML) {						// first ever caption 
      vtt.innerHTML='<d id="'+index+'-'+t+'">'+ww+'</d><e contenteditable="true" id="my'+index+'-'+t+'">______________</e>'
      document.getElementById('myFavicon'+index).innerHTML='\u00a9'}
    else { 
      for (x of vtt.innerHTML.split('</e><d id=')) {			// spool through vtt entries
        if (z = x.split('id="my'+index+'-')[1]) {				// when time >, splice in
          if (z.split('"')[0] > 1*t) {y = y+'<d id="'+index+'-'+t+'">'+ww+'</d><e contenteditable="true" id="my'+index+'-'+t+'">_________</e>'; t=99999}
          y=y+'<d id='+x+'</e>'}}
      if (t!=99999) y = y+'<d id="'+index+'-'+t+'">'+ww+'</d><e contenteditable="true" id="my'+index+'-'+t+'">______________</e>'
      vtt.innerHTML = y}
      if (!captions) openCap()
      myPlayer.pause()}


  function closePlayer() { 
    positionMedia(0.2)
    cue=0
    Click=0								// in case browser not active
    playing=''
    captions=0
    thumbSheet=0
    vtt.style.display=null
    vtt.style.opacity=null
    myNav.style.display=null
    myPlayer.style.opacity=0
    lastStart=myPlayer.currentTime
    myPlayer.removeEventListener('ended', nextMedia)
    setTimeout(function() {						// fadeout before close
      if (rect.top>innerHeight-50) {
        title.scrollIntoView()						// scroll last media into view
        myContent.scrollBy(0,-400)}
      myPlayer.style.zIndex=-1
      myMask.style.opacity=0
      myPlayer.pause()},200)}


  function Time(z) {if (z<0) return '0:00'; var y=Math.floor(z%60); var x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function togglePause() {
    if (overMedia) vtt.scrollTo(0,0)
    if (playing && myPlayer.paused && !(overText&&editing)) {myPlayer.play()} else myPlayer.pause()}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; positionMedia(0.6); thumb.style.transform='scaleX('+skinny+')'}






