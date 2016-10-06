'use strict';

import React from 'react';
import $ from 'jquery';
import _ from 'lodash';
import UI from 'UI';
import * as d3 from 'd3';
import d3Wrap from 'react-d3-wrap'

const D3ForceDirectedGraph = d3Wrap({
    initialize (svg, data, options) {
        // Optional initialize method called once when component mounts
        var svg = d3.select(svg)
                .append('g')
                .attr('transform', `translate(${options.margin.left}, ${options.margin.top})`),
            width = +svg.attr("width"),
            height = +svg.attr("height");

        // continue your d3 implementation as usual...
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) {
                return d.index;
            }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        var labelColor = {
            "Plant": "#00b159",
            "Gene": "#00aedb",
            "Disease": "#d11141",
            "Medical_Heading": "#d11141",
            "Chemical": "#ffc425",
            "Pathway": "#f37735"
        }

        d3.json("https://s3-us-west-2.amazonaws.com/s.cdpn.io/362571/neo4j.json", function(error, graph) {
            if (error) throw error;

            var link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("stroke", "#999")
                .attr("stroke-opacity", "0.6")
                .attr("stroke-width", function(d) {
                    return 1.0; //Math.sqrt(d.value);
                });

            var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", 10).attr("fill", function(d) { return labelColor[d.label]; })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            node.append("title")
                .text(function(d) {
                    return d.label;
                });

            simulation
                .nodes(graph.nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(graph.links);

            function ticked() {
                link
                    .attr("x1", function(d) {
                        return d.source.x;
                    })
                    .attr("y1", function(d) {
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        return d.target.y;
                    });

                node
                    .attr("cx", function(d) {
                        return d.x;
                    })
                    .attr("cy", function(d) {
                        return d.y;
                    });
            }
        });

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    },

    update (svg, data, options) {
        // setup container, root svg element passed in along with data and options

    },

    destroy () {
        // Optional clean up when a component is being unmounted...
    }
})

export default D3ForceDirectedGraph
