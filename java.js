
// Debugging - use mySelected.innerHTML or alert()
// to do - undo delete & move files
//       - simplify media list htm coding
//       - duplicate filename issues for thumbs

// mbutton open new tab in firefox locks context & opens in wrong browser
// create title in getparam
// bluetooth hardware interface from cueList
// in Cue process each line number instead of match myPlayer.currentTime
// cue - add audio overlay option
// cue - zoom into scene but same player size
// can add fade out option to music at cue time for "dream on" mp3
// if zoom media from near edge focus zoom on cursor like google earth
// flip issues test
// fol fav headings highlight
// folders to show qty files
// mp3/4 use cue list to create, not cue point
// mpv mix images video confused player open
// mpv offset after close between aspect change
// mpv next / previous
// ff localStorage ???
// filing/ rename errors 
// thumbsheet size
// maybe ina can determine canplay
// scroll index
// search adds?
// hover over music
// when ffmpeg slow
// flip
// pause thumb when pop

  var mediaX = 1*localStorage.getItem('mediaX')				// caption strings
  var mediaY = 1*localStorage.getItem('mediaY')				// last media position
  var scaleY = 1*localStorage.getItem('scaleY')				// last media zoom
  var fade = 1*localStorage.getItem('fade')				// media transition
  var d_rate = 1*localStorage.getItem('d_rate')				// default playback speed
  var mpv = 1*localStorage.getItem('mpv')				// external media player
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
  var scaleX								// skinny & X-zoom
  var lastScaleY = 0.4
  var thumbsheet = false						// 6x6 thumbsheet mode
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var Xoff = 0								// maintain player position in fullscreen
  var Yoff = 0
  var dur = 0
  var pitch = 0
  var playing = ''
  var sheetZoom = 1
  var title


  if (!mediaX || mediaX < 0 || mediaX > innerWidth) mediaX=innerWidth/2
  if (!mediaY || mediaY < 0 || mediaY > innerHeight) mediaY=innerHeight/2
  if (!scaleY || scaleY>2 || scaleY<0.2) scaleY=0.4
  lastScaleY = scaleY
  scaleX = scaleY
  if (!fade) fade=0.2							// default transitions
  if (!d_rate) d_rate=1							// default speed
  if (!mpv) mpv=0							// external player
  intervalTimer = setInterval(Timer,100)				// 100mS background timer
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', gestureEvents)


  document.addEventListener('keydown', (e) => {				// keyboard events
    if (e.key=='Enter') {
      if (renamebox) {inca('Rename', renamebox, wasMedia)}		// rename media
      else if (myInput.value) {
        inca('SearchBox','','',myInput.value)}}				// search for media on pc
    if (e.key=='Insert') {thumbsheet=1; Play(e)}
    if (e.key=='Pause') {						// mouse 'Back' key
      if (playing) closePlayer()
      else if (overMedia && media.style.position=='fixed') {		// close popped out thumb
        media.style.position=null
        media.style.transform='scale('+skinny+',1)'
        media.style.top=null; media.style.left=null}
      else if (myView.scrollTop > 50) myView.scrollTo(0, 0)		// else scroll to page top
      else inca('Reload')}}, false)					// or reload page


  function mouseDown(e) {						// detect long click
    Click=e.button+1; lastClick=Click; longClick=0; 
    gesture=0; wheel=0; block=0; Xref=xpos; Yref=ypos
    sessionStorage.setItem('scroll', myView.scrollTop)
    if (Click==2) e.preventDefault()					// middle click
    clickTimer=setTimeout(function() {
      if (!gesture && xw<0.95) {longClick=lastClick; mouseEvent()}},240)}


  function mouseUp(e) {
    if (!Click) return							// page load while mouse still down - ignore
    clearTimeout(clickTimer)						// longClick timer
    if (Click==3 &&!gesture && yw>0.1)  context(e)			// new context menu if click below window top
    else if (!gesture && !longClick) mouseEvent('Up')			// process click event
    else if (gesture==2 && !playing) getParameters(overMedia)		// double thumb size
    Click=0; wheel=0; block=100; gesture=0; longClick=0}


  function closePlayer() {		
    myPlayer.style.transition=fade*0.3+'s'
    myPlayer.style.opacity=0
    if (playing) {							// then close media player
      Messages()							// process cues, width, speed, caption edits
      myPlayer.removeEventListener('ended', nextMedia)
      navigator.clipboard.writeText(messages)				// send messages to inca
      messages=''} 
    setTimeout(function() {						// so player can fadeout before close
      lastStart=myPlayer.currentTime
      start=0
      playing=''
      myPlayer.src=''
      myPlayer.poster=''
      thumbsheet=false},fade*300)}


  function overThumb(id,el) {						// play htm thumb
    title=document.getElementById('title'+id)
    media=document.getElementById('media'+id)
    overMedia=id
    if (Click) sel(id)
    x = el['onmousedown'].toString().split(','); x.pop()		// get start from parameters
    start = 1*x.pop().trim()
    x = el.getBoundingClientRect()
    x = (xpos-x.left)/el.offsetWidth*skinny				// reset thumb time if enter from left
    if (!el.currentTime || x<0.1) el.currentTime=start; el.play()}
    

  function mouseEvent(e) {						// functional logic
    if (Click > 2) return						// right click
    if (Click==2 && !playing) {inca('View', view, '', lastIndex); return}
    if (longClick && myInput.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return			// also, copy files instead of move
    if (title.matches(':hover')) return					// allow rename of media in htm
    if (longClick==1 && !playing && playlist && overMedia && selected) {inca('Move', index); return}
    if (playing=='browser' && lastClick==1 && !longClick && !thumbsheet && type != 'image') {
    if (!mpv && xm>0 && xm<1 && ym>0.75 && ym<1) {myPlayer.currentTime=xm*dur; return}
      else if (!thumbsheet && !myNav.matches(':hover')) {togglePause(); return}}
    if (lastClick==1 && e=='Up' && !thumbsheet && !overMedia && !myPlayer.matches(':hover')) return
    if (lastClick && overMedia) index=overMedia
    if (e=='Up' && lastClick==1 && myNav.matches(':hover')) return
    if (playing && !longClick && (e=='Next' || lastClick==2)) index++
    if ((e=='Back' || longClick==2) && index > 1) index--
    scaleY = lastScaleY
    var fadeOut = fade							// media fadeout time 
    if (!playing || (e=='Up' && thumbsheet && lastClick==1) || (longClick && !thumbsheet)) fadeOut=0 // no fadeout
    if (playing) positionMedia(fade)
    else {positionMedia(0)}
    if (playing) Messages()						// add last media cue edits to queue
    myPlayer.style.opacity=0
    positionMedia(fadeOut*500) 
    setTimeout(function() {						// so player can fade in/out
      positionMedia(0)
      if (longClick == 1) {
        if (playing) thumbsheet=!thumbsheet
        else if (overMedia) thumbsheet=1}
      if (longClick && !thumbsheet && !playing) index=lastIndex		// return to last media
      if (longClick && playing) lastStart = myPlayer.currentTime
      if (!getParameters(index)) {closePlayer(); return}
      if (ratio>1) {x=innerWidth*0.70; y=x/ratio}			// landscape
      else {y=innerHeight; x=y*ratio}					// portrait   
      myPlayer.style.width = x +'px'					// media size normalised to screen
      myPlayer.style.height = y +'px'
      myPlayer.style.top = mediaY-y/2 +'px'
      myPlayer.style.left = mediaX-x/2 +'px'
      myPlayer.poster = media.poster					// images also use poster src
      myPreview.src = media.src						// seeking preview window
      myPlayer.src=media.src
      myPlayer.playbackRate = rate					// set default speed
      if (!type) {closePlayer(); return}				// end of media list
      if (e=='Up' && lastClick==1 && thumbsheet) getStart()		// thumbsheet xy coord
      if (longClick && !playing) start=lastStart			// return to lat media start
      if (e=='Up' && lastClick==2 && !playing) start=0
      positionMedia(fade)
      scrolltoIndex(index)						// + highlight played media
      Play(e)},fadeOut*500)}


  function Play(e) {
    cue = 0
    wasMedia = index
    playing = 'browser'
    var x = myPlayer.src.slice(-3)					// get file extension
    var y = start+'|'+skinny+'|'+rate+'|'+pitch+'|'+localStorage.getItem('muted')
    if (type=='video' && (mpv || (x!='mp4' && x!='mkv' && x!='m4v' && x!='ebm'))) {x=1} else {x=0}
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (thumbsheet) Thumbsheet()
    else if (type == 'audio' || playlist.match('/inca/music/')) {
      looping=false; myPlayer.muted=false; scaleY=0.25}
    else if (type=='document' || type=='m3u') {inca('Media',0,index); closePlayer(); return}
    else if (x && lastClick) {inca('Media',0,index,y); playing='mpv'; scaleY=0.6}	// use external player
    if (!thumbsheet && type != 'image') {myPlayer.currentTime=start; myPlayer.play()}
    myPlayer.addEventListener('ended', nextMedia)
    myMask.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
    myMask.style.opacity = 1
    if (playing=='browser') {
      myPlayer.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
      myPlayer.style.opacity=1}
    myPlayer.volume = 0							// allows sound to fade up
    wheel=0; lastClick=0}


  function Messages() {							// for inca.exe via clipboard
    lastIndex = index
    if (media.style.skinny || media.style.rate) 
      messages = messages + '#Cues#'+index+'##'+lastStart.toFixed(1)+'|'+skinny+'|'+rate
    if (!thumbsheet) messages = messages + '#History#'+lastStart.toFixed(1)+'#'+index+'#'
    mySeekbar.style.opacity = null
    myPreview.style.opacity = null
    myCap.style.display = 'none'
    myCap.style.opacity = 0
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
      localStorage.setItem("fade",Math.round(10*fade)/10)}
    else if (id=='myRate') {						// default rate
      if (!wheelUp) d_rate+=0.01
      else if (d_rate>0.51) d_rate-=0.01
      d_rate = Math.round(100*d_rate)/100
      localStorage.setItem("d_rate",d_rate)}
    else if (id=='myPage') {						// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--
      myPage.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='myLeft') {}						// left margin
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
      if (playing) {
        skinny=Math.round((1000*scaleX/scaleY))/1000
        media.style.skinny = skinny
        getParameters(index)
        positionMedia(0)}}
    else if (id=='View') {						// thumbs
      if (wheelUp) view += 1
      else view -= 1
      View.innerHTML='View '+ (view-6)
      thumbSize()}
    else if (type=='image' || thumbsheet) {				// scroll
      if (rect.bottom>innerHeight/1.5 && wheelUp) mediaY-=100
      if (rect.top<innerHeight/3 && !wheelUp) mediaY+=100
      positionMedia(0.3)}
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
      SearchBox.innerHTML='Search'
      SearchAll.innerHTML='All'
      SearchAdd.innerHTML='Add'}
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    if (!myNav.matches(":hover")) {
      myNav.style.display=null
      myNav.style.background=null}
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (Click && x+y > 4 && !gesture) {					// gesture detection (mousedown + slide)
      if (overMedia) {gesture=2} else {gesture=1}}
    if (!gesture) return
    if (gesture==2 && !playing && !listView) {				// move thumb
      media.style.opacity = 1
      media.style.position = 'fixed'
      media.style.zIndex = Zindex+=1
      media.style.left = xpos-media.offsetWidth/2+"px"
      media.style.top = ypos-media.offsetHeight/2+"px"}
    else if (xm>0 && xm<1 && ym>0 && ym<1 && playing && Click==1) {	// move media
      gesture = 3
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX.toFixed(0))
      localStorage.setItem("mediaY",mediaY.toFixed(0))}
    else if (playing=='browser' && Click==3 && y>x) {			// zoom media
      if (scaleY>0.15 || Yref<ypos) {
        if (Yref<ypos) {y=0.01} else {y=-0.01}
        scaleY +=y
        lastScaleY = scaleY
        if (scaleX<0) {scaleX -=y} else {scaleX +=y}			// in case media fipped left/right
        localStorage.setItem('scaleY',scaleY.toFixed(3))}}
    Xref=xpos; Yref=ypos; positionMedia(0)}


  function getParameters(i) {						// prepare player for selected media (index)
    if (!(media=document.getElementById('media'+i))) {
       media=document.getElementById('media1'); return}
    title=document.getElementById('title'+i)
    rate = d_rate
    skinny = 1
    ratio = media.offsetWidth/media.offsetHeight
    x = media['onmousedown'].toString().split(','); x.pop()		// get media parameters from htm entry
    start = 1*x.pop().trim()
    dur = 1*x.pop().trim()						// in case wmv, avi etc
    cueList = x.pop().replaceAll('\'', '').trim()
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image
    if (cueList) Cue(0,i)						// get initial width, speed etc.
    x = media.style.skinny						// get any live width edits
    if (x && x!=skinny) skinny=x 					// in case it has been edited
    if (media.style.position!='fixed') {
      media.style.transform='scale('+skinny+',1)'}
    else media.style.transform='scale('+skinny*2.2+',2.2)'
    x = media.style.rate						// custom style variable - rate edited
    if (x && x != rate) rate=x
    if (type != 'image' && !dur) dur=media.duration			// just in case - use browser calc.
    return 1}


  function Timer() {							// every 100mS
    if (block>=25) block-=5						// slowly increase wheel sensitivity
    if (wheel>1) wheel--
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (!media) return
    if (rate==1) mySpeed.innerHTML = 'Speed'
    else mySpeed.innerHTML = rate.toFixed(2)
    myFade.innerHTML = 'Fade '+fade.toFixed(2)
    myRate.innerHTML = 'Speed '+d_rate
    if (skinny>0.99 && skinny<1.01) mySkinny.innerHTML = 'Skinny'
    else mySkinny.innerHTML = skinny.toFixed(2)
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
//mySelected.innerHTML = ''
    if (playlist) {myFav.innerHTML='Fav &#10084'}
    if (wasMedia && mySelect.matches(':hover')) mySelect.innerHTML='Select - '+index+' - '+title.value
    else mySelect.innerHTML='Select'
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'}
    else {mySelect.style.color=null}
    if (mpv) {myMpv.style.color='red'} else myMpv.style.color=null
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (myPlayer.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (cueList && type!='image' && !thumbsheet) Cue(myPlayer.currentTime, index)
    if (playing) {
      xm = myPlayer.offsetWidth*scaleX*sheetZoom
      ym = myPlayer.offsetHeight*scaleY*sheetZoom
      rect = myPlayer.getBoundingClientRect()
      xm = (xpos - rect.left) / Math.abs(xm)
      ym = (ypos - rect.top) / Math.abs(ym)
      myMask.style.display='flex'
      myPlayer.style.zIndex=Zindex+1
      mySeekbar.style.display='flex'
      myPreview.style.display='flex'
      myMask.style.backgroundColor='rgba(0,0,0,'+scaleY*2.2+')'
      if (myPlayer.volume <= 0.8) myPlayer.volume += 0.05		// fade sound up
      if (playing=='browser' && type!='image' && !Click && !thumbsheet) seekBar()
      if (!Click) positionMedia(0.01)}
    else {
      myMask.style.display='none'
      mySeekbar.style.display=null
      myPreview.style.display=null
      myPlayer.style.zIndex=-1}}					// in case flipped into fullscreen


  function positionMedia(fa) {
    var x=0; var y=0
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
    if (fa && mediaY>0.4*(innerHeight-y) && mediaY<0.6*(innerHeight-y) && mediaX>0.3*(innerWidth-x) && mediaX<0.6*(innerWidth-x)) {
      if (Math.abs(myPlayer.offsetWidth*scaleX) > 0.9*(innerWidth-x) && Math.abs(myPlayer.offsetWidth*scaleX) < 1.3*(innerWidth-x)) {
        mediaX=(innerWidth/2)-x; scaleX=(innerWidth)/myPlayer.offsetWidth; scaleY = scaleX/skinny}
      else if (Math.abs(myPlayer.offsetHeight*scaleY) > 0.9*(innerHeight-y) && Math.abs(myPlayer.offsetHeight*scaleY) < 1.2*(innerHeight-y)) {
        mediaY=(innerHeight/2)-y; scaleY=(innerHeight)/myPlayer.offsetHeight}}
    scaleX = skinny*scaleY
    myPlayer.style.left = x+mediaX-(myPlayer.offsetWidth/2) +"px"
    myPlayer.style.top = y+mediaY-(myPlayer.offsetHeight/2) +"px"
    myPlayer.style.transition = fa+'s'
    if (thumbsheet) {
      x = myPlayer.offsetWidth*scaleX
      if (x > innerWidth/2) sheetZoom = 1.6-(x-innerWidth/2)/x
      else sheetZoom = 2}
    else sheetZoom = 1
    myPlayer.style.transform = "scale("+scaleX*sheetZoom+","+scaleY*sheetZoom+")"}


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
    if (xm>0 && xm<1 && ym>0.75 && ym<1) {
//      if (ym<0.75) mySelected.innerHTML = (myPlayer.currentTime-cue).toFixed(2)
//      else mySelected.innerHTML = Time(myPlayer.currentTime)+' - '+Time(dur*xm)+' - '+Time(dur)
      myPreview.style.maxHeight= myPlayer.offsetHeight*scaleY*0.2 +'px'
      myPreview.style.left = xpos - myPreview.offsetWidth/2 +'px'	// seeking preview window
      myPreview.style.top = rect.bottom - myPreview.offsetHeight -12 +'px'
      myPreview.currentTime=dur*xm}
//    else {mySeekbar.style.borderTop=null; myPreview.style.opacity=null; if(!selected) {mySelected.innerHTML=''}}
    if (rect.bottom+6 > innerHeight) mySeekbar.style.top = innerHeight -10 +'px'
    else mySeekbar.style.top = rect.bottom-6 +'px'
    if (xm>0 && xm<1 && ym>0 && ym<1) {mySeekbar.style.opacity=1} else {mySeekbar.style.opacity-=0.2} 
    if (xm>0 && xm<1 && ym>0.75 && ym<1) {myPreview.style.opacity=1; mySeekbar.style.borderTop='8px solid red'}
    else {myPreview.style.opacity=0; mySeekbar.style.borderTop=null}
    mySeekbar.style.zIndex=Zindex+1; myPreview.style.zIndex=Zindex+1}


  function Cue(time, i) {						// process media cues - captions, pauses etc.
    el=document.getElementById('media'+i)
    x = el['onmousedown'].toString().split(',')				// get cueList from htm entry
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
          myCap.innerHTML = value.replaceAll("#3", "\,").replaceAll("#4", "\'").replaceAll("#5", "\"")
          rect = myPlayer.getBoundingClientRect()
          myCap.style.top = rect.bottom +10 +'px'
          myCap.style.left = rect.left +10 +'px'
          myCap.style.display='block'
          myCap.value = myCap.innerHTML
          myCap.style.opacity = 1}}}}


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
    if (xm>1||xm<0|ym>1||ym<0) start = lastStart			// if outside thumbsheet start 0
    else start = offset - 0.4 - (ps * offset) + dur * ps
    if (type == 'video') myPlayer.poster = ''				// not flash poster after thumbsheet close
    thumbsheet=0}


  function Thumbsheet() {						// 1st thumb or 6x6 thumbsheet
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

  function scrolltoIndex(i) {
    if (!i) return
    media=document.getElementById('media'+i)
    title=document.getElementById('title'+i)
    title.style.background='#1f1c18'
    media.style.border='0.1px solid salmon'
    var x = media.getBoundingClientRect().bottom
    if (x > innerHeight-20) myView.scrollTo(0, x + myView.scrollTop - innerHeight + 20)}

  function sel(i) {							// highlight selected media
    if (!i || longClick || lastClick==2) return
    if (listView) el=document.getElementById('title'+i)
    else el=document.getElementById('media'+i)
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.outline = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.outline = '0.1px solid red'
      else el.style.outline = '2px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}

  function context(e) {							// right click context menu
    var offset=''
    myDelete.style.color=null
    wasMedia=0
    if (overMedia) {
      index=overMedia
      wasMedia=overMedia
      SearchRen.innerHTML='Rename'
      myInput.value=title.value}
    if (panel.matches(':hover')) {
      var x = e.target.innerHTML						// ~ text under cursor
      if (x && x.length<99) {
        myDelete.style.color='red'; myDelete.innerHTML='Delete - '+x}}
    else {myDelete.style.color=null; myDelete.innerHTML='Delete'}
    if (yw > 0.8) offset=60							// cursor near window bottom, add offset
    myNav.style.left=xpos-40+'px'; myNav.style.top=ypos-10-offset+'px'
    myNav.style.display='block'; myNav.style.background='#15110acc'}

  function globals(vi, pg, ps, so, fi, lv, se, pl, ix) {			// import globals to java from inca
    view=vi; page=pg; pages=ps; sort=so; filt=fi; listView=lv; 
    selected=se; playlist=pl; index=ix; wasMedia=ix; lastIndex=ix
    filter(sort)								// show filter heading in red
    for (x of selected.split(',')) {if (x && !isNaN(x)) {			// highlight selected media			
      if (lv) document.getElementById('title'+x).style.outline = '0.1px solid red'
      else document.getElementById('media'+x).style.outline = '2px solid red'}}
    for (i=1; getParameters(i); i++) 						// process cues (eg. thumb widths)
    scrolltoIndex(index)}

  function inca(command,value,select,address) { 				// send messages to inca.exe
    if (!select) {select=''} else {select=select+','}
    if (command == 'Favorite') document.getElementById('myFavicon'+index).innerHTML='&#10084'
    else if (selected) select=selected
    for (x of select.split(',')) if (x) document.getElementById('media'+x).load()
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
  
