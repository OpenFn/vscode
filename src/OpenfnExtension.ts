import * as path from "path";
import * as vscode from "vscode";

import { CompletionManager } from "./managers/CompletionManager";
import { SourceManager } from "./managers/SourceManager";
import { StatusBarManager } from "./managers/StatusBarManager";
import { WorkflowManager } from "./managers/WorkflowManager";
import registerSemanticColoring from "./SemanticColoring";
import { TreeviewItem, TreeViewProvider } from "./TreeViewProvider";
import { debounce } from "./utils/debounce";
import { execute } from "./utils/execute";
import { isAvailableWithInstall } from "./workflowRunner";
import { adaptorHelper } from "./utils/adaptorHelper";

interface PickItem extends vscode.QuickPickItem {
  workflowPath: string;
}

export class OpenFnExtension implements vscode.Disposable {
  treeview!: vscode.TreeView<TreeviewItem>;
  isOpenfnWorkspace: boolean = false;
  semanticDisposable: vscode.Disposable;
  contentChange: vscode.Disposable | undefined;
  constructor(
    private workflowManager: WorkflowManager,
    private treeviewProvider: TreeViewProvider,
    private statusBarManager: StatusBarManager,
    private completionManager: CompletionManager,
    private sourceManager: SourceManager
  ) {
    // check whether openfn cli is available
    isAvailableWithInstall();

    this.initTreeview();
    workflowManager.onAvailabilityChange((active) => {
      this.isOpenfnWorkspace = active;
      if (!this.isOpenfnWorkspace) {
        this.treeview.dispose();
        this.statusBarManager.setStatusInactive();
      } else {
        this.initTreeview();
        this.statusBarManager.setStatusActive();
      }
    });

    workflowManager.onActiveFileChange(async (activeFile) => {
      if (this.contentChange) this.contentChange.dispose();
      if (activeFile.adaptor && this.isOpenfnWorkspace) {
        // first call source manager on content before waiting for updates
        this.sourceManager.updateSource(
          activeFile.document,
          activeFile.document.uri,
          activeFile.adaptor
        );
        const debouncedSourceUpdate = debounce(
          this.sourceManager.updateSource.bind(this.sourceManager),
          1000 // 1 second debounce. generally people type quite slow :(
        );
        this.contentChange =
          this.workflowManager.api.workspace.onDidChangeTextDocument((ev) => {
            if (activeFile.adaptor)
              debouncedSourceUpdate(
                ev.document,
                ev.document.uri,
                activeFile.adaptor
              );
          });

        // show adaptor version in status bar
        this.statusBarManager.setStatusAdaptor(activeFile.adaptor.full);

        // deal with completion stuff
        if (activeFile.isJob) {
          this.workflowManager.api.languages.setTextDocumentLanguage(
            activeFile.document,
            "fn"
          ); // register active file as fn file
          this.completionManager.registerCompletions(activeFile.adaptor);
          this.completionManager.registerHoverSupport(activeFile.adaptor);
          this.completionManager.registerSignatureHelpProvider(
            activeFile.adaptor
          );
          this.completionManager.registerDefinitionHelp(activeFile.adaptor);
        }
      } else {
        if (this.isOpenfnWorkspace) this.statusBarManager.setStatusActive();
        else this.statusBarManager.setStatusInactive();
      }
    });

    this.workflowManager.onWorkflowChange(async (files) => {
      this.treeviewProvider.refresh();
      // collect adaptors and install them
      const adaptors = files
        .map((file) => file.steps.map((s) => s.adaptor))
        .flat()
        .map((adaptor) => `-a ${adaptor.full}`);

      // brute install these adaptors!
      await execute(`openfn repo install ${adaptors.join(" ")}`);
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
        if (this.workflowManager.workflowFiles.length === 0) {
          this.workflowManager.api.window.showWarningMessage(
            "No workflow found in the workspace for execution"
          );
          return;
        }
        let workflowInfo: { path: string; name?: string } | undefined;
        if (this.workflowManager.workflowFiles.length === 1) {
          workflowInfo = {
            path: this.workflowManager.workflowFiles[0].filePath,
            name: this.workflowManager.workflowFiles[0].name,
          };
        } else {
          const result =
            await this.workflowManager.api.window.showQuickPick<PickItem>(
              this.workflowManager.workflowFiles.map((workflow) => ({
                label: workflow.name || path.basename(workflow.filePath),
                workflowPath: workflow.filePath,
                detail: `${workflow.steps.length} step(s)`,
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
          if (result)
            workflowInfo = { path: result.workflowPath, name: result.label };
        }
        if (workflowInfo) {
          workflowManager.runWorkflow(workflowInfo);
        }
      }
    );

    this.workflowManager.api.commands.registerCommand(
      "openfn.workflow.item.run",
      (item: TreeviewItem) => {
        workflowManager.runWorkflow({
          path: item.filePath,
          name: item.label,
          adaptor: item.adaptor,
        });
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
    if (this.completionManager) this.completionManager.dispose();
    if (this.contentChange) this.contentChange.dispose();
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
