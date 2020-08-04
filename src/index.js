import React from "react";
import ReactDOM from "react-dom";
import { ApolloClient, InMemoryCache,ApolloProvider } from '@apollo/client';

import App from "./App";

const client = new ApolloClient({
  uri: 'http://localhost:4001/graphql',
  cache: new InMemoryCache(),
});
const rootElement = document.getElementById("root");
ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  rootElement
);
