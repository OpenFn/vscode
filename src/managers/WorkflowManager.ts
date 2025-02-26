import * as path from "path";
import * as vscode from "vscode";
import { WorkflowData, WorkflowJson } from "../types";
import parseJson from "../utils/parseJson";
import { OpenfnRcManager } from "./OpenfnRcManager";
import { runWorkflowHelper } from "../workflowRunner";
import { existsSync } from "fs";
import { Adaptor, adaptorHelper } from "../utils/adaptorHelper";

interface ActiveFileMeta {
  isJob: boolean;
  document: vscode.TextDocument;
  adaptor: Adaptor[] | undefined;
}

const RECENT_INPUTS_KEY = "recent_inputs";

interface InputPickItem extends vscode.QuickPickItem {
  id: string;
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
  constructor(
    public api: typeof vscode,
    public workspaceUri: vscode.Uri,
    private storage: vscode.Memento
  ) {
    this.rcManager = new OpenfnRcManager(this.workspaceUri);
    this.onAvailabilityChange = this.rcManager.onAvailabilityChange; // hook workspace availability change to .openfnrc manager
    this.watchWorkflows();

    this.workflowsEmitter = new this.api.EventEmitter();
    this.activeFileEmitter = new this.api.EventEmitter();

    this.onActiveFileChange = this.activeFileEmitter.event;
    this.onWorkflowChange = this.workflowsEmitter.event;

    // wait for initial workflow change and fire active file
    // this is to register language support in already open text document.
    const wc = this.onWorkflowChange(() => {
      this.emitActiveFileHelper.call(this, this.api.window.activeTextEditor);
      wc.dispose(); // to be used only once and disposed
    });

    // calls when editor is changed
    this.api.window.onDidChangeActiveTextEditor(
      this.emitActiveFileHelper.bind(this)
    );

    // initialize recent workflow execution inputs.
    const rInputs = storage.get<Record<string, string>>(RECENT_INPUTS_KEY);
    if (!rInputs) storage.update(RECENT_INPUTS_KEY, {});
  }

  getWorkflowRecentInput(workflowPath: string) {
    const rInputs = this.storage.get<Record<string, string>>(RECENT_INPUTS_KEY);
    if (!rInputs || !rInputs[workflowPath]) return undefined;
    if (!existsSync(rInputs[workflowPath])) return undefined;
    return rInputs[workflowPath];
  }

  updateWorkflowRecentInput(workflowPath: string, inputPath: string) {
    const rInputs = this.storage.get<Record<string, string>>(RECENT_INPUTS_KEY);
    const newInputs = { ...rInputs, [workflowPath]: inputPath };
    this.storage.update(RECENT_INPUTS_KEY, newInputs);
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
        steps: await Promise.all(
          w.result.workflow.steps
            .filter((s) => s.adaptors?.length || s.adaptor)
            .map(async (step) => ({
              ...step,
              adaptor: await adaptorHelper(step.adaptors || [step.adaptor]),
              filePath: path.join(path.dirname(w.filePath), step.expression),
            }))
        ),
      };
      // TODO find job paths that don't exist and mention them
      workflows.push(workflow);
    }

    this.workflowFiles = workflows;
    this.workflowsEmitter.fire(workflows);
  }

  private emitActiveFileHelper(e: vscode.TextEditor | undefined) {
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
  }

  async runWorkflow(workflowInfo: {
    path: string;
    name?: string;
    adaptor?: string;
  }) {
    // show input options & then recent input too
    const recentInput = this.getWorkflowRecentInput(workflowInfo.path);
    const sources = (
      recentInput
        ? [
            {
              label: "Previous Input",
              detail: recentInput,
              id: "previous",
            },
          ]
        : []
    ).concat([
      {
        label: "No input",
        detail: "run workflow without an input. default {}",
        id: "none",
      },
      {
        label: "Select File...",
        detail: "select a file from your machine as input source",
        id: "select",
      },
    ]);
    const result = await this.api.window.showQuickPick<InputPickItem>(sources, {
      title: "Select input source",
      canPickMany: false,
    });

    let inputPath: string | undefined = undefined;
    if (!result) return;
    if (result.id === "select") {
      const selectedUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select Input Json File",
        filters: {
          "Json Files": ["json"],
        },
      });
      if (selectedUri?.length) inputPath = selectedUri[0].fsPath;
    } else if (result.id === "previous") inputPath = recentInput;

    if (inputPath) this.updateWorkflowRecentInput(workflowInfo.path, inputPath);
    runWorkflowHelper(workflowInfo, this.workspaceUri, inputPath);
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
