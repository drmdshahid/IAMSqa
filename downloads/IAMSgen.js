// ==UserScript==
// @name       IAMS gen iframe
// @description    collect q&a in iframe pure
// @namespace  shahid_IAMS
// @version    3.2.0b
// @copyright  2013+, Shahid
// @include    http://www.iamsonline.in/results.aspx?q=*&qi=*
// @include    http://iamsonline.in/results.aspx?q=*&qi=*
// @grant      none
// @downloadURL https://drmdshahid.github.io/IAMSqa/downloads/IAMSgen.user.js
// @updateURL   https://drmdshahid.github.io/IAMSqa/downloads/IAMSgen.meta.js
// ==/UserScript==


/*
-----A Note-----
for unknown reasons (bug),
when any @grat is specified, javascript:__doPostBack(x,y) like page function don't work
hence i've to use "// @grant none" hence no user commands too
////UI by user command menu could have been used...
//GM_registerMenuCommand('Generate', main, 'g');

-------Changes----------
3.2.0b use mutation observer. significantly faster, less errors
3.1.2  correct perpetual looping error after mismatch error, add rows after validating
3.1.1  errorQ added for tracking errors and display them at the end


----- How to Use ------

*/


////user interface, by adding button...
var pos = document.getElementById('ctl00_ContentPlaceHolder1_errorLabel');
//any place to add 'generate' button
var btn = document.createElement('input');
btn.type = 'button';
btn.value = 'Generate';
btn.id = 'run';
pos.appendChild(btn);
btn.onclick = main;

// checkbox to know if it is PGI
//var pgitxt = document.createTextNode('is PGI?');
pos.appendChild(document.createTextNode('is PGI?'));
var pgichk = document.createElement('input');
pgichk.type = 'checkbox';
pos.appendChild(pgichk);
pgichk.checked = false;



// more controls
var btn2 = document.createElement('input');
btn2.type = 'button';
btn2.value = 'Show';
btn2.id = 'out';
pos.appendChild(btn2);
btn2.onclick = finalout;
btn2.style.display = "none";

// --------global variables---
//mytable is the main basket! this can be give to a window, iframe, or using GM_config

var mytable = document.createElement('table'),
    i, //i  :for 10 questions in the grid/page, range 0-9.
    j, //j  :for targeting grid/page, range 1-30.
    jS, //jS :the start page position
    jE, //jE :the end page point
    t = 2000, //t  :time lapse to allow page to load ---adjust this. min for text is 1 sec. upto 5sec for images
    start, // keep track of time
    doneQ = []; //array to keep track of done questions

var errorQ = [];

//----mutation Observation----
// select the target node
var target = document.querySelector('#ctl00_ContentPlaceHolder1_UpdatePanel2');
// create an observer instance
var observer = new MutationObserver(function() {
    window.setTimeout(addrow, 500);
    //addrow();
    //console.log('mutated!');
});
// configuration of the observer:
var config = {
    attributes: true,
    childList: true,
    characterData: true
};


function main() {
    var str = document.URL;
    var ind = str.indexOf('=') + 1;
    var fts = str.substr(ind, 3);
    var qS = 1,
        qE = 50; // strat and end question no, just a default.

    //just to get the serial number of FTS.
    jS = window.prompt(
        'Page number to start from : \n (Assuming each page has 10 questions)',
        1);
    var jN = window.prompt('How many pages you wanna do from page ' + jS +
        ' onwards: \n (be carefull not go beyond last page)', 5);
    if (jS && jN && jN > 0 && jN < 301) {
        //if both are provided...
        jS = parseInt(jS);
        jN = parseInt(jN);
        jE = jS + jN - 1;
        //this is end page
        j = jS;
        qS = ((jS - 1) * 10) + 1;
        qE = jE * 10;
        start = new Date();
        //to keep time when it started.
    } else {
        return;
    }
    //exit if user has cancelled
    //setting mytable

    mytable.id = 'mastertable';
    //mytable.title = fts;
    //to enable uniquely identify the document
    //mytable.style.textAlign = 'justify';
    //mytable.cellPadding = '5%';
    var tcaption = document.createElement('caption');
    tcaption.title = fts;
    tcaption.innerHTML = 'IAMS FTS #' + fts + ' (' + qS + '...' + qE + ')';
    mytable.appendChild(tcaption);
    pageLoad();
    //this is the entry point for loop
}

function pageLoad() {
    i = 0;
    //reset the question selection var for next grid
    var pageN = 'Page$' + j;
    console.log('Quering:' + pageN);
    __doPostBack('ctl00$ContentPlaceHolder1$resultGrid', pageN);
    window.setTimeout(quesLoad, t * 1.5); //question grid loading is 1.5 times slower than question loading.
}

function quesLoad() {

    var selectN = 'Select$' + i;
    //console.log('Quering:'+selectN);

    // activate observer to addrow when mutaion is observed
    observer.observe(target, config);

    if (notskip()) {
        __doPostBack('ctl00$ContentPlaceHolder1$resultGrid', selectN);
        //call original script function. this updates the Q&A pane

        //window.setTimeout(addrow, t);
        //to allow page to load completely--- adjust this time if resulting page has errors
    } else logic();
}

function notskip() {
    var skip = []; //put here questions to skip some questions for unresolved errors
    var thisques = ((j - 1) * 10) + i + 1;
    if (skip.indexOf(thisques) == -1) return true;
    else {
        console.warn('skipping:' + thisques);
        return false;
    }

}


function addrow() {
    // stop observing
    observer.disconnect();

    var grid, gridrow, qno, ques, optnsRaw, optns, ansGrid, ansRaw, pgians,
        answ, exp;
    //----gethering the required raw data...
    try {

        grid = document.getElementById(
            'ctl00_ContentPlaceHolder1_resultGrid');
        //if(!grid){alert('grid not found!'); return;}
        gridrow = grid.getElementsByTagName('tr')[i + 1];
        //leaving the first header row
        //to get the question number- 2nd column in the grid...
        qno = gridrow.getElementsByTagName('td')[1].innerHTML;
        ansGrid = gridrow.getElementsByTagName('td')[2].innerHTML;
        // now from the panel...
        ques = newclean(document.getElementById(
                'ctl00_ContentPlaceHolder1_Question'), 'q' + qno,
            'question');
        optnsRaw = document.getElementById(
                'ctl00_ContentPlaceHolder1_answerRadioButtonList') ||
            document.getElementById(
                'ctl00_ContentPlaceHolder1_AnswerCheckBoxList'); //pgi!!
        //var optns = newclean(optnsRaw,'o'+qno, 'options');
        optns = makeform(optnsRaw, qno);
        ansRaw = document.getElementById(
            'ctl00_ContentPlaceHolder1_CorrectAnswer').innerHTML;
        if (pgichk.checked === true) {
            pgians = ansRaw.match(/[TF]/g); //pgi!!
            answ = pgians.join('');
        } else {
            answ = ansRaw.match(/\d/)[0];
        }
        exp = newclean(document.getElementById(
                'ctl00_ContentPlaceHolder1_Explanation'), 'e' + qno,
            'explanation');

    } catch (err) {
        console.error(err);
        return;
    }

    console.log('Got Q:' + qno + ' A:' + answ + ' i=' + i + ' j=' + j); //log as done
    
    //-------Validating ans in grid with ans in explanation-----OPTIONAL
    if (answ != ansGrid) {
        console.warn('ERROR: Mismatch! Q:' + qno + ' A:' + answ + ':' +
            ansGrid + ' i=' + i + ' j=' + j + ' -back to quesload-');
        if (errorQ.indexOf(qno) === -1) errorQ.push(qno);
        window.setTimeout(quesLoad, t);
        return;
        //if (!confirm('somthing is wrong! proceed?'))return;
    }
    


    //---------- Validate if we are revisiting/ looping again------OPTIONAL
    if (doneQ.indexOf(qno) === -1) doneQ.push(qno);
    else {
        //console.error('ERROR: Looping! --Ending now');
        //finalout();
        console.warn('ERROR: Looping! Q:' + qno + ' A:' + answ + ':' +
            ansGrid + ' i=' + i + ' j=' + j + ' --reloading question');
        if (errorQ.indexOf(qno) === -1) errorQ.push(qno);
        window.setTimeout(quesLoad, t);
        return;
    }

    // fromatting structuring the raw data
    //----------marking correct ans with a class--------OPTIONAL
    //and validate if ans consistant with options...
    try { //to handle errors in page. so, will skip marking
        var optnList = optns.getElementsByTagName('label');
        if (pgichk.checked === true) { //pgi!!
            for (var each = 0; each < optnList.length; each++) {
                switch (pgians[each]) {
                    case 'T':
                        optnList[each].className = 'True';
                        break;
                    case 'F':
                        optnList[each].className = 'False';
                        break;
                    default:
                        console.warn('WARNING: Something wrong in Q:' + qno);
                }
            }
        } else {
            if (answ > 0 && answ <= optnList.length)
                optnList[answ - 1].className = 'correct';
            else {
                console.warn('WARNING: Something wrong in Q:' + qno);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        optns.setAttribute("data-answer", answ); //a coustum way to embed data!
    }



    //----inserting rows and cells...

    var row = mytable.insertRow(-1);
    //-1=at end, 0=at start
    //row.style.verticalAlign = 'top';
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    //cell1 for Serial No., cell2 for Question, cell3 for Ans and Explanation
    cell1.className = 'SN';
    cell2.className = 'QN';
    cell3.className = 'AN';
    //given class names so that they can later be formatted by CSS
    //cell2.style.width="40%";


    //----adding obtained data....

    row.id = 'r' + qno;
    //cell1.innerHTML = qno;
    cell1.appendChild(makeNode(qno, 'span', 's' + qno, 'qno'));
    cell2.appendChild(ques);
    cell2.appendChild(optns);
    cell3.appendChild(makeNode(answ, 'p', 'a' + qno, 'answer'));
    cell3.appendChild(exp);

    //console.log('appended');
    //----where to go after adding the row...
    logic();
}

function logic() {
    //if(i>=2){finalout();}else{i++; quesLoad();}//limted for testing
    //console.log('data collected.');
    if (i >= 9) {

        // on reaching end of 10 question set of the grid
        if (j >= jE) {
            //this is the END. after jE pages
            var timelaps = Math.ceil((new Date() - start) / 1000);
            console.info('time spent (secs):' + timelaps +
                '  Check these questions:' + errorQ);
            finalout();
        } else {
            j++;
            pageLoad();
        }
    } else {
        i++;
        quesLoad();
    }
    //move to next question

}

function finalout() {
    //creating an iframe
    var outframe = document.createElement('iframe');
    outframe.style.position = 'fixed';
    //outframe.style.backgroundColor = 'white';
    outframe.style.left = '30px';
    outframe.style.top = '30px';
    outframe.style.width = '90%';
    outframe.style.height = '90%';
    outframe.style.display = 'block';
    outframe.srcdoc = '';
    //css js can be added here as string
    document.body.appendChild(outframe);

    //creating a button to hide and show the frame----- alternatively a checkbox can be used with css and this checkbox and iframe can be kept in afixed span
    var z = document.createElement('button');
    z.innerHTML = 'X';
    z.style.position = 'fixed';
    z.style.left = '5px';
    z.style.top = '20px';
    z.onclick = function() {
        switch (outframe.style.display) {
            case 'none':
                outframe.style.display = 'block';
                z.innerHTML = 'X';
                break;
            case 'block':
                outframe.style.display = 'none';
                z.innerHTML = '>';
                break;
        }
    };
    document.body.appendChild(z);

    //the final addition...
    setTimeout(function() {
        outframe.contentDocument.body.appendChild(mytable);
        outframe.contentDocument.head.appendChild(mytitle());
        outframe.contentDocument.head.appendChild(linkcss(
            "file:///D:/Medical/Qpapers/IAMS/IAMSstyle.css"
        ));
        outframe.contentDocument.head.appendChild(addstyle(''));
        outframe.contentDocument.head.appendChild(myscript(
            'file:///D:/Medical/Qpapers/IAMS/IAMStest.js'));

    }, 1000);
    //giving some time for the iframe DOM to build.

}


////------------addl functions-------------////

function mytitle() {
    var x = document.createElement('title');
    x.innerHTML = "IAMS FTS " + mytable.caption.title;
    return x;
}

function linkcss(cssfile) {
    var x = document.createElement('link');
    x.setAttribute("rel", "stylesheet");
    x.setAttribute("type", "text/css");
    x.setAttribute("href", cssfile);
    return x;
}

function addstyle(stylestring) {
    var x = document.createElement('style');

    x.innerHTML = stylestring;
    /*
          .SN{ background-color:LightBlue; } \
          .AN { display:block; } \
          .SN:hover ~.AN { display:block; } \
          .answer:before { content:"Correct Answer:"; } \
          .correct { color:Green; }
    */

    return x;
}

function myscript(scriptfile) {
    var x = document.createElement('script');
    x.src = scriptfile;
    x.defer = 'true';
    return x;
}

function makeNode(htmlx, tagx, idx, classx) {
    // where makeNode(htmlcontent as string,tagname,id,classname) returns node
    //if(!tagx)var tagx='span';
    var newnode = tagx ? document.createElement(tagx) : document.createElement(
        'span');
    if (idx) newnode.id = idx;
    if (classx) newnode.className = classx;
    newnode.innerHTML = htmlx;

    return newnode;
}

function newclean(nodex, newid, newclass) {
    //this will clone the element and strip its attributes and add new ones.
    var newnode = nodex.cloneNode(true);
    for (var k = newnode.attributes.length; k-- > 0;)
        newnode.removeAttribute(newnode.attributes[k].name);
    if (newid) newnode.id = newid;
    if (newclass) newnode.className = newclass;

    return newnode;

}

function makeform(optionstable, quesnumber) {
    //convert options into form > div > input, label format
    var opform = document.createElement('form');
    opform.name = "o" + quesnumber;
    var optioninput = optionstable.getElementsByTagName('input');
    var optionlabel = optionstable.getElementsByTagName('label');
    for (var k = 0; k < optioninput.length; k++) {
        var oinput = optioninput[k].cloneNode();
        var olabel = optionlabel[k].cloneNode(true);
        oinput.removeAttribute("disabled");
        oinput.removeAttribute("checked");
        oinput.setAttribute("name", "o" + quesnumber);
        oinput.id = quesnumber + "-" + k;
        olabel.setAttribute("for", quesnumber + "-" + k);

        var odiv = document.createElement('div');
        odiv.appendChild(oinput);
        odiv.appendChild(olabel);
        opform.appendChild(odiv);
    }

    return opform;

}
