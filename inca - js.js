<script>
var xpos = "0";
var ypos = "0";
var opacity = "0";
var last = "0";

function select(event, id, name) {			// highlight selected items
var el = document.getElementById(name);
document.getElementById(id).href = location.href.split('#')[0] + "#" + name + "#" + last;
if (event.button == 2) {
if (el.style.borderBottom == "") 
     {el.style.borderBottom = "dotted #ffbf99"; document.getElementById(id).style.animation = "blink 0.3s 4";}
else {el.style.border = ""}}}


function snips(event, id, name, seek) {			// mouseover snip buttons
var el = document.getElementById(name);	
el.currentTime = seek;
last = seek;
el.play();
setTimeout(function(){el.pause(); },3000);}


function pause(event, id, name) {var el = document.getElementById(name); el.pause();last = 0;}


function seek(event, id, name, seek) {			// mouseover thumb image
var el = document.getElementById(name);
var rect = el.getBoundingClientRect();
xpos = (event.clientX - rect.left) / el.offsetWidth;
ypos = (event.clientY - rect.top) / el.offsetHeight;
var sk = el.duration * xpos;
var step = el.duration * 0.2;
sk = Math.floor(sk / step);
sk = Math.floor(sk * step);
if (el.duration > 30) {sk = sk + 20;}
if (seek != 0) {sk = seek;}
if (sk == last) {return;}
el.playbackRate = 0.8;
if (!el.getAttribute("src").match(/thumbs/)) {el.currentTime = sk; el.play();}
last = sk;
}

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