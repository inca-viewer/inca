

	; Browser Based File Explorer - Windows
	; generates web pages of your media
	; browser messages back using java via clipboard - see ProcessMessage()


	#NoEnv
	#UseHook, On
        #MaxMem, 4095
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
        Global incaTab				; browser tab title (usually folder name)
        Global volume
        Global page := 1			; current page within list
        Global sort				; eg by date, dur, shuffle, size, alpha, ext...
	Global filt := 0			; secondary search filter eg. date, duration, Alpha letter
        Global click				; mouse click type
        Global timer				; click down timer
        Global listView := 0			; list or thumb view
        Global volRef := 2
        Global wheel
        Global playlist				; playlist - full path
	Global xpos				; current mouse position - 100mS updated 
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
        Global lastClip				; preserve clipboard
        Global allFav				; all favorite shortcuts consolidated
        Global showSubs
        Global lastMedia
        Global panelPath			; click over top panel (folder/search paths)
        Global lastStatus			; reduce screen update flicker
        Global mediaX := 1200			; centre of mpv player window
        Global mediaY := 800
        Global mpvWidth := 640
        Global mpvHeight := 480
        Global mpvPID
        Global cur				; window under cursor
        Global desk				; current desktop window
        Global indexSelected			; html media page to index (create thumbs)


    main:
      initialize()				; sets environment then waits for mouse, key or clipboard events
      WinActivate, ahk_group Browsers
      sleep 24
      if !GetBrowser()
        Clipboard = #Path###%profile%\Pictures\
      Clipboard()				; process clipboard message
      SetTimer, TimedEvents, 100, 2		; every 100mS
      return


    SpoolList(i, j, input, sort_name, start)				; spool sorted media files into web page
        {
        Critical
        poster =
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
        if (dur && !playlist)						; calc. 1st thumbnail start time
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
          if InStr(allFav, src)
            favicon = &#x2764						; favorite heart symbol
        if !start
          start = 0.0
        if (type == "video")
          IfExist, %inca%\cache\posters\%media% %start%.jpg		; replace poster with fav poster
            thumb = %inca%\cache\posters\%media% %start%.jpg
          else thumb =  %inca%\cache\posters\%media%.jpg
        if (type == "video" && folder == "History")
          thumb = %inca%\cache\temp\history\%media% %start%.jpg
        FileGetSize, size, %src%, K
        if (type == "video")
          size := Ceil(size/1000)
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
 ;  stringlower, thumb, thumb
          poster = poster="file:///%thumb%"
          }
        else
          noIndex = <span style='color:red'>no index</span>`n 
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
              str = %A_LoopField%					; remove whitespace
              if InStr(str, "-->")					; timestamp element
                {
                x := SubStr(str, 1, 12)
                x := StrReplace(x, " --")				; in case no hrs in timestamp
                x := StrReplace(x, ",", ".")
                x := StrSplit(x, ":")
                if (!x.3)
                  x := Round(x.1*60 + x.2,1)				; seconds format
                else x := Round(3600*x.1 + 60*x.2 + x.3,1)
                text = %text%<d id="%j%-%x%">%str%</d>
                timestamp = true
                continue
                }
              else if timestamp
                text = %text%<e contenteditable="true" id="my%j%-%x%">%str%</e>
              timestamp =
              }
            }
        if (ext=="txt")
          {
          text := StrReplace(text, "`r`n", "<br>")
          text = <e contenteditable="true">%text%</e>
          }

if (text && favicon)
  favicon = %favicon% &#169						; add caption icon
else if text
  favicon = &#160 &#160 &#169

if (type=="image")
  src =
else src=src="file:///%src%"
if !size
  size = 0								; cannot have null size in getParameters()

caption = <div id='srt%j%' class='caption' onmouseover='overText=1' onmouseout='overText=0'`n oninput="editing=index; myPlayer.pause()">%text%</div>

if listView
  mediaList = %mediaList%%fold%<table onmouseover='overThumb(%j%)'`n onmouseout="thumb%j%.style.opacity=0">`n <tr id='entry%j%' data-params='%type%,%start%,%dur%,%size%' onmouseenter='if (gesture) sel(%j%)'>`n <td style='min-width: 2em'>%j%</td>`n <td>%ext%`n <video id='thumb%j%' class='thumb2' %src%`n %poster%`n preload=%preload% muted loop type="video/mp4"></video></td>`n <td>%size%</td>`n <td style='min-width: 6em'>%durT%</td>`n <td>%date%</td>`n <td id='myFavicon%j%' style='font-size: 0.7em; color: salmon; min-width: 3em'>%favicon%</td>`n <td style='width: 70vw'><input id="title%j%" class='title' style='transition: 0.8s' onmouseover='overText=1' onmouseout='overText=0; Click=0' type='search' value='%media_s%'`n oninput="renamebox=this.value; lastMedia=%j%"></td>`n %fo%</tr>`n %caption%<span id='cues%j%' style='display: none'>%cues%</span></table>`n`n

else mediaList = %mediaList%<div id="entry%j%" class='entry' data-params='%type%,%start%,%dur%,%size%'>`n <span id='myFavicon%j%' style='display: block; position: absolute; top: 7px; left: -5px; font-size: 0.7em; color: salmon' onmouseenter='overThumb(%j%)'>%favicon%</span>`n <input id='title%j%' class='title' style='text-align: center' type='search'`n value='%media_s%'`n oninput="renamebox=this.value; lastMedia=%j%"`n onmouseover="overText=1; if((x=this.value.length/2) > view) this.style.width=x+'em'"`n onmouseout="overText=0; this.style.width='100`%'">`n <video id="thumb%j%" class='thumb' onmouseenter="overThumb(%j%); if (gesture) sel(%j%)"`n onmouseup='if(gesture)getParameters(%j%)' onmouseout='this.pause()' %src%`n %poster%`n preload=%preload% loop muted type='video/mp4'></video>%noIndex%`n
<span id='cues%j%' style='display: none'>%cues%</span></div>`n %caption%`n`n
}
 

    RenderPage(reset)							; construct web page from media list
        {
        Critical							; stop pause key & timer interrupts
        if !path
          return
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
        FileRead, java, %inca%\java.js
        FileRead, ini, %inca%\ini.ini
        ini := StrReplace(ini, "`r`n", "|")				; java cannot accept cr in strings
        ini := StrReplace(ini, "'", ">")				; java cannot accept ' in strings
        max_height := Floor(A_ScreenHeight * 0.34)			; max image height in web page
        menu_item =
        count:=0
        listSize := 0
        type = video							; prime for list parsing
        page_s := Setting("Page Size")
  ;      if (playlist || SearchTerm || listView)
  ;      page_s := 600
        if !reset
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
        Loop, Parse, sortList, `|					; html ribbon highlighting
          {
          if InStr(A_LoopField, sort)
            if InStr(toggles, "Reverse")
              x%A_Index% = border-top:0.1px solid pink
            else x%A_Index% = border-bottom:0.1px solid pink
          if InStr(toggles, A_LoopField)
            x%A_Index% = color:red
          }
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
        if searchTerm						; on load scroll top panel to search letter eg 'M'
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
  subs = ^
StringReplace, folder_s, folder, `', &apos, All				; htm cannot pass '

header = <!--, %page%, %pages%, %sort%, %toggles%, %listView%, %playlist%, %path%, %searchPath%, %searchTerm%, %subfolders%, -->`n<!doctype html>`n<html>`n<head>`n<meta charset="UTF-8">`n<title>Inca - %title%</title>`n<meta name="viewport" content="width=device-width, initial-scale=1">`n<link rel="icon" type="image/x-icon" href="file:///%inca%\cache\icons\inca.ico">`n<link rel="stylesheet" type="text/css" href="file:///%inca%/css.css">`n</head>`n`n

body = <body id='myBody' class='myBody' onload="myBody.style.opacity=1; globals(%page%, %pages%, '%folder_s%', '%toggles%', '%sort%', %filt%, %listView%, '%selected%', '%playlist%', %index%); %scroll%.scrollIntoView()">`n`n

<div oncontextmenu="if (yw>0.08) {event.preventDefault()}">`n
<div id='myNav' class='context' onwheel='wheelEvent(event, id, this)'>`n
<a onmouseup="inca('Settings')">&#8230;</a>`n
<a id='mySelect' style='word-spacing:0.8em' onmouseup="if(!longClick && lastClick==1) {if (myTitle.value) {sel(index)} else selectAll()}"></a>`n
<input id='myTitle' class='title' style='color:lightsalmon; padding-left:1.2em'>`n
<video id='myPic' muted class='pic'></video>`n
<a id='myMute' onmouseup='mute()'>Mute</a>`n
<a id='myFavorite' onmouseup='addFavorite()'>Fav</a>`n
<a id='mySpeed'></a>`n
<a id='mySkinny'></a>`n
<a id='myFlip' onmouseup='flip()'>Flip</a>`n
<a id='myLoop' onmouseup='if(looping) {looping=0} else looping=1'>Loop</a>`n
<a id='myIndex' onmouseup="if(myTitle.value) {inca('Index','',index)} else inca('Index','',0)">Index</a>`n
<a id='myDelete' onmouseup="if(!event.button) inca('Delete','',index)">Delete</a>
<a id='myCue' onmouseup="cueButton()">Cue</a>`n
<a id='myCap' onmouseup='capButton()'>Caption</a>`n
<a id='Mp3' onmouseup="inca('mp3', myPlayer.currentTime.toFixed(2), index, cue); cue=0; myNav.style.display=null">mp3</a>`n
<a id='Mp4' onmouseup="inca('mp4', myPlayer.currentTime.toFixed(2), index, cue); cue=0; myNav.style.display=null">mp4</a>`n
<a></a></div>`n`n

<div id='myMask' class="mask" onwheel="wheelEvent(event, id, this)"></div>`n 
<video id="myPlayer" class='player' type="video/mp4" muted onwheel="wheelEvent(event, id, this)"></video>`n
<span id='myProgress' class='seekbar'></span>`n
<span id='mySeekbar' class='seekbar'></span>`n
<span id='mySelected' class='selected'></span>`n
<div id='capMenu' class='capMenu'>`n
<span id='myCancel' class='capButton' onmouseup="editing=0; inca('Reload',index)">&#x2715;</span>`n 
<span id='myBack' class='capButton' style='font-weight:bold'>&#x2212</span>`n 
<span id='myForward' class='capButton' style='font-weight:bold'>&#xFF0B</span>`n
<span id='mySave' class='capButton' onmouseup="if (!longClick) inca('Null')">Save</span></div>`n`n

<div id='myContent' class='mycontent'>`n
<div id='myView' class='myview'>`n`n %mediaList%</div>`n`n

<div id='myMask2' style='position:fixed; pointer-events:none; height:16em; width:99.7`%; background:#15110a; top:0'></div>`n
<div id='myMenu' class='myMenu'>
<div id='myPanel' class='myPanel'>`n <div id='panel' class='panel'>`n`n%panelList%`n</div></div>`n`n

<div id='myRibbon' class='ribbon' style='width:85`%; height:1.4em; font-size:1.1em'>`n
<a style='width:12em; color:red; font-weight:bold'>%listSize%</a>`n
<a id='myMusic' style='width:6em; %x22%' onmousedown="inca('Path','','','music|1')" onmouseover="setTimeout(function() {if(myMusic.matches(':hover'))Music.scrollIntoView()},200)">&#x266B;</a>`n
<a id='mySub' style='width:2em; color:red' onmouseover="setTimeout(function() {if(mySub.matches(':hover'))Sub.scrollIntoView()},200)">%subs%</a>`n
<a id='myFol' style='width:8.5em; %x21%' onmousedown="inca('Path','','','fol|1')" onmouseover="setTimeout(function() {if(myFol.matches(':hover'))Fol.scrollIntoView()},200)">&#x1F4BB;&#xFE0E;</a>`n
<a id='myFav' style='width:8.5em; %x23%' onmousedown="inca('Path','','','fav|1')" onmouseover="setTimeout(function() {if(myFav.matches(':hover'))Fav.scrollIntoView()},200)">&#10084;</a>`n
<a id='mySearch' style='width:3em; padding-left:1em; %x20%' onwheel="wheelEvent(event, id, this)" onmousedown="inca('SearchBox','','',myInput.value)" onmouseover="setTimeout(function() {if(mySearch.matches(':hover'))Filter(id)},140)">&#x1F50D;&#xFE0E;</a>`n
<a id='Add' style='width:6em; font-size:0.8em; font-variant-caps:petite-caps' onmousedown="inca('Add','','',myInput.value)">%add%</a>`n
<input id='myInput' class='searchbox' type='search' value='%st%' onmouseover="overText=1; this.focus(); if(!Add.innerHTML) {this.value=''; this.value='%lastSearch%'}" oninput="Add.innerHTML='Add'" onmouseout='overText=0'>
<a id="myPage" style='width:12em' onmousedown="inca('Page', page)" onwheel="wheelEvent(event, id, this)">%pg%</a>
</div>`n`n

<div id='myRibbon1' class='ribbon' style='background:#1b1814'>`n
<a id='myType' style='%x6%' onmousedown="inca('Type')">Type</a>`n
<a id='mySize' style='%x5%' onmousedown="inca('Size', filt)" onwheel="wheelEvent(event, id, this)">Size</a>`n
<a id='myDuration' style='%x3%' onmousedown="inca('Duration', filt)" onwheel="wheelEvent(event, id, this)"> Duration</a>`n
<a id='myDate' style='%x4%' onmousedown="inca('Date', filt)" onwheel="wheelEvent(event, id, this)">Date</a>`n
<a id='myAlpha' style='min-width:3em; %x2%' onmousedown="inca('Alpha', filt)" onwheel="wheelEvent(event,id,this)">Alpha</a>`n
<a id='myPlaylist' style='width:11`%; %x11%' onmousedown="inca('Playlist')">%pl%</a>`n
<a id='myShuffle' style='width:11`%; %x1%' onmousedown="inca('Shuffle')">Shuffle</a>`n
<a style='%x12%' onmousedown="inca('Pause')">Pause</a>`n
<a style='%x10%' onmousedown="inca('Images')">Pics</a>`n
<a style='%x9%' onmousedown="inca('Videos')">Vids</a>`n
<a style='%x8%' onmousedown="inca('Recurse')">Subs</a>`n
<a id='myThumbs' onmouseout='setThumbs(1,1000)' onmouseup="inca('View',0)" onwheel="wheelEvent(event, id)"></a>`n 
<a id='myWidth' onwheel="wheelEvent(event, id)"></a>`n
<a style='%x13%' onmousedown="inca('Mpv')">Mpv</a>`n
<a id='myJoin' onmousedown="inca('Join')">Join</a>`n
</div>`n`n

<div style='position:relative; width:100vw; height:0.6em'></div>
<div class='fadeout'></div>`n`n 

      StringReplace, header, header, \, /, All
      StringReplace, body, body, \, /, All
      html = %header%%body%</div></div>`n<script>%java%</script>`n</body>`n</html>`n
      FileDelete, %inca%\cache\html\%folder%.htm
      FileAppend, %html%, %inca%\cache\html\%folder%.htm, UTF-8
      new_html = file:///%inca%\cache\html\%folder%.htm			; create / update browser tab
      StringReplace, new_html, new_html, \,/, All
      clip:= clipboard
      clipboard := new_html
      IfWinNotExist, ahk_group Browsers
        run, %new_html%							; open a new web tab
      else if (folder == incaTab)					; just refresh existing tab
        send, {F5}
      else if !incaTab
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
      if fullscreen
        send, {F11}
      fullscreen := 0
      Loop, 30								; wait until page loaded
        {
        WinGetTitle, title, A
        If InStr(title, incaTab)
          break
        Sleep, 100
        }
      PopUp("",0,0,0)
      }


    fill(in) {  
      panelList = %panelList%<div style="height:10`%; padding:0.5em; transform:rotate(90deg)">`n%in%</div>`n
      }


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
        WinActivate, ahk_group Browsers
        }
      return

    ~WheelUp::
      wheel := 0
    ~WheelDown::
      if !wheel
        wheel := 1
      if mpvPID
        if (wheel) 				; mpv seek
          send, 3
        else send, 2
      wheel := 0
      return

    Xbutton1::					; mouse "back" button
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
    Xbutton1 up::
      SetTimer, Timer_up, Off
      if (A_TickCount > timer)
        return
      WinGet, state, MinMax, ahk_class OSKMainClass
      if mpvPID					; mpv external player
        {
        Process, Close, mpv.exe
        sleep, 100
        send, {Pause}				; close java media player
        }
      else if (state > -1)
        WinClose, ahk_class OSKMainClass	; close onscreen keyboard
      else if WinActive("ahk_class Notepad")
        Send, {Esc}^s^w
      else if incaTab
        send, {Pause}				; close java media player
      else send, {Xbutton1}
      sleep 100
      MouseGetPos,,, cur 			; get window under cursor
      WinActivate, ahk_id %cur%
      return


    MouseDown()
      {
      Critical					; pause timed events
      gesture := 0
      longClick =
      wasCursor := A_Cursor
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
          if (xpos > A_ScreenWidth - 15 && click=="RButton")
            xpos := A_ScreenWidth - 15
          MouseMove, % xpos, % ypos, 0
          Gesture(x, y)
          }
         if (!gesture && longClick && click=="RButton")
            {
            if mpvPID 
              RunWait %COMSPEC% /c echo seek 0 absolute exact > \\.\pipe\mpv,, hide && exit
            else send, +{Pause}			; signal to java long RClick
            gesture := 1			; just to block re-entry
            }
        if (!gesture && longClick && click=="LButton")		; click timout
          {
          if mpvPID				; mpv external player
            {
            Process, Close, mpv.exe
            send, !{Pause}			; signal java to show thumbSheet
            }
          else if (wasCursor == "IBeam")
            {
            longClick =
            if WinActive("ahk_group Browsers")
              {
              clp := Clipboard
              Clipboard =
              send, ^c
              ClipWait, 0.1
              send, {Lbutton up}
              if StrLen(ClipBoard) > 2
                {
                PopUp(ClipBoard,0,0,0)
                if !incaTab			; include current path in search 
                  path =
                value =
                incaTab =			; force new tab
                searchTerm =
                command = SearchBox		; search from selected text
                address := RegExReplace(Clipboard, "[\r\n\t\v\f]", " ")  	; Remove control chars
                ProcessMessage()
                CreateList(1)
                }
              else Osk()
              Clipboard := clp
              }
            else Osk()
            }
          break
          }
        }
      }


    Osk() {
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


    Clipboard()								; check for messages from browser
        {
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
        messages := StrReplace(Clipboard, "/", "\")
        array := StrSplit(messages,"#")
        Clipboard := lastClip
;   tooltip %messages%							; for debug
        Loop % array.MaxIndex()/4
          {
          command := array[ptr+=1]
          value := array[ptr+=1]
          value := StrReplace(value, "*", "#")
          selected := array[ptr+=1]
          address := array[ptr+=1]
          if selected
            getMedia(StrSplit(selected, ",").1)
          if !command
            continue
          else ProcessMessage()
 if (command != "Skinny" && command != "Rate" && command != "capEdit" && command != "History" && command != "Scroll")
            break
          }
        if (reload == 1)
          CreateList(1)
        if (reload == 2)
          RenderPage(0)
        if (reload == 3)
          CreateList(0)
        longClick =
        selected = 
        PopUp("",0,0,0)
        sleep 100
        if (command == "Settings" || command == "editCue" || command == "Media" && type=="document")
          IfWinExist, ahk_class Notepad
            WinActivate, ahk_class Notepad
        }


    ProcessMessage()							; messages from java/browser
        {
        if (command == "Reload")					; reload web page
            {
            selected =
            index := value
            reload := 2
            }
        if (command == "Null")						; used as trigger to save text editing - see Java inca()
          return
        if (command == "Settings")					; open inca source folder
            {
            Run, %inca%\
            sleep 400
            Winactivate, ahk_class CabinetWClass
            }
        if (command == "Scroll")					; update scroll, width, height
            {
            FileRead, cues, %inca%\cache\cues\%media%.txt
            if cues
              Loop, Parse, cues, `n, `r					; each line of cues
                if A_LoopField
                  if !InStr(A_LoopField, "0.00|scroll")			; remember text scroll position
                    newCue = %newCue%%A_LoopField%`r`n
            FileDelete, %inca%\cache\cues\%media%.txt
            FileAppend, %newCue%0.00|scroll|%value%`r`n, %inca%\cache\cues\%media%.txt, UTF-8
            }
        if (command == "saveText")					; save text snip
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
            Popup("Saved . . .",900,0,0)
          return
          }
        if (command == "cueMedia" && value)				; add media to text at scroll
            {
            FileDelete, %inca%\cache\cues\%media%.txt
            FileAppend, %value%, %inca%\cache\cues\%media%.txt, UTF-8
            }
        if (command == "addCue")					; add skinny, speed, goto at scroll
            {
            FileAppend, %value%`r`n, %inca%\cache\cues\%media%.txt, UTF-8
            selected =
            reload := 2
            }
        if (command == "capEdit")					; save browser text editing
            {
            if !address
              return
            getMedia(selected)
            if (ext == "txt")
              {
              address := StrReplace(address, "<div><br><\div>","`r`n")
              address := StrReplace(address, "<div>", "`r`n")
              }
            else address := StrReplace(address, "<br>")
            address := StrReplace(address, "<\e>", "`r`n")		; e is text element - note: / is reversed in Clipboard()
            address := StrReplace(address, "<div><br><\div>")
            address := StrReplace(address, "<\d>", "`r`n")		; d is timestamp element
            address := StrReplace(address, "<br>", "`r`n")
            address := StrReplace(address, "-->", "--&gt;")		; so "<.*?>" can clear out injected html
            address := RegExReplace(address, "<.*?>")			; remove everything between <>
            address := StrReplace(address, "&gt;", ">")			; return tag back to >
            address := StrReplace(address, "&nbsp;", " ")
            if (ext == "txt") 
              {
              FileDelete, %src%
              FileAppend, %address%, %src%, UTF-8
              }
            else
              {
              address := StrReplace(address, "`r`n`r`n", "`r`n")
              address := StrReplace(address, "`r`n`r`n", "`r`n")
              str =
              time =
              ix := 0
              Loop, Parse, address, `n, `r				; convert vtt back to srt format
                {
                if !A_LoopField
                  continue
                if InStr(A_LoopField, " --> ")
                  time = %A_LoopField%
                else if (time && A_LoopField)
                  {
                  ix++
                  str = %str%%ix%`r`n%time%`r`n%A_LoopField%`r`n`r`n
                  time =
                  }
                }         
              FileDelete, %inca%\cache\captions\%media%.srt
              FileAppend, %str%, %inca%\cache\captions\%media%.srt, UTF-8
              }
            PopUp("saved",0,0,0)
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
            index := StrSplit(selected, ",").1
            reload := 3
            selected =
            }
        if (command == "Index")						; index folder (create thumbsheets)
            {
            indexSelected := selected
            selected =
            reload := 2
            SetTimer, indexPage, -100, -2
            }
        if (command == "History")					; maintain play history
            {
            if getMedia(StrSplit(selected, ",").1)
              if (!InStr(path, "\inca\music\") && folder != "History")
                {
                FileAppend, %src%|%value%`r`n, %inca%\fav\History.m3u, UTF-8
                if (type == "audio" || type == "video")
                  Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\temp\history\%media%%A_Space%%value%.jpg",, Hide
                }
            lastMedia := src
            }
        if (command == "closeMpv")					; close external mpv player
            if mpvPID
              Process, Close, mpv.exe
        if (command == "Media")						; browser tells inca to use mpv player
            {
            id := StrSplit(selected, ",").1
            if !getMedia(id)
              return
            mpvid := id-1
            if (mpvWidth > mpvHeight)
              z := mpvWidth
            else z := mpvHeight
            autofit = --autofit=%z%x%z%
            start := Round(StrSplit(address,"|").1,2)
            skinny := Round(StrSplit(address,"|").2,2)
            rate := Round(StrSplit(address,"|").3,2)
            if (skinny < 0)
            flip := "--vf=hflip"
            else flip =
            skinny := Abs(skinny)
            if (type != "audio")
              mute := 1*StrSplit(address,"|").4
            if (!skinny || skinny != 1)
              skinny := -1*(1-skinny)
            else skinny =
            if (rate != 1)
              speed = --speed=%rate%
            else speed =
            if mute
              mute = yes
            else mute = no
            If InStr(toggles, "Pause")
              pause = --pause
            else pause =
            if !start
              start = 0.0
            start := Time(start)
            if (ext=="pdf" || ext=="rtf" || ext=="doc")
              Run, %src%
            else if (type=="m3u" || type=="document" || longClick)
                {
                if (type!="m3u" && type!="document")
                  ifExist, %inca%\cache\captions\%media%.srt
                    src=%inca%\cache\captions\%media%.srt
                Run, % "notepad.exe " . src
                }
            else
              {
              Loop, Parse, list, `n, `r
                {
                source := StrSplit(A_LoopField, "/").2
                IfExist, %source%
                plist = %plist%%source%`r`n
                }
              FileDelete, %inca%\cache\temp\mpvPlaylist.m3u
              FileAppend, %plist%, %inca%\cache\temp\mpvPlaylist.m3u, UTF-8
              if mpvPID							; mpv is open
                {
                RunWait %COMSPEC% /c echo playlist-play-index %mpvid% > \\.\pipe\mpv,, hide && exit
                sleep 24
                RunWait %COMSPEC% /c echo seek %start% absolute exact > \\.\pipe\mpv,, hide && exit
                }
              else Run %inca%\cache\apps\mpv --start=%start% %autofit% %speed% %pause% %flip% --mute=%mute% --playlist-start=%mpvid% --input-ipc-server=\\.\pipe\mpv "%inca%\cache\temp\mpvPlaylist.m3u"

              Loop, 20
                {
                WinSet, Transparent, 0, ahk_exe mpv.exe
                if WinActive, ahk_class mpv
                  break
                else sleep 20
                }
              WinActivate, ahk_class mpv

              if skinny
                RunWait %COMSPEC% /c echo add video-scale-x %skinny% > \\.\pipe\mpv,, hide && exit

              WinGetPos, x,y,mpvWidth,mpvHeight,ahk_class mpv
              x := mediaX - mpvWidth // 2
              y := mediaY - mpvHeight // 2
              WinMove, ahk_exe mpv.exe, , %x%, %y%
              Loop, 10							; fade into view
                {
                TransValue := A_Index * 25
                WinSet, Transparent, %TransValue%, ahk_exe mpv.exe
                Sleep, 10
                }
              WinSet, Transparent, Off, ahk_exe mpv.exe
              WinGetPos, x,y,mpvWidth,mpvHeight,ahk_class mpv
              }
            }
        if (command == "editCue")					; open media cues in notepad
            {
            if !selected
              return
            FileRead, cues, %inca%\cache\cues\%media%.txt
            if !cues
              {
              PopUp("no cues",600,0,0)
              return
              }
            StringTrimRight, cues, cues, 2				; remove end `r`n
            Sort, cues, NZ						; sort cues by time entry
            FileDelete, %inca%\cache\cues\%media%.txt
            if cues
              FileAppend, %cues%`r`n, %inca%\cache\cues\%media%.txt, UTF-8
            id := StrSplit(selected, ",").1
            if !value							; current media time
              value = 0.00
            if (!address)						; no cue time
              Run, %inca%\cache\cues\%media%.txt
            else 
              {
              FileAppend, %address%|goto|%value%`r`n, %inca%\cache\cues\%media%.txt, UTF-8
              Popup("Added . . .",1000,0,0)
              }
            }
        if (command == "mp3" || command == "mp4")
            {
            if (selected && !address)
              {
              Loop, Parse, selected, `,
                if getMedia(A_LoopField)
                  {
                  dest = %profile%\downloads\%media%.%command%
                  IfExist, %dest%
                    dest = %profile%\downloads\%media% - Copy.%command%
                  run, %inca%\cache\apps\ffmpeg.exe -i "%src%" -y "%dest%",,Hide
                  }
              }
            else if address						; cue point
              {
              x = @%value%						; suffix
              y = %profile%\downloads\%media% %x%.%command%
              if (!address || value == address || (value-address>0 && value-address<0.2))
                run, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" "%y%",,Hide
              else if (address-value>0.01 && address-value<0.2)
                run, %inca%\cache\apps\ffmpeg.exe -ss 0 -to %address% -i "%src%" "%y%",,Hide
              else if (address < value)
                run, %inca%\cache\apps\ffmpeg.exe -ss %address% -to %value% -i "%src%" "%y%",,Hide
              else run, %inca%\cache\apps\ffmpeg.exe -ss %value% -to %address% -i "%src%" "%y%",,Hide
              }
            GuiControl, Indexer:, GuiInd, processing - %media%
            selected =
            }
        if (command == "Favorite")					; add media favorite to New.m3u
            {
            if !selected
              return
            Loop, Parse, selected, `, 
              count := A_Index - 1
            if (!value || count > 1)					; value is media time
              value := 0						; if multiple favs added - set time 0
            value := Round(value, 1)
            Loop, Parse, selected, `,
              if getMedia(A_Loopfield)
                {
                FileAppend, %src%|%value%`r`n, %inca%\fav\new.m3u, UTF-8
                if (type == "audio" || type == "video")
                  Runwait, %inca%\cache\apps\ffmpeg.exe -ss %value% -i "%src%" -y -vf scale=1280:1280/dar -vframes 1 "%inca%\cache\posters\%media%%A_Space%%value%.jpg",, Hide
                }
            if address
              FileAppend, 0.0|scroll|%address%`r`n, %inca%\cache\cues\%media%.txt, UTF-8	; add scroll if srt text exists
            popup("Added - New",333,0,0)
            AllFav()							; update consolidated fav list
            selected =
            if (count > 1)
              reload := 2
            }
        if (command == "View")						; change thumb/list view
            {
            listView^=1
            index := value						; for scrollToIndex() in java
            reload := 2
            if (listView)
              Popup("List",0,0,0)
            else Popup("Thumbs",0,0,0)
            }
        if (command == "Delete")
            {
            if panelPath						; R Click was over top panel
              {
              reload := 2
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
              if !playlist
                {
                RenderPage(1)						; create null htm to release media files
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
                FileAppend, %cues%, %inca%\cache\cues\%media%.txt, UTF-8
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
                FileAppend, %cues%, %inca%\cache\cues\%media%.txt, UTF-8
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
        if (command=="Path"||command=="Search"||command=="SearchBox"||InStr(sortList, command))
            {
            x := StrSplit(address,"|").2				; pointer/index from html panel entry
            y := StrSplit(address,"|").1
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
                x := StrSplit(selected,",")
                index := x[x.MaxIndex()-1]				; scroll htm to end of selection
                MoveFiles()						; between folders or playlists
                selected =
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
                path := address
                IfNotExist, %path%
                  path := SubStr(path, 1, InStr(path, "\", False, -1))	; try one folder back
                IfNotExist, %path%
                  {
                  PopUp("Folder Not Found",600,0,0)
                  return
                  }
		str := StrSplit(path,"\")				; cannot use splitPath
		folder := str[str.MaxIndex()-1]				; in case folder has .com in name
                }
              GetTabSettings(0)						; load previous tab basic settings from cache
              searchTerm =
              searchPath =
              filt := 0
              PopUp(folder,0,0,0)
              }
            if (command == "Search" || command == "SearchBox")
              {
              value := 0						; remove filt/index scroll variable
              playlist =
              if (command == "SearchBox")
                if longClick
                  address := StrReplace(address, " ", "+")
                else address := StrReplace(address, "+", " ")
              if (strlen(address) < 2)
                return
              searchTerm = %address%
              lastSearch = %address%
              PopUp(searchTerm,0,0,0)
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
            if (fullscreen && folder != incaTab)
              send, {F11}
            page := 1
            if value is not number
              value := 0
            if (command != "Images" && command != "videos" && command != "Recurse" && command != "Pause" && command != "Mpv")
              if (InStr(sortList, command) && sort != command)		; changed sort column
                {
                StringReplace, toggles, toggles, Reverse		; clear reverse
                if (value == filt)
                  filt := 0						; clear filter
                else filt := value					; or adopt new filt (if applied)
                sort := command
                return
                }

            if (command != "Path")					; 'Path' uses 'value' for scroll index instead of filt
              {
              if (filt != value && value != searchTerm)			; new filter value only
                filt := value
              else if (InStr(sortList, command))			; sort filter
                {
                if (command=="Pause")
                  reload := 2
                toggle_list = Reverse Recurse Videos Images Pause Mpv
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
                if (StrLen(toggles) < 3)
                    toggles =
                }
              }
            }
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
               else if (show==1 && ((listSize<10000 && !Mod(listSize,1000)) || !Mod(listSize,10000)))
                 PopUp(listSize,0,0,0)
        popup := listSize -1
        if (show == 1)
            Popup(popup,0,0,0)
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
          RenderPage(0)
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
          RenderPage(1)							; create null htm to release files
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
         if A_LoopField is number
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
        RenderPage(1)							; make browser release files
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
        if InStr("pdf txt rtf doc epub mobi htm html js css ini ahk vtt srt", ex)
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
        FileReadLine, str, %inca%\cache\temp\%folder%.txt, id
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
          }
        if (click=="LButton" && desk==cur && !WinExist("ahk_class Notepad"))
          {
          WinActivate, ahk_group Browsers
          if (y < 0)
            send, ^0
          else send, ^{+}
          sleep 111
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
        sortList = Shuffle|Alpha|Duration|Date|Size|Type|Reverse|Recurse|Videos|Images|Playlist|Pause|Mpv
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
        Gui, background:Color,Black
        Gui, background:Show, x0 y0 w%A_ScreenWidth% h%A_ScreenHeight% NA
        WinSet, Transparent, 0
        WinSet, ExStyle, +0x20
        gui, vol: +lastfound -Caption +ToolWindow +AlwaysOnTop -DPIScale
        gui, vol: color, ffb6c1
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
        Gui, Indexer:Font, s11 c806a5c, Segoe UI
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


    Indexer:
    Critical Off
    if indexFolders
      Loop, Parse, indexFolders, `|
        Loop, Files, %A_LoopField%*.*, R
          index(A_LoopFileFullPath,0)
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
                Runwait %inca%\cache\apps\ffmpeg -i %inca%\cache\temp\`%d.jpg -filter_complex "tile=6x6" -y "%inca%\cache\thumbs\%filen%.jpg",, Hide
            }
          GuiControl, Indexer:, GuiInd
          }


    TimedEvents:							; every 100mS
        GetBrowser()
        WinGetPos,x,,w,,a
        if (w == A_ScreenWidth)
          fullscreen := 1
        else fullscreen := 0

GuiControlGet, control, Indexer:, GuiInd
Process, Exist, ffmpeg.exe
if InStr(control, "processing")
   if !ErrorLevel
       GuiControl, Indexer:, GuiInd

IfWinActive, Notepad
  if (x!=600)
    WinMove,600,0

        MouseGetPos,,, id 						; get the window below the mouse 
        WinGet, cur, ID, ahk_id %id%
        WinGet, desk, ID , ahk_class Progman
        WinGet, mpvPID, ID , ahk_class mpv				; get mpv PID
        if (!fullscreen && mpvPID)
          {
          WinGetPos, x,y,mpvWidth,mpvHeight,ahk_class mpv	; track mpv window in case gesture moved
          if (x<0) 
            x := 1000
          if (y<0)
            y := 1000
          mediaX := x + mpvWidth//2
          mediaY := y + mpvHeight//2
          }
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
            WinSet, Transparent, % Setting("Ambiance")
        else WinSet, Transparent, 0
        x := Setting("Sleep Timer") * 60000
        if (volume >= volRef/10000 && A_TimeIdlePhysical > x)
            {
            volume -= volRef/10000					; sleep timer
            SoundSet, volume						; slowly reduce volume
            }
        ShowStatus()
        return


     checkPlaylist()							; in case src files moved
       {
       FileRead, str, %playlist%
       Loop, Parse, str, `n, `r
         if %A_LoopField%
           {  
           source := StrSplit(A_Loopfield, "|").1
           start := StrSplit(A_Loopfield, "|").2
           detectMedia(source)
           x = %searchFolders%|%indexFolders%
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























