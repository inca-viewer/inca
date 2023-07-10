<script>

// panel.style.opacity=1; panel.innerHTML= x				// debugging
// revert software version option
// fullscreen thumb offsets?
// wmv/nonplay warning
// videos click opening zoom jitter
// put menu in panel?


  var thumb = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var media = document.getElementById('myMedia')			// modal overlay player
  var path = document.getElementById('myPath')				// windows folder file path
  var inputbox = document.getElementById('myInput')			// search/editing bar
  var panel = document.getElementById('myPanel')			// list of folders, playlists etc
  var nav = document.getElementById('myContext')			// context menu during media play
  var nav2 = document.getElementById('myContext2')			// context menu over thumbs
  var stat = document.getElementById('mySpeed')				// also for href messages to inca.exe
  var stat2 = document.getElementById('mySkinny')			// media width control
  var stat3 = document.getElementById('Seek')				// fast seek control
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var seekbar = document.getElementById('mySeekBar')			// media seekbar
  var seek = document.getElementById('mySeek')				// seek thumb under video
  var Loop = document.getElementById('myLoop')				// loop video or play next
  var Mute = document.getElementById('myMute')
  var last_id = sessionStorage.getItem('last_id')			// last top panel menu eg 'music'
  var pos = 1*(sessionStorage.getItem('pos'))				// last top panel position
  var ini								// .ini folders, models, etc.
  var wheel = 0
  var block = 10							// block wheel input
  var index = 1								// media index (e.g. media14)
  var last_index = 0
  var time = 0								// media time
  var start = 0								// video start time
  var interval = 0							// wheel seeking interval
  var last_start = 0
  var toggles = ''							// eg reverse, recurse
  var sort = 'Alpha'
  var units = ''							// minutes, months, MB etc.
  var rate = 1
  var view = 0								// list view or thumb view
  var page = 1
  var pages = 1								// how many htm pages of media
  var filt = 1								// filter or sort 
  var type = ''								// audio, video, image, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = true							// play next or loop media
  var mpv_player = false						// use external media player
  var fullscreen = false
  var mouse_down = false
  var long_click = false
  var gesture = false
  var over_cap = false							// cursor over caption
  var over_media = false
  var thumb_ratio							// thumb/screen ratio
  var media_ratio							// media/screen ratio
  var skinny = 1							// media width
  var newSkinny = 1
  var seek_active = false						// seek thumb under video
  var selected = ''							// list of selected media in page
  var messages = ''							// through browser address bar to inca.exe
  var cue = 0								// start time for mp3/4 conversion
  var Zindex = 1
  var xpos								// cursor coordinate in pixels
  var ypos
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var mediaX								// centre of media player
  var mediaY
  var thumbX = 0							// original thumb offsets
  var thumbY = 0
  var scaleX = 1							// skinny & magnify factor
  var scaleY = 1
  var Xref								// click cursor coordinate
  var Yref


  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)				// mouseUp alone = mouse back button
  document.addEventListener('mousemove', Gesture)
  document.addEventListener('keypress', (e) => {
    if (e.key=='Enter' && inputbox.value) {
    messages = messages+'#SearchBox#'+inputbox.value+'##'
    stat.href=messages; messages=''; stat.click()}}, false)


  function mouseDown(e) {
    if (e.button==1) {							// middle click
      e.preventDefault()
      clickTimer = setTimeout(function() {if(long_click) {
        playMedia('Mclick')}},240) 					// goto previous media
      nextCap()								// next caption (or next media)
      long_click = true
      block = 200}							// block accidental middle click + wheel
    if (!e.button) {
      clickTimer = setTimeout(function() {if(mouse_down && !gesture) {
        long_click=true; if(type && !over_cap) {playMedia('')}}},240)
      long_click=false
      mouse_down = true
      Xref = e.clientX							// for when moving thumb or media position
      Yref = e.clientY}}


  function mouseUp(e) {							// !! inca triggers mouseUp event after every Click
    nav.style.display=null
    nav2.style.display=null
    if (e.button==1 && !long_click) {mouseBack()}			// inca.exe replaces mouse back button with MClick Up
    if (!e.button && !gesture) {					
      if (type == 'thumbsheet') {thumbSheet()}				// play at thumbsheet coordinate
      else if (type == 'video' && ym>0.8 && ym<1 && seek.style.opacity>0.3 && !nav.matches(":hover")) {media.currentTime=start}
      else if (cap.value != cap.innerHTML) {editCap()}			// caption in edit mode
      else if (over_media && !type) {playMedia('Click')}
      else {togglePause()}}
    if (!e.button || e.button == 1) {
      if (xm<0||xm>1||ym<0.8||ym>1) {seek.style.opacity=0; seek_active=false}
      gesture=false; mouse_down=false; long_click=false
      clearTimeout(clickTimer)}}


  function mouseBack() {						// quit media
    var top = document.body.getBoundingClientRect().top
    modal.style.cursor='crosshair'					// !!! important resets inca.exe messaging flag
    if (!type) {
      if (top < -90) {setTimeout(function() {scrollTo(0,0)},100)}
      else {setTimeout(function() {location.reload()},200)}}		// just reset htm tab (clear selected etc.)
    else {
      if (cap.value != cap.innerHTML) {editCap()}
      scaleX=newSkinny; scaleY=1
      setTimeout(function() {
        close_media()
        type = ''
        setTimeout(function() {modal.style.display='none'},224)
        if (messages) {stat.href=messages; messages=''; stat.click()}},150) // send messages to inca.exe
      if (fullscreen) {
        setTimeout(function() {document.exitFullscreen()},100)
        setTimeout(function() {window.scrollTo(0, scroll_Y)},400)}}}


  function togglePause() {
    if (!type||!mouse_down||gesture||long_click||over_cap||nav2.matches(":hover")) {return}
    if (media.paused) {media.play()} else {media.pause()}}


  function overThumb(id) {						// mouse over thumbnail in browser tab
    over_media = true
    index = id
    getParameters('')
    type = ''
    var sel = document.getElementById('sel' + id)
    if (view) {document.getElementById("thumb" + index).style.zIndex = Zindex+=1}
    if (selected) {sel.href = '#MovePos#' + id + '#' + selected + '#'}}	// for thumb position change in playlist


  function playMedia(e) {
    if (selected && path.href.slice(27).match('/inca/')) {return}	// moving thumb position within a playlist
    start = 0
    if (type) {close_media()}						// no type if no media playing
    scroll_Y = window.scrollY
    modal.style.cursor='crosshair'					// ! important - wheel zoom close
    if (e == 'Loop') {index+=1; start=0}
    if (e == 'Mclick' && long_click) {index-=3}
    if (e == 'Mclick' && type && (type != 'video' || !over_media)) {index+=1; start=0}
    if (e == 'Mclick' && !type && !over_media) {index=last_index; start=last_start; e='Thumb'; scaleY=2} // play last media
    getParameters(e)
    if (type == 'document' || type == 'm3u') {type=''; return}
    if (e == 'Mclick' && type == 'video' && (over_media || over_media)) {type = 'thumbsheet'}
    else if (e == 'Mclick' && type == 'thumbsheet' && !over_media) {type = 'video'}
    if (type == 'thumbsheet') {Thumbsheet()}				// get start time
    if (mpv_player) {return}
    modal.style.zIndex = Zindex+=1
    modal.style.display='flex'
    if (type == 'video' || type == 'audio') {media.currentTime = start}
    if (cap_list && type != 'thumbsheet') {media.currentTime = start-1}	// start at first caption
    if (e != 'Mclick' && long_click) {media.currentTime = 0}
    else {media.playbackRate = rate}
    document.getElementById('title'+index).style.color='lightsalmon'	// highlight played media in tab
    if (path.href.slice(27).match('/inca/music/') || type=='audio') {looping=false}
    else if (fullscreen) {modal.requestFullscreen()}
    if (type != 'thumbsheet') {media.play()}
    thumb_ratio = media.offsetHeight/innerHeight			// original thumb/screen ratio
    if (e=='Click' || type == 'thumbsheet') {scaleY=0.6/thumb_ratio}	// 'Click' thumb sets media size
    x = 1*thumb.style.transform.slice(7,-1)
    if (!e && x) {skinny=x; newSkinny=x}				// media width was edited
    scaleX = scaleY
    scaleX *= skinny
    mediaX = localStorage.getItem('mediaX')*1				// last media position
    mediaY = localStorage.getItem('mediaY')*1
    if (!mediaX) {mediaX=innerWidth/2; mediaY=innerHeight/2}
    if (type == 'audio') {media.controls=true; media.muted=false; media.volume=1; scaleY=1; scaleX=1; media.style.width='25%'}
    thumbX = 1*media.style.left.slice(0,-2)				// originating thumb position
    thumbY = 1*media.style.top.slice(0,-2)
    thumb.style.opacity = 0						// hide thumb while media playing
    mediaTimer = setInterval(positionMedia,84)
    media.addEventListener('ended', media_ended)
    positionMedia()}


  function close_media() {
    last_index = index
    last_start = time
    if (skinny != newSkinny) {
      messages = messages+'#Skinny#'+newSkinny+'#'+index+',#'}			// width changes
    if (type == 'video') {messages = messages+'#History##'+index+',#'}		// play history
    document.getElementById('media' + index).style.opacity = null		// resume original thumb opacity
    if (!mpv_player) {
      media.removeEventListener('ended', media_ended)
      clearInterval(mediaTimer)}
    cap.style.display = 'none'
    cap.style.color = null
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    cap_time = 0
    media.poster=''
    media.src=''
    cue = 0}


  function wheelEvents(e, id, el, input) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (wheel < block) {return}
    var wheelUp = false
    block = 120
    seek_active=false
    seek.style.opacity=0
    if (e.deltaY > 0) {wheelUp=true; pos+=4} else if (pos) {pos-=4}
    if (id == 'myPage') {						// page
      if (wheelUp && page<pages) {page++} else if (page>1) {page--}
      el.href = '#Page#' + page + '##'
      el.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='mySort') {						// sort filter
      if (wheelUp) {filt++} else if (filt) {filt--}
      if (filt > 5) {filt = 5}
      var z = ['Duration','Date','Alpha','Size','Ext','Shuffle']
      sort = z[filt]
      el.href = '#'+sort+'#'+sort+'##'
      el.innerHTML = sort
      block = 200}
    else if (id == 'myFilt') {						// search filter
      if (wheelUp) {filt++} else if (filt) {filt--}
      filter()}
    else if (id == 'myThumbs') {					// size - all thumbs
      var thumb_size = 1*document.getElementById('media1').style.width.slice(0,-2)
      if (wheelUp) {thumb_size += thumb_size/40}
      else {thumb_size -= thumb_size/40}
      thumb_size = thumb_size.toFixed(1)
      if (thumb_size < 4) {thumb_size = 4}
      document.getElementById(id).href = '#myThumbs#'+thumb_size+'##'
      for (i=1; i<33 ;i++) {
        if (el = document.getElementById("thumb" + i)) {
          el.style.width = thumb_size + 'em'
          document.getElementById("media" + i).style.width = thumb_size + 'em'}}}
    else if (id == 'mySkinny') {					// width - media
      if (wheelUp) {scaleX -= 0.01}
      else {scaleX += 0.01}
      newSkinny = Math.round(1000*scaleX/scaleY)/1000
      if (newSkinny > 0.998 && newSkinny < 1.002) {block = 999}
      else {block = 20}
      thumb.style.transform = "scaleX("+newSkinny+")"}			// thumb media
    else if (id=='mySpeed') {						// speed
      if (wheelUp) {x = -0.01}
      else {x = 0.01}
      if (type != 'image') {media.playbackRate += x}
      if (media.playbackRate == 1) {block = 999}}
    else if (id=='Seek' || id=='myMute') {				// seek
      if (wheelUp) {media.currentTime += interval}
      else  {media.currentTime -= interval}}
    else if (id == 'myModal' || id == 'Thumb') {			// zoom
      block = 24
      if (wheelUp && id=='Thumb') {playMedia('')}
      if (wheelUp) {scaleX *= 1.03; scaleY *= 1.03}
      else if (media_ratio<thumb_ratio+0.1) {modal.style.cursor='progress'}	// inca.exe closes media
      else {scaleX *= 0.95; scaleY *= 0.95}
      if (wheelUp && over_media && media_ratio > 0.7 && (xm>0.8||xm<0.2||ym>0.8||ym<0.2)) {
        x = 1*media.style.marginLeft.slice(0,-2)
        y = 1*media.style.marginTop.slice(0,-2)				// focus zoom at cursor
        media.style.marginLeft = x+(mediaX-xpos)/24 +'px'
        media.style.marginTop = y+(mediaY-ypos)/24 +'px'}
      else {media.style.marginLeft=0; media.style.marginTop=0}
      positionMedia()}							// slide media to mediaX,Y position while zoom}
    else {spool(e, id)} 						// scroll top panel
    wheel = 0}


  function Gesture(e) {							// mouse move over window
    xpos = e.clientX
    ypos = e.clientY
    if (!nav.matches(":hover")) {nav.style.display = null}
    if (!nav2.matches(":hover")) {nav2.style.display = null}
    if (!type) return
    if (mouse_down && Math.abs(Xref - xpos) + Math.abs(Yref - ypos) > 5) {	// gesture detection (mousedown + slide)
      gesture = true
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      Xref = xpos
      Yref = ypos
      media.style.top = mediaY-media.offsetHeight/2 +"px"
      media.style.left = mediaX-media.offsetWidth/2 +"px"
      if (type != 'thumbsheet') {
        localStorage.setItem("mediaX",mediaX)
        localStorage.setItem("mediaY",mediaY)}}
    if (!nav.matches(":hover")) {nav.style.display = null}
    modal.style.cursor = "crosshair"
    if (type != 'thumbsheet') {setTimeout(function() {modal.style.cursor = 'none'},244)}
    if (xm>0&&xm<1&&ym>0.8&&ym<1&&media_ratio>0.5) {			// seek thumbnail
      if (type == 'video') {seek_active = true}
      start = media.duration*xm
      seek.currentTime = start}
    else {seek_active=false}}


  function positionMedia() {						// also every ~84mS while media/modal layer active
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / (media.offsetWidth*scaleX)
    ym = (ypos - rect.top) / (media.offsetHeight*scaleY)
    media_ratio = media.offsetHeight*scaleY/innerHeight
    if (!type || gesture) {seek_active = false; return}
    if (screenLeft) {x=0; y=0; Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen
    X = (media_ratio-thumb_ratio)*3; if (X>1) {X=1}
    media.style.top = thumbY + ((mediaY-media.offsetHeight/2)-thumbY)*X +y +"px"	// aim toward mediaXY on zoom
    media.style.left = thumbX + ((mediaX-media.offsetWidth/2)-thumbX)*X +x +"px"
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    if ((type=='video' || type=='audio') && (!over_media || nav2.matches(":hover"))) {seekbar.style.opacity = 0.6}
    else {seekbar.style.opacity = null}
    if (media_ratio>0.9) {seekbar.style.top = innerHeight -6 + "px"}
    seek.style.left = xpos - seek.offsetWidth/2 +'px'
    seek.style.top = rect.bottom -90 +'px'
    cap.style.top = rect.bottom +10 +'px'
    cap.style.left = rect.left +10 +'px'
    if (cap_list) {cap.style.display='block'}
    stat2.innerHTML = (1*newSkinny).toFixed(2)
    time = media.currentTime.toFixed(1)
    t1 = media.duration - media.currentTime
    if ((t2=Math.round(t1%60))<10) {t2=':0'+t2} else {t2=':'+t2}	// convert seconds to MMM:SS format
    stat3.innerHTML = Math.round(t1/60)+t2
    if (type == 'image') {stat.innerHTML=''}
    else {stat.innerHTML = media.playbackRate.toFixed(2)}
    if (type != 'audio') {
      vol = (media.volume+0.06)*(scaleY-1)
      if (vol < 1) {media.volume = vol} else {media.volume = 1}
      modal.style.backgroundColor = 'rgba(0,0,0,'+(media_ratio-thumb_ratio)*5+')'
      media.style.transform = "scale("+scaleX+","+scaleY+")"}
    if (type == 'video' && seek.style.opacity == 1) {seek_active = false}
    if (seek_active && seek.style.opacity < 1) {seek.style.opacity -= '-0.05'}
    if (!seek_active && seek.style.opacity > 0) {seek.style.opacity -= '0.05'}
    var cueX = rect.left + 'px'
    var cueW = scaleX * media.offsetWidth * media.currentTime / media.duration + 'px'
    if (cue && cue <= media.currentTime.toFixed(1)) {
      cueX = mediaX - media.offsetWidth*scaleX/2 + scaleX * media.offsetWidth * cue/media.duration + 'px'
      if (cue < media.currentTime.toFixed(1)) {
        cueW = scaleX*media.offsetWidth*(media.currentTime-cue)/media.duration+'px'}
      else {cueW = scaleX * media.offsetWidth * (1-(cue/media.duration)) + 'px'}}
    seekbar.style.left = cueX
    seekbar.style.width = cueW
    seekbar.style.top = 3 + rect.bottom + "px"
    if (xm>0 && xm<1 && ym>0 && ym<1) {over_media=true} else {over_media=false}
    if (looping) {Loop.style.color='red'} else {Loop.style.color=null}
    if (media.muted) {Mute.style.color='red'} else {Mute.style.color=null}
    if (media.duration > 120) {interval = 5} 				// set seek interval
    else {interval = 1}
    if (media.paused) {interval = 0.04}
    showCaption()}


  function thumbSheet() {
    var row = Math.floor(ym * 6)					// derive media seek time from mouse xy
    var col = Math.ceil(xm * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (media.duration > 60) {offset = 20}
    if (!over_media) {start = last_start}
    else {start = offset - (ps * offset) + media.duration * ps}
    media.currentTime=start
    type='video'
    media.play()}


  function getParameters(e) {
    thumb = document.getElementById('media' + index)
    if (!thumb) {index=1; thumb = document.getElementById('media1')}
    x = thumb['onmouseover'].toString().split(","); x.pop()		// get media arguments
    cap_list = x.pop().slice(0, -1).slice(2) 				// captions list
    if (!start && e != 'Thumb') {start=x.pop().trim()} else {x.pop()}	// start time
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image
    skinny = 1*thumb.style.transform.slice(7,-1)			// media width
    if (!skinny) {skinny=1}
    newSkinny=skinny
    media.style.width = 1*thumb.style.width.slice(0,-2) +'em'
    rect = thumb.getBoundingClientRect()
    xm = (xpos - rect.left) / (thumb.offsetWidth*skinny)
    ym = (ypos - rect.top) / thumb.offsetHeight
    media.style.top = rect.top +'px'					// align player to thumb pos
    media.style.left = rect.left -(1-skinny)*thumb.offsetWidth/2 +'px'
    media.style.marginLeft = 0; media.style.marginTop = 0    
    media.style.transform = 'scale('+skinny+',1)'
    media.poster = thumb.poster
    media.src = thumb.src
    seek.src = thumb.src}


  function Thumbsheet() {
      x = thumb.poster.replace("/posters/", "/thumbs/")
      p = x.split('%20')						// see if embedded start time in poster filename
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {		// very likely a suffix timestamp
        x = x.replace('%20' + p, '')}					// remove timestamp from filename
      media.poster = x}							// 6x6 thumbsheet file


  function media_ended() {
    if (!looping || type == 'audio') {playMedia('Loop'); return}	// loop or next media
    if (type == 'thumbsheet') {type = 'video'}
    media.currentTime = 0
    media.play()
    if (scaleX > 4) {return}
    if (media.playbackRate > 0.40) {media.playbackRate -= 0.05}		// magnify and slow each loop
    media.style.transition = '1.46s'
    stat.innerHTML = Math.round(media.playbackRate *100)
    scaleX+=0.15; scaleY+=0.15
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    setTimeout(function() {media.style.transition=null},300)}


  function select(i) {							// highlight selected media
    index = i
    if (!(el = document.getElementById("title" + i))) {return}
    x = ',' + selected
    if (el.style.border == "0.1px solid lightsalmon") {
      el.style.border = "none"
      selected = x.replace("," + i + ",", ",").slice(1)
      inputbox.value = ''}
    else {
      el.style.border = "0.1px solid lightsalmon"
      if (!x.match("," + i + ",")) {selected = selected + i + ","}
      inputbox.value = document.getElementById("title" + i).innerHTML}}


  function filter() {							// eg 30 minutes, 2 months, alpha 'A'
    var x = filt
    if (sort == 'Alpha') {if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
    if (sort == 'Size')  {x *= 10; units = " Mb"}
    if (sort == 'Date')  {units = " months"}
    if (sort == 'Duration') {units = " minutes"}
    if (!x) {x=''}
    el = document.getElementById('myFilt')
    el.href = '#Filt#' + filt + '##'
    el.innerHTML = x + ' ' + units
    return}


  function spool(e, id, input, to, so, fi, pa, ps, ts, rt, fs, ep) {	// spool lists into top htm panel
    if (id) {panel.style.opacity = 1}
    if (input) {ini=input; toggles=to; sort=so; filt=fi; page=pa; pages=ps; view=ts; rate=rt; fullscreen=fs; mpv_player=ep}
    if (!last_id) {last_id = 'Fol'}
    if (id) {last_id = id} else {id = last_id}
    sessionStorage.setItem("last_id",last_id)
    sessionStorage.setItem("pos",pos)
    if (id != 'Search' && !e.deltaY) {pos = 0}
    var count = -pos
    var htm = ''
    filter()
    z = ini.split(id+'=').pop().split('||')				// slice section matching the id
    z = z[0].split('|')
    if (id == 'Search') {						// alpha search
      for (x of z) {
        count++
        if (count > 0 && count < 25) {
          if (count==1 && pos) {id = x.substring(0, 1)}
          htm = htm + '<a href=#Search#' + x.replace(/ /g, "%20") + '##>' + x.substring(0, 15) + '</a>'}}}
    else for (x of z) {							// folders, fav, music
      var y = x.split("/")
      var q = y.pop()
      count++
      if (id == 'Fol') {q = y.pop()}
      q = q.replace('.m3u', '').substring(0, 12)
      if (selected || q == "New") {q = "<span style='color:lightsalmon'</span>" + q}
      if (count > 0 && count < 29) {
        htm = htm + '<a href=#Path##' + selected + '#' + x.replace(/ /g, "%20") + '>' + q + '</a>'}}
    if (id) {panel.innerHTML = "<a href='#Orphan#"+id+"##' style='grid-row-start:1;grid-row-end:5;color:red;font-size:2em'>"+id+"</a>"+htm}
    release()}


  function release() {							// release media from browser
    var x = selected.split(',')
    for (var i = 0; i < (x.length-1); i++) {document.getElementById('media' + x[i]).load()}}

  function createMp3() {messages = messages + '#mp3#' + time + '#' + index + ',#' + cue}
  function createMp4() {messages = messages + '#mp4#' + time + '#' + index + ',#' + cue}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function mute() {if (type == 'video') {media.muted=!media.muted; media.play()}}
  function selectAll() {for (i=1; i <= 600; i++) {select(i)}}
  function join() {document.getElementById('myJoin').href='#Join##' + selected + '#'}
  function createFav() {
    document.getElementById('myFav').href='#Favorite#' + time + '#' + index + ',#'
    document.getElementById('myFav2').href='#Favorite#' + time + '#' + index + ',#'}
  function del() { release()
    if (selected) {document.getElementById('myDelete').href='#Delete##'+selected+'#'}
    else {document.getElementById('myDelete').href='#Delete##'+index+',#'}}
  function rename() {release(); document.getElementById('myRename').href='#Rename#'+inputbox.value.replace(/ /g, "%20")+'#'+selected+'#'}
  function context(e) { e.preventDefault()
    if (!over_media && !type) {index=0}					// prevent accidental media delete
    nav2.style.left=xpos-32+'px'; nav2.style.top=ypos-40+'px'
    nav.style.left=e.clientX-40+'px'; nav.style.top=e.clientY-18+'px'
    if (type) {nav2.style.display='block'} else {nav.style.display='block'}}


  function editCap() {							// edit caption
    if (!time) {time = '0.0'}
    if (cap.value != cap.innerHTML) {
      newcap = cap.value + "|" + time + "|"
      messages = messages + '#Caption#' + newcap + '#' + index + ',#' + cap.innerHTML + '|' + time + '|'}
    cap.style.display='block'
    cap.style.opacity=0.6
    cap.value = '-'
    if (!cap.innerHTML) {cap.innerHTML = '-'}
    cap.focus()}

  function nextCap() {							// seek to next caption in movie
    if (type == 'video' && cap_list && (ym>1 || yw>0.9)) {
      var z = cap_list.split('|')
      for (x of z) {if (!isNaN(x) && x>(media.currentTime+0.2)) {media.currentTime = x-1; media.play(); return}}}
    playMedia('Mclick')}

  function showCaption() {						// display captions
    if (document.activeElement.id == 'myCap') {cap.style.color='red'; return}
    else {cap.style.color=null}
    if (type == 'image') {time='0.0'}
    var ptr = cap_list.indexOf('|'+ time + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ time - 0.1 + '|')}
    if ((ptr > 0 && cap_time != time) || type == 'image') {
      cap_time = time
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop().replaceAll("§", "\,").replaceAll("±", "\'")
      cap.value = cap.innerHTML
      cap.style.opacity = 1
      if (!media.paused) {media.pause()}}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}


</script>
