<script>

// clean up old style data - list tables etc use small modal instead
// 5:50 wake up
// convert mid wma wmv files
// create alternative player (mpv) option for non mp4 media
// crash in scenes list - text media 
// list view not to load video on page load - to speed up loading lists
// put panel styles in style sheet
// not pass lists to panel load but as const strings in java
// have buttons on modal for all caption/favorite cut points
// button for random speed / magnify effects
// list of last 10 media or 10 searches
// fast seek use new modal and same for list
// ypos axis determines size of seek jumps
// proper grab move handle without jumping


  var container = document.getElementById("myModal")			// media player window
  var player = document.getElementById("myPlayer")
  var panel = document.getElementById("myPanel")			// list of folders, playlists etc
  var nav = document.getElementById("mySidenav")			// nav buttons over htm tab
  var speed = document.getElementById("mySpeed")
  var thin = document.getElementById('myThin')
  var next = document.getElementById("myNext")
  var thumbs = document.getElementById('myThumbs')			// thumbnail size
  var cap = document.getElementById("myCap")				// caption textarea element
  var capnav = document.getElementById("myCapnav")			// caption save button
  var seek = document.getElementById("mySeek")
  var sound = sessionStorage.getItem("sound")				// remember sound setting
  var wheel = 0								// mouse wheel count
  var block = 0								// block wheel input
  var last_id
  var start = 0								// video initial start time
  var last_start
  var media								// current media element (thumb or modal)
  var index = 1								// current media index (e.g. media14)
  var type = ''								// audio, video, image, thumb, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var mouse_down
  var thumb = false
  var gesture
  var over_cap								// cursor over caption
  var over_thumb
  var skinny = 1							// media width setting
  var newSkinny = 1
  var seek_active							// currently seeking video
  var selected = ''							// list of selected media in page
  var cue = 0
  var looping = true
  var scaleX = 1
  var scaleY = 1
  var Xref
  var Yref
  var Zindex = 1
  var xpos = 0.5
  var ypos = 0.5
  var mediaY = window.innerHeight/2					// centre of media player
  var mediaX = window.innerWidth/2.6



  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)

  window.addEventListener('keydown', (event) => {			// inca.exe passing control keys
    if (event.key == 'm') {play_media('Mclick')}			// middle click
    if (event.key == 'Pause') {						// mouse 'back' button
      if (!type) {
        if (document.body.getBoundingClientRect().top < 0) {scroll(0,0)}
        else {scroll(0,0); location.reload()}return}
      else {openNav(); close_media()}}})				// get links


  function timedEvents() {						// every 100mS if media
    Captions()
    if (sound == 'yes' && media.volume <= 0.8) {media.volume += 0.2}
    if (sound == 'no' && media.volume >= 0.2) {media.volume -= 0.2}
    if (type != "video" && type != "audio") {seek.style.top = -10 + "px"}
    cap.style.top = mediaY + (scaleY*media.offsetHeight/2) + 10 + "px"
    cap.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
    if (seek_active) {seek.style.top = window.innerHeight - 8 + "px"}
    else {seek.style.top = window.innerHeight - 3 + "px"}
    seek.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
    seek.style.width = (scaleX * media.offsetWidth * media.currentTime / media.duration) + "px"
    positionMedia()}


  function overThumb(e, id, seek, sk) {					// mouse over thumbnail in htm tab
    index = id
    over_thumb = true
    media = document.getElementById("media" + id)
    var sel = document.getElementById("sel" + id)
    if (selected.split(',').length == 2) {sel.href = "#MovePos#" + id + "#" + selected}
    var rect = media.getBoundingClientRect()				// play thumbnail video
    var yp = (e.clientY - rect.top) / (media.offsetHeight)
    if (media.currentTime <= seek || yp > 0.9) {media.currentTime = seek+0.1}
    media.playbackRate = 0.74
    media.style.opacity = 1
    scaleX = sk; scaleY=1
    media.play()}


  function play_media(event) {
    if (gesture) {return}						// false event from thumb moved
    media = player							// media assigned to modal
    last_type = type
    if (type) {close_media()}
    if (event == 'WheelDown') {index+=1}
    if (event == 'Mclick' && last_type && last_type != 'video' && xpos > 0.1) {index+=1}
    if (event == 'Mclick' && xpos < 0.1 && last_type != 'thumb') {index+=1}
    if (event == 'WheelUp') {index-=1}
    if (!over_thumb && !last_type) {index = last_id; event = 'Thumb'}	// play last media
    var Next = document.getElementById("media" + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}
    x = Next['onclick'].toString().split(","); x.pop(); x.pop()		// get next media arguments
    if (cap_list = x.pop().slice(0, -1).slice(2)) {cap.style.display='block'}
    skinny = 1*x.pop()
    newSkinny = skinny
    if (event != 'Thumb') {start = x.pop().trim()} else {x.pop()}
    type = x.pop().replaceAll('\'', '').trim()
    media.style.opacity = 0
    media.src = Next.src
    if (type == 'document') {return}
    if (type == "audio") {media.currentTime = 0; media.controls = true; sound == 'yes'; media.play()}
    if (type == "image") {media.poster = Next.poster}
    else if ((event == 'WheelUp' || event == 'WheelDown') && last_type == 'thumb') {type = 'thumb'}
    if (event == 'Mclick' && type == 'video' && xpos > 0.1) {type = 'thumb'}
    if (type == 'video' || type == 'thumb') {
      x = Next.poster.replace("/posters/", "/thumbs/")
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {
        if (event != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}
      else {media.poster = ""; setTimeout(function() {media.poster = x},600)}}
    if (type == "video") {setTimeout(function() {media.currentTime = start},20)}
    setTimeout(function() {media.style.opacity=1; if (type=='video') {media.play()}},120)
    scaleX = scaleY
    if (scaleY > 1.4) {
      scaleX = 1.4; scaleY = 1.4
      mediaY = window.innerHeight/2}
    scaleX *= skinny
    if (skinny != 1) {thin.innerHTML = Math.round(skinny*100)}
    next.innerHTML = index
    if (cap_list) {start -= 0.5}
    if (type != 'image') {speed.innerHTML = Math.round(media.playbackRate*100)}
    setTimeout(function() {document.querySelector("body").style.overflow="hidden"},300)
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    media.addEventListener('ended', media_ended)
    setTimeout(function(){block=0;wheel=0},300)
    mediaTimer = setInterval(timedEvents,84)
    thin.innerHTML = Math.round(skinny*100)
    container.style.opacity = 1
    container.style.zIndex = 20
    media.muted = false
    media.volume = 0
    looping = true
    block = 1}


  function close_media() {
    last_id = index
    last_start = media.currentTime
    if (skinny && skinny != newSkinny) {thin.click()}
    if (cap.value != cap.innerHTML) {capnav.click()}
    document.getElementById('title' + index).style.color = "lightsalmon"
    document.querySelector("body").style.overflow = "auto"
    media.removeEventListener('ended', media_ended)
    clearInterval(mediaTimer)
    container.style.zIndex = -1
    container.style.opacity = 0
    cap.style.display = 'none'
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    cap_time = 0
    media.poster = ''
    media.src =''
    closeNav()
    type = ''}


  function wheelEvents(e, ctr) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (block || wheel < 40) {return}
    var WheelDown = false
    var timer = 10
    if (e.deltaY > 0) {WheelDown = true}
    if (ctr == 'Thumb' || ctr == 'Thumbs') {				// thumb width 
      thumb = document.getElementById("thumb" + index)
      media = document.getElementById("media" + index)
      thumb_size = 1*thumb.style.width.slice(0,-2)
      if (WheelDown) {thumb_size += (thumb_size/40)}
      else if (thumb_size > 5) {thumb_size -= (thumb_size/40)}
      thumb_size = Math.round(10*thumb_size)/10
      if (thumb_size < 6) {thumb_size = 6}
      thumb.style.width = thumb_size + "em"
      media.style.width = thumb_size + "em"
      if (ctr == 'Thumbs') {
        thumbs.href = "#Thumbs#" + thumb_size
        for (i=1; i<41 ;i++) {
          if (el = document.getElementById("thumb" + i)) {
            el.style.width = thumb_size + 'em'
            document.getElementById("media" + i).style.width = thumb_size + 'em'}}}}
    if (ctr == 'Skinny') {						// media width
      if (WheelDown) {scaleX -= 0.002}
      else {scaleX += 0.002}
      newSkinny = Math.round(1000*scaleX / scaleY)/1000
      thin.innerHTML = Math.round(newSkinny*100)
      thin.href = "#Skinny#" + newSkinny + "#" + index +","
      if (newSkinny == 1) {timer = 146}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    if (ctr == 'Next') {						// media next
      if (WheelDown) {play_media('WheelDown')}
      else {play_media('WheelUp')}
      next.innerHTML = index
      timer = 440}
    if (ctr == 'Speed') {						// speed
      if (WheelDown) {rate = -0.01}
      else {rate = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || rate < 0)) {
        media.playbackRate += rate
        speed.innerHTML = Math.round(media.playbackRate *100)}
      timer = 40}
    if (xpos<0.1 && ypos>0.48 && type != 'image' && type != 'thumb') {	// seek
      if (media.paused == true) {interval = 0.04}
      else if (media.duration < 60) {interval = 2}
      else {interval = 10}
      if (WheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}
      timer = 200}
    else if (ctr == 'Magnify') {					// magnify
      if (WheelDown) {scaleX *= 1.02; scaleY *= 1.02; mediaY*=1.007}
      else {scaleX *= 0.98; scaleY *= 0.98; mediaY*=0.993}
      positionMedia()}
    setTimeout(function() {block=0;wheel=0},timer)
    wheel = 0; block = 1}


  function getThumb(e) {						// mouse over thumbsheet
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


  function Gesture(e) {							// mouse move over media
    var rect = container.getBoundingClientRect()
    xpos = (e.clientX - rect.left) / container.offsetWidth
    ypos = (e.clientY - rect.top) / container.offsetHeight
    if (mouse_down) {
      var x = Math.abs(Xref - e.clientX)
      var y =  Math.abs(Yref - e.clientY)
      if (!type) {mediaX = e.clientX; mediaY = e.clientY}
      if (x + y > 5) {
        if (!gesture && !type) {					// thumb moved in htm tab
          media.style.position = 'fixed'
          media.style.zIndex = Zindex += 1}
        gesture = true
        mediaY += e.clientY - Yref
        mediaX += e.clientX - Xref
        Xref = e.clientX
        Yref = e.clientY
        positionMedia()}}
    if (container.style.cursor != "crosshair") {
      container.style.cursor = "crosshair"
      setTimeout(function() {container.style.cursor="none"},244)}
    if (window.innerWidth > screen.width * 0.9) {
      media.style.marginLeft = '355px'}					// full screen mode
    else {media.style.marginLeft = 0}
    rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    if (ypos > 0.95 && xp > 0 && xp < 1 && !mouse_down && type == "video") {
      if (!seek_active) {media.pause(); seek_active = media.currentTime}
      if (media.paused) {
        var x = media.duration * xp 					// fast seek video
        if (xp < 0.98) {media.currentTime = x}}}
    else if (seek_active) {
      if (media.paused) {media.currentTime = seek_active}
      seek_active = 0}}


  function mouseDown(e) {						// over modal window
    mouse_down = true
    Xref = e.clientX
    Yref = e.clientY
    if (seek_active) {seek_active = media.currentTime; media.play()}}

  function mouseUp(e) {
    togglePause(e)
    setTimeout(function() {gesture=false},50)
    mouse_down=false}


  function togglePause(e) {
    if (!mouse_down || gesture || seek_active || over_cap) {return}
    if (xpos < 0.1 && ypos < 0.4) {return}
    if (type == "thumb") {getThumb(e); play_media('Thumb')}
    else if (media.paused) {
      media.play()} 
    else {media.pause()}}


  function toggleMute() {
    if (sound == "yes") {sound = "no"} else {sound = "yes"}
    sessionStorage.setItem("sound",sound)
    media.play()}


  function select(i) {							// highlight selections on page
    if (over_thumb) { return}
    index = i
    if (!(el = document.getElementById("title" + i))) {return}
    x = ',' + selected
    if (el.style.border == "0.1px solid lightsalmon") {
      el.style.border = "none"
      selected = x.replace("," + i + ",", ",").slice(1)}
    else {
      el.style.border = "0.1px solid lightsalmon"
      if (!x.match("," + i + ",")) {selected = selected + i + ","}}
    panel.innerHTML = ""
    if (selected) {panel.innerHTML=selected; panel.style.border = "0.1px solid #826858"}
    else  {panel.style.border = ""}}


  function media_ended(e) {						// loop or next
    media.style.animationName = ""
    if (!looping || type == "audio") {index +=1; play_media('Loop')}
    if (type == "video") {
      if (media.playbackRate > 0.60) {media.playbackRate -= 0.05}
      if (!mouse_down) {						// magnify and slow
        media.style.transition = 1.46 + "s"
        speed.innerHTML = Math.round(media.playbackRate *100)
        if (scaleX < 6) {scaleX+=0.4; scaleY+=0.4; mediaY*=1.1}
        media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
        media.style.top = mediaY
        setTimeout(function(){media.style.transition = 0 + "s"},100)}}
    media.play()}


  function Captions() {
    var t = Math.round(10*media.currentTime)/10
    var ptr = cap_list.indexOf('|'+ t + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ t-0.1 + '|')}
    if ((ptr > 0 && cap_time != t) || type == 'image') {
      cap_time = t
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop()
      cap.value = cap.innerHTML
      cap.style.opacity = 0.6
      media.pause()}
    else if (cap.innerHTML != 'New' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}  
    if (cap.value != cap.innerHTML) {
      newcap = cap.value + "|" + t + "|"
      if (!cap.value) {newcap = ''}
      capnav.href = "#Caption#" + newcap + "#" + index + ",#" + cap.innerHTML + "|" + t + "|"}}


  function positionMedia() {
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}


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
        link = link + "<a href=#" + "Path#" + start + "#" + selected + "#" + q + "><div>" + p + "</div>" + "</a>"}
      panel.innerHTML = link;}						// command # value # selected # address
    if (id == "myInput" && !selected) {					// alpha selected search terms
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
        link = link + "<a href=#" + "Search#" + q + "><div>" + p + "</div>" + "</a>"}
      panel.innerHTML = "<span style=\'grid-row-start:1; grid-row-end:3; color:red; font-size:2.2em\'>" + upper + "</span>" + link}}


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
    if (id =='slider2') {y = Math.floor(sort*x)+1; units = sort; sort = "Page"; of = " of "}
    if (current != "") {y = current}
    el.href= link + ".htm#" + sort + "#" + y
    if (sort =='Random' || sort =='ext' || sort =='Shuffle') {return}
    if (sort == 'Alpha') {y = String.fromCharCode(y)}
    el.innerHTML = y + of + units}


  function openNav() {
    nav.style.opacity = 0.7
    document.getElementById("myMp3").href = "#Mp3#" + Math.round(media.currentTime*100)/100 + "#" + index + ",#" + cue
    document.getElementById("myMp4").href = "#Mp4#" + Math.round(media.currentTime*100)/100 + "#" + index + ",#" + cue
    document.getElementById("myFav2").href = "#Favorite#" + Math.round(media.currentTime*10)/10 + "#" + index + ","}
  function closeNav() {nav.style.opacity = 0.3}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function setLinks() {
    document.getElementById("myDelete").href = "#Delete##" + selected	// media from htm page
    document.getElementById("myFav").href = "#Favorite##" + selected	// add link to 'new' playlist
    el = document.getElementById("title" + index)
    document.getElementById("myRename").href = "#Rename#" + el.value + "#" + index + ","
    thumb.load()}
  function selectAll() {for (i=1; i <= 300; i++) {select(i)}}
  function editCap() {cap.style.display='block'; cap.style.opacity=0.6; cap.innerHTML="New"; cap.focus()}
  function exitThumb(el) {over_thumb = false; if (media != player){el.pause(); if (!media.style.position) {el.style.opacity = 0}}}



</script>
                                        