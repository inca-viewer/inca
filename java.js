
// Debugging - use mySelected.innerHTML or alert()
// always backup your data
// rem. remove redirect favs to snips - due to reduced ssd library
// fav and pause failing due to above referencing src from list rather than pre-edited html
// cue edits need to be treated similar to skinny/speed edits

// why does dur variable exist
// rem. ' apostraphy not filtered in processMessage() .ahk
// page size should be like view on page
// page pages keep resetting 
// trackpad gestures/keyboard to close player
// easily adjust timestamps and add new ones
// seekbar width if vtt and skinny is set
// crash if not indexed 
// height of textarea change with view size
// something is slowing down ahk key response - close osk etc and location bar slow
// seekbar dissappears on big zoom again mostly shorts???
// next caption button ??
// edit down text books folder
// use session storage for padding page size, width view listview ?
// cannot zoom properly mp3 icon or seekbar 
// if files dont get released from chrome, keep selected and remove file error delays
// fav scrollto vtt issues if many favs having same media
// allow wheel scroll panel over headings ribbon 
// remove all view code from ahk etc
// change page width id from 'width'
// change view to pageView and fix view myview names
// rem simplify/check view wheel code
// simplify muted localStorage
// previous thumb to pause when play new
// last media start (longclick)
// address := StrReplace(address, "< style="font-family:inherit;font-size:1.1em;">span>") ??
// cannot select or del media if no vtt - ceara
// have page, vtt height and thumb qty on ribbon
// text editing text issues still random <font> entries
// have thumb fade opacity up in vtt entry
// get start zoom from new fixed thumb
// drag thumb properly
// seek allowed on thumb if mouse is over and playing
// also if thumb popped can seek
// 'caps' button in ribbon to show hide subtitles
// listview flip loses skinny edits and loses page formatting if music folder with no thumnbs
// can't edit music plist thumb around
// add height control to add/remove cue text



  var mediaX = 1*localStorage.mediaX					// myPlayer position
  var mediaY = 1*localStorage.mediaY
  var intervalTimer							// every 100mS
  var thumb = 0								// thumb element
  var title = 0								// title element
  var vtt = 0								// text/subtitle element
  var wheel = 0								// mouse wheel count
  var index = 1								// thumb index (e.g. thumb14)
  var lastStart = 0							// last video start time
  var cueIndex = -1							// current cue entry
  var view = 14								// thumb size (em)
  var listView = 0							// list or thumb view
  var page = 1								// html media page
  var pages = 1								// how many htm pages of media
  var toggles = 0							// html ribbon headings
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var type = ''								// audio, video, image, document
  var cue = 0								// cue point time
  var cueList = ''							// full caption text file
  var playing = ''							// myPlayer or mpv active
  var thumbSheet = 0							// 6x6 thumbsheet mode
  var looping = 1							// play next or loop media
  var lastClick = 0							// state is preserved
  var Click = 0								// state cleared after mouseUp()
  var longClick = 0							// state is preserved
  var gesture = 0							// state is preserved
  var searchbox = ''							// search input field
  var renamebox = ''							// media rename input field
  var selected = ''							// list of selected media in page
  var overMedia = 0							// over thumb or myPlayer
  var wasMedia = 0							// before context menu
  var overText = 0							// text input fields, allow cut paste
  var editing = 0							// editing textarea active
  var messages = ''							// history, width, speed & caption edits
  var Zindex = 3							// element layer
  var rect								// myPlayer dimensions
  var size = 0								// file size (from inca)
  var dur = 0								// duration (from inca)
  var rate = 1								// myPlayer speed
  var skinny = 1							// media width
  var scaleX = 0.24							// myPlayer width (skinny)
  var scaleY = 0.24							// myPlayer size
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
  var Xoff = 0								// window offsets before fullscreen
  var Yoff = 0
  var folder = ''							// web page name / media folder
  var defRate = 1							// default speed


  if (innerHeight>innerWidth) scaleY=0.32
  scaleX=scaleY
  intervalTimer = setInterval(timerEvent,100)				// background tasks every 100mS
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)


  document.addEventListener('keydown', (e) => {				// keyboard events
    if (e.key=='Enter') {
      if (renamebox) inca('Rename', renamebox, wasMedia)				// rename media
      else if (myInput.matches(':focus')) inca('SearchBox','','',myInput.value)		// search media on pc
      else if (type=='document') {var x=thumb.scrollTop; setTimeout(function(){thumb.scrollTo(0,x)},100)}}
    else if (e.key=='Pause' && e.altKey) {thumbSheet=1; setPlayer(); Play()}	// mpv player - show thumbsheet
    else if (e.key=='Pause' && e.shiftKey) {lastClick=3;longClick=3;clickEvent()}	// inca re-map of long right click
    else if (e.key=='Pause') {								// inca re-map of mouse 'Back' click
      Click=0; lastClick=0
      if (myNav.style.display) myNav.style.display=null
      else if (playing) closePlayer()					// close media player
      else if (thumb.style.position=='fixed') {				// close popped out thumb
        thumb.style.position=null
        thumb.style.maxWidth=view+'em'
        thumb.style.maxHeight=view+'em'
        thumb.style.top=null; thumb.style.left=null
        thumb.removeEventListener('wheel', wheelEvent)}
      else if (!thumb.paused) thumb.load()				// stop thumb
      else if (myView.scrollTop > 50) myView.scrollTo(0,0)		// else scroll to page top
      else inca('Reload')}}, false)					// or reload page


  function mouseDown(e) {						// detect long click
    Click=e.button+1; lastClick=Click; longClick=0; cursor=6
    gesture=0; Xref=xpos; Yref=ypos; block=100
    sessionStorage.setItem('scroll', myView.scrollTop)  
    if (Click==2) e.preventDefault()					// middle click
    else if (!myNav.matches(':hover')) {
      if (overMedia || playing) wasMedia=index
      else wasMedia=0}
    if (Click==2 && myPanel.matches(':hover')) return			// browser opens new tab
    clickTimer=setTimeout(function() {longClick=Click; clickEvent()},240)}


  function mouseUp(e) {
    if (!Click) return							// page load while mouse still down - ignore 
    if (Click==3 && !gesture && !longClick && ((yw>0.2&&!overText)||playing)) context(e)  // new context menu
    if (Click==2 && !playing) inca('View',index)			// middle click - switch list/thumb view
    else if (!longClick) clickEvent()					// process click event
    Click=0; wheel=0; gesture=0; longClick=0
    clearTimeout(clickTimer)}						// longClick timer


  function overThumb(id, el, st) {					// play htm thumb
    overMedia = id
    if (!playing) getParameters(id)
    if (thumb.readyState !== 4) thumb.load()
    thumb.playbackRate = defRate
    thumb.muted = 1*localStorage.muted
if (!thumb.currentTime) thumb.currentTime=st
    if (type!='image' && overMedia) thumb.style.start=st
    if (!playing) myPlayer.currentTime = thumb.style.start		// for fast start
    if (Click && gesture) sel(id)}


  function clickEvent() {								// functional logic
    if (!playing && overText) return
    if (!mySeekbar.style.width) if (!playing && thumb.paused && overMedia) {thumb.play()} else thumb.pause()
    if (thumb.matches(':hover') && (ym<1 && ym>0.8)) {thumb.currentTime=xm*dur; return}
    if (!playing && !longClick && lastClick==1 && !myNav.style.display) return
    if (el=document.getElementById('title'+index)) el.style.borderTop=null		// remove highlight on last media
    if (overMedia && lastClick!=2) index=overMedia
    if (gesture || title.matches(':hover')) return					// allow rename of media in htm
    if (longClick && myRibbon.matches(':hover')) return
    if (longClick && myInput.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return					// copy files instead of move
    if (lastClick==3 && (!longClick || (!playing && !overMedia && !myNav.matches(':hover')))) return
    if (!longClick && lastClick==1) {
      if (myPic.matches(':hover')) {myPlayer.currentTime=myPic.style.start; thumbSheet=0; lastClick=0}
      else if (myNav.matches(':hover') && !myTitle.matches(':hover')) return
      else if (!playing && !overMedia) return}
    if (!gesture && longClick==1 && !playing && playlist && wasMedia && selected) {inca('Move', overMedia); return}
    if (playing && lastClick==1) {
      if (thumbSheet) {getStart(); return}
      if (myPlayer.matches(':hover') && (ym<1 && ym>0.9)) {myPlayer.currentTime=xm*dur; return}
      else if (!longClick) {togglePause(); return}}
    if (!playing) {
      if (!mediaX || mediaX<0 || mediaX>innerWidth) mediaX=innerWidth/2
      if (!mediaY || mediaY<0 || mediaY>innerHeight) mediaY=innerHeight/2
      if (!scaleY || scaleY>2 || scaleY<0.1) scaleY=0.7}
    if (playing && lastClick==2) if (longClick) {index--} else index++			// next, previous media
    if (lastClick==1 || lastClick==3) thumbSheet=0
    if (longClick==3 && type=='video') thumbSheet=1					// show thumbsheet
    if (!getParameters(index)) {closePlayer(); return}					// end of media list
    positionMedia(0)
    if (lastClick==2) myPlayer.currentTime=thumb.style.start
    else if (longClick==1 && !overMedia && !playing) myPlayer.currentTime=lastStart	// return to last media
    else if (longClick==1 && !overMedia) myPlayer.currentTime=0
    else if (!thumbSheet && !myNav.style.display) myPlayer.currentTime=thumb.currentTime
    Play()}


  function Play() {
    thumb.pause()
    positionMedia(0)							// stabilize myPlayer position
    var para = myPlayer.currentTime+'|'+skinny+'|'+rate+'|'+1*localStorage.muted
    if (!thumbSheet && type=='video' && toggles.match('Mpv')) playing='mpv'
    else playing='browser'
    myPlayer.pause()
    myPlayer.muted = 1*localStorage.muted
    if (!thumbSheet && lastClick) messages=messages+'#History#'+myPlayer.currentTime.toFixed(1)+'#'+index+'#' 
    if (lastClick==2 && playing=='mpv') return								// inca does next/previous media
    if (type=='document' || type=='m3u') {closePlayer(); inca('Media',0,index); return}			// use external player
    else if (playing=='mpv' || thumb.src.slice(-3)=='mid' || thumb.poster.slice(-3)=='gif') inca('Media',0,index,para)
    if (type=='audio' || playlist.match('/inca/music/')) {scaleY=0.1; looping=0; myPlayer.muted=false; myPlayer.poster=thumb.poster}
    if (playing=='browser' && (longClick==1 || !thumbSheet && type != 'image' && !toggles.match('Pause'))) myPlayer.play()
    myPlayer.addEventListener('ended', nextMedia)
    myPlayer.style.transition = 'opacity 1s'
    if (thumb.src.slice(-3)=='mp3') myPlayer.style.border='4px solid salmon'
    else myPlayer.style.border=null
    if (playing=='browser' && thumb.poster.slice(-3)!='gif') myPlayer.style.opacity=1
    title.style.borderTop='1px solid salmon'
    myPlayer.style.zIndex = Zindex+=1								// because htm thumbs use Z-index
    myMask.style.zIndex=Zindex
    myMask.style.display='flex'
    myBody.style.cursor='none'
    myNav.style.display=null
    myPlayer.volume=0.05
    if (looping) looping=1
    cueIndex=-1; lastClick=0}


  function mouseMove(e) {
    xpos=e.clientX
    ypos=e.clientY
    cursor=6
    if (!thumb) return
    if (myPanel.matches(':hover')) mySelected.style.fontSize='3em'
    else mySelected.style.fontSize=null
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    if (myPic.matches(':hover') && type=='video') setPic()		// myNav preview thumb
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (x+y > 7 && Click) gesture=1					// gesture (Click + slide)
    if (!gesture || Click!=1) return
    if (myNav.matches(':hover')) {					// move context menu
      myNav.style.left = xpos-myNav.offsetWidth/2+"px"
      myNav.style.top = ypos-myNav.offsetHeight/2+"px"}
    else if (!playing && wasMedia && !listView && type!='document') { 	// move thumb
      thumb.style.zIndex = Zindex+=1
      thumb.style.position = 'fixed'
      thumb.addEventListener('wheel', wheelEvent)
      thumb.style.left = xpos-thumb.offsetWidth/2+"px"
      thumb.style.top = ypos-thumb.offsetHeight/2+"px"}
    else if (myPlayer.matches(':hover')) {				// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.mediaX = mediaX.toFixed(0)
      localStorage.mediaY = mediaY.toFixed(0)}
    positionMedia(0); Xref=xpos; Yref=ypos}


  function wheelEvent(e, id) {
    e.preventDefault()
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (Click || wheel < block) return
    block=120
    var wheelUp=false
    if (e.deltaY > 0) wheelUp=true
    if (id=='myPage') {							// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--
      myPage.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// filter
      if (wheelUp) filt++ 
      else if (filt) filt--
      Filter(id)}
    else if (mySpeed.matches(':hover')) {				// speed
      if (!playing || type=='video' || type=='audio') {
        if (wheelUp) rate -= 0.01
        else rate += 0.01
        rate = Math.round(100*rate)/100
       if (!playing && !wasMedia) {defRate=rate; localStorage.setItem('defRate'+folder, rate)}
       else thumb.style.rate=rate}}
    else if (mySkinny.matches(':hover')) {				// skinny
      if (wheelUp) skinny -= 0.01
      else skinny += 0.01
      skinny=Math.round((1000*skinny))/1000
      thumb.style.skinny=skinny		// css holds edited skinny
      getParameters(index)
      positionMedia(0.15)}
    else if (!playing && (id=='View' || thumb.style.position=='fixed')) {
      if (thumb.style.position=='fixed') el=thumb
else el=thumb					// should be thumb1
      if (view<50 && wheelUp) view += 0.5
      else if (view>8 && !wheelUp) view -= 0.5				// thumb size
      if (thumb.style.position!='fixed') localStorage.setItem('pageView'+folder, view)
      el.style.opacity=1
      el.style.maxWidth=view+'em'
      el.style.maxHeight=view+'em'
vtt.style.maxWidth=view+'em'
      block=12}
    else if (!playing && id=='myWidth') {				// page width
      x = 1*width.style.width.slice(0,-1)
      if (x>20 && wheelUp) x-=2
      else if (x<=98) x+=2
      width.style.width = x+'%'
      localStorage.setItem('pageWidth'+folder, x)
      block=12}
    else if (mySelect.matches(':hover') || myPic.matches(':hover')) {
      if (wheelUp) {index++} else index--				// next / previous
      getParameters(index)
      if (playing && !thumbSheet && type=='video') {
        myPlayer.currentTime=thumb.style.start
        myPlayer.pause()}}
else if (type!='image' && !thumbSheet && (!overMedia || ym>0.8 || myTitle.matches(':hover') || thumb.style.position=='fixed')) { // seek
if (playing) el=myPlayer
else el=thumb
      if (wheelUp && !el.paused && el.currentTime > dur-3.5) return
      if (dur > 120) interval = 3
      else interval = 0.5
      if (el.paused) interval = 0.04
      if (wheelUp && el.currentTime < dur-0.05) el.currentTime += interval
      else el.currentTime -= interval}
    else if (!myNav.matches(':hover')) {				// zoom myPlayer 
      var x = 0.02*rect.height
      if (wheelUp) {							// zoom around focus
        if (rect.top<40 && yw<0.4) mediaY+=x
        if (rect.bottom>innerHeight-40 && yw>0.6) mediaY-=x
        scaleY *= 1.03}
      else if (!wheelUp && scaleY>0.11) {
        if (mediaY<0.4*innerHeight) mediaY+=x
        if (mediaY>0.6*innerHeight) mediaY-=x
        scaleY *= 0.97}
//  else {closePlayer(); scaleY=0.24}  // prob messages no click
      if (mediaY-x/4 > innerHeight/2) mediaY-=x/4			// re-centre image
      else if (mediaY+x/4 < innerHeight/2) mediaY+=x/4
      scaleX=skinny*scaleY
      positionMedia(0.1)
      block=14}
    wheel=0; cueIndex=-1}


  function closePlayer() {
    positionMedia(0.2)
    inca('Close')							// and send messages to inca
    playing=''
    Click=0								// in case browser not active
    cue=0
    myPlayer.style.opacity=0
    myNav.style.display=null
    myPlayer.removeEventListener('ended', nextMedia)
    setTimeout(function() {						// fadeout before close
      myPlayer.src=''
      myPlayer.poster=''
      myPlayer.style.zIndex=-1
      myMask.style.display=null
      thumbSheet=0},200)}
 

  function getParameters(i) {						// prepare myPlayer for media
    if (!(thumb=document.getElementById('thumb'+i))) {thumb=document.getElementById('thumb1'); index=1; return}
if (!(vtt=document.getElementById('vtt'+i))) vtt=thumb
    title=document.getElementById('title'+i)
    rate = defRate
    skinny = 1
    var x = thumb['ondrag'].toString().split(',')			// trick to get media parameters from htm element
    type = x[1].replaceAll('\'', '').trim()				// eg video, image
    thumb.style.start=1*x[3].trim()+0.02
    dur = 1*x[4].trim()							// in case video is wmv, avi etc
    size = 1*x[5]							// file size
    Cues(0,i)								// process 0:00 cues - width, speed etc.
    if (type == 'document') return 1
    x = 1*thumb.style.skinny						// get any live width edits
    if (x && x!=skinny) skinny=x
    thumb.style.transform='scale('+skinny+',1)' 			// has been edited
    x = 1*thumb.style.rate						// custom css variable - rate edited
    if (x && x != rate) rate=x
    if (index) setPlayer()   						// src, poster
    return 1}


  function timerEvent() {						// every 100mS 
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (myPic.matches(':hover')) el=myPic
    else if (playing=='browser') el=myPlayer
    else el=thumb
    rect = el.getBoundingClientRect()
    xm = (xpos - rect.left) / rect.width
    ym = (ypos - rect.top) / rect.height
    if (block>=30) block-=10						// wheel blocking 
    if (wheel>=10) wheel-=10
    if (cursor) cursor--
    if (!playing || thumbSheet) myBody.style.cursor=null		// hide cursor
    else if (!cursor || Click) myBody.style.cursor='none'
    else myBody.style.cursor='crosshair'
    if (View.matches(':hover')) View.innerHTML=view.toFixed(1)
    else View.innerHTML='View'
    if (myWidth.matches(':hover')) myWidth.innerHTML=width.style.width
    else myWidth.innerHTML='Width'
    if (!myNav.matches(':hover')) myNav.style.display=null
    if (rate==1) mySpeed.innerHTML = 'Speed'
    else mySpeed.innerHTML = 'Speed '+rate.toFixed(2)
    if (skinny>0.99 && skinny<1.01) mySkinny.innerHTML = 'Skinny'
    else mySkinny.innerHTML = 'Skinny '+skinny.toFixed(2)
    if (!playing && !overMedia&& !wasMedia) {rate=defRate; mySkinny.innerHTML=''}
    if (selected && !Click) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (!thumb) return
if (type!='image') seekBar()
    if (!playing || scaleY<0.25) {myMask.style.opacity=0; myMask.style.pointerEvents=null}
    else {myMask.style.opacity=1; myMask.style.pointerEvents='auto'}
    if (document.getElementById('myFavicon'+index).innerHTML) myFav.innerHTML='Fav &#10084'
    else myFav.innerHTML='Fav'
    if (wasMedia || playing) {
      if (myPic.matches(':hover') || myNav.matches(':hover')) myPic.style.opacity=1
      myTitle.innerHTML=title.value; mySelect.style.width='96%'; myTitle.style.width='96%'
      mySelect.innerHTML='Select  '+index+' '+Time(dur)+' '+size+'mb'}
    else {myTitle.innerHTML=''; mySelect.innerHTML='Select'; myTitle.style.width=null; myPic.style.opacity=0}
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (1*localStorage.muted) {myMute.style.color='red'} else myMute.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (myPlayer.style.opacity==0) {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) myPlayer.volume *= 1.3		// fade sound in/out 
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'; myPlayer.style.outline='4px solid red'}
    else {mySelect.style.color=null; myPlayer.style.outline=null}
    if (playing=='browser') {
      if (type!='image' && !dur) dur=myPlayer.duration			// just in case
      if (!thumbSheet) lastStart=myPlayer.currentTime
      myPlayer.playbackRate=rate
      myCap.style.top=rect.bottom +10 +'px'
      myCap.style.left=rect.left +10 +'px'
      myCap.style.zIndex=Zindex
      if (cue) {Cap.innerHTML='goto '+myPlayer.currentTime.toFixed(2); Cap.style.width='40%'} 
      else Cap.innerHTML='caption'
      if (myCap.innerHTML) myCap.style.opacity=1
      if (cueList && !thumbSheet) Cues(myPlayer.currentTime, index)
      positionMedia(0)}							// in case fullscreen 
    else {
      myCap.innerHTML=''
      myCap.style.opacity=0}}


  function positionMedia(time) {					// position myPlayer in window
    var x=0; var y=0
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}
    myPlayer.style.left = x + mediaX - myPlayer.offsetWidth/2 +"px"
    myPlayer.style.top = y + mediaY - myPlayer.offsetHeight/2 +"px" 	// fullscreen offsets
    y = scaleY
    if (looping>1) y*=(1+looping/14)
    if (thumbSheet) {
      if (ratio<1) y=0.9*innerHeight/myPlayer.offsetHeight
      else y=0.9*innerWidth/myPlayer.offsetWidth
      thumbSheet=y}
    x=skinny*y
    myPlayer.style.transition = time+'s'
    myPlayer.style.transform = "scale("+x+","+y+")"}


  function seekBar() {							// progress bar beneath player
    if (myPic.matches(':hover')) el=myPic
    else {
      if (playing=='browser') el=myPlayer
      else el=thumb
    if (!(overMedia && ym>0.8 && ym<1)) {mySeekbar.style.width=null; return}}
    var cueX = rect.left + 7
    var x = Math.round(el.currentTime*100)/100
    var cueW = 0.95*rect.width*el.currentTime/dur
if (el.currentTime<0.1) cueW=0.95*rect.width
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
    if (myNav.style.display) {
      mySeekbar.style.top = rect.bottom +5 +'px'
      mySeekbar.style.left = rect.left +'px'
      mySeekbar.style.width = myPic.offsetWidth*myPic.style.start/dur +'px'}
    else {
    if (rect.bottom<innerHeight) mySeekbar.style.top = rect.bottom -3 +'px'
    else mySeekbar.style.top = innerHeight -5 +'px'
    mySeekbar.style.left = cueX +'px'
    mySeekbar.style.width = cueW +'px'}}


  function Cues(time, i) {						// process media cues - captions, pauses etc.
    var el = document.getElementById('thumb'+i)
    var el2 = document.getElementById('vtt'+i)
    var x = el['ondrag'].toString().split(',')			// get cueList from htm entry
    cueList = x[2].replaceAll('\'', '').trim()
    if (!cueList) return
    x = cueList.split('#1')						// each line entry
    for (i=0; i<x.length; i++) {					// i represents each line entry
      var entry = x[i].split('#2')					// time | cue | value | period
      if (entry[1] && 1*entry[0] > time-0.1 && 1*entry[0] < time+0.1) {
        if (type=='next') {lastClick=2; clickEvent()}
        else if (entry[1]=='scroll' && !index) el2.scrollTo(0,entry[2])	// scroll to last scrollY
        else if (entry[1]=='goto') {myPlayer.currentTime = 1*entry[2]; myPlayer.volume=0.001}
        else if (entry[1]=='rate' && looping<2) {if (isNaN(1*entry[2])) {rate=defRate} else {rate=1*entry[2]}}
        else if (entry[1]=='skinny' && !el.style.skinny) {
          if (isNaN(entry[2])) {skinny=1} else {skinny=1*entry[2]; if(time) {positionMedia(entry[3])}}}
        else if (entry[1]=='pause' && cueIndex!=i) {			// prevent timer re-entry during pause
          cueIndex=i; myPlayer.pause()
          if (entry[2]) setTimeout(function(){myCap.innerHTML=''; myPlayer.play()},1000*entry[2])}
        else if (entry[1] == 'cap') {
          myCap.innerHTML = entry[2].replaceAll("#3", "\,").replaceAll("#4", "\'").replaceAll("#5", "\"")
          if (entry[3]) {setTimeout(function(){myCap.innerHTML=''},1000*entry[3])}}}}}


  function setPlayer() {						// set src, poster, thumbsheet, dimensions
    var x = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheets folder
    var y = x.split('%20')						// see if embedded fav start time in poster filename
    y = y.pop()
    y = y.replace('.jpg', '')
    if (!isNaN(y) && y.length > 2 && y.includes('.')) {			// very likely a 'fav' suffix timestamp
      x = x.replace('%20' + y, '')}					// so remove timestamp from filename
    if (thumbSheet) myPlayer.poster = x					// 6x6 thumbsheet file
    else myPlayer.poster=''
    if (!thumb.src || myPlayer.src!=thumb.src) {
      myPlayer.src=thumb.src; if (!thumbSheet) myPlayer.poster=thumb.poster}
    if (type!='image') myPic.poster=''
    else myPic.poster=thumb.poster
    if (type=='video') myPic.style.backgroundImage = 'url(\"'+x+'\")'	// use 6x6 thumbsheet src for preview sprites
    else myPic.style.backgroundImage = ''
    myPic.style.transform='scale('+skinny+',1)'
    ratio = thumb.offsetWidth/thumb.offsetHeight
    if (ratio<1) {x=innerWidth*innerHeight/innerWidth; y=x/ratio}	// portrait
    else {y=innerHeight; x=y*ratio}					// landscape
    myPlayer.style.width = x +'px'
    myPlayer.style.height = y +'px'
    myPlayer.style.top = mediaY-y/2 +'px'				// myPlayer size normalised to screen
    myPlayer.style.left = mediaX-x/2 +'px'
    if (ratio>1) {x=180} else x=120					// preview thumb size normalised
    myPic.style.width=x+'px'
    myPic.style.height=(x-7)/ratio+'px'
    myCap.innerHTML = ''
    if (thumbSheet) myPlayer.load()}

  function setPic() {							// myNav preview thumb derived from 6x6 thumbsheet
    var z = myPic.getBoundingClientRect()
    var y = myPic.offsetWidth
    var x = (xpos-z.left)/y
    z = 20 * Math.ceil(x*35)
    y = 20 * Math.floor(z/120)
    z = z % 120
    myPic.style.backgroundPosition=z+'% '+y+'%'				// point to thumb %xy coordinate 
    z=5*(Math.ceil(x*35)+1)						// thumb number
    if (dur > 60) {y = 20} else y=0
    z = (z-1) / 200
    myPic.style.start = y - (z * y) + dur * z
    if (!playing) myPlayer.currentTime=myPic.style.start}

  function getStart() {
    positionMedia(0.3)
    myPlayer.style.opacity=0
    setTimeout(function() {
      myPlayer.poster=''
      if (skinny < 0) xm = 1-xm						// if flipped media
      var row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
      var col = Math.ceil(xm * 6)
      var offset = 0
      var ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200
      if (dur > 60) offset = 20
      if (longClick==1 || xm>1||xm<0|ym>1||ym<0) myPlayer.currentTime=lastStart
      else myPlayer.currentTime=offset - (ps * offset) + dur * ps
      myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"
      thumbSheet=0; Play(); myPlayer.play()},200)}

  function nextMedia() {
    if (!looping) {
      lastClick=2
      myPlayer.pause()
      if (playlist.match('/inca/music/')) setTimeout(function() {clickEvent()}, Math.random()*4000)
      else clickEvent()
      return}
    looping+=1								// override cue rate changes
    cueIndex=-1								// reset cue line index
    if (!longClick && rate > 0.40) rate-=0.05				// slower each loop
    myPlayer.currentTime=thumb.style.start
    positionMedia(1.6)
    myPlayer.play()}

  function Filter(id) {							// for htm ribbon headings
    var x=filt; var units=''						// eg 30 minutes, 2 months, alpha 'A'
    var el = document.getElementById(id)
    if (!x) {el.innerHTML=id; el.style.color=null; return} 
    if (id == 'Alpha') {
      if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
    if (id == 'Size')  {x *= 10; units = " Mb"}
    if (id == 'Date')  units = " months"
    if (id == 'Duration') units = " minutes"
    if (!x) x=''
    el.innerHTML = x+' '+units; el.style.color = 'red'}

  function sel(i) {							// highlight selected media
    if (!i || Click==2 || (gesture && wasMedia)) return
    if (listView) el=document.getElementById('title'+i)
    else el=document.getElementById('thumb'+i)
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.outline = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.outline = '0.1px solid red'
      else el.style.outline = '1.5px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}

  function context(e) {							// right click context menu
    if (playing == 'mpv') return
    if (wasMedia) myPic.style.display=null
    else myPic.style.display='none'
    myPic.style.backgroundPosition='0 0'
    if (!playing && !listView && overMedia) {
      var x = thumb.getBoundingClientRect()
      myNav.style.left=x.left-70+'px'
      myNav.style.top=x.top-70+'px'}
    else {myNav.style.left=xpos-30+'px'; myNav.style.top=ypos-10+'px'}
    myNav.style.display='block'}

  function globals(pg, ps, fo, to, so, fi, lv, se, pl, ix) {		// import globals from inca
    folder=fo; page=pg; pages=ps; toggles=to; filt=fi;
    listView=lv; selected=se; playlist=pl; wasMedia=ix


    key = 'pageWidth'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<20 || x>100) localStorage.setItem(key, 90)
    pageWidth = 1*localStorage.getItem(key)
    width.style.width = 1*localStorage.getItem(key)+'%'
    if (listView) width.style.width = '100%'

    key = 'pageView'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<6 || x>50) localStorage.setItem(key, 14)
    view = 1*localStorage.getItem(key)

    key = 'defRate'+folder
    x = localStorage.getItem(key)
    if (isNaN(x) || x<0.2 || x>3) localStorage.setItem(key, 1)
    defRate = 1*localStorage.getItem(key)
    Filter(so)								// show filter heading in red
    for (x of selected.split(',')) {if (x && !isNaN(x)) {		// highlight selected media			
      if (lv) document.getElementById('title'+x).style.outline = '0.1px solid red'
      else document.getElementById('thumb'+x).style.outline = '1.5px solid red'}}
    for (index=0, i=1; getParameters(i); i++) {				// process cues (eg. thumb widths)
      thumb.style.maxWidth=view+'em'; thumb.style.maxHeight=view+'em'; vtt.style.maxWidth=view+'em'}
    if (!ix) index=1
    else index=ix
    getParameters(index)
    if (ix) {title.style.borderTop='0.1px solid salmon'; scrolltoIndex()}}  // eg. after switch thumbs/listview
 

  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing) {
      el=document.getElementById('vtt'+editing)
      var x=el.innerHTML.replaceAll('#', '*') 				// save textarea if edited
      messages=messages+'#Vtt#'+el.scrollTop.toFixed(0)+'#'+editing+'#'+x}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if (el.style.skinny) messages = messages + '#Skinny#'+el.style.skinny+'#'+i+'#'+cue
      if (el.style.rate) messages = messages + '#Rate#'+el.style.rate+'#'+i+'#'+cue}
    if (!select) {select=''} else {select=select+','}
    if (command == 'Favorite') {
      value = myPlayer.currentTime.toFixed(1)
      if (!playing) value = thumb.currentTime
      else ('myFavicon'+index).innerHTML = '&#10084'
      if (longClick) value = 0
      address = vtt.scrollTop.toFixed(0)}
    if (selected && command!='Close' && command!='Reload') select=selected // selected is global value
    for (x of select.split(',')) {if (x=document.getElementById('thumb'+x)) if (x.src) {x.load()}}
    if (!value) value=''
    if (!address) address=''
    if (isNaN(value)) value=value.replaceAll('#', '<')			// because # is used as delimiter
    messages=messages+'#'+command+'#'+value+'#'+select+'#'+address
    navigator.clipboard.writeText(messages)				// send messages to inca
    messages=''}



  function scrolltoIndex() {if (title) {
    x=thumb.getBoundingClientRect().bottom; if (x>innerHeight-20 || x<20) myView.scrollTo(0, x+myView.scrollTop-innerHeight/2)}}
  function Time(z) {if (z<0) return '0:00'; var y=Math.floor(z%60); var x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function togglePause() {if(!thumbSheet && lastClick==1 && !longClick) {if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; positionMedia(0.6); thumb.style.transform='scaleX('+skinny+')'}
  function mute() {if(!longClick) {myPlayer.volume=0.05; myPlayer.muted=1*localStorage.muted
    myPlayer.muted=!myPlayer.muted; localStorage.muted = 1*myPlayer.muted}}




