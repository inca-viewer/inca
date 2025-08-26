
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
	GroupAdd, Browsers, Mozilla Firefox	; firefox blocks back mouse button

	#WinActivateForce			; stops taskbar flashing up
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
        Global searchPath			; current search paths
        Global inca				; default folder path
        Global list				; sorted media file list
        Global listId				; pointer to media
        Global listSize				; qty of media
        Global selected :=""			; selected files from web page
        Global searchTerm			; eg. all files with 'japan' in name
        Global lastSearch
        Global src				; current media file incl. path
        Global media				; media filename, no path or ext
        Global mediaPath
        Global type				; eg. video
	Global subfolders
        Global folder				; current folder name, no path
        Global path				; current folder path
        Global ext				; file extension
        Global incaTab				; browser tab title/folder only when tab open and active
        Global volume
        Global page := 1			; current page within list
        Global sort				; eg by date, dur, shuffle, size, alpha, ext...
	Global filt := 0			; secondary search filter eg. date, duration, Alpha letter
        Global click				; mouse click type
        Global timer				; click down timer
        Global listView := 0			; list or thumb view
        Global playlist				; playlist - full path
	Global xpos				; current mouse position
	Global ypos
        Global command				; java message commands to this program
        Global value				; message 1st value (selected is 2nd value)
        Global address				; message 3rd value (can be extended eg. ,,,)
        Global skinny				; edited media width
        Global seek
        Global target				; folder path
        Global reload
        Global browser				; current browser
        Global longClick
        Global fullscreen
        Global pages				; file list is broken down into smaller html pages
        Global poster				; htm thumbnail
        Global mediaList			; html of media content
        Global panelList			; html of top panel
        Global foldr
        Global index = 0			; scroll to index
        Global messages				; between browser java and this program
        Global gesture				; mouse gestures
        Global allFav				; all favorite shortcuts consolidated
        Global showSubs
        Global lastMedia
        Global cur				; window under cursor
        Global desk				; current desktop window
        Global indexSelected			; html media page to index (create thumbs)
        Global paused := 0			; default pause
        Global block := 0			; block flag
        Global flush := 0			; flag to flush excess wheel buffer
        Global dur				; media duration
        Global mute				; global mute
        Global start := 0			; default start time
        Global ctime				; last current time
        Global lastClip				; clipboard



    main:
      initialize()				; sets environment then waits for mouse, key or clipboard events
      WinActivate, ahk_group Browsers
      sleep 24
      default = #Path###%profile%\Pictures\
      if !GetBrowser() 				; no browser open
        Messages(default)			; process message
      SetTimer, TimedEvents, 50			; every 50mS - process server requests
      SetTimer, SlowTimer, 1000, -2		; show ffmpeg is processing
      return


    ~Esc up::
      ExitApp


     RButton::
    ~LButton::					; click events
    ~MButton::					; click events
      MouseDown()
      return


    XButton1::					; Back button
      Critical
      longClick =
      timer := A_TickCount + 350
      SetTimer, Timer_up, -350
      return
    Timer_up:					; long back key press
      IfWinActive, ahk_group Browsers
        send, ^w				; close tab
      else send, !{F4}				; or close app
      return
    XButton1 up::
      SetTimer, Timer_up, Off
      if (A_TickCount > timer)			; longClick already done ^
        return
      IfWinExist, ahk_class OSKMainClass
        WinClose, ahk_class OSKMainClass	; close onscreen keyboard
      else if WinActive("ahk_class Notepad")
        Send, {Esc}^s^w
      else if incaTab
        send, {Pause}				; close java media player
      else send, {XButton1}
      sleep 100
      MouseGetPos,,, cur 			; get window under cursor
      WinActivate, ahk_id %cur%
      return


    MouseDown()
      {
      Critical							; pause timed events
      gesture := 0
      longClick =
      wasCursor := A_Cursor
      timer := A_TickCount + 300				; set future timout 300mS
      MouseGetPos, xpos, ypos, id
      WinGet, cur, ID, ahk_id %id%
      WinGet, osd, ID, ahk_class OSKMainClass
      if (cur == osd)
        return
      StringReplace, click, A_ThisHotkey, ~,, All
      loop							; gesture detection
        {
        if (A_TickCount > timer)
          {
          longClick = true
          Critical off						; allow timer interrupts
          }
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P"))
          {
          if (click == "RButton" && !gesture)
            send, {RButton}
          Gui PopUp:Cancel
          gui, vol: hide
          break
          }
        if (Abs(x)+Abs(y) > 6)					; gesture started
          {
          gesture := 1
          MouseGetPos, xpos, ypos
          if (xpos < 15)					; gesture at screen edges
            xpos := 15
          if (xpos > A_ScreenWidth - 15 && click=="RButton")
            xpos := A_ScreenWidth - 15
          MouseMove, % xpos, % ypos, 0
          Gesture(x, y)
          }
        if (!gesture && longClick && click == "LButton" && wasCursor == "IBeam")
          {
          WinGetTitle title, A
          cmd = %inca%\cache\apps\yt-dlp.exe --no-mtime -f bestvideo+bestaudio "%ClipBoard%"
          if (InStr(title, "YouTube") && InStr(Clipboard, "https://youtu"))
            {
            Run %COMSPEC% /c %cmd% > "%inca%\cache\temp\yt-dlp.txt" 2>&1, , Hide
            PopUp("OK...",999,0,0)
            ClipBoard =
            }
          else if !incaTab
            Osk()							; onscreen keyboard
          break
          }
        }
      }


    ProcessMessage()							; messages from java/browser html
        {
        if (command == "Null")						; used as trigger to save text editing - see Java inca()
          return
        else if (command == "saveText")					; save text snip
          saveText()
        else if (command == "editCues")					; update media cues skinny, rate
          editCues()
        else if (command == "mp3" || command == "mp4")			; convert media to mp3 or mp4
          mp3mp4()
        else if (command == "Favorite")					; add media favorite to New.m3u
          Favorite()
        else if (command == "Delete")					; delete media
          Delete()
        else if (command == "Join")					; join video files together
          Join()
        else if (command == "Vibe")					; create srt caption file
          Vibe()
        else if (command == "Pitch")					; create srt caption file
          Pitch()
        else if (command == "Osk")					; create srt caption file
          Osk()
        else if (command == "Add" && address)
          Add()
        else if (command == "History")					; maintain play history
          History()
        else if (command == "Reload")					; reload web page
          Reload()
        else if (command == "Settings")					; open inca source folder
          Settings()
        else if (command == "Page")
          Page()
        else if (command == "Scroll")					; update scroll, width, height
          Scroll()
        else if (command == "Rename")					; rename media
          Rename()
        else if (command == "capEdit")					; save browser text editing
          capEdit()
        else if (command == "Path")
          Path()
        else if (InStr(sortList, command))
          Sort()
        else if (command == "Search" || command == "SearchBox")
          Search()
        else if (command == "Notepad")					; open media cues in notepad
          Notepad()
        else if (command == "View")					; change thumb/list view
          {
          PopUp("...",0,0,0)
          listView^=1
          index := value						; for scrollToIndex() in java
          reload := 2
          }
        else if (command == "Index")					; index folder (create thumbsheets)
          {
          indexSelected := selected
          selected =
          reload := 2
          SetTimer, indexPage, -100, -2
          }
        else if (command == "cueMedia")					; add media to text at scroll
          {
          FileDelete, %inca%\cache\cues\%media%.txt
          FileAppend, %value%, %inca%\cache\cues\%media%.txt, UTF-8
          Loop, Read, %inca%\fav\History.m3u
            LastMedia := A_LoopReadLine
          if address							; add last media from history
            FileAppend, `r`n%address%|media|%lastMedia%, %inca%\cache\cues\%media%.txt, UTF-8
          index := selected
          selected =
          reload := 2
          }
        else if (command == "addCue")					; add skinny, speed, goto at scroll
          {
          FileAppend, `r`n%value%, %inca%\cache\cues\%media%.txt, UTF-8
          selected =
          reload := 2
          }
        else if (command == "newCap")					; create new caption file
          {
          x = 1`r`n00:00,000 --> 00:07,000`r`n_______________
          FileAppend, %x%, %inca%\cache\captions\%media%.srt, UTF-8
          FileAppend, `r`n0.00|scroll|0|200|200, %inca%\cache\cues\%media%.txt, UTF-8
          reload := 2
          selected =
          }        else if (command == "Move")				; move entry within playlist
          {
          MoveEntry()
          reload := 3
          index := value						; for scrollToIndex() in java
          selected =
          }
        else if (command == "Pause")
          {
          config := RegExReplace(config, "Pause/[^|]*", "Pause/" . value)
          IniWrite, %config%, %inca%\ini.ini, Settings, config
          }
        else if (command == "Mute")					; set default player
          {
          config := RegExReplace(config, "Mute/[^|]*", "Mute/" . value)
          IniWrite, %config%, %inca%\ini.ini, Settings, config
          }
        }


    Osk() {
      if WinActive("ahk_group Browsers")
        {
        clp := Clipboard
        Clipboard =
        send, ^c
        ClipWait, 0
        address := Clipboard
        Clipboard := clp
        send, {Lbutton up}
        if address					; selected text long clicked over
          {
          path =
          reload := 1
          cmd = #SearchBox###%address%
          messages(cmd)					; search for files with search text
          return
          }
        }
      if !gesture					; open on screen keyboard
       IfWinNotExist, ahk_class OSKMainClass
        if Setting("osk")
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
            FileRead, list, %inca%\cache\temp\%incaTab%.txt
            if !list
              CreateList(1)
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
        messages := StrReplace(input, "/", "\")
        array := StrSplit(messages,"#")
        Clipboard := lastClip
; tooltip %messages%, 0						; for debug
        Loop % array.MaxIndex()/4
          {
          command := array[ptr+=1]
          value := array[ptr+=1]
          value := StrReplace(value, "*", "#")
          selected := array[ptr+=1]
          address := array[ptr+=1]
          if (command=="Path" || command=="Search" || InStr(sortList, command))	; get top menu panel path
            {
            x := StrSplit(address,"|").2				; ptr from html top panel entry
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
            if (click == "RButton")					; RClick click over panel
              return
            }
          if selected
            getMedia(StrSplit(selected, ",").1)
          if !command
            continue
          else ProcessMessage()
          }
        if (reload == 1)
          CreateList(1)
        else if (reload == 2)
          RenderPage()
        else if (reload == 3)
          CreateList(0)
        longClick =
        selected = 
        Gui PopUp:Cancel
        }


    Reload()
      {
      selected =
      index := value
      reload := 2
      }


    Settings()
      {
      Run, %inca%\
      sleep 400
      Winactivate, ahk_class CabinetWClass
      }


    Page()
      {
      if (command == "Page")
        page := value
      popup = Page %value%
      Popup(popup,0,0,0)
      reload := 2
      }


    Notepad()
      {
      if (value == "myCue")
        {
        IfExist, %inca%\cache\cues\%media%.txt
          Run, %inca%\cache\cues\%media%.txt
        return
        }
      else if (type == "document")
        {
        IfExist, %src%
          Run, %src%
        }
      else IfExist, %inca%\cache\captions\%media%.srt
        Run, %inca%\cache\captions\%media%.srt
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
        Loop, Parse, cues, `n, `r					; each line of cues
          if A_LoopField
            if !InStr(A_LoopField, "0.00|scroll")			; remember text scroll position
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
      reload := 3
      selected =
      }


    Path()
      {
      lastMedia := 0
      if (longClick && !selected)
        {
        run, %address%							; open source instead eg m3u
        send {LButton up}
        return
        }
      reload := 1
      if selected							; move/copy files
        {
        x := StrSplit(selected,",")
        index := x[x.MaxIndex()-1]					; scroll htm to end of selection
        MoveFiles()							; between folders or playlists
        reload := 3							; not show folder qty
        return								; to go to destination folder, remove return and else
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
        str := StrSplit(path,"\")					; cannot use splitPath
        folder := str[str.MaxIndex()-1]					; in case folder has .com in name
        }
      if selected
        if playlist
          sort = Playlist
        else sort = Date
      else GetTabSettings(0)						; load previous tab basic settings from cache
      selected =
      searchTerm =
      searchPath =
      filt := 0
      page := 1
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
      if (command = "Type") {
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
      reload := 1
      if (filt != value && value != searchTerm)				; new filter value only
        filt := value
      else if InStr(sortList, command)					; sort filter
        {
        if (command=="Pause")
          reload := 2
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
            toggles = %toggles%%command%				; add switch
          else StringReplace, toggles, toggles, %command%		; remove switch
        else sort := command
        if (StrLen(toggles) < 3)
          toggles =
        }
      if searchTerm
        Search()							; in case sorting within search
      }
 

    Search()
      {
      page := 1
      playlist =
      value := 0							; remove filt/index scroll variable
      reload := 1
      if (command == "SearchBox")
        if longClick
          address := StrReplace(address, " ", "+")
        else address := StrReplace(address, "+", " ")
      if (strlen(address) < 2)
        return
      address := RegExReplace(address, "^\w", Format("{:U}", SubStr(address, 1, 1)))	; fix firefox bug
      searchTerm = %address%
      lastSearch = %address%
      PopUp(searchTerm,0,0,0)
      if searchTerm							; search text from link or search box
        {
        folder := searchTerm
        GetTabSettings(0)						; load cached tab settings
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


    History()
      {
      if getMedia(StrSplit(selected, ",").1)
        if (folder != "History")
          {
          FileAppend, %src%|%value%`r`n, %inca%\fav\History.m3u, UTF-8
          Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\temp\history\%media%%A_Space%%value%.jpg",, Hide
          }
      lastMedia := src
      }


    Join()
      {
      str=
      src=
      if !selected
        return
      Loop, Parse, selected, `,
        if getMedia(A_LoopField)
          str = %str%file '%src%'`r`n
      FileAppend,  %str%, %inca%\cache\temp\temp1.txt, utf-8
      Popup("Joining Media",600,0,0)
      x = @echo off`r`nset `"temp=(pause & pause & pause)>nul`"`r`ntype `%1|(`%temp`% & findstr `"^`")`r`n
      FileAppend, %x%, %inca%\cache\temp\temp.bat 
      runwait, %inca%\cache\temp\temp.bat %inca%\cache\temp\temp1.txt > %inca%\cache\temp\temp.txt,,Hide
      runwait, %inca%\cache\apps\ffmpeg.exe -f concat -safe 0 -i "%inca%\cache\temp\temp.txt" -c copy "%mediaPath%\%media%- join.%ext%",, Hide
      src = %mediaPath%\%media%- join.%ext%
      FileDelete, %inca%\cache\temp\temp.bat
      FileDelete, %inca%\cache\temp\temp.txt
      FileDelete, %inca%\cache\temp\temp1.txt
      index(src,1)
      reload := 3
      }


    Vibe()
      {
      Loop, Parse, selected, `,
        if getMedia(A_LoopField)
          IfNotExist, %inca%\cache\original srt\%media%.srt
            run %profile%\AppData\Local\vibe\vibe.exe --file "%src%" --write "%inca%\cache\original srt\%media%.srt" --model "%profile%\AppData\Local\github.com.thewh1teagle.vibe\ggml-large-v3-turbo.bin" --format "srt"
      }


    Pitch()
      {
      Loop, Parse, selected, `,
        if getMedia(A_LoopField)
          {
          IfNotExist, %inca%\cache\original audio\%media%.*		; make media higher pitch and normalised
            {
            count := A_LoopField
            GuiControl, Indexer:, GuiInd, %A_Index% - Pitch - %media%
            FileGetTime, CreatedTime, %src%, C
            FileGetTime, ModifiedTime, %src%, M
            if (ext == "mp3" || ext == "m4a")
              FileCopy, %src%, %inca%\cache\original audio\%media%.%ext%
            else RunWait %inca%\cache\apps\ffmpeg.exe -i file:"%src%" -vn -c:a copy file:"%inca%\cache\original audio\%media%.m4a",, Hide
            if ErrorLevel
              continue
            x = rubberband=pitch=1.05,loudnorm=I=-16:TP=-1.5:LRA=11
            if (ext == "mp3")
              RunWait %inca%\cache\apps\ffmpeg.exe -i file:"%src%" -af "%x%" -y file:"%media%.%ext%",, Hide
            else RunWait %inca%\cache\apps\ffmpeg.exe -i file:"%src%" -c:v copy -c:a aac -af "%x%" -y file:"%media%.%ext%",, Hide
            if !ErrorLevel
              FileMove, %inca%\cache\apps\%media%.%ext%, %src%, 1
            }
          else								; restore original audio
            {
            if (ext == "mp3" || ext == "m4a")
              FileMove, %inca%\cache\original audio\%media%.%ext%, %src%, 1
            else RunWait %inca%\cache\apps\ffmpeg.exe -i file:"%src%" -i file:"%inca%\cache\original audio\%media%.m4a" -c:v copy -c:a copy -map 0:v:0 -map 1:a:0 -y file:"%media%.%ext%",, Hide
            FileRecycle, %inca%\cache\original audio\%media%.m4a
            FileMove, %inca%\cache\apps\%media%.%ext%, %src%, 1
            }
          FileSetTime, %CreatedTime%, %src%, C
          FileSetTime, %ModifiedTime%, %src%, M 
          }
      GuiControl, Indexer:, GuiInd
      index := count							; scroll to last conversion
      reload := 2
      selected =
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
        reload := 3
        }
      selected =
      return
      }


    Favorite()
      {
      if !selected
        return
      value := Round(value, 1)
      FileAppend, %src%|%value%`r`n, %inca%\fav\new.m3u, UTF-8
      if (type == "audio" || type == "video")
        Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
      if address
        FileAppend, 0.0|scroll|%address%`r`n, %inca%\cache\cues\%media%.txt, UTF-8	; add scroll if srt text exists
      AllFav()										; update consolidated fav list
      }


    mp3mp4()
      {
      cue := value
      time := address
      ex := command
      start := 0
      end := 0
      if !cue
        {
        Loop, Parse, selected, `,
          if getMedia(A_LoopField)
            {
            GuiControl, Indexer:, GuiInd, transcoding - %media%
            if (ex == "mp3")
              run, %inca%\cache\apps\ffmpeg.exe -i "%src%" -y "%mediaPath%\%media%.mp3",,Hide	; mp3
            else Transcode(start, end, src)
            }
        }
      else
        {
        GuiControl, Indexer:, GuiInd, transcoding - %media%
        if (time-cue >= 0 && time-cue < 1)
          start := time
        else if (cue-time > 0 && cue-time < 1)
          end := cue
        else if (cue < time)
          {
          start := cue
          end := time
          }
        else
          { 
          start := time
          end := cue
          }
        Transcode(start, end, src)
        }
      GuiControl, Indexer:, GuiInd
      selected =
      }


    saveText()
      {
      send, ^c
      sleep 500
      str := StrSplit(Clipboard, "`r`n").1 
      if (StrLen(str) > 64)
        str := SubStr(str, 1, 64)
      str = %str%
      str := RegExReplace(str, "[<>:""/\\|?*]")
      if !str
        return
      FileAppend, %Clipboard%, %path%%str%.txt, UTF-8
      IfExist, %path%%str%.txt
        Popup("Saved . . .",800,0,0)
      return
      }


    capEdit() 						; Save edited text or SRT file
      {
      str := address
      getMedia(selected)
      str := StrReplace(str, "<div><br></div>", "`r`n")
      str := StrReplace(str, "<div>", "`r`n")
      str := StrReplace(str, "<br>", "`r`n")
      str := StrReplace(str, "<\e>", "`r`n") 		; e is text element - note: / is reversed in Messages()
      str := StrReplace(str, "<\d>", "`r`n") 		; d is timestamp element
      str := StrReplace(str, "--&gt;", "-->")
      str := RegExReplace(str, "<.*?>") 		; Remove all HTML tags
      str := StrReplace(str, " ", " ")
      if (StrLen(str) < 10)
        return
      if (ext == "txt")
        {
        FileDelete, %src%
        FileAppend, %str%, %src%, UTF-8
        }
      else
        {
        str2 := ""
        time := ""
        last := ""					; detect `r`n`r`n
        ix := 1
        caption := ""
        Loop, Parse, str, `n, `r
          {
          if !A_LoopField
            {
            if last						; incremeent seconds of new caption
              time := RegExReplace(time, ":\K\d+", Format("{:02d}", (RegExMatch(time, ":\K\d+", m) ? m + 1 : 0)))
            if (caption && time)
              {
              str2 .= ix . "`r`n" . time . "`r`n" . Trim(caption, "`r`n") . "`r`n`r`n"
              ix++
              }
            caption := ""
            last = 1
            }
          else if InStr(A_LoopField, " --> ")
            {
            if (caption && time)
              {
              str2 .= ix . "`r`n" . time . "`r`n" . Trim(caption, "`r`n") . "`r`n`r`n"
              ix++
              }
            time := A_LoopField
            caption := ""
            last =
            }
          else 
            {
            caption .= A_LoopField . "`r`n"
            last =
            }
          }
        if (caption && time)
          str2 .= ix . "`r`n" . time . "`r`n" . Trim(caption, "`r`n") . "`r`n`r`n"
        str := str2
        FileDelete, %inca%\cache\captions\%media%.srt
        FileAppend, %str%, %inca%\cache\captions\%media%.srt, UTF-8
        }
      FormatTime, date, , dddd, MMMM d, yyyy h:mm:ss tt
      FileAppend, % "`n`n" . media . "`n" . date . "`n" . str, %inca%\cache\temp\backup.txt
      PopUp("saved", 400, 0, 0)
      }


    Add()
      {
      popup = Added
      if (InStr(playlist, "music\") && !InStr(music, address))			; new music playlist
        {
        music = |%music%%inca%\music\%address%.m3u
        FileAppend,,%inca%\music\%address%.m3u, utf-8
        IniWrite, %music%, %inca%\ini.ini,Settings,Music
        }
      else if (InStr(playlist, "fav\") && !InStr(fav, address))			; new fav playlist
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
             if (SubStr(source, 1, 1) != "#")
               spool(source, A_Index, start)
             }
           }
        else Loop, Parse, searchPath, `|
          Loop, Files, %A_LoopField%*.*, F%recurse%
            if A_LoopFileAttrib not contains H,S
              if (A_LoopFileSize > 0)					; for when files are still downloading
                if spool(A_LoopFileFullPath, A_Index, 0)
                  break 2
                else if (show==1 && ((listSize<10000 && !Mod(listSize,1000)) || !Mod(listSize,10000)))
                  PopUp(listSize,0,0,0)
        PopUp(listSize-1,0,0,0)
        StringTrimRight, list, list, 2					; remove end `r`n
        if (InStr(toggles, "Reverse") && sort != "Date" && sort != "Playlist")
            reverse = R
        if (!InStr(toggles, "Reverse") && (sort == "Date" || sort == "Playlist"))
            reverse = R
        if (sort == "Playlist" && !playlist)
          sort = Shuffle
        if (sort == "Type")
            Sort, list, %reverse% Z					; alpha sort
        else if (sort != "Shuffle")
            Sort, list, %reverse% Z N					; numeric sort
        if (sort == "Shuffle")
            Sort, list, Random Z
        if (sort == "Alpha" && playlist)
          Sort, list, %reverse% Z \					; filename alpha sort
        FileDelete, %inca%\cache\temp\%folder%.txt
        FileAppend, %list%, %inca%\cache\temp\%folder%.txt, UTF-8
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
            if (InStr(toggles, "Video") && med != "video")
              return
            if (InStr(toggles, "Image") && med != "image")
              return
            if (InStr(toggles, "Audio") && med != "audio")
              return
            if (count > 250000)
              {
              PopUp("folder too big",800,0,0)
              return 1
              }
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
            list = %list%%listId%/%input%/%med%/%start%`r`n
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
        page := 1							; default view settings if no html data
        filt := 0
        toggles =
        sort = Shuffle
        if (command == "SearchBox")
          sort = Duration
        if playlist							; default playlist sort
          sort = Playlist
        FileReadLine, array, %inca%\cache\html\%folder%.htm, 1		; embedded page data as top html comment
        if array
            {
            StringReplace, array, array, /, \, All
            array := StrSplit(array,", ")
            page := array.2
            pages := array.3
            sort := array.4
            toggles := array.5
            listView := array.6
            if all
              {
              playlist := array.7
              path := array.8
              searchPath := array.9
              searchTerm := array.10
              if searchTerm
                folder := searchTerm
              subfolders := array.11
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
        if longClick
          PopUp("Copying",0,0,0)
        else
          {
          PopUp("Moving",0,0,0)
          }
        if (A_TickCount < timer || !GetKeyState("LButton", "P"))
          longClick =
        else longClick = true
        fail =
        if (playlist && !InStr(address, "\inca\") && !longClick)
          popup = Cannot Move Shortcuts . . .
        else if (path == address && !longClick)
          popup = Same folder . . .
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
                FileAppend, %target%`r`n, %address%, UTF-8		; add media entry to playlist
                if (src && !InStr(path, "\inca\"))
                  Runwait, %inca%\cache\apps\ffmpeg.exe -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%0.0.jpg",, Hide
                }
            else if src
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
                  fail = %fail%,%A_Index%
                  popup = Duplicate %A_Index%
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
        if popup
          PopUp(popup,0,0,0) 
        }  


    DeleteEntries()							; playlist entries
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
            str := StrReplace(str, x,,1,1)				; mark entry as deleted
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
            getMedia(value)						; target now is place to move
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
          return
        FileMove, %src%, %mediaPath%\%new_name%.%ext%			; FileMove = FileRename
        if ErrorLevel
          return 1               
        new_entry := StrReplace(target, media, new_name)
        folders = %inca%\fav\*.m3u|%inca%\music\*.m3u
        Loop, Parse, folders, `|					; rename any entries within favorites
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
        FileMove, %inca%\cache\captions\%media%.srt, %inca%\cache\captions\%new_name%.srt, 1
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
        if InStr("pdf txt rtf doc epub mobi htm html js css ini ahk vtt srt bat", ex)
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
        id := Abs(id) + Setting("Page Size") * (page - 1)
        FileReadLine, str, %inca%\cache\temp\%folder%.txt, Abs(id)
        src := StrSplit(str, "/").2
        seek := StrSplit(str, "/").4
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
          volRef := volume
          if x<=0
            gesture := -1
          x*=1.4
          if volume < 10
            x /= 2						; finer adj at low volume
          if x < 100						; stop any big volume jumps
            volume += x/20
          if (volume < 0)
            volume := 0
          if (volume > 100)
            volume := 99
          SoundSet, volume
          if (volRef != Round(volume))
            {
            FormatTime, time,, h:mm
            volRef := Round(volume)
            if !volRef
              volRef=
            GuiControl, Status:, GuiSta, %time%    %volRef%
            }
          yv := A_ScreenHeight - 3
          xv := A_ScreenWidth * volume/101
          gui, vol: show, x0 y%yv% w%xv% h1 NA
          }
        if (click=="LButton" && desk==cur && !WinExist("ahk_class Notepad"))
          {
          WinActivate, ahk_group Browsers			; zoom browser page
          if (y < 0)
            send, ^0
          else send, ^{+}
          sleep 111
          }
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
        else lastClip := Clipboard
        LoadSettings()
        AllFav()							; create ..\fav\all fav.m3u
        FileDelete, %inca%\cache\temp\*.*
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
        Loop, Files, %inca%\cache\temp\history\*.jpg, FD		; clear temp history posters after 30 days
          {
          FileGetTime, t1, %A_LoopFileFullPath%, M
          t2 := A_Now
          t2 -= t1, days
          if (t2 > 30)
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
        Gui, Indexer:Show, x600 y%iy%, NA
        WinSet, TransColor, ffffff 0
        WinSet, TransColor, 0 140
        WinSet, ExStyle, +0x20
        SoundGet, volume
        }


     checkPlaylist()							; in case src files moved
       {
       FileRead, str, %playlist%
       Loop, Parse, str, `n, `r
         if %A_LoopField%
           {  
           source := StrSplit(A_Loopfield, "|").1
           start := StrSplit(A_Loopfield, "|").2
           detectMedia(source)
           x = %searchFolders%
           IfNotExist, %source%
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


    fill(in) {  
      panelList = %panelList%<div style="height:10`%; padding:0.5em; transform:rotate(90deg)">`n%in%</div>`n
      }



    indexPage:							; create thumbsheets
    Critical Off
    if indexSelected						; force index posters of selected media
      {
      Loop, Parse, indexSelected, `,
        if getMedia(A_Loopfield)
          {
          index(src,1)
          if playlist
            Run, %inca%\cache\apps\ffmpeg.exe -ss %seek% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%seek%.jpg",, Hide
          }
      return
      }
    FileRead, str7, %playlist%
    if playlist
      Loop, Parse, str7, `n, `r
        {
        src := StrSplit(A_Loopfield, "|").1
        start := StrSplit(A_Loopfield, "|").2
        detectMedia(src)
        GuiControl, Indexer:, GuiInd, indexing - %src%
        IfNotExist, %inca%\cache\posters\%media%%A_Space%%start%.jpg
          Runwait, %inca%\cache\apps\ffmpeg.exe -ss %start% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%start%.jpg",, Hide
        }
    else 
      {
      Loop, Files, %path%*.*, R
        index(A_LoopFileFullPath,0)
      }
    GuiControl, Indexer:, GuiInd
    return



    index(source, force)						; create thumbs, posters & durations cache
          {
          SplitPath, source,,fold,ex,filen
          med := DecodeExt(ex)
          if (med != "video" && med != "audio")
            return
          FileGetSize, size, %source%, K
          if (size < 100)
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
            FileAppend, %dur%, %inca%\cache\durations\%filen%.txt, UTF-8
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
            if (dur > 61)
                {
                t := 20	      						; try to skip any video intro banners
                dur -= 20
                }
            loop 180
                {
                y := Round(A_Index / 5)					; 36 video frames in thumbsheet
                if !Mod(A_Index,5)
                  {
                  runwait, %inca%\cache\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:480/dar -vframes 1 "%inca%\cache\temp\%y%.jpg",, Hide
                  if (A_Index == 5)
                    FileCopy, %inca%\cache\temp\1.jpg, %inca%\cache\posters\%filen%.jpg, 1	; 1st thumb is poster
                  if (!thumb && !force)
                    break
                  }
                t += (dur / 200)
                }
            if (thumb || force)
                {
                Runwait %inca%\cache\apps\ffmpeg -i %inca%\cache\temp\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
                if InStr(source, "\downloads\")
                  {
                  GuiControl, Indexer:, GuiInd, Transcoding......
                  Transcode(0,0,source)
                  }
                }
            GuiControl, Indexer:, GuiInd
            }
          }



    Transcode(start, end, src)
        {
        if start
          ss = -ss %start%
        if end
          to = -to %end%
        if (DetectMedia(src) != "video")
          return
        FileGetTime, CreationTime, %src%, C
        FileGetTime, ModifiedTime, %src%, M
        if ErrorLevel
          return
      FileDelete, c:\inca\cache\temp\meta.txt
      cmd = C:\inca\cache\apps\ffprobe.exe -v quiet -print_format json -show_streams -select_streams v:0 "%src%"
      RunWait, %ComSpec% /c %cmd% > "c:\inca\cache\temp\meta.txt",, Hide
      if ErrorLevel
        return
      FileRead, MetaContent, c:\inca\cache\temp\meta.txt
      if (!start && !end && (InStr(MetaContent, "h264_amf") || InStr(MetaContent, "Inca")))	; already transcoded so quit
        return
      if RegExMatch(MetaContent, """width"":\s*(\d+)", WidthMatch)
        Width := WidthMatch1 + 0
      if RegExMatch(MetaContent, """height"":\s*(\d+)", HeightMatch)
        Height := HeightMatch1 + 0
      if RegExMatch(MetaContent, """r_frame_rate"":\s*""(\d+)/(\d+)""", FrameRateMatch)
        FrameRate := (FrameRateMatch1 + 0) / (FrameRateMatch2 + 0)
      else if RegExMatch(MetaContent, """r_frame_rate"":\s*""(\d+\.?\d*)""", FrameRateMatch)
        FrameRate := FrameRateMatch1 + 0
      else
        FrameRate := 25
      if RegExMatch(MetaContent, """bit_rate"":\s*""(\d+)""", BitrateMatch)
        Bitrate := Ceil(BitrateMatch1 / 1000)
      else
        Bitrate := 0
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
      GOPFrames := Round(FrameRate)				; every second
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
        temp := "C:\Users\asus\Downloads\temp_" . media . ".mp4"
        encoders := "-c:v h264_amf -rc cqp -qp_i 22 -qp_p 24|-c:v h264_nvenc -preset p5 -rc vbr -b:v %MaxBitrate%k -bufsize %BufSize%k|-c:v h264_qsv -preset medium -global_quality 23|-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p"
        for index, encoder in StrSplit(encoders, "|")
          {
          try {
            cmd = -y -i file:"%src%" %ss% %to% %encoder% -vf scale=%Resolution% -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -g %GOPFrames% -keyint_min %GOPFrames% -maxrate %MaxBitrate%k -bufsize %BufSize%k -c:a aac -b:a 128k -ar 48000 -ac 2 -map 0:v:0 -map 0:a? -map 0:s? -c:s copy -f mp4 -movflags +faststart+separate_moof -metadata:s:v:0 handler_name=Inca file:"%temp%"
            RunWait %COMSPEC% /c %inca%\cache\apps\ffmpeg.exe %cmd%, , Hide
            if !ErrorLevel
              break
            }
          }
        if ErrorLevel
          {
          PopUp("Error...",900,0,0)
          return
          }
        if (!start && !end)
          FileRecycle, %src%
        else if start
          suffix = @%start%
        else suffix = @%end%
        if suffix
          new = %mediaPath%\%media% %suffix%.mp4
        else new = %mediaPath%\%media%.mp4
        FileMove, %temp%, %new%
        FileSetTime, %ModifiedTime%, %new%, M
        FileSetTime, %CreationTime%, %new%, C
        return 1
        }


    RenderPage()							; construct web page from media list
        {
        Critical							; stop pause key & timer interrupts
        if !path
          return
        if fullscreen							; address bar not work in fullscreen
          send, {F11}
        foldr =
        mediaList =
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
        ini := StrReplace(ini, "`r`n", "|")				; java cannot accept cr in strings
        ini := StrReplace(ini, "'", ">")				; java cannot accept ' in strings
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        count:=0
        listSize := 0
        type = video							; prime for list parsing
        page_s := Setting("Page Size")
        Loop, Parse, list, `n, `r 					; split big list into smaller web pages
          {
          item := StrSplit(A_LoopField, "/")				; sort filter \ src \ media type \ ext
          id := item.1
          source := item.2
          type := item.3
          start := item.4
          listSize += 1
          if ((listSize > (page-1) * page_s) && (listSize <= page * page_s))
            SpoolList(listSize, count+=1, source, start)
          }
        pages := ceil(listSize/page_s)
        Loop, Parse, sortList, `|					; html ribbon highlighting
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
        panelList =							; next sections fills top panel element
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

        container = <div id='Fav' style='font-size:1.8em; color:pink; text-align:center'>&#10084;</div>`n
        container := fill(container)
        Loop, Parse, fav, `|							; add favorites to top panel
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

        if subfolders								; add list to top panel element
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
        Loop, Parse, fol, `|							; add folder list to top panel
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
      add = Add
    if subfolders
      subs = sub
    StringReplace, folder_s, folder, `', &apos, All				; htm cannot pass '
    if 1*Setting("Pause")
      paused := 1
    else paused := 0
    if 1*Setting("Mute")
      mute = yes
    else mute = no
    if 1*Setting("WheelDir")
      wheelDir := 1
    else wheelDir := -1

header = <!--, %page%, %pages%, %sort%, %toggles%, %listView%, %playlist%, %path%, %searchPath%, %searchTerm%, %subfolders%, -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" type="image/x-icon" href="file:///%inca%/cache/icons/inca.ico">`n<link rel="stylesheet" type="text/css" href="file:///%inca%/css.css">`n`n</head>`n`n

body = <body id='myBody' class='myBody' onload="myBody.style.opacity=1; globals(%page%, %pages%, '%folder_s%', %wheelDir%, '%mute%', %paused%, '%sort%', %filt%, %listView%, '%selected%', '%playlist%', %index%); %scroll%.scrollIntoView()">`n`n

<video id="myPlayer" class='player' type="video/mp4" muted onwheel="wheelEvent(event)"></video>`n
<span id='myProgress' class='seekbar'></span>`n
<span id='mySeekbar' class='seekbar'></span>`n
<span id='mySelected' class='selected'></span>`n
<div id='capMenu' class='capMenu'>`n
<span id='myCancel' class='capButton' onmouseup="editing=0; inca('Reload',index)">&#x2715;</span>`n 
<span id='mySave' class='capButton' onmouseup="if (!longClick) inca('Null')">Save</span></div>`n`n
<div id='myContent' class='mycontent'>`n<div id='myView' class='myview'>`n`n %mediaList%</div></div>`n`n

<div id='myNav' class='context' onwheel='wheelEvent(event)'>`n
  <input id='myTitle' class='title' style='opacity: 1; color: lightsalmon; padding-left: 1.4em'>
  <video id='myPic' muted class='pic'></video>`n
  <a id='mySelect'>Select</a>`n
  <a id='myMute' onmousedown="muted^=1; inca('Mute', muted); myPlayer.muted=muted; myPlayer.volume=0.1">Mute</a>`n
  <a id='myFavorite'>Fav</a>`n
  <a id='mySkinny'></a>`n
  <a id='mySpeed'></a>`n
  <a id='myDelete' style='color:red' onmouseup="inca('Delete','',index)"></a>`n
  <a id='myIndex' onmouseup="inca('Index','',index)"></a>`n
  <a id='myFlip' onmouseup='flip()'>Flip</a>`n
  <a id='myCue'>Cue</a>`n
  <a id='myCap'>Caption</a>`n
  <a></a></div>`n`n

<div id='myMenu'>
  <div id='z1' class='fade' style='height:190px'></div><div id='z2' class='fade' style='top:190px; background: linear-gradient(#0e0c05ff, #0e0c0500)'></div>`n
  <div id='myPanel' class='myPanel'><div class='panel'>`n <div class='innerPanel'>`n`n%panelList%`n</div></div>`n`n

  <div id='myRibbon1' class='ribbon' style='font-size: 1.2em'>`n
    <a style='color:red; width:8em; font-weight:bold'>%listSize%</a>`n
    <a id='myMusic' style='max-width:4em; %x22%' onmousedown="inca('Path','','','music|1')" onmouseover="setTimeout(function() {if(myMusic.matches(':hover'))Music.scrollIntoView()},200)">&#x266B;</a>`n
    <a id='myFav' style='%x23%' onmousedown="inca('Path','','','fav|1')" onmouseover="setTimeout(function() {if(myFav.matches(':hover'))Fav.scrollIntoView()},200)">&#10084;</a>`n
    <a id='mySub' style='max-width:3em; font-size:0.7em; %x8%' onmousedown="inca('Recurse')" onmouseover="setTimeout(function() {if(mySub.matches(':hover'))Sub.scrollIntoView()},200)">%subs%</a>`n
    <a id='myFol' style='%x21%' onmousedown="inca('Path','','','fol|1')" onmouseover="setTimeout(function() {if(myFol.matches(':hover'))Fol.scrollIntoView()},200)">&#x1F4BB;&#xFE0E;</a>`n
    <a id='mySearch' style='%x20%' onwheel="wheelEvent(event)" onmousedown="inca('SearchBox','','',myInput.value)" onmouseover="setTimeout(function() {if(mySearch.matches(':hover'))filter(id)},140)">&#x1F50D;&#xFE0E;</a>`n
    <input id='myInput' class='searchbox' type='search' autocomplete='off' value='%st%' onmouseover="overText=1; this.focus()" oninput="Add.innerHTML='Add'" onmouseout='overText=0'>
    <a id='Add' style='max-width:3em; font-size:0.8em; font-variant-caps:petite-caps' onmousedown="inca('Add','','',myInput.value)">%add%</a>`n
    <a id="myPage" onmousedown="inca('Page', page)" onwheel="wheelEvent(event)"></a>
    </div>`n`n

  <div id='myRibbon2' class='ribbon' style='background:#1b1814' onwheel="wheelEvent(event)">`n
    <a id='myMore' style='width:3em' onmouseout='ix=0'>&hellip;</a>
    <a id='myPause' style='width:3em' onmousedown="defPause^=1; inca('Pause',defPause)">Pause</a>`n
    <a id='myPlaylist' style='%x13%' onmousedown="inca('Playlist')">%pl%</a>`n
    <a id='myDate' style='%x4%' onmousedown="inca('Date', filt)">Date</a>`n
    <a id='myDuration' style='%x3%' onmousedown="inca('Duration', filt)"> Duration</a>`n
    <a id='myShuffle' style='%x1%' onmousedown="inca('Shuffle')">Shuffle</a>`n
    <a id='mySize' style='%x5%' onmousedown="inca('Size', filt)"">Size</a>`n
    <a id='myAlpha' style='%x2%' onmousedown="inca('Alpha', filt)">Alpha</a>`n
    <a id='myType' style='%x6%' onmousedown="inca('Type', filt)">%type%</a>`n
    <a id='myThumbs' onmouseout='setWidths(1,1000)' onmouseup="inca('View',0)">Thumb</a>`n 
    <a id='myWidth'>Width</a>`n
    </div></div></div>`n`n
<div id='myMask' class="mask" onwheel="wheelEvent(event)"></div>`n`n

      StringReplace, header, header, \, /, All
      StringReplace, body, body, \, /, All
      FileRead, script, %inca%\java.js
      script = <script>`n%script%`n</script>
      html = %header%%body%</div></div>`n%script%`n</body>`n</html>`n
      FileDelete, %inca%\cache\html\%folder%.htm
      FileAppend, %html%, %inca%\cache\html\%folder%.htm, UTF-8
      new_html = file:///%inca%\cache\html\%folder%.htm			; create / update browser tab
      StringReplace, new_html, new_html, \,/, All
      clip := clipboard
      clipboard := new_html
      IfWinNotExist, ahk_group Browsers
        run, %new_html%							; open a new web tab
      else if (folder == incaTab)					; just refresh existing tab
        send, {F5}
      else if (click == "MButton" || !incaTab)
        run, %new_html%							; open a new web tab
      else
        {
        send, ^l
        sleep 54
        send, {BS}
        sleep 24
        send, ^v
        Send, {Enter}
        }
      sleep 100
      clipboard := clip
      incaTab := folder
      Loop, 30								; wait until page loaded
        {
        WinGetTitle, title, A
        If InStr(title, incaTab)
          break
        Sleep, 100
        }
      if (click == "MButton")
        send, {MButton up}
      if fullscreen
        send, {F11}							; return to fullscreen
      FileDelete, %inca%\cache\html\%folder%.htm
      FileAppend, %html%, %inca%\cache\html\%folder%.htm, UTF-8
      Gui PopUp:Cancel
      }


    SpoolList(i, j, input, start)					; spool sorted media files into web page
        {
        Critical
        poster =
        favicon = &#8203
        if DetectMedia(input)
          thumb := src
        else thumb = %inca%\cache\icons\no link.png
        x := RTrim(mediaPath,"\")
        SplitPath, x,,,,y
        if (searchTerm && foldr != y && sort == "Alpha")
          fold = <div style="font-size:1.4em; color:pink; width:100`%">%y%</div>`n
        foldr := y
        if (searchTerm || InStr(toggles, "Recurse"))
          fo = <td style='width:5em; padding-right:3em; text-align:right'>%y%</td>
        FileRead, dur, %inca%\cache\durations\%media%.txt
        if (dur && !playlist)						; derive 1st thumbnail start time
          {
          if (dur > 61)
            start := 20.1 + (4 * (dur - 20)/200)
          else start := 4 * dur / 200
          }
        durT := Time(dur)
        if !dur
          dur := 0
        FileRead, cues, %inca%\cache\cues\%media%.txt
        if !playlist
          Loop, Parse, allfav, `n, `r
            if InStr(A_Loopfield, media)
              {
              favicon = &#8203 &#x2764					; favorite heart symbol
              start := StrSplit(A_Loopfield,"|").2
              break
              }
        if !start
          start = 0.0
        if (type == "video")
          IfExist, %inca%\cache\posters\%media% %start%.jpg		; replace poster with fav poster
            thumb = %inca%\cache\posters\%media% %start%.jpg
          else thumb =  %inca%\cache\posters\%media%.jpg
        if (type == "video" && folder == "History")
          thumb = %inca%\cache\temp\history\%media% %start%.jpg
        FileGetSize, size, %src%, K
        if (size < 9900)
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
        preload = 'auto'						; browser to render non indexed media
        IfExist, %thumb%
          {
          preload = 'none'						; faster page load
          StringReplace, thumb, thumb, `%, `%25, All			; html cannot have % in filename
          StringReplace, thumb, thumb, #, `%23, All			; html cannot have # in filename
          poster = poster="file:///%thumb%"
          }
        else
          noIndex = <span style='color:red; transform: translateY(-1.5em); display: block'>no index</span>`n 
        StringReplace, src, src, `%, `%25, All				; html cannot have % in filename
        StringReplace, src, src, #, `%23, All				; html cannot have # in filename
        StringReplace, media_s, media, `', &apos;, All
        start := Round(start,2)
        text=
        timestamp =
        if (ext=="txt")
          FileRead, text, %src%
        else IfExist, %inca%\cache\captions\%media%.srt
          {
          FileRead, str2, %inca%\cache\captions\%media%.srt
          Loop, Parse, str2, `n, `r
            {
            str = %A_LoopField%						; remove whitespace
            if InStr(str, "-->")					; timestamp element
              {
              x := SubStr(str, 1, 12)
              x := StrReplace(x, " --")					; in case no hrs in timestamp
              x := StrReplace(x, ",", ".")
              x := StrSplit(x, ":")
              if (!x.3)
                x := Round(x.1*60 + x.2,1)				; seconds format
              else
                x := Round(3600*x.1 + 60*x.2 + x.3,1)
              if (caption_lines != "")					; if there’s a previous caption
                {
                text = %text%<e contenteditable="true" id="my%j%-%prev_x%">%caption_lines%</e>
                caption_lines := ""					; reset caption_lines
                }
              text = %text%<d id="%j%-%x%">%str%</d>
              timestamp := true
              prev_x := x						; store current timestamp for next caption
              continue
              }
            else if timestamp
              {
              if (str != "")						; only add non-empty lines
                caption_lines := caption_lines ? caption_lines . "<br>" . str : str
              if (A_LoopField = "")					; empty line indicates end of caption
                {
                text = %text%<e contenteditable="true" id="my%j%-%prev_x%">%caption_lines%</e>
                caption_lines := ""					; reset caption_lines
                timestamp := false
                }
              }
            }
          if (caption_lines != "")   					 ; Handle the last caption if it exists
        text = %text%<e contenteditable="true" id="my%j%-%prev_x%">%caption_lines%</e>
        }
      if (ext=="txt")
        {
        text := StrReplace(text, "`r`n", "<br>")
        text = <e contenteditable="true">%text%</e>
        }

      if (text && type!="document")
        favicon = %favicon% &#169
      IfExist, %inca%\cache\original audio\%media%.*
        favicon = %favicon% &#9834

      if (type=="image")
        src = &nbsp;
      else src=src="file:///%src%"
      if !size
        size = 0							; cannot have null size in getParameters()

caption = <div id='srt%j%' class='caption' onmouseover='overText=1' onmouseout='overText=0'`n oninput="editing=index; playCap(event.target.id, 1)">%text%</div>

if listView
  mediaList = %mediaList%%fold%<table onmouseover='overThumb(%j%)'`n onmouseout="thumb%j%.style.opacity=0">`n <tr id='entry%j%' data-params='%type%,%start%,%dur%,%size%' onmouseenter='if (gesture) sel(%j%)'>`n <td>%ext%`n <video id='thumb%j%' class='thumb2' %src%`n %poster%`n preload=%preload% muted loop type="video/mp4"></video></td>`n <td>%size%</td>`n <td style='min-width: 6em'>%durT%</td>`n <td>%date%</td>`n  <td><div id='myFavicon%j%' class='favicon' style='position:absolute; text-align: left; translate:1.2em -0.8em'>%favicon%</div></td>`n <td style='width: 70vw'><input id="title%j%" class='title' style='opacity: 1; transition: 0.6s' onmouseover='overText=1' autocomplete='off' onmouseout='overText=0; Click=0' type='search' value='%media_s%'`n oninput="renamebox=this.value; lastMedia=%j%"></td>`n %fo%</tr>`n %caption%<span id='cues%j%' style='display: none'>%cues%</span></table>`n`n

else mediaList = %mediaList%<div id="entry%j%" class='entry' data-params='%type%,%start%,%dur%,%size%' onmouseenter='overThumb(%j%)'>`n <input id='title%j%' class='title' style='text-align: center' type='search'`n value='%media_s%'`n oninput="renamebox=this.value; lastMedia=%j%"`n onmouseover="overText=1; if((x=this.value.length/2) > view) this.style.width=x+'em'"`n onmouseout="overText=0; this.style.width='100`%'">`n <video id="thumb%j%" class='thumb' onmouseenter='if (gesture) sel(%j%)'`n onmouseup='if(gesture)getParameters(%j%)' onmouseout='this.pause()' %src%`n %poster%`n preload=%preload% loop muted type='video/mp4'></video>`n <span id='myFavicon%j%' class='favicon'>%favicon%</span>`n %noIndex%`n <span id='cues%j%' style='display: none'>%cues%</span></div>`n %caption%`n`n
}


    SlowTimer:
      GuiControlGet, control, Indexer:, GuiInd
      FileGetTime, LastModified, %inca%\cache\apps, M
      LastModified := A_Now - LastModified			; folder last modified (downloading)
      if (!control && LastModified < 3)
        GuiControl, Indexer:, GuiInd, Downloading...
      else if (LastModified > 3 && InStr(control, "Downloading..."))
        GuiControl, Indexer:, GuiInd
      else Loop, Files, %inca%\cache\apps\*.*
        if (A_LoopFileExt == "webm" || A_LoopFileExt == "mp4")
          {
          FileGetTime, FileModified, %A_LoopFileFullPath%, M
          if (A_Now - FileModified > 2)
            FileMove, %A_LoopFileFullPath%, %profile%\Downloads, 1
          }
      Loop, Files, %profile%\Downloads\*.*, R
        index(A_LoopFileFullPath,0)
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
      volRef := Round(volume)
      if !volRef
        volRef =
      FormatTime, time,, h:mm
      if (time != ctime)
        {
        ctime := time
        Gui, Status:+lastfound
        WinSet, TransColor, 0 20
        Gui, Status:Font, s20 cWhite, Segoe UI
        GuiControl, Status:Font, GuiSta
        GuiControl, Status:, GuiSta, %time%    %volRef%
        Gui, Status: Show, NA
        }
      return


    TimedEvents:							; every 100mS
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
        MouseGetPos,,, id 						; get the window below the mouse
        WinGet, cur, ID, ahk_id %id%
        WinGet, desk, ID , ahk_class Progman
        if incaTab
          {
          x := StrLen(Clipboard)
          y := SubStr(Clipboard, 1, 1)
          if (y=="#" && x>4 && StrSplit(clipboard,"#").MaxIndex()>4)	; very likely is a java message
            Messages(Clipboard)
          else if (x && !InStr(x, "#"))
            lastClip := Clipboard
          }
        Gui, background:+LastFound
        Gui, background:Color, Black
        if incaTab
          WinSet, Transparent, % Setting("Ambiance")
        else WinSet, Transparent, 0
        if (incaTab && fullscreen)
          WinSet, Top,,ahk_group Browsers
        return







