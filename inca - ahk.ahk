
; mouse back button is intercepted and converted to {Pause} key for java



	; Inca Media Viewer for Windows - Firefox & Chrome compatible

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
	#SingleInstance force		; one program instance only
	#MaxHotkeysPerInterval 999	; allow fast spinning wheel
	SetWorkingDir, %A_ScriptDir%	; consistent start directory

        Global profile
        Global sort_list		:= "Shuffle|Alpha|Duration|Date|Size|Ext|Reverse|Recurse|Videos|Images|"
        Global toggles			; eg. reverse
        Global features			; program settings
        Global fol			; folder list 1
        Global fav			; folder list 2
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
        Global folder			; current folder name, no path
        Global path
        Global ext			; file extension
        Global inca_tab			; browser tab title (usually folder name)
	Global previous_tab
        Global vol_popup		; volume bar popup 
        Global volume
        Global page := 1		; current page within list
        Global sort := "Date"
	Global filter := 0		; secondary search filter eg. date, duration, Alpha letter
        Global click			; mouse click type
        Global timer			; click down timer
        Global view := 9		; thumb view (em size)
        Global last_view := 9
        Global wheel_count := 0
        Global vol_ref := 2
        Global wheel
        Global last_media		; last media played in page
	Global last_status		; time, vol etc display
        Global playlist			; slide playlist - full path
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





    main:
      initialize()				; set environment
      WinActivate, ahk_group Browsers
      SetTimer, TimedEvents, 100		; every 100mS
      sleep 350
      if !inca_tab
        {
        path = %profile%\Pictures\
        this_search := path
        inca_tab = pictures
        folder = pictures
        }
      CreateList(0)
      return					; wait for mouse/key events




    RenderPage()							; construct web page from media list
        {
        Critical							; stop key interrupts
        if !(folder && path)
            return
        last := src
        title := folder
        speed := Setting("Default Speed")
        FileRead, ini, %inca%\inca - ini.ini
        ini := StrReplace(ini, "`r`n", "|")
        FileRead, style, %inca%\inca - css.css
        FileRead, java, %inca%\inca - js.js
        Loop, Files, %inca%\music\*.m3u					; for top panel
            music = %music%%A_LoopFileFullPath%|
        Loop, Files, %inca%\slides\*.m3u
            slides = %slides%%A_LoopFileFullPath%|
        IniWrite,%slides%,%inca%\inca - ini.ini,Settings,slides
        IniWrite,%music%,%inca%\inca - ini.ini,Settings,music
        IniWrite,%subfolders%,%inca%\inca - ini.ini,Settings,subs

        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        list_size := 0
        type = video							; prime for list parsing
        page_w := Setting("Page Width")
        size := Setting("Page Size")
        if search_term
          size = 2000
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
        if ((pages := ceil(list_size/size)) > 1)
            pg = Page %page% of %pages%
        header_html = <!--`r`n%view%>%last_view%>%page%>%filter%>%sort%>%toggles%>%this_search%>%search_term%>%path%>%folder%>%playlist%>%last_media%>`r`n%page_media%`r`n-->`r`n<!doctype html>`r`n<html>`r`n<head>`r`n<meta charset="UTF-8">`r`n<title>Inca - %title%</title>`r`n<meta name="viewport" content="width=device-width, initial-scale=1">`r`n<link rel="icon" type="image/x-icon" href="file:///%inca%\apps\icons\inca.ico">`r`n</head>`r`n

        panel_html = <body class='container' onload="spool(event, '', '', '%toggles%', '%sort%', %filter%, %page%, %pages%, %view%, %speed%, '%title%', %list_size%)">`r`n<div style="width:%page_w%`%; margin:auto">`r`n<div class='panel' id='myPanel'></div>`r`n`r`n

        title_html = `r`n`r`n<div style='display:flex'>`r`n<div class='ribbon' style='color:lightsalmon; width:6`%'>%list_size%</div>`r`n<a href="%title%.htm#Page" id="myPage" class='ribbon' style='width:14`%' onwheel="wheelEvents(event, id, this)">%pg%</a>`r`n<a href=#Thumbs#%view%## id="Thumbs" class='ribbon' style='width:10.4`%' onwheel="wheelEvents(event, id, this)" onmouseover="media.style.opacity=1" onmouseout="media.style.opacity=null">Thumbs</a>`r`n<a href="#Orphan#%folder%#" id='myFiles' class='ribbon' style='color:red; width:16`%' onmouseover="wheelEvents(event, id, this, '%ini%')" onwheel="wheelEvents(event, id, this, '%ini%')">%title%</a><a class='ribbon' id='Search' onmouseover="filter=14; wheelEvents(event, id, this, '%search_list%')" onwheel="wheelEvents(event, id, this, '%search_list%')">Search</a>`r`n<a href='#%sort%#%sort%#' id='mySort' class='ribbon' onwheel="wheelEvents(event, id, this)">%sort%`r`n<a id='myFilter' class='ribbon' onwheel="wheelEvents(event, id, this)">All</a>`r`n<a id='Menu' class='ribbon' onmouseover="spool(event, id, '%features%', '%toggles%', '%sort%', %filter%, %page%, %pages%, %view%, %speed%, '%title%', %list_size%)">Menu</a>`r`n</div><div style='display:flex'>`r`n<input id='myInput' class='searchbox' onmouseover="spool(event, id, '%features%', '%toggles%', '%sort%', %filter%, %page%, %pages%, %view%, %speed%, '%title%', %list_size%)" type='search' value='%search_box%' style='width:78`%; margin-bottom:2em; margin-right:0'>`r`n<a href='#Searchbox###' class='searchbox' style='width:3`%; border-radius:0 1em 1em 0'>+</a></div>`r`n`r`n<div id="myModal" class="modal" onwheel="wheelEvents(event, id, this)">`r`n<div><video id="myPlayer" class="player" type="video/mp4"></video><textarea id="myCap" class="caption" onmouseenter="over_cap=true" onmouseleave="over_cap=false"></textarea><span id="mySeekBar" class="seekbar"></span><span><video id='mySeek' class='seek' type="video/mp4"></video></span><span id="mySidenav" onmouseover="openNav()" onmouseleave="closeNav()" class="sidenav"><a id="mySpeed" onmouseover='stat.innerHTML=Math.round(media.playbackRate*100)' onwheel="wheelEvents(event, id, this)">Speed</a><a id="myNext" onmouseover='stat.innerHTML=index' onclick='nextCaption()' onwheel="wheelEvents(event, id, this)">Next</a><a id="myThin" onmouseover='stat.innerHTML=Math.round(newSkinny*100)' onwheel="wheelEvents(event, id, this)">Thin</a><a id='myLoop' onclick="loop()">Loop</a><a onclick="toggleMute()">Mute</a><a id="myFav">Fav</a><a id="myCapnav" onclick="editCap()">Cap</a><a onclick="cue = Math.round(media.currentTime*100)/100">Cue</a><a id="myMp4">mp4</a><a id="myMp3">mp3</a><a id="myStatus" style='font-size:5em; padding:0'></a></span></div></div>`r`n`r`n

        html = `r`n%html%</div>`r`n
        FileDelete, %inca%\cache\html\%folder%.htm
        StringReplace, header_html, header_html, \, /, All
        StringReplace, panel_html, panel_html, \, /, All
        y = %title_html%%html%
        StringReplace, y, y, \, /, All
        FileAppend, %header_html%%style%%panel_html%%y%%java%</body>`r`n</html>`r`n, %inca%\cache\html\%folder%.htm, UTF-8
        LoadHtml()
        PopUp("",0,0,0)
        DetectMedia(last)						; restore media parameters
        }






    Esc up::
      ExitApp


    ~LButton::					; click events
     RButton::
      MouseDown()
      Gui PopUp:Cancel
      return


    Xbutton1::					; mouse "back" button
      Critical
      timer := A_TickCount + 350
      SetTimer, Timer_up, -350
      return
    Timer_up:					; long back key press
      IfWinActive, ahk_group Browsers
        send, ^0^w 				; close tab
      else send, !{F4}				; or close app
      return
    Xbutton1 up::
      if (A_TickCount > timer)
        return
      SetTimer, Timer_up, Off
      IfWinExist, ahk_class OSKMainClass
        send, !0				; close onscreen keyboard
      else if WinActive("ahk_class Notepad")
        Send,  {Esc}^s^w
      else if inca_tab
        {
        WinGetPos,,,w,,a
        If (w >= A_ScreenWidth)			; if fullscreen
          send, {F11}
        send, {Pause}				; close java modal (media window)
        GetAddressBar()				; read address bar message
        }
      else send, {Xbutton1}
      return


    ~WheelUp::
       wheel = up
    ~WheelDown::
       MouseGetPos, xpos, ypos
       IfWinActive, ahk_class ahk_class mpv	; mpv player controls
         {
         if (xpos < 100 && type != "image")
           if (wheel == "up")			; speed
             send, b
           else send, a
         else if(ypos < A_ScreenHeight*0.9 || type == "image")
             if (wheel == "up")			; magnify
               send, 9
             else send, 0
         else if (wheel == "up")		; seek
           send, e
         else send, f
         }
       else
         {
         wheel_count += 1
         if (wheel_count > 10 && ypos < 50 && xpos < 50)
             {
             wheel_count = 0
             WinGet, state, MinMax, ahk_group Browsers
             if (state > -1)		; browser magnify
               {
               WinActivate, ahk_group Browsers
               if (wheel == "up")
                 send, ^0
               else send, ^{+}
               sleep 64
               }
             }
         }
      wheel =
      return


    ~Enter::					; file search - from html input box
      if inca_tab
        {
        send, !0
        Clipboard =
        send, {end}+{Home}^c
        ClipWait, 0
        value := Clipboard
        command = Search
        search_box := value
        if value
            {
            ProcessMessage()
            CreateList(1)
            }
        }
      return


    #/::					; 1st mouse option button win/
      timer = set
      SetTimer, button2_Timer, -240
      return
    #/ up::
      timer =
      return
    button2_Timer:
      IfWinActive, ahk_group Browsers
        if !timer
          send, {Space}				; pause toggle YouTube
        else loop 10
          {
          if !timer
            break
          WinActivate, ahk_group Browsers
          send, {Left}{Left}			; rewind YouTube 10 secs
          sleep 624
          }
      return


    #\::					; 2nd mouse option button win\
      timer3 = set
      SetTimer, button1_Timer, -240
      return
    #\ up::
      timer3 =
      return
    button1_Timer:
      if !timer3				; toggle browser / desktop
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
          send, {f11}				; fullscreen
        send, f
        }
      return




    MouseDown()
      {
      gesture =
      timer := A_TickCount + 350
      MouseGetPos, xpos, ypos
      StringReplace, click, A_ThisHotkey, ~,, All
      loop					; gesture detection
        {
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        xy := Abs(x + y)
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P"))
          break
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
          }
        if (!gesture && A_TickCount > timer)
          {
          timer =
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
                command = Search
                value := Clipboard
                search_box := value
                ProcessMessage()
                CreateList(1)
                }
              else send, !+0
              Clipboard := clip
              }
            else send, !+0			; trigger osk keyboard
            }
          break
          }
        }
      if (!gesture && click == "LButton" && inca_tab && A_Cursor != "IBeam")
        GetAddressBar()
      if (!gesture && click == "RButton")
        send {RButton}
      }


    GetAddressBar()			; messages from browser address bar
        {
        selected =
        select =
        command =
        value =
        address =
        reload =
        type =
        ptr := 1
        if !inca_tab
          return
        send, {Lbutton up}
        input := ReadAddressBar(1)
        input := StrReplace(input, "/", "\")
        if !InStr(input, "file:\\\")
          return
        array := StrSplit(input,"#")
        if (array.MaxIndex() < 3) 
          return
        Loop % array.MaxIndex()/4
          {
          command := array[ptr+=1]
          value := array[ptr+=1]
          select := array[ptr+=1]
          address := array[ptr+=1]
          select := StrReplace(select, ",", "/")
          if (StrLen(select) > 1)
            {
            selected = %select%
            list_id := StrSplit(selected, "/").1
            GetMedia(0)
            }
          if !command
            continue
          ProcessMessage()
          }
        search_box =
        if (reload == 1)
          CreateList(1)
        if (reload == 2)
          RenderPage()
        }


    ReadAddressBar(reset)
        {
        Critical
        clip := clipboard
        clipboard =
        sleep 24
        send, ^l
        sleep 24
        send, ^c
        sleep 24
        input := clipboard
        clipboard := clip
        if reset
            {
            if InStr(input, "#")
                send, !{Left}						; reset location bar to last address
            send, +{F6}							; focus back to page
            if (browser == "Profile 1 - Microsoft")
                send, +{F6}
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
        sleep 34							; release location bar
        return input
        }




    TimedEvents:
        title =
        Gui, background:+LastFound
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1)
          WinGetTitle title, A
        if InStr(title, "Inca - ")
          inca_tab := SubStr(title, 8)
        else inca_tab =
        if InStr(title, "mozilla firefox")       
          browser = mozilla firefox
        else if InStr(title, "google chrome")       
          browser = google chrome
        else if InStr(title, "Brave")       
          browser = Brave
        else if InStr(title, "Opera")       
          browser = Opera
        else if InStr(title, "Profile 1 - Microsoft")       
          browser = Profile 1 - Microsoft
        StringGetPos, pos, inca_tab, %browser%, R
        StringLeft, inca_tab, inca_tab, % pos - 3
        if inca_tab
            WinSet, Transparent, % Setting("Dim Desktop")
        else WinSet, Transparent, 0
        if (inca_tab && inca_tab != previous_tab)			; has inca tab changed
            {
            folder := inca_tab
            GetTabSettings(1)						; get last tab settings
            if (previous_tab && FileExist(inca "\cache\lists\" inca_tab ".txt"))
              FileRead, list, %inca%\cache\lists\%inca_tab%.txt
            else CreateList(0)						; media list to match html page
            previous_tab := inca_tab
            }
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



    ProcessMessage()
        {
        if (command == "Orphan")					; open in notepad if playlist
            {
            IfExist, %inca%\slides\%value%.m3u
              run, %inca%\slides\%value%.m3u
            IfExist, %inca%\music\%value%.m3u
              run, %inca%\music\%value%.m3u
            }
        if (command == "Join")
            {
            if !GetMedia(0)
              return
            src2 := src
            media2 := media
            list_id := StrSplit(selected, "/").2
            if GetMedia(0)
              {
              str = file '%media_path%\%media2%.%ext%'`r`nfile '%media_path%\%media%.%ext%'`r`n
              FileAppend,  %str%, %inca%\apps\temp1.txt, utf-8
              runwait, %inca%\apps\Utf-WithoutBOM.bat %inca%\apps\temp1.txt > %inca%\apps\temp.txt,,Hide
              runwait, %inca%\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\apps\temp.txt" -c copy "%media_path%\%media%- join.mp4",,Hide
              FileDelete, %inca%\apps\temp.txt
              FileDelete, %inca%\apps\temp1.txt
              }
            sleep 1000
            reload := 1
            }
        if (command == "mp3" || command == "mp4")
            {
            if !address
                x = 0.0
            if (!address && !value)
              run, %inca%\apps\ffmpeg.exe -i "%src%" "%media_path%\%media% 0.0.%command%",,Hide
            else run, %inca%\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%media_path%\%media% %x%.%command%",,Hide
            sleep 1000
            reload := 1
            }
        if (command == "MovePos")
            MoveEntry()						; move entry within playlist
        if (command == "Caption")
            {
            FileRead, str, %inca%\cache\captions\%media%.srt
            FileDelete, %inca%\cache\captions\%media%.srt
            if InStr(str, address)
              str := StrReplace(str, address, value)
            else str = %str%%value%
            FileAppend, %str%, %inca%\cache\captions\%media%.srt, UTF-8
            reload := 2
            }
        if (command == "Favorite")
            {
            if !value
                value := seek
            if (InStr(path, "slides") && !search_term)
                FileAppend, %src%|%value%`r`n, %path%%folder%.m3u, UTF-8
            else FileAppend, %src%|%value%`r`n, %inca%\slides\new.m3u, UTF-8
            Runwait, %inca%\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=480:-2 -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
            }
        if (command == "Skinny")
            {
            FileDelete, %inca%\cache\widths\%media%.txt
            if (value > 0.5 && value < 0.995 || value > 1.005 && value < 1.5)
              FileAppend, %value%, %inca%\cache\widths\%media%.txt
            reload := 2
            }
        if (command == "Thumbs")
            {
            page := 1
            if (!view || view == value)
              {
              if !view
                 view := last_view
              else view := 0
              }
            else view := value
            last_view := value
            reload := 2
            }
        if (command == "Delete")
            {
            if (InStr(path, "\inca\slides\") || InStr(path, "\inca\music\"))
              DeleteEntries()
            else Loop, Parse, selected, `/
              {
              list_id := A_LoopField
              if GetMedia(0)
                FileRecycle, %src%
              }
            reload := 1
            }
        if (command == "Rename")
            {
            if (StrLen(value) < 4)
                popup = too small
            if !GetMedia(0)
                popup = no media
            if !popup
               {
               RenameFiles(value)
               popup = Renamed
               }
            Popup(popup,600,0,0)
            sleep 555
            reload := 1
            }
        if (command == "Path" && selected)
            {
            FileTransfer()						; between folders or playlists
            reload := 1
            }
        if (command == "Path")						; set inca path
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
              }
            }
        if (command == "Media")
            {
            list_id := value
            if GetMedia(0)
              if (!timer||type=="document"||ext=="txt"||ext=="m3u"||ext=="wmv"||ext=="avi"||ext=="mpg"
              ||ext=="ts"||ext=="flv" || (type=="video" && ext!="mp4" && browser=="mozilla firefox")
              || (type=="video" && ext!="mp4" && browser=="Profile 1 - Microsoft"))
                {
                sleep 200
                send, {Pause}
                if (ext == "txt" || ext == "ini" || ext == "css" || ext == "js" || ext == "ahk")
                    Run, % "notepad.exe " . src
                else if (type == "video")
                    Run %inca%\apps\mpv "%src%"
                else Run, %src%
                }
            }
        else if (command == "Searchbox" && search_term)			; add search to search list
            {
            search_list = %search_list%|%search_term%
            IniWrite,%search_list%,%inca%\inca - ini.ini,Settings,search_list
            LoadSettings()
            PopUp("Added",600,0,0)
            reload := 1
            }
        else if (command == "Page" || command == "View")
            {
            if (command == "Page")
                page := value
            if (command == "View")
                view := value
            Popup(value,0,0,0)
            reload := 1
            }
        else if (command == "Settings") 
            ShowSettings()
        else if (command == "Filter" || command == "Path" || command == "Search" || InStr(sort_list, command))
            {
            reload = 1
            if (command == "Search")
              search_term = %value%					; clears white space
            else if search_box
              search_term = %search_box%
            if address
                {
                search_term =
                this_search := path
                x := playlist
                GetTabSettings(0)					; load previous settings from cache
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
                filter := 0
                }
            if search_term						; search text from link or search box
                {
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
                filter := 0
                }
            if (command == "Filter")			; alpha letter
                filter := value
            page := 1
            if (InStr(sort_list, command))				; sort filter
                {
                filter := 0
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
        if !(folder || this_search)
            return
        IfNotExist, %path%
            path = %search_term%\
        list =
        list_size := 1
        popup := folder
        if (InStr(sort_list, command))
            popup := command
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
        if (sort == "Ext")
            Sort, list, %reverse% Z					; alpha sort
        else if (sort != "Shuffle")
            Sort, list, %reverse% Z N					; numeric sort
        if (sort == "Shuffle")
            Sort, list, Random Z
        FileDelete, %inca%\cache\lists\%folder%.txt
        FileAppend, %list%, %inca%\cache\lists\%folder%.txt, UTF-8
        RenderPage()
        if (folder == "Downloads") 
            SetTimer, indexer, 1000, -2
        }



    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        if ((cap_size := view / 12) > 1.6)
          cap_size := 1.6
        if DetectMedia(input)
            thumb := src
        else thumb = %inca%\apps\icons\no link.png
        if (view > 24 && (type == "video" || type == "audio"))
          controls = controls
        x := RTrim(media_path,"\")
        SplitPath, x,,,,y
        if search_term
          fold = <td style="width:4em; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; padding-right:1em">%y%</td>
        FileRead, dur, %inca%\cache\durations\%media%.txt
        if (type == "video")
            {
            thumb =  %inca%\cache\posters\%media%.jpg
            if start
              IfExist, %inca%\cache\posters\%media% %start%.jpg
                thumb = %inca%\cache\posters\%media% %start%.jpg
            if (!start && !playlist)
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
;      x = cap_src.indexOf('|'+ t + '|')
;      if (t && x > 0) {cap.innerHTML = cap_src.slice(0,x).split('|').pop()}

FileRead, cap, %inca%\cache\captions\%media%.srt
cap := StrReplace(cap, "`r`n", "|")
cap := RegExReplace(cap, "[^a-zA-Z0-9 |.,]")

needle = |%start%|
pos := InStr(cap, needle)
if pos {
x := substr(cap,1,pos)
a := StrSplit(x,"|")
pos := a.MaxIndex()
x:=a[pos-1]
caption := x
}
        caption = <div style="margin:auto; height:5em; color:#826858; font-size:%cap_size%em">%caption%</div>

        if (dur && type == "video")
            dur := Time(dur)
        else dur =
        if (type == "video")
            FileGetSize, size, %src%, M
        else FileGetSize, size, %src%, K
        size := Round(size)
        if (type == "audio" || type == "m3u")
            thumb = %inca%\apps\icons\music.png
        if (type == "document")
            thumb = %inca%\apps\icons\ebook.png
        StringReplace, thumb, thumb, #, `%23, All
        StringReplace, src, src, #, `%23, All				; html cannot have # in filename
        stringlower, thumb, thumb
 poster = poster="file:///%thumb%"

     start := Round(start,2)
        if !view							; list view
            {
            entry = <div><table><tr><td id="thumb%j%" style="position:absolute; margin-left:3.5em"><a href="#Media#%j%##" id="sel%j%"><video id="media%j%" class='thumblist' style="width:9em; %transform%" onwheel="if(media.style.position=='fixed') {wheelEvents(event, 'Fixed', this)}" onmouseover="overThumb(event, %j%, %start%, %skinny%)" onmouseout='exitThumb(this)' onclick="playMedia('Click', '%type%', %start%, %skinny%, '%cap%', %j%, event)" %poster% src="file:///%src%" type="video/mp4" preload='none' muted></video></a></tr></table><table style="table-layout:fixed; width:100`%; font-size:0.9em"><tr><td style="width:4em; text-align:center"><span style="border-radius:9px; color:#777777">%sort_name%</span></td><td style="width:4em; text-align:center">%dur%</td><td style="width:3em; text-align:center">%size%</td><td style="width:4em; text-align:center">%ext%</td>%fold%<td><div id="title%j%" onclick="select(%j%)" style="width:80`%; border-radius:1em; padding-left:0.5em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">%media%</td></tr></table></div>`r`n`r`n
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
	        entry = <a href="#Media#%j%##"><div style="display:inline-block; width:88`%; color:#555351; transition:color 1.4s; margin-left:8`%; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_name% &nbsp;&nbsp;%media%</div></a><textarea rows=%rows% style="display:inline-block; overflow:hidden; margin-left:8`%; width:88`%; background-color:inherit; color:#826858; font-size:1.2em; font-family:inherit; border:none; outline:none;">%str2%</textarea>`r`n`r`n
                }
            else entry = <div id="thumb%j%" onclick="select(%j%)" class="thumbs" style="width:%view%em; margin-right:3em"><div id="title%j%" style="color:#555351; border-radius:9px; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:0.85em; margin:auto; width:80`%">%media%</div><a href="#Media#%j%##" id="sel%j%"><video %controls% class="thumbs" id="media%j%" style="position:inherit; %transform% width:%view%em" onwheel="if(media.style.position=='fixed') {wheelEvents(event, 'Fixed', this)}" onmouseover="overThumb(event, %j%, %start%, %skinny%)" onmouseout='exitThumb(this)' onclick="playMedia('Click', '%type%', %start%, %skinny%, '%cap%', %j%, event)" src="file:///%src%" %poster% preload='none' muted type="video/mp4"></video></a>%caption%</div>`r`n`r`n
            }
        return entry
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
            if (sort == "Ext")
                list_id := ex
            if (sort == "Alpha")
              {
              StringGetPos, pos, input, \, R, 1
              StringMid, 1st_char, input, % pos + 2, 1
              if (filter && sort == "Alpha" && 1st_char < Chr(filter+64))
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
              if (med == "video")
                FileGetSize, list_id, %input%, M
              else FileGetSize, list_id, %input%, K
              sort_name := Round(list_id)
              if (filter && list_id < filter*10)
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
        new_html = file:///%inca%\cache\html\%folder%.htm
        StringReplace, new_html, new_html, \,/, All
        IfWinNotExist, ahk_group Browsers
            run, %new_html%						; open a new web tab
        if !inca_tab
            run, %new_html%						; open a new web tab
        else if (folder == previous_tab)				; just refresh existing tab
            send, {F5}
        else	
            {								; re-load tab
            previous_tab := inca_tab
            ReadAddressBar(0)
            sendraw, %new_html%%A_Space%`n
            }
        previous_tab := inca_tab
        }


    GetTabSettings(extended)						; from .htm cache file
        {
        page := 1							; default view settings
        filter := 1
        toggles =
        playlist =
        last_media =
        if (InStr(path, "\slides\") || InStr(path, "\music\"))
          sort = Alpha
        else sort = Shuffle
        FileReadLine, array, %inca%\cache\html\%folder%.htm, 2	; embedded page data
        if array
            {
            StringReplace, array, array, /, \, All
            array := StrSplit(array,">")
            view := array.1
            last_view := array.2
            page := array.3
            filter := array.4
            sort := array.5
            toggles := array.6
            last_media := array.12
            if extended
              {
              this_search := array.7
              search_term := array.8
              path := array.9
              folder := array.10
              playlist := array.11
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


    MoveEntry()						; within playlist 
        {
        if (!playlist || !selected)
          return
        if (sort != "Alpha")
          {
          sort = Alpha
          CreateList(0)
          return
          }
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
            if (A_LoopField == source && !flag2 && (!timer || source != target)) ; 
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
        reload := 1
        }


    FileTransfer()
        {
        if timer
          PopUp("Move",400,0,0)
        else PopUp("Copy",400,0,0)
        Loop, Parse, selected, `/
            {
            list_id := A_LoopField
            if GetMedia(0)
              if (InStr(address, "inca\slides") || InStr(address, "inca\music"))
                FileAppend, %target%`r`n, %address%, UTF-8		; add media entry to playlist
              else if timer
                FileMove, %src%, %address%				; move file to new folder
              else FileCopy, %src%, %address%
            PopUp(media,0,0,0)
            }
        if timer
          if (InStr(address, "slides") || InStr(address, "music"))
            DeleteEntries()
        }  


    DeleteEntries()
        {
        plist = %path%%folder%.m3u
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, selected, `/
         if A_LoopField
          {
          list_id := A_LoopField
          GetMedia(0)
          x = %target%`r`n
          y = %src%`r`n
          str := StrReplace(str, x)
          str := StrReplace(str, y)
          }
        FileAppend, %str%, %plist%, UTF-8
        }


    RenameFiles(new_name)
        {
        FileMove, %src%, %media_path%\%new_name%.%ext%			; FileMove = FileRename
        SetTimer, indexer, 1000, -2
        if (folder == "Downloads") 
            return
        new_entry := StrReplace(target, media, new_name)
        Loop, Files, %inca%\slides\*.m3u, FR
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
        FileReadLine, str, %inca%\cache\html\%folder%.htm, 3
        Loop, Parse, str, `/
          if (A_Index == list_id)
            ptr := A_Index + next + 1				; next media 
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
            value := array.2
            if key
                gui, settings:add, edit, x18 h16 w40 vfeature%A_Index%, %value%
            else gui, settings:add, text
            gui, settings:add, text, x68 yp+2, %key%
            }
        gui, settings:add, text, x165 y10, root folders
        gui, settings:add, edit, x160 yp+13 h80 w500 vfol, %fol%
        gui, settings:add, text, x165 yp+85, favorite folders
        gui, settings:add, edit, x160 yp+13 h80 w500 vfav, %fav%
        gui, settings:add, text, x165 yp+84, search terms
        gui, settings:add, edit, x160 yp+13 h120 w500 vsearch_list, %search_list%
        gui, settings:add, text, x165 yp+125, folders to search
        gui, settings:add, edit, x160 yp+13 h18 w500 vsearch_folders, %search_folders%
        gui, settings:add, button, x165 y385 w60, Source
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
        run, notepad %inca%\inca - ahk.ahk
        run, notepad %inca%\inca - js.js
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
        IniWrite,%new%,%inca%\inca - ini.ini,Settings,features
        IniWrite,%search_folders%,%inca%\inca - ini.ini,Settings,search_folders
        IniWrite,%search_list%,%inca%\inca - ini.ini,Settings,search_list
        IniWrite,%fol%,%inca%\inca - ini.ini,Settings,fol
        IniWrite,%fav%,%inca%\inca - ini.ini,Settings,fav
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



    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        EnvGet, profile, UserProfile
        IniRead,features,%inca%\inca - ini.ini,Settings,features
        IniRead,search_folders,%inca%\inca - ini.ini,Settings,search_folders
        IniRead,fol,%inca%\inca - ini.ini,Settings,fol
        IniRead,fav,%inca%\inca - ini.ini,Settings,fav
        IniRead,search_list,%inca%\inca - ini.ini,Settings,search_list
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
        }



    Indexer:								; update thumb cache
        Critical Off
        Loop, Files, %profile%\Downloads\*.*, R
;        Loop, Files, D:\media\gifs\youtube\*.*, R
            {
            source = %A_LoopFileFullPath%
            SplitPath, source,,fold,ex,filen
            StringGetPos, pos, fold, \, R
            StringTrimLeft, j_folder, fold, % pos + 1
            med := DecodeExt(ex)
            if (med != "video" && med != "audio")
                continue
            dur =
            FileRead, dur, %inca%\cache\durations\%filen%.txt
            if (!dur && med == "video")
                {
                x = %fold%\%Filen%.%ex%
                FileMove, %x%, %x%
                if ErrorLevel						; file open or still downloading
                    continue
                type = video
                dur := GetDuration(source)
                }
            if (med == "audio")
                continue
            x =
            IfNotExist, %inca%\cache\posters\%filen%.jpg
              x = 1
            IfNotExist, %inca%\cache\thumbs\%filen%.jpg
              x = 1
            if x
                {
                GuiControl, Indexer:, GuiInd, indexing - %filen%
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
IfNotExist, %inca%\cache\thumbs\%filen%.jpg
                    Runwait %inca%\apps\ffmpeg -i %inca%\cache\temp1\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
                }
            }
        FileRemoveDir, %inca%\cache\temp1, 1
        GuiControl, Indexer:, GuiInd
        SetTimer, indexer, 60000, -2
        return


