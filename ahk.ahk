

	; Browser Based File Explorer - Windows
	; AutoHotKey script generates web pages of your media
	; browser communicates via the clipboard


	#NoEnv
	#UseHook, On
	SetWinDelay, 0
	SetKeyDelay, 00
	SetBatchLines -1
	SetTitleMatchMode, 2
	GroupAdd, Browsers, Google Chrome
	GroupAdd, Browsers, Mozilla Firefox
	GroupAdd, Browsers, ahk_exe brave.exe
	GroupAdd, Browsers, ahk_exe msedge.exe
	GroupAdd, Browsers, ahk_exe opera.exe

	#SingleInstance force		; one program instance only
	#MaxHotkeysPerInterval 999	; allow fast spinning wheel
	SetWorkingDir, %A_ScriptDir%	; consistent start directory

        Global profile
        Global sort_list		:= "Shuffle|Alpha|Duration|Date|Size|Type|Reverse|Recurse|Videos|Images|List|"
        Global toggles			; eg. reverse
        Global features			; program settings
        Global fol			; favorite folders
        Global fav			; favorite playlists
        Global music			; music playlists
        Global search			; list of search words
        Global search_folders		; default search locations
        Global index_folders		; to index thumb sheets
        Global search_path		; current search paths
        Global inca			; default folder path
        Global list			; sorted media file list
	Global list_id := 0		; pointer to media file
        Global list_size
        Global selected :=""		; selected files from web page
        Global search_term
        Global src			; current media file incl. path
        Global media			; media filename, no path or ext
        Global media_path
        Global type			; eg. video
	Global subfolders
        Global folder			; current folder name, no path
        Global path
        Global ext			; file extension
        Global inca_tab			; browser tab title (usually folder name)
	Global previous_tab:=""
        Global vol_popup		; volume bar popup 
        Global volume
        Global page := 1		; current page within list
        Global sort
	Global filt := 0		; secondary search filter eg. date, duration, Alpha letter
        Global click			; mouse click type
        Global timer			; click down timer
        Global view := 14		; thumb view (em size)
        Global list_view := 0
        Global wheel_count := 0
        Global vol_ref := 2
        Global wheel
	Global last_status		; time, vol etc display
        Global playlist			; playlist - full path
	Global xpos			; current mouse position - 100mS updated 
	Global ypos
        Global command
        Global value
        Global address
        Global skinny
        Global seek
        Global target
        Global reload
        Global browser
        Global clip
        Global long_click
        Global fullscreen
        Global pages
        Global rate
        Global poster
        Global media_list
        Global panel_list
Global foldr
Global index := 1
Global cue := 0
Global messages
Global playing =
Global gesture


    main:
      initialize()							; set environment
      WinActivate, ahk_group Browsers
      sleep 333
      send ^l{Right}
      sleep 333
      if !GetBrowser()
        Clipboard = #Path###%profile%\Pictures\
      Clipboard()
      SetTimer, TimedEvents, 100					; every 100mS
      return								; wait for mouse/key events



    RenderPage()							; construct web page from media list
        {
        Critical							; stop key interrupts
        if !path
            return
        media_list =
        subfolders =
foldr =
        if !search_term
          if playlist
             Loop, Files, %inca%\%folder%\*.m3u, FR
               {
               SplitPath, A_LoopFileName,,,ex,name
               subfolders = %subfolders%|%name%
               }
          else Loop, Files,%path%*.*, D
            if A_LoopFileAttrib not contains H,S
              if !InStr(subfolders, A_LoopFileFullPath)
                if subfolders
                  subfolders = %subfolders%|%A_LoopFileFullPath%\
                else subfolders = %A_LoopFileFullPath%\
        title := folder
        title_s := SubStr(title, 1, 20)					; keep title under 20 chars for htm page
        FileRead, java, %inca%\java.js
        FileRead, ini, %inca%\ini.ini
        ini := StrReplace(ini, "`r`n", "|")				; java cannot accept cr in strings
        ini := StrReplace(ini, "'", ">")				; java cannot accept ' in strings
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        count:=0
        list_size := 0
        type = video							; prime for list parsing
        page_l := Setting("Margin Left")
        page_r := Setting("Margin Right")
        page_s := Setting("Page Size")
        page_w := 100 - page_l - page_r
        rate := Setting("Default Speed")
        Loop, Parse, list, `n, `r 					; split list into smaller web pages
            {
            item := StrSplit(A_LoopField, "/")				; sort filter \ src \ media type \ ext
            source := item.2
            type := item.3
            sort_name := item.4
            start := item.5
            cue := item.6
            list_size += 1
            if ((list_size > (page-1) * page_s) && (list_size <= page * page_s))
                SpoolList(list_size, count+=1, source, sort_name, start)
            }
        pages := ceil(list_size/page_s)
        if (pages > 1)
          pg = Page %page% of %pages%
        Loop, Parse, sort_list, `|
          {
          if InStr(A_LoopField, sort)
            if InStr(toggles, "Reverse")
              x%A_Index% = style='min-width:3em; border-top:0.1px solid lightsalmon'
            else x%A_Index% = style='min-width:3em; border-bottom:0.1px solid lightsalmon'
          if InStr(toggles, A_LoopField)
            x%A_Index% = style='min-width:3em; color:red'
          }
if playlist
  order = List

        panel_list =
        container = <div style='font-size:2em; color:red; margin:0.8em; text-align:center'>Fav</div>`n
        container := fill(container)
        Loop, Parse, fav, `|
            {
            SplitPath, A_Loopfield,,,,x
            if (x == "New")
              container = %container%<c style='color:salmon' onmousedown="inca('Path', '', '', '%A_Loopfield%')">%x%</c>`n
            else container = %container%<c onmousedown="inca('Path', '', '', '%A_Loopfield%')">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        if subfolders
          {
          container = <div id='mySubs' style='font-size:2em; color:red; margin:0.8em; text-align:center'>Subs</div>`n
          container := fill(container)
          }
        Loop, Parse, subfolders, `|
            {
            StringTrimRight, x, A_Loopfield, 1
            array := StrSplit(x,"\")
            x := array.MaxIndex()
            fname := array[x]
            fname := SubStr(fname, 1, 14)
            container = %container%<c onmousedown="inca('Subs', %A_Index%)">%fname%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if (subfolders && container)
          fill(container)

        container = <div id='myFol' style='font-size:2em; color:red; margin:0.8em; text-align:center'>Fol</div>`n
        container := fill(container)
        Loop, Parse, fol, `|
            {
            StringTrimRight, y, A_Loopfield, 1
            SplitPath, y,,,,x
            container = %container%<c onmousedown="inca('Path', '', '', '%A_Loopfield%')">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        container = <div style='font-size:2em; color:red; margin:0.8em; text-align:center'>Music</div>`n
        container := fill(container)
        Loop, Parse, music, `|
            {
            SplitPath, A_Loopfield,,,,x
            container = %container%<c onmousedown="inca('Path', '', '', '%A_Loopfield%')">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        ch =
        count := 0
        Loop, Parse, search, `|
            {
            x := SubStr(A_Loopfield, 1, 1)
            if (ch != x)
              {
              if container
                fill(container)
              container = <div style='font-size:4em; color:red; text-align:center'>%x%</div>`n
              container := fill(container)
              count := 0
              }
            ch := x
            count+=1
            container = %container%<c onmousedown="inca('Search', '%A_Loopfield%')">%A_Loopfield%</c>`n
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
        view4 := view-7


header = <!--, %view%, %page%, %pages%, %filt%, %sort%, %toggles%, %list_view%, %playlist%, %path%, %search_path%, %search_term%, , -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" type="image/x-icon" href="file:///%inca%\cache\icons\inca.ico">`n<link rel="stylesheet" type="text/css" href="file:///%inca%/css.css">`n</head>`n`n

body = <body id='myBody' class='container' onload="myFol.scrollIntoView(); myView.scrollBy(0,-250); globals(%view%, %page%, %pages%, '%sort%', %filt%, %rate%, %list_view%, '%selected%', '%playlist%', %index%)">`n`n

<div id='myMenu' style='position:absolute; width:100`%'>`n`n
<div id='mySelected' class='selected'></div>`n

<div oncontextmenu="if(yw>0.1 || type) {event.preventDefault(); if (!gesture) {context()}}" style='padding-bottom:40em'>`n`n
<span id="myContext" class='context' onmouseout="media.style.zIndex=null; media.style.transform='scale('+skinny+',1)'; if(list_view) {media.style.opacity=0}; media.pause()">`n

<a onmouseup="inca('Settings')"`n onmouseover="el=document.getElementById('title'+index); x='';`n if(media.duration){x=Math.round(media.duration/60)+'mins - '};`n if (was_over_media) {this.innerHTML=x+el.value}"`n onmouseout="this.innerHTML=' . . .'"> . . .</a>`n
<a onmouseup="if (!long_click && was_over_media) {sel(index)} else{selectAll()}">Select</a>`n
<a onmousedown="inca('Delete','',was_over_media)">Delete</a>`n
<a onmousedown="inca('Favorite','',was_over_media)">Fav</a>`n
<a id="myZoom" onwheel="wheelEvents(event, id, this)">Zoom/a>`n
<a id="myFade" onwheel="wheelEvents(event, id, this)">Fade</a>`n
<a onmousedown="inca('Join')">Join</a></span>`n`n

<span id="myContext2" class='context' onmouseover='nav2.style.opacity=1'>`n
<a id='mySelect' onmouseup='sel(index)'`n onwheel="wheelEvents(event, id, this)" onmouseover="nav2.style.opacity=1"`n onmouseout="this.innerHTML='Select'" >Select</a>`n
<a id="myNext" style='font-size:1.5em' onwheel="wheelEvents(event, id, this)" onmouseover="nav2.style.opacity=1" onmouseup='togglePause()'></a>`n
<a id="mySeek" style='font-size:1.5em' onwheel="wheelEvents(event, id, this)" onmouseup='togglePause()'>Seek</a>`n
<a id="mySpeed" onwheel="wheelEvents(event, id, this)" onmouseup='togglePause()'>Speed</a>`n
<a id="mySkinny" onwheel="wheelEvents(event, id, this)" onmouseup='togglePause()'>Skinny</a>`n
<a id='myFlip' onmousedown='flip()'>Flip</a>`n
<a id='myMute' onmouseup='mute()'>Mute</a>`n
<a id='myLoop' onclick="loop()">Loop</a>`n
<a id="myCue" onclick="editing=true; myPlayer.pause(); cue=Math.round(myPlayer.currentTime*10)/10">Cue</a>`n
<a id="myFav" onmousedown="inca('Favorite', myPlayer.currentTime.toFixed(1), index, cue)">Fav</a>`n
<a id="myMp4" onmousedown="inca('mp4', myPlayer.currentTime.toFixed(1), index, cue.toFixed(1))">mp4</a>`n
<a id="myMp3" onmousedown="inca('mp3', myPlayer.currentTime.toFixed(1), index, cue.toFixed(1))">mp3</a>`n
<a id="myCapnav" onclick="editCap()">Cap</a></span>`n`n

<div id="myModal" class="modal" onwheel="wheelEvents(event, id, this)">`n
<div><video id="myPlayer" class='player' type="video/mp4" muted></video>`n
<span id="mySeekbar" class='seekbar'></span>`n
<textarea id="myCap" class="caption" onmouseenter="over_cap=true" onmouseleave="over_cap=false"></textarea></div>
<span><video class='preview' id='myPreview' muted type="video/mp4"></video></span></div>`n`n

<div id='myView' class='myList' style='padding-left:%page_l%`%; padding-right:%page_r%`%'>`n`n

<div id='mySearch' class='searchbox' style='position:relative; top:10em; width:100`%; border-radius:1.2em'>`n 
<a style='color:lightsalmon; font-size:1.4em' onmousedown="inca('Reload')">%title_s%</a>
<a style='color:#15110a00'>----</a>
<a style='color:red'>%list_size%</a>
<input id='myInput' class='searchbox' style='width:50`%' type='search' value='%search_term%'`n onmouseover='searchbox=this'>`n 
<a id='SearchBox' onclick="inca('SearchBox', myInput.value)"></a>`n
<a id='SearchAll' onclick="inca('SearchAll', myInput.value)"></a>`n
<a id='SearchAdd' onclick="inca('SearchAdd', myInput.value)" ></a></div>`n`n

<div id='myPanel' class='myPanel' onmouseover="if(selected) {this.style.border='1px solid salmon'}" onmouseout="this.style.border='none'">`n <div id='panel' class='panel'>`n`n%panel_list%`n<div style='height:40em'></div></div></div>`n`n

<div id='myRibbon' class='ribbon'>`n
<a id='Type' onmousedown="inca('Type')" %x6%>Type</a>`n
<a id='Size' onmousedown="inca('Size', filt)" onwheel="wheelEvents(event, id, this)" %x5%>Size</a>`n
<a id='Duration' onmousedown="inca('Duration', filt)" onwheel="wheelEvents(event, id, this)" %x3%> Duration</a>`n
<a id='Date' onmousedown="inca('Date', filt)" onwheel="wheelEvents(event, id, this)" %x4%>Date</a>`n
<a id='List' onmousedown="inca('List', filt)" %x11% style='color:red'>%order%</a>`n
<a id='Alpha' onmousedown="inca('Alpha', filt)" onwheel="wheelEvents(event,id,this)" %x2%>Alpha</a>`n
<a id='Shuffle' onmousedown="inca('Shuffle')" %x1%>Shuffle</a>`n
<a id='View' onmousedown="inca('View', view, '', index)" onwheel="wheelEvents(event, id, this)">View %view4%</a>`n 
<a id="myPage" onmousedown="inca('Page', page)" onwheel="wheelEvents(event, id, this)" style='min-width:9em'>%pg%</a>`n
<a onmousedown="inca('Recurse')" %x8%>+Subs</a>`n
<a onmousedown="inca('Images')" %x10%>Pics</a>`n
<a onmousedown="inca('Videos')" %x9%>Vids</a>`n</div>`n`n

<div style='width:100`%; height:12em'></div>`n%media_list%<div style='width:100`%; height:50vh'></div>`n`n

      WinActivate, ahk_group Browsers
      send, ^l
      sleep 100
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
      else if !inca_tab
        run, %new_html%						; open a new web tab
      else if (folder == previous_tab)				; just refresh existing tab
        send, {F5}
      else
        {
        SendInput, {Raw}%new_html%
        Send, {Enter}
        }
index := 0
selected =
      previous_tab := folder
      if fullscreen
        send, {F11}
      fullscreen := 0
      sleep 400							; time for page to load
      GuiControl, Indexer:, GuiInd
      PopUp("",0,0,0)
      }



    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        poster =
        view2 := view*0.66
        view3 := view*0.8
        view4 := view/20
        if ((cap_size := view / 16) > 1.4)
          cap_size := 1.4
        if DetectMedia(input)
            thumb := src
        else thumb = %inca%\cache\icons\no link.png
        x := RTrim(media_path,"\")
        SplitPath, x,,,,y
        if (search_term && foldr != y && sort == "Alpha")
          fold = <div style="font-size:1.4em; color:lightsalmon; width:100`%">%y%</div>`n
        foldr := y
        if (search_term || InStr(toggles, "Recurse"))
          fo := y
        FileRead, dur, %inca%\cache\durations\%media%.txt
        if (type == "video")
            {
            thumb =  %inca%\cache\posters\%media%.jpg
            if (start || playlist)
              IfExist, %inca%\cache\posters\%media% %start%.jpg
                thumb = %inca%\cache\posters\%media% %start%.jpg
            if (!start && !playlist)
              if (dur > 60)
                start := 20 + (4 * (dur - 20)/200)
              else start := 4 * dur / 200
            }
        rate := Setting("Default Speed")
        skinny := 1
        FileRead, str, %inca%\cache\widths\%media%.txt
        if str
          skinny := str
        if InStr(str, ",")
          {
          skinny := StrSplit(str, ",").1
          rate := StrSplit(str, ",").2
          }
        if (Abs(skinny) < 0.5 || Abs(skinny > 1.4))
          skinny := 1
        FileRead, cap, %inca%\cache\captions\%media%.srt
        if cap {
          caption := StrSplit(cap, "|").1
          start := StrSplit(cap, "|").2
          IfExist, %inca%\cache\posters\%media% %start%.jpg
            thumb = %inca%\cache\posters\%media% %start%.jpg
          caption = <div class='cap' style='font-size:%cap_size%em; width:%view3%em'`n onmousedown="sel(%j%); inca('EditCap', '%media%')">%caption%</div>`n
          cap := StrReplace(cap, "`r`n", "|")
          cap := StrReplace(cap, ",", "§")
          cap := StrReplace(cap, "'", "±")
          StringReplace, cap,cap,",±, All
          }
        dur2 := dur							; seconds - used in parameters
        if !dur2
          dur2 := 0
        if (dur && (type == "video" || type == "audio"))
            {
            dur := Time(dur)
            if (dur2>30)
              dur3 := Round(dur2/60)
            }
        else dur =
        FileGetSize, size, %src%, K
        size := Round(size/1000,1)
        FileGetTime, list_id, %src%, M
        sort_date := A_Now
        sort_date -= list_id, days
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
        start := Round(start+0.1,1)					; smooth start for thumb play
        StringReplace, media_s, media, `', &apos;, All


if list_view
  media_list = %media_list% %fold%<table onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, %cue%, '%cap%', %rate%, event);`n media%j%.style.opacity=1; media%j%.pause()" onmouseout="title%j%.style.color=null; over_media=0; media%j%.style.opacity=0"><tr id="entry%j%"`n onmouseover="title%j%.style.color='lightsalmon'; if(mouse_down && gesture) {sel(%j%)}">`n <td onmouseenter='over_media=0' onmousedown='sel(%j%)'>%ext%`n <video id='media%j%' class='media2' style="max-width:%view3%em; max-height:%view3%em; transform:scale(%skinny%, 1)"`n src="file:///%src%"`n %poster%`n preload='none' muted loop`n onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, %cue%,'%cap%', %rate%, event)" type="video/mp4"></video></td>`n <td>%size%</td>`n <td>%dur%</td>`n <td>%date%</td>`n <td>%j%</td>`n <td style='width:34em'><input id="title%j%" class='title' type='search' value='%media_s%'`n onmouseenter='over_media=0' oninput="was_over_media=%j%; renamebox=this.value; ren%j%.style.display='block'"></td>`n <td id='ren%j%' style='display:none; color:#826858'`n onmouseenter='over_media=0'; onmousedown="media%j%.load(); inca('Rename', renamebox, %j%)">Rename</td>`n <td style='text-align:right'>%fo%</td></tr></table>`n`n

else
  media_list = %media_list%<div id="entry%j%" style="display:flex; width%view%em; height:%view3%em; padding:%view4%em"`n onmouseup="if(!over_media){sel(%j%)}">`n <video id="media%j%" class='media' style="max-width:%view3%em; max-height:%view3%em; transform:scale(%skinny%, 1)"`n onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, %cue%, '%cap%', %rate%, event); if(mouse_down && gesture) {sel(%j%)}"`n onmouseout="this.pause(); over_media=0"`n src="file:///%src%"`n %poster%`n preload='none' muted loop type="video/mp4"></video>`n %caption% <input id='title%j%' value='%media%' class='title' style='display:none'></div>`n`n

}

    fill(in) {  
      panel_list = %panel_list%<div style="height:7em; padding:0.5em; transform:rotate(90deg)">`n%in%</div>`n
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
      long_click =
      timer := A_TickCount + 350
      SetTimer, Timer_up, -350
      return
    Timer_up:					; long back key press
      IfWinActive, ahk_group Browsers
        send, ^0^w 				; close tab
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
      else if inca_tab
        send, +{MButton}			; close java modal (media player)
      else if !inca_tab
        send, {Xbutton1}
      return

    ~WheelUp::
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
      Critical					; stop timed events
      gesture := 0
      long_click =
      timer := A_TickCount + 300
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
            if !gesture
              send {RButton}
            else if (gesture == 2)
              send {RButton up}
          Gui PopUp:Cancel
          break
          }
        if (Abs(x)+Abs(y) > 6)			; gesture started
          {
          MouseGetPos, xpos, ypos
          if !gesture
            gesture := 1
          if (xpos < 15)			; gesture at screen edges
              xpos := 15
          if (xpos > A_ScreenWidth - 15)
              xpos := A_ScreenWidth - 15
          MouseMove, % xpos, % ypos, 0
          if (click == "RButton")
              Gesture(x, y)
          if (inca_tab && GetKeyState("LButton", "P") && WinActive, ahk_class ahk_class mpv)
              if (y < 0)				; mpv player controls
                send, 9					; magnify
              else send, 0
          }
        if (!gesture && A_TickCount > timer && !GetKeyState("RButton", "P"))	; click timout
          {
          if (A_Cursor == "IBeam")
            {
            if WinActive("ahk_group Browsers")
              {
              Clipboard =
              send, ^c
              ClipWait, 0
              send, {Lbutton up}
              if ClipBoard
                {
                path =
                address =
                search_term =
                command = SearchBox		; search from selected text
                value := Clipboard
                ProcessMessage()
                CreateList(1)
                }
              else send, !+0
              }
            else send, !+0			; trigger osk keyboard
            }
          else long_click = true
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
          inca_tab := SubStr(title, 8)
        else inca_tab =
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
        StringGetPos, pos, inca_tab, %browser%, R
        StringLeft, inca_tab, inca_tab, % pos - 3
        if (inca_tab && inca_tab != previous_tab)			; has inca tab changed
            {
            folder := inca_tab
            GetTabSettings(1)						; get last tab settings
            if (previous_tab && FileExist(inca "\cache\lists\" inca_tab ".txt"))
              FileRead, list, %inca%\cache\lists\%inca_tab%.txt
            else CreateList(0)
            previous_tab := inca_tab
            }
        return inca_tab
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
        ptr := 1
        sleep 100							; time for browser to release media etc.
        messages := StrReplace(Clipboard, "/", "\")
        array := StrSplit(messages,"#")
        Loop % array.MaxIndex()/4
          {
          command := array[ptr+=1]
          value := array[ptr+=1]
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
        long_click =
        }


    ProcessMessage()
        {
        Clipboard =
        if (command == "Rename")
            {
            if (StrLen(value) < 4)
                popup = too small
            if !GetMedia(StrSplit(selected, ",").1)
                popup = no media
            if !popup
               {
               RenameFile(value)
               popup = Renamed
               }
            Popup(popup,0,0,0)
            reload := 3
            }
        if (command == "Reload")
            {
            if playlist
              address := playlist
            else address := path
            if search_term
              command = Search
            else command = Path
            value := search_term
            }
        if (command == "Subs")
            {
            x := StrSplit(subfolders,"|")
            address := x[value]
            value =
            command = Path
            }
        if (command == "EditCap")					; open in notepad if caption
            {
            IfExist, %inca%\cache\captions\%value%.srt
              run, %inca%\cache\captions\%value%.srt
            }
        if (command == "mp3" || command == "mp4")			; address = cue = start
            {								; value = current time = end
            GuiControl, Indexer:, GuiInd, %src%
            x = %value%							; converts number to string
            if !address
              run, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            else if (address == value)
              run, %inca%\cache\apps\ffmpeg.exe -ss 0 -to %address% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            else if (address < value)
              run, %inca%\cache\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            else   run, %inca%\cache\apps\ffmpeg.exe -ss %value% -to %address% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            sleep 1000
            reload := 3
            }
        if (command == "Settings")
            run, %inca%\
        if (command == "Caption")
            {
            if (SubStr(value,1,1) == "|")				; no text before time
              value = 
            FileRead, str, %inca%\cache\captions\%media%.srt
            FileDelete, %inca%\cache\captions\%media%.srt
            if InStr(str, address)
              str := StrReplace(str, address, value)
            else str = %str%%value%
            FileAppend, %str%, %inca%\cache\captions\%media%.srt, UTF-8
            GetMedia(StrSplit(selected, ",").1)
            start := StrSplit(value, "|").2
            Runwait, %inca%\cache\apps\ffmpeg.exe -ss %start% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%start%.jpg",, Hide
            reload := 2
            }
        if (command == "Favorite")
            {
            if !selected
              return
            popup("Added",900,0,0)
            if !address
              address = 0.0
            else if (address < value)
              {
              x:=value
              value:=address
              address:=x
              }
            if value							; new start time
              Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
            Loop, Parse, selected, `,
;              if A_Loopfield
                if GetMedia(A_Loopfield)
                  if value
                    FileAppend, %src%|%value%|%address%`r`n, %inca%\fav\new.m3u, UTF-8	; from modal player with start & cue time
                  else FileAppend, %target%|0.0|`r`n, %inca%\fav\new.m3u, UTF-8		; from htm with no start or cue times

            }
        if (command == "View")
            {
            if (view == value)
            list_view ^=1
            view := value
            if (view < 8)
              view := 8
            x := view - 7
            popup = View %x%
            popup(popup,0,0,0)
            if address
              index := address
            reload := 2
            }
        if (command == "Delete")
            {
            if !selected
              return
            popup("Deleted",0,0,0)
            reload := 3
            if playlist
              DeleteEntries(1)
            else 
              {
              Loop, Parse, selected, `,
                {
                if GetMedia(A_LoopField)
                  FileRecycle, %src%
                }
              Loop, Files, %media_path%/*.*, FD
                return
              command = Path
              selected =
              SplitPath, media_path,,address,,folder
              address = %address%\
              if (InStr(address, "\Downloads") && folder != "Downloads")
                FileRecycle, %media_path%				; delete folder if empty
              }
            }
        if (command == "EditMedia")
            {
            if GetMedia(value)
              {
              if (selected < -1.2) 
                selected = -1.2
              if (selected > 1.5)
                selected = 1.5
              if (selected >= 0.98 && selected <= 1.02)
                selected := 1
              FileRead, str, %inca%\cache\widths\%media%.txt
              skinny := 1
              rate := Setting("Default Speed")
              if str
                skinny := str
              if InStr(str, ",")
                {
                skinny := StrSplit(str, ",").1
                rate := StrSplit(str, ",").2
                }
              if (selected != skinny || address != rate)
                {
                str = %selected%,%address%
                FileDelete, %inca%\cache\widths\%media%.txt
                FileAppend, %str%, %inca%\cache\widths\%media%.txt
                }
              }
index := value
selected =
;RenderPage()
            }
        if (command == "History")
            {
            GetMedia(value)
            if (!playlist && (type == "video" || type == "audio"))
              FileAppend, %src%|%address%`r`n, %inca%\fav\History.m3u, UTF-8
            }
        if (command == "Move")
            {
            MoveEntry()								; move entry within playlist
;            selected =
            reload := 3
            }
        if (command == "Media")
            {
            if GetMedia(value)
              {
playing = true

FileRead, dur, %inca%\cache\durations\%media%.txt
              if !dur
                index(src)
              if (ext=="pdf")
                Run, %src%
              else if (type=="document" || type=="m3u")
                Run, % "notepad.exe " . src
              else if Setting("External Player")
                {
                send, +{MButton}							; close java player
                Run %inca%\cache\apps\mpv "%src%"
                }
              else if (!long_click && ((browser == "mozilla firefox" && type == "video" && ext != "mp4" && ext != "m4v" && ext != "webm") || (browser == "google chrome" && type == "video" && ext != "mp4" && ext != "mkv" && ext != "m4v" && ext != "webm")))
                {
                send, +{MButton}							; close java player 
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
            reload := 3
            }
        if (command == "Path")						; Up one folder level
            {
            IfNotExist, %address%
              {
              path := SubStr(path, 1, InStr(path, "\", False, -1))	; one folder back
              address = %path%
              command = Path
              }
            }
        if (command == "Path" && selected)
            {
            reload := 3
            FileTransfer()						; between folders or fav
            if (playlist || InStr(address, "\inca\"))
              return
            Loop, Files, %media_path%/*.*, FD
              return							; files still exist in folder
            SplitPath, media_path,,address,,folder
            address = %address%\
            if (InStr(address, "\Downloads") && folder != "Downloads")
              FileRecycle, %media_path%					; delete folder if empty
            selected =
            }
        if (command == "Join")
            {
            array := StrSplit(selected, ",")
            x := array.MaxIndex() - 1
            if (x == 2)
              {
              if !GetMedia(StrSplit(selected, ",").1)
                return
              src2 := src
              media2 := media
              if GetMedia(StrSplit(selected, ",").2)
                {
                Popup("Join Media",0,0,0)
                str = file '%media_path%\%media2%.%ext%'`r`nfile '%media_path%\%media%.%ext%'`r`n
                FileAppend,  %str%, %inca%\cache\lists\temp1.txt, utf-8
                runwait, %inca%\cache\apps\Utf-WithoutBOM.bat %inca%\cache\lists\temp1.txt > %inca%\cache\lists\temp.txt,,Hide
                runwait, %inca%\cache\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\cache\lists\temp.txt" -c copy "%media_path%\%media%- join.mp4",,Hide
                }
              sleep 1000
              reload := 3
              }
            }
        if (command == "SearchAdd" && value)
            {
            if !value
              return
            StringUpper, search_term, value, T
            search = %search%|%search_term%
            StringReplace, search, search, |, `n, All
            Sort, search, u
            StringReplace, search, search, `n, |, All
            IniWrite,%search%,%inca%\ini.ini,Settings,Search
            LoadSettings()
            PopUp("Added",600,0,0)
            reload := 1
            }
        if (command=="Filt"||command=="Path"||command=="Search"||command=="SearchBox"||command=="SearchAll"||InStr(sort_list, command))
            {
            reload := 1
            if (command == "Path") 
              {
              if InStr(address, ".m3u")
                {
                playlist := address
                SplitPath, address,,path,,folder
                path = %path%\
                }
              else
                {
                playlist =
                path := address
                StringTrimRight, address, address, 1
                SplitPath, address,,,,folder
                if !folder
                  folder = none
                }
              GetTabSettings(0)						; load previous tab basic settings from cache
              search_term =
              search_path =
              filt := 0
              if long_click
                {
                send, {LButton up}					; release click from new htm load
                if playlist
                  run, %playlist%					; open .m3u in notepad
                else run, %path%					; open folder in windows file explorer
                reload := 0
                }
              }
            if (command == "Search" || command == "SearchBox" || command == "SearchAll")
              {
              playlist =
              if (command == "SearchAll")
                value := StrReplace(value, " ", "+")
              else value := StrReplace(value, "+", " ")
              if (strlen(value) < 3)
                {
                reload := 0
                return
                }
              if long_click
                search_term = %search_term%+%value%			; long click adds new search term
              else search_term = %value%
              }
            if search_term						; search text from link or search box
                {
                folder := search_term
                GetTabSettings(0)					; load cached tab settings
                search_path := search_folders
                if (search_term && !InStr(search_path, path))		; search this folder, then search paths
                    search_path = %path%|%search_path%			; search this folder only
                if (search_term && !InStr(sort_list, command))
                  if (command == "SearchBox")
                    {
                    toggles =
                    list_view := 1
                    sort = Duration
                   }
                if (!InStr(sort_list, command))
                  filt := 0
                }
            WinGetPos,,,w,,a
            if (w == A_ScreenWidth && folder != previous_tab)
              {
              fullscreen := 1
              send, {F11}
              }
            else fullscreen := 0
            page := 1
            if value is not number
              value := 0
            if (command != "Images" && command != "videos" && command != "Recurse")
              if (InStr(sort_list, command) && sort != command)		; changed sort column
                {
                StringReplace, toggles, toggles, Reverse		; clear reverse
                if (value == filt)
                  filt := 0						; clear filter
                else filt := value					; or adopt new filt (if applied)
                sort := command
                return
                }
            if (filt != value)						; new filter value only
                filt := value
            else if (InStr(sort_list, command))				; sort filter
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
        if !search_path
            search_path := path
        IfNotExist, %path%
          if search_term
            path = %search_term%\
          else path = %profile%\Pictures\
        if show
            Popup(folder,0,0,0)
        list =
        list_size := 1
        if (InStr(toggles, "Recurse") || search_term)
            recurse = R
        FileRead, str, %playlist%
        if (playlist && !search_term)
           {
           Loop, Parse, str, `n, `r
             {
             x := StrSplit(A_Loopfield, "|").1
             y := StrSplit(A_Loopfield, "|").2
z := StrSplit(A_Loopfield, "|").3
             if (x && spool(x, A_Index, y, z))
                 break
             }
           }
        else Loop, Parse, search_path, `|
           Loop, Files, %A_LoopField%*.*, F%recurse%
             if A_LoopFileAttrib not contains H,S
               if spool(A_LoopFileFullPath, A_Index, 0, 0)
                 break 2
               else if (show && !Mod(list_size,10000))
                 PopUp(list_size,0,0,0)
        popup := list_size -1
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


    GetTabSettings(all)							; from .htm cache file
        {
        list_view = 0
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
            list_view := array.8
            if all
              {
              playlist := array.9
              path := array.10
              search_path := array.11
              search_term := array.12
              if search_term
                folder := search_term
              }
            }
        }


    Spool(input, count, start, cue)						; sorting and search filters
        {
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
            if (count > 250000)
                return 1
            list_id := list_size
            sort_name := list_size
            if search_term
              {
              array := StrSplit(search_term,"+")
              Loop, % array.MaxIndex()
                if (!InStr(filen, array[A_Index]))
                  return
              }
            if (sort == "Type")
                list_id := ex
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
              FileGetTime, list_id, %input%, M
              sort_date := A_Now
              sort_date -= list_id, days
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
              FileGetSize, list_id, %input%, K
              sort_name := Round(list_id)
              if (!InStr(toggles, "Reverse") && filt && list_id < filt*10000)
                return
              else if (InStr(toggles, "Reverse") && filt && list_id > filt*10000)
                return
              }
            else if (sort == "Duration")
              {
              FileRead, list_id, %inca%\cache\durations\%filen%.txt
              if !list_id
                list_id := 0
              if (!InStr(toggles, "Reverse") && filt && list_id/60 < filt)
                return
              else if (InStr(toggles, "Reverse") && filt && list_id/60 > filt)
                return
              sort_name := Time(list_id)
              }
            list_size += 1
            if !cue
              cue = 0.0
            list = %list%%list_id%/%input%/%med%/%sort_name%/%start%/%cue%`r`n
            }
        }


    Time(in)
        {
        year = 2017
        x := in
        year += x, seconds
        FormatTime, in, %year%, H:mm:ss			; show duration in hours:mins format
        if (x < 3600)
            FormatTime, in, %year%, mm:ss
        if (x < 600)
            FormatTime, in, %year%, m:ss
        return in
        }


    MoveEntry()						; within playlist 
        {
        if (sort != "List")
          {
          sort = Alpha
          CreateList(0)
          PopUp("Cannot Move if List Sorted",900,0,0)
          return
          }
        index := value
        select := StrSplit(selected, ",").1
        GetMedia(select)
        source = %target%
        GetMedia(index)
        if (source == target)
          return
        plist = %path%%folder%.m3u
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, str, `n, `r
          if A_LoopField
            {
            if (A_LoopField == source && !flag2)
                {
                flag2 := 1
                continue
                }
            if (select > index && InStr(toggles, "Reverse") || select <= index && !InStr(toggles, "Reverse"))
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            if (A_LoopField == target && !flag1)
                {
                flag1 := 1
                FileAppend, %source%`r`n, %plist%, UTF-8
                }
            if (select <= index && InStr(toggles, "Reverse") || select > index && !InStr(toggles, "Reverse"))
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            }
        }


    FileTransfer()
        {
        if (address == path || playlist == address)
          {
          PopUp("Reset",0,0,0)
          return
          }
        sleep 100							; time for browser to release media
        if (playlist && !InStr(address, "\inca\"))
          {
          PopUp("Cannot Move Shortcuts",1000,0.34,0.2)
          return
          }
        Loop, Parse, selected, `,
            {
            index := A_LoopField
            if long_click
              popup = Copy - %media%
            else popup = Move - %media%
            if (InStr(address, "\inca\"))
              popup = Added
            PopUp(popup,0,0,0)
            if GetMedia(index)
              if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
                FileAppend, %target%`r`n, %address%, UTF-8		; add media entry to playlist
              else 
                {
                SplitPath, src,,media_path,ext,media
                FileGetSize, x, %address%%media%.%ext%			; target
                FileGetSize, y, %src%					; source
                z=
                if (x && x == y)
                  continue
                if (x && x !=y)
                Loop 100
                  {
                  z = \%media% - Copy (%A_Index%).%ext%
                  FileGetSize, x,  %address%%z%
                  if !x
                    break
                  if (x == y)
                    break 2
                  }
                if !long_click
                  FileMove, %src%, %address%%z%				; move file to new folder
                else FileCopy, %src%, %address%%z%
                }
            }
        if !long_click
          if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
            DeleteEntries(0)
        }  


    DeleteEntries(trash)						; playlist entries
        {
        plist = %path%%folder%.m3u
        IfNotExist, %plist%
          return
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, selected, `,
         if A_LoopField
          {
          GetMedia(A_LoopField)
          x = %target%`r`n
          y = %src%`r`n
          z = %target%|%cue%`r`n
          str := StrReplace(str, x,,,1)					; fav with start time
          str := StrReplace(str, y,,,1)					; music with no start time
          str := StrReplace(str, z,,,1)					; fav with cue
          if (trash && folder != "Trash" && folder != "History")
           if InStr(path, "\inca\")
            FileAppend, %x%, %inca%\fav\Trash.m3u, UTF-8
          }
        FileAppend, %str%, %plist%, UTF-8
        }


    RenameFile(new_name)
        {
        IfNotExist, %src%
          return
        FileMove, %src%, %media_path%\%new_name%.%ext%			; FileMove = FileRename
        new_entry := StrReplace(target, media, new_name)
        folders = %inca%\fav\*.m3u|%inca%\music\*.m3u
        Loop, Parse, folders, `|
          Loop, Files, %A_LoopField%*.*, FR
            {
            FileRead, str, %A_LoopFileFullPath%				; find & replace in .m3u files
            if !InStr(str, target)
                continue
            FileDelete, %A_LoopFileFullPath%
            Loop, Parse, str, `n, `r
              if A_LoopField
                {
                x := A_LoopField
                if (x == target)
                    x := new_entry
                FileAppend, %x%`r`n, %A_LoopFileFullPath%, UTF-8
                }
            }
        FileMove, %inca%\cache\widths\%media%.txt, %inca%\cache\widths\%new_name%.txt, 1
        FileMove, %inca%\cache\captions\%media%.srt, %inca%\cache\captions\%new_name%.srt, 1
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
        SplitPath, input,,media_path,ext,media
        stringlower, ext, ext
        type := DecodeExt(ext)
        src := input
        IfExist, %src%
            return type
        }


    GetMedia(index)
        {
        if !index
          return
        index := index + Setting("Page Size") * (page - 1)
        FileReadLine, str, %inca%\cache\lists\%folder%.txt, index
        src := StrSplit(str, "/").2
        seek := StrSplit(str, "/").5
        cue := StrSplit(str, "/").6
        if !seek
          seek = 0.0
        target = %src%|%seek%
        if src
            return DetectMedia(src)
        }


    Gesture(x, y)
        {
        if (Abs(x) > Abs(y) )					; master volume
          {
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
          vol_ref := volume
          vol_popup := 4
          ShowStatus()
          }
        else if (!playing && WinActive("ahk_group Browsers"))	; browser magnify
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
        else if (gesture == 1 && WinActive("ahk_group Browsers"))
          {
          gesture := 2
          send {RButton down}
          }
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
        if (status != last_status)					; to stop flickering
            {
            Gui, Status:+lastfound
            WinSet, TransColor, 0 60
            Gui, Status:Font, s20 cWhite, Segoe UI
            GuiControl, Status:Font, GuiSta
            GuiControl, Status:, GuiSta, %status%
            Gui, Status:Show, NA
            last_status := status
            }
        yv := A_ScreenHeight - 4
        xv := A_ScreenWidth * volume/101
        if vol_popup
            gui, vol: show, x%xv% y%yv% w30 h4 NA
        else gui, vol: hide
        if !Setting("Status Bar")
            Gui, Status:Hide, NA
        }


    PopUp(message, time, x, y)
        {
        MouseGetPos, xp, yp
        xp -= 50
        yp -= 120
        if (x || y)
            xp := A_ScreenWidth * x, yp :=  A_ScreenHeight * y
        time := Ceil(time / 10)
        Gui PopUp:Destroy
        Gui PopUp:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui PopUp:Color, Black
        Gui PopUp:Font, s20 cRed, Segoe UI
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


    GetDuration(source)
        {
        if (type != "video" && type != "audio")
            return
        SplitPath, source,,,,filen
        dur =
        FileRead, dur, %inca%\cache\durations\%filen%.txt
        if !dur
            {
            clp := clipboard
            clipboard =
            RunWait %COMSPEC% /c %inca%\cache\apps\ffmpeg.exe -i "%source%" 2>&1 | find "Duration" | Clip, , hide && exit
            ClipWait, 3
            StringTrimLeft, aTime, clipboard, 12
            StringLeft, aTime, aTime, 8
            aTime := StrSplit(aTime, ":")
            dur := aTime.1 * 3600 + aTime.2 * 60 + aTime.3
            FileDelete, %inca%\cache\durations\%filen%.txt
            FileAppend, %dur%, %inca%\cache\durations\%filen%.txt
            clipboard := clp
            }
        return dur
        }


    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        inca := SubStr(inca, 1, InStr(inca, "\", False, -1))	; one folders back
        inca := SubStr(inca, 1, InStr(inca, "\", False, -1))
        StringTrimRight, inca, inca, 1
        EnvGet, profile, UserProfile
        IniRead,features,%inca%\ini.ini,Settings,features
        IniRead,search_folders,%inca%\ini.ini,Settings,search_folders
        IniRead,index_folders,%inca%\ini.ini,Settings,index_folders
        IniRead,fol,%inca%\ini.ini,Settings,Fol
        IniRead,search,%inca%\ini.ini,Settings,Search
        IniRead,fav,%inca%\ini.ini,Settings,Fav
        IniRead,music,%inca%\ini.ini,Settings,Music
        }


    Setting(key)
        {
        Loop, Parse, features, `|
            {
            x := StrSplit(A_LoopField, "/").1
            if InStr(x, key)
                return StrSplit(A_LoopField, "/").2
            }
        }


    Initialize()
        {
        Global
        LoadSettings()
        FileDelete, %inca%\cache\lists\*.*
        FileRead, str, %inca%\fav\History.m3u
        FileDelete, %inca%\fav\History.m3u
        Loop, Parse, str, `n, `r
          count++
        if (count > 100)
          count -= 100
        else count = 0
        Loop, Parse, str, `n, `r						; keep history below 100 entries
          if (A_Loopfield && A_Index >= count)
            str2 = %str2%%A_Loopfield%`r`n
        FileAppend, %str2%, %inca%\fav\History.m3u, UTF-8
        CoordMode, Mouse, Screen
        gui, vol: +lastfound -Caption +ToolWindow +AlwaysOnTop -DPIScale
        gui, vol: color, db9062
        Gui, background:+lastfound -Caption +ToolWindow -DPIScale
        Gui, background:Color,Black
        Gui, background:Show, x0 y0 w%A_ScreenWidth% h%A_ScreenHeight% NA
        WinSet, Transparent, 0
        WinSet, ExStyle, +0x20
        Gui Status:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui Status:Color, Black
        ix := Round(A_ScreenWidth * 0.3)
        Gui Status:Add, Text, vGuiSta w%ix% h35
        Gui Status: Show, Hide
        ix := A_screenWidth * Setting("Status Bar")/100
        iy := A_ScreenHeight * 0.955
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


    TimedEvents:
        GetBrowser()
        array := StrSplit(clipboard,"#")
        if (inca_tab && array.MaxIndex() > 4)				; likely is a java message
          Clipboard()
        Gui, background:+LastFound
        if inca_tab
            WinSet, Transparent, % Setting("Dim Desktop")
        else WinSet, Transparent, 0
        if vol_popup							; show volume popup bar
            vol_popup -= 1
        if (volume > 0.1 && !vol_popup && Setting("Sleep Timer") > 10 && A_TimeIdlePhysical > 600000)
            {
            volume -= vol_ref / (Setting("Sleep Timer") * 6)		; sleep timer
            SoundSet, volume						; slowly reduce volume
            vol_popup := 100						; check every 10 seconds
            }
        x = %A_Hour%:%A_Min%
        ShowStatus()							; show time & vol
        return


    Indexer:
    Critical Off
    SetTimer, indexer, 60000, -2
    if index_folders
      Loop, Parse, index_folders, `|
        Loop, Files, %A_LoopField%*.*, R
    index(A_LoopFileFullPath)
    return


    index(source)
          {
          SplitPath, source,,fold,ex,filen
          med := DecodeExt(ex)
          if (med != "video" && med != "audio")
            return
          ifExist, %fold%\%Filen%.part					; file downloading
            return
          dur =
          FileRead, dur, %inca%\cache\durations\%filen%.txt
          if !dur
            {
            type = video
            dur := GetDuration(source)
            }
          if (med == "audio")
            return
          create := 0
          IfNotExist, %inca%\cache\posters\%filen%.jpg
            create := 1
          IfNotExist, %inca%\cache\thumbs\%filen%.jpg
            create += 2
          if create
            {
            GuiControl, Indexer:, GuiInd, indexing - %filen%
            t := 0
            if (dur > 60)
                {
                t := 20	      						; skip any video intro banners
                dur -= 20
                }
            loop 180							; 36 video frames in thumb preview
                {
                y := Round(A_Index / 5)
                if (create & 1 && A_Index == 5)
                    runwait, %inca%\cache\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%filen%.jpg",, Hide
                if (create & 2 && !Mod(A_Index,5))
                    runwait, %inca%\cache\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\lists\%y%.jpg",, Hide
                t += (dur / 200)
                }
            if (create & 2)
                Runwait %inca%\cache\apps\ffmpeg -i %inca%\cache\lists\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
            GuiControl, Indexer:, GuiInd
            }
          }

    


