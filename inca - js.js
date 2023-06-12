<script>

// can use cursor change to trigger inca location bar read eg, thumbs or list view
// random start times
// join function ??
// more intuitive mp3/4/cue conversions
// loop in out point

  var modal = document.getElementById('myModal')			// media player window
  var player = document.getElementById('myPlayer')
  var media = document.getElementById('media1')				// media element
  var path = document.getElementById('myPath')
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
  var Mute = document.getElementById('myMute')
  var sound = sessionStorage.getItem('sound')
  var last_id = sessionStorage.getItem('last_id')			// last top panel menu eg 'music'
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
  var page = 1
  var pages = 1
  var filt = 1								// filter or sort 
  var pos = 0								// top panel list pointer
  var type = ''								// audio, video, image, thumb, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = true							// play next or loop media
  var mouse_down = false
  var long_click = false
  var long_Mclick = false
  var theater = 0							// full window/fullscreen toggle
  var gesture = false
  var over_cap = false							// cursor over caption
  var over_thumb = false
  var thumb_size = 9
  var thumb = 0								// thumbsheet index
  var skinny = 1							// media width
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

  if (!sound) {sound='yes'}
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', Gesture)
  document.addEventListener('keydown', keyDown)


  function mouseDown(e) {
    if (e.button==1) {							// middle click
      e.preventDefault()
      setTimeout(function() {
        if(long_Mclick==true) {playMedia('Mclick')}},240) 		// show 6x6 thumbsheet
      if (cap_list && (over_cap || xw<0.1 || xm<0)) {nextCap()}		// next caption or next media
      else {playMedia('Mclick')}
      long_Mclick = true
      return}
    mouse_down = true
    long_click = false
    Xref = e.clientX							// for when moving thumb or media position
    Yref = e.clientY
    if (stat.matches(":hover")) {media_ended()}
    setTimeout(function() {
      if (mouse_down && !gesture) {
        long_click=true; 
        theater += 1							// full window/fullscreen toggle
        if (theater == 1) {
          playMedia('Click')
          modal.requestFullscreen()}
        if (theater > 2) {
          start = media.currentTime
          document.exitFullscreen()
          playMedia('')
          long_click = false
          theater=0}}},280)}


  function mouseUp(e) {
    if (!e.button) {
      if (!long_click && (over_thumb || type == "thumb")) {playMedia('Click')} else {togglePause(e)}
      if (seek_active) {media.currentTime=seek_active}			// bottom seeking trackbar
      if (cap.style.color=='red') {editCap()}}				// caption in edit mode
    gesture=false; long_Mclick=false; mouse_down=false}


  function keyDown(e) {
    var flag = false
    if (e.key == 'Enter') {if (inputbox.value) {messages = messages+'#SearchBox#'+inputbox.value+'##'; flag=true}}
    if (e.key == 'Pause' || e.key == 'Enter') {				// Pause is mouse Back button
      if (document.activeElement.id == 'myCap') {editCap()}
      var top = document.body.getBoundingClientRect().top
      if (!type && top < -90) {scroll(0,0); return}			// scroll to top of htm page
      if (type) {							// media was playing
        close_media()
        theater = 0
        document.body.style.overflow = "auto"
        modal.style.display = null					// close modal overlay
        flag = true}							// don't reset page
      if (hist) {messages = messages+'#History##'+hist+'#'; hist=''}	// add to media history list
      if (messages) {stat.href=messages; messages=''; stat.click()}	// send messages to inca.exe
      if (!flag) {location.reload()}}}					// just reset htm tab (clear selected etc.)


  function togglePause(e) {
    if (!mouse_down||long_click||gesture||seek_active||over_cap||!type
    ||nav.matches(":hover")||stat.matches(":hover")) {return}
    if (media.paused) {media.play()} else {media.pause()}}


  function timedEvents() {						// every ~84mS while media playing
    if (looping) {Loop.style.color='red'} else {Loop.style.color=null}
    if (sound=='no') {Mute.style.color='red'} else {Mute.style.color=null}
    time = Math.round(10*media.currentTime)/10
    if ((t=Math.round(time%60))<10) {t=':0'+t} else {t=':'+t}		// convert seconds to MMM:SS format
    if (!stat.matches(":hover")) {stat.innerHTML=Math.round(time/60)+t}
    if (media.duration) {interval = Math.ceil(10*media.duration/100)/10} // set seek interval
    if (media.paused) {interval = 0.04}
    mySkinny.innerHTML = Math.round(100*newSkinny)/100
    if (type == 'image') {stat.innerHTML = mySkinny.innerHTML}
    if (sound == 'yes' && media.volume <= 0.8) {media.volume += 0.2}	// fade sound in or out
    if (sound == 'no' && media.volume >= 0.2) {media.volume -= 0.2}
    positionMedia()
    Captions()}


  function overThumb(e, type, st, sx, cp, id) {				// mouse over thumbnail in browser tab
    if (mouse_down) {return}						// in case thumb slides over another thumb
    index = id								// htm page media id
    scaleY = 1
    scaleX = sx
    over_thumb = true
    media = document.getElementById('media' + id)
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / media.offsetWidth
    ym = (ypos - rect.top) / media.offsetHeight
    var sel = document.getElementById('sel' + id)
    if (selected) {sel.href = '#MovePos#' + id + '#' + selected + '#'}	// preload href for thumb position change in m3u list
    if (media.duration && ym>0.9) {media.currentTime = media.duration * xm; start = media.duration * xm}
    else if (media.currentTime <= st || ym<0.1) {start=st; media.currentTime = st + 0.1} // thumb in/out seek time
    media.playbackRate = 0.74						// play thumb slower
    media.play()}


  function exitThumb(e, el) {
    if (!mouse_down) {over_thumb = false}
    if (ym < 0.9 || media.style.position!='fixed') {el.pause()}}


  function playMedia(e) {
    if (gesture) {return}
    if (selected && path.href.slice(27).match('/inca/')) {return}	// moving thumb position within a playlist
    if (path.href.slice(27).match('/inca/music/')) {looping=false}	// default to not loop music playlist
    if (e=='Click' && type=='thumb') {
      if (xm > 0 && xm < 1 && ym > 0 && ym < 1) {			// mouse over thumbsheet
        var row = Math.floor(ym * 6)					// derive media seek time from mouse xy
        var col = Math.ceil(xm * 6)
        var offset = 0
        thumb = 5 * ((row * 6) + col)
        thumb = (thumb - 1) / 200
        if (media.duration > 60) {offset = 20}
        start = offset - (thumb * offset) + media.duration * thumb}
      else {start = last_start}}
    media.pause()							// pause browser tab thumb
    media = player							// media assigned to modal
    last_type = type
    if (type) {close_media()}						// no type if no media playing
    if (long_Mclick) {index-=3; start=0}
    if (e == 'Loop') {index+=1; start=0}
    if ((e == 'Mclick' && last_type && last_type != 'video') || xw<0.1 || xm<0) {index+=1; start=0}
    if (!over_thumb && !last_type) {index=last_index; start=last_start; e='Thumb'}	// play last media
    var Next = document.getElementById("media" + index)
    if (!Next) {index = 1; Next = document.getElementById('media1')}	// end of list, return to first media
    x = Next['onmouseover'].toString().split(","); x.pop()		// get next media arguments
    if (cap_list = x.pop().slice(0, -1).slice(2)) {cap.style.display='block'}	// if caption exists
    skinny = 1*x.pop()							// saved media width
    newSkinny = skinny
    if (!start && e != 'Thumb') {start = x.pop().trim()} else {x.pop()}	// use parameters for start time
    type = x.pop().replaceAll('\'', '').trim()				// eg video, image, thumbsheet
    media.style.opacity = 0						// prevent flashing
    media.src = Next.src
    if (type == 'document') {return}
    if (type == "image") {media.poster = Next.poster}
    if (e == 'Mclick' && type == 'video') {type = 'thumb'}
    if (e == 'Mclick' && type == 'thumb' && (xw<0.1 || xm<0)) {type = 'video'}
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
    if (long_click && !theater) {start = 0}
    if (type == "video" || type == "audio") {media.currentTime = start-0.2}
    if (type == "audio") {media.controls = true; sound == 'yes'}
    mediaX = sessionStorage.getItem('mediaX')*1
    mediaY = sessionStorage.getItem('mediaY')*1				// last media position on screen
    scaleX = scaleY
    if (scaleY > 1.4) {scaleX = 1.4; scaleY = 1.4}			// keep media within window
    if (scaleY < 0.6) {scaleX = 0.6; scaleY = 0.6}
    if (!mediaY || mediaY < 100 || mediaY > innerHeight*0.8) {mediaY = innerHeight/2}
    if (!mediaX || mediaX < 100 || mediaX > innerWidth*0.8) {mediaX = innerWidth/2.6}
    scaleX *= skinny
    setTimeout(function() {
      document.body.style.overflow="hidden"
      positionMedia()
      media.style.opacity = 1
      if (type != 'thumb') {media.playbackRate=rate; media.play()}},260)
    media.style.width=null
    media.style.height=null
    media.style.maxWidth = innerWidth * 0.7 + "px"
    media.style.maxHeight = innerHeight * 0.8 + "px"
    media.addEventListener('ended', media_ended)
    mediaTimer = setInterval(timedEvents,84)
    modal.style.display='flex'
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
    media.removeEventListener('ended', media_ended)
    clearInterval(mediaTimer)
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
      if (wheelDown) {filt++} else if (filt) {filt--}
      if (filt > 5) {filt = 5}
      var z = ['Duration','Date','Alpha','Size','Ext','Shuffle']
      sort = z[filt]
      el.href = '#'+sort+'#'+sort+'##'
      el.innerHTML = sort
      block = 200}
    else if (id == 'myFilt') {
      if (wheelDown) {filt++} else if (filt) {filt--}			// search filter
      filter()}
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
        media.playbackRate += x
        stat.innerHTML=Math.round(media.playbackRate *100)}}
    else if (type && type != 'image' && (xm<0||xm>1||ym<0||xw<0.1||xw>0.9||yw<0.1||yw>0.85)) {	 // seek
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
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / (media.offsetWidth*scaleX)
    ym = (ypos - rect.top) / (media.offsetHeight*scaleY)
    if (mouse_down && !long_click) {
      if (!gesture && !type && over_thumb) {
        mediaX = rect.left + (media.offsetWidth * scaleX/2)
        mediaY = rect.top + (media.offsetHeight * scaleY/2)}
      if (Math.abs(Xref - xpos) + Math.abs(Yref - ypos) > 5) {		// gesture detection (mousedown + slide)
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
      setTimeout(function() {modal.style.cursor = 'none'},244)}
    if (xm<0||xm>1||ym<0||xw>0.9||xw<0.1||yw<0.1||yw>0.85) {
      if (!stat.matches(":hover")) {stat.style.opacity=null}
      if (type == 'video' || type == 'audio') {seekbar.style.opacity = 0.6}}
    else {seekbar.style.opacity = null; stat.style.opacity = 0}
    if (!nav.matches(":hover") && type == 'video' && xm>0 && xm<1 && yw>0.85) {
      seek_active = media.duration * xm
      seek.style.opacity = 1
      seek.style.left = xpos - seek.offsetWidth/2 + 'px'		// seek thumbnail
      seek.style.top = innerHeight -100 + "px"
      seek.currentTime = seek_active}
    else {seek_active = 0; seek.style.opacity = 0}}


  function positionMedia() {
    if (screenLeft) {x=0; y=0; Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
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
    if (theater > 1) {									// full screen mode
      media.style.maxWidth = innerWidth + "px"
      media.style.maxHeight = innerHeight + "px"
      if (media.offsetWidth/media.offsetHeight > 1)
        {media.style.width = innerWidth + "px"; mediaX=innerWidth/2}
      else {media.style.height = innerHeight + "px"; mediaY=innerHeight/2}
      if (!screenLeft) {mediaX=innerWidth/2; mediaY=innerHeight/2; mediaX-=Xoff; mediaY-=Yoff}}}


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


  function spool(e, id, input, to, so, fi, pa, ps, ts, rt) {		// spool lists into top htm panel
    if (mouse_down || id=='myModal') {return}				// in case sliding thumbs over panel
    if (id) {panel.style.opacity = 1}
    if (input) {ini=input; toggles=to; sort=so; filt=fi; page=pa; pages=ps; thumb_size=ts; rate=rt} // from inca.exe
    if (!last_id) {last_id = 'Folders'}
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

  function openNav() {
    document.getElementById('myMp3').href = '#mp3#' + time + '#' + index + ',#' + cue
    document.getElementById('myMp4').href = '#mp4#' + time + '#' + index + ',#' + cue
    document.getElementById('myFav').href = '#Favorite#' + time + '#' + index + ',#'}

  function loop() {if (looping) {looping = false} else {looping = true}}

  function selectAll() {for (i=1; i <= 600; i++) {select(i)}}

  function rename() {release(); document.getElementById('myRename').href='#Rename#'+inputbox.value.replace(/ /g, "%20")+'#'+selected+'#'}
  function del() {release(); document.getElementById('myDelete').href='#Delete##'+selected+'#'}

  function mute() {
    if (sound == "yes") {sound="no"} else {sound="yes"}
    sessionStorage.setItem("sound",sound); media.play()}

  function editCap() {							// edit caption
    if (!time) {time = '0.0'}
    if (cap.value && cap.value != cap.innerHTML) {
      newcap = cap.value + "|" + time + "|"
      messages = messages + '#Caption#' + newcap + '#' + index + ',#' + cap.innerHTML + '|' + time + '|'}
    cap.style.display='block'
    cap.style.opacity=0.6
    cap.value = '-'
    cap.innerHTML = '-'
    cap.focus()}

  function nextCap() {							// seek to next caption in movie
    var z = cap_list.split('|')
    for (x of z) {if (!isNaN(x) && x>(media.currentTime+0.2)) {media.currentTime = x-0.8; media.play(); return}}
    playMedia('Mclick')}

  function Captions() {							// display captions
    if (document.activeElement.id == 'myCap') {cap.style.color='red'; return}
    else {cap.style.color=null}
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
