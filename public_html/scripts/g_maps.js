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
function init_map() {

    // Add a bit of fun, provide random POI to start with
    var rnd_poi = [
	{lat: 51.9965, lng: 0.7428},
	{lat: -6.12348, lng: 106.65177},
	{lat: 37.4996949, lng: -122.2620496},
	{lat: 47.609722, lng: -122.333056},
	{lat: 48.8048077, lng: 2.1182443}
    ]
    map = new google.maps.Map(document.getElementById('map'), {
	center: rnd_poi[Math.floor(Math.random() * rnd_poi.length)],
	zoom: 12,
	styles: styleArray
    });

    // Initialize some listeners for the map
    map.addListener('dragend', on_map_drag_end);
    map.addListener('zoom_changed', on_map_zoom_change);

    // Give a global markers list for persistent marker storage
    window.markers = [];

    // Force a first run of the update
    on_map_drag_end();
}

//
// Event listener for the end of a map drag event
//
function on_map_drag_end()
{
    var lat = map.getCenter().lat();
    var lon = map.getCenter().lng();
    get_location_tweets(lat, lon, on_location_result);
    $('#latitude').val(lat);
    $('#longitude').val(lon);
}

//
// Event listener for the map zoom event
//
function on_map_zoom_change()
{
    var lat = map.getCenter().lat();
    var lon = map.getCenter().lng();
    get_location_tweets(lat, lon, on_location_result);
}