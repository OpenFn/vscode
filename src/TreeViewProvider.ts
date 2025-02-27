import * as vscode from "vscode";
import * as path from "path";
import { WorkflowData } from "./types";

export class TreeViewProvider implements vscode.TreeDataProvider<TreeviewItem> {
  constructor(private getWorkflowFiles: () => WorkflowData[]) {}
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeviewItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: TreeviewItem | undefined
  ): vscode.ProviderResult<TreeviewItem[]> {
    if (!element) {
      return Promise.resolve(
        this.getWorkflowFiles().map(
          (file) =>
            new TreeviewItem(
              file.name || path.basename(file.filePath),
              file.filePath,
              vscode.TreeItemCollapsibleState.Collapsed,
              file.steps
            )
        )
      );
    } else {
      return element.steps.map(
        (step) =>
          new TreeviewItem(
            step.name || path.basename(step.expression),
            path.join(path.dirname(element.filePath), step.expression),
            vscode.TreeItemCollapsibleState.None,
            [], // no steps
            step.adaptors.map((a) => a.full),
            step.state
          )
      );
    }
  }
}

export class TreeviewItem extends vscode.TreeItem {
  public readonly command: vscode.Command;
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly steps: WorkflowData["steps"] = [],
    public readonly adaptors: string[] | undefined = undefined,
    public readonly state: Record<string, any> | undefined = undefined
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    const adaptor_name = this.adaptors?.join(" + ");
    const first_adaptor = this.adaptors?.[0]?.match(/^\w+/)?.[0];
    if (!first_adaptor && !adaptor_name) {
      this.iconPath = path.join(
        __filename,
        "..",
        "..",
        "resources",
        "openfn-square.svg"
      );
    } else {
      // is sub-item
      this.iconPath = vscode.Uri.parse(
        `https://app.openfn.org/images/adaptors/${first_adaptor}-square.png`
      );
      this.description = adaptor_name;
    }
    this.contextValue = "workflow.item";
    this.command = {
      command: "openfn-workflows.itemclicked",
      title: "OpenFn Workflows ItemClicked",
      arguments: [this],
    };
  }
}
