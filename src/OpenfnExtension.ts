import * as vscode from "vscode";

import { WorkflowManager } from "./managers/WorkflowManager";
import { TreeviewItem, TreeViewProvider } from "./TreeViewProvider";
import { StatusBarManager } from "./managers/StatusBarManager";
import registerSemanticColoring from "./SemanticColoring";

export class OpenFnExtension {
  treeview!: vscode.TreeView<TreeviewItem>;
  isOpenfnWorkspace: boolean = false;
  constructor(
    private workflowManager: WorkflowManager,
    private treeviewProvider: TreeViewProvider,
    private statusBarManager: StatusBarManager
  ) {
    this.initTreeview();
    workflowManager.onAvailabilityChange((active) => {
      this.isOpenfnWorkspace = active;
      if (!this.isOpenfnWorkspace) {
        this.treeview.dispose();
        this.statusBarManager.setInactive();
      } else {
        this.initTreeview();
        this.statusBarManager.setActive();
      }
    });

    workflowManager.onActiveFileChange((activeFile) => {
      if (activeFile.adaptor) {
        this.statusBarManager.setAdaptor(activeFile.adaptor);
      } else {
        if (this.isOpenfnWorkspace) this.statusBarManager.setActive();
        else this.statusBarManager.setInactive();
      }
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

    registerSemanticColoring(this.workflowManager.api);
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
