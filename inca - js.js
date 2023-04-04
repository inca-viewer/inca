<script>

// compliance firefox, brave, edge and opera
// have buttons on modal for next caption/favorite cut points
// firefox cannot position move thumbs when over thumb
// make view change css change only not reload tab
// mclick view change
// mpv player default click and as good as internal one
// default speed
// thumb size on side nav individual and all down to list
// reverse order of top menu, make static
// get rid of all buttons - fol, fav, sub etc, use wheel
// top button on side nav

// top page - page = bottom
// filter - duration etc
// thumbs down to list
// controls, fol, sub, slides, music, search



  var modal = document.getElementById('myModal')			// media player window
  var player = document.getElementById('myPlayer')
  var inputbox = document.getElementById('myInput')
  var panel = document.getElementById('myPanel')			// list of folders, playlists etc
  var nav = document.getElementById('mySidenav')			// nav buttons over htm tab
  var stat = document.getElementById('myStatus')			// also href messages to inca.exe
  var speed = document.getElementById('mySpeed')
  var thin = document.getElementById('myThin')				// media width
  var next = document.getElementById('myNext')
  var thumbs = document.getElementById('myThumbs')			// thumbnail size
  var cap = document.getElementById('myCap')				// caption textarea element
  var capnav = document.getElementById('myCapnav')			// caption save button
  var seekbar = document.getElementById('mySeekBar')
  var seek = document.getElementById('mySeek')
  var sound = sessionStorage.getItem('sound')				// remember sound setting
  var wheel = 0								// mouse wheel count
  var long_click = false
  var block = 0								// block wheel input
  var last_id
  var start = 0								// video start time
  var last_start
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
  var alpha = 77							// alpha search start with 'M'
  var cue = 0
  var looping = true
  var scaleX = 1
  var scaleY = 1
  var Xref
  var Yref
  var Zindex = 1
  var xpos = 0.5
  var ypos = 0.5
  var media = document.getElementById('media1')				// current media element
  var mediaY = window.innerHeight/2					// centre of media player
  var mediaX = window.innerWidth/2.6
  var lastX = mediaX
  var lastY = mediaY
  var list_id = 0


  document.addEventListener('auxclick', playMedia)			// middle click
  document.addEventListener('keydown', mouseBack)			// mouse Back button
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', Gesture)


  function spool(e, ini) {						// spool lists into top html panel
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (wheel < 200) {return}
    wheel = 0
    if (e.deltaY < 0 && list_id) {list_id--}
    else if (e.deltaY > 0 && list_id < 32) {list_id++}
    list = ['Menu','Fav','Fol','Slides','Music','A','B','C','D','E','F','G','H','I','J',
      'K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Settings']
    var id = list[list_id]
    var content = "<span style=\'grid-row-start:1; grid-row-end:3; color:red; font-size:2.2em\'>"+id+"</span>"
    ini = ini.split('=')

    if(!list_id) {
      var z = ini[list_id].split('|')
      var r = ''
      for (const x of z) {
        p = x.substring(0, 14)
        q = x.replace(/ /g, "%20")
        if (p == 'Join') {r = " id=\'myJoin\'"}
        if (p == 'Rename') {r = " id=\'myRename\'"}
        if (p == 'Delete') {r = " id=\'myDelete\'"}
        if (p == 'Select') {r = " onclick=\'selectAll()\'"}
        content = content + '<a href=#' + q + '## ' + r + '><div>' + p + '</div></a>'}}

    else if (list_id < 5) {
      var z = ini[list_id].split('|')
      for (x of z) {
        y = x.split("/")
        p = y.pop()
        if (id == "Music" || id == "Slides") {q = x.replace(p, ""); p = p.replace(/.m3u/g, "")}
        else {p = y.pop()}
        p = p.substring(0, 12)
        title = document.title.replace(/Inca - /g, "")
        if (p == title) {p = "<span style=\"color:lightsalmon\"</span>" + p}
        if (p == "New") {p = "<span style=\"color:red\"</span>" + p}
        q = x.replace(/ /g, "%20")
        content = content + '<a href=#Path#' + start + '#' + selected + '#' + q + '><div>' + p + '</div></a>'}}

    else if (list_id > 4) {
      var z = ini[6].split('|')
      z.sort()
      const y = z.filter(z => z.startsWith(id))
      for (const x of y) {
        p = x.substring(0, 14)
        q = x.replace(/ /g, "%20")
        content = content + '<a href=#Search#' + q + '##><div>' + p + '</div></a>'}}

    panel.innerHTML = content}





  function timedEvents() {						// every ~84mS while media playing
    Captions()
    if (sound == 'yes' && media.volume <= 0.8) {media.volume += 0.2}
    if (sound == 'no' && media.volume >= 0.2) {media.volume -= 0.2}
    cap.style.top = mediaY + (scaleY*media.offsetHeight/2) + 10 + "px"
    cap.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
    seekbar.style.width = (scaleX * media.offsetWidth * media.currentTime / media.duration) + "px"
    positionMedia()
    if (window.innerWidth > screen.width * 0.9) {
      media.style.marginLeft = '355px'; seekbar.style.marginLeft = '355px'}	// full screen mode
    else {media.style.marginLeft = 0; seekbar.style.marginLeft = 0}}


  function overThumb(e, id, strt, sk) {					// mouse over thumbnail in browser tab
    if (mouse_down) {return}
    index = id
    over_thumb = true
    var sel = document.getElementById('sel' + id)
    if (selected && media.style.position != 'fixed') {sel.href = '#MovePos#' + id + '#' + selected + '#'}
    media = document.getElementById('media' + id)
    var rect = media.getBoundingClientRect()
    var xp = (e.clientX - rect.left) / (media.offsetWidth)
    var yp = (e.clientY - rect.top) / (media.offsetHeight)
    if (media.duration && yp > 0.9) {media.currentTime = media.duration *xp}
    if (media.currentTime <= strt || yp < 0.1) {media.currentTime = strt +0.1}
    media.style.transition = '0.1s'
    media.playbackRate = 0.74						// play thumbnail video
    scaleX = sk; scaleY=1
    seek.src = media.src
    media.play()}


  function playMedia(e) {
    if (e.button == 1) {e.preventDefault(); e = 'Mclick'}
    else if (e.button) {return}
    if (gesture) {return}
    media.pause()							// pause htm tab thumb
    media = player							// media assigned to modal
    last_type = type
    if (type) {close_media()}
    if (e == 'Next') {index+=1}
    if (e == 'Previous') {index-=1}
    if (e == 'Mclick' && last_type && last_type != 'video' && xpos > 0.1) {index+=1}
    if (e == 'Mclick' && xpos < 0.1 && last_type != 'thumb') {index+=1}
    if (!over_thumb && !last_type) {index = last_id; e = 'Thumb'}	// play last media
    var Next = document.getElementById("media" + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}
    x = Next['onclick'].toString().split(","); x.pop(); x.pop()		// get next media arguments
    if (cap_list = x.pop().slice(0, -1).slice(2)) {cap.style.display='block'}
    skinny = 1*x.pop()
    newSkinny = skinny
    if (e != 'Thumb') {start = x.pop().trim()} else {x.pop()}
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
        if (e != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}
      else {media.poster = ''; setTimeout(function() {media.poster = x},600)}}
    if (long_click) {start = 0}
    if (type == "video" || type == "audio") {media.currentTime = start - 0.6}
if (type == "audio") {media.controls = true; sound == 'yes'; media.playbackRate=0.94; media.play()}
    setTimeout(function() {media.style.opacity=1; if (type=='video') {media.play()}},120)
    mediaX = lastX; mediaY = lastY
    scaleX = scaleY
    if (scaleY > 1.4) {
      scaleX = 1.4; scaleY = 1.4
      mediaY = window.innerHeight/2}
    scaleX *= skinny
    stat.innerHTML = index
    if (cap_list) {start -= 0.5}
    setTimeout(function() {document.body.style.overflow="hidden"},300)
    media.style.maxWidth = window.innerWidth * 0.6 + "px"
    media.style.maxHeight = window.innerHeight * 0.7 + "px"
    media.addEventListener('ended', media_ended)
    setTimeout(function(){block=0;wheel=0},400)
    mediaTimer = setInterval(timedEvents,84)
    modal.style.opacity = 1
    modal.style.zIndex = 20
    seek.src = media.src
    media.muted = false
    media.volume = 0
    looping = true
    block = 1}


  function close_media() {
    last_id = index
    last_start = media.currentTime
    if (skinny && skinny != newSkinny) {
      messages = messages + '#Skinny#' + newSkinny + '#' + index + ',#'}
    if (cap.value != cap.innerHTML) {capnav.click()}
    document.getElementById('title' + index).style.color = "lightsalmon"
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
    lastX = mediaX
    lastY = mediaY
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
      thumb_size = 1*thumb.style.width.slice(0,-2)
      if (WheelDown) {thumb_size += (thumb_size/40)}
      else if (thumb_size > 3) {thumb_size -= (thumb_size/40)}
      thumb_size = Math.round(10*thumb_size)/10
      if (thumb_size < 4) {thumb_size = 4}
      thumb.style.width = thumb_size + "em"
      media.style.width = thumb_size + "em"
      if (ctr == 'Thumbs') {
        thumbs.href = "#Thumbs#" + thumb_size +'##'
        for (i=1; i<41 ;i++) {
          if (el = document.getElementById("thumb" + i)) {
            el.style.width = thumb_size + 'em'
            document.getElementById("media" + i).style.width = thumb_size + 'em'}}}}
    else if (ctr == 'Skinny') {						// media width
      if (WheelDown) {scaleX -= 0.002}
      else {scaleX += 0.002}
      newSkinny = Math.round(1000*scaleX / scaleY)/1000
      stat.innerHTML = Math.round(newSkinny*100)
      if (newSkinny == 1) {timer = 146}
      media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}
    else if (ctr == 'Next') {						// media next
      if (WheelDown) {playMedia('Next')}
      else {playMedia('Previous')}
      stat.innerHTML = index
      timer = 440}
    else if (ctr == 'Speed' || xpos < 0.1) {				// speed
      if (WheelDown) {rate = -0.01}
      else {rate = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || rate < 0)) {
        media.playbackRate += rate
        stat.innerHTML = Math.round(media.playbackRate *100)}
      timer = 40}
    else if (ypos > 0.75 && type != 'image' && type != 'thumb') {	// seek
      if (media.paused == true) {interval = 5}
      else if (media.duration < 91) {interval = 30}
      else {interval = 300}
      interval *= Math.abs(ypos - 0.75)
      if (WheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}
      timer = 200}
    else if (ctr == 'Magnify') {					// magnify
      if (WheelDown) {scaleX *= 1.015; scaleY *= 1.015; mediaY*=1.005}
      else {scaleX *= 0.98; scaleY *= 0.98; mediaY*=0.993}
      positionMedia()}
    setTimeout(function() {block=0;wheel=0},timer)
    wheel = 0; block = 1}


  function Gesture(e) {							// mouse move
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
        if (!gesture && !type && over_thumb) {				// thumb moved in htm tab
          if (media.style.position != 'fixed') {
            x = ',' + selected
            if (!x.match("," + index + ",")) {selected = selected + index + ","}
            messages = '#History##' + selected + '#'
            panel.innerHTML = selected}
          media.style.opacity = 1
          media.style.position = 'fixed'
          media.style.zIndex = Zindex += 1}
        gesture = true
        mediaY += e.clientY - Yref
        mediaX += e.clientX - Xref
        Xref = e.clientX
        Yref = e.clientY
        positionMedia()}}
    if (type && modal.style.cursor != "crosshair") {
      modal.style.cursor = "crosshair"
      setTimeout(function() {modal.style.cursor="none"},244)}
    var xp = (e.clientX - rect.left) / (media.offsetWidth * scaleX)
    seek.style.bottom = 50 +'px'	
    seek.style.left = e.clientX -80 +'px'
    seekbar.style.left = mediaX - (scaleX*media.offsetWidth / 2) + "px"
    if (type == "video") {
      if (ypos > 0.75) {seekbar.style.top = window.innerHeight - 12 + 'px'}
      else {seekbar.style.top = window.innerHeight - 3 + 'px'}}
    else {seekbar.style.top = window.innerHeight + 50 + 'px'}
    if (ypos > 0.9 && xp > 0 && xp < 1 && !mouse_down && type == 'video') { 	// fast seek video
      seek_active = media.duration * xp
      seek.style.opacity = 1
      if (xp < 0.98) {seek.currentTime = seek_active}}
    else {seek_active = false; seek.style.opacity = 0}}


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


  function mouseDown(e) {
    if (e.button != 0) {e.preventDefault(); return}			// middle click
    mouse_down = true
    long_click = false
    Xref = e.clientX
    Yref = e.clientY
    media.style.transition = '0.1s'
    setTimeout(function(){
      if (mouse_down && !gesture) {long_click=true; media_ended()}},340)
    if (seek_active) {media.currentTime = seek_active; media.play()}}


  function mouseUp(e) {
    togglePause(e) 
    setTimeout(function() {gesture=false},50)
    mouse_down=false}


  function togglePause(e) {
    if (!mouse_down || gesture || seek_active || over_cap || !type || long_click) {return}
    if (xpos < 0.1 && ypos > 0.5) {return}
    if (type == "thumb") {getThumb(e); playMedia('Thumb')}
    else if (media.paused) {
      media.play()} 
    else {media.pause()}}


  function mouseBack(e) {
    if (e.key != 'Pause') {return}					// inca.exe re-map mouse Back button
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
    if (xpos > 0.1) {return}
    if (media.playbackRate > 0.40) {media.playbackRate -= 0.05}		// magnify and slow
    media.style.transition = '1.46s'
    stat.innerHTML = Math.round(media.playbackRate *100)
    scaleX+=0.15; scaleY+=0.15; mediaY*=1.05
    media.style.transform = "scale(" + scaleX + "," + scaleY + ")"
    media.style.top = mediaY
    setTimeout(function() {media.style.transition = '0s'},300)}


  function select(i) {							// highlight selections on page
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
      capnav.href = '#Caption#' + newcap + '#' + index + ',#' + cap.innerHTML + '|' + t + '|'}}


  function toggleMute() {
    if (sound == "yes") {sound = "no"} else {sound = "yes"}
    sessionStorage.setItem("sound",sound)
    media.play()}


  function positionMedia() {
    media.style.top = mediaY - (media.offsetHeight / 2) + "px"
    media.style.left = mediaX - (media.offsetWidth / 2) + "px"
    media.style.transform = "scale(" + scaleX + "," + scaleY + ")"}




  function spool2(e, id, input) {					// spool lists into top html panel
    e.preventDefault()
    e.stopPropagation()
    var content = ''
    const z = input.split('|')
    var el = document.getElementById(id)
    panel.style.direction = ''
    if (id == "Fol" || id == "Fav" || id == "Sub" || id == "Music" || id == "Slides") {
      for (x of z) {
        y = x.split("/")
        p = y.pop()
        if (id == "Music" || id == "Slides") {
          q = x.replace(p, "")}
        else {p = y.pop()}		// folder name
        p = p.replace(/.m3u/g, "")					// remove .m3u - (leave just name)
        p = p.substring(0, 12)
        title = document.title.replace(/Inca - /g, "")
        if (p == title) {p = "<span style=\"color:lightsalmon\"</span>" + p}
        if (p == "New") {p = "<span style=\"color:red\"</span>" + p}
        q = x.replace(/ /g, "%20")
        content = content + '<a href=#Path#' + start + '#' + selected + '#' + q + '><div>' + p + '</div></a>'}
      panel.innerHTML = content}					// command # value # selected # address
    else if ((id == "myInput" || id == "myPanel") && !selected) {	// alpha selected search terms
      wheel += Math.abs(e.deltaY)
      if (wheel < 140) {return}
      wheel = 0
      if (alpha > 65 && e.deltaY < 0) {alpha--}
      else if (alpha < 90 && e.deltaY > 0) {alpha++}
      var x = String.fromCharCode(alpha)
      z.sort()
      const y = z.filter(z => z.startsWith(x))
      for (const x of y) {
        p = x.substring(0, 14)
        q = x.replace(/ /g, "%20")
        content = content + '<a href=#Search#' + q + '##><div>' + p + '</div></a>'}
      id = x}
    else {id = ''}
    panel.innerHTML = "<span style=\'grid-row-start:1; grid-row-end:3; color:red; font-size:2.2em\'>" + id + "</span>" + content}


  function getCoords(event, id, sort, link, current) {			// selection sliders
    var x = ''
    var of = ''
    var units = ''
    var el = document.getElementById(id)
    var xpos = (event.clientX - el.offsetLeft - el.scrollLeft)/el.offsetWidth
    if (sort == 'Alpha') {x = Math.floor(26.9 * xpos) + 64}
    if (sort == 'Size') {x = Math.floor(100 * xpos) * 10;units = "Mb +"}
    if (sort == 'Date') {x = Math.floor(37 * xpos);units = "months +"}
    if (sort == 'Duration') {x = Math.floor(60 * xpos);units = "minutes +"}
    if (id =='slider2') {x = Math.floor(sort*xpos)+1; units = sort; sort = "Page"; of = " of "}
    if (current != "") {x = current}
    el.href= link + '.htm#' + sort + '#' + x + '##'
    if (sort =='Random' || sort =='ext' || sort =='Shuffle') {return}
    if (sort == 'Alpha') {x = String.fromCharCode(x)}
    el.innerHTML = x + of + units}


  function openNav() {
    nav.style.opacity = 0.7
    var time = Math.round(media.currentTime*100)/100
    document.getElementById('myMp3').href = '#Mp3#' + time + '#' + index + ',#' + cue
    document.getElementById('myMp4').href = '#Mp4#' + time + '#' + index + ',#' + cue
    document.getElementById('myFav').href = '#Favorite#' + time + '#' + index + ',#'}
  function closeNav() {nav.style.opacity = 0.3}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function getLinks() {
    document.getElementById("myJoin").href = '#Join##' + selected + '#'
    document.getElementById("myRename").href = '#Rename#' + inputbox.value + '#' + selected + '#'
    document.getElementById("myDelete").href = '#Delete##' + selected + '#'
    var x = selected.split(',')						// release media 
    for (var i = 0; i < x.length; i++) {document.getElementById('media' + x[i]).load()}}
  function selectAll() {for (i=1; i <= 600; i++) {select(i)}}
  function editCap() {cap.style.display='block'; cap.style.opacity=0.6; cap.innerHTML='New'; cap.focus()}
  function exitThumb(el) {if(!mouse_down) {over_thumb = false}; if (media != player){el.pause()}}


</script>
                                        