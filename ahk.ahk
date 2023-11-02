

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
        Global sort_list		:= "Shuffle|Alpha|Duration|Date|Size|Ext|Reverse|Recurse|Videos|Images|"
        Global toggles			; eg. reverse
        Global features			; program settings
        Global fol			; favorite folders
        Global fav			; favorite playlists
        Global search			; list of search words
        Global search_folders		; default search locations
        Global index_folders		; to index thumb sheets
        Global search_path		; current search paths
        Global inca			; default folder path
        Global list			; sorted media file list
	Global list_id			; pointer to media file
        Global list_size
        Global selected			; selected files from web page
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
        Global view := 15		; thumb view (em size)
        Global list_view := 1
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
        Global playing
        Global poster
        Global media_list
        Global media_thumbs


    main:
      initialize()				; set environment
      WinActivate, ahk_group Browsers
      Clipboard = #Path###%profile%\Pictures\
      if !GetBrowser()
        Clipboard()
      SetTimer, TimedEvents, 100		; every 100mS
      return					; wait for mouse/key events




    RenderPage(reload)							; construct web page from media list
        {
        Critical							; stop key interrupts
        if !path
            return
        media_list =
        media_thumbs =
        subfolders =
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
        IniWrite,%subfolders%,%inca%\ini.ini,Settings,Subs
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
        fi = lightsalmon
        if filt
          {
          fi = red
          filtered = Filtered
          }

        type = video							; prime for list parsing
        page_w := Setting("Page Width")
        page_s := Setting("Page Size")
        zoom := Setting("Default Zoom")
        fullscreen := Setting("Fullscreen")
        Loop, Parse, list, `n, `r 					; split list into smaller web pages
            {
            item := StrSplit(A_LoopField, "/")				; sort filter \ src \ media type \ ext
            source := item.2
            type := item.3
            sort_name := item.4
            start := item.5
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
              x%A_Index% = style='min-width:3em; color:red'
            else x%A_Index% = style='min-width:3em; color:lightsalmon'
          if InStr(toggles, A_LoopField)
            x%A_Index% = style='min-width:3em; color:red'
          }


        Loop, Parse, subfolders, `|
            {
            StringTrimRight, x, A_Loopfield, 1
            array := StrSplit(x,"\")
            x := array.MaxIndex()
            fname := array[x]
            subs = %subs% <div><table><tr><td style='text-align:left; width:%page_w%`%; margin-left:4.2em; white-space:nowrap; text-overflow:ellipsis' onmousedown='navigator.clipboard.writeText("#Subs#%A_Index%#"+selected+"#")'>%fname%</td></tr></table></div>`n
            }


 view1 := view*1.5
 view2 := view*0.8
 view3 := view/10
 page_w2 := page_w*0.9



header = <!--, %view%, %page%, %pages%, %filt%, %sort%, %toggles%, %list_view%, %playlist%, %path%, %search_path%, %search_term%, , -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" type="image/x-icon" href="file:///%inca%\apps\icons\inca.ico">`n<link rel="stylesheet" type="text/css" href="file:///%inca%/css.css">`n</head>`n`n

body = <body id='myBody' class='container' onload="spool(event, 'Fol', '%ini%', %view%, %page%, %pages%, %filt%, %zoom%, %list_view%, %fullscreen%, '%playlist%')">`n`n
<div id='mySelected' class='selected'></div>`n
<div oncontextmenu="context(event)" style='padding-bottom:40em'>`n`n
<span id="myContext" class='context'>`n
<a onmousedown='inca(event, "#Settings###")'> . . .</a>`n
<a onmousedown=selectAll()>Select</a>`n
<a onmousedown='del(event)'>Delete</a>`n
<a onmousedown='rename(event)'>Rename</a>`n
<a onmousedown='fav(event)'>Fav</a>`n
<a onclick='cut()'>Cut</a>`n
<a onmousedown='paste()'>Paste</a>`n
<a onmousedown='inca(event, "#Join##" + selected + "#")'>Join</a>`n
<a onmousedown='flip(event)'>Flip</a></span>`n`n

<span id="myContext2" class='context'>`n
<a id='myMute' onmouseup='mute()'>Mute</a>`n
<a id='mySel2' onmousedown="sel(0)" onwheel="wheelEvents(event, id, this)">Sel.</a>`n
<a id="mySpeed" onwheel="wheelEvents(event, id, this)"></a>`n
<a id='myLoop' onclick="loop()">Loop</a>`n
<a id='myFav2' onmousedown='inca(event, "#Favorite#" + media.currentTime.toFixed(1) + "#" + index + ",#")'>Fav</a>`n
<a id="myCapnav" onclick="editCap()">Cap</a>`n
<a onclick="cue = Math.round(media.currentTime*10)/10">Cue</a>`n
<a id="myMp4" onmousedown="inca(event, '#mp4#' + media.currentTime.toFixed(1) + '#' + index + ',#' + cue)">mp4</a>`n
<a id="myMp3" onmousedown="inca(event, '#mp3#' + media.currentTime.toFixed(1) + '#' + index + ',#' + cue)">mp3</a>`n
<a onmousedown='flip()'>Flip</a></span>`n`n

<div id="myModal" class="modal" onwheel="wheelEvents(event, id, this)">`n
<div><video id="myPlayer" style='position:absolute; border-radius:1em' type="video/mp4" muted></video>`n
<span id="mySeekBar" class='seekbar'></span>`n
<textarea id="myCap" class="caption" onmouseenter="over_cap=true" onmouseleave="over_cap=false"></textarea>`n</div></div>`n`n

<div id='myMenu' style='position:absolute; width:100`%'>
<div id='Menu' class='ribbon' style='width:%page_w%`%'> 
<a style='width:26`%'></a>`n
<a onmousedown="inca(event, '#Menu###')" style='font-size:2em; color:lightsalmon; transform:none'>%title_s%</a>`n
<a style='font-size:1.3em; color:red'> %list_size%</a><a style='width:30`%'></a></div>`n`n

<div id='myFiles' class='ribbon' style='width:40`%' onmouseover='panel.style.opacity=1; panel.style.zIndex=99'>`n`n
<a onmouseover="spool(event, 'Fol'); panel.style.opacity=1; panel.style.zIndex=99" onwheel="wheelEvents(event, 'Fol', this)">Fol</a>`n
<a onmouseover="spool(event, 'Fav'); panel.style.opacity=1; panel.style.zIndex=99" onwheel="wheelEvents(event, 'Fav', this)">Fav</a>`n
<a onmouseover="spool(event, 'Search'); panel.style.opacity=1; panel.style.zIndex=99" onwheel="wheelEvents(event, 'Search', this)">Search</a>`n
<a onmouseover="spool(event, 'Music'); panel.style.opacity=1; panel.style.zIndex=99" onwheel="wheelEvents(event, 'Music', this)">Music</a>`n</div>`n`n

<div class='panel' style='width:%page_w%`%' id='myPanel' onwheel="wheelEvents(event, 'myPanel', this)"></div>`n`n

<div id='myRibbon' style='display:flex; margin:auto; width:%page_w%`%'>`n 
<input id='myInput' class='searchbox' style='margin-left:2`%; margin-bottom:0.5em' type='search' value='%search_term%'`n onmouseover='inputbox=this'>`n 
<a id='mySearch' onclick="inca(event, '#SearchBox#'+myInput.value+'##')" class='searchbox' style='width:12`%; border-radius:0'></a>`n
<a id='myAll' onclick="inca(event, '#SearchAll#'+myInput.value+'##')" class='searchbox' style='width:8`%; border-radius:0'></a>`n
<a id='myAdd' onclick="inca(event, '#SearchAdd#'+myInput.value+'##')" class='searchbox' style='width:8`%; margin-right:2`%; border-radius:0 1em 1em 0'></a></div>`n`n

<div class='ribbon' style='width:%page_w%`%'>`n<a></a>`n
<a onmousedown="inca(event, '#Ext###')" %x6%">Ext</a>`n
<a id='Size' onmousedown="inca(event, '#Size#'+filt+'##')" onwheel="wheelEvents(event, id, this)" %x5%>Size</a>`n
<a id='Duration' onmousedown="inca(event, '#Duration#'+filt+'##')" onwheel="wheelEvents(event, id, this)" %x3%>Duration</a>`n
<a id='Date' onmousedown="inca(event, '#Date#'+filt+'##')" onwheel="wheelEvents(event, id, this)" %x4%>Date</a>`n
<a id='Alpha' onmousedown="inca(event,'#Alpha#'+filt+'##')" onwheel="wheelEvents(event,id,this)" %x2%>Alpha</a>`n
<a id='Shuffle' onmousedown="inca(event, '#Shuffle###')" onwheel="wheelEvents(event,id,this)" %x1%>Shuffle</a>`n
<a id='myFilt' style='color:%fi%; width:4em; transition:1s'>%filtered%</a>`n
<a id='View' onmousedown="inca(event, '#View#'+view+'##')" onwheel="wheelEvents(event, id, this)">View</a>`n 
<a id="myPage" onmousedown="inca(event, '#Page#'+page+'##')" onwheel="wheelEvents(event, id, this)" style='width:8em'>%pg%</a>`n
<a onmousedown="inca(event, '#Recurse###')" %x8%>+Subs</a>`n
<a onmousedown="inca(event, '#Images###')" %x10%>Pics</a>`n
<a onmousedown="inca(event, '#Videos###')" %x9%>Vids</a>`n</div>`n`n

<video id="mySeek" class='seek' style='width:%view2%em' type="video/mp4" muted></video>`n`n

if subs
   body = %body%`n`n<div style='width:%page_w2%`%; margin:auto; padding:0.5em; margin-bottom:1em; border:1px solid #82685833; border-radius:1em'>%subs%</div>`r`n`r`n

if !list_view
  body =%body%<div style='position:relative; margin:auto; width:%page_w%`%; overflow:hidden; height:%view1%em' onmouseover='panel.style.zIndex=null; panel.style.opacity=null'>`n <div id='myView' class='View' style='width:%view1%em; left:-%view1%em'>`n`n%media_list%`n<div style='height:38em'></div></div></div>`n`n

if (list_view == 1)
  body =%body%<div id='myView' class='myList'`n style='width:%page_w%`%' onmouseover='panel.style.zIndex=null; panel.style.opacity=null'>`n<table style='height:%view3%em'></table>`n%media_list%<table style='height:39em'></table></div>`n`n</div>`n

if (list_view == 2)
  body =%body%<div id='myView' class='myList'`n style='width:%page_w%`%' onmouseover='panel.style.zIndex=null; panel.style.opacity=null'>`n`n%media_list%<table style='height:50em'></table></div>`n`n</div>`n


        FileDelete, %inca%\cache\html\%folder%.htm
        StringReplace, header, header, \, /, All
        StringReplace, body, body, \, /, All
        html = %header%%body%</div></div>`n<script>`n%java%</script>`n</body>`n</html>`n
        FileAppend, %html%, %inca%\cache\html\%folder%.htm, UTF-8

        if reload
          {								; create / update browser tab
          new_html = file:///%inca%\cache\html\%folder%.htm
          StringReplace, new_html, new_html, \,/, All
          IfWinNotExist, ahk_group Browsers
            run, %new_html%						; open a new web tab
          else if !inca_tab
            run, %new_html%						; open a new web tab
          else if (folder == previous_tab)				; just refresh existing tab
            send, {F5}
          else 
            {
            Clipboard := new_html
            sleep 24
            send ^l
            sleep 24
            send ^v
            sleep 24
            Clipboard := clip
            send, {Enter}
            }
          previous_tab := folder
          sleep 400							; time for page to load
          }
        GuiControl, Indexer:, GuiInd
        PopUp("",0,0,0)
        }





;`n<hr style='height:1em; width:%page_w2%`%; margin:auto; outline:none; border:0 none; border-top:0.1px solid #826858'></hr>








    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        poster =
        if ((cap_size := view / 16) > 1.4)
          cap_size := 1.4
        if DetectMedia(input)
            thumb := src
        else thumb = %inca%\apps\icons\no link.png
        x := RTrim(media_path,"\")
        SplitPath, x,,,,y
if search_term
   fold = <td style="width:4em; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; padding-right:1em">%y%</td>
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
        transform = transform:scaleX(%skinny%);
        FileRead, cap, %inca%\cache\captions\%media%.srt
        if cap {
          caption := StrSplit(cap, "|").1
          start := StrSplit(cap, "|").2
          IfExist, %inca%\cache\posters\%media% %start%.jpg
            thumb = %inca%\cache\posters\%media% %start%.jpg
          caption = <a onmousedown='inca(event, "#EditCap#%media%##")}' style="color:#ffa07a66; line-height:1em; position:absolute; display:block; font-size:%cap_size%em; margin-left:0.7em; max-width:95`%">%caption%</a>
          cap := StrReplace(cap, "`r`n", "|")
          cap := StrReplace(cap, ",", "§")
          cap := StrReplace(cap, "'", "±")
          StringReplace, cap,cap,",±, All
          }
dur2 := dur
if !dur2
 dur2 := 0
        if (dur && (type == "video" || type == "audio"))
            dur := Time(dur)
        else dur =
        if (type == "video")
            FileGetSize, size, %src%, M
        else FileGetSize, size, %src%, K
        size := Round(size)

        FileGetTime, list_id, %src%, M
        sort_date := A_Now
        sort_date -= list_id, days
        date = today
        years := floor(sort_date / 365)
        if years
          date = %years% y
        else if sort_date 
          date = %sort_date% d
view_t := view*0.8
view_k := view*1.3
view_j := view/20
view_i := view/4

        if (type == "audio" || type == "m3u")
            thumb = %inca%\apps\icons\music.png
        if (type == "document")
            thumb = %inca%\apps\icons\ebook.png
        StringReplace, thumb, thumb, #, `%23, All
        StringReplace, src, src, #, `%23, All				; html cannot have # in filename
        stringlower, thumb, thumb
        poster = poster="file:///%thumb%"
        start := Round(start+0.1,1)					; smooth start for thumb play
        StringReplace, media_s, media, `', &apos;, All
; FileRead, dur, %inca%\cache\durations\%media%.txt
; random, start, 0, dur-5
; start := Round(start,2)
; poster = #t=%start%

icon = %thumb%
 if (list_view == 2 && type!="image" && type!="video")
  icon = %inca%\apps\icons\play.ico
icon = <img src="%icon%" width='10' height='10'>


if !list_view
  media_list = %media_list%<div id="entry%j%" style="display:flex; height:%view%em; width%view%em; transform:rotate(90deg); border-radius:1em"`n onmouseup="if(!event.button&&!over_media){sel(%j%); myInput.value='%media%'}" onmouseover="this.style.position='relative'; this.style.zIndex=Zindex+=1">`n 
<video class='thumb' id="media%j%" style="max-width:%view_t%em; max-height:%view_t%em; %transform%"`n onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, '%cap%', %rate%, %dur2%, event); this.currentTime=start; this.play(); myFilt.style.opacity=1; myFilt.innerHTML='%dur%'; if(mouse_down && gesture) {sel(%j%)}"`n onmouseout="this.pause(); over_thumb=0; over_media=0; myFilt.style.opacity=0"`n src="file:///%src%"`n %poster%`n preload='none' muted loop type="video/mp4"></video>%caption%</div>`n`n


if (list_view == 1)
  media_list = %media_list%<div id="entry%j%" style="display:flex; width%view%em; height:%view_t%em; padding:%view_j%em"`n onmouseup="if(!event.button&&!over_media){sel(%j%); myInput.value='%media%'}">`n <video id="media%j%" class='thumb' style="max-width:%view_t%em; max-height:%view_t%em; %transform%"`n onmouseover="this.style.position='relative'; this.style.zIndex=Zindex+=1; overThumb(%j%, %skinny%, '%type%', %start%, '%cap%', %rate%, %dur2%, event); this.currentTime=start; this.play(); myFilt.style.opacity=1; myFilt.innerHTML='%dur%'; if(mouse_down && gesture) {sel(%j%)}"`n onmouseout="this.pause(); over_thumb=0; over_media=0; myFilt.style.opacity=0"`n src="file:///%src%"`n %poster%`n preload='none' muted loop type="video/mp4"></video>%caption%</div>`n`n


if (list_view == 2)
  media_list = %media_list% <table><tr id="entry%j%" onmouseup='if(!event.button&&!over_media){sel(%j%)}'`n onmouseover='if(mouse_down && gesture) {sel(%j%)}'>`n <td>%ext%</td><td>%size%</td><td id='dur%j%'>%dur%</td><td>%date%</td><td>%j%</td>`n<td onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, '%cap%', %rate%, %dur2%, event); media%j%.style.opacity=1; media%j%.currentTime=start; this.play(); myFilt.style.opacity=1; myFilt.innerHTML='%dur%'"`n onmouseout="media%j%.style.opacity=0; over_thumb=0; over_media=false; myFilt.style.opacity=0">`n%icon%<video id='media%j%' class='thumb2' style="max-width:%view_t%em; max-height:%view_t%em; %transform%"`n src="file:///%src%"`n %poster%`n preload='none' muted loop`n onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, '%cap%', %rate%, %dur2%, event); this.currentTime=start; this.play()" onmouseout='this.pause(); over_thumb=0; over_media=0'`n type="video/mp4"></video></td>`n 
<td style='width:60`%; padding-left:2em'><input id="title%j%" class='title' type='search' value='%media_s%'`n onmousedown='if(!event.button) {inputbox=this; sessionStorage.setItem("last_index",%j%)}' onmouseup="myInput.value='%media%'"></td>`n 
</tr></table>`n`n



}



; 





    ~Esc up::
      ExitApp

    ~LButton::					; click events
    ~MButton::
     RButton::
      MouseDown()
      return

    Xbutton1::					; mouse "back" button
      Critical
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
        {
        WinGetPos,,,w,,a
        sleep 24
        if (w == A_ScreenWidth)
          send, {F11}
;        if playing
;          send, {LButton}			; stop browser clipboard error message but causes sound burst
        send, {MButton up}			; close java modal (media player)
        }
      else send, {Xbutton1}
      playing =
      return

    ~WheelUp::
       wheel = up
    ~WheelDown::
       MouseGetPos, xpos, ypos
       IfWinActive, ahk_class ahk_class mpv	; mpv player controls
         {
         if (type != "image")
           if (xpos < 100)
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
      gesture =
      long_click =
      timer := A_TickCount + 300
      MouseGetPos, xpos, ypos
      StringReplace, click, A_ThisHotkey, ~,, All
      loop					; gesture detection
        {
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        xy := Abs(x + y)
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P") && !GetKeyState("MButton", "P"))
          {
          if (!gesture && click == "RButton")
            send {RButton}
          Gui PopUp:Cancel
          break
          }
        if (xy > 6)				; gesture started
          {
          MouseGetPos, xpos, ypos
          gesture = 1
          if (xpos < 15)			; gesture at screen edges
              xpos := 15
          if (xpos > A_ScreenWidth - 15)
              xpos := A_ScreenWidth - 15
          MouseMove, % xpos, % ypos, 0
          if GetKeyState("RButton", "P")
              SetVolume(1.4 * x)
          if (inca_tab && GetKeyState("LButton", "P") && WinActive, ahk_class ahk_class mpv)
              if (y < 0)				; mpv player controls
                send, 9					; magnify
              else send, 0
          else if (GetKeyState("LButton", "P") && xpos < 50)
             {
             WinGet, state, MinMax, ahk_group Browsers	; browser magnify
             if (state > -1)
               {
               WinActivate, ahk_group Browsers
               if (y < 0)
                 send, ^0
               else send, ^{+}
               sleep 84
               }
             }
          }
        if (!gesture && A_TickCount > timer && !GetKeyState("RButton", "P"))	; click timout
          {
          if (A_Cursor == "IBeam")
            {
            if WinActive("ahk_group Browsers")
              {
              clip := Clipboard
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
              Clipboard := clip
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
        command =
        value =
        address =
        reload =
        type =
        ptr := 1
        sleep 24
        input := StrReplace(Clipboard, "/", "\")
; tooltip %input%
        array := StrSplit(input,"#")
        Clipboard := clip
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
          if (command == "Rename")
            {
            value =
            pos := InStr(input, "#",,-1)
            list_id := SubStr(input,pos+1)
            StringTrimRight, list_id, list_id, 2
            GetMedia(list_id)
            pos := InStr(input, "#Rename#")
            value := SubStr(input, pos+8)
            pos := InStr(value, "#",,-1)
            value := SubStr(value,1,pos-1)
            if (StrLen(value) < 4)
                popup = too small
            if !GetMedia(list_id)
                popup = no media
            if !popup
               {
               RenameFile(value)
               popup = Renamed
               }
            Popup(popup,600,0,0)
            sleep 555
            reload := 3
            break
            }
          else ProcessMessage()
          }
        if (reload == 1)
          CreateList(1)
        if (reload == 2)
          RenderPage(1)
        if (reload == 3)
          CreateList(0)
        if (reload == 4)
          RenderPage(0)
        long_click =
        }


    ProcessMessage()
        {

        if (command == "Subs")
            {
            x := StrSplit(subfolders,"|")
            address := x[value]
            command = Path
            }
        if (command == "EditCap")					; open in notepad if caption
            {
            IfExist, %inca%\cache\captions\%value%.srt
              run, %inca%\cache\captions\%value%.srt
            }
        if (command == "mp3" || command == "mp4")			; address = cue, value = current time
            {
            GuiControl, Indexer:, GuiInd, %src%
            x = %value%							; convert number to string
            if !address
              run, %inca%\apps\ffmpeg.exe -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            else if (address == value)
              run, %inca%\apps\ffmpeg.exe -ss %address% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            else run, %inca%\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            sleep 1000
            reload := 3
            }
        if (command == "Settings") 
            ShowSettings()
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
            Runwait, %inca%\apps\ffmpeg.exe -ss %start% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%start%.jpg",, Hide
            reload := 2
            }
        if (command == "Favorite")
            {
            if !value
                value := seek
            FileAppend, %src%|%value%`r`n, %inca%\fav\new.m3u, UTF-8
            Runwait, %inca%\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
            }
        if (command == "Menu")
            {
            address := path
            send, {LButton up}
            if playlist
              {
              if long_click
                run, %playlist%
              else reload := 3
              }
            else if search_term
              {
              address =
              value := search_term
              command = Search
              }
            else if long_click
              run, %path%
            else command = Path
            }
        if (command == "View")
            {
if (view == value)
 list_view += 1
if (list_view > 2)
  list_view := 0
            view := value
            if (view < 8)
              view := 8
            reload := 2
            }
        if (command == "Delete")
            {
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
            }
        if (command == "Media")
            {
            if (playlist && selected && long_click)
              {
              MoveEntry()								; move entry within playlist
              reload := 3
              }
            else if GetMedia(value)
              {
              playing = 1
              FileRead, str, %inca%\fav\History.m3u
              if (!playlist && (type == "video" || type == "audio") && !InStr(str, src))
                FileAppend, %src%|%address%`r`n, %inca%\fav\History.m3u, UTF-8		; add media entry to playlist
              popup = %browser% Cannot Play %ext%
              if (ext=="pdf")
                Run, %src%
              else if (type=="document" || type=="m3u")
                Run, % "notepad.exe " . src
              else if Setting("External Player")
                {
                sleep 200
                send, {MButton up}							; close java modal (media player) 
                Run %inca%\apps\mpv "%src%"
                }
              else if (!long_click && ((browser == "mozilla firefox" && type == "video" && ext != "mp4" && ext != "m4v" && ext != "webm") || (browser == "google chrome" && type == "video" && ext != "mp4" && ext != "mkv" && ext != "m4v" && ext != "webm")))
                {
                sleep 200
                send, {MButton up}							; close java modal (media player) 
                Run %inca%\apps\mpv "%src%"
                Popup(popup,1500,0.34,0.8)
                }
              }
            }
        if (command == "Page" || command == "View")
            {
            if (command == "Page")
                page := value
            if (command == "View")
                view := value
            Popup(value,0,0,0)
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
                runwait, %inca%\apps\Utf-WithoutBOM.bat %inca%\cache\lists\temp1.txt > %inca%\cache\lists\temp.txt,,Hide
                runwait, %inca%\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\cache\lists\temp.txt" -c copy "%media_path%\%media%- join.mp4",,Hide
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
            reload = 1
            }
        if (command=="Filt"||command=="Path"||command=="Search"||command=="SearchBox"||command=="SearchAll"||InStr(sort_list, command))
            {
            reload = 1
            WinGetPos,,,w,,a
            If (w == A_ScreenWidth)
              send, {F11}
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
              }
            if (command == "Search" || command == "SearchBox" || command == "SearchAll")
              {
              playlist =
              if (command == "SearchAll")
                value := StrReplace(value, " ", "+")
              else value := StrReplace(value, "+", " ")
              if (strlen(value) < 3)
                {
                reload = 0
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
                list_view := 2
                search_path := search_folders
                if (search_term && !InStr(search_path, path))		; search this folder, then search paths
                    search_path = %path%|%search_path%			; search this folder only
                if (search_term && !InStr(sort_list, command))
                  if (command == "SearchBox")
                    {
                    toggles =
                    sort = Duration
                   }
                if (!InStr(sort_list, command))
                  filt := 0
                }
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
             if (x && spool(x, A_Index, y))
                 break
             }
           }
        else Loop, Parse, search_path, `|
           Loop, Files, %A_LoopField%*.*, F%recurse%
             if A_LoopFileAttrib not contains H,S
               if spool(A_LoopFileFullPath, A_Index, 0)
                 break 2
               else if (show && !Mod(list_size,10000))
                 PopUp(list_size,0,0,0)
        popup := list_size -1
        if show
            Popup(popup,0,0,0)
        StringTrimRight, list, list, 2					; remove end `r`n
        if (InStr(toggles, "Reverse") && sort != "Date")
            reverse = R
        if (!InStr(toggles, "Reverse") && sort == "Date")
            reverse = R
        if (sort == "Ext")
            Sort, list, %reverse% Z					; alpha sort
        else if (sort != "Shuffle")
            Sort, list, %reverse% Z N					; numeric sort
        if (sort == "Shuffle")
            Sort, list, Random Z
        FileDelete, %inca%\cache\lists\%folder%.txt
        FileAppend, %list%, %inca%\cache\lists\%folder%.txt, UTF-8
        RenderPage(1)
        }


    GetTabSettings(all)							; from .htm cache file
        {
        list_view = 1
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
            filt := array.5
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


    Spool(input, count, start)						; sorting and search filters
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
            if (sort == "Ext")
                list_id := ex
            if (sort == "Alpha")
              {
              StringGetPos, pos, input, \, R, 1
              StringMid, 1st_char, input, % pos + 2, 1
              if (!InStr(toggles, "Reverse") && filt && sort == "Alpha" && 1st_char < Chr(filt+64))
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
              if (med == "video")
                FileGetSize, list_id, %input%, M
              else FileGetSize, list_id, %input%, K
              sort_name := Round(list_id)
              if (!InStr(toggles, "Reverse") && filt && list_id < filt*10)
                return
              else if (InStr(toggles, "Reverse") && filt && list_id > filt*10)
                return
              }
            else if (sort == "Duration")
              {
              FileRead, list_id, %inca%\cache\durations\%filen%.txt
              if (!InStr(toggles, "Reverse") && filt && list_id/60 < filt)
                return
              else if (InStr(toggles, "Reverse") && filt && list_id/60 > filt)
                return
              sort_name := Time(list_id)
              }
            list_size += 1
            list = %list%%list_id%/%input%/%med%/%sort_name%/%start%`r`n
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
        if (sort != "Alpha")
          {
          sort = Alpha
          CreateList(0)
          PopUp("Cannot be Moved if List Sorted",900,0,0)
          return
          }
        list_id := value
        select := StrSplit(selected, ",").1
        GetMedia(select)
        source = %target%
        GetMedia(list_id)
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
            if (select > list_id && InStr(toggles, "Reverse") || select <= list_id && !InStr(toggles, "Reverse"))
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            if (A_LoopField == target && !flag1)
                {
                flag1 := 1
                FileAppend, %source%`r`n, %plist%, UTF-8
                }
            if (select <= list_id && InStr(toggles, "Reverse") || select > list_id && !InStr(toggles, "Reverse"))
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            }
        }


    FileTransfer()
        {
        if (playlist && !InStr(address, "\inca\"))
          {
          PopUp("Cannot Move Shortcuts",1000,0.34,0.2)
          return
          }
        Loop, Parse, selected, `,
            {
            list_id := A_LoopField
            if !long_click
              popup = Move - %media%
            else popup = Copy - %media%
            if (InStr(address, "\inca\"))
              popup = Moved
            PopUp(popup,0,0,0)
            if GetMedia(list_id)
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
          str := StrReplace(str, x,,,1)					; fav with start time
          str := StrReplace(str, y,,,1)					; music with no start time
          if (trash && folder != "Trash" && folder != "History")
           if InStr(path, "\inca\")
            FileAppend, %x%, %inca%\fav\Trash.m3u, UTF-8
          }
        FileAppend, %str%, %plist%, UTF-8
        }


    RenameFile(new_name)
        {
        FileMove, %src%, %media_path%\%new_name%.%ext%			; FileMove = FileRename
        if (folder == "Downloads") 
            return
        new_entry := StrReplace(target, media, new_name)
        Loop, Files, %inca%\fav\*.m3u, FR
            {
            FileRead, str, %A_LoopFileFullPath%				; find & replace in .m3u files
            if !InStr(str, target)
                continue
            FileDelete, %A_LoopFileFullPath%
            Loop, Parse, str, `n, `r
              if A_LoopField
                {
                input := A_LoopField
                if (input == target)
                    input := new_entry
                FileAppend, %input%`r`n, %A_LoopFileFullPath%, UTF-8
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
        index := index + Setting("Page Size") * (page - 1)
        FileReadLine, str, %inca%\cache\lists\%folder%.txt, index
        src := StrSplit(str, "/").2
        seek := StrSplit(str, "/").5
        if !seek
          seek = 0.0
        target = %src%|%seek%
        if src
            return DetectMedia(src)
        }


    SetVolume(change)
        {
        Static last_volume
        last_volume := volume
        if volume < 1
            change /= 2
        if volume < 10
            change /= 2						; finer adj at low volume
        if change < 100						; stop any big volume jumps
            volume += change/20
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


    ShowSettings()
        {
        Global
        gui, settings:Destroy
        Gui, settings:+lastfound -Caption +ToolWindow
	Gui, settings: Font, s8, Verdana
        Loop, Parse, features, `|
            {
            array := StrSplit(A_LoopField, "/")
            key := array.1
            value := array.2
            if key
                gui, settings:add, edit, x18 h16 w40 vfeature%A_Index%, %value%
            else gui, settings:add, text
            gui, settings:add, text, x68 yp+2, %key%
            }
        gui, settings:add, text, x165 y10, Search Terms
        gui, settings:add, edit, x160 yp+13 h60 w500 vSearch, %search%
        gui, settings:add, text, x165 yp+66, Folders
        gui, settings:add, edit, x160 yp+13 h60 w500 vFol, %fol%
        gui, settings:add, text, x165 yp+66, Fav Playlists
        gui, settings:add, edit, x160 yp+13 h60 w500 vFav, %fav%
        gui, settings:add, text, x165 yp+66, Music Playlists
        gui, settings:add, edit, x160 yp+13 h60 w500 vMusic, %music%
        gui, settings:add, text, x165 yp+66, Folders to Search
        gui, settings:add, edit, x160 yp+13 h18 w500 vsearch_folders, %search_folders%
        gui, settings:add, text, x165 yp+23, Folders to Index
        gui, settings:add, edit, x160 yp+13 h18 w500 vindex_folders, %index_folders%
        gui, settings:add, button, x160 y410 w60, ahk
        gui, settings:add, button, x230 y410 w60, java
        gui, settings:add, button, x300 y410 w60, css
        gui, settings:add, button, x370 y410 w60, Compile
        gui, settings:add, button, x440 y410 w60, About
        gui, settings:add, button, x510 y410 w60, Cancel
        gui, settings:add, button, x580 y410 w60 default, Save
        gui, settings:show
        send, +{Tab}
        }

        settingsButtonCompile:
        run %inca%\apps\Compile.exe
        return

        settingsButtoncss:
        run, notepad %inca%\css.css
        return

        settingsButtonahk:
        run, notepad %inca%\ahk.ahk
        return

        settingsButtonJava:
        run, notepad %inca%\java.js
        return

        settingsButtonAbout:
        WinClose
        if (browser == "google chrome")
          Run, chrome.exe "https://github.com/inca-viewer/inca"
        else Run, msedge.exe "https://github.com/inca-viewer/inca"
        return

        settingsButtonCancel:
        WinClose
        return

        settingsButtonSave:
        gui, settings:submit
        StringReplace, search, search, |, `n, All
        Sort, search, u
        StringReplace, search, search, `n, |, All
        IniWrite,%search%,%inca%\ini.ini,Settings,Search
        IniWrite,%fol%,%inca%\ini.ini,Settings,Fol
        IniWrite,%fav%,%inca%\ini.ini,Settings,Fav
        IniWrite,%music%,%inca%\ini.ini,Settings,Music
        IniWrite,%search_folders%,%inca%\ini.ini,Settings,search_folders
        IniWrite,%index_folders%,%inca%\ini.ini,Settings,index_folders
        new =
        Loop, Parse, features, `|
            {
            array := StrSplit(A_LoopField, "/")
            key := array.1
            value := feature%A_Index%
            new = %new%%key%/%value%|         
            }
        StringTrimRight,new,new,1
        IniWrite,%new%,%inca%\ini.ini,Settings,features
        settingsFinished:
        run %inca%\apps\Compile.exe
        return


    Setting(key)
        {
        Loop, Parse, features, `|
            {
            x := StrSplit(A_LoopField, "/").1
            if InStr(x, key)
                return StrSplit(A_LoopField, "/").2
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
            RunWait %COMSPEC% /c %inca%\apps\ffmpeg.exe -i "%source%" 2>&1 | find "Duration" | Clip, , hide && exit
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
        EnvGet, profile, UserProfile
        IniRead,features,%inca%\ini.ini,Settings,features
        IniRead,search_folders,%inca%\ini.ini,Settings,search_folders
        IniRead,index_folders,%inca%\ini.ini,Settings,index_folders
        IniRead,fol,%inca%\ini.ini,Settings,Fol
        IniRead,search,%inca%\ini.ini,Settings,Search
        IniRead,fav,%inca%\ini.ini,Settings,Fav
        IniRead,music,%inca%\ini.ini,Settings,Music
        }


    Initialize()
        {
        Global
        LoadSettings()
;        clip := clipboard
clipboard =
        FileDelete, %inca%\cache\lists\*.*
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
        if (Clipboard && Clipboard != clip && !InStr(Clipboard, "#"))	; preserve clipboard
          clip := Clipboard
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
        if (x == Setting("WakeUp Time"))
          if (volume < 12)
             {
             volume += 0.02
             SoundSet, volume
             }
        ShowStatus()							; show time & vol
        return


    Indexer:
    Critical Off
    SetTimer, indexer, 60000, -2
    if index_folders
      Loop, Parse, index_folders, `|
        Loop, Files, %A_LoopField%*.*, R
          {
          source = %A_LoopFileFullPath%
          SplitPath, source,,fold,ex,filen
          med := DecodeExt(ex)
          if (med != "video" && med != "audio")
            continue
          ifExist, %fold%\%Filen%.part					; file downloading
            continue
          dur =
          FileRead, dur, %inca%\cache\durations\%filen%.txt
          if !dur
            {
            type = video
            dur := GetDuration(source)
            }
          if (med == "audio")
            continue
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
                    runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%filen%.jpg",, Hide
                if (create & 2 && !Mod(A_Index,5))
                    runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\lists\%y%.jpg",, Hide
                t += (dur / 200)
                }
            if (create & 2)
                Runwait %inca%\apps\ffmpeg -i %inca%\cache\lists\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
            GuiControl, Indexer:, GuiInd
            }
          }
        return

























