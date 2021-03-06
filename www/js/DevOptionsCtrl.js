/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.DevOptionsCtrl', ['$scope', '$rootScope', '$ionicModal','zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', function ($scope, $rootScope, $ionicModal,zm, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading) {


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** DevOptions Ctrl Entered");
        ZMDataModel.setAwake(false);
    });

//------------------------------------------------------------------
// Perform the login action when the user submits the login form
//------------------------------------------------------------------
    $scope.saveDevOptions = function () {
    console.log('Saving Dev Options');

    if (parseInt($scope.loginData.maxMontage) > zm.safeMontageLimit) {
        $ionicPopup.alert({
            title: 'Note',
            template: 'You have selected to view more than 10 monitors in the Montage screen. Note that this is very resource intensive and may load the server or cause issues in the application. If you are not sure, please consider limiting this value to 10'
        });
    }


    if ((parseInt($scope.loginData.maxFPS) < 0) || (parseInt($scope.loginData.maxFPS) > zm.maxFPS)) {
        $scope.loginData.maxFPS = zm.defaultFPS.toString();
    }


    if ((parseInt($scope.loginData.montageQuality) < zm.safeMontageLimit) || (parseInt($scope.loginData.montageQuality) > 70)) {
        $scope.loginData.montageQuality = zm.defaultMontageQuality.toString();
    }



    ZMDataModel.setLogin($scope.loginData);

        $ionicPopup.alert({
                        title: 'Settings Saved',
                        template: 'Please explore the menu and enjoy zmNinja!'
                }).then(function(res) { $ionicSideMenuDelegate.toggleLeft();});
};
     //------------------------------------------------------------------
    // controller main
    //------------------------------------------------------------------


    $scope.loginData = ZMDataModel.getLogin();



}]);
