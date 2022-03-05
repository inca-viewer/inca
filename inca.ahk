

	;	Inca Media Viewer for Windows. Firefox & Chrome compatible

	;	Why Exist - to beautify, unify and manage media
	;	without the ugliness of windows & media players

	;	AHK Script Operation:
	;	it creates active web pages of local media and music playlists
	;	media searches and selections are spooled into these active web pages
	;	mouse ClickEvent() & Gestures() are used to control volume, magnify, pan, seek etc.
	;	0.1 second background timer updates media status bar and controls
	;	videos are indexed to a small 200 keyframe .mp4 file for fast thumbsnail creation
	;	web page control is through reading & writing to the browser location bar
	;	DeBug tools - soundbeep, 3000,111   tooltip --- %%



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

        Global sort_list		:= "Shuffle|Date|Duration|Alpha|Size|ext|Reverse|Recurse|Snips|Videos|Images|"
        Global toggle_list		:= "ReverseRecurseSnipsVideosImages"
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
        Global sourcefile		; current file incl. path
        Global media_name		; media filename no path or ext
        Global media_path		; media folder path
	Global subfolders
        Global spool_name		; spool folder name only
        Global spool_path		; input source folder
        Global tab_name			; browser tab title
	Global previous_tab
        Global ext			; file extension
        Global last_ext
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
        Global sort_filter		; sorted value
        Global tab			; media webpage exists = 1, is active = 2
        Global click			; click key or process
        Global timer			; click / back timer
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
        Global last_thumb
	Global last_status		; time, vol etc display
        Global caption			; media subtitle
	Global list_id			; media list pointer
	Global song_id
        Global menu_item		; context menu
        Global properties		; media properties
        Global playlist			; current slide or music playlist
	Global song_timer		; time remaining
        Global song			; current song inc. path
	Global page_media		; list of media id's in .htm page header
	Global magnify := 0.7		; magnify video
        Global seek			; goto seek time
	Global idle			; mpv player idle
	Global slide			; slide media open
	Global slide_id
	Global refresh			; refresh web page
	Global block_input		; stop key interrupts during processing
	Global xpos			; current mouse position - 100mS updated 
	Global ypos
	Global xclick			; mouse position on click
	Global yclick
	Global pan			; image panning mode
	Global active			; thumbsheet or seeking mode
	Global seeking			; thumbnail seeking mode





    main:
      initialize()				; set environment
      SetTimer, TimedEvents, 100, -1		; every 100mS
      return					; wait for hotkeys


    ~LButton::					; click events
    RButton::
    MButton::
      block_input := A_TickCount + 300
      click =
      if (!Gestures() && click)
          ClickEvent()
      if refresh
          RenderPage()
      PopUp("",0,0)
      timer =
      return


    Xbutton1::					; mouse "back" button
      block_input := A_TickCount + 300
      timer = set
      click = Back
      SetTimer, Xbutton_Timer, -300
      return
    Esc up::
      ClosePlayer()
    Xbutton1 up::
      timer =
    Xbutton_Timer:
      ClickEvent()
      click =
      return


    ~WheelUp::
    ~WheelDown::
      if (A_TickCount < block_input)
          return
      wheel := 1
      if (A_ThisHotkey == "~WheelDown")
          wheel := 0
      if Setting("Reverse Wheel")
          wheel ^= 1
      click = wheel
      return


    ~Enter::					; file search - from html input box
      if inside_browser
        {
        send, !0
        Clipboard =
        send, {end}+{Home}^c
        ClipWait, 0
        if (search_box := Clipboard)
            ClickWebPage()
        refresh = 1
        }
      return


    #\::								; mouse 1 option button win\
      timer3 = set
      SetTimer, button1_Timer, -240
      return
    #\ up::
      timer3 =
      return
    button1_Timer:
      title =
      WinGetTitle, title, YouTube
      if !timer3							; toggle browser / desktop
        {
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1)
            WinMinimize, ahk_group Browsers
        else WinRestore, ahk_group Browsers
        IfWinNotExist, ahk_group Browsers
            run, %inca%\cache\html\pictures.htm
        MouseMove, % A_ScreenWidth / 2, 0
        MouseMove, % xpos, % ypos, 0					; to reset cursor (windows bug)
        WinSet, Transparent, off, ahk_group Browsers
        last_status =
        }
      else
        {
        if !title
          send, {f11}							; fullscreen
        send, f
        }
      return


    #/::								; mouse 2 option button win/
      timer = set
      IfWinActive, ahk_group Browsers
          SetTimer, button2_Timer, -240
      return
    #/ up::
      timer =
      return
    button2_Timer:
      if !timer								; pause toggle YouTube
          send, {Space}
        else loop 10
          {
          if !timer
              break
          WinActivate, ahk_group Browsers
          send, {Left}{Left}						; rewind YouTube 10 secs
          sleep 624
          }
      return





    Gestures()
      {
      MouseGetPos, xpos, ypos
      StringReplace, click, A_ThisHotkey, ~,, All
      if video_player							; allow gestures over mpv player
          send, {Click up}
      IfWinNotActive, ahk_group Browsers
          inside_browser =
      start := A_TickCount
      loop								; gesture detection
        {
        MouseGetPos, x, y
        x -= xpos
        y -= ypos
        xy := Abs(x + y)
        timer := A_TickCount - start
        if (!GetKeyState("LButton", "P") && !GetKeyState("RButton", "P"))
            break
        if (xy > 8 || (click == "RButton" && (xpos < 15 || xpos > A_ScreenWidth - 15)))
            {
            MouseGetPos, xpos, ypos
            gesture = 1
            Gui, ProgressBar:Cancel
            if (video_player || click == "RButton")
                {
                if (xpos < 15)						; edge of screen
                    xpos := 15
                if (ypos < 15)
                    ypos := 15
                if (xpos > A_ScreenWidth - 15)
                    xpos := A_ScreenWidth - 15
                if (ypos > A_ScreenHeight - 15)
                    ypos := A_ScreenHeight - 15
                MouseMove, % xpos, % ypos, 0
                }
            if (GetKeyState("RButton", "P") && Setting("Volume Gesture"))
                SetVolume(2 * x)
            if GetKeyState("LButton", "P")
                if (click == "speed")
                    SetSpeed(y)
                else if video_player
                    SetAspect(x, y)
                else if !inside_browser
                    BrowserMagnify(y)
            }
         if (!gesture && timer > 350)
             {
             if (video_player && media == "video" && click == "LButton")
                 SetSpeed(0)
             else if (click != "speed")
                 return 0
             }
         }
      return gesture
      }


    ClickEvent()
        {
        Critical
        MouseGetPos, xclick, yclick
        if (click == "MButton")
            {
            if (music_player && xpos < 100)
                PlaySong(1)
            else if video_player
                {
                if InStr(media_path, "\favorites\- snips")
                    {
                    click =
                    Playmedia(1)
                    }
                else if (media == "video" && active != 2)        
                    {
                    active = 2
                    Gui, thumbsheet: Show
                    block_input := A_TickCount + 1200
                    }
                else Playmedia(1)
                }
            else if (tab != 2 || !inside_browser) 
                send, {MButton}
            else if (tab == 2 && inside_browser && !ClickWebPage())
                PlayMedia(0)						; replay last_media
            }
        else if (click == "RButton")
            {
            if (timer > 350 && tab == 2 && (video_player || GetPageLink()))
                AddFavorites()
            else if (timer > 350 && tab != 2 && A_Cursor == "Unknown")
                SaveImage()
            else if (inside_browser && GetPageLink())
                {
                last_media =
                if !InStr(selected, sourcefile)
                    selected = %selected%%sourcefile%`r`n
                else StringReplace, selected, selected, %sourcefile%`r`n
                send, {RButton}{Esc}
                }
            else if (inside_browser || video_player)
                {
                seek := seek_time
                Menu, ContextMenu, Show
                }
            else send, {RButton}
            }
        else if (click == "LButton")
          {
          if (timer > 350 && A_Cursor == "IBeam")
              SearchText()
          else if (timer > 350 && inside_browser && !video_player && A_Cursor != "IBeam")
              ClickWebPage()
          else if (video_player && media != "image")
              {
              GetSeekTime(video_player)
              if (active == 2)						; 6x6 thumbsheet mode
                  ThumbSeekTime()					; convert click to seek time
              if (!seek && seek_time > duration - 1)			; video finished playing
                  seek := 0.1						; return to start
              if seek
                  {
                  active =
                  paused =
                  RunWait %COMSPEC% /c echo seek %seek% absolute > \\.\pipe\mpv%list_id%,, hide && exit
                  sleep 100						; time for video to start
                  }
              if (!seek && timer < 350)					; in case gestures
                  {
                  if paused
                      paused =
                  else paused = 1
                  }
              if paused
                  ControlSend,, 2, ahk_ID %video_player%
              else ControlSend,, 1, ahk_ID %video_player%
              Gui, thumbsheet: Hide
              seek := 0
              }
          else if video_player						; images
              PlayMedia(1)
          else if (inside_browser && A_Cursor != "IBeam")
              ClickWebPage()
          }
        else if (click == "Back")
            {
            if timer							; long back key press
                {
                if (video_player)
                    PlayMedia(-1)
                else IfWinActive, ahk_group Browsers
                    send, ^w						; close tab
                else send, !{F4}					; or close app
                }
            else IfWinExist, ahk_class OSKMainClass
                send, !0						; close onscreen keyboard
            else if (music_player && xpos < 100)
                PlaySong(-1)
            else if WinActive("ahk_class Notepad")
                {
                Send,  ^s^w
                if (spool_name == "slides")
                    RenderPage()
                }
            else if video_player
                ClosePlayer()
            else if (tab == 2 && WinActive("ahk_group Browsers"))
                {
                selected =
                RenderPage()    
                send, ^{F5}						; go to top of page
                }
            else send, {Xbutton1}
            }
        }


    MediaControl()							; from timer - every 0.1 seconds
        {
        if (!active && xpos > A_ScreenWidth - 100)			; trigger seeking window
            {
            active = 1
            paused = 1
            Gui, ProgressBar:Color, 826858
            Gui, ProgressBar:Show
            if (media == "video")
                {
                ControlSend,, 2, ahk_ID %video_player%			; pause video
                block_input := A_TickCount + 800
                loop 30
                   {
                   loop 120000
                   x =
                   ControlSend,, 9, ahk_ID %video_player%
                   }
                ys := A_ScreenHeight * 0.5 - 250
                xs := A_Screenwidth * 0.5 - 400
                Gui, pic:show, x%xs% y%ys% w800 h500
                }
            sleep 600
            MouseMove, % (A_ScreenWidth * 0.6), % ypos, 0
            MouseGetPos, xpos, ypos
            seeking := xpos
            }
        if (!active && seeking)						; close seeking window
            {
            seeking =
            loop 30
                {
                loop 120000
                    x =
                ControlSend,, 0, ahk_ID %video_player%
                }
            paused =
            Gui, pic: Cancel
            ControlSend,, 1, ahk_ID %video_player%
            }
        if (media == "video" || media == "audio")
            {
            xp := Round(A_ScreenWidth * seek_time / duration)
            yp := A_ScreenHeight - 3
            GetSeektime(video_player)
            if active
                xp += 2 * (xpos - seeking)
            thumb := Round(200 * xp / A_ScreenWidth)
            if (thumb < 3)
                thumb := 1
            if (xp < 0)
                seeking += xp
            ratio := (thumb-1) / 200					; create accurate seek time
            offset := 0
            if (duration > 60 && media == "video")
                offset := 19
            seek =
            if (active == 1)
                seek := Round(ratio * duration + offset - ratio * offset, 2)
            else xp := Round(A_ScreenWidth * seek_time / duration)
            if active
               xp := Round(A_ScreenWidth * seek / duration)
            Gui, ProgressBar:+LastFound -Caption +ToolWindow +AlwaysOnTop -DPIScale
            if seek
                 Gui, ProgressBar:Color, 826858
            else Gui, ProgressBar:Color, 303030
            Gui, ProgressBar:Show, x0 y%yp% w%xp% h3 NA			; seek bar under video
            if (thumb != last_thumb && thumb < 200)			; stop flickering image
                GuiControl,pic:, GuiPic, *w800 *h500 %inca%\cache\%thumb%.jpg
            last_thumb := thumb
            }
        key =
        pan := A_ScreenWidth * 0.002
        if (xclick < xpos - pan)
            key = j
        if (xclick > xpos + pan)
            key = i
        if (yclick < ypos - pan)
            key = h
        if (yclick > ypos + pan)
            key = g
        if (active && key && media == "image")				; pan image
            {
            seeking =
            Gui, pic: Cancel
            Gui, thumbsheet: hide
            Gui, ProgressBar:hide
            loop 10
                {
                ControlSend,, %key%, ahk_ID %video_player%
                sleep 24
                }
            xpos := A_ScreenWidth / 2
            ypos := A_ScreenHeight / 2
            MouseMove, % xpos, % ypos, 0
            xclick := xpos
            yclick := ypos
            return
            }
        if (click == "wheel")
            {
            if (active == 2)
                {
                paused = 
                ControlSend,, 1, ahk_ID %video_player%
                }
            click =
            active =
            Gui, thumbsheet: Hide
            if (media == "video" || media == "audio")
                {
                if (paused || ext == "gif")
                    {
                    paused = 1
                    if wheel
                        key = ..
                    else key = ,,
                    ControlSend,, %key%, ahk_ID %video_player%
                    }
                else
                    {
                    step := duration / 200
                    if (duration < 1000)
                        step := step*2
                    if (duration < 400)
                        step := step*2
                    if (duration < 100)
                        step := step*2
                    if wheel
                        seek_t := Round(seek_time + step,2)
                    else seek_t := Round(seek_time - step - 0.5,2)
                    if (seek_t < 0.1)
                        seek_t := 0.1
                    if (!wheel || seek_t < (duration - 2))
                        RunWait %COMSPEC% /c echo seek %seek_t% absolute > \\.\pipe\mpv%list_id%,, hide && exit
                    }
                block_input := A_TickCount + 84
                }
            WinGetTitle title, YouTube
            if (title && xpos < 100)					; wheel back/forward in youtube
                {
                if wheel
                    send, .
                else send, ,
                block_input := A_TickCount + 99
                }
            }
        }


    TimedEvents:							; every 100mS
        Critical
        xt =
        MouseGetPos, xpos, ypos
        WinGetPos, xb, yb, wb, hb, ahk_group Browsers
        if (tab == 2 && WinActive("ahk_group Browsers") && xpos > xb+10 && ypos > yb+200 && xpos < xb+wb-400 && ypos < yb+hb-50)
            inside_browser = 1
        else inside_browser =
        if (xb + wb < A_ScreenWidth + 16 && xb + wb > A_ScreenWidth - 8)
            xt := A_ScreenWidth - xb + 12
        if (!video_player && (!yb || wb < xt))
            WinMove, ahk_class MozillaWindowClass,, xb, -4, xt, hb + 12
        IfWinNotExist, ahk_ID %music_player%
            music_player =
        if history_timer
            history_timer += 1
        if vol_popup							; show orange volume bar
            vol_popup -= 1
        if (music_player && song_timer && A_TickCount > song_timer)
            if (GetSeekTime(music_player) == "yes")
                PlaySong(1)
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
            tray_dim := Setting("Dim Taskbar") * 2.55
            if (tab && tray_dim && state > -1)
                WinSet, Transparent, %tray_dim%, ahk_class Shell_TrayWnd
            else if tray_dim
                WinSet, Transparent, 255, ahk_class Shell_TrayWnd
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
                    sleep 5
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
        ShowStatus()							; show time, vol etc.
        return


    ClickWebPage()							; change with extreme caution !
        {
        media =
        If (timer > 350)
            subfolders =
        if (StrLen(search_box) > 2)
            sourcefile = %search_box%					; also clears white space
        else if (tab == 2 && !GetPageLink())				; 
            {
            if (click == "LButton" && timer > 140)
                {
                if (view < 7)
                    {
                    last_view := view
                    view := 7
                    }
                else view := last_view
                page := 1
                refresh = 1
                }
            return
            }
        SplitPath, sourcefile,, folder_payload, ext, link_data		; link_data can be folder search sort page..
        if (ext == "htm")
            return 1
        else if (link_data == "Settings")
            ShowSettings()
        else if DetectMedia()
            {
            if (media == "playlist")
                {
                playlist := sourcefile
                CreateList(0)
                If (timer > 350)
                    PlayMedia(0)
                }
            else PlayMedia(0)
            }
        else if (link_data == "Page" || link_data == "View")
            {
            RenderPage()
            if (link_data == "Page")
                {
                send, ^{F5}						; go to top of page
                sleep 244
                send, {Space}
                }
            }
        else								; link_data is sort, folder or search_term
            {
            if (StrLen(search_term) > 2 && link_data == "+")		; add latest search to search list
                {
                search_list = %search_list%|%search_term%
                IniWrite,%search_list%,%inca%\settings.ini,Settings,search_list
                LoadSettings()
                refresh = 1
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
                if InStr(toggle_list, link_data)
                    if !InStr(toggles, link_data)			; toggle the sort switches
                        toggles = %toggles%%link_data%			; add switch
                    else StringReplace, toggles, toggles, %link_data%	; remove switch
                else sort := link_data
                link_data =
                }
            if link_data						; search text from link or search box
                {
                if InStr(spool_path, "\slides")
                    spool_path =
                subfolders =
                x := spool_path
                tab_name := link_data
                spool_name := link_data
                if !folder_payload
                    GetPageSettings()
                spool_path := x
                if (!folder_payload || search_box)
                    this_search := search_folders
                if (search_box && !InStr(this_search, spool_path))	; search this folder, then search paths
                    this_search = %spool_path%|%this_search%		; search this folder only
                filter =
                if search_box
                    {
                    view := 7
                    sort = Duration
                    toggles =
                    }
                search_term := link_data
                page := 1
                }
            if (StrLen(toggles) < 4)
                toggles =
            if subfolders
                if !InStr(subfolders, spool_name)
                    subfolders =
            Loop, Files,%spool_path%*.*, D
                if A_LoopFileAttrib not contains H,S
                    if !InStr(subfolders, A_LoopFileFullPath)
                        subfolders = %subfolders%%A_LoopFileFullPath%\|
            CreateList(0)
            RenderPage()
            }
        search_box =
        return 1
        }


    CreateList(silent)							; list of files in spool_path
        {
        if !spool_name
            return
        IfNotExist, %spool_path%
            spool_path = %search_term%\
        list =
        plist =
        list_size := 0
        StringReplace, li, this_search, \, `;, All			; convert to cache filename
        StringReplace, li, li, |, `;, All
        StringReplace, li, li, :, `;, All
        cache_file = %inca%\cache\lists\%li%%sort%%toggles%.txt
        FileGetSize, cache_size, %cache_file%, K
        if (silent ||(!search_box && cache_size > 600 && timer < 350))
            FileRead, list, %cache_file%
        if !list
            {
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
                                plist = %plist%%inca%/apps/icons/music.png`r`n
                            data := list_size
                            if (list_size/1000 == Round(list_size/1000))
                                PopUp(list_size,0,0)
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
            StringTrimRight, list, list, 2				; remove end `r`n
            if InStr(toggles, "Reverse")
                reverse = R
            if (sort == "ext")
                Sort, list, %reverse% Z
            else if (sort != "Shuffle")
                Sort, list, %reverse% Z N
            PopUp(list_size,0,0)
            if playlist
                {
                list = %list%`r`n
                list_id := list_size + 1
                this_search := spool_path
                FileRead, str, %playlist%
                Loop, Parse, str, `n, `r
                    {
                    input := StrSplit(A_LoopField, "|").1
                    IfExist, %input%
                        {
                        list_size += 1
                        SplitPath, input,,,ex, filen
                        med := DecodeExt(ex)
                        list = %list%%ex%/%input%/%med%`r`n
                        if (spool_name == "music")
                            plist = %plist%%input%`r`n
                        else plist = %plist%%A_LoopField%`r`n
                        }
                    }
                FileDelete, %inca%\cache\playlist.m3u
                FileAppend, %plist%, %inca%\cache\playlist.m3u, UTF-8
                refresh = 1
                }
            }
        else if !silent
            PopUp("Cache",0,0)
        FileRead, cache, %cache_file%
        if !silent
            {
            if (sort == "Shuffle" && !menu_item)
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
              IfExist, %inca%\favorites\- snips\%media_name% - %snip%.mp4
                sourcefile = %inca%\favorites\- snips\%media_name% - %snip%.mp4
            if !DetectMedia()
                {
                PopUp("Media Not Exist",600,1)
                return
                }
            else if (media == "video" && !snip)
                     CalcSeekTime(slider)				;  video hover image
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


    GetPageSettings()							; from .htm cache file
        {
        page := 1							; default view settings
        view := 7
        toggles =
        sort = Duration
        FileReadLine, array, %inca%\cache\html\%tab_name%.htm, 2	; embedded page data
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
            playlist := Transform_Htm(array.8)
            last_media := Transform_Htm(array.9)
            pos := InStr(spool_path,"\",,-1)
            spool_name := SubStr(spool_path,pos+1)
            StringTrimRight,spool_name,spool_name,1
            if search_term
                spool_name := search_term
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


    GetDuration(source)
        {
        Critical
        clip := clipboard
        clipboard =
        RunWait %COMSPEC% /c %inca%\apps\ffmpeg.exe -i "%source%" 2>&1 | find "Duration" | Clip, , hide && exit
        ClipWait, 3
        stringTrimLeft, aTime, clipboard, 12
        StringLeft, aTime, aTime, 8
        aTime := StrSplit(aTime, ":")
        clipboard := clip
        return aTime.1 * 3600 + aTime.2 * 60 + aTime.3
        }


    ThumbSeekTime()
        {
        thumb_number =
        MouseGetPos, xpos,ypos
        Gui, thumbsheet:+lastfound
        ControlGetPos,,, thumb_width, thumb_height
        xpos -= (A_ScreenWidth - (6 * thumb_width)) /2
        ypos -= (A_ScreenHeight - (6 * thumb_height)) /2 
        col := ceil((xpos / (thumb_width)))
        row := floor(ypos / (thumb_height))
        thumb_number := 5 * (row * 6 + col)
        CalcSeekTime((thumb_number-1)/200)
        }


    CalcSeekTime(seek_ratio)
        {
        duration := 8
        if !InStr(media_path, "\favorites\- snips")
           FileRead, duration, %inca%\cache\durations\%media_name%.txt
        offset := 0
        if (duration > 60)
           offset := 19
        seek := Round(seek_ratio * duration + offset - seek_ratio * offset, 2)
        }


    GetSeekTime(player)								; get media properties from mpv
        {
        IfWinNotExist, ahk_ID %player%
            return
        clip := ClipBoard
        Clipboard =
        ControlSend,, =, ahk_ID %player%					; to mpv player - see input.conf
        ClipWait, 1
        StringReplace, input, ClipBoard, `r`n, , All
        input := StrSplit(input, "/")
        array := StrSplit(input.2, ":")						; duration
        idle := input.3
        duration := array.1 * 3600 + array.2 * 60 + array.3
        seek_time := Round((input.5 / input.6) * duration,2)			; most accurate value
        array := StrSplit(input.1, ":")
        if !seek_time
            seek_time := Round(array.1 * 3600 + array.2 * 60 + array.3,2)	; or use less accurate value
        if (player == music_player)
            {
            song_id := input.4 + 1
            FileReadLine, str, %inca%\cache\playlist.m3u, %song_id%
            song := StrSplit(str, "/").1
            if !duration
                if !(duration := GetDuration(song))
                    duration := 60						; any dur is better than null
            song_timer := A_TickCount + (Setting("Silence Gap") + duration - seek_time) * 1000
            }
        ClipBoard := clip
        return idle								; idle state
        }


    GetSnipSource()
        {
        if !InStr(media_path, "\favorites\- snips")
            return
        name := SubStr(media_name, 1, -4)					; remove snip suffix id
        Loop, Parse, search_folders, `|
           IfExist, %A_LoopField%\%name%.*
               {
               sourcefile = %A_LoopField%%name%
               extensions = mkv|mp4|wmv|webm|mpg|m4v
               Loop, Parse, extensions, `|
                   IfExist, %sourcefile%.%A_LoopField%
                       sourcefile = %sourcefile%.%A_LoopField%
               if DetectMedia()
                   return sourcefile
               }
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
                spool_path =
                search_box := ClipBoard
                ClickWebPage()
                return
                }
            }
        send, !+0							; trigger osk keyboard
        sleep 500
        }


    LoadHtml()								; create / update browser tab
        {
        WinActivate, ahk_group Browsers
        new_html = file:///%inca%\cache\html\%tab_name%.htm
        StringReplace, new_html, new_html, \,/, All
        if (tab != 2)
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
        Loop, 100							; allow time for page to load before TimedEvents()
            {
            sleep 20
            WinGetTitle title, Inca -
            if InStr(title, tab_name)
                break
            }
        }


    EditFilename()					; + update snips, durations, faorites, history and slides
        {
        sourcefile := StrReplace(selected, "`r`n")
        selected =
        if InStr(media_path, "\favorites\- snips")
            return
        DetectMedia()
        FileGetSize, size, %sourcefile%, K
        size := Round(size/1000,2)
        FileRead, duration, %inca%\cache\durations\%media_name%.txt
        InputBox, newname,%media_path%  %ext%  size %size%  dur %duration%,,,,94,,,,, %media_name%
        IfWinExist, ahk_class OSKMainClass
            send, !0									; close osk keyboard
        if !ErrorLevel
          {
          FileMove, %sourcefile%, %media_path%\%newname%.%ext%				; FileMove = FileRename
          if (ext != "lnk" && ext != "m3u")
            {
            Loop, Files, %inca%\slides\*.m3u, FR
                {
                FileRead, str, %A_LoopFileFullPath%					; find & replace in .m3u slide files
                FileDelete, %A_LoopFileFullPath%
                Loop, Parse, str, `n, `r
                    if A_LoopField
                        if !InStr(A_LoopField, sourcefile)
                            FileAppend, %A_LoopField%`r`n, %A_LoopFileFullPath%, UTF-8
                        else 
                            {
                            str1 := A_LoopField
                            StringReplace, str1, str1, %sourcefile%, %media_path%\%newname%.%ext%
                            FileAppend, %str1%`r`n, %A_LoopFileFullPath%, UTF-8
                            }
                 }
            fav_his = favorites|history
            Loop, Parse, fav_his, `|
              Loop, Files, %inca%\%A_LoopField%\*.lnk, FR
                IfExist, %A_LoopFileDir%\%media_name%.lnk				; update favorites & history links
                    {
                    FileGetShortcut, %A_LoopFileDir%\%media_name%.lnk, link_file,, sk, se
                    SplitPath, link_file,,fol,ext
                    FileCreateShortcut, %fol%\%newname%.%ext%, %inca%\%A_LoopField%\%newname%.lnk,, %sk%, %se%
                    break
                    }
            if (media == "video")							; update thumb, duration & snips
                {
                FileMove, %inca%\cache\durations\%media_name%.txt, %inca%\cache\durations\%newname%.txt, 1
                FileMove, %inca%\cache\thumbs\%media_name%.mp4, %inca%\cache\thumbs\%newname%.mp4, 1
                Loop, 9
                  IfExist, %inca%\favorites\- snips\%media_name% - %A_Index%.mp4
                    FileMove, %inca%\favorites\- snips\%media_name% - %A_Index%.mp4, %inca%\favorites\- snips\%newname% - %A_Index%.mp4,1
                }
            FileRecycle, %inca%\favorites\%media_name%.lnk          
            FileRecycle, %inca%\history\%media_name%.lnk       
            CreateList(0)
            }
          }
        LoadSettings()
        refresh = 1
        }


    ContextMenu:							; right click menu
    copy =
    popup =
    count := 0
    if GetKeyState("LWin")
        copy = Copy
    menu_item := A_ThisMenuItem
    if video_player
        if (A_ThisMenu == "slides")
            selected := sourcefile
    if (menu_item == "New" && selected)					; new folder
       {
       FileSelectFolder, menu_item, , 3					; bring up new client window
       if (menu_item && !ErrorLevel)
           context_menu = %context_menu%|%menu_item%
       else menu_item =
       }
    if (menu_item == "Edit")
        {
        x := selected
        selected =
        RenderPage()							; clear browser highlighting
        sourcefile := StrReplace(x, "`r`n")
        DetectMedia()
        if (ext == "m3u" || ext == "txt")
            Run, Notepad.exe "%sourcefile%"
        else if playlist
            Run, Notepad.exe "%playlist%"
        return
        }
    if (menu_item == "Rename")
        EditFilename()
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
            if (A_ThisMenu == "slides")
                FileAppend, %input%|%seek%|%caption%`r`n,%inca%\slides\%menu_item%.m3u, UTF-8
            else
                {
                SplitPath, input,,,,name
                IfExist, %spool_path%%name%.lnk
                    input = %spool_path%%name%.lnk
                if (menu_item == "Delete")
                    {
                    if (spool_name == "slides" && media != "playlist")
                        {
                        FileRead, str, %playlist%
                        FileDelete, %playlist%
                        Loop, Parse, str, `n, `r
                          if !InStr(A_LoopField, input)
                            if A_LoopField
                              FileAppend, %A_LoopField%`r`n, %playlist%, UTF-8
                        }
                    else FileRecycle, %input%
                    popup = Delete %count%
                    }
                else
                    {
                    if menu_item
                        Loop, Parse, context_menu, `|
                            if InStr(A_LoopField, menu_item)
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
    RenderPage()
    if popup
        PopUp(popup,700,0)
    return


    RenderPage()							; construct web page from media list
        {
        refresh =
        if !(spool_name && spool_path)
            return
        Transform, html_spool_name, HTML, %spool_name%, 2
        safe_spool_path := Transform_utf(spool_path)			; make filenames web compatible
        safe_this_search := Transform_utf(this_search)
        safe_playlist := Transform_utf(playlist)
        safe_last_media := Transform_utf(last_media)
        FileRead, font, %inca%\apps\ClearSans-Thin.txt			; firefox bug - requires base64 font
        FileRead, script, %inca%\apps\inca - js.js
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        slide_id := 0							; used as caption pointer
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
        if (view == 7)							; no thumbnails so page list can be bigger
            size := Setting("List Size")
        Loop, Parse, list, `n, `r 					; split list into smaller web pages
          if FilterList(A_LoopField)
            {
            list_size += 1
            if ((list_size > (page-1) * size) && (list_size <= page * size))
                SpoolList(A_Index)
            }
        pages := ceil(list_size/size)
        html_header = <!--`r`n%view%/%page%/%sort%/%toggles%/%safe_this_search%/%search_term%/%safe_spool_path%/%safe_playlist%/%safe_last_media%`r`n%page_media%`r`n-->`r`n<!doctype html>`r`n<html>`r`n<head>`r`n<link rel="icon" type="image/x-icon" href="file:///%inca%/apps/icons/inca.ico">`r`n<meta charset="UTF-8">`r`n<title>Inca - %html_spool_name%</title>`r`n<style>`r`n`r`n@font-face {font-family: ClearSans-Thin; src: url(data:application/font-woff;charset=utf-8;base64,%font%);}`r`nbody {font-family: 'ClearSans-Thin'; overflow-x:hidden; background:%back%; color:#666666; font-size:0.85em; margin-top:160px;}`r`na:link {color:#15110a;}`r`na:visited {color:#15110a;}`r`ntable {color:%fcol%; transition:color 1.4s; width:100`%; table-layout:fixed; border-collapse: collapse;}`r`na {text-decoration:none; color:%fcol%;}`r`nc {width:28`%; text-decoration:none; color:%fcol%;}`r`nimg {display:block; margin:0 auto; max-width:100`%; max-height:%max_height%px;}`r`n.title {clear:left; white-space:nowrap; color:#33312e;}`r`na.slider {display:inline-block; width:36`%; height:18px; border-radius:9px; color:%fcol%; transition:color 1.4s; font-size:1.1em; background-color:#1b1814; margin-right:1em; margin-left:-0.24em; text-align:center}`r`na.slider:hover {color:red; transition:color 0.36s;}`r`na.footer {display:inline-block; width:34`%; font-size:2.2em; color:#33312e; transition:color 1.4s;}`r`na.footer:hover {color:red; transition:color 0.36s;}`r`n.container {width:%width%`%; margin-left:%offset%`%;}`r`n.columns {float:left;}`r`nul.menu {width:100`%; column-gap:12px; margin:auto; list-style-type:none; padding:0; white-space:nowrap;}`r`n.sorts {color:#555351; font-size:0.8em; text-align:right; padding-right:2em; width:1.2em;}`r`nul.menu li {color:%fcol%; transition:color 1.4s;}`r`nul.menu li:hover {color:red; transition:color 0.36s;}`r`nul.list {width:100`%; margin-right:12`%; list-style-type:none; padding:0;}`r`nul.list table:hover {color:red; transition:color 0.36s;}`r`nul.list li img {border: 1px solid %back%;}`r`n#hover_image {position:absolute; margin-left:2`%; opacity:0; transition: opacity 0.4s; width:140px; height:auto;}`r`n#hover_image:hover {opacity:1;}`r`n@keyframes blink {0`% {opacity:0;} 100`% {opacity:1;}`r`n</style>`r`n</head>`r`n<body>`r`n`r`n%script%`r`n`r`n<div class="container"><ul class="list"><a href="#%html_spool_name%"><li class="title" style="font-size:5em">%html_spool_name%<span style="font-size:0.4em;">&nbsp;&nbsp;%list_size%</span></li></a></ul></div>`r`n
        menu_html = `r`n<div class="container">`r`n`r`n<ul class="menu" style="display:flex; justify-content:space-between;">`r`n`r`n
        PostList(sort, sort_list)
        sort_html = <div style="height:20px; clear:left;"></div><div class="container">`r`n`r`n<a href="#View#%view%" id='slider4' class='slider' style="width:8`%;" onmousemove='getCoords(event, id, "View", "%html_spool_name%","")' onmouseleave='getCoords(event, id, "View", "%html_spool_name%", "%view%")'>View %view%</a>`r`n`r`n<a href="%html_spool_name%.htm#%sort%" id='slider1' class='slider' onmousemove='getCoords(event, id, "%sort%", "%html_spool_name%", "")'>%sort%</a>`r`n`r`n<a href="#Page#%previous%" class='slider' style="width:4.5`%;">Prev</a><a href="%html_spool_name%.htm#Page" id='slider2' class='slider' onmousemove='getCoords(event, id, "%Pages%", "%html_spool_name%", "")' onmouseleave='getCoords(event, id, "%Pages%", "%html_spool_name%", "%page%")'>Page %page% of %pages%</a>`r`n`r`n<a href="#Page#%next%" class='slider' style="width:4.5`%;">Next</a></div><div style="height:6px;"></div>`r`n`r`n%menu_html%</ul><p style="height:30px;"></p></div>`r`n`r`n`r`n
        x =
        if search_box
            x = <a href="#+" style="font-size:18px"><c>+ </c></a>		; + option to add search to search list
        menu_html = `r`n<div class="container">`r`n<div class="columns" style="width:18`%; margin-right:12px"><ul class="menu" style="column-count:1">`r`n`r`n<li>%x%<input type="search" class="searchbox" value="%search_box%" style="width:70`%; border-radius:8px; height:18px; border:none; font-size:13px; color:#888888; background-color:#1b1814;"/></li>
        PostList(html_spool_name, folder_list)
        if subfolders
            PostList(html_spool_name, subfolders)
        menu_html = %menu_html%`r`n</ul></div>`r`n
        menu_html = %menu_html%<div class="columns" style="width:78`%">`r`n<ul class="menu" style="column-count:6">`r`n`r`n
        PostList(search_term,search_list)				; highlight search menu item if exists
        menu_html = %menu_html%`r`n</ul></div>`r`n<div class="columns" style="width:100`%; height:40px"></div>`r`n</div>`r`n
        media_html = <div class="container" oncontextmenu="return(false);">`r`n`r`n<ul class="list">`r`n`r`n%media_html%</ul>`r`n</div>`r`n`r`n<div class="container"><div align="center" style="margin-right:12`%;"><a href="#Page#%previous%" class='footer' style="width:16`%;">Previous</a><a href="%html_spool_name%.htm#Page" id='slider3' class='footer' style="height:2em; font-size:1.1em;" onmousemove='getCoords(event, id, "%Pages%", "%html_spool_name%", "")' onmouseleave='getCoords(event, id, "%Pages%", "%html_spool_name%", "%page%")'>Page %page% of %pages%</a><a href="#Page#%next%" class='footer' style="width:16`%;">Next</a></div>`r`n<a href=""><p style="height:250px; clear:left;"></p></a>`r`n</div>`r`n</body>`r`n</html>`r`n`r`n
        FileDelete, %inca%\cache\html\%tab_name%.htm
        FileAppend, %html_header%%menu_html%%sort_html%%media_html%, %inca%\cache\html\%tab_name%.htm        
        LoadHtml()
        if video_player
            WinActivate, ahk_ID %video_player%
        else WinActivate, ahk_group Browsers
        PopUp("",0,0)
        sourcefile := last_media					
        DetectMedia()							; restore media parameters
        }


    SpoolList(i)							; spool sorted media files into web page
        {
        if !DetectMedia()
            return
        input := sourcefile
        width := "34,19,13,9,6,4,15"
        width := StrSplit(width, ",")
        width := width[view]
        width1 := width * 2
        margin := Round(width * 0.5)
        font_size := Round((width + 20) / 34,1)
        height1 := Round(width * 0.9)
        font := Setting("Font Color")
        FileGetSize, size, %sourcefile%, K
        size := Round(size/1000)
        page_media = %page_media%%i%/
        hov := Round(100 * (width + 20)/34)
        hov_size = img style="width:%hov%`%;				; hover image in list view
        vid_styl = img style="width:100`%;
        if InStr(selected, sourcefile)					; underline any selected media
            select = border-bottom:dotted #ffbf99;
        if (spool_name == "music" && song && InStr(sourcefile, song))
            highlight = color:LightSalmon;
        else if (spool_name != "music" && sourcefile == last_media)	; highlight media
            highlight = color:LightSalmon;
        if (playlist && InStr(sourcefile, playlist))			; highlight playlist
            highlight = color:#ffbf99;
        if (media == "playlist")
            {
            FileReadLine, str, %sourcefile%, 1
            input := StrSplit(str, "|").1
            SplitPath, input,,,ex,media_name
            IfExist, %input%
                media := DecodeExt(ex)					; display first media entry thumbnail
            else input = %inca%\apps\icons\music.png			; instead of icon hover image
            }
        if (media == "audio")
            input = %inca%\apps\icons\music.png
        if (media == "document")
            input = %inca%\apps\icons\ebook.png
        IfExist, %spool_path%%media_name%.lnk 
            no_index = <span style="color:orange">- link - &nbsp;&nbsp;</span>
        if (media == "video")
            {								; use thumbnail from cache if exists
            hov_size = video style="width:%hov%`%;			; hover image in list view
            vid_styl = video style="width:100`%;
            FileRead, duration, %inca%\cache\durations\%media_name%.txt
            IfExist, %inca%\cache\thumbs\%media_name%.mp4
                input = %inca%\cache\thumbs\%media_name%.mp4
            else if (ext != "gif" && (!duration || duration >= 30) && !InStr(sourcefile, "\- snips\"))
                no_index = <span style="color:red">no index&nbsp;&nbsp;&nbsp;</span>
            }
        IfNotExist, %input%
            return
        SplitPath, sourcefile,,,,link_name
        link_name := SubStr(link_name, 1, 62)
        Transform, input, HTML, %input%, 2				; make filenames web compatible
        Transform, link_name, HTML, %link_name%, 2
        StringReplace, input, input, \,/, All
        width_t := 1
        ratio := 1.007
        Loop % Abs(skinny)
            width_t  *= ratio
        height_t := 1 - (width_t - 1)
        if (skinny && skinny < 0)
            transform = transform:scaleX(%height_t%);
        if (skinny > 0)
            transform = transform:scaleY(%height_t%);
        caption =
        if (spool_name == "slides" && ext != "m3u")
            {
            slide_id +=1
            FileReadLine, str, %playlist%, %slide_id%
            caption := StrSplit(str, "|").3
            StringReplace, caption, caption, ~,<br>, All
            }
        dur := Round(duration / 3600,1)
        if InStr(media_path, "\favorites\- snips")			; if source is snip, add only one snip button
            {
            title_html = 
            StringRight, snip_id, media_name, 1
            media_name := SubStr(media_name, 1, -4)
            }
        else title_html = <a href="#media%i%0" id="title%i%0" name="media%i%" onmouseenter="snip(event, name, '%html_spool_name%')" onmousedown="select(event, id, name)">
        if (last_ext == "m3u" && ext != "m3u")
            media_html = %media_html%<li style="float:left; width:100`%; height:40px"></li>`r`n`r`n	; gap between playlists & media
        if (view == 7 || ext == "m3u")					; list view 
            {
            loop, 9
              IfExist, %inca%\favorites\- snips\%media_name% - %A_Index%.mp4
                if !InStr(spool_path, "slides")
                  snips = %snips% *
            if snips
              snips = <span style="color:orange;">%snips%</span>
            media_html = %media_html%<a href="#" id="item%i%" name="media%i%" onmousedown="select(event, id, name)"><li id="media%i%" src="file:///%input%" style="float:left; width:100`%; margin:0;"><table><tr><td id="hover_image"><%hov_size% %select%" src="file:///%input%"></video></tr></table><table><tr><td style="color:#555351; width:4em; text-align:right; padding-right:1em;">%sort_filter%</td><td class="sorts">%ext%</td><td class="sorts">%size%</td><td class="sorts">%dur%</td><td style="%select% %highlight% overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align:left; padding-left:1em;">%link_name% %snips%</td></tr></table></li></a>`r`n`r`n
            }
        else 
            {
            if (media == "video")
              Loop, 9							; add snip buttons
                IfExist, %inca%\favorites\- snips\%media_name% - %A_Index%.mp4
                  if (!snip_id || snip_id == A_Index)
                    snips = %snips%<a href="#" id="snip%i%%A_Index%" name="media%i%" onmousedown="select(event, id, name)" onmouseenter="snip(event, name, '%A_Index%')" style="opacity:0.6; display:flex; justify-content:center; width:%width1%px;"><div style="width:%width1%px; height:%height1%px;"><div style="width:0.2em; height:0.2em; margin-left:25`%; background-color:orange;"></div></div></a>
            if (ext == "txt")
                {
                Loop 40
                    {
                    rows := A_Index
                    FileReadLine, str1, %sourcefile%, %A_Index%
                    if !ErrorLevel
                        str2 = %str2%%str1%`r`n
                    else break
                    }
	        media_html = %media_html%<div style="display:inline-block; vertical-align:top; width:88`%; margin-left:2`%; color:%font%; transition:color 1.4s;">%title_html%<div style="margin-left:8`%; color:#555351; font-size:0.9em; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_filter% &nbsp;&nbsp;%no_index% %link_name%</div></a><textarea rows="%rows%" style="display:inline-block; overflow:hidden; margin-bottom:%margin%em; margin-left:8`%; width:88`%; background-color:inherit; color:#826858; font-size:1.2em; font-family:ClearSans-Thin; border:none; outline:none;">%str2%</textarea></div>`r`n`r`n
                }
            else media_html = %media_html%<li style="display:inline-block; vertical-align:top; width:%width%em; margin-bottom:%margin%em; margin-left:2`%; color:%font%; transition:color 1.4s;">%title_html%<div style="margin-left:8`%; color:#555351; font-size:0.9em; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; %highlight%;">%sort_filter% &nbsp;&nbsp;%no_index% %link_name%</div></a><a href="#" name="media%i%" id="vid%i%" onmousedown="select(event, id, name)" onmousemove="seek(event, id, name)"><%vid_styl% %transform% %select%" id="media%i%" src="file:///%input%" muted></a><div style="width:110`%; color:LightSalmon; opacity:0.7; font-size:%font_size%em;">%caption%</div></li><div style="display:inline-block; width:%width%px; margin-top:10px; vertical-align:top;">%snips%</div>`r`n`r`n
            }
        last_ext := ext
        skinny =
        }


    FilterList(item)
        {
        item := StrSplit(item, "/")					;  sort filter \ sourcefile \ media type \ ext
        sort_filter := item.1
        sourcefile := item.2
        media := item.3
        if (media == "image" && InStr(toggles, "Video"))		; file still may not exist
            return
        if (media == "video" && InStr(toggles, "Images"))
            return
        if InStr(toggles, "Snips")					; only list files with snips
            {
            SplitPath, sourcefile,,,, filen
            IfNotExist, %inca%\favorites\- snips\%filen% - 1.mp4
                return
            }
        if search_term
            {
            SplitPath, sourcefile,,,,name
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


    PostList(query,item)						; post and highlight items to web page list
        {
        if !query
            query := spool_path
        Loop, Parse, item, `|
            {
            x =
            if (item == sort_list)
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
            StringLeft, name, name, 15
            if (StrLen(name) < 2)
                name = &nbsp;
            else Transform, name, HTML, %name%, 2
            if InStr(query, name)
                 name = <span style="color:LightSalmon;">%name%</span>
            menu_html = %menu_html%<a href="#%link%" %x%><li>%name%</li></a>
            }
        menu_html = %menu_html%<li><br></li> 
        return
        }


    PlaySong(pos)
        {
        if !pos
            CloseMusic()
        SoundSet, 1
        volume := 1
        if !vol_ref
            vol_ref := 1
        if Setting("Default Volume")
            if (vol_ref > Setting("Default Volume"))
                vol_ref := Setting("Default Volume")
        music_speed := 0
        video_sound := 0
        ptr := list_id -1
        if (pos == 1)
            RunWait %COMSPEC% /c echo playlist-next > \\.\pipe\mpv_music,, hide && exit
        else if (pos == -1)
            RunWait %COMSPEC% /c echo playlist-prev > \\.\pipe\mpv_music,, hide && exit
        else 
            {
            Run %inca%\apps\mpv --fullscreen=no --cursor-autohide=no --osc=yes --playlist-start=%ptr% --keep-open=always --input-ipc-server=\\.\pipe\mpv_music "%inca%\cache\playlist.m3u"
            loop 100
                {
                sleep 20
                WinGet, running, List, ahk_class mpv
                loop %running%
                    if ((music_player := running%A_Index%) != video_player)
                        break 2
                }
            }
        loop 100
            WinMinimize, ahk_ID %music_player%
        last_song := song_id
        GetSeekTime(music_player)
        if (last_song == song_id)
            CloseMusic()
        else
            {
            SetTimer, VolUp
            if (WinActive("ahk_group Browsers") && tab == 2 && spool_name == "music")
                RenderPage()
            }
        }


    DecodeExt(ex)
        {
        if !ex
            return
        StringLower ex, ex
        if InStr("jpg png jpeg webp", ex)
            return "image"
        if InStr("mp4 wmv avi mov webm mpg mpeg flv divx mkv asf m4v mvb rmvb vob rm gif ts", ex)
            return "video"
        if InStr("mp3 m4a wma mid", ex)
            return "audio"
        if InStr("pdf txt doc", ex)
            return "document"
        if (ex == "m3u")
            return "playlist"
        }


    DetectMedia()
        {
        media =
        skinny =
        SplitPath, sourcefile,,,ext,linkname
        if (ext == "lnk")
            FileGetShortcut, %sourcefile%, sourcefile
        FileRead, skinny, %inca%\cache\widths\%linkname%.txt
        SplitPath, sourcefile,,media_path,ext,media_name
        stringlower, ext, ext
        media := DecodeExt(ext)
        IfExist, %sourcefile%
            return media
        }


    PlayMedia(offset)								; play current, next or previous
        {
        Critical
        active =
        seeking =
        if (click == "MButton")
            seek =
        if video_player
            ControlSend,, 2, ahk_ID %video_player%				; pause video
        caption =
        If (InStr(media_path, "\favorites\- snips") && !slide)
            {
            StringRight, snip, media_name, 1 					; cycle through snips instead of next media
            StringTrimRight, media_name, media_name, 1
            loop 9
              {
              snip += offset
              if (snip >= 10)
                 snip := 1
              if (snip < 1)
                 snip := 9
              IfExist, %inca%\favorites\- snips\%media_name%%snip%.mp4
                 break
              }
            media_name = %media_name%%snip%
            sourcefile = %inca%\favorites\- snips\%media_name%.mp4
            }
        else
            {
            FileReadLine, str, %inca%\cache\html\%tab_name%.htm, 3		; list of media id's in page
                Loop, Parse, str, `/
                  if (A_LoopField == list_id)					; current media id found in list
                    ptr := A_Index + offset					; next media 
            array := StrSplit(str, "/")						; convert html pointers to visible media
            list_id := array[ptr]
            Loop, Parse, list, `n, `r
                if (A_Index == list_id)
                    sourcefile := StrSplit(A_LoopField, "/").2
            if (list_id < 1)
                return
            }
        if (spool_name == "slides")
            {
            slide := playlist
            FileReadLine, str1, %inca%\cache\playlist.m3u, %list_id%
            if StrSplit(str1, "|").2
                seek := StrSplit(str1, "|").2
            caption := StrSplit(str1, "|").3
            StringReplace, caption, caption, ~,`n`r, All
            }
        If (timer > 350)
            {
            paused =
            seek = 10
            GetSnipSource()
            }
        if (!list_id || !DetectMedia())
            {
            ClosePlayer()
            return
            }
        last_media := sourcefile
        if (spool_name == "music")
            {
            PlaySong(0)
            return
            }
        if (media == "document")
            {
            RenderPage()							; highlight selected media
            run, %sourcefile%
            sleep 600
            if (ext == "pdf")
                WinActivate, ahk_group Browsers
            return
            }
        if (click == "MButton")
            paused = 1
        video_sound := 0
        Gui, Caption:+lastfound 
        GuiControl, Caption:, GuiCap
        video_speed := Setting("Default Speed") - 100
        mute = --mute=yes
        if (media == "audio" && !music_player)
            mute =
        duration := GetDuration(sourcefile)
        if ErrorLevel
            {
            PopUp("Disk Not Ready", 1200, 0)
            return
            }
        speed := Round((video_speed + 100)/100,1)				; default speed - mpv format
        speed = --speed=%speed%
        if (media != "video")
            speed =
        if (duration > 120 && (!seek || seek > (duration - 5)))
            seek := 10
        seek_t := 100 * seek / duration
        if (seek_t < 98)
            seek_t = --start=%seek_t%`%
        if (magnify < 0)
            magnify := 0 
        zoom := magnify
        if (media == "video" && zoom < 0.8)
            zoom := 0.8
        if (ext == "gif")
            zoom += 1
        if paused
            pause = --pause
        properties = --video-zoom=-%zoom% %mute% %pause% %loop% %speed% %seek_t% 
        if (media == "image")
            properties = --video-zoom=-%zoom%
        history_timer := 1
        if (media == "video" && duration > 30)					; create video thumbnails
            Run %inca%\apps\ffmpeg.exe -skip_frame nokey -i "%inca%\cache\thumbs\%media_name%.mp4" -vsync 0 -qscale:v 1 "%inca%\cache\`%d.jpg",, Hide
        Run %inca%\apps\mpv %properties% --idle --input-ipc-server=\\.\pipe\mpv%list_id% "%sourcefile%"
        player =
        Critical
        loop 100
            {
            sleep 20
            WinGet, running, List, ahk_class mpv
            loop %running%
                if ((player := running%A_Index%) != music_player && player != video_player)
                    break 2
            }
        WinSet, Transparent, 0, ahk_ID %player%
        if (aspect := Round(skinny / 100,2))
            {
            sleep 250
            RunWait %COMSPEC% /c echo add video-aspect %aspect% > \\.\pipe\mpv%list_id%,, hide && exit
            }
        else sleep 100
        loop 10
            {
            sleep 20
            WinSet, Transparent, % A_Index * 26, ahk_ID %player%		; player fade up
            }
        WinSet, Transparent, 0, ahk_group Browsers
        WinClose, ahk_ID %video_player%
        video_player := player
        Gui, pic: Cancel
        if caption
            {
            WinSet, TransColor, 0 0
            GuiControl, Caption:, GuiCap, % caption
            x := A_ScreenWidth * 0.38
            y := A_ScreenHeight * 0.82
            Gui, Caption:Show, x%x%  y%y%, NA
            loop 10
                {
                sleep 30
                mask := A_Index * 12 
                WinSet, TransColor, 0 %mask%
                }
            }
        if (media == "video")
          IfExist %inca%\cache\1.jpg						; create video thumbnails
            {
            Gui, thumbsheet: Destroy
            Gui, thumbsheet: +lastfound -Caption +ToolWindow +AlwaysOnTop
            Gui, thumbsheet: Color,black
            W := Round(A_ScreenWidth/16)
            H := Round(A_ScreenHeight/16)
            Loop 36
                {
                X := Mod((A_Index-1) * W, 6 * W)
                Y := (A_Index-1) // 6 * H
                Z := A_Index * 5
                Gui, thumbsheet: Add, Picture, x%X% y%Y% w%W% h%H%, %inca%\cache\%Z%.jpg
                }
            }
        GuiControl, Indexer:, GuiInd, %media_name%
        Gui, thumbsheet: hide
        if (click == "MButton" && media == "video")
            {
            active = 2
            Gui, thumbsheet: show
            block_input := A_TickCount + 1200
            }
        refresh = 1
        seek =
        }


    ClosePlayer()
        {
        Critical
        click =
        Gui, pic: Cancel
        Gui, Caption: Cancel
        Gui, settings: Cancel
        Gui, ProgressBar:Cancel
        GuiControl, Indexer:, GuiInd
        FileDelete, %inca%\cache\*.jpg
        if !(InStr(media_path, "\favorites\- snips") || InStr(spool_path, "\slides") || ext == "lnk")
            {
            FileCreateShortcut, %sourcefile%, %inca%\history\all history\%media_name%.lnk
            if (history_timer / 10 > Setting("History Timer") && media != "audio")
                FileCreateShortcut, %sourcefile%, %inca%\history\%media_name%.lnk
            }
        if video_player
          loop 50
            {
            ControlSend,, l, ahk_ID %video_player%			; zoom player in
            mask := 256 - (A_Index * 6)
            Gui, thumbsheet:+lastfound					; set thumbsheet active
            WinSet, Transparent, % mask					; transition thumbsheet out
            WinSet, Transparent, % mask, ahk_ID %video_player%		; transition mpv out
            WinSet, Transparent, % A_Index * 6, ahk_group Browsers	; transition browser in
            if (video_sound && volume > 1)
                SoundSet, volume -= 0.5
            if (A_Index == 47)						; allow time for Win ID to release
                WInClose, ahk_ID %video_player%
            loop 120000
                x =
            }
        Gui, thumbsheet: Hide
        WinActivate, ahk_group Browsers
        MouseMove, % xpos + 1, % ypos + 1, 0				; to reset cursor
        media =
        slide =
        active =
        skinny =
        paused =
        seeking =
        history_timer =
        if (video_sound && music_player)
            FlipSound(999)
        video_sound := 0
        video_player =
        }


    CloseMusic()
        {
        WinClose, ahk_ID %music_player%
        music_player =
        sleep 100
        song_id =
        song =
        }


    FlipSound(change)						; between music & video player
        {
        SoundSet, 0
        song_timer =
        if (change > 0)
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
            paused = 
            video_speed := 0
            ControlSend,, 2, ahk_ID %music_player%		; pause music
            ControlSend,, 4, ahk_ID %music_player%		; mute music
            ControlSend,, 1, ahk_ID %video_player%		; un pause video
            ControlSend,, 3, ahk_ID %video_player%		; un mute video
            ControlSend,, {BS}, ahk_ID %video_player%		; reset video speed
            }
        if ((video_player || music_player) && change == 999)	; fade volume up a little
            {
            vol_ref := Setting("Default Volume")
            volume := vol_ref
            SoundSet, vol_ref
            }
        }


    VolUp:
       if (volume >= vol_ref || (volume > 5 && GetKeyState("RButton", "P")))
           return
       SoundSet, (volume += 0.5)
       SetTimer, VolUp, -20
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
                    speed := video_speed -= 2
                if (direction < 0)
                    speed := video_speed += 2
                video_speed := speed
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
            if (Abs(skinny) > 3 && Abs(skinny) < 64)
                {
                FileAppend, %skinny%, %inca%\cache\widths\%media_name%.txt
                refresh = 1
                }
            }
        sleep 10
        }


    BrowserMagnify(direction)
        {
        WinGet, state, MinMax, ahk_group Browsers
        if (state > -1 && xpos < 100)
            {
            WinActivate, ahk_group Browsers
            if (direction < -6)
                send, ^{-}
            else  if (direction > 6)
                send, ^{+}
            sleep 100
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
        gui, settings:add, text, x180 yp+76, folders and search terms
        gui, settings:add, edit, x180 yp+13 h146 w500 vsearch_list, %search_list%
        gui, settings:add, text, x180 yp+154, folders to search
        gui, settings:add, edit, x180 yp+13 h18 w500 vsearch_folders, %search_folders%
        gui, settings:add, text, x180 yp+26, folders to index
        gui, settings:add, edit, x180 yp+13 h32 w500 vindexed_folders, %indexed_folders%
        gui, settings:add, text, x180 yp+39, context menu
        gui, settings:add, edit, x180 yp+13 h44 w500 vcontext_menu, %context_menu%
        gui, settings:add, button, x20 y450 w60, Compile
        gui, settings:add, button, x90 y450 w60, Source
        gui, settings:add, button, x270 y450 w80, Purge Cache
        gui, settings:add, button, x360 y450 w70, Help
        gui, settings:add, button, x440 y450 w70, Cancel
        gui, settings:add, button, x520 y450 w70 default, Save
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
        loop 20
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
         MouseMove, % xpos + 1, % ypos + 1, 0		; to reset cursor
        }


    AddFavorites()					; and create 10 second snips
        {
        if !DetectMedia()
            return
        if active
            ThumbSeekTime()
        if !seek
            seek := seek_time
        popup = Favorite
        if (media != "Document")
            FileCreateShortcut, %sourcefile%, %inca%\favorites\%media_name%.lnk
        if (media == "video" && duration > 30 && !InStr(sourcefile, "\favorites"))
              Loop 10
                IfNotExist, %inca%\favorites\- snips\%media_name% - %A_Index%.mp4
                    {
                    popup = Snip %A_Index%
                    if (A_Index < 10)
                        {
                        favorite = %inca%\favorites\- snips\%media_name% - %A_Index%
                        run, %inca%\apps\ffmpeg.exe -ss %seek% -t 10 -i "%sourcefile%" -c:v libx264 -x264opts keyint=3 -vf scale=1280:-2 -y "%favorite%.mp4",,Hide
                        }
                    else popup = full
                    refresh = 1
                    break
                    }
        if !slide
            x = %inca%\slides\-  New Slide.m3u
        else x := slide
        if favorite
            FileAppend, %favorite%.mp4|%seek%|%caption%`r`n,%x%, UTF-8
        else
            FileAppend, %sourcefile%|%seek%|%caption%`r`n,%x%, UTF-8
        PopUp(popup,700,video_player)
        return
        }


    ShowStatus()
        {
        FormatTime, time,, h : mm
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
        if video_player
            seek_t := Round(seek_time,1)
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
                WinSet, transparent, %mask%
            mask2 := 255 - mask
            WinSet, TransColor, 0 %mask2%
            }
        }


    PurgeCache()
        {
        Loop, Files, %inca%\favorites\*.lnk, FR
            if !CheckLink(A_LoopFileFullPath)
                FileRecycle, %A_LoopFileFullPath%
        Loop, Files, %inca%\history\*.lnk, FR
            if !CheckLink(A_LoopFileFullPath)
                FileRecycle, %A_LoopFileFullPath%
        folders := indexed_folders
        Loop, Parse, folder_list, `|
            if !InStr(folders, A_LoopField)					; combine lists
               folders = %folders%|%A_LoopField%
        Loop, Parse, folders, `|						; remove self folder if exist
            if InStr(A_LoopField, "thumbs")
                StringReplace, folders, folders, |%A_LoopField%
        Loop, Files, %inca%\cache\thumbs\*.mp4, F				; remove orphan thumbnails
            if !Found(folders)
                FileRecycle, %inca%\cache\thumbs\%A_LoopFileName%
        Loop, Files, %inca%\cache\durations\*.txt, F				; remove orphan durations
            if !Found(folders)
                FileRecycle, %inca%\cache\durations\%A_LoopFileName%
        GuiControl, Indexer:, GuiInd 
        }


    CheckLink(input)
        {
        GuiControl, Indexer:, GuiInd, %A_LoopFileDir%
        FileGetShortcut, %input%, link_file
        IfExist, %link_file%
            return 1
        SplitPath, link_file,,,ex,filen
        Loop, Parse, indexed_folders, `|				; search for file
            IfExist, %A_LoopField%\%filen%.*				; and make sure link date matches file date
                {
                FileCreateShortcut, %A_LoopField%\%filen%.%ex%, %inca%\cache\%filen%.lnk
                runwait, %COMSPEC% /c %inca%\apps\touch.exe -r "%input%" "%inca%\cache\%filen%.lnk",,hide
                FileMove, %inca%\cache\%filen%.lnk, %input%, 1
                return 1
                }
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
            StringLower ex, ex
            if InStr(fol, "Thumbs")
              continue
            if (DecodeExt(ex) == "video" && ex != "gif")
              {
              dur =
              FileRead, dur, %inca%\cache\durations\%filen%.txt
              if !dur
                {
                x = %fol%\%Filen%.%ex%
                FileMove, %x%, %x%
                if ErrorLevel						; file open or still downloading
                    continue
                filedelete, %inca%\cache\durations\%filen%.txt
                if !(dur := GetDuration(source))
                    continue
                FileAppend, %dur%, %inca%\cache\durations\%filen%.txt
                }
              IfNotExist, %inca%\cache\thumbs\%filen%.mp4
                {
                if (dur < 20 && (ex == "mp4" || ex == "webm"))		; browser can preview instead
                    continue
                GuiControl, Indexer:, GuiInd, indexing - %j_folder% - %filen%
                FileCreateDir, %inca%\temp
                t := 0
                if (dur > 60)
                  {
                  t := 20	      					; skip any video intro banners
                  dur -= 20
                  }
                loop 200							; 36 video frames in thumb preview
                  {
                  runwait, %inca%\apps\ffmpeg.exe -ss %t% -i "%source%" -y -vf scale=480:-2 -vframes 1 "%inca%\temp\%A_Index%.jpg",, Hide
                  t += (dur / 200)
                  }
                runwait, %inca%\apps\ffmpeg.exe -i "%inca%\temp\`%d.jpg" -c:v libx264 -x264opts keyint=1:scenecut=-1 -y "%inca%\cache\thumbs\%filen%.mp4",, Hide
                filen2 := StrReplace(filen, "#" , ".")			; html cannot have # in file name 
                if InStr(filen, "#")
                    FileCopy, %inca%\cache\thumbs\%filen%.mp4, %inca%\cache\thumbs\%filen2%.mp4, 1
                }
              }
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
        Menu, slides, Add, - , ContextMenu
        Menu, slides, DeleteAll, , ContextMenu
        Menu, slides, Add, -  New Slide, ContextMenu
        Loop, Files, %inca%\slides\*.m3u
            {
            StringTrimRight, entry, A_LoopFileName, 4
            Menu, slides, Add, %entry%, ContextMenu
            }
        Menu, ContextMenu, Add, All, ContextMenu
        Menu, ContextMenu, Add, Folders, :Folders
        Menu, ContextMenu, Add, slides, :slides
        Menu, ContextMenu, Add, Edit, ContextMenu
        Menu, ContextMenu, Add, Rename, ContextMenu
        Menu, ContextMenu, Add, Delete, ContextMenu
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
        ix := A_ScreenWidth * 0.2
        Gui, Caption:Add, Text, vGuiCap w%ix% h%ix% +Wrap
        Gui, Caption:Font, s16 cWhite, Segoe UI
        GuiControl, Caption:Font, GuiCap
        Gui Status:+lastfound +AlwaysOnTop -Caption +ToolWindow
        Gui Status:Color, Black
        ix := Round(A_ScreenWidth * 0.3)
        Gui Status:Add, Text, vGuiSta w%ix% h35
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
        ix := A_screenWidth * 0.3
        iy := A_ScreenHeight * 0.96
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

