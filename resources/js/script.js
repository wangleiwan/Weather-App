$(document).one('pagecreate', function(){
  //handlebar functions
  var pageTemp = $('#pageTemplate').html();
  var renderPage = Handlebars.compile(pageTemp);

  var popularCities = [];
  $.ajax({
    url: 'resources/data/cities.json',
    type: 'GET',
    dataType: 'JSON',
    success: function(cities) {
      popularCities = cities; //cache cities
    }
  });

  //populate cities when panel is opened
  $('#search').on('tap', function() {
    var html = renderPage(popularCities);
    $('#cityList').html(html);
    $('#cityList').listview('refresh');
    $('#searchCity').trigger('updatelayout');
  });

  //local storage
  var recentCities = [];
  function loadRecentCities() {
    if(localStorage.recentCities){
      recentCities = JSON.parse(localStorage.recentCities);
      $('ul#recentList').empty();
      recentCities.map(item => $('ul#recentList').append('<li><a class="ui-btn ui-btn-icon-left ui-icon-carat-l" href="#recentSearch" data-rel="close">' + item + '</a></li>'));
      $('#recentList').listview('refresh');
      $('#recentSearch').trigger('updatelayout');
    }
  }
  // move item in the array
  Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
  }

  //load recent cities
  $('#recent').on('tap', function() {
    loadRecentCities();
  });

  // default location -- Oakville
  var defaultLatLng = {
    "lat": 43.4520403,
    "lng": -79.7361763
  };

  //check if user browser has geolocation feature
  if (navigator && navigator.geolocation) {
    $('#js-geolocation').show();
    if($.isEmptyObject(myLocation)) {
      loadWeather(defaultLatLng.lat+','+defaultLatLng.lng);
    } else {
      loadWeather(myLocation.lat+','+myLocation.lng);
    }
  } else {
    $('#js-geolocation').hide();
    loadWeather(defaultLatLng.lat+','+defaultLatLng.lng);
  }

  //get current location
  var myLocation = {};
  function getLocation() {
    var deferred = $.Deferred();
    navigator.geolocation.getCurrentPosition(function(position) {
      myLocation.lat = position.coords.latitude;
      myLocation.lng = position.coords.longitude;
      deferred.resolve();
    });
    return deferred.promise();
  }

  // show weather of current location when page is loaded
  // show current location if it exists
  // otherwise show default location --oakville
  getLocation().done(function() {
    if($.isEmptyObject(myLocation)) {
      loadWeather(defaultLatLng.lat+','+defaultLatLng.lng);
    } else {
      loadWeather(myLocation.lat+','+myLocation.lng);
    }
  });

  //location button event
  //if geolocation works, show it, otherwise show default location
  $('#js-geolocation').on('tap', function() {
    if($.isEmptyObject(myLocation)) {
      loadWeather(defaultLatLng.lat+','+defaultLatLng.lng);
    } else {
      loadWeather(myLocation.lat+','+myLocation.lng);
    }
  });

  //list item click event
  $(document).on('tap', 'li', function() {
    var city = $(this).text();
    loadWeather(city, '');
    //add to recent cities array
    var index = recentCities.indexOf(city);
    if(index > -1) {
      recentCities.move(index, 0);
    } else {
      recentCities.unshift(city);
    }
    localStorage.recentCities = JSON.stringify(recentCities);
  });

  //search city event
  $(document).on('tap', '#checkWeather', function() {
    var city = $('#city').val();
    loadWeather(city, '');
    //add to recent cities array
    var i = recentCities.indexOf(city);
    if(i > -1) {
      recentCities.move(i, 0);
    } else {
      if(!!city){//!!city checks if city is empty
        recentCities.unshift(city);
      }
    }
    localStorage.recentCities = JSON.stringify(recentCities);
  });


  function loadWeather(location, woeid) {
    $.simpleWeather({
      location: location,
      woeid: woeid,
      unit: 'c',
      success: function(weather) {
        html = '</div id="weatherSection"><h3 id="title"><i class="icon-'+weather.code+'"></i><div id="temp">'+weather.temp+'&deg;'+weather.units.temp+'</div></h3>';
        html += '<ul><li>'+weather.city+'</li>';
        html += '<li class="currently">'+weather.currently+'</li></ul></div>';

        $("#weather").html(html);

        var labels = [];
        var data = [];
        var nextSevendays = weather.forecast.slice(0, 7);
        $.each(nextSevendays, function(i, val){
          labels.push(val.day);
          data.push(parseInt(val.high));
        });
        drawChart(labels, data);
      },
      error: function(error) {
        $("#weather").html('<p>'+error+'</p>');
      }
    });
  }

  var myLineChart;
  function drawChart(label, weather) {
    Chart.defaults.global.legend.display = false;
    Chart.defaults.global.tooltips.enabled = false;
    //redraw chart to avoid appending
    if(myLineChart) {
      myLineChart.destroy();
    }
    var ctx = $('#canvas');
    var data = {
      labels: label,
      datasets: [
        {
          label: "Next 10 days",
          fill: false,
          lineTension: 0.1,
          borderColor: "#fff",
          data: weather,
          spanGaps: false,
        }
      ]
    };
    myLineChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options:{
        responsive: false,
        scales: {
          xAxes: [{
            ticks: {
              fontColor: '#fff'
            },
            gridLines: {
              display:false
            }
          }],
          yAxes: [{
            ticks: {
              fontColor: '#fff'
            },
            gridLines: {
              display:false
            }
          }],
        },
      }
    });
  }
});
