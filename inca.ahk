

	;   Inca Media Viewer		Windows - Firefox - Chrome


	#NoEnv
	#UseHook, On
	SetWinDelay, 0
	SetKeyDelay, 0
	SetBatchLines -1
	SetTitleMatchMode,2
	GroupAdd, Browsers, Nightly
	GroupAdd, Browsers, Google Chrome
	GroupAdd, Browsers, Mozilla Firefox
	#SingleInstance force		; one program instance only
	#MaxHotkeysPerInterval 999	; allow fast spinning wheel
	SetWorkingDir, %A_ScriptDir%	; consistent start directory

        Global sort_list		:= "Shuffle|Date|Duration|Alpha|Size|ext|Reverse|Recurse|- Images|- Video||"
        Global toggle_list		:= "ReverseRecurse- Images- Video"
        Global toggles
        Global features			; program settings
        Global folder_list		; folders to show at top of web page
        Global search_list		; models, studios, genre, key words etc.
        Global search_folders		; default search locations
        Global indexed_folders		; create thumbnails for
        Global this_search		; current search folders
        Global context_menu		; right click menu
        Global inca			; default folder path
        Global list			; sorted file list
        Global list_size
        Global selected			; selected files from web page
        Global menu_html		; menus in web page
        Global media_html		; media in web page
        Global search_box		; web page textbox
        Global search_term		; text search filter
        Global inputfile		; or extracted .lnk file
        Global sourcefile		; not extracted .lnk file
        Global media_name		; media filename no path or ext
        Global media_path		; media folder path
	Global subfolders
        Global spool_name		; spool folder name only
        Global spool_path		; input source folder
        Global tab_name			; browser tab title
	Global previous_tab
        Global ext			; file extension
        Global history_timer		; timer to add files to history 
        Global vol_popup		; volume bar popup 
        Global seek_time		; media play position - seconds
        Global duration			; current media duration from file - seconds
        Global volume
        Global paused
        Global music_speed := 0
        Global video_speed := 0
        Global video_sound := 0		; video / music sound source
        Global media =			; current media type
        Global page := 1		; current page within list
        Global sort			; current sorting mode
        Global sort_filter
        Global tab			; media webpage exists = 1, is active = 2
        Global click			; click key or process
        Global timer			; click timer
        Global edit			; editing mode
        Global view := 3	 	; thumbnail size
	Global last_view := 3
        Global music_player 		; windows id
        Global video_player
        Global vol_ref := 2
        Global skinny			; media width
        Global wheel			; direction 0 or 1
        Global slider			; ClientX from browser javascript
        Global filter			; list filter calculated from slider
        Global inside_browser		; clicked inside browser window
        Global last_media		; last media sourcefile
        Global caption			; media text overlay
	Global list_id			; media list pointer
        Global last_id			; previous pointer
        Global menu_item		; context menu
        Global properties		; media properties
        Global back_timer := 0		; back key timer
        Global playlist			; playlist filename
	Global songlist			; playlist current song list
	Global song_timer		; time remaining
        Global song			; current song inc. path
        Global song_id			; playlist pos
	Global page_media		; list of media id's in .htm page header
	Global last_status		; time, vol etc display
	Global magnify := 0.7		; magnify video
        Global seek			; goto seek time
	Global idle			; mpv player idle
	Global slide			; slide media open
	Global end_time			; slide - to pause video
	Global caption_id		; slide number
	Global thumb_sheet
	Global block_wheel
	Global xm
	Global ym
	Global pan



    main:
      initialize()			; set environment
      SetTimer, TimedEvents, 100, -1	; every 100mS
      return				; wait for hotkeys


    ~LButton::
    RButton::
      Critical
      if (!Gestures() && click)
          ClickEvent()
      IfInString, click, update
          RenderPage()
      IfInString, click, magnify
          ThumbSheet()
      PopUp("",0,0)
      timer =
      return


    MButton::
      Critical
      timer =
      sourcefile =
      click = MButton
      MouseGetPos, xm, ym
      WinGetPos,xb,yb,wb,, ahk_group Browsers
      if (music_player && xm < 100)
          PlaySong(song_id)
      else if video_player
          {
          if (media == "image" || slide)
              NextMedia()
          else ThumbSheet()
          }
      else if (tab == 2 && xm < xb + wb && xm > xb + 10 && ym > yb + 150 && !ClickWebPage()) 
          PlayMedia()							; return to last_media
      else send, {MButton}
      return


    ~Esc::
    ~BackSpace::
      IfWinExist, ahk_ID %video_player%
        TaskSwitcher()
      return


    Xbutton1::								; mouse "back" button
      if edit
          {								; context menu
          WinClose, ahk_class #32770
          edit =
          return
          }
      click = Back
      timer = set
      SetTimer, Xbutton_Timer, -300
      return

    Xbutton_Timer:							; long back key press
      Critical
      if timer
          if (video_player && (media != "video" || slide))
              NextMedia()
          else if video_player
              TaskSwitcher()
          else IfWinActive, ahk_group Browsers
              send, ^w							; close tab
          else send, !{F4}						; close app
      timer =
      return

    Xbutton1 up::
      Critical
      IfWinExist, ahk_class OSKMainClass				; onscreen keyboard
          send, !0
      else if timer
          {
          WinGet, state, MinMax, ahk_group Browsers
          if (video_player || thumb_sheet)
              TaskSwitcher()
          else if (WinActive("ahk_group Browsers") && state > -1 && tab == 2) 
              {
              selected =
              if (A_TickCount - back_timer > 2000)
                  {
                  send, {Home}
                  RenderPage()
                  send, {Home}
                  }
              else send, !{Left}
              back_timer := A_TickCount
              }
          else send, {Xbutton1}
          }
      timer =
      return


    ~WheelUp::
    ~WheelDown::
      Critical
      click =
      wheel := 1
      if (A_ThisHotkey == "~WheelDown")
          wheel := 0
      if Setting("Reverse Wheel")
          wheel ^= 1
      if (video_player && media != "image" && A_TickCount > block_wheel)
          {
          WinActivate, ahk_ID %video_player%
          key = {Left}
          if wheel
              key = {Right}
          if (duration < 60)
              if wheel
                  key = e
              else key = f
          if (paused || ext == "gif")
              if wheel
                  key = .
              else key = ,
          ControlSend,, %key%, ahk_ID %video_player%			; seek
          block_wheel := A_TickCount + 34
          }
      return


    ~Enter::								; file search - from tab input box
      if (WinActive("ahk_group Browsers") && tab == 2)
        {
        send, !0
        Clipboard =
        send, {end}+{Home}^c
        ClipWait, 0
        if (search_box := Clipboard)
            ClickWebPage()
        }
      return


    #\::
      TaskSwitcher()
      return


    TimedEvents:							; every 100mS
        Critical
        MouseGetPos, xpos, ypos
        IfWinNotExist, ahk_ID %music_player%
            music_player =
        if history_timer
            history_timer += 1
        if vol_popup							; show orange volume bar
            vol_popup -= 1
        if (music_player && song_timer && A_TickCount > song_timer)
            PlaySong(song_id)
        if (volume > 0.1 && !vol_popup && !video_player && Setting("Sleep Timer") > 10 && A_TimeIdlePhysical > 600000)
            {
            volume -= vol_ref / (Setting("Sleep Timer") * 6)		; sleep timer
            SoundSet, volume						; slowly reduce volume
            vol_popup := 100						; check every 10 seconds
            }
        if (video_player && media == "image")				; pan image
            {
            key =
            if (xm < xpos - pan)
                key = j
            if (xm > xpos + pan)
                key = i
            if (ym < ypos - pan)
                key = h
            if (ym > ypos + pan)
                key = g
            if key
                {
                loop 12
                    {
                    ControlSend,, %key%, ahk_ID %video_player%
                    sleep 10
                    }
                xm := xpos
                ym := ypos
                pan := 4
                }
            }
        if (video_player && media != "image" && ! thumb_sheet)		; show seek bar
            {
            GetSeektime(video_player)
            Gui, SeekBar:+LastFound -Caption +ToolWindow +AlwaysOnTop -DPIScale
            Gui, SeekBar:Color, 303030
            wp := A_ScreenWidth * (seek_time/duration)
            yp := A_ScreenHeight - 2
            if wp
                Gui, SeekBar:Show, x0 y%yp% w%wp% h2 NA
            if (ypos > A_ScreenHeight * 0.8)
                ThumbsBar()
            else 
                {
                seek =
                Gui, pic: Cancel
                }
            }
        else Gui, SeekBar:Hide
        if !video_player
            {
            edit =
            dim := tab
            tab := 0
            WinGetTitle title, Inca -
            tab_name := SubStr(title, 8)
            StringGetPos, pos, tab_name, -, R
            StringLeft, tab_name, tab_name, % pos - 1
            WinGet, state, MinMax, ahk_group Browsers
            if tab_name
                tab := 1
            if (tab_name && state != -1 && !edit)
                tab := 2
            if (tab != dim)
                {
                if (tab == 2 && Setting("Dark Cursor"))
                    {
                    Cursor = %inca%\apps\icons\CrossHair.cur
                    CursorHandle := DllCall( "LoadCursorFromFile", Str,Cursor )
                    DllCall( "SetSystemCursor", Uint,CursorHandle, Int,"32512" )	; main cursor    
                    CursorHandle := DllCall( "LoadCursorFromFile", Str,Cursor )
                    DllCall( "SetSystemCursor", Uint,CursorHandle, Int,"32650" )	; wait cursor
                    CursorHandle := DllCall( "LoadCursorFromFile", Str,Cursor )
                    DllCall( "SetSystemCursor", Uint,CursorHandle, Int,"32649" )	; hand cursor    
                    }
                else DllCall( "SystemParametersInfo", UInt,0x57, UInt,0, UInt,0, UInt,0 ) ; Reload cursors
                mask1 := 0
                if (mask2 := Setting("Dim Desktop"))
                  loop 20
                    {
                    sleep 8
                    mask1 += (Setting("Dim Desktop") * 2.55) / 20
                    mask2 -= 10
                    Gui, background:+LastFound
                    if (tab == 2)
                        WinSet, Transparent, %mask1%
                    else WinSet, Transparent, %mask2%
                    }
                }
            if (tab == 2 && tab_name && tab_name != previous_tab)
                {
                previous_tab := tab_name
                GetPageSettings()
                if CreateList(1)
                    RenderPage()					; only if folder contents changed
                }
            }
        ShowStatus()							; show vol, speed, width on taskbar
        return


    Gestures()
      {
      StringReplace, click, A_ThisHotkey, ~,, All
      MouseGetPos, xm, ym
      WinGetPos, xb, yb, wb, hb, ahk_group Browsers
      if (tab == 2 && WinActive("ahk_group Browsers") && xm > xb+10 && ym > yb+100 && xm < xb+wb-50 && ym < yb+hb-50)
          {
          inside_browser = 1
          if (!yb && xb + wb < A_ScreenWidth + 16 && xb + wb > A_ScreenWidth - 8)
              WinMove, ahk_class MozillaWindowClass,, xb, -4, A_ScreenWidth - xb + 12, hb + 4
          }
      else inside_browser =
      if (inside_browser || (video_player && !edit))			; allow gestures over tab or player
          send, {Click up}
      start := A_TickCount
      loop								; gesture detection
        {
        MouseGetPos, x, y
        x -= xm
        y -= ym
        xy := Abs(x + y)
        timer := A_TickCount - start
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P"))
            break
        if (xy > 3 || (click == "RButton" && (xm < 10 || xm > A_ScreenWidth - 10)))
            {
            gesture = 1
            MouseGetPos, xm, ym
            if (video_player || click == "RButton")
                {
                if (xm < 10)						; edge of screen
                    xm := 10
                if (ym < 10)
                    ym := 10
                if (xm > A_ScreenWidth - 10)
                    xm := A_ScreenWidth - 10
                if (ym > A_ScreenHeight - 10)
                    ym := A_ScreenHeight - 10
                MouseMove, % xm, % ym, 0
                }
            if (GetKeyState("RButton", "P") && Setting("Volume Gesture"))
                SetVolume(x+y)
            if GetKeyState("LButton", "P")
                if (click == "speed")
                    SetSpeed(x+y)
                else if (A_Cursor != "IBeam" && video_player)
                    SetAspect(x, y)
                else if !inside_browser
                    BrowserMagnify(y)
            }
        if (!gesture && timer > 350)
            {
            if (click == "LButton" && video_player && media != "image")
                SetSpeed(0)
            if (click == "LButton" && A_Cursor == "IBeam")
                SearchText()
            if (inside_browser && click == "LButton" && !video_player && A_Cursor != "IBeam" && !WinExist("ahk_class OSKMainClass"))
                 ClickWebPage()
            else if (tab == 2 && click == "RButton" && (video_player || GetPageLink()))
                 AddFavorites()
            else if (tab != 2 && click == "RButton" && A_Cursor == "Unknown")
                SaveImage()
            else continue
            return 1
            }

         }
      return gesture
      }


    ClickEvent()
        {
        if (click == "RButton")
            {
            if video_player
                Menu, ContextMenu, Show
            else if (inside_browser && GetPageLink())
                {
                last_media =
                IfNotInString, selected, %sourcefile%
                    selected = %selected%%sourcefile%`r`n
                else StringReplace, selected, selected, %sourcefile%`r`n
                send, {RButton}{Esc}
                }
            else if (!edit && inside_browser)
                {
                edit = media
                Menu, ContextMenu, Show
                }
            else send, {RButton}
            return
            }
        if edit
            return
        if (video_player && media != "image" && menu_item != "Cap")
            {
            if thumb_sheet
                ThumbSeekTime()
            if seek
                RunWait %COMSPEC% /c echo seek %seek% absolute > \\.\pipe\mpv%list_id%,, hide && exit
            if (seek_time >= duration - 2)
                {
                paused := 1
                RunWait %COMSPEC% /c echo seek 0 absolute > \\.\pipe\mpv%list_id%,, hide && exit
                }
            if thumb_sheet
                ThumbSheet()
            if (!seek && timer < 350)
                {
                if paused
                    paused =
                else paused = 1
                if paused
                    ControlSend,, 2, ahk_ID %video_player%
                else ControlSend,, 1, ahk_ID %video_player%
                }
            seek := 0
            }
        else if (inside_browser && A_Cursor != "IBeam" && !WinExist("ahk_class OSKMainClass"))
            ClickWebPage()
        else if video_player
            NextMedia()
        }


    ClickWebPage()							; change with extreme caution !
        {
        media =
        last_id =
        If (timer > 350)
            subfolders =
        if (StrLen(search_box) > 2)
            sourcefile = %search_box%					; also clears white space
        else if (tab == 2 && !GetPageLink())
            {
            if (click == "LButton" && timer > 350)
                {
                page := 1
                if (view < 5)
                    {
                    last_view := view
                    view := 5
                    }
                else view := last_view
                if (view == 5)
                    PopUp("List",0,0)
                else PopUp("Thumbs",0,0)
                RenderPage()
                }
            if (click == "MButton")
                seek := seek_time
            return
            }
        SplitPath, sourcefile,, folder_payload, ext, link_data		; link_data can be folder search sort page..
        if (ext == "htm")
            return 1
        else if (link_data == "Settings")
            ShowSettings()
        else if DetectMedia()
            PlayMedia()
        else if (link_data == "Page" || link_data == "View")
            RenderPage()
        else								; link_data is sort, folder or search_term
            {
            if (StrLen(search_term) > 2 && link_data == "+")		; add latest search to search list
                {
                search_list = %search_list%|%search_term%
                IniWrite,%search_list%,%inca%\settings.ini,Settings,search_list
                LoadSettings()
                RenderPage()
                return 1
                }
            if folder_payload
                {
                spool_path = %folder_payload%\
                this_search := spool_path
                if !link_data
                    {
                    filter =
                    selected =
                    search_term =
                    }
                }
            if !search_term
                {
                StringTrimRight, spool_name, spool_path, 1
                StringGetPos, pos, spool_name, \, R
                StringTrimLeft, spool_name, spool_name, % pos + 1
                tab_name := spool_name
                if (timer < 350)
                    GetPageSettings()						; from htm cache
                }
            page := 1
            if (!folder_payload && !search_box && InStr(sort_list, link_data))	; link_data is sort button
                {
                if (sort != link_data)						; new sort
                    {
                    if (link_data != "Reverse" && !InStr(toggle_list, link_data))
                        StringReplace, toggles, toggles, Reverse		; remove reverse
                    if (link_data == "Date")
                        toggles = %toggles%Reverse
                    filter =
                    }
                else if (sort != "Shuffle" && !filter)
                    link_data = Reverse
                IfInString, toggle_list, %link_data%
                    IfNotInString, toggles, %link_data%			; toggle the sort switches
                        toggles = %toggles%%link_data%			; add switch
                    else StringReplace, toggles, toggles, %link_data%	; remove switch
                else sort := link_data
                link_data =
                }
            if link_data						; search text from link or search box
                {
                if (InStr(spool_path, "\playlist"))
                    spool_path =
                subfolders =
                x := spool_path
                tab_name := link_data
                spool_name := link_data
                if !folder_payload
                    GetPageSettings()
                if search_box
                    {
                    view := 5
                    sort = Duration
                    toggles =
                    }
                spool_path := x
                if (!folder_payload || search_box)
                    this_search := search_folders
                if (search_box && !InStr(this_search, spool_path))	; search this folder, then search paths
                    this_search = %spool_path%|%this_search%		; search this folder only
                if (search_term != link_data)				; last search != new search
                    filter =
                search_term := link_data
                page := 1
                }
            if (StrLen(Toggles) < 4)
                Toggles =
            if subfolders
                IfNotInString, subfolders, %spool_name%
                    subfolders =
            Loop, Files,%spool_path%*.*, D
                if A_LoopFileAttrib not contains H,S
                    IfNotInString, subfolders, %A_LoopFileFullPath%
                        subfolders = %subfolders%%A_LoopFileFullPath%\|
            CreateList(0)
            RenderPage()
            }
        search_box =
        return 1
        }


    CreateList(silent)							; of files in spool_path
        {
        if !spool_name
            return
        IfNotExist, %spool_path%
            spool_path = %search_term%\
        if (sort == "Shuffle" && InStr(spool_path, "\playlist"))
            NewPlaylist()
        list =
        list_size := 0
        StringReplace, li, this_search, \, `;, All			; convert to cache filename
        StringReplace, li, li, |, `;, All
        StringReplace, li, li, :, `;, All
        cache_file = %inca%\cache\lists\%li%%sort%%toggles%.txt
        FileGetSize, cache_size, %cache_file%, K
        if (silent ||(!search_box && cache_size > 1000 && timer < 350))
            FileRead, list, %cache_file%
        if !list
            {
            if (InStr(toggles, "Recurse") || search_term)
                recurse = R
            Loop, Parse, this_search, `|
                Loop, Files, %A_LoopField%*.*, F%recurse%
                    if A_LoopFileAttrib not contains H,S
                        {
                        inputfile := A_LoopFileFullPath
                        SplitPath, inputfile,,,ex, filen
                        if (ex == "lnk")
                            {
                            FileGetShortcut, %inputfile%, inputfile
                            SplitPath, inputfile,,,ex,filen   
                            }
                        if (med := DecodeExt(ex))
                            {
                            list_size += 1
                            data := list_size
                            if (list_size/1000 == Round(list_size/1000))
                                PopUp(list_size,0,0)
                            if (sort == "ext")
                                data := ex
                            else if (sort == "Date")
                                FileGetTime, data, %A_LoopFileFullPath%, M
                            else if (sort == "Size")
                                FileGetSize, data, %inputfile%, K
                            else if (sort == "Duration")
                                FileRead, data, %inca%\cache\durations\%filen%.txt
                            list = %list%%data%/%inputfile%/%med%`r`n
                            }
                        }
            StringTrimRight, list, list, 2				; remove end `r`n
            IfInString, toggles, Reverse
                reverse = R
            if (sort == "ext")
                Sort, list, %reverse% Z
            else if (sort != "Shuffle")
                Sort, list, %reverse% Z N
            PopUp(list_size,0,0)
            }
        else if !silent
            PopUp("Cache",0,0)
        FileRead, cache, %cache_file%
        if !silent
            {
            if (sort == "Shuffle" && click != "MButton" && !menu_item)
                Sort, list, Random Z
            FileDelete, %cache_file%
            FileAppend, %list%, %cache_file%, UTF-8
            }
        if (StrLen(list) != StrLen(cache))
            return 1
        }


    GetPageLink()							; link data from web page click event
        {
        WinActivate, ahk_group Browsers
        if (click == "LButton")
            send, {LButton up}
        else send, {LButton}						; so M or R Button fill location bar
        input := GetLocationBar(1)
        StringLeft, prefix, input, 8
        if (prefix != "file:///")
            return
        sourcefile =
        StringTrimLeft, input, input, 8
        StringReplace, input, input, /, \, All
        snip =
        slider =
        array := StrSplit(input,"#")
        pos := array.MaxIndex()
        if (pos < 2)							; no link meta data
            return
        sourcefile := array[pos]
        if sourcefile is number						; must be 2nd argument (e.g. page or js clientX)
            {
            slider := sourcefile
            sourcefile := array[pos - 1]
            }
        StringLeft, prefix, sourcefile, 5
        SplitPath, sourcefile,,,, link_data
        if (prefix == "media")
            {
            StringTrimLeft, id, sourcefile, 5
            StringRight, snip, id, 1
            StringTrimRight, list_id, id, 1
            Loop, Parse, list, `n, `r
                if (A_Index == list_id)
                    sourcefile := StrSplit(A_LoopField, "/").2
            SplitPath, sourcefile,,,,media_name
            if snip
              IfExist, %inca%\favorites\snips\%media_name% - %snip%.mp4
                sourcefile = %inca%\favorites\snips\%media_name% - %snip%.mp4
            if !DetectMedia()
                {
                PopUp("Media Not Exist",600,1)
                return
                }
            else if (media == "video" && !snip && click != "MButton")
                     CalcSeekTime(slider)
            else seek := 0
            }
        else if (link_data == "Page")
            page := slider
        else if (link_data == "View")
            view := slider
        else if (slider || InStr(sort_list, link_data))
            {
            filter := slider
            if (sort == "Alpha") 
                filter := Chr(filter)
            }
        return 1
        }


    GetLocationBar(escape)
        {
        clip := clipboard
        Loop 2
            {
            clipboard =
            sleep 40
            send, ^l
            sleep 40
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


    GetPageSettings()							; from .htm cache file
        {
        page := 1
        view := 3
        toggles =
        sort = Shuffle
        FileReadLine, array, %inca%\cache\html\%tab_name%.htm, 2
        if array
            {
            array := StrSplit(array,"/")
            view := array.1
            page := array.2
            sort := array.3
            toggles := array.4
            this_search := Transform_Htm(array.5)
            search_term := Transform_Htm(array.6)
            spool_path := Transform_Htm(array.7)
            spool_name := Transform_Htm(array.8)
            return 1
            }
        }


    Transform_Htm(htm)							; from html to utf-8
        {
        loop parse, htm, *
	    if chr(a_loopfield)
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


    CalcSeekTime(thumb)
        {
        duration := 8
        IfNotInString, media_path, \favorites\snips
           FileRead, duration, %inca%\cache\durations\%media_name%.txt
        offset := 0
        if (duration > 60)
           offset := 19
        seek := Round(thumb * duration + offset - thumb * offset, 1)
        }


    GetSeekTime(player)							; get media properties from mpv
        {
        IfWinNotExist, ahk_ID %player%
            return
        clip := ClipBoard
        Clipboard =
        ControlSend,, =, ahk_ID %player%				; to mpv player - see input.conf
        ClipWait, 0
        StringReplace, input, ClipBoard, `r`n, , All
        input := StrSplit(input, "/")
        array := StrSplit(input.2, ":")
        idle := input.3
        duration := array.1 * 3600 + array.2 * 60 + array.3
        seek_time := Round((input.5 / input.6) * duration,1)
        array := StrSplit(input.1, ":")
        if !seek_time
            seek_time := array.1 * 3600 + array.2 * 60 + array.3
        if (player == music_player)
            {
            song_id := input.4 + 1
            FileReadLine, str, %inca%\cache\lists\songlist.m3u, %song_id%
            song := StrSplit(str, "/").1
            song_timer := A_TickCount + (Setting("Silence Gap") + duration - seek_time) * 1000
            }
        ClipBoard := clip
        return idle							; idle state
        }


    SearchText()							; file search - from selected text
        {
        if (tab != 2 && WinActive("ahk_group Browsers"))
            {
            Clipboard =
            send, {RButton}
            sleep 100
            send, c
            ClipWait, 0
            send, {Lbutton up}
            if ClipBoard
                {
                click = MButton						; create new tab for search
                spool_path =
                search_box := ClipBoard
                ClickWebPage()
                return
                }
            }
        send, !+0
        sleep 500
        }


    LoadHtml()								; create / update browser tab
        {
        WinActivate, ahk_group Browsers
        new_html = file:///%inca%\cache\html\%tab_name%.htm
        StringReplace, new_html, new_html, \,/, All
        if (click == "MButton")
            run, %new_html%						; open a new web tab
        else if (tab_name == previous_tab)				; just refresh existing tab
            send, {F5}
        else	
            {								; re-load tab
            previous_tab := tab_name
            GetLocationBar(0)
            sleep 34
            sendraw, %new_html%
            send, {Enter}
            }
        Loop, 100							; allow time for page to load before TimedEvents()
            {
            sleep 20
            WinGetTitle title, Inca -
            if (InStr(title, tab_name))
                break
            }
        }


    capButtonSave:
      gui, cap:submit
      FileDelete, %inca%\cache\captions\%media_name%.txt
      FileAppend, %caption%, %inca%\cache\captions\%media_name%.txt, UTF-8

    capButtonCancel:
      gui, cap:Destroy
      return

    ContextMenu:							; right click menu
    edit =
    copy =
    popup =
    count := 0
    if GetKeyState("LWin")
        copy = Copy
    menu_item := A_ThisMenuItem
    if video_player
        TaskSwitcher()
    if (menu_item == "New" && selected)					; new folder
       {
       FileSelectFolder, menu_item, , 3					; bring up new client window
       if (menu_item && !ErrorLevel)
           context_menu = %context_menu%|%menu_item%
       else menu_item =
       }
    if (menu_item == "Cap")
        {
        if slide
            SplitPath, playlist,,,,media_name
        FileRead, caption, %inca%\cache\captions\%media_name%.txt
        Gui, cap:+lastfound +AlwaysOnTop -Caption +ToolWindow
        gui, cap:add, edit, x10 y10 h170 w300 vcaption, %caption%
        gui, cap:add, button, x100 y200 w60, Cancel
        gui, cap:add, button, x200 y200 w60 default, Save
        gui, cap:show
        send, {Right}
        edit = cap
        return
        }
    if (menu_item == "Edit")
        {
        if (media == "playlist" || media == "document")
            Run, Notepad.exe "%inputfile%"
        else if slide
            Run, Notepad.exe "%slide%"
        return
        }
    if (menu_item == "Rename")
        {
        EditFilename()							; edit media filename
        return
        }
    if (menu_item == "All")
        {
        page := 1
        selected =
        CreateList(1)
        if (list_size > 1000)
            PopUp("Too Many Items", 600,0)
        else Loop, Parse, list, `n, `r 
            {
            count += 1
            input := StrSplit(A_LoopField, "/").2			;  sort_filter / sourcefile / media type
            if selected
                selected = %selected%`r`n%input%
            else selected = %input%
            }
        popup = Selected %count%
        }
    else
        {
        Loop, Parse, selected, `n, `r
            {
            if !(input := A_LoopField)
                break
            count += 1
            if (A_ThisMenu == "playlist")
                FileAppend, %input%|%seek_time%`r`n, %inca%\playlist\%menu_item%.m3u, UTF-8
            else
                {
                SplitPath, input,,,,media_name
                IfExist, %spool_path%%media_name%.lnk
                    input = %spool_path%%media_name%.lnk
                if (menu_item == "Delete")
                    {
                    FileRecycle, %input%
                    popup = Delete %count%
                    }
                else
                    {
                    if menu_item
                        Loop, Parse, context_menu, `|
                            IfInString, A_LoopField, %menu_item%
                                IfExist, %A_LoopField%
                                    if copy
                                        FileCopy, %input%, %A_LoopField%	; copy files
                                    else
                                        FileMove, %input%, %A_LoopField%	; move files
                    popup = %copy% %menu_item% %count%
                    }
                }
            }
        PopUp(count,200,0)
        if !copy
            CreateList(0)
        selected =
        }
    if popup
        PopUp(popup,0,0)
    if (A_ThisMenu == "playlist")
        NewPlaylist()
    RenderPage()
    return


    EditFilename()
        {
        sourcefile := StrReplace(selected, "`r`n")
        selected =
        IfInString, media_path, \favorites\snips
            return
        edit = 1
        FileGetSize, size, %sourcefile%, K
        size := Round(size/1000,2)
        FileRead, duration, %inca%\cache\durations\%media_name%.txt
        InputBox, newname,%media_path%  %ext%  size %size%  dur %duration%,,,,94,,,,, %media_name%	; box height = 90px
        send, !0
        if !ErrorLevel
            {
            if (ext != "lnk")
                FileMove, %sourcefile%, %media_path%\%newname%.%ext%
            fav_his = favorites|history
            Loop, Parse, fav_his, `|
              Loop, Files, %inca%\%A_LoopField%\*.lnk, FR
                IfExist, %A_LoopFileDir%\%media_name%.lnk
                    {
                    FileGetShortcut, %A_LoopFileDir%\%media_name%.lnk, link_file,, sk, se
                    SplitPath, link_file,,fol,ext
                    FileCreateShortcut, %fol%\%newname%.%ext%, %inca%\%A_LoopField%\%newname%.lnk,, %sk%, %se%
                    break
                    }
            if (media == "video")
                {
                FileMove, %inca%\cache\durations\%media_name%.txt, %inca%\cache\durations\%newname%.txt, 1
                FileMove, %inca%\cache\thumbs\%media_name%.mp4, %inca%\cache\thumbs\%newname%.mp4, 1
                Loop, 9
                  IfExist, %inca%\favorites\snips\%media_name% - %A_Index%.mp4
                    FileMove, %inca%\favorites\snips\%media_name% - %A_Index%.mp4, %inca%\favorites\snips\%newname% - %A_Index%.mp4,1
                }
            FileRecycle, %inca%\favorites\%media_name%.lnk          
            FileRecycle, %inca%\history\%media_name%.lnk       
            CreateList(0)
            }
        RenderPage()
        }


    RenderPage()							; construct web page from media list
        {
        if !(spool_name || spool_path)
            return
        Transform, html_spool_name, HTML, %spool_name%, 2
        safe_spool_path := Transform_utf(spool_path)			; make filenames web compatible
        safe_spool_name := Transform_utf(spool_name)
        safe_this_search := Transform_utf(this_search)
        FileRead, font, %inca%\apps\ClearSans-Thin.txt			; firefox bug - requires base64 font
        FileRead, script, %inca%\apps\inca - js.js
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        list_size := 0
        previous := 1
        if (page > 1)
            previous := page - 1
        next := page + 1
        page_media =
        media_html =							; thumbnail listing
        media = video							; prime for list parsing
        width := Setting("Page Width")
        offset := Setting("Page Offset")
        fcol := Setting("Font Color")
        back := Setting("Back Color")
        size := Setting("Thumbs Qty")
        if (view == 5)							; no thumbnails so page list can be bigger
            size := Setting("List Size")
        Loop, Parse, list, `n, `r 					; split list into smaller web pages
          if FilterList(A_LoopField)
            {
            list_size += 1
            if ((list_size > (page-1) * size) && (list_size <= page * size))
                SpoolList(A_Index)
            }
        pages := ceil(list_size/size)
        html_header=<!--`r`n%view%/%page%/%sort%/%toggles%/%safe_this_search%/%search_term%/%safe_spool_path%/%safe_spool_name%`r`n%page_media%`r`n-->`r`n<!doctype html>`r`n<html>`r`n<head>`r`n<link rel="icon" type="image/x-icon" href="file:///%inca%/apps/icons/inca.ico">`r`n<meta charset="UTF-8">`r`n<title>Inca - %html_spool_name%</title>`r`n<style>`r`n`r`n@font-face {font-family: ClearSans-Thin; src: url(data:application/font-woff;charset=utf-8;base64,%font%);}`r`nbody {font-family: 'ClearSans-Thin'; overflow-x:hidden; background:%back%; color:#666666; font-size:0.9em; margin-top:160px;}`r`na:link {color:#15110a;}`r`na:visited {color:#15110a;}`r`ntable {color:%fcol%; transition:color 1.4s; width:100`%; table-layout:fixed; border-collapse: collapse;}`r`na {text-decoration:none; color:%fcol%;}`r`nc {width:28`%; text-decoration:none; color:%fcol%;}`r`nimg {display:block; margin:0 auto; max-width:100`%; max-height:%max_height%px;}`r`n.title {clear:left; white-space:nowrap; color:#33312e;}`r`na.slider {display:inline-block; width:36`%; height:18px; border-radius:9px; color:%fcol%; transition:color 1.4s; font-size:1.1em; background-color:#1b1814; margin-right:1em; margin-left:-0.24em; text-align:center}`r`na.slider:hover {color:red; transition:color 0.36s;}`r`na.footer {display:inline-block; width:34`%; font-size:2.2em; color:#33312e; transition:color 1.4s;}`r`na.footer:hover {color:red; transition:color 0.36s;}`r`n.container {width:%width%`%; margin-left:%offset%`%;}`r`n.columns {float:left;}`r`nul.menu {width:100`%; column-gap:10px; margin:auto; list-style-type:none; padding:0; white-space:nowrap;}`r`n.sorts {color:#555351; font-size:0.8em; text-align:right; padding-right:2em; width:1.2em;}`r`nul.menu li {color:%fcol%; transition:color 1.4s;}`r`nul.menu li:hover {color:red; transition:color 0.36s;}`r`nul.list {width:100`%; margin-right:12`%; list-style-type:none; padding:0;}`r`nul.list table:hover {color:red; transition:color 0.36s;}`r`nul.list li img {border: 1px solid %back%;}`r`n#hover_image {position:absolute; opacity:0; width:170px; height:auto;}`r`n#hover_image:hover {opacity:1;}`r`n@keyframes blink {0`% {opacity:0;} 100`% {opacity:1;}`r`n</style>`r`n</head>`r`n<body>`r`n`r`n%script%`r`n`r`n<div class="container"><ul class="list"><a href=""><li class="title" style="font-size:5em">%html_spool_name%<span style="font-size:0.4em;">&nbsp;&nbsp;%list_size%</span></li></a></ul></div>`r`n
        menu_html = `r`n<div class="container">`r`n`r`n<ul class="menu" style="display:flex; justify-content:space-between;">`r`n`r`n
        HighLightMenu(sort, sort_list)
        sort_html = <div style="height:20px; clear:left;"></div><div class="container">`r`n`r`n<a href="#View#%view%" id='slider4' class='slider' style="width:8`%;" onmousemove='getCoords(event, id, "View", "%html_spool_name%","")' onmouseleave='getCoords(event, id, "View", "%html_spool_name%", "%view%")'>View %view%</a>`r`n`r`n<a href="%html_spool_name%.htm#%sort%" id='slider1' class='slider' onmousemove='getCoords(event, id, "%sort%", "%html_spool_name%", "")'>%sort%</a>`r`n`r`n<a href="%html_spool_name%.htm#Page" id='slider2' class='slider' onmousemove='getCoords(event, id, "%Pages%", "%html_spool_name%", "")' onmouseleave='getCoords(event, id, "%Pages%", "%html_spool_name%", "%page%")'>Page %page% of %pages%</a>`r`n`r`n<a href="#Page#%next%" class='slider' style="width:8`%;">Next</a></div><div style="height:6px;"></div>`r`n`r`n%menu_html%</ul><p style="height:30px;"></p></div>`r`n`r`n`r`n
        x =
        if search_box
            x = <a href="#+" style="font-size:18px"><c>+ </c></a>		; + option to add search to search list
        menu_html = `r`n<div class="container">`r`n<div class="columns" style="width:18`%; margin-right:12px"><ul class="menu" style="column-count:1">`r`n`r`n<li>%x%<input type="search" class="searchbox" value="%search_box%" style="width:70`%; border-radius:8px; height:17px; border:none; font-size:12px; color:#888888; background-color:#1b1814;"/></li>
        HighLightMenu(html_spool_name, folder_list)
        if subfolders
            HighLightMenu(html_spool_name, subfolders)
        menu_html = %menu_html%`r`n</ul></div>`r`n
        menu_html = %menu_html%<div class="columns" style="width:78`%">`r`n<ul class="menu" style="column-count:6">`r`n`r`n
        HighLightMenu(search_term,search_list)				; highlight search menu item if exists
        menu_html = %menu_html%`r`n</ul></div>`r`n<div class="columns" style="width:100`%; height:40px"></div>`r`n</div>`r`n
        media_html = <div class="container" oncontextmenu="return(false);">`r`n`r`n<ul class="list">`r`n`r`n%media_html%</ul>`r`n</div>`r`n`r`n<div class="container"><div align="center" style="margin-right:12`%;"><a href="#Page#%previous%" class='footer' style="width:16`%;">Previous</a><a href="%html_spool_name%.htm#Page" id='slider3' class='footer' style="height:2em; font-size:1.1em;" onmousemove='getCoords(event, id, "%Pages%", "%html_spool_name%", "")' onmouseleave='getCoords(event, id, "%Pages%", "%html_spool_name%", "%page%")'>Page %page% of %pages%</a><a href="#Page#%next%" class='footer' style="width:16`%;">Next</a></div>`r`n<a href=""><p style="height:250px; clear:left;"></p></a>`r`n</div>`r`n</body>`r`n</html>`r`n`r`n
        FileDelete, %inca%\cache\html\%tab_name%.htm
        FileAppend, %html_header%%menu_html%%sort_html%%media_html%, %inca%\cache\html\%tab_name%.htm        
        LoadHtml()
        if video_player
            WinActivate, ahk_ID %video_player%
        else WinActivate, ahk_group Browsers
        sleep 300							; in case long list view
        PopUp("",0,0)
        sourcefile := last_media
        DetectMedia()							; restore media parameters
        }


    SpoolList(i)							; spool sorted media files into web page
        {
        source = img style="transform-origin:0 0;			; default media source tag
        if !DetectMedia()
            return
        FileGetSize, size, %inputfile%, K
        size := Round(size/1000)
        IfInString, selected, %sourcefile%				; underline any selected media
            select = border-bottom:dotted #ffbf99;
        if (inputfile == last_media || (song && InStr(inputfile, song))) ; highlight media
            highlight = color:LightSalmon;
        if (playlist && InStr(inputfile, playlist))			; highlight playlist
            highlight = color:#ffbf99;
        if (media == "audio")
            inputfile = %inca%\apps\icons\music.ico
        if (media == "playlist")
            inputfile = %inca%\apps\icons\playlist.png
        if (media == "document")
            inputfile = %inca%\apps\icons\ebook.ico
        IfExist, %spool_path%%media_name%.lnk 
            no_index = <span style="color:orange">- link - &nbsp;&nbsp;</span>
        if (media == "video")
            {								; use thumbnail from cache if exists
            FileRead, duration, %inca%\cache\durations\%media_name%.txt
            IfExist, %inca%\cache\thumbs\%media_name%.mp4
                inputfile = %inca%\cache\thumbs\%media_name%.mp4
            else if (ext != "gif" && (!duration || duration >= 30) && !InStr(sourcefile, "snips"))
                no_index = <span style="color:red">no index&nbsp;&nbsp;&nbsp;</span>
            if (duration || InStr(sourcefile, "snips"))
                source = video style="width:100`%; transform-origin:0 0;
            }
        IfNotExist, %inputfile%
            return
        page_media = %page_media%%i%/
        width := "60,36,24,18"
        width := StrSplit(width, ",")
        width := width[view]
        width1 := width * 2
        height := 200 + width * 6
        height1 := Round(width / 2)
        font := Setting("Font Color")
        SplitPath, sourcefile,,,,link_name
        Transform, inputfile, HTML, %inputfile%, 2			; make filenames web compatible
        Transform, link_name, HTML, %link_name%, 2
        StringReplace, inputfile, inputfile, \,/, All
        width_t := 1
        ratio := 1.009
        if (media == "image" && skinny < 0)
            ratio := 1.013
        Loop % Abs(skinny)
            width_t  *= ratio
        height_t := 1 - (width_t - 1)
        height2 := Round((1 - height_t) * 56)
        if (skinny < 0)
            transform = transform:scaleY(%width_t%);
        if (skinny > 0)
            transform = transform:scaleY(%height_t%);
        FileRead, caption, %inca%\cache\captions\%media_name%.txt
        if (view == 5)							; list view 
            {
            loop, 9
                IfExist, %inca%\favorites\snips\%media_name% - %A_Index%.mp4
                   snips = %snips% *
            if snips
                snips = <span style="color:orange;">%snips%</span>
            media_html = %media_html%<a href="#" id="item%i%" name="media%i%" onmousedown="select(event, id, name)"><li id="media%i%" src="file:///%inputfile%" style="float:left; width:100`%; margin:0;"><table><tr><td id="hover_image"><%source% %select%" src="file:///%inputfile%"></td></tr></table><table><tr><td style="color:#555351; width:4em; text-align:right; padding-right:1em;">%sort_filter%</td><td class="sorts">%ext%</td><td class="sorts">%size%</td><td style="%select% %highlight% overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align:left; padding-left:2em;">%link_name% %snips%</td></tr></table></li></a>`r`n`r`n
            }
        else 
            {
            Loop, 9								; add snip buttons
              IfExist, %inca%\favorites\snips\%media_name% - %A_Index%.mp4
                snips = %snips%<a href="#" id="snip%i%%A_Index%" name="media%i%" onmousedown="select(event, id, name)" onmouseenter="snip(event, name, '%A_Index%')" style="opacity:0.5; display:flex; justify-content:center; width:%width%px; height:%height1%px;"><div style="background:orange; width:0.2em; height:0.2em;"></div></a>
            media_html = %media_html%<li style="display:inline-block; vertical-align:top; width:%width%`%; height:%height%px; color:%font%; transition:color 1.4s;"><a href="#media%i%0" id="title%i%0" name="media%i%" onmouseenter="snip(event, name, '%html_spool_name%')" onmousedown="select(event, id, name)"><div style="margin-left:8`%; color:#555351; font-size:0.9em; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_filter% &nbsp;&nbsp;%no_index% %link_name%</div></a><a href="#" name="media%i%" id="vid%i%" onmousedown="select(event, id, name)" onmousemove="seek(event, id, name)" style="transform-origin:0 0;"><%source% %transform% %select%" id="media%i%" src="file:///%inputfile%" muted></a><div style="margin-left:8`%; color:#aaaaaa; font-size:1.4em; text-align:center;">%caption%</div></li><div style="display:inline-block; width:%width1%px; margin-top:20px; vertical-align:top;">%snips%</div>`r`n`r`n
            }
        skinny =
        }


    FilterList(input)
        {
        input := StrSplit(input, "/")					;  sort filter \ sourcefile \ media type \ ext
        sort_filter := input.1
        sourcefile := input.2
        media := input.3
        if (media == "image" && InStr(toggles, "- Image"))		; file still may not exist
            return
        if (media == "video" && InStr(toggles, "- Video"))
            return
        if search_term
            {
            SplitPath, sourcefile,,,,name
                IfNotInString, name, %search_term%
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
            year = 2017
            x := sort_filter
            year += x, seconds
            FormatTime, sort_filter, %year%, H:mm:ss			; show duration in hours:mins format
            if (x < 3600)
                FormatTime, sort_filter, %year%, mm:ss
            if (x < 600)
                FormatTime, sort_filter, %year%, m:ss
            }
        if (sort == "Size")
            {
            sort_filter := Round(sort_filter/1000,1)
            if (filter && sort_filter < filter)
                return
            }
        if (sort == "Alpha")
            {
            StringGetPos, pos, sourcefile, \, R, 1
            StringMid, 1st_char, sourcefile, % pos + 2, 1
            if (filter && sort == "Alpha" && 1st_char < filter)
                return
            }
        return 1
        }


    HighLightMenu(query,input)						; highlight selections in web page
        {
        if !query
            query := spool_path
        Loop, Parse, input, `|
            {
            x =
            if (input == sort_list)
                {
                query = %query%%toggles%
                x = id='%A_LoopField%#0' style='font-size:14px;'
                }
            array := StrSplit(A_LoopField, "\")				;  sort filter \ sourcefile \ media type
            pos := array.MaxIndex()
            name := array[pos]
            if !name
                name := array[pos-1]
            Transform, link, HTML, %A_LoopField%, 2			; make filenames web compatible
            StringLeft, name, name, 13
            if (StrLen(name) < 2)
                name = &nbsp;
            else Transform, name, HTML, %name%, 2
            IfInString, query, %name%
                 name = <span style="color:LightSalmon;">%name%</span>
            menu_html = %menu_html%<a href="#%link%" %x%><li>%name%</li></a>
            }
        menu_html = %menu_html%<li><br></li> 
        return
        }


    DecodeExt(ex)
        {
        StringLower ex, ex
        if (ex == "jpg" || ex == "png" || ex == "jpeg")
            return "image"
        if (ex == "mp4" || ex == "wmv" || ex == "avi" || ex == "mov" || ex == "webm" || ex == "mpg" || ex == "mpeg" ||ex == "flv" || ex == "divx" || ex == "mkv" || ex == "asf" || ex == "m4v" || ex == "mvb" || ex == "rmvb" || ex == "vob" || ex == "rm" || ex == "gif")
            return "video"
        if (ex == "mp3" || ex == "m4a" || ex == "wma")
            return "audio"
        if (ex == "pdf" || ex == "txt" || ex == "doc")
            return "document"
        if (ex == "m3u")
            return "playlist"
        }


    DetectMedia()
        {
        media =
        skinny =
        inputfile := sourcefile
        SplitPath, sourcefile,,,ext,linkname
        if (ext == "lnk")
            FileGetShortcut, %sourcefile%, inputfile
        FileRead, skinny, %inca%\cache\widths\%linkname%.txt
        SplitPath, inputfile,,media_path,ext,media_name
        stringlower, ext, ext
        media := DecodeExt(ext)
        IfExist, %inputfile%
            return media
        }


    PlayMedia()
        {
        slide =
        paused =
        caption_id := 0
        if !sourcefile
            sourcefile := last_media
        if !DetectMedia()
            return
        if (media == "document")
            {
            run, %inputfile%
            sleep 600
            if (ext == "pdf")
                WinActivate, ahk_group Browsers
            return
            }
        IfInString, tab_name, playlist
            {
            if (media == "playlist")
                {
                click =
                list_id := 1
                playlist := sourcefile
                spool_name = playlist
                spool_path = %inca%\playlist\
                this_search := spool_path
                NewPlaylist()
                }
            else Loop, Parse, list, `n, `r
                   if (StrSplit(A_LoopField, "/").3 == "playlist")		; skip over playlist entries
                      list_id -= 1
            FileReadLine, str, %inca%\cache\lists\songlist.m3u,%list_id%	; get first song
            sourcefile := StrSplit(str, "/").1
            DetectMedia()
            if (timer > 350 || media != "audio")				; play file in video player
                {
                slide := playlist
                NextMedia()
                }
            else PlaySong(list_id -1)
            CreateList(0)
            RenderPage()
            return
            }
        NextMedia()								; play next song
        }


    NextMedia()
        {
        pan := 100
        caption =
        last_id =
        end_time =
        last_media =
        Gui, Caption:+lastfound 
        GuiControl, Caption:, GuiCap
        FileReadLine, str, %inca%\cache\html\%tab_name%.htm, 3			; list of media id's in page
        Loop, Parse, str, `/
            if (A_LoopField == list_id)						; current media id found in list
                page_ptr := A_Index + 1						; next media 
        if (timer > 350)
            seek := 0
        if (timer > 350 && click == "Back")
            {
            page_ptr -= 2							; previous media
            caption_id -= 2
            }
        array := StrSplit(str, "/")						; convert page media id's string to array
        if video_player
            {
            list_id := array[page_ptr]
            Loop, Parse, list, `n, `r
                if (A_Index == list_id)
                    sourcefile := StrSplit(A_LoopField, "/").2
            }
        if slide
            {
            paused := 1
            caption_id += 1
            SplitPath, playlist,,,,name
            FileReadline, caption, %inca%\cache\captions\%name%.txt, %caption_id%
            FileReadLine, str, %playlist%, %list_id%
            sourcefile := StrSplit(str, "|").1
            seek := StrSplit(str, "|").2
            end_time := StrSplit(str, "|").3
            }
        if !DetectMedia()
            {
            TaskSwitcher()
            return
            }
        video_sound := 0
        mute = --mute=yes
        video_speed := Setting("Default Speed") - 100				; display format
        FileRead, duration, %inca%\cache\durations\%media_name%.txt
        if !slide
            FileRead, caption, %inca%\cache\captions\%media_name%.txt
        speed := Round((video_speed + 100)/100,1)				; mpv format
        speed = --speed=%speed%
        seek_t := 100 * seek / duration
        if seek_t
            seek_t = --start=%seek_t%`%
        if (magnify < 0)
            magnify := 0
        zoom := magnify
        if (ext == "gif")
            zoom += 1
        if paused
            pause = --pause
        properties = --video-zoom=-%zoom% %mute% %pause% %loop% %speed% %seek_t% 
        if (media == "image")
            properties = --video-zoom=-%zoom%
        if !(DetectMedia() && list_id != last_id)
            return
        history_timer := 1
        last_media := sourcefile 
        WinGet, running, List, ahk_class mpv
        WinSet, Transparent, 0, ahk_class Shell_TrayWnd
        if (media == "video")							; create seekbar thumbnails
            {
            xt := media_name
            IfInString, inputfile, \favorites\snips
                xt := SubStr(xt, 1, -4)
            xt = %inca%\cache\thumbs\%xt%.mp4
            Run %inca%\apps\ffmpeg.exe -skip_frame nokey -i "%xt%" -vsync 0 -qscale:v 1 "%inca%\cache\`%d.jpg",, Hide
            }
        Run %inca%\apps\mpv %properties% --idle --input-ipc-server=\\.\pipe\mpv%list_id% "%inputfile%"
        loop 100
            {
            sleep 25
            WinGet, array, List, ahk_class mpv
            loop %array%
                if (array%A_Index% != running1 && array%A_Index% != running2 && array%A_Index% != running3)
                    {
                    player := array%A_Index%
                    break 2
                    }
            }
        WinSet, Transparent, 0, ahk_ID %player%
        if (aspect := Round(skinny / 100,2))
            {
            sleep 100
            RunWait %COMSPEC% /c echo add aspect %aspect% > \\.\pipe\mpv%list_id%,, hide && exit
            }
        loop 15
            {
            sleep 10
            WinSet, Transparent, % A_Index * 17, ahk_ID %player%		; player fade up
            }
        WinSet, TransColor, 0 0
        GuiControl, Caption:, GuiCap, % caption
        y := A_ScreenHeight * 0.82
        Gui, Caption:Show, y%y%, NA
        if caption
          loop 20
            {
            sleep 10
            mask := A_Index * 6 
            WinSet, TransColor, 0 %mask%
            }
        WinSet, Transparent, 0, ahk_group Browsers
        WinClose, ahk_ID %video_player%
        WinSet, Transparent, 255, ahk_class Shell_TrayWnd
        video_player := player
        if (media == "audio")							; playing audio in video player
            FlipSound(999)
        if (click == "MButton" && !seek)
            ThumbSheet()
        last_id := list_id
        seek =
        sleep 50								; for mpv to close
        }


    PlaySong(pos)
        {
        SoundSet, 1
        volume := 1
        if !vol_ref
            vol_ref := 1
        if (vol_ref > Setting("Default Volume"))
            vol_ref := Setting("Default Volume")
        if music_player
            RunWait %COMSPEC% /c echo playlist-next > \\.\pipe\mpv_music,, hide && exit
        GetSeekTime(music_player)
        if (!music_player || pos != song_id - 1)
            {
            music_speed := 0
            video_sound := 0
            WinClose, ahk_ID %music_player%
            Run %inca%\apps\mpv --fullscreen=no --cursor-autohide=no --osc=yes --playlist-pos=%pos% --keep-open=always --input-ipc-server=\\.\pipe\mpv_music "%inca%\cache\lists\songlist.m3u"
            loop 20
                {
                sleep 100
                WinGet, music_player, ID, ahk_class mpv
                if music_player
                    break
                }
            WinMinimize, ahk_ID %music_player%
            }
        GetSeekTime(music_player)
        SetTimer, VolUp
        if (WinActive("ahk_group Browsers") && tab == 2 && InStr(tab_name, "playlist"))
            RenderPage()
        }


    NewPlaylist()
        {
        IniWrite,%playlist%,%inca%\settings.ini,Settings,playlist
        FileDelete, %inca%\playlist\*.lnk
        FileRead, str, %playlist%
        songlist =
        index := 100
        Loop, Parse, str, `n, `r
            {
            item := StrSplit(A_LoopField, "|").1
            seek_t := StrSplit(A_LoopField, "|").2
            IfExist, %item%
                {
                if (index == 100)
                    song := item
                index += 1
                SplitPath, item,,,,filen 
                FileCreateShortcut, %item%, %inca%\playlist\%index% %filen%.lnk
                songlist = %songlist%%item%`r`n
                }
            }
        if (sort == "Shuffle")
            Sort, songlist, Random Z
        FileDelete, %inca%\cache\lists\songlist.m3u
        FileAppend, %songlist%, %inca%\cache\lists\songlist.m3u, UTF-8
        }


    ThumbSeekTime()
        {
        paused =
        thumb_number =
        ControlSend,, 1, ahk_ID %video_player%
        MouseGetPos, xm,ym
        Gui, thumbsheet:+lastfound
        ControlGetPos,,, thumb_width, thumb_height
        xm -= (A_ScreenWidth - (6 * thumb_width)) /2
        ym -= (A_ScreenHeight - (6 * thumb_height)) /2 
        col := ceil((xm / (thumb_width))   )
        row := floor(ym / (thumb_height))
        thumb_number := 5 * (row * 6 + col)
        CalcSeekTime(thumb_number / 200)
        }


    ThumbSheet()
        {
        if (slide || media != "video" || ext == "gif" || duration < 30)
            return
        if thumb_sheet
            {
            paused =
            thumb_sheet =
            ControlSend,, 1, ahk_ID %video_player%
            loop 10
                {
                sleep 16
                Gui, thumbsheet:+lastfound
                mask := 280 - (A_Index * 28)
                WinSet, Transparent, % mask
                }
            Gui, thumbsheet: Destroy
            }
        else
            {
            paused = 1
            thumb_sheet := 1
            Gui, thumbsheet: Destroy
            ControlSend,, 2, ahk_ID %video_player%				; pause video
            Gui, thumbsheet: +lastfound -Caption +ToolWindow +AlwaysOnTop
            Gui, thumbsheet: Margin, 0, 0
            Gui, thumbsheet: Color,black
            zoom := 0.5
            if (magnify < 1)
                zoom := magnify * 0.5
            W := Floor((1 - zoom) * A_ScreenWidth / 7.5)
            H := Floor((1 - zoom) * A_ScreenHeight / 7.5) 
            IfNotExist, %inca%\cache\180.jpg
                sleep 200
            Loop 36
                {
                X := Mod((A_Index-1) * W, 6 * W), Y := (A_Index-1) // 6 * H
                Z := A_Index * 5
                Gui, thumbsheet: Add, Picture, x%X% y%Y% w%W% h%H%, %inca%\cache\%Z%.jpg
                }
            Gui, thumbsheet: Show
            WinSet, Transparent, 255
            }
        }


    ThumbsBar()
        {
        thumb := 1
        MouseGetPos, xm, ym
        div := A_ScreenWidth / 4
        if (xm > div)
            thumb := Round(100 * (xm - div) /div)
        if (xm > div * 3)
            thumb := 200
        ys := A_ScreenHeight * 0.85
        xs := div + ((thumb * div * 2) / 200) - thumb
        GuiControl,pic:, GuiPic, *w280 *h160 %inca%\cache\%thumb%.jpg
        Gui, pic:show, x%xs% y%ys% w280 h160
        offset := 0
        if (duration > 60)
            offset := 18.5
        seek := Round(thumb * (duration - offset) / 200,1) + offset
        }


    FlipSound(change)						; between music & video player
        {
        SoundSet, 0
        song_timer =
        if (change > 0 && (video_player || timer > 800))	; always flip source if long press
            video_sound ^= 1
        if (change > 0 && music_player && !video_sound)
            {
            ControlSend,, 1, ahk_ID %music_player%		; un pause music
            ControlSend,, 3, ahk_ID %music_player%		; un mute music
            ControlSend,, 4, ahk_ID %video_player%		; mute video
        GetSeekTime(music_player)
            }
        else
            {
            video_speed := 0
            ControlSend,, 2, ahk_ID %music_player%		; pause music
            ControlSend,, 4, ahk_ID %music_player%		; mute music
            ControlSend,, 1, ahk_ID %video_player%		; un pause video
            ControlSend,, 3, ahk_ID %video_player%		; un mute video
            ControlSend,, {BS}, ahk_ID %video_player%		; reset video speed
            }
        if ((video_player || music_player) && change == 999)	; fade volume up a little
            {
            volume := 0
            vol_ref := 2
            SetTimer, VolUp
            }
        }


    VolUp:
       if (volume >= vol_ref || (volume > 5 && GetKeyState("RButton", "P")))
           return
       SoundSet, (volume += 0.25)
       SetTimer, VolUp, -30
       vol_popup := 3
       ShowStatus()
       return


    SetVolume(change)
        {
        if !volume
            FlipSound(change)
        if volume < 1
            change /= 2
        if volume < 10
            change /= 2						; finer adj at low volume
        if change < 100						; stop any big volume jumps
            volume += change/15
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


    SetSpeed(direction)						; adjust video or music speed / pitch
        {
        click = speed
        key = 8							; reset pitch
        speed := 0
        if music_player
            player := music_player
        if video_player
            player := video_player
        if player
            {
            if !direction
                ControlSend,, {BS}, ahk_ID %player%		; reset speed
            else key = b					; slower
            if (direction > 0)
                key = a						; faster
            if (timer < 800 && direction < 0)			; shift pitch
                key = 7
            ControlSend,, %key%, ahk_ID %player%
            if video_player
                {
                if (direction > 0)
                    speed := video_speed -= 5
                if (direction < 0)
                    speed := video_speed += 5
                video_speed := speed
                speed := Round(speed / 5)
                }
            else if music_player
                {
                if (direction > 0)
                    speed := music_speed -= 1
                if (direction < 0)
                    speed := music_speed += 1
                music_speed := speed
                }
            if (key == "7")
                PopUp("pitch",600,0)
            else if (!direction && video_player)
                PopUp("Speed",0,0)
            else if !speed
                PopUp("Reset",600,0)
            else PopUp(speed,0,0)
            }
        sleep 24
        }
    

    SetAspect(x, y)
        {
        direction := x + y
        WinGet, state, MinMax, ahk_group Browsers
        if (!Setting("Width Gesture") || Abs(x) < Abs(y))
            {
            if thumb_sheet
                click = magnify					; triggers action after gesture
            thumb_sheet := 0
            if (direction > 0)
                ControlSend,, 0, ahk_ID %video_player%		; magnify
            else ControlSend,, 9, ahk_ID %video_player%
            if (direction < 0)
                magnify += 0.04
            else magnify -= 0.04
            }
        else
            {
            skinny -= 1
            if (direction > 0)
                ControlSend,, 5, ahk_ID %video_player%
            else
                {
                ControlSend,, 6, ahk_ID %video_player%
                skinny += 2
                }
            if !skinny
                PopUp("Reset",500,0)
            FileDelete, %inca%\cache\widths\%media_name%.txt
            if (Abs(skinny) > 3)
                {
                FileAppend, %skinny%, %inca%\cache\widths\%media_name%.txt
                click = update width
                }
            }
        sleep 10
        }


    BrowserMagnify(direction)
        {
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1 && xm < 100)
            {
            WinActivate, ahk_group Browsers
            if (direction < -3)
                send, ^0
            else  if (direction > 3)
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
        gui, settings:add, text, x180 y10, main Folders
        gui, settings:add, edit, x180 yp+13 h70 w500 vfolder_list, %folder_list%
        gui, settings:add, text, x180 yp+76, more folders and search terms
        gui, settings:add, edit, x180 yp+13 h146 w500 vsearch_list, %search_list%
        gui, settings:add, text, x180 yp+154, folders to search
        gui, settings:add, edit, x180 yp+13 h18 w500 vsearch_folders, %search_folders%
        gui, settings:add, text, x180 yp+26, folders to index
        gui, settings:add, edit, x180 yp+13 h32 w500 vindexed_folders, %indexed_folders%
        gui, settings:add, text, x180 yp+39, context menu
        gui, settings:add, edit, x180 yp+13 h32 w500 vcontext_menu, %context_menu%
        gui, settings:add, button, x20 y425 w60, Source
        gui, settings:add, button, x90 y425 w60, Compile
        gui, settings:add, button, x270 y425 w80, Purge Cache
        gui, settings:add, button, x360 y425 w70, Help
        gui, settings:add, button, x440 y425 w70, Cancel
        gui, settings:add, button, x520 y425 w70 default, Save
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
        run, %inca%\help.txt
        return

        settingsButtonPurgeCache:
        WinClose
        CheckLinks()
        RemoveOrphans()
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
            IfInString, x, %key%
                return StrSplit(A_LoopField, "/").2
            }
        }


    SaveImage()						; save image under cursor to pictures folder
        {
        EnvGet, profile, UserProfile
        send, {RButton}
        send, {Left}
        loop 8 
            {
            random, r, 97, 122
            name .= Chr(r)
            }
        loop 10
            {
            send v
            sleep 50
            IfWinActive, ahk_class #32770
                {
                send, ^a
                send, %profile%\pictures\%name%
                loop, 8
                    {
                    send {Enter}
                    sleep 100
                    IfWinNotActive, ahk_class #32770
                        break 2
                    }
                }
            }
        MouseGetPos, xm1,ym1
        MouseMove, % xm1 + 1, % ym1 + 1, 0		; to reset cursor
        }


    AddFavorites()
        {
        if !seek
            seek := seek_time
        popup = + favorite
        FileCreateShortcut, %inputfile%, %inca%\favorites\%media_name%.lnk	; inc. images
        if (media == "video" && duration > 30 && !InStr(sourcefile, "\favorites"))
              Loop 10
                IfNotExist, %inca%\favorites\snips\%media_name% - %A_Index%.mp4     
                    {
                    popup = Snip %A_Index%
                    if (A_Index < 10)
                        {
                        run, %inca%\apps\ffmpeg.exe -ss %seek% -t 10 -i "%inputfile%" -c:v libx264 -x264opts keyint=3 -vf scale=1280:-2 -y "%inca%\favorites\snips\%media_name% - %A_Index%.mp4",,Hide
                            if skinny
                        FileAppend, %skinny%, %inca%\cache\widths\%media_name% - %A_Index%.txt, UTF-8
                        }
                    else popup = full
                    click = update webpage
                    break
                    }
        PopUp(popup,600,video_player)
        return 1
        }


    RemoveOrphans()
        {
        folders := indexed_folders
        Loop, Parse, folder_list, `|
            IfNotInString, folders, %A_LoopField%				; combine lists
               folders = %folders%|%A_LoopField%
        Loop, Parse, folders, `|						; remove self folder if exist
            IfInString, A_LoopField, thumbs
                StringReplace, folders, folders, |%A_LoopField%
        Loop, Files, %inca%\cache\thumbs\*.mp4, F				; remove orphan thumbnails
            if !Found(folders)
                FileRecycle, %inca%\cache\thumbs\%A_LoopFileName%
        Loop, Files, %inca%\cache\durations\*.txt, F				; remove orphan durations
            if !Found(folders)
                FileRecycle, %inca%\cache\durations\%A_LoopFileName%
        GuiControl, Indexer:, GuiInd 
        }


    Found(folders)
        {
        GuiControl, Indexer:, GuiInd, %A_LoopFileFullPath% 			; show file on screen 
        SplitPath, A_LoopFileFullPath,,,,filen
        Loop, Parse, folders, `|
            {
            IfExist, %A_LoopField%%filen%.*
                return 1
            Loop, %A_LoopField%*.*, 2, 1					; recurse search into subfolders
                IfExist, %A_LoopFileFullPath%\%filen%.*
                    return 1
            }
        }


    CheckLinks()
       {
       Loop, Files, %inca%\history\*.lnk, FR
           if !Check()
               FileRecycle, %A_LoopFileFullPath%
       Loop, Files, %inca%\favorites\*.lnk, FR
           if !Check()
               FileRecycle, %A_LoopFileFullPath%
       GuiControl, Indexer:, GuiInd 
       }


    Check()
        {
        GuiControl, Indexer:, GuiInd, %A_LoopFileDir%
        FileGetShortcut, %A_LoopFileFullPath%, link_file
        IfExist, %link_file%
            return 1
        SplitPath, link_file,,,ex,filen
        Loop, Parse, indexed_folders, `|
            IfExist, %A_LoopField%\%filen%.*
                {
                FileCreateShortcut, %A_LoopField%\%filen%.%ex%, %inca%\cache\temp.lnk
                runwait, %COMSPEC% /c %inca%\apps\touch.exe -r "%A_LoopFileFullPath%" "%inca%\cache\temp.lnk",,hide
                FileMove, %inca%\cache\temp.lnk, %A_LoopFileFullPath%, 1
                return 1
                }
        }


    indexer:								; update thumb cache for videos
       FormatTime, time1,, yy MM MMM
       Loop, Files, %inca%\favorites\*.lnk, F				; put favorites into date folders
           {
           FileGetTime, time2, %A_LoopFileFullPath%
           FormatTime, time2, %time2%, yy MM MMM
           if (time1 == time2)
               continue
           IfExist, %inca%\favorites\f-%time2%
               FileMove, %A_LoopFileFullPath%, %inca%\favorites\f-%time2%
           else
               {
               FileCreateDir, %inca%\favorites\f-%time2%
               FileMove, %A_LoopFileFullPath%, %inca%\favorites\f-%time2%
               }
           }
       Loop, Files, %inca%\history\*.lnk, F				; put history into date folders
           {
           FileGetTime, time2, %A_LoopFileFullPath%
           FormatTime, time2, %time2%, yy MM MMM
           if (time1 == time2)
               continue
           IfExist, %inca%\history\h-%time2%
               FileMove, %A_LoopFileFullPath%, %inca%\history\h-%time2%
           else
               {
               FileCreateDir, %inca%\history\h-%time2%
               FileMove, %A_LoopFileFullPath%, %inca%\history\h-%time2%
               }
           }
      if indexed_folders
        Loop, Parse, indexed_folders, `|
          Loop, Files, %A_LoopField%*.*, R
            {
            source = %A_LoopFileFullPath%
            SplitPath, source,,fol,ex,filen
            StringGetPos, pos, fol, \, R
            StringTrimLeft, j_folder, fol, % pos + 1
            StringLower ex, ex
            IfInString, fol, Thumbs
              continue
            if (DecodeExt(ex) == "video" && ex != "gif")
              {
              dur =
              FileRead, dur, %inca%\cache\durations\%filen%.txt
              if !dur
                {
                x = %fol%\%Filen%.%ex%.part
                IfExist, %x%						; file still downloading
                    continue
                filedelete, %inca%\cache\durations\%filen%.txt
                Critical
                clip := clipboard
                clipboard =
                RunWait %COMSPEC% /c %inca%\apps\ffmpeg.exe -i "%source%" 2>&1 | find "Duration" | Clip, , hide && exit
                ClipWait, 3
                StringTrimLeft, aTime, clipboard, 12
                StringLeft, aTime, aTime, 8
                aTime := StrSplit(aTime, ":")
                dur := aTime.1 * 3600 + aTime.2 * 60 + aTime.3
                clipboard := clip
                Critical Off
                if !dur
                    continue
                FileAppend, %dur%, %inca%\cache\durations\%filen%.txt
                }
              IfNotExist, %inca%\cache\thumbs\%filen%.mp4
                {
                if (dur < 20 && (ex == "mp4" || ex == "webm"))		; browser can preview instead
                    continue
                GuiControl, Indexer:, GuiInd, indexing - %j_folder%  ;    %filen%
                FileCreateDir, %inca%\temp
                t := 0
                if (dur > 60)
                  {
                  t := 20	      					; skip any video intro banners
                  dur -= 20
                  }
                loop 200						; 200 video frames in thumb preview
                  {
                  runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:-2 -vframes 1 "%inca%\temp\%A_Index%.jpg",, Hide
                  t += (dur / 200)
                  }
                runwait, %inca%\apps\ffmpeg.exe -i "%inca%\temp\`%d.jpg" -c:v libx264 -x264opts keyint=1:scenecut=-1 -y "%inca%\cache\thumbs\%filen%.mp4",, Hide
                filen2 := StrReplace(filen, "#" , ".")			; html cannot have # in file name 
                IfInString, filen, #
                    FileCopy, %inca%\cache\thumbs\%filen%.mp4, %inca%\cache\thumbs\%filen2%.mp4, 1
                }
              }
            }
        FileRemoveDir, %inca%\temp, 1
        time := Setting("Indexer") * 60000
        SetTimer, Indexer, -%time%
        GuiControl, Indexer:, GuiInd
        return



    ShowStatus()
        {
        FormatTime, time,, h : mm
        vol := Round(volume)
        if (volume < 0.95)
            vol := Round(volume,1)
        if (volume <= 0)
            vol =
        IfWinExist, ahk_ID %music_player%
            speed := music_speed
        if (video_player && media != "image")
            speed := Floor(video_speed)
        if !speed
            speed =
        width := skinny
        if (!skinny || !video_player)
            width =
        if (width > 0)
            sign = +
        if Setting("Status Bar")
            status = %sign%%width%    %speed%    %vol%    %time%
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
        time := Ceil(time / 10)
        Gui PopUp:Destroy
        Gui PopUp:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui PopUp:Color, Black
        Gui PopUp:Font, s20 cRed, Segoe UI
        Gui PopUp:Add, Text,, %message%
        if video_player
            Gui PopUp:Show, NA
        else Gui PopUp:Show, x%xp% y%yp% NA
        WinSet, TransColor, 0 255
        loop %time%
            {
            sleep 10
            mask := 55 + (A_Index * 200/ time)
            if (time > 5 && dim)
                WinSet, transparent, %mask%, A
            mask2 := 255 - mask
            WinSet, TransColor, 0 %mask2%
            }
        }



    LoadSettings()
        {
        Global
        inca := A_ScriptDir
        EnvGet, profile, UserProfile
        FileRead, songlist, %inca%\cache\lists\songlist.m3u
        IniRead,playlist,%inca%\settings.ini,Settings,playlist
        IniRead,features,%inca%\settings.ini,Settings,features
        IniRead,indexed_folders,%inca%\settings.ini,Settings,indexed_folders
        IniRead,search_folders,%inca%\settings.ini,Settings,search_folders
        IniRead,folder_list,%inca%\settings.ini,Settings,folder_list
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
        Loop, Files, %inca%\playlist\*.m3u, R
            {
            StringTrimRight, entry, A_LoopFileName, 4
            Menu, playlist, Add, %entry%, ContextMenu
            IfInString, entry, playlist
                StringRight, last_pl, entry, 1
            }
        last_pl += 1
        Menu, playlist, Add, - playlist %last_pl%, ContextMenu
        Menu, ContextMenu, Add, Folders, :Folders
        Menu, ContextMenu, Add, playlist, :playlist
        Menu, ContextMenu, Add, Delete, ContextMenu
        Menu, ContextMenu, Add, Rename, ContextMenu
        Menu, ContextMenu, Add, Edit, ContextMenu
        Menu, ContextMenu, Add, Cap, ContextMenu
        Menu, ContextMenu, Add, All, ContextMenu
        }


    Initialize()
        {
        Global
        LoadSettings()
        CoordMode, Mouse, Screen
        gui, vol: +lastfound -Caption +ToolWindow +AlwaysOnTop -DPIScale
        gui, vol: color, db9062
        Gui, pic:+lastfound -Caption +ToolWindow +AlwaysOnTop -DPIScale 
        Gui, pic:Color,black
        Gui, pic:Margin, 0, 0
        Gui, pic:Add, Picture, vGuiPic
        Gui, background:+lastfound -Caption +ToolWindow -DPIScale
        Gui, background:Color,Black
        Gui, background:Show, x0 y0 w%A_ScreenWidth% h%A_ScreenHeight% NA
        WinSet, Transparent, 0
        WinSet, ExStyle, +0x20
        Gui, Caption:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui, Caption:Color, Black
        ix := A_ScreenWidth * 0.4
        Gui, Caption:Add, Text, vGuiCap w%ix% h%ix% +Wrap
        Gui, Caption:Font, s18 cWhite, Segoe UI
        GuiControl, Caption:Font, GuiCap
        Gui Status:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui Status:Color, Black
        ix := A_ScreenWidth * 0.25
        Gui Status:Add, Text, vGuiSta w%ix% h35 Right
        Gui Status: Show, Hide
        SysGet, Mon, Monitor
        WinGetPos,ix,iy,w,h
        ix := (InStr(b,"l") ? (MonRight-w)/2 : "r" ? MonRight - w : ix) * Setting("Status Bar")/100
        iy := InStr(d,"u") ? (MonBottom-h)/2 : "d" ? MonBottom - h : iy
        WinMove,,,ix,iy
        Gui, Indexer:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui, Indexer:Color, Black
        Gui, Indexer:Add, Text, vGuiInd h50 w1200
        Gui, Indexer:Font, s11 c705a4c, Segoe UI
        GuiControl, Indexer:Font, GuiInd
        ix := A_screenWidth * 0.6 
        iy := A_ScreenHeight * 0.96
        Gui, Indexer:Show, x%ix% y%iy%, NA
        WinSet, TransColor, ffffff 0
        WinSet, TransColor, 0 140
        WinSet, ExStyle, +0x20
        SoundGet, volume
        if Setting("Indexer")
            SetTimer, indexer, -1500, -2				; low thread priority
        WinGet, music_player, ID, ahk_class mpv
        sourcefile = %profile%\Pictures\
        click = MButton
        WinActivate, ahk_group Browsers
        WinGetTitle title, A
        IfNotInString, title, Inca -
            ClickWebPage()						; open browser tab
        }


    TaskSwitcher()							; flip between desktop and browser
        {
        Critical
        Gui, Caption: hide
        Gui, settings: Cancel
        if (video_player || thumb_sheet)
            {
            thumb_sheet =
            Gui, pic: Cancel
            FileDelete, %inca%\cache\*.jpg
            GetSeekTime(video_player)
            if (history_timer > Setting("History Timer") * 10 && !InStr(spool_path, "\history"))
                FileCreateShortcut, %inputfile%, %inca%\history\%media_name%.lnk
            WinActivate, ahk_group Browsers
            MouseGetPos, xm1,ym1
            MouseMove, % xm1 + 1, % ym1 + 1, 0				; to reset cursor
            loop 50
                {
                ControlSend,, l, ahk_ID %video_player%			; zoom player in
                mask := 256 - (A_Index * 6)
                Gui, thumbsheet:+lastfound
                WinSet, Transparent, % mask
                WinSet, Transparent, % mask + 70, ahk_ID %video_player%
                WinSet, Transparent, % A_Index * 6, ahk_group Browsers
                if (video_sound && volume > 1)
                    SoundSet, volume -= 0.5
                if (A_Index == 40)
                    WInClose, ahk_ID %video_player%			; time for Win ID to release
                sleep 20
                }
            Gui, thumbsheet: Cancel
            skinny =
            paused =
            history_timer =
            if video_sound
                FlipSound(999)
            video_player =
            video_sound := 0
            return
            }
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1)
            WinMinimize, ahk_group Browsers
        else WinRestore, ahk_group Browsers
        WinSet, Transparent, off, ahk_group Browsers
        last_status =
        }
