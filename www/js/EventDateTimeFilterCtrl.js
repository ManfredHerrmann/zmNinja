/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */



angular.module('zmApp.controllers')
    .controller('zmApp.EventDateTimeFilterCtrl', ['$scope',  '$ionicSlideBoxDelegate', '$ionicSideMenuDelegate', '$rootScope', '$ionicHistory', function ($scope, $ionicScrollDelegate,$ionicSideMenuDelegate, $rootScope, $ionicHistory) {

$scope.removeFilters = function()
{
    $rootScope.isEventFilterOn = false;
    $rootScope.fromDate = "";
    $rootScope.fromTime= "";
    $rootScope.toDate = "";
    $rootScope.toTime="";
    $rootScope.fromString="";
    $rootScope.toString="";
    $ionicHistory.goBack();
};

$scope.saveFilters  = function()
{
    if (!$rootScope.fromDate)
    {
         console.log ("RESET fromDate");
        $rootScope.fromDate = new Date();
    }

    if (!$rootScope.toDate)
    {
        console.log ("RESET toDate");
        $rootScope.toDate = new Date();
    }

    if (!$rootScope.fromTime)
    {
         console.log ("RESET fromTime");
        $rootScope.fromTime = new Date(99,5,24,0,0,0,0); //moment().format("hh:mm:ss");
    }


    if (!$rootScope.toTime)
    {
         console.log ("RESET toTime");
        $rootScope.toTime =new Date(99,5,24,23,59,59,0);
        //$rootScope.toTime = "01:01:02"; //moment().format("hh:mm:ss");
    }


        $rootScope.isEventFilterOn = true;
       $rootScope.fromString = moment($rootScope.fromDate).format("YYYY-MM-DD") + " " + moment($rootScope.fromTime).format ("HH:mm:ss");

     $rootScope.toString = moment($rootScope.toDate).format("YYYY-MM-DD") + " " + moment($rootScope.toTime).format ("HH:mm:ss");

    //console.log("CONCAT DATES " + temp);
       //
       // var startDate = moment(temp).format("YYYY-MM-DD hh:mm:ss");
        console.log (" DATE IS " + $rootScope.fromString + " AND " +$rootScope.toString);
        $ionicHistory.goBack();
};


}

]);
