<script>

// clean up old style data - list tables etc use small modal instead
// size of list image depends on thumb setting or cursor xpos ?
// 5:50 wake up
// convert mid wma wmv files
// sound on/off in thumbs page ?
// create alternative player (mpv) option for non mp4 media
// crash in scenes list - text media 
// list view not to load video on page load - to speed up loading lists
// put panel styles in style sheet
// not pass lists to panel load but as const strings in java
// have buttons on modal for all caption/favorite cut points
// move within playlist
// remember pause state ?
// fast seek use new player same as list
// list view cannot see selections - remove first , prefix and use session memory
// view etc. loses selected media
// time to load media = innocent fee
// format caption files



  var body = document.getElementById("myBody")				// media player window
  var container = document.getElementById("myModal")			// media player window
  var panel = document.getElementById("myPanel")			// list of folders, playlists etc
  var panel2 = document.getElementById("myPanel2")			// list of all search terms
  var nav = document.getElementById("mySidenav")			// nav buttons over htm tab
  var nav2 = document.getElementById("mySidenav2")			// nav buttons over player
  var ctrl = document.getElementById('myControls')			// player sidebar controls
  var media = document.getElementById("myPlayer")
  var speed = document.getElementById("mySpeed")
  var thin = document.getElementById('myThin')
  var seek = document.getElementById("mySeek")
  var next = document.getElementById("myNext")
  var view = document.getElementById('myView')				// thumbnail size
  var cap = document.getElementById("myCap")				// caption textarea element
  var capnav = document.getElementById("myCapnav")			// caption save button
  var seekbar = document.getElementById("mySeekbar")
  var sound = sessionStorage.getItem("sound")				// remember sound setting
  var wheel = 0								// mouse wheel count
  var block = 0								// block wheel input
  var block_wheel
  var last_id
  var start = 0								// video initial start time
  var last_start
  var index = 1								// media index (e.g. media14)
  var type = ''								// audio, video, image, thumb, document
  var captions = ''							// full caption text file
  var cap_time = 0
  var mouse_down
  var over_cap								// cursor over caption
  var over_thumb
  var skinny = 1							// media width setting
  var newSkinny = 1
  var seek_active							// currently seeking video
  var selected = ''							// list of selected media in page
  var cue = 0
  var looping = true
  var gesture = false
  var scaleX = 1
  var scaleY = 1
  var Xref
  var Yref
  var xpos = 0.5
  var ypos = 0.5
  var mediaY = window.innerHeight/2					// centre of media player
  var mediaX = window.innerWidth/2.6
  var thumb_size = document.getElementById("thumb1").style.width
  thumb_size = 1*thumb_size.replace("em", "")



  window.addEventListener('keydown', (event) => {			// inca.exe passing control keys
    if (event.key == 'm') {play_media('Mclick')}			// middle click
    if (event.key == 'Pause') {						// mouse 'back' button
      if (!type) {
        if (document.body.getBoundingClientRect().top < 0) {scroll(0,0)}
        else {scroll(0,0); location.reload()}
        return}
      else {openNav2(); close_media()}}})


  function timedEvents() {						// every 100mS if media
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
    if (!mouse_down) {
      t = Math.round(10*media.currentTime)/10
      var ptr = captions.indexOf('|'+ t + '|')
      if (ptr > 0 && t != cap_time) {
        cap.style.display = 'block'
        cap.style.opacity = 0.7
        cap.innerHTML = captions.slice(0,ptr).split('|').pop()
        cap_time = t
        media.pause()}
 else if (t != cap_time) {cap.style.opacity=0}
//      if (over_cap) {cap.style.opacity=0.7; if(ptr<=0) {cap.style.opacity=0}} // cap.innerHTML=""}}
      if (type != "video" && type != "audio") {seekbar.style.top = -10 + "px"}
      else {seek.innerHTML = Math.round(media.currentTime)}
      cap.style.top = mediaY + (scaleY*media.offsetHeight/2) + 10 + "px"
      cap.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
      if (seek_active) {seekbar.style.top = window.innerHeight - 50 + "px"}
      else {seekbar.style.top = window.innerHeight - 6 + "px"}
      seekbar.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
      seekbar.style.width = (scaleX * media.offsetWidth * media.currentTime / media.duration) + "px"}}


  function overThumb(e, id, seek) {					// mouse over small thumbnails of webpage
    index = id
    over_thumb = true
    med = document.getElementById("media" + id)
    var sel = document.getElementById("sel" + id)
    var playlist = document.getElementById("origin").href.match("/inca/playlists/")
    if (playlist && selected.split(',').length == 2) {sel.href = "#Move#" + id + "#" + selected}
    med.currentTime = seek +0.1
    med.playbackRate = 0.74
    med.play()}


  function play_media(event) {
    last_type = type
    if (type) {close_media()}
    if (event == 'Click') {select(index)}				// reverse inca.exe echo click
    if (event == 'WheelDown') {index+=1}
    if (event == 'Mclick' && last_type && last_type != 'video' && ctrl.style.opacity < 0.5) {index+=1}
    if (event == 'Mclick' && ctrl.style.opacity > 0.5 && last_type != 'thumb') {index+=1}
    if (event == 'WheelUp') {index-=1}
    if (!over_thumb && !last_type) {index = last_id; event = 'Thumb'}	// play last media
    var Next = document.getElementById("media" + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}
    x = Next['onclick'].toString().split(","); x.pop(); x.pop()		// get next media arguments
    captions = x.pop().slice(0, -1).slice(2)
    skinny = 1*x.pop()
    newSkinny = skinny
    if (event != 'Thumb') {start = x.pop().trim()} else {x.pop()}
    type = x.pop().replaceAll('\'', '').trim()
    media.style.transition = 0 + "s"
    media.style.opacity = 0
    media.src = Next.src
    if (type == 'document') {return}
    if (type == "audio") {media.currentTime = 0; media.controls = true; media.volume = 1; media.play()}
    if (type == "image") {media.src = Next.poster; media.poster = Next.poster}
    else if ((event == 'WheelUp' || event == 'WheelDown') && last_type == 'thumb') {type = 'thumb'}
    if (event == 'Mclick' && ctrl.style.opacity < 0.5) {type = 'thumb'}
    if (type == 'video' || type == 'thumb') {
      x = Next.poster.replace("/posters/", "/thumbs/")
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {
        if (event != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}
      else {media.poster = ""; setTimeout(function() {media.poster = x},350)}}
    if (sound == "yes") {timedVolUp = setInterval(vol_up_timer,50)}
    if (type == "video") {setTimeout(function() {media.currentTime = start - 1},20)}
    setTimeout(function() {media.style.opacity=1; if (type=='video') {media.play()}},100)
    scaleX = scaleY
    if (scaleY > 1.4) {
      scaleX = 1.4; scaleY = 1.4
      mediaY = window.innerHeight/2}
    scaleX *= skinny
    thin.innerHTML = Math.round(skinny*100)
    next.innerHTML = index
    if (type != 'image') {speed.innerHTML = Math.round(media.playbackRate*100)}
    setTimeout(function() {document.querySelector("body").style.overflow="hidden"},300)
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    container.addEventListener('mouseup', mouseUp)
    container.addEventListener('mousedown', mouseDown)
    container.addEventListener('wheel', preventScroll)
    media.addEventListener('ended', media_ended)				// what to do after played
    setTimeout(function(){block=0;wheel=0},300)
    mediaTimer = setInterval(timedEvents,94)				// every 100mS
    container.style.zIndex = 3
    container.style.opacity = 1
    media.muted = false
    media.volume = 0
    looping = true
    block = 1}


  function close_media() {
    last_id = index
    if (type == 'video') {last_start = media.currentTime}
    if (skinny && skinny != newSkinny) {thin.click()}
    if (cap.value || cap.value != cap.innerHTML) {capnav.click()}
    timedVolDown = setInterval(vol_down_timer,9)
    document.getElementById('title' + index).style.color = "lightsalmon"
    document.querySelector("body").style.overflow = "auto"
    media.removeEventListener('ended', media_ended)
    container.removeEventListener('mouseup', mouseUp)
    container.removeEventListener('mousedown', mouseDown)
    container.removeEventListener('wheel', preventScroll)
    clearInterval(mediaTimer)
    container.style.zIndex = -1
    container.style.opacity = 0
    cap.style.display= 'none'
    nav2.style.opacity = 0
    cap.style.opacity = 0
    cap.innerHTML = ""
    media.poster = ""
    media.src =""
    type = ""}


  function media_control(e, ctr) {					// wheel inputs - modal
    wheel += Math.abs(e.deltaY)
    if (block || wheel < 24) {return}
    var rect = media.getBoundingClientRect()
    media.style.transition = 0 + "s"
    var WheelDown = false
    block_wheel = 1
    if (e.deltaY > 0) {WheelDown = true}
    if (ctr == 'Skinny') {						// skinny
      if (WheelDown) {scaleX -= 0.002}
      else {scaleX += 0.002}
      x = Math.round(1000*scaleX / scaleY)/1000
      newSkinny = Math.round(x*100)/100
      thin.innerHTML = Math.round(newSkinny*100)
      thin.href = "#Skinny#" + newSkinny + "#" + index +","
      if (newSkinny == 1) {block_wheel = 100}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    else if (ctr == 'Next') {						// next
      if (WheelDown) {play_media('WheelDown')}
      else {play_media('WheelUp')}
      next.innerHTML = index
      block_wheel = 440}
    else if ((ypos > 0.7 || ctr == 'Seek' || media.paused) && !over_cap && type != 'image' && type != 'thumb') {
      if (media.paused == true) {interval = 0.04}
      else if (media.duration < 60) {interval = 2}			 // seek
      else {interval = 10}
      if (WheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}
      block_wheel = 200}
    else if (ctr == 'Magnify') {					// magnify
      if (WheelDown) {scaleX *= 1.02; scaleY *= 1.02; mediaY*=1.007}
      else {scaleX *= 0.98; scaleY *= 0.98; mediaY*=0.993}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    else if (ctr == 'Speed') {						// speed
      if (WheelDown) {rate = -0.01}
      else {rate = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || rate < 0)) {
        media.playbackRate += rate
        speed.innerHTML = Math.round(media.playbackRate *100)}
      else {speed.innerHTML = ""}
      block_wheel = 64}
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"		// center media player
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    setTimeout(function() {block=0;wheel=0},block_wheel)
    wheel = 0; block = 1}


  function getThumb(e) {						// thumbsheet coordinate start
    var rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    var yp = (e.clientY - rect.top) / (media.offsetHeight * scaleY)
    var row = Math.floor(yp * 6)
    var col = Math.ceil(xp * 6)
    var thumb = 5 * ((row * 6) + col)
    var offset = 0
    thumb = (thumb - 1) / 200
    if (media.duration > 60) {offset = 20}
    start = offset - (thumb * offset) + media.duration * thumb
    if (xp > 1 || yp < 0 || xp < 0 || yp > 1) {start = last_start}}


  function Gesture(e) {							// mouse move over modal
    var rect = container.getBoundingClientRect()
    xpos = (e.clientX - rect.left) / container.offsetWidth		// global cursor position
    ypos = (e.clientY - rect.top) / container.offsetHeight
    if (mouse_down) {
      var x = Math.abs(Xref - e.clientX)
      var y =  Math.abs(Yref - e.clientY)
      if (x + y > 5) {gesture = true}
      if (gesture) {
        mediaY += e.clientY - Yref
        mediaX += e.clientX - Xref
        Xref = e.clientX
        Yref = e.clientY
        media.style.transition = 0 + "s"
        media.style.top = mediaY - (media.offsetHeight / 2) + "px"
        media.style.left = mediaX - (media.offsetWidth / 2) + "px"}}
    if (container.style.cursor != "crosshair") {
      container.style.cursor = "crosshair"
      setTimeout(function() {container.style.cursor="none"},244)}
    rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    if (ypos > 0.9 && xp > 0 && xp < 1 && !mouse_down && (type == "video" || type == "audio")) {
      if (!seek_active) {media.pause(); seek_active = media.currentTime}
      if (media.paused == true) {
        var x = media.duration * xp 					// fast seek video
        if (xp < 0.98) {media.currentTime = x}}}
    else if (seek_active) {
      if (media.paused == true) {media.currentTime = seek_active}
      seek_active = 0}}


  function mouseDown(e) {						// over modal window
    mouse_down = true
    Xref = e.clientX
    Yref = e.clientY
    if (!over_cap) {cap.style.opacity = 0}
    if (seek_active) {seek_active = media.currentTime; media.play()}}

  function mouseUp(e) {togglePause(e); mouse_down=false; gesture=false}


  function togglePause(e) {
    if (!gesture && mouse_down && !seek_active && nav2.style.opacity < 0.5 && !over_cap) {
      if (type == "thumb") {getThumb(e); play_media('Thumb')}
      else if (media.paused) {
        media.play()} 
      else {media.pause()}}}


  function toggleMute() {
      if (sound == "yes") {sound = "no"; timedVolDown = setInterval(vol_down_timer,20)} 
      else {sound = "yes"; timedVolUp = setInterval(vol_up_timer,50)}
      sessionStorage.setItem("sound",sound)
      media.play()}


  function vol_up_timer() {
  if (media.volume < 0.00097 ) {media.volume = 0.00097}
  media.volume += media.volume
  if (media.volume >= 0.9) {clearInterval(timedVolUp)}}


  function vol_down_timer() {
    if (media.volume > 0.1) {media.volume -= 0.1}
    if (media.volume <= 0.11) {media.volume = 0; clearInterval(timedVolDown)}}


  function select(i) {							// highlight selections on page
    index = i
    if (!document.getElementById("media" + i)) {return}
    el = document.getElementById("media" + i)
    x = ',' + selected
    if (el.style.border == "0.1px solid lightsalmon") {
      el.style.border = "none"
      selected = x.replace("," + i + ",", ",").slice(1)}
    else {
      el.style.border = "0.1px solid lightsalmon"
      if (!x.match("," + i + ",")) {selected = selected + i + ","}}
    panel.innerHTML = ""
    if (selected) {panel.style.border = "0.1px solid #826858"}
    else  {panel.style.border = ""}}


  function media_ended(e) {						// loop or next
    media.style.animationName = ""
    if (!looping || type == "audio") {index +=1; play_media('Loop')}
    if (type == "video") {
      if (media.playbackRate > 0.65) {media.playbackRate -= 0.05}
      if (!mouse_down) {						// magnify and slow
        cap.innerHTML = ""
        media.style.transition = 1.46 + "s"
        speed.innerHTML = Math.round(media.playbackRate *100)
        if (scaleX < 6) {scaleX+=0.4; scaleY+=0.4; mediaY*=1.1}
        media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
        media.style.top = mediaY}}
    media.play()}


  function spool(event, id, input) {					// spool lists into top html panel
    var link = " "
    const z = input.split("|")
    var el = document.getElementById(id)
    panel.style.direction = ""
    if (id == "folders" || id == "sub" || id == "fav" || id == "music" || id == "playlists") {
      for (x of z) {
        y = x.split("/")
        p = y.pop()
        if (id == "music" || id == "playlists") {q = x.replace(p, "")}	// substract playlist from input
        else {p = y.pop()}						// folder name
        p = p.replace(/.m3u/g, "")					// remove .m3u - (leave just name)
        p = p.substring(0, 12)
        title = document.title.replace(/Inca - /g, "")
        if (p == title) {p = "<span style=\"color:lightsalmon\"</span>" + p}
        if (p == "New") {p = "<span style=\"color:red\"</span>" + p}
        q = x.replace(/ /g, "%20")
        link = link + "<a href=#" + "Path#" + start + "#" + selected + "#" + q + "><li>" + p + "</li>" + "</a>"}
      panel.innerHTML = link;}						// command # value # selected # address
    if (id == "search") {						// alpha selected search terms
      panel.style.direction = "rtl"
      z.sort()
      var w = el.offsetWidth
      var x = ((event.clientX - el.offsetLeft - el.scrollLeft)/w) + 0.02
      var upper = String.fromCharCode(Math.floor(25 * x) + 65)
      var lower = upper.toLowerCase()
      const f_lower = z.filter(z => z.startsWith(lower))
      const f_higher = z.filter(z => z.startsWith(upper))
      y = f_higher.concat(f_lower)
      for (const x of y) {
        p = x.substring(0, 14)
        q = x.replace(/ /g, "%20")
        link = link + "<a href=#" + "Search#" + q + "><li>" + p + "</li>" + "</a>"}
      panel.innerHTML = link; el.innerHTML = upper}
    if (id == "search_all") {						// all search terms
      z.sort()
      for (const x of z) {
        p = x.substring(0, 14)
        q = x.replace(/ /g, "%20")
        link = link + "<a href=#" + "Search#" + q + "><li>" + p + "</li>" + "</a>"}
      panel2.innerHTML = link}}


  function getCoords(event, id, sort, link, current) {			// selection sliders
    var y = " "
    var of = " "
    var units = " "
    var el = document.getElementById(id)
    var w = el.offsetWidth
    var x = (event.clientX - el.offsetLeft - el.scrollLeft)/w
    if (sort == 'Alpha') {y = Math.floor(26.9 * x) + 64}
    if (sort == 'Size') {y = Math.floor(100 * x) * 10;units = "Mb +"}
    if (sort == 'Date') {y = Math.floor(37 * x);units = "months +"}
    if (sort == 'Duration') {y = Math.floor(60 * x);units = "minutes +"}
    if (id =='slider2' || id =='slider3') {y = Math.floor(sort*x)+1; units = sort; sort = "Page"; of = " of "}
    if (id =='slider4') {y = Math.floor(4 * x); sort = "View";}
    if (current != "") {y = current}
    el.href= link + ".htm#" + sort + "#" + y
    if (sort =='Random' || sort =='ext' || sort =='Shuffle') {return}
    if (sort == 'Alpha') {y = String.fromCharCode(y)}
    el.innerHTML = y + of + units}


  function editCap() {cap.style.display='block'; cap.style.opacity=0.7; cap.focus()}
  function preventScroll(e) {e.preventDefault(); e.stopPropagation(); return false}
  function openControls() {ctrl.addEventListener('wheel', preventScroll); ctrl.style.opacity = 0.7}
  function closeControls() {ctrl.removeEventListener('wheel', preventScroll); ctrl.style.opacity = 0.3}
  function openNav2() {
    nav2.style.opacity = 1
    document.getElementById("myMp3").href = "#Mp3#" + Math.round(media.currentTime*100)/100 + "#" + index + ",#" + cue
    document.getElementById("myMp4").href = "#Mp4#" + Math.round(media.currentTime*100)/100 + "#" + index + ",#" + cue
    document.getElementById("myFav2").href = "#Favorite#" + Math.round(media.currentTime*10)/10 + "#" + index + ","
    cap_time = Math.round(10*media.currentTime)/10
    if (cap.value || cap.innerHTML) {
      if (cap.value) {newcap = cap.value + "|" + cap_time + "|"} else {newcap = ''}
      capnav.href = "#Caption#" + newcap + "#" + index + ",#" + cap.innerHTML + "|" + cap_time + "|"}}
  function closeNav2() {nav2.style.opacity = 0}
  function loop() {if (looping) {looping = false} else {looping = true}}

  function openNav() {
    nav.style.opacity = 1
    nav.addEventListener('wheel', preventScroll)
    document.getElementById("myDelete").href = "#Delete##" + selected	// media from htm page
    document.getElementById("myFav").href = "#Favorite##" + selected	// add link to 'new' playlist
    el = document.getElementById("title" + index)
    document.getElementById("myRename").href = "#Rename#" + el.value + "#" + index + ","
    med.load()}
  function closeNav() {nav.style.opacity = 0; nav.removeEventListener('wheel', preventScroll)}
  function selectAll() {for (i=1; i <= 300; i++) {select(i)}}
  function adjust_thumbs(e) {
    wheel += Math.abs(e.deltaY)
    if (wheel < 100) {return}
    wheel = 0
    if (e.deltaY > 0) {thumb_size += (thumb_size/20)}
    else if (thumb_size > 5) {thumb_size -= (thumb_size/20)}
    thumb_size = Math.round(10*thumb_size)/10
    if (thumb_size < 6) {thumb_size = 6}
    view.href = "#Thumbs#" + thumb_size
    for (i=1; i<101 ;i++) {
      if (el = document.getElementById("thumb" + i)) {
      el.style.width = thumb_size + "em"}}}


</script>
