$(document).one('pagecreate', function(){
  //handlebar functions
  var pageTemp = $('#pageTemplate').html();
  var renderPage = Handlebars.compile(pageTemp);

  //populate cities when panel is opened
  $('#search').on('tap', function() {
    $.ajax({
      url: 'resources/data/cities.json',
      type: 'GET',
      dataType: 'JSON',
      success: getCities
    });
  });

  function getCities(cities) {
    var html = renderPage(cities);
    $('#cityList').html(html);
    $('#cityList').listview('refresh');
    $('#searchCity').trigger('updatelayout');
  }

  //load recent cities
  $('#recent').on('tap', function() {
    loadRecentCities();
  })

  //check if user browser has geolocation feature
  if (navigator && navigator.geolocation) {
    $('#js-geolocation').show();
  } else {
    $('#js-geolocation').hide();
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
  //show weather of current location when page is loaded
  getLocation().done(function() {
    loadWeather(myLocation.lat+','+myLocation.lng);
  });

  //location button event
  $('#js-geolocation').on('tap', function() {
    loadWeather(myLocation.lat+','+myLocation.lng);
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
    var index = recentCities.indexOf(city);
    if(index > -1) {
      recentCities.move(index, 0);
    } else {
      recentCities.unshift(city);
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

  //local storage
  var recentCities = [];
  function loadRecentCities() {
    if(localStorage.recentCities){
      recentCities = JSON.parse(localStorage.recentCities);
      $('ul#recentList').empty();
      recentCities.map(item => $('ul#recentList').append('<li><a class="ui-btn ui-btn-icon-left ui-icon-carat-l" href="#recentSearch">' + item + '</a></li>'));
      $('#recentList').listview('refresh');
    }
  }

  // move item in the array
  Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
  }

});
