/**
 * Created by dcastane on 18/07/16.
 */
(function () {

    'use strict';

    var myApp = angular.module('CreateNotificationsApp', ['ckeditor', 'ngResource', 'ngSanitize']);

/*
    myApp.factory('notificationService', ['$http', '$resource', '$timeout', '$q',
        function ($http, $resource, $timeout, $q) {



             //Returns a random set of promotions via an $http promise

            function createNotification(newNotification) {
                console.log('Entered to createNotification(newNotification)');

                var config = {
                    'Content-Type': 'application/json'
                };


                var returnPromise = $http.put('http://localhost:3399/api/v1/schedules', newNotification, config);

                console.log('Done promise creation');


                return returnPromise;
            }

            return {
                createNotification: createNotification
            };

        }]);
*/
    myApp.controller('NotificationsCreateController',
        ['$scope', '$window', '$http', '$resource', '$timeout', '$q', NotificationsCreateController] );


    function NotificationsCreateController($scope, $window, $http, $resource, $timeout, $q) {

        $scope.greeting = "Hello World";
        $scope.showError = false;
        $scope.error = '';

        $scope.initNotification = function () {
            $scope.notif =
            {
                notificationId: uuid.v1(),
                notificationType: 'EVENT_REMINDER',
                notificationName: 'Invitación desfile de modas',
                triggerUrl: 'http://localhost:3399/api/v1/schedules',
                triggerMethod: 'PUT',
                expression: 'every 1 mins',
                expressionFormat: 'TEXT',
                isRecurring: true,
                expires: (new Date(2016,8,19,0,0,0,0)).getTime(),
                data: {  // data contains all custom information about the scheduled event
                    content: {
                        title: 'Hoy 6:30pm desfile de modas en Plaza Altabrisa',
                        titleParameters: [],
                        briefContent: 'No te pierdas nuestro desfile de modas hoy en Plaza Altabrisa',
                        briefFormat: 'TEXT',
                        briefParameters: [],
                        content: 'No te pierdas nuestro desfile de modas hoy en Plaza Altabrisa, va a estar super chido',
                        contentFormat: 'HTML',
                        contentParameters: [],
                        language: 'es_MX'
                    },
                    sender: {
                        id: '0001',
                        username: 'daniel@kwantec.com',
                        email: 'daniel@kwantec.com',
                        nickname: 'tubrody',
                        displayName: 'Daniel Castaneda',
                        businessId: '0045',
                        businessName: 'La Parrilla'
                    },
                    receiver:{
                        scope: 'REGION',
                        scopeData: {
                            countryId: '0001',
                            countryName: 'Mexico',
                            stateId: '0029',
                            stateName: 'Yucatan',
                            cityId: '0003',
                            cityName: 'Merida'
                        },
                        target: 'FOLLOWERS',
                        targetData: {
                            businessId: '0045',
                            businessName: 'La Parrilla'
                        }
                    },
                    languages: 'SAME',
                    languageData: [],
                    customTargetSelectorId: null,
                    customScopeSelectorId: null,
                    ignoreOff: false
                }
            };
        };

        $scope.initNotification();


        $scope.createNotification = function(newNotification) {
            console.log('Entered to createNotification(newNotification)');

            var config = {
                'Content-Type': 'application/json'
            };


            var returnPromise = $http.put('http://localhost:3399/api/v1/schedules', newNotification, config);

            console.log('Done promise creation');


            return returnPromise;
        }

        // Editor options.
        $scope.options = {
            language: 'en',
            allowedContent: true,
            entities: false
        };

        // Called when the editor is completely ready.
        $scope.onReady = function () {
            console.log('CKEditor ready');
        };

        $scope.setError = function(theError){
            if ((undefined === theError)||(null === theError)||('' === theError))
            {
                $scope.showError = false;
                $scope.error = '';
            }else{
                $scope.error = theError;
            }
        };


        $scope.doCreate = function(){
            console.log('Pressed Send Notification');
            if ((undefined === $scope.notif)||(null === $scope.notif))
            {
                $scope.setError('Invalid Notification, please complete required fields');
                return;
            }

            $scope.setError(null);


            //notificationService.createNotification($scope.notif)
            $scope.createNotification($scope.notif)
                .then(
                    function(response){
                        console.log(response);
                        $scope.setError(null);
                        $scope.initNotification();

                    })
                .catch(
                    function (err){
                        console.log(err);
                        $scope.setError('Error creating notification, please try again');
                    });

        };

    };

})();