# OpenFn Extension for Visual Studio Code

A visual studio code extension that provides basic support for writing and managing OpenFn workflows.

## Install

1. Install VSCode from [here](https://code.visualstudio.com/)
2. Install the OpenFn extension by searching "OpenFn" in the marketplace.

## Dependencies

In order to run a workflow this extension depends on OpenFn CLI which can be installed with:

`npm install -g @openfn/cli` 

The workflow should be declared on a `workflow.json`. You can find an example of its JSON structure [here](https://docs.openfn.org/documentation/cli-usage#run-a-workflow).

## Highlighted Features

- Errors and informations when changing code.
- Suggests completions and snippets (Control + Space) for adaptor functions.
- Focused overview of workflows.
- Execution of workflows from vscode.

## Configuration

Currently, you need a .openfnrc file at the root of your project to activate the OpenFn extension.

## Useful commands

Open the Command Palette (Command+Shift+P on macOS and Ctrl+Shift+P on Windows/Linux) and type in one of the following commands:

| Command                           | Description                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `OpenFn: Run Workflow(s)`         | Run a workflow present in the workspace.                                      |
| `OpenFn: Generate .openfnrc`      | Generate a .openfnrc file in the current workspace to activate the extension. |
| `OpenFn: Focus on Workflows View` | Quickly opens the workflows view and focuses on it.                           |

To see all available OpenFn commands, open the Command Palette and type `OpenFn`.
