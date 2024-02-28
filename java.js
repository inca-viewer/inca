
// Debugging - use mySelected.innerHTML or alert()
// to do - undo delete & move files
//       - simplify media list htm coding
//       - duplicate filename issues for thumbs

// mbutton open new tab in firefox locks context & opens in wrong browser
// create title in getparam
// very slow start in some media - especially h264 encoded
// bluetooth hardware interface from cueList
// in Cue process each line number instead of match myPlayer.currentTime
// cue - add audio overlay option
// cue - zoom into scene but same player size
// can add fade out option to music at cue time for "dream on" mp3
// if zoom media from near edge focus zoom on cursor like google earth
// flip issues test
// fol fav headings highlight
// folders to show qty files
// remember sheet zoom

// longclick over mpv for thumbsheet
// remove fade d rate?
// filing/ rename errors 
// remove modal, make internal player same window as mpv?
// index corrupted by hover/getpara between wheel next

// context menu could zoom down mpv to reveal menu 
// click heart opens fav at start
// drag edge to set skinny .maybe not mpv
// cannot create fav from wmv
// search 'joey' by longclick over searchbar crashes panel
// firefox location bar focus issues
// mp3/4 use cue list to create, not cue point
// cue/cap combine open notepad at time 
// load mpv playlist
// delete/move dupes in m3u
// fire cannot play same file twice 



  var media = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var nav = document.getElementById('myContext')			// context menu during media play
  var cap = document.getElementById('myCap')				// caption textarea element
  var mediaX = 1*localStorage.getItem('mediaX')				// caption strings
  var mediaY = 1*localStorage.getItem('mediaY')				// last media position
  var scaleY = 1*localStorage.getItem('scaleY')				// last media zoom
  var fade = 1*localStorage.getItem('fade')				// media transition
  var d_rate = 1*localStorage.getItem('d_rate')				// default playback speed
  var mpv = 1*localStorage.getItem('mpv')					// external media player
  var intervalTimer							// Timer() every 100mS
  var wheel = 0
  var block = 100							// block wheel/gesture events
  var index = 1								// media index (e.g. media14)
  var lastIndex = 1
  var start = 0								// video start time
  var lastStart = 0							// last media start time
  var interval = 0							// media seeking interval step
  var units = ''							// minutes, months, MB etc.
  var rate = 1								// current rate
  var view = 14								// thumb size em
  var listView = 0							// list or thumbnail view
  var page = 1								// current media page
  var pages = 1								// how many htm pages of media
  var sort = 0								// media list sort 
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var type = ''								// audio, video, image, document
  var cue = 0								// setting cue point
  var cueList = ''							// full caption text file
  var looping = true							// play next or loop media
  var lastClick = 0							// state is preserved
  var Click = 0								// state cleared after mouseUp
  var longClick = 0							// state is preserved
  var gesture = 0							// state is preserved
  var searchbox = ''							// search input field
  var renamebox = ''							// media rename input field
  var selected = ''							// list of selected media in page
  var overMedia = 0							// over thumb or media
  var wasMedia = 0							// before context menu
  var ratio								// media width to height ratio
  var skinny = 1							// media width
  var messages = ''							// history, width, speed & caption edits
  var Zindex = 3							// element layer
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var scaleX = 0.7							// skinny & media size
  var lastScaleY = 0.7
  var sheetY = 1.2							// thumbsheet size
  var thumbsheet = 0							// 6x6 thumbsheet mode
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var Xoff = 0								// maintain player position in fullscreen
  var Yoff = 0
  var dur = 0
  var pitch = 0


  getParameters(1)							// initialise to media attributes
  gestureEvents(0)							// (fill search bar)
  positionMedia(0)							// initialise player
  modal.style.opacity=0							// stop page load flicker
  modal.style.zIndex=-1
  if (!fade) fade=0.2
  if (!d_rate) d_rate=1							// default speed
  if (!mpv) mpv=0							// external player
  if (!mediaX || mediaX < 0 || mediaX > innerWidth) mediaX=innerWidth/2
  if (!mediaY || mediaY < 0 || mediaY > innerHeight) mediaY=innerHeight/2
  if (!scaleY || scaleY>2 || scaleY<0.2) scaleY=0.7
  lastScaleY = scaleY
  scaleX = scaleY
  intervalTimer = setInterval(Timer,100)				// 100mS background timer
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', gestureEvents)
  document.addEventListener('keypress', (e) => {
    if (e.key=='Enter') {
      if (renamebox) {inca('Rename', renamebox, wasMedia)}		// rename media
      else if (myInput.value) {
        inca('SearchBox','','',myInput.value)}}}, false)		// search for media on pc


  function mouseDown(e) {						// detect long click
    Click=e.button+1; lastClick=Click; longClick=0; 
    gesture=0; wheel=0; block=0; Xref=xpos; Yref=ypos
    sessionStorage.setItem('scroll', myView.scrollTop)
    if (Click==2 && (type||overMedia||e.shiftKey)) e.preventDefault()	// middle click
    clickTimer=setTimeout(function() {
      if (!gesture && xw<0.95) {longClick=lastClick; mouseEvent()}},240)}

  function mouseUp(e) {
    if (!Click) return							// page load while mouse still down - ignore
    clearTimeout(clickTimer)						// longClick timer
    if (Click==3 && !gesture && yw>0.1) context(e)			// new context menu if click below window top
    if (Click==2 && !longClick && !gesture && e.shiftKey) {		// inca converts Back button to shift Mclick
      if (type) {closePlayer(); type=''}
      else if (overMedia && media.style.position=='fixed') {		// close popped out thumb
        media.style.position=null; media.style.transform='scale('+skinny+',1)'; media.style.top=null; media.style.left=null}
      else if (myView.scrollTop > 50) myView.scrollTo(0, 0)		// else scroll to page top
      else inca('Reload')}						// or reload page
    else if (!gesture && !longClick) mouseEvent('Up')			// process click event
    else if (gesture==2 && !type) getParameters(index)			// double thumb size
    Click=0; wheel=0; block=100; gesture=0; longClick=0}


  function closePlayer() {			
    myPlayer.style.transition=fade*0.3+'s'
    myPlayer.style.opacity=0
    if (type) {								// then close media player
      Messages()							// process cues, width, speed, caption edits
      myPlayer.removeEventListener('ended', nextMedia)
      navigator.clipboard.writeText(messages)				// send messages to inca
      messages=''} 
    setTimeout(function() {						// so player can fadeout before close
      start=0
      thumbsheet=0
      overMedia=0
      myPlayer.src=''
      myPlayer.poster=''
      modal.style.opacity=0
      modal.style.zIndex=-1},fade*300)}


  function mouseEvent(e) {						// functional logic
    if (Click > 2) return						// right click
    if (Click==2 && !type && !overMedia) return				// middle click
    if (longClick && myInput.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return			// also, copy files instead of move
    if (longClick==1 && !type && playlist && overMedia && selected) {inca('Move', index); return}
    if (document.getElementById('title'+index).matches(':hover')) return
    if (lastClick==1 && e=='Up' && !type && !overMedia) return
    if (!mpv && lastClick==1 && !longClick && !thumbsheet && type && type != 'image' && !nav.matches(':hover')) {
      if (xm>-0.1 && (yw>0.98 || (ym>1 && ym<1.1))) {
        if (xm>0 && xm<0.1) myPlayer.currentTime=start
        else myPlayer.currentTime=xm*dur}
      else {togglePause(); return}}
    if (e=='Up' && lastClick==1 && nav.matches(':hover')) return
    if (!longClick && (e=='Next' || lastClick==2)) index++
    if ((e=='Back' || longClick==2) && index > 1) index--
    scaleY = lastScaleY
    var playing = type
    var fadeOut = fade							// media fadeout time 
    if (!type || (e=='Up' && thumbsheet && lastClick==1) || (longClick && !thumbsheet)) fadeOut=0 // no fadeout
    if (type) positionMedia(fade)
    else {positionMedia(0)}
    myPlayer.style.opacity=0
    if (type) Messages()						// add last media cue edits to queue
    setTimeout(function() {						// so player can fade in/out
      positionMedia(0)
      if (longClick == 1) {
        if (playing) thumbsheet=!thumbsheet
        else if (overMedia) thumbsheet=1}
      if (longClick && !thumbsheet && !playing) index=lastIndex		// return to last media
      type = getParameters(index)
      if (!type) {closePlayer(); return}				// end of media list
      if (e=='Up' && lastClick==1 && thumbsheet) getStart()		// thumbsheet xy coord
      if (longClick) {x=start; start=lastStart; lastStart=x}
      x = myPlayer.src.slice(-3)
      if (mpv || type=='video' && x!='mp4' && x!='mkv' && x!='m4v' && x!='ebm') {x=1} else {x=0}
      y = start+'|'+skinny+'|'+rate+'|'+pitch+'|'+localStorage.getItem('muted')
      if (x && lastClick && !thumbsheet) {
        inca('Mpv',0,index,y); closePlayer(); return}			// tell inca new media is playing
      if (type == 'document' || type == 'm3u') {type=''; return}	// let inca open file
      if (e=='Up' && lastClick==2 && !playing) start=0
      positionMedia(fade)
      scrolltoIndex()							// + highlight played media
      Play(e)},fadeOut*500)}

  function Play(e) {
    cue = 0
    overMedia = 0							// when entering modal player
    wasMedia = index
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (thumbsheet) Thumbsheet()
    else if (type == 'audio' || playlist.match('/inca/music/')) {
      looping=false; myPlayer.muted=false; scaleY=0.25}
    if (!thumbsheet && type != 'image') {myPlayer.currentTime=start; myPlayer.play()}
    myPlayer.addEventListener('ended', nextMedia)
    modal.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
    modal.style.opacity = 1
    myPlayer.volume = 0							// allows sound to fade up
    positionMedia(fade)    
    myPlayer.style.opacity=1
    wheel=0; lastClick=0}


  function Messages() {							// for inca.exe via clipboard
    lastIndex = index
    if (!longClick) lastStart=myPlayer.currentTime
    if (media.style.skinny || media.style.rate)
      messages = messages + '#Cues#'+index+'##'+lastStart.toFixed(1)+'|'+skinny+'|'+rate
    mySeekbar.style.opacity = null
    myPreview.style.opacity = null
    cap.style.display = 'none'
    cap.style.opacity = 0
    block = 160}


  function wheelEvents(e, id, el) {
    e.preventDefault()
    wheel += Math.abs(e.deltaY)
    if (Click || wheel < block) return
    var wheelUp = false
    wheel -= block
    if (wheel>10) wheel=10
    if (wheel<2) wheel=2
    block = 120
    if (e.deltaY > 0) wheelUp=true
    if (id=='myFade') {							// fade control
      if (!wheelUp) fade+=0.05
      else if (fade>0.26) fade-=0.05
      myFade.innerHTML = fade.toFixed(2)
      localStorage.setItem("fade",Math.round(10*fade)/10)}
    else if (id=='myRate') {						// default rate
      if (!wheelUp) d_rate+=0.01
      else if (d_rate>0.51) d_rate-=0.01
      d_rate = Math.round(100*d_rate)/100
      myRate.innerHTML = d_rate.toFixed(2)
      localStorage.setItem("d_rate",d_rate)}
    else if (id=='myPage') {						// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) {page--}
      myPage.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// filter
      if (wheelUp) filt++ 
      else if (filt) filt--
      filter(id)}
    else if (id=='mySpeed') {						// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) rate -= 0.01
        else rate += 0.01
        rate = Math.round(100*rate)/100
        myPlayer.playbackRate = rate
        media.style.rate = rate}}
    else if (id=='mySkinny') {						// skinny
      block = 30
      if (wheelUp) scaleX -= 0.003
      else scaleX += 0.003
      if (type) {
        skinny=Math.round((1000*scaleX/scaleY))/1000
        media.style.skinny = skinny
        getParameters(index)
        positionMedia(0)}}
    else if (type=='image' || thumbsheet) {				// scroll
      if (rect.bottom>innerHeight/1.5 && wheelUp) mediaY-=100
      if (rect.top<innerHeight/3 && !wheelUp) mediaY+=100
      positionMedia(0.3)}
    else if (id=='View') {						// thumbs
      if (wheelUp) view += 1
      else view -= 1
      View.innerHTML='View '+ (view-6)
      thumbSize()}
    else if (type=='video' || type=='audio') {				// seek
      if (dur > 120) interval = 3
      else interval = 0.5
      mySeekbar.style.opacity = 1
      if (myPlayer.paused) interval = 0.04
      if (wheelUp) myPlayer.currentTime += interval
      else myPlayer.currentTime -= interval
      block = 160}
    wheel = 10}


  function gestureEvents(e) {						// cursor moved
    xpos = e.clientX
    ypos = e.clientY
    if (selected) panel.style.color='lightsalmon'
    else panel.style.color=null
    if (!myInput.value.includes('Search')) {
      SearchBox.innerHTML='Search'; SearchAll.innerHTML='All'; SearchAdd.innerHTML='Add'}
    if (type) { modal.style.cursor = 'crosshair'
      if (!thumbsheet) {setTimeout(function() {modal.style.cursor='none'},400)}}
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    if (!nav.matches(":hover"))  {nav.style.display = null; nav.style.background=null}
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (Click && x+y > 4 && !gesture) {					// gesture detection (mousedown + slide)
      if (overMedia) {gesture=2} else {gesture=1}}
    if (!gesture) return
    if (gesture==2 && !type && !listView) {				// move thumb
      media.style.opacity = 1
      media.style.position = 'fixed'
      media.style.zIndex = Zindex+=1
      media.style.left = xpos-media.offsetWidth/2+"px"
      media.style.top = ypos-media.offsetHeight/2+"px"}
    else if (type && Click==1) {					// move media
      gesture = 3
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX.toFixed(0))
      localStorage.setItem("mediaY",mediaY.toFixed(0))}
    else if (type && Click==3 && y>x) {					// zoom media
      if (scaleY>0.25 || Yref<ypos) {
        if (Yref<ypos) {y=1.02} else {y=0.98}
        if (thumbsheet) sheetY*=y					// zoom thumbsheet
        else {
          scaleY *= y
          lastScaleY = scaleY
          if (scaleX<0) {scaleX *= -y} else {scaleX *= y}}}		// in case media fipped left/right
      localStorage.setItem("scaleY", scaleY.toFixed(3))}
    Xref=xpos; Yref=ypos; positionMedia(0)}


  function Timer() {							// every 100mS
    if (block>=25) block-=5						// slowly increase wheel sensitivity
    if (wheel>1) wheel--
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (!media) return
    el=document.getElementById('title'+index)
    if (rate==1) mySpeed.innerHTML = 'Speed'
    else mySpeed.innerHTML = rate.toFixed(2)
    if (skinny == 1) mySkinny.innerHTML = 'Skinny'
    else mySkinny.innerHTML = skinny.toFixed(2)
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (playlist) {myFav.innerHTML='Fav &#10084'}
    if (wasMedia && mySelect.matches(':hover')) mySelect.innerHTML='Select - '+index+' - '+el.value
    else mySelect.innerHTML='Select'
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'}
    else {mySelect.style.color=null}
    if (mpv) {myMpv.style.color='red'} else myMpv.style.color=null
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (myPlayer.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (thumbsheet) {xm = myPlayer.offsetWidth*sheetY*skinny; ym = myPlayer.offsetHeight*sheetY}
    else {xm = myPlayer.offsetWidth*scaleX; ym = myPlayer.offsetHeight*scaleY}
    rect = myPlayer.getBoundingClientRect()
    xm = (xpos - rect.left) / Math.abs(xm)
    ym = (ypos - rect.top) / Math.abs(ym)
    if (cueList) Cue(myPlayer.currentTime, index)
    if (type) {
      modal.style.transition = fade+'s'
      modal.style.backgroundColor = 'rgba(0,0,0,'+scaleY*1.8+')'
      if (myPlayer.volume <= 0.8) myPlayer.volume += 0.05		// fade sound up
      if (xm>0 && xm<1 && ym>0 && ym<1) {overMedia=index} else {overMedia=0}
      if (!mpv && type != 'image') seekBar()
      if (!Click) positionMedia(0.01)}}					// in case flipped into fullscreen


  function getParameters(i) {						// prepare player for selected media (index)
    myRibbon2.style.height=0; myRibbon3.style.height=0
    if (!(media = document.getElementById('media'+i))) {
      index=1; return}
    rate = d_rate
    skinny = 1
    var x = media.style.borderBottom					// preserve border-radius in myPlayer
    media.style.borderBottom=null
    ratio = media.offsetWidth/media.offsetHeight
    media.style.borderBottom=x
    x = media['onmouseover'].toString().split(','); x.pop()		// get media parameters from htm entry
    start = 1*x.pop().trim()
    dur = 1*x.pop().trim()						// in case wmv, avi etc
    cueList = x.pop().replaceAll('\'', '').trim()
    var type_t = x.pop().replaceAll('\'', '').trim()			// eg video, image
    if (cueList) Cue(0,i)						// get initial width, speed etc.
    x = media.style.skinny						// get any live width edits
    if (x && x!=skinny) skinny=x 					// in case it has been edited
    if (media.style.position!='fixed') {
      media.style.transform='scale('+skinny+',1)'}
    else media.style.transform='scale('+skinny*2.2+',2.2)'
    if (ratio > 1) {
      x = innerWidth*0.70; y = x/ratio; sheetY = innerWidth/x}		// landscape
    else {y = innerHeight; x = y*ratio; sheetY = innerHeight/y}		// portrait
    myPlayer.style.width = x +'px'					// media size normalised to screen
    myPlayer.style.height = y +'px'
    myPlayer.style.top = mediaY-y/2 +'px'
    myPlayer.style.left = mediaX-x/2 +'px'
    x = media.getBoundingClientRect()
    x = (xpos-x.left)/media.offsetWidth*skinny				// reset thumb time if enter from left
    if (x<0.1 || !media.currentTime) media.currentTime = start		// for htm thumb mouseover play
    myPlayer.poster = media.poster					// images also use poster src
    myPreview.src = media.src						// seeking preview window
    positionMedia(0)							// prepare player for clean start
    if (myPlayer.src != media.src) {					// stop reload stutter
      myPlayer.src=media.src
      if (!thumbsheet) myPlayer.currentTime=start
      else Thumbsheet()}						// thumb or 6x6 thumbsheet
    x = media.style.rate						// custom style variable - rate edited
    if (x && x != rate) rate=x
    myPlayer.playbackRate = rate					// set default speed
    if (type_t != 'image' && !dur) dur=media.duration			// just in case - use browser calc.
    return type_t}


  function seekBar() {							// red progress bar beneath player
    var cueX = rect.left + 'px'
    var cueW = Math.abs(scaleX) * myPlayer.offsetWidth * myPlayer.currentTime / dur + 'px'
    if (cue && cue <= Math.round(myPlayer.currentTime*10)/10) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/dur + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/dur)+'px'
      if (cue == Math.round(myPlayer.currentTime*10)/10) {
        cueW=Math.abs(scaleX*myPlayer.offsetWidth*(dur-cue)/dur)+'px'}}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/dur) + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - Math.round(myPlayer.currentTime*10)/10)/dur) + 'px'
      if (cue < 0.4+Math.round(myPlayer.currentTime*10)/10) {
        cueX=rect.left+'px'; cueW=Math.abs(scaleX*myPlayer.offsetWidth*myPlayer.currentTime/dur)+'px'}}
    mySeekbar.style.left = cueX
    mySeekbar.style.width = cueW
    if (!thumbsheet && xm>-0.1 && ym>1 && ym<1.1 || cue || (xm>-0.1 && yw>0.98)) {
      if (ym<1) mySelected.innerHTML = (myPlayer.currentTime-cue).toFixed(2)
      else mySelected.innerHTML = Time(myPlayer.currentTime)+' - '+Time(dur*xm)+' - '+Time(dur)
      mySeekbar.style.borderTop='10px solid red'
      mySeekbar.style.opacity=1
      myPreview.style.left = xpos - myPreview.offsetWidth/2 +'px'	// seeking preview window
      myPreview.style.top = rect.bottom - myPreview.offsetHeight -5 +'px'
      myPreview.currentTime=dur*xm
      if (xm>0 && xm<1 && ym>1 && ym<1.1) myPreview.style.opacity=1
      else myPreview.style.opacity=null}
    else {mySeekbar.style.borderTop=null; myPreview.style.opacity=null; if(!selected) {mySelected.innerHTML=''}}
    if (rect.bottom+6 > innerHeight) mySeekbar.style.top = innerHeight -10 +'px'
    else mySeekbar.style.top = 3 + rect.bottom +'px'
    if (nav.matches(':hover') || overMedia) mySeekbar.style.opacity=1
    else mySeekbar.style.opacity-=0.1}


  function Cue(time, i) {						// process media cues - captions, pauses etc.
    el=document.getElementById('media'+i)
    x = el['onmouseover'].toString().split(',')				// get cueList from htm entry
    x.pop(); x.pop(); x.pop()						// skip over event, start time & dur
    cueList = x.pop().replaceAll('\'', '').trim()
    if (!cueList) return
    x = cueList.split('#1')						// each line entry
    for (i=0; i<x.length; i++) {
      var type = ''
      var value = ''
      var entry = x[i].split('#2')
      cueTime = 1*entry[0]						// cue time
      type = entry[1]							// cue type
      if (entry[2]) value = entry[2]					// cue value - optional
      if (cueTime > time-0.1 && cueTime < time+0.1) {
        if (type=='next') {cueList=''; nextMedia()}
        else if (type=='rate') rate=1*value
        else if (type=='time') myPlayer.currentTime = 1*value
        else if (type=='skinny') {if (isNaN(value)) {skinny=1} else {skinny=1*value}}
        else if (type=='pause') {
          myPlayer.pause()
          value *=1000
          if (value>999 && value<9999) {setTimeout(function(){myPlayer.play()},value)}}
        else if (type == 'cap') {
          cap.innerHTML = value.replaceAll("#3", "\,").replaceAll("#4", "\'").replaceAll("#5", "\"")
          rect = myPlayer.getBoundingClientRect()
          cap.style.top = rect.bottom +10 +'px'
          cap.style.left = rect.left +10 +'px'
          cap.style.display='block'
          cap.value = cap.innerHTML
          cap.style.opacity = 1}}}}


  function positionMedia(f) {						// align media in modal
    var x=0; var y=0
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
    if (f && mediaY>0.4*(innerHeight-y) && mediaY<0.6*(innerHeight-y) && mediaX>0.3*(innerWidth-x) && mediaX<0.6*(innerWidth-x)) {
      if (Math.abs(myPlayer.offsetWidth*scaleX) > 0.9*(innerWidth-x) && Math.abs(myPlayer.offsetWidth*scaleX) < 1.3*(innerWidth-x)) {
        mediaX=(innerWidth/2)-x; scaleX=(innerWidth)/myPlayer.offsetWidth; scaleY = scaleX/skinny}
      else if (Math.abs(myPlayer.offsetHeight*scaleY) > 0.9*(innerHeight-y) && Math.abs(myPlayer.offsetHeight*scaleY) < 1.2*(innerHeight-y)) {
        mediaY=(innerHeight/2)-y; scaleY=(innerHeight)/myPlayer.offsetHeight}}
    scaleX = skinny*scaleY
    myPlayer.style.left = x+mediaX-(myPlayer.offsetWidth/2) +"px"
    myPlayer.style.top = y+mediaY-(myPlayer.offsetHeight/2) +"px"
    myPlayer.style.transition = f+'s'
    if (thumbsheet) myPlayer.style.transform="scale("+skinny*sheetY+","+sheetY+")"
    else  myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"}


  function thumbSize() {						// change thumb size
    if (view < 8) view = 8
    if (view > 99) view = 99
    el = document.getElementById('media1')
    el.style.opacity=1
    el.style.transition='0.2s'
    el.style.zIndex = Zindex+=1
    el.style.maxWidth=(view*0.8)+'em'
    el.style.maxHeight=(view*0.8)+'em'}


  function getStart() {
    var row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
    var col = Math.ceil(xm * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (dur > 60) offset = 20
    if (xm>1||xm<0|ym>1||ym<0) start = 0				// if outside thumbsheet start 0
    else start = offset - 0.4 - (ps * offset) + dur * ps
    if (type == 'video') myPlayer.poster = ''				// not flash poster after thumbsheet close
    thumbsheet=0}


  function Thumbsheet() {						// 1st thumb or 6x6 thumbsheet
    lastStart=myPlayer.currentTime
    var x = media.poster.replace("/posters/", "/thumbs/")		// points to thumbsheets folder
    p = x.split('%20')							// see if embedded fav start time in poster filename
    p = p.pop()
    p = p.replace('.jpg', '')
    if (!isNaN(p) && p.length > 2 && p.includes('.')) {			// very likely a 'fav' suffix timestamp
      x = x.replace('%20' + p, '')}					// so remove timestamp from filename
    myPlayer.poster = x							// now use 6x6 thumbsheet file
    myPlayer.load()
    myPlayer.playbackRate = rate}					// restore rate after load()


  function nextMedia() {						// or looping
    if (!looping) {
      myPlayer.pause()
      if (playlist.match('/inca/music/')) {
        setTimeout(function() {mouseEvent('Next')}, Math.random()*6000)} // next media
      else {mouseEvent('Next')}; return}
    myPlayer.currentTime=start
    myPlayer.play()
    if (!longClick && myPlayer.playbackRate > 0.40) {			// slower each loop
      myPlayer.playbackRate -= 0.05}}

  function filter(id) {
      var x = filt							// eg 30 minutes, 2 months, alpha 'A'
      var el = document.getElementById(id)
      if (!x) {el.innerHTML=sort; el.style.color=null; return}
      if (id == 'Alpha') {
        if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
      if (id == 'Size')  {x *= 10; units = " Mb"}
      if (id == 'Date')  units = " months"
      if (id == 'Duration') units = " minutes"
      if (!x) x=''
      el.innerHTML = x+' '+units; el.style.color = 'red'}

  function getAlpha(e, el) {						// set alpha search char in top panel
      var x = String.fromCharCode(Math.floor(28 * (e.clientX - el.offsetLeft) / el.offsetWidth) + 44)
      el=document.getElementById('my'+x)
      el.scrollIntoView()
      panel.scrollBy(0,-285)
      myView.scrollBy(0,-200)}

  function scrolltoIndex() {
    if (!media) return
    var x = ','+selected						// highlight played media in htm
    var y = media.getBoundingClientRect().bottom
    if (!x.match(","+index+",") && !x.match(","+lastIndex+",")) {
      if (el=document.getElementById('title'+lastIndex)) {el.style.background=null}
      if (el=document.getElementById('title'+index)) {el.style.background='#2b2824'}
      if (el=document.getElementById('media'+lastIndex)) {el.style.borderBottom=null}
      media.style.borderBottom='4px solid salmon'}
    if (y > innerHeight-20) myView.scrollTo(0, y + myView.scrollTop - innerHeight + 20)}

  function sel(i) {							// highlight selected media
    if (!i || longClick || gesture==2) return
    if (listView) el=document.getElementById('title'+i)
    else el=document.getElementById('media'+i)
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.borderBottom = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.borderBottom = '0.1px solid red'
      else el.style.borderBottom = '4px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}

  function context(e) {							// right click context menu
    var offset=''
    myDelete.style.color=null
    wasMedia=0
    if (overMedia) {
      wasMedia = index
      SearchRen.innerHTML='Rename'
      myInput.value=document.getElementById('title'+index).value}
    if (panel.matches(':hover')) {
      var x = e.target.innerHTML						// ~ text under cursor
      if (x && x.length<99) {
        myDelete.style.color='red'; myDelete.innerHTML='Delete - '+x}}
    else {myDelete.style.color=null; myDelete.innerHTML='Delete'}
    if (yw > 0.8) offset=60							// cursor near window bottom, add offset
    nav.style.left=xpos-40+'px'; nav.style.top=ypos-10-offset+'px'
    nav.style.display='block'; nav.style.background='#15110acc'}

  function globals(vi, pg, ps, so, fi, lv, se, pl, ix) {			// import globals to java from inca
    view=vi; page=pg; pages=ps; sort=so; filt=fi; listView=lv; 
    selected=se; playlist=pl; index=ix; wasMedia=ix; lastIndex=ix
    filter(sort)								// show filter heading in red
    for (x of selected.split(',')) { if (x && !isNaN(x)) {			// highlight selected media			
      if (lv) document.getElementById('title'+x).style.borderBottom = '0.1px solid red'
      else document.getElementById('media'+x).style.borderBottom = '4px solid red'}}
    for (i=1; getParameters(i); i++) {}						// process cues (eg. thumb widths)
    media=document.getElementById('media'+ix)
    if (ix>1) {scrolltoIndex()}}

  function inca(command,value,select,address) { 				// send messages to inca.exe
    if (!select) {select=''} else {select=select+','}
    if (command == 'Favorite') document.getElementById('myFavicon'+index).innerHTML='&#10084'
    else if (selected) select=selected
    for (x of select.split(',')) {if (x) {document.getElementById('media'+x).load(); mySelected.innerHTML=x}}
    setTimeout(function() {							// time for load & right click to be detected
      if (!value) value=''
      if (!address) address=''
      if (isNaN(value)) value=value.replaceAll('#', '<')			// cannot transport '#' over link
      navigator.clipboard.writeText('#'+command+'#'+value+'#'+select+'#'+address)},20)}

  function Time(z) {if (z<0) return '0:00'; var y=Math.floor(z%60); var x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function togglePause() {if(!thumbsheet && lastClick==1) {if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}}
  function selectAll() {for (i=1; document.getElementById('media'+i); i++) {sel(i)}}
  function loop() {looping = !looping}
  function flip() {skinny*=-1; scaleX*=-1; positionMedia(0.5); media.style.transform='scaleX('+skinny+')'}
  function mute() {if(!longClick) {
    myPlayer.volume=0; myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted)}}
  
