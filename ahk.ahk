 

	; Browser Based File Explorer - Windows
	; generates web pages of your media
	; browser messages back using clipboard - see ProcessMessage()


	#NoEnv
	#UseHook, On
	SetWinDelay, 0
	SetKeyDelay, 0
	SetBatchLines -1
	SetTitleMatchMode, 2
	GroupAdd, Browsers, Google Chrome	; supported browsers
	GroupAdd, Browsers, Mozilla Firefox
	GroupAdd, Browsers, ahk_exe brave.exe
	GroupAdd, Browsers, ahk_exe msedge.exe
	GroupAdd, Browsers, ahk_exe opera.exe

	#SingleInstance force			; one program instance only
	#MaxHotkeysPerInterval 999		; allow fast spinning wheel
	SetWorkingDir, %A_ScriptDir%		; consistent start directory

        Global profile				; base user folder
        Global sortList				; eg. by date, size, alpha
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
        Global index = 0			; scroll to index
        Global messages				; between browser and this program
        Global playing =			; media is playing in browser
        Global gesture
        Global lastClip				; preserve clipboard
        Global allFav				; all favorite shortcuts consolidated
        Global showSubs
        Global lastMedia
        Global panelPath
        Global lastStatus
        Global mpvXpos				; external mpv player
        Global mpvYpos
        Global mpvWidth
        Global mpvHeight
        Global mpvPID
        Global scrollText
        Global textCount


    main:
      initialize()				; set environment
      WinActivate, ahk_group Browsers
      sleep 333
      if !GetBrowser()
        Clipboard = #Path###%profile%\Pictures\
      Clipboard()				; process clipboard message
      SetTimer, TimedEvents, 100, 2		; every 100mS
      return					; wait for mouse/key events


    ~Esc up::
      ExitApp

    RButton::
      panelPath =				; reset panel path
    ~LButton::					; click events
    ~MButton::
      MouseDown()
      return

    MButton up::
      if (mpvPID && !gesture)			; external mpv player
        {
        WinActivate, ahk_class mpv
        if (A_TickCount > timer)		; long click
          send, <				; playlist previous
        else send, >				; playlist next
        }
      return

    ~WheelUp::
      if mpvPID					; mpv seek
        send, 2
      return
    ~WheelDown::
      if mpvPID
        send, 3
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
        send, ^w				; close tab
      else send, !{F4}				; or close app
      return
    Xbutton1 up::
      SetTimer, Timer_up, Off
      if (A_TickCount > timer)
        return
      if mpvPID					; mpv external player
        {
        Process, Close, mpv.exe
        if incaTab
          WinActivate, ahk_group Browsers
        sleep, 100
        send, {Pause}				; close java media player
        }
      else IfWinExist, ahk_class OSKMainClass
        send, !0				; close onscreen keyboard
      else if WinActive("ahk_class Notepad")
        Send, {Esc}^s^w
      else if incaTab
        send, {Pause}				; close java media player
      else send, {Xbutton1}
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
        if (A_TickCount > timer)
          longClick = true
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P") && !GetKeyState("MButton", "P"))
          {
          if (click=="RButton" && !gesture)
            send, {RButton}
          Gui PopUp:Cancel
          if (mpvPID && click=="LButton" && !gesture)
            {
            WinActivate, ahk_class mpv
            sleep 100
            send, {Space}			; toggle pause
            }
          break
          }
        if (Abs(x)+Abs(y) > 6)			; gesture started
          {
          gesture := 1
          MouseGetPos, xpos, ypos
          if (xpos < 15)			; gesture at screen edges
              xpos := 15
          if (xpos > A_ScreenWidth - 15)
              xpos := A_ScreenWidth - 15
          MouseMove, % xpos, % ypos, 0
          Gesture(x, y)
          }
        if (!gesture && longClick)		; click timout
          {
          if (click=="LButton" && mpvPID)	; mpv external player
            {
            Process, Close, mpv.exe
            send, !{Pause}			; signal java to show thumbSheet
            }
          else if (click=="RButton")
            if mpvPID 
              RunWait %COMSPEC% /c echo seek 0 absolute exact > \\.\pipe\mpv,, hide && exit
            else send, +{Pause}			; signal to java long RClick
          else if (A_Cursor == "IBeam")
            {
            longClick =
            if WinActive("ahk_group Browsers")
              {
              clp := Clipboard
              Clipboard =
              send, ^c
              ClipWait, 0.1
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
        if (incaTab && folder != incaTab)				; has inca tab changed
            {
            subfolders =
            folder := incaTab
            GetTabSettings(1)						; get htm parameters
            FileRead, list, %inca%\cache\lists\%incaTab%.txt
            if !list
              CreateList(1)
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
        index := 0
        scrollText := 0
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
            getMedia(StrSplit(selected, ",").1)
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
        sleep 100
        if (command == "Settings" || command == "EditCue" || command == "Media" && type=="document")
          IfWinExist, ahk_class Notepad
            WinActivate, ahk_class Notepad
        }


    ProcessMessage()							; messages from java/browser
        {
        PopUp(".",0,0,0)						; . message received from browser
        if (command == "Settings")					; open inca source folder
            {
            Run, %inca%\
            sleep 400
            Winactivate, ahk_class CabinetWClass
            }
        if (command == "Text")						; save browser text editing
            {
            getMedia(selected)
            FileDelete, %src%
            FileAppend, %address%, %src%, UTF-8
            scrollText := value						; textarea scrollY
            if (sort!="Date")
              index := selected
            else index:=1						; textarea index id
            reload := 3
            }
        if (command == "Move")						; move entry within playlist
            {
            MoveEntry()
            selected =
            reload := 3							; reload web page
            }
        if (command == "Rename")					; rename media
            {
            if (StrLen(value) < 4)
                popup = too small
            if !getMedia(StrSplit(selected, ",").1)
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
            {
            selected =
            index := 1							; scroll to media 1
            reload := 2
            }
        if (command == "Index")						; index folder (create thumbsheets)
            {
            if selected							; force index of selected media
              {

              index(src,1)
              if playlist
                Runwait, %inca%\cache\apps\ffmpeg.exe -ss %seek% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%seek%.jpg",, Hide
              reload := 2
              selected =
              }
            else SetTimer, indexPage, -100, -2
            }
        if (command == "History")					; maintain play history
            {
            if getMedia(StrSplit(selected, ",").1)
              if (!InStr(path, "\inca\music\") && folder != "History" && lastMedia != src)
                FileAppend, %src%|%value%`r`n, %inca%\fav\History.m3u, UTF-8
            lastMedia := src
            }
        if (command == "Close")						; close external mpv player
            if mpvPID
              Process, Close, mpv.exe
        if (command == "Media")						; browser tells inca to play media
            {
            id := StrSplit(selected, ",").1
            if !getMedia(id)
              return
            mpvid := id-1
            if !mpvXpos
              geometry = --geometry=+50`%+50`%
            else geometry = --geometry=+%mpvXpos%+%mpvYpos%
            if !mpvWidth
              x := 800
            else if (mpvWidth > mpvHeight)
              x := mpvWidth
            else x := mpvHeight
            autofit = --autofit=%x%x%x%
            start := Round(StrSplit(address,"|").1,2)
            skinny := Round(StrSplit(address,"|").2,2)
            rate := Round(StrSplit(address,"|").3,2)
            mute := 1*StrSplit(address,"|").4
            if (!skinny || skinny != 1)
              skinny := -1*(1-skinny)
            else skinny=
            if (rate != 1)
              speed = --speed=%rate%
            else speed =
            if mute
              mute = yes
            else mute = no
            if !start
              start = 0.0
            playing = true
            start := Time(start)
            if (ext=="pdf")
              Run, %src%
            else if (type=="m3u" || type=="document")
              if (ext=="rtf" || ext=="doc")
                Run, %src%
              else Run, % "notepad.exe " . src
            else if (type=="video")
              {
              Loop, Parse, list, `n, `r
                {
                source := StrSplit(A_LoopField, "/").2
                IfExist, %source%
                plist = %plist%%source%`r`n
                }
              FileDelete, %inca%\cache\lists\mpvPlaylist.m3u
              FileAppend, %plist%, %inca%\cache\lists\mpvPlaylist.m3u, UTF-8
              if mpvPID							; mpv is open
                {
                RunWait %COMSPEC% /c echo playlist-play-index %mpvid% > \\.\pipe\mpv,, hide && exit
                sleep 24
                RunWait %COMSPEC% /c echo seek %start% absolute exact > \\.\pipe\mpv,, hide && exit
                }
              else Run %inca%\cache\apps\mpv --start=%start% %autofit% %geometry% %speed% --mute=%mute% --playlist-start=%mpvid% --input-ipc-server=\\.\pipe\mpv "%inca%\cache\lists\mpvPlaylist.m3u" 
              sleep 100
              if skinny
                RunWait %COMSPEC% /c echo add video-scale-x %skinny% > \\.\pipe\mpv,, hide && exit
              WinActivate, ahk_class mpv
              }
            }
        if (command == "EditCue")					; open media cues in notepad
            {
            if !selected 
              return
            FileRead, cues, %inca%\cache\cues\%media%.txt
            StringTrimRight, cues, cues, 2				; remove end `r`n
            Sort, cues, NZ						; sort by time entry
            FileDelete, %inca%\cache\cues\%media%.txt
            FileAppend, %cues%`r`n, %inca%\cache\cues\%media%.txt
            id := StrSplit(selected, ",").1
            if !value							; current media time
              value = 0.00
            if (!address)						; cue time
              {
              if (value != "1" || address == value)
                FileAppend, %value%|cap|`r`n, %inca%\cache\cues\%media%.txt, UTF-8
              run, %inca%\cache\cues\%media%.txt
              }
            else 
              {
              FileAppend, %address%|goto|%value%`r`n, %inca%\cache\cues\%media%.txt, UTF-8
              Popup("Done . . .",1000,0,0)
              }
            }
        if (command == "jpg")
          if (type == "video")
            run, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y "%profile%\Downloads\%media% @%value%.jpg",, Hide
          else run, %inca%\cache\apps\ffmpeg.exe -i "%src%" -y "%profile%\Downloads\%media% @%value%.jpg",, Hide
        if (command == "mp3" || command == "mp4")
            {
            if (selected && !address)
              {
              Loop, Parse, selected, `,
                if getMedia(A_LoopField)
                  {
                  dest = %mediaPath%\%media% - Copy.%command%
                  run, %inca%\cache\apps\ffmpeg.exe -i "%src%" "%dest%",,Hide
                  }
              }
            else if address						; cue point time
              {
              x = @%value%						; converts value to string
              y = %mediaPath%\%media% %x%.%command%
              if (!address || value == address)
                run, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" "%y%",,Hide
              else if (address-value>0.01 && address-value<0.2)
                run, %inca%\cache\apps\ffmpeg.exe -ss 0 -to %address% -i "%src%" "%y%",,Hide
              else if (address < value)
                run, %inca%\cache\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%y%",,Hide
              else run, %inca%\cache\apps\ffmpeg.exe -ss %value% -to %address% -i "%src%" "%y%",,Hide
              }
            selected =
            Popup("Creating . . .",1000,0,0)
            }
        if (command == "Favorite")					; add media favorite to New.m3u
            {
            if !selected
              return
            if !value
              value = 0.0
            Loop, Parse, selected, `,
              if getMedia(A_Loopfield)
                {
                FileAppend, %src%|%value%`r`n, %inca%\fav\new.m3u, UTF-8
                Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
                }
            popup("Added - New",444,0,0)
            AllFav()							; update consolidated fav list
            StrReplace(selected, ",",, x)
            selected =
            if (x>1)
              reload:=2
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
            if panelPath						; R Click was over top panel
              {
              x  =  %panelPath%|
              if InStr(panelPath, "\fav\")				; delete fav entry
                {
                FileRecycle, %panelPath%
                fav := StrReplace(fav, x)
                IniWrite,%fav%,%inca%\ini.ini,Settings,Fav
                }
              else if InStr(panelPath, "\music\")			; delete music entry
                {
                FileRecycle, %panelPath%
                music := StrReplace(music, x)
                IniWrite,%music%,%inca%\ini.ini,Settings,Music
                }
              else if !InStr(panelPath,"\")				; delete search term
                {
                search := StrReplace(search, x)
                IniWrite,%search%,%inca%\ini.ini,Settings,Search
                }
              else							; delete fol entry
                {
                Loop, Files, %panelPath%\*.*, FR			; is folder empty
                  {
                  FileGetSize, size, %A_LoopFileFullPath%, K
                  if size
                    {
                    popup("Must be empty",800,0,0)
                    return
                    }
                  }
                fol := StrReplace(fol, x)
                IniWrite,%fol%,%inca%\ini.ini,Settings,Fol
                subfolders := StrReplace(subfolders, panelPath)
                if (path == panelPath)
                  {
                  path := SubStr(panelPath, 1, InStr(panelPath, "\", False, -1))
                  StringTrimRight, str, path, 1
                  SplitPath, str,,,,folder
                  }
                FileRecycle, %panelPath%
                if ErrorLevel
                  PopUp("Error . . .",1000,0.34,0.2)                  
                }
              LoadSettings()
              }
            else if selected
              {
              if playlist
                DeleteEntries(1)
              else 
                {
                popup = Deleted
                Loop, Parse, selected, `,
                  if getMedia(A_LoopField)
                    {
                    FileRecycle, %src%
                    if ErrorLevel
                      popup = Error . . .
                    }
                }
              popup(popup,0,0,0)
              reload := 3
              }
            reload := 1
            return	
            }
        if (command == "Skinny")					; update any media width edits
            {
            skinny := Round(value,2)
            cue := Round(address,2)					; cue time for entry (not global)
            if !cue
              cue = 0.00
            if skinny is not number
              skinny := 1.00
            if (skinny < -1.2)
              skinny = -1.20
            if (skinny > 1.5)
              skinny = 1.50
            if (!skinny || (skinny >= 0.98 && skinny <= 1.02))
              skinny := 1.00
            skinny = %cue%|skinny|%skinny%				; create new mask string
            FileRead, cues, %inca%\cache\cues\%media%.txt
            last := cues
            if cues
              Loop, Parse, cues, `n, `r					; each line of cues
                {
                array := StrSplit(A_LoopField, "|")			; split each entry
                x := array.3						; the entry value
                sk = %cue%|skinny|%x%					; remember existing mask string
                if (!array.1 && array.2 == "skinny")			; has "0.00|skinny|" prefix
                  cues := StrReplace(cues, sk, skinny)			; use masks to replace value
                }
             if (skinny && !InStr(cues, "0.00|skinny"))			; if no entries exist
               cues = %skinny%`r`n%cues%
             if (InStr(cues, "0.00|skinny|1.00`r`n"))			; if entry is just the default
                cues := StrReplace(cues, "0.00|skinny|1.00`r`n")	; remove entry
            if (cues != last)						; if changed, replace cues file
              {
              FileDelete, %inca%\cache\cues\%media%.txt
              if cues
                FileAppend, %cues%, %inca%\cache\cues\%media%.txt
              }
            }
        if (command == "Rate")						; update any media speed edits
            {
            rate := Round(value,2)
            cue := Round(address,2)					; cue time for entry (not global)
            if !cue
              cue = 0.00
            if rate
              rate = %cue%|rate|%rate%
            FileRead, cues, %inca%\cache\cues\%media%.txt
            last := cues
            if cues
              Loop, Parse, cues, `n, `r					; each line of cues
                {
                array := StrSplit(A_LoopField, "|")			; split each entry
                x := array.3						; the entry value
                ra = %cue%|rate|%x%
                if (!array.1 && rate && array.2 == "rate")
                  cues := StrReplace(cues, ra, rate)
                }
             if (rate && !InStr(cues, "0.00|rate"))			; add new entry
               cues = %rate%`r`n%cues%
             if (InStr(cues, "0.00|rate|1.00`r`n"))
                cues := StrReplace(cues, "0.00|rate|1.00`r`n")
            if (cues != last)						; if changed, replace cues file
              {
              FileDelete, %inca%\cache\cues\%media%.txt
              if cues
                FileAppend, %cues%, %inca%\cache\cues\%media%.txt
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
              if getMedia(A_LoopField)
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
        if (command == "Add" && address)
            {
            popup = New Playlist
            if (InStr(playlist, "music\") && !InStr(music, address))		; new music playlist
              {
              music = %music%%inca%\music\%address%.m3u|
              FileAppend,,%inca%\music\%address%.m3u, utf-8
              IniWrite, %music%, %inca%\ini.ini,Settings,Music
              }
            else if (InStr(playlist, "fav\") && !InStr(fav, address))		; new fav playlist
              {
              fav = %fav%%inca%\fav\%address%.m3u|
              FileAppend,,%inca%\fav\%address%.m3u, utf-8
              IniWrite, %fav%, %inca%\ini.ini,Settings,Fav
              }
            else if !searchTerm							; new folder
              {
              popup = New Folder
              fol = %fol%%path%%address%\|
              FileCreateDir, %path%\%address%
              IniWrite, %fol%, %inca%\ini.ini,Settings,Fol
              }
            else
              {
              popup = New Search Term
              StringUpper, searchTerm, address, T
              search = %search%%searchTerm%|
              StringReplace, search, search, |, `n, All
              Sort, search, u
              StringReplace, search, search, `n, |, All
              }
            IniWrite,%search%,%inca%\ini.ini,Settings,Search
            LoadSettings()
            PopUp(popup,600,0,0)
            reload := 1
            }
        if (command=="Filt"||command=="Path"||command=="Search"||command=="SearchBox"||InStr(sortList, command))
            {
            x := StrSplit(address,"|").2				; pointer/index from html panel entry
            y := StrSplit(address,"|").1
            if (y=="subs" && !subfolders)				; browser tab changed - subs invalid
              {
              reload:=1
              return
              }
            if (x && y == "subs")
              address := StrSplit(subfolders,"|")[x]			; uses index to get folder address
            else if (x && y == "fol")
              address := StrSplit(fol,"|")[x]
            else if (x && y == "fav")
              address := StrSplit(fav,"|")[x]
            else if (x && y == "music")
              address := StrSplit(music,"|")[x]
            else if (x && y == "search")
              address := StrSplit(search,"|")[x]
            if (click == "RButton")					; right click over panel
               {
               panelPath = %address%
               return
               }
            if (click == "MButton")					; middle click over panel
              {
              incaTab =							; trigger open new tab
              value =
              }
            if (command == "Path")
              {
              lastMedia := 0
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
		str := StrSplit(path,"\")				; cannot use splitPath
		folder := str[str.MaxIndex()-1]				; in case folder has .com in name
                }
              GetTabSettings(0)						; load previous tab basic settings from cache
              searchTerm =
              searchPath =
              filt := 0
              }
            if (command == "Search" || command == "SearchBox")
              {
              playlist =
              if (command == "SearchBox")
                if longClick
                  address := StrReplace(address, " ", "+")
                else address := StrReplace(address, "+", " ")
              if (strlen(address) < 2)
                return
              searchTerm = %address%
              }
            reload := 1
            if searchTerm						; search text from link or search box
                {
                folder := searchTerm
                GetTabSettings(0)					; load cached tab settings
                searchPath := searchFolders				; default search paths
                Loop, Parse, searchPath, `|
                  if InStr(path, A_LoopField)				; ensure not duplicate paths
                    found = true
                if !found
                   searchPath = %path%|%searchPath%			; add this folder to search path
                if !InStr(sortList, command)
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
            if (w == A_ScreenWidth && folder != incaTab)
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


    RenderPage()							; construct web page from media list
        {
        Critical							; pause key & timer interrupts
        if !path
          return
        foldr =
        mediaList =
        textCount := 0
        x = %folder%\
        if (InStr(fol, x) || playlist)
          showSubs =
        if InStr(subfolders, x)
          showSubs = true
        if (InStr(fol, x) || InStr(subfolders, x))
          {
          if (!showSubs) ; || InStr(fol, x))
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
        if InStr(fol, x) 
          showSubs = 
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
        Loop, Parse, sortList, `|					; html ribbon highlighting
          {
          if InStr(A_LoopField, sort)
            if InStr(toggles, "Reverse")
              x%A_Index% = border-top:0.1px solid salmon
            else x%A_Index% = border-bottom:0.1px solid salmon
          if InStr(toggles, A_LoopField)
            x%A_Index% = color:red
          }
        if searchTerm
          x20 = color:lightsalmon
        else if (!playlist && InStr(fol,folder))
          x21 = color:lightsalmon
        else if (playlist && InStr(path,"\music\"))
          x22 = color:lightsalmon
        else if (playlist && InStr(path,"\fav\"))
          x23 = color:lightsalmon
        if playlist
          order = List
        panelList =							; next sections fills top panel element
        scroll = Fol							; for scroll to 'fol' in top panel
        if searchTerm
          {
          st := searchTerm
          x24=All
          }
        else
          {
          st = %folder%
          if InStr(path, "\inca\fav\")
          scroll = Fav
          if InStr(path, "\inca\music\")
            scroll = Music
          if showSubs
            scroll = Sub
          }
        x:=SubStr(searchTerm, 1, 1)
        stringUpper, x, x
        if x is alpha
        if searchTerm
          {
          scroll = my%x%
          offset = `;%A_Space%panel.scrollBy(0,-250)
          }

        if subfolders
          container = <div id='Sub'></div>`n
        Loop, Parse, subfolders, `|
            {
            StringTrimRight, x, A_Loopfield, 1
            array := StrSplit(x,"\")
            x := array.MaxIndex()
            fname := array[x]
            if (array[x] == folder)
              container = %container%<c class='p2' style='color:lightsalmon' onmousedown="inca('Path','','','subs|%A_Index%')">%fname%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path','','','subs|%A_Index%')">%fname%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if (subfolders && container)
          fill(container)

        container = <div id='Fol' style='font-size:2em; color:#ffa07ab0; margin:0.8em; text-align:center'>&#x1F4BB;&#xFE0E;</div>`n
        container := fill(container)
        Loop, Parse, fol, `|
          if A_LoopField
            {
            StringTrimRight, y, A_Loopfield, 1
            SplitPath, y,,,,x
            if (x == folder)
              container = %container%<c class='p2' style='color:salmon' onmousedown="inca('Path','','','fol|%A_Index%')">%x%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path','','','fol|%A_Index%')">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        container = <div id='Fav' style='font-size:1.8em; color:#ffa07ab0; margin:0.8em; text-align:center'>&#10084;</div>`n
        container := fill(container)
        Loop, Parse, fav, `|
          if A_LoopField
            {
            SplitPath, A_Loopfield,,,,x
            if (x == folder)
              container = %container%<c class='p2' style='color:salmon; font-size:0.9em; margin-left:0.2em' onmousedown="inca('Path','','','fav|%A_Index%')">%x%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path','','','fav|%A_Index%')">%x%</c>`n
            if !Mod(A_Index,4)
              container := fill(container)
            }
        if container
          fill(container)

        container = <div id='Music' style='font-size:2em; color:#ffa07ab0; margin:0.8em; text-align:center'>&#x266B;</div>`n
        container := fill(container)
        Loop, Parse, music, `|
          if A_LoopField
            {
            SplitPath, A_Loopfield,,,,x
            if (x == folder)
              container = %container%<c class='p2' style='color:salmon' onmousedown="inca('Path','','','music|%A_Index%')">%x%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Path','','','music|%A_Index%')">%x%</c>`n
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
              container = <div id='my%x%' style='font-size:2.2em; font-weight:bold; color:#ffa07ab0; text-align:center'>%x%</div>`n
              container := fill(container)
              count := 0
              }
            ch := x
            count+=1
            if (searchTerm == A_Loopfield)
              container = %container%<c class='p2' style='color:salmon' onmousedown="inca('Search','','','search|%A_Index%')">%A_Loopfield%</c>`n
            else container = %container%<c class='p2' onmousedown="inca('Search','','','search|%A_Index%')">%A_Loopfield%</c>`n
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
x = %searchTerm%|
if (searchTerm && !InStr(search, x))
  add = Add
if subfolders
  subs = &#8656;

header = <!--, %view%, %page%, %pages%, %filt%, %sort%, %toggles%, %listView%, %playlist%, %path%, %searchPath%, %searchTerm%, , -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" type="image/x-icon" href="file:///%inca%\cache\icons\inca.ico">`n<link rel="stylesheet" type="text/css" href="file:///%inca%/css.css">`n</head>`n`n

body = <body id='myBody' class='container' onload="myBody.style.opacity=1;`n if(document.getElementById('%scroll%')) {%scroll%.scrollIntoView()%offset%} myView.scrollTo(0,1*sessionStorage.getItem('scroll'));`n globals(%view%, %page%, %pages%, '%sort%', %filt%, %listView%, '%selected%', '%playlist%', %index%); if (index) thumb%index%.scrollTo(0,%scrollText%)">`n`n

<div id='myContent' style='position:absolute; width:100`%'>`n`n
<div id='mySelected' class='selected'></div>`n

<div oncontextmenu="if (yw>0.1 && !overText || playing) {event.preventDefault()}">`n`n
<div id='myNav' class='context'>`n
<a id='mySelect' onwheel="wheelEvent(event, id, this)" onmousedown="if (wasMedia||playing) {sel(wasMedia)} else{selectAll()}">Select</a>`n
<a id='myDelete' onwheel="wheelEvent(event, id, this)" onmousedown="if(!event.button) {inca('Delete','',wasMedia)}">Delete</a>`n
<a id='myIndex' onwheel="wheelEvent(event, id, this)" onmousedown="inca('Index','',wasMedia)">Index</a>`n
<span id='myNav2'>
<a id='myFav' onmouseup="if (playing) {x=myPlayer.currentTime.toFixed(1)} else{x=thumb.style.start}; if(!event.button && !longClick) inca('Favorite', x, index)">Fav</a>`n
<a id='myMute' onmouseup='mute()'>Mute</a>`n
<a id='myLoop' onmouseup="looping=!looping">Loop</a>`n
<a id='mySpeed' onwheel="wheelEvent(event, id, this)" onmouseup='togglePause()' onclick="inca('Close')"></a>`n
<a id='mySkinny' onwheel="wheelEvent(event, id, this)" onmouseup='togglePause()' onclick="inca('Close')"></a>`n
<a id='myFlip' onmousedown='flip()'>Flip</a>`n
<a id='myCue' onclick="if(!cue) {if (playing) {myPlayer.pause(); cue=Math.round(myPlayer.currentTime*100)/100} else {inca('EditCue',1,index,cue)}} else {inca('Close'); myPlayer.play()}">Cues</a>`n
<a id='Cap' onmousedown="myPlayer.pause(); inca('EditCue', myPlayer.currentTime.toFixed(2), wasMedia, cue)">caption</a>`n
<a id='Mp3' onmousedown="inca('mp3', myPlayer.currentTime.toFixed(2), index, cue); cue=0; myPlayer.play()">mp3</a>`n
<a id='Mp4' onmousedown="inca('mp4', myPlayer.currentTime.toFixed(2), index, cue); cue=0; myPlayer.play()">mp4</a>`n
<a id='Jpg' onmousedown="inca('jpg', myPlayer.currentTime.toFixed(2), index)"></a></span>`n
</div>`n`n

<div id='myMask' class="mask" onwheel="wheelEvent(event, id, this)">`n</div>
<div><span id='myCap' class='caption'></span>`n
<video id="myPlayer" class='player' type="video/mp4" onmouseover='overMedia=index' onmouseout='overMedia=0' muted onwheel="wheelEvent(event, id, this)"></video>`n
<span id='mySeekbar' class='seekbar'></span>`n
<span><video class='preview' id='myPreview' muted type="video/mp4" onwheel="wheelEvent(event, id, this)"></video></span></div>`n`n

<div id='myView' class='myList' style='padding-left:%page_l%`%; padding-right:%page_r%`%'>`n`n

<div id='myPanel' class='myPanel'>`n <div id='panel' class='panel'>`n`n%panelList%`n</div></div>`n`n

<div class='ribbon' style='height:1.4em; font-size:1.1em; justify-content:center; background:#1b1814; top:-5.8em'>`n
<a style='width:7em; text-align:center; color:salmon; font-weight:bold'>%listSize%</a>`n
<a style='width:1em; text-align:center; color:red' onmouseover="Sub.scrollIntoView(); myView.scrollTo(0,0)">%subs%</a>`n
<a style='width:6em; text-align:center; %x21%' onmousedown="inca('Path','','','fol|1')" onmouseover="Fol.scrollIntoView(); myView.scrollTo(0,0)">&#x1F4BB;&#xFE0E;</a>`n
<a style='width:6em; text-align:center; %x23%' onmousedown="inca('Path','','','fav|1')" onmouseover="Fav.scrollIntoView(); myView.scrollTo(0,0)">&#10084;</a>`n
<a style='width:6em; text-align:center; %x22%' onmousedown="inca('Path','','','music|1')" onmouseover="Music.scrollIntoView(); myView.scrollTo(0,0)">&#x266B;</a>`n
<a id='SearchBox' style='width:5.5em; text-align:center; %x20%' onmousedown="inca('SearchBox','','',myInput.value)" onmouseover='myA.scrollIntoView(); myView.scrollTo(0,0); myInput.focus()' >&#x1F50D;&#xFE0E;</a>`n
<a id='Add' style='font-variant-caps:petite-caps' onmousedown="inca('Add','','',myInput.value)">%add%</a>`n
<input id='myInput' class='searchbox' style='width:70`%; border-radius:1em; font-size:1.1em; font-weight:bold' type='search' value='%st%' onmousemove='getAlpha(event, this)' onmouseover="overText=1; this.focus()" oninput="Add.innerHTML='Add'" onmouseout='overText=0'></div>`n`n

<div id='myRibbon' class='ribbon'>`n
<a id='Type' style='width:4em; %x6%' onmousedown="inca('Type')">Ext</a>`n
<a id='Size' style='min-width:4em; %x5%' onmousedown="inca('Size', filt)" onwheel="wheelEvent(event, id, this)">Size</a>`n
<a id='Duration' style='min-width:5em; %x3%' onmousedown="inca('Duration', filt)" onwheel="wheelEvent(event, id, this)"> Duration</a>`n
<a id='Date' style='min-width:4.5em; %x4%' onmousedown="inca('Date', filt)" onwheel="wheelEvent(event, id, this)">Date</a>`n
<a id='List' style='%x11%' onmousedown="inca('List', filt)" style='color:red'>%order%</a>`n
<a id='Alpha' style='width:9`%; %x2%' onmousedown="inca('Alpha', filt)" onwheel="wheelEvent(event,id,this)">Alpha</a>`n
<a id='Shuffle' style='width:9`%; %x1%' onmousedown="inca('Shuffle')">Shuffle</a>`n
<a id='View' style='width:9`%' onmousedown="inca('View', view, '', lastIndex)" onwheel="wheelEvent(event, id, this)">View %view4%</a>`n 
<a style='width:6.5`%; %x10%' onmousedown="inca('Images')">Pics</a>`n
<a style='width:6.5`%; %x9%' onmousedown="inca('Videos')">Vids</a>`n
<a style='width:7`%; %x8%' onmousedown="inca('Recurse')">Subs</a>`n
<a style='width:12`%' onmouseover="myRibbon2.style.height='1.6em'" onmouseup="inca('Settings')">&#8230</a>`n
<a id="myPage" style='width:17`%' onmousedown="inca('Page', page)" onwheel="wheelEvent(event, id, this)">%pg%</a></div>`n`n

<div id='myRibbon2' class='ribbon' style='height:0; overflow:hidden; margin-top:-0.3em; justify-content:right' onmouseleave="this.style.height=0">`n
<a id='myRate' style='width:9`%' onwheel="wheelEvent(event, id, this)">Speed</a>`n
<a id='myInca' style='width:6`%' onmouseup="inca('Settings')">Inca</a>`n
<a id='myMpv' style='width:9`%' onmouseup="mpv*=1; mpv^=1; localStorage.setItem('mpv',mpv)">Mpv</a>`n
<a id='myJoin' style='width:5`%' onmousedown="inca('Join')">Join</a></div>`n`n

<div style='width:100`%'></div>`n%mediaList%<div style='width:100`%; height:95vh'></div>`n`n

      FileDelete, %inca%\cache\html\%folder%.htm
      StringReplace, header, header, \, /, All
      StringReplace, body, body, \, /, All
      html = %header%%body%</div></div>`n<script>`n%java%</script>`n</body>`n</html>`n
      FileAppend, %html%, %inca%\cache\html\%folder%.htm, UTF-8
      new_html = file:///%inca%\cache\html\%folder%.htm			; create / update browser tab
      StringReplace, new_html, new_html, \,/, All
      IfWinNotExist, ahk_group Browsers
        run, %new_html%							; open a new web tab
      else if (folder == incaTab)					; just refresh existing tab
        send, {F5}
      else if !incaTab
        run, %new_html%							; open a new web tab
      else
        {
        send, ^l
        sleep 44
        send, {BS}
        sleep 24
        SendInput, {Raw}%new_html%
        Send, {Enter}
        }
      incaTab := folder
      selected =
      if fullscreen
        send, {F11}
      fullscreen := 0
      sleep 400								; time for page to load
      PopUp("",0,0,0)
      }


    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        Critical
        poster =
        view1 := Round(view*1.8,1)
        view2 := Round(view*0.66,1)
        view3 := Round(view*0.8,1)
        view4 := Round(view/7,1)
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
        durT := Time(dur)
        if !dur
          dur := 0
        FileRead, cueList, %inca%\cache\cues\%media%.txt
        if cueList
          Loop, Parse, cueList, `n, `r
            if (StrSplit(A_LoopField, "|").2 == "cap")
              {
              x := StrSplit(A_LoopField, "|").3
              caption = <span class='cap' style='font-size:%cap_size%em; width:%view2%em' onmousedown="inca('EditCue',1,%j%)">%x%</span>`n 
              break
              }
        cueList := StrReplace(cueList, "`r`n", "#1")			; lines
        cueList := StrReplace(cueList, "|", "#2")			; entries
        cueList := StrReplace(cueList, ",", "#3")			; cap punctuation...
        cueList := StrReplace(cueList, "'", "#4")
        StringReplace, cueList,cueList, ", #5, All
        if !playlist
          if InStr(allFav, src)
            favicon = &#10084						; favorite heart symbol
        if !start
          start = 0.0
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
        preload = 'auto'						; browser to render non indexed media
        IfExist, %thumb%
          {
          preload = 'none'						; faster page load
          StringReplace, thumb, thumb, #, `%23, All			; html cannot have # in filename
          stringlower, thumb, thumb
          poster = poster="file:///%thumb%"
          }
        else
          caption = <span class='cap' style='color:red' onmousedown="inca('Index',0,%j%)">no index</span>`n 
        StringReplace, src, src, #, `%23, All				; html cannot have # in filename
        StringReplace, media_s, media, `', &apos;, All
        start := Round(start,2)
        if (ext == "txt")
          FileRead, str2, %src%

if (type=="image")
  src =
else src=src="file:///%src%"


if listView
  mediaList = %mediaList% %fold%<table onmouseout="title%j%.style.color=null; thumb%j%.style.opacity=0; overMedia=0">`n <tr id="entry%j%"`n onmouseover="title%j%.style.color='lightsalmon'; overThumb(%j%, thumb%j%)">`n <td onmouseenter='thumb%j%.style.opacity=0'>%ext%`n <video id='thumb%j%' onmousedown="getParameters(%j%, '%type%', '%cueList%', %dur%, %start%, event)" class='thumb2' style="max-width:%view3%em; max-height:%view3%em"`n %src%`n %poster%`n preload=%preload% muted loop type="video/mp4"></video></td>`n <td>%size%</td>`n <td style='min-width:6em' onmouseover='thumb%j%.style.opacity=1'>%durT%</td>`n <td onmouseover='thumb%j%.style.opacity=1'>%date%</td>`n <td style='min-width:4.4em'>%j%</td>`n <td id='myFavicon%j%' style='width:0; translate:-1em; white-space:nowrap; font-size:0.7em; color:salmon; min-width:1em'>%favicon%</td>`n <td style='width:99em'><input id="title%j%" onmouseover='overText=1' onmouseout='overText=0; Click=0' class='title' type='search' value='%media_s%'`n oninput="wasMedia=%j%; renamebox=this.value"></td>`n <td>%fo%</td></tr></table>`n`n

else if ((ext == "txt" || ext=="m3u") && (textCount+=1) <= 20)
  mediaList = %mediaList%<div id="entry%j%" style="display:flex; position:relative; padding-top:%view4%em" onmouseover='overText=1' onmouseout='overText=0'>`n <span><input id='title%j%' class='title' style='text-align:center; background:#15110a; top:8px; padding-left:1em; font-size:%cap_size%em; position:absolute' type='search' value='%media_s%'`n onmousedown='thumb%j%.scrollTo(0,0)'`n oninput="wasMedia=%j%; renamebox=this.value"></span>`n <span id='Save%j%' class='save' onclick="inca('Text',%j%)">Save</span>`n <textarea id='thumb%j%' rows=12 class='text' style='font-size:%cap_size%em; width:%view1%em' onmouseover="overThumb(%j%, this)" onmouseout='overMedia=0'`n oninput="if(editing&&editing!='%j%') {inca('Text',editing)}; editing='%j%'; this.style.background='#15110a'; Save%j%.style.display='block'" onmousedown="getParameters(%j%,'document','',0,0,event)">`n%str2%</textarea></div>`n`n

else mediaList = %mediaList%<div id="entry%j%" style="display:flex; padding-top:%view4%em">`n <div class='thumb'>%caption%<span style='display:block; position:absolute; top:-1.5em; font-size:0.8em; color:salmon' id='myFavicon%j%'>%favicon%</span>`n <span><input id='title%j%' class='title' style='display:none; text-align:center; max-width:%view3%em; font-size:%cap_size%em' type='search' value='%media_s%'`n oninput="wasMedia=%j%; renamebox=this.value" onmouseover='overText=1' onmouseout='overText=0'></span>`n <video id="thumb%j%" class='thumb' style="display:flex; justify-content:center; max-width:%view3%em; max-height:%view3%em"`n onmousedown="getParameters(%j%, '%type%', '%cueList%', %dur%, %start%, event)"`n onmouseover="overThumb(%j%, this); if(type=='video') {if(this.style.position=='fixed'){this.setAttribute('controls','controls')} else this.play()}"`n onmouseout="overMedia=0; if(type=='video') {if(this.style.position=='fixed'){this.removeAttribute('controls')} else thumb%j%.pause()}"`n %src%`n %poster%`n type='video/mp4' preload=%preload% muted loop type="video/mp4"></video></div>`n</div>`n`n
}





    fill(in) {  
      panelList = %panelList%<div style="height:10`%; padding:0.5em; transform:rotate(90deg)">`n%in%</div>`n
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
           checkPlaylist()
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
               else if (show==1 && (listSize<10000 && !Mod(listSize,1000)) || !Mod(listSize,10000))
                 PopUp(listSize,0,0,0)
        popup := listSize -1
        if (show == 1)
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
        if (show != 2)
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


    MoveFiles()								; or playlist .m3u entries
        {
        if (playlist && !InStr(address, "\inca\") && !longClick)
          PopUp("Cannot Move Shortcuts",1000,0.34,0.2)
        else if (path == address && !longClick)
          PopUp("Same folder",1000,0.34,0.2)
        else Loop, Parse, selected, `,
            {
            if !getMedia(A_LoopField)
              continue
            popup = Moved %A_Index%
            if (!InStr(path, "\inca\") && InStr(address, "\inca\"))
              popup = Added %A_Index%
            if longClick
              popup = Copied %A_Index%
            PopUp(popup,0,0,0)
            if getMedia(A_LoopField)
              if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
                FileAppend, %target%`r`n, %address%, UTF-8		; add media entry to playlist
              else 
                {
                FileGetSize, x, %address%%media%.%ext%			; if x, then name already exists in target folder
                FileGetSize, y, %src%					; get source file size
                z=							; new 'Copy -' addendum
                if x							; filename exists in target folder
                  Loop 9999						; Copy (index) suffix attempt
                    {
                    z = \%media% - Copy (%A_Index%).%ext%
                    FileGetSize, w,  %address%%z%
                    if !w						; if Copy name not exist 
                      break
                    }
                if (!longClick && x==y)
                  {
                  PopUp("Duplicate . . .",500,0.5,0.15) 
                  continue
                  }                 
                Loop, 4
                  {
                  if !longClick
                    FileMove, %src%, %address%%z%			; move file to new folder
                  else FileCopy, %src%, %address%%z%
                  if !ErrorLevel
                    break
                  sleep 50						; time for browser to release media
                  }
                if ErrorLevel
                  PopUp("Error . . .",300,0.5,0.15)
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
          getMedia(A_LoopField)
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
        Loop, Parse, selected, `,
          if A_LoopField
            {
            getMedia(A_LoopField)
            source = %target%
            getMedia(value)						; target point
            FileRead, str, %playlist%
            FileDelete, %playlist%
            both = %target%`r`n%source%
            source = %source%`r`n
            str := StrReplace(str, source)
            str := StrReplace(str, target, both)
            FileAppend, %str%, %playlist%, UTF-8
            }
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
        if InStr("pdf txt rtf doc epub mobi htm html js css ahk", ex)
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


    getMedia(id)
        {
        if !id
          return
        id := id + Setting("Page Size") * (page - 1)
        FileReadLine, str, %inca%\cache\lists\%folder%.txt, id
        src := StrSplit(str, "/").2
        seek := StrSplit(str, "/").5
        if !seek
          seek = 0.0
        target = %src%|%seek%
        if src
          return DetectMedia(src)
        }


    Gesture(x, y)
        {
        if (click == "RButton" && Abs(x) > Abs(y))
          {
          if x<=0
            gesture := -1
          x*=1.4
          Static last_volume					; master volume 
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
          return
          }
        if (Abs(x) < Abs(y))					; up-down gesture
          {
          if (click == "LButton" && mpvPID)			; mpv zoom			
            {
            ratio := mpvHeight/mpvWidth
            if (y<0 && mpvWidth*ratio<A_ScreenWidth/18)		; min. size
              return
            mpvXpos-= y
            mpvYpos-= (y*ratio)
            mpvWidth+= (y*2)
            mpvHeight+= (y*2*ratio)
            MouseGetPos , , , x					; mpv not under cursor
            if (x != mpvPID)
              WinMove, ahk_class mpv,,mpvXpos,mpvYpos,mpvWidth,mpvHeight
            return
            }
          WinGet, state, MinMax, ahk_group Browsers
          if (click == "RButton" && !incaTab && state > -1)
            {
            WinActivate, ahk_group Browsers
            if (y < 0)
              send, ^0
            else send, ^{+}
            sleep 111
            }
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
        FileDelete, %inca%\fav\all fav.m3u
        Loop, Files, %inca%\fav\*.m3u, FR				; create consolidated 'All' playlist 
          if !InStr(A_LoopFileFullPath, "\History.m3u")
            {
            FileRead, str, %A_LoopFileFullPath%
            FileAppend, %str%, %inca%\fav\all fav.m3u, UTF-8
            }
        FileRead, allFav, %inca%\fav\all fav.m3u      
        }


    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        inca := SubStr(inca, 1, InStr(inca, "\", False, -1))		; one folders back
        inca := SubStr(inca, 1, InStr(inca, "\", False, -1))
        StringTrimRight, inca, inca, 1
        EnvGet, profile, UserProfile
        sortList = Shuffle|Alpha|Duration|Date|Size|Type|Reverse|Recurse|Videos|Images|List|
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
        AllFav()							; create ..\fav\all fav.m3u
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
        FileAppend, %str2%, %inca%\fav\History.m3u, UTF-8		; clean up html cache
        str = %fol%,%fav%,%music%,%search%				; keep any recognized htm pages
        Loop, Files, %inca%\cache\html\*.htm, FD			; htm pages hold page settings in 1st comment line
          {
          StringTrimRight, x, A_LoopFileName, 4
          FileGetTime, t1, %A_LoopFileFullPath%, M
          t2 := A_Now
          t2 -= t1, days
          if (!InStr(str, x) && t2 > 30)				; only keep for 30 days for non known pages
            FileDelete, %A_LoopFileFullPath%
          }
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
        if (x := Setting("Indexer") * 60000)
          SetTimer, indexer, %x%, -2
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


    indexPage:								; create thumbsheets
    Critical Off
    Loop, Files, %path%*.*, R
      index(A_LoopFileFullPath,0)
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
            FileRead, str, %inca%\meta.txt
            str := StrSplit(str,",")
            str := StrSplit(str[1],":")
            dur := Round(str.2*3600 + str.3*60 + str.4, 2)
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
          }


    TimedEvents:							; every 100mS
        GetBrowser()
        WinGet, mpvPID, ID , ahk_class mpv				; get mpv PID
        if mpvPID
          WinGetPos, mpvXpos,mpvYpos,mpvWidth,mpvHeight,ahk_class mpv
        if incaTab
          {
          x := StrLen(Clipboard)
          y := SubStr(Clipboard, 1, 1)
          if (y=="#" && x>4 && StrSplit(clipboard,"#").MaxIndex()>4)	; very likely is a java message
            Clipboard()
          else if x
            lastClip := Clipboard
          }
        Gui, background:+LastFound
        if (incaTab || mpvPID)
            WinSet, Transparent, % Setting("Ambient Mode")
        else WinSet, Transparent, 0
        x := Setting("Sleep Timer") * 60000
        if (volume >= volRef/10000 && A_TimeIdlePhysical > x)
            {
            volume -= volRef/10000					; sleep timer
            SoundSet, volume						; slowly reduce volume
            }
        ShowStatus()
        return


     checkPlaylist()
       {
       FileRead, str, %playlist%
       Loop, Parse, str, `n, `r
         if %A_LoopField%
           {  
           source := StrSplit(A_Loopfield, "|").1
;  FileCopy, %source%, c:\users\-\downloads\fav\
           start := StrSplit(A_Loopfield, "|").2
           detectMedia(source)
           x = %indexFolders%|%searchFolders%
           IfNotExist, %source%
             if indexFolders
               Loop, Parse, x, `|
                 IfExist, %A_LoopField%%media%.%ext%
                   {
                   flag := 1
                   y = %A_LoopField%%media%.%ext%
                   str := StrReplace(str, source, y)
                   }
           }
       if flag
         {
         FileDelete, %playlist%
         FileAppend, %str%, %playlist%, UTF-8
         }
       }






