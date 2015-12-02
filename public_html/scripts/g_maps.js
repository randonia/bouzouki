// Specify features and elements to define styles.
var styleArray = [
    {
	featureType: "all",
	stylers: [
	    { saturation: -30 }
	]
    },{
	featureType: "road.arterial",
	elementType: "geometry",
	stylers: [
	    { hue: "#0033ee" },
	    { saturation: 50 }
	]
    },{
	featureType: "poi.business",
	elementType: "labels",
	stylers: [
	    { visibility: "off" }
	]
    }
];

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
	center: {lat: -34.397, lng: 150.644},
	zoom: 8,
	styles: styleArray
    });
}
