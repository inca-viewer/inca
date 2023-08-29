

	; Browser File Explorer - Windows

	; this back end AutoHotKey script manages keystrokes and generates web pages of your media
	; messages to and from the browser are through the address bar
	; web page styling is from vanilla Java script


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
        Global this_search		; current search folders
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
	Global previous_tab
        Global vol_popup		; volume bar popup 
        Global volume
        Global page := 1		; current page within list
        Global sort := "Date"
	Global filt := 0		; secondary search filter eg. date, duration, Alpha letter
        Global click			; mouse click type
        Global timer			; click down timer
        Global view := 9		; thumb view (em size)
        Global last_view := 0
        Global wheel_count := 0
        Global vol_ref := 2
        Global wheel
        Global last_media		; last media played in page
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


    main:
      initialize()				; set environment
      WinActivate, ahk_group Browsers
      SetTimer, TimedEvents, 100		; every 100mS
      sleep 350					; wait for browser page to identify
      folder := inca_tab			; align current folder to browser
      send, {F5}				; refresh browser tab
      if !inca_tab				; inca tab not exist
        {
        path = %profile%\Pictures\		; use pictures as default
        this_search := path
        folder = pictures
        CreateList(0)				; construct web page
        }
      return					; wait for mouse/key events


    Esc up::
      ExitApp


    ~LButton::					; click events
     RButton::
      MouseDown()
      Gui PopUp:Cancel
      return


    Xbutton1::					; mouse "back" button
      Critical
      Process, Close, mpv.exe
      timer := A_TickCount + 350
      SetTimer, Timer_up, -350
      return
    Timer_up:					; long back key press
      IfWinActive, ahk_group Browsers
        send, ^0^w 				; close tab
      else send, !{F4}				; or close app
      return
    Xbutton1 up::
      sleep 24					; time for mpv to close
      if (A_TickCount > timer)
        return
      SetTimer, Timer_up, Off
      IfWinExist, ahk_class OSKMainClass
        send, !0				; close onscreen keyboard
      else if WinActive("ahk_class Notepad")
        Send, {Esc}^s^w
      else if (inca_tab && !Setting("External Player"))
        {
        send, {Alt up}{Ctrl up}{Shift up}
        send, {MButton up}			; close java modal (media player)
        WinGetPos,,,w,,a
        sleep 24
        If (w == A_ScreenWidth)
          send, {F11}
        sleep 100				; wait for java messages
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
       else					; browser magnify
         {
         wheel_count += 1
         if (wheel_count > 10 && ypos < 50 && xpos < 50)
             {
             wheel_count = 0
             WinGet, state, MinMax, ahk_group Browsers
             if (state > -1)
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


    ~Enter::					; search request from htm input box
      if inca_tab
        {
        sleep 250				; wait for java inputbox text in 'messages'
        timer := 1				; not long click
        GetAddressBar()				; process address bar messages
        }
      return


    MouseDown()
      {
      gesture =
      timer := A_TickCount + 300
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
        if (!gesture && A_TickCount > timer && !GetKeyState("RButton", "P"))
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
                command = Search		; search from selected text
                value := Clipboard
                ProcessMessage()
                CreateList(1)
                }
              else send, !+0
              Clipboard := clip
              }
            else send, !+0			; trigger osk keyboard
            }
          timer =
          break
          }
        }
      if (!gesture && click == "LButton" && inca_tab && A_Cursor != "IBeam") ; && A_Cursor != "Arrow")
        GetAddressBar()
      if (!inca_tab && !timer && WinActive("ahk_group Browsers" && A_Cursor != "IBeam"))
          send, f
      if (!gesture && click == "RButton")
          send {RButton}
      }


    TimedEvents:
        title =
        Gui, background:+LastFound
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
        if (volume > 0.1 && !vol_popup && Setting("Volume Fade") > 10 && A_TimeIdlePhysical > 600000)
            {
            volume -= vol_ref / (Setting("Volume Fade") * 6)		; sleep timer
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


    GetAddressBar()							; messages from browser address bar
        {
        IfWinExist, ahk_class OSKMainClass
        send, !0							; close onscreen keyboard
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
        send, {Alt up}{Ctrl up}{Shift up}
        if (GetKeyState("LButton", "P"))
          send, {Lbutton up}
        input := ReadAddressBar(0)
        input := StrReplace(input, "/", "\")
;        if !InStr(input, "file:\\\")
;          return
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
          if (command == "Rename")
            {
            value =
            pos := InStr(input, "#",,-1)
            list_id := SubStr(input,pos+1)
            StringTrimRight, list_id, list_id, 2
            GetMedia(0)
            pos := InStr(input, "#Rename#")
            value := SubStr(input, pos+8)
            pos := InStr(value, "#",,-1)
            value := SubStr(value,1,pos-1)
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
            reload := 3
            break
            }
          else ProcessMessage()
          }
        if (reload == 1)
          CreateList(1)
        if (reload == 2)
          RenderPage()
        if (reload == 3)
          CreateList(0)
        }


    ReadAddressBar(new_html)
        {
        sleep 24
        input := Clipboard
        Clipboard =
        return input
        }


    ProcessMessage()
        {
        if (command == "Up")
            {
            StringTrimRight, address, address, 1
            SplitPath, address,,path
            address = %path%\
            command = Path
            }
        if (command == "EditCap")					; open in notepad if caption
            {
            IfExist, %inca%\cache\captions\%value%.srt
              run, %inca%\cache\captions\%value%.srt
            }
        if (command == "Orphan")					; open in notepad if playlist
            {
            if playlist
              {
              IfExist, %address%%value%.m3u
                if !timer						; long click
                  run, %address%%value%.m3u
                else reload := 3
                }
            else IfExist, %inca%\%value%\
              run, %inca%\%value%\
            else command = Path
            }
        if (command == "mp3" || command == "mp4")		; address = cue, value = current time
            {
            x = %value%						; convert number to string
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
            if (SubStr(value,1,1) == "|")			; no text before time
              value = 
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
            if (InStr(path, "\inca\fav\") && !search_term)
                FileAppend, %src%|%value%`r`n, %path%%folder%.m3u, UTF-8
            FileAppend, %src%|%value%`r`n, %inca%\fav\new.m3u, UTF-8
            Runwait, %inca%\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
            }
        if (command == "Skinny" && value)
            {
            FileDelete, %inca%\cache\widths\%media%.txt
            if (value < 0.5) 
              value = 0.5
            if (value > 1.5)
              value = 1.5
            FileAppend, %value%, %inca%\cache\widths\%media%.txt
            }
        if (command == "myThumbs")
            {
            if (!view || view == value)
              {
              if !view
                 view := last_view
              else view := 0
              }
            else view := value
            last_view := value
            if (last_view == 0 && view == 0)
                view := 9
            reload := 2
            }
        if (command == "Delete")
            {
            if (InStr(path, "\inca\fav\") || InStr(path, "\inca\music\"))
              DeleteEntries(1)
            else Loop, Parse, selected, `/
              {
              list_id := A_LoopField
              if GetMedia(0)
                FileRecycle, %src%
              }
            reload := 3
            }
        if (command == "Media")
            {
            if (playlist && selected && !timer)
              {
              MoveEntry()								; move entry within playlist
              reload := 3
              return
              }
            list_id := value
            if GetMedia(0)
              {
              FileRead, str, %inca%\fav\History.m3u
              if (!playlist && type == "video" && !InStr(str, src))
                FileAppend, %src%|%address%`r`n, %inca%\fav\History.m3u, UTF-8		; add media entry to playlist
              popup = %browser% Cannot Play %ext%
              if (type=="document" || type=="m3u")
                Run, % "notepad.exe " . src
              else if Setting("External Player")
                Run %inca%\apps\mpv "%src%"
              else if (timer && ((browser == "mozilla firefox" && type == "video" && ext != "mp4" && ext != "m4v") || (browser == "google chrome" && type == "video" && ext != "mp4" && ext != "mkv" && ext != "m4v")))
                {
                Run %inca%\apps\mpv "%src%"
                Popup(popup,1000,0.34,0.8)
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
        if (command == "Path" && selected)
            {
            FileTransfer()						; between folders or fav
            reload := 3
            return
            }
        if (command == "Join")
            {
            array := StrSplit(selected, "/")
            x := array.MaxIndex() - 1
            if (x == 2)
              {
              if !GetMedia(0)
                return
              src2 := src
              media2 := media
              list_id := StrSplit(selected, "/").2
              if GetMedia(0)
                {
                Popup("Join Media",0,0,0)
                str = file '%media_path%\%media2%.%ext%'`r`nfile '%media_path%\%media%.%ext%'`r`n
                FileAppend,  %str%, %inca%\apps\temp1.txt, utf-8
                runwait, %inca%\apps\Utf-WithoutBOM.bat %inca%\apps\temp1.txt > %inca%\apps\temp.txt,,Hide
                runwait, %inca%\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\apps\temp.txt" -c copy "%media_path%\%media%- join.mp4",,Hide
                FileDelete, %inca%\apps\temp.txt
                FileDelete, %inca%\apps\temp1.txt
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
            IniWrite,%search%,%inca%\inca - ini.ini,Settings,Search
            LoadSettings()
            PopUp("Added",600,0,0)
            }
        if (command=="Filt"||command=="Path"||command=="Search"||command=="SearchBox"||command=="SearchAdd"||InStr(sort_list, command))
            {
            reload = 1
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
                if !folder
                  folder = none
                }
            if (command == "Search" || command == "SearchBox")
              {
              if (command == "Search")
                subfolders =
              if !timer
                search_term = %search_term%+%value%			; long click adds new search term
              else search_term = %value%
              }
            if address
                {
                search_term =
                this_search := path
                x := playlist
                GetTabSettings(0)					; load previous tab settings from cache
                playlist := x
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
                filt := 0
                }
            if search_term						; search text from link or search box
                {
                folder := search_term
                GetTabSettings(0)					; load cached tab settings
                this_search := search_folders
                if (search_term && !InStr(this_search, path))		; search this folder, then search paths
                    this_search = %path%|%this_search%			; search this folder only
                if (search_term && !InStr(sort_list, command))
                    {
                    view := 0
                    toggles =
                    sort = Duration
                   }
                filt := 0
                }
            if (command == "Filt")					; alpha letter
                filt := value
            page := 1
            if (InStr(sort_list, command))				; sort filter
                {
                filt := 0
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
        if !this_search
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
            SetTimer, indexer, -1000, -2
        }


    RenderPage()							; construct web page from media list
        {
        Critical							; stop key interrupts
        if !path
            return
        title := folder
        title_s := SubStr(title, 1, 20)
        speed := Setting("Default Speed")
        FileRead, style, %inca%\inca - css.css
        FileRead, java, %inca%\inca - js.js
        FileRead, ini, %inca%\inca - ini.ini
        ini := StrReplace(ini, "`r`n", "|")				; java cannot accept in strings
        ini := StrReplace(ini, "'")
        ini := StrReplace(ini, "&")
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        list_size := 0
        type = video							; prime for list parsing
        page_w := Setting("Page Width")
        size := Setting("Page Size")
        fs := Setting("Full Screen")
        mpv_player := Setting("External Player")
        if search_term
          size = 1000
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
        rev:=rec:=img:=vid:=
        if InStr(toggles, "Reverse")
          rev = style='color:red'
        if InStr(toggles, "Recurse")
          rec = style='color:red'
        if InStr(toggles, "Images")
          img = style='color:red'
        if InStr(toggles, "Videos")
          vid = style='color:red'
        Loop, Parse, subfolders, `|
            {
            StringTrimRight, x, A_Loopfield, 1
            array := StrSplit(x,"\")
            x := array.MaxIndex()
            fname := array[x]
            subs = %subs% <div><table><tr><td><a onmousedown='navigator.clipboard.writeText("#Path##"+selected+"#%A_Loopfield%")' style="width:80`%; margin-left:4.2em; border-radius:1em; white-space:nowrap; overflow:hidden; border-radius:1em; text-overflow:ellipsis">%fname%</a></td></tr></table></div>`r`n`r`n
            }
        if subs
            subs = %subs%<hr style='height:1em; width:77`%; margin-left:0; outline:none; border:0 none; border-top:0.1px solid #826858'></hr>`r`n`r`n

        header_html = <!--`r`n%view%>%last_view%>%page%>%filt%>%sort%>%toggles%>%this_search%>%search_term%>%path%>%folder%>%playlist%>%last_media%>`r`n%page_media%`r`n-->`r`n<!doctype html>`r`n<html>`r`n<head>`r`n<meta charset="UTF-8">`r`n<title>Inca - %title%</title>`r`n<meta name="viewport" content="width=device-width, initial-scale=1">`r`n<link rel="icon" type="image/x-icon" href="file:///%inca%\apps\icons\inca.ico">`r`n</head>`r`n

        panel_html = <body id='myBody' class='container' onload="spool(event, '', '%ini%', '%toggles%', '%sort%', %filt%, %page%, %pages%, %view%, %speed%, %fs%, %mpv_player%, '%path%')">`r`n
<div oncontextmenu='context(event)' style='padding-bottom:40em'>`r`n`r`n
<span id="myContext" class='context'>`r`n
<a onmousedown='navigator.clipboard.writeText("#Settings###"+selected+"#")'>. . .</a>`r`n
<a id='myThumbs' onmousedown='thumbs()' onwheel="wheelEvents(event, id, this)">Thumbs</a>`r`n
<a id="myFav" onmousedown='navigator.clipboard.writeText("#Favorite#" + time + "#" + index + ",#")'>Fav</a>`r`n
<a onclick='selectAll()'>Select</a>`r`n
<a id='myDelete' onmousedown='release(); if (selected) {navigator.clipboard.writeText("#Delete##"+selected+"#")} else {navigator.clipboard.writeText("#Delete##"+index+",#")}'>Delete</a>`r`n
<a id='myRename' onmouseover='rename()' onmousedown='release(); navigator.clipboard.writeText("#Rename#"+inputbox.value+"#"+selected+"#")'>Rename</a>`r`n
<a onmousedown='navigator.clipboard.writeText("#Join##" + selected + "#")'>Join</a>`r`n
<a onclick='cut()'>Cut</a>`r`n<a onmousedown='paste()'>Paste</a>`r`n</span>`r`n`r`n
<span id="myContext2" class='context'>`r`n
<a id='myMute' onclick='mute()' onwheel="wheelEvents(event, id, this)">Mute</a>`r`n
<a id="Seek" onclick='if(media.paused){media.play()} else {media.pause()} context(event)' onwheel="wheelEvents(event, id, this)">Seek</a>`r`n
<a id="mySpeed" class='stat' onwheel="wheelEvents(event, id, this)"></a>`r`n
<a id="mySkinny" onwheel="wheelEvents(event, id, this)">1</a>`r`n
<a id='myLoop' onclick="loop()">Loop</a>`r`n
<a id='myFav2' onmousedown='navigator.clipboard.writeText("#Favorite#" + time + "#" + index + ",#")'>Fav</a>`r`n
<a id="myCapnav" onclick="editCap()">Cap</a>`r`n<a onclick="cue = Math.round(media.currentTime*10)/10">Cue</a>`r`n
<a id="myMp4" onmousedown="navigator.clipboard.writeText('#mp4#' + time + '#' + index + ',#' + cue)">mp4</a>`r`n
<a id="myMp3" onmousedown="navigator.clipboard.writeText('#mp3#' + time + '#' + index + ',#' + cue)">mp3</a>`r`n</span>`r`n`r`n
<div id="myModal" class="modal" onwheel="wheelEvents(event, id, this)">`r`n
<div><video id="myMedia" class="media" type="video/mp4" muted></video>`r`n
<span id="mySeekBar" class='seekbar'></span>`r`n
<textarea id="myCap" class="caption" onmouseenter="over_cap=true" onmouseleave="over_cap=false"></textarea>`r`n
<span><video id='mySeek' class='seek' type="video/mp4"></video></span></div></div>`r`n`r`n
<div style="width:%page_w%`%; margin:auto">`r`n
<div class='panel' id='myPanel' onwheel="wheelEvents(event, '', this)"></div>`r`n`r`n
<div id='myRibbon' class='ribbon'>`r`n
<a onmousedown="navigator.clipboard.writeText('#Recurse###')" %rec%>Recurse</a>`r`n
<a onmouseover="spool(event, 'Fol')">Fol</a>`r`n
<a onmouseover="spool(event, 'Fav')">Fav</a>`r`n
<a onmouseover="spool(event, 'Music')">Music</a>`r`n
<a onmouseover="spool(event, 'Search')" onwheel="wheelEvents(event, 'Search', this)">Search</a>`r`n
<a onmousedown="navigator.clipboard.writeText('#Images###')" %img%>Pics</a>`r`n
<a onmousedown="navigator.clipboard.writeText('#Videos###')" %vid%>Vids</a>`r`n</div>`r`n`r`n
<div style='display:flex'>`r`n
<input id='myInput' onmouseover='panel.style.opacity=null' class='searchbox' type='search' value='%search_term%'>`r`n
<a class='searchbox' onmousedown="navigator.clipboard.writeText('#SearchAdd#'+inputbox.value+'#'+selected+'#')" style='width:4`%; border-radius:0 1em 1em 0'>+</a></div>`r`n`r`n
<div class='ribbon'>`r`n
<a id='myPath' onmousedown="navigator.clipboard.writeText('#Up###%path%')" style='font-size:1.4em'>&#8678`r`n
<a onmousedown="navigator.clipboard.writeText('#Orphan#%folder%##%path%')" style='font-size:1.7em; transform:none'>%title_s%</a>`r`n
<a style='font-size:1.3em; transform:none'>%list_size%</a>`r`n
<a id='mySort' onmousedown="navigator.clipboard.writeText('#'+sort+'#'+sort+'##')" %rev% style='width:7em' onwheel="wheelEvents(event, id, this)">%sort%</a>`r`n
<a id='myFilt' onmousedown="navigator.clipboard.writeText('#Filt#'+filt+'##')" onwheel="wheelEvents(event, id, this)">All</a>`r`n
<a href="%title%.htm#Page" id="myPage" onwheel="wheelEvents(event, id, this)">%pg%</a></div>`r`n`r`n

        FileDelete, %inca%\cache\html\%folder%.htm
        html = %header_html%%style%%panel_html%%subs%%html%</div></div>`r`n
        StringReplace, html, html, \, /, All
        FileAppend, %html%%java%</body>`r`n</html>`r`n, %inca%\cache\html\%folder%.htm, UTF-8
        LoadHtml()
        PopUp("",0,0,0)
        }


    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        if ((cap_size := view / 12) > 1.6)
          cap_size := 1.6
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
            if start
              IfExist, %inca%\cache\posters\%media% %start%.jpg
                thumb = %inca%\cache\posters\%media% %start%.jpg
            if (!start && !playlist)
              if (dur > 60)
                start := 20 + (4 * (dur - 20)/200)
              else start := 4 * dur / 200
            }
        FileRead, skinny, %inca%\cache\widths\%media%.txt
        if !skinny
          skinny := 1
        transform = transform:scaleX(%skinny%);
        FileRead, cap, %inca%\cache\captions\%media%.srt
        caption := StrSplit(cap, "|").1
        if caption
          caption = <a onmousedown='navigator.clipboard.writeText("#EditCap#%media%##")' style="color:#826858; display:block; font-size:%cap_size%em">%caption%</a>
        cap := StrReplace(cap, "`r`n", "|")
        cap := StrReplace(cap, ",", "§")
        cap := StrReplace(cap, "'", "±")
        StringReplace, cap,cap,",±, All
        if (dur && (type == "video" || type == "audio"))
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
        start := Round(start+0.1,2)
        max_height := view


; FileRead, dur, %inca%\cache\durations\%media%.txt
; random, start, 0, dur-5
; start := Round(start,2)
; poster = #t=%start%

        if !view							; list view
            {
            entry = <div><table><tr><td id="thumb%j%" style="position:absolute; margin-left:3.5em">`r`n<a id="sel%j%"><video id="media%j%" class='thumblist' style="width:10em; %transform%" onmousedown='navigator.clipboard.writeText("#Media#%j%##%start%")' onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, '%cap%', event)" onmouseout='over_media=false; this.load()' %poster% src="file:///%src%" type="video/mp4" preload='none' muted></video></a></tr></table><table style="table-layout:fixed; width:100`%; font-size:0.9em"><tr><td style="width:4em; text-align:center"><span style="border-radius:9px; color:#777777">%sort_name%</span></td><td style="width:4em; text-align:center">%dur%</td><td style="width:3em; text-align:center">%size%</td><td style="width:4em; text-align:center">%ext%</td>%fold%<td><div id="title%j%" onclick="select(%j%)" style="width:80`%; border-radius:1em; padding-left:0.5em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">%media%</div></td></tr></table></div>`r`n`r`n
            }
        else								; thumbnail view
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
	        entry = <a onmousedown='navigator.clipboard.writeText("#Media#%j%##")'><div style="display:inline-block; width:88`%; color:#555351; transition:color 1.4s; margin-left:8`%; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_name% &nbsp;&nbsp;%media%</div></a><textarea rows=%rows% style="display:inline-block; overflow:hidden; margin-left:8`%; width:88`%; background-color:inherit; color:#826858; font-size:1.2em; font-family:inherit; border:none; outline:none;">%str2%</textarea>`r`n`r`n
                }
            else entry = <div id="thumb%j%" class="thumb_container" style="width:%view%em; height:%max_height%em; margin-right:3em; margin-bottom:6em">`r`n<div id="title%j%" onclick="select(%j%)" style="display:grid; align-content:end; text-align:center; padding:0.3em; color:#555351; border-radius:1.5em; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:0.85em; height:2em">%media%</div>`r`n<a id="sel%j%">`r`n<video class="media" id="media%j%" style="position:inherit; %transform%; object-fit:contain; max-width:100`%; max-height:100`%" onmousedown='navigator.clipboard.writeText("#Media#%j%##%start%")' onmouseover="overThumb(%j%, %skinny%, '%type%', %start%, '%cap%', event)" onmouseout='over_media=false; this.pause()' onmousemove='over_media=true; index=%j%' src="file:///%src%" %poster% preload='none' muted type="video/mp4"></video>`r`n</a>%caption%<div></div></div>`r`n`r`n
            }
        return entry
        }

    Spool(input, count, start)					; sorting and search filters
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
            if (!Mod(count,10000) && !search_term)
                PopUp(count,0,0,0)
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
              if (filt && sort == "Alpha" && 1st_char < Chr(filt+65))
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
              if (filt && sort_date/30 < filt)
                return
              }
            else if (sort == "Size")
              {
              if (med == "video")
                FileGetSize, list_id, %input%, M
              else FileGetSize, list_id, %input%, K
              sort_name := Round(list_id)
              if (filt && list_id < filt*10)
                return
              }
            else if (sort == "Duration")
              {
              FileRead, list_id, %inca%\cache\durations\%filen%.txt
              if (filt && list_id/60 < filt)
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
        else if !inca_tab
            run, %new_html%						; open a new web tab
        else if (folder == previous_tab)				; just refresh existing tab
            send, {F5}
        else 
            {
            Clipboard := new_html
            send ^l
            send ^v
            sleep 34
Clipboard = 
            send, {Enter}
            }
; ReadAddressBar(new_html)					; re-load tab
        }


    GetTabSettings(extended)						; from .htm cache file
        {
        page := 1							; default view settings
        filt := 1
        toggles =
        playlist =
        last_media =
        if (InStr(path, "\fav\") || InStr(path, "\music\"))
          sort = Alpha
        else sort = Shuffle
        FileReadLine, array, %inca%\cache\html\%folder%.htm, 2	; embedded page data
        if array
            {
            StringReplace, array, array, /, \, All
            array := StrSplit(array,">")
            view := array.1
            last_view := array.2
            if (!view && view == last_view)
              view := 10
            page := array.3
            filt := array.4
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
        select := list_id
        source = %target%
        list_id := value
        GetMedia(0)
        if (source == target)
          return
        plist = %path%%folder%.m3u
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, str, `n, `r
          if A_LoopField
            {
            if (A_LoopField == source && !flag2) ; 
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
        Loop, Parse, selected, `/
            {
            list_id := A_LoopField
            if timer
              popup = Move - %media%
            else popup = Copy - %media%
            if (InStr(address, "\inca\"))
              popup = Added - %media%
            PopUp(popup,0,0,0)
            if GetMedia(0)
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
                if timer						; not long click
                  FileMove, %src%, %address%%z%				; move file to new folder
                else FileCopy, %src%, %address%%z%
                }
            }
        if timer
          if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
            DeleteEntries(0)
        }  


    DeleteEntries(trash)
        {
        plist = %path%%folder%.m3u
        IfNotExist, %plist%
          return
        FileRead, str, %plist%
        FileDelete, %plist%
        Loop, Parse, selected, `/
         if A_LoopField
          {
          list_id := A_LoopField
          GetMedia(0)
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


    RenameFiles(new_name)
        {
        FileMove, %src%, %media_path%\%new_name%.%ext%			; FileMove = FileRename
        SetTimer, indexer, -1000, -2
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
;        WinClose
        run, notepad %inca%\inca - css.css
        return

        settingsButtonahk:
;        WinClose
        run, notepad %inca%\inca - ahk.ahk
        return

        settingsButtonJava:
;        WinClose
        run, notepad %inca%\inca - js.js
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
        IniWrite,%search%,%inca%\inca - ini.ini,Settings,Search
        IniWrite,%fol%,%inca%\inca - ini.ini,Settings,Fol
        IniWrite,%fav%,%inca%\inca - ini.ini,Settings,Fav
        IniWrite,%music%,%inca%\inca - ini.ini,Settings,Music
        IniWrite,%search_folders%,%inca%\inca - ini.ini,Settings,search_folders
        IniWrite,%index_folders%,%inca%\inca - ini.ini,Settings,index_folders
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
        IniRead,index_folders,%inca%\inca - ini.ini,Settings,index_folders
        IniRead,fol,%inca%\inca - ini.ini,Settings,Fol
        IniRead,search,%inca%\inca - ini.ini,Settings,Search
        IniRead,fav,%inca%\inca - ini.ini,Settings,Fav
        IniRead,music,%inca%\inca - ini.ini,Settings,Music
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



    Indexer:								; update thumbs and posters in cache
      Critical Off
      if index_folders
        Loop, Parse, index_folders, `|
          Loop, Files, %A_LoopField%*.*, R
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
            if (!dur && (med == "video" || med == "audio"))
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
            create =
            IfNotExist, %inca%\cache\posters\%filen%.jpg
              create = 1
            IfNotExist, %inca%\cache\thumbs\%filen%.jpg
              create = 1
            if create
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
                        runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\temp1\%y%.jpg",, Hide
                    t += (dur / 200)
                    }
                FileCopy, %inca%\cache\temp1\1.jpg, %inca%\cache\posters\%filen%.jpg, 1
                IfNotExist, %inca%\cache\thumbs\%filen%.jpg
                    Runwait %inca%\apps\ffmpeg -i %inca%\cache\temp1\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
                }
            }
        FileRemoveDir, %inca%\cache\temp1, 1
        GuiControl, Indexer:, GuiInd
        return

