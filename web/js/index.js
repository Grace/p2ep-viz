/**
 *  index.js, the starter.
 *
 *  @author  Grace Christenbery
 *
 */
'use strict';

require.ensure([
    'less/main.less',
    './fw/Entrance'
], function(require) {

    require('less/main.less');

    var Entrance = require('./fw/Entrance').default;
    (new Entrance()).run();

    // Define on global window object the very useful function prettyPrint, which helps us print JSON objects
    window.console.prettyPrint = function() {
        // Loop over arguments, so any number of objects can be passed
        for (var i = 0; i < arguments.length; i++) {
            console.log(JSON.stringify(arguments[i], 0, 2));
        }
    };

});
