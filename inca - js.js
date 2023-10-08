
// panel.style.opacity=1; panel.innerHTML= x; or alert(x)		// debugging
// rem. long click text or search, +adds extra search term
// cache missing folder effects
// permissions in manifest:   "permissions": [ "clipboardRead" ],
// edit caption file when # in filename
// `r`n within captions
// title with single ' in text, gets cut off in htm page
// undo delete etc?
// create thumb ribbon html in inca.ahk similar to modal


  var thumb = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var media = document.getElementById('myMedia')			// modal overlay player
  var panel = document.getElementById('myPanel')			// list of folders, playlists etc
  var nav = document.getElementById('myContext')			// context menu during media play
  var nav2 = document.getElementById('myContext2')			// context menu over thumbs
  var Speed = document.getElementById('mySpeed')			// media rate
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var seekbar = document.getElementById('mySeekBar')			// media seekbar
  var seek = document.getElementById('mySeek')				// seek thumb under video
  var last_id = 1*sessionStorage.getItem('last_id')			// last top panel menu eg 'music'
  var last_index = 1*sessionStorage.getItem('last_index')		// last index
  var last_start = 1*sessionStorage.getItem('last_start')		// last media start time
  var pos = 1*sessionStorage.getItem('pos')				// last top panel column position
  var ini								// .ini folders, models, etc.
  var wheel = 0
  var block = 0								// block wheel/gesture events
  var index = 1								// media index (e.g. media14)
  var start = 0								// video start time
  var interval = 0							// wheel seeking interval
  var toggles = ''							// eg reverse, recurse
  var sort = 'Alpha'
  var units = ''							// minutes, months, MB etc.
  var rate = 1
  var view = 0								// list view or thumb view
  var page = 1
  var pages = 1								// how many htm pages of media
  var filt = 1								// filter or sort 
  var playlist								// full filepath
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
  var over_media = false						// over thumb or media
  var over_thumb = 0							// over thumb container
  var was_over_thumb = 0						// before context menu opened
  var seek_active = false						// seek thumb under video
  var ratio								// media width to height ratio
  var skinny = 1							// media width
  var newSkinny = 1
  var messages = ''							// skinny and caption changes
  var cue = 0								// start time for mp3/4 conversion
  var Zindex = 1
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var mediaX								// media position
  var mediaY
  var scaleX = 1							// skinny & magnify factor
  var scaleY = 1.2							// media size
  var sheetY = 2							// thumbsheet size
  var xpos								// cursor coordinate in pixels
  var ypos
  var Xref								// click cursor coordinate
  var Yref
  var Xoff = 0
  var Yoff = 0


  selected=sessionStorage.getItem('selected')				// preserve selected if view change
  sessionStorage.setItem('selected', '')
  if (selected) {for (x of selected.split(',')) {sel(x)}}
  else {selected=''}
  setTimeout(function() {scrolltoIndex()},300)				// scroll to last played media
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
    if (e.button == 1) {						// middle click
      e.preventDefault()
      clickTimer = setTimeout(function() {
        wheel=0; long_click=true; block=0
        if (!gesture) {playMedia('Mclick')}},240)}			// thumbsheet or previous media
    if (!e.button) {
      if (!type && over_media && selected) {
        navigator.clipboard.writeText('#Media#'+index+'#'+selected+'#')} // used for editing playlists
      clickTimer = setTimeout(function() {
        if (!gesture) {
          long_click = true
          if (!type && over_media && !selected) {playMedia('Click')}	// play media at 0:00
          else if (type && !over_cap) {media_ended()}}},240)}}		// re-start media



  function mouseUp(e) {
    if (!e.button && !gesture && !nav2.matches(":hover")) {					
      if (type=='thumbsheet') {playThumb()}				// play at thumbsheet click coordinate
      else if (type && seek.style.opacity>0.3) {
        media.currentTime=seek.currentTime; media.play()}}
    nav.style.display=null
    nav2.style.display=null
    if (e.button == 1 && !type && gesture) {thumbs(view)} 		// update thumb width	
    else if (e.button == 1 && !long_click && !gesture) {
      if (!mouse_down) {mouseBack()}					// inca.exe replaces MouseBack with MClick Up
      else if (type == 'video' && cap_list && (ym>1 || yw>0.9)) {	// seek to next caption in movie
        for (var x of cap_list.split('|')) {
          if (!isNaN(x) && x>(media.currentTime+0.2)) {
            media.currentTime=x-1; media.play(); break}}}
      else if (type || over_media) {playMedia('Mclick')}		// next media/thumbsheet
      else if (!type && !over_media) {thumbs(0)}}
    else if (!e.button && !gesture) {			
      if (!over_cap && cap.value != cap.innerHTML) {editCap()}		// caption in edit mode
      else if (!type && over_media && mouse_down) {playMedia('Click')}
      else if (type) {togglePause()}}
    gesture=false; mouse_down=0; long_click=false
    seek_active=false; seek.style.opacity=0
    clearTimeout(clickTimer)}


  function mouseBack() {
    var top = document.body.getBoundingClientRect().top
    sessionStorage.setItem("last_index",0)
    if (!type) {
      if (top < -90) {setTimeout(function() {scrollTo(0,0)},100)}	// scroll to page top
      else {setTimeout(function() {location.reload()},200)}}		// just reset htm tab (clear selected etc.)
    else {								// quit media
      close_media()
      sheetY = 2 
      scaleY = 1.2
      if (cap.value != cap.innerHTML) {editCap()}
      if (messages) {navigator.clipboard.writeText(messages)}		// send messages to inca.exe
      setTimeout(function() {modal.style.opacity=0; modal.style.zIndex=-1},100)
      over_media = false}}


  function overThumb(id) {						// cursor over thumbnail
    over_media = true
    index = id
    start = 0
    getParameters()
    type = ''
    if (mouse_down && gesture) {sel(id)}
    rect = thumb.getBoundingClientRect()
    xm = (xpos - rect.left) / (thumb.offsetWidth*skinny)
    ym = (ypos - rect.top) / thumb.offsetHeight
    if (thumb.duration && ym>0.7 && ym<1.1) {thumb.currentTime = thumb.duration * xm}
    else if (thumb.currentTime <= start || ym<0.1) {thumb.currentTime = start+0.1}
    start = media.currentTime = thumb.currentTime
    thumb.playbackRate = 0.9
    thumb.play()}


  function getParameters() {						// get media arguments
    thumb = document.getElementById('media' + index)
    if (!thumb) {index=1; thumb = document.getElementById('media1')}
    x = thumb['onmouseover'].toString().split(","); x.pop()
    cap_list = x.pop().slice(0, -1).slice(2) 				// captions list
    if (!start) {start = 1*x.pop().trim()} else {x.pop()}			// start time
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image
    skinny = 1*thumb.style.transform.slice(7,-1)
    newSkinny = skinny
    mediaX = localStorage.getItem('mediaX')*1				// last media position
    mediaY = localStorage.getItem('mediaY')*1
    ratio = thumb.offsetWidth/thumb.offsetHeight
    if (ratio > 1) {x = innerWidth*0.5; y = x/ratio}			// landscape
    else {y = innerHeight*0.7; x = y*ratio}				// portrait
    media.style.width = x +'px'						// position media in modal
    media.style.height = y +'px'
    media.style.left = mediaX-x/2 +'px'
    media.style.top = mediaY-y/2 +'px'
    if (mouse_down==2 || media.src != thumb.src) {media.src=thumb.src}	// so not to restart play
    media.poster = thumb.poster
    seek.src = thumb.src}


  function playMedia(e) {
    var playing = type
    if (type) {close_media()}						// no type if no media playing
    if (e == 'Next') {index+=1}
    if (e == 'Back') {index-=1}
    if (e == 'Mclick') {
      if (playing && !(playing == 'video' && long_click)) {index+=1}
      if (!playing && long_click && !over_media) {index=last_index; start=last_start}}
    getParameters()
    if (type == 'document' || type == 'm3u') {type=''; return}
    if (e == 'Back' && playing=='thumbsheet') {thumbSheet()}
    if (e == 'Mclick' && playing && long_click && type == 'video') {thumbSheet()}
    if (e == 'Mclick' && !playing && over_media && long_click) {thumbSheet()}
    modal.style.zIndex = Zindex+=1
    modal.style.opacity = 1
    media.muted = 1*localStorage.getItem('muted')
    if (type == 'audio' || playlist.match('/inca/music/')) {looping=false; media.muted=false; scaleY=0.2}
    else if (fullscreen) {modal.requestFullscreen()}
    if (scaleY == 1.2 && ratio<1) {scaleY=1}
    if (ratio < 1 && scaleY > 1.42) {scaleY = 1.42}
    if (ratio > 1 && scaleY > 6) {scaleY = 2}    
    scaleX = scaleY * skinny
    if (cap_list && type != 'thumbsheet' && start>1) {start-=1}		// start at first caption
    if (e == 'Click' && thumb.currentTime > start+2) {media.currentTime = thumb.currentTime}
    if (e == 'Click' && long_click) {start = 0}
    if (type == 'video' || type == 'audio') {media.currentTime = start; media.play()}
    document.getElementById('title'+index).style.color='lightsalmon'	// highlight played media in tab
    last_index = index
    scrolltoIndex()
    can_play = false
    media.oncanplay = function() {can_play=true}
    media.playbackRate = rate
    media.volume = 0
    media.style.transition = null
    if (skinny < 0) {x=-scaleY} else {x=scaleY}
    if (type!='thumbsheet' && playing!='thumbsheet') {
       media.style.transform = "scale("+x+","+scaleY+")"}
    positionMedia(0.2)
    modal.style.opacity = 1
    intervalTimer = setInterval(mediaTimer,84)
    media.addEventListener('ended', media_ended)}


  function close_media() {
    last_start = media.currentTime
    sessionStorage.setItem("last_start",last_start)
    if (!mediaX || mediaX < 0 || mediaX > innerWidth) {mediaX=innerWidth/2}
    if (!mediaY || mediaY < 0 || mediaY > innerHeight) {mediaY=innerHeight/2}
    if (type != 'thumbsheet') {
      localStorage.setItem("mediaX",mediaX)
      localStorage.setItem("mediaY",mediaY)}
    if (skinny != newSkinny) {
      messages = messages+'#Skinny#'+newSkinny+'#'+index+',#'}		// width changes
    clearInterval(intervalTimer)
    media.removeEventListener('ended', media_ended)
    cap.style.display = 'none'
    cap.style.color = null
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    cap_time = 0
    media.poster=''
    media.src=''
    start = 0
    type = ''
    cue = 0}


  function wheelEvents(e, id, el, input) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (mouse_down || wheel < block) {return}
    var wheelUp = false
    block = 120
    seek_active=false
    seek.style.opacity=0
    if (e.deltaY > 0) {wheelUp=true}
    if (id == 'myPage') {						// page
      if (wheelUp && page<pages) {page++} 
      else if (!wheelUp && page>1) {page--}
      el.innerHTML = 'Page '+page+' of '+pages}
    else if (id == 'myFilt') {						// search filter
      if (wheelUp) {filt++} else if (filt) {filt--}
      filter()}
    else if (id=='mySpeed' || id=='myBack') {				// speed
      if (wheelUp) {x = -0.01}
      else {x = 0.01}
      if (type != 'image') {media.playbackRate += x}
      if (media.playbackRate == 1) {block = 999}}
    else if (type=='video' || type=='audio') {				// seek
      seekbar.style.opacity = 0.6
      if (!playlist.match('/inca/music/')) {
        if (media.duration > 120) {interval = 3}
        else {interval = 0.5} 						// set seek interval
        if (media.paused) {interval = 0.04}
        if (wheelUp) {media.currentTime += interval}
        else {media.currentTime -= interval}
        block = 160}}
    else if (type && rect.bottom-rect.top>innerHeight) {
      if (wheelUp) {mediaY -= 50}					// scroll image
      else {mediaY += 50}}
    else {spool(e, id)} 						// scroll top panel
    wheel = 0}


  function Gesture(e) {							// mouse move over window
    xpos = e.clientX
    ypos = e.clientY
    mySelected.style.top = e.pageY +9 +'px'
    mySelected.style.left = e.pageX +12 +'px'
    if (selected) {mySelected.innerHTML = selected.split(',').length -1}
    else {mySelected.innerHTML = ''}
    if (!nav.matches(":hover")) {nav.style.display = null}
    if (!nav2.matches(":hover")) {nav2.style.display = null}
    if (inputbox.value) {mySearch.innerHTML='Search'; myAdd.innerHTML='Add'}
    var x = Math.abs(Xref-xpos)
    var y = Math.abs(Yref-ypos)
    if (mouse_down && !over_cap && x+y > 5) {				// gesture detection (mousedown + slide)
      if (!gesture) {block=0; gesture=true}}
    if (gesture && type) {
      if (!block && mouse_down==2) {					// media width - middle click gesture
        if (scaleX>0) {scaleX -= (xpos-Xref)/1000}
        else {scaleX += (xpos-Xref)/1000}
        newSkinny = (scaleX/scaleY).toFixed(2)
        if ((newSkinny == 1.01||newSkinny==-1)) {block = 24}		// pause gesture when skinny crosses 1:1
        thumb.style.transform = "scaleX("+newSkinny+")"}
      else if (y+2>x && !block && mouse_down==1) {			// zoom media - up/down gesture
        if (scaleY > 0.3 || Yref < ypos) {
          if (type == 'thumbsheet') {sheetY+=(ypos-Yref)/200}		// zoom thumbsheet
          else {
            if (scaleX < 0) {scaleX -= (ypos-Yref)/200}			// in case media fipped left/right
            else {scaleX += (ypos-Yref)/200}
            scaleY += (ypos-Yref)/200}}}
      else if (mouse_down==1) {						// move media - left/right gesture
        block = 4							// ~ 400ms then re-allow up/down zoom
        mediaX += xpos - Xref
        mediaY += ypos - Yref
        localStorage.setItem("mediaX",mediaX)
        localStorage.setItem("mediaY",mediaY)}
      Xref=xpos; Yref=ypos
      positionMedia(0)}
    if (gesture && !type && mouse_down==2 && y>0.2 && y>x) {		// zoom thumbs
      last_index=0							// prevent scroll to index	
      view = 1*document.getElementById("thumb" + index).style.width.slice(0,-2)
      if (Yref < ypos) {view += view/60}
      else {view -= view /60}
      view = view .toFixed(1)
      if (view < 5) {view = 5}
      if (view > 99) {view = 99}
      for (i=1; i<37 ;i++) {
        el = document.getElementById("thumb" + i)
        el2 = document.getElementById("media" + i)
        if (el) {el.style.width=view+'em'; el.style.maxHeight=view+'em'}
        if (el2) {el2.style.maxWidth=view+'em'; el2.style.maxHeight=view+'em'}}
      Xref=xpos; Yref=ypos}
    if (!type) {return}
    if (!nav.matches(":hover")) {nav.style.display = null}
    modal.style.cursor = 'crosshair'
    if (type != 'thumbsheet') {setTimeout(function() {modal.style.cursor='none'},400)}
    if (ym>0.8 && ym<1 && xm>0 && xm<1 && type == 'video') {seek_active=true; seek.currentTime=media.duration*xm}
    else {seek_active=false; seek.style.opacity=0}}


  function positionMedia(fade) {					// align media within window boundaries
    var x=0; var y=0
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
    media.style.left = (mediaX-media.offsetWidth/2) +x +"px"
    media.style.top = (mediaY-media.offsetHeight/2) +y +"px"
    if (!mouse_down && (mediaY > 0.7*((innerHeight/2)-y) && mediaY < 1.3*((innerHeight/2)-y))
      && (mediaX > 0.7*((innerWidth/2)-x) && mediaX < 1.3*((innerWidth/2)-x))) {fade=0.16
      if (Math.abs((media.offsetHeight*scaleY)) > 0.92*(innerHeight) && Math.abs((media.offsetHeight*scaleY)) < 1.15*(innerHeight)) {
        mediaY=(innerHeight/2)-y; scaleY=(innerHeight)/media.offsetHeight; scaleX=newSkinny*scaleY; fade=1}
      if (Math.abs((media.offsetWidth*scaleX)) > 0.92*innerWidth && Math.abs((media.offsetWidth*scaleX)) < 1.15*innerWidth) {
        mediaX=(innerWidth/2)-x; scaleX=(innerWidth)/media.offsetWidth; scaleY=scaleX/newSkinny; fade=1}}
    media.style.transition = fade+'s'
    if (type == 'thumbsheet') {media.style.transform="scale("+newSkinny*sheetY+","+sheetY+")"}
    else  {media.style.transform = "scale("+scaleX+","+scaleY+")"}}


  function mediaTimer() {						// every ~84mS while media/modal layer active
    if (block) {block--}						// slowly remove event blocking
    if (type != 'image' && over_media) {seekbar.style.opacity = 0.6}
    else {if (seekbar.style.opacity) {seekbar.style.opacity-=0.1}}
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / Math.abs((media.offsetWidth*scaleX))
    ym = (ypos - rect.top) / Math.abs((media.offsetHeight*scaleY))
    seek.style.left = xpos - seek.offsetWidth/2 +'px'
    seek.style.top = rect.bottom - seek.offsetHeight +'px'
    cap.style.top = rect.bottom +10 +'px'
    cap.style.left = rect.left +10 +'px'
    if (cap_list) {cap.style.display='block'}
    showCaption()
    if (type == 'image') {Speed.innerHTML=''}
    else {Speed.innerHTML = media.playbackRate.toFixed(2)}
    modal.style.backgroundColor = 'rgba(0,0,0,'+scaleY*1.2+')'
    if (type == 'video' && seek.style.opacity == 1.4) {seek_active = false}
    if (seek_active && seek.style.opacity < 1.4) {seek.style.opacity -= '-0.1'}
    if (!seek_active && seek.style.opacity > 0) {seek.style.opacity -= '0.1'}
    var cueX = rect.left + 'px'
    var cueW = Math.abs(scaleX) * media.offsetWidth * media.currentTime / media.duration + 'px'
    if (cue && cue <= media.currentTime.toFixed(1)) {
      cueX = mediaX - Math.abs((media.offsetWidth*scaleX))/2 + scaleX * media.offsetWidth * cue/media.duration + 'px'
      if (cue < media.currentTime.toFixed(1)) {
        cueW = scaleX*media.offsetWidth*(media.currentTime-cue)/media.duration+'px'}
      else {cueW = scaleX * media.offsetWidth * (1-(cue/media.duration)) + 'px'}}
    seekbar.style.left = cueX
    if (seek.style.opacity<0.5) {seekbar.style.width = cueW}
    else {seekbar.style.width=Math.abs(xm*scaleX*media.offsetWidth) +'px'; seekbar.style.opacity = 0.6}
    if (rect.bottom+6 > innerHeight) {seekbar.style.top = innerHeight -6 +'px'}
    else {seekbar.style.top = 3 + rect.bottom +'px'}
    if (xm>0 && xm<1 && ym>0 && ym<1) {over_media=true} else {over_media=false}
    if (looping) {myLoop.style.color='red'} else {myLoop.style.color=null}
    if (media.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (media.volume <= 0.8) {media.volume += 0.05}			// fade sound up
    positionMedia(0)}


  function playThumb() {
    var x = (xpos-rect.left) / (media.offsetWidth*sheetY*skinny)
    var y = (ypos-rect.top) / (media.offsetHeight*sheetY)
    var row = Math.floor(y * 6)						// derive media seek time from mouse xy
    var col = Math.ceil(x * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (media.duration > 60) {offset = 20}
    if (x>1||x<0|y>1||y<0) {start = last_start}
    else {start = offset - (ps * offset) + media.duration * ps}
    if (!can_play) {alert("browser cannot play"); return}
    media.currentTime=start
    type='video'}


  function thumbSheet() {						// change poster jpg to 6x6 thumbsheet jpg
    var x = thumb.poster.replace("/posters/", "/thumbs/")
    p = x.split('%20')							// see if embedded start time in poster filename
    p = p.pop()
    p = p.replace('.jpg', '')
    if (!isNaN(p) && p.length > 2 && p.includes('.')) {			// very likely a suffix timestamp
      x = x.replace('%20' + p, '')}					// so remove timestamp from filename
    media.poster = x							// use 6x6 thumbsheet file
    type = 'thumbsheet'}


  function media_ended() {
    if (!long_click && (!looping || type == 'audio')) {
      if (playlist.match('/inca/music/')) {setTimeout(function() {playMedia('Next')},1800)}	// next media
      else {playMedia('Next')}
      return}
    if (type == 'thumbsheet') {type = 'video'}
    if (long_click && !over_media) {media.currentTime = 0}
    else {media.currentTime = start}
    media.play()
    if (long_click) {return}
    if (media.playbackRate > 0.40) {media.playbackRate -= 0.05}		// magnify and slow each loop
    scaleX*=1.1; scaleY*=1.1
    positionMedia(1.4)}


  function filter() {							// eg 30 minutes, 2 months, alpha 'A'
    var x = filt
    if (sort == 'Alpha') {if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
    if (sort == 'Size')  {x *= 10; units = " Mb"}
    if (sort == 'Date')  {units = " months"}
    if (sort == 'Duration') {units = " minutes"}
    if (!x) {x=''}
    document.getElementById('myFilt').innerHTML = x+' '+units}


  function scrolltoIndex() {						// to last media if not visible
    if (last_index) {
      sessionStorage.setItem("last_index",0)
      var el = document.getElementById('title'+last_index)
      el.style.color = 'lightsalmon'
      var y = el.getBoundingClientRect().top + scrollY
      if (y < scrollY+20 || y > scrollY+innerHeight-100) {scrollTo(0,y-300)}}}


  function spool(e, id, ii, vi, pg, ps, fi, so, fo, pa, pl, rt, fs) { // spool lists into top htm panel
    if (id) {panel.style.opacity = 1}
    if (ii) {ini=ii; view=vi; page=pg; pages=ps; filt=fi; sort=so;
            folder=fo; path=pa; playlist=pl; rate=rt; fullscreen=fs}
    if (id) {last_id = id} else {id = last_id}
    sessionStorage.setItem("last_id",last_id)
    if (id && id != 'Search' && !e.deltaY) {pos = 0}
    if (e.deltaY > 0) {pos+=4} else if (pos && e.deltaY < 0) {pos-=4}
    var count = -pos
    var htm = ''
    filter()
    var z = ini.split(id+'=').pop().split('||')				// slice section matching the id
    z = z[0].split('|')
    if (id == 'Search') {						// alpha search
      for (x of z) {
        count++								// count initialised -ve by last pos
        if (count > 0 && count < 25) {					// within panel display range
          if (id != x.substring(0, 1)) {
            id = x.substring(0, 1)
            htm = htm + "<a style='grid-row-start:1;grid-row-end:5;color:red;font-size:2em'>"+id+"</a>"}
          htm = htm + '<a onmousedown=\'navigator.clipboard.writeText("#Search#'+x+'##")\'>' + x.substring(0, 15) + '</a>'}}
      if (count < 25) {pos-=4}						// end of .ini search list
      sessionStorage.setItem("pos",pos)}
    else for (x of z) {							// folders, fav, music
      var y = x.split("/")
      var q = y.pop()
      count++
      if (id == 'Fol') {q = y.pop()}
      q = q.replace('.m3u', '').substring(0, 12)
      if (q == "New") {q = "<span style='color:lightsalmon'</span>" + q}
      if (count > 0 && count < 29) {
        htm = htm + '<a onmousedown=\'navigator.clipboard.writeText("#Path##' + selected + '#' + x + '")\'>' + q + '</a>'}}
    if (id) {panel.innerHTML = htm}
    release()}


  function togglePause() {
    if (!type||gesture||long_click||over_cap||seek.style.opacity>0.3||nav2.matches(":hover")) {return}
    if (media.paused) {media.play()} else {media.pause()}}

  function editCap() {							// edit caption
    var time = media.currentTime.toFixed(1)
    if (time<1) {time = '0.0'}
    if (cap.value != cap.innerHTML && cap.value.length > 1) {
      newcap = cap.value + "|" + time + "|"
      messages = messages+'#Caption#'+newcap+'#'+index+',#'+cap.innerHTML+'|'+time+'|'
      cap.value = ''; cap.innerHTML = ''
      media.play()}
    else {
      cap.value = '-'
      cap.innerHTML = '-'
      cap.style.opacity=0.6
      cap.style.display='block'
      cap.focus()}}

  function showCaption() {						// display captions
    if (document.activeElement.id == 'myCap') {cap.style.color='red'; return}
    else {cap.style.color=null}
    var time = media.currentTime.toFixed(1)
    if (!time || type == 'image') {time='0.0'}
    var ptr = cap_list.indexOf('|'+ time + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ time - 0.1 + '|')}
    if ((ptr > 0 && cap_time != time) || type == 'image') {
      cap_time = time
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop().replaceAll("§", "\,").replaceAll("±", "\'")
      cap.value = cap.innerHTML
      cap.style.opacity = 1
      if (!media.paused) {media.pause()}}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}

  function sel(i) {							// highlight selected media
    if (!(el = document.getElementById('title' + i))) {return}
    if (over_media && !gesture) {return}
    x = ',' + selected
    if (el.style.border == "0.1px solid lightsalmon") {
      el.style.border = "none"
      selected = x.replace("," + i + ",", ",").slice(1)}
    else {
      el.style.border = "0.1px solid lightsalmon"
      if (!x.match("," + i + ",")) {selected = selected + i + ","}}}

  function release() {							// release media from browser
    var z=index+','
    if (!index) {z=was_over_thumb+','}
    if (selected) {z=selected}
    for (x of z.split(',')) {if (el = document.getElementById('media' + x)) {el.load()}}}

  function context(e) { 
    e.preventDefault()
    was_over_thumb = over_thumb
    Gesture(e)
    nav2.style.left=xpos-75+'px'; nav2.style.top=ypos-44+'px'
    nav.style.left=e.clientX-85+'px'; nav.style.top=e.clientY-44+'px'
    if (type) {nav2.style.display='block'} else {nav.style.display='block'}}

  function selectAll() {if (was_over_thumb) {sel(was_over_thumb)} else {for (i=1; i <= 600; i++) {sel(i)}}}
  function del() {release(); if (selected) {navigator.clipboard.writeText('#Delete##'+selected+'#')} else if (was_over_thumb) {navigator.clipboard.writeText('#Delete##'+was_over_thumb+',#')}sessionStorage.setItem("last_index",was_over_thumb)}
  function rename() {index=1*sessionStorage.getItem('last_index'); release(); navigator.clipboard.writeText('#Rename#'+document.getElementById('title'+index).value+'#'+index+',#'); sessionStorage.setItem("last_index",index)}
  function fav() {navigator.clipboard.writeText("#Favorite#" + media.currentTime.toFixed(1) + "#" + index + ",#")}
  function thumbs(x) {sessionStorage.setItem('selected',selected); navigator.clipboard.writeText('#myThumbs#'+x+'##'); sessionStorage.setItem("last_index",last_index)}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function flip() {newSkinny*=-1; scaleX*=-1; thumb.style.transform='scaleX('+newSkinny+')'; navigator.clipboard.writeText('#Skinny#'+newSkinny+'#'+index+',#')}
  function mute() {if(!long_click) {media.volume=0; media.muted=!media.muted; localStorage.setItem("muted",1*media.muted); media.play()}}
  function cut() {clip=getSelection().toString(); navigator.clipboard.writeText(clip); inputbox.value=inputbox.value.replace(clip,'')}
  function paste() {inputbox.setRangeText(clip, inputbox.selectionStart, inputbox.selectionEnd, 'select')}

