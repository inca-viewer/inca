<script>


// location bar messaging format     command # value # selected # address
// status panel
// sort out start times < 60 delete all sheets < 20 dur
// position:fixed; 
// play last - list/thumb - delete - rename - caption - cue/mp3/mp4
// address bar reset
// 5:50 wake up
// convert mid wma wmv files
// dead links are wmv etc
// edit .srt files
// media.style.marginLeft = (150 * media.offsetHeight / media.offsetWidth) + "px"
// wherever cursor is, focus drifts to centralise content to it
// not pass lists to panel load but as const strings in java
// show selected qty next to cursor as reminder?
// make speed position a slide down animation
// Mclick view
// panel formatting
// long click = copy not move file (or follow to new folder/stay in this?)
// sound on/off in thumbs page ?
// create alternative player (mpv) option for non mp4 media
// select all fail index too high >100 - need new page pure indexes
// add hash to favorite posters instead of space, same with playlists
// page_id, list_id, cue list, posters folder can have start suffix on .jpg
// list cannot see or make selections
// view etc. loses selected media
// filename with hash in messages to inca
// issues with view and list size and thumbs1 id use
// issues with skinny not save during next media

// crash in scenes list - text media 
// view 0 not to load video on page load - to speed up loading lists
// put panel styles in style sheet
// transfer within playlist
// edit captions
// utf into search box
// failed to delete playlist entry when in reverse and item moved away
// move slide position within playlist
// delete entry in playlist 


  var container = document.getElementById("myModal")		// media player window
  var panel = document.getElementById("myPanel")
  var panel2 = document.getElementById("myPanel2")
  var media = document.getElementById("myPlayer")
  var speed = document.getElementById("mySpeedbar")
  var thin = document.getElementById('mySkinny')
  var view = document.getElementById('myView')
  var seek = document.getElementById("mySeekbar")
  var cap = document.getElementById("myCap")			// media captions
  var nav = document.getElementById("mySidenav")
  var nav2 = document.getElementById("mySidenav2")
  var fav = document.getElementById("myFav")
  var fav2 = document.getElementById("myFav2")
  var d1 = document.getElementById("myDelete")
  var d2 = document.getElementById("myDelete2")
  var ren = document.getElementById("myRename")
  var inputbox = document.getElementById("myInput")

  var wheel = 0			// mouse wheel count
  var timer = 0			// block wheel input
  var start = 0			// video initial start time
  var last_start
  var link			// mouseover media element
  var index			// media index (e.g. media14)
  var type			// audio, video, image, thumb, document
  var skinny = 1		// user media width preference
  var seek_active;		// currently seeking video
  var selected = ","		// list of selected media in page
  var playing = false
  var cue = 0
  var looping = true
  var over_link = 0
  var block_wheel = 20
  var cursor = ""		// mouse movement globals
  var mouse_down
  var gesture = false
  var scaleX = 1
  var scaleY = 1
  var rate = 0
  var Xref
  var Yref
  var xpos = 0.5
  var ypos = 0.5
  var MiddleClick = false
  var mediaY = window.innerHeight/2
  var mediaX = window.innerWidth/2.6
  var thumb_size = document.getElementById("thumb1").style.width
  thumb_size = 1*thumb_size.replace("em", "")


  window.addEventListener('keydown', (event) => {			// inca.exe passing control keys
    if (event.key == 'Pause') {close_media()}				// from inca.exe mouseback button
    if (event.key == 'h') {
      MiddleClick = true; 
      wheel = 0
      if (playing) {media_control(event)}
      else if (over_link) {open_media(event, link, start, type, index)}
      else {MiddleClick = false}}})		


  function open_media(event, thumb, s, t, i, sk) {			// click small thumbnail on webpage
    start = s; type = t; index = i; skinny = sk
    scaleX = scaleY
    if (!MiddleClick) {select(i)}
    if (type == "document") {return}
    if (type == "image") {media.src = thumb.poster; media.poster = thumb.poster}
    else {media.poster = ""; media.src = thumb.src}
    media.volume = 0
    PreparePlayer()
    fillInputbox(thumb)
    container.style.animationName = "fadeIn"
    media.style.animationName = ""
    media.currentTime = start
    media.muted = false
    media.play()
    playing = true
    timer = 1
    setTimeout(function() {
      timer = 0
      container.style.display="flex"
      if (MiddleClick && type == "video") {media_control(event)}},100)
    container.addEventListener("animationend", fadein_end)		// fade in media
    container.addEventListener('wheel', preventScroll)
    media.addEventListener('ended', media_loop)				// what to do after played
    seekbarTimer = setInterval(seekbar_timer,100)}			// check every 100mS


  function close_media() {						// or receiving mouse back key from inca.exe
    if (!playing) {
      if (document.body.getBoundingClientRect().top < 0) {scroll(0,0)}
      else {scroll(0,0); location.reload()}return}
    if (skinny && skinny != Math.round(100*scaleX/scaleY)/100) {
      x = Math.round(100*scaleX/scaleY)/100
      thin.setAttribute("href", "#Skinny#" + x + "#," + index +",")
      thin.click()}
    timedVolDown = setInterval(vol_down_timer,9)
    document.querySelector("body").style.overflow = "auto"
    last_start = Math.round(media.currentTime*100)/100
    document.getElementById("title" + index).style.color = "lightsalmon"
    container.addEventListener("animationend", fadeout_end)
    media.removeEventListener('ended', media_loop)
    container.removeEventListener('mouseup', mouseUp)
    container.removeEventListener('mousedown', mouseDown)
    container.removeEventListener('wheel', preventScroll)
    container.style.animationName="fadeOut"
    clearInterval(seekbarTimer)
    speed.innerHTML = ""
    cap.innerHTML = ""
    playing = false
    mouse_down = false}


  function media_control(e) {						// wheel over modal
    wheel += Math.abs(e.deltaY)
    if (wheel < block_wheel) {return}
    var WheelDown = false
    block_wheel = 20
    if (e.deltaY > 0) {WheelDown = true}
    if (MiddleClick) {							// next/previous media
      if (MiddleClick) {if (xpos < 0.1 || type != "video") {index += 1; start = null}}
      var last_type = type
      type = ""
      PreparePlayer()
      var next = document.getElementById("media" + index)
      if (next == null) {index = 1; next = document.getElementById('media1')}
      if (next.src.endsWith("jpg") || next.src.endsWith("png") 
        || next.src.endsWith("webp") || next.src.endsWith("jpeg")) {type = "image"}
      if (next.src.endsWith("mp3")) {type = "audio"}
      if (type == "audio") {media.src = next.src; media.play()}
      else if (MiddleClick && type == "image") {
        media.src = next.poster; 
        media.poster = next.poster}
      else {
        if (last_type == "video") {
          if (xpos < 0.1) {start = null}
          else {start = media.currentTime}}
        media.poster = ""
        media.src = next.src;
        x = next.poster.replace("/posters/", "/thumbs/")
        p = x.split("%20")
        p = p.pop()
        p = p.replace(".jpg", "")
        if (!isNaN(p) && p.length > 2 && p.match(".")) {start = p; x = x.replace("%20" + start, "")}
        if (xpos < 0.1 && MiddleClick) {
          setTimeout(function() {play_thumb(0)},100)
          setTimeout(function() {media.poster = x},300)}
        else {media.poster = x; type = "thumbsheet"}}}
    else if (xpos > 0.1) {						// magnify
      media.style.animationName = "paused"
      if (WheelDown) {
        scaleX *= 1.016; scaleY *= 1.016 
        mediaY += (mediaY - window.innerHeight/2)/80}
      else {
        scaleX *= 0.984; scaleY *= 0.984
        mediaY -= (mediaY - window.innerHeight/2)/80}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    else if (xpos < 0.1 && ypos < 0.2) {				// skinny
      media.style.animationName = "paused"
      if (WheelDown) {scaleX -= 0.003}
      else {scaleX += 0.003}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    else if (xpos < 0.1 && ypos > 0.8 && type != "image") {		// speed
      if (WheelDown) {rate = -0.05}
      else {rate = 0.05}
      if (media.playbackRate < 1 || rate < 0) {
        media.playbackRate += rate
        speed.innerHTML = Math.round(media.playbackRate *100)}
      else {speed.innerHTML = ""}
      block_wheel = 360}
    else if (xpos < 0.1 && ypos > 0.2 && (type == "video" || type == "audio")) {
      if (media.paused == true) {interval = 0.01}
      else if (media.duration < 60) {interval = 0.1}			// seek
      else {interval = 1}
      if (WheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}
      block_wheel = 100}
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"		// center media player
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    MiddleClick = false
    wheel = 0}


  function play_thumb(e) {						// clicked media in modal
    var rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    var yp = (e.clientY - rect.top) / (media.offsetHeight * scaleY)
    if (media.volume > 0.1) {media.volume = 0; timedVolUp = setInterval(vol_up_timer,20)}
    var row = Math.floor(yp * 6)
    var col = Math.ceil(xp * 6)
    var thumb = 5 * ((row * 6) + col)
    if (!e || xp > 1 || yp < 0) {thumb = 5}
    thumb = (thumb - 1) / 200
    var offset = 0
    if ((xp < 0 || xp > 1 || yp < 0 || yp > 1)) {thumb = 4/200}		// not over thumbsheet
    if (!e && start) {media.currentTime = start}
    else if (type == "audio") {media.currentTime = 0}
    else {
      if (media.duration > 60) {offset = 20}
      media.currentTime = offset - (thumb*offset) + media.duration*thumb}
    type = "video"
    PreparePlayer()
    media.play()}


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


  function PreparePlayer() {
    scaleX = scaleY
    if (scaleY > 1.4) {
      scaleX = 1.4; scaleY = 1.4
      mediaY = window.innerHeight/2}
    if (skinny) {scaleX *= skinny}
    media.style.setProperty('--scaleStartX', `${scaleX}`)
    media.style.setProperty('--scaleEndX', `${scaleX}`)
    media.style.setProperty('--scaleStartY', `${scaleY}`)
    media.style.setProperty('--scaleEndY', `${scaleY}`)
    media.style.animationName = "loopFade"
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
    if (type == "audio") {media.controls = true; media.volume = 1; start = 0}
    var innerCap = document.getElementById("caption" + index)
    cap.style.animationName = ""
    speed.innerHTML = ""
    cap.innerHTML = ""
    container.addEventListener('mouseup', mouseUp)
    container.addEventListener('mousedown', mouseDown)
    media.addEventListener("canplay", function() {
      media.style.top = mediaY - (media.offsetHeight / 2) + "px"
      media.style.left = mediaX - (media.offsetWidth / 2) + "px"})
    setTimeout(function() {						// wait until media loaded
      if (innerCap.innerHTML && type != "thumbsheet") {
        var rect = media.getBoundingClientRect()
        cap.style.top = rect.bottom + 10 + "px"
        cap.style.left = rect.left + 200 + "px"
        cap.style.animationName = "fadeCap"
        cap.innerHTML = innerCap.innerHTML}},400)}


  function mouseDown(e) {						// over modal window
    mouse_down = true
    Xref = e.clientX
    Yref = e.clientY
    if (seek_active) {seek_active = media.currentTime; media.play()}}

  function mouseUp (e) {togglePause(e); mouse_down=false; gesture=false}


  function togglePause(e) {
    if (document.getElementById("mySidenav2").style.opacity > 0 && ypos > 0.5) {return} 
    if (!gesture && mouse_down && !seek_active) {		// mouse_down skips over inca.exe echo click
      if (type == "thumbsheet") {play_thumb(e)}
      else {
        if (media.paused==true) {
          if(media.volume > 0.5) {
            media.volume = 0
            timedVolUp = setInterval(vol_up_timer,50)}
          media.play()} 
        else {media.pause()}}}}


  function toggleMute() {
      if (media.volume > 0.1) {timedVolDown = setInterval(vol_down_timer,20)} 
      else {timedVolUp = setInterval(vol_up_timer,50)}
      media.play()}


  function vol_up_timer() {
  if (media.volume < 0.00097 ) {media.volume = 0.00097}
  media.volume += media.volume
  if (media.volume >= 0.9) {clearInterval(timedVolUp)}}


  function vol_down_timer() {
    if (media.volume > 0.1) {media.volume -= 0.1}
    if (media.volume <= 0.11) {media.volume = 0; clearInterval(timedVolDown)}}


  function getLink(e, el, s, t, i, over) {				// mouse over small thumbnail of webpage
    over_link = over    
    if (over) {
      link=el; start=s; type=t; index=i					// get media info under cursor
      med = document.getElementById("media" + i)
      var sel = document.getElementById("sel" + i)
      if (selected.length > 1)
        sel.setAttribute("href", "#Move#" + i + "#" + selected)
      var rect = med.getBoundingClientRect()	
      var yp = (e.clientY - rect.top) / (med.offsetHeight)
      if (med.currentTime <= s || yp > 0.9) {med.currentTime = s}
      med.currentTime += 0.14
      med.playbackRate = 0.74
      med.play()}
    else {med.pause()}}


  function select(i) {							// highlight selections on page
    el = document.getElementById("media" + i)
    if (el == null) {return}
    fillInputbox(el)
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
    if (!looping || type == "audio") {
      index += 1
      var next = document.getElementById("media" + index)
      if (next == null) {index = 1; close_media(); return}
      else {media.src = next.src}}
    if (type == "video") {
      if (media.playbackRate > 0.65) {media.playbackRate -= 0.05}
      if (scaleX < 10 && !mouse_down) {
        media.offsetHeight
        speed.innerHTML = Math.round(media.playbackRate *100)
        media.style.animationName = "loopFade"
        media.style.setProperty('--scaleStartX', `${scaleX}`)
        media.style.setProperty('--scaleStartY', `${scaleY}`)
        scaleX *= 1.1; scaleY *= 1.1
        media.style.setProperty('--scaleEndX', `${scaleX}`)
        media.style.setProperty('--scaleEndY', `${scaleY}`)}}
    media.play()}


  function fadein_end() {
    document.querySelector("body").style.overflow="hidden"
    container.removeEventListener("animationend", fadein_end)}

  function fadeout_end() {
    container.style.display="none"
    media.src = ""; media.load();
    container.removeEventListener("animationend", fadeout_end)}

  function preventScroll(e){e.preventDefault(); e.stopPropagation(); return false}


  function fillInputbox(source) {
    filename = source.src.split('/').pop()
    ext = filename.split('.').pop()
    filename = filename.replace(ext, "").slice(0,-1)
    filename = filename.replaceAll("%20", " ")
    inputbox.value = filename}


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
        p = x.substring(0, 10)
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


  function openNav() {nav.style.opacity = 1; nav.style.left = 0}
  function closeNav() {nav.style.opacity = 0; nav.style.left = 0; nav.removeEventListener('wheel', preventScroll);}
  function openNav2() {nav2.style.opacity = 1; nav2.style.left = 0; speed.style.opacity = 0.7}
  function closeNav2() {nav2.style.opacity = 0; nav2.style.left = 0; speed.style.opacity = 0}
  function rename() {ren.setAttribute("href", "#Rename#" + inputbox.value + "#" + selected)}
  function del() {d1.setAttribute("href", "#Delete#" + inputbox.value + "#" + selected)}
  function del2() {d2.setAttribute("href", "#Delete#" + "#," + index + ",")}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function cue() {cue = Math.round(media.currentTime*100)/100}
  function selectAll() {for (i=1; i <= 100; i++) {select(i)}}
  function favorite(id) {fav.setAttribute("href", "#Favorite#" + start + "#," + index + ",")}
  function favorite2(id) {fav2.setAttribute("href", "#Favorite#" + Math.round(media.currentTime*100)/100 + "#," + index + ",")}
  function stopScroll() {nav.addEventListener('wheel', preventScroll)}
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
      document.getElementById("thumb" + i).style.width = thumb_size + "em"}}


</script>

