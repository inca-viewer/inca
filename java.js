<script>

// status panel
// 5:50 wake up
// convert mid wma wmv files
// edit .srt files
// not pass lists to panel load but as const strings in java
// Mclick view
// sound on/off in thumbs page ?
// create alternative player (mpv) option for non mp4 media
// list cannot see or make selections
// view etc. loses selected media
// issues with skinny not save during next media
// crash in scenes list - text media 
// list view not to load video on page load - to speed up loading lists
// put panel styles in style sheet
// mp3/4/join
// rename - check / test
// have buttons on modal for all caption/favorite cut points
// transition instead of animation
// caption entry times



  var container = document.getElementById("myModal")			// media player window
  var panel = document.getElementById("myPanel")
  var panel2 = document.getElementById("myPanel2")
  var media = document.getElementById("myPlayer")
  var speed = document.getElementById("mySpeedbar")
  var thin = document.getElementById('mySkinny')
  var view = document.getElementById('myView')
  var seek = document.getElementById("mySeekbar")
  var cap = document.getElementById("myCap")				// caption element
  var capLink = document.getElementById("myLink")
  var nav = document.getElementById("mySidenav")
  var nav2 = document.getElementById("mySidenav2")
  var mp3 = document.getElementById("myMp3")
  var mp4 = document.getElementById("myMp4")
  var fav = document.getElementById("myFav")
  var fav2 = document.getElementById("myFav2")
  var d1 = document.getElementById("myDelete")
  var d2 = document.getElementById("myDelete2")
  var ren = document.getElementById("myRename")
  var inputbox = document.getElementById("myInput")
  var sound = sessionStorage.getItem("sound")
  var wheel = 0								// mouse wheel count
  var timer = 0								// block wheel input
  var start = 0								// video initial start time
  var last_start
  var index								// media index (e.g. media14)
  var type								// audio, video, image, thumb, document
  var caption = ""
  var skinny = 1							// media width setting
  var newSkinny = 1
  var seek_active;							// currently seeking video
  var selected = ','							// list of selected media in page
  var cue = 0
  var looping = true
  var over_player							// set or cleared in html
  var block_wheel
  var cursor = ""							// mouse movement globals
  var mouse_down
  var gesture = false
  var scaleX = 1
  var scaleY = 1
  var rate = 0
  var Xref
  var Yref
  var xpos = 0.5
  var ypos = 0.5
  var mediaY = window.innerHeight/2
  var mediaX = window.innerWidth/2.6
  var thumb_size = document.getElementById("thumb1").style.width
  thumb_size = 1*thumb_size.replace("em", "")



  window.addEventListener('keydown', (event) => {			// inca.exe passing control keys
    if (event.key == 'Pause') {
      if (!type) {							// from inca.exe - mouse 'back' button
        if (document.body.getBoundingClientRect().top < 0) {scroll(0,0)}
        else {scroll(0,0); location.reload()}
        return}
      else {close_media(); container.style.opacity = 0}}
    if (event.key == 'm') {play_media('Mclick')}})			// middle click


  function overThumb(e, id, seek) {					// mouse over small thumbnails of webpage
    index = id
    med = document.getElementById("media" + id)
    var sel = document.getElementById("sel" + id)
    var playlist = document.getElementById("origin").href.match("/inca/playlists/")
    if (playlist && selected.split(',').length == 3) {
      sel.setAttribute("href", "#Move#" + id + "#" + selected)}
    var rect = med.getBoundingClientRect()				// play thumbnail video
    var yp = (e.clientY - rect.top) / (med.offsetHeight)
    if (med.currentTime <= seek || yp > 0.9) {med.currentTime = seek}
    med.currentTime += 0.14
    med.playbackRate = 0.74
    med.play()}


  function play_media(event) {
    block_wheel = 100
    if (type == 'video') {last_start = media.currentTime}
    last_type = type
    if (type) {close_media()}
    if (event == 'Click') {select(index)}				// reverse inca.exe echo click
    if (event == 'Mclick' && last_type && (last_type != 'video' || !over_player)) {index+=1}
    if (event == 'WheelUp') {index-=1}
    if (event == 'WheelDown') {index+=1}
    var next = document.getElementById("media" + index)
    if (!next) {index = 1; next = document.getElementById('media1')}
    x = next['onclick'].toString().split(","); x.pop(); x.pop()		// get next media arguments
    skinny = 1*x.pop()
    newSkinny = skinny
    if (event != 'Thumb') {start = x.pop().trim()} else {x.pop()}
    if (event == 'Thumb' && !over_player) {start = last_start}
    if (!type) {type = x.pop().replaceAll('\'', '').trim()}
    if (type == 'document') {return}
    if (event == 'Mclick' && (over_player || !last_type)) {type = "thumb"}
    else if (event == 'Wheel' && type == "video") {type = "thumb"}
    else if (event == 'Mclick' && !over_player && last_type == 'thumb') {type = "video"}
    media.style.transition = 0 + "s"
    media.style.opacity = 0
    media.src = next.src
    if (type == "audio") {media.currenTime = 0; media.controls = true; media.volume = 1; media.play()}
    if (type == "image") {media.src = next.poster; media.poster = next.poster}
    else {
      x = next.poster.replace("/posters/", "/thumbs/")
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {
        if (event != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}
      else {
        media.poster = ""
        setTimeout(function() {media.play()},50)			// time for modal to open
        setTimeout(function() {media.poster = x},350)}}
    if (sound == "yes") {timedVolUp = setInterval(vol_up_timer,50)}
    if (type == "video") {setTimeout(function() {media.currentTime = start},20)}
    setTimeout(function() {media.style.opacity = 1},100)
    caption = document.getElementById("caption" + index).innerHTML
    caption = caption.split('|'); caption.pop()
    cap.value = caption
    if (caption && type != "thumb") {
      var rect = media.getBoundingClientRect()
      cap.style.top = rect.bottom + 10 + "px"
      cap.style.left = rect.left + 20 + "px"}
    speed.innerHTML = ""
    scaleX = scaleY
    if (scaleY > 1.4) {
      scaleX = 1.4; scaleY = 1.4
      mediaY = window.innerHeight/2}
    if (skinny!=1 && type != 'thumb') {scaleX *= skinny; speed.style.color='red'; speed.innerHTML = skinny}
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
    container.addEventListener('mouseup', mouseUp)
    container.addEventListener('mousedown', mouseDown)
    container.addEventListener('wheel', preventScroll)
    media.addEventListener('ended', media_loop)				// what to do after played
    seekbarTimer = setInterval(seekbar_timer,100)			// every 100mS
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    container.style.zIndex = 3
    container.style.opacity = 1
    media.muted = false
    media.volume = 0
    looping = true
    wheel = 0
    }


  function close_media() {
    if (skinny && skinny != newSkinny) {
      thin.setAttribute("href", "#Skinny#" + newSkinny + "#," + index +",")
      thin.click()}
//    if (cap.value != caption && type != "thumb") {
//        capLink.setAttribute("href", "#Caption#" + cap.value + "|" + media.currentTime + "#," + index + ",")
//        capLink.click()}
    timedVolDown = setInterval(vol_down_timer,9)
    document.getElementById('title' + index).style.color = "lightsalmon"
    media.removeEventListener('ended', media_loop)
    container.removeEventListener('mouseup', mouseUp)
    container.removeEventListener('mousedown', mouseDown)
    container.removeEventListener('wheel', preventScroll)
    container.style.zIndex = -1
    clearInterval(seekbarTimer)
    speed.style.opacity = 1
    speed.innerHTML = ""
    cap.value = ""
    caption = ""
    media.src =""
    media.poster = ""
    type = ""}


  function media_control(e) {						// wheel over modal
    wheel += Math.abs(e.deltaY)
    if (wheel < block_wheel) {return}
    var rect = media.getBoundingClientRect()
    media.style.transition = 0 + "s"
    var WheelDown = false
    block_wheel = 20
    if (e.deltaY > 0) {WheelDown = true}
    if (ypos < 0.1 && xpos < 0.2) {					// skinny
      if (WheelDown) {scaleX -= 0.002}
      else {scaleX += 0.002}
      x = Math.round((scaleX / scaleY)*1000)/1000
      newSkinny = Math.round(x*100)/100
      if (x != 1) {speed.style.color = 'red'; speed.innerHTML = newSkinny}
      else {speed.innerHTML = ""; block_wheel = 723}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    else if (xpos < 0.1) {						// next
      if (WheelDown) {play_media('WheelDown')}
      else {play_media('WheelUp')}
      block_wheel = 200}
    else if (xpos > 0.7 && (type == "video" || type == "audio")) {	// seek
      if (media.paused == true) {interval = 0.01}
      else if (media.duration < 60) {interval = 0.2}
      else {interval = 2}
      if (WheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}
      block_wheel = 200}
    else if (xpos > 0.2 || type != "video") {				// magnify
      if (WheelDown) {scaleX *= 1.02; scaleY *= 1.02; mediaY*=1.007}
      else {scaleX *= 0.98; scaleY *= 0.98; mediaY*=0.993}
      media.style.top = mediaY
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
      cap.style.top = rect.bottom + 10 + "px"
      cap.style.left = rect.left + 20 + "px"}
    else if (xpos < 0.2) {						// speed
      if (WheelDown) {rate = -0.01}
      else {rate = 0.01}
      if (media.playbackRate < 1 || rate < 0) {
        media.playbackRate += rate
        speed.style.color = 'salmon'
        speed.innerHTML = Math.round(media.playbackRate *100)}
      else {speed.innerHTML = ""}
      block_wheel = 64}
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"		// center media player
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    wheel = 0}


  function get_thumb(e) {						// thumbsheet coordinate start
    var rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    var yp = (e.clientY - rect.top) / (media.offsetHeight * scaleY)
    var row = Math.floor(yp * 6)
    var col = Math.ceil(xp * 6)
    var thumb = 5 * ((row * 6) + col)
    var offset = 0
    if (!over_player) {thumb = 4/200}
    else thumb = (thumb - 1) / 200
    if (media.duration > 60) {offset = 20}
    start = offset - (thumb * offset) + media.duration * thumb}


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
    if (window.innerWidth > screen.width * 0.9) {
      media.style.marginLeft = "360px"					// full screen mode
      media.style.borderRadius = 1.4 + "%"
      container.style.backgroundColor = "Black"}
    else {
      media.style.marginLeft = "0px"; 
      media.style.borderRadius = 4 + "%"
      container.style.backgroundColor = "#15110a"}
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
    if (seek_active) {seek_active = media.currentTime; media.play()}}

  function mouseUp (e) {togglePause(e); mouse_down=false; gesture=false}


  function togglePause(e) {
    if (document.getElementById("mySidenav2").style.opacity > 0 && ypos > 0.5) {return} 
    if (!gesture && mouse_down && !seek_active) {		// mouse_down skips over inca.exe echo click
      if (type == "thumb") {get_thumb(e); play_media('Thumb')}
      else {
        if (media.paused==true) {
          if(media.volume > 0.5) {
            media.volume = 0
            timedVolUp = setInterval(vol_up_timer,50)}
          media.play()} 
        else {media.pause()}}}}


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
    if (el.style.border == "0.1px solid lightsalmon") {
      el.style.border = "none"
      selected = selected.replace("," + i + ",", ",")}
    else {
      el.style.border = "0.1px solid lightsalmon"
      if (!selected.match("," + i + ",")) {selected = selected + i + ","}}
    panel.innerHTML = ""
    if (selected.length > 1) {panel.style.border = "0.1px solid #826858"}
    else  {panel.style.border = ""}}


  function seekbar_timer() {
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    if (seek_active) {height = 80} else {height = 4}
    if (!mouse_down) {
      if (type != "video" && type != "audio") {height = -400}
      var rect = media.getBoundingClientRect()
      seek.style.top = window.innerHeight - height + "px"
      seek.style.left = rect.left + "px"
      seek.style.width = (scaleX * media.offsetWidth * media.currentTime / media.duration) + "px"}}


  function media_loop(e) {						// media looping or next
    media.style.animationName = ""
    if (!looping || type == "audio") {index +=1; play_media('Loop')}
    if (type == "video") {
      if (media.playbackRate > 0.65) {media.playbackRate -= 0.05}
      if (!mouse_down) {
        speed.style.color = "lightsalmon"
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
    if (id == "search") {							// alpha selected search terms
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



  function preventScroll(e) {e.preventDefault(); e.stopPropagation(); return false}

  function makeMp3() {mp3.setAttribute("href", "#Mp3#" + Math.round(media.currentTime*100)/100 + "#," + index + ",#" + cue)}
  function makeMp4() {mp4.setAttribute("href", "#Mp4#" + Math.round(media.currentTime*100)/100 + "#," + index + ",#" + cue)}
  function openNav() {nav.style.opacity = 1}
  function closeNav() {nav.style.opacity = 0}
  function openNav2() {nav2.style.opacity = 1; speed.style.opacity = 0.7}
  function closeNav2() {nav2.style.opacity = 0; speed.style.opacity = 0.3}
  function del() {d1.setAttribute("href", "#Delete##" + selected)}
  function del2() {d2.setAttribute("href", "#Delete#" + "#," + index + ",")}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function selectAll() {for (i=1; i <= 300; i++) {select(i)}}
  function favorite(id) {fav.setAttribute("href", "#Favorite##" + selected)}
  function favorite2(id) {fav2.setAttribute("href", "#Favorite#" + Math.round(media.currentTime*100)/100 + "#," + index + ",")}
  function rename() {
    el = document.getElementById("title" + index)
    ren.setAttribute("href", "#Rename#" + el.value + "#," + index + ",")}
  function adjust_thumbs(e) {
    wheel += Math.abs(e.deltaY)
    if (wheel < 100) {return}
    wheel = 0
    if (e.deltaY > 0) {thumb_size += (thumb_size/20)}
    else if (thumb_size > 5) {thumb_size -= (thumb_size/20)}
    thumb_size = Math.round(10*thumb_size)/10
    if (thumb_size < 6) {thumb_size = 6}
    view.setAttribute("href", "#Thumbs#" + thumb_size)
    for (i=1; i<101 ;i++) {
      if (el = document.getElementById("thumb" + i)) {
      el.style.width = thumb_size + "em"}}}


</script>

