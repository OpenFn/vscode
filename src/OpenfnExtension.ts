import * as vscode from "vscode";
import * as path from "path";

import { WorkflowManager } from "./managers/WorkflowManager";
import { TreeviewItem, TreeViewProvider } from "./TreeViewProvider";
import { StatusBarManager } from "./managers/StatusBarManager";
import registerSemanticColoring from "./SemanticColoring";
import { runWorkflow } from "./workflowRunner";

interface PickItem extends vscode.QuickPickItem {
  workflowPath: string;
}

export class OpenFnExtension implements vscode.Disposable {
  treeview!: vscode.TreeView<TreeviewItem>;
  isOpenfnWorkspace: boolean = false;
  semanticDisposable: vscode.Disposable;
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
        this.statusBarManager.setStatusInactive();
        this.statusBarManager.setRunWorkflowsInactive();
      } else {
        this.initTreeview();
        this.statusBarManager.setStatusActive();
        if (this.workflowManager.workflowFiles.length)
          this.statusBarManager.setRunWorkflowsActive();
      }
    });

    workflowManager.onActiveFileChange((activeFile) => {
      if (activeFile.adaptor && this.isOpenfnWorkspace) {
        this.statusBarManager.setStatusAdaptor(activeFile.adaptor);
      } else {
        if (this.isOpenfnWorkspace) this.statusBarManager.setStatusActive();
        else this.statusBarManager.setStatusInactive();
      }
    });

    this.workflowManager.onWorkflowChange((files) => {
      if (files.length) this.statusBarManager.setRunWorkflowsActive();
      else this.statusBarManager.setRunWorkflowsInactive();
      this.treeviewProvider.refresh();
    });

    this.workflowManager.api.commands.registerCommand(
      "openfn-workflows.itemclicked",
      async (item: TreeviewItem) => {
        this.workflowManager.openFile(vscode.Uri.parse(item.filePath));
      }
    );

    this.workflowManager.api.commands.registerCommand(
      "openfn.run-workflows",
      async () => {
        let workflowPath: string | undefined;
        if (this.workflowManager.workflowFiles.length === 1) {
          workflowPath = this.workflowManager.workflowFiles[0].filePath;
        } else {
          const result =
            await this.workflowManager.api.window.showQuickPick<PickItem>(
              this.workflowManager.workflowFiles.map((workflow) => ({
                label: workflow.name || path.basename(workflow.filePath),
                workflowPath: workflow.filePath,
                detail: `${workflow.steps.length} step(s) • ${path.relative(
                  this.workflowManager.workspaceUri.fsPath,
                  workflow.filePath
                )}`,
                iconPath: this.workflowManager.api.Uri.parse(
                  path.join(
                    __filename,
                    "..",
                    "..",
                    "resources",
                    "openfn-square.svg"
                  )
                ),
              })),
              { placeHolder: "Select a workflow to execute" }
            );
          workflowPath = result?.workflowPath;
        }
        if (workflowPath) {
          runWorkflow(workflowPath);
        }
      }
    );

    this.semanticDisposable = registerSemanticColoring(
      this.workflowManager.api
    );
  }

  dispose() {
    if (this.workflowManager) this.workflowManager.dispose();
    if (this.treeview) this.treeview.dispose();
    if (this.statusBarManager) this.statusBarManager.dispose();
    if (this.semanticDisposable) this.semanticDisposable.dispose();
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
