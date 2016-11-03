
export default function reducer(state={
  fetching: false,
  fetched: false,
  test: [],
  error: null,
  cypherQuerying: false,
  drawForceDirectedGraph: false
}, action) {
  switch(action.type) {

    case "CYPHER_QUERY_START": {
      return {...state,
        cypherQuerying: true
      };
      break;
    }
    case "CYPHER_QUERY_END": {
      return {...state,
        cypherQuerying: false
      };
      break;
    }
    case "DRAW_FORCE_DIRECTED_GRAPH": {
      return {...state,
        drawForceDirectedGraph: true
      };
      break;
    }
    case "FETCH_TEST_PENDING": {
      return {...state,
        fetching: true
      };
      break;
    }
    case "FETCH_TEST_REJECTED": {
      return {...state,
        fetching: false,
        error: action.payload
      };
      break;
    }
    case "FETCH_TEST_FULFILLED": {
      return {...state,
        fetching: false,
        fetched: false,
        test: [...state.test]
      };
      break;
    }

  }

  return state;
}
