import * as vscode from "vscode";

import { WorkflowManager } from "./managers/WorkflowManager";
import { TreeviewItem, TreeViewProvider } from "./TreeViewProvider";

export class OpenFnExtension {
  treeview!: vscode.TreeView<TreeviewItem>;
  constructor(
    private workflowManager: WorkflowManager,
    private treeviewProvider: TreeViewProvider
  ) {
    this.initTreeview();
    this.workflowManager.onAvailabilityChange((active) => {
      if (!active) this.treeview.dispose();
      else this.initTreeview();
    });

    this.workflowManager.onWorkflowChange(() => {
      this.treeviewProvider.refresh();
    });

    this.workflowManager.api.commands.registerCommand(
      "openfn-workflows.itemclicked",
      async (item: TreeviewItem) => {
        this.workflowManager.openFile(vscode.Uri.parse(item.filePath));
      }
    );
  }

  private initTreeview() {
    this.treeview = this.workflowManager.api.window.createTreeView(
      "openfn-workflows",
      {
        treeDataProvider: this.treeviewProvider,
      }
    );
  }
}
