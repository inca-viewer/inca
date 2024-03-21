
// Debugging	- use mySelected.innerHTML or alert()
// undo delete & move
// simplify media list htm coding
// duplicate filename issues for thumbs
// access bluetooth hardware from cueList
// cue - add audio overlay option
// cue - zoom into scene but same player size
// cue - add fade out option to music at cue time
// media from near edge zoom on cursor like google earth
// fol fav headings highlight
// mpv offset after close between aspect change
// firefox localStorage ??? wtf
// maybe inca can determine canplay for player choice
// live edit mpv.conf, input instead of mpv dos commands
// create debug panel - messages, start index etc.
// subs hierarchy lost if leave page - lose selection target
// popouts jump position when moving
// zoom fs between portait landscape
// zoom rclick

  var mediaX = 1*localStorage.getItem('mediaX')				// caption strings
  var mediaY = 1*localStorage.getItem('mediaY')				// last media position
  var scaleY = 1*localStorage.getItem('scaleY')				// last media zoom
  var fade = 1*localStorage.getItem('fade')				// media transition
  var defRate = 1*localStorage.getItem('defRate')			// default playback speed
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
  var messages = ''							// history, width, speed & caption edits
  var Zindex = 3							// element layer
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var scaleX								// skinny & X-zoom
  var thumbSheet = false						// 6x6 thumbsheet mode
  var Xoff = 0								// preserve player position in fullscreen
  var Yoff = 0
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var dur = 0
  var rate = 1								// media speed
  var pitch = 1
  var skinny = 1							// media width
  var playing = ''
  var sheetZoom = 1							// thumbsheet zoom
  var zoom = 0								// quick gesture toggle zoom
  var title


  scaleX = scaleY
  if (!fade) fade=0.2							// default transitions
  if (!defRate) defRate=1						// default speed
  if (!mpv) mpv=0							// external player
  intervalTimer = setInterval(Timer,100)				// 100mS background timer
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', gestureEvents)


  document.addEventListener('keydown', (e) => {				// keyboard events
    if (e.key=='>' && playing=='mpv') {lastClick=2; mouseEvent('Up')}	// next media
    if (e.key=='<' && playing=='mpv') {longClick=2; mouseEvent('Up')}	// previous media
    if (e.key=='Enter') {
      if (renamebox) {inca('Rename', renamebox, wasMedia)}		// rename media
      else if (myInput.value) {
        inca('SearchBox','','',myInput.value)}}				// search for media on pc
    if (e.key=='Insert') {thumbSheet=1; Play(e)}
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
    myPreview.style.opacity=0; mySeekbar.style.opacity=0
    sessionStorage.setItem('scroll', myView.scrollTop)
    if (Click==2 && myPanel.matches(':hover')) return			// open new tab
    if (Click==2) e.preventDefault()					// middle click
    else if (overMedia) index = overMedia
    clickTimer=setTimeout(function() {longClick=lastClick; mouseEvent()},240)}


  function mouseUp(e) {
    if (!Click) return							// page load while mouse still down - ignore
    clearTimeout(clickTimer)						// longClick timer
    if (Click==3 &&!gesture && yw>0.1)  context(e)			// new context menu if click below window top
    if (Click==1 && gesture==2 && !playing) getParameters(overMedia)	// double thumb size
    else if (!longClick) mouseEvent('Up')				// process click event 
    Click=0; wheel=0; block=100; gesture=0; longClick=0}


  function closePlayer() {		
    positionMedia(fade*0.3)						// fadeout before close
    myPlayer.style.opacity=0
    playing=''
    inca('Close')
    setTimeout(function() {
      myPlayer.removeEventListener('ended', nextMedia)
      lastStart = myPlayer.currentTime
      myPlayer.src=''
      myPlayer.poster=''
      thumbSheet=false},fade*300)}


  function overThumb(id,el) {						// play htm thumb
    title=document.getElementById('title'+id)
    media=document.getElementById('media'+id)
    overMedia=id
    if (Click) sel(id)
    var x = el['onmousedown'].toString().split(','); x.pop()		// get start from parameters
    start = 1*x.pop().trim()
    x = el.getBoundingClientRect()
    x = (xpos-x.left)/el.offsetWidth*skinny				// reset thumb time if enter from left
    if (!el.currentTime || x<0.1) el.currentTime=start; el.play()}


  function mouseEvent(e) {						// functional logic
    if (Click==2 && !playing) {inca('View',view,'',lastIndex); return}	// switch list/thumb view
    if (Click > 2 && playing && gesture && !longClick) {zoom=1; positionMedia(0.2)} // quick gesture - zoom media
    if (!playing && !longClick && !overMedia) return
    if (longClick && myInput.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return			// also, copy files instead of move
    if (myNav.matches(':hover') && lastClick==1) return
    if (Click > 2 || gesture || title.matches(':hover')) return		// allow rename of media in htm
    if (longClick==1 && !playing && playlist && overMedia && selected) {inca('Move', index); return}
    if (playing=='browser' && lastClick==1 && !thumbSheet && type != 'image') {
      if (xm>0 && xm<1 && (myPreview.matches(':hover') || ym>0.9 && ym<1)) {
        if (xm<0.5 && longClick) myPlayer.currentTime=0
        else if (longClick) myPlayer.currentTime=start
        else myPlayer.currentTime=xm*dur
        myPlayer.play(); return}
      else if (!longClick) {togglePause(); return}}
    if (lastClick==1 && thumbSheet) {getStart(); return}
    lastIndex = index
    if (!playing) {
      if (!mediaX || mediaX < 0 || mediaX > innerWidth) mediaX=innerWidth/2
      if (!mediaY || mediaY < 0 || mediaY > innerHeight) mediaY=innerHeight/2
      if (!scaleY || scaleY>2 || scaleY<0.2) scaleY=0.4}
    if (!playing && overMedia) {index=overMedia; wasMedia=index}
    if (playing && !longClick && lastClick==2) index++
    if (longClick==2 && index > 1) index--
    if (!thumbSheet && e) navigator.clipboard.writeText('#History#'+start.toFixed(1)+'#'+index+'#')
    scaleY=1*localStorage.getItem('scaleY')
    var fadeOut = fade							// media fadeout time 
    if (!playing || longClick) fadeOut=0
    if (playing) positionMedia(fade)
    else {positionMedia(0)}
    myPlayer.style.opacity=0
    positionMedia(fadeOut*500)
    setTimeout(function() {						// so player can fade in/out
      positionMedia(0)
      if (longClick == 1 && (playing || overMedia)) thumbSheet=1
      if (longClick && !thumbSheet && !playing) index=lastIndex		// return to last media
      if (longClick && playing) lastStart = myPlayer.currentTime
      if (!getParameters(index)) {closePlayer(); return}
      var ratio = media.offsetWidth/media.offsetHeight
      if (ratio>1) {x=innerWidth*0.70; y=x/ratio}			// landscape
      else {y=innerHeight; x=y*ratio}					// portrait   
      myPlayer.style.width = x +'px'					// media size normalised to screen
      myPlayer.style.height = y +'px'
      myPlayer.style.top = mediaY-y/2 +'px'
      myPlayer.style.left = mediaX-x/2 +'px'
      positionMedia(0)
      myPlayer.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
      myPlayer.poster = media.poster					// images also use poster src
      myPreview.src = media.src						// seeking preview window
      myCap.innerHTML=''
      myPlayer.src=media.src
      myPlayer.playbackRate = rate					// set default speed
      if (!type) {closePlayer(); return}				// end of media list
      if (!playing && longClick) start=lastStart			// return to last media start
      if (!thumbSheet && type!='image') myPlayer.currentTime=start
      scrolltoIndex(index)			    			// + highlight played media
      positionMedia(fade)
      Play(e)},fadeOut*500)}


  function Play(e) {
    cue = 0
    var ex = myPlayer.src.slice(-3)					// file extension
    var para = start+'|'+skinny+'|'+rate+'|'+pitch+'|'+localStorage.getItem('muted')
    if (!thumbSheet && type=='video' && (mpv || (ex!='mp4' && ex!='mkv' && ex!='m4v' && ex!='ebm'))) playing='mpv'
    else playing='browser'
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (thumbSheet) Thumbsheet()
    if ((type=='document' || type=='m3u') && e) {closePlayer(); inca('Media',0,index); return}
    else if (playing=='mpv' && e) {inca('Media',0,index,para); scaleY=0.6} // use external player
    if (type == 'audio' || playlist.match('/inca/music/')) {
      looping=false; myPlayer.muted=false; scaleY=0.2; myPlayer.style.border='1px solid salmon'}
    if (playing=='browser' && !thumbSheet && type != 'image') myPlayer.play()
    myPlayer.addEventListener('ended', nextMedia)
    if (playing=='browser') myPlayer.style.opacity=1
    myMask.style.zIndex = Zindex
    myPlayer.volume = 0							// allows sound to fade up
    wheel=0; block=160; lastClick=0}


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
      if (!wheelUp) fade+=0.1
      else if (fade>0.1) fade-=0.1
      fade = Math.round(10*fade)/10
      localStorage.setItem("fade",fade)}
    else if (id=='myRate') {						// default rate
      if (!wheelUp) defRate+=0.01
      else if (defRate>0.31) defRate-=0.01
      defRate = Math.round(100*defRate)/100
      localStorage.setItem("defRate",defRate)}
    else if (id=='myPage') {						// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--
      myPage.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// filter
      if (wheelUp) filt++ 
      else if (filt) filt--
      Filter(id)}
    else if (id=='mySpeed') {						// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) rate -= 0.01
        else rate += 0.01
        rate = Math.round(100*rate)/100
        myPlayer.playbackRate = rate
        media.style.rate = rate}}
    else if (id=='mySkinny' && wasMedia) {				// skinny
      block = 30
      if (wheelUp) skinny -= 0.003
      else skinny += 0.003
      skinny=Math.round((1000*skinny))/1000
      media.style.skinny = skinny
      getParameters(wasMedia)
      positionMedia(0)}
    else if (id=='myPitch') {						// pitch
      block = 100
      if (wheelUp) {if (pitch>0.5) {pitch += 0.01}}
      else {if (pitch<2) {pitch -= 0.01}}
      media.style.pitch = pitch}
    else if (id=='View') {						// thumbs
      if (wheelUp) view += 1
      else view -= 1
      View.innerHTML='View '+ (view-6)
      thumbSize()}
    else if (type=='image' || thumbSheet) {				// scroll
      rect = myPlayer.getBoundingClientRect()
      if (myPlayer.offsetHeight-rect.bottom<0 && wheelUp) mediaY-=100
      if (rect.top<0 && !wheelUp) mediaY+=100
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
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (Click && x+y > 4 && !gesture) {					// gesture detection (mousedown + slide)
      if (overMedia) {gesture=2} else {gesture=1; wheel=4}}
    if (!gesture) return
    if (gesture==2 && !playing && !listView) {				// move / pop thumb
      media.style.opacity = 1
      media.style.position = 'fixed'
      media.style.zIndex = Zindex+=1
      media.style.left = xpos-media.offsetWidth/2+"px"
      media.style.top = ypos-media.offsetHeight/2+"px"}
    else if (playing && Click==1) {					// move media
      gesture = 3
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX.toFixed(0))
      localStorage.setItem("mediaY",mediaY.toFixed(0))}
    else if (playing=='browser' && Click==3 && y>x) {			// zoom media
      if (y>x && (scaleY>0.25 || Yref<ypos)) {
        scaleY += ((ypos-Yref) * 0.003)
        localStorage.setItem('scaleY',scaleY.toFixed(3))}}
    Xref=xpos; Yref=ypos; positionMedia(0)}


  function getParameters(i) {						// prepare player for selected media (index)
    if (!(media=document.getElementById('media'+i))) {
      media=document.getElementById('media1'); return}
    title=document.getElementById('title'+i)
    rate = defRate
    pitch = 1
    skinny = 1
    media.style.border=null						// for correct ratio calc,
    x = media['onmousedown'].toString().split(','); x.pop()		// get media parameters from htm entry
    start = 1*x.pop().trim()
    dur = 1*x.pop().trim()						// in case wmv, avi etc
    cueList = x.pop().replaceAll('\'', '').trim()
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image
    if (cueList) Cue(0,i)						// get initial width, speed etc.
    x = media.style.skinny						// get any live width edits
    if (x && x!=skinny) skinny=x 					// in case it has been edited
    x = media.style.pitch
    if (x && x!=pitch) pitch=x
    if (media.style.position!='fixed') {
      media.style.transform='scale('+skinny+',1)'}
    else media.style.transform='scale('+skinny*2.2+',2.2)'		// magnify popped out media from htm
    x = media.style.rate						// custom style variable - rate edited
    if (x && x != rate) rate=x
    if (type != 'image' && !dur) dur=media.duration			// just in case - use browser calc.
    return 1}


  function Timer() {							// every 100mS
    if (block>=25) block-=5						// slowly increase wheel sensitivity
    if (wheel>1) wheel--
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (selected) panel.style.color='lightsalmon'
    else panel.style.color=null
    if (!myNav.matches(":hover")) myNav.style.display=null
    if (!myInput.value.includes('Search')) {
      SearchBox.innerHTML='Search'
      SearchAll.innerHTML='All'
      SearchAdd.innerHTML='Add'}
    if (!media) return
    if (fade < 0.11) myFade.innerHTML = 'Fade'
    else myFade.innerHTML = 'Fade '+fade.toFixed(1)
    if (defRate==1) myRate.innerHTML = 'Speed'
    else myRate.innerHTML = 'Speed '+ defRate
    if (rate==1) mySpeed.innerHTML = 'Speed'
    else mySpeed.innerHTML = rate.toFixed(2)
    if (skinny>0.99 && skinny<1.01) mySkinny.innerHTML = 'Skinny'
    else mySkinny.innerHTML = skinny.toFixed(2)
    if (pitch>0.99 && pitch<1.01) myPitch.innerHTML = 'Pitch'
    else myPitch.innerHTML = pitch.toFixed(2)
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (playlist) {myFav.innerHTML='Fav &#10084'}
    if ((wasMedia || playing) && mySelect.matches(':hover')) {
      mySelect.innerHTML='Select - '+index+' - '+title.value}
    else mySelect.innerHTML='Select'
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'}
    else {mySelect.style.color=null}
    if (playing && !thumbSheet) myBody.style.cursor = 'crosshair'
    else myBody.style.cursor=null
    if (mpv) {myMpv.style.color='red'} else myMpv.style.color=null
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (myPlayer.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (cue) {myRibbon2.style.opacity=1; myRibbon2.style.zIndex=null; Mp3.innerHTML='mp3'; Mp4.innerHTML='mp4'} 
    if (playing) {myMask.style.display='flex'; myMask.style.backgroundColor='rgba(0,0,0,'+scaleY*2.2+')'}  
    else myMask.style.display='none'
    if (playing=='browser') {
      myPlayer.playbackRate=rate
      rect = myPlayer.getBoundingClientRect()
      myCap.style.top=rect.top -30 +'px'
      myCap.style.left=rect.left +10 +'px'
      myCap.style.zIndex=Zindex
      myPreview.style.maxHeight= myPlayer.offsetHeight*scaleY*0.2 +'px'
      myPreview.style.left = xpos - myPreview.offsetWidth/2 +'px'	// seeking preview window
      myPreview.style.top = rect.bottom - myPreview.offsetHeight -12 +'px' 
      if (myCap.innerHTML) {myCap.style.opacity=1}
      if (cueList && !thumbSheet) Cue(myPlayer.currentTime, index)
      xm = myPlayer.offsetWidth*scaleX*sheetZoom
      ym = myPlayer.offsetHeight*scaleY*sheetZoom
      xm = (xpos - rect.left) / Math.abs(xm)
      ym = (ypos - rect.top) / Math.abs(ym)
      myPlayer.style.zIndex=Zindex+1
      mySeekbar.style.display='flex'
      myPreview.style.display='flex'
      myPreview.currentTime=dur*xm
      mySeekbar.style.zIndex=Zindex+1
      myPreview.style.zIndex=Zindex+1
      if (myPlayer.volume <= 0.8) myPlayer.volume += 0.05		// fade sound up
      if (type!='image' && !Click && !thumbSheet) seekBar()
      if (!Click) positionMedia(0.01)}
    else {
      Mp3.innerHTML=''
      Mp4.innerHTML=''
      myCap.innerHTML=''
      myCap.style.opacity=0
      mySeekbar.style.display=null
      myPreview.style.display=null
      myPlayer.style.zIndex=-1}}					// in case flipped into fullscreen


  function positionMedia(fa) {
    var x=0; var y=0; var z=0
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
    if (zoom) {								// triggered by quick slide gesture
      zoom=0
      scaleY=1*localStorage.getItem('scaleY')
      z = (innerHeight+y)/myPlayer.offsetHeight				// media to screen ratio calc.
      if (z > (innerWidth+x)/myPlayer.offsetWidth) z=0
      if (!z && 1.04*myPlayer.offsetWidth*scaleX<innerWidth-x) {
        scaleX=(innerWidth-x)/myPlayer.offsetWidth; scaleY=scaleX/skinny; mediaX=(innerWidth-x-20)/2}
      else if (z && 1.04*myPlayer.offsetHeight*scaleY<innerHeight-y) {
        scaleY=(innerHeight-y)/myPlayer.offsetHeight; mediaY=(innerHeight-y)/2}
      else scaleY=0.7
      localStorage.setItem('scaleY',scaleY.toFixed(3))}
    if (media.offsetWidth/media.offsetHeight < 1) {x*=2} else {y*=2}
    myPlayer.style.left = mediaX +x/2 -(myPlayer.offsetWidth/2) +"px"	// position media in window
    myPlayer.style.top = mediaY +y/2 -(myPlayer.offsetHeight/2) +"px"
    myPlayer.style.transition = fa+'s'
    z = scaleY +(y/innerHeight)
    scaleX = skinny*z
    if (!thumbSheet) sheetZoom = 1					// make thumbsheet ~2x media size
    else sheetZoom = Math.abs(2.7-0.9*myPlayer.offsetWidth*scaleX/((innerWidth/2)))
    myPlayer.style.transform = "scale("+scaleX*sheetZoom+","+z*sheetZoom+")"}


  function seekBar() {							// red progress bar beneath player
    var cueX = rect.left + 'px'
    var cueW = Math.abs(scaleX) * myPlayer.offsetWidth * myPlayer.currentTime / dur + 'px'
    if (cue && cue <= Math.round(myPlayer.currentTime*100)/100) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/dur + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/dur)+'px'
      if (cue == Math.round(myPlayer.currentTime*100)/100) {
        cueW=Math.abs(scaleX*myPlayer.offsetWidth*(dur-cue)/dur)+'px'}}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/dur) + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - Math.round(myPlayer.currentTime*100)/100)/dur) + 'px'
      if (cue < 0.1+Math.round(myPlayer.currentTime*100)/100) {
        cueX=rect.left+'px'; cueW=Math.abs(scaleX*myPlayer.offsetWidth*myPlayer.currentTime/dur)+'px'}}
    mySeekbar.style.left = cueX
    mySeekbar.style.width = cueW
    if (rect.bottom+6 > innerHeight) mySeekbar.style.top = innerHeight -10 +'px'
    else mySeekbar.style.top = rect.bottom-12 +'px'
    if (playing=='browser' && type != 'image') {
      if (xm>0 && xm<1 && ym>0 && ym<1 || cue) {mySeekbar.style.opacity=1} else {mySeekbar.style.opacity-=0.2} 
      if (myPreview.matches(':hover') || cue) {mySeekbar.style.borderTop='8px solid red'}
      else mySeekbar.style.borderTop=null
      if (xm>0 && xm<1 && myPreview.matches(':hover')) {myPreview.style.opacity=1} else {myPreview.style.opacity=0}}
    else {myPreview.style.opacity=0; mySeekbar.style.opacity=0}}


  function Cue(time, i) {						// process media cues - captions, pauses etc.
    var el=document.getElementById('media'+i)
    var x = el['onmousedown'].toString().split(',')			// get cueList from htm entry
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
      if (entry[2]) value = entry[2]					// cue value - optional para.
      if (cueTime > time-0.1 && cueTime < time+0.1) { //  alert(value)
        if (type=='next') {lastClick=2; mouseEvent()}
        else if (type=='time') myPlayer.currentTime = 1*value
        else if (type=='rate') {if (isNaN(1*value)) {rate=defRate} else {rate=1*value}}
        else if (type=='skinny') {if (isNaN(value)) {skinny=1} else {skinny=1*value}}
        else if (type=='pitch') {if (isNaN(value)) {pitch=1} else {pitch=1*value}}
        else if (type=='pause' && block<25) {myPlayer.pause(); entry[3]=value}
        else if (type == 'cap') myCap.innerHTML = value.replaceAll("#3", "\,").replaceAll("#4", "\'").replaceAll("#5", "\"")
        if (y=1000*entry[3]) {setTimeout(function(){myPlayer.play(); myCap.innerHTML=''; block=100},y)}}}}


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
    if (longClick) myPlayer.currentTime=lastStart
    else if (xm>1||xm<0|ym>1||ym<0) myPlayer.currentTime=0		// if outside thumbsheet start 0
    else myPlayer.currentTime=offset - 0.4 - (ps * offset) + dur * ps
    if (type == 'video') myPlayer.poster = ''				// not flash poster after thumbsheet close
    thumbSheet=0
    positionMedia(0.3)
    myPlayer.play()}


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
      lastClick=2
      myPlayer.pause()
      if (playlist.match('/inca/music/')) {
        setTimeout(function() {mouseEvent()}, Math.random()*6000)}	// next media
      else {mouseEvent()}; return}
    myPlayer.currentTime=start
    myPlayer.play()
    if (!longClick && myPlayer.playbackRate > 0.40) {			// slower each loop
      myPlayer.playbackRate -= 0.05}}

  function Filter(id) {
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
      panel.scrollBy(0,-220)
      myView.scrollBy(0,-200)}

  function scrolltoIndex(i) {
    if (!i || myView.scrollTop > myView.scrollHeight-1000) return
    title=document.getElementById('title'+i)
    title.style.background='#1f1c18'
    if (!listView) title.style.color='lightsalmon'
    var x = title.getBoundingClientRect().bottom
    if (x > innerHeight-20 || x<20) myView.scrollTo(0, x + myView.scrollTop - innerHeight/2)}

  function sel(i) {							// highlight selected media
    if (!i || Click==2) return
    if (listView) el=document.getElementById('title'+i)
    else el=document.getElementById('media'+i)
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.outline = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.outline = '0.1px solid red'
      else el.style.outline = '1px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}

  function context(e) {							// right click context menu
    var offset=''
    myDelete.style.color=null
    wasMedia=0
    if (playing) wasMedia=index
    if (overMedia) {index=overMedia; wasMedia=overMedia}
    if (panel.matches(':hover')) {
      var x = e.target.innerHTML					// ~ text under cursor
      if (x && x.length<99) {
        myDelete.style.color='red'; myDelete.innerHTML='Delete - '+x}}
    else {myDelete.style.color=null; myDelete.innerHTML='Delete'}
    if (yw > 0.8) offset=60						// cursor near window bottom, add offset
    myNav.style.left=xpos-45+'px'; myNav.style.top=ypos-10-offset+'px'
    myNav.style.display='block'; myNav.style.background='#15110acc'}

  function globals(vi, pg, ps, so, fi, lv, se, pl, ix) {		// import globals to java from inca
    view=vi; page=pg; pages=ps; sort=so; filt=fi; listView=lv; 
    selected=se; playlist=pl; index=ix; wasMedia=ix; lastIndex=ix
    Filter(sort)							// show filter heading in red
    for (x of selected.split(',')) {if (x && !isNaN(x)) {		// highlight selected media			
      if (lv) document.getElementById('title'+x).style.outline = '0.1px solid red'
      else document.getElementById('media'+x).style.outline = '1px solid red'}}
    for (i=1; getParameters(i); i++)					// process cues (eg. thumb widths)
    scrolltoIndex(index)}

  function inca(command,value,select,address) { 			// send messages to inca.exe
    for (i=1; el=document.getElementById('media'+i); i++) {		// add cue edits to messages
      if (el.style.skinny || el.style.rate || el.style.pitch) {
        messages = messages + '#Cues#'+i+'##'+el.style.skinny+'|'+el.style.rate+'|'+el.style.pitch}}
    if (!select) {select=''} else {select=select+','}
    if (command == 'Favorite' && !selected) document.getElementById('myFavicon'+index).innerHTML='&#10084'
    if (selected && command!='Close' && command!='Reload') select=selected // selected is global value
    for (x of select.split(',')) if (x) document.getElementById('media'+x).load()
    if (!value) value=''
    if (!address) address=''
    if (isNaN(value)) value=value.replaceAll('#', '<')			// because # is used as delimiter
    messages=messages+'#'+command+'#'+value+'#'+select+'#'+address
    navigator.clipboard.writeText(messages)				// send messages to inca
    messages=''}

  function Time(z) {if (z<0) return '0:00'; var y=Math.floor(z%60); var x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function togglePause() {if(!thumbSheet && lastClick==1) {if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}}
  function selectAll() {for (i=1; document.getElementById('media'+i); i++) {sel(i)}}
  function flip() {skinny*=-1; scaleX*=-1; media.style.skinny=skinny; positionMedia(0.5); media.style.transform='scaleX('+skinny+')'}
  function mute() {if(!longClick) {myPlayer.volume=0; myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted)}}








