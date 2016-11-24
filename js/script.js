var map;
var markers = [];

// A list of locations to populate the map
var places = [{
    title: "Central Park",
    position: {
        lat: 40.783333,
        lng: -73.966667
    }
}, {
    title: "American Museum of Natural History",
    position: {
        lat: 40.7799,
        lng: -73.9715
    }
}, {
    title: "Madame Tussauds",
    position: {
        lat: 40.756193,
        lng: -73.98843999999997
    }
}, {
    title: "Museum of Modern Art",
    position: {
        lat: 40.761484,
        lng: -73.977664
    }
}, {
    title: "Empire State Building",
    position: {
        lat: 40.748817,
        lng: -73.985428
    }
}, {
    title: "Madison square garden",
    position: {
        lat: 40.754932,
        lng: -73.984016
    }
}];

// Create a new map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.761484,
            lng: -73.977664
        },
        zoom: 13
    });

    ko.applyBindings(new ViewModel());
}

var stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length) {
        return false;
    }
    return string.substring(0, startsWith.length) === startsWith;
  };

var ViewModel = function() {
    var self = this;

    self.userSearch = ko.observable('');
    self.articleSection = ko.observableArray();
    self.places = ko.observableArray(places);
    self.placesChosen = ko.observableArray();
    self.articlesListed = ko.observableArray();

    var largeInfoWindow = new google.maps.InfoWindow();

    // Logs current contents of user input to search box to console
    self.writeToConsole = ko.computed(function() {
        console.log(self.userSearch());
    });

    // Populates the map with markers - all or number filtered
    self.populateMap = ko.computed(function() {
        var searchQuery = self.userSearch().toLowerCase();
        var selectPlaces = [];

        if (!searchQuery) {

            return fullyPopulateMap();
        } else {
            console.log("attempt to repopulate map");
            populateFilteredMap(searchQuery);

        }
    });

    //An observable for information typed into the search bar
    self.userSearch = ko.observable('');
    //A ko.computed for the filtering of the list and the markers
    self.selectPlaces = ko.computed(function(placeItem) {
    var filter = self.userSearch().toLowerCase();
    //If there is nothing in the filter, return the full list and all markers are visible
    if (!filter) {
      self.places().forEach(function(placeItem) {
          placeItem.marker.setVisible(true);
        });
      return self.places();
    //If a search is entered, compare search data to place names and show only list items and markers that match the search value
      } else {
        return ko.utils.arrayFilter(self.places(), function(placeItem) {
          is_filtered = stringStartsWith(placeItem.title.toLowerCase(), filter);
          //To show markers that match the search value and return list items that match the search value
           if (is_filtered) {
              placeItem.marker.setVisible(true);
              console.log("clicked");
              return is_filtered
            }
          //To Hide markers that do not match the search value
           else {
              placeItem.marker.setVisible(false);
              return is_filtered
            }
        });
      }
    }, self);

    // Adds content to the info window when a marker is clicked.
    // Only one info window can be open at a time.
    function populateInfoWindow(marker, infoWindow) {
        if (infoWindow.marker != marker) {
            infoWindow.marker = marker;

            infoWindow.setContent('<div>' + marker.title + '</div>');
            infoWindow.open(map, marker);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                marker.setAnimation(null);
            }, 700);

            infoWindow.addListener('closeclick', function() {
                marker.setAnimation(null);
                infoWindow.marker = null;
            });
        }
    }

    // Adds a marker for every place on the map
    function fullyPopulateMap() {
        self.places().forEach(function(place) {
            var title = place.title;
            var position = place.position;

            // Create a marker (for each)
            var marker = new google.maps.Marker({
                map: map,
                position: position,
                title: title,
                animation: google.maps.Animation.DROP,
                id: place
            });

            // Add each marker to the marker array then add a listener
            markers.push(marker);
            //setMapOnAll(map);
            marker.addListener('click', function() {
                getNYTArticles(title);
                populateInfoWindow(this, largeInfoWindow);
            });

            place.marker = marker;

        },500)
    }

    // Sorts places that match search query into new array
    function populateFilteredMap(searchQuery) {
        self.places().forEach(function(place) {
            var title = place.title;
            var titleToSearch = place.title.toLowerCase();
            var position = place.position;

            if (titleToSearch.indexOf(searchQuery) !== -1) {
                // Create a marker
                var marker = new google.maps.Marker({
                    map: map,
                    position: position,
                    title: title,
                    animation: google.maps.Animation.DROP,
                    id: place
                });

                // Add each marker to the marker array then add a listener
                markers.push(marker);

                marker.addListener('click', function() {
                    getNYTArticles(title);
                    populateInfoWindow(this, largeInfoWindow);
                });

                place.marker = marker;
            }
        })
    }
    // Handles opening marker when list item clicked
    self.listItemClicked = function(data) {
        populateInfoWindow(data.marker, largeInfoWindow);
        getNYTArticles(data.title);
        console.log(data);
    }

    // Functions for deleting all markers from the map

    // Sets the map on all markers in the array.
    function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }
    
    // NYT API functions

    // Returns observable array updated with articles getNYTArticles gathers
    self.selectArticles = ko.computed(function() {
        return self.articlesListed();
    });

    //Gets NYT articles using API
    function getNYTArticles(title) {
        var articleList = self.articleSection;

        var nytimesUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' +
            title + '&sort=newest&api-key=6c26ff1c9c85490ca191001dd6d9ffb7';

        console.log(nytimesUrl);
        self.articlesListed([]);
        // Ajax call to retrieve and generate list of articles related to a location
        $.ajax({
            url: nytimesUrl,
            method: 'GET',
        }).done(function(result) {
            articles = result.response.docs;
            for (var i = 0; i < 5; i++) {
                var article = articles[i];
                console.log('logging article:' + article.headline.main);
                self.articlesListed.push('<a href="' + article.web_url + '">' + article.headline.main + '</a>');
            }
            self.articlesListed();
            console.log(result);
        }).fail(function(err) {
            alert("Error: Could not retrieve New York Times news data");
            throw err;
        });
    }
};

var mapsError = function() {
    alert("Google Maps failed to load");
}