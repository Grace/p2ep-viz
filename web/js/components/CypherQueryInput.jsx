import React from 'react';
import TextField from 'material-ui/TextField';
import LinearProgress from 'material-ui/LinearProgress';
import ActionSearch from 'material-ui/svg-icons/action/play-for-work';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import $ from 'jquery'
import _ from 'lodash';
import UI from 'UI';


class CypherQueryInput extends React.Component {

    constructor(props) {
        super(props);
        this.transactionUrl = 'http://localhost:7474/db/data/transaction';
        this.commitUrl = '';
        this.state = {
            userInput: '',
            isLoading: false,
            queryJson: null
        };

        this.style = {
            button: {
                margin: 12,
            },
            container: {
                position: 'relative',
            },
            refresh: {
                display: 'inline-block',
                position: 'relative',
            },
            cypherQueryInput: {

            }
        };
    }

    // Handler for when text changes in the CypherQueryInput TextField
    handleChange = (event) => {
        this.setState({
            userInput: event.target.value,
        });
    };

    // Asks Neo4j to run the user input as a Cypher Query. Returns a JSON object with the Cypher Query results.
    runCypherQuery = (userInput) => {
        var jsonifyCypherStatement = function (cypherQuery) {
            var jsonData = JSON.stringify({
                "statements": [{
                    "statement": cypherQuery.toString(),
                    "parameters": null,
                    "resultDataContents": [
                        "row",
                        "graph"
                    ],
                    "includeStats": true
                }]
            });
            return jsonData;
        };

        // Sorry to my future self or whoever reads this for how ugly the parsing code is, but it works.
        var parseQueryJson = function (jsonObject) {
            window.queryJson = jsonObject;
            window.results = jsonObject.results[0];
            window.columns = results.columns;
            window.data = results.data;
            window.stats = results.stats;
            window.graphs = [];
            window.graphData = [];
            window.nodes = [];
            window.relationships = [];
            window.nodeIds = [];
            window.nodeIndexHash = {};
            var nodes = [];
            var relationships = [];
            var d3_nodes = [];
            var d3_links = [];

            // Fill the nodes and relationship arrays
            for(var i=0; i < results.data.length; i++) {
                var data = window.data[i];
                window.graphs.push(data.graph);
                window.graphData.push(data);
                var graph = data.graph;
                window.nodes.push(graph.nodes);
                window.nodes = _.flatten(window.nodes);
                window.relationships.push(graph.relationships);
                window.relationships = _.flatten(window.relationships);
                nodes = window.nodes;
                relationships = window.relationships;
            }


            for(var i2 = 0; i2 < nodes.length; i2++) {
                var node = nodes[i2];
                var id = node.id;
                var label = node.labels[0];
                var properties = node.properties;
                var name = properties['Name'] || null;
                var source = properties['Source'] || null;
                var sourceId = properties['SourceID'] || null;
                var synonyms = properties['Synonyms'] || null;

                var d3_node = {};
                d3_node['index'] = i2;
                d3_node['id'] = id;
                d3_node['label'] = label;
                d3_node['name'] = name;
                d3_node['source'] = source;
                d3_node['sourceId'] = sourceId;
                d3_node['synonyms'] = synonyms;
                d3_nodes.push(d3_node);
            }

            window.d3_nodes = d3_nodes;
            for(var index = 0; index < d3_nodes.length; index++) {
                var key = d3_nodes[index].id;
                var value = index;
                window.nodeIndexHash[key] = value;
            }

            for(var j = 0; j < relationships.length; j++) {
                var relationship = relationships[j];
                var startNodeId = relationship.startNode;
                var endNodeId = relationship.endNode;
                var sourceIndex = window.nodeIndexHash[startNodeId];
                var targetIndex = window.nodeIndexHash[endNodeId];
                var d3_link = {
                    'source': sourceIndex,
                    'target': targetIndex
                };
                d3_links.push(d3_link);
            }
            window.d3_links = d3_links;
            window.d3_graph = {
                'nodes': window.d3_nodes,
                'links': window.d3_links
            };
            console.prettyPrint(window.d3_graph);

            // Draw D3 force-directed graph (uses d3 version 3) TODO: To work, this needs to be changed to d3v4 compatability
            d3.json(window.d3_graph, function(error, graph) {
                nodeGraph = graph;

                graph.links.forEach(function(d) {
                    d.source = graph.nodes[d.source];
                    d.target = graph.nodes[d.target];
                });

                link = link.data(graph.links).enter().append("line")
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });


                var force = d3.layout.force()
                    .charge(-120)
                    .linkDistance(30)
                    .nodes(graph.nodes)
                    .links(graph.links)
                    .size([width, height])
                    .start();

                function dragstarted(d) {
                    d3.event.sourceEvent.stopPropagation();
                    if (!d.selected && !shiftKey) {
                        // if this node isn't selected, then we have to unselect every other node
                        node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
                    }

                    d3.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

                    node.filter(function(d) { return d.selected; })
                        .each(function(d) { d.fixed |= 2; })
                }

                function dragged(d) {
                    node.filter(function(d) { return d.selected; })
                        .each(function(d) {
                            d.x += d3.event.dx;
                            d.y += d3.event.dy;

                            d.px += d3.event.dx;
                            d.py += d3.event.dy;
                        })

                    force.resume();
                }
                node = node.data(graph.nodes).enter().append("circle")
                    .attr("r", 10)
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; })
                    .on("dblclick", function(d) { d3.event.stopPropagation(); })
                    .on("click", function(d) {
                        if (d3.event.defaultPrevented) return;

                        if (!shiftKey) {
                            //if the shift key isn't down, unselect everything
                            node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; })
                        }

                        // always select this node
                        d3.select(this).classed("selected", d.selected = !d.previouslySelected);
                    })
                    .on("mouseover", function(d) {
                        console.log(d);
                    })
                    .on("mouseout", function(d) {
                    })
                    .on("mouseup", function(d) {
                        //if (d.selected && shiftKey) d3.select(this).classed("selected", d.selected = false);
                    })
                    .call(d3.behavior.drag()
                        .on("dragstart", dragstarted)
                        .on("drag", dragged)
                        .on("dragend", dragended));

                function tick() {
                    link.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                    node.attr('cx', function(d) { return d.x; })
                        .attr('cy', function(d) { return d.y; });

                };

                force.on("tick", tick);

            });
        };

        // POST request that sends the JSON encoded Cypher query (user input) to Neo4j
        var postCypherJson = function () {
            $.ajax({
                type: "POST",
                url: this.transactionUrl,
                dataType: 'json',
                cache: false,
                success: function (jsonObject) {
                    // Store the reponse of the POST to the transaction URL to this.commitUrl
                    // So, the commit URL is obtained from the response of the transaction URL because each has a unique ID in the URL, and we need to ask Neo4j what URL we should use to POST data (commit) every time.
                    // In other words, this.commitUrl tells us where to POST the user input as a JSON object in order to ask Neo4j to run the user input as Cypher query.
                    this.commitUrl = jsonObject.commit;
                    // Convert user input (Cypher Query string) to a json object that Neo4j understands/expects
                    var cypherQuery = userInput.toString();
                    var jsonData = jsonifyCypherStatement(cypherQuery);
                    // POST user input (assumes valid Cypher query string) to this.commitUrl
                    console.log('Debug: Sending Cypher Query to Neo4j... This might take a few seconds.');
                    $.ajax({
                        type: "POST",
                        url: this.commitUrl,
                        data: jsonData,
                        dataType: 'json',
                        contentType: 'application/json;charset=utf-8',
                        cache: false,
                        success: function (jsonObject) {
                            console.log('Cypher Query results:');
                            console.prettyPrint(jsonObject);
                            this.setState({ queryJson: jsonObject });
                            window.nodeIdToIndexDict = {};
                            parseQueryJson(jsonObject);
                        }.bind(this),
                        error: function (xhr, status, err) {
                            console.log('Error attempting to POST this data:');
                            console.prettyPrint(jsonData);
                            console.error(this.commitUrl, status, err.toString());
                            this.setState({ queryJson: jsonObject });
                            window.nodeIdToIndexDict = {};
                            parseQueryJson(jsonObject);

                        }.bind(this)
                    });
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.transactionUrl, status, err.toString());
                }.bind(this)
            });
        };
        postCypherJson.call(this);
    };

    setLoading = (value) => {
      this.setState( { isLoading: value });
    };

    clearQueryResults = () => {
      this.setState({ queryJson: null });
    };

    handleClick = (event) => {
        // TODO: add user input validation
        // Ask Neo4j to run the user input as a Cypher Query (currently assumes user input is a valid Cypher query and JavaScript string type)
        this.clearQueryResults();
        this.setLoading(true);
        var queryJson = this.runCypherQuery(this.state.userInput.toString());
    };

    // Handler that listens for when keys are pressed
    handleKeyPress = (event) => {
        if(event.key == 'Enter'){
            event.preventDefault();
            // TODO: add user input validation
            // Ask Neo4j to run the user input as a Cypher Query (currently assumes user input is a valid Cypher query and JavaScript string type)
            this.clearQueryResults();
            this.setLoading(true);
            var queryJson = this.runCypherQuery(event.target.value.toString());
        }
    };

    render() {
        return (
            <div class="cypher-query-component">
                <TextField
                    id="cypher-query-input"
                    value={this.state.userInput}
                    style={this.style.cypherQueryInput}
                    fullWidth={true}
                    multiLine={true}
                    rows={1}
                    rowsMax={50}
                    hintText="Please type a Cypher query and press the ENTER key or click RUN QUERY"
                    floatingLabelText="Cypher Query Search"
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
                <RaisedButton
                    id="run-query-button"
                    label="Run Query"
                    labelPosition="before"
                    primary={true}
                    style={this.style.button}
                    onClick={this.handleClick}
                />
                {this.state.isLoading && this.state.queryResults === null ? <LinearProgress mode="indeterminate" /> : <br/>}
                <div align='center' id="d3_selectable_force_directed_graph"></div>
            </div>
        );
    }
}

export default CypherQueryInput;
