/**
 * Created by dcastane on 18/07/16.
 */
(function () {

    'use strict';

    var myApp = angular.module('CreateNotificationsApp', ['ckeditor', 'ngResource', 'ngSanitize', 'ngMaterial', 'ui.bootstrap']);


    myApp.controller('NotificationsCreateController',
        ['$scope', '$window', '$http', '$resource', '$timeout', '$q', NotificationsCreateController] );


    function NotificationsCreateController($scope, $window, $http, $resource, $timeout, $q) {

        $scope.greeting = "Hello World";
        $scope.showError = false;
        $scope.error = '';
        $scope.minDate = new Date();
        $scope.expiresDate = new Date(
            $scope.minDate.getFullYear(),
            $scope.minDate.getMonth() + 2,
            $scope.minDate.getDate(),11,59);


        $('#timeZone select').timezones();


        $scope.initNotification = function () {


            $scope.minDate = new Date();

            $scope.moments = [];
            $scope.times = [];

            $scope.expiresDate = new Date(
                $scope.minDate.getFullYear(),
                $scope.minDate.getMonth() + 2,
                $scope.minDate.getDate(), 11,59);

            $scope.hstep = 1;
            $scope.mstep = 15;
            $scope.ismeridian = true;


            $scope.notif =
            {
                notificationId: uuid.v1(),
                notificationType: 'EVENT_REMINDER',
                notificationName: 'Invitación desfile de modas',
                expires: moment( $scope.expiresDate.getTime() ).format(),
                triggerUrl: 'http://localhost:3399/api/v1/schedules',
                triggerMethod: 'PUT',
                triggerMoments:[],
                isRecurring: true,
                recurrent:{
                    expressionFormat: 'TEXT',   // TEXT | CRON | JSON
                    expression: 'every 1 mins'
                },
                data: {  // data contains all custom information about the scheduled event
                    languages: 'SAME',
                    languageData: [],
                    customTargetSelectorId: null,
                    customScopeSelectorId: null,
                    ignoreOff: false,
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
                    }
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

        $scope.removeMoment = function(index){
            if ((index >= 0)&&(index < $scope.moments.length))
            {
                $scope.moments.splice(index, 1);
            }else{
                console.log('Attempted to remove invalid index: '+index);
            }
        };

        $scope.addMoment = function(index){

            $scope.moments.push(new Date());

            var nt = new Date();

            var min = nt.getMinutes();

            if ((min > 0)&&(min < 15))
            {
                nt.setMinutes(15);
            }else if ((min > 15)&&(min < 30)){

                nt.setMinutes(30);
            }else if ((min > 30)&&(min < 45)){

                nt.setMinutes(45);
            }else if ((min > 45)&&(min <= 59 )){
                // next hour
                var hr = nt.getHours();
                nt.setMinutes(0);
                if (hr === 23){
                    // next day (set to zero as day does not matter given we are only using this date for storing time)
                    nt.setHours(0);
                }else{
                    nt.setHours(hr+1);
                }
            }

            $scope.times.push(nt);

        };



        $scope.doCreate = function(){
            console.log('Pressed Send Notification');
            if ((undefined === $scope.notif)||(null === $scope.notif))
            {
                $scope.setError('Invalid Notification, please complete required fields');
                return;
            }

            $scope.setError(null);


            var tz = $('#timeZone select').val();

            if ((null === tz)||(undefined === tz))
            {
                tz = moment.tz.guess();
                console.log('Using guessed Time Zone: ' + tz);
            }else if (moment.tz.zone(tz) === null){
                tz = moment.tz.guess();
                console.log('Using guessed Time Zone: ' + tz);
            }

            $scope.notif.recurrent.timeZone = tz;

            // this makes expiration date inclusive all day (valid until before 23:59:59)
            // we could choose to do it exclusively - not sure what is best
            $scope.expiresDate.setHours(23);
            $scope.expiresDate.setMinutes(59);
            $scope.expiresDate.setSeconds(59);

            //$scope.notif.expires = $scope.expiresDate.getTime();
            $scope.notif.expires = moment.tz( $scope.expiresDate.getTime(), tz ).format();
            console.log('Expires: ' + $scope.notif.expires);
            $scope.notif.triggerMoments = [];

            var tmpDate = null;
            var tmpMoment = null;
            var tmpStr = null;
            var dateFormat = 'YYYY-M-D:H:m';

            for(var i = 0;i < $scope.moments.length;i++)
            {

                tmpStr = $scope.moments[i].getFullYear()
                        + '-' + $scope.moments[i].getMonth()
                        + '-' + $scope.moments[i].getDate()
                        + ':' + $scope.times[i].getHours()
                        + ':' + $scope.times[i].getMinutes();

                tmpMoment = moment.tz(tmpStr, dateFormat, tz);

                $scope.notif.triggerMoments.push(tmpMoment.format());
            };

            console.log('SENDING NOTIFICATION WITH: \n' + JSON.stringify($scope.notif));


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