
// Debugging - mySelected.innerHTML or alert()
// to do - undo delete & move files
//       - simplify media list htm coding
//       - duplicate filename issues for thumbs
// panel headings


  var media = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var nav = document.getElementById('myContext')			// context menu during media play
  var nav2 = document.getElementById('myContext2')			// context menu over thumbs
  var cap = document.getElementById('myCap')				// caption textarea element
  var mediaX = 1*localStorage.getItem('mediaX')
  var mediaY = 1*localStorage.getItem('mediaY')				// last media position
  var fade = 1*localStorage.getItem('fade')
  var d_rate = 1*localStorage.getItem('d_rate')
  var intervalTimer
  var wheel = 0
  var block = 100							// block wheel/gesture events
  var index = 1								// media index (e.g. media14)
  var last_index = 1
  var start = 0								// video start time
  var last_start = 0							// last media start time
  var interval = 0							// media seeking interval step
  var units = ''							// minutes, months, MB etc.
  var rate = 1								// current rate
  var view = 14								// thumb size em
  var list_view = 0
  var page = 1
  var pages = 1								// how many htm pages of media
  var sort = 0								// media list sort 
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var type = ''								// audio, video, image, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = true							// play next or loop media
  var lastClick = 0							// state is preserved
  var Click = 0								// state cleared after mouseUp
  var longClick = 0							// state is preserved
  var gesture = 0							// state is preserved
  var searchbox = ''							// search input field
  var renamebox = ''							// media rename input field
  var selected = ''							// list of selected media in page
  var over_cap = false							// cursor over caption
  var over_media = 0							// over thumb or media
  var was_over_media = 0
  var ratio								// media width to height ratio
  var skinny = 1							// media width
  var messages = ''							// skinny and caption changes
  var cue = 0								// start/end time for looping & mp3/4 conversions
  var cue_active = false						// setting cue point
  var Zindex = 3
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var scaleX = 0.7							// skinny & magnify factor
  var scaleY = 0.7							// media size
  var last_scaleY = 0.7
  var sheetY = 1.2							// thumbsheet size
  var sheet = 0								// thumbsheet mode
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var Xoff = 0								// maintain player position in fullscreen
  var Yoff = 0


  getParameters()							// initialise to media1 attributes
  gestureEvents(0)							// (fill search bar)
  positionMedia(0)
  modal.style.opacity=0;						// stop page load flicker
  modal.style.zIndex=-1;
  if (!fade) {fade=0.2}
  if (!d_rate) {d_rate=1}
  if (!mediaX || mediaX < 0 || mediaX > innerWidth) {mediaX=innerWidth/2}
  if (!mediaY || mediaY < 0 || mediaY > innerHeight) {mediaY=innerHeight/2}
  intervalTimer = setInterval(Timer,100)				// 100mS universal timer
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', gestureEvents)
  document.addEventListener('keypress', (e) => {
    if (e.key=='Enter') {
      if (renamebox) {inca('Rename', renamebox, was_over_media, was_over_media)}
      else if (searchbox) {inca('SearchBox', searchbox.value)}		// search for media on pc
      else if (cap.value != cap.innerHTML) {editCap()}}}, false)	// media caption


  function mouseDown(e) {						// detect long click
    Click=e.button+1; lastClick=Click; longClick=0; gesture=0; wheel=0; block=0; Xref=xpos; Yref=ypos
    if (Click==2 && (over_media || type || e.shiftKey)) {e.preventDefault()} // middle click
    clickTimer = setTimeout(function() {if (!gesture && xw<0.95) {longClick=1; mouseEvent('Down')}},240)}


  function mouseUp(e) {
    if (!Click) {return}						// page load while mouse still down - ignore
    clearTimeout(clickTimer)						// longClick timer
    if (Click==3 && !gesture && yw>0.1) {context()}			// new context menu if click below window top
    if (Click == 2 && !longClick && !gesture && e.shiftKey) {		// inca converts Back button to shift Mclick
      if (type) {mouseBack()}						// close modal player if media playing
      else if (myView.scrollTop > 50) {myView.scrollTo(0, 0)}		// else scroll to page top
      else {inca('Reload')}}
    else if (!gesture && !longClick) {mouseEvent('Up')}			// process click event
    else if (gesture==2 && playlist) {					// move media position within playlist
      was_over_media = index						// preserve media id
      media.style.display='none'					// to reveal media underneath dragged item
      setTimeout(function() { 						// time for browser to reveal/update
        if (index == was_over_media) {media.style.display=null}		// restore thumb visibility
        else {inca('Move', index, was_over_media)}},50)}		// send move command to inca.exe
    else if (gesture) {positionMedia(fade)}
    Click=0; wheel=0; block=100; gesture=0; longClick=0}


  function mouseBack() {
    myPlayer.style.transition=fade*0.3+'s'
    myPlayer.style.opacity=0
    nav2.style.display=null
    nav2.style.opacity=1
    cue_active = false
    if (type) {								// close media player
      Messages()							// add history, width, speed, caption edits
      myPlayer.removeEventListener('ended', media_ended)
      navigator.clipboard.writeText(messages)				// send messages to inca
      messages=''
      type=''} 
    setTimeout(function() {
      start=0
      sheet=0
      over_media=0
      myPlayer.src=''
      myPlayer.poster=''
      modal.style.opacity=0
      modal.style.zIndex=-1},fade*300)}


  function mouseEvent(e) {						// functionality logic
    if (Click > 2) {return}
    if (e=='Down' && lastClick==1 && over_cap) {return}
    if (e=='Down' && myPanel.matches(':hover')) {return}					// copy files instead of move
    if (e=='Down' && lastClick==2 && !type) {inca('View', view, '', was_over_media); return}	// change view list/thumbs
    if (e=='Down' && mySearch.matches(':hover')) {navigator.clipboard.writeText('#Source#'+index+'##'); return} // open source
    if (e=='Up' && !type && !over_media) {return}
    if (e=='Up' && longClick) {return}
    if (Click==1 && !longClick && !sheet && type && type != 'image' && !nav2.matches(':hover')) {
      if (xm>-0.1 && (yw>0.98 || (ym>1 && ym<1.1))) {
        if (xm>0 && xm<0.05) {start=0; getParameters(); myPlayer.currentTime=start}
        else {myPlayer.currentTime=xm*myPlayer.duration}
        if (myPlayer.currentTime<10) {myPlayer.play()}}
      else if (!cap.matches(':hover')) {togglePause()}
      return}
    if (e=='Up' && lastClick==1 && nav2.matches(':hover')) {return}
    if (type == 'video' && cap_list && (ym>1 || yw>0.9)) {		// seek to next caption in movie
      for (var x of cap_list.split('|')) {
        if (!isNaN(x) && x>(myPlayer.currentTime+1)) {
          myPlayer.currentTime=x-1; myPlayer.play(); return}}}
    if (type) {Messages()}						// add history, width, speed, caption edits
    else {myPlayer.addEventListener('ended', media_ended)}
    if (type && !longClick) {
      if (e=='Next' || lastClick==2) {index++; start=0}
      if (e=='Back' && index > 1) {index--}}
    if (type && lastClick==2 && longClick && index > 1) {index--}
    scaleY = last_scaleY
    cue = 0
    var playing = type
    var fadein = fade										// media fadein time 
    if (!type || (e=='Up' && sheet && Click==1) || (longClick && !sheet)) {fadein=0}		// no fadeout
    if (type) {positionMedia(fade)}								// fadeout last media
    else {positionMedia(0)}
    myPlayer.style.opacity=0
    setTimeout(function() {
      positionMedia(0)
      type = getParameters()
      if (!type) {mouseBack(); return}								// end of media list
      if (document.getElementById('title'+index).matches(':hover')) {return}
      if (e=='Up'|| e=='Down') {navigator.clipboard.writeText('#Media#'+index+'##'+start)}	// tell inca is playing
      if (type == 'document' || type == 'm3u') {type=''; return}				// let inca open file
      if (e=='Up' && lastClick==1 && sheet) {playThumb()}
      if (e=='Down' && lastClick==1) {	
        if (playing) {sheet=!sheet}
        else if (over_media) {sheet=1; start=0}
        if (playing && over_media) {start=last_start}						// long click over sheet
        if (!playing && !over_media) {index=last_index; getParameters(); start=last_start}}	// return to last media
      scrolltoIndex()
      positionMedia(fade)
      Play(e)},fadein*500)}


  function Play(e) {
    if (sheet) {thumbSheet()}
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (type == 'audio' || playlist.match('/inca/music/')) {looping=false; myPlayer.muted=false; scaleY=0.25}
    scaleX = scaleY * skinny
    if (cap_list && type != 'thumbsheet' && start>1) {start-=1}		// start at first caption
    if (type == 'video' || type == 'audio') {myPlayer.currentTime = start; myPlayer.play()}
    modal.style.opacity = 1
    modal.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
    myPlayer.volume = 0							// allows sound to fade up
    over_media=0							// when entering modal player
    nav.style.display = null
    was_over_media = index
    positionMedia(fade)    
    myPlayer.style.opacity=1
    wheel=0; lastClick=0}


  function Messages() {							// for inca.exe
    last_index = index
    if (myPlayer.currentTime) {last_start = myPlayer.currentTime}
    if (cap.value != cap.innerHTML) {editCap()}
    if (!sheet) {messages = messages + '#History#'+index+'##'+last_start.toFixed(1)+'|'+skinny+'|'+rate+'|'+d_rate}
    mySeekbar.style.opacity = null
    myPreview.style.opacity = null
    cap.style.display = 'none'
    block = 160}


  function wheelEvents(e, id, el) {
    e.preventDefault()
    wheel += Math.abs(e.deltaY)
    if (Click || wheel < block) {return}
    var wheelUp = false
    wheel -= block
    if (wheel>10) {wheel=10}
    if (wheel<2) {wheel=2}
    block = 120
    if (e.deltaY > 0) {wheelUp=true}
    if (id=='myFade') {							// fade control
      if (!wheelUp) {fade+=0.05} else if (fade>0.26) {fade-=0.05}
      localStorage.setItem("fade",Math.round(10*fade)/10)}
    else if (id=='myRate') {						// default rate
      if (!wheelUp) {d_rate+=0.01} else if (d_rate>0.51) {d_rate-=0.01}
      localStorage.setItem("d_rate",Math.round(100*d_rate)/100)}
    else if (id == 'myPage') {						// htm page
      if (wheelUp && page<pages) {page++} 
      else if (!wheelUp && page>1) {page--}
      myPage.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// filter
      if (wheelUp) {filt++} else if (filt) {filt--}
      filter(id)}
    else if (id=='mySpeed') {						// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) {rate -= 0.01}
        else {rate += 0.01}
        rate = Math.round(100*rate)/100
        myPlayer.playbackRate = rate
        if (rate == d_rate) {block=333}}}
    else if (id == 'mySkinny') {					// skinny
      block = 30
      if (wheelUp) {scaleX -= 0.003}
      else {scaleX += 0.003}
      skinny = Math.round((1000*scaleX/scaleY))/1000
      media.style.transform = 'scale('+skinny+',1)'
      if (Math.abs(skinny) == 1) {block=333}
      positionMedia(0)}
    else if (id=='myNext' || id=='mySelect2') {				// next
      block=180; wheel=0
      if (wheelUp) {mouseEvent('Next')}
      else if (e.deltaY) {mouseEvent('Back')}}
    else if (type=='image' || sheet) {					// scroll
      if (rect.bottom>innerHeight/1.5 && wheelUp) {mediaY-=50} 
      if (rect.top<innerHeight/3 && !wheelUp) {mediaY+=50}
      positionMedia(0.3)}
    else if (id=='View') {						// thumbs
      if (wheelUp) {view += 1}
      else {view -= 1}
      thumbSize()}
    else if (type=='video' || type=='audio') {				// seek
      if (myPlayer.duration > 120) {interval = 3}
      else {interval = 0.5}
      mySeekbar.style.opacity = 1
      if (myPlayer.paused) {interval = 0.04}
      if (wheelUp) {myPlayer.currentTime += interval}
      else {myPlayer.currentTime -= interval}
      block = 160}
    wheel = 10}


  function gestureEvents(e) {						// cursor moved
    xpos = e.clientX
    ypos = e.clientY
    if (selected) {panel.style.color='lightsalmon'}
    else {panel.style.color=null}
    if (myInput.value) {
      SearchBox.innerHTML='Search'; SearchAll.innerHTML='All'; SearchAdd.innerHTML='Add'}
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    if (!nav.matches(":hover"))  {nav.style.display = null}
    if (!nav2.matches(":hover")) {nav2.style.display = null}
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (Click && !over_cap && x+y > 4 && !gesture) {			// gesture detection (mousedown + slide)
      if (over_media) {gesture=2}
      else {gesture=1}}
    if (Click==3 && gesture && !type) {					// zoom thumbs
      if (Yref<ypos) {view += view/40}
      else {view -= view/40}
      thumbSize()
      inca('View', view.toFixed(1))}
    else if (gesture==2 && !type) {					// move thumb
      media.style.opacity = 1
      media.style.position = 'fixed'
      media.style.zIndex = Zindex+=1
      media.style.left = xpos-media.offsetWidth/2+"px"
      media.style.top = ypos-media.offsetHeight/2+"px"}
    else if (type && gesture && Click==1) {				// move media
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX)
      localStorage.setItem("mediaY",mediaY)}
    else if (type && Click>1 && y>x) {					// zoom media
      if (scaleY>0.25 || Yref<ypos) {
        if (Yref<ypos) {y=1.02} else {y=0.98}
        if (type == 'thumbsheet') {sheetY*=y}				// zoom thumbsheet
        else {
          scaleY *= y
          last_scaleY = scaleY
          if (scaleX<0) {scaleX *= -y} else {scaleX *= y}}}}		// in case media fipped left/right
    if (gesture) {Xref=xpos; Yref=ypos; positionMedia(0)}
    if (type) {
      modal.style.cursor = 'crosshair'
      if (type != 'thumbsheet') {setTimeout(function() {modal.style.cursor='none'},400)}}}


  function Timer() {							// every 100mS
    if (block>=25) {block-=5}						// slowly reduce event blocking
    if (wheel>1) {wheel--}
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = myPlayer.getBoundingClientRect()
    myNext.innerHTML = index
    myFade.innerHTML = 'Fade '+ fade.toFixed(2)
    myRate.innerHTML = 'Speed '+ d_rate.toFixed(2)
    if (rate==d_rate) {mySpeed.innerHTML = 'Speed'} else {mySpeed.innerHTML = rate.toFixed(1)}
    if (selected) {mySelected.innerHTML = selected.split(',').length -1}
    else mySelected.innerHTML = ''
    if (!type) {return}
    if (myPlayer.duration) {
      mySelect2.innerHTML = 'Select - '+(myPlayer.currentTime/60).toFixed(2)
      x=Math.round(myPlayer.duration/60)+'mins - '}
    if (mySelect2.matches(':hover')) {
      mySelect2.innerHTML='Select - '+x+document.getElementById('title'+index).value}
    if (skinny == 1) {mySkinny.innerHTML = 'Skinny'}
    else {mySkinny.innerHTML = skinny.toFixed(2)}
    if (rate == d_rate) {mySpeed.innerHTML = 'Speed'}
    else {mySpeed.innerHTML = rate.toFixed(2)}
    if (selected && (","+selected).match(","+index+",")) {
      mySelect2.style.color='red'}
    else {mySelect2.style.color=null}
    if (type == 'thumbsheet') {
      xm = myPlayer.offsetWidth*sheetY*skinny; ym = myPlayer.offsetHeight*sheetY}
    else {xm = myPlayer.offsetWidth*scaleX; ym = myPlayer.offsetHeight*scaleY}
    xm = (xpos - rect.left) / Math.abs(xm)
    ym = (ypos - rect.top) / Math.abs(ym)
    cap.style.top = rect.bottom +10 +'px'
    cap.style.left = rect.left +10 +'px'
    if (cap_list) {cap.style.display='block'}
    showCaption()
    modal.style.transition = fade+'s'
    modal.style.backgroundColor = 'rgba(0,0,0,'+scaleY*2+')'
    if (!cue_active && cue && myPlayer.currentTime > cue) {media_ended()}	// cue is media end time
    if (nav2.matches(':hover') && nav2.style.opacity > 0.2 && !mySelect2.matches(':hover')) {nav2.style.opacity -= 0.02}
    if (xm>0 && xm<1 && ym>0 && ym<1) {over_media=index} else {over_media=0}
    if (myPlayer.volume <= 0.8) {myPlayer.volume += 0.05}			// fade sound up
    if (looping) {myLoop.style.color='red'} else {myLoop.style.color=null}
    if (myPlayer.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (skinny<0) {myFlip.style.color='red'} else {myFlip.style.color=null}
    if (type != 'image') {seekBar()}
    if (!Click) {positionMedia(0.01)}}						// in case flipped into fullscreen


  function positionMedia(f) {							// align media in modal
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
    if (type == 'thumbsheet') {myPlayer.style.transform="scale("+skinny*sheetY+","+sheetY+")"}
    else  {myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"}}


  function getParameters() {						// prepare player for selected media (index)
    if (!(media = document.getElementById('media'+index))) {index=1; return}
    var x = media.style.borderBottom; media.style.borderBottom=null	// preserve border-radius
    ratio = media.offsetWidth/media.offsetHeight
    media.style.borderBottom=x
    x = media['onmouseover'].toString().split(","); x.pop()		// get media parameters from htm entry
    if (!(rate=1*x.pop().trim())) {rate = d_rate}
    cap_list = x.pop().slice(0, -1).slice(2) 				// captions list
    cue = 1*x.pop().trim()
    if (start<1) {start = 1*x.pop().trim()} else {x.pop()}		// start time
    var type_t = x.pop().replaceAll('\'', '').trim()			// eg video, image
    skinny = 1*x.pop().trim()						// width changes
    x = 1*media.style.transform.slice(6,-4)				// get width from web page
    if (x && x != skinny) {skinny=x}					// in case it has been edited
    if (ratio > 1) {
      x = innerWidth*0.70; y = x/ratio; sheetY = innerWidth/x}		// landscape
    else {y = innerHeight; x = y*ratio; sheetY = innerHeight/y}		// portrait
    myPlayer.style.width = x +'px'					// media size normalised to screen
    myPlayer.style.height = y +'px'
    myPlayer.style.top = mediaY-y/2 +'px'
    myPlayer.style.left = mediaX-x/2 +'px'
    myPreview.src = media.src						// small seeking preview image
    positionMedia(0)							// prepare player for clean start
    if (myPlayer.src != media.src) {					// stop reloading stutter
      myPlayer.src=media.src
      if (sheet) {thumbSheet()}						// convert poster to 6x6 thumbsheet src
      else {myPlayer.poster = media.poster}}
    myPlayer.playbackRate = rate					// set default speed
    return type_t}


  function overThumb(id) {						// cursor over thumbnail
    if (gesture) {return}
    over_media = id
    index = id
    start = 0
    getParameters()							// preload media for fast start
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / Math.abs(media.offsetWidth)
    ym = (ypos - rect.top) / Math.abs(media.offsetHeight)
    if (ym > 0.9 && media.duration) {					// if enter thumb from below - seek
      start=media.duration*xm
      media.currentTime=media.duration*xm}
    if (ym < 0.1 || !media.currentTime) {media.currentTime=start}	// if enter from top - reset start time
    media.play()}


  function thumbSize() {
    if (view < 8) {view = 8}
    if (view > 99) {view = 99}
    el = document.getElementById('media1')
    el.style.opacity=1
    el.style.transition='0.2s'
    el.style.zIndex = Zindex+=1
    el.style.maxWidth=(view*0.8)+'em'
    el.style.maxHeight=(view*0.8)+'em'}


  function playThumb() {
    var row = Math.floor(ym * 6)					// get media seek time from cursor xy
    var col = Math.ceil(xm * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (myPlayer.duration > 60) {offset = 20}
    if (xm>1||xm<0|ym>1||ym<0) {start = 0}				// if outside thumbsheet start 0
    else {start = offset - 0.4 - (ps * offset) + myPlayer.duration * ps}
    nav2.style.display=null
    sheet=0}


  function thumbSheet() {						// change poster jpg to 6x6 thumbsheet jpg
    last_start=myPlayer.currentTime
    var x = media.poster.replace("/posters/", "/thumbs/")
    p = x.split('%20')							// see if embedded start time in poster filename
    p = p.pop()
    p = p.replace('.jpg', '')
    if (!isNaN(p) && p.length > 2 && p.includes('.')) {			// very likely a 'fav' suffix timestamp
      x = x.replace('%20' + p, '')}					// so remove timestamp from filename
    myPlayer.poster = x							// use 6x6 thumbsheet file
    myPlayer.load()
    myPlayer.playbackRate = rate
    type = 'thumbsheet'}


  function media_ended() {						// looping or next media
    if (!looping) {
      cue = 0
      myPlayer.pause()
      if (playlist.match('/inca/music/')) {
        setTimeout(function() {mouseEvent('Next')}, Math.random()*6000)} // next media
      else {mouseEvent('Next')}; return}
    myPlayer.currentTime=start
    myPlayer.play()
    if (!longClick && myPlayer.playbackRate > 0.40) {myPlayer.playbackRate -= 0.05}}	// slower for each loop


  function scrolltoIndex() {
    if (!(el=document.getElementById('media'+index))) {return}
    var x = ','+selected								// highlight played media in htm
    if (!x.match(","+index+",") && !x.match(","+last_index+",")) {
      if (el=document.getElementById('title'+last_index)) {el.style.background=null}
      if (el=document.getElementById('title'+index)) {el.style.background='#2b2824'}
      if (el=document.getElementById('media'+last_index)) {el.style.borderBottom=null}
      if (el=document.getElementById('media'+index)) {el.style.borderBottom='4px solid salmon'}}
    setTimeout(function() {
      x = el.getBoundingClientRect().top + myView.scrollTop
      if (list_view) {if (el.getBoundingClientRect().top > 500) {myView.scrollTo(0,x-260)}}
      else if (Math.abs(myView.scrollTop-(x-360)) > 300) {myView.scrollTo(0,x-360)}},232)}	// ignore small scrolls


  function seekBar() {									// red progress bar beneath player
    var cueX = rect.left + 'px'
    var cueW = Math.abs(scaleX) * myPlayer.offsetWidth * myPlayer.currentTime / myPlayer.duration + 'px'
    if (cue && cue <= Math.round(myPlayer.currentTime*10)/10) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/myPlayer.duration + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/myPlayer.duration)+'px'
      if (cue == Math.round(myPlayer.currentTime*10)/10) {
        cueW=Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.duration-cue)/myPlayer.duration)+'px'}}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/myPlayer.duration) + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - Math.round(myPlayer.currentTime*10)/10)/myPlayer.duration) + 'px'
      if (cue < 0.4+Math.round(myPlayer.currentTime*10)/10) {
        cueX=rect.left+'px'; cueW=Math.abs(scaleX*myPlayer.offsetWidth*myPlayer.currentTime/myPlayer.duration)+'px'}}
    mySeekbar.style.left = cueX
    mySeekbar.style.width = cueW
    if (xm>-0.1 && ym>1 && ym<1.1 || cue_active || (xm>-0.1 && yw>0.98)) {
      mySelected.innerHTML = Time(myPlayer.duration*xm)
      mySeekbar.style.borderTop='10px solid red'
      mySeekbar.style.opacity=1
      myPreview.style.left = xpos - myPreview.offsetWidth/2 +'px'
      myPreview.style.top = rect.bottom - myPreview.offsetHeight -5 +'px'
      myPreview.currentTime=myPlayer.duration*xm
      if (xm>0 && xm<1) {myPreview.style.opacity=1} else {myPreview.style.opacity=0}} 
    else {mySeekbar.style.borderTop=null; myPreview.style.opacity=null; if (!selected) {mySelected.innerHTML=''}}
    if (rect.bottom+6 > innerHeight) {mySeekbar.style.top = innerHeight -10 +'px'}
    else {mySeekbar.style.top = 3 + rect.bottom +'px'}
    if (nav2.matches(':hover') || over_media) {mySeekbar.style.opacity=1}
    else {mySeekbar.style.opacity-=0.1}}


  function editCap() {							// edit media caption
    var time = myPlayer.currentTime.toFixed(1)
    if (time<1) {time = '0.0'}
    if (cap.value != cap.innerHTML && cap.value.length > 1) {
      newcap = cap.value + "|" + time + "|"
      inca('Caption', newcap, index, cap.innerHTML+'|'+time+'|')
      cap.value = ''; cap.innerHTML = ''
      myPlayer.play()}
    else {
      if (!cap.value) {cap.value = '-'; cap.innerHTML = '-'}
      cap.style.opacity=0.6
      cap.style.display='block'
      cap.focus()}}

  function showCaption() {						// display captions
    if (document.activeElement.id == 'myCap') {cap.style.color='red'; return}
    else {cap.style.color=null}
    var time = myPlayer.currentTime.toFixed(1)
    if (!time || type == 'image') {time='0.0'}
    var ptr = cap_list.indexOf('|'+ time + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ time - 0.1 + '|')}
    if ((ptr > 0 && cap_time != time) || type == 'image') {
      cap_time = time
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop().replaceAll("§", "\,").replaceAll("±", "\'")
      cap.value = cap.innerHTML
      cap.style.opacity = 1
      if (!myPlayer.paused) {myPlayer.pause()}}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}

  function filter(id) {
      var x = filt							// eg 30 minutes, 2 months, alpha 'A'
      var el = document.getElementById(id)
      if (!x) {el.innerHTML=sort; el.style.color=null; return}
      if (id == 'Alpha') {
        if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
      if (id == 'Size')  {x *= 10; units = " Mb"}
      if (id == 'Date')  {units = " months"}
      if (id == 'Duration') {units = " minutes"}
      if (!x) {x=''}
      el.innerHTML = x+' '+units; el.style.color = 'red'}

  function sel(i) {							// highlight selected media
    if (Click!=1 || !i || longClick || gesture==2) {return}
    if (list_view) {el=document.getElementById('title'+i)}
    else {el=document.getElementById('media'+i)}
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.borderBottom = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (list_view) {el.style.borderBottom = '0.1px solid red'}
      else {el.style.borderBottom = '4px solid red'}
      if (!x.match(","+i+",")) {selected = selected+i+","}}}

  function context() {							// right click context menu
    var y=0
    if (yw>0.8) {y=160}
    nav.style.left=xpos-50+'px'; nav.style.top=ypos-45+'px'
    nav2.style.left=xpos-60+'px'; nav2.style.top=ypos-45-y+'px'
    if (el=document.getElementById('entry'+index)) {
      if (media.duration) {y=Math.round(media.duration/60)+'mins - '}
      if (!over_media) {mySelect.innerHTML='Select'}
      else {mySelect.innerHTML=y+document.getElementById('title'+index).value}
      if (el.matches(":hover")) {was_over_media = index}
      else {was_over_media = 0}}
    if (type) {nav2.style.display='block'; nav2.style.cursor='crosshair'} else {nav.style.display='block'}}

  function globals(vi, pg, ps, so, fi, lv, se, pl, ix) {		// import globals to java from inca
    view=vi; page=pg; pages=ps; sort=so; filt=fi; list_view=lv; selected=se; playlist=pl; 
    index=ix; was_over_media=ix; last_index=ix
    filter(sort)							// show filter heading in red
    if (index>1) {scrolltoIndex()}
    for (x of selected.split(',')) { if (x && !isNaN(x)) {		// highlight selected media			
      if (lv) {document.getElementById('title'+x).style.borderBottom = '0.1px solid red'}
      else {document.getElementById('media'+x).style.borderBottom = '4px solid red'}}}}

  function inca(command,value,select,address) { 			// send messages to inca.exe
    if (!select) {select=''} else {select=select+','}
    if (selected) {select=selected}
    for (x of select.split(',')) {if (x) {document.getElementById('media'+x).load()}}
    setTimeout(function() {						// time for load & right click to be detected
      if (!value) {value=''}
      if (!address) {address=''}
      if (isNaN(value)) {value=value.replaceAll('#', '<')}		// cannot transport '#' over link
      navigator.clipboard.writeText('#'+command+'#'+value+'#'+select+'#'+address)},20)}

  function Time(z) {if (z<0) return '0:00'; var y=Math.floor(z%60); var x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function togglePause() {if(!sheet && lastClick==1) {if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}}
  function selectAll() {for (i=1; i <= 600; i++) {sel(i)}}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function flip() {skinny*=-1; scaleX*=-1; positionMedia(0.5); media.style.transform='scaleX('+skinny+')'}
  function mute() {if(!longClick) {
    myPlayer.volume=0; myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted); myPlayer.play()}}
  
