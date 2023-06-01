<script>

// save popout collections
// random page + start times
// cap intuitive editing
// idea of removing modal, everything in htm
// consider move to mpv only for fullscreen due to location bar access
// thumbsheet pops up from thumb larger size
// utf in subs finish



  var modal = document.getElementById('myModal')			// media player window
  var player = document.getElementById('myPlayer')
  var media = document.getElementById('media1')				// media element
  var inputbox = document.getElementById('myInput')			// search/edit bar
  var panel = document.getElementById('myPanel')			// list of folders, playlists etc
  var nav = document.getElementById('mySidenav')			// nav buttons over htm tab
  var stat = document.getElementById('myStatus')			// also href messages to inca.exe
  var thin = document.getElementById('mySkinny')			// media width
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var seekbar = document.getElementById('mySeekBar')			// player seekbar
  var seek = document.getElementById('mySeek')				// seek thumb under video
  var Loop = document.getElementById('myLoop')				// loop video or next
  var Mute = document.getElementById('myMute')				// loop video or next
  var sound = sessionStorage.getItem('sound')
  var last_id = sessionStorage.getItem('last_id')			// last top panel menu eg 'slides'
  var ini								// .ini folders, models, etc.
  var long_click = false
  var long_middle = false
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
  var page = 1
  var pages = 1
  var filter = 1							// filter or sort 
  var pos = 0								// top panel list pointer
  var type = ''								// audio, video, image, thumb, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = false							// play next or loop media
  var mouse_down = false
  var gesture = false
  var over_cap = false							// cursor over caption
  var over_thumb = false
  var thumb_size = 9
  var thumb = 0								// over thumbsheet xy
  var skinny = 1							// media width setting
  var newSkinny = 1
  var seek_active = 0							// seek thumb under video
  var selected = ''							// list of selected media in page
  var messages = ''							// through browser address bar to inca.exe
  var hist = ''
  var cue = 0								// start time for mp3/4 conversion
  var Zindex = 1
  var xpos								// cursor coordinate in pixels
  var ypos
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var Xoff = 0								// fullscreen offset
  var Yoff = 0
  var mediaX = 0							// centre of media player
  var mediaY = 0
  var scaleX = 1							// skinny & magnify factor
  var scaleY = 1
  var Xref								// last cursor coordinate
  var Yref

  document.addEventListener('auxclick', playMedia)			// middle click
  document.addEventListener('keydown', mouseBack)			// Back and Enter
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', Gesture)


  function timedEvents() {						// every ~84mS while media playing
    time = Math.round(10*media.currentTime)/10
    if (media.duration) {interval = Math.ceil(10*media.duration/60)/10}
    if (media.paused) {interval = 0.04}
    mySkinny.innerHTML = Math.round(100*newSkinny)/100
    stat.innerHTML = Math.round(media.playbackRate *100)
    if (sound == 'yes' && media.volume <= 0.8) {media.volume += 0.2}
    if (sound == 'no' && media.volume >= 0.2) {media.volume -= 0.2}
    positionMedia()
    Captions()}


  function overThumb(e, id, st, sx) {					// mouse over thumbnail in browser tab
    if (mouse_down) {return}						// in case thumb slides over another
    index = id
    start = st
    scaleY = 1
    scaleX = sx
    over_thumb = true
    var sel = document.getElementById('sel' + id)
    if (selected) {sel.href = '#MovePos#' + id + '#' + selected + '#'}	// preload href for thumb move position
    media = document.getElementById('media' + id)
    if (media.duration && ym > 0.9) {media.currentTime = media.duration * xm; start = media.duration * xm}
    else if (media.currentTime <= st || ym < 0.1) {media.currentTime = st + 0.1}
    media.playbackRate = 0.74
    media.play()}

  function exitThumb(e, el) {
    if (!mouse_down) {over_thumb=false}
    if (ym < 0.9 || media.style.position!='fixed') {el.pause()}}


  function playMedia(e) {
    if (e.button == 1) {e.preventDefault(); e='Mclick'}
    else if (e.button) {return}
    if (gesture) {return}
    media.pause()							// pause browser tab thumb
    media = player							// media assigned to modal
    last_type = type
    if (type) {close_media()}						// no type if no media playing 
    if (long_middle) {e = 'Previous'}					// play previous media on long Mclick
    if (e == 'Next') {index+=1; start=0}				// when start = 0, it's later derived from parameters
    if (e == 'Previous') {index-=1; start=0}
    if (e == 'Mclick' && last_type && last_type != 'video' && thumb) {index+=1}
    if (e == 'Mclick' && !thumb) {index+=1; start=0}
    if (!over_thumb && !last_type) {index=last_index; start=last_start; e='Thumb'}	// play last media
    var Next = document.getElementById("media" + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}	// end of list, return to first media
    x = Next['onclick'].toString().split(","); x.pop(); x.pop()		// get next media arguments
    if (cap_list = x.pop().slice(0, -1).slice(2)) {cap.style.display='block'}	// if caption exists
    skinny = 1*x.pop()							// saved media width
    newSkinny = skinny
    if (!start && e != 'Thumb') {start = x.pop().trim()} else {x.pop()}	// use parameters for start time
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image, thumbsheet
    media.style.opacity = 0						// prevent flashing
    media.src = Next.src
    if (type == 'document') {return}
    if (type == "image") {media.poster = Next.poster}
    else if ((e == 'Next' || e == 'Previous') && last_type == 'thumb') {type = 'thumb'}
    if (e == 'Mclick' && type == 'video' && thumb) {type = 'thumb'}
    if (type == 'video' || type == 'thumb') {
      x = Next.poster.replace("/posters/", "/thumbs/")			// get start time from filename
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {		// very likely a suffix timestamp
        if (!start && e != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}
      else {media.poster = ''; setTimeout(function() {media.poster = x},600)}} // stops flickering poster
    if (long_click) {start = 0}
    if (type == "video" || type == "audio") {media.currentTime = start - 0.6}
    if (type == "audio") {media.controls = true; sound == 'yes'}
    setTimeout(function() {
      media.style.opacity = 1
      if (type != 'thumb') {media.playbackRate = rate; media.play()}},120)
    mediaX = sessionStorage.getItem('mediaX')*1
    mediaY = sessionStorage.getItem('mediaY')*1				// last media position on screen
    scaleX = scaleY
    if (scaleY > 1.4) {scaleX = 1.4; scaleY = 1.4}			// keep media within window
    if (scaleY < 0.6) {scaleX = 0.6; scaleY = 0.6}
    if (!mediaY || mediaY < 100 || mediaY > window.innerHeight*0.8) {mediaY = window.innerHeight/2}
    if (!mediaX || mediaX < 100 || mediaX > window.innerWidth*0.8) {mediaX = window.innerWidth/2.6}
    scaleX *= skinny
    setTimeout(function() {positionMedia(); document.body.style.overflow="hidden"},300)
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    media.addEventListener('ended', media_ended)
    mediaTimer = setInterval(timedEvents,84)
    modal.style.opacity = 1
    modal.style.zIndex = 40						// in case moved thumbs exist at z levels
    stat.innerHTML = index
    seek.src = media.src						// seek thumbnail under video
    media.muted = false
    block = 200}							// block wheel input


  function close_media() {
    last_index = index
    last_start = time
    if (type == 'video') {hist = hist + index + ','}				// transfer play history to inca.exe
    if (skinny && skinny != newSkinny) {
      messages = messages + '#Skinny#' + newSkinny + '#' + index + ',#'}	// transfer width edits to inca.exe
    document.getElementById('title' + index).style.color = 'lightsalmon'	// highlight played media in tab
    document.body.style.overflow = "auto"
    media.removeEventListener('ended', media_ended)
    clearInterval(mediaTimer)
    modal.style.zIndex = -1
    modal.style.opacity = 0
    cap.style.display = 'none'
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    media.poster = ''
    media.src =''
    cap_time = 0
    type = ''}


  function wheelEvents(e, id, el, input) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (wheel < block) {return}
    var wheelDown = false
    block = 120
    if (e.deltaY > 0) {wheelDown=true; pos+=4} else if (pos) {pos-=4}
    if (id == 'myPage') {						// page
      if (wheelDown && page<pages) {page++} else if (page>1) {page--}
      el.href = '#Page#' + page + '##'
      el.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='mySort') {						// sort filter
      if (wheelDown) {filter++} else if (filter) {filter--}
      if (filter > 5) {filter = 5}
      var z = ['Duration','Date','Alpha','Size','Ext','Shuffle']
      sort = z[filter]
      el.href = '#'+sort+'#'+sort+'##'
      el.innerHTML = sort}
    else if (id == 'myFilter') {
      if (wheelDown) {filter++} else if (filter) {filter--}		// search filter
      filt()}
    else if (id == 'Fixed') {						// fixed thumb
      thumb_size = 1*media.style.width.slice(0,-2)
      if (wheelDown) {thumb_size += thumb_size/40}
      else {thumb_size -= thumb_size/40}
      media.style.width = thumb_size + 'em'}
    else if (id == 'Thumbs') {						// thumb width
      thumb_size = 1*media.style.width.slice(0,-2)
      if (wheelDown) {thumb_size += thumb_size/40}
      else {thumb_size -= thumb_size/40}
      thumb_size = Math.round(10*thumb_size)/10
      if (thumb_size < 4) {thumb_size = 4}
      document.getElementById(id).href = '#Thumbs#'+thumb_size+'##'
      for (i=1; i<33 ;i++) {
        if (el = document.getElementById("thumb" + i)) {
          el.style.width = thumb_size + 'em'
          document.getElementById("media" + i).style.width = thumb_size + 'em'}}}
    else if (id == 'mySkinny') {					// media width
      if (wheelDown) {scaleX -= 0.002}
      else {scaleX += 0.002}
      newSkinny = Math.round(1000*scaleX / scaleY)/1000
      if (newSkinny > 0.998 && newSkinny < 1.002) {block = 999}
      else {block = 24}
      media.style.transform = "scale("+scaleX+","+scaleY+")"}
    else if (id=='myStatus') {						// speed
      if (wheelDown) {x = -0.01}
      else {x = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || x < 0)) {
        media.playbackRate += x}}
    else if (type && type != 'image' && (xm>1 || xw>0.9)) {		 // seek
      if (wheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}}
    else if (type) {							// magnify
      if (wheelDown) {scaleX *= 1.015; scaleY *= 1.015}
      else {scaleX *= 0.98; scaleY *= 0.98}
      positionMedia()
      block = 24}
    else {spool(e, id)} 						// scroll top panel
    wheel = 0}


  function Gesture(e) {							// mouse move over window
    if (over_thumb) {e.preventDefault()}
    e.stopPropagation()
    xpos = e.clientX
    ypos = e.clientY
    xw =  xpos / window.innerWidth
    yw =  ypos / window.innerHeight
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / (media.offsetWidth*scaleX)
    ym = (ypos - rect.top) / (media.offsetHeight*scaleY)
    if (xm > 0 && xm < 1 && ym > 0 && ym < 1) {				// mouse over thumbsheet
      var row = Math.floor(ym * 6)					// derive media seek time from mouse xy
      var col = Math.ceil(xm * 6)
      var offset = 0
      thumb = 5 * ((row * 6) + col)
      thumb = (thumb - 1) / 200
      if (media.duration > 60) {offset = 20}
      if (type == 'thumb') {start = offset - (thumb * offset) + media.duration * thumb}}
    else {thumb = 0; start = last_start}
    if (mouse_down) {
      var x = Math.abs(Xref - xpos)
      var y =  Math.abs(Yref - ypos)
      if (!gesture && !type && over_thumb) {
        mediaX = rect.left + (media.offsetWidth * scaleX/2)
        mediaY = rect.top + (media.offsetHeight * scaleY/2)}
      if (x + y > 5) {
        if (!gesture && !type && over_thumb) {				// thumb position moved within browser tab
          media.style.opacity = 1
          media.style.position = 'fixed'
          media.style.zIndex = Zindex+=1}
        gesture = true							// media playback position moved
        mediaX += xpos - Xref
        mediaY += ypos - Yref
        Xref = xpos
        Yref = ypos
        positionMedia()
        if (type) {
          sessionStorage.setItem("mediaX",mediaX)
          sessionStorage.setItem("mediaY",mediaY)}}}
    if (type && modal.style.cursor != "crosshair") {
      modal.style.cursor = "crosshair"
      setTimeout(function() {modal.style.cursor="none"},244)}
    if (ym > 0.9 && ym < 1 && xm > 0 && xm < 1 && type == 'video') {
      seek_active = media.duration * xm
      seek.style.opacity = 1
      seek.style.left = xpos - seek.offsetWidth/2 + 'px'		// seek thumbnail
      seek.style.top = rect.bottom - seek.offsetHeight - media.offsetHeight*scaleY/10 + 'px'
      seek.currentTime = seek_active}
    else {seek_active = 0; seek.style.opacity = 0}
    if (scaleY < 1.2) {y = scaleY} else {y = 1}
    nav.style.transform = "scale("+y+","+y+")"
    nav.style.transformOrigin = "0 0"
    nav.style.left = rect.right + 4 + "px"
    nav.style.bottom = y*(innerHeight-rect.bottom) + "px"
    if (rect.right > innerWidth-100) {nav.style.left = innerWidth-100 + "px"}
    if (rect.bottom > innerHeight) {nav.style.bottom = 0}}


  function positionMedia() {
    if (screenLeft) {x=0; y=0; Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen
    media.style.marginLeft = x+'px'; media.style.marginTop = y+'px'
    seekbar.style.marginLeft = x+'px'; seekbar.style.marginTop = y+'px'
    cap.style.marginLeft = x+'px'; cap.style.marginTop = y+'px'
    seekbar.style.left = mediaX - media.offsetWidth*scaleX/2 + "px"
    seekbar.style.top = 3 + mediaY + media.offsetHeight*scaleY/2 + "px"
    if (3 + mediaY + media.offsetHeight*scaleY/2 + y > innerHeight) {seekbar.style.top = innerHeight -6 -y + "px"}
    seekbar.style.width = scaleX * media.offsetWidth * media.currentTime / media.duration + "px"
    cap.style.left = mediaX - media.offsetWidth*scaleX/2 + "px"
    cap.style.top = mediaY + media.offsetHeight*scaleY/2 + 10 + "px"
    media.style.top = mediaY - media.offsetHeight/2 + "px"
    media.style.left = mediaX - media.offsetWidth/2 + "px"
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    if (type == 'video' || type == 'audio') {
      seekbar.style.display = 'block'
      if (xm > 1 || xw > 0.9) {seekbar.style.borderBottom='6px solid rgba(250, 128, 114, 0.7)'}
      else {seekbar.style.borderBottom='1px solid rgba(250, 128, 114, 0.5)'}}
    else {seekbar.style.display = 'none'}}


  function mouseDown(e) {
    if (e.button != 0) {						// middle click
      e.preventDefault()
      if (e.button == 1) {if(over_cap) {NextCap()}; MTimer=setTimeout(function() {long_middle=true},300)}
      return}
    long_click = false
    mouse_down = true
    Xref = e.clientX
    Yref = e.clientY
    setTimeout(function() {if (mouse_down && !gesture) {long_click=true; if(type) {media_ended()}}},280)
    if (seek_active) {media.currentTime=seek_active; media.play()}}


  function mouseUp(e) {
    togglePause(e)
    mouse_down = false 
    setTimeout(function() {gesture=false; long_click=false; long_middle=false},50)
    clearTimeout(MTimer)}


  function mouseBack(e) {
    var flag = false
    if (e.key == 'Enter' && inputbox.value) {messages = messages+'#Search#'+inputbox.value+'##'; flag = true}
    if (e.key == 'Pause' || e.key == 'Enter') {				// Pause is mouse Back button
      var top = document.body.getBoundingClientRect().top
      if (!type && top < -90) {scroll(0,0); return}			// scroll to top of htm page
      if (type) {close_media(); flag = true}				// media was playing, don't reset page
      if (hist) {messages = messages+'#History##'+hist+'#'; hist=''}	// add to media history list
      if (messages) {stat.href=messages; messages=''; stat.click()}	// send messages to inca.exe
      if (!flag) {location.reload()}}}					// just reset htm tab (clear selected etc.)


  function togglePause(e) {
    if (!mouse_down||gesture||seek_active||over_cap||!type) {return}
    if (yw > 0.9 && xw > 0.5) {return}			// over nav buttons
    if (type == "thumb") {playMedia('Thumb')}
    if (long_click) {return}
    else if (media.paused) {media.play()} 
    else {media.pause()}}


  function media_ended() {
    if (!long_click && (!looping || type == 'audio')) {playMedia('Next'); return}	// loop or next media
    if (type != 'video') {return}
    media.currentTime = 0
    media.play()
    if (scaleX > 4) {return}
    if (media.playbackRate > 0.40) {media.playbackRate -= 0.05}		// magnify and slow each loop
    media.style.transition = '1.46s'
    stat.innerHTML = Math.round(media.playbackRate *100)
    scaleX+=0.15; scaleY+=0.15
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    setTimeout(function() {media.style.transition = '0s'},300)}


  function select(i) {							// highlight selected media
    if (gesture) {return}
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


  function filt() {							// eg 30 minutes, 2 months, alpha 'A'
    var x = filter
    if (sort == 'Alpha') {if (x > 25) {filter=25}; x = String.fromCharCode(filter + 65)}
    if (sort == 'Size')  {x *= 10; units = " Mb"}
    if (sort == 'Date')  {units = " months"}
    if (sort == 'Duration') {units = " minutes"}
    if (!x) {x=''}
    el = document.getElementById('myFilter')
    el.href = '#Filter#' + filter + '##'
    el.innerHTML = x + ' ' + units
    return}


  function spool(e, id, input, to, so, fi, pa, ps, ts, rt) {		// spool lists into top htm panel
    if (mouse_down) {return}						// in case sliding thumbs over panel
    if (input) {ini=input; toggles=to; sort=so; filter=fi; page=pa; pages=ps; thumb_size=ts; rate=rt} // from inca.exe
    if (!last_id) {last_id = 'fol'}
    if (id) {last_id = id} else {id = last_id}
    sessionStorage.setItem("last_id",last_id)
    if (!e.deltaY) {pos = 0}
    var count = -pos
    var htm = ''
    filt()
    z = ini.split(id+'=').pop().split('||')				// slice section matching the id
    z = z[0].split('|')
    if (id=='model' || id=='genre' || id=='studio') {			// alpha search
      for (x of z) {
        count++
        if (count > 0 && count < 23) {
          if (count==1 && pos) {id = x.substring(0, 1)}
          htm = htm + '<a href=#Search#' + x.replace(/ /g, "%20") + '##>' + x.substring(0, 15) + '</a>'}}}
    else for (x of z) {							// folders, slides, music
      var y = x.split("/")
      var q = y.pop()
      count++
      if (id=='fol' || id=='fav') {q = y.pop()}
      q = q.replace('.m3u', '').substring(0, 12)
      if (selected || q == "New") {q = "<span style='color:lightsalmon'</span>" + q}
      if (count > 0 && count < 27) {
        htm = htm + '<a href=#Path##' + selected + '#' + x.replace(/ /g, "%20") + '>' + q + '</a>'}}
    if (id) {panel.innerHTML = "<a href='#Orphan#"+id+"##' style='grid-row-start:1;grid-row-end:3;color:red;font-size:2em'>"+id+"</a>"+htm}
    release()}


  function release() {							// release media from browser
    var x = selected.split(',')
    for (var i = 0; i < (x.length-1); i++) {document.getElementById('media' + x[i]).load()}}

  function openNav() {
    document.getElementById('myMp3').href = '#mp3#' + time + '#' + index + ',#' + cue
    document.getElementById('myMp4').href = '#mp4#' + time + '#' + index + ',#' + cue
    document.getElementById('myFav').href = '#Favorite#' + time + '#' + index + ',#'}

  function loop() {if (looping) {looping = false;Loop.style.color=null} else {looping = true;Loop.style.color='red'}}

  function selectAll() {for (i=1; i <= 600; i++) {select(i)}}

  function rename() {release(); document.getElementById('myRename').href='#Rename#'+inputbox.value.replace(/ /g, "%20")+'#'+selected+'#'}
  function del() {release(); document.getElementById('myDelete').href='#Delete##'+selected+'#'}

  function mute() {
    if (sound == "yes") {sound = "no"; Mute.style.color='red'} else {sound = "yes"; Mute.style.color=null}
    sessionStorage.setItem("sound",sound); media.play()}

  function editCap() {							// captions
    if (cap.value && cap.value != cap.innerHTML) {
      newcap = cap.value + "|" + time + "|"
      messages = messages + '#Caption#' + newcap + '#' + index + ',#' + cap.innerHTML + '|' + time + '|'}
    cap.style.display='block'
    cap.style.opacity=0.6
    cap.value = '-'
    cap.innerHTML = '-'
    cap.focus()}

  function nextCap() {
    var z = cap_list.split('|')
    for (x of z) {if (!isNaN(x) && x > (media.currentTime+0.2)) {media.currentTime = x - 0.8; media.play(); return}}
    playMedia('Next')}

  function Captions() {
    if (!time) {time = '0.0'}
    var ptr = cap_list.indexOf('|'+ time + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ time - 0.1 + '|')}
    if ((ptr > 0 && cap_time != time) || type == 'image') {
      cap_time = time
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop().replaceAll("§", "\,").replaceAll("±", "\'")
      cap.value = cap.innerHTML
      cap.style.opacity = 0.6
      media.pause()}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}


</script>
                                        