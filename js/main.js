'strict mode'

function toggleFeatured(){
	$(".featured-img").toggleClass("collapsed");
	$(".featured").hover(
		function(){
			$(this).find(".featured-img").animate({height: "80px"}, "fast");
		},
		function(){
			$(this).find(".featured-img").animate({height: "0px"}, "fast");
		});
}

function main(){
	toggleFeatured();
}


$(document).ready(main);
