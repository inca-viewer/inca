
// Debugging - use mySelected.innerHTML = x in Gesture(e) or use alert(x)
// rem. long click text or search, +adds extra search term
// rem. no alpha search in playlists because need natural order option
// edit caption file when # in filename
// search tigris ride - error with #
// if paused seek, does not roll over to start
// rename with # in name
// myinput cannot fill if media title has single '
// `r`n within captions
// undo delete etc?
// slide htm media to fixed position
// consider index 0 instead of was over
// simplify media list htm
// part nav2 hide
// zoom mode not flip to seek mode
// if see htm through modal allow click through 

// longclick trigger sheet timing issue 
// thumbsheet flashed poster


  var media = document.getElementById('media1')				// first media element
  var modal = document.getElementById('myModal')			// media player window
  var nav = document.getElementById('myContext')			// context menu during media play
  var nav2 = document.getElementById('myContext2')			// context menu over thumbs
  var cap = document.getElementById('myCap')				// caption textarea element
  var last_scaleY = 1*localStorage.getItem('last_scaleY')
  var mediaX = 1*localStorage.getItem('mediaX')
  var mediaY = 1*localStorage.getItem('mediaY')				// last media position
  var zoom = 1*localStorage.getItem('zoom')
  var fade = 1*localStorage.getItem('fade')
  var intervalTimer
  var wheel = 0
  var block = 100							// block wheel/gesture events
  var index = 1								// media index (e.g. media14)
  var last_index = 1
  var start = 0								// video start time
  var last_start = 0							// last media start time
  var last_prev = 0							// last preview start
  var interval = 0							// media seeking interval step
  var units = ''							// minutes, months, MB etc.
  var d_rate = 1							// default rate
  var rate = 1								// current rate
  var view = 14								// thumb size em
  var page = 1
  var pages = 1								// how many htm pages of media
  var sort = 0								// media list sort 
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var type = ''								// audio, video, image, document
  var cap_list = ''							// full caption text file
  var cap_time = 0
  var looping = true							// play next or loop media
  var mouse_down = 0
  var long_click = false
  var gesture = false
  var searchbox = ''							// search input field
  var renamebox = ''							// media rename input field
  var selected = ''							// list of selected media in page
  var over_cap = false							// cursor over caption
  var over_media = 0							// over thumb or media
  var was_over_media = 0
  var ratio								// media width to height ratio
  var skinny = 1							// media width
  var messages = ''							// skinny and caption changes
  var cache = ''
  var cue = 0								// start/end time for looping & mp3/4 conversions
  var editing = false							// cue point editing
  var Zindex = 3
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var scaleX = 1							// skinny & magnify factor
  var scaleY = zoom							// media size
  var sheetY = 1.2							// thumbsheet size
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var Xoff = 0
  var Yoff = 0
  var index_scroll
  var list_view = 0

  getParameters()							// initialise to media1 attributes
  gestureEvents(0)							// (fill search bar)
  if (!last_scaleY || last_scaleY<=0.2) {last_scaleY=0.64}
  modal.style.opacity=0;						// stop page load flicker
  modal.style.zIndex=-1;
  if (!fade) {fade=0.1}
  if (!zoom) {zoom=0.5}
  intervalTimer = setInterval(Timer,100)				// 100mS universal timer
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', gestureEvents)
  document.addEventListener('keypress', (e) => {
    if (e.key=='Enter') {
      if (searchbox) {inca('SearchBox', searchbox.value)}		// search for media
      else {inca('Rename', renamebox, was_over_media)}}}, false)	// rename media


  function mouseDown(e) {
    Xref=xpos; Yref=ypos
    mouse_down = e.button + 1
    long_click=false
    if (e.button == 1) {						// middle click
      if (over_media || type || e.shiftKey) {e.preventDefault()}
      clickTimer = setTimeout(function() {
        wheel=0; long_click=true; block=0
        start=last_start
        if (type) {playMedia('Back')}
        else if (over_media) {index=last_index; playMedia('Click')}
        else {inca('View', view, '', was_over_media)}},240)}		// + scrolls to index
    if (!e.button) {							// left click
      clickTimer = setTimeout(function() {
        if (!gesture) {
          long_click = true
          start=last_start
          if (!type && over_media && selected) {inca('Move', index)}	// used for editing playlists
          else if (type == 'thumbsheet') {getThumb('play')}
          else if (type && (yw>0.9||ym>1) && !nav2.matches(':hover') && !over_cap) {media_ended()}
          else if (type || over_media || nav.matches(':hover')) {playMedia('Click')}}},240)}}


  function mouseUp(e) {
    if (!mouse_down) {return}
    if (e.button == 1 && !long_click && !gesture) {
      if (e.shiftKey) {							// inca converts Back button to shift Mclick
        if (type) {mouseBack()}						// close modal player
        else if (myView.scrollTop > 50) {myView.scrollTo(0, 0)}
        else if (selected) {for(x of selected.split(',')) {sel(x)}}}	// clear any selected media
      else if (type == 'video' && cap_list && (ym>1 || yw>0.9)) {	// seek to next caption in movie
        for (var x of cap_list.split('|')) {
          if (!isNaN(x) && x>(myPlayer.currentTime+0.2)) {
            myPlayer.currentTime=x-1; myPlayer.play(); break}}}
      else if (type || over_media) {playMedia('Next')}			// next media/thumbsheet
      else if (nav.matches(':hover')) {over_media=index; playMedia('Click')}}
    else if (!e.button && !gesture && !long_click) {
      if (!nav2.matches(':hover') && !nav.matches(':hover')) {
        if (!over_cap && cap.value != cap.innerHTML) {editCap()}	// caption in edit mode
        else if (type == 'thumbsheet') {getThumb('play')}
        else if (!type && over_media) {playMedia('Click')}
        else if (type) {togglePause()}}}
    mouse_down=0
    clearTimeout(clickTimer)
    myPreview.style.display=null
    setTimeout(function() {gesture=false; long_click=false},500)}


  function mouseBack() {
    myPlayer.style.transition='0.25s'
    myPlayer.style.opacity=0
    nav2.style.display=null
    nav2.style.opacity=1
    editing = false
    localStorage.setItem('last_scaleY',last_scaleY)
    setTimeout(function() {
      if (type) {
        closeMedia()
        myPlayer.removeEventListener('ended', media_ended)
        navigator.clipboard.writeText(messages)
        messages=''
        type=''} 
      start=0
      over_media=0
      myPlayer.src=''
      myPlayer.poster=''
      modal.style.opacity=0
      modal.style.zIndex=-1},250)}


  function overThumb(id) {						// cursor over thumbnail
    over_media = id
    index = id
    start = 0
    getParameters()
    rect = media.getBoundingClientRect()
    xm = (xpos - rect.left) / Math.abs(media.offsetWidth)
    ym = (ypos - rect.top) / Math.abs(media.offsetHeight)
    if (ym > 0.9 && media.duration) {
      start=media.duration*xm
      media.currentTime=media.duration*xm}
    if (ym < 0.1 || !media.currentTime) {media.currentTime=start}
    media.play()}


  function getParameters() {						// media arguments
    if (!(media = document.getElementById('media'+index))) {index=1; return}
    var x = media.style.borderBottom; media.style.borderBottom=null	// preserve border-radius
    ratio = media.offsetWidth/media.offsetHeight
    media.style.borderBottom=x
    x = media['onmouseover'].toString().split(","); x.pop()		// get media parameters
    rate = 1*x.pop().trim()
    cap_list = x.pop().slice(0, -1).slice(2) 				// captions list
    cue = 1*x.pop().trim()
    if (start<1) {start = 1*x.pop().trim()} else {x.pop()}		// start time
    var type_t = x.pop().replaceAll('\'', '').trim()			// eg video, image
    skinny = 1*x.pop().trim()
    var z = cache.split('#EditMedia#')				// in case been edited
    for (x of z) {var y = x.split('#'); for (x of y) {if (1*y[0]==index) {rate=1*y[2]; skinny=1*y[1]}}}
    if (ratio > 1) {
      x = innerWidth*0.70; y = x/ratio; sheetY = innerWidth/x}		// landscape
    else {y = innerHeight; x = y*ratio; sheetY = innerHeight/y}		// portrait
    myPlayer.style.width = x +'px'					// media size normalised to screen
    myPlayer.style.height = y +'px'
    myPlayer.style.left = mediaX-x/2 +'px'
    myPlayer.style.top = mediaY-y/2 +'px'
    if (myPlayer.src != media.src) {
      myPlayer.src=media.src
      if (type == 'thumbsheet') {thumbSheet()}
      else {myPlayer.poster = media.poster}}				// stop reload jitter 
    myPlayer.playbackRate = rate
    return type_t}


  function playMedia(e) {
    if (!type) {
      myPlayer.addEventListener('ended', media_ended)
      Play(e)}
    else {								// transition to next
      myPlayer.style.opacity=0
      if (long_click) {}
      else {scaleY*=0.8; scaleX*=0.8}
      positionMedia(fade*0.3)
      setTimeout(function() {closeMedia(); Play(e)},fade*200)}}


  function Play(e) {
    cue = 0
    if (e == 'Next' && type) {index++; start=0}
    if (e == 'Back' && index > 1) {index--}
    var was_playing = type
    type = getParameters() 
    if (!type) {mouseBack(); return}					// end of media list
    scaleY = last_scaleY
    if (e == 'Click') {navigator.clipboard.writeText('#Media#'+index+'##'+start)}
    if (type == 'document' || type == 'm3u') {type=''; return}
    if ((e == 'Next' || e == 'Back') && was_playing == 'thumbsheet') {thumbSheet()}
    else if (e == 'Click' && long_click && was_playing!='thumbsheet' && mouse_down!=2) {thumbSheet(); context()}
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (type == 'audio' || playlist.match('/inca/music/')) {looping=false; myPlayer.muted=false; scaleY=0.25}
    if (e != 'Next' || type == 'video') {
      if (scaleY > 1.4) {scaleY=1.4}
      if (!mediaX || mediaX < 0 || mediaX > innerWidth) {mediaX=innerWidth/2}
      if (!mediaY || mediaY < 0 || mediaY > innerHeight) {mediaY=innerHeight/2}}
    scaleX = scaleY * skinny
    if (cap_list && type != 'thumbsheet' && start>1) {start-=1}		// start at first caption
    if (type == 'video' || type == 'audio') {myPlayer.currentTime = start; myPlayer.play()}
    modal.style.opacity = 1
    modal.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
    myPlayer.volume = 0
    over_media=0							// when entering modal player
    nav.style.display = null
    was_over_media = index
    myPlayer.style.transition = 0
    positionMedia(0)
    scrolltoIndex()
    myPlayer.style.opacity = 1
    if (fade && scaleY < zoom && !playlist.match('/inca/music/')) {
      scaleY = zoom; scaleX = zoom*skinny
      positionMedia(fade)}
    else {positionMedia(0.5)}
    wheel=0}


  function closeMedia() {
    if (type == 'video' || type == 'audio') {
      last_start = myPlayer.currentTime}
    var x=skinny; var y=rate; getParameters()
    if (x!=skinny || y!=rate) {						// see if edited
      messages = messages + '#EditMedia#'+index+'#'+x+'#'+y
      cache = cache + '#EditMedia#'+index+'#'+x+'#'+y}
    if (cap.value != cap.innerHTML) {editCap()}
    if (type != 'image' && index != last_index)
      messages = messages + '#History#'+index+'##'+last_start.toFixed(1)
    last_index = index
    mySpeed.innerHTML = 'Speed'
    cap.style.display = 'none'
    cap.style.color = null
    cap.style.opacity = 0
    cap.innerHTML = ''
    cap.value = ''
    cap_time = 0
    block = 160}


  function wheelEvents(e, id, el) {
    e.preventDefault()
    e.stopPropagation()
    wheel += Math.abs(e.deltaY)
    if (mouse_down || wheel < block) {return}
    var wheelUp = false
    wheel -= block
    if (wheel>10) {wheel=10}
    if (wheel<2) {wheel=2}
    block = 120
    if (e.deltaY > 0) {wheelUp=true}
    if (id=='myZoom') {							// zoom control
      if (wheelUp) {zoom+=0.1} else if (zoom>0.3) {zoom-=0.1}
      localStorage.setItem("zoom",zoom)
      last_scaleY=0.25; scaleY=0.25}
    else if (id=='myFade') {						// fade control
      if (wheelUp) {fade+=0.1} else if (fade>0.3) {fade-=0.1}
      localStorage.setItem("fade",fade)}
    else if (id == 'myPage') {						// page
      if (wheelUp && page<pages) {page++} 
      else if (!wheelUp && page>1) {page--}
      el.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// filter
      if (wheelUp) {filt++} else if (filt) {filt--}
      filter(id)}
    else if (id=='mySpeed') {						// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) {rate -= 0.01}
        else {rate += 0.01}
        rate = Math.round(100*rate)/100
        myPlayer.playbackRate = rate
        if (rate == d_rate) {block=333}}}
    else if (id == 'mySkinny') {					// skinny
      block = 20
      if (wheelUp) {scaleX -= 0.004}
      else {scaleX += 0.004}
      skinny = Math.round((1000*scaleX/scaleY))/1000
      if (Math.abs(skinny) == 1) {block=333}
      media.style.transform = "scaleX("+skinny+")"}
    else if (id=='View') {						// thumbs
      if (wheelUp) {view += 1}
      else {view -= 1}
      if (view < 8) {view = 8}
      if (view > 99) {view = 99}
      View.innerHTML = 'View '+(view-7)
      el = document.getElementById('media1')
      el.style.opacity=1
      el.style.transition='0.2s'
      el.style.maxWidth=(view*0.8)+'em'
      el.style.maxHeight=(view*0.8)+'em'
      block=64}
    else if (id=='myNext' || id=='mySelect') {				// next
      if (wheelUp) {playMedia('Next')}
      else if (e.deltaY) {playMedia('Back')}
      block=180; wheel=0; return}
    else if (id == 'mySeek' || xw < 0.2) {				// seek 
      if (myPlayer.duration > 120) {interval = 3}
      else {interval = 0.5}
      if (type=='video' || type=='audio') {
        mySeekbar.style.opacity = 1
        if (myPlayer.paused) {interval = 0.04}
        if (wheelUp) {myPlayer.currentTime += interval}
        else {myPlayer.currentTime -= interval}}
      else if (type=='thumbsheet') {
        if (wheelUp) {myPreview.currentTime += interval}
        else {myPreview.currentTime -= interval}}
      mySeek.innerHTML = (myPlayer.currentTime/60).toFixed(1)
      block = 160}
    else if (type) {							// zoom
      block=20
      if (wheelUp) {x=0.002*wheel}
      else {x=-0.002*wheel}
      if (type == 'thumbsheet' && (sheetY>0.25 || x>0)) {sheetY+=x}
      else if (scaleY>0.25 || x>0) {scaleY+=x; scaleX=scaleY*skinny}
      last_scaleY = scaleY}
    if (type) {positionMedia(0.28)}
    wheel = 10}


  function gestureEvents(e) {
    xpos = e.clientX
    ypos = e.clientY
    if (filt) {filter(sort)}
    if (selected) {panel.style.color='lightsalmon'}
    else {panel.style.color=null}
    if (myInput.value) {
      SearchBox.innerHTML='Search'; SearchAll.innerHTML='All'; SearchAdd.innerHTML='Add'}
    mySelected.style.top = e.pageY -13 +'px'
    mySelected.style.left = e.pageX +'px'
    if (!nav.matches(":hover"))  {nav.style.display = null}
    if (!nav2.matches(":hover")) {nav2.style.display = null}
    var x = Math.abs(Xref-xpos)
    var y = Math.abs(Yref-ypos)
    if (mouse_down && !over_cap && x+y > 8) {gesture=true}		// gesture detection (mousedown + slide)
    if (type && gesture && mouse_down==1) {				// move media
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX)
      localStorage.setItem("mediaY",mediaY)}
    else if (type && mouse_down>1 && y+2 > x) {				// zoom media
      if (scaleY > 0.25 || Yref < ypos) {
        if (type == 'thumbsheet') {sheetY+=(ypos-Yref)/300}		// zoom thumbsheet
        else {
          if (scaleX < 0) {scaleX -= (ypos-Yref)/300}			// in case media fipped left/right
          else {scaleX += (ypos-Yref)/300}
          scaleY += (ypos-Yref)/300
          last_scaleY = scaleY}}}
    if (gesture) {Xref=xpos; Yref=ypos; positionMedia(0)}
    if (type) {
      modal.style.cursor = 'crosshair'
      if (type != 'thumbsheet') {setTimeout(function() {modal.style.cursor='none'},400)}}}


  function positionMedia(fade) {					// align media within window boundaries
    var x=0; var y=0
    if (looping) {myLoop.style.color='red'} else {myLoop.style.color=null}
    if (myPlayer.muted) {myMute.style.color='red'} else {myMute.style.color=null}
    if (skinny<0) {myFlip.style.color='red'} else {myFlip.style.color=null}
    if (screenLeft) {Xoff=screenLeft; Yoff=outerHeight-innerHeight} else {x=Xoff; y=Yoff}	// fullscreen offsets
    if (block==20 && wheel<3 && !mouse_down && (mediaY > 0.7*((innerHeight/2)-y) && mediaY < 1.3*((innerHeight/2)-y))
      && (mediaX > 0.3*(innerWidth-x) && mediaX < 0.7*(innerWidth-x)) && type != 'thumbsheet') {
      myPlayer.style.transition = '1.6s'							// zoom to sticky edges
      if (Math.abs((myPlayer.offsetHeight*scaleY)) > 0.88*(innerHeight) && Math.abs((myPlayer.offsetHeight*scaleY)) < 1.12*(innerHeight)) {
        mediaY=(innerHeight/2)-y; scaleY=(innerHeight)/myPlayer.offsetHeight; scaleX=skinny*scaleY; fade=1.2}
      if (Math.abs((myPlayer.offsetWidth*scaleX)) > 0.89*innerWidth && Math.abs((myPlayer.offsetWidth*scaleX)) < 1.12*innerWidth) {
        mediaX=(innerWidth/2)-x; scaleX=innerWidth/myPlayer.offsetWidth; if(skinny<0) {scaleX*=-1}; scaleY=scaleX/skinny; fade=1.2}}
    myPlayer.style.transition = fade+'s'
    myPlayer.style.left = mediaX-(myPlayer.offsetWidth/2) +x +"px"
    myPlayer.style.top = mediaY-(myPlayer.offsetHeight/2) +y +"px"
    if (type == 'thumbsheet') {myPlayer.style.transform="scale("+skinny*sheetY+","+sheetY+")"}
    else  {myPlayer.style.transform = "scale("+scaleX+","+scaleY+")"}}


  function Timer() {
    if (block>=25) {block-=5}						// slowly reduce event blocking
    if (wheel>1) {wheel--}
    xw =  xpos / innerWidth
    yw =  ypos / innerHeight
    rect = myPlayer.getBoundingClientRect()
    myNext.innerHTML = index
    myFade.innerHTML = 'Fade '+ fade.toFixed(1)
    myZoom.innerHTML = 'Zoom '+ zoom.toFixed(1)
    if (selected && myPanel.matches(":hover")) {mySelected.innerHTML = selected.split(',').length -1}
    else {mySelected.innerHTML = ''}
    if (!type) {return}
    if (type == 'thumbsheet' && myPlayer.matches(":hover") && !myPreview.style.transition) {
      getThumb('')
      if (start != last_prev) {
        myPreview.style.opacity=null
        setTimeout(function() {myPreview.style.transition=null},1000)
        setTimeout(function() {
          myPreview.style.transition='opacity 1s'; 
          myPreview.style.opacity=1; 
          last_prev=start; 
          myPreview.play()},400)}}					// time to settle on new thumb before play
    var x=''
    if (myPlayer.duration) {x=Math.round(myPlayer.duration/60)+'mins - '}
    if (mySelect.matches(':hover')) {
      mySelect.innerHTML='Select - '+x+document.getElementById('title'+index).value}
    if (skinny == 1) {mySkinny.innerHTML = 'Skinny'}
    else {mySkinny.innerHTML = skinny.toFixed(2)}
    if (rate == d_rate) {mySpeed.innerHTML = 'Speed'}
    else {mySpeed.innerHTML = rate.toFixed(2)}
    if (selected && (","+selected).match(","+index+",")) {
      mySelect.style.color='red'}
    else {mySelect.style.color=null}
    if (type == 'thumbsheet') {
      xm = myPlayer.offsetWidth*sheetY*skinny; ym = myPlayer.offsetHeight*sheetY}
    else {xm = myPlayer.offsetWidth*scaleX; ym = myPlayer.offsetHeight*scaleY}
    xm = (xpos - rect.left) / Math.abs(xm)
    ym = (ypos - rect.top) / Math.abs(ym)
    cap.style.top = rect.bottom +10 +'px'
    cap.style.left = rect.left +10 +'px'
    if (cap_list) {cap.style.display='block'}
    showCaption()
    modal.style.backgroundColor = 'rgba(0,0,0,'+last_scaleY*2+')'
    if (nav2.matches(':hover') && nav2.style.opacity > 0.4 && !mySelect.matches(':hover')) {nav2.style.opacity -= 0.01}
    if (xm>0 && xm<1 && ym>0 && ym<1) {over_media=index} else {over_media=0}
    if (myPlayer.volume <= 0.8) {myPlayer.volume += 0.05}		// fade sound up
    positionMedia(0)
    seekBar()}


  function getThumb(play) {
    var row = Math.floor(ym * 6)					// media seek time from mouse xy
    var col = Math.ceil(xm * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (myPlayer.duration > 60) {offset = 20}
    if (xm>1||xm<0|ym>1||ym<0) {start = 0}				// if outside thumbsheet start 0
    else {start = offset - 0.4 - (ps * offset) + myPlayer.duration * ps}
    if (start != last_prev) {myPreview.currentTime=start}
    else {start = myPreview.currentTime}
    myPreview.style.display='block'
    myPreview.style.width = (sheetY*myPlayer.offsetWidth/6) -14 +'px'
    myPreview.style.left = rect.left + (sheetY*(col-1)*skinny*myPlayer.offsetWidth/6) +'px'
    myPreview.style.top = rect.top + (sheetY*row*myPlayer.offsetHeight/6) -3 +'px'
    if (play) {myPlayer.currentTime=start; type='video'; myPlayer.play(); positionMedia(0.2)}}


  function thumbSheet() {						// change poster jpg to 6x6 thumbsheet jpg
    var x = media.poster.replace("/posters/", "/thumbs/")
    p = x.split('%20')							// see if embedded start time in poster filename
    p = p.pop()
    p = p.replace('.jpg', '')
    if (!isNaN(p) && p.length > 2 && p.includes('.')) {			// very likely a suffix timestamp
      x = x.replace('%20' + p, '')}					// so remove timestamp from filename
    myPreview.src = myPlayer.src
    myPreview.playbackRate = 0.84
    myPlayer.poster = x							// use 6x6 thumbsheet file
    myPlayer.load()
    myPlayer.playbackRate = rate
    last_prev = start
    type = 'thumbsheet'}


  function media_ended() {						// looping or next media
    if (long_click) {start=0}
    else if (!looping) {
      cue = 0
      if (playlist.match('/inca/music/')) {
        setTimeout(function() {playMedia('Next')}, Math.random()*6000)}	// next media
      else {playMedia('Next')}; return}
    myPlayer.currentTime=start
    myPlayer.play()
    if (long_click) {return}
    if (myPlayer.playbackRate > 0.40) {myPlayer.playbackRate -= 0.05}}	// slower speed for each loop


  function scrolltoIndex() {
    if (!(el=document.getElementById('media'+index))) {return}
    var x = ','+selected						// highlight played media in tab
    if (!x.match(","+index+",") && !x.match(","+last_index+",")) {
      if (el=document.getElementById('title'+last_index)) {el.style.background=null}
      if (el=document.getElementById('title'+index)) {el.style.background='#2b2824'}
      if (el=document.getElementById('media'+last_index)) {el.style.borderBottom=null}
      if (el=document.getElementById('media'+index)) {el.style.borderBottom='4px solid salmon'}}
    x = el.getBoundingClientRect().top + myView.scrollTop
    if (list_view) {if (el.getBoundingClientRect().top > 500) {setTimeout(function() {myView.scrollTo(0,x-260)},232)}}
    else if (Math.abs(myView.scrollTop-(x-360)) > 300) {myView.scrollTo(0,x-360)}}	// ignore small scrolls


  function seekBar() {
    var cueX = rect.left + 'px'
    var cueW = Math.abs(scaleX) * myPlayer.offsetWidth * myPlayer.currentTime / myPlayer.duration + 'px'
    if (cue && cue <= Math.round(myPlayer.currentTime*10)/10) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/myPlayer.duration + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/myPlayer.duration)+'px'
      if (cue == Math.round(myPlayer.currentTime*10)/10) {
        cueW=Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.duration-cue)/myPlayer.duration)+'px'}}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/myPlayer.duration) + 'px'
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - Math.round(myPlayer.currentTime*10)/10)/myPlayer.duration) + 'px'
      if (cue < 0.4+Math.round(myPlayer.currentTime*10)/10) {
        cueX=rect.left+'px'; cueW=Math.abs(scaleX*myPlayer.offsetWidth*myPlayer.currentTime/myPlayer.duration)+'px'}}
    if (!editing && cue && myPlayer.currentTime > cue) {media_ended()}
    mySeekbar.style.left = cueX
    mySeekbar.style.width = cueW
    if (rect.bottom+6 > innerHeight) {mySeekbar.style.top = innerHeight -4 +'px'}
    else {mySeekbar.style.top = 3 + rect.bottom +'px'}
    if (type == 'image' || (!nav2.matches(':hover') && !over_media)) {mySeekbar.style.opacity -= 0.05}
    else if (rect.bottom+6 > innerHeight) { mySeekbar.style.opacity=1} else {mySeekbar.style.opacity=0.6}}


  function togglePause() {
    if (!type||gesture||long_click||over_cap||type=='thumbsheet'||mouse_down>1) {return}
    if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}


  function editCap() {							// edit caption
    var time = myPlayer.currentTime.toFixed(1)
    if (time<1) {time = '0.0'}
    if (cap.value != cap.innerHTML && cap.value.length > 1) {
      newcap = cap.value + "|" + time + "|"
      messages = messages+'#Caption#'+newcap+'#'+index+',#'+cap.innerHTML+'|'+time+'|'
      cap.value = ''; cap.innerHTML = ''
      myPlayer.play()}
    else {
      if (!cap.value) {cap.value = '-'; cap.innerHTML = '-'}
      cap.style.opacity=0.6
      cap.style.display='block'
      cap.focus()}}

  function showCaption() {						// display captions
    if (document.activeElement.id == 'myCap') {cap.style.color='red'; return}
    else {cap.style.color=null}
    var time = myPlayer.currentTime.toFixed(1)
    if (!time || type == 'image') {time='0.0'}
    var ptr = cap_list.indexOf('|'+ time + '|')
    if (ptr < 1) {ptr = cap_list.indexOf('|'+ time - 0.1 + '|')}
    if ((ptr > 0 && cap_time != time) || type == 'image') {
      cap_time = time
      cap.innerHTML = cap_list.slice(0,ptr).split('|').pop().replaceAll("§", "\,").replaceAll("±", "\'")
      cap.value = cap.innerHTML
      cap.style.opacity = 1
      if (!myPlayer.paused) {myPlayer.pause()}}
    else if (cap.innerHTML != '-' && (!cap.value || ptr <= 0)) {cap.style.opacity=0}}

  function filter(id) {
      var x = filt							// eg 30 minutes, 2 months, alpha 'A'
      if (id == 'Alpha') {
        if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
      if (id == 'Size')  {x *= 10; units = " Mb"}
      if (id == 'Date')  {units = " months"}
      if (id == 'Duration') {units = " minutes"}
      if (!x) {x=''}
      document.getElementById(id).innerHTML = x+' '+units
      document.getElementById(id).style.color = 'red'}

  function sel(i) {							// highlight selected media
    if (!i || (event.button && !event.shiftKey) || long_click) {return}
    if (list_view) {el=document.getElementById('entry'+i)}
    else {el=document.getElementById('media'+i)}
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.borderBottom = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (list_view) {el.style.borderBottom = '0.1px solid salmon'}
      else {el.style.borderBottom = '4px solid red'}
      if (!x.match(","+i+",")) {selected = selected+i+","}}}

  function context() {
    nav.style.left=xpos-50+'px'; nav.style.top=ypos-45+'px'
    nav2.style.left=xpos-60+'px'; nav2.style.top=ypos-45+'px'
    if (el=document.getElementById('entry'+index)) {
      if (el.matches(":hover")) {was_over_media = index}
      else {was_over_media = 0}}
    if (type) {nav2.style.display='block'} else {nav.style.display='block'}}

  function globals(vi, pg, ps, so, fi, ra, lv, fs, pl, ix) {		// import globals to java
    view=vi; page=pg; pages=ps; sort=so; filt=fi; d_rate=ra; list_view=lv;
    selected=fs; playlist=pl; index=ix; was_over_media=ix; last_index=ix
    scrolltoIndex()
    for (x of selected.split(',')) { if (x && !isNaN(x)) {		// highlight selected media			
      if (lv) {document.getElementById('entry'+x).style.borderBottom = '0.1px solid red'}
      else {document.getElementById('media'+x).style.borderBottom = '4px solid red'}}}}

  function inca(command,value,select,address) {
    if (gesture) {return}
    if (!value) {value=''}
    if (!select) {select=''} else {select= select+','}
    if (!address) {address=''}
    if (selected) {select=selected}
    for(x of select.split(','))  {if (x) {document.getElementById('media'+x).load()}}
    navigator.clipboard.writeText('#'+command+'#'+value+'#'+select+'#'+address)}

  function selectAll() {for (i=1; i <= 600; i++) {sel(i)}}
  function loop() {if (looping) {looping = false} else {looping = true}}
  function flip() {skinny*=-1; scaleX*=-1; positionMedia(0.5); media.style.transform='scaleX('+skinny+')'}
  function mute() {if(!long_click) {
    myPlayer.volume=0; myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted); myPlayer.play()}}

