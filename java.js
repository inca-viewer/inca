
// Debugging	- use mySelected.innerHTML or alert()


// zoom cues
// mpv stays active
// mpv false triggered
// music next


  var defRate = 1*localStorage.getItem('defRate')			// default playback speed
  var mediaX = 1*localStorage.getItem('mediaX')				// myPlayer position
  var mediaY = 1*localStorage.getItem('mediaY')
  var mpv = 1*localStorage.getItem('mpv')				// external media player
  var intervalTimer							// every 100mS
  var thumb = 0								// thumb element
  var title = 0								// title element
  var wheel = 0								// mouse wheel count
  var index = 1								// thumb index (e.g. thumb14)
  var lastIndex = 0							// last thumb id
  var lastStart = 0							// last video start time
  var lastCue								// last cue time
  var view = 14								// thumb size (em)
  var viewE = 0								// size edited
  var listView = 0							// list or thumb view
  var page = 1								// html media page
  var pages = 1								// how many htm pages of media
  var sort = 0								// media list sort 
  var filt = 0								// media list filter
  var playlist								// full .m3u filepath
  var type = ''								// audio, video, image, document
  var cue = 0								// cue point time
  var cueList = ''							// full caption text file
  var playing = ''							// myPlayer or mpv active
  var thumbSheet = 0							// 6x6 thumbsheet mode
  var looping = 1							// play next or loop media
  var lastClick = 0							// state is preserved
  var Click = 0								// state cleared after mouseUp()
  var longClick = 0							// state is preserved
  var gesture = 0							// state is preserved
  var searchbox = ''							// search input field
  var renamebox = ''							// media rename input field
  var selected = ''							// list of selected media in page
  var overMedia = 0							// over thumb or myPlayer
  var wasMedia = 0							// before context menu
  var overText = 0							// text input fields, allow cut paste
  var editing = 0							// editing textarea active
  var messages = ''							// history, width, speed & caption edits
  var Zindex = 3							// element layer
  var size = 0								// file size (from inca)
  var dur = 0								// duration (from inca)
  var rate = 1								// current myPlayer speed
  var skinny = 1							// media width
  var scaleX = 0.72							// myPlayer width (skinny)
  var scaleY = 0.72							// myPlayer size
  var xw = 0.5								// cursor over window ratio
  var yw = 0.5
  var xm = 0								// cursor over media ratio
  var ym = 0
  var xpos = 0								// cursor coordinate in pixels
  var ypos = 0
  var Xref = 0								// click cursor coordinate
  var Yref = 0
  var fade = 0								// myPlayer transition
  var cursor								// hide cursor timer
  var block = 0								// block wheel timer
  var ratio = 1								// media width to height ratio

  if (!mpv) mpv=0							// external player
  if (!defRate) defRate=1						// default speed
  intervalTimer = setInterval(timerEvent,100)				// background tasks every 100mS
  document.addEventListener('mousedown', mouseDown)
  document.addEventListener('mouseup', mouseUp)
  document.addEventListener('dragend', mouseUp)
  document.addEventListener('mousemove', mouseMove)


  document.addEventListener('keydown', (e) => {				// keyboard events
    if (e.key=='Enter') {
      if (renamebox) inca('Rename', renamebox, wasMedia)		// rename media
      else if (myInput.matches(':focus')) inca('SearchBox','','',myInput.value) // search media on pc
      else if (type=='document') {var x=thumb.scrollTop; setTimeout(function(){thumb.scrollTo(0,x)},100)}}
    else if (e.key=='Pause' && e.altKey) {thumbSheet=2.4; Play()}	// mpv player - show thumbsheet
    else if (e.key=='Pause' && e.shiftKey) {				// inca re-map of long right click
      if (myPlayer.matches(':hover')) myPlayer.currentTime=0		// myPlayer to 0:00
      else myPlayer.currentTime=thumb.style.start			// to default start time
      if (playing) {thumbSheet=0; myPlayer.play()}
      else {lastClick=3;longClick=3;clickEvent()}}			// simulate RClick
    else if (e.key=='Pause') {						// inca re-map of mouse 'Back' key
      if (playing) closePlayer()
      else if (myNav.matches(':hover')) myNav.style.display='none'
      else if (overMedia && thumb.style.position=='fixed') {		// close popped out thumb
        thumb.style.position=null
        thumb.style.maxWidth=view*0.8+'em'
        thumb.style.maxHeight=view*0.8+'em'
        thumb.removeAttribute('controls')
        thumb.style.top=null; thumb.style.left=null}
      else if (myView.scrollTop > 50) myView.scrollTo(0,0)		// else scroll to page top
      else inca('Reload')}}, false)					// or reload page


  function mouseDown(e) {						// detect long click
    Click=e.button+1; lastClick=Click; longClick=0; cursor=6
    gesture=0; Xref=xpos; Yref=ypos; block=100
    sessionStorage.setItem('scroll', myView.scrollTop)
    if (Click==2) e.preventDefault()					// middle click
    else if (!myNav.matches(":hover")) {
      if (overMedia) wasMedia=overMedia
      else wasMedia=0}
    if (Click==2 && myPanel.matches(':hover')) return			// browser opens new tab
    clickTimer=setTimeout(function() {longClick=Click; clickEvent()},240)}


  function mouseUp(e) {
    if (!Click) return							// page load while mouse still down - ignore  
    if (Click==3 && !gesture && !longClick && !overText) context(e)	// new context menu
    if (Click==2 && !playing) inca('View',0,'',lastIndex)		// middle click - switch list/thumb view
    else if (viewE && thumb.style.position!='fixed') inca('View',viewE.toFixed(1),'',index)
    else if (!longClick) clickEvent()					// process click event
    Click=0; wheel=0; gesture=0; longClick=0; viewE=0
    clearTimeout(clickTimer)}						// longClick timer


  function mouseMove(e) {
    xpos=e.clientX
    ypos=e.clientY
    cursor=6
    if (!thumb) return
    if (myPanel.matches(':hover')) mySelected.style.fontSize='3em'
    else mySelected.style.fontSize=null
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    if (myPic.matches(':hover') && type=='video') Sprites()		// myNav preview thumb
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    if (x+y > 7 && !gesture && Click) gesture=1				// gesture (Click + slide)
    if (!gesture || Click!=1) return
    if (myNav.matches(':hover')) {
      myNav.style.left = xpos-myNav.offsetWidth/2+"px"
      myNav.style.top = ypos-myNav.offsetHeight/2+"px"}
    else if (!playing && wasMedia && !listView && type!='document') { 	// move thumb
      thumb.style.zIndex = Zindex+=1
      if (gesture!=3 && (y<x-1 || gesture==2)) {
        gesture=2
        thumb.style.transition='0s'
        thumb.style.position = 'fixed'
        thumb.style.left = xpos-thumb.offsetWidth/2+"px"
        thumb.style.top = ypos-thumb.offsetHeight/2+"px"}
      else if (gesture!=2 &&  (y>x || gesture==3)) {			// zoom thumb
        gesture=3
        viewE = 1*thumb.style.maxWidth.slice(0,-2)
        if (ypos>Yref) viewE+=0.6
        else if (viewE>8) viewE-=0.6
        thumb.style.maxWidth=viewE+'em'
        thumb.style.maxHeight=viewE+'em'}
      if (thumb.style.position=='fixed') {
        thumb.style.left = xpos-thumb.offsetWidth/2+'px'
        thumb.style.top = ypos-thumb.offsetHeight/2+'px'}}
    else if (playing && (y<x-2 || gesture==2)) {			// move myPlayer
      gesture = 2
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX.toFixed(0))
      localStorage.setItem("mediaY",mediaY.toFixed(0))}
    else if (playing && y>x) {						// zoom myPlayer
      if (scaleY>0.2 || Yref<ypos) {
        scaleY += (ypos-Yref) * 0.01
        localStorage.setItem('scaleY',scaleY.toFixed(3))}}
    positionMedia(0); Xref=xpos; Yref=ypos}


  function wheelEvent(e, id, el) {
    e.preventDefault()
    wheel += Math.ceil(Math.abs(e.deltaY))
    if (Click || wheel < block) return
    var wheelUp=false
    if (e.deltaY > 0) wheelUp=true
    if (id=='myRate') {							// default rate
      if (!wheelUp) defRate+=0.01
      else if (defRate>0.31) defRate-=0.01
      defRate = Math.round(100*defRate)/100
      localStorage.setItem("defRate",defRate)}
    else if (id=='myPage') {						// htm page
      if (wheelUp && page<pages) page++
      else if (!wheelUp && page>1) page--
      myPage.innerHTML = 'Page '+page+' of '+pages}
    else if (id=='Alpha'||id=='Date'||id=='Duration'||id=='Size') {	// filter
      if (wheelUp) filt++ 
      else if (filt) filt--
      Filter(id)}
    else if (mySpeed.matches(':hover')) {				// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) rate -= 0.01
        else rate += 0.01
        rate = Math.round(100*rate)/100					// css holds edited rate
        thumb.style.rate = rate}}
    else if (mySkinny.matches(':hover')) {				// skinny
      if (wheelUp) skinny -= 0.01
      else skinny += 0.01
      skinny=Math.round((1000*skinny))/1000
      thumb.style.skinny = skinny					// css holds edited skinny
      getParameters(index)
      positionMedia(0)}
    else if (id=='View') {						// thumb size
      el = document.getElementById('thumb1')
      viewE = 1*el.style.maxWidth.slice(0,-2)
      if (viewE<50 && wheelUp) viewE += 1
      else if (viewE>8 && !wheelUp) viewE -= 1
      el.style.opacity=1
      el.style.maxWidth=viewE+'em'
      el.style.maxHeight=viewE+'em'} 
    else if (myTitle.matches(':hover') || mySelect.matches(':hover')) {	// next / previous
      if (wheelUp) index++
      else if (index>1) index--
      var x=myPlayer.paused
      if (!getParameters(index)) index--
      if (playing && !thumbSheet && type=='video') {
        myPlayer.currentTime=thumb.style.start
        if (!x) myPlayer.play()}
      scrolltoIndex(index)
      Sprites()}
    else if (playing && xw<0.1) {					// zoom myPlayer
      if (scaleY>0.2 && !wheelUp) scaleY *= 0.9
      else if (wheelUp) scaleY *= 1.1
      positionMedia(0.5)}
    else if (type=='image' || thumbSheet) {				// scroll image
      rect = myPlayer.getBoundingClientRect()
      if (wheelUp) mediaY-=100
      else mediaY+=100
      positionMedia(0.3)}
    else if (!thumbSheet && type!='image') { 				// seek
      cursor=6
      if (dur > 120) interval = 3
      else interval = 0.5
      if (myPlayer.paused) interval = 0.04
      if (wheelUp) myPlayer.currentTime += interval
      else myPlayer.currentTime -= interval}
    wheel=0; block=120; lastCue=-1}


  function clickEvent() {						// functional logic
    if (lastClick==3 && !longClick) return
    if (gesture || title.matches(':hover')) return			// allow rename of media in htm
    if (longClick && myRibbon.matches(':hover')) return
    if (longClick && myInput.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return			// copy files instead of move
    if (myTitle.matches(':hover') && !playing) {overMedia=index; lastClick=0}
    if (myPic.matches(':hover')) {
      if (thumbSheet) myPlayer.currentTime=myPic.style.start
        overMedia=index; lastClick=0; thumbSheet=0}
    if (!playing && !longClick && !overMedia) return
    if (myNav.matches(':hover') && lastClick==1) return
    if (!gesture && longClick==1 && !playing && playlist && wasMedia && selected) {inca('Move', wasMedia); return}
    if (!thumb.src && (type=='document' || type=='m3u')) return
    if (playing && lastClick==1) {
      if (thumbSheet) {getStart(); return}
      if (xm>0 && xm<1 && ym>0.9 && ym<1) {myPlayer.currentTime=xm*dur; return}
      else if (!longClick) {togglePause(); return}}
    if (!playing) {
      if (!mediaX || mediaX<0 || mediaX>innerWidth) mediaX=innerWidth/2
      if (!mediaY || mediaY<0 || mediaY>innerHeight) mediaY=innerHeight/2
      if (!scaleY || scaleY>2 || scaleY<0.15) scaleY=0.7}
    if (playing && lastClick==2) if (longClick) {index--} else index++	// next / previous media
    if (longClick && !overMedia && !playing) index=lastIndex		// return to last media
    if (!playing || thumbSheet) fade=0
    positionMedia(fade)
    setTimeout(function() {						// so player can fade in/out 
      if (!getParameters(index)) {closePlayer(); return}		// end of media list
      positionMedia(0)
      myPlayer.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
      if (lastClick==3) myPlayer.currentTime=0
      else if (longClick==1 && type=='video' && (playing || overMedia)) { // show thumbsheet
        thumbSheet=1.4*Math.abs(1/scaleY); if (ratio<1) thumbSheet*=0.7; Previews()}
      else if (!playing && !overMedia) myPlayer.currentTime=lastStart	// return to last media
      else if (!thumbSheet && lastClick) myPlayer.currentTime=thumb.style.start
      scrolltoIndex(index)			    			// + highlight played media
      positionMedia(0.2)
      Play()},fade*400)}


  function Play() {
    var para = myPlayer.currentTime+'|'+skinny+'|'+rate+'|'+localStorage.getItem('muted')
    if (!thumbSheet && type=='video' && mpv) playing='mpv'
    else playing='browser'
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (!thumbSheet && lastClick) messages=messages+'#History#'+myPlayer.currentTime.toFixed(1)+'#'+index+'#'
    if (lastClick==2 && playing=='mpv') return				// inca does next/previous media
    if (type=='document' || type=='m3u') {closePlayer(); inca('Media',0,index); return}
    else if (playing=='mpv') inca('Media',0,index,para)			// use external player
    if (type == 'audio' || playlist.match('/inca/music/')) {
      looping=0; myPlayer.muted=false; scaleY=0.2; myPlayer.style.borderBottom='4px solid salmon'}
    if (playing=='browser' && !thumbSheet && type != 'image') myPlayer.play()
    myPlayer.addEventListener('ended', nextMedia)
    if (playing=='browser') myPlayer.style.opacity=1
    myMask.style.zIndex = Zindex
    myMask.style.display='flex'
    myBody.style.cursor='none'
    myNav.style.display=null
    myPlayer.volume = 0.05
    if (looping) looping=1
    if (lastClick) {							// not by wheel event
      if (lastClick==2) clearTimeout(playingTimer)
      playingTimer = setTimeout(function() {
        if (type=='video' && !thumbSheet && !myPlayer.duration) {	// if browser cannot play
          closePlayer(); playing='mpv'; inca('Media',0,index,para)}},500)} // try external mpv player
    lastCue=-1; lastClick=0}


  function closePlayer() {		
    positionMedia(0.4)
    if (playing=='mpv') inca('Close')
    Click=0								// in case browser not active
    cue=0
    myPlayer.style.opacity=0
    myNav.style.display=null
    playing=''
    setTimeout(function() {						// fadeout before close
      myPlayer.removeEventListener('ended', nextMedia)
      myPlayer.src=''
      myPlayer.poster=''
      thumbSheet=0},400)}


  function getParameters(i) {						// prepare myPlayer for media
    if (!(thumb=document.getElementById('thumb'+i))) {
      thumb=document.getElementById('thumb1'); return}
    title=document.getElementById('title'+i)
    rate = defRate
    skinny = 1
    var x = thumb['onmousedown'].toString().split(',')			// get media parameters from htm element
    type = x[1].replaceAll('\'', '').trim()				// eg video, image
    dur = 1*x[3].trim()							// in case video is wmv, avi etc
    thumb.style.start = 1*x[4].trim()
    size = 1*x[5]
    if (type == 'document') return 1
    Cues(0,i)								// process 0:00 cues - width, speed etc.
    x = 1*thumb.style.skinny						// get any live width edits
    if (x && x!=skinny) skinny=x
    thumb.style.transform='scale('+skinny+',1)' 			// has been edited
    x = 1*thumb.style.rate						// custom css variable - rate edited
    if (x && x != rate) rate=x
    if (type!='image' && !dur) dur=thumb.duration			// just in case - use browser calc.
    Previews()							// set preview sprites etc.
    return 1}


  function timerEvent() {						// every 100mS 
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (block>=30) block-=10						// wheel blocking
    if (wheel>=10) wheel-=10
    if (!thumb) return
    if (cursor) cursor--
    if (!myNav.matches(':hover')) myNav.style.display=null
    if (!playing || thumbSheet) myBody.style.cursor=null		// hide cursor
    else if (!cursor || Click) {
      myBody.style.cursor='none'
      if (!myNav.matches(':hover') && !overMedia) mySeekbar.style.opacity=0}
    else {myBody.style.cursor='crosshair'; mySeekbar.style.opacity=1}
    if (playing) myMask.style.backgroundColor='rgba(0,0,0,'+scaleY*2.6+')' 
    else myMask.style.display='none'
    if (defRate==1) myRate.innerHTML = 'Speed'
    else myRate.innerHTML = 'Speed '+ defRate
    if (rate==1) mySpeed.innerHTML = 'Speed'
    else mySpeed.innerHTML = rate.toFixed(2)
    if (skinny>0.99 && skinny<1.01) mySkinny.innerHTML = 'Skinny'
    else mySkinny.innerHTML = skinny.toFixed(2)
    if (selected) mySelected.innerHTML = selected.split(',').length -1
    else mySelected.innerHTML = ''
    if (playlist) myFav.innerHTML='Fav &#10084'
    if (myNav.matches(':hover') && (playing || wasMedia)) myPic.style.display=null
    else myPic.style.display='none'
    if (wasMedia || playing) {
      myTitle.innerHTML=title.value; mySelect.style.width='98%'; myTitle.style.width='16em'
      mySelect.innerHTML='Select - '+index+' - '+Time(dur)+' - '+size+'mb'}
    else {myTitle.innerHTML=''; myTitle.style.width=null}
    if (mpv) {myMpv.style.color='red'} else myMpv.style.color=null
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (1*localStorage.getItem('muted')) {myMute.style.color='red'} else myMute.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (myPlayer.style.opacity==0) {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) myPlayer.volume *= 1.3		// fade sound in/out
    if ((","+selected).match(","+index+",")) {mySelect.style.color='red'; myPlayer.style.outline='1px solid red'}
    else {mySelect.style.color=null; myPlayer.style.outline=null}
    if (!playing && (type=='image'||thumbSheet||!myNav.matches(':hover'))) mySeekbar.style.opacity=0
    if (cue) mySeekbar.style.opacity=1
    if (playing=='browser') {
      Jpg.innerHTML='jpg'
      myPlayer.playbackRate=rate
      rect = myPlayer.getBoundingClientRect()
      myCap.style.top=rect.bottom +10 +'px'
      myCap.style.left=rect.left +10 +'px'
      myCap.style.zIndex=Zindex
      if (cue) {Cap.innerHTML='goto '+myPlayer.currentTime.toFixed(2)} else Cap.innerHTML='caption'
      if (myCap.innerHTML) myCap.style.opacity=1
      if (cueList && !thumbSheet) Cues(myPlayer.currentTime, index)
      var z=1
      if (thumbSheet) z=thumbSheet
      else lastStart=myPlayer.currentTime
      xm = myPlayer.offsetWidth*scaleX*z
      ym = myPlayer.offsetHeight*scaleY*z
      xm = (xpos - rect.left) / Math.abs(xm)
      ym = (ypos - rect.top) / Math.abs(ym)
      myPlayer.style.zIndex=Zindex+1
      if (!myNav.matches(':hover')) seekBar()
      positionMedia(0)}
    else {
      Jpg.innerHTML=''
      myCap.innerHTML=''
      myCap.style.opacity=0
      myPlayer.style.zIndex=-1}}					// in case flipped into fullscreen


  function seekBar() {							// progress bar beneath player
    var cueX = rect.left
    var x = Math.round(myPlayer.currentTime*100)/100
    var cueW = 0.95*Math.abs(scaleX)*myPlayer.offsetWidth*myPlayer.currentTime/dur
    if (cue && cue<=x) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/dur
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/dur)
      if (cue<x+0.2 && cue>x-0.2) {
        cueW = Math.abs(scaleX*myPlayer.offsetWidth*(dur-cue)/dur)}}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/dur)
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - x)/dur)
      if (cue < 0.2+x) {
        cueX = rect.left; cueW = Math.abs(scaleX*myPlayer.offsetWidth*myPlayer.currentTime/dur)}}
    if (rect.bottom<innerHeight) mySeekbar.style.top = rect.bottom +'px'
    else mySeekbar.style.top = innerHeight -16 +'px'
    mySeekbar.style.left = cueX +'px'
    mySeekbar.style.width = cueW +'px'}


  function Cues(time, i) {						// process media cues - captions, pauses etc.
    var el=document.getElementById('thumb'+i)
    var x = el['onmousedown'].toString().split(',')			// get cueList from htm entry
    cueList = x[2].replaceAll('\'', '').trim()
    if (!cueList) return
    x = cueList.split('#1')						// each line entry
    for (i=0; i<x.length; i++) {
      var entry = x[i].split('#2')
      cueTime = 1*entry[0]
      var type = entry[1]
      var value = entry[2]
      fade = entry[3]
      if (cueTime > time-0.1 && cueTime < time+0.1) {
        if (type=='next') {lastClick=2; clickEvent()}
        else if (type=='goto') {myPlayer.currentTime = 1*value; myPlayer.volume=0.001}
        else if (type=='rate' && looping<2) {if (isNaN(1*value)) {rate=defRate} else {rate=1*value}}
        else if (type=='skinny' && !el.style.skinny) {
          if (isNaN(value)) {skinny=1} else {skinny=1*value; if(time) {positionMedia(fade)}}}
        else if (type=='pause'&& lastCue!=i) {
          lastCue=i; myPlayer.pause(); setTimeout(function(){myPlayer.play(); myCap.innerHTML=''},1000*value)}
        else if (type == 'cap') myCap.innerHTML = value.replaceAll("#3", "\,").replaceAll("#4", "\'").replaceAll("#5", "\"")}}}


  function positionMedia(fa) {						// position myPlayer in window
    myPlayer.style.left = mediaX - myPlayer.offsetWidth/2 +"px"
    myPlayer.style.top = mediaY - myPlayer.offsetHeight/2 +"px"
    myPlayer.style.transition = fa+'s'
    scaleX = skinny*scaleY
    if (thumbSheet) {z=thumbSheet} else z=1
    myPlayer.style.transform = "scale("+scaleX*z+","+scaleY*z+")"}

  function overThumb(id,el) {						// play htm thumb
    overMedia=id; index=id
    getParameters(id)
    myPlayer.currentTime=thumb.style.start				// for fast start
    var x = (ypos-el.getBoundingClientRect().top)/el.offsetHeight	// reset thumb time if enter from top
    if (type=='video') {if (!el.currentTime || x<0.1) el.currentTime=el.style.start+0.05}
    if (Click) sel(id)}

  function Previews() {
    var x = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheets folder
    var y = x.split('%20')						// see if embedded fav start time in poster filename
    y = y.pop()
    y = y.replace('.jpg', '')
    if (!isNaN(y) && y.length > 2 && y.includes('.')) {			// very likely a 'fav' suffix timestamp
      x = x.replace('%20' + y, '')}					// so remove timestamp from filename
    if (thumbSheet) myPlayer.poster = x					// 6x6 thumbsheet file
    else myPlayer.poster=''
    if (!thumb.src || myPlayer.src!=thumb.src) {
      myPlayer.src=thumb.src
      if (!thumbSheet) myPlayer.poster=thumb.poster}
    if (type!='image') myPic.poster=''
    else myPic.poster=thumb.poster
    if (type=='video') {
      myPic.style.backgroundImage = 'url(\"'+x+'\")'			// use thumbsheet for preview sprites
      myPic.style.transform='scale('+skinny+',1)'}
    else myPic.style.backgroundImage = ''
    var ratio = thumb.offsetWidth/thumb.offsetHeight
    if (ratio>1) {x=innerWidth*0.70; y=x/ratio}				// landscape
    else {y=innerHeight; x=y*ratio}					// portrait  
    myPlayer.style.width = x +'px'
    myPlayer.style.height = y +'px'
    myPlayer.style.top = mediaY-y/2 +'px'				// myPlayer size normalised to screen
    myPlayer.style.left = mediaX-x/2 +'px'
    if (ratio>1) {x=150} else x=120					// preview thumb size normalised
    myPic.style.width=x+'px'
    myPic.style.height=(x-7)/ratio+'px'
    myCap.innerHTML = ''
   if (longClick) myPlayer.load()}					// for thumbsheet load

  function Sprites() {							// myNav preview thumb
    var z = myPic.getBoundingClientRect()
    var x = (xpos-z.left)/myPic.offsetWidth
    mySeekbar.style.opacity=1
    mySeekbar.style.top = z.bottom +'px'
    mySeekbar.style.left = z.left -8 +'px'
    mySeekbar.style.width = myPic.offsetWidth*x +'px'
    z = 20 * Math.ceil(x*35)
    var y = 20 * Math.floor(z/120)
    z = z % 120
    myPic.style.backgroundPosition=z+'% '+y+'%'
    z=5*(Math.ceil(x*35)+1)
    if (dur > 60) {y = 20} else y=0
    z = (z-1) / 200
    myPic.style.start=y - 0.4 - (z * y) + dur * z
    if (!thumbSheet) myPlayer.currentTime=myPic.style.start}

  function getStart() {
    myPlayer.poster=''
    if (skinny < 0) xm = 1-xm						// if flipped media
    var row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
    var col = Math.ceil(xm * 6)
    var offset = 0
    var ps = 5 * ((row * 6) + col)
    ps = (ps - 1) / 200
    if (dur > 60) offset = 20
    if (longClick==1 || xm>1||xm<0|ym>1||ym<0) myPlayer.currentTime=lastStart
    else myPlayer.currentTime=offset - 0.4 - (ps * offset) + dur * ps
    thumbSheet=0
    Play()}

  function nextMedia() {
    if (!looping) {
      lastClick=2
      myPlayer.pause()
      if (playlist.match('/inca/music/')) setTimeout(function() {clickEvent()}, Math.random()*4000)
      else clickEvent()
      return}
    looping+=1
    if (!longClick && rate > 0.40) rate-=0.05				// slower each loop
    myPlayer.currentTime=thumb.style.start
    myPlayer.play()}

  function Filter(id) {							// for htm ribbon headings
    var x=filt; var units=''						// eg 30 minutes, 2 months, alpha 'A'
    var el = document.getElementById(id)
    if (!x) {el.innerHTML=sort; el.style.color=null; return}
    if (id == 'Alpha') {
      if (x > 25) {filt=25}; x = String.fromCharCode(filt + 65)}
    if (id == 'Size')  {x *= 10; units = " Mb"}
    if (id == 'Date')  units = " months"
    if (id == 'Duration') units = " minutes"
    if (!x) x=''
    el.innerHTML = x+' '+units; el.style.color = 'red'}

  function getAlpha(e, el) {						// set alpha search char in top panel
    var x = String.fromCharCode(Math.floor(26 * (e.clientX - el.offsetLeft) / el.offsetWidth) + 52)
    if (el=document.getElementById('my'+x)) {
      el.scrollIntoView()
      panel.scrollBy(0,-250)
      myView.scrollBy(0,-200)}}

  function scrolltoIndex(i) {
    if (!i) return
    if (lastIndex) {document.getElementById('title'+lastIndex).style.background=null
      document.getElementById('thumb'+lastIndex).style.borderBottom=null}
    lastIndex=i
    if (listView) {el=document.getElementById('title'+i); el.style.background='#1f1c18'}
    else {el=document.getElementById('thumb'+i); el.style.borderBottom='2px solid lightsalmon'}
    var x = el.getBoundingClientRect().bottom
    if (x > innerHeight-20 || x<20) myView.scrollTo(0, x + myView.scrollTop - innerHeight/2)}

  function sel(i) {							// highlight selected media
    if (!i || Click==2 || (gesture && wasMedia)) return
    if (listView) el=document.getElementById('title'+i)
    else el=document.getElementById('thumb'+i)
    var x = ','+selected
    if (x.match(","+i+",")) {
      el.style.outline = null
      selected = x.replace(","+i+",",",").slice(1)}
    else {
      if (listView) el.style.outline = '0.1px solid red'
      else el.style.outline = '1px solid red'
      if (!x.match(','+i+',')) selected=selected+i+','}}

  function context(e) {							// right click context menu
    var x = e.target.innerHTML						// ~ text under cursor
    if (!x || x.length>99)  mySelect.innerHTML='Select'
    else {mySelect.innerHTML='Select - '+x; mySelect.style.width='100%'}
    if (!wasMedia) wasMedia=0
    if (yw > 0.8) x=60							// cursor near window bottom, add offset
    else x=0
    myPic.style.backgroundPosition='0 0'
    mySeekbar.style.width=0
    myNav.style.left=xpos-45+'px'; myNav.style.top=ypos-10-x+'px'
    myNav.style.display='block'; myNav.style.background='#15110acc'
    if (wasMedia || playing) myNav2.style.display='block' 
    else {myNav2.style.display='none'; mySelect.style.minWidth=null}}

  function globals(vi, pg, ps, so, fi, lv, se, pl, ix) {		// import globals to java from inca
    view=vi; page=pg; pages=ps; sort=so; filt=fi; listView=lv; 
    selected=se; playlist=pl; index=ix; wasMedia=ix
    Filter(sort)							// show filter heading in red
    for (x of selected.split(',')) {if (x && !isNaN(x)) {		// highlight selected media			
      if (lv) document.getElementById('title'+x).style.outline = '0.1px solid red'
      else document.getElementById('thumb'+x).style.outline = '1px solid red'}}
    for (i=1; getParameters(i); i++)					// process cues (eg. thumb widths)
    scrolltoIndex(index)
    lastIndex=ix}

  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing) {
      var x = document.getElementById('thumb'+editing).value		// save textarea if edited
      messages=messages+'#Text#'+thumb.scrollTop.toFixed(0)+'#'+editing+'#'+x}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if (el.style.skinny) messages = messages + '#Skinny#'+el.style.skinny+'#'+i+'#'+cue
      if (el.style.rate) messages = messages + '#Rate#'+el.style.rate+'#'+i+'#'+cue}
    if (!select) {select=''} else {select=select+','}
    if (command == 'Favorite' && !selected) document.getElementById('myFavicon'+index).innerHTML='&#10084'
    if (selected && command!='Close' && command!='Reload') select=selected // selected is global value
    for (x of select.split(',')) {if (x=document.getElementById('thumb'+x)) if (x.src) {x.load()}}
    if (!value) value=''
    if (!address) address=''
    if (isNaN(value)) value=value.replaceAll('#', '<')			// because # is used as delimiter
    messages=messages+'#'+command+'#'+value+'#'+select+'#'+address
    navigator.clipboard.writeText(messages)				// send messages to inca
    messages=''}

  function Time(z) {if (z<0) return '0:00'; var y=Math.floor(z%60); var x=':'+y; if (y<10) {x=':0'+y}; return Math.floor(z/60)+x}
  function togglePause() {if(!thumbSheet && lastClick==1 && !longClick) {if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; positionMedia(0.6); thumb.style.transform='scaleX('+skinny+')'}
  function mute() {if(!longClick) {myPlayer.volume=0.05; myPlayer.muted=1*localStorage.getItem('muted')
    myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted)}}





