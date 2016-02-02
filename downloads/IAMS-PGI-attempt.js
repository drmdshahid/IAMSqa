// ==UserScript==
// @name        IAMS PGI attempt
// @namespace   shahid_IAMS
// @description only for PGI exams, attempt all
// @include     http://iamsonline.in/pgiftsstart.aspx?sid=*
// @version     1.0b
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @grant       none
// @downloadURL https://drmdshahid.github.io/IAMSqa/downloads/IAMS-PGI-attempt.js
// @updateURL   https://drmdshahid.github.io/IAMSqa/downloads/IAMS-PGI-attempt.meta.js
// ==/UserScript==


/*
------
this is to attempt all the questions in pgi test. so as to get access to their explanations.

How?
new design loads all the questions but displays one at a time and hides others.
u may need to first unhide all.

*/


function fill(n){
  
  var title=n;
  /*
  var chkt = "0";
  if (title >= 11)  chkt = (title-1).toString();
   else             chkt += (title-1).toString();*/
  n =parseInt(n)-1;
  chkt =(n<10 ? '0':'') + n.toString();
  //adding 0 pad to one digit number as string
  
  
  //var divid = '#dlQuestionList_ctl' + chkt + '_div';  ///not needed
  var spanel = "span.chk[title='" + title + "']";
  //each option is contained here -internal script considers attempt only when this is clicked
  var chkid = '#dlQuestionList_ctl' + chkt + '_chk1';
  ///_chk1 is 1st, _chk2 is 2nd option & so on. -checking it true is not necessory
  var subid = '#dlQuestionList_ctl' + chkt + '_btnSubmit';
  ///the save&next btn for each question
  
  document.querySelector(spanel).click();
  //yes! only first occurance is selected. querySelectorAll returns list
  //document.querySelector(chkid).checked = true; ///not needed auto checked by above
  document.querySelector(subid).click();
  
  console.log(title+' is marked');
    
}

////user interface, by adding buttons...
var btn = document.createElement('input');
btn.type='button';
btn.value = 'Attempt';
//btn.className = 'btn btn-round';
document.querySelector('ul.navbar-nav').appendChild(btn);

var allbtn = document.createElement('input');
allbtn.type='button';
allbtn.value = 'Attempt all';
document.querySelector('ul.navbar-nav').appendChild(allbtn);

var show = document.createElement('input');
show.type='button';
show.value = 'Unhide all';
document.querySelector('ul.navbar-nav').appendChild(show);

var end = document.createElement('input');
end.type='button';
end.value = 'End';
document.querySelector('ul.navbar-nav').appendChild(end);

btn.onclick = one;
allbtn.onclick=all;
show.onclick=unhide;
end.onclick=end;
//console.log('ready');

////attempt a specific question
function one(){
  var qno = window.prompt('Enter Question number:', 3);
  fill(qno);
  /*if(qno == null) return;//fill(qno);
  //console.log(qno+'marked');
    var chkt = "0";
  if (title >= 11)  chkt = (qno-1).toString();
   else             chkt += (qno-1).toString();
  var chkbox = document.querySelector('#dlQuestionList_ctl' + chkt + '_pnlCheckBox');
  var options= chkbox.getElementsByTagName('input').length;
  var ans='';
  for(;options>0;options--)ans+='T';
  console.log(ans);
  postans(qno,ans);*/
  
}

//// attempt all!
function all(){
  var i=0;
  
  var task = setInterval(
    function(){ fill(++i); 
               /*console.log(i);*/ 
               if(i==248)clearInterval(task); //to safely stop at q248
              }, 500);
 
  
  
}


function unhide(){
  // can run this at last.... 
  // adding a style element to head
  // this is by selecting elements whose id starts with 'dlQuestionList_ctl'
  //
  var sty = document.createElement("STYLE");
  var t = document.createTextNode("div[id^='dlQuestionList_ctl'] {display: block !important;}");
    sty.appendChild(t);
    document.head.appendChild(sty);
}

function end(){
  if (confirm('Sure to End the Test?'))document.querySelector('#btnEndTest').click();
  
}

/*
function postans(quesid,userans){
    $.ajax({
      type: "POST",
      url: "pgiftsstart.aspx/GreenSubmit",
      data: "{QuesID: " + quesid + ", UserAnswer:'" + userans + "'}",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(response) {
        console.log('posted:'+quesid+' --'+response);
      },
      failure: function(response) {
        console.log('FAILED!:'+quesid+' --'+response);
      }
    });
  
  
}*/
