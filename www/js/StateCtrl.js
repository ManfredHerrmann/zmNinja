/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for State View

angular.module('zmApp.controllers').controller('zmApp.StateCtrl', ['$ionicPopup', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state', '$http', function ($ionicPopup, $scope,zm, ZMDataModel, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state, $http, $rootScope) {

    //----------------------------------------------------------------------
    // Controller main
    //----------------------------------------------------------------------
    $scope.zmRun = "loading...";
    $scope.zmLoad = "loading...";
    $scope.zmDisk = "loading...";
    $scope.color = "";
    $scope.showDanger = false;
    $scope.dangerText = ["Show ZoneMinder Controls", "Hide ZoneMinder Controls"];
    $scope.dangerButtonColor = ["button-positive", "button-assertive"];
    $scope.customState = "";
    $scope.allStateNames = [];

    var loginData = ZMDataModel.getLogin();

    var apiRun = loginData.apiurl + "/host/daemonCheck.json";
    var apiLoad = loginData.apiurl + "/host/getLoad.json";
    var apiDisk = loginData.apiurl + "/host/getDiskPercent.json";
    var apiCurrentState = loginData.apiurl + "/States.json";

    var apiExec = loginData.apiurl + "/states/change/";

    var inProgress = 0; // prevents user from another op if one is in progress
    getRunStatus();
    getLoadStatus();
    getDiskStatus();
    getCurrentState();

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Montage Ctrl Entered");
        ZMDataModel.setAwake(false);
    });

    //---------------------------------------------------------
    // This gets the current run state custom name
    // if applicable
    //---------------------------------------------------------
    function getCurrentState() {

        $http.get(apiCurrentState)
            .then(
                function (success) {
                    var customStateArray = success.data.states;
                    var i = 0;
                    var found = false;
                    $scope.allStateNames = [];
                    for (i = 0; i < customStateArray.length; i++) {
                        $scope.allStateNames.push(customStateArray[i].State.Name);
                        if (customStateArray[i].State.IsActive == '1') {
                            $scope.customState = customStateArray[i].State.Name;
                            found = true;
                        }
                    }
                    if (!found) $scope.customState = "";

                },
                function (error) {
                    $scope.customState = "";

                }
            );

    }

    //---------------------------------------------------------
    // Allows the user to select a custom run state
    //---------------------------------------------------------
    $scope.selectCustomState = function () {
        $scope.myopt = {
            selectedState: ""
        };
        console.log(JSON.stringify($scope.allStateNames));
        ZMDataModel.zmLog("List of custom states: " + JSON.stringify($scope.allStateNames));
        var getConfig = $ionicPopup.show({
            scope: $scope,
            template: '<ion-radio ng-repeat="item in allStateNames" ng-value="item" ng-model="myopt.selectedState"> {{item}} </ion-radio>',


            title: 'Select run state',
            buttons: [
                {
                    text: 'Cancel',

                },
                {
                    text: 'OK',
                    onTap: function (e) {
                        if ($scope.myopt.selectedState != "")
                            controlZM($scope.myopt.selectedState);
                    }
               }
           ]
        });
    };


    //----------------------------------------------------------------------
    // returns disk space in gigs taken up by events
    //----------------------------------------------------------------------
    function getDiskStatus() {
        $http.get(apiDisk)
            .then(
                function (success) {
                    var obj = success.data.usage;
                    if (obj.Total.space != undefined)
                    {
                        $scope.zmDisk = parseFloat(obj.Total.space).toFixed(1).toString()+"G";
                    }
                    else
                    {
                        $scope.zmDisk = "unknown";
                        ZMDataModel.zmLog("Error retrieving disk space, API returned null for obj.Total.space");
                    }
                   /* var du = 0;
                    console.log("DISK:" + JSON.stringify(success));
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)) {
                            du += parseFloat(obj[p].space);

                        }
                    }
                    $scope.zmDisk = du.toFixed(1).toString() + "G";*/

                },
                function (error) {
                    $scope.zmDisk = "unknown";
                    console.log("ERROR:" + JSON.stringify(error));
                    ZMDataModel.zmLog("Error retrieving DiskStatus: " + JSON.stringify(error), "error");
                }
            );
    }

    //----------------------------------------------------------------------
    // returns ZM running status
    //----------------------------------------------------------------------
    function getRunStatus() {
        $http.get(apiRun)
            .then(
                function (success) {
                    switch (success.data.result) {
                        case 1:
                            $scope.zmRun = 'running';
                            $scope.color = 'color:green;';
                            break;
                        case 0:
                            $scope.zmRun = 'stopped';
                            $scope.color = 'color:red;';
                            break;
                        default:
                            $scope.zmRun = 'undetermined';
                            $scope.color = 'color:orange;';

                            break;
                    }


                    // console.log("X"+success.data.result+"X");
                },
                function (error) {
                    console.log("ERROR in getRun: " + JSON.stringify(error));
                    ZMDataModel.zmLog("Error getting RunStatus " + JSON.stringify(error), "error");
                    $scope.color = 'color:red;';
                    $scope.zmRun = 'undetermined';
                }
            );

    }


    //----------------------------------------------------------------------
    // gets ZM load - max[0], avg[1], min[2]
    //----------------------------------------------------------------------
    function getLoadStatus() {
        $http.get(apiLoad)
            .then(
                function (success) {
                    //console.log(JSON.stringify(success));
                    // load returns 3 params - one in the middle is avg.
                    $scope.zmLoad = success.data.load[1];


                    // console.log("X"+success.data.result+"X");
                },
                function (error) {
                    console.log("ERROR in getLoad: " + JSON.stringify(error));
                    ZMDataModel.zmLog("Error retrieving loadStatus " + JSON.stringify(error), "error");
                    $scope.zmLoad = 'undetermined';
                }
            );
    }


    //----------------------------------------------------------------------
    // start/stop/restart ZM
    //----------------------------------------------------------------------

    function controlZM(str) {
        if (inProgress) {
            $ionicPopup.alert({
                title: "Operation in Progress",
                template: "The previous operation is still in progress. Please wait..."
            });
            return;
        }

        var statesearch = "startstoprestart";
        var promptstring = 'Are you sure you want to ' + str + ' Zoneminder?';

        if (statesearch.indexOf(str) == -1) {
            promptstring = "Are you sure you want to change state to " + str;
        }


        $ionicPopup.show({
            title: 'Please Confirm',
            template: promptstring,
            buttons: [
                {
                    text: 'Cancel',
                    type: 'button-positive'
                        },
                {
                    text: 'Yes',
                    type: 'button-assertive',
                    onTap: function (e) {
                        $scope.zmRun = "please wait...";
                        $scope.color = 'color:orange;';
                        $scope.customState = "";
                        console.log("Control command is " + apiExec + str + ".json");
                        inProgress = 1;
                        $http.post(apiExec + str + ".json")
                            .then(
                                function (success) {
                                    switch (str) {
                                        case "stop":
                                            $scope.zmRun = 'stopped';
                                            $scope.color = 'color:red;';
                                            break;
                                        default:
                                            $scope.zmRun = 'running';
                                            $scope.color = 'color:green;';
                                            getCurrentState();

                                            break;

                                    }
                                    inProgress = 0;
                                },
                                function (error) {
                                    //if (error.status) // it seems to return error with status 0 if ok
                                    // {
                                    console.log("ERROR in Change State:" + JSON.stringify(error));
                                    ZMDataModel.zmLog("Error in change run state:" + JSON.stringify(error), "error");
                                    $scope.zmRun = 'undetermined';
                                    $scope.color = 'color:orange;';
                                    inProgress = 0;

                                }); //incredible nesting below. I make myself proud.
                    }
                }
            ]
        });
    }

    // Binder so template can call controlZM
    $scope.controlZM = function (str) {
        controlZM(str);
    };


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** State Ctrl Left");
        // FIXME not the best way...
        // If the user exits a view before its complete,
        // make sure he can come back in and redo
        inProgress = 0;
    });


    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        getRunStatus();
        getLoadStatus();
        getDiskStatus();
        getCurrentState();
        $scope.$broadcast('scroll.refreshComplete');

    };

}]);
