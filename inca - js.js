<script>
var xpos = "0";
var ypos = "0";
var opacity = 0;

function select(event, id, name) {			// highlight selected items
var el = document.getElementById(name);
var index = "0";
if (id.match(/title/i)) {xpos = "0";}
if (el.getAttribute("src").match(/- snips/i)) {index = el.getAttribute("src").slice(-5); index = index.slice(0,1);}
document.getElementById(id).href = location.href.split('#')[0] + "#" + name + index + "#" + xpos;
if (event.button == 2) {
if (el.style.borderBottom == "") {el.style.borderBottom = "dotted #ffbf99"; document.getElementById(snp + index).style.animation = "blink 0.3s 6";}
else {el.style.border = ""}}}

function snip(event, name, index) {			// mouse over thumbnail to show video frame or snip
var el = document.getElementById(name);
if (el.style.borderBottomColor != "") {return;}
var source = el.getAttribute("src");
if (index != "snips")  {				// mouse moved to title or different snip button
  if (source.match(/- snips/i)) {source = source.slice(0,-8); source = source.replace("favorites/- snips/", "cache/thumbs/") + ".mp4";}						// convert snip path to thumb path 
  if (index > 0) {source = source.replace("cache/thumbs/", "favorites/- snips/"); source = source.replace(".mp4", " - " + index + ".mp4");} }					// convert path to snip + index
el.setAttribute("src", source);
if (!source.match(/thumbs/i)) {el.playbackRate = 0.8; el.play();}
snp = "snip" + name.slice(5);
for (i = 1; i < 10; i++) {
   if (document.getElementById(snp + i)) {
      if (i == index) {document.getElementById(snp + i).style.opacity = "1";}
      else {document.getElementById(snp + i).style.opacity = "0.4";}}}}

function seek(event, id, name) {			// show and return frame accurate video seek time
var el = document.getElementById(name);
el.pause();
if (opacity > 0 && opacity < 1) {return;}
var rect = el.getBoundingClientRect();
xpos = (event.clientX - rect.left) / el.offsetWidth;
ypos = (event.clientY - rect.top) / el.offsetHeight;
if (el.style.borderBottomColor != "") {return;}
var seek = el.duration * xpos;
var offset = el.duration * 0.01
if (el.getAttribute("src").match(/- snips/i)) {el.currentTime = seek; return;}
if (el.currentTime < (seek - offset) || el.currentTime > (seek + offset)){
opacity = 0.2;
el.currentTime = seek;
var intervalID = setInterval(function() {
if (opacity < 1) {opacity = opacity + 0.02; el.style.opacity = opacity;}
else {clearInterval(intervalID);}}, 15)}}

function getCoords(event, id, sort, link, current) {	// return slider control position
var y = "";
var of = " ";
var units = "";
var el = document.getElementById(id);
var w = el.offsetWidth;
var x = (event.clientX - el.offsetLeft - el.scrollLeft)/w;
if (sort == 'Alpha') {y = Math.floor(26.9 * x) + 64;}
if (sort == 'Size') {y = Math.floor(100 * x) * 10;units = "Mb +"}
if (sort == 'Date') {y = Math.floor(37 * x);units = "months +"}
if (sort == 'Duration') {y = Math.floor(60 * x);units = "minutes +"}
if (id =='slider2' || id =='slider3') {y = Math.floor(sort*x)+1; units = sort; sort = "Page"; of = " of "}
if (id =='slider4') {y = Math.floor(7 * x) + 1; sort = "View";}
if (current != "") {y = current;}
el.href= link + ".htm#" + sort + "#" + y;
if (sort =='Random') {return;}
if (sort == 'Alpha') {y = String.fromCharCode(y);}
el.innerHTML = sort + " " + y + of + units;}

</script>