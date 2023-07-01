<script>

// 🔇 - sound image in icon folder
// play/pause over thumb  open/fullscreen mute zoom on top
// sidenav top not side also on thumb inc join
// wide versus long format and starting thumb size zoom issues
// use width rther than scale or area calc instead of scaleX
// screensheet on captions


  var thumb = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var media = document.getElementById('myMedia')			// modal overlay player
  var path = document.getElementById('myPath')				// windows folder file path
  var inputbox = document.getElementById('myInput')			// search/editing bar
  var panel = document.getElementById('myPanel')			// list of folders, playlists etc
  var nav = document.getElementById('mySidenav')			// nav buttons during media play
  var stat = document.getElementById('myStatus')			// also for href messages to inca.exe
  var stat2 = document.getElementById('mySkinny')			// media width control
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var seekbar = document.getElementById('mySeekBar')			// media seekbar
  var seek = document.getElementById('mySeek')				// seek thumb under video
  var Loop = document.getElementById('myLoop')				// loop video or play next
  var last_id = sessionStorage.getItem('last_id')			// last top panel menu eg 'music'
  var ini								// .ini folders, models, etc.
  var wheel = 0
  var block = 10							// block wheel input
  var index = 1								// media index (e.g. media14)
  var last_index = 0
  var idx = 0
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
  var pos = 0								// top panel list pointer
  var type = ''								// audio, video, image, thumb, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = true							// play next or loop media
  var mpv_player = false						// use external media player
  var fullscreen = false
  var mouse_down = false
  var long_click = false
  var gesture = false
  var over_cap = false							// cursor over caption
  var over_media = true
  var over_thumb = false
  var thumb_size = 9
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
  var mediaX = 0							// centre of media player
  var mediaY = 0
  var scaleX = 1							// skinny & magnify factor
  var scaleY = 1
  var Xref								// last cursor coordinate
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
      setTimeout(function() {if(long_click) {playMedia('Mclick')}},240) // goto previous media
      nextCap()								// next caption (or next media)
      long_click = true
      block = 200							// block accidental middle click + wheel
      return}
    setTimeout(function() {if(mouse_down && !gesture) {long_click=true; if(!over_cap) {media_ended()}}},240)
    long_click=false
    mouse_down = true
    Xref = e.clientX							// for when moving thumb or media position
    Yref = e.clientY}


  function mouseUp(e) {							// !! inca.exe triggers mouseUp event after every Click
    if (e.button==1 && !long_click) {mouseBack()}			// inca.exe replaces mouse back button with MClick Up
    if (!e.button && !gesture) {					
      if (seek_active && type == 'image') {index = idx; playMedia('')}	// seek thumbnail under media
      else if (over_media && xm<0.15 && ym<0.15) {media.muted=!media.muted; media.play()}
      else if (type == 'video' && seek.style.opacity>0.3 && !over_cap) {media.currentTime=start}
      else if (cap.value != cap.innerHTML) {editCap()}			// caption in edit mode
      else if (type == 'thumb') {media.currentTime=start; type='video'; media.play()}
      else if (over_thumb) {scaleX*=2.2; scaleY*=2.2; playMedia('Click')} else {togglePause(e)}}
    if (yw<0.98) {seek.style.opacity=0; seek_active=false}
    gesture=false; mouse_down=false; long_click=false}


  function mouseBack() {						// quit media
    modal.style.cursor='crosshair'					// !!! important resets inca.exe messaging flag
    var top = document.body.getBoundingClientRect().top
    if (!type && top < -90) {setTimeout(function() {scrollTo(0,0)},100); return}
    if (type) {								// media was playing
      if (cap.value != cap.innerHTML) {editCap()}
      scaleX=newSkinny; scaleY=1
      setTimeout(function() {
        close_media()
        setTimeout(function() {modal.style.display='none'},500)		// block wheel spill into htm tab
        if (messages) {stat.href=messages; messages=''; stat.click()}},150) // send messages to inca.exe
      if (fullscreen) {
        setTimeout(function() {document.exitFullscreen()},100)
        setTimeout(function() {window.scrollTo(0, scroll_Y); modal.style.display='none'},600)}}
    if (!type) {setTimeout(function() {location.reload()},200)}}	// just reset htm tab (clear selected etc.)


  function togglePause(e) {
    if (!type||!mouse_down||gesture||over_cap||long_click||nav.matches(":hover")) {return}
    if (media.paused) {media.play()} else {media.pause()}}


  function overThumb(id, sk) {						// mouse over thumbnail in browser tab
    index = id								// htm page media id
    skinny=sk; newSkinny=sk
    over_thumb = true
    thumb = document.getElementById('media' + id)
    var thumb_container = document.getElementById('thumb' + id)
    var offset = 1*thumb.style.transform.slice(7,-1)
    if (offset) {offset = (thumb_container.offsetWidth-thumb.offsetWidth*offset)/2}
    thumb_size = 1*thumb.style.width.slice(0,-2)
    rect = thumb.getBoundingClientRect()
    media.style.transform = 'scale('+skinny+',1)'
    media.style.left = rect.left - offset + 'px'			// thumb => media player
    media.style.width = thumb_size + 'em'
    media.style.top = rect.top + 'px'
    mediaX=xpos; mediaY=ypos
    var sel = document.getElementById('sel' + id)
    if (view) {document.getElementById("thumb" + index).style.zIndex = Zindex+=1}
    if (selected) {sel.href = '#MovePos#' + id + '#' + selected + '#'}}	// for thumb position change in playlist


  function playMedia(e) {
    if (selected && path.href.slice(27).match('/inca/')) {return}	// moving thumb position within a playlist
    start = 0
    thumb = media							// media assigned from  thumb to modal player
    last_type = type
    if (type) {close_media()}			// no type if no media playing
    else {scroll_Y = window.scrollY}
    if (e == 'Mclick' && long_click) {index-=3}
    if (e == 'Loop') {index+=1; start=0}
    if (e == 'Mclick' && (last_type && last_type != 'video' || !over_media)) {index+=1; start=0}
    if (e == 'Mclick' && !over_thumb && !last_type) {index=last_index; start=last_start; e='Thumb'}	// play last media
    var Next = document.getElementById('media' + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}	// end of list, return to first media
    x = Next['onmouseover'].toString().split(","); x.pop()		// get next media arguments
    cap_list = x.pop().slice(0, -1).slice(2) 				// captions list
    if (!start && e != 'Thumb') {start = x.pop().trim()} else {x.pop()}	// use parameters for start time
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image, thumbsheet
    skinny = x.pop().replaceAll('\'', '').trim()			// media width
    newSkinny = skinny
    if (type == 'document' || type == 'm3u') {type=''; return}
    if (e == 'Mclick' && type == 'video') {type = 'thumb'}
    if (e == 'Mclick' && type == 'thumb' && !over_media) {type = 'video'}
    if (type == 'thumb') {
      x = Next.poster.replace("/posters/", "/thumbs/")			// get start time from filename
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {		// very likely a suffix timestamp
        x = x.replace('%20' + p, '')}
      media.poster = x}							// 6x6 thumbsheet
    else {media.poster = Next.poster}
if (scaleY<2) {scaleY=1}
    scaleX = scaleY
    scaleX *= skinny
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    seek.poster = Next.poster
    media.src = Next.src
    seek.src = Next.src							// seek thumbnail under video
    idx = index								// seek image index
    if (mpv_player) {return}
    modal.style.zIndex = Zindex+=1
    modal.style.display='flex'
    if (type == 'video' || type == 'audio') {media.currentTime = start}
    if (e != 'Mclick' && long_click) {media.currentTime = 0}
    if (cap_list && type != 'thumb') {media.currentTime = start-1}				// start at first caption
    else {media.playbackRate = rate}
    mediaTimer = setInterval(positionMedia,84)
    media.addEventListener('ended', media_ended)
    if (path.href.slice(27).match('/inca/music/') || type=='audio') {looping=false}
    else if (fullscreen) {modal.requestFullscreen()}
    if (type == 'audio') {media.controls = true; media.muted=false}
    if (type != 'thumb') {media.play()}}


  function close_media() {
    last_index = index
    last_start = time
    if (skinny != newSkinny) {
      messages = messages+'#Skinny#'+newSkinny+'#'+index+',#'}			// width changes
    if (type == 'video') {messages = messages+'#History##'+index+',#'}		// play history
    document.getElementById('title' + index).style.color = 'lightsalmon'	// highlight played media in tab
    if (!mpv_player) {
      media.removeEventListener('ended', media_ended)
      clearInterval(mediaTimer)}
    cap.style.display = 'none'
    cap.style.color = null
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    media.poster=''
    media.src=''
    cap_time = 0
    type = ''
    cue = 0}


  function wheelEvents(e, id, el, input) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (wheel < block) {return}
    var wheelUp = false
    block = 120
    if (type != 'image') {seek_active=false; seek.style.opacity=0}	// don't fade seek thumb on wheel
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
      thumb_size = 1*document.getElementById('media1').style.width.slice(0,-2)
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
      media.style.transform = "scale("+scaleX+","+scaleY+")"		// modal image
      el = document.getElementById('media' + index)			// htm thumb image
      el.style.transform = "scaleX("+newSkinny+")"}
    else if (id=='myStatus') {						// speed
      if (wheelUp) {x = -0.01}
      else {x = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || x < 0)) {
        media.playbackRate += x
        stat.innerHTML=Math.round(media.playbackRate *100)}}
    else if (ym>1 && scaleY>3 && (type=='video' || type=='audio')) {	// seek
      if (wheelUp) {media.currentTime += interval}
      else  {media.currentTime -= interval}}
    else if (type == 'image' && (ym>1 || yw >0.9)) {			// image seek thumb
      if (wheelUp) {idx +=1} else {idx -=1}
      var Next = document.getElementById("media" + idx)
      if (!Next) {idx = 1; Next = document.getElementById('media1')}
      seek.poster = Next.poster}
    else if (type || id == 'Thumb') {					// zoom
      if (wheelUp) {scaleX *= 1.03; scaleY *= 1.03}
      else if (scaleY>1.05) {scaleX *= 0.95; scaleY *= 0.95}
if (!wheelUp && type && type!='audio' && scaleY>1 && scaleY<1.2) {
        modal.style.cursor='e-resize'} 					// triggers inca.exe to close media
      if (!type && wheelUp) {playMedia('Click')}
      block = 24}
    else {spool(e, id)} 						// scroll top panel
    wheel = 0}


  function Gesture(e) {							// mouse move over window
    if (over_thumb) {e.preventDefault()}
    e.stopPropagation()
    xpos = e.clientX
    ypos = e.clientY
    positionMedia()
    if (type == 'thumb') {						// mouse over thumbsheet
      var row = Math.floor(ym * 6)					// derive media seek time from mouse xy
      var col = Math.ceil(xm * 6)
      var offset = 0
      var pos = 5 * ((row * 6) + col)
      pos = (pos - 1) / 200
      if (media.duration > 60) {offset = 20}
      if (!over_media) {start = last_start}
      else {start = offset - (pos * offset) + media.duration * pos}}
    if (mouse_down && Math.abs(Xref - xpos) + Math.abs(Yref - ypos) > 5) {	// gesture detection (mousedown + slide)
        gesture = true
        mediaX += xpos - Xref
        mediaY += ypos - Yref
        media.style.top = mediaY - media.offsetHeight/2 + "px"
        media.style.left = mediaX - media.offsetWidth/2 + "px"
        Xref = xpos
        Yref = ypos
        if (type && type != 'thumb') {
          sessionStorage.setItem("mediaX",mediaX)
          sessionStorage.setItem("mediaY",mediaY)}}
    if (!type) {return}
    if (modal.style.cursor != "crosshair") {
      modal.style.cursor = "crosshair"
      setTimeout(function() {modal.style.cursor = 'none'},244)}
    if ((yw>0.9 || ym>1) && xm>-0.05 && xm<1) {				// seek thumbnail
      if (type != 'thumb') {seek_active = true}
      start = media.duration*xm
      seek.currentTime = start}
    else {seek_active=false}
    stat.style.opacity = null
    seekbar.style.opacity = null
    if (type=='video' || type=='audio') {
      if (!over_media) {seekbar.style.opacity = 0.6}}}



  function positionMedia() {				// every ~84mS while media/modal layer active
//  panel.style.opacity =1;panel.innerHTML = xpos
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / (media.offsetWidth*scaleX)
    ym = (ypos - rect.top) / (media.offsetHeight*scaleY)
    if (type && scaleY>2) {
      seek.style.display='block'
      stat.style.display='block'
      seekbar.style.display='block'
      stat.style.top = rect.top -12 +'px'
      stat.style.left = rect.left -74 +'px'
      nav.style.top = rect.top +56 +'px'
      nav.style.left = rect.left -74 +'px'
      cap.style.top = rect.bottom +10 +'px'
      cap.style.left = rect.left +10 +'px'
      if (cap_list) {cap.style.display='block'}
      stat2.innerHTML = (1*newSkinny).toFixed(2)
      stat.innerHTML=Math.round(media.playbackRate *100)}
    else {
      seek_active = false
      seek.style.display='none'
      stat.style.display='none'
      seekbar.style.display='none'}
    if (!type) {return}
    if (type == 'audio') {media.style.width='25%'}
    else {
      media.volume = (scaleY-1)/20
      media.style.transform = "scale("+scaleX+","+scaleY+")"
      modal.style.backgroundColor = 'rgba(0,0,0,'+(scaleX-1.4)+')'}
    if (screenLeft) {x=0; y=0; Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen
    media.style.marginLeft = x+'px'; media.style.marginTop = y+'px'
    seekbar.style.marginLeft = x+'px'; seekbar.style.marginTop = y+'px'
    cap.style.marginLeft = x+'px'; cap.style.marginTop = y+'px'
    if (xm>0 && xm<1 && ym>0 && ym<1 && xw>0.1 && yw<0.9) {over_media=true} else {over_media=false}
    if (type == 'video' && seek.style.opacity == 1 && yw<0.98) {seek_active = false}
    if (seek_active && seek.style.opacity < 1) {seek.style.opacity -= '-0.05'}
    if (!seek_active && seek.style.opacity > 0) {seek.style.opacity -= '0.05'}
    if (type == 'video') {seek.style.left = xpos - seek.offsetWidth/2 +'px'}
    else {seek.style.left = mediaX + x - seek.offsetWidth/2 + "px"}
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
    if (3 + mediaY + media.offsetHeight*scaleY/2 > innerHeight) {seekbar.style.top = innerHeight -6 + "px"}
//    media.style.top = mediaY - media.offsetHeight/2 + "px"
//    media.style.left = mediaX - media.offsetWidth/2 + "px"
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    if (looping) {Loop.style.color='red'} else {Loop.style.color=null}
    if (type == 'image') {stat.innerHTML = (1*newSkinny).toFixed(2)}
    else {
      time = media.currentTime.toFixed(1)
      t1 = media.duration - media.currentTime
      if ((t2=Math.round(t1%60))<10) {t2=':0'+t2} else {t2=':'+t2}	// convert seconds to MMM:SS format
      if (ym<1) {seekbar.innerHTML=''}
      else {seekbar.innerHTML = Math.round(t1/60)+t2}
      if (media.duration > 120) {interval = 5} 				// set seek interval
      else {interval = 1}
      if (media.paused) {interval = 0.04}}
    showCaption()}


  function media_ended() {
    if (!looping || type == 'audio') {playMedia('Loop'); return}	// loop or next media
    if (type != 'video') {return}
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
    if (mouse_down || id=='myModal') {return}				// in case sliding thumbs over panel
    if (id) {panel.style.opacity = 1}
    if (input) {ini=input; toggles=to; sort=so; filt=fi; page=pa; pages=ps; view=ts; rate=rt; fullscreen=fs; mpv_player=ep}
    if (!last_id) {last_id = 'Fol'}
    if (id) {last_id = id} else {id = last_id}
    sessionStorage.setItem("last_id",last_id)
    if (!e.deltaY) {pos = 0}
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

  function createFav() {messages = messages + '#Favorite#' + time + '#' + index + ',#'}
  function createMp3() {messages = messages + '#mp3#' + time + '#' + index + ',#' + cue}
  function createMp4() {messages = messages + '#mp4#' + time + '#' + index + ',#' + cue}

  function loop() {if (looping) {looping = false} else {looping = true}}

  function selectAll() {for (i=1; i <= 600; i++) {select(i)}}

  function rename() { release()
    document.getElementById('myRename').href='#Rename#'+inputbox.value.replace(/ /g, "%20")+'#'+selected+'#'}

  function del() { release()
    document.getElementById('myDelete').href='#Delete##'+selected+'#'}

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
    if (type && cap_list && yw>0.85) {
      var z = cap_list.split('|')
      for (x of z) {if (!isNaN(x) && x>(media.currentTime+0.2)) {media.currentTime = x-1; media.play(); return}}}
    playMedia('Mclick')}

  function showCaption() {						// display captions
    if (document.activeElement.id == 'myCap') {cap.style.color='red'; return}
    else {cap.style.color=null}
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
