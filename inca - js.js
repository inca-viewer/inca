<script>

// can use cursor change to trigger inca location bar read eg, thumbs or list view
// join function ??
// loop in out point
// reconsider using backspace as reset page instead of default?
// media not closing


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
  var mediaX = 0							// centre of media player
  var mediaY = 0
  var scaleX = 1							// skinny & magnify factor
  var scaleY = 1
  var Xref								// last cursor coordinate
  var Yref
  var idx

  if (!sound) {sound='yes'}
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('mousemove', Gesture)
  document.addEventListener('keydown', keyDown)
  function timedEvents() {positionMedia(); Captions()}			// every ~84mS while media playing
    
    
  function mouseDown(e) {
    if (e.button==1) {							// middle click
      e.preventDefault()
      setTimeout(function() {if(long_click) {playMedia('Mclick')}},240) // goto previous media
      nextCap()								// next caption (or next media)
      long_click = true
      return}
    setTimeout(function() {if(mouse_down) {long_click=true}},200)
    long_click=false
    mouse_down = true
    Xref = e.clientX							// for when moving thumb or media position
    Yref = e.clientY}


  function mouseUp(e) {							// !! inca.exe triggers mouseup on long click
    if (!e.button) {					
      if (seek_active && type == 'image') {index = idx; playMedia('')}	// seek thumbnail under media
      else if (seek_active && type == 'video' && long_click) {media.currentTime=seek_active}
      else if (cap.style.color=='red') {editCap()}			// caption in edit mode
      else if (over_thumb || type == 'thumb') {playMedia('Click')} else {togglePause(e)}}
    gesture=false; mouse_down=false; long_click=false; seek.style.opacity=0}


  function keyDown(e) {
    var flag = false
    if (e.key == 'Enter') {if (inputbox.value) {messages = messages+'#SearchBox#'+inputbox.value+'##'; flag=true}}
    if (e.key == 'Pause' || e.key == 'Enter') {				// Pause is mouse Back button
      var top = document.body.getBoundingClientRect().top
      if (!type && top < -90) {scroll(0,0); return}			// scroll to top of htm page
      if (type) {							// media was playing
        seek_active = 0
        media.style.opacity=0
        stat.style.display='none'
        seekbar.style.display='none'
        document.body.style.overflow = "auto"
        if (cap.style.color=='red') {editCap()}
        close_media()
        setTimeout(function() {document.exitFullscreen()},50)
        setTimeout(function() {modal.style.display='none'; window.scrollTo(0, scroll_Y)},400)	// browser cannot remember ??
        flag = true}							// don't reset page
      if (hist) {messages = messages+'#History##'+hist+'#'; hist=''}	// add to media history list
      if (messages) {stat.href=messages; messages=''; stat.click()}	// send messages to inca.exe
      if (!flag) {location.reload()}}}					// just reset htm tab (clear selected etc.)


  function togglePause(e) {
    if (!type||!mouse_down||gesture||over_cap||long_click||nav.matches(":hover")) {return}
    if (media.paused) {media.play()} else {media.pause()}}


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
    if (media.duration && ym>0.9 && ym<1.1) {media.currentTime = media.duration * xm; start = media.duration * xm}
    else if (media.currentTime <= st || ym<0.1) {start=st; media.currentTime = st + 0.1} // thumb in/out seek time
    media.playbackRate = 0.74						// play thumb slower
    media.play()}


  function exitThumb(e, el) {
    if (!mouse_down) {over_thumb = false}
    if (ym < 0.9 || media.style.position!='fixed') {el.pause()}}


  function playMedia(e) {
    if (gesture) {return}
    if (selected && path.href.slice(27).match('/inca/')) {return}	// moving thumb position within a playlist
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
    else {scroll_Y = window.scrollY}
    if (e == 'Mclick' && long_click) {index-=3}
    if (e == 'Loop') {index+=1; start=0}
    if (e == 'Mclick' && (last_type && last_type != 'video' || yw>0.85)) {index+=1; start=0}
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
    if (type == 'document' || type == 'm3u') {type=''; return}
    if (type == "image") {media.poster = Next.poster}
    if (e == 'Mclick' && type == 'video') {type = 'thumb'}
    if (e == 'Mclick' && type == 'thumb' && yw>0.85) {type = 'video'}
    if (type == 'video' || type == 'thumb') {
      x = Next.poster.replace("/posters/", "/thumbs/")			// get start time from filename
      p = x.split('%20')
      p = p.pop()
      p = p.replace('.jpg', '')
      if (!isNaN(p) && p.length > 2 && p.includes('.')) {		// very likely a suffix timestamp
        if (!start && e != 'Thumb') {start = p}
        x = x.replace('%20' + p, '')}
      if (type == "thumb") {media.poster = x}				// show 6x6 thumbsheet
      else {media.poster = ''; setTimeout(function() {media.poster = x},600)}} // stops flickering poster
    if (type == "video" || type == "audio") {media.currentTime = start-0.2}
    if (type == "audio") {media.controls = true; sound == 'yes'}
    mediaX = sessionStorage.getItem('mediaX')*1				// last media position
    mediaY = sessionStorage.getItem('mediaY')*1
    scaleX = scaleY
    if (scaleX > 1.4) {scaleX = 1.4; scaleY = 1.4}			// keep media within view
    if (scaleX < 0.6) {scaleX = 0.6; scaleY = 0.6}
    if (!mediaX || mediaX < 0 || mediaX > innerWidth) {mediaX = screen.width/2}
    if (!mediaY || mediaY < 0 || mediaY > innerHeight) {mediaY = screen.height/2}
    scaleX *= skinny
    setTimeout(function() {
      if (path.href.slice(27).match('/inca/music/') || type=='audio') {looping=false}
      else {modal.requestFullscreen()}
      if (type != 'thumb') {media.playbackRate=rate; media.play()}},200)
    setTimeout(function() {
      media.style.opacity=1
      stat.style.display='block'
      seekbar.style.display='block'},260)
    document.body.style.overflow="hidden"
    modal.style.display='flex'
    media.style.maxWidth = screen.width/1.8 + "px"
    media.style.maxHeight = screen.height/1.4 + "px"
    media.addEventListener('ended', media_ended)
    mediaTimer = setInterval(timedEvents,84)
    seek.poster = media.poster
    stat.innerHTML = index
    seek.src = media.src						// seek thumbnail under video
    media.muted = false
    idx = index								// seek image index
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
    cap.style.color = null
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    media.poster = ''
    media.src =''
    cap_time = 0
    type = ''
    cue = 0}


  function wheelEvents(e, id, el, input) {
    if (id == 'Fixed' && media.style.position != 'fixed') {return}
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (wheel < block) {return}
    var wheelDown = false
    block = 120
    if (type != 'image')    {seek.style.opacity = 0}			// don't fade seek thumb on wheel
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
      else {block = 20}
      media.style.transform = "scale("+scaleX+","+scaleY+")"}
    else if (id=='myStatus') {						// speed
      if (wheelDown) {x = -0.01}
      else {x = 0.01}
      if (type != 'image' && (media.playbackRate < 1 || x < 0)) {
        media.playbackRate += x
        stat.innerHTML=Math.round(media.playbackRate *100)}}
    else if ((xm<0 || xw<0.1 || yw>0.85) && (type=='video' || type=='audio')) {	// seek
      if (wheelDown) {media.currentTime += interval}
      else  {media.currentTime -= interval}}
    else if (type == 'image' && yw>0.85) {				// image seek thumb
      if (wheelDown) {idx +=1} else {idx -=1}
      var Next = document.getElementById("media" + idx)
      if (!Next) {idx = 1; Next = document.getElementById('media1')}
      seek.poster = Next.poster}
    else if (type) {							// magnify
      if (wheelDown) {scaleX *= 1.015; scaleY *= 1.015}
      else {scaleX *= 0.985; scaleY *= 0.985}
      if (xm>0 && xm<1 && ym>0 && ym<1) {				// over image, zoom at cursor
        if (wheelDown) {mediaX += (mediaX-xpos)/66; mediaY += (mediaY-ypos)/66}
        else {mediaX -= (mediaX-xpos)/66; mediaY -= (mediaY-ypos)/66}}
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
    if (mouse_down) {
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
    if (!type) {return}
    if (modal.style.cursor != "crosshair") {
      modal.style.cursor = "crosshair"
      setTimeout(function() {modal.style.cursor = 'none'},244)}
    if (yw>0.85 && xm>-0.05 && xm<1) {					// seek thumbnail
      if (type != 'thumb') {seek_active = 1; seek.style.opacity = 1}
      if (type == 'video') {seek_active = media.duration * xm; seek.currentTime = seek_active}}
    else {seek_active=0; seek.style.opacity=0}
    stat.style.opacity = null
    seekbar.style.opacity = null
    if (type=='video' || type=='audio') {
      if (xm<0 || xw<0.1 || yw>0.85) {seekbar.style.opacity = 0.6}
      if (yw>0.85) {stat.style.opacity = 0.6}}}


  function positionMedia() {
    seek.style.top = innerHeight - 120 + 'px'
    if (type == 'video') {seek.style.left = xpos - seek.offsetWidth/2 +'px'}
    else {seek.style.left = innerWidth/2 - seek.offsetWidth/2 +'px'}
    nav.style.top = innerHeight - 320 +'px'
    stat.style.top = innerHeight - 90 +'px'
    var cueX = mediaX - media.offsetWidth*scaleX/2 + 'px'
    var cueW = scaleX * media.offsetWidth * media.currentTime / media.duration + 'px'
    if (cue && cue <= Math.round(media.currentTime*10)/10) {
      cueX = mediaX - media.offsetWidth*scaleX/2 + scaleX * media.offsetWidth * cue/media.duration + 'px'
      if (cue < Math.round(media.currentTime*10)/10) {cueW = scaleX*media.offsetWidth*(media.currentTime-cue)/media.duration+'px'}
      else {cueW = scaleX * media.offsetWidth * (1-(cue/media.duration)) + 'px'}}
    seekbar.style.left = cueX
    seekbar.style.width = cueW
    seekbar.style.top = 3 + mediaY + media.offsetHeight*scaleY/2 + "px"
    if (3 + mediaY + media.offsetHeight*scaleY/2 > innerHeight) {seekbar.style.top = innerHeight -6 + "px"}
    cap.style.left = mediaX - media.offsetWidth*scaleX/2 + "px"
    cap.style.top = mediaY + media.offsetHeight*scaleY/2 + 10 + "px"
    media.style.top = mediaY - media.offsetHeight/2 + "px"
    media.style.left = mediaX - media.offsetWidth/2 + "px"
    media.style.transform = "scale("+scaleX+","+scaleY+")"
    if (looping) {Loop.style.color='red'} else {Loop.style.color=null}
    if (sound=='no') {Mute.style.color='red'} else {Mute.style.color=null}
    time = Math.round(10*media.currentTime)/10
    if ((t=Math.round(time%60))<10) {t=':0'+t} else {t=':'+t}		// convert seconds to MMM:SS format
    if (!stat.matches(":hover")) {stat.innerHTML=Math.round(time/60)+t}
    if (media.duration > 120) {interval = 5} 				// set seek interval
    else {interval = 1}
    if (media.paused) {interval = 0.04}
    mySkinny.innerHTML = Math.round(100*newSkinny)/100
    if (type == 'image') {stat.innerHTML = mySkinny.innerHTML}
    if (sound == 'yes' && media.volume <= 0.8) {media.volume += 0.2}	// fade sound in or out
    if (sound == 'no' && media.volume >= 0.2) {media.volume -= 0.2}}


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

  function mute() {
    if (sound == "yes") {sound="no"} else {sound="yes"}
    sessionStorage.setItem("sound",sound); media.play()}

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
    if (cap_list && yw>0.85) {
      var z = cap_list.split('|')
      for (x of z) {if (!isNaN(x) && x>(media.currentTime+0.2)) {media.currentTime = x-0.8; media.play(); return}}}
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
      cap.style.opacity = 1
      media.pause()}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}


</script>
