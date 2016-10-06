import React from 'react';
import D3ForceDirectedGraph from './D3ForceDirectedGraph.jsx';
import CypherQueryInput from './CypherQueryInput.jsx';
import $ from 'jquery';
import _ from 'lodash';


class Neo4jGraphQueryComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            queryJson: null,
            showGraphComponent: false
        };

        this.style = {
            container: {
                position: 'relative',
            }
        };
    }

    // Sorry to my future self or whoever reads this for how ugly the parsing code is, but it works.
    parseQueryJson = (jsonObject) => {
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

        // Fill the nodes and relationship arrays
        for (var i = 0; i < results.data.length; i++) {
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

        var d3_nodes = [];
        var d3_links = [];

        for (var i2 = 0; i2 < nodes.length; i2++) {
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
        for (var index = 0; index < d3_nodes.length; index++) {
            var key = d3_nodes[index].id;
            var value = index;
            window.nodeIndexHash[key] = value;
        }

        for (var j = 0; j < relationships.length; j++) {
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
        //TODO: Draw D3 graph with window.d3_graph as json input
        window.drawGraph = true;
    };


    setLoading = (value) => {
        this.setState({isLoading: value});
    };

    clearQueryResults = () => {
        this.setState({queryJson: null});
    };

    render() {
        return (
            <div>

                <CypherQueryInput />
                <D3ForceDirectedGraph data={[1,2,3]} width={960} height={700} options={{color: '#ff0000', margin: {top: 350, bottom: 0, left: 480, right: 0}}} />

            </div>
        );
    }
}

export default Neo4jGraphQueryComponent;
