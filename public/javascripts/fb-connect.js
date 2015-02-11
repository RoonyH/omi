function connectFB(callback){
  console.log('ane')

  FB.init({
    appId: "1591263741108585",
    frictionlessRequests: true,
    status: true,
    version: 'v2.1'
  });

  FB.Event.subscribe('auth.authResponseChange', onAuthResponseChange);
  FB.Event.subscribe('auth.statusChange', onStatusChange);

  function login(callback) {
    FB.login(callback);
  }
  function loginCallback(response) {
    console.log('loginCallback',response);
    if(response.status != 'connected') {
      top.location.href = 'https://www.facebook.com/appcenter/YOUR_APP_NAMESPACE';
    }
  }
  function onStatusChange(response) {
    if( response.status != 'connected' ) {
      login(loginCallback);
    } else {
        FB.api('/me', {fields: 'id,first_name,picture.width(60).height(60)'}, function(response){
        if( !response.error ) {
          callback(response);
        } else {
          console.error('/me', response);
        }
      });
    }
  }
  function onAuthResponseChange(response) {
    console.log('onAuthResponseChange', response);
  }
}
