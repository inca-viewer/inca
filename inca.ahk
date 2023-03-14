
; MButton is converted to LButton to get address bar. if no address, MButton sent
; RButton is same, so both send LButton signals to java first, then key codes
; back button is intercepted and converted to {Pause} for java to close media


; File f = new File(filePathString);
; if(f.exists() && !f.isDirectory()) {do something}
; ffmpeg time loop creator?
; right click select and while playing in modal
; screenshot func
; wmv files
; text files fail to load to notepad because no longer inca internal ref "#%cap%#%i%"
; onmouseout="this.pause()" 
; removed long click in inca gestures
; remove mouseup, down in inca



	; Inca Media Viewer for Windows - Firefox & Chrome compatible

	#NoEnv
	#UseHook, On
	SetWinDelay, 0
	SetKeyDelay, 0
	SetBatchLines -1
	SetTitleMatchMode, 2
	GroupAdd, Browsers, Google Chrome
	GroupAdd, Browsers, Mozilla Firefox
	#SingleInstance force		; one program instance only
	#MaxHotkeysPerInterval 999	; allow fast spinning wheel
	SetWorkingDir, %A_ScriptDir%	; consistent start directory

        Global sort_list		:= "Shuffle|Date|Duration|Alpha|Size|ext|Reverse|Recurse|Videos|Images|"
        Global toggles			; eg. reverse
        Global features			; program settings
        Global folder_list		; main root folders
        Global fav_folders		; favorite subfolders
        Global search_list		; models, studios, genre, key words etc.
        Global search_folders		; default search locations
        Global this_search		; current search folders
        Global inca			; default folder path
        Global list			; sorted media file list
	Global list_id			; pointer to media file
        Global list_size
        Global selected			; selected files from web page
        Global search_box		; html textbox
        Global search_term
        Global src			; current media file incl. path
        Global media			; media filename, no path or ext
        Global media_path
        Global type			; eg. video
	Global subfolders
        Global folder			; no path
        Global path
        Global ext			; file extension
        Global tab_name			; browser tab title
	Global previous_tab
        Global history_timer		; timer to add files to history 
        Global vol_popup		; volume bar popup 
        Global volume
        Global page := 1		; current page within list
        Global sort			; eg. Alpha
	Global filter			; secondary search filter eg. date, duration, Alpha letter
        Global inca_tab			; inca tab exists
        Global click			; mouse click type
        Global timer			; click or back timer
        Global view := 14		; thumb view
        Global last_view := 14
        Global vol_ref := 2
        Global wheel
        Global inside_browser		; clicked inside browser window
        Global last_media		; last media played in page
	Global last_status		; time, vol etc display
        Global playlist			; slide playlist - full path
	Global block_input		; pause key interrupts
	Global xpos			; current mouse position - 100mS updated 
	Global ypos
        Global command
        Global value
        Global address
        Global skinny
        Global seek
        Global target
        Global update





    MoveEntry()						; within playlist 
        {
if (sort != "Alpha")
  return

        list_id := StrSplit(selected, "/").1
        GetMedia(0)
        select := list_id
        source = %target%
        list_id := value
        GetMedia(0)
        plist = %path%%folder%.m3u
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, str, `n, `r
          if A_LoopField
            {
            if (A_LoopField == source && !flag2 && ((timer > 400) || source != target)) ; 
                {
                flag2 := 1
                continue
                }
            if (select > list_id)
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            if (A_LoopField == target && !flag)
                {
                flag := 1
                FileAppend, %source%`r`n, %plist%, UTF-8
                }
            if (select <= list_id)
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            }
        selected =
        }


    MoveEntry2222()						; within playlist 
        {
        list_id := StrSplit(selected, "/").1
        GetMedia(0)
        select := list_id
        source = %target%
        list_id := value
        GetMedia(0)
        plist = %path%%folder%.m3u
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, str, `n, `r
          if A_LoopField
            {
            if (A_LoopField == source) ; && timer > 400 && !flag)  || (source == target && A_LoopField == source))
                {
                flag := 1
                continue
                }
            if (select < list_id)
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            if (A_LoopField == target && !flag)
                {
                flag := 1
                FileAppend, %source%`r`n, %plist%, UTF-8
                }
            if (select >=  list_id)
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            }
        selected =
        }


    FileTransfer()
        {
        if InStr(address, "playlists")
          PopUp("Link",400,0,0)
        else if (timer < 500) 
          PopUp("Move",400,0,0)
        else PopUp("Copy",400,0,0)
        Loop, Parse, selected, `/
            {
            list_id := A_LoopField
            if GetMedia(0)
              if InStr(address, "playlists")
                {
                FileAppend, %target%`r`n, %address%, UTF-8		; add media entry to playlist
                DeleteEntry()
                }
              else if (timer < 500)
                FileMove, %src%, %address%				; move file to new folder
              else FileCopy, %src%, %address%
            }
        selected =
        }  


    DeleteEntry()
        {
        plist = %path%%folder%.m3u
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, str, `n, `r
          if A_LoopField
            if (A_LoopField != target || flag)
                FileAppend, %A_LoopField%`r`n, %plist%, UTF-8
            else flag = true
        }






    UpdateFiles(new_name)
        {
        FileMove, %src%, %media_path%\%new_name%.%ext%			; FileMove = FileRename
        new_entry := StrReplace(target, media, new_name)
        Loop, Files, %inca%\playlists\*.m3u, FR
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





    SpoolList(i, j, input, sort_name, start)					; spool sorted media files into web page
        {

gap := view / 2
if ((cap_size := view / 12) > 1.6)
  cap_size := 1.6


        if DetectMedia(input)
            thumb := src
        else thumb = %inca%\apps\icons\no link.png
        FileRead, dur, %inca%\cache\durations\%media%.txt
        if (type == "video")
            {
            thumb =  %inca%\cache\posters\%media%.jpg
            if start
              IfExist, %inca%\cache\posters\%media% %start%.jpg
                thumb = %inca%\cache\posters\%media% %start%.jpg
            if !start 
              if (dur > 60)
                start := 20 + (4 * (dur - 20)/200)
              else start := 4 * dur / 200
            }
        FileRead, skinny, %inca%\cache\widths\%media%.txt
        if (skinny)
            transform = transform:scaleX(%skinny%);
        else skinny := 1


        cap_start := 0
        FileReadLine, cap, %inca%\cache\captions\%media%.srt, 1
            if (StrSplit(cap, "|").2 == 0)
                caption := StrSplit(cap, "|").1
        if !caption
          Loop, 10
            {
            FileReadLine, cap, %inca%\cache\captions\%media%.srt, %A_Index%
              if (start == StrSplit(cap, "|").2)
                {
                cap_start := start
                caption := StrSplit(cap, "|").1
                }
            }
        caption = <div style="margin:auto; width:80`%; height:%gap%em; color:#826858; font-size:%cap_size%em">%caption%</div>



;      x = cap_src.indexOf('|'+ t + '|')
;      if (t && x > 0) {cap.innerHTML = cap_src.slice(0,x).split('|').pop()}


FileRead, cap, %inca%\cache\captions\%media%.srt
cap := StrReplace(cap, "`r`n", "|")

needle = |%start%|
pos := InStr(cap, needle)
if pos {
x := substr(cap,1,pos)
a := StrSplit(x,"|")
pos := a.MaxIndex()
x:=a[pos-1]
caption := x
}




        if (dur && type == "video")
            dur := Time(dur)
        else dur =
        if (type == "video")
            FileGetSize, size, %src%, M
        else FileGetSize, size, %src%, K
        size := Round(size)
        select = border-radius:6`%; 
        if (type == "audio" || type == "m3u")
            thumb = %inca%\apps\icons\music.png
        if (type == "document")
            thumb = %inca%\apps\icons\ebook.png
        StringReplace, thumb, thumb, #, `%23, All
        StringReplace, src, src, #, `%23, All				; html cannot have # in filename
        stringlower, thumb, thumb
 poster = poster="file:///%thumb%"
if (type == "video")
  IfNotExist, %inca%\cache\thumbs\%media%.jpg
     poster = 
     start := Round(start,2)
        if !view							; list view 
            {
            entry = <div style="padding-left:5em;"><a href="#Media#%j%" id="thumb%j%" onclick="select(%j%)"><table><tr><td id="hover_image"><video id="media%j%" style="width:100`%; %select%" onmouseenter="overThumb(event, %j%, %start%)" onmouseleave="med.load(); over_thumb=false" onclick="play_media('Click', '%type%', %start%, %skinny%, '%cap%', %j%, event)" %poster% src="file:///%src%" type="video/mp4" muted></video></tr></table><table style="table-layout:fixed; width:100`%"><tr><td style="color:#777777; width:4em; text-align:center">%sort_name%</td><td style="width:4em; font-size:0.7em; text-align:center">%dur%</td><td style="width:3em; font-size:0.7em; text-align:center">%size%</td><td style="width:4em; padding-right:3.2em; font-size:0.7em; text-align:center">%ext%</td><td style="%select% white-space:nowrap; text-overflow:ellipsis; font-size:1em"><input id="title%j%" type="search" class="searchbox" value="%media%" style="text-overflow:ellipsis; overflow:hidden; background-color:inherit; color:inherit; font-family:inherit; border:none; outline:none; white-space:nowrap; width:38em"></td></tr></table></a></div>`r`n`r`n
            }
        else
            {
            if (ext == "txt")
                {
                Loop 40
                    {
                    rows := A_Index
                    FileReadLine, str1, %src%, %A_Index%
                    if !ErrorLevel
                        str2 = %str2%%str1%`r`n
                    else break
                    }
	        entry = <a href="#Media#%j%"><div style="display:inline-block; width:88`%; color:#555351; transition:color 1.4s; margin-left:8`%; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_name% &nbsp;&nbsp;%link% %media%</div></a><textarea rows=%rows% style="display:inline-block; overflow:hidden; margin-left:8`%; width:88`%; background-color:inherit; color:#826858; font-size:1.2em; font-family:inherit; border:none; outline:none;">%str2%</textarea>`r`n`r`n
                }
            else entry = <li id="thumb%j%" class="thumbs" onclick="select(%j%)" style="width:%view%em"><div id="title%j%" style="color:#555351; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:0.85em; margin:auto; width:80`%">%sort_name% &nbsp;&nbsp; %link% %media%</div><a href="#Media#%j%" id="sel%j%"><video id="media%j%" style="%transform% margin-left:auto; margin-right:auto; width:80`%; display:block; padding:2px; %select%" onmouseenter="overThumb(event, %j%, %start%)" onmouseleave="med.load(); over_thumb=false" onclick="play_media('Click', '%type%', %start%, %skinny%, '%cap%', %j%, event)" src="file:///%src%" %poster% muted type="video/mp4"></video></a>%caption%</li>`r`n`r`n
            }
        return entry
        }

 

    RenderPage()							; construct web page from media list
        {
        if !(folder && path)
            return
        if playlist
            origin = href="file:///%playlist%"
        else origin = href="file:///%path%"
        last := src
        title := tab_name
        FileRead, style, %inca%\apps\style.css
        FileRead, java, %inca%\java.js
        Loop, Files, %inca%\music\*.m3u					; for top panel
            music = %music%|%A_LoopFileFullPath%
        Loop, Files, %inca%\playlists\*.m3u
            playlists = %playlists%|%A_LoopFileFullPath%
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        list_size := 0
        previous := 1
        if (page > 1)
            previous := page - 1
        next := page + 1
        type = video							; prime for list parsing
        offset := Setting("Left Offset")
        size := Setting("Thumbs Qty")
        if (!view || playlist)
            size := Setting("List Size")
        page_media = /							; cannot use | as seperator because this_search uses |

        count = 1
        Loop, Parse, list, `n, `r 					; split list into smaller web pages
            {
            item := StrSplit(A_LoopField, "/")				;  sort filter \ src \ media type \ ext
            source := item.2
            type := item.3
            sort_name := item.4
            start := item.5
            list_size += 1
            if ((list_size > (page-1) * size) && (list_size <= page * size))
                if (x := SpoolList(A_Index, count, source, sort_name, start))
                    {
                    count += 1
                    html = %html%%x%					; spool html media entries
                    page_media = %page_media%%A_Index%/			; create array of media pointers with > seperator
                    }
            }


; href="https://fonts.googleapis.com/css2?family=Crimson+Pro">
; D:/inca/apps/ClearSans-Thin.woff
; <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Open+Sans:300">`r`n
;  onclick'function(){selected="#/"}'



        pages := ceil(list_size/size)
        header_html = <!--`r`n%view%>%page%>%sort%>%toggles%>%this_search%>%search_term%>%path%>%folder%>%playlist%>%last_media%>%last_view%`r`n%page_media%`r`n-->`r`n<!doctype html>`r`n<html>`r`n<head>`r`n<meta charset="UTF-8">`r`n<title>Inca - %title%</title>`r`n<meta name="viewport" content="width=device-width, initial-scale=1">`r`n<link rel="icon" type="image/x-icon" href="file:///%inca%\apps\icons\inca.ico">`r`n<style>@font-face {font-family: ClearSans-Thin; src: url("D:/inca/apps/ClearSans-Thin.woff");}</style>`r`n</head>`r`n
            panel2_html = <body id="myBody">`r`n`r`n<div style="margin-left:%offset%`%; width:80`%">`r`n<span id="mySidenav" onmouseover="openNav()" onmouseleave="closeNav()" class="sidenav"><a href="#" onclick="selectAll()">Select All</a><a href="#" id="myFav">Favorite</a><a href="#" id="myDelete">Delete</a><a href="#" id="myRename">Rename</a><a href="#Settings#">Menu</a><a href="#Join#">Join</a><a href="#Thumbs#%view%" id="myView" onwheel="adjust_thumbs(event)">Thumbs</a></span>`r`n<ul class="menu" id='myPanel2' style="max-height:34em; background-color:inherit; column-count:8; border-radius:9px; padding-left:1em; font-size:0.9em; overflow:hidden; white-space:nowrap;"></ul>`r`n`r`n
        panel_html = %panel2_html%<ul class="menu" id='myPanel' style="column-width: 80px; text-align:left; margin-bottom:20px; height:70px; width:64`%; column-count:8; border-radius:9px; font-size:0.95em"></ul>`r`n`r`n<ul class="menu" style="display:flex; justify-content:space-between; margin-left:20px"><a class='slider' id='sub' onmouseover='spool(event, id, "%subfolders%")' style="width:7`%;">Sub</a>`r`n<a href="file:///%inca%/cache/html/downloads.htm" class='slider' id='folders' onmouseover='spool(event, id, "%folder_list%")' style="width:7`%;">Fol</a>`r`n<a  href="file:///%inca%/cache/html/downloads.htm" class='slider' id='fav' onmouseover='spool(event, id, "%fav_folders%")' style="width:7`%;">Fav</a>`r`n<a href="file:///%inca%/cache/html/new.htm" class='slider' id='playlists' onmouseover='spool(event, id, "%playlists%")' style="width:7`%;">Playlists</a>`r`n<a href="file:///%inca%/cache/html/new.htm" class='slider' id='music' onmouseover='spool(event, id, "%music%")' style="width:7`%;">Music</a>`r`n<a id='search' class='slider' onmousemove='spool(event, id, "%search_list%")' onmousedown='spool(event,"search_all","%search_list%")'>Search</a></ul>`r`n`r`n
        filter_html =`r`n`r`n<ul class="menu" style="display:flex; justify-content:space-between;; margin-left:20px">`r`n`r`n
        Loop, Parse, sort_list, `|
            if A_LoopField
                {
                query = %sort%%toggles%
                x = id='%A_LoopField%#0' class='slider' style='width:8`%; background-color:inherit;'
                name := A_LoopField
                if InStr(query, name)
                    name = <span style="color:lightsalmon;">%name%</span>
                filter_html = %filter_html%<a href="#%A_LoopField%#" %x%>%name%</a>`r`n
                }
        sort_html = <ul class="menu" style="margin-top:1em; margin-bottom:1em; display:flex; justify-content:space-between; margin-left:20px">`r`n<input id="myInput" type="search" class="searchbox" value="%search_term%" style="width:32`%; border-radius:8px; height:16px; border:none; color:#666666; background-color:#1b1814;"><a href="#Searchbox" style="color:lightsalmon;"><c>+</c></a>`r`n<a href="%title%.htm#%sort%" id='slider1' class='slider' onmousemove='getCoords(event, id, "%sort%", "%title%", "")'>%sort%</a>`r`n<a href="%title%.htm#Page" id='slider2' class='slider' onmousemove='getCoords(event, id, "%Pages%", "%title%", "")' onmouseleave='getCoords(event, id, "%Pages%", "%title%", "%page%")'>Page %page% of %pages%</a>`r`n<a href="#Page#%next%" class='slider' style="width:6`%;">Next</a></ul>
        title_html = `r`n`r`n<div style="margin-left:5em; width:100`%; margin-top:2.4em; margin-bottom:1.8em;"><a %origin% id="origin" style="font-size:1.8em; color:#555351;">%title% &nbsp;&nbsp;<span style="font-size:0.7em;">%list_size%</span></a></div>`r`n`r`n<div id="myModal" class="container" onmousemove='Gesture(event)' onwheel="media_control(event, 'Magnify')">`r`n<div><video id="myPlayer" class="player" type="video/mp4"></video><textarea id="myCap" class="caption" onmouseenter="over_cap=true" onmouseleave="over_cap=false"></textarea><span id="mySeekbar" class="seekbar"></span><span id="mySidenav2" onmouseover="openNav2()" onmouseleave="closeNav2()" class="sidenav"><a href="#" onclick="toggleMute()">Mute</a><a href="#" id="myFav2">Fav</a><a href="#" id="myCapnav" onclick="editCap()">Caption</a><a href="#" onclick="cue = Math.round(media.currentTime*100)/100">Cue</a><a href="#" onclick="select()">Select</a><a href="#" onclick="loop()">Loop</a><a href="#" id="myMp4">mp4</a><a href="#" id="myMp3">mp3</a></span><span id="myControls" class="controls" onmouseover="openControls()" onmouseleave="closeControls()"><a href='#' id="myThin" onwheel="media_control(event, 'Skinny')"></a><a href='#' id="myNext" onwheel="media_control(event, 'Next')">%j%</a><a id="mySpeed" onwheel="media_control(event, 'Speed')"></a><a id="mySeek" onwheel="media_control(event, 'Seek')"></a></div></div>`r`n`r`n
        html = `r`n%html%</div>`r`n<p style="height:240px;"></p><span id="thumb1" style="width:%view%em"></span>`r`n
        FileDelete, %inca%\cache\html\%tab_name%.htm
        StringReplace, header_html, header_html, \, /, All
        StringReplace, panel_html, panel_html, \, /, All
        y = %sort_html%%filter_html%</ul>%title_html%%html%
        StringReplace, y, y, \, /, All
        FileAppend, %header_html%%style%%panel_html%%y%%java%</body>`r`n</html>`r`n, %inca%\cache\html\%tab_name%.htm, UTF-8
        LoadHtml()
        PopUp("",0,0,0)
        DetectMedia(last)						; restore media parameters
        }








    main:
      initialize()			; set environment
      SetTimer, TimedEvents, 100, -1	; timer event every 100mS
      return				; wait for mouse/key events

    Esc up::
      ExitApp


    ~LButton::				; click events
    RButton::
    MButton::
      Critical
      block_input := A_TickCount + 300
      if (!Gestures() && click)
          ClickEvent()
      Gui PopUp:Cancel
      timer =
      click =
      return


    Xbutton1::				; mouse "back" button
      Critical
      block_input := A_TickCount + 300
      timer = set
      click = Back
      SetTimer, Xbutton_Timer, -300
      return
    Xbutton1 up::
      timer =
    Xbutton_Timer:
      ClickEvent()
      click =
      return


    ~WheelUp::
    ~WheelDown::
      if (A_TickCount > block_input)
          wheel := 1
      return


    ~Enter::				; file search - from html input box
      if inside_browser
        {
        send, !0
        Clipboard =
        send, {end}+{Home}^c
        ClipWait, 0
        if (search_box := Clipboard)
            ClickWebPage(1)
        }
      return


    #/::				; 1st mouse option button win/
      timer = set
      SetTimer, button2_Timer, -240
      return
    #/ up::
      timer =
      return
    button2_Timer:
      IfWinActive, ahk_group Browsers
          if !timer
              send, {Space}		; pause toggle YouTube
          else loop 10
              {
              if !timer
                  break
              WinActivate, ahk_group Browsers
              send, {Left}{Left}	; rewind YouTube 10 secs
              sleep 624
              }
      return


    #\::				; 2nd mouse option button win\
      timer3 = set
      SetTimer, button1_Timer, -240
      return
    #\ up::
      timer3 =
      return
    button1_Timer:
      if !timer3					; toggle browser / desktop
        {
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1)
            WinMinimize, ahk_group Browsers
        else WinRestore, ahk_group Browsers
        IfWinNotExist, ahk_group Browsers
            run, %inca%\cache\html\pictures.htm
        last_status =
        }
      else
        {
        title =
        if !WinGetTitle, title, YouTube
          send, {f11}					; fullscreen
        send, f
        }
      return


    Gestures()
      {
      MouseGetPos, xpos, ypos
      StringReplace, click, A_ThisHotkey, ~,, All
      IfWinNotActive, ahk_group Browsers
          inside_browser =
      start := A_TickCount
      loop						; gesture detection
        {
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        xy := Abs(x + y)
        timer := A_TickCount - start
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P"))
            break
        if (xy > 6)
            {
            MouseGetPos, xpos, ypos
            gesture = 1
            Gui, ProgressBar:Cancel
            if (xpos < 15)				; work at screen edges
                xpos := 15
            if (xpos > A_ScreenWidth - 15)
                xpos := A_ScreenWidth - 15
            MouseMove, % xpos, % ypos, 0
            if (GetKeyState("RButton", "P") && Setting("Volume Gesture"))
                SetVolume(1.4 * x)
            if (GetKeyState("LButton", "P"))
                AdjustMedia(x, y)
            }
        if (!gesture && timer > 500)
            {
            gesture = 1					; once only
            ClickEvent()
            }
        }
      return gesture
      }


    ClickEvent()
        {
        Critical
        if (click == "LButton")
          {
          if (timer > 350 && A_Cursor == "IBeam")	; mouse long click over text
              SearchText()						; list search results
          else if (inside_browser && A_Cursor != "IBeam" && ClickWebPage(0))
              {
              if (command == "Media" && timer <= 350 && GetMedia(0) == "document")
                  {
                  RenderPage()						; highlight last media
                  run, %src%
                  sleep 600
                  if (ext == "pdf")
                  WinActivate, ahk_group Browsers
                  }
              }
            }
        else if (click == "RButton")
            send, {RButton}
        else if (click == "MButton")
            if inside_browser
                send, m
            else send, {MButton}
        else if (click == "Back")
            {
            if timer							; long back key press
                {
                IfWinActive, ahk_group Browsers
                    send, ^0^w 						; close tab
                else send, !{F4}					; or close app
                return
                }
            else IfWinExist, ahk_class OSKMainClass
                send, !0						; close onscreen keyboard
            else if WinActive("ahk_class Notepad")
                {
                Send,  {Esc}^s^w
                if inca_tab 
                    RenderPage()
                }
            else if inside_browser
                {

  send, {Pause}								; close java modal (media)
  ClickWebPage(0)							; read location bar message
  if update
      CreateList(0)
  update =


;                IfWinActive, ahk_class Chrome_WidgetWin_1
;                 if selected
;                  {
;                  selected =
;                  RenderPage()
;                  }
                }
            else send, {Xbutton1}
            }
        }





    TimedEvents:							; every 100mS
        Critical
        MouseGetPos, xpos, ypos
        WinGetPos, xb, yb, wb, hb, ahk_group Browsers
        if (WinActive("ahk_group Browsers") && title && inca_tab && xpos > xb+10 && ypos > yb+224 && ypos < yb+hb-50)
            inside_browser = 1
        else inside_browser =
        if history_timer
            history_timer += 1
        if vol_popup							; show volume popup bar
            vol_popup -= 1
        if (volume > 0.1 && !vol_popup && Setting("Sleep Timer(mins)") > 10 && A_TimeIdlePhysical > 600000)
            {
            volume -= vol_ref / (Setting("Sleep Timer(mins)") * 6)		; sleep timer
            SoundSet, volume						; slowly reduce volume
            vol_popup := 100						; check every 10 seconds
            }
        else
            {
            dim := inca_tab
            inca_tab := 0
            WinGetTitle title     ;  , Inca -
            if InStr(title, "Inca - ")
              tab_name := SubStr(title, 8)
            StringGetPos, pos, tab_name, mozilla firefox, R
            if (pos < 1)
                StringGetPos, pos, tab_name, google chrome, R
            StringLeft, tab_name, tab_name, % pos - 3
            WinGet, state, MinMax, ahk_group Browsers
            if (tab_name && state > -1)
                inca_tab := 1
            if (inca_tab != dim)
                {
                mask1 := 0
                if (mask2 := Setting("Dim Desktop"))
                  loop 20
                    {
                    sleep 5
                    mask1 += (Setting("Dim Desktop") * 2.55) / 20
                    mask2 -= 10
                    Gui, background:+LastFound
                    if inca_tab
                        WinSet, Transparent, %mask1%
                    else WinSet, Transparent, %mask2%
                    }
                }
            if (inca_tab && tab_name != previous_tab)			; is switched inca tab
                {
                previous_tab := tab_name
                GetTabSettings(1)					; get last tab ;settings
;CreateList(0)
;return
                if (tab_name != "Playlists" && tab_name != "Music")
                  {
                  if (tab_name != "Downloads")
                    {
                    IfExist, %inca%\cache\lists\%tab_name%.txt		; from cache
                      FileRead, list, %inca%\cache\lists\%tab_name%.txt
                    }
                  else CreateList(0)					; media list to match html page
                  }
                }
            }
        ShowStatus()							; show time & vol
        return





    ClickWebPage(search)
        {
        select =
        command =
        value =
        address = 
        type =
        WinActivate, ahk_group Browsers
        if !search
          {
          if !inside_browser
            return
          send, {Alt up}{Ctrl up}{Shift up}
          if (click == "LButton")
              send, {LButton up}
          input := GetLocationBar(1)
          sleep 20							; to release location bar
          input := StrReplace(input, "/", "\")
; tooltip %input%
          if !InStr(input, "file:\\\")
            return
          array := StrSplit(input,"#")
          href := array[1]
          command := array[2]
          value := array[3]
          select := array[4]
          address := array[5]
          select := StrReplace(select, ",", "/")
          if (StrLen(select) > 1)
              {
              selected = %select%
              list_id := StrSplit(selected, "/").1
              GetMedia(0)
              }
          if !command
              return
          if (command == "Mp3")
            {
            if !address
              run, %inca%\apps\ffmpeg.exe -i "%src%" "%media_path%\%media% 0.0.mp3",,Hide
            else run, %inca%\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%media_path%\%media% %address%.mp3",,Hide
            sleep 1000
            }
          if (command == "Mp4")
            {
            if !address
              run, %inca%\apps\ffmpeg.exe -i "%src%" "%media_path%\%media% 0.0.mp4",,Hide
            else run, %inca%\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%media_path%\%media% %address%.mp4",,Hide
            sleep 1000
            }
          if (command == "Move")
              if (selected && InStr(path, "playlists"))
                  MoveEntry()						; move entry within playlist
              else return
          if (command == "Caption")
            {
            list_id := StrSplit(selected, "/").1
            if GetMedia(0)
            FileRead, str, %inca%\cache\captions\%media%.srt
            FileDelete, %inca%\cache\captions\%media%.srt
            if InStr(str, address)
              str := StrReplace(str, address, value)
            else str = %str%%value%
            FileAppend, %str%, %inca%\cache\captions\%media%.srt, UTF-8
            selected =
update := 1
return
            }
          if (command == "Favorite")
              {
              list_id := StrSplit(selected, "/").1
              GetMedia(0)
              if !value
                  value := seek
              if (InStr(path, "playlists") && !search_term)
                  FileAppend, %src%|%value%`r`n, %path%%folder%.m3u, UTF-8
              else FileAppend, %src%|%value%`r`n, %inca%\playlists\new.m3u, UTF-8
              Runwait, %inca%\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=480:-2 -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
              selected =
update := 1
return
              }
          if (command == "Skinny")
              {
              list_id := StrSplit(selected, "/").1
              if GetMedia(0)
                {
                FileDelete, %inca%\cache\widths\%media%.txt
                if value
                  FileAppend, %value%, %inca%\cache\widths\%media%.txt
                }
              selected =
update := 1
return
              }
          if (command == "Thumbs")
              {
              page := 1
              if (view == value)
                {
                if !view
                   view := last_view
                else view := 0
                }
              else 
                view := value
              last_view := value
              }
          if (command == "Delete")
              {
              Loop, Parse, selected, `/
                  {
                  list_id := A_LoopField
                  if GetMedia(0)
                    if InStr(path, "playlists")
                      DeleteEntry()
                    else IfExist, %src%
                           FileRecycle, %src%
                  }
              selected =
              }

          if (command == "Rename")
            {
            if (StrLen(value) < 4)
                popup = too small
            list_id := StrSplit(selected, "/").1
            if !GetMedia(0)
                popup = no media
            if !popup
               {
               UpdateFiles(value)
               popup = Renamed
               }
            selected =
            }
          if (command == "Path" && selected)
              FileTransfer()						; between folders or playlists
          if (command == "Path")
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
              }
          list_id := value
          }
        if (command == "Media")
            return value
        else if (command == "Searchbox")					; add search to search list
            {
            search_list = %search_list%|%search_term%
            IniWrite,%search_list%,%inca%\settings.ini,Settings,search_list
            LoadSettings()
            PopUp("Added",600,0,0)
            }
        else if (value && InStr(sort_list, command))		; alpha letter
            {
            page := 1
            filter := value
            }
        else if (command == "Page" || command == "View")
            {
            if (command == "Page")
                page := value
            if (command == "View")
                view := value
            Popup(value,0,0,0)
            RenderPage()
            return 1
            }
        else if (command == "Settings")
            { 
            ShowSettings()
            return 1
            }
        else if (command == "Path" || command == "Search" || search_box || InStr(sort_list, command))
            {
            show = 1
            filter =
            page := 1
            if (command == "Search")
              search_term = %value%					; clears white space
            else if search_box
              search_term = %search_box%
            if address
                {
                search_term =
                tab_name := folder
                this_search := path
                x := playlist
                GetTabSettings(0)						; from html cache
                playlist := x
                if !InStr(subfolders, folder)
                    subfolders =
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
                }
            if search_term						; search text from link or search box
                {
                tab_name := search_term
                folder := search_term
                GetTabSettings(0)					; load cached tab settings
                this_search := search_folders
                if (search_box && !InStr(this_search, path))		; search this folder, then search paths
                    this_search = %path%|%this_search%			; search this folder only
                if search_box
                    {
                    view := 0
                    toggles =
                    sort = Duration
                   }
                }
            if (InStr(sort_list, command))		; sort filter
                {
                page := 1
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
        CreateList(show)
        search_box =
        return 1
        }



    CreateList(show)							; list of files in path
        {
        if !(folder || this_search)
            return
        IfNotExist, %path%
            path = %search_term%\
        list =
        list_size := 0
        popup := tab_name
        if search_term
            popup := search_term
        if show
            Popup(popup,0,0,0)
        if (InStr(toggles, "Recurse") || search_term)
            recurse = R
        FileRead, str, %playlist%
        if playlist
           {
           Loop, Parse, str, `n, `r
             {
             x := StrSplit(A_Loopfield, "|").1
             y := StrSplit(A_Loopfield, "|").2
             if (x && spool(x, A_Index, y))
                 break
             }
           }
        else Loop, Parse, this_search, `|
           Loop, Files, %A_LoopField%*.*, F%recurse%
             if A_LoopFileAttrib not contains H,S
               if spool(A_LoopFileFullPath, A_Index, 0)
                 break 2
        StringTrimRight, list, list, 2					; remove end `r`n
        if (InStr(toggles, "Reverse") && sort != "Date")
            reverse = R
        if (!InStr(toggles, "Reverse") && sort == "Date")
            reverse = R
        if (sort == "ext")
            Sort, list, %reverse% Z					; alpha sort
        else if (sort != "Shuffle")
            Sort, list, %reverse% Z N					; numeric sort
        if (sort == "Shuffle")
            Sort, list, Random Z
        FileDelete, %inca%\cache\lists\%tab_name%.txt
        FileAppend, %list%, %inca%\cache\lists\%tab_name%.txt, UTF-8
        RenderPage()
;        popup = %popup% %list_size%
;        if show
;          Popup(popup,400,0,0)
        }


    Spool(input, count, start)
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
            if (ex == "m3u")
                return
            if (count > 250000)
                return 1
            list_id := list_size
            sort_name := list_size
            if (!Mod(count,10000) && !search_term)
                PopUp(count,0,0,0)
            if search_term
              {
              StringSplit, array, search_term, %A_Space%
                Loop, %array0%
                {
                if !InStr(filen, array%A_Index%)
                  return
                if (StrLen(array%A_Index%) < 2)
                  if !InStr(filen, search_term)
                    return
                }
              }
            if (sort == "ext")
                list_id := ex
            if (sort == "Alpha")
              {
              StringGetPos, pos, input, \, R, 1
              StringMid, 1st_char, input, % pos + 2, 1
              if (filter && sort == "Alpha" && 1st_char < Chr(filter))
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
              if (filter && sort_date/30 < filter)
                return
              }
            else if (sort == "Size")
              {
              FileGetSize, list_id, %input%, K
              sort_name := Round(list_id/1000,1)
              if (filter && list_id < filter)
                return
              }
            else if (sort == "Duration")
              {
              FileRead, list_id, %inca%\cache\durations\%filen%.txt
              if (filter && list_id/60 < filter)
                return
              sort_name := Time(list_id)
              }
            list_size += 1
            list = %list%%list_id%/%input%/%med%/%sort_name%/%start%`r`n
            }
        }


    LoadHtml()								; create / update browser tab
        {
        Critical
        WinActivate, ahk_group Browsers
        new_html = file:///%inca%\cache\html\%tab_name%.htm
        StringReplace, new_html, new_html, \,/, All
        if (!inca_tab || click == "MButton")
            run, %new_html%						; open a new web tab
        else if (tab_name == previous_tab)				; just refresh existing tab
            send, {F5}
        else	
            {								; re-load tab
            previous_tab := tab_name
            GetLocationBar(0)
            sleep 34
            sendraw, %new_html%%A_Space%`n
            }
        Loop, 100							; allow to load before TimedEvents
            {
            sleep 20
            WinGetTitle title, Inca -
            if InStr(title, tab_name)
                break
            }
        previous_tab := tab_name
        sleep 333							; time for browser to render behind mpv
        WinActivate, ahk_group Browsers
        }


    GetLocationBar(escape)
        {
        Critical
        clip := clipboard
        Loop 2
            {
            clipboard =
            sleep 24
            send, ^l
            sleep 24
            send, ^c
            Clipwait, 0
            if ClipBoard
               break
            }
        input := clipboard
        clipboard := clip
        if escape
            {
            if InStr(input, "#")
                send, !{Left}						; reset location bar to last address
            send, +{F6}							; focus back to page
            }
        Pos := 1
        While Pos := RegExMatch(input, "i)(%[\da-f]{2})+", Code, Pos)	; convert url to utf-8
	    {
            VarSetCapacity(Var, StrLen(Code) // 3, 0), Code := SubStr(Code,2)
            Loop, Parse, Code, `%
                NumPut("0x" A_LoopField, Var, A_Index-1, "UChar")
            decoded := StrGet(&Var, "UTF-8")
            input := SubStr(input, 1, Pos-1) . decoded . SubStr(input, Pos+StrLen(Code)+1)
            Pos += StrLen(decoded)+1
            }
        return input
        }


    GetTabSettings(extended)						; from .htm cache file
        {
        page := 1							; default view settings
        toggles =
        playlist =
        last_media =
        sort = Alpha
        FileReadLine, array, %inca%\cache\html\%tab_name%.htm, 2	; embedded page data
        if array
            {
            StringReplace, array, array, /, \, All
            array := StrSplit(array,">")
            view := array.1
            last_view := array.11
            page := array.2
            sort := array.3
            toggles := array.4
            last_media := array.10
            if extended
              {
              this_search := array.5
              search_term := array.6
              path := array.7
              folder := array.8
              playlist := array.9
              if search_term
                folder := search_term
              }
            return 1
            }
        }



    Time(in)
        {
        year = 2017
        x := in
        year += x, seconds
        FormatTime, in, %year%, H:mm:ss						; show duration in hours:mins format
        if (x < 3600)
            FormatTime, in, %year%, mm:ss
        if (x < 600)
            FormatTime, in, %year%, m:ss
        return in
        }




    SearchText()							; file search - from selected text
        {
        if WinActive("ahk_group Browsers")
            {
            clip := Clipboard
            Clipboard =
            send, {RButton}
            sleep 100
            send, c
            ClipWait, 0
            send, {Lbutton up}
            if ClipBoard
                {
                path =
                search_box := ClipBoard
                ClickWebPage(1)
                WinActivate, ahk_group Browsers
                }
            else send, !+0
            Clipboard := clip
            }
        else send, !+0							; trigger osk keyboard
        }












    DecodeExt(ex)
        {
;        if !ex
;            return
        StringLower ex, ex
        if InStr("jpg png jpeg webp gif", ex)
            return "image"
        if InStr("mp4 wmv avi mov webm mpg mpeg flv divx mkv asf m4v mvb rmvb vob rm ts", ex)
            return "video"
        if InStr("mp3 m4a wma mid", ex)
            return "audio"
        if InStr("pdf txt doc epub mobi", ex)
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


    GetMedia(next)
        {
        src =
        seek =
        FileReadLine, str, %inca%\cache\html\%tab_name%.htm, 3
            Loop, Parse, str, `/
              if (A_LoopField == list_id)
                ptr := A_Index + next				; next media 
        array := StrSplit(str, "/")				; convert html pointer to internal list ptr
        list_id := array[ptr]
        Loop, Parse, list, `n, `r
            if (A_Index == list_id)
                {
                src := StrSplit(A_LoopField, "/").2
                seek := StrSplit(A_LoopField, "/").5
                }
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


    AdjustMedia(x, y)
        {
        direction := x + y
        WinGet, state, MinMax, ahk_group Browsers
            {
            if (state > -1 && xpos < 50)
                {
                WinActivate, ahk_group Browsers
                if (y > 6)
                    send, ^{+}
                else send, ^0
                sleep 140
                }
            return
            }
        }


    ShowSettings()
        {
        Global
        gui, settings:Destroy
        Gui, settings:+lastfound +AlwaysOnTop -Caption +ToolWindow
	Gui, settings: Font, s8, Verdana
        Loop, Parse, features, `|
            {
            array := StrSplit(A_LoopField, "/")
            key := array.1
            if (value := array.2)
                x = checked
            else x =
            if (A_Index > 4)
                {
                if key
                    gui, settings:add, edit, x18 h16 w30 vfeature%A_Index%, %value%
                else gui, settings:add, text
                gui, settings:add, text, x58 yp, %key%
                }
            else gui, settings:add, checkbox, x25 yp+16 %x% vfeature%A_Index%, %A_Space%%A_Space%%A_Space%%A_Space%%A_Space%%key%
            }
        gui, settings:add, text, x180 y10, main folders
        gui, settings:add, edit, x180 yp+13 h80 w500 vfolder_list, %folder_list%
        gui, settings:add, text, x180 yp+85, favorite folders
        gui, settings:add, edit, x180 yp+13 h80 w500 vfav_folders, %fav_folders%
        gui, settings:add, text, x180 yp+84, search terms
        gui, settings:add, edit, x180 yp+13 h120 w500 vsearch_list, %search_list%
        gui, settings:add, text, x180 yp+125, folders to search
        gui, settings:add, edit, x180 yp+13 h18 w500 vsearch_folders, %search_folders%
        gui, settings:add, button, x180 y385 w60, Source
        gui, settings:add, button, x260 y385 w60, Compile
        gui, settings:add, button, x340 y385 w60, Help
        gui, settings:add, button, x420 y385 w60, Cancel
        gui, settings:add, button, x500 y385 w60 default, Save
        gui, settings:show
        send, +{Tab}
        }

        settingsButtonCompile:
        WinClose
        run %inca%\apps\Compile.exe
        return

        settingsButtonSource:
        WinClose
        run, notepad %inca%\inca.ahk
        return

        settingsButtonHelp:
        WinClose
        run, %inca%\apps\help.txt
        return

        settingsButtonCancel:
        WinClose
        return

        settingsButtonSave:
        gui, settings:submit
        new =
        Loop, Parse, features, `|
            {
            array := StrSplit(A_LoopField, "/")
            key := array.1
            value := feature%A_Index%
            new = %new%%key%/%value%|         
            }
        StringTrimRight,new,new,1
        IniWrite,%new%,%inca%\settings.ini,Settings,features
        IniWrite,%search_folders%,%inca%\settings.ini,Settings,search_folders
        IniWrite,%search_list%,%inca%\settings.ini,Settings,search_list
        IniWrite,%folder_list%,%inca%\settings.ini,Settings,folder_list
        IniWrite,%fav_folders%,%inca%\settings.ini,Settings,fav_folders
        settingsFinished:
        WinClose
        LoadSettings()
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


    AddHistory()
        {
        if (folder != "playlists" && !InStr(path, "\history\") && ext != "lnk")
          if (history_timer / 10 > Setting("History Timer") && type != "audio")
            FileCreateShortcut, %src%, %inca%\history\%media%.lnk
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
            clip := clipboard
            clipboard =
            RunWait %COMSPEC% /c %inca%\apps\ffmpeg.exe -i "%source%" 2>&1 | find "Duration" | Clip, , hide && exit
            ClipWait, 3
            StringTrimLeft, aTime, clipboard, 12
            StringLeft, aTime, aTime, 8
            aTime := StrSplit(aTime, ":")
            dur := aTime.1 * 3600 + aTime.2 * 60 + aTime.3
            clipboard := clip
            FileDelete, %inca%\cache\durations\%filen%.txt
            FileAppend, %dur%, %inca%\cache\durations\%filen%.txt
            }
        return dur
        }



    Indexer:								; update thumb cache
        EnvGet, profile, UserProfile
        Loop, Files, %profile%\Downloads\*.*, R
;        Loop, Files, D:\media\gifs\youtube\*.*, R
            {
            source = %A_LoopFileFullPath%
            SplitPath, source,,fol,ex,filen
            StringGetPos, pos, fol, \, R
            StringTrimLeft, j_folder, fol, % pos + 1
            med := DecodeExt(ex)
            if (med != "video" && med != "audio")
                continue
            dur =
            FileRead, dur, %inca%\cache\durations\%filen%.txt
            if (!dur && med == "video")
                {
                x = %fol%\%Filen%.%ex%
                FileMove, %x%, %x%
                if ErrorLevel						; file open or still downloading
                    continue
                type = video
                dur := GetDuration(source)
                }
            if (med == "audio")
                continue
IfNotExist, %inca%\cache\thumbs\%filen%.jpg
                {
                GuiControl, Indexer:, GuiInd, indexing - %j_folder% - %filen%
                FileCreateDir, %inca%\cache\temp1
                t := 0
                if (dur > 60)
                    {
                    t := 20	      					; skip any video intro banners
                    dur -= 20
                    }
                loop 180						; 36 video frames in thumb preview
                    {
                    y := Round(A_Index / 5)
                    if !Mod(A_Index,5)
                        runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:-2 -vframes 1 "%inca%\cache\temp1\%y%.jpg",, Hide
                    t += (dur / 200)
;                    if (dur < 20 && y >= 5)
;                        break
                    }
                FileCopy, %inca%\cache\temp1\1.jpg, %inca%\cache\posters\%filen%.jpg, 1
;                if (dur >= 20)
                    RunWait %inca%\apps\ffmpeg -i %inca%\cache\temp1\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
                }
            }
        FileRemoveDir, %inca%\cache\temp1, 1
        GuiControl, Indexer:, GuiInd
        SetTimer, indexer, 30000, -2
        return


    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        IniRead,features,%inca%\settings.ini,Settings,features
        IniRead,search_folders,%inca%\settings.ini,Settings,search_folders
        IniRead,folder_list,%inca%\settings.ini,Settings,folder_list
        IniRead,fav_folders,%inca%\settings.ini,Settings,fav_folders
        IniRead,search_list,%inca%\settings.ini,Settings,search_list
        }


    Initialize()
        {
        Global
        LoadSettings()
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
        SetTimer, indexer, -2000, -2
        WinActivate, ahk_group Browsers
        }


