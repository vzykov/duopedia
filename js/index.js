var Langs=["en","es"];
var referredArticle="";
var referredPane=0;

var autocompleteTags = [];

function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (5*365*24*60*60*1000)); //expire in 5 years by default
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function newarticle(L,article,secondtry) {
  $.getJSON("https://"+Langs[L]+".wikipedia.org/w/api.php?format=json&action=query&prop=revisions&titles="+article+"&rvprop=content&rvparse&callback=?", function(json) {
    for (var key in json.query.pages) {
		if ((key=="-1")&&(!secondtry)) {
			newarticle(1-L,article,true);
			return;
		}

		$("#pane"+L).html(linkify(L,json.query.pages[key].revisions[0]["*"]));
  		$("#pane"+(L)).scrollTop(0);
	}
  });

  $("#pane"+(1-L)).html("");

  $.getJSON("https://"+Langs[L]+".wikipedia.org/w/api.php?format=json&action=query&titles="+article+"&prop=langlinks&lllimit=500&llprop=url&lllang="+Langs[1-L]+"&callback=?", function(json) {
 	for (var key in json.query.pages) {
  		if (key=="-1") return;
  		var otherlangarticle=encodeURIComponent(json.query.pages[key].langlinks[0]["*"]);
   		$.getJSON("https://"+Langs[1-L]+".wikipedia.org/w/api.php?format=json&action=query&prop=revisions&titles="+otherlangarticle+"&rvprop=content&rvparse&callback=?", function(json) {
    		for (var key in json.query.pages) {
				$("#pane"+(1-L)).html(linkify(1-L,json.query.pages[key].revisions[0]["*"]));
			}
		});
   		$("#pane"+(1-L)).scrollTop(0);
 	}
  });
}

function linkify(L,sourceHTML) {
  var re = /(<a href=\"\/wiki\/([^"]*)\")/g;
  var re1 = /(<a href=\"\/w\/index\.php\?title=([^"]*)\&amp;redirect=no\")/g;
  var re2 = /(<a href=\"\/w\/index\.php\?title=([^"]*)\&amp;redirect=no#[^"]*\")/g;

  var re3 = /(<a href=\"\/w\/index\.php\?title=([^"]*)\&amp;action=edit\&amp;redlink=1\")/g; //remove red links, for now

  newHTML = sourceHTML.replace(re,"<a href=\"?&article=$2&pane="+(L+1)+"&l1="+Langs[0]+"&l2="+Langs[1]+"#\"");
  newHTML = newHTML.replace(re1,"<a href=\"?&article=$2&pane="+(L+1)+"&l1="+Langs[0]+"&l2="+Langs[1]+"#\"");
  newHTML = newHTML.replace(re2,"<a href=\"?&article=$2&pane="+(L+1)+"&l1="+Langs[0]+"&l2="+Langs[1]+"#\"");
  newHTML = newHTML.replace(re3,"<a href=\"#\"");

  newHTML = newHTML.replace(/article=([^&]+)#[^&]+&pane/g,"article=$1&pane"); // de-anchor links, for now

  return newHTML;
}

$(document).ready(function() {
	var GET = {};
	var query = window.location.search.substring(1).split("&");
	for (var i = 0, max = query.length; i < max; i++)
	{
	    if (query[i] === "") // check for trailing & with no param
	        continue;

	    var param = query[i].split("=");
	    GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
	}

	if (GET.l1) Langs[0]=GET.l1;
	if (GET.l2) Langs[1]=GET.l2;

	if ((GET.article)&&(GET.pane)) {
		$('<link>')
		  .appendTo('head')
		  .attr({type : 'text/css', rel : 'stylesheet'})
		  .attr('href', '/css/common.css');

		$("#pane0").css("visibility","visible");
		$("#pane1").css("visibility","visible");
		var re0=/\+/g;
		GET.article=GET.article.replace(re0,"_");
		document.title=GET.article.replace(/_/g," ");
		referredArticle = GET.article;
		referredPane = GET.pane;
	    newarticle(GET.pane-1,GET.article,false);
	}
	else {
		if (getCookie("l1")!="") {$("#l1select").val(getCookie("l1"));}
		else {$("#l1select").val("en"); }
		if (getCookie("l2")!="") {$("#l2select").val(getCookie("l2"));}
		else {$("#l2select").val("es"); }

		$("#landing").css("visibility","visible");


		$( "#articleinput" ).autocomplete({
		   source: autocompleteTags
    	});
	}
});

//$("#articleinput").on("change keyup paste",function () {
	//https://en.wikipedia.org/w/api.php?action=opensearch&search=Te&callback=?
//});

function unique(list) {
    var result = [];
    $.each(list, function(i, e) {
        if ($.inArray(e, result) == -1) result.push(e);
    });
    return result;
}

$("#articleinput").each(function() {
   var elem = $(this);

   // Save current value of element
   elem.data('oldVal', elem.val());

   // Look for changes in the value
   elem.bind("propertychange change click keyup input paste", function(event){
      // If value has changed...
      if (elem.data('oldVal') != elem.val()) {
       // Updated stored value
       elem.data('oldVal', elem.val());


       // Do action
       var searches=0;
       autocompleteTags=[];
       $.getJSON("https://"+$("#l2select").val()+".wikipedia.org/w/api.php?action=opensearch&limit=10&namespace=0&search="+$("#articleinput").val()+"&callback=?", function(json) {
				//alert(json[1]);
				autocompleteTags.push.apply(autocompleteTags,json[1]);
				searches++;
				if (searches==2) {$( "#articleinput" ).autocomplete({source: unique(autocompleteTags)});}	});
	   $.getJSON("https://"+$("#l1select").val()+".wikipedia.org/w/api.php?action=opensearch&limit=10&namespace=0&search="+$("#articleinput").val()+"&callback=?", function(json) {
			    //alert(json[1]);
			    autocompleteTags.push.apply(autocompleteTags,json[1]);
			    searches++;
			    if (searches==2) {$( "#articleinput" ).autocomplete({source: unique(autocompleteTags)});} 	});
     }
   });
 });

$("#l1select").change(function () {setCookie("l1",$("#l1select").val());});

$("#l2select").change(function () {setCookie("l2",$("#l2select").val());});

