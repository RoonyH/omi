({
    paths: {
        'jquery': './thirdparty/jquery.min',
        'underscore': './thirdparty/underscore',
        'backbone': './thirdparty/backbone'
    },
    name: 'app',
    out: 'app-built.js',
    onBuildWrite   : function( name, path, contents ) {
      console.log( 'Writing: ' + name );
      return contents.replace(/console\.log(.*);/g, '');
    }
})
