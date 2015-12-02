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
	{lat: -6.12348, lng: 106.65177}
    ]
    map = new google.maps.Map(document.getElementById('map'), {
	center: rnd_poi[Math.floor(Math.random() * rnd_poi.length)],
	zoom: 12,
	styles: styleArray
    });

    // Initialize some listeners for the map
    map.addListener('dragend', on_map_drag_end);
    map.addListener('zoom_changed', on_map_zoom_changed);
    // Force a first run of the update
    on_map_drag_end();
}

//
// Event listener for the end of a map drag event
//
function on_map_drag_end()
{
    get_location_tweets(map.getCenter().lat(), map.getCenter().lng(), map.zoom, on_location_result);
}

//
// Event listener for when the zoom of a map changes
//
function on_map_zoom_changed()
{
    console.log(map.zoom);
}