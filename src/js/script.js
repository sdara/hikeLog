var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + CONFIG.APIKEY;
head.appendChild(script);
	
var initTimer = window.setInterval( function() {
	if( typeof( google ) !== "undefined" ) {
		 window.clearInterval(initTimer);
		_init();
	}
}, 1000 );

var _init = function() {
	/* a starting location in your area, using Google API */
	var home = {
		lat: CONFIG.HOME_LOCATION.lat,
		lng: CONFIG.HOME_LOCATION.lng,
		loc: CONFIG.HOME_LOCATION.loc
	};
	
	var directionsDisplay;
	var directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	
	function clearMarkers() {
		var mapOptions = {
			center: { lat: home.lat, lng: home.lng },
			zoom: 9
		};
		var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		var marker = new google.maps.Marker({map: map});
		marker.setMap(null);
	}
		
	function getParks( filter ) {
		var ret = [], i;
		
		switch( filter ) {
			case 'complete':
				for( i in parks ) {
					if( parks[i].completedArray.length > 0 ) {
						ret.push( parks[i] );
					}
				}
			break;
			case 'incomplete':
				for( i in parks ) {
					if( parks[i].completedArray.length == 0 ) {
						console.log( parks[i].park, parks[i].completedArray.length, parks[i].completedArray.length === 0 );
						ret.push( parks[i] );
					}
				}
			break;
			case 'all':
			default:
				for( i in parks ) {
					ret.push( parks[i] );
				}
			break;
		}
		
		return ret.sort(function(a,b){
			a = new Date(a.completedArray[a.completedArray.length-1]);
			b = new Date(b.completedArray[b.completedArray.length-1]);
			return a>b ? -1 : a<b ? 1 : 0;
		});
	}
		
	function initialize(filter) {
		var mapOptions = {
			center: { lat: CONFIG.HOME_LOCATION.lat, lng: CONFIG.HOME_LOCATION.lng},
			zoom: 8
		};
		
		$('input[type=button]').removeClass('filter_on');
		
		if( filter ) {
			$('input[type=button]').each(function(){
				if( $(this).data('filter') == filter ) {
					$(this).addClass('filter_on');
					return;
				}
			});
		} else {
			$('input[type=button]').eq(0).addClass('filter_on');
		}
		
		$('#park_list').empty();
		
		var calcRoute = function(lat,lng) {
		  //var selectedMode = document.getElementById("mode").value;
		  var selectedMode = "DRIVING";
		  var request = {
			  origin: (function(){return new google.maps.LatLng(home.lat, home.lng);}()),
			  destination: (function(){return new google.maps.LatLng(lat, lng);}()),
			  // Note that Javascript allows us to access the constant
			  // using square brackets and a string value as its
			  // "property."
			  travelMode: google.maps.TravelMode[selectedMode]
		  };
		  directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
			  directionsDisplay.setDirections(response);
			}
		  });
		}
		
		var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		
		directionsDisplay.setMap(map);
		
		var myParks = getParks(filter);
		
		$( '#progress' ).text( Math.round( (getParks('complete').length / getParks('all').length ) * 100 ) );
		var output = {
			state: [],
			muni: [],
			outside: []					
		};
		
		for( var i in myParks ) {
			( function(x) {
				var addPark = function() {
					// To add the marker to the map, use the 'map' property
					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(myParks[x].lat,myParks[x].lng),
						map: map,
						title:(parseInt(x,10)+1) + ". " + myParks[x].park,
						animation: ''//google.maps.Animation.DROP
					});
					
					google.maps.event.addListener(marker, 'click', function() {
						var str = "";
						for( var n in myParks[x] ) {
							str += n + ": " + myParks[x][n] + "\n";
						}
						alert( str );
					});	
				};
				
				window.setTimeout( addPark, 0 );
				
				var date_completed = '',
					done = '',
					add_class = '',
					note = myParks[x].note || ( myParks[x].letterboxing && 'Letterboxing Site' ) || '',
					link;
				
				if( myParks[x].charge ) {
					note += ( note ? '<br />' : '' ) + (myParks[x].charge?'Parking Fee' : '' );
				}
				
				if( myParks[x].completedArray.length > 0 ) {
					date_completed = myParks[x].completedArray[ myParks[x].completedArray.length - 1 ];
					done = 'style=""';
					add_class = ' completed'
				}
				
				link = myParks[x].park;
				
				if( myParks[x].href ) {
					if( myParks[x].href.substr(0,4) === "http" ) {
						link = '<a href="'+myParks[x].href+'" target="_blank" >'+link+'</a>';
					} else {
						link = '<a href="http://www.ct.gov/deep/cwp/view.asp?a=2716&deepNav_GID=1650&q='+myParks[x].href+'" target="_blank" >'+link+'</a>';
					}
				}
				
				var section = 'state';
				
				if( myParks[x].muni ) {
					section = 'muni';
				} else if( typeof myParks[x].state !== "undefined" && myParks[x].state != "CT" ) {
					section = 'outside';
				}
				
				output[section].push('<div class="detail'+add_class+'">'+(parseInt(output[section].length,10)+1)+'. '+link+' '+date_completed+'<br/>'+note+'</div>');
			}(i));
		}
		
		$('#park_list').append( '<div class="detail section_header">State Parks ('+output.state.length+')</div>' + output.state.join('') + '<div class="detail section_header">Municipal Parks/Misc Trails ('+output.muni.length+')</div>' + output.muni.join('') + '<div class="detail section_header">Out of State Parks ('+output.outside.length+')</div>' + output.outside.join('') );
	}
	
	$('input[type=button]').click( function() {
		var filter = $(this).data('filter');
		if( filter == 'random' ) {
			getRandomPark();
		} else {
			initialize( filter );
		}
	} );
	
	$( '#details' ).height( $( '#map-canvas' ).height() );
		
	function getRandomPark() {
		var parks = getParks('incomplete'),
			bucket = [], 
			i, 
			got_park = false,
			found = false,
			selected;
		
		for( i in parks ){
			bucket.push( parks[i] );
		}
		
		if( bucket.length ) {
			while( found == false ) {
				selected = Math.floor(Math.random() * bucket.length) + 0;
				if( !bucket[selected].letterboxing ) {
					got_park = bucket[selected];
					found = true;
					break;
				}
			}
		}
		
		if( got_park ) {
			alert( got_park.park + ( got_park.charge && "\nParking Fee: Yes!" || "" ) + ( got_park.letterboxing && "\nLetterboxing: Yes!" || "" ) );
		} else {
			alert( 'no park found! :(');
		}
	}
	
	initialize('complete');
};