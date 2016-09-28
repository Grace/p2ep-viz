import React from 'react';
import TextField from 'material-ui/TextField';
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
            value: ''
        };
    }

    handleChange = (event) => {
        this.setState({
            value: event.target.value,
        });
    };

    sendCypherQuery = (userInput) => {
        $.ajax({
            type: "POST",
            url: this.transactionUrl,
            dataType: 'json',
            cache: false,
            success: function(jsonObject) {
                // Store the transaction commit URL to this.commitUrl
                this.commitUrl = jsonObject.commit;
                // Convert user input (Cypher Query string) to a json object that Neo4j understands
                var cypherQuery = userInput.toString();
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
                //POST user input (assumes valid Cypher query string) to this.commitUrl
                console.log('Debug: Sending Cypher Query to Neo4j... This might take a few seconds.');
                $.ajax({
                    type: "POST",
                    url: this.commitUrl,
                    data: jsonData,
                    dataType: 'json',
                    contentType: 'application/json;charset=utf-8',
                    cache: false,
                    success: function(jsonObject) {
                        console.log('Cypher Query results:');
                        console.log(jsonObject);
                    }.bind(this),
                    error: function(xhr, status, err) {
                        console.log('Error attempting to POST this data:');
                        console.log(jsonData);
                        console.error(this.commitUrl, status, err.toString());
                    }.bind(this)
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.transactionUrl, status, err.toString());
            }.bind(this)
        });
    };

    handleKeyPress = (event) => {
        if(event.key == 'Enter'){
            // Ask Neo4j to run user input as a Cypher Query (assumes user input is a valid Cypher query)
            this.sendCypherQuery(event.target.value.toString());
        }
    };

    render() {
        return (
            <div>
                <TextField
                    id="cypher-query-input"
                    value={this.state.value}
                    fullWidth={true}
                    multiLine={true}
                    rows={2}
                    rowsMax={50}
                    hintText="Please type a Cypher query and press the ENTER key"
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
            </div>
        );
    }
}

export default CypherQueryInput;
