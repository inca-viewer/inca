
// Debugging	- use mySelected.innerHTML or alert()
// media from near edge zoom on cursor like google earth

// mute wrong
// use block again for next

  var defRate = 1*localStorage.getItem('defRate')			// default playback speed
  var mediaX = 1*localStorage.getItem('mediaX')				// myPlayer position
  var mediaY = 1*localStorage.getItem('mediaY')
  var scaleY = 1*localStorage.getItem('scaleY')				// myPlayer size
  var mpv = 1*localStorage.getItem('mpv')				// external media player
  var thumb = 0								// thumb element
  var title = 0								// title element
  var intervalTimer							// every 100mS
  var wheel = 0								// mouse wheel count
  var index = 1								// thumb index (e.g. thumb14)
  var lastIndex = 1							// last thumb id
  var lastStart = 0							// last video start time
  var lastCue								// last cue time
  var view = 14								// thumb size em
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
  var dur = 0								// duration (from inca)
  var rate = 1								// current myPlayer speed
  var skinny = 1							// media width
  var scaleX								// myPlayer width (skinny)
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

  scaleX = scaleY
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
      else if (overMedia && thumb.style.position=='fixed') {		// close popped out thumb
        thumb.style.position=null
        thumb.style.maxWidth=view*0.8+'em'
        thumb.style.maxHeight=view*0.8+'em'
        thumb.removeAttribute('controls')
        thumb.style.top=null; thumb.style.left=null}
      else if (myView.scrollTop > 50) myView.scrollTo(0,0)		// else scroll to page top
      else inca('Reload')}}, false)					// or reload page


  function mouseDown(e) {						// detect long click
    Click=e.button+1; lastClick=Click; longClick=0;
    gesture=0; Xref=xpos; Yref=ypos
    sessionStorage.setItem('scroll', myView.scrollTop)
    if (Click==2) e.preventDefault()					// middle click
    else if (overMedia) wasMedia=overMedia
    else wasMedia=0
    if (Click==2 && myPanel.matches(':hover')) return			// browser opens new tab
    myBody.style.cursor='none'
    clickTimer=setTimeout(function() {longClick=Click; clickEvent()},240)}


  function mouseUp(e) {
    if (!Click) return							// page load while mouse still down - ignore  
    clearTimeout(clickTimer)						// longClick timer
    if (Click==3 && !gesture && !longClick && !overText) context(e)	// new context menu
    if (!longClick) clickEvent()					// process click event
    Click=0; wheel=0; gesture=0; longClick=0}

  function mouseMove(e) {
    cursor=9
    xpos=e.clientX
    ypos=e.clientY
    if (!thumb) return
    if (!myNav.matches(":hover")) myNav.style.display=null
    if (myPanel.matches(':hover')) mySelected.style.fontSize='3em'
    else mySelected.style.fontSize=null
    mySelected.style.top = e.pageY +'px'
    mySelected.style.left = e.pageX +10 +'px'
    var x = Math.abs(xpos-Xref)
    var y = Math.abs(ypos-Yref)
    var z = 1*thumb.style.maxWidth.slice(0,-2)
    if (x+y > 4 && !gesture && Click) gesture=1				// gesture (Click + slide)
    if (!gesture || Click!=1) return
    if (!playing && wasMedia && !listView && type!='document') { 	// move thumb
      thumb.style.zIndex = Zindex+=1
      if (y<x-1 || gesture==2) {
        gesture = 2
        thumb.style.position = 'fixed'
        thumb.style.left = xpos-thumb.offsetWidth/2+"px"
        thumb.style.top = ypos-thumb.offsetHeight/2+"px"}
      else if (y>x) {							// zoom thumb
        if (ypos>Yref) z+=0.6; else z-=0.6
        if (z>view*0.8) {thumb.style.maxWidth=z+'em'; thumb.style.maxHeight=z+'em'}
        if (thumb.style.position=='fixed') {
          thumb.style.left = xpos-thumb.offsetWidth/2+'px'
          thumb.style.top = ypos-thumb.offsetHeight/2+'px'}}}
    else if (playing) {							// move myPlayer
      mediaX += xpos - Xref
      mediaY += ypos - Yref
      localStorage.setItem("mediaX",mediaX.toFixed(0))
      localStorage.setItem("mediaY",mediaY.toFixed(0))}
    if (Click && playing) positionMedia(0)
    Xref=xpos; Yref=ypos}


  function wheelEvent(e, id, el) {
    e.preventDefault()
    wheel += Math.abs(e.deltaY)
    if (Click || wheel < 64) return
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
    else if (id=='mySpeed') {						// speed
      if (type=='video' || type=='audio') {
        if (wheelUp) rate -= 0.01
        else rate += 0.01
        rate = Math.round(100*rate)/100
        thumb.style.rate = rate}}					// css holds edited rate
    else if (id=='mySkinny') {						// skinny
      if (wheelUp) skinny -= 0.003
      else skinny += 0.003
      skinny=Math.round((1000*skinny))/1000
      thumb.style.skinny = skinny					// css holds edited skinny
     getParameters(index)
      positionMedia(0)}
    else if (id=='View') {						// thumb size
      if (wheelUp) view += 1
      else view -= 1
      View.innerHTML='View '+ (view-6)
      thumbSize()} 
    else if (id=='mySelect' && playing) {				// next/previous
      if (wheelUp) index++
      else if (index>1) index--
      lastClick=0; clickEvent()}
//      if (type=='video' || type=='audio') {wheel=-50; return}}
    else if ((id=='myDelete' || id=='myIndex') && (type=='video' || type=='audio')) {	// seek
      if (dur > 120) interval = 3
      else interval = 0.5
      mySeekbar.style.opacity = 1
      if (myPlayer.paused) interval = 0.04
      if (wheelUp) myPlayer.currentTime += interval
      else myPlayer.currentTime -= interval}
    else if (playing) {							// zoom myPlayer
      if (scaleY>0.2 && !wheelUp) scaleY *= 0.97
      else scaleY *= 1.03
      localStorage.setItem('scaleY',scaleY.toFixed(3))
      positionMedia(0.15)}
    wheel=0; lastCue=-1}


  function clickEvent() {						// functional logic
    if (Click==2 && !playing) {inca('View',view,'',lastIndex); return}	// middle click - switch list/thumb view
    if (gesture || title.matches(':hover')) return			// allow rename of media in htm
    if (!playing && !longClick && !overMedia) return
    if (lastClick==3 && !longClick) return
    if (longClick==3 && !playing && !overMedia) return
    if (longClick && myInput.matches(':hover')) return
    if (longClick && myPanel.matches(':hover')) return			// copy files instead of move
    if (myNav.matches(':hover') && lastClick==1) return
    if (!gesture && longClick==1 && !playing && playlist && wasMedia && selected) {inca('Move', wasMedia); return}
    if (!thumb.src && (type=='document' || type=='m3u')) return
    if (playing && type == 'video' && lastClick==1) {
      if (thumbSheet || xm>0&&xm<1&&ym>0.9&&ym<1) {getStart(); return}
      else if (!longClick) {togglePause(); return}}
    if (!playing) {
      if (!mediaX || mediaX < 0 || mediaX > innerWidth) mediaX=innerWidth/2
      if (!mediaY || mediaY < 0 || mediaY > innerHeight) mediaY=innerHeight/2
      if (!scaleY || scaleY>2 || scaleY<0.15) scaleY=0.4
      localStorage.setItem('scaleY',scaleY.toFixed(3))}
    if (playing && !longClick && lastClick==2) index++			// next - middle click
    if (longClick==2) {index--; getParameters(index)}			// previous - long middle click
    if (!playing || thumbSheet) fade=0
    if (!thumbSheet && longClick==2) myPlayer.poster=thumb.poster	// stops transition artifacts
    positionMedia(fade)
    setTimeout(function() {						// so player can fade in/out 
      if (longClick && !overMedia && !playing) index=lastIndex		// return to last media
      if (!getParameters(index)) {closePlayer(); return}		// end of media list
      var ratio = thumb.offsetWidth/thumb.offsetHeight
      if (ratio>1) {x=innerWidth*0.70; y=x/ratio}			// landscape
      else {y=innerHeight; x=y*ratio}					// portrait  
      myPlayer.style.width = x +'px'
      myPlayer.style.height = y +'px'
      myPlayer.style.top = mediaY-y/2 +'px'				// media size normalised to screen
      myPlayer.style.left = mediaX-x/2 +'px'
      if (!longClick && !thumbSheet) myPlayer.poster=thumb.poster
      positionMedia(0)
      myCap.innerHTML = ''
      myPreview.src = thumb.src						// seeking preview window
      myPlayer.style.zIndex = Zindex+=1					// because htm thumbs use Z-index
      if (myPlayer.src != thumb.src) myPlayer.src = thumb.src
      if (type=='image') myPlayer.poster = thumb.poster			// images use poster as src
      if ((thumbSheet || longClick==1) && type=='video' && (playing || overMedia)) {
        thumbSheet=1.4*Math.abs(1/scaleY)
        if (ratio<1) thumbSheet*=0.7}
      else if (!playing && !overMedia) myPlayer.currentTime=lastStart	// return to last media
      else if (!thumbSheet && (!playing || lastClick==2)) {
        myPlayer.currentTime=thumb.style.start}				// css variable - poster defaultstart time
      if (lastClick==3) myPlayer.currentTime=0
      scrolltoIndex(index)			    			// + highlight played media
      positionMedia(0.2)
      Play()},fade*400)}


  function Play() {
    lastIndex = index
    var para = myPlayer.currentTime+'|'+skinny+'|'+rate+'|'+localStorage.getItem('muted')
    if (!thumbSheet && type=='video' && mpv) playing='mpv'
    else playing='browser'
    myPlayer.muted = 1*localStorage.getItem('muted')
    if (thumbSheet) Thumbsheet()
    else if (lastClick) messages=messages+'#History#'+myPlayer.currentTime.toFixed(1)+'#'+index+'#'
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
    myPlayer.volume = 0.05
    if (looping) looping=1
//    if (lastClick==2) clearTimeout(playingTimer)
//    playingTimer = setTimeout(function() {
//      if (type=='video' && !thumbSheet && !myPlayer.duration) {		// if browser cannot play
//        closePlayer(); playing='mpv'; inca('Media',0,index,para)}},500)	// try external mpv player
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
    if (type == 'document') return 1
    Cues(0,i)								// process 0:00 cues - width, speed etc.
    x = 1*thumb.style.skinny						// get any live width edits
    if (x && x!=skinny) skinny=x
    thumb.style.transform='scale('+skinny+',1)' 			// has been edited
    x = 1*thumb.style.rate						// custom css variable - rate edited
    if (x && x != rate) rate=x
    if (type!='image' && !dur) dur=thumb.duration			// just in case - use browser calc.
    if (!thumbSheet && !longClick && type!='image' && myPlayer.src != thumb.src) {
      myPlayer.src = thumb.src
      myPlayer.poster=thumb.poster
      myPlayer.currentTime=thumb.currentTime}
    return 1}


  function timerEvent() {						// every 100mS 
    xw = xpos / innerWidth
    yw = ypos / innerHeight
    if (!thumb) return
    if (cursor) cursor--
    if (!playing || thumbSheet) myBody.style.cursor=null		// hide cursor and seekbar
    else if (!cursor || Click) {mySeekbar.style.opacity=0; myBody.style.cursor='none'}
    else {myBody.style.cursor='crosshair'; if (type!='image') mySeekbar.style.opacity=1}
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
    if ((wasMedia || playing) && mySelect.matches(':hover')) {
      mySelect.innerHTML='Select - '+index+' - '+title.value}
    else mySelect.innerHTML='Select'
    if (mpv) {myMpv.style.color='red'} else myMpv.style.color=null
    if (looping) {myLoop.style.color='red'} else myLoop.style.color=null
    if (myPlayer.muted) {myMute.style.color='red'} else myMute.style.color=null
    if (skinny<0) {myFlip.style.color='red'} else myFlip.style.color=null
    if (myPlayer.style.opacity==0) {if (myPlayer.volume>0.01) myPlayer.volume/=2}
    else if (myPlayer.volume < 0.8) myPlayer.volume *= 1.3		// fade sound in/out
    if (playing=='browser') {
      myPlayer.playbackRate=rate
      rect = myPlayer.getBoundingClientRect()
      myCap.style.top=rect.bottom +10 +'px'
      myCap.style.left=rect.left +10 +'px'
      myCap.style.zIndex=Zindex
      if ((","+selected).match(","+index+",")) {mySelect.style.color='red'; myPlayer.style.outline='1px solid red'}
      else {mySelect.style.color=null; myPlayer.style.outline=null}
      if (cue) {Cap.innerHTML='goto '+myPlayer.currentTime.toFixed(2)} else Cap.innerHTML='caption'
      if (myCap.innerHTML) myCap.style.opacity=1
      if (cueList && !thumbSheet) Cues(myPlayer.currentTime, index)
      var z=1
      if (thumbSheet) z=thumbSheet
      xm = myPlayer.offsetWidth*scaleX*z
      ym = myPlayer.offsetHeight*scaleY*z
      xm = (xpos - rect.left) / Math.abs(xm)
      ym = (ypos - rect.top) / Math.abs(ym)
      myPlayer.style.zIndex=Zindex+1
      mySeekbar.style.display='flex'
      mySeekbar.style.zIndex=Zindex+1
      myPreview.style.zIndex=Zindex+1
      if (!thumbSheet) lastStart=myPlayer.currentTime
      if (type!='image' && !Click) seekBar()
      if (!Click && !thumbSheet && xm>0&&xm<1&&ym>0.9&&ym<1) {
        myPreview.currentTime=dur*xm
        myPreview.style.left = xpos - myPreview.offsetWidth/2 +'px'	// seeking preview popup
        myPreview.style.top = rect.bottom -116 +'px'
        myPreview.style.display='flex'
        mySeekbar.style.width = myPlayer.offsetWidth*scaleY*xm + 'px'}
      else myPreview.style.display=null
      positionMedia(0)
      Jpg.innerHTML='jpg'}
    else {
      Jpg.innerHTML=''
      myCap.innerHTML=''
      myCap.style.opacity=0
      mySeekbar.style.display=null
      myPreview.style.display=null
      myPlayer.style.zIndex=-1}}					// in case flipped into fullscreen


  function seekBar() {							// progress bar beneath player
    var cueX = rect.left
    var cueW = 0.95*Math.abs(scaleX)*myPlayer.offsetWidth*myPlayer.currentTime/dur
    if (cue && cue <= Math.round(myPlayer.currentTime*100)/100) {
      cueX = mediaX - Math.abs((myPlayer.offsetWidth*scaleX))/2 + scaleX * myPlayer.offsetWidth * cue/dur
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime-cue)/dur)
      if (cue == Math.round(myPlayer.currentTime*100)/100) {
        cueW = Math.abs(scaleX*myPlayer.offsetWidth*(dur-cue)/dur)}}
    else if (cue) {
      cueX = rect.left + Math.abs(scaleX*myPlayer.offsetWidth*(myPlayer.currentTime)/dur)
      cueW = Math.abs(scaleX*myPlayer.offsetWidth*(cue - Math.round(myPlayer.currentTime*100)/100)/dur)
      if (cue < 0.1+Math.round(myPlayer.currentTime*100)/100) {
        cueX = rect.left; cueW = Math.abs(scaleX*myPlayer.offsetWidth*myPlayer.currentTime/dur)}}
    if (rect.bottom+6 > innerHeight) mySeekbar.style.top = innerHeight -10 +'px'
    else mySeekbar.style.top = rect.bottom-12 +'px'
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
    var x=mediaX; var y=mediaY; var z=1
    if (!screenLeft) {x=innerWidth/2; y=innerHeight/2}
    myPlayer.style.left = x - (myPlayer.offsetWidth/2) +"px"
    myPlayer.style.top = y - (myPlayer.offsetHeight/2) +"px"
    myPlayer.style.transition = fa+'s'
    scaleX=skinny*scaleY; if(thumbSheet) z=thumbSheet
    myPlayer.style.transform = "scale("+scaleX*z+","+scaleY*z+")"}


  function thumbSize() {						// change thumb size
    if (view < 8) view = 8
    if (view > 99) view = 99
    el = document.getElementById('thumb1')
    el.style.opacity=1
    el.style.transition='0.2s'
    el.style.zIndex = Zindex+=1
    el.style.maxWidth=(view*0.8)+'em'
    el.style.maxHeight=(view*0.8)+'em'}

  function getStart() {
    myPlayer.poster=''
    if (thumbSheet) {
      if (skinny < 0) xm = 1-xm						// flipped media
      var row = Math.floor(ym * 6)					// get media seek time from thumbsheet xy
      var col = Math.ceil(xm * 6)
      var offset = 0
      var ps = 5 * ((row * 6) + col)
      ps = (ps - 1) / 200
      if (dur > 60) offset = 20
      if (longClick==1 || xm>1||xm<0|ym>1||ym<0) myPlayer.currentTime=lastStart
      else myPlayer.currentTime=offset - 0.4 - (ps * offset) + dur * ps}
    else myPlayer.currentTime=xm*dur
    thumbSheet=0
    Play()}

  function overThumb(id,el) {						// play htm thumb
    overMedia=id; index=id
    getParameters(id)
    var x = (ypos-el.getBoundingClientRect().top)/el.offsetHeight	// reset thumb time if enter from top
    if (type=='video') {if (!el.currentTime || x<0.1) el.currentTime=el.style.start+0.05}
    if (Click) sel(id)}

  function Thumbsheet() {						// 6x6 thumbsheet
    var x = thumb.poster.replace("/posters/", "/thumbs/")		// points to thumbsheets folder
    var y = x.split('%20')						// see if embedded fav start time in poster filename
    y = y.pop()
    y = y.replace('.jpg', '')
    if (!isNaN(y) && y.length > 2 && y.includes('.')) {			// very likely a 'fav' suffix timestamp
      x = x.replace('%20' + y, '')}					// so remove timestamp from filename
    myPlayer.poster = x							// now use 6x6 thumbsheet file
    myPlayer.load()}

  function nextMedia() {
    if (!looping) {
      lastClick=2
      myPlayer.pause()
      if (playlist.match('/inca/music/')) {
        setTimeout(function() {clickEvent()}, Math.random()*6000)}	// next media
      else {clickEvent()}; return}
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
    if (listView) {el=document.getElementById('title'+i); el.style.background='#1f1c18'}
    else {el=document.getElementById('thumb'+i); el.style.borderBottom='1px solid lightsalmon'}
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
    var offset=''
    myDelete.style.color=null
    if (panel.matches(':hover')) {
      var x = e.target.innerHTML					// ~ text under cursor
      if (x && x.length<99) {
        myDelete.style.color='red'; myDelete.innerHTML='Delete - '+x}}
    else {myDelete.style.color=null; myDelete.innerHTML='Delete'}
    if (yw > 0.8) offset=60						// cursor near window bottom, add offset
    myNav.style.left=xpos-45+'px'; myNav.style.top=ypos-10-offset+'px'
    myNav.style.display='block'; myNav.style.background='#15110acc'
    if (overMedia) myNav2.style.display='block' 
    else myNav2.style.display='none'}

  function globals(vi, pg, ps, so, fi, lv, se, pl, ix) {		// import globals to java from inca
    view=vi; page=pg; pages=ps; sort=so; filt=fi; listView=lv; 
    selected=se; playlist=pl; index=ix; wasMedia=ix; lastIndex=ix
    Filter(sort)							// show filter heading in red
    for (x of selected.split(',')) {if (x && !isNaN(x)) {		// highlight selected media			
      if (lv) document.getElementById('title'+x).style.outline = '0.1px solid red'
      else document.getElementById('thumb'+x).style.outline = '1px solid red'}}
    for (i=1; getParameters(i); i++)					// process cues (eg. thumb widths)
    scrolltoIndex(index)}

  function inca(command,value,select,address) {				// send java messages to inca.exe
    if (editing) {
      var x = document.getElementById('thumb'+editing).value		// save textarea if edited
      x = '#Text#'+thumb.scrollTop.toFixed(0)+'#'+editing+'#'+x
      navigator.clipboard.writeText(x); return}
    for (i=1; el=document.getElementById('thumb'+i); i++) {		// add cue edits to messages
      if (el.style.skinny) messages = messages + '#Skinny#'+el.style.skinny+'#'+i+'#'+cue
      if (el.style.rate) messages = messages + '#Rate#'+el.style.rate+'#'+i+'#'+cue
      if (cue) {cue=0; el.style.skinny=0; el.style.rate=0}}
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
  function togglePause() {if(!thumbSheet && lastClick==1) {if (myPlayer.paused) {myPlayer.play()} else {myPlayer.pause()}}}
  function selectAll() {for (i=1; document.getElementById('thumb'+i); i++) {sel(i)}}
  function flip() {skinny*=-1; scaleX*=-1; thumb.style.skinny=skinny; positionMedia(0.6); thumb.style.transform='scaleX('+skinny+')'}
  function mute() {if(!longClick) {myPlayer.volume=0.05; myPlayer.muted=!myPlayer.muted; localStorage.setItem("muted",1*myPlayer.muted)}}





