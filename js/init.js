
//Angular module for placester
var placester = angular.module('placester',['ngRoute','ngSanitize','ui.router'])

.config(
  [ '$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

      $urlRouterProvider.otherwise('/');

      $stateProvider
        .state("home", {
          url: "/"
        })

        .state('place', {
          url: '/place/:place'
        })
        .state('page', {
          url: '/page/:page'
        })
    }
  ]
)

//Main controller for our app
.controller('mainController', function($scope, $http, $interval, $timeout, $state, $stateParams, $rootScope) {

  $scope.serverUrl = 'localhost';
  $scope.startListingNum = $scope.endListingNum = $scope.totalListingNum = $scope.activePage = $scope.offset = 0; //define some variables for our app
  $scope.listings = null; //Hold my listing info from API
  $scope.APIcallActive = $scope.apiError = false; //Control view of the loader and apiError
  $scope.sortType = 'city';
  $scope.defaultLimit = 9;
  $scope.offset = 0;

  $scope.params = $stateParams;
  $scope.state = $state;

  $rootScope.$on('$viewContentLoaded', function (event) {

    //due to angular digest. let's catch the next round
    $timeout(function() {

      if($scope.params["page"])
      {
        var selector = "a[data-page-num="+$scope.params.page+"]";
        $(selector).click();
      }
      else if($scope.params["place"]){
        var selector = "#place-"+$scope.params.place;
        $scope.activateModal(null);
      }
    },0);

  })

  $scope.loadPlaces = function(offset)
  {

    //Turn on loading indicator
    $scope.APIcallActive = true;

    //Set the offset if passed. If not we take the default
    $scope.offset = (offset) ? offset : $scope.offset;

    //Get listings
    $scope.getListings();

  }

  $scope.getListings = function()
  {

    //Call API from angularJS $http provider
    apiURL = '/api/getListings' ;

    $http.post(apiURL,{"offset": $scope.offset})
      .success(function(data, status, headers, config) {

        if(data){

          //Fill in our numbers based on the returned values
          $scope.listingResponseFromApi = data.listings;
          $scope.totalListingNum = data.total;
          $scope.startListingNum = (data.offset == 0) ? 1 : data.offset;
          $scope.endListingNum = data.offset + $scope.defaultLimit;
          $scope.renderPages();

          //Prepare our data
          var listingData = [], listingItem={};

          data.listings.forEach(function(item, index){

            listingItem = {
              "image" : (item.images[0]) ? item.images[0].url : '/images/buildings.jpg' , //Take first image if exist or put in a placeholder
              "city" : item.location.locality ,
              "address" : [item.location.address, item.location.locality, item.location.region, item.location.country].join(" "),
              "description" : (item.cur_data.desc) ? item.cur_data.desc : "No description found" ,
              "url" : item.cur_data.url ,
              "price" : (item.cur_data.price) ? item.cur_data.price : 0 ,
              "beds" : (item.cur_data.beds) ? item.cur_data.beds : '-' ,
              "baths" : (item.cur_data.baths) ? item.cur_data.baths : '-' ,
              "index" : index ,
        		};

            listingData.push(listingItem);

          });

          $scope.listings = listingData;

        }
        else {

          $scope.apiErrorMessage = "Unable to get listings please try again.";
          $scope.apiError = true;

        }

        //Turn off loader
        $scope.APIcallActive = false;

      })
      .error(function(data, status, headers, config) {

        $scope.APIcallActive = false;
        $scope.apiError = true;

        //Error let's display.
        if(data){

          $scope.apiErrorMessage = data.error;

        }
        else {

          $scope.apiErrorMessage = "Unable to get listings please try again.";

        }

      });

  }

  $scope.renderPages = function(pageNum)
  {
    $scope.activePage = (pageNum) ? pageNum : $scope.endListingNum/$scope.defaultLimit;

    //Fill in values for pagination
    var low = 1;
    var high = $scope.totalListingNum / $scope.defaultLimit;
    var paginationPages = [];

    for(var i = low; i<= high; i++){

      addClass = (i == $scope.activePage) ? 'active' : ''; //Set class only for active page
      paginationPages.push({"num" : i, "class" : addClass });

    }

    $scope.pages = paginationPages;
  }

  $scope.activateModal = function(event){

    //Insert all meta data from listing into modal
    var indexClicked = (event) ? event.currentTarget.dataset.listingid : $scope.params.place;
    var indexData = 'place-'+indexClicked+'-data';
    $scope.indexData = JSON.stringify($scope.listingResponseFromApi[indexClicked], null, 2);

    //Activate modal
    var selector = "#place-"+$scope.params.place;
    $(selector).openModal();
  }

  $scope.pageThrough = function(event){

    var pageNum = (event.target.dataset.pageNum == 1) ? 0 : event.target.dataset.pageNum;

    var startNum = pageNum * $scope.defaultLimit;
    $scope.startListingNum = (startNum != 0) ? startNum : 1;

    $scope.endListingNum = (startNum + $scope.defaultLimit <= $scope.totalListingNum ) ? startNum + $scope.defaultLimit  : $scope.totalListingNum;
    $scope.renderPages(event.target.dataset.pageNum);

  }

  $scope.changeSort = function(sortBy){

    $scope.sortType = sortBy;

  }

  $scope.loadPlaces(); //Call this to start

})

.directive("pagesLoaded", function () { //Handle after render logic
    return {
        link: function ($scope, element, attrs) {

          $scope.$watch('$last',function(v){ //Only perform this after last element

            if(v)
            {

              //Check starting URL after render and push page if applicable.
              if(window.location.hash.indexOf("#/place") == 0)
              {
                //$(newVal).parent().find("a")[0].click(); //generate event by clicking link
              }
              else if (window.location.hash.indexOf("#/listing") == 0)
              {
                var listingIndex = window.location.hash.split("-")[1];
                var selector = "a[data-page-num="+listingIndex+"]";
                console.log("Found selector for listing " + selector);
                console.log("Clicking");

                //$(selector).click();

              }
            }

          });

        }
    };
});

//Filter function for pagination
placester.filter('startFrom', function() {
    return function(input, start) {
        start =+start; //parse to int
        return input.slice(start);
    }
});
