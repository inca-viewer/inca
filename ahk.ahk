 

	; Browser Based File Explorer - Windows
	; AutoHotKey script generates web pages of your media
	; browser communicates via the clipboard


	#NoEnv
	#UseHook, On
	SetWinDelay, 0
	SetKeyDelay, 0
	SetBatchLines -1
	SetTitleMatchMode, 2
	GroupAdd, Browsers, Google Chrome
	GroupAdd, Browsers, Mozilla Firefox
	GroupAdd, Browsers, ahk_exe brave.exe
	GroupAdd, Browsers, ahk_exe msedge.exe
	GroupAdd, Browsers, ahk_exe opera.exe

	#SingleInstance force			; one program instance only
	#MaxHotkeysPerInterval 999		; allow fast spinning wheel
	SetWorkingDir, %A_ScriptDir%		; consistent start directory

        Global profile
        Global sortList := "Shuffle|Alpha|Duration|Date|Size|Type|Reverse|Recurse|Videos|Images|List|"
        Global toggles				; eg. reverse
        Global config				; program settings
        Global fol				; favorite folders
        Global fav				; favorite playlists
        Global music				; music playlists
        Global search				; list of search words
        Global searchFolders			; default search locations
        Global indexFolders			; to index thumb sheets
        Global searchPath			; current search paths
        Global inca				; default folder path
        Global list				; sorted media file list
        Global listId
        Global listSize
        Global selected :=""			; selected files from web page
        Global searchTerm
        Global src				; current media file incl. path
        Global media				; media filename, no path or ext
        Global mediaPath
        Global type				; eg. video
	Global subfolders
        Global folder				; current folder name, no path
        Global path
        Global ext				; file extension
        Global incaTab				; browser tab title (usually folder name)
	Global previousTab:=""
        Global volume
        Global page := 1			; current page within list
        Global sort
	Global filt := 0			; secondary search filter eg. date, duration, Alpha letter
        Global click				; mouse click type
        Global timer				; click down timer
        Global view := 14			; thumb view (em size)
        Global listView := 0
        Global volRef := 2
        Global wheel
        Global playlist				; playlist - full path
	Global xpos				; current mouse position - 100mS updated 
	Global ypos
        Global command				; message fields
        Global value
        Global address
        Global skinny
        Global seek
        Global target
        Global reload
        Global browser				; current browser
        Global longClick
        Global fullscreen
        Global pages
        Global poster				; htm thumbnail
        Global mediaList
        Global panelList
        Global foldr
        Global index := 1			; scroll to index
        Global cue := 0				; media cut, start, stop point
        Global messages				; between browser and this program
        Global playing =			; media is playing in browser
        Global gesture
        Global lastClip				; preserve clipboard
        Global allFav				; all favorite shortcuts consolidated
        Global showSubs
        Global lastMedia
        Global lastPath
        Global lastStatus


    main:
      initialize()				; set environment
      WinActivate, ahk_group Browsers
      sleep 333
      send ^l{Right}
      sleep 333
      if !GetBrowser()
        Clipboard = #Path###%profile%\Pictures\
      Clipboard()				; process clipboard message
      SetTimer, TimedEvents, 100		; every 100mS
      return					; wait for mouse/key events



    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        poster =
        view2 := view*0.66
        view3 := view*0.8
        view4 := view/10
        if ((cap_size := view / 16) > 1.4)
          cap_size := 1.4
        if DetectMedia(input)
            thumb := src
        else thumb = %inca%\cache\icons\no link.png
        x := RTrim(mediaPath,"\")
        SplitPath, x,,,,y
        if (searchTerm && foldr != y && sort == "Alpha")
          fold = <div style="font-size:1.4em; color:salmon; width:100`%">%y%</div>`n
        foldr := y
        if (searchTerm || InStr(toggles, "Recurse"))
          fo := y
        FileRead, dur, %inca%\cache\durations\%media%.txt
        if (dur && !playlist)						; calc. 1st thumbnail start time
          {
          if (dur > 60)
            start := 20.1 + (4 * (dur - 20)/200)
          else start := 4 * dur / 200
          }
        dur := Time(dur)
        FileRead, cueList, %inca%\cache\cues\%media%.txt
        if cueList
          {
          if InStr(cueList,"cap")
            favicon = &copy
          cueList := StrReplace(cueList, "`r`n", "#1")			; lines
          cueList := StrReplace(cueList, "|", "#2")			; entries
          cueList := StrReplace(cueList, ",", "#3")			; cap punctuation...
          cueList := StrReplace(cueList, "'", "#4")
          StringReplace, cueList,cueList, ", #5, All
          }
        if (type == "video")
          IfExist, %inca%\cache\posters\%media% %start%.jpg		; replace poster with fav poster
            thumb = %inca%\cache\posters\%media% %start%.jpg
          else thumb =  %inca%\cache\posters\%media%.jpg
        FileGetSize, size, %src%, K
        size := Round(size/1000,1)
        FileGetTime, listId, %src%, M
        sort_date := A_Now
        sort_date -= listId, days
        date = today
        years := floor(sort_date / 365)
        if years
          date = %years% y
        else if sort_date 
          date = %sort_date% d
        if (type == "audio" || type == "m3u")
            thumb = %inca%\cache\icons\music.png
        if (type == "document")
            thumb = %inca%\cache\icons\ebook.png
        StringReplace, thumb, thumb, #, `%23, All
        StringReplace, src, src, #, `%23, All				; html cannot have # in filename
        stringlower, thumb, thumb
        poster = poster="file:///%thumb%"
        StringReplace, media_s, media, `', &apos;, All
        if (!playlist && InStr(allFav, src))
          favicon = &#10084 %favicon%					; favorite heart symbol
        IfExist, %thumb%
          preload = 'none'						; faster page load
        else 
          {
          preload = 'auto'						; but show/load non indexed media
          poster = 
          }

if listView
  mediaList = %mediaList% %fold%<table onmouseover="media%j%.style.opacity=1; overMedia=%j%; index=%j%"; onmouseout="title%j%.style.color=null; overMedia=0; media%j%.style.opacity=0">`n <tr id="entry%j%"`n onmouseover="title%j%.style.color='lightsalmon'; if(Click) {sel(%j%)}">`n <td onmouseenter='media%j%.style.opacity=0'>%ext%`n <video id='media%j%' onmouseover="getParameters(%j%, '%type%', '%cueList%', %start%, event)" class='media2' style="max-width:%view3%em; max-height:%view3%em"`n src="file:///%src%"`n %poster%`n preload=%preload% muted loop type="video/mp4"></video></td>`n <td>%size%</td>`n <td style='min-width:7em'>%dur%</td>`n <td>%date%</td>`n <td style='min-width:4.4em'>%j%</td>`n <td style='width:99em'><input id="title%j%" class='title' type='search' value='%media_s%'`n onmouseenter='overMedia=0; media%j%.style.opacity=0' oninput="wasMedia=%j%; renamebox=this.value"></td>`n <td id='myFavicon%j%' style='font-size:0.8em; color:salmon; min-width:1em' onclick="inca('EditCap',0,'%j%')">%favicon%</td>`n <td>%fo%</td></tr></table>`n`n

else
  mediaList = %mediaList%<div id="entry%j%" style="display:flex; width%view%em; height:%view3%em; padding-top:%view4%em">`n <video id="media%j%" class='media' style="max-width:%view3%em; max-height:%view3%em"`n onmouseover="overMedia=%j%; index=%j%; getParameters(%j%, '%type%', '%cueList%', %start%, event); this.play(); if(Click) {sel(%j%)}"`n onmouseout="this.pause(); overMedia=0"`n src="file:///%src%"`n %poster%`n preload=%preload% muted loop type="video/mp4"></video>`n <input id='title%j%' value='%media_s%' class='title' style='display:none'>`n <span id='myFavicon%j%' style='translate:0 1.8em; font-size:0.8em; color:salmon' onclick="inca('EditCap',0,'%j%')">%favicon%</span>`n </div>`n`n

}



    RenderPage()							; construct web page from media list
        {
        Critical							; pause key & timer interrupts
        if !path
          return
        foldr =
        mediaList =
        x = %folder%\
        if (InStr(fol, x) || playlist)
          showSubs =
        else if InStr(subfolders, x)
          showSubs = true
        if (InStr(fol, x) || InStr(subfolders, x))
          {
          if (!showSubs || InStr(fol, x))
            subfolders =
          Loop, Files,%path%*.*, D
            if A_LoopFileAttrib not contains H,S
              if !InStr(subfolders, A_LoopFileFullPath)
                if subfolders
                  subfolders = %subfolders%|%A_LoopFileFullPath%\
                else subfolders = %A_LoopFileFullPath%\
          }
        if (playlist || searchTerm)
          subfolders = 
        if subfolders
          sub = color:red
        else sub = color:#15110a
        title := folder
        title_s := SubStr(title, 1, 20)					; keep title under 20 chars for htm page
        FileRead, java, %inca%\java.js
        FileRead, ini, %inca%\ini.ini
        ini := StrReplace(ini, "`r`n", "|")				; java cannot accept cr in strings
        ini := StrReplace(ini, "'", ">")				; java cannot accept ' in strings
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        count:=0
        listSize := 0
        type = video							; prime for list parsing
        page_l := Setting("Margin Left")
        page_r := Setting("Margin Right")
        page_s := Setting("Page Size")
        page_w := 100 - page_l - page_r
        Loop, Parse, list, `n, `r 					; split big list into smaller web pages
          {
          item := StrSplit(A_LoopField, "/")				; sort filter \ src \ media type \ ext
          id := item.1
          source := item.2
          type := item.3
          sort_name := item.4
          start := item.5
          listSize += 1
          if ((listSize > (page-1) * page_s) && (listSize <= page * page_s))
            SpoolList(listSize, count+=1, source, sort_name, start)
          }
        pages := ceil(listSize/page_s)
        if (pages > 1)
          pg = Page %page% of %pages%
        Loop, Parse, sortList, `|
          {
          if InStr(A_LoopField, sort)
            if InStr(toggles, "Reverse")
              x%A_Index% = border-top:0.1px solid salmon
            else x%A_Index% = border-bottom:0.1px solid salmon
          if InStr(toggles, A_LoopField)
            x%A_Index% = color:red
          }
        if playlist
          order = List
        panelList =							; next sections fills top panel element

        if subfolders
          {
          container = <div id='Sub' style='font-size:2em; color:#ffa07ab0; margin:0.8em; text-align:center'>Sub</div>`n
          container := fill(container)
          }
        Loop, Parse, subfolders, `|
            {
            StringTrimRight, x, A_Loopfield, 1
            array := StrSplit(x,"\")
            x := array.MaxIndex()
            fname := array[x]
            if (array[x] == folder)
              container = %container%<c class='p2' style='color:lightsalmon' onmousedown="inca('Path', event.button, '', '%A_Loopfield%')">%fname%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path', event.button, '', '%A_Loopfield%'); this.style.transform='translate(0em,-0.2em)'; this.style.color='red'">%fname%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if (subfolders && container)
          fill(container)

        container = <div id='Fol' style='font-size:2em; color:#ffa07ab0; margin:0.8em; text-align:center'>Fol</div>`n
        container := fill(container)
        Loop, Parse, fol, `|
            {
            StringTrimRight, y, A_Loopfield, 1
            SplitPath, y,,,,x
            if (x == folder)
              container = %container%<c class='p2' style='color:salmon' onmousedown="inca('Path', event.button, '', '%A_Loopfield%')">%x%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path', event.button, '', '%A_Loopfield%'); this.style.transform='translate(0em,-0.2em)'; this.style.color='red'">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        container = <div id='Fav' style='font-size:2em; color:#ffa07ab0; margin:0.8em; text-align:center'>Fav</div>`n
        container := fill(container)
        Loop, Parse, fav, `|
            {
            SplitPath, A_Loopfield,,,,x
            if (x == folder)
              container = %container%<c class='p2' style='color:salmon; font-size:0.9em; margin-left:0.2em' onmousedown="inca('Path', event.button, '', '%A_Loopfield%')">%x% &#10084</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path', event.button, '', '%A_Loopfield%'); this.style.transform='translate(0em,-0.2em)'; this.style.color='red'">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        container = <div id='Music' style='font-size:2em; color:#ffa07ab0; margin:0.8em; text-align:center'>Music</div>`n
        container := fill(container)
        Loop, Parse, music, `|
            {
            SplitPath, A_Loopfield,,,,x
            if (x == folder)
              container = %container%<c class='p2' style='color:salmon' onmousedown="inca('Path', event.button, '', '%A_Loopfield%')">%x%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path', event.button, '', '%A_Loopfield%'); this.style.transform='translate(0em,-0.2em)'; this.style.color='red'">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)
        ch =
        count := 0
        container =
        Loop, Parse, search, `|
            {
            x := SubStr(A_Loopfield, 1, 1)
            if (ch != x)
              {
              if container
                fill(container)
              container = <div id='my%x%' style='font-size:2.2em; color:#ffa07ab0; text-align:center'>%x%</div>`n
              container := fill(container)
              count := 0
              }
            ch := x
            count+=1
            if (searchTerm == A_Loopfield)
              container = %container%<c class='p2' style='color:salmon' onmousedown="inca('Search',event.button,'','%A_Loopfield%')">%A_Loopfield%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Search',event.button,'','%A_Loopfield%'); this.style.transform='translate(0em,-0.2em)'; this.style.color='red'">%A_Loopfield%</c>`n
            if !Mod(count,4)
              container := fill(container)
            }
        if container
          fill(container)

        if (view < 8) 
          view := 8
        view1 := view*1.2
        view2 := view*0.8
        view3 := view/10 

scroll = Fol				; for scroll to headers in top panel
if searchTerm
  st := searchTerm
else
  {
  st = Search
  if InStr(path, "\inca\fav\")
    scroll = Fav
  if InStr(path, "\inca\music\")
    scroll = Music
  if showSubs
    scroll = Sub
  }
x:=SubStr(searchTerm, 1, 1)
stringUpper, x, x
if searchTerm
  {
  scroll = my%x%
  offset = `;%A_Space%panel.scrollBy(0,-285)
  }

header = <!--, %view%, %page%, %pages%, %filt%, %sort%, %toggles%, %listView%, %playlist%, %path%, %searchPath%, %searchTerm%, , -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" type="image/x-icon" href="file:///%inca%\cache\icons\inca.ico">`n<link rel="stylesheet" type="text/css" href="file:///%inca%/css.css">`n</head>`n`n

body = <body id='myBody' class='container' onload="myBody.style.opacity=1;`n if(document.getElementById('%scroll%')) {%scroll%.scrollIntoView()%offset%} myView.scrollTo(0,1*sessionStorage.getItem('scroll'));`n globals(%view%, %page%, %pages%, '%sort%', %filt%, %listView%, '%selected%', '%playlist%', %index%)">`n`n

<div id='myContent' style='position:absolute; width:100`%'>`n`n
<div id='mySelected' class='selected'></div>`n

<div oncontextmenu="if(yw>0.1 || type) {event.preventDefault()}">`n`n
<div id='myContext' class='context'>`n
<a id='myDelete' onmousedown="if(!event.button) {inca('Delete','',wasMedia)}">Delete</a>`n
<a id='mySelect' onmouseup="if (!longClick && wasMedia) {sel(index)} else{selectAll()}">Select</a>`n
<a id='myFav' onmousedown="if(!event.button && !longClick) {inca('Favorite', start, wasMedia)}">Fav</a>`n
<a id='myIndex' onmousedown="inca('Index','',wasMedia)">Index</a>
<a id='myFade' onwheel="wheelEvents(event, id, this)">Fade</a>`n
<a id='myRate' onwheel="wheelEvents(event, id, this)">Speed</a>`n
<a id='myJoin' onmousedown="inca('Join')">Join</a>
<a id='myMp3' onmousedown="inca('mp3', myPlayer.currentTime.toFixed(1), wasMedia, cue.toFixed(1))">mp3</a>`n
<a id='myMp4' onmousedown="inca('mp4', myPlayer.currentTime.toFixed(1), wasMedia, cue.toFixed(1))">mp4</a>`n
<a id='mySettings' onmouseup="inca('Settings')"> . . .</a>`n</div>`n`n

<div id='myContext2' class='context'>`n
<a id='myDelete2' onmousedown="if(!event.button) {inca('Delete','',wasMedia)}">Delete</a>`n
<a id='mySelect2' onmouseup='sel(index)'`n onwheel="wheelEvents(event, id, this)"`n onmouseover="nav2.style.opacity=1"`n onmouseout="this.innerHTML='Select'" >Select</a>`n
<a id='myFav2' onwheel="wheelEvents(event, id, this)" onmouseup="if(!event.button && !longClick) inca('Favorite', myPlayer.currentTime.toFixed(1), index)">Fav</a>`n
<a id='myNext' style='font-size:1.5em' onwheel="wheelEvents(event, id, this)" onmouseup='togglePause()'></a>`n
<a id='mySpeed' onwheel="wheelEvents(event, id, this); nav2.style.opacity=1" onmouseup='togglePause()'></a>`n
<a id='mySkinny' onwheel="wheelEvents(event, id, this); nav2.style.opacity=1" onmouseup='togglePause()'></a>`n
<a id='myFlip' onmousedown='flip()'>Flip</a>`n
<a id='myMute' onmouseup='mute()'>Mute</a>`n
<a id='myLoop' onclick="loop()">Loop</a>`n
<a id='myCue' onwheel="wheelEvents(event, id, this)" onclick="cueActive=true; myPlayer.pause(); cue=Math.round(myPlayer.currentTime*10)/10">Cue</a>`n
<a id='myCapnav' onclick="inca('EditCap',0,'%j%')">Cap</a></div>`n`n

<div id='myModal' class="modal" onwheel="wheelEvents(event, id, this)">`n
<div><video id="myPlayer" class='player' type="video/mp4" muted></video>`n
<span id='mySeekbar' class='seekbar'></span>`n
<textarea id='myCap' class="caption" onmouseenter="if(this.innerHTML){overCap=true}"`n onmouseleave="overCap=false"></textarea>
<span><video class='preview' id='myPreview' muted type="video/mp4"></video></span></div></div></div>`n`n

<div id='myView' class='myList' style='padding-left:%page_l%`%; padding-right:%page_r%`%'>`n`n

<div class='ribbon' style='height:1.4em; justify-content:center; background:#1b1814'>`n
<a style='width:6em; font-size:1.4em; margin-left:1em; margin-top:-0.2em; %sub%' onmousedown="inca('Path')" onmouseover="Sub.scrollIntoView(); myView.scrollTo(0,0)">&#8678</a>`n
<a style='width:6em; text-align:left' onmouseover="Fol.scrollIntoView(); myView.scrollTo(0,0)">Fol</a>`n
<a style='width:6em; text-align:left; padding-left:1em' onmouseover="Fav.scrollIntoView(); myView.scrollTo(0,0)">Fav</a>`n
<a style='width:7em; text-align:left; padding-left:1em' onmouseover="Music.scrollIntoView(); myView.scrollTo(0,0)">Music</a>`n
<input id='myInput' class='searchbox' style='width:50`%; border-radius:1em; padding-left:1em' type='search' value='%st%' onmousedown="if(myInput.value.includes('Search')) {myInput.value=''}" onmousemove='getAlpha(event, this)'>`n
<a id='SearchBox' class='searchbutton' onclick="inca('SearchBox','','',myInput.value)"></a>`n
<a id='SearchAll' class='searchbutton' onclick="inca('SearchAll','','',myInput.value)"></a>`n
<a id='SearchAdd' class='searchbutton' onclick="inca('SearchAdd','','',myInput.value)"></a>`n
<a id='SearchRen' class='searchbutton' onclick="inca('Rename', myInput.value, wasMedia)"></a></div>`n`n

<div id='myPanel' class='myPanel' onmouseover="if(selected) {this.style.border='1px solid salmon'}" onmouseout="this.style.border='none'">`n <div id='panel' class='panel'>`n`n%panelList%`n<div style='height:40em'></div></div></div>`n`n

<div id='myRibbon' class='ribbon'>`n
<a id='Type' style='width:3em; %x6%' onmousedown="inca('Type')">Type</a>`n
<a id='Size' style='min-width:4em; %x5%' onmousedown="inca('Size', filt)" onwheel="wheelEvents(event, id, this)">Size</a>`n
<a id='Duration' style='min-width:5.5em; %x3%' onmousedown="inca('Duration', filt)" onwheel="wheelEvents(event, id, this)"> Duration</a>`n
<a id='Date' style='min-width:4.5em; %x4%' onmousedown="inca('Date', filt)" onwheel="wheelEvents(event, id, this)">Date</a>`n
<a id='List' style='width:3em; %x11%' onmousedown="inca('List', filt)" style='color:red'>%order%</a>`n
<a id='Alpha' style='width:7`%; %x2%' onmousedown="inca('Alpha', filt)" onwheel="wheelEvents(event,id,this)">Alpha</a>`n
<a id='Shuffle' style='width:7`%; %x1%' onmousedown="inca('Shuffle')">Shuffle</a>`n
<a id='View' style='width:7`%' onmousedown="inca('View', view, '', lastIndex)" onwheel="wheelEvents(event, id, this)">View %view4%</a>`n 
<a style='width:5`%; %x8%' onmousedown="inca('Recurse')">+Sub</a>`n
<a style='width:5`%; %x10%' onmousedown="inca('Images')">Pics</a>`n
<a style='width:4`%; %x9%' onmousedown="inca('Videos')">Vids</a>`n
<a style='color:red; width:9`%; font-size:1.1em; margin-top:-0.1em'>%listSize%</a>
<a id="myPage" style='width:14`%' onmousedown="inca('Page', page)" onwheel="wheelEvents(event, id, this)">%pg%</a>`n
</div>`n`n

<div style='width:100`%; height:9.5em'></div>`n%mediaList%<div style='width:100`%; height:100vh'></div>`n`n

      WinActivate, ahk_group Browsers
      send, ^l
      sleep 24
      send, {BS}
      FileDelete, %inca%\cache\html\%folder%.htm
      StringReplace, header, header, \, /, All
      StringReplace, body, body, \, /, All
      html = %header%%body%</div></div>`n<script>`n%java%</script>`n</body>`n</html>`n
      FileAppend, %html%, %inca%\cache\html\%folder%.htm, UTF-8
      new_html = file:///%inca%\cache\html\%folder%.htm			; create / update browser tab
      StringReplace, new_html, new_html, \,/, All
      IfWinNotExist, ahk_group Browsers
        run, %new_html%							; open a new web tab
      else if !incaTab
        run, %new_html%							; open a new web tab
      else if (folder == previousTab)					; just refresh existing tab
        send, {F5}
      else
        {
        SendInput, {Raw}%new_html%
        Send, {Enter}
        }
      index := 1
      selected =
      previousTab := folder
      if fullscreen
        send, {F11}
      fullscreen := 0
      sleep 400								; time for page to load
      }












    ~Esc up::
      ExitApp

    ~LButton::					; click events
    ~MButton::
    RButton::
      MouseDown()
      return

    Xbutton1::					; mouse "back" button
      Critical
      playing =
      longClick =
      timer := A_TickCount + 350
      SetTimer, Timer_up, -350
      return
    Timer_up:					; long back key press
      IfWinActive, ahk_group Browsers
        send, ^0^w{Esc} 			; close tab
      else send, !{F4}				; or close app
      return
    Xbutton1 up::
      SetTimer, Timer_up, Off
      if (A_TickCount > timer)
        return
      IfWinExist, ahk_class OSKMainClass
        send, !0				; close onscreen keyboard
      else if WinActive("ahk_class Notepad")
        Send, {Esc}^s^w
      else IfWinExist, ahk_class mpv
        Process, Close, mpv.exe			; mpv player
      else if incaTab
        send, +{MButton}			; close java modal media player
      else if !incaTab
        send, {Xbutton1}
      return

    ~WheelUp::					; in case external media player
       wheel = up
    ~WheelDown::
       MouseGetPos, xpos, ypos
       IfWinActive, ahk_class ahk_class mpv	; mpv player controls
         {
         if (type != "image")
           if (xpos < 200)
             if (wheel == "up")			; speed
               send, b
             else send, a
           else if (wheel == "up")		; seek
             send, e
           else send, f
         }
      wheel =
      return


    MouseDown()
      {
      Critical					; pause timed events
      gesture := 0
      longClick =
      timer := A_TickCount + 300		; set future timout 300mS
      MouseGetPos, xpos, ypos
      StringReplace, click, A_ThisHotkey, ~,, All
      loop					; gesture detection
        {
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P") && !GetKeyState("MButton", "P"))
          {
          if (click == "RButton")
            {
            lastPath =				; reset delete path
            if !gesture
              send {RButton}
            else if (gesture == 2)
              send {RButton up}
            }
          Gui PopUp:Cancel
          break
          }
        if (Abs(x)+Abs(y) > 6)			; gesture started
          {
          if (!gesture && click == "LButton")
            gesture := 1
          MouseGetPos, xpos, ypos
          if (xpos < 15)			; gesture at screen edges
              xpos := 15
          if (xpos > A_ScreenWidth - 15)
              xpos := A_ScreenWidth - 15
          MouseMove, % xpos, % ypos, 0
          if (click == "RButton")
              Gesture(x, y)
          if (incaTab && GetKeyState("LButton", "P") && WinActive, ahk_class ahk_class mpv)
              if (y < 0)			; mpv player controls
                send, 9				; magnify
              else send, 0
          }
        if (!gesture && A_TickCount > timer && GetKeyState("LButton", "P"))	; click timout
          {
          if (A_Cursor == "IBeam")
            {
            if WinActive("ahk_group Browsers")
              {
              clp := Clipboard
              Clipboard =
              send, ^c
              ClipWait, 0
              send, {Lbutton up}
              if ClipBoard
                {
                if !incaTab			; include current path in search 
                  path =
                incaTab =			; force new tab
                value =
                searchTerm =
                command = SearchBox		; search from selected text
                address := Clipboard
                ProcessMessage()
                CreateList(1)
                }
              else send, !+0
              Clipboard := clp
              }
            else send, !+0			; trigger osk keyboard
            }
          else longClick = true
          break
          }
        }
      }


    GetBrowser() {
        title =
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1)
          WinGetTitle title, A
        if InStr(title, "Inca - ",1)
          incaTab := SubStr(title, 8)
        else incaTab =
        if InStr(title, "Mozilla Firefox",1)       
          browser = mozilla firefox
        else if InStr(title, "Google Chrome",1)       
          browser = google chrome
        else if InStr(title, "Brave",1)       
          browser = Brave
        else if InStr(title, "Opera",1)       
          browser = Opera
        else if InStr(title, "Profile 1 - Microsoft",1)       
          browser = Profile 1 - Microsoft
        StringGetPos, pos, incaTab, %browser%, R
        StringLeft, incaTab, incaTab, % pos - 3
        if (incaTab && incaTab != previousTab)				; has inca tab changed
            {
            folder := incaTab
            GetTabSettings(1)						; get last tab settings
            if (previousTab && FileExist(inca "\cache\lists\" incaTab ".txt"))
              FileRead, list, %inca%\cache\lists\%incaTab%.txt
            else CreateList(0)
            previousTab := incaTab
            }
        return incaTab
        }


    Clipboard()								; check for messages from browser
        {
        IfWinExist, ahk_class OSKMainClass
          send, !0							; close onscreen keyboard
        selected =
        messages =
        command =
        value =
        address =
        reload =
        type =
        src =
        ptr := 1
        messages := StrReplace(Clipboard, "/", "\")
        array := StrSplit(messages,"#")
        Clipboard := lastClip
; tooltip %messages%							; for debug
        Loop % array.MaxIndex()/4
          {
          command := array[ptr+=1]
          value := array[ptr+=1]
          value := StrReplace(value, "<", "#")
          selected := array[ptr+=1]
          address := array[ptr+=1]
          address := StrReplace(address, ">", "'")			; java/html cannot accept ' in string
          if selected
            GetMedia(StrSplit(selected, ",").1)
          if !command
            continue
          else ProcessMessage()
          }
        if (reload == 1)
          CreateList(1)
        if (reload == 2)
          RenderPage()
        if (reload == 3)
          CreateList(0)
        longClick =
        GuiControl, Indexer:, GuiInd
        PopUp("",0,0,0)
        }


    ProcessMessage()							; messages from java/browser
        {
        PopUp(".",0,0,0)
        if (command == "Index")						; index folder (create thumbsheets)
            {
            if src							; index media under cursor
              {
              index(src,1)
              reload := 2
              }
            else if !playlist						; index whole folder
              {
              indexFolders = %indexFolders%|%path%
              SetTimer, indexer, -100, -2
              }
            selected =
            }
        if (command == "Move")						; move entry within playlist
            {
            MoveEntry()
            selected =
            reload := 3
            }
        if (command == "Rename")					; rename media
            {
            if (StrLen(value) < 4)
                popup = too small
            if !GetMedia(StrSplit(selected, ",").1)
                popup = no media
            if !popup
               {
               if RenameFile(value)
                 popup = Error . . .
               else popup = Renamed
               }
            Popup(popup,0,0,0)
            reload := 3
            }
        if (command == "Reload")					; reload web page
            reload:=3
        if (command == "EditCap")					; open caption in notepad
            {
            IfNotExist, %inca%\cache\cues\%media%.txt
            FileAppend, 0.00|cap|, %inca%\cache\cues\%media%.txt, UTF-8
            run, %inca%\cache\cues\%media%.txt
            }
        if (command == "mp3" || command == "mp4")
            {
            if selected
              {
              Loop, Parse, selected, `,
                if GetMedia(A_LoopField)
                  {
                  dest = %mediaPath%\%media% - Copy.%command%
                  run, %inca%\cache\apps\ffmpeg.exe -i "%src%" "%dest%",,Hide
                  }
              }
            selected =
            Popup("Creating . . .",1000,0,0)
            reload := 1
            }
        if (command == "Settings")					; open inca source folder
            run, %inca%\
        if (command == "Favorite")
            {
            if !selected
              return
            if !value
              value = 0.0
            start := value -0.1						; smoother start from poster image in htm
            Runwait, %inca%\cache\apps\ffmpeg.exe -ss %start% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
            if playlist
              ta := folder
            else ta = new
            Loop, Parse, selected, `,
              if GetMedia(A_Loopfield)
                FileAppend, %src%|%value%`r`n, %inca%\fav\%ta%.m3u, UTF-8 ; from modal player with start
            AllFav()							; add to consolidated fav list
            popup("Added - New",500,0,0)
            }
        if (command == "View")						; change thumb/list view or thumb size
            {
            if (view == value)
              listView ^=1
            view := Round(value)
            if (view < 8)
              view := 8
            x := view - 7
            if address
              index := address						; for scrollToIndex() in java
            reload := 2
            }
        if (command == "Delete")
            {
            if !selected
              {
              if lastpath						; over panel entry
                {
                x = %lastPath%|
                if InStr(lastPath, "\fav\")				; delete fav folder
                  {
                  FileRecycle, %lastPath%
                  fav := StrReplace(fav, x, "")
                  IniWrite,%fav%,%inca%\ini.ini,Settings,Fav
                  }
                else if InStr(lastPath, "\music\")			; delete music folder
                  {
                  FileRecycle, %lastPath%
                  music := StrReplace(music, x, "")
                  IniWrite,%music%,%inca%\ini.ini,Settings,Music
                  }
                else if !InStr(lastPath, "\")				; delete search term
                  {
                  search := StrReplace(search, x, "")
                  IniWrite,%search%,%inca%\ini.ini,Settings,Search
                  }
                else							; delete folder
                  {
                  Loop, Files, %lastPath%/*.*, FD			; is folder empty
                    {
                    popup("Must be empty",600,0,0)
                    return
                    }
                  path := SubStr(lastPath, 1, InStr(lastPath, "\", False, -1))
                  StringTrimRight, str, path, 1
                  subfolders := StrReplace(subfolders, folder)
                  SplitPath, str,,,,folder
                  FileRecycle, %lastPath%
                  if ErrorLevel
                    PopUp("Error . . .",1000,0.34,0.2)                  
                  }
                LoadSettings()
                }
              reload := 1
              return
              }	
            if playlist
              DeleteEntries(1)
            else 
              {
              sleep 200							; time for browser to release media
              Loop, Parse, selected, `,
                if GetMedia(A_LoopField)
                  FileRecycle, %src%
              }
            if ErrorLevel
              PopUp("Error . . .",0,0,0)                  
            else popup("Deleted",0,0,0)
            reload := 3
            }
        if (command == "History")					; media was played in browser
            {
            GetMedia(value)
            array := StrSplit(address,"|")
            start:=array.1
            skinny:= array.2
            rate:=array.3
            if ((type == "video" || type == "audio") && lastMedia != src)
              FileAppend, %src%|%start%`r`n, %inca%\fav\History.m3u, UTF-8
            lastMedia := src
            if skinny is not number
              skinny := 1 := 0
            if (skinny < -1.2)
              skinny = -1.2
            if (skinny > 1.5)
              skinny = 1.5
            if (skinny >= 0.98 && skinny <= 1.02)
              skinny := 1
            skinny = 0.00|skinny|%skinny%				; create new mask string
            if rate
              rate = 0.00|rate|%rate%
            FileRead, cues, %inca%\cache\cues\%media%.txt
            last := cues
            if cues
              Loop, Parse, cues, `n, `r					; each line of cues
                {
                array := StrSplit(A_LoopField, "|")			; split each entry
                x := array.3						; the entry value
                sk = 0.00|skinny|%x%					; remember existing mask string
                ra = 0.00|rate|%x%
                if (!array.1 && array.2 == "skinny")			; has "0.00|skinny|" prefix
                  cues := StrReplace(cues, sk, skinny)			; use masks to replace value
                if (rate && !array.1 && array.2 == "rate")
                  cues := StrReplace(cues, ra, rate)
                }
             if (!InStr(cues, "0.00|skinny"))				; if no entries exist
               cues = %skinny%`r`n%cues%
             if (rate && !InStr(cues, "0.00|rate"))			; add new entry
               cues = %rate%`r`n%cues%
             if (InStr(cues, "0.00|skinny|1`r`n"))			; if entry is just the default
                cues := StrReplace(cues, "0.00|skinny|1`r`n")		; remove entry
             if (InStr(cues, "0.00|rate|1`r`n"))
                cues := StrReplace(cues, "0.00|rate|1`r`n")
            if (cues != last)						; if changed, replace cues file
              {
              FileDelete, %inca%\cache\cues\%media%.txt
              if cues
                FileAppend, %cues%, %inca%\cache\cues\%media%.txt
              }
            }
        if (command == "Media")						; media has been clicked to play
            {
            if GetMedia(value)
              {
              playing = true
              if (ext=="pdf")
                Run, %src%
              else if (type=="document" || type=="m3u")
                {
                Run, % "notepad.exe " . src
                sleep 150
                WinActivate, Notepad
                }
              else if (Setting("External Player") && type != "image")
                {
                send, +{MButton}					; close java player
                Run %inca%\cache\apps\mpv "%src%"
                }
              else if (!longClick && ((browser == "mozilla firefox" && type == "video" && ext != "mp4" && ext != "m4v" && ext != "webm") || (browser == "google chrome" && type == "video" && ext != "mp4" && ext != "mkv" && ext != "m4v" && ext != "webm")))
                {
                send, +{MButton}					; close java player 
                Run %inca%\cache\apps\mpv "%src%"
                Popup("Browser Cannot Play",1500,0.34,0.8)
                }
              }
            }
        if (command == "Page")
            {
            if (command == "Page")
                page := value
            popup = Page %value%
            Popup(popup,0,0,0)
            reload := 2
            }
        if (command == "Join")						; join video files together
            {
            str=
            if !selected
              return
            Loop, Parse, selected, `,
              if GetMedia(A_LoopField)
                str = %str%file '%src%'`r`n
            FileAppend,  %str%, %inca%\cache\lists\temp1.txt, utf-8
            Popup("Joining Media",0,0,0)
            runwait, %inca%\cache\apps\Utf-WithoutBOM.bat %inca%\cache\lists\temp1.txt > %inca%\cache\lists\temp.txt,,Hide
            runwait, %inca%\cache\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\cache\lists\temp.txt" -c copy "%mediaPath%\%media%- join.%ext%",,Hide
            if (ext != "mp4")
              runwait, %inca%\cache\apps\ffmpeg.exe -i "%mediaPath%\%media%- join.%ext%" "%mediaPath%\%media%- join.mp4",,Hide
            src = %mediaPath%\%media%- join.mp4
            FileDelete, %inca%\cache\lists\temp.txt
            FileDelete, %inca%\cache\lists\temp1.txt
            index(src,1)
            reload := 3
            }
        if (command == "SearchAdd" && address)
            {
            StringUpper, searchTerm, address, T
            search = %search%|%searchTerm%
            StringReplace, search, search, |, `n, All
            Sort, search, u
            StringReplace, search, search, `n, |, All
            IniWrite,%search%,%inca%\ini.ini,Settings,Search
            LoadSettings()
            PopUp("Added",600,0,0)
            reload := 1
            }
        if (command=="Filt"||command=="Path"||command=="Search"||command=="SearchBox"||command=="SearchAll"||InStr(sortList, command))
            {
            if (value == 2)
               {
               lastPath := address
               return							; right click
               }
            if (command == "Path") 
              {
              if value
                {
                incaTab =						; middle click - trigger new tab
                value =
                }
              if (longClick && !selected)
                {
                run, %address%						; open source instead
                send {LButton up}
                return
                }
              if selected						; move/copy files
                {
                MoveFiles()						; between folders or playlists
                reload := 3
                return
                }
              else if InStr(address, ".m3u")				; playlist
                {
                playlist := address
                SplitPath, address,,path,,folder
                path = %path%\
                }
              else
                {
                playlist =
                IfNotExist, %address%
                  path := SubStr(path, 1, InStr(path, "\", False, -1))	; try one folder back
                else path := address
                StringTrimRight, address, path, 1
                SplitPath, address,,,,folder
                }
              GetTabSettings(0)						; load previous tab basic settings from cache
              searchTerm =
              searchPath =
              filt := 0
              }
            if (command == "Search" || command == "SearchBox" || command == "SearchAll")
              {
              playlist =
              if (command == "SearchBox")
                address := StrReplace(address, "+", " ")
              if (command == "SearchAll")
                address := StrReplace(address, " ", "+")
              if (strlen(address) < 2)
                return
              if longClick
                searchTerm = %searchTerm%+%address%			; long click adds new search term
              else searchTerm = %address%
              }
            reload := 1
            if searchTerm						; search text from link or search box
                {
                folder := searchTerm
                GetTabSettings(0)					; load cached tab settings
                searchPath := searchFolders
                if (searchTerm && !InStr(searchPath, path))		; search this folder, then search paths
                    searchPath = %path%|%searchPath%			; search this folder only
                if (searchTerm && !InStr(sortList, command))
                  if (command == "SearchBox")
                    {
                    toggles =
                    listView := 1
                    sort = Duration
                   }
                if (!InStr(sortList, command))
                  filt := 0
                }
            WinGetPos,,,w,,a
            if (w == A_ScreenWidth && folder != previousTab)
              {
              fullscreen := 1
              send, {F11}
              }
            else fullscreen := 0
            page := 1
            if value is not number
              value := 0
            if (command != "Images" && command != "videos" && command != "Recurse")
              if (InStr(sortList, command) && sort != command)		; changed sort column
                {
                StringReplace, toggles, toggles, Reverse		; clear reverse
                if (value == filt)
                  filt := 0						; clear filter
                else filt := value					; or adopt new filt (if applied)
                sort := command
                return
                }
            if (filt != value && value != searchTerm)			; new filter value only
                filt := value
            else if (InStr(sortList, command))				; sort filter
                {
                toggle_list = Reverse Recurse Videos Images
                if (sort != command)					; new sort
                    {
                    if (command != "Reverse" && !InStr(toggle_list, command))
                        StringReplace, toggles, toggles, Reverse	; remove reverse
                    }
                else if (sort != "Shuffle")
                    command = Reverse
                if InStr(toggle_list, command)
                    if !InStr(toggles, command)				; toggle the sort switches
                        toggles = %toggles%%command%			; add switch
                    else StringReplace, toggles, toggles, %command%	; remove switch
                else sort := command
                if (StrLen(toggles) < 4)
                    toggles =
                }
            }
        }


    CreateList(show)							; list of files in path
        {
        Critical
        if !searchPath
            searchPath := path
        IfNotExist, %path%
          if searchTerm
            path = %searchTerm%\
          else path = %profile%\Pictures\
        list =
        listSize := 1
        if (InStr(toggles, "Recurse") || searchTerm)
            recurse = R
        if (playlist && !searchTerm)
           {
           FileRead, str, %playlist%
           Loop, Parse, str, `n, `r
            if %A_LoopField%
             {  
             source := StrSplit(A_Loopfield, "|").1
             start := StrSplit(A_Loopfield, "|").2
             spool(source, A_Index, start)
             }
           }
        else Loop, Parse, searchPath, `|
           Loop, Files, %A_LoopField%*.*, F%recurse%
             if A_LoopFileAttrib not contains H,S
               if spool(A_LoopFileFullPath, A_Index, 0)
                 break 2
               else if (show && (listSize<10000 && !Mod(listSize,1000)) || !Mod(listSize,10000))
                 PopUp(listSize,0,0,0)
        popup := listSize -1
        if show
            Popup(popup,0,0,0)
        StringTrimRight, list, list, 2					; remove end `r`n
        if (InStr(toggles, "Reverse") && sort != "Date" && sort != "List")
            reverse = R
        if (!InStr(toggles, "Reverse") && (sort == "Date" || sort == "List"))
            reverse = R
        if (sort == "Type")
            Sort, list, %reverse% Z					; alpha sort
        else if (sort != "Shuffle")
            Sort, list, %reverse% Z N					; numeric sort
        if (sort == "Shuffle")
            Sort, list, Random Z
        if (sort == "Alpha" && playlist)
          Sort, list, %reverse% Z \					; filename alpha sort
        FileDelete, %inca%\cache\lists\%folder%.txt
        FileAppend, %list%, %inca%\cache\lists\%folder%.txt, UTF-8
        selected =
        RenderPage()
        }


    Spool(input, count, start)						; sorting and search filters
        {
        if !start
          start := 0
        SplitPath, input,,,ex, filen
        if (ex == "lnk")
            FileGetShortcut, %input%, input
        SplitPath, input,,,ex,filen
        if (med := DecodeExt(ex))
            {
            if (med != "video" && InStr(toggles, "Video"))
              return
            if (med != "image" && InStr(toggles, "Images"))
              return
            if (count > 999999)
              {
              PopUp("folder too big",800,0,0)
              return 1
              }
            listId := listSize
            sort_name := listSize
            if searchTerm
              {
              array := StrSplit(searchTerm,"+")
              Loop, % array.MaxIndex()
                if (!InStr(filen, array[A_Index]))
                  return
              }
            if (sort == "Type")
                listId := ex
            if (sort == "Alpha")
              {
              StringGetPos, pos, input, \, R, 1
              StringMid, 1st_char, input, % pos + 2, 1
              if (!InStr(toggles, "Reverse") && filt && sort == "Alpha" && 1st_char < Chr(filt+65))
                return
              else if (InStr(toggles, "Reverse") && filt && sort == "Alpha" && 1st_char > Chr(filt+64))
                return
              }
            else if (sort == "Date")
              {
              FileGetTime, listId, %input%, M
              sort_date := A_Now
              sort_date -= listId, days
              sort_name = today
              years := floor(sort_date / 365)
              if years
                sort_name = %years% y
              else if sort_date 
                sort_name = %sort_date% d
              if (!InStr(toggles, "Reverse") && filt && sort_date/30 < filt)
                return
              else if (InStr(toggles, "Reverse") && filt && sort_date/30 > filt)
                return
              }
            else if (sort == "Size")
              {
              FileGetSize, listId, %input%, K
              sort_name := Round(listId)
              if (!InStr(toggles, "Reverse") && filt && listId < filt*10000)
                return
              else if (InStr(toggles, "Reverse") && filt && listId > filt*10000)
                return
              }
            else if (sort == "Duration")
              {
              FileReadLine, listId, %inca%\cache\durations\%filen%.txt,1
              if !listId
                listId := 0
              if (!InStr(toggles, "Reverse") && filt && listId/60 < filt)
                return
              else if (InStr(toggles, "Reverse") && filt && listId/60 > filt)
                return
              sort_name := Time(listId)
              }
            listSize += 1
            list = %list%%listId%/%input%/%med%/%sort_name%/%start%`r`n
            }
        }



    fill(in) {  
      panelList = %panelList%<div style="height:7em; padding:0.5em; transform:rotate(90deg)">`n%in%</div>`n
      }


    GetTabSettings(all)							; from .htm cache file
        {
        listView = 0
        page := 1							; default view settings if no html data
        filt := 0
        toggles =
        sort = Shuffle
        if (command == "SearchBox")
          sort = Duration
        FileReadLine, array, %inca%\cache\html\%folder%.htm, 1		; embedded page data as top html comment
        if array
            {
            StringReplace, array, array, /, \, All
            array := StrSplit(array,", ")
            view := array.2
            if (view < 8)
              view := 8
            page := array.3
            pages := array.4
            sort := array.6
            toggles := array.7
            listView := array.8
            if all
              {
              playlist := array.9
              path := array.10
              searchPath := array.11
              searchTerm := array.12
              if searchTerm
                folder := searchTerm
              }
            }
        }


    Time(in)
        {
        year = 2017
        x := in
        year += x, seconds
        FormatTime, in, %year%, H:mm:ss					; show duration in hours:mins format
        if (x < 3600)
            FormatTime, in, %year%, mm:ss
        if (x < 600)
            FormatTime, in, %year%, m:ss
        return in
        }


    MoveFiles()
        {
        sleep 100							; time for browser to release media
        if (playlist && !InStr(address, "\inca\"))
          PopUp("Cannot Move Shortcuts",1000,0.34,0.2)
        else if (path == address && !longClick)
          PopUp("Same folder",1000,0.34,0.2)
        else Loop, Parse, selected, `,
            {
            if !GetMedia(A_LoopField)
              continue
            popup = Moved %A_Index%
            if (!InStr(path, "\inca\") && InStr(address, "\inca\"))
              popup = Added %A_Index%
            if longClick
              popup = Copied %A_Index%
            PopUp(popup,0,0,0)
            if GetMedia(A_LoopField)
              if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
                FileAppend, %target%`r`n, %address%, UTF-8		; add media entry to playlist
              else 
                {
                SplitPath, src,,mediaPath,ext,media
                FileGetSize, x, %address%%media%.%ext%			; if x, name already exists in target folder
                FileGetSize, y, %src%					; get source file size
                z=							; new 'Copy -' addendum
                if ((x && x!=y) || address == path)
                  Loop 500
                    {
                    z = \%media% - Copy (%A_Index%).%ext%
                    FileGetSize, x,  %address%%z%
                    if !x
                      break
                    if (x == y)
                      break 2
                    }
                if (!longClick && address == path)
                  continue
                if !longClick
                  FileMove, %src%, %address%%z%				; move file to new folder
                else FileCopy, %src%, %address%%z%
                x = %address%%z%
                if ErrorLevel
                  PopUp("Error . . .",1000,0.34,0.2)                  
                }
            }
        if (popup && !longClick)
          if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
            DeleteEntries(0)
        }  


    DeleteEntries(trash)						; playlist entries
        {
        IfNotExist, %playlist%
          return
        FileRead, str, %playlist%
        FileDelete, %playlist%
        Loop, Parse, selected, `,
         if A_LoopField
          {
          GetMedia(A_LoopField)
          x = %target%`r`n
          y = %src%`r`n
          str := StrReplace(str, x,,,1)					; fav with start time
          str := StrReplace(str, y,,,1)					; music with no start time
          }
        FileAppend, %str%, %playlist%, UTF-8
        AllFav()
        }


    MoveEntry()								; within playlist 
        {
        if (sort != "List")
          {
          toggles =
          sort = List
          PopUp("List must be unSorted",900,0,0)
          return
          }
        select := StrSplit(selected, ",").1
        GetMedia(select)
        source = %target%
        GetMedia(value)
        FileRead, str, %playlist%
        FileDelete, %playlist%
        both = %target%`r`n%source%
        source = %source%`r`n
        str := StrReplace(str, source)
        str := StrReplace(str, target, both)
        FileAppend, %str%, %playlist%, UTF-8
        }


    RenameFile(new_name)
        {
        IfNotExist, %src%
          return
        sleep 200							; time for browser to release src
        FileMove, %src%, %mediaPath%\%new_name%.%ext%			; FileMove = FileRename
        if ErrorLevel
          return 1               
        new_entry := StrReplace(target, media, new_name)
        folders = %inca%\fav\*.m3u|%inca%\music\*.m3u
        Loop, Parse, folders, `|
          Loop, Files, %A_LoopField%*.*, FR
            {
            FileRead, str, %A_LoopFileFullPath%				; find & replace in .m3u files
            if !InStr(str, src)
              continue
            FileDelete, %A_LoopFileFullPath%
            new_src = %mediaPath%\%new_name%.%ext%
            str := StrReplace(str, src, new_src)
            FileAppend, %str%, %A_LoopFileFullPath%, UTF-8
            }
        FileMove, %inca%\cache\cues\%media%.txt, %inca%\cache\cues\%new_name%.txt, 1
        FileMove, %inca%\cache\durations\%media%.txt, %inca%\cache\durations\%new_name%.txt, 1
        FileMove, %inca%\cache\thumbs\%media%.jpg, %inca%\cache\thumbs\%new_name%.jpg, 1
        FileMove, %inca%\cache\posters\%media%.jpg, %inca%\cache\posters\%new_name%.jpg, 1
        }


    DecodeExt(ex)
        {
        StringLower ex, ex
        if InStr("jpg png jpeg webp gif", ex)
            return "image"
        if InStr("mp4 wmv avi mov webm mpg mpeg flv divx mkv asf m4v mvb rmvb vob rm ts", ex)
            return "video"
        if InStr("mp3 m4a wma mid", ex)
            return "audio"
        if InStr("pdf txt doc epub mobi htm html", ex)
            return "document"
        if (ex == "m3u")
            return "m3u"
        }


    DetectMedia(input)
        {
        type =
        SplitPath, input,,mediaPath,ext,media
        stringlower, ext, ext
        type := DecodeExt(ext)
        src := input
        IfExist, %src%
            return type
        }


    GetMedia(id)
        {
        if !id
          return
        id := id + Setting("Page Size") * (page - 1)
        FileReadLine, str, %inca%\cache\lists\%folder%.txt, id
        src := StrSplit(str, "/").2
        seek := StrSplit(str, "/").5
        cue := StrSplit(str, "/").6
        if !seek
          seek = 0.0
        target = %src%|%seek%
        if cue
          target = %target%|%cue%
        if src
          return DetectMedia(src)
        }


    Gesture(x, y)
        {
        if (Abs(x) > Abs(y))					; master volume
          {
          gesture := 1
          x*=1.4
          Static last_volume
          last_volume := volume
          if volume < 10
            x /= 2						; finer adj at low volume
          if x < 100						; stop any big volume jumps
            volume += x/20
          SoundGet, current
          if (volume < 0)
            volume := 0
          if (volume > 100)
            volume := 100
          SoundSet, volume
          volRef := Round(volume)
          ShowStatus()
          }
        else if (Abs(x) < Abs(y) && !incaTab && WinActive("ahk_group Browsers"))	; browser magnify
          {
          gesture += Abs(y)
          WinGet, state, MinMax, ahk_group Browsers
          if (state > -1 && gesture > 50)
            {
            gesture := 3
            WinActivate, ahk_group Browsers
            if (y < 0)
              send, ^0
            else send, ^{+}
            }
          }
        else if (!gesture && WinActive("ahk_group Browsers"))
          {
          gesture := 2
          send {RButton down}
          }
        }


    PopUp(message, time, x, y)
        {
        MouseGetPos, xp, yp
        yp -= 101
        xp -= 65
        if (x || y)
            xp := A_ScreenWidth * x, yp :=  A_ScreenHeight * y
        time := Ceil(time / 10)
        Gui PopUp:Destroy
        Gui PopUp:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui PopUp:Color, Black
        Gui PopUp:Font, s16 cRed, Segoe UI
        Gui PopUp:Add, Text,, %message%
        Gui PopUp:Show, x%xp% y%yp% NA
        WinSet, TransColor, 0 255
        loop %time%
            {
            sleep 10
            mask := 55 + (A_Index * 200/ time)
            mask2 := 255 - mask
            WinSet, TransColor, 0 %mask2%
            }
        }


    AllFav()
        {
        FileDelete, %inca%\fav\All.m3u
        Loop, Files, %inca%\fav\*.m3u, FR				; create consolidated 'All' playlist 
          if !InStr(A_LoopFileFullPath, "\History.m3u")
            {
            FileRead, str, %A_LoopFileFullPath%
            FileAppend, %str%, %inca%\fav\All.m3u, UTF-8
            }
        FileRead, allFav, %inca%\fav\All.m3u      
        }


    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        inca := SubStr(inca, 1, InStr(inca, "\", False, -1))		; one folders back
        inca := SubStr(inca, 1, InStr(inca, "\", False, -1))
        StringTrimRight, inca, inca, 1
        EnvGet, profile, UserProfile
        IniRead,config,%inca%\ini.ini,Settings,config
        IniRead,searchFolders,%inca%\ini.ini,Settings,searchFolders
        IniRead,indexFolders,%inca%\ini.ini,Settings,indexFolders
        IniRead,fol,%inca%\ini.ini,Settings,Fol
        IniRead,search,%inca%\ini.ini,Settings,Search
        IniRead,fav,%inca%\ini.ini,Settings,Fav
        IniRead,music,%inca%\ini.ini,Settings,Music
        }


    Setting(key)
        {
        Loop, Parse, config, `|
            {
            x := StrSplit(A_LoopField, "/").1
            if InStr(x, key)
                return StrSplit(A_LoopField, "/").2
            }
        }

    Initialize()
        {
        Global
        Clipboard =
        LoadSettings()
        AllFav()							; create ..\fav\All.m3u
        FileDelete, %inca%\cache\lists\*.*
        FileRead, str, %inca%\fav\History.m3u
        FileDelete, %inca%\fav\History.m3u
        Loop, Parse, str, `n, `r
          count++
        if (count > 300)
          count -= 300
        else count = 0
        Loop, Parse, str, `n, `r					; keep history below 300 entries
          if (A_Loopfield && A_Index >= count)
            str2 = %str2%%A_Loopfield%`r`n
        FileAppend, %str2%, %inca%\fav\History.m3u, UTF-8
        CoordMode, Mouse, Screen
        Gui, background:+lastfound -Caption +ToolWindow -DPIScale
        Gui, background:Color,Black
        Gui, background:Show, x0 y0 w%A_ScreenWidth% h%A_ScreenHeight% NA
        WinSet, Transparent, 0
        WinSet, ExStyle, +0x20
        gui, vol: +lastfound -Caption +ToolWindow +AlwaysOnTop -DPIScale
        gui, vol: color, fa8072
        Gui Status:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui Status:Color, Black
        Gui Status:Add, Text, vGuiSta w200 h35
        Gui Status: Show, Hide
        ix := A_screenWidth * Setting("Status Bar")/100
        iy := A_ScreenHeight * 0.95
        WinMove,,,ix,iy
        Gui, Indexer:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui, Indexer:Color, Black
        Gui, Indexer:Add, Text, vGuiInd h50 w1200
        Gui, Indexer:Font, s11 c705a4c, Segoe UI
        GuiControl, Indexer:Font, GuiInd
        iy := A_ScreenHeight * 0.966
        Gui, Indexer:Show, x600 y%iy%, NA
        WinSet, TransColor, ffffff 0
        WinSet, TransColor, 0 140
        WinSet, ExStyle, +0x20
        SoundGet, volume
        SetTimer, indexer, -1000, -1
        }


    ShowStatus()
        {
        FormatTime, time,, h:mm
        vol := Round(volume)
        if (volume < 0.95)
            vol := Round(volume,1)
        if (volume <= 0)
            vol =
        status = %time%    %vol%
        if (status != lastStatus && (click == "RButton" || Setting("Status Bar")))
          {
          lastStatus := status
          Gui, Status:+lastfound
          WinSet, TransColor, 0 60
          Gui, Status:Font, s20 cWhite, Segoe UI
          GuiControl, Status:Font, GuiSta
          GuiControl, Status:, GuiSta, %status%
          Gui, Status:Show, NA
          }
        if (!GetKeyState("RButton", "P") && !Setting("Status Bar"))
           Gui, Status:hide, NA
        yv := A_ScreenHeight - 3
        xv := A_ScreenWidth * volume/101
        if (GetKeyState("RButton", "P") && gesture)
          gui, vol: show, x0 y%yv% w%xv% h3 NA
        else gui, vol: hide

        }


    TimedEvents:							; every 100mS
        GetBrowser()
        Gui, background:+LastFound
        if incaTab
            WinSet, Transparent, % Setting("Dim Desktop")
        else WinSet, Transparent, 0
        x := Setting("Sleep Timer") * 60000
        if (volume >= volRef/10000 && A_TimeIdlePhysical > x)
            {
            volume -= volRef/10000					; sleep timer
            SoundSet, volume						; slowly reduce volume
            }
        if incaTab
          {
          x := StrLen(Clipboard)
          y := SubStr(Clipboard, 1, 1)
          if (y=="#" && x>4 && x<5000 && StrSplit(clipboard,"#").MaxIndex()>4)	; very likely is a java message
            Clipboard()
          else if x
            lastClip := Clipboard
          }
        ShowStatus()
        return


    Indexer:
    Critical Off
    if indexFolders
      Loop, Parse, indexFolders, `|
        Loop, Files, %A_LoopField%*.*, R
    index(A_LoopFileFullPath,0)
    return


    index(source, force)						; create thumbs, posters & durations
          {
          SplitPath, source,,fold,ex,filen
          med := DecodeExt(ex)
          if (med != "video" && med != "audio")
            return
          ifExist, %fold%\%Filen%.part					; file downloading
            return
          dur =
          FileRead, dur, %inca%\cache\durations\%filen%.txt
          if (!dur || force)
            {
            RunWait %COMSPEC% /c %inca%\cache\apps\ffmpeg.exe -y -i "%source%" 2>&1 | find "Duration" > "%inca%\meta.txt" , , hide && exit
            FileRead, dur, %inca%\meta.txt
            StringTrimLeft, aTime, dur, 12
            StringLeft, aTime, aTime, 8
            aTime := StrSplit(aTime, ":")
            dur := aTime.1 * 3600 + aTime.2 * 60 + aTime.3
            FileDelete, %inca%\meta.txt
            FileDelete, %inca%\cache\durations\%filen%.txt
            FileAppend, %dur%, %inca%\cache\durations\%filen%.txt
            }
          if (med == "audio")
            return
          thumb := 0
          poster := 0
          IfNotExist, %inca%\cache\posters\%filen%.jpg
            poster := 1
          IfNotExist, %inca%\cache\thumbs\%filen%.jpg
            thumb := 1
          if (thumb || poster || force)
            {
            GuiControl, Indexer:, GuiInd, indexing - %filen%
            t := 0
            if (dur > 60)
                {
                t := 20	      						; try to skip any video intro banners
                dur -= 20
                }
            loop 180
                {
                y := Round(A_Index / 5)					; 36 video frames in thumbsheet
                if !Mod(A_Index,5)
                  {
                  runwait, %inca%\cache\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\lists\%y%.jpg",, Hide
                  if (y == 1)
                    FileCopy, %inca%\cache\lists\1.jpg, %inca%\cache\posters\%filen%.jpg, 1	; 1st thumb is poster
                  if (!thumb && !force)
                    break
                  }
                t += (dur / 200)
                }
            if (thumb || force)
                Runwait %inca%\cache\apps\ffmpeg -i %inca%\cache\lists\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
            }
          GuiControl, Indexer:, GuiInd
        x := Setting("Indexer") * 60000
        if x
          SetTimer, indexer, -%x%, -2
          }


