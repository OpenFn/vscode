import * as vscode from "vscode";
import * as path from "path";
import { OpenfnRcManager } from "./OpenfnRcManager";
import parseJson from "../utils/parseJson";
import { WorkflowData, WorkflowJson } from "../types";

interface ActiveFileMeta {
  isJob: boolean;
  document: vscode.TextDocument;
  adaptor: string | undefined;
}

export class WorkflowManager implements vscode.Disposable {
  onAvailabilityChange: vscode.EventEmitter<boolean>["event"];
  private workflowsEmitter: vscode.EventEmitter<WorkflowData[]>;
  private activeFileEmitter: vscode.EventEmitter<ActiveFileMeta>;
  onActiveFileChange: vscode.EventEmitter<ActiveFileMeta>["event"];
  onWorkflowChange: vscode.EventEmitter<WorkflowData[]>["event"];
  private watcher!: vscode.FileSystemWatcher;
  workflowFiles: WorkflowData[] = [];
  private rcManager: OpenfnRcManager;
  constructor(public api: typeof vscode, public workspaceUri: vscode.Uri) {
    this.rcManager = new OpenfnRcManager(this.workspaceUri);
    this.onAvailabilityChange = this.rcManager.onAvailabilityChange; // hook workspace availability change to .openfnrc manager
    this.watchWorkflows();

    this.workflowsEmitter = new this.api.EventEmitter();
    this.activeFileEmitter = new this.api.EventEmitter();

    this.onActiveFileChange = this.activeFileEmitter.event;
    this.onWorkflowChange = this.workflowsEmitter.event;

    this.api.window.onDidChangeActiveTextEditor((e) => {
      if (!e) return;
      // get the uri of the file.
      const activeUri = e.document.uri;
      const found = this.findJobByPath(activeUri.fsPath);
      if (found)
        this.activeFileEmitter.fire({
          isJob: true,
          document: e.document,
          adaptor: found.adaptor,
        });
      else
        this.activeFileEmitter.fire({
          isJob: false,
          document: e.document,
          adaptor: undefined,
        });
    });
  }

  get activeFile(): ActiveFileMeta | undefined {
    const activeEditor = this.api.window.activeTextEditor;
    if (activeEditor) {
      const found = this.findJobByPath(activeEditor.document.uri.fsPath);
      if (found)
        return {
          isJob: true,
          document: activeEditor.document,
          adaptor: found.adaptor,
        };
      else
        return {
          isJob: false,
          document: activeEditor.document,
          adaptor: undefined,
        };
    }
    return undefined;
  }

  private findJobByPath(path: string) {
    for (const w of this.workflowFiles) {
      for (const s of w.steps) {
        if (s.filePath === path) {
          return s;
        }
      }
    }
    return undefined;
  }

  private watchWorkflows() {
    this.updateWorkflowFiles(); // initial call before watch
    // watch the workflow files
    this.watcher = this.api.workspace.createFileSystemWatcher(
      "**/*workflow*.json" // ignore node_modules & consider yml soon!
    );

    this.watcher.onDidCreate(this.updateWorkflowFiles.bind(this));
    this.watcher.onDidChange(this.updateWorkflowFiles.bind(this));
    this.watcher.onDidDelete(this.updateWorkflowFiles.bind(this));
  }

  private async updateWorkflowFiles() {
    const workflowUris = await this.api.workspace.findFiles(
      "**/*workflow*.json", // consider yml soon!
      "{**/node_modules/**,**/tmp/**}"
    );

    const res = await Promise.all(
      workflowUris.map(async (uri) => {
        const buf = await this.api.workspace.fs.readFile(uri);
        const parsed = parseJson<WorkflowJson>(buf.toString());
        return {
          ...parsed,
          filePath: uri.fsPath,
        };
      })
    );

    const workflows: WorkflowData[] = [];
    for (const w of res) {
      if (!w.success || !w.result.workflow) {
        // shout about parse error in a file
        continue;
      }
      const workflow: WorkflowData = {
        filePath: w.filePath,
        name: w.result.workflow.name,
        steps: w.result.workflow.steps.map((step) => ({
          ...step,
          filePath: path.join(path.dirname(w.filePath), step.expression),
        })),
      };
      // TODO find job paths that don't exist and mention them
      workflows.push(workflow);
    }

    this.workflowFiles = workflows;
    this.workflowsEmitter.fire(workflows);
  }

  async openFile(path: vscode.Uri) {
    const document = await vscode.workspace.openTextDocument(path);
    await vscode.window.showTextDocument(document);
  }

  dispose() {
    if (this.activeFileEmitter) this.activeFileEmitter.dispose();
    if (this.workflowsEmitter) this.workflowsEmitter.dispose();
    if (this.watcher) this.watcher.dispose();
    if (this.rcManager) this.rcManager.dispose();
  }
}
