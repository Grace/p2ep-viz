'use strict';

import React from 'react';
import $ from 'jquery';
import _ from 'lodash';
import UI from 'UI';
import * as d3 from 'd3';
import d3Wrap from 'react-d3-wrap'
import Singleton from '../singleton/Singleton.js';
import store from '../store.js'

const D3ForceDirectedGraph = d3Wrap({
    initialize (svg, data, options) {
        // Optional initialize method called once when component mounts

        // continue your d3 implementation as usual...
        Singleton.d3Data.svg = d3.select(svg)
            .append('g')
            .attr('transform', `translate(${options.margin.left}, ${options.margin.top})`);
        Singleton.d3Data.width = +Singleton.d3Data.svg.attr("width");
        Singleton.d3Data.height = +Singleton.d3Data.svg.attr("height");

        store.subscribe( function() {
            console.log("State changed");

            Singleton.d3Data.simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) {
                    return d.index;
                }))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(Singleton.d3Data.width / 2, Singleton.d3Data.height / 2));

            Singleton.d3Data.labelColor = {
                "Plant": "#00b159",
                "Gene": "#00aedb",
                "Disease": "#d11141",
                "Medical_Heading": "#d11141",
                "Chemical": "#ffc425",
                "Pathway": "#f37735"
            }
            if (store.getState().app.drawForceDirectedGraph) {
                console.log("d3 should draw");
                var graph = Singleton.neo4jData.d3_graph;

                    var link = Singleton.d3Data.svg.append("g")
                        .selectAll("line")
                        .data(graph.links)
                        .enter().append("line")
                        .attr("class", "link")
                        .style("marker-end",  "url(#suit)") // direction arrow
                        .attr("stroke", "#999")
                        .attr("stroke-opacity", "0.6")
                        .attr("stroke-width", function (d) {
                            return 1.0; // an edge-weight calculation can eventually replace this placeholder number
                        });

                    var node = Singleton.d3Data.svg.append("g")
                        .attr("class", "node")
                        .selectAll("circle")
                        .data(graph.nodes)
                        .enter().append("circle")
                        .attr("r", 10).attr("fill", function (d) {
                            return Singleton.d3Data.labelColor[d.label];
                        })
                        .attr("stroke", "#fff")
                        .attr("stroke-width", "1.5px")
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended));

                    node.append("title")
                        .text(function (d) {
                            return d.label;
                        });

                    Singleton.d3Data.simulation
                        .nodes(graph.nodes)
                        .on("tick", ticked);

                    Singleton.d3Data.simulation.force("link")
                        .links(graph.links);

                    function ticked() {
                        link
                            .attr("x1", function (d) {
                                return d.source.x;
                            })
                            .attr("y1", function (d) {
                                return d.source.y;
                            })
                            .attr("x2", function (d) {
                                return d.target.x;
                            })
                            .attr("y2", function (d) {
                                return d.target.y;
                            });

                        node
                            .attr("cx", function (d) {
                                return d.x;
                            })
                            .attr("cy", function (d) {
                                return d.y;
                            });

                        node.each(collide(0.5)); // collision detection
                    }
                  // Resolves collisions between d and all other circles.
                  var padding = 1, // separation between circles
                      radius=10;

                  function collide(alpha) {
                    var quadtree = d3.geom.quadtree(graph.nodes);
                    return function(d) {
                      var rb = 2*radius + padding,
                          nx1 = d.x - rb,
                          nx2 = d.x + rb,
                          ny1 = d.y - rb,
                          ny2 = d.y + rb;

                      quadtree.visit(function(quad, x1, y1, x2, y2) {
                        if (quad.point && (quad.point !== d)) {
                          var x = d.x - quad.point.x,
                              y = d.y - quad.point.y,
                              l = Math.sqrt(x * x + y * y);
                            if (l < rb) {
                            l = (l - rb) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                          }
                        }
                        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                      });
                    };
                  }

                function dragstarted(d) {
                    if (!d3.event.active)  Singleton.d3Data.simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function dragged(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }

                function dragended(d) {
                    if (!d3.event.active)  Singleton.d3Data.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }

                // direction-arrow marker used when creating links
                Singleton.d3Data.svg.append("defs").selectAll("marker")
                    .data(["suit", "licensing", "resolved"])
                  .enter().append("marker")
                    .attr("id", function(d) { return d; })
                    .attr("viewBox", "0 -5 10 10")
                    .attr("refX", 25)
                    .attr("refY", 0)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 6)
                    .attr("orient", "auto")
                  .append("path")
                    .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
                    .style("stroke", "#4679BD")
                    .style("opacity", "0.6");
            }
        });
    },

    update (svg, data, options) {
        // setup container, root svg element passed in along with data and options

        // Singleton.d3Data.svg = d3.select(svg)
        //     .append('g')
        //     .attr('transform', `translate(${options.margin.left}, ${options.margin.top})`)

        // store.subscribe( function() {
        //     if(store.getState().app.drawForceDirectedGraph) {
        //         d3.json(Singleton.neo4jData.d3_graph, function (error, graph) {
        //             if (error) throw error;
        //
        //             var link = Singleton.d3Data.svg.append("g")
        //                 .attr("class", "links")
        //                 .selectAll("line")
        //                 .data(graph.links)
        //                 .enter().append("line")
        //                 .attr("stroke", "#999")
        //                 .attr("stroke-opacity", "0.6")
        //                 .attr("stroke-width", function (d) {
        //                     return 1.0; //Math.sqrt(d.value);
        //                 });
        //
        //             var node =  Singleton.d3Data.svg.append("g")
        //                 .attr("class", "nodes")
        //                 .selectAll("circle")
        //                 .data(graph.nodes)
        //                 .enter().append("circle")
        //                 .attr("r", 10).attr("fill", function (d) {
        //                     return  Singleton.d3Data.labelColor[d.label];
        //                 })
        //                 .attr("stroke", "#fff")
        //                 .attr("stroke-width", "1.5px")
        //                 .call(d3.drag()
        //                     .on("start", dragstarted)
        //                     .on("drag", dragged)
        //                     .on("end", dragended));
        //
        //             node.append("title")
        //                 .text(function (d) {
        //                     return d.label;
        //                 });
        //
        //             Singleton.d3Data.simulation
        //                 .nodes(graph.nodes)
        //                 .on("tick", ticked);
        //
        //             Singleton.d3Data.simulation.force("link")
        //                 .links(graph.links);
        //
        //             function ticked() {
        //                 link
        //                     .attr("x1", function (d) {
        //                         return d.source.x;
        //                     })
        //                     .attr("y1", function (d) {
        //                         return d.source.y;
        //                     })
        //                     .attr("x2", function (d) {
        //                         return d.target.x;
        //                     })
        //                     .attr("y2", function (d) {
        //                         return d.target.y;
        //                     });
        //
        //                 node
        //                     .attr("cx", function (d) {
        //                         return d.x;
        //                     })
        //                     .attr("cy", function (d) {
        //                         return d.y;
        //                     });
        //             }
        //         });
        //     }

            // function dragstarted(d) {
            //     if (!d3.event.active)  Singleton.d3Data.simulation.alphaTarget(0.3).restart();
            //     d.fx = d.x;
            //     d.fy = d.y;
            // }
            //
            // function dragged(d) {
            //     d.fx = d3.event.x;
            //     d.fy = d3.event.y;
            // }
            //
            // function dragended(d) {
            //     if (!d3.event.active)  Singleton.d3Data.simulation.alphaTarget(0);
            //     d.fx = null;
            //     d.fy = null;
            // }
        // });

    },

    destroy () {
        // Optional clean up when a component is being unmounted...
    }
})

export default D3ForceDirectedGraph
