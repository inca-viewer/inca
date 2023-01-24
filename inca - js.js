<script>

//setTimeout(function(){element.pause();},1000);
//if (start != 0) {el.controls = true}
//else {el.controls = false}

var wheel = 0;
var timer = 1;
var scale = 1;

function getControls(event, element) {
if (wheel > 30) {
var seek = el.duration / 50
el = document.getElementById("modal-content");
if (timer == 1) {
timer = 0;
wheel = 0;
if (event.deltaY > 0) {scale -= 0.01;}
else  {scale += 0.01;}
el.style.transform = "scaleX(" + scale + ")";
setTimeout(function(){timer = 1;},100);}}
}


function open_modal(event, element, start) {
var rect = element.getBoundingClientRect();
var xpos = (event.clientX - rect.left) / element.offsetWidth;
var ypos = (event.clientY - rect.top) / element.offsetHeight;
el = document.getElementById("modal-content");
el.src=element.src;
el.poster=element.src;
if (xpos < 0.1 && ypos < 0.9 && ypos > 0.05) {
el.playbackRate = 0.8; el.currentTime = start;
el2 = document.getElementById("myModal");
el2.style.display="flex";
el2.addEventListener("animationend", modal2_end);
wheel=0;}
}

function close_modal(event, element) {
var rect = element.getBoundingClientRect();
var xpos = (event.clientX - rect.left) / element.offsetWidth;
var y = Math.abs(event.deltaY);
wheel += y;
if (xpos > 0.12 && wheel > 40) {						// chrome modal shutdown issue
document.querySelector("body").style.overflow = "auto";
el=document.getElementById("myModal");
el.style.animationName="fadeOut";
el.addEventListener("animationend", modal_end);
el.removeEventListener("animationend", modal2_end);
wheel=0;}
}

function modal_end() {
el=document.getElementById("myModal");
el.style.display="none";
el.style.animationName="fadeIn";
el.removeEventListener("animationend", modal_end);
}

function modal2_end() {document.querySelector("body").style.overflow = "hidden";wheel=0;}	// stop bouncing scrollbar chrome


function play_media(id, start) {
var el = document.getElementById(id);
var rect = el.getBoundingClientRect();
xpos = (event.clientX - rect.left) / el.offsetWidth;
if (xpos < 0.2) {el.currentTime = start; el.playbackRate = 0.8; el.play();}
else if (el.currentTime != 0) {el.currentTime = el.duration * xpos; el.play();}
}

function spool(event, id, input, output) {	// spool folders, playlists, searches etc. into top html panel
var link = " ";
const z = input.split("|");
var el2 = document.getElementById(output);
var el = document.getElementById(id);

if (id == "all") {				// all search terms
z.sort();
for (const x of z) {
p = x; y = p.substring(0, 14); p=p.replace(/ /g, "%20"); link = link + "<a href=#" + p + "><li>" + y + "</li>" + "</a>";}
el2.innerHTML = link;}

if (id == "folders" || id == "sub" || id == "fav") {
for (x of z) {
  y = x.split("/"); 
  var x1 = y.pop(); x1 = y.pop();
  x1 = x1.substring(0, 14);
  p=x.replace(/ /g, "%20");
  link = link + "<a href=#" + p + "><li>" + x1 + "</li>" + "</a>";}
el2.innerHTML = link;}

if (id == "music" || id == "slides") {		// media pointer playlists
for (const x of z) {
  const y = x.split("/"); 
  var p = y.pop(); 
  var q = x.replace(p, "");
  q = p + "#" + q;
  p=p.replace(/.m3u/g, "");
  p = p.substring(0, 14);
  q=q.replace(/ /g, "%20");
  link = link + "<a href=#" + q + "><li>" + p + "</li>" + "</a>";}
el2.innerHTML = link;}

if (id == "search") {				// alpha selected search terms
z.sort();
var w = el.offsetWidth;
var x = ((event.clientX - el.offsetLeft - el.scrollLeft)/w) + 0.02;
var upper = String.fromCharCode(Math.floor(25 * x) + 65);
var lower = upper.toLowerCase();
const f_lower = z.filter(z => z.startsWith(lower));
const f_higher = z.filter(z => z.startsWith(upper));
y = f_higher.concat(f_lower);
for (const x of y) {
p = x; p=p.replace(/ /g, "%20"); link = link + "<a href=#" + p + "><li>" + x + "</li>" + "</a>";}
el2.innerHTML = link; el.innerHTML = upper;}}


function getCoords(event, id, sort, link, current) {	// return mouse over controls from html selection strip
var y = " ";
var of = " ";
var units = " ";
var el = document.getElementById(id);
var w = el.offsetWidth;
var x = (event.clientX - el.offsetLeft - el.scrollLeft)/w;
if (sort == 'Alpha') {y = Math.floor(26.9 * x) + 64;}
if (sort == 'Size') {y = Math.floor(100 * x) * 10;units = "Mb +"}
if (sort == 'Date') {y = Math.floor(37 * x);units = "months +"}
if (sort == 'Duration') {y = Math.floor(60 * x);units = "minutes +"}
if (id =='slider2' || id =='slider3') {y = Math.floor(sort*x)+1; units = sort; sort = "Page"; of = " of "}
if (id =='slider4') {sort = "View";}
if (current != "") {y = current;}
el.href= link + ".htm#" + sort + "#" + y;
if (sort =='Random' || sort =='ext' || sort =='Shuffle') {return;}
if (sort == 'Alpha') {y = String.fromCharCode(y);}
el.innerHTML = y + of + units;}

</script>