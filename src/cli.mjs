#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./app.js";

// Parse command line arguments
const args = process.argv.slice(2);
const userInput = args.length > 0 ? args.join(" ") : undefined;

render(<App userInput={userInput} />);
