

	; Inca Media Viewer for Windows. Firefox & Chrome compatible


	#NoEnv
	#UseHook, On
	SetWinDelay, 0
	SetKeyDelay, 0
	SetBatchLines -1
	SetTitleMatchMode,2
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
        Global indexed_folders		; create thumbnails for
        Global this_search		; current search folders
        Global context_menu		; right click menu
        Global inca			; default folder path
        Global list			; sorted file list
	Global list_id			; pointer to media file
        Global list_size
        Global selected			; selected files from web page
        Global search_box		; web page textbox
        Global search_term		; text search filter
        Global src			; current file incl. path
        Global media			; media filename, no path or ext
        Global type			; eg. video
	Global subfolders
        Global folder
        Global path
        Global ext
        Global last_ext
        Global tab_name			; browser tab title
	Global previous_tab
        Global history_timer		; timer to add files to history 
        Global vol_popup		; volume bar popup 
        Global position			; media play position
        Global duration			; media duration
        Global volume
        Global paused
        Global video_speed := 0
        Global video_sound := 0		; video or music sound source
        Global page := 1		; current page within list
        Global sort			; eg. Alpha
        Global sort_filter		; eg. 't'
        Global tab			; media webpage exists = 1, is active = 2
        Global click			; mouse click value
        Global timer			; click or back timer
        Global view := 4	 	; thumbnail size
	Global last_view := 4
        Global music_player 		; windows id
        Global video_player
        Global vol_ref := 2
        Global skinny			; media width
        Global wheel
        Global inside_browser		; clicked inside browser window
        Global last_media		; last media played in page
	Global last_status		; time, vol etc display
        Global menu_item		; context menu
        Global playlist			; slide playlist - full path
	Global magnify := 0.7		; magnify video
        Global seek			; goto seek time
	Global block_input		; stop key interrupts
	Global xpos			; current mouse position - 100mS updated 
	Global ypos
	Global thumbsheet		; thumbsheet view mode
	Global refresh			; update web page (highlighted links)
	Global seek_overide
	Global filter			; secondary search filter eg. date, duration, Alpha letter
	Global source_media		; eg. jpg link files used in favs and slides
	Global orphan_media		; eg. caption txt file, snip source file



    main:
      initialize()			; set environment
      SetTimer, TimedEvents, 100, -1	; every 100mS
      return



    ~LButton::				; click events
    RButton::
    MButton::
      Critical
      click =
      block_input := A_TickCount + 300
      if (!Gestures() && click)
          ClickEvent()
      if refresh
          RenderPage()
      Gui PopUp:Cancel
      timer =
      return


    Xbutton1::				; mouse "back" button
      Critical
      block_input := A_TickCount + 300
      timer = set
      click = Back
      SetTimer, Xbutton_Timer, -300
      return
    Esc up::
      ClosePlayer()
    exitapp
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


    ~Enter::						; file search - from html input box
      if inside_browser
        {
        send, !0
        Clipboard =
        send, {end}+{Home}^c
        ClipWait, 0
        if (search_box := Clipboard)
            ClickWebPage()
        }
      return


    #/::						; 1st mouse option button win/
      timer = set
      SetTimer, button2_Timer, -240
      return
    #/ up::
      timer =
      return
    button2_Timer:
      if video_player					; MPV screenshot
          {
          send, S
          PopUp("Captured",600,0)
          }
      else IfWinActive, ahk_group Browsers
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


    #\::						; 2nd mouse option button win\
      timer3 = set
      SetTimer, button1_Timer, -240
      return
    #\ up::
      timer3 =
      return
    button1_Timer:
      title =
      WinGetTitle, title, YouTube
      if !timer3					; toggle browser / desktop
        {
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1)
            WinMinimize, ahk_group Browsers
        else WinRestore, ahk_group Browsers
        IfWinNotExist, ahk_group Browsers
            run, %inca%\cache\html\pictures.htm
        MouseMove, % A_ScreenWidth / 2, 0		; fixes windows redraw bug
        MouseMove, % xpos, % ypos, 0
        last_status =
        }
      else
        {
        if !title
          send, {f11}					; fullscreen
        send, f
        }
      return


    Gestures()
      {
      MouseGetPos, xpos, ypos
      StringReplace, click, A_ThisHotkey, ~,, All
      if video_player					; allow gestures over mpv player
          send, {Click up}
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
        if (xy > 10)
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
            if GetKeyState("LButton", "P")
                if video_player
                    SetAspect(x, y)
                else BrowserMagnify(y)
            }
         if (!gesture && timer > 350 && !ClickEvent())
             gesture = 1				; escape - once only
         }
      return gesture
      }


    ClickEvent()
        {
        Critical
        if (click == "LButton")
          {
          if (timer > 350 && A_Cursor == "IBeam")
              SearchText()
          else if (video_player && type != "image")
              {
              GetSeekTime(video_player)
              if thumbsheet						; 6x6 thumbsheet mode
                  GetSeek(0)						; convert click to seek time
              if (!seek && position > duration - 1)			; video finished playing
                  seek := 0.5						; return to start
              if (timer > 350)
                  PlayMedia(1)
              else if (seek && (thumbsheet || ypos > A_ScreenHeight - 100))
                  {
                  seek_overide := seek
                  thumbsheet =
                  PlayMedia(0)
                  paused = 0
                  }
              else
                  {
                  if paused
                      paused =
                  else paused = 1
                  }
              if paused
                  ControlSend,, 2, ahk_ID %video_player%
              else ControlSend,, 1, ahk_ID %video_player%
              }
          else if video_player						; images
              {
              if (xpos > A_ScreenWidth * 0.9) 
                  send, j
              else if (xpos < A_ScreenWidth * 0.1) 
                  send, i
              else if (ypos > A_ScreenHeight * 0.9) 
                  send, h
              else if (ypos < A_ScreenHeight * 0.1) 
                  send, g
              else PlayMedia(1)
              }
          else if (inside_browser && A_Cursor != "IBeam" && (x := ClickWebPage()))
              {
              if (type == "m3u" && timer > 350)
                  list_id := 1						; play first slide/song on long click
              if (type == "document")
                  orphan_media := src					; for edit captions - makes txt file an orphan
              if (timer < 350)
                  seek := 0						; PlayMedia to determine seek time
              else if (x == "Media")
                  seek_overide := 0.1					; force start at beginning
              else if (x == "Null")
                  seek_overide := seek
              else orphan_media := last_media
              if (x == "Media" || timer > 350)				; or play last_media
                  PlayMedia(0)
              }
          }
        else if (click == "RButton")
            {
            if (timer > 350 && tab == 2 && (video_player || ClickWebPage() == "Media"))
                AddFavorites()       
            else if (!video_player && inside_browser && ClickWebPage()== "Media")
                {
                if !InStr(selected, list_id "/")
                  if selected
                    selected = %selected%%list_id%/
                  else selected = /%list_id%/
                else StringReplace, selected, selected, %list_id%`/
                RenderPage()
                }
            else if (video_player || inside_browser)
                    Menu, ContextMenu, Show
            else send, {RButton}
            }
        else if (click == "MButton")
            {
            if (music_player && xpos < 100)
                PlaySong(1)
            else if video_player
                {
                orphan_media =
                if (!thumbsheet && type != "image")
                    Playmedia(0)
                else Playmedia(1)
                }
            else if inside_browser
                {
                x := ClickWebPage()
                if (x == "Null")
                    {
                    click =
                    if (view < 7)
                        {
                        last_view := view
                        view := 7
                        }
                    else view := last_view
                    page := 1
                    RenderPage()
                    }
                else if (x == "Media")
                    PlayMedia(0)					; show thumbsheet if video
                 }
            else send, {MButton}
            click =
            }
        else if (click == "Back")
            {
            if timer							; long back key press
                {
                if video_player
                    {
                    timer =
                    orphan_media =
                    if !PlayMedia(-1)
                        ClosePlayer()
                    }
                else IfWinActive, ahk_group Browsers
                    send, ^w						; close tab
                else send, !{F4}					; or close app
                }
            else IfWinExist, ahk_class OSKMainClass
                send, !0						; close onscreen keyboard
            else if (music_player && xpos < 100)
                PlaySong(-1)
            else if WinActive("ahk_class Notepad")
                Send,  ^s^w
            else if video_player
                ClosePlayer()
            else if (tab == 2 && WinActive("ahk_group Browsers"))
                {
                if !selected
                    send, ^{F5}						; go to top of page
                else selected =
                RenderPage()
                }
            else send, {Xbutton1}
            }
        }


    MediaControl()							; from timer every 0.1 seconds
        {
        Critical
        if (type == "video" || type == "audio")
            {
            GetSeektime(video_player)
            Gui, ProgressBar:+LastFound -Caption +ToolWindow +AlwaysOnTop -DPIScale
            Gui, ProgressBar:Color, 303030
            yp := A_ScreenHeight - 3
            xp := Round(A_ScreenWidth * position / duration)
            if (ypos > A_ScreenHeight - 100)
                 {
                 xp := xpos
                 Gui, ProgressBar:Color, 826858
                 seek := Round(duration * xpos / A_ScreenWidth,1)
                 seek_t := Time(seek)
                 PopUp(seek_t,0,0)
                 }
            else  Gui PopUp:Cancel
            Gui, ProgressBar:Show, x0 y%yp% w%xp% h3 NA			; seek bar under video
            }
        if wheel
            {
            if (A_ThisHotkey == "~WheelDown")
                wheel := 0
            if Setting("Reverse Wheel")
                wheel ^= 1
            if (type == "image")
                thumbsheet =
            if (type == "video" || type == "audio")
                {
                key = {Left}
                if wheel
                    key = {Right}
                if (paused && type == "video")
                  {
                  if wheel
                    key = .
                  else key = ,
                  }
                ControlSend,, %key%, ahk_ID %video_player%		; seek
                block_input := A_TickCount + 44
                }
            wheel =
            }
        }


    TimedEvents:							; every 100mS
        Critical
        MouseGetPos, xpos, ypos
        WinGetPos, xb, yb, wb, hb, ahk_group Browsers
        if (tab == 2 && WinActive("ahk_group Browsers") && xpos > xb+10 && ypos > yb+200 && xpos < xb+wb-300 && ypos < yb+hb-50)
            inside_browser = 1
        else inside_browser =
        IfWinNotExist, ahk_ID %music_player%
            music_player =
        if history_timer
            history_timer += 1
        if vol_popup							; show volume popup bar
            vol_popup -= 1
        if (volume > 0.1 && !vol_popup && !video_player && Setting("Sleep Timer") > 10 && A_TimeIdlePhysical > 600000)
            {
            volume -= vol_ref / (Setting("Sleep Timer") * 6)		; sleep timer
            SoundSet, volume						; slowly reduce volume
            vol_popup := 100						; check every 10 seconds
            }
        if (video_player && timer < 350)				; not gesture
            MediaControl()						; video scanning, image panning
        if !video_player
            {
            dim := tab
            tab := 0
            WinGetTitle title, Inca -
            tab_name := SubStr(title, 8)
            StringGetPos, pos, tab_name, mozilla firefox, R
            if (pos < 1)
                StringGetPos, pos, tab_name, google chrome, R
            StringLeft, tab_name, tab_name, % pos - 3
            WinGet, state, MinMax, ahk_group Browsers
            if tab_name
                tab := 1
            if (tab_name && state != -1)
                tab := 2
            if (tab != dim)
                {
                mask1 := 0
                if (mask2 := Setting("Dim Desktop"))
                  loop 20
                    {
                    sleep 5
                    mask1 += (Setting("Dim Desktop") * 2.55) / 20
                    mask2 -= 10
                    Gui, background:+LastFound
                    if (tab == 2)
                        WinSet, Transparent, %mask1%
                    else WinSet, Transparent, %mask2%
                    }
                }
            if (tab == 2 && tab_name && tab_name != previous_tab)	; is switched inca tab
                {
                previous_tab := tab_name
                GetTabSettings(1)					; get last tab settings
                CreateList()						; media list to match html page
                }
            }
        ShowStatus()							; show time & vol
        return


    ClickWebPage()
        {
        arg1 =
        arg2 =
        type =
        WinActivate, ahk_group Browsers
        if !search_box
          {
          if !inside_browser
            return
          send, {Alt up}{Ctrl up}{Shift up}
          if (click == "LButton")
              send, {LButton up}
          else send, {LButton}						; so M or R Button fill location bar
          input := GetLocationBar(1)
          sleep 20							; to release location bar
          StringReplace, input, input, /, \, All
          if !InStr(input, "file:\\\")
            return
          array := StrSplit(input,"#")
          pos := array.MaxIndex()
          if (pos < 2)							; no arguments
            return "Null"
          arg1 := array[pos]
          list_id := arg1
          if (pos > 2)
            arg2 := array[pos-1]
          }
        if DetectMedia(arg2)
            {
            orphan_media := arg2
            return "Media"
            }
        else orphan_media =
        if (arg2 == "Media")
            return arg2
        if (arg1 == "Searchbox")					; add search to search list
            {
            search_list = %search_list%|%search_term%
            IniWrite,%search_list%,%inca%\settings.ini,Settings,search_list
            LoadSettings()
            PopUp("Added",600,0)
            }
        else if (arg1 && arg2 && InStr(sort_list, arg2))
                filter := arg1
        else if (arg2 == "Page" || arg2 == "View")
            {
            if (arg2 == "Page")
                page := arg1
            if (arg2 == "View")
                view := arg1
            RenderPage()
            return 1
            }
        else
            {
            filter =
            IfExist, %arg1%
                s_path := arg1
            else if search_box
                search_term = %search_box%				; clears white space
            else if arg1
                search_term = %arg1%
            if s_path
                {
                selected =
                search_term =
                path := s_path
                this_search := s_path
                StringTrimRight, folder, path, 1
                StringGetPos, pos, folder, \, R
                StringTrimLeft, folder, folder, % pos + 1
                tab_name := folder
                if (timer < 350)
                    GetTabSettings(0)					; from html cache
                page := 1
                src = %arg1%%arg2%
                if (DetectMedia(src) == "m3u")
                    playlist := src
                    subfolders =
                Loop, Files,%path%*.*, D
                  if A_LoopFileAttrib not contains H,S
                    if !InStr(subfolders, A_LoopFileFullPath)
                        subfolders = %subfolders%%A_LoopFileFullPath%\|
                if playlist
                   Loop, Files, %inca%\%folder%\*.m3u, FR
                     {
                     SplitPath, A_LoopFileName,,,ex,name
                     subfolders = %subfolders%%name%|
                     }
                StringTrimRight, subfolders, subfolders, 1
                }
            else if (arg2 && InStr(sort_list, arg2))			; sort filter
                {
                page := 1
                toggle_list = Reverse Recurse Videos Images
                if (sort != arg2)					; new sort
                    {
                    if (arg2 != "Reverse" && !InStr(toggle_list, arg2))
                        StringReplace, toggles, toggles, Reverse	; remove reverse
                    }
                else if (sort != "Shuffle")
                    arg2 = Reverse
                if InStr(toggle_list, arg2)
                    if !InStr(toggles, arg2)				; toggle the sort switches
                        toggles = %toggles%%arg2%			; add switch
                    else StringReplace, toggles, toggles, %arg2%	; remove switch
                else sort := arg2
                if (StrLen(toggles) < 4)
                    toggles =
                }
            else if search_term						; search text from link or search box
                {
                tab_name := search_term
                folder := search_term
                GetTabSettings(0)					; load cached tab settings
                this_search := search_folders
                if (search_box && !InStr(this_search, path))		; search this folder, then search paths
                    this_search = %path%|%this_search%			; search this folder only
                if search_box
                    {
                    view := 7
                    sort = Duration
                    toggles =
                    }
                }
            }
        CreateList()
        search_box =
        return 1
        }


    CreateList()							; list of files in path
        {
        if !(folder || this_search)
            return
        IfNotExist, %path%
            path = %search_term%\
        list =
        count := 0
        list_size := 0
        Popup(search_term,0,0)
        if (InStr(toggles, "Recurse") || search_term)
            recurse = R
        Loop, Parse, this_search, `|
            Loop, Files, %A_LoopField%*.*, F%recurse%
                if A_LoopFileAttrib not contains H,S
                    {
                    input := A_LoopFileFullPath
                    SplitPath, input,,,ex, filen
                    if (ex == "lnk")
                        {
                        FileGetShortcut, %input%, input
                        SplitPath, input,,,ex,filen   
                        }
                    if (med := DecodeExt(ex))
                        {
                        if (ex == "m3u")
                            continue
                        if ((count += 1) > 250000)
                            break 2
                        data := list_size
                        if (!Mod(count,10000) && !search_term)
                            PopUp(count,0,0)
                        if (sort == "ext")
                            data := ex
                        else if (sort == "Date")
                            FileGetTime, data, %A_LoopFileFullPath%, M
                        else if (sort == "Size")
                            FileGetSize, data, %input%, K
                        else if (sort == "Duration")
                            FileRead, data, %inca%\cache\durations\%filen%.txt
                        list_size += 1
                        list = %list%%data%/%input%/%med%`r`n
                        }
                    }
        StringTrimRight, list, list, 2					; remove end `r`n
        if (InStr(toggles, "Reverse") && sort != "Date")
            reverse = R
        if (!InStr(toggles, "Reverse") && sort == "Date")
            reverse = R
        if (sort == "ext")
            Sort, list, %reverse% Z					; alpha sort
        else if (sort != "Shuffle")
            Sort, list, %reverse% Z N					; numeric sort
        if playlist
            {
            count := 0
            list =
            list_size := 0
            this_search := path
            FileRead, str, %playlist%
            Loop, Parse, str, `n, `r
                {
                count += 1
                list_size += 1
                SplitPath, A_LoopField,,,ex
                med := DecodeExt(ex)
                list = %list%%list_size%/%A_LoopField%/%med%`r`n
                }
            StringTrimRight, list, list, 2				; remove end `r`n    
            }
        if (sort == "Shuffle" && !playlist)
            Sort, list, Random Z
        Loop, Parse, list, `n, `r
          if FilterList(A_LoopField)
              size += 1
        popup = %search_term%  %size%
        Popup(popup,0,0)
        RenderPage()
        return
        }


    GetLocationBar(escape)
        {
        Critical
        clip := clipboard
        Loop 2
            {
            clipboard =
            sleep 34
            send, ^l
            sleep 34
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
                send, !{Left}						; reset location bar
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
        view := 7
        toggles =
        playlist =
        sort = Shuffle
        FileReadLine, array, %inca%\cache\html\%tab_name%.htm, 2	; embedded page data
        if array
            {
            array := StrSplit(array,"/")
            view := array.1
            page := array.2
            sort := array.3
            toggles := array.4
            if (tab_name == "Slides" || tab_name == "music")
                playlist := Transform_Htm(array.9)
            last_media := Transform_Htm(array.10)
            if extended
              {
              this_search := Transform_Htm(array.5)
              search_term := Transform_Htm(array.6)
              path := Transform_Htm(array.7)
              folder := Transform_Htm(array.8)
              if search_term
                folder := search_term
              }
            return 1
            }
        }


    GetSnipSource()
        {
        name := media
        Loop, 8
           if (SubStr(name, 0) != A_Space)
              StringTrimRight, name, name, 1
        StringTrimRight, name, name, 1
        Loop, Parse, search_folders, `|
           IfExist, %A_LoopField%\%name%.*
               {
               source = %A_LoopField%%name%
               extensions = mkv|mp4|wmv|webm|mpg|m4v
               Loop, Parse, extensions, `|
                   IfExist, %source%.%A_LoopField%
                       {
                       orphan_media = %source%.%A_LoopField%
                       if DetectMedia(orphan_media)
                           return 1
                       }
               }
        PopUp("no source found",600,1)
        }


    GetDuration(source)
        {
        if (type != "video" && type != "audio")
            return
        SplitPath, source,,,,filen
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
            clipboard := clip
            if !(dur := aTime.1 * 3600 + aTime.2 * 60 + aTime.3)
                dur := 1							; any dur is better than null
            filedelete, %inca%\cache\durations\%filen%.txt
            FileAppend, %dur%, %inca%\cache\durations\%filen%.txt
            }
        return dur
        }


    GetSeek(thumb)
        {
        seek := 0
        MouseGetPos, xp, yp
        duration := GetDuration(src)
        if (duration > 60)
           offset := 20
        else offset := 0
        if (duration < 20 || type == "audio")
            return
        col := ceil(0.84 * A_ScreenWidth/6)
        row := floor(0.74 * A_ScreenHeight/6)
        xp -= 0.072 * A_ScreenWidth
        yp -= 0.12 * A_ScreenHeight
        if thumb
            thumb_number := 5
        else thumb_number := 5 * (6 * Floor(yp / row) + Ceil(xp / col))
        ratio := (thumb_number-1)/200
        seek := Round(ratio * duration + offset - ratio * offset, 1)
        if (!thumb && (xp < 0 || yp < 0))					; return to original time
            seek := position
        if (!thumb && !seek_overide)
            seek_overide := seek
        return seek
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


    GetSeekTime(player)								; get media properties from mpv
        {
        IfWinNotExist, ahk_ID %player%
            return
        if (player == video_player && thumbsheet)
            return
        clip := ClipBoard
        Clipboard =
        ControlSend,, =, ahk_ID %player%					; to mpv player - see input.conf
        ClipWait, 1
        StringReplace, input, ClipBoard, `r`n, , All
        input := StrSplit(input, "/")
        array := StrSplit(input.2, ":")						; duration
        if !(duration := array.1 * 3600 + array.2 * 60 + array.3)
            duration := GetDuration(src)
        position := Round((input.5 / input.6) * duration,1)			; most accurate value
        array := StrSplit(input.1, ":")
        if !position
            position := Round(array.1 * 3600 + array.2 * 60 + array.3,1)	; or use less accurate value
        if (player == music_player)
            last_media := input.7
        ClipBoard := clip
        return
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
                ClickWebPage()
                sleep 500
                WinActivate, ahk_group Browsers
                return
                }
            Clipboard := clip
            }
        send, !+0							; trigger osk keyboard
        sleep 500
        }


    LoadHtml()								; create / update browser tab
        {
        Critical
        WinActivate, ahk_group Browsers
        new_html = file:///%inca%\cache\html\%tab_name%.htm
        StringReplace, new_html, new_html, \,/, All
        if (tab != 2 || (!video_player && click == "MButton"))
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
        }


    Transform_Htm(htm)							; from html to utf-8
        {
        loop parse, htm, *
	    if (chr(a_loopfield) > 126)
	        utf .= chr(a_loopfield)
            else utf .= a_loopfield
        return utf
        }


    Transform_utf(utf)
        {
        loop parse, utf
	    If (ord(a_loopfield) < 126)
	        htm .= a_loopfield
            else htm .= "*"ord(a_loopfield)"*"
        return htm
        }


    EditFilename()						; + durations, faorites, history and slides
        {
        selected =
        if (folder == "Slides" || folder == "Favorites" || !GetMedia(0))
            return
        FileGetSize, size, %src%, K
        size := Round(size/1000,2)
        FileRead, duration, %inca%\cache\durations\%media%.txt
        if (menu_item == "Caption")
            FileRead, text, %inca%\cache\captions\%media%.txt
        else text := media
        IfExist, %src%
            InputBox, new_name, %menu_item%   %path%   %ext%   size %size%   dur %duration%,,,,94,,,,, %text%
        else return
        IfWinExist, ahk_class OSKMainClass
            send, !0						; close osk keyboard
        if !ErrorLevel
            {
            if (menu_item == "Caption")
                {
                FileDelete, %inca%\cache\captions\%media%.txt
                if new_name
                    FileAppend, %new_name%`r`n, %inca%\cache\captions\%media%.txt
                }
            else
                {
                FileMove, %src%, %path%\%new_name%.%ext%	; FileMove = FileRename
                UpdateFiles(new_name)
                }
            }
        LoadSettings()
        CreateList()
        }


    UpdateFiles(new_name)
        {
        if (ext == "lnk" && ext == "m3u")
            return
        Loop, Files, %inca%\slides\*.m3u, FR
            {
            FileRead, str, %A_LoopFileFullPath%			; find & replace in .m3u slide files
            if !InStr(str, media)
                continue
            FileDelete, %A_LoopFileFullPath%
            Loop, Parse, str, `n, `r
                IfExist, %A_LoopField%
                    {
                    new := StrReplace(A_LoopField, media, new_name)
                    if InStr(A_LoopField, media)
                        FileAppend, %new%`r`n, %A_LoopFileFullPath%, UTF-8
                    else FileAppend, %A_LoopField%`r`n, %A_LoopFileFullPath%, UTF-8
                    }
            }
        folders = %inca%\favorites\|%inca%\cache\cuts\|%inca%\cache\captions\
        Loop, Parse, folders, `|
            Loop, Files, %A_LoopField%*.*, R
                if InStr(A_LoopFileFullPath, media)
                    {
                    new := StrReplace(A_LoopFileFullPath, media, new_name)
                    if InStr(A_LoopFileFullPath, "\cuts\")
                        {
                        FileRead, str, %A_LoopFileFullPath%
                        FileDelete, %A_LoopFileFullPath%
                        str := StrReplace(str, media, new_name)
                        FileAppend, %str%`r`n, %A_LoopFileFullPath%
                        }
                    FileMove, %A_LoopFileFullPath%, %new%, 1
                    }
        FileMove, %inca%\cache\durations\%media%.txt, %inca%\cache\durations\%new_name%.txt, 1
        FileMove, %inca%\cache\thumbs\%media%.mp4, %inca%\cache\thumbs\%new_name%.mp4, 1
        FileMove, %inca%\cache\thumb1\%media%.jpg, %inca%\cache\thumb1\%new_name%.jpg, 1
        }



    ContextMenu:							; right click menu
    Critical
    popup =
    count := 0
    if GetKeyState("LWin")
        copy = Copy
    else copy =
    if video_player
        selected = %list_id%/
    menu_item := A_ThisMenuItem
    if (menu_item == "New" && selected)					; new folder
       {
       FileSelectFolder, menu_item, , 3					; bring up new client window
       if (menu_item && !ErrorLevel)
           context_menu = %context_menu%|%menu_item%
       else menu_item =
       }
    else if (menu_item == "Settings")
        ShowSettings()
    else if (menu_item == "Source")
        run, notepad %inca%\inca.ahk
    else if (menu_item == "Compile")
        run %inca%\apps\Compile.exe
    else if (menu_item == "Rename" || menu_item == "Caption")
        EditFilename()
    else if (menu_item == "All")
        FileReadLine, selected, %inca%\cache\html\%tab_name%.htm, 3	; list of media id's visible in page
    else
        {
        popup = Deleted
        ClosePlayer()
        if (menu_item == "Delete" && playlist)
            {
            x := StrSplit(selected,"/")
            count := x.MaxIndex() - 1
            selected = `/%selected%
            FileRead, str, %playlist%
            FileDelete, %playlist%
            Loop, Parse, str, `n, `r
              if A_LoopField
                {
                id := A_Index
                id = `/%id%`/
                if !Instr(selected, id)
                    FileAppend, %A_LoopField%`r`n, %playlist%, UTF-8
                }
            }
        else Loop, Parse, selected, `/
            {
            count += 1
            list_id := A_LoopField
            GetMedia(0)							; convert html pointers to media
            IfExist, %path%%media%.lnk
                input = %path%%media%.lnk				; if source was .lnk file, delete link only
            if (menu_item == "Delete")
                {
                IfExist, %path%%media%.lnk
                    src = %path%%media%.lnk
                FileRecycle, %src%
                }
            else
                {
                if menu_item
                    Loop, Parse, context_menu, `|
                        if InStr(A_LoopField, menu_item)
                            IfExist, %A_LoopField%
                                if Copy
                                    FileCopy, %src%, %A_LoopField%
                                else
                                    FileMove, %src%, %A_LoopField%
                popup = %copy% %menu_item%
                }
            }
        count -= 1
        selected =
        }
    pop = %popup% %count%
    if pop
        PopUp(pop,600,0)
    if (popup || selected)
        CreateList()
    return


    DecodeExt(ex)
        {
        if !ex
            return
        StringLower ex, ex
        if InStr("jpg png jpeg webp gif", ex)
            return "image"
        if InStr("mp4 wmv avi mov webm mpg mpeg flv divx mkv asf m4v mvb rmvb vob rm ts", ex)
            return "video"
        if InStr("mp3 m4a wma mid", ex)
            return "audio"
        if InStr("pdf txt doc", ex)
            return "document"
        if (ex == "m3u")
            return "m3u"
        }


    DetectMedia(input)
        {
        type =
        skinny =
        SplitPath, input,,,ext,media
        FileRead, skinny, %inca%\cache\widths\%media%.txt
        stringlower, ext, ext
        type := DecodeExt(ext)
        src := input
        IfExist, %src%
            return type
        }


    GetMedia(next)
        {
        FileReadLine, str, %inca%\cache\html\%tab_name%.htm, 3
            Loop, Parse, str, `/
              if (A_LoopField == list_id)
                ptr := A_Index + next				; next media 
        array := StrSplit(str, "/")				; convert html pointer to internal list ptr
        list_id := array[ptr]
        Loop, Parse, list, `n, `r
            if (A_Index == list_id)
                src := StrSplit(A_LoopField, "/").2
        return DetectMedia(src)
        }


    PlayMedia(next)						; play 0 current, +1 next or -1 previous in list
        {
        Critical
        wheel =
        GetMedia(next)						; convert external html media to internal list media
        if (!next && orphan_media) 				; not referenced in any media list
            source_media := orphan_media			; preserve origin before any link files processed
        else source_media := src
        last_media := source_media
        if orphan_media						; not referenced in html tab
            src := orphan_media
        DetectMedia(src)
        if (type == "image")					; test for link image
          IfExist, %inca%\cache\cuts\%media%.txt		; get src and seek from .jpg link file
            {
            FileRead, str, %inca%\cache\cuts\%media%.txt
            src := StrSplit(str, "|").1
            seek := Round(StrSplit(str, "|").2,1)
            }
        DetectMedia(src)
        if (click == "MButton" && InStr(src, "\Snips\"))
            GetSnipSource()					; play src not 10 sec. snip file
        if !DetectMedia(src)
            {
            ClosePlayer()
            return
            }
        if (type == "document" || type == "m3u")
            {
            RenderPage()					; highlight selected media
            run, %src%
            sleep 600
            if (ext == "pdf")
                WinActivate, ahk_group Browsers
            return 1
            }
        if (folder == "music")
            {
            PlaySong(0)
            refresh = 1
            return 1
            }
        duration := GetDuration(src)
        video_speed := Setting("Default Speed") - 100
        if (type == "audio" && !video_sound)
            FlipSound(1)
        if video_sound
            mute =
        else mute = --mute=yes
        speed := Round((video_speed + 100)/100,1)		; default speed - mpv format
        speed = --speed=%speed%
        if (type != "video")
            speed =
        if (!seek || (timer > 350 && folder != "Slides"))
            GetSeek(1)						; 1st thumbnail seek point
        if (duration <= 20)
            seek := 0
        if seek_overide
            seek := seek_overide
        seek_overide := 0
        seek_t := Time(duration)
        if (type != "image" && !video_player)
            PopUp(seek_t,0,0)
        seek_t := Abs(100 * seek / duration)
        if (seek_t < 98)
            seek_t = --start=%seek_t%`%
        if (magnify < 0)
            magnify := 0 
        zoom := magnify
        if (type == "video" && zoom < 1 && !video_player)
            zoom := 1
        if (Setting("Start Paused") || type == "audio")
            paused = 1
        if paused
            pause = --pause
        properties = --loop --video-zoom=-%zoom% %mute% %pause% %speed% %seek_t% 
        if (type == "image")
            properties = --video-zoom=-%zoom%
        Random, random, 100, 999
        if ((click == "MButton" || thumbsheet) && type == "video" && duration > 20)
            {
            RunWait %inca%\apps\ffmpeg.exe -skip_frame nokey -i "%inca%\cache\thumbs\%media%.mp4" -vsync 0 -qscale:v 1 "%inca%\cache\`%d.jpg",, Hide
            RunWait %inca%\apps\ffmpeg -i %inca%\cache\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumb.jpg",, Hide
            Run %inca%\apps\mpv --video-zoom=-0.3 --input-ipc-server=\\.\pipe\mpv999 "%inca%\cache\thumb.jpg"
            thumbsheet = 1
            }
        else Run %inca%\apps\mpv %properties% --idle --input-ipc-server=\\.\pipe\mpv%random% "%src%"
        player =
        Critical
        loop 150							; identify new player id
            {
            sleep 20
            WinGet, running, List, ahk_class mpv
            loop %running%
                if ((player := running%A_Index%) != music_player && player != video_player)
                    break 2
            }
        WinSet, Transparent, 0, ahk_ID %player%
        WinSet, Transparent, 0, ahk_class Shell_TrayWnd			; stop flickering taskbar
        if (!thumbsheet && aspect := Round(skinny / 100,2))
            {
            sleep 250
            RunWait %COMSPEC% /c echo add video-aspect %aspect% > \\.\pipe\mpv%random%,, hide && exit
            }
        loop 16
           {
           sleep 18
           WinSet, Transparent, % A_Index*16, ahk_ID %player%		; new player instance fade 
           }
        Gui, Caption:+lastfound
        GuiControl, Caption:, GuiCap
        IfExist, %inca%\cache\captions\%media% %seek%.txt
            {
            FileRead, caption, %inca%\cache\captions\%media% %seek%.txt
            WinSet, TransColor, 0 99
            GuiControl, Caption:, GuiCap, % caption
            x := A_ScreenWidth * 0.38
            y := A_ScreenHeight * 0.82
            Gui, Caption:Show, x%x%  y%y%, NA
            }
        block_input := A_TickCount + 640
        if (click == "MButton")
            block_input := A_TickCount + 1600				; stop residual wheel inputs
        WinSet, Transparent, 0, ahk_group Browsers
        if video_player
            WinClose, ahk_ID %video_player%				; previous player instance
        WinActivate, ahk_ID %player%
        video_player := player
        history_timer := 1
        Gui PopUp:Cancel
        refresh = 1							; highlight media in browser
        return 1
        }


    ClosePlayer()
        {
        Critical
        Gui, Caption: Cancel
        Gui, settings: Cancel
        Gui, ProgressBar:Cancel
        GuiControl, Indexer:, GuiInd
        FileDelete, %inca%\cache\*.jpg
        AddHistory()
        if video_player
          loop 16
            {
            seek := position						; so can return to last media
            ControlSend,, l, ahk_ID %video_player%			; zoom player in
            mask := 256 - (A_Index * 16)
            WinSet, Transparent, % mask, ahk_ID %video_player%		; transition mpv out
            WinSet, Transparent, % A_Index * 16, ahk_group Browsers
            if (video_sound && volume > 1)
                SoundSet, volume -= 0.5
            if (A_Index == 5)						; minimise browser flickering
                WinActivate, ahk_group Browsers
            if (A_Index == 15)						; allow time for Win ID to release
                WInClose, ahk_ID %video_player%
            sleep 18
            }
        type =
        thumbsheet =
        seek_overide =
        skinny =
        history_timer =
        WinSet, Transparent, 255, ahk_class Shell_TrayWnd
        if (video_sound && music_player)
            FlipSound(1)
        video_sound := 0
        video_player =
        }



    PlaySong(pos)
        {
        if !pos
            WinClose, ahk_ID %music_player%
        sleep 100
        SoundSet, 1
        volume := 1
        if Setting("Default Volume")
            if (vol_ref > Setting("Default Volume"))
                vol_ref := Setting("Default Volume")
        if (vol_ref < 15)
            vol_ref := 15
        video_sound := 0
        ptr := list_id - 1
        if (pos == 1)
            RunWait %COMSPEC% /c echo playlist-next > \\.\pipe\mpv_music,, hide && exit
        else if (pos == -1)
            RunWait %COMSPEC% /c echo playlist-prev > \\.\pipe\mpv_music,, hide && exit
        else 
            {
            Run %inca%\apps\mpv --fullscreen=no --keep-open=no --window-minimized=yes --playlist-start=%ptr% --input-ipc-server=\\.\pipe\mpv_music "%playlist%"
            loop 100
                {
                sleep 20
                WinGet, running, List, ahk_class mpv
                loop %running%
                    if ((music_player := running%A_Index%) != video_player)
                        break 2
                }
            }
        SetTimer, VolUp
        WinActivate, ahk_group Browsers
        }


    FlipSound(FadeUp)						; between music & video player
        {
        SoundSet, 0						; kill sound
        volume := 0
        video_sound ^= 1
        if !video_sound
            {
            ControlSend,, 1, ahk_ID %music_player%		; un pause music
            ControlSend,, 3, ahk_ID %music_player%		; un mute music
            ControlSend,, 4, ahk_ID %video_player%		; mute video
            GetSeekTime(music_player)				; reset song_timer
            }
        else
            {
            paused = 
            ControlSend,, 2, ahk_ID %music_player%		; pause music
            ControlSend,, 4, ahk_ID %music_player%		; mute music
            ControlSend,, 1, ahk_ID %video_player%		; un pause video
            ControlSend,, 3, ahk_ID %video_player%		; un mute video
            ControlSend,, {BS}, ahk_ID %video_player%		; reset video speed
            }
         if (vol_ref < 10)
             vol_ref := 10
         if FadeUp
            SetTimer, VolUp
        }


    VolUp:
       if (volume >= vol_ref || (volume > 5 && GetKeyState("RButton", "P")))
           return
       SoundSet, (volume += 1)
       SetTimer, VolUp, -20
       vol_popup := 3						; show volume slider
       ShowStatus()
       return


    SetVolume(change)
        {
        Static last_volume
        if (!volume && last_volume)
            FlipSound(0)
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


    SetAspect(x, y)
        {
        direction := x + y
        if (xpos < 200)						; adjust video speed
            {
            if direction
                {
                if (direction > 0)
                ControlSend,, a, ahk_ID %video_player%
                else ControlSend,, b, ahk_ID %video_player%
                if (direction > 0)
                    video_speed -= 1
                else video_speed := 0
                PopUp(video_speed,0,0)
                if !video_speed
                    sleep 500
                }
            return
            }
        WinGet, state, MinMax, ahk_group Browsers
        if (!Setting("Width Gesture") || Abs(x) < Abs(y))
            {
            if (direction > 0)
                ControlSend,, 0, ahk_ID %video_player%		; adjust magnify
            else ControlSend,, 9, ahk_ID %video_player%
            if (direction < 0)
                magnify += 0.04
            else magnify -= 0.04
            }
        else
            {
            skinny -= 1						; adjust width
            if (direction > 0)
                ControlSend,, 5, ahk_ID %video_player%
            else
                {
                ControlSend,, 6, ahk_ID %video_player%
                skinny += 2
                }
            if !skinny
                PopUp("Reset",500,0)
            FileDelete, %inca%\cache\widths\%media%.txt
            if (Abs(skinny) > 2 && Abs(skinny) < 64)
                FileAppend, %skinny%, %inca%\cache\widths\%media%.txt
            refresh = 1
            }
        }


    BrowserMagnify(direction)
        {
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1 && xpos < 100)
            {
            WinActivate, ahk_group Browsers
            if (direction < -20)
                {
                send, ^0
                sleep 400
                }
            else if (direction < -6)
                send, ^{-}
            else  if (direction > 6)
                send, ^{+}
            sleep 120
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
                    gui, settings:add, edit, x20 h15 w30 vfeature%A_Index%, %value%
                else gui, settings:add, text
                gui, settings:add, text, x55 yp, %key%
                }
            else gui, settings:add, checkbox, x25 yp+16 %x% vfeature%A_Index%, %A_Space%%A_Space%%A_Space%%A_Space%%A_Space%%key%
            }
        gui, settings:add, text, x180 y10, main folders
        gui, settings:add, edit, x180 yp+13 h60 w500 vfolder_list, %folder_list%
        gui, settings:add, text, x180 yp+68, favorite folders
        gui, settings:add, edit, x180 yp+13 h80 w500 vfav_folders, %fav_folders%
        gui, settings:add, text, x180 yp+84, search terms
        gui, settings:add, edit, x180 yp+13 h80 w500 vsearch_list, %search_list%
        gui, settings:add, text, x180 yp+84, folders to search
        gui, settings:add, edit, x180 yp+13 h18 w500 vsearch_folders, %search_folders%
        gui, settings:add, text, x180 yp+22, folders to index
        gui, settings:add, edit, x180 yp+13 h18 w500 vindexed_folders, %indexed_folders%
        gui, settings:add, text, x180 yp+24, context menu
        gui, settings:add, edit, x180 yp+13 h55 w500 vcontext_menu, %context_menu%
        gui, settings:add, button, x270 y450 w80, Purge Cache
        gui, settings:add, button, x360 y450 w70, Help
        gui, settings:add, button, x440 y450 w70, Cancel
        gui, settings:add, button, x520 y450 w70 default, Save
        gui, settings:show
        send, +{Tab}
        }

        settingsButtonHelp:
        WinClose
        run, %inca%\apps\help.txt
        return

        settingsButtonPurgeCache:
        WinClose
        PopUp("* Monitor Recycle Bin *",2000,0)
        PurgeCache()
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
        IniWrite,%indexed_folders%,%inca%\settings.ini,Settings,indexed_folders
        IniWrite,%context_menu%,%inca%\settings.ini,Settings,context_menu
        IniWrite,%search_folders%,%inca%\settings.ini,Settings,search_folders
        IniWrite,%search_list%,%inca%\settings.ini,Settings,search_list
        IniWrite,%folder_list%,%inca%\settings.ini,Settings,folder_list
        IniWrite,%fav_folders%,%inca%\settings.ini,Settings,fav_folders
        Menu, ContextMenu, DeleteAll
        settingsFinished:
        WinClose
        LoadSettings()
        RenderPage()
        tab =
        return
        settingsButtonCancel:
        WinClose
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
        if (folder == "Slides" || InStr(path, "\history\") || ext == "lnk" || thumbsheet )
            return
        FileCreateShortcut, %src%, %inca%\history\- all\%media%.lnk
        if (history_timer / 10 > Setting("History Timer") && type != "audio")
            FileCreateShortcut, %src%, %inca%\history\%media%.lnk
        }


    AddFavorites()
        {
        if !video_player
            GetMedia(0)
        if !DetectMedia(src)
            return
        if thumbsheet
            GetSeek(0)
        if !video_player
            seek_overide := GetSeek(1)
        if seek_overide
            cut := Round(seek_overide,1)
        else cut := Round(position,1)
        popup = Favorite
        PopUp(popup,0,0)
        if (folder == "music")
            {
            FileAppend, %src%`r`n, %inca%\music\New.m3u, UTF-8
            FileCopy, %inca%\apps\icons\music.png, %inca%\favorites\%media% 0.0.png, 1
            }
        else
            {
            if !playlist
                play = %inca%\slides\New.m3u
            else play := playlist
            if (type == "audio")
                {
                FileAppend, %inca%\favorites\%media% %cut%.png`r`n, %play%, UTF-8
                FileAppend, %src%|%cut%`r`n, %inca%\cache\cuts\%media% %cut%.txt, UTF-8
                FileCopy, %inca%\apps\icons\music.png, %inca%\favorites\%media% %cut%.png, 1
                }
            if (type == "video")
                {
                FileAppend, %inca%\favorites\%media% %cut%.jpg`r`n, %play%, UTF-8
                FileAppend, %src%|%cut%`r`n, %inca%\cache\cuts\%media% %cut%.txt, UTF-8
                runwait, %inca%\apps\ffmpeg.exe -ss %cut% -i "%src%" -y -vf scale=1280:-2 -vframes 1 "%inca%\favorites\%media% %cut%.jpg",, Hide
                }
            if (type == "image" || ext == "txt")
                FileAppend, %src%`r`n, %play%, UTF-8
            if (type == "image")
                FileCopy, %src%, %inca%\favorites\%media%.%ext%, 1
            }
        if (folder == "Slides")
            CreateList()
        else RenderPage()
        seek_overide =
        seek =
        }


    ShowStatus()
        {
        FormatTime, time,, h:mm
        vol := Round(volume)
        if (volume < 0.95)
            vol := Round(volume,1)
        if (volume <= 0)
            vol =
        if (!skinny || !video_player)
            width =
        else width := skinny
        if (width > 0)
            sign = +
        if Setting("Status Bar")
        if (video_player && type != "image")
            seek_t := Time(position)
        else seek_t =
            status = %time%    %vol%    %seek_t%    %sign%%width%
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


    PopUp(message, time, dim)
        {
        MouseGetPos, xp, yp
        xp -= 50
        yp -= 120
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
            if (time > 5 && dim)
                WinSet, transparent, %mask%
            mask2 := 255 - mask
            WinSet, TransColor, 0 %mask2%
            }
        }


    PurgeCache()
        {
        folders := indexed_folders
        Loop, Parse, folder_list, `|
            if !InStr(folders, A_LoopField)				; combine lists
               folders = %folders%|%A_LoopField%
        Loop, Parse, folders, `|					; remove self folder if exist
            if InStr(A_LoopField, "thumbs")
                StringReplace, folders, folders, |%A_LoopField%
        Loop, Files, %inca%\cache\thumbs\*.mp4, F			; remove orphan thumbnails
            if !Found(folders)
                FileRecycle, %inca%\cache\thumbs\%A_LoopFileName%
        Loop, Files, %inca%\cache\durations\*.txt, F			; remove orphan durations
            if !Found(folders)
                FileRecycle, %inca%\cache\durations\%A_LoopFileName%
        GuiControl, Indexer:, GuiInd 
        }


    Found(folders)
        {
        GuiControl, Indexer:, GuiInd, %A_LoopFileFullPath% 		; show file on screen 
        SplitPath, A_LoopFileFullPath,,,,filen
        Loop, Parse, folders, `|
            {
            IfExist, %A_LoopField%%filen%.*
                return 1
            Loop, %A_LoopField%*.*, 2, 1				; recurse search into subfolders
                IfExist, %A_LoopFileFullPath%\%filen%.*
                    return 1
            }
        }


    indexer:								; update thumb cache for videos
      if indexed_folders
        Loop, Parse, indexed_folders, `|
          Loop, Files, %A_LoopField%*.*, R
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
            if !dur
                {
                x = %fol%\%Filen%.%ex%
                FileMove, %x%, %x%
                if ErrorLevel						; file open or still downloading
                    continue
                dur := GetDuration(source)
                }
            if (med == "audio")
                continue
            IfNotExist, %inca%\cache\thumbs\%filen%.mp4
              if (dur >= 20)
                {
                GuiControl, Indexer:, GuiInd, indexing - %j_folder% - %filen%
                FileCreateDir, %inca%\temp
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
                        runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:-2 -vframes 1 "%inca%\temp\%y%.jpg",, Hide
                    t += (dur / 200)
                    }
                runwait, %inca%\apps\ffmpeg.exe -i "%inca%\temp\`%d.jpg" -c:v libx264 -x264opts keyint=1:scenecut=-1 -y "%inca%\cache\thumbs\%filen%.mp4",, Hide
                }
            IfExist, %inca%\cache\thumbs\%filen%.mp4
                source = %inca%\cache\thumbs\%filen%.mp4
            IfNotExist, %inca%\cache\thumb1\%filen%.jpg
                runwait, %inca%\apps\ffmpeg.exe -i "%source%" -y -vf scale=480:-2 -vframes 1 "%inca%\cache\thumb1\%filen%.jpg",, Hide
            }
        FileRemoveDir, %inca%\temp, 1
        time := Setting("Indexer") * 60000
        SetTimer, Indexer, -%time%
        GuiControl, Indexer:, GuiInd
        return


    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        EnvGet, profile, UserProfile
        IniRead,features,%inca%\settings.ini,Settings,features
        IniRead,indexed_folders,%inca%\settings.ini,Settings,indexed_folders
        IniRead,search_folders,%inca%\settings.ini,Settings,search_folders
        IniRead,folder_list,%inca%\settings.ini,Settings,folder_list
        IniRead,fav_folders,%inca%\settings.ini,Settings,fav_folders
        if (folder_list == "ERROR")
            folder_list = No Folder List
        IniRead,search_list,%inca%\settings.ini,Settings,search_list
        if (search_list == "ERROR")
            search_list = No Search List
        IniRead,context_menu,%inca%\settings.ini,Settings,context_menu
        Loop, Parse, context_menu, `|
            {
            StringGetPos, pos, A_LoopField, \, R2
            StringTrimLeft, entry, A_LoopField, % pos + 1
            StringTrimRight, entry, entry, 1
            Menu, Folders, Add, %entry%, ContextMenu
            }
        Menu, ContextMenu, Add, Folders, :Folders
        Menu, ContextMenu, Add, Rename, ContextMenu
        Menu, ContextMenu, Add, Caption, ContextMenu
        Menu, ContextMenu, Add, Delete, ContextMenu
        Menu, ContextMenu, Add, All, ContextMenu
        Menu, ContextMenu, Add, Settings, ContextMenu
        Menu, ContextMenu, Add, Compile, ContextMenu
        Menu, ContextMenu, Add, Source, ContextMenu
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
        Gui, Caption:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui, Caption:Color, Black
        ix := A_ScreenWidth * 0.2
        Gui, Caption:Add, Text, vGuiCap w%ix% h%ix% +Wrap
        Gui, Caption:Font, s16 cWhite, Segoe UI
        GuiControl, Caption:Font, GuiCap
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
        Gui, Indexer:Show, x%ix% y%iy%, NA
        WinSet, TransColor, ffffff 0
        WinSet, TransColor, 0 140
        WinSet, ExStyle, +0x20
        SoundGet, volume
        if Setting("Indexer")
            SetTimer, indexer, -1500, -2				; low thread priority
        WinGet, music_player, ID, ahk_class mpv
        WinActivate, ahk_group Browsers
        }


    FilterList(item)
        {
        item := StrSplit(item, "/")					;  sort filter \ src \ media type \ ext
        sort_filter := item.1
        source := item.2
        type := item.3
        if (type != "video" && InStr(toggles, "Video"))
            return
        if (type != "image" && InStr(toggles, "Images"))
            return
        if search_term
            {
            SplitPath, source,,,,name
                if !InStr(name, search_term)
                     return
            }
        if (sort == "Date")
            {
            sort_date := A_Now
            sort_date -= sort_filter, days
            sort_filter = today
            years := floor(sort_date / 365)
            if years
                sort_filter = %years% y
            else if sort_date 
                sort_filter = %sort_date% d
            if (filter && sort_date/30 < filter)
                return
            }
        if (sort == "Duration")
            {
            if (filter && sort_filter/60 < filter)
                return
            sort_filter := Time(sort_filter)
            }
        if (sort == "Size")
            {
            sort_filter := Round(sort_filter/1000,1)
            if (filter && sort_filter < filter)
                return
            }
        if (sort == "Alpha")
            {
            StringGetPos, pos, source, \, R, 1
            StringMid, 1st_char, source, % pos + 2, 1
            if (filter && sort == "Alpha" && 1st_char < Chr(filter))
                return
            }
        return source
        }


    RenderPage()							; construct web page from media list
        {
        refresh =
        last := src
        if !(folder && path)
            return
        if playlist
            SplitPath, playlist,,,,title
        else title := folder
        safe_title := Transform_utf(title)
        Transform, html_folder, HTML, %folder%, 2
        safe_playlist := Transform_utf(playlist)
        safe_path := Transform_utf(path)				; make filenames web compatible
        safe_this_search := Transform_utf(this_search)
        safe_last_media := Transform_utf(last_media)
        FileRead, font, %inca%\apps\ClearSans-Thin.txt			; firefox bug - requires base64 font
        FileRead, script, %inca%\apps\inca - js.js
        Loop, Files, %inca%\music\*.m3u
           music = %music%|%A_LoopFileFullPath%
        Loop, Files, %inca%\Slides\*.m3u
           slides = %slides%|%A_LoopFileFullPath%
        StringReplace, slides, slides, \,/, All
        StringReplace, music, music, \,/, All
        StringReplace, safe_folder_list, folder_list, \,/, All
        StringReplace, safe_fav_folders, fav_folders, \,/, All
        StringReplace, safe_subfolders, subfolders, \,/, All
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        list_size := 0
        previous := 1
        if (page > 1)
            previous := page - 1
        next := page + 1
        type = video							; prime for list parsing
        width := Setting("Page Width")
        offset := Setting("Page Offset")
        fcol := Setting("Font Color")
        back := Setting("Back Color")
        size := Setting("Thumbs Qty")
        if (folder == "music")
            GetSeekTime(music_player)
        if (view == 7)
            size := Setting("List Size")
        Loop, Parse, list, `n, `r 					; split list into smaller web pages
            if (source := FilterList(A_LoopField))
                {
                list_size += 1
                if ((list_size > (page-1) * size) && (list_size <= page * size))
                    if (x := SpoolList(A_Index, source))
                        {
                        html = %html%%x%
                        page_media = %page_media%%A_Index%/
                        }
                }
        pages := ceil(list_size/size)
        header_html = <!--`r`n%view%/%page%/%sort%/%toggles%/%safe_this_search%/%search_term%/%safe_path%/%html_folder%/%safe_playlist%/%safe_last_media%`r`n%page_media%`r`n-->`r`n<!doctype html>`r`n<html>`r`n<head>`r`n<link rel="icon" type="image/x-icon" href="file:///%inca%/apps/icons/inca.ico">`r`n<meta charset="UTF-8">`r`n<title>Inca - %html_folder%</title>`r`n<style>`r`n`r`n@font-face {font-family: ClearSans-Thin; src: url(data:application/font-woff;charset=utf-8;base64,%font%);}`r`n`r`nbody {font-family: 'ClearSans-Thin'; overflow-x:hidden; background:%back%; color:#666666; font-size:0.8em; margin-top:200px;}`r`na:link {color:#15110a;}`r`na:visited {color:#15110a;}`r`na {text-decoration:none; color:%fcol%;}`r`na.slider {display:inline-block; width:35`%; height:1.2em; border-radius:9px; color:%fcol%; transition:color 1.4s; font-size:1em; background-color:#1b1814; text-align:center}`r`na.slider:hover {color:red; transition:color 0.36s;}`r`nul.menu {column-gap:12px; margin:auto; list-style-type:none; padding:0; white-space:nowrap;}`r`nul.menu li {color:%fcol%; transition:color 1.4s;}`r`nul.menu li:hover {color:red; transition:color 0.36s;}`r`ntable {color:%fcol%; transition:color 1.4s; table-layout:fixed; border-collapse: collapse;}`r`ntable:hover {color:red; transition:color 0.36s;}`r`n#hover_image {position:absolute; margin-left:3.8em; opacity:0; transition: opacity 0.4s; width:125px; height:auto;}`r`n#hover_image:hover {opacity:1;}`r`n</style>`r`n`r`n%script%`r`n</head>`r`n<body>`r`n`r`n`r`n`r`n<div style="margin-left:%offset%`%; margin-right:%offset%`%">`r`n`r`n
            panel2_html = <ul class="menu" id='all' style="background-color:inherit; column-count:8; column-fill:balanced; border-radius:9px; padding-left:1em; font-size:0.9em"></ul>`r`n`r`n
        panel_html = %panel2_html%<ul class="menu" id='panel' style="height:6em; margin-top:1em; column-count:8; column-fill:balanced; border-radius:9px; padding-left:1em"></ul>`r`n`r`n<ul class="menu" style="display:flex; justify-content:space-between"><a class='slider' id='sub' onmouseenter='spool(event, id, "%safe_subfolders%", "panel")' style="width:7`%;">Sub</a>`r`n<a class='slider' id='folders' onmouseenter='spool(event, id, "%safe_folder_list%", "panel")' style="width:7`%;">Fol</a>`r`n<a class='slider' id='fav' onmouseenter='spool(event, id, "%safe_fav_folders%", "panel")' style="width:7`%;">Fav</a>`r`n<a href="file:///%inca%/cache/html/slides.htm" class='slider' id='slides' onmouseenter='spool(event, id, "%slides%", "panel")' style="width:7`%;">Slides</a>`r`n<a href="file:///%inca%/cache/html/music.htm" class='slider' id='music' onmouseenter='spool(event, id, "%music%", "panel")' style="width:7`%;">Music</a>`r`n<a id='search' class='slider' onmousemove='spool(event, id, "%search_list%", "panel")' onmousedown='spool(event,"all","%search_list%", "all")'>Search</a></ul>`r`n`r`n
        if search_box
            plus = <a href="#Searchbox" style="color:red;"><c>+</c></a>		; + option to add search to search list
        else plus =
        filter_html =`r`n`r`n<ul class="menu" style="display:flex; justify-content:space-between;">`r`n<input type="search" class="searchbox" value="%search_box%" style="width:14`%; border-radius:8px; height:16px; border:none; color:#888888; background-color:#1b1814;">%plus%`r`n`r`n
        Loop, Parse, sort_list, `|
            if A_LoopField
                {
                query = %sort%%toggles%
                x = id='%A_LoopField%#0' class='slider' style='width:8`%; background-color:inherit;'
                name := A_LoopField
                if InStr(query, name)
                    name = <span style="color:LightSalmon;">%name%</span>
                filter_html = %filter_html%<a href="#%A_LoopField%#" %x%>%name%</a>`r`n
                }
        sort_html = <ul class="menu" style="margin-top:1em; margin-bottom:1em; display:flex; justify-content:space-between">`r`n<a href="#View#%view%" id='slider4' class='slider' style="width:12`%;" onmousemove='getCoords(event, id, "View", "%html_folder%","")' onmouseleave='getCoords(event, id, "View", "%html_folder%", "%view%")'>View %view%</a>`r`n<a href="%html_folder%.htm#%sort%" id='slider1' class='slider' onmousemove='getCoords(event, id, "%sort%", "%html_folder%", "")'>%sort%</a>`r`n<a href="%html_folder%.htm#Page" id='slider2' class='slider' onmousemove='getCoords(event, id, "%Pages%", "%html_folder%", "")' onmouseleave='getCoords(event, id, "%Pages%", "%html_folder%", "%page%")'>Page %page% of %pages%</a>`r`n<a href="#Page#%next%" class='slider' style="width:12`%;">Next</a></ul>
        title_html = `r`n`r`n<div style="margin:auto; width:24`%; margin-top:1.6em; margin-bottom:0.5em;"><a href="#%safe_playlist%#" style="font-size:1.8em; color:#555351;">%safe_title% &nbsp;&nbsp;<span style="font-size:0.7em;">%list_size%</span></a></div>`r`n`r`n
        html = `r`n<div style="padding-left:6`%; ">`r`n%html%</div></div>`r`n<p style="height:240px;"></p>`r`n</body></html>`r`n
        FileDelete, %inca%\cache\html\%tab_name%.htm
        FileAppend, %header_html%%panel_html%%sort_html%%filter_html%</ul>%title_html%%html%, %inca%\cache\html\%tab_name%.htm        
        LoadHtml()
        sleep 333							; time for browser to render behind mpv
        if video_player
            WinActivate, ahk_ID %video_player%				; otherwise browser sets mouse wheel hi-res mode
        PopUp("",0,0)					
        DetectMedia(last)						; restore media parameters
        }


    SpoolList(i, source)						; spool sorted media files into web page
        {
        if !DetectMedia(source)
            source = %inca%\apps\icons\no link.png
        caption =
        start := 0
        thumb := source
        x = %inca%\cache\captions\%media%.txt
        Transform, y, HTML, %x%, 2
        FileRead, caption, %x%
          if caption
            caption = <a href="#%y%#%i%" style="width:100`%; color:LightSalmon; opacity:0.7; font-size:%font_size%em;">%caption%</a>
        StringReplace, caption, caption, \,/, All      
        dur := Time(GetDuration(source))
        width := "34,19,13,9,6,4,15"
        width := StrSplit(width, ",")
        width := width[view]
        width1 := width * 2
        margin := Round(width * 0.5)
        font_size := Round((width + 20) / 34,1)
        height1 := Round(width * 0.9)
        font := Setting("Font Color")
        FileGetSize, size, %source%, K
        size := Round(size/1000)
        hov := Round(100 * (width + 20)/34)
        hov_size = img style="width:%hov%`%;				; hover image in list view
        vid_styl = img style="width:100`%;
        if InStr(selected, "/"i "/")					; underline selected media
            select = border-bottom:dotted #ffbf99;
        if (last_media && InStr(source, last_media))
            highlight = color:LightSalmon;
        if (type == "video")
            thumb =  %inca%\cache\thumb1\%media%.jpg
        if (type == "audio" || type == "m3u")
            thumb = %inca%\apps\icons\music.png
        if (type == "document")
            thumb = %inca%\apps\icons\ebook.png
        IfExist, %inca%\favorites\%media%*.*
            if (folder != "Slides" && folder != "Favorites" && folder != "Snips")
                fav = <span style="font-size:0.7em;">❤️</span>		; red favorite heart symbol
        name := SubStr(media, 1, 99)
        Transform, thumb, HTML, %thumb%, 2				; make filenames web compatible
        Transform, name, HTML, %name%, 2
        StringReplace, thumb, thumb, \,/, All
        width_t := 1
        ratio := 1.007
        Loop % Abs(skinny)
            width_t  *= ratio
        height_t := 1 - (width_t - 1)
        if (skinny && skinny < 0)
            transform = transform:scaleX(%height_t%);
        if (skinny > 0)
            transform = transform:scaleY(%height_t%);
        if (view == 7)							; list view 
            {
            entry = <a href="#Media#%i%"><table><tr><td id="hover_image"><%hov_size% %select%" src="file:///%thumb%"></tr></table><table style="table-layout:fixed; width:100`%"><tr><td style="color:#777777; width:4em; text-align:center">%sort_filter%</td><td style="width:4em; font-size:0.7em; text-align:center">%dur%</td><td style="width:3em; font-size:0.7em; text-align:center">%size%</td><td style="width:4em; padding-right:3.2em;  font-size:0.7em; text-align:center">%ext%</td><td style="%select% %highlight% white-space:nowrap; text-overflow:ellipsis; font-size:1em">%name% %fav%</td></tr></table></a>`r`n`r`n
            }
        else
            {
            if (ext == "txt")
                {
                Loop 40
                    {
                    rows := A_Index
                    FileReadLine, str1, %source%, %A_Index%
                    if !ErrorLevel
                        str2 = %str2%%str1%`r`n
                    else break
                    }
	        entry = <a href="#Media#%i%"><div style="display:inline-block; width:88`%; color:#555351; transition:color 1.4s; margin-left:8`%; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_filter% &nbsp;&nbsp;%link% %name%</div></a><textarea rows=%rows% style="display:inline-block; overflow:hidden; margin-bottom:%margin%em; margin-left:8`%; width:88`%; background-color:inherit; color:#826858; font-size:1.2em; font-family:inherit; border:none; outline:none;">%str2%</textarea>`r`n`r`n
                }
            else entry = <li style="display:inline-block; vertical-align:top; width:%width%em; margin-bottom:%margin%em;margin-right:5`%;color:%font%; transition:color 1.4s;"><div style="margin-left:8`%; color:#555351; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_filter% &nbsp;&nbsp;%link% %fav% %name%</div><a href="#Media#%i%"><%vid_styl% %transform% %select%" src="file:///%thumb%"></a>%caption%</li>`r`n`r`n
            }
        last_ext := ext
        skinny =
        return entry
        }

