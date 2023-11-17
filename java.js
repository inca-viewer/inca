
// Debugging - use mySelected.innerHTML = x in Gesture(e) or use alert(x)
// rem. long click text or search, +adds extra search term
// rem. no alpha search in playlists because need natural order option
// edit caption file when # in filename
// search tigris ride - error with #
// myinput cannot fill if media title has single '
// `r`n within captions
// undo delete etc?
// test if canplay can trigger mpv
// use entry for onmouseover in parameters ?


  var media = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var nav = document.getElementById('myContext')			// context menu during media play
  var nav2 = document.getElementById('myContext2')			// context menu over thumbs
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var intervalTimer
  var wheel = 0
  var block = 100							// block wheel/gesture events
  var index = 1								// media index (e.g. media14)
  var last_index
  var start = 0								// video start time
  var last_start = 0							// last media start time
  var interval = 0							// wheel seeking interval
  var units = ''							// minutes, months, MB etc.
  var rate = 1
  var view = 14								// thumb size em
  var page = 1
  var pages = 1								// how many htm pages of media
  var sort = 0								// media list sort 
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var type = ''								// audio, video, image, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = true							// play next or loop media
  var can_play								// browser can play media
  var fullscreen = false
  var mouse_down = 0
  var long_click = false
  var gesture = false
  var inputbox = ''							// input field for cut/paste
  var selected = ''							// list of selected media in page
  var clip								// inputbox cut/paste text
  var over_cap = false							// cursor over caption
  var over_media = 0							// over thumb or media
  var was_over_media
  var ratio								// media width to height ratio
  var skinny = 1							// media width
  var messages = ''							// skinny and caption changes
  var cue = 0								// start time for mp3/4 conversion
  var Zindex = 3
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var mediaX								// media position
  var mediaY
  var scaleX = 1							// skinny & magnify factor
  var scaleY = 1							// media size
  var sheetY = 1.2							// thumbsheet size
  var xpos								// cursor coordinate in pixels
  var ypos
  var Xref								// click cursor coordinate
  var Yref
  var Xoff = 0
  var Yoff = 0
  var index_scroll
  var list_view = 0
  var zoom = 1

  getParameters()							// initialise to media1 attributes
  modal.style.opacity=0;						// stop page load flicker
  modal.style.zIndex=-1;
  mediaX = 1*localStorage.getItem('mediaX')
  mediaY = 1*localStorage.getItem('mediaY')				// last media position
  if (x=1*sessionStorage.getItem('last_index')) {
    index=x; last_index=x; scrolltoIndex(1)}				// in view change, return to index
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)				// mouseUp alone = mouse back button
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', Gesture)
  document.addEventListener('keypress', (e) => {
    if (e.key=='Enter' && inputbox.value) {
      navigator.clipboard.writeText('#SearchBox#'+inputbox.value+'##')}}, false)


  function mouseDown(e) {
    Xref=xpos; Yref=ypos
    mouse_down=e.button+1
    if (e.button == 1) {						// Mclick - middle click
      e.preventDefault()
      clickTimer = setTimeout(function() {
        wheel=0; long_click=true; block=0
        if (!gesture) {playMedia('Next')}},240)}			// thumbsheet or previous media
    if (!e.button) {
      if (!type && over_media && selected) {
        inca('Media', index)}						// used for editing playlists
      clickTimer = setTimeout(function() {
        if (!gesture) {
          long_click = true
          if (!type && over_media && !selected) {playMedia('Click')}	// play media at 0:00
          else if (type == 'thumbsheet') {playThumb()}
          else if (type && !over_cap) {media_ended()}}},240)}}		// re-start media


  function mouseUp(e) {
    if (!e.button && !gesture && !nav2.matches(":hover") && type=='thumbsheet') {playThumb()}
    if (e.button == 1 && !long_click && !gesture) {
      if (!mouse_down) {mouseBack(1)}					// inca.exe replaces MouseBack with MClick Up
      else if (type == 'video' && cap_list && (ym>1 || yw>0.9)) {	// seek to next caption in movie
        for (var x of cap_list.split('|')) {
          if (!isNaN(x) && x>(myPlayer.currentTime+0.2)) {
            myPlayer.currentTime=x-1; myPlayer.play(); break}}}
      else if (type || over_media) {playMedia('Next')}			// next media/thumbsheet
      else if (nav.matches(':hover')) {over_media=index; playMedia('Click')}
      else if (!type) {inca('View', view)}}				// toggle thumb view / list view
    else if (!e.button && !gesture ) {		
      if (!over_cap && cap.value != cap.innerHTML) {editCap()}		// caption in edit mode
      else if (!type && over_media && mouse_down) {playMedia('Click')}
      else if (type) {togglePause()}}
    if (!Next.matches(":hover")) {nav.style.display=null}
    if (!myNext.matches(":hover")) {nav2.style.display=null}
    gesture=false; mouse_down=0; long_click=false
    clearTimeout(clickTimer); Gesture(e)}				// to show selected


  function mouseBack(reset) {
    if (!type && reset) {for(x of selected.split(',')) {sel(x)}}	// de-select all
    myPlayer.style.transition='0.25s'
    myPlayer.style.opacity=0
    setTimeout(function() {
      close_media()
      over_media=0
      modal.style.opacity=0
      modal.style.zIndex=-1},250)}


  function overThumb(id) {						// cursor over thumbnail
    over_media = id
    index = id
    start = 0
    getParameters()
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / Math.abs(media.offsetWidth)
    ym = (ypos - rect.top) / Math.abs(media.offsetHeight)
    if (ym > 0.9 && media.duration) {media.currentTime=media.duration*xm}
    if (ym < 0.1 || !media.currentTime) {media.currentTime=start}
    media.play()}


  function getParameters() {						// media arguments
    if (!(media = document.getElementById('media'+index))) {index=1; return}
    var x = media.style.borderBottom; media.style.borderBottom=null	// preserve border-radius
    ratio = media.offsetWidth/media.offsetHeight
    media.style.borderBottom=x
    x = media['onmouseover'].toString().split(","); x.pop()		// get media parameters
    rate = 1*x.pop().trim()
    cap_list = x.pop().slice(0, -1).slice(2) 				// captions list
    if (!start) {start = 1*x.pop().trim()} else {x.pop()}		// start time
    var type_t = x.pop().replaceAll('\'', '').trim()			// eg video, image
    skinny = 1*x.pop().trim()
    var z = messages.split('#EditMedia#')				// in case been edited
    for (x of z) {var y = x.split('#'); for (x of y) {if (1*y[0]==index) {rate=1*y[2]; skinny=1*y[1]}}}
    if (ratio > 1) {
      x = innerWidth*0.70; y = x/ratio; sheetY = innerWidth/x}		// landscape
    else {y = innerHeight; x = y*ratio; sheetY = innerHeight/y}		// portrait
    myPlayer.style.width = x +'px'					// media size normalised to screen
    myPlayer.style.height = y +'px'
    myPlayer.style.left = mediaX-x/2 +'px'
    myPlayer.style.top = mediaY-y/2 +'px'
    if (mouse_down==2 || myPlayer.src != media.src) {myPlayer.src=media.src}	// so not to restart play 
    myPlayer.poster = media.poster
    myPlayer.playbackRate = rate
    return type_t}


  function playMedia(e) {
    var playing = type
    var ls = last_start
    if (type) { 							// no type if no media playing
      close_media()
      if (e == 'Back' || long_click) {if (index>1) {index--; start=ls}}	// close htm thumb down
      else if (e == 'Next' && (playing != 'video' || !over_media)) {index++}}
    else {media.pause(); media.style.transform='scale('+skinny+',1)'}
    if (e && !playing && !over_media) {index=last_index; start=last_start} // play last media
    type = getParameters()
    if (!type) {mouseBack(0); return}					// end of media list 
    if (e == 'Click') {
      navigator.clipboard.writeText('#Media#'+index+'##'+start)
      scaleY = sheetY*zoom}
    if (type == 'document' || type == 'm3u') {type=''; return}
    if (e!='Click' && type=='video' && over_media && !(playing && !over_media)) {thumbSheet()}
    modal.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
    myPlayer.style.opacity = 0
    modal.style.opacity = 1
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (type == 'audio' || playlist.match('/inca/music/')) {looping=false; myPlayer.muted=false; scaleY=0.3}
    else if (fullscreen) {setTimeout(function() {modal.requestFullscreen()},140)}
    if (e != 'Next' || type == 'video') {
      if (scaleY > 1.4) {scaleY=1.4}
      if (!mediaX || mediaX < 0 || mediaX > innerWidth) {mediaX=innerWidth/2}
      if (!mediaY || mediaY < 0 || mediaY > innerHeight) {mediaY=innerHeight/2}}
    scaleX = scaleY * skinny
    if (cap_list && type != 'thumbsheet' && start>1) {start-=1}		// start at first caption
    if (e == 'Click' && media.currentTime > start+3) {start = media.currentTime}
    if (e == 'Click' && long_click) {start = 0}
    if (type == 'video' || type == 'audio') {myPlayer.currentTime = start; myPlayer.play()}
    can_play = false
    myPlayer.oncanplay = function() {can_play=true}
    myPlayer.volume = 0
    over_media=0							// when entering modal player
    myPlayer.style.transition = 0
    positionMedia(0)
    setTimeout(function() {						// time for transitions to reset
      wheel=0; block=120
      myPlayer.style.transition = '0.5s'
      myPlayer.style.opacity = 1
      modal.style.opacity = 1
      intervalTimer = setInterval(mediaTimer,84)
      myPlayer.addEventListener('ended', media_ended)},100)}


  function close_media() {
    scrolltoIndex(1)
    last_index = index
    last_start = myPlayer.currentTime
    var x=skinny; var y=rate; getParameters()
    if (x!=skinny || y!=rate) {						// see if edited
      messages = messages + '#EditMedia#'+index+'#'+x+'#'+y}
    if (cap.value != cap.innerHTML) {editCap()}
    messages = messages + '#History#'+index+'##'+last_start.toFixed(1)
    clearInterval(intervalTimer)
    myPlayer.removeEventListener('ended', media_ended)
    mySpeed.innerHTML = 'Speed'
    cap.style.display = 'none'
    cap.style.color = null
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    cap_time = 0
    myPlayer.poster=''
    myPlayer.src=''
    block = 160
    start = 0
    type = ''
    cue = 0}


  function wheelEvents(e, id, el) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (mouse_down || wheel < block) {return}
    var wheelUp = false
    wheel -= block
    if (wheel>10) {wheel=10}
    if (wheel<2) {wheel=2}
    block = 120
    if (e.deltaY > 0) {wheelUp=true}
    if (id == 'myPage') {						// page
      if (wheelUp && page<pages) {page++} 
      else if (!wheelUp && page>1) {page--}
      el.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// search filter
      if (wheelUp) {filt++} else if (filt) {filt--}
      filter(id)}
    else if (id=='mySpeed') {						// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) {rate -= 0.01}
        else {rate += 0.01}
        rate = Math.round(100*rate)/100
        myPlayer.playbackRate = rate
        mySpeed.innerHTML = myPlayer.playbackRate.toFixed(2)
        if (myPlayer.playbackRate == 1) {block = 999}}}
    else if (id == 'mySkinny') {					// skinny
      block = 20
      if (wheelUp) {scaleX -= 0.004}
      else {scaleX += 0.004}
      skinny = Math.round((1000*scaleX/scaleY))/1000
      if ((skinny == 1||skinny==-1)) {block = 999}			// pause when skinny crosses 1:1
      media.style.transform = "scaleX("+skinny+")"}
    else if (id=='View') {						// zoom thumbs
      if (wheelUp) {view += 1}
      else {view -= 1}
      if (view < 8) {view = 8}
      if (view > 99) {view = 99}
      View.innerHTML = 'View '+(view-7)
      el = document.getElementById('media1')
      el.style.opacity=1
      el.style.transition='0.2s'
      el.style.maxWidth=(view*0.8)+'em'
      el.style.maxHeight=(view*0.8)+'em'
      block=64}
    else if (id == 'myNext') {						// next modal media
      if (wheelUp) {playMedia('Next')}
      else {playMedia('Back')}
      myNext.innerHTML = index
      wheel=0; return}
    else if (id=='Next') {						// next htm media
      if (getParameters())
        {
        media.pause()
        media.style.transform='scale('+skinny+',1)'
        media.style.transition=null
        media.style.zIndex=null
        if (list_view) {
          media.style.opacity=null
          document.getElementById('title'+index).style.background=null}
        if (wheelUp) {index+=1}
        else {index-=1}
        was_over_media = index
        start=0
        if (!getParameters()) {return}
        Next.innerHTML = index
        scrolltoIndex(0)
        media.style.transform = 'scale('+(3*skinny)+',3)'
        media.style.opacity=1
        media.style.zIndex=Zindex+=1
        if (list_view) {document.getElementById('title'+index).style.background='#2b2824'}
        setTimeout(function() {
          media.currentTime=start
          media.playbackRate=rate
          media.play()},100)
        }
      }
    else if (xw<0.1 && (type=='video' || type=='audio')) {		// seek
        if (myPlayer.duration > 120) {interval = 3}
        else {interval = 0.5}
        if (myPlayer.paused) {interval = 0.04}
        if (wheelUp) {myPlayer.currentTime += interval}
        else {myPlayer.currentTime -= interval}
        block = 160}
    else if (type) {							// zoom media
      block=20
      if (wheelUp) {x=0.004*wheel}
      else {x=-0.004*wheel}
      if (type == 'thumbsheet' && (sheetY>0.25 || x>0)) {sheetY+=x}	// zoom thumbsheet
      else if (scaleY>0.25 || x>0) {scaleY+=x; scaleX=scaleY*skinny}}
    if (type) {positionMedia(0.28)}
    wheel = 10}								// for positionMedia() sticky edgees


  function Gesture(e) {							// mouse move over window
    xpos = e.clientX
    ypos = e.clientY
    if (filt) {filter(sort)}
    if (selected) {panel.style.color='lightsalmon'}
    else {panel.style.color=null}
    if (looping) {myLoop.style.color='red'} else {myLoop.style.color=null}
    if (myPlayer.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (skinny<0) {myFlip.style.color='red'} else {myFlip.style.color=null}
    if (myInput.value) {SearchBox.innerHTML='Search'; SearchAll.innerHTML='All'; SearchAdd.innerHTML='Add'}
    mySelected.style.top = e.pageY +9 +'px'
    mySelected.style.left = e.pageX +12 +'px'
    if (selected) {mySelected.innerHTML = selected.split(',').length -1}
    else {mySelected.innerHTML = ''}
    if (!nav.matches(":hover") && !over_media) {
      nav.style.display = null
      media.style.zIndex=null
      media.style.transform='scale('+skinny+',1)'
       if (list_view) {media.style.opacity=0}
      media.pause()}
    if (!nav2.matches(":hover")) {nav2.style.display = null}
    var x = Math.abs(Xref-xpos)
    var y = Math.abs(Yref-ypos)
    if (mouse_down && !over_cap && x+y > 8) {				// gesture detection (mousedown + slide)
      if (!gesture) {block=0; gesture=true}}
    if (gesture && type && mouse_down==1) {				// move media - left/right gesture
      block = 4								// ~ 400ms then re-allow up/down zoom
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX)
      localStorage.setItem("mediaY",mediaY)
      Xref=xpos; Yref=ypos
      positionMedia(0)}
    if (!type) {return}
    modal.style.cursor = 'crosshair'
    if (type != 'thumbsheet') {setTimeout(function() {modal.style.cursor='none'},400)}}


  function positionMedia(fade) {					// align media within window boundaries
    var x=0; var y=0
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
    if (block==20 && wheel<3 && !mouse_down && (mediaY > 0.7*((innerHeight/2)-y) && mediaY < 1.3*((innerHeight/2)-y))
      && (mediaX > 0.3*(innerWidth-x) && mediaX < 0.7*(innerWidth-x)) && type != 'thumbsheet') {
      myPlayer.style.transition = '1.6s'					// zoom to sticky edges
      if (Math.abs((myPlayer.offsetHeight*scaleY)) > 0.88*(innerHeight) && Math.abs((myPlayer.offsetHeight*scaleY)) < 1.12*(innerHeight)) {
        mediaY=(innerHeight/2)-y; scaleY=(innerHeight)/myPlayer.offsetHeight; scaleX=skinny*scaleY; fade=1.2}
      if (Math.abs((myPlayer.offsetWidth*scaleX)) > 0.89*innerWidth && Math.abs((myPlayer.offsetWidth*scaleX)) < 1.12*innerWidth) {
        mediaX=(innerWidth/2)-x; scaleX=innerWidth/myPlayer.offsetWidth; if(skinny<0) {scaleX*=-1}; scaleY=scaleX/skinny; fade=1.2}}
    myPlayer.style.transition = fade+'s'
    myPlayer.style.left = mediaX-(myPlayer.offsetWidth/2) +x +"px"
    myPlayer.style.top = mediaY-(myPlayer.offsetHeight/2) +y +"px"
    if (type == 'thumbsheet') {myPlayer.style.transform="scale("+skinny*sheetY+","+sheetY+")"}
    else  {myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"}}


  function mediaTimer() {						// every ~84mS while media/modal layer active
    if (block>=25) {block-=5}						// slowly reduce event blocking
    if (wheel>1) {wheel--}
    if (skinny != 1) {mySkinny.innerHTML = skinny.toFixed(2)}
    else {mySkinny.innerHTML = 'Skinny'}
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = myPlayer.getBoundingClientRect()
    xm = (xpos - rect.left) / Math.abs((myPlayer.offsetWidth*scaleX))
    ym = (ypos - rect.top) / Math.abs((myPlayer.offsetHeight*scaleY))
    cap.style.top = rect.bottom +10 +'px'
    cap.style.left = rect.left +10 +'px'
    if (cap_list) {cap.style.display='block'}
    showCaption()
    modal.style.backgroundColor = 'rgba(0,0,0,'+scaleY*2+')'
    var cueX = rect.left + 'px'
    var cueW = Math.abs(scaleX) * myPlayer.offsetWidth * myPlayer.currentTime / myPlayer.duration + 'px'
    if (cue && cue <= myPlayer.currentTime.toFixed(1)) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/myPlayer.duration + 'px'
      cueW = scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/myPlayer.duration+'px'}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/myPlayer.duration) + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - myPlayer.currentTime)/myPlayer.duration) + 'px'}
    mySeekbar.style.left = cueX
    mySeekbar.style.width = cueW
    if (type == 'image' || xw>0.1) {mySeekbar.style.opacity -= 0.05}
    else if (rect.bottom+6 > innerHeight) {mySeekbar.style.top = innerHeight -4 +'px'; mySeekbar.style.opacity=1}
    else {mySeekbar.style.top = 3 + rect.bottom +'px'; mySeekbar.style.opacity=0.6}
    if (xm>0 && xm<1 && ym>0 && ym<1) {over_media=index} else {over_media=0}
    if (myPlayer.volume <= 0.8) {myPlayer.volume += 0.05}			// fade sound up
    positionMedia(0)}


  function playThumb() {
    var x = (xpos-rect.left) / (myPlayer.offsetWidth*sheetY*skinny)
    var y = (ypos-rect.top) / (myPlayer.offsetHeight*sheetY)
    var row = Math.floor(y * 6)						// media seek time from mouse xy
    var col = Math.ceil(x * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (myPlayer.duration > 60) {offset = 20}
    if (x>1||x<0|y>1||y<0) {start = 0}					// if outside thumbsheet start 0
    else if (long_click) {start = last_start}
    else {start = offset - 0.4 - (ps * offset) + myPlayer.duration * ps}
    if (type=='video' && !can_play) {alert("browser cannot play"); return}
    myPlayer.currentTime = start
    if (long_click) {myPlayer.play()}					// return to previous position
    type='video'
    positionMedia(0.2)}


  function thumbSheet() {						// change poster jpg to 6x6 thumbsheet jpg
    var x = media.poster.replace("/posters/", "/thumbs/")
    p = x.split('%20')							// see if embedded start time in poster filename
    p = p.pop()
    p = p.replace('.jpg', '')
    if (!isNaN(p) && p.length > 2 && p.includes('.')) {			// very likely a suffix timestamp
      x = x.replace('%20' + p, '')}					// so remove timestamp from filename
    myPlayer.poster = x							// use 6x6 thumbsheet file
    type = 'thumbsheet'}


  function media_ended() {						// looping or next media
    if (!long_click && (!looping || type == 'audio')) {
      if (playlist.match('/inca/music/')) {playMedia('Next'); return}}
    if (type == 'thumbsheet') {type = 'video'}
    if (long_click && !over_media) {myPlayer.currentTime = 0}
    else {myPlayer.currentTime = start}
    myPlayer.play()
    if (long_click) {return}
    if (myPlayer.playbackRate > 0.40) {myPlayer.playbackRate -= 0.05}}	// slower speed for each loop


  function scrolltoIndex(highlight) {
    if (!(el=document.getElementById('media'+index))) {return}
    var x = el.getBoundingClientRect().top + myView.scrollTop
    if (Math.abs(myView.scrollTop - (x -(14*view))) > 100) {	 	// ignore small scrolls
      if (el.getBoundingClientRect().top > innerHeight*0.6) {		// near bottom of page
        if (list_view) {myView.scrollTo(0, x -300)}
        else {myView.scrollTo(0, x -(24*view))}}}
    x = ','+selected
    if (highlight && (!x.match(","+index+",")) && (!x.match(","+last_index+","))) {	// highlight played media in tab
      if (el=document.getElementById('title'+last_index)) {el.style.background=null}
      if (el=document.getElementById('title'+index)) {el.style.background='#2b2824'}
      if (el=document.getElementById('media'+last_index)) {el.style.borderBottom=null}
      if (el=document.getElementById('media'+index)) {el.style.borderBottom='4px solid salmon'}}}


  function togglePause() {
    if (!type||gesture||long_click||over_cap||nav2.matches(":hover")) {return}
    if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}


  function editCap() {							// edit caption
    var time = myPlayer.currentTime.toFixed(1)
    if (time<1) {time = '0.0'}
    if (cap.value != cap.innerHTML && cap.value.length > 1) {
      newcap = cap.value + "|" + time + "|"
      messages = messages+'#Caption#'+newcap+'#'+index+',#'+cap.innerHTML+'|'+time+'|'
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
      if (id == 'Alpha') {
        if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
      if (id == 'Size')  {x *= 10; units = " Mb"}
      if (id == 'Date')  {units = " months"}
      if (id == 'Duration') {units = " minutes"}
      if (!x) {x=''}
      document.getElementById(id).innerHTML = x+' '+units
      document.getElementById(id).style.color = 'red'}

  function sel(i) {							// highlight selected media
    if (!i) {return}
    if (list_view) {el=document.getElementById('entry'+i)}
    else {el=document.getElementById('media'+i)}
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.borderBottom = null
      myNext.style.color = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (list_view) {el.style.borderBottom = '0.1px solid salmon'}
      else {el.style.borderBottom = '4px solid red'}
      myNext.style.color = 'red'; myNext.innerHTML = 'Select'
      if (!x.match(","+i+",")) {selected = selected+i+","}}}

  function context(e) {
    e.preventDefault()							// stop clicks passing through
    nav.style.left=e.clientX-60+'px'; nav.style.top=e.clientY-45+'px'
    nav2.style.left=xpos-60+'px'; nav2.style.top=ypos-45+'px'
    if (el=document.getElementById('entry'+index)) {
      if (el.matches(":hover")) {was_over_media = index}
      else {was_over_media = 0}}
    if (type) {nav2.style.display='block'} else {nav.style.display='block'}}

  function globals(vi, pg, ps, so, fi, zo, lv, fs, pl) {			// import globals to java
    view=vi; page=pg; pages=ps; sort=so; filt=fi; zoom=zo; scaleY=zo; list_view=lv; fullscreen=fs; playlist=pl}

  function inca(command,value,select,address) {
    if (gesture) {return}
    if (!value) {value=''}
    if (!select) {select=''} else {select= select+','}
    if (!address) {address=''}
    if (selected) {select=selected}
    for(x of select.split(','))  {if (x) {document.getElementById('media'+x).load()}}
    if (command == 'View') {sessionStorage.setItem("last_index",last_index)}
    else {sessionStorage.setItem("last_index",0)}
    if (command == 'Settings' || command == 'Favorite') {				// 'Click' events, so ok to send now
      navigator.clipboard.writeText('#'+command+'#'+value+'#'+select+'#'+address)
      for (x of selected.split(',')) {sel(x)}}						// clear selected
    else {messages = messages + '#'+command+'#'+value+'#'+select+'#'+address		// send on next 'Click' event
      navigator.clipboard.writeText(messages); messages=''}}				// (only process edits if htm is reset)

  function selectAll() {for (i=1; i <= 600; i++) {sel(i)}}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function flip() {skinny*=-1; scaleX*=-1; positionMedia(0.5); media.style.transform='scaleX('+skinny+')'}
  function mute() {if(!long_click) {myPlayer.volume=0; myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted); myPlayer.play()}}
  function cut() {clip=getSelection().toString(); navigator.clipboard.writeText(clip); inputbox.value=inputbox.value.replace(clip,'')}
  function paste() {inputbox.setRangeText(clip, inputbox.selectionStart, inputbox.selectionEnd, 'select')}

