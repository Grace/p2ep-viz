import React from 'react';
import TextField from 'material-ui/TextField';
import LinearProgress from 'material-ui/LinearProgress';
import Singleton from '../singleton/Singleton.js';
import D3ForceDirectedGraph from './D3ForceDirectedGraph.jsx';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import $ from 'jquery';
import _ from 'lodash';
import UI from 'UI';
import store from '../store.js'


class CypherQueryInput extends React.Component {

    constructor(props) {
        super(props);

        // Log the initial state
        console.log(store.getState())

        // Every time the state changes, log it
        // Note that subscribe() returns a function for unregistering the listener
        let unsubscribe = store.subscribe(() =>
            console.log(store.getState())
        )

        this.transactionUrl = 'http://localhost:7474/db/data/transaction';
        this.commitUrl = '';
        Singleton.neo4jData.drawGraph = false;

        this.nodes = [];
        this.relationships = [];

        this.state = {
            userInput: '',
            isLoading: false,
            queryJson: null,
            drawD3Component: false
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
            cypherQueryInput: {}
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
        var that = this;
        Singleton.neo4jData.queryJson = null;
        Singleton.neo4jData.results = null;
        Singleton.neo4jData.columns = null;
        Singleton.neo4jData.data = null;
        Singleton.neo4jData.stats = null;
        Singleton.neo4jData.graph = {};
        Singleton.neo4jData.graphs = [];
        Singleton.neo4jData.graphData = [];
        Singleton.neo4jData.nodes = [];
        Singleton.neo4jData.relationships = [];
        Singleton.neo4jData.nodeIds = [];
        Singleton.neo4jData.nodeIndexHash = {};
        Singleton.neo4jData.nodes = [];
        Singleton.neo4jData.relationships = [];
        Singleton.neo4jData.d3_nodes = [];
        Singleton.neo4jData.d3_links = [];
        Singleton.neo4jData.d3_graph = {};


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
            Singleton.neo4jData.queryJson = jsonObject;
            Singleton.neo4jData.results = jsonObject.results[0];
            Singleton.neo4jData.columns = Singleton.neo4jData.results.columns;
            Singleton.neo4jData.data = Singleton.neo4jData.results.data;
            Singleton.neo4jData.stats = Singleton.neo4jData.results.stats;


            // Fill the nodes and relationship arrays
            for (var i = 0; i < Singleton.neo4jData.results.data.length; i++) {
                var _data = Singleton.neo4jData.data[i];
                Singleton.neo4jData.graphs.push(_data.graph);
                Singleton.neo4jData.graphData.push(_data);
                var _graph = _data.graph;
                Singleton.neo4jData.nodes.push(_graph.nodes);
                Singleton.neo4jData.nodes = _.flatten(Singleton.neo4jData.nodes);
                Singleton.neo4jData.relationships.push(_graph.relationships);
                Singleton.neo4jData.relationships = _.flatten(Singleton.neo4jData.relationships);
            }

            for (var i2 = 0; i2 < Singleton.neo4jData.nodes.length; i2++) {
                var node = Singleton.neo4jData.nodes[i2];
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
                Singleton.neo4jData.d3_nodes.push(d3_node);
            }

            for (var index = 0; index < Singleton.neo4jData.d3_nodes.length; index++) {
                var key = Singleton.neo4jData.d3_nodes[index].id;
                var value = index;
                Singleton.neo4jData.nodeIndexHash[key] = value;
            }

            for (var j = 0; j < Singleton.neo4jData.relationships.length; j++) {
                var relationship = Singleton.neo4jData.relationships[j];
                var startNodeId = relationship.startNode;
                var endNodeId = relationship.endNode;
                var sourceIndex = Singleton.neo4jData.nodeIndexHash[startNodeId];
                var targetIndex = Singleton.neo4jData.nodeIndexHash[endNodeId];
                var d3_link = {
                    'source': sourceIndex,
                    'target': targetIndex
                };
                Singleton.neo4jData.d3_links.push(d3_link);
            }
            Singleton.neo4jData.d3_graph = {
                'nodes': Singleton.neo4jData.d3_nodes,
                'links': Singleton.neo4jData.d3_links
            };
            //console.log("D3 Graph:");
            //console.prettyPrint(d3_graph);
            //TODO: Draw D3 graph with d3_graph as json input
            that.setState({ drawD3Component: true });
            // Dispatch an action
            store.dispatch({
                type: 'DRAW_FORCE_DIRECTED_GRAPH',
            });
            return Singleton.neo4jData.d3_graph;
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
                            // Dispatch an action
                            store.dispatch({
                                type: 'CYPHER_QUERY_END'
                            });
                            console.log('Cypher Query results:');
                            //console.prettyPrint(jsonObject);
                            this.setState({queryJson: jsonObject});
                            Singleton.neo4jData.graph = parseQueryJson(jsonObject);
                            console.log(Singleton.neo4jData.graph);
                        }.bind(this),
                        error: function (xhr, status, err) {
                            // Dispatch an action
                            store.dispatch({
                                type: 'CYPHER_QUERY_END'
                            });
                            console.log('Error attempting to POST this data:');
                            console.prettyPrint(jsonData);
                            console.error(this.commitUrl, status, err.toString());
                            this.setState({queryJson: jsonObject});
                            //var graph = parseQueryJson(jsonObject);
                        }.bind(this)
                    });
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.transactionUrl, status, err.toString());
                }.bind(this)
            });
        };
        postCypherJson.call(this);
        return Singleton.neo4jData.graph;
    };

    setLoading = (value) => {
        this.setState({isLoading: value});
    };

    clearQueryResults = () => {
        this.setState({queryJson: null});
    };

    handleClick = (event) => {
        // TODO: add user input validation

        // Ask Neo4j to run the user input as a Cypher Query (currently assumes user input is a valid Cypher query and JavaScript string type)
        this.clearQueryResults();
        this.setLoading(true);
        Singleton.neo4jData.queryResultObject = this.runCypherQuery(this.state.userInput.toString());

        // Dispatch an action
        store.dispatch({
            type: 'CYPHER_QUERY_START'
        });

        // Log the current state
        console.log(store.getState())
    };

    // Handler that listens for when keys are pressed
    handleKeyPress = (event) => {
        if (event.key == 'Enter') {
            event.preventDefault();
            // TODO: add user input validation

            // Ask Neo4j to run the user input as a Cypher Query (currently assumes user input is a valid Cypher query and JavaScript string type)
            this.clearQueryResults();
            this.setLoading(true);
            Singleton.neo4jData.queryResultObject = this.runCypherQuery(event.target.value.toString());

            // Dispatch an action
            store.dispatch({
                type: 'CYPHER_QUERY_START'
            });

            // Log the current state
            console.log(store.getState())
        }
    };

    componentDidMount() {
        console.log("CypherQueryInput mounted.");
    }

    render() {
        return (
            <div class="cypher-query-component" id="cypher-query-component">
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
                {this.state.isLoading && this.state.queryJson === null ? <LinearProgress mode="indeterminate"/> : <br/>}
            </div>
        );
    }
}

export default CypherQueryInput;
