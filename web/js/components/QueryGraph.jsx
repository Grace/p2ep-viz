'use strict';

import React from 'react';
import $ from 'jquery';
import _ from 'lodash';
import UI from 'UI';
import * as d3 from 'd3';
import d3Wrap from 'react-d3-wrap'

const QueryGraph = d3Wrap({
    initialize (svg, data, options) {
        // Optional initialize method called once when component mounts
    },

    update (svg, data, options) {
        // setup container, root svg element passed in along with data and options
        var svg = d3.select(svg)
            .append('g')
            .attr('transform', `translate(${options.margin.left}, ${options.margin.top})`),
            width = +svg.attr("width"),
            height = +svg.attr("height");

        // continue your d3 implementation as usual...
        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(10).strength(0.5))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        d3.json("https://s3-us-west-2.amazonaws.com/s.cdpn.io/362571/miserables.json", function(error, graph) {
            if (error) throw error;

            var nodes = graph.nodes,
                nodeById = d3.map(nodes, function(d) { return d.id; }),
                links = graph.links,
                bilinks = [];

            links.forEach(function(link) {
                var s = link.source = nodeById.get(link.source),
                    t = link.target = nodeById.get(link.target),
                    i = {}; // intermediate node
                nodes.push(i);
                links.push({source: s, target: i}, {source: i, target: t});
                bilinks.push([s, i, t]);
            });

            var link = svg.selectAll(".link")
                .data(bilinks)
                .enter().append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#bbb");


            var node = svg.selectAll(".node")
                .data(nodes.filter(function(d) { return d.id; }))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)
                .attr("fill", function(d) { return color(d.group); })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            node.append("title")
                .text(function(d) { return d.id; });

            simulation
                .nodes(nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(links);

            function ticked() {
                link.attr("d", positionLink);
                node.attr("transform", positionNode);
            }
        });

        function positionLink(d) {
            return "M" + d[0].x + "," + d[0].y
                + "S" + d[1].x + "," + d[1].y
                + " " + d[2].x + "," + d[2].y;
        }

        function positionNode(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x, d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x, d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null, d.fy = null;
        }
    },

    destroy () {
        // Optional clean up when a component is being unmounted...
    }
})

export default QueryGraph
