<script>

// compliance firefox, brave, edge and opera
// open in notepad mpv etc not run src ?


  var modal = document.getElementById('myModal')			// media player window
  var player = document.getElementById('myPlayer')
  var inputbox = document.getElementById('myInput')
  var panel = document.getElementById('myPanel')			// list of folders, playlists etc
  var nav = document.getElementById('mySidenav')			// nav buttons over htm tab
  var stat = document.getElementById('myStatus')			// also href messages to inca.exe
  var speed = document.getElementById('mySpeed')
  var thin = document.getElementById('myThin')				// media width
  var next = document.getElementById('myNext')
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var seekbar = document.getElementById('mySeekBar')
  var seek = document.getElementById('mySeek')
  var Loop = document.getElementById('myLoop')
  var folder = sessionStorage.getItem('folder')
  var sound = sessionStorage.getItem('sound')
  var long_click = false
  var long_middle = false
  var wheel = 0
  var block = 0								// block wheel input
  var last_id
  var time = 0								// current media time
  var start = 0								// video start time
  var last_start
  var filter = 0							// eg 30 minutes, 2 months, 'A'
  var toggles = ''							// eg reverse, recurse
  var sort = 'Alpha'
  var thumb_size = 9
  var media								// current media element
  var rate = 1
  var page = 1
  var pages = 1
  var index = 1								// current media index (e.g. media14)
  var type = ''								// audio, video, image, thumb, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var mouse_down = false
  var thumb = false
  var gesture = false
  var over_cap = false							// cursor over caption
  var over_thumb = false
  var skinny = 1							// media width setting
  var newSkinny = 1
  var seek_active							// currently seeking video
  var selected = ''							// list of selected media in page
  var messages = ''							// from address bar to inca.exe
  var cue = 0
  var looping = true
  var Zindex = 1
  var xpos = 0.5
  var ypos = 0.5
  var mediaX = 0
  var mediaY = 0							// centre of media player
  var scaleX = 1
  var scaleY = 1
  var Xref
  var Yref



  document.addEventListener('auxclick', playMedia)			// middle click
  document.addEventListener('keydown', mouseBack)			// mouse Back button
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', Gesture)
  loop();loop()								// set button color


  function timedEvents() {						// every ~84mS while media playing
    time = Math.round(10*media.currentTime)/10
    if (sound == 'yes' && media.volume <= 0.8) {media.volume += 0.2}
    if (sound == 'no' && media.volume >= 0.2) {media.volume -= 0.2}
    cap.style.top = mediaY + (scaleY*media.offsetHeight/2) + 10 + "px"
    cap.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
    seekbar.style.width = (scaleX * media.offsetWidth * media.currentTime / media.duration) + "px"
    if (window.innerWidth == screen.width) {				// full screen mode
      media.style.marginLeft = '350px'; media.style.marginTop = '100px'; seekbar.style.marginLeft = '350px'}
    else {media.style.marginLeft = 0; media.style.marginTop = 0; seekbar.style.marginLeft = 0}
    if (ypos > 0.6) {stat.innerHTML=Math.round(newSkinny*100)}
    if (ypos > 0.75) {stat.innerHTML=time}
    positionMedia()
    Captions()}


  function overThumb(e, id, strt, sk) {					// mouse over thumbnail in browser tab
    if (mouse_down) {return}
    index = id
    scaleX = sk
    over_thumb = true
    var sel = document.getElementById('sel' + id)
    if (selected) {sel.href = '#MovePos#' + id + '#' + selected + '#'}
    media = document.getElementById('media' + id)
    var rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth)
    var yp = (e.clientY - rect.top) / (media.offsetHeight)
    if (media.duration && yp > 0.9) {media.currentTime = media.duration *xp}
    if (media.currentTime <= strt || yp < 0.1) {media.currentTime = strt +0.1}
    media.playbackRate = 0.74
    start = media.currentTime
    seek.src = media.src
    media.play()}


  function playMedia(e) {
    if (e.button == 1) {e.preventDefault(); e = 'Mclick'}
    else if (e.button) {return}
    if (gesture) {return}
    media.pause()							// pause browser tab thumb
    media = player							// media assigned to modal
    last_type = type
    if (type) {close_media()}
    if (long_middle) {e = 'Previous'}
    if (e == 'Next') {index+=1; start=0}
    if (e == 'Previous') {index-=1; start=0}
    if (e == 'Mclick' && last_type && last_type != 'video' && xpos > 0.1) {index+=1}
    if (e == 'Mclick' && xpos < 0.1 && last_type != 'thumb') {index+=1}
    if (!over_thumb && !last_type) {index = last_id; start = last_start; e = 'Thumb'}	// play last media
    var Next = document.getElementById("media" + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}
    x = Next['onclick'].toString().split(","); x.pop(); x.pop()		// get next media arguments
    if (cap_list = x.pop().slice(0, -1).slice(2)) {cap.style.display='block'}
    skinny = 1*x.pop()
    newSkinny = skinny
    if (!start && e != 'Thumb') {start = x.pop().trim()} else {x.pop()}
    type = x.pop().replaceAll('\'', '').trim()
    media.style.opacity = 0
    media.src = Next.src
    if (type == 'document') {return}
    if (type == "image") {media.poster = Next.poster}
    else if ((e == 'Next' || e == 'Previous') && last_type == 'thumb') {type = 'thumb'}
    if (e == 'Mclick' && type == 'video' && xpos > 0.1) {type = 'thumb'}
    if (type == 'video' || type == 'thumb') {
      x = Next.poster.replace("/posters/", "/thumbs/")
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {
        if (!start && e != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}
      else {media.poster = ''; setTimeout(function() {media.poster = x},600)}}
    if (long_click) {start = 0}
    if (type == "video" || type == "audio") {media.currentTime = start - 0.6}
    if (type == "audio") {media.controls = true; sound == 'yes'}
    setTimeout(function() {
      media.style.opacity=1
      if (type != 'thumb') {media.playbackRate = rate; media.play()}},120)
    mediaX = sessionStorage.getItem('mediaX')*1
    mediaY = sessionStorage.getItem('mediaY')*1
    scaleX = scaleY
    if (scaleY > 1.4) {scaleX = 1.4; scaleY = 1.4}
    if (scaleY < 0.4) {scaleX = 0.4; scaleY = 0.4}
    if (!mediaY || mediaY < 100 || mediaY > window.innerHeight*0.8) {mediaY = window.innerHeight/2}
    if (!mediaX || mediaX < 100 || mediaX > window.innerWidth*0.8) {mediaX = window.innerWidth/2.6}
    scaleX *= skinny
    stat.innerHTML = index
    setTimeout(function() {positionMedia(); document.body.style.overflow="hidden"},300)
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    media.addEventListener('ended', media_ended)
    setTimeout(function(){block=0;wheel=0},400)
    mediaTimer = setInterval(timedEvents,84)
    if (type == "audio") {media.volume = 1}
    else {media.volume = 0}
    modal.style.opacity = 1
    modal.style.zIndex = 40
    seek.src = media.src
    media.muted = false
    block = 1}


  function close_media() {
    last_id = index
    last_start = media.currentTime
    if (skinny && skinny != newSkinny) {
      messages = messages + '#Skinny#' + newSkinny + '#' + index + ',#'}
    document.getElementById('title' + index).style.color = 'lightsalmon'
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
    closeNav()
    type = ''}


  function wheelEvents(e, id, el, input) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (block || wheel < 140) {return}
    var wheelDown = false
    var timer = 10
    if (e.deltaY > 0) {wheelDown = true}
    if (wheelDown) {filter++}
    else if (filter) {filter--}
    if (id == 'myPanel') {						// alpha search
      if (filter > 26) {filter = 26}
      id = String.fromCharCode(filter + 64)
      var htm = ''
      var z = input.split('|').sort()
      const y = z.filter(z => z.toUpperCase().startsWith(id))
      for (x of y) {
        p = x.substring(0, 15)
        q = x.replace(/ /g, "%20")
        htm = htm + '<a href=#Search#' + q + '##>' + p + '</a>'}
      if (!filter) { spool(e, '', '')}					// show Menu
      else {panel.innerHTML = "<span style=\'grid-row-start:1;grid-row-end:3;color:red;font-size:2em\'>"+id+"</span>"+htm}}
    else if (id == 'myPage') {						// page
      if (wheelDown && page<pages) {page++} else if (page>1) {page--}
      el.href = '#Page#' + page + '##'
      el.innerHTML = 'Page '+page+' of '+pages}
    else if (id == 'myFilter') {					// search filter
      var units = ''
      var x = 'All'
      if (sort == 'Alpha') {if(filter < 26) {x = String.fromCharCode(filter + 64)}}
      if (sort == 'Size')  {x = filter * 10; units = " Mb"}
      if (sort == 'Date')  {x = filter; units = " months"}
      if (sort == 'Duration') {x = filter; units = " minutes"}
      el.href = '#Filter#' + filter + '##'
      el.innerHTML = x + units}
    else if (id == 'Thumb1' || id == 'Thumbs') {			// thumb width
      var thumbs = document.getElementById('Thumbs')			// from top panel htm
      thumb = document.getElementById("thumb" + index)
      thumb_size = 1*media.style.width.slice(0,-2)
      if (wheelDown) {thumb_size += thumb_size/40}
      else {thumb_size -= thumb_size/40}
      thumb_size = Math.round(10*thumb_size)/10
      if (thumb_size < 4) {thumb_size = 4}
      if (id == 'Thumbs') {
        thumbs.href = '#Thumbs#' + thumb_size +'##'
        thumbs.innerHTML = 'Thumbs ' + Math.round(thumb_size)
        for (i=1; i<41 ;i++) {
          if (el = document.getElementById("thumb" + i)) {
            el.style.width = thumb_size + 'em'
            document.getElementById("media" + i).style.width = thumb_size + 'em'}}}
      else {media.style.width = thumb_size + "em"}}
    else if (id == 'myThin') {						// media width
      if (wheelDown) {scaleX -= 0.002}
      else {scaleX += 0.002}
      newSkinny = Math.round(1000*scaleX / scaleY)/1000
      stat.innerHTML = Math.round(newSkinny*100)
      if (newSkinny == 1) {timer = 146}
      media.style.transform = "scale("+scaleX+","+scaleY+")"}
    else if (id == 'myNext') {						// next media
      if (wheelDown) {playMedia('Next')}
      else {playMedia('Previous')}
      stat.innerHTML = index
      timer = 440}
    else if (id == 'mySpeed' || xpos < 0.1) {				// speed
      if (wheelDown) {x = -0.01}
      else {x = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || x < 0)) {
        media.playbackRate += x
        stat.innerHTML = Math.round(media.playbackRate *100)}}
    else if (ypos > 0.75 && type != 'image' && type != 'thumb') {	// seek
      if (media.paused == true) {interval = 5}
      else if (media.duration < 91) {interval = 30}
      else {interval = 300}
      interval *= Math.abs(ypos - 0.75)
      if (wheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}
      timer = 200}
    else if (id == 'myModal') {						// magnify
      if (wheelDown) {scaleX *= 1.015; scaleY *= 1.015}
      else {scaleX *= 0.98; scaleY *= 0.98}
      positionMedia()}
    setTimeout(function() {block=0;wheel=0},timer)
    wheel = 0; block = 1}


  function Gesture(e) {							// mouse move over window
    if (over_thumb) {e.preventDefault()}
    e.stopPropagation()
    xpos = e.clientX / window.innerWidth
    ypos = e.clientY / window.innerHeight
    rect = media.getBoundingClientRect()
    if (mouse_down) {
      var x = Math.abs(Xref - e.clientX)
      var y =  Math.abs(Yref - e.clientY)
      if (!gesture && !type && over_thumb) {
        mediaX = rect.left + (media.offsetWidth * scaleX/2)
        mediaY = rect.top + (media.offsetHeight * scaleY/2)}
      if (x + y > 5) {
        if (!gesture && !type && over_thumb) {				// thumb moved in browser tab
          media.style.opacity = 1
          media.style.position = 'fixed'
          media.style.zIndex = Zindex+=1}
        gesture = true
        mediaY += e.clientY - Yref
        mediaX += e.clientX - Xref
        Xref = e.clientX
        Yref = e.clientY
        positionMedia()
        if (type) {
          sessionStorage.setItem("mediaX",mediaX)
          sessionStorage.setItem("mediaY",mediaY)}}}
    if (type && modal.style.cursor != "crosshair") {
      modal.style.cursor = "crosshair"
      setTimeout(function() {modal.style.cursor="none"},244)}
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)	 // fast seek video
    seek.style.bottom = 50 +'px'	
    seek.style.left = e.clientX -80 +'px'
    if (ypos > 0.9 && xp > 0 && xp < 1 && !mouse_down && type == 'video') {
      seek_active = media.duration * xp
      seek.style.opacity = 1
      if (xp < 0.98) {seek.currentTime = seek_active}}
    else {seek_active = false; seek.style.opacity = 0}}


  function getThumb(e) {						// mouse over thumbsheet
    var rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    var yp = (e.clientY - rect.top) / (media.offsetHeight * scaleY)
    if (xp > 1 || yp < 0 || xp < 0 || yp > 1) {return}
    var row = Math.floor(yp * 6)
    var col = Math.ceil(xp * 6)
    var thumb = 5 * ((row * 6) + col)
    var offset = 0
    thumb = (thumb - 1) / 200
    if (media.duration > 60) {offset = 20}
    start = offset - (thumb * offset) + media.duration * thumb}


  function mouseDown(e) {
    if (e.button != 0) {						// middle click
      e.preventDefault()
      if (e.button == 1) {MClick = setTimeout(function() {long_middle=true},250)}
      return}
    long_click = false
    mouse_down = true
    Xref = e.clientX
    Yref = e.clientY
    media.style.transition = '0.1s'
    setTimeout(function() {if (mouse_down && !gesture) {long_click=true; media_ended()}},240)
    if (seek_active) {media.currentTime = seek_active}}


  function mouseUp(e) {
    togglePause(e)
    mouse_down=false
    media.style.transition = '0s'
    setTimeout(function() {gesture=false; long_middle=false},50)
    clearTimeout(MClick)}


  function togglePause(e) {
    if (!mouse_down || gesture || seek_active || over_cap || !type) {return}
    if (xpos < 0.1 && ypos > 0.5) {return}
    if (type == "thumb") {getThumb(e); playMedia('Thumb')}
    if (long_click) {return}
    else if (media.paused) {
      media.play()} 
    else {media.pause()}}


  function mouseBack(e) {
    if (e.key != 'Pause') {return}					// inca.exe re-map of mouse Back button
    var flag = false
    var top = document.body.getBoundingClientRect().top
    if (!type && top < 0) {scroll(0,0); return}				// scroll to top page
    if (type) {close_media(); flag = true}				// media was playing
    if (messages) {stat.href=messages; stat.click(); messages=''}	// send messages to inca.exe
    if (!flag) {location.reload()}}					// update htm tab


  function media_ended() {
    if (!looping || type == 'audio') {playMedia('Next'); return}	// loop or next media
    if (type != 'video') {return}
    media.currentTime = 0
    media.play()
    if (scaleX > 4) {return}
    if (media.playbackRate > 0.40) {media.playbackRate -= 0.05}		// magnify and slow
    media.style.transition = '1.46s'
    stat.innerHTML = Math.round(media.playbackRate *100)
    scaleX+=0.15; scaleY+=0.15
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    setTimeout(function() {media.style.transition = '0s'},300)}


  function select(i) {							// highlight selected media
    if (over_thumb || gesture) {return}
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
      inputbox.value = document.getElementById("title" + i).innerHTML}
    panel.innerHTML = ""
    if (selected) {panel.innerHTML=selected; panel.style.border = "0.1px solid #826858"}
    else  {panel.style.border = ""}}


  function toggleMute() {
    if (sound == "yes") {sound = "no"} else {sound = "yes"}
    sessionStorage.setItem("sound",sound)
    media.play()}


  function positionMedia() {
    seekbar.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
    if (type == "video") {
      seekbar.style.display = 'block'
      if (ypos > 0.75) {seekbar.style.top = window.innerHeight - 12 + 'px'}
      else {seekbar.style.top = window.innerHeight - 3 + 'px'}}
    else {seekbar.style.display = 'none'}
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    media.style.transform = "scale("+scaleX+","+scaleY+")"}


  function spool(e, id, input, to, so, fi, pa, ps, ts, rt) {			// onload - spool lists into top htm panel
    media = document.getElementById('media1')
    var htm = ''
    var p = ''
    wheel = 0
    if (!id) {									// menu
      if (pa) {toggles=to; sort=so; filter=fi; page=pa; pages=ps; thumb_size=ts; rate=rt}
      var z = ['Shuffle','Alpha','Duration','Date','Size','Ext','Reverse','Recurse','Images','Videos']
      for (x of z) {
        if (sort.match(x) || toggles.match(x)) {p = " style='color:lightsalmon'"} else {p=''}
        htm = htm + '<a href=#'+x+'###' + p + '>' + x + '</a>'}
      htm = htm + '<a id="myFilter" onwheel="wheelEvents(event, id, this)">All</a><a href=#Thumbs#'+thumb_size+'## id="Thumbs" onwheel="wheelEvents(event, id, this)" onmouseover="media.style.opacity=1" onmouseout="media.style.opacity=null">Thumbs '+Math.round(thumb_size)+'</a><a id="myRename" onmousemove="rename()">Rename</a><a href=#Delete##'+selected+'#>Delete</a><a href=#Select### onmouseup="selectAll()">Select</a><a href="%title%.htm#Page" id="myPage" onwheel="wheelEvents(event, id, this)">Page '+page+' of '+pages+'</a><a href=#Settings###>Settings</a><a href=#Join##'+selected+'#>Join</a>'}
    else if ('FolFavSubMusicSlides'.match(id)) {				// folders and playlists
      sessionStorage.setItem("folder",id)
      var z = input.split('|')
      for (x of z) {
        y = x.split("/")
        p = y.pop()
        if (id == "Music" || id == "Slides") {q = x.replace(p, "")}
        else {p = y.pop()}
        p = p.replace(/.m3u/g, "")
        p = p.substring(0, 12)
        title = document.title.replace(/Inca - /g, "")
        if (p == title) {p = "<span style='color:lightsalmon'</span>" + p}
        if (p == "New") {p = "<span style='color:red'</span>" + p}
        var path = x.replace(/ /g, "%20")
        htm = htm + '<a href=#Path##' + selected + '#' + path + '>' + p + '</a>'}}
    panel.innerHTML = htm
    x = selected.split(',')
    document.getElementById(folder).style.color = 'lightsalmon'
    for (var i = 0; i < x.length; i++) {document.getElementById('media' + x[i]).load()}}	// release media


  function openNav() {
    nav.style.opacity = 0.7
    document.getElementById('myMp3').href = '#mp3#' + time + '#' + index + ',#' + cue
    document.getElementById('myMp4').href = '#mp4#' + time + '#' + index + ',#' + cue
    document.getElementById('myFav').href = '#Favorite#' + time + '#' + index + ',#'}
  function closeNav() {nav.style.opacity = 0.3}
  function loop() {if (looping) {looping = false;Loop.style.color=null} else {looping = true;Loop.style.color='red'}}
  function selectAll() {for (i=1; i <= 600; i++) {select(i)}}
  function exitThumb(el) {if(!mouse_down) {over_thumb = false}; if (media != player){el.pause()}}
  function rename() {document.getElementById('myRename').href='#Rename#'+inputbox.value.replace(/ /g, "%20")+'#'+selected+'#'}
  function editCap() {
    if (cap.value && cap.value != cap.innerHTML) {
      newcap = cap.value + "|" + time + "|"
      messages = messages + '#Caption#' + newcap + '#' + index + ',#' + cap.innerHTML + '|' + time + '|'}
    cap.style.display='block'
    cap.style.opacity=0.6
    cap.value = '-'
    cap.innerHTML = '-'
    cap.focus()}

  function nextCaption() {
    var z = cap_list.split('|')
    for (x of z) {
      if (!isNaN(x) && x > media.currentTime) {media.currentTime = x - 0.8; return}}
    playMedia('Next')}

  function Captions() {
    var ptr = cap_list.indexOf('|'+ time + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ time - 0.1 + '|')}
    if ((ptr > 0 && cap_time != time) || type == 'image') {
      cap_time = time
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop()
      cap.value = cap.innerHTML
      cap.style.opacity = 0.6
      media.pause()}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}


</script>
                                        