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
});
