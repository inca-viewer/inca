
  ; Browser Based media Explorer

  #NoEnv
  #UseHook, On
  #MaxMem, 4095
  SetWinDelay, 0
  SetKeyDelay, 0
  SetBatchLines -1
  SetTitleMatchMode, 2
  GroupAdd, Browsers, ahk_exe chrome.exe	; supported browsers
  GroupAdd, Browsers, ahk_exe brave.exe
  GroupAdd, Browsers, ahk_exe msedge.exe
  GroupAdd, Browsers, ahk_exe opera.exe
  GroupAdd, Browsers, ahk_exe firefox.exe
  GroupAdd, Browsers, ahk_exe nightly.exe

  #WinActivateForce				; stops taskbar flashing up
  #SingleInstance force				; one program instance only
  #MaxHotkeysPerInterval 999			; allow fast spinning wheel
  SetWorkingDir, %A_ScriptDir%			; consistent start directory

  Global profile				; base user folder
  Global sortList				; eg. by date, size, alpha
  Global toggles				; eg. reverse
  Global config					; program settings
  Global fol					; favorite folders
  Global fav					; favorite playlists
  Global music					; music playlists
  Global search					; list of search words
  Global searchFolders				; default search locations
  Global searchPath				; current search paths
  Global inca					; default folder path
  Global listId					; pointer to media
  Global listSize				; qty of media
  Global selected :=""				; selected files from web page
  Global searchTerm				; eg. all files with 'japan' in name
  Global lastSearch
  Global src					; current media file incl. path
  Global media					; media filename, no path or ext
  Global mediaPath
  Global type					; eg. video
  Global subfolders
  Global folder					; current folder name, no path
  Global path					; current folder path
  Global ext					; file extension
  Global incaTab				; browser tab title/folder only when tab open and active
  Global volume
  Global sort					; eg by date, dur, shuffle, size, alpha, ext...
  Global filt := 0				; secondary search filter eg. date, duration, Alpha letter
  Global click					; mouse click type
  Global lastClick
  Global gesture
  Global timer					; click down timer
  Global listView := 0				; list or thumb view
  Global playlist				; playlist - full path
  Global xRef					; current mouse position
  Global yRef
  Global command				; java message commands to this program
  Global value					; message 1st value (selected is 2nd value)
  Global address				; message 3rd value (can be extended eg. ,,,)
  Global skinny					; edited media width
  Global seek
  Global target					; folder path
  Global reload := 2
  Global browser				; current browser
  Global longClick
  Global fullscreen
  Global poster					; htm thumbnail
  Global mediaList				; html of media content
  Global panelList				; html of top panel
  Global lastFolder
  Global index = 0				; scroll to index
  Global messages				; between browser java and this program
  Global allFav					; all favorite shortcuts consolidated
  Global showSubs
  Global cur					; window under cursor id
  Global desk					; current desktop window id
  Global brow					; current browser id
  Global paused := 0				; default pause
  Global block := 0				; block flag
  Global flush := 0				; flag to flush excess wheel buffer
  Global dur					; media duration
  Global mute					; global mute
  Global start := 0				; default start time
  Global ctime					; last current time
  Global lastIndex := 0				; continuous scrolling
  Global server := "http://localhost:3000/"
  Global transcoding				; media is being transcoded async
  Global lastMedia				; last/current media played in browser


  main:
    initialize()				; sets environment then waits for mouse, key or clipboard events
    Process, Close, node.exe
    sleep 200
    Run, cmd.exe /c cd /d "C:\inca\cache\apps" && node\node.exe server.js, , Hide
    WinActivate, ahk_group Browsers
    path = %profile%\Pictures\
    startPage = #Path###%path%			; default start page
    if GetBrowser()				; gets incaTab settings
      startPage = #Path###%path%
    if searchTerm
      startPage = #Search###%searchTerm%
    if playlist
      startPage = #Path###%playlist%
    messages(startPage)				; opens browser
    SetTimer, TimedEvents, 49			; every 49mS - process server requests
    SetTimer, SlowTimer, 499, -2		; check on youtube downloads
    SetTimer, VolTimer, 6666, -2		; stops windows vol jitter
    return


  ^Esc up::
    Process, Close, node.exe
    ExitApp

  RButton::
  ~LButton::					; click events
  ~MButton::					; click events
    MouseDown()
    return

  ~WheelUp::Wheel(1)
  ~WheelDown::Wheel(-1)

  XButton1::					; Back button
    Critical
    longClick = 
    lastClick = 
    timer := A_TickCount + 350
    SetTimer, Timer_up, -350
    return
  Timer_up:					; long back key press
    IfWinActive, ahk_group Browsers
      send, ^w					; close tab
    else send, !{F4}				; or close app
    return
  XButton1 up::
    SetTimer, Timer_up, Off
    if (A_TickCount > timer)			; longClick already done ^
      return
    IfWinExist, ahk_class OSKMainClass
      WinClose, ahk_class OSKMainClass		; close onscreen keyboard
    else if WinActive("ahk_class Notepad")
    Send, {Esc}^s^w
    else if incaTab
      send, {Pause}				; close java media player
    else send, {XButton1}
    sleep 100
    MouseGetPos,,, cur 				; get window under cursor
    WinActivate, ahk_id %cur%
    return


  MouseDown()
    {
    Critical								; pause timed events
    startId := cur								; remember window clicked
    longClick := gesture := 0
    wasCursor := A_Cursor
    timer := A_TickCount + 300						; set future timout 300mS
    MouseGetPos, xRef, yRef
    StringReplace, click, A_ThisHotkey, ~,, All
    if (incaTab && click == "RButton" && cur == brow && yRef > 400)
      send, +{Pause}							; tell browser Rbutton down
    lastClick := click
    loop
      {
      Gesture()
      if (A_TickCount > timer)
        {
        longClick = true
        Critical off							; allow timer interrupts
        }
      if (click == "LButton" && !longClick)				; see if youtube download request
        {
        WinGetTitle title, A
        if InStr(title, "YouTube")
          {
          clp := ClipBoard
          ClipBoard =
          ClipWait, 0.2
          cmd = %inca%\cache\apps\yt-dlp.exe --no-mtime -f bestvideo+bestaudio "%ClipBoard%"
          if InStr(Clipboard, "https://youtu")
            {
            Run %COMSPEC% /c %cmd% > yt-dlp.txt 2>&1, , Hide
            click =
            }
          ClipBoard := clp
          }
        }
      if (!gesture && longClick && click == "LButton" && wasCursor == "IBeam")
        Find()
      if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P"))	; click up
        {
        if (click == "RButton")
          if (incaTab && yRef > 400 && yRef < A_ScreenHeight - 100)
            send, !{Pause}
          else if (!gesture && !longClick)
            send, {RButton}
        break
        }
      }
    Gui PopUp:Cancel
    click =
    }


  ProcessMessage()							; messages from java/browser html
    {
    if (command == "editCues")						; update media cues skinny, rate
      editCues()
    else if (command == "Favorite")					; add media favorite to New.m3u
      Favorite()
    else if (command == "Delete")					; delete media
      Delete() 
    else if (command == "Add" && address)
      Add()
    else if (command == "Ffmpeg")					; index folder (create thumbsheets)
      SetTimer, Ffmpeg, -10, -2						; run asynchromously
    else if (command == "Scroll")					; update scroll, width, height
      Scroll()
    else if (command == "Rename")					; rename media
      Rename()
    else if (command == "capEdit")					; save browser text editing
      capEdit()
    else if (command == "Notepad")					; open media cues in notepad
      Notepad()
    else if (command == "More")						; continuous scrolling
      reload := 1
    else if (command == "Path")
      Path()
    else if (InStr(sortList, command))
      Sort()
    else if (command == "Search" || command == "SearchBox")
      Search()
    if (command == "CutCopyPaste")
      {
      if (value == "myCut")
        send, ^x
      if (value == "myCopy")
        {
        Clipboard =
        send, ^c
        Clipwait,0.1
        if !Clipboard
          send, ^a
        sleep 100
        send, ^c
        }
      if (value == "myPaste")
        send, ^v
      }
    else if (command == "Null")						; used as trigger to save text editing - see Java inca()
      {
      lastClick =
      index := value
      reload := address
      }
    else if (command == "Reload")					; reload web page
      {
      index := value
      if (sort == "Shuffle")
        reload := 1
      else reload := 2
      }
    else if (command == "Settings")					; open inca source folder
      {
      Run, %inca%\
      sleep 400
      Winactivate, ahk_class CabinetWClass
      }									; open on screen keyboard
    else if (command == "View")						; change thumb/list view
      {
      listView^=1
      lastClick =							; clear middle click
      index := value							; for scrollToIndex() in java
      reload := 1
      }
    else if (command == "addCue")					; add skinny, speed, goto at scroll
      {
      FileAppend, `r`n%value%, %inca%\cache\cues\%media%.txt, UTF-8
      reload := 2
      }
    else if (command == "Move")						; move entry within playlist
      {
      MoveEntry()
      reload := 2
      index := value							; for scrollToIndex() in java
      }
    else if (command == "History")					; maintain play history
      {
      lastMedia := src
      if (folder != "History")
        FileAppend, %src%|%value%`r`n, %inca%\fav\History.m3u, UTF-8
      }
    else if (command == "Pause")					; set default paused
      {
      config := RegExReplace(config, "Pause/[^|]*", "Pause/" . value)
      IniWrite, %config%, %inca%\ini.ini, Settings, config
      }
    else if (command == "Mute")						; set default mute
      {
      config := RegExReplace(config, "Mute/[^|]*", "Mute/" . value)
      IniWrite, %config%, %inca%\ini.ini, Settings, config
      }
    }


  Find() 
    {
    clp := Clipboard
    Clipboard =
    send, ^c
    sleep 24
    address := Clipboard
    Clipboard := clp
    send, {Lbutton up}
    if (address && WinActive("ahk_group Browsers"))			;  long clicked selected text    
      {
      path =
      click =
      reload := 2
      cmd = #SearchBox###%address%
      messages(cmd)							; search for files matching text
      }
    else IfWinExist, ahk_class OSKMainClass
      return
    else if Setting("osk")						; open osk
      {
      MouseGetPos, x, y
      x-=300
      if (x>300)
        x-=100
      if (y < A_ScreenHeight/3)
        y+=100
      else y-=550
      run, osk.exe
      Loop, 100
        {
        sleep 5
        IfWinExist, ahk_class OSKMainClass
        WinMove, ahk_class OSKMainClass, , %x%, %y%
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
    else if InStr(title, "Firefox Nightly",1)     
      browser = Firefox Nightly
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
    if InStr(incaTab, "Original profile")
      incaTab := SubStr(incaTab, 1, StrLen(incaTab) - 19)
    if (incaTab && folder != incaTab)					; has inca tab changed
      {
      subfolders =
      folder := incaTab
      GetTabSettings(1)							; get htm parameters
      FileRead, list, %inca%\cache\temp\%incaTab%.txt
      }
    return incaTab
    }


  Messages(input)							; check for messages from browser
    {
    selected =
    command =
    value =
    address =
    reload =
    type =
    src =
    ptr := 1
    index := 0
    serverTimout := A_TickCount
    messages := input
;    messages := StrReplace(input, "/", "\")
    array := StrSplit(messages,"#")
; tooltip %messages%, 0							; for debug
    Loop % array.MaxIndex()/4
      {
      command := array[ptr+=1]
      value := array[ptr+=1]
      StringReplace, value, value, % Chr(0x1D307), #, All		; re insert # char
      selected := array[ptr+=1]
      address := array[ptr+=1]
      if (command=="Path" || command=="Search" || InStr(sortList, command))	; get top menu panel path
        {
        x := StrSplit(address,"|").2					; ptr from html top panel entry
        y := StrSplit(address,"|").1
        if (x && y == "subs")
          address := StrSplit(subfolders,"|")[x]			; uses ptr to get folder address
        else if (x && y == "fol")
          address := StrSplit(fol,"|")[x]
        else if (x && y == "fav")
          address := StrSplit(fav,"|")[x]
        else if (x && y == "music")
          address := StrSplit(music,"|")[x]
        else if (x && y == "search")
          address := StrSplit(search,"|")[x]
        if (lastClick == "RButton")					; RClick click over panel
          return
        }
      if selected
        getMedia(StrSplit(selected, ",").1)
      if !command
        continue
      else ProcessMessage()
      }
    if (reload == 2)
      CreateList(1)
    else if (reload == 3)
      CreateList(0)
    if reload
      RenderPage(0)
    if (!reload && command != "More")
      {
      FileDelete, %inca%\cache\html\temp.txt
      FileAppend,, %inca%\cache\html\temp.txt				; stop server waiting
      }
    longClick =
    Gui PopUp:Cancel
    if (A_TickCount - serverTimout > 9999)				; server timed out
      {
      Run, %server%inca/cache/html/%folder%.htm
      sleep 600
      WinActivate, ahk_group Browsers
      }
    }


  Notepad()
    {
    if (value == "myCue")
      {
      IfExist, %inca%\cache\cues\%media%.txt
        Run, %inca%\cache\cues\%media%.txt
      else PopUp("no cues...",800,0,0)
      return
      }
    else if (type == "document" || type == "m3u")
      {
      IfExist, %inca%\cache\json\%media%.json
        Run, %inca%\cache\json\%media%.json
      else IfExist, %src%
        Run, %src%
      }
    else IfExist, %inca%\cache\json\%media%.json
      Run, %inca%\cache\json\%media%.json
    else IfExist, %inca%\cache\srt\%media%.srt
      Run, %inca%\cache\srt\%media%.srt
    loop 50
      {
      IfWinActive, Notepad
        break
      WinActivate, Notepad
      sleep 20
      }
    }


  Scroll()
    {
    FileRead, cues, %inca%\cache\cues\%media%.txt
    if cues
      Loop, Parse, cues, `n, `r						; each line of cues
        if A_LoopField
          if !InStr(A_LoopField, "0.00|scroll")				; remember text scroll position
            newCue = %newCue%%A_LoopField%`r`n
    FileDelete, %inca%\cache\cues\%media%.txt
    FileAppend, %newCue%0.00|scroll|%value%, %inca%\cache\cues\%media%.txt, UTF-8
    }


  Rename()
    {
    if (StrLen(value) < 4)
      popup = too small
    if !getMedia(StrSplit(selected, ",").1)
      popup = no media
    if !popup
      {
      value = %value%
      if RenameFile(value)
        popup = Error . . .
      else popup := Chr(0x2713)
      }
    Popup(popup,0,0,0)
    index := StrSplit(selected, ",").1
    reload := 2
    }


  Path()
    {
    lastMedia := 0
    IfNotExist, %address%
      {
      PopUp("not found",999,0,0)
      return
      }
    if (longClick && !selected)
      {
      run, "%address%"							; open source instead eg m3u
      send {LButton up}
      return
      }
    reload := 3								; show folder size
    if selected								; move/copy files
      {
      x := StrSplit(selected,",")
      index := x[x.MaxIndex()-1]					; scroll htm to end of selection
      if MoveFiles()							; between folders or playlists
        return								; failed so stay in folder
      reload := 3
      CreateList(1)							; silently update old htm page
      RenderPage(1)							; to stay in this folder add return
      return
      }
    else if InStr(address, ".m3u")					; playlist
      {
      playlist := address
      SplitPath, address,,path,,folder
      path = %path%\
      }
    else
      {
      playlist =
      path := address
      IfNotExist, %path%
        path := SubStr(path, 1, InStr(path, "\", False, -1))	; try one folder back
      IfNotExist, %path%
        {
        reload := 0
        PopUp("Not Found",600,0,0)
        return
        }
      str := StrSplit(path,"\")						; cannot use splitPath
      folder := str[str.MaxIndex()-1]					; in case folder has .com in name
      }
    if selected
      if playlist
        sort = Playlist
      else sort = Date
    else GetTabSettings(0)						; load previous tab basic settings from cache
    searchTerm =
    searchPath =
    filt := 0
    index := 0
    PopUp(folder,0,0,0)
    }


  Sort()								; 'Path' uses 'value' for scroll index instead of filt
    {
    if value is not number
      value := 0
    if (value == filt && sort !=command)				; reset filt on new sort if previous filt on
      value := filt := 0
    if (sort != command)						; reset old filt if new sort (value still holds new filt)
      filt := 0
    if (command = "Type")
      {
      command := value = 1 ? "Video" : value = 2 ? "Image" : value = 3 ? "Audio" : value = 4 ? "Fav" : command
      if (value || sort != "Type")
        toggles =
      if (value && sort == "Type")
        sort = Alpha
      value := 0
      }
    else if (InStr(sortList, command) && sort != command)		; changed sort column
      {
      if (value == filt)
        filt := 0							; clear filter
      else filt := value						; or adopt new filt (if applied)
      }
    reload := 3
    if (filt != value && value != searchTerm)				; new filter value only
      filt := value
    else if InStr(sortList, command)					; sort filter
      {
      toggle_list = Reverse Recurse Video Image Audio Fav
      if (sort != command)						; new sort
        {
        if (command != "Reverse" && !InStr(toggle_list, command))
          StringReplace, toggles, toggles, Reverse			; remove reverse
        }
      else if (sort != "Shuffle")
      command = Reverse
      if InStr(toggle_list, command)
        if !InStr(toggles, command)					; toggle the sort switches
          toggles = %toggles%%command%					; add switch
        else StringReplace, toggles, toggles, %command%			; remove switch
      else sort := command
      if (StrLen(toggles) < 3)
        toggles =
      }
    if searchTerm
      Search()								; in case sorting within search
    }
 

  Search()
    {
    playlist =
    value := 0								; remove filt/index scroll variable
    reload := 3
    if (longClick || command == "SearchBox")
      lastClick = MButton						; open search in new tab
    if !address
      return
    address = %address%							; trims whitespace
    if (command == "SearchBox")
      if longClick
        address := StrReplace(address, " ", "+")
      else address := StrReplace(address, "+", " ")
    address := RegExReplace(address, "^\w", Format("{:U}", SubStr(address, 1, 1)))	; to fix firefox bug
    searchTerm = %address%
    lastSearch = %address%
    PopUp(searchTerm,0,0,0)
    if searchTerm							; search text from link or search box
      {
      folder := searchTerm
      GetTabSettings(0)							; load cached tab settings
      searchPath := searchFolders					; default search paths
      Loop, Parse, searchPath, `|
        if InStr(path, A_LoopField)					; ensure not duplicate paths
          found = true
      if !found
        searchPath = %path%|%searchPath%				; add this folder to search path
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
    }


  Join(select)
    {
    if !StrSplit(select, ",").2						; more that one video
      return
    Loop, Parse, select, `,
      if getMedia(A_LoopField)
        {
        GuiControl, Indexer:, GuiInd, %media%
        Run, cmd /c mklink "c:\inca\cache\temp\%A_Index%.lnk" "%src%",, Hide
        str = %str%file 'c:\inca\cache\temp\%A_Index%.lnk'`r`n
        }
    FileAppend,  %str%, %inca%\cache\temp\temp1.txt, utf-8
    Popup("Joining Media",600,0,0)
    x = @echo off`r`nset `"temp=(pause & pause & pause)>nul`"`r`ntype `%1|(`%temp`% & findstr `"^`")`r`n
    FileAppend, %x%, %inca%\cache\temp\temp.bat 
    runwait, %inca%\cache\temp\temp.bat %inca%\cache\temp\temp1.txt > %inca%\cache\temp\temp.txt,,Hide
    runwait, %inca%\cache\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\cache\temp\temp.txt" -c copy "%mediaPath%\%media% -join.%ext%",, Hide
    if ErrorLevel
      PopUp("failed",900,0,0)
    src = %mediaPath%\%media% -join.%ext%
    FileDelete, %inca%\cache\temp\temp.bat
    FileDelete, %inca%\cache\temp\temp.txt
    FileDelete, %inca%\cache\temp\temp1.txt
    FileDelete, %inca%\cache\temp\*.lnk
    if !ErrorLevel
      if (new := Transcode("myMp4", src, 0, 0))
        Index(new, 1)
    GuiControl, Indexer:, GuiInd
    reload := 2
    }


  Delete()
    {
    if selected
      {
      if !playlist
        {
        Loop, Parse, selected, `,
        if getMedia(A_LoopField)
          {
          FileRecycle, %src%
          if ErrorLevel
            popup = Error %A_Index%
          else popup = Deleted %A_Index%
          popup(popup,0,0,0)
          }
        }
      else DeleteEntries()
      x := StrSplit(selected,",")
      index := x[x.MaxIndex()-1]
      reload := 2
      }
    return
    }


  Favorite()
    {
    if !selected
      return
    if playlist
      FileAppend, %src%|%value%`r`n, %inca%\fav\%folder%.m3u, UTF-8
    else FileAppend, %src%|%value%`r`n, %inca%\fav\new.m3u, UTF-8
    if (type == "audio" || type == "video")
      Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
    AllFav()										; update consolidated fav list
    index := StrSplit(selected, ",").1 + 1
    if playlist
      reload := 3
    }


  capEdit() 								; Save edited text or SRT file
    {
    FileRecycle, %inca%\cache\json\%media%.json
    FileAppend, %value%, %inca%\cache\json\%media%.json, UTF-8
    index := selected
    PopUp("saving...", 999, 0, 0)
    RenderPage(0)
    }


  Add()
    {
    popup = Added
    if (InStr(playlist, "music\") && !InStr(music, address))		; new music playlist
      {
      music = |%music%%inca%\music\%address%.m3u
      FileAppend,,%inca%\music\%address%.m3u, utf-8
      IniWrite, %music%, %inca%\ini.ini,Settings,Music
      }
    else if (InStr(playlist, "fav\") && !InStr(fav, address))		; new fav playlist
      {
      fav = |%fav%%inca%\fav\%address%.m3u
      FileAppend,,%inca%\fav\%address%.m3u, utf-8
      IniWrite, %fav%, %inca%\ini.ini,Settings,Fav
      }
    else if !searchTerm							; new folder
      {
      popup = New Folder
      fol = |%fol%%path%%address%\
      FileCreateDir, %path%\%address%
      IniWrite, %fol%, %inca%\ini.ini,Settings,Fol
      }
    else
      {
      popup = Added
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


   CreateList(silent)							; list of files in path
    {
    Critical
    if !searchPath
      searchPath := path
    IfNotExist, %path%
      if searchTerm
        path = %searchTerm%\
      else path = %profile%\Pictures\
    list =
    listSize := 0
    if (InStr(toggles, "Recurse") || searchTerm)
      recurse = R
    if (playlist && !searchTerm)
      {
      checkPlaylist()
      FileRead, str, %playlist%
      Loop, Parse, str, `n, `r
        if A_LoopField
          {  
          source := StrSplit(A_Loopfield, "|").1
          start := StrSplit(A_Loopfield, "|").2
          if (SubStr(source, 1, 1) != "#")
            list .= spool(source, A_Index, start)
          }
      }
    else Loop, Parse, searchPath, `|
      Loop, Files, %A_LoopField%*.*, F%recurse%
        if A_LoopFileAttrib not contains H,S
          if (A_LoopFileSize > 0 && listSize < 250000)		; for when files are still downloading
            {
            list .= spool(A_LoopFileFullPath, A_Index, start)
            if (!silent && listSize && ((listSize<10000 && !Mod(listSize,1000)) || !Mod(listSize,10000)))
              PopUp(listSize,0,0,0)
            }
    if !silent
      PopUp(listSize,0,0,0)
    if (listSize > 250000)
      PopUp("folder too big",999,0,0)
    StringTrimRight, list, list, 2					; remove end `r`n
    if (InStr(toggles, "Reverse") && sort != "Date" && sort != "Playlist")
      reverse = R
    if (!InStr(toggles, "Reverse") && (sort == "Date" || sort == "Playlist"))
      reverse = R
    if (sort == "Playlist" && !playlist)
      sort = Shuffle
    if (sort == "Type")
      Sort, list, %reverse% Z						; alpha sort
    else if (sort != "Shuffle")
      Sort, list, %reverse% Z N						; numeric sort
    if (sort == "Shuffle")
      Sort, list, Random Z
    if (sort == "Alpha" && playlist)
      Sort, list, %reverse% Z \						; filename alpha sort
    FileDelete, %inca%\cache\temp\%folder%.txt
    FileAppend, %list%, %inca%\cache\temp\%folder%.txt, UTF-8
    }


  Spool(input, count, start)						; sorting and search filters
    {
    SplitPath, input,,,ex, filen
    if (ex == "lnk")
      FileGetShortcut, %input%, input
    SplitPath, input,,,ex,filen
    if (med := DecodeExt(ex))
      {
      if (InStr(toggles, "Video") && med != "video")
        return
      if (InStr(toggles, "Image") && med != "image")
        return
      if (InStr(toggles, "Audio") && med != "audio")
        return
      listId := listSize
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
        if (!InStr(toggles, "Reverse") && filt && sort == "Alpha" && 1st_char < Chr(filt+64))
          return
        else if (InStr(toggles, "Reverse") && filt && sort == "Alpha" && 1st_char > Chr(filt+63))
          return
        }
      else if (sort == "Date")
        {
        FileGetTime, listId, %input%, M
        sort_date := A_Now
        sort_date -= listId, days
        years := floor(sort_date / 365)
        if (!InStr(toggles, "Reverse") && filt && sort_date/30 < filt)
          return
        else if (InStr(toggles, "Reverse") && filt && sort_date/30 > filt)
          return
        }
      else if (sort == "Size")
        {
        FileGetSize, listId, %input%, K
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
        }
      if (InStr(toggles, "Fav") && !InStr(allfav, filen))
        return
      listSize += 1
      if !playlist
        {
        FileRead, dur, %inca%\cache\durations\%filen%.txt
        if (dur && med=="video")			; derive 1st thumbnail start time
          if (dur > 61)
            start := 20.1 + (4 * (dur - 20)/200)
          else start := 4 * dur / 200
        }
      start := Round(start,3)
      entry = %listId%/%input%/%med%/%start%`r`n
      return entry
      }
    }


  editCues() 
    {   
    StringSplit, vals, value, `,  					; Split into rate, skinny
    cue := "0.00"
    if (1*val[1]+1*val[2] > 4)
      return
    cueFile := inca . "\cache\cues\" . media . ".txt"
    updatedCues := ""
    FileRead, cues, %cueFile%
    Loop, Parse, cues, `n, `r
    if (A_LoopField)
      {
      StringSplit, array, A_LoopField, |
      if (array2 in rate,skinny && array1 = cue)
        {
        i := array2 = "rate" ? 1 : array2 = "skinny" ? 2 : 3
        if (vals%i% = "undefined")
          updatedCues .= A_LoopField . "`r`n"
        } 
        else updatedCues .= A_LoopField . "`r`n"
      }
    for i, type in ["rate", "skinny"]
      if 1*vals%i%
        updatedCues .= cue . "|" . type . "|" . vals%i% . "`r`n"
    updatedCues := RTrim(updatedCues, "`r`n")
    Sort, updatedCues, NZ
    FileDelete, %cueFile%
    if (updatedCues != cues)
      FileAppend, % RegExReplace(updatedCues, "\r?\n$"), %cueFile%, UTF-8
    }


  GetTabSettings(all)							; from line 1 of .htm cache file
    {
    listView := 0
    filt := 0
    toggles =
    sort = Shuffle
    if (command == "SearchBox")
      sort = Duration
    if playlist								; default playlist sort
      sort = Playlist
    FileReadLine, array, %inca%\cache\html\%folder%.htm, 1		; embedded page data as top html comment
    if (array && SubStr(array, 1, 4) = "<!--")
      {
      StringReplace, array, array, /, \, All
      array := StrSplit(array,", ")
      sort := array.2
      toggles := array.3
      listView := array.4
      if all
        {
        playlist := array.5
        path := array.6
        searchPath := array.7
        searchTerm := array.8
        if searchTerm
          folder := searchTerm
        subfolders := array.9
        }
      }
    else if RegExMatch(path, "i)music|books|audio|text|pdf")
      listView := 1
    }


  Gesture()
    {
    MouseGetPos, x, y
    x -= xRef
    y -= yRef
    value := Abs(x) + Abs(y)
    if (value < 4)
      return
    if !gesture
      if (Abs(y) > Abs(x)+4)
        gesture := -1
      else gesture := 1
    MouseGetPos, xRef, yRef					; new ref
    if (click == "RButton")
      {
      if (xRef < 6)						; gesture at screen edges
        xRef := 9
      if (xRef > A_ScreenWidth - 6)
        xRef := A_ScreenWidth - 9
      if (xRef == 9 || xRef == A_ScreenWidth - 9)		; gesture at screen edges
        edge := 1
      MouseMove, % xRef, % yRef, 0
      }
    if (click == "RButton" && (gesture > 0 || !incaTab))
      {
      if (x > 0)
        dir := 1
      else dir = -1
      if x < 100
        volume += 1.4 * x / 20
      if edge
        volume += dir
      if (volume < 0)
        volume := 0
      if (volume > 100)
        volume := 100
      yv := A_ScreenHeight - 3
      xv := A_ScreenWidth * volume/100
      Gui, vol: show, x0 y%yv% w%xv% h3 NA
      SoundSet, volume
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


  srtTime(in)
    {
    seconds := in
    hours := Floor(seconds / 3600)
    seconds -= hours * 3600
    minutes := Floor(seconds / 60)
    seconds -= minutes * 60
    ms := Round((seconds - Floor(seconds)) * 1000)
    seconds := Floor(seconds)
    return Format("{:02d}:{:02d}:{:02d},{:03d}", hours, minutes, seconds, ms)
    }


  MoveFiles()								; or playlist .m3u entries
    {
    if (lastClick != "LButton")
      return
    fail =
    if (playlist && !InStr(address, "\inca\") && !longClick)
      popup = Cannot Move Shortcuts . . .
    else Loop, Parse, selected, `,
      {
      if A_LoopField is not number
        continue
      getMedia(A_LoopField)
      if longClick
        popup = Copying %A_Index%
      else popup = Moving %A_Index%
      if (!InStr(path, "\inca\") && InStr(address, "\inca\"))
        popup = Added %A_Index%
      if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
        {
        PopUp("Added",0,0,0)
        FileAppend, %target%`r`n, %address%, UTF-8			; add media entry to playlist
        if (src && !InStr(path, "\inca\"))
          Runwait, %inca%\cache\apps\ffmpeg.exe -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%0.0.jpg",, Hide
        }
      else if src							; to folder not playlist
        {
        FileGetSize, x, %address%%media%.%ext%				; if x, then name already exists in target folder
        FileGetSize, y, %src%						; get source file size
        z=								; new 'Copy -' addendum
        if x								; filename exists in target folder
          Loop 9999							; Copy (index) suffix attempt
          {
          z = \%media% - Copy (%A_Index%).%ext%
          FileGetSize, w,  %address%%z%
          if !w								; if Copy name not exist 
            break
          }
        if (!longClick && x==y)
          {
          fail = %fail%,%A_Index%
          popup = Duplicate %A_Index%
          continue
          }         
        Loop, 4
          {
          if !longClick
            FileMove, %src%, %address%%z%				; move file to new folder
          else FileCopy, %src%, %address%%z%
          if !ErrorLevel
            break
          sleep 50							; time for browser to release media
          }
        if ErrorLevel
          {
          fail=%fail%,%A_Index%
          popup = Failed %A_Index%
          }
        }
      PopUp(popup,0,0,0)
      }
    if (popup && !longClick)
      if (InStr(address, "inca\fav") || InStr(address, "inca\music"))
        DeleteEntries()
    if fail
      PopUp("failed",900,0,0)
    else if popup
      PopUp(popup,500,0,0)
    return fail
    }  


  DeleteEntries()							; playlist entries
    {
    IfNotExist, %playlist%
      return
    FileRead, str, %playlist%
    FileRecycle, %playlist%
    Loop, Parse, selected, `,
      if A_LoopField
        {
        getMedia(A_LoopField)
        x = %target%`r`n
        str := StrReplace(str, x,,1,1)					; delete entry
        }
    FileAppend, %str%, %playlist%, UTF-8
    AllFav()
    }


  MoveEntry()								; within playlist 
    {
    if (sort != "Playlist")
      {
      toggles =
      sort = Playlist
      PopUp("Playlist must be unSorted",900,0,0)
      return
      }
    Loop, Parse, selected, `,
      if A_LoopField is number
        {
        getMedia(A_LoopField)
        source = %target%						; source = entry to move
        getMedia(value)							; target now is place to move
        FileRead, str, %playlist%
        FileDelete, %playlist%
        both = %target%`r`n%source%
        source = %source%`r`n
        StringReplace, str, str, %source%				; remove target entry
        StringReplace, str, str, %target%, %both%			; replace with both target and source
        FileAppend, %str%, %playlist%, UTF-8
        }
    }


  RenameFile(new_name)
    {
    IfNotExist, %src%
      return 1
    FileMove, %src%, %mediaPath%\%new_name%.%ext%			; FileMove = FileRename
    if ErrorLevel
      return 1         
    new_entry := StrReplace(target, media, new_name)
    folders = %inca%\fav\*.m3u|%inca%\music\*.m3u
    Loop, Parse, folders, `|						; rename any entries within favorites
      Loop, Files, %A_LoopField%*.*, FR
        {
        FileRead, str, %A_LoopFileFullPath%				; find & replace in .m3u files
        if !InStr(str, src)
          continue
        FileDelete, %A_LoopFileFullPath%
        array := StrSplit(str,"`n")
        Loop % array.MaxIndex()
          {
          x := StrSplit(array[A_Index], "|").1
          seek := StrSplit(array[A_Index], "|").2
          seek := StrReplace(seek, "`r", "")
          new = %mediaPath%\%new_name%.%ext%|%seek%
          old = %mediaPath%\%media%.%ext%|%seek%
          if (src == x)
            {
            str := StrReplace(str, old, new)
            FileMove, %inca%\cache\posters\%media% %seek%.jpg, %inca%\cache\posters\%new_name% %seek%.jpg, 1
            }
          }
      FileAppend, %str%, %A_LoopFileFullPath%, UTF-8
      }
    FileMove, %inca%\cache\cues\%media%.txt, %inca%\cache\cues\%new_name%.txt, 1
    FileMove, %inca%\cache\durations\%media%.txt, %inca%\cache\durations\%new_name%.txt, 1
    FileMove, %inca%\cache\thumbs\%media%.jpg, %inca%\cache\thumbs\%new_name%.jpg, 1
    FileMove, %inca%\cache\posters\%media%.jpg, %inca%\cache\posters\%new_name%.jpg, 1
    FileMove, %inca%\cache\json\%media%.json, %inca%\cache\json\%new_name%.json, 1
    }


  DecodeExt(ex)
    {
    StringLower ex, ex
    if InStr("jpg png jpeg webp gif", ex)
      return "image"
    if InStr("mp4 wmv avi mov webm mpg mpeg flv divx mkv asf m4v mvb rmvb vob rm ts", ex)
      return "video"
    if InStr("mp3 m4a wma mid wav", ex)
      return "audio"
    if InStr("pdf txt rtf doc epub mobi htm html js css ini ahk vtt srt bat json", ex)
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
    FileReadLine, str, %inca%\cache\temp\%folder%.txt, id
    src := StrSplit(str, "/").2
    seek := Round(StrSplit(str, "/").4,1)
    target = %src%|%seek%
    if src
      return DetectMedia(src)
    }


  PopUp(message, time, x, y)
    {
    MouseGetPos, xp, yp
    yp -= 132
    xp -= 99
    if (x || y)
      xp := A_ScreenWidth * x, yp :=  A_ScreenHeight * y
    time := Ceil(time / 20)
    Gui PopUp:Destroy
    Gui PopUp:+lastfound +AlwaysOnTop -Caption +ToolWindow
    Gui PopUp:Color, Black
    if (StrLen(message) <3)
      Gui PopUp:Font, s24 cRed, Segoe UI
    else Gui PopUp:Font, s16 cRed, Segoe UI
    Gui PopUp:Add, Text,, %message%
    Gui PopUp:Show, x%xp% y%yp% NA
    WinSet, TransColor, 0 255
    loop %time%
      {
      sleep 20
      mask := 55 + (A_Index * 200/ time)
      mask2 := 255 - mask
      WinSet, TransColor, 0 %mask2%
      }
    }


  AllFav()
    {
    FileDelete, %inca%\fav\all fav.m3u
    Loop, Files, %inca%\fav\*.m3u, FR					; create consolidated 'All' playlist 
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
    sortList = Shuffle|Alpha|Duration|Date|Size|Type|Reverse|Recurse|Video|Image|Audio|Fav|Playlist
    IniRead,config,%inca%\ini.ini,Settings,config
    IniRead,searchFolders,%inca%\ini.ini,Settings,searchFolders
    IniRead,fol,%inca%\ini.ini,Settings,Fol
    IniRead,search,%inca%\ini.ini,Settings,Search
    IniRead,fav,%inca%\ini.ini,Settings,Fav
    IniRead,music,%inca%\ini.ini,Settings,Music
    }


  Setting(key)
    {
    Loop, Parse, config, `|
      if InStr(StrSplit(A_LoopField, "/").1, key)
        return StrSplit(A_LoopField, "/").2
    }

  Initialize()
    {
    Global
    if InStr(Clipboard, "#")
      Clicpboard =
    LoadSettings()
    AllFav()								; create ..\fav\all fav.m3u
    FileDelete, %inca%\cache\temp\*.*
    FileRead, history, %inca%\fav\History.m3u
    FileDelete, %inca%\fav\History.m3u
    Loop, Parse, history, `n, `r					; garbage collection
      count++
    if (count > 250)
      count -= 250
    else count = 0
    Loop, Parse, history, `n, `r					; keep history below 250 entries
      if (A_Loopfield && A_Index >= count)
        str = %str%%A_Loopfield%`r`n
    FileAppend, %str%, %inca%\fav\History.m3u, UTF-8			; clean up html cache
    str = %fol%,%fav%,%music%,%search%					; keep any recognized htm pages
    Loop, Files, %inca%\cache\html\*.htm, FD				; htm pages hold page settings in 1st comment line
      {
      StringTrimRight, x, A_LoopFileName, 4
      FileGetTime, t1, %A_LoopFileFullPath%, M
      t2 := A_Now
      t2 -= t1, days
      if (!InStr(str, x) && t2 > 30)					; only keep for 30 days for non known pages
        FileDelete, %A_LoopFileFullPath%
      }
    CoordMode, Mouse, Screen
    Gui, background:+lastfound -Caption +ToolWindow -DPIScale
    Gui, background:Color, Black
    Gui, background:Show, x0 y0 w%A_ScreenWidth% h%A_ScreenHeight% NA
    WinSet, Transparent, 0
    WinSet, ExStyle, +0x20
    gui, vol: +lastfound -Caption +ToolWindow +AlwaysOnTop -DPIScale
    gui, vol: color, ffb6c1
    Gui Status:+lastfound +AlwaysOnTop -Caption +ToolWindow
    Gui Status:Color, Black
    Gui Status:Add, Text, vGuiSta w120 h35
    Gui Status: Show, Hide
    ix := A_screenWidth * Setting("Status Bar")/100
    iy := A_ScreenHeight * 0.95
    WinMove,,,ix,iy
    Gui, Indexer:+lastfound +AlwaysOnTop -Caption +ToolWindow
    Gui, Indexer:Color, Black
    Gui, Indexer:Add, Text, vGuiInd h50 w1200
    Gui, Indexer:Font, s11 c806a5c, Segoe UI
    GuiControl, Indexer:Font, GuiInd
    iy := A_ScreenHeight * 0.966
    Gui, Indexer:Show, x500 y%iy%, NA
    WinSet, TransColor, ffffff 0
    WinSet, TransColor, 0 140
    WinSet, ExStyle, +0x20
    SoundGet, volume
    }


   checkPlaylist()							; in case src files moved
     {
     FileRead, str, %playlist%
     Loop, Parse, str, `n, `r
     if A_LoopField
       {  
       source := StrSplit(A_Loopfield, "|").1
       start := StrSplit(A_Loopfield, "|").2
       detectMedia(source)
       IfNotExist, %source%
         Loop, Parse, searchFolders, `|
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


  Wheel(dir)					; browser zoom
    {
    Critical off
    IfWinActive, ahk_group Browsers
      if (!incaTab && click && !gesture)
        {
        if (dir > 0)
          send, ^0
        else send, ^{+}
        sleep 100
        }
    }


  fill(in) {  
    panelList = %panelList%<div style="height:10`%; padding:0.5em; transform:rotate(90deg)">`n%in%</div>`n
    }


  Index(src, force)							; create thumbs, posters & durations cache
    {
    if InStr(src, "|")
      {
      seek := StrSplit(src, "|").2
      source := StrSplit(src, "|").1
      }
    else source := src
    SplitPath, source,,fold,ex,filen
    med := DecodeExt(ex)
    if (med != "video" && med != "audio")
      return
    FileGetSize, size, %source%, K
    if (med == "video" && size < 100)
      return
    dur =
    if (med == "video")
      cmd = C:\inca\cache\apps\ffprobe.exe -v quiet -print_format json -show_streams -select_streams v:0 "%source%"
    else cmd = C:\inca\cache\apps\ffprobe.exe -v quiet -print_format json -show_streams -select_streams a:0 "%source%"
    RunWait, %ComSpec% /c %cmd% > "c:\inca\cache\temp\meta.txt",, Hide
    if ErrorLevel
      return
    FileRead, MetaContent, c:\inca\cache\temp\meta.txt
    if RegExMatch(MetaContent, """duration"":\s*""?(\d+\.?\d*)""?", n)
      dur := n1
    if !dur								; try to fix duration missing
      runwait, %inca%\cache\apps\ffmpeg.exe -c copy -map 0 -fflags +genpts "%source%" -y "%source%",, Hide
    if RegExMatch(MetaContent, """start_time"":\s*""?(\d+\.?\d*)""?", n)
      offset := n1
    dur := Round(dur,2)
    FileDelete, %inca%\cache\durations\%filen%.txt
    FileAppend, %dur%, %inca%\cache\durations\%filen%.txt, UTF-8
    if (med == "audio")
      return
    thumb := 0
    IfNotExist, %inca%\cache\thumbs\%filen%.jpg
      thumb := 1
    t := 0
    if (dur > 61)
      {
      t := 20 + offset   						; try to skip any video intro banners
      dur -= 20
      }
    loop 180
      {
      y := Round(A_Index / 5)						; 36 video frames in thumbsheet
      if !Mod(A_Index,5)
        {
        runwait, %inca%\cache\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\temp\%y%.jpg",, Hide
        if (A_Index == 5)
          if InStr(src, "|")
            Run, %inca%\cache\apps\ffmpeg.exe -ss %seek% -i "%source%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%filen%%A_Space%%seek%.jpg",, Hide
          else FileCopy, %inca%\cache\temp\1.jpg, %inca%\cache\posters\%filen%.jpg, 1	; 1st thumb is poster
        if (A_Index == 5)
          if (!thumb && !force)
            break
        }
      t += (dur / 200)
      }
    if (thumb || force)
      Runwait %inca%\cache\apps\ffmpeg -i %inca%\cache\temp\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
    return 1
    }


  Transcode(id, src, start, end)
    {
    local cmd, temp, new, type, filen, foldr
    if start
      ss = -ss %start%
    if end
      to = -to %end%
    if start
      suffix = @%start%
    else if end 
      suffix = @%end%
    SplitPath, src, , foldr, type, filen
    FileGetTime, CreationTime, %src%, C
    FileGetTime, ModifiedTime, %src%, M
    if ErrorLevel
      return
    if (id == "myMp3")
      ext = mp3
    else ext = mp4
    new = %profile%\Downloads\temp_%filen% %suffix%.%ext%
    new = %new%									; trims whitespace
    if (id == "myMp3")
      RunWait, %inca%\cache\apps\ffmpeg.exe %ss% %to% -i "%src%" -y file:"%new%",,Hide
    else
      {
      if (DecodeExt(type) != "video")
        return
      cmd = C:\inca\cache\apps\ffprobe.exe -v quiet -print_format json -show_streams -select_streams v:0 "%src%"
      RunWait, %ComSpec% /c %cmd% > "c:\inca\cache\temp\meta.txt",, Hide	; get media meta data
      if ErrorLevel
        return
      FileRead, MetaContent, c:\inca\cache\temp\meta.txt
 ;     if (!join && !start && !end && InStr(MetaContent, "Inca"))		; already transcoded
 ;       return
      if RegExMatch(MetaContent, """width"":\s*(\d+)", WidthMatch)
        Width := WidthMatch1 + 0
      if RegExMatch(MetaContent, """height"":\s*(\d+)", HeightMatch)
        Height := HeightMatch1 + 0
      if RegExMatch(MetaContent, """r_frame_rate"":\s*""(\d+)/(\d+)""", FrameRateMatch)
        FrameRate := (FrameRateMatch1 + 0) / (FrameRateMatch2 + 0)
      else if RegExMatch(MetaContent, """r_frame_rate"":\s*""(\d+\.?\d*)""", FrameRateMatch)
        FrameRate := FrameRateMatch1 + 0
      else FrameRate := 25
      if RegExMatch(MetaContent, """bit_rate"":\s*""(\d+)""", BitrateMatch)
        Bitrate := Ceil(BitrateMatch1 / 1000)
      else Bitrate := 0
      if (!Width || !Height || !FrameRate)
        return
      AspectRatio := Width / Height
      if (AspectRatio >= 1)
        {
        OutWidth := Width < 1280 ? Width : 1280
        OutHeight := Round(OutWidth / AspectRatio / 2) * 2
        }
      else
        {
        OutHeight := Height < 1280 ? Height : 1280
        OutWidth := Round(OutHeight * AspectRatio / 2) * 2
        }
      Resolution := OutWidth ":" OutHeight
      GOPFrames := Round(FrameRate)					; every second
      MaxBitrate := 6000
      BufSize := 12000
      if (OutWidth <= 1280)
        {
        if (Bitrate > 0)
          {
          MaxBitrate := Round(Bitrate * 3 / 2)
          BufSize := MaxBitrate * 2
          }
        else
          {
          if (OutWidth <= 720)
            {
            MaxBitrate := 1500
            BufSize := 3000
            Bitrate := 1000
            }
          else
            {
            MaxBitrate := 6000
            BufSize := 12000
            Bitrate := 4000
            }
          }
        }
      encoders := "-c:v h264_amf -rc cqp -qp_i 22 -qp_p 24|-c:v h264_nvenc -preset p5 -rc vbr -b:v %MaxBitrate%k -bufsize %BufSize%k|-c:v h264_qsv -preset medium -global_quality 23|-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p"
      for index, encoder in StrSplit(encoders, "|")
        {
        try
          {
          cmd = -y -i file:"%src%" %ss% %to% %encoder% -vf scale=%Resolution%,setsar=1:1 -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -g %GOPFrames% -keyint_min %GOPFrames% -maxrate %MaxBitrate%k -bufsize %BufSize%k -c:a aac -b:a 128k -ar 48000 -ac 2 -map 0:v:0 -map 0:a? -map 0:s? -c:s copy -f mp4 -movflags +faststart+separate_moof -metadata:s:v:0 handler_name=Inca file:"%new%"
          RunWait %COMSPEC% /c %inca%\cache\apps\ffmpeg.exe %cmd%, , Hide
          if !ErrorLevel
            break
          }
        }
      if ErrorLevel
        return
      }
    if (!suffix && ext != "mp3")
      {
      FileSetTime, %ModifiedTime%, %new%, M
      FileSetTime, %CreationTime%, %new%, C
      FileRecycle, %src%
      }
    orig = %profile%\Downloads\%filen% %suffix%.%ext%
    orig = %orig%
    FileMove, %new%, %orig%, 1
    return orig
    }


  RenderPage(silent)							; construct web page from media list
    {
    Critical								; stop pause key & timer interrupts
    if !path
      return
    lastFolder =
    menu_item =
    mediaList =
    if (command != "More")
      lastIndex := 0
    type = video							; prime for list parsing
    if playlist
      page := 300
    else page := 90							; media entries per chunk
    FileRead, list, %inca%\cache\temp\%folder%.txt
    Loop, Parse, list, `n, `r 						; split big list into smaller web pages
      if (A_Index > lastIndex && A_Index < lastIndex + page + 1)
        {
        item := StrSplit(A_LoopField, "/")				; sort filter \ src \ media type \ ext
        id := item.1
        source := item.2
        type := item.3
        start := item.4
        mediaList(A_Index, source, start)				; append mediaList
        }
    lastIndex += page
    if (command == "More")						; continuous scrolling
      {
      FileDelete, %inca%\cache\html\temp.txt				; server polling file
      if (lastIndex - listSize < page && listSize > page)
        FileAppend, %mediaList%, %inca%\cache\html\temp.txt, UTF-8
      else lastIndex := listSize
      return
      }
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
    FileRead, ini, %inca%\ini.ini
    ini := StrReplace(ini, "`r`n", "|")					; java cannot accept cr in strings
    ini := StrReplace(ini, "'", ">")					; java cannot accept ' in strings
    max_height := Floor(A_ScreenHeight * 0.34)				; max image height in web page
    Loop, Parse, sortList, `|						; html ribbon highlighting
      {
      if InStr(A_LoopField, sort)
        if InStr(toggles, "Reverse")
          x%A_Index% = border-top:0.1px solid pink
        else x%A_Index% = border-bottom:0.1px solid pink
      if InStr(toggles, A_LoopField)
        x%A_Index% = color:red
      }
    if x12								; filter videos, images audio from ribbon
      type = Fav
    else if x11
      type = Audio
    else if x10
      type = Image
    else if x9
      type = Video
    else type = Type
    if searchTerm
      x20 = color:red
    else if (!playlist && InStr(fol,folder))
      x21 = color:red
    else if (playlist && InStr(path,"\music\"))
      x22 = color:red
    else if (playlist && InStr(path,"\fav\"))
      x23 = color:red
    if playlist
      pl = Playlist
    panelList =								; next sections fills top panel element
    scroll = Fol							; for scroll to 'fol' in top panel
    if searchTerm
      {
      st := searchTerm
      StringReplace, st, st, #, `%23, All				; html cannot have # or ' passing parameters
      StringReplace, st, st, `', &apos;, All
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
      if searchTerm							; on load scroll top panel to search letter eg 'M'
        scroll = my%x%

    container = <div id='Music' style='font-size:2em; color:pink; text-align:center'>&#x266B;</div>`n
    container := fill(container)
    Loop, Parse, music, `|
      if A_LoopField
        {
        SplitPath, A_Loopfield,,,,x
        if (x == folder)
          container = %container%<c class='p2' style='color:pink' onmousedown="inca('Path','','','music|%A_Index%')">%x%</c>`n
        else container = %container%<c class='p2' onmousedown="inca('Path',index,'','music|%A_Index%')">%x%</c>`n
        if !Mod(A_Index,4)
          container := fill(container)
        }
    if container
      fill(container)

    if subfolders							; add list to top panel element
      {
      container = <div id='Sub' style='font-size:2em; color:pink; text-align:center'>&#x1F4BB;&#xFE0E;</div>`n
      container := fill(container)
      Loop, Parse, subfolders, `|
        {
        StringTrimRight, x, A_Loopfield, 1
        array := StrSplit(x,"\")
        x := array.MaxIndex()
        fname := array[x]
        if (array[x] == folder)
          container = %container%<c class='p2' style='color:pink' onmousedown="inca('Path','','','subs|%A_Index%')">%fname%</c>`n
        else container = %container%<c class='p2' onmousedown="inca('Path',index,'','subs|%A_Index%')">%fname%</c>`n
        if !Mod(A_Index,4)
          container := fill(container)
        }
      if (subfolders && container)
        fill(container)
      }

    container = <div id='Fol' style='font-size:2em; color:pink; text-align:center'>&#x1F4BB;&#xFE0E;</div>`n
    container := fill(container)
    Loop, Parse, fol, `|						; add folder list to top panel
      if A_LoopField
        {
        StringTrimRight, y, A_Loopfield, 1
        SplitPath, y,,,,x
        if (x == folder)
          container = %container%<c class='p2' style='color:pink' onmousedown="inca('Path','','','fol|%A_Index%')">%x%</c>`n
        else container = %container%<c class='p2' onmousedown="inca('Path',index,'','fol|%A_Index%')">%x%</c>`n
        if !Mod(A_Index,4)
          container := fill(container)
        }
    if container
      fill(container)

    container = <div id='Fav' style='font-size:1.8em; color:pink; text-align:center'>&#10084;</div>`n
    container := fill(container)
    Loop, Parse, fav, `|						; add favorites to top panel
      if A_LoopField
        {
        SplitPath, A_Loopfield,,,,x
        if (x == folder)
          container = %container%<c class='p2' style='color:pink; font-size:0.9em; margin-left:0.2em' onmousedown="inca('Path','','','fav|%A_Index%')">%x%</c>`n
        else container = %container%<c class='p2' onmousedown="inca('Path',index,'','fav|%A_Index%')">%x%</c>`n
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
      if A_Loopfield
        x := SubStr(A_Loopfield, 1, 1)
      if (ch != x)							; add search word list to top panel
        {
        if container
          fill(container)
        container = <div id='my%x%' style='font-size:2.4em; color:pink; text-align:center'>%x%</div>`n
        container := fill(container)
        count := 0
        }
      ch := x
      count+=1
      if (searchTerm == A_Loopfield)
        container = %container%<c class='p2' style='color:pink' onmousedown="inca('Search',index,'','search|%A_Index%')">%A_Loopfield%</c>`n
      else container = %container%<c class='p2' onmousedown="inca('Search',index,'','search|%A_Index%')">%A_Loopfield%</c>`n
      if !Mod(count,4)
        container := fill(container)
      }
    if container
      fill(container)

  x = %searchTerm%|
  if (searchTerm && !InStr(search, x))
    add = &#xFF0B;
  if subfolders
    subs = sub
  StringReplace, folder_s, folder, `', &apos, All			; htm cannot pass '
  if 1*Setting("Pause")
    paused := 1
  else paused := 0
  if 1*Setting("Mute")
    mute = yes
  else mute = no
  if 1*Setting("WheelDir")
    wheelDir := 1
  else wheelDir := -1
  if (command == "View")
    keepSelected := selected

header = <!--, %sort%, %toggles%, %listView%, %playlist%, %path%, %searchPath%, %searchTerm%, %subfolders%, -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" href="%server%c:/inca/cache/icons/inca.ico">`n<link rel="stylesheet" href="%server%c:/inca/css.css">`n</head>`n`n

body = <body id='myBody' class='myBody' onload="myBody.style.opacity=1; globals('%folder_s%', %wheelDir%, '%mute%', %paused%, '%sort%', %filt%, %listView%, '%keepSelected%', '%playlist%', %index%); %scroll%.scrollIntoView()">`n`n

<div id='myVig' class='vig'></div>`n
<video id='myPic' class='pic' muted onwheel='wheelEvent(event)' onmouseout='thumb.pause()'></video>`n
<video id="myPlayer" class='player' type="video/mp4" muted onwheel='wheelEvent(event)'></video>`n
<div id='mySeek' class='seekbar'><span id='myDur'></span></div>`n
<span id='mySelected' class='selected'></span>`n
<div id='myContent' class='mycontent' onwheel='if (Click) wheelEvent(event)'>`n 
  <div id='myView' class='myview'>`n`n %mediaList%</div></div>`n`n

<div id="myNav" class="context">
  <div class="trigger">
    <a id="myInca">...</a>

    <div id='myAlt' class="menu alt">`n
      <a id="myCopy">copy</a>`n
      <a id="myPaste">paste</a>`n
      <a id="myCut">cut</a>`n
      <a id="myIndex">index</a>`n
      <a id="myMp3">mp3</a>`n
      <a id="myMp4">mp4</a>`n
      <a id="myJoin">join</a>`n
      <a id="myJpg">jpg</a>`n
      <a id="mySrt">srt</a>`n
    </div>
  </div>`n

  <div id='myDefault'>
    <div class="menu editor">`n
      <a>New Voice</a>`n
      <a>New Video</a>`n
      <a>New Media</a>`n
      <a>Clone Voice</a>`n
      <a>Top Tail jpg</a>`n
      <a>Duplicate</a>
    </div>

    <div class="menu default" onwheel='wheelEvent(event)'>`n
      <a id="mySelect">Select</a>`n
      <a id="myFavorite">Fav</a>`n
      <a id="myMute">Mute</a>`n
      <a id="myPitch">Pitch</a>`n
      <a id="myPause">Pause</a>`n
      <a id="mySpeed"></a>`n
      <a id="mySkinny"></a>`n
      <a id="myFlip">Flip</a>`n
      <a id="myCue">Cue</a>`n
      <a id="myCap">Caption</a>`n
    </div>
  </div>
</div>`n`n

<div id='myMenu'>
  <div id='z1' class='fade' style='height:190px'></div><div id='z2' class='fade' style='top:190px; background: linear-gradient(#0e0c05ff, #0e0c0500)'></div>`n
  <div id='myPanel' class='myPanel'><div class='panel'><div class='innerPanel'>`n`n%panelList%`n</div></div>`n`n

  <div id='myRibbon1' class='ribbon' style='font-size: 1.2em'>`n
  <a id='myList' style='color:red; min-width:5.8em; font-weight:bold'>%listSize%</a>`n
  <a id='myMusic' style='max-width:1.8em; %x22%' onmousedown="inca('Path','','','music|1')" onmouseover="setTimeout(function() {if(myMusic.matches(':hover'))Music.scrollIntoView()},200)">&#x266B;</a>`n
  <a id='mySub' style='max-width:2em; font-size:0.7em; %x8%' onmousedown="inca('Recurse')" onmouseover="setTimeout(function() {if(mySub.matches(':hover'))Sub.scrollIntoView()},200)">%subs%</a>`n
  <a id='myFol' style='max-width:2.8em; %x21%' onmousedown="inca('Path','','','fol|1')" onmouseover="setTimeout(function() {if(myFol.matches(':hover'))Fol.scrollIntoView()},200)">&#x1F4BB;&#xFE0E;</a>`n
  <a id='myFav' style='translate: 0 0.1em; %x23%' onmousedown="inca('Path','','','fav|1')" onmouseover="setTimeout(function() {if(myFav.matches(':hover'))Fav.scrollIntoView()},200)">&#10084;</a>`n
  <a id='mySearch' style='max-width:2.8em; %x20%' onwheel="wheelEvent(event)" onmousedown="inca('SearchBox','','',myInput.value)" onmouseover="setTimeout(function() {if(mySearch.matches(':hover'))filter(id)},140)">&#x1F50D;&#xFE0E;</a>`n
  <input id='myInput' class='searchbox' type='search' autocomplete='off' value='%st%' onmouseenter="if (this.value=='%st%') this.value='%lastSearch%'; this.select()" onmouseover="overText=1; this.focus()" onmouseout='overText=0'>
  <a id='Add' style='max-width:3em; font-size:1.2em; color: red' onmousedown="inca('Add','','',myInput.value)">%add%</a>`n
  </div>`n`n

  <div id='myRibbon2' class='ribbon' style='width: 90`%; background:#1b1814' onwheel="wheelEvent(event)">`n
  <a style='width: 3em; font-size: 1.8em' onmousedown='window.history.back()'>&#129028;</a>`n
  <a id='myPlaylist' style='%x13%' onmousedown="inca('Playlist')">%pl%</a>`n
  <a id='myDate' style='%x4%' onmousedown="inca('Date', filt)">Date</a>`n
  <a id='myDuration' style='%x3%' onmousedown="inca('Duration', filt)"> Duration</a>`n
  <a id='myShuffle' style='%x1%' onmousedown="inca('Shuffle')">Shuffle</a>`n
  <a id='mySize' style='%x5%' onmousedown="inca('Size', filt)">Size</a>`n
  <a id='myAlpha' style='%x2%' onmousedown="inca('Alpha', filt)">Alpha</a>`n
  <a id='myType' style='%x6%' onmousedown="inca('Type', filt)">%type%</a>`n
  <a id='myThumbs' onmouseup="inca('View',0)">Thumb</a>`n 
  <a id='myWidth'>Width</a></div></div></div>`n`n
<div id='myMask' class="mask" onwheel="wheelEvent(event)"></div>`n`n

    StringReplace, header, header, \, /, All
    StringReplace, body, body, \, /, All
    script = <script src="%server%c:/inca/cache/apps/pitch.js"></script>`n
    script = %script%<script src="%server%c:/inca/captions.js"></script>`n
    script = %script%<script src="%server%c:/inca/java.js"></script>`n
    htm = %header%%body%%script%`n</body>`n</html>`n
    FileDelete, %inca%\cache\html\%folder%.htm
    FileAppend, %htm%, %inca%\cache\html\%folder%.htm, UTF-8
    htm = %server%%inca%\cache\html\%folder%.htm
    StringReplace, htm, htm, \,/, All
    Gui PopUp:Cancel
    lastClick =
    if silent
      return
    FileDelete, %inca%\cache\html\temp.txt				; server polling file
    if (!incaTab || !WinExist("ahk_group Browsers") || lastClick=="MButton")
      run, %htm%
    else if (incaTab == folder) 
      send {F5}
    else FileAppend, %htm%, %inca%\cache\html\temp.txt, UTF-8		; trigger node server
    sleep 200
    incaTab := folder
    Loop, 30								; wait until page loaded
      {
      WinGetTitle, title, A
      If InStr(title, incaTab)
        break
      Sleep, 100
      }
    }


  mediaList(j, input, start)						; spool sorted media files into web page
    {
    Critical
    poster =
    if (InStr(transcoding, input) || (transcoding && InStr(input, "temp_")))
      input = 							; hide locked files
    if DetectMedia(input)
      thumb := src
    else thumb = %inca%\cache\icons\no link.png
    x := RTrim(mediaPath,"\")
    SplitPath, x,,,,thisFolder
    if (searchTerm && lastFolder != thisFolder && sort == "Alpha")
      fold = <div style="font-size:1.4em; color:pink; width:100`%">%thisFolder%</div>`n
    lastFolder := thisFolder
    if (searchTerm || InStr(toggles, "Recurse"))
      fo = <td style='width:5em; padding-right:3em; text-align:right'>%thisFolder%</td>
    FileRead, dur, %inca%\cache\durations\%media%.txt
    durT := Time(dur)
    if (type == "document" || type == "image" || !dur)
      dur := 0
    FileRead, cues, %inca%\cache\cues\%media%.txt
    favicon =
    x = %media%.%ext%
    if !playlist
      Loop, Parse, allfav, `n, `r
        if InStr(A_Loopfield, x)
          {
          favicon = &#8203 &#x2764					; favorite heart symbol
          start := StrSplit(A_Loopfield,"|").2
          break
          }
    seek := Round(start,1)
    if (type == "video")
      IfExist, %inca%\cache\posters\%media% %seek%.jpg			; replace poster with fav poster
        thumb = %inca%\cache\posters\%media% %seek%.jpg
      else IfExist, %inca%\cache\posters\%media%.jpg
        thumb = %inca%\cache\posters\%media%.jpg
      else 
        {
        cmd = %inca%\cache\apps\ffmpeg.exe -i "%thumb%" -y "%inca%\cache\temp\%media%.jpg"
        runwait, %cmd%,, Hide
        thumb = %inca%\cache\temp\%media%.jpg
        noIndex = <span class='warning'>no index</span>`n 
        }
    FileGetSize, size, %src%, K
    if (type=="document")
      size := Round(size)
    else if (size < 9900)
      size := Round(size/1000,1)
    else size := Round(size/1000)
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
    preload = 'auto'							; browser to render non indexed media
    IfExist, %thumb%
      {
      preload = 'none'							; faster page load
      StringReplace, thumb, thumb, `%, `%25, All			; html cannot have % in filename
      StringReplace, thumb, thumb, #, `%23, All				; html cannot have # in filename
      poster = %thumb%
      }
    else
      noIndex = <span class='warning'>no index</span>`n 
    if !start
      start = 0.000
    else start := Round(start,3)
    data =
    if (ext=="txt")
      data = %src%
    else IfExist, %inca%\cache\srt\%media%.srt
      data = %inca%/cache/srt/%media%.srt
 IfExist, %inca%\cache\json\%media%.json
  data = %inca%/cache/json/%media%.json
    if (data && type!="document")
      favicon = %favicon% &#169 
    IfNotExist, %src%
      noIndex = <span class='warning'>no media</span>
    src = %src%
    StringReplace, src, src, `%, `%25, All				; html cannot have % in filename
    StringReplace, src, src, #, `%23, All				; html cannot have # in filename
    StringReplace, data, data, `%, `%25, All
    StringReplace, data, data, #, `%23, All
    StringReplace, media_s, media, `', &apos;, All
    if !size
      size = 0								; cannot have null size in Param()


    if (type == "image")
      media_s := Chr(0x3048) . " " . media_s
    if (ext=="txt")
      src = "%server%%poster%"
    else src = "%server%%src%"
    poster = poster="%server%%poster%"
    data = "%server%%data%"

    caption = <pre id="dat%j%" style='display: none' type="text/plain" data=%data%></pre>`n

    if listView
      mediaList = %mediaList%%fold%<table id='entry%j%' data-params='%type%,%start%,%dur%,%size%' onmouseenter='if (gesture) sel(%j%)' onmouseover='overThumb(%j%)'`n onmouseout="thumb%j%.style.opacity=0; thumb.src=''">`n <tr><td><video id='thumb%j%' class='thumb2' onwheel='if (zoom > 1) wheelEvent(event)' %poster%`n preload=%preload% muted loop type="video/mp4"></video>`n <video id="vid%j%" style='display: none' src=%src% preload='none' type='video/mp4'></video></td>`n <td>%ext%</td><td>%size%</td><td style='min-width: 6em'>%durT%</td><td>%date%</td><td style='width:3em'>`n <div id='myFavicon%j%' class='favicon' style='position: relative; text-align: left; translate:2em 0.4em'>%favicon%</div></td>`n <td style='width: 80vw'><input id="title%j%" class='title' style='opacity: 1; position: relative; width:100`%; left:-0.2em' onmouseover='overText=1' autocomplete='off' onmouseout='overText=0; Click=0' type='search' value='%media_s%' oninput="renamebox=this.value; lastMedia=%j%"></td>`n %fo%</tr></table>%caption%<span id='cues%j%' style='display: none'>%cues%</span>`n`n

    else mediaList = %mediaList%<div id="entry%j%" class='entry' data-params='%type%,%start%,%dur%,%size%'>`n <span id='myFavicon%j%' onmouseenter='overThumb(%j%)' class='favicon'>%favicon%</span>`n <input id='title%j%' class='title' style='top:-1.1em' type='search'`n value='%media_s%'`n oninput="renamebox=this.value; lastMedia=%j%"`n onmouseover="overText=1; this.style.width=1+this.value.length/2+'em'"`n onmouseout="overText=0; this.style.width=null">`n <video id="thumb%j%" class='thumb' onwheel='if (zoom > 1) wheelEvent(event)' onmouseenter="overThumb(%j%); if (gesture) sel(%j%)"`n onmouseout="thumb.pause()" onmouseup='if (gesture) Param(%j%)' %poster%`n preload=%preload% loop muted type='video/mp4'></video>`n <video id="vid%j%" style='display: none' src=%src% preload='none' type='video/mp4'></video>%noIndex%`n <span id='cues%j%' style='display: none'>%cues%</span></div>`n %caption%`n
    }


  Ffmpeg: 								; mp3, mp4, indexing - async processing
    transcoding =
    select := selected							; preserve selected
    selected =
    serverTimout := A_TickCount
    time := address
    cue := StrSplit(value, "|").1
    el_id := StrSplit(value, "|").2
    skinny := StrSplit(value, "|").3
    fld := folder
    fileList =
    FileRead, str, %inca%\cache\temp\%folder%.txt			; list of media in htm
    Loop, Parse, str, `n, `r
    fileList .= StrSplit(A_LoopField, "/").2 . "|" . Round(StrSplit(A_LoopField, "/").4,1) . "`r`n"
    if (select && !InStr(el_id, "Index"))
      Loop, Parse, select, `,						; index selected files
        transcoding .= StrSplit(fileList,"`r`n")[A_LoopField]		; media to lock
    RenderPage(1)							; silent update htm
    send, {F5}								; clear selected on tab
    Critical Off
    sta := 0
    end := 0
    if cue
      if (time > cue + 1)
        sta := cue, end := time
      else if (time < cue - 1) 
        sta := time, end := cue
      else if (time >= cue)
        sta := cue
      else sta := 0, end := cue
    end := Round(end,1)
    sta := Round(sta,1)
    if InStr(el_id, "Join")
      Join(select)
    else if (el_id == "myIndex" && !select)				; index whole folder
      if (playlist || searchTerm)
        Loop, Parse, filelist, `n, `r
          Index(A_Loopfield, 0)
    else Loop, files, %path%*.*
      Index(A_LoopFileFullPath, 0)
    else Loop, Parse, select, `,					; index selected files
      if A_LoopField
        {
        entry := StrSplit(fileList, "`r`n")[A_LoopField]
        source := StrSplit(entry, "|").1
        SplitPath, source,,,,med
        GuiControl, Indexer:, GuiInd, %A_Index% - processing - %med%
        output = %profile%\Downloads\%med% @%time%.jpg
        whisper = %inca%\cache\apps\Faster-Whisper-XXL\faster-whisper-xxl.exe
        if InStr(el_id, "mySrt")
        runwait, "%whisper%" "%source%" --model tiny.en --language en --output_format srt --output_dir "%inca%\cache\srt", , Hide
        else if (DetectMedia(source) == "image")
          cmd = %inca%\cache\apps\ffmpeg.exe -i "%source%" -vf "scale=iw*%skinny%:ih" -y "%output%"
        else cmd = %inca%\cache\apps\ffmpeg.exe -ss %time% -i "%source%" -vf "scale=iw*%skinny%:ih" -y -vframes 1 "%output%"
        if InStr(el_id, "Index")
          Index(entry, 1)
        else if InStr(el_id, "myJpg")
          runwait, %cmd%,, Hide
        else if (InStr(el_id, "myMp3") || InStr(el_id, "myMp4"))
          if (new := Transcode(el_id, source, sta, end))
            Index(new, 1)
        GuiControl, Indexer:, GuiInd
        }
    transcoding =
    CreateList(1)
    if (incaTab && folder == fld)					; if in same tab after processing
      {
      RenderPage(0)
      if (A_TickCount - serverTimout > 9999)				; server timout
        send, {F5}
      }
    return


  VolTimer:
    SoundSet, volume + 0.1
    SoundSet, volume
    return


  SlowTimer:								; every second
    Critical Off
    GuiControlGet, control, Indexer:, GuiInd
    FileGetTime, ytdlp, %inca%\cache\apps, M
    FileGetTime, downloads, %profile%\Downloads, S
    FileRead, history, %inca%\fav\History.m3u
    if (A_Now - downloads < 3)
      Loop, Files, %profile%\Downloads\*.*
       if !InStr(history, A_LoopFileName)
        {
        SplitPath, A_LoopFileFullPath, fileWithExt, dir, ext, nameNoExt
        SplitPath, lastMedia,,,, fol
        fol := SubStr(fol, 1, 100)
        assets := inca . "\assets\" . fol
        FileCreateDir, %assets%
        destCopy := assets . "\" . nameNoExt . "." . ext
        if (ext == "mp3" || ext == "wav")
          FileCopy, %A_LoopFileFullPath%, %destCopy%, 1
        FileAppend, %destCopy%|0.0`r`n, %inca%\fav\History.m3u, UTF-8
        }
    Files := {}
    if (A_Now - ytdlp > 4 && A_Now - downloads > 4 && InStr(control, ".........."))
      GuiControl, Indexer:, GuiInd
    if (A_Now - downloads > 3)						; stop re-triggering control message
      if (A_Now - ytdlp < 3)
        GuiControl, Indexer:, GuiInd, ...........................................
      else Loop, Files, %inca%\cache\apps\*.*
        if (A_LoopFileExt == "webm" || A_LoopFileExt == "mp4" || A_LoopFileExt == "mkv")
          if (encoded := Transcode("myMp4", A_LoopFileFullPath,0,0))
            {
            GuiControl, Indexer:, GuiInd, %A_LoopFileFullPath%.................................................................
            Index(encoded, 1)
            FileMove, %encoded%, %profile%\Downloads, 1
            FileAppend, %encoded%|0.0`n, C:\inca\fav\history.m3u
            GuiControl, Indexer:, GuiInd
            }
          else FileRecycle, %A_LoopFileFullPath%
    Process, Exist, ffmpeg.exe
    if InStr(control, "transcoding")
      if !ErrorLevel
        GuiControl, Indexer:, GuiInd
    x := Setting("Sleep Timer") * 60000
    if (volume > 0 && A_TimeIdlePhysical > x)
      {
      volume -= 0.2
      SoundSet, volume
      }
    return


  TimedEvents:								; every 100mS
    GetBrowser()
    WinGetPos,wx,,w,,a
    if (w == A_ScreenWidth)
      fullscreen := 1
    else fullscreen := 0
    x := A_ScreenWidth-485
    y := A_ScreenHeight+16
    z := A_ScreenWidth-600
    if (!GetKeyState("LButton", "P"))
      IfWinActive, ahk_group Browsers
        if (incaTab && wx + w > A_ScreenWidth+50)
          WinMove, ahk_group Browsers,, 500, -2, %x%, %y%
    IfWinActive, Notepad
      if (wx != 622)
        WinMove, ahk_class Notepad,, 622, -2, %z%, %y%
    MouseGetPos,,, id 							; get the window below the mouse 
    WinGet, cur, ID, ahk_id %id%
    WinGet, desk, ID , ahk_class Progman
    WinGet, brow, ID , ahk_group Browsers
    if incaTab
      {
      FileRead, messages, *P65001 C:\inca\cache\html\in.txt		; utf codepage
      if messages
        {
        FileDelete, %inca%\cache\html\in.txt
        Messages(messages)
        }
      }
    Gui, background:+LastFound
    Gui, background:Color, Black
    if incaTab
      WinSet, Transparent, % Setting("Ambiance")
    else WinSet, Transparent, 0
    if (incaTab && fullscreen)
      WinSet, Top,,ahk_group Browsers
    FormatTime, time,, h:mm
    if (click || time != ctime)
      {
      x =
      if volume
        x := Round(volume)
      ctime := time
      Gui, Status:+lastfound
      WinSet, TransColor, 0 20
      Gui, Status:Font, s20 cWhite, Segoe UI
      GuiControl, Status:Font, GuiSta
      GuiControl, Status:, GuiSta, %time%  %x%
      Gui, Status: Show, NA
      }
    if (!click || gesture < 0)
      gui, vol: hide
    return







