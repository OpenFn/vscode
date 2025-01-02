import * as vscode from "vscode";

export class OpenfnRcManager implements vscode.Disposable {
  onAvailabilityChange: vscode.EventEmitter<boolean>["event"];
  private availableEmitter: vscode.EventEmitter<boolean>;
  private watcher!: vscode.FileSystemWatcher;
  private commandDisposable!: vscode.Disposable;
  constructor(private workspaceUri: vscode.Uri) {
    this.registerGenerateCommand();

    // register emitter for when .openfnrc file availability changes
    this.availableEmitter = new vscode.EventEmitter();
    this.onAvailabilityChange = this.availableEmitter.event;
    this.initialize();
  }

  private async initialize() {
    const openfnrcPath = vscode.Uri.joinPath(this.workspaceUri, ".openfnrc");
    try {
      await vscode.workspace.fs.stat(openfnrcPath); // Check if the file exists
      this.availableEmitter.fire(true);
    } catch {
      this.availableEmitter.fire(false);
    }

    // start watching for .openfnrc file
    this.watcher = vscode.workspace.createFileSystemWatcher("**/.openfnrc");
    this.watcher.onDidCreate(() => {
      this.availableEmitter.fire(true);
      vscode.window.showInformationMessage(
        ".openfnrc file detected in workspace"
      );
    });

    this.watcher.onDidDelete(() => {
      this.availableEmitter.fire(false);
      vscode.window.showWarningMessage(".openfnrc file removed from workspace");
    });
  }

  registerGenerateCommand() {
    this.commandDisposable = vscode.commands.registerCommand(
      "openfn.openfnrc",
      () => {
        const fileUri = vscode.Uri.joinPath(this.workspaceUri, ".openfnrc");
        vscode.workspace.fs.writeFile(fileUri, Buffer.from("")); // TODO: initial template of a .openfnrc file
        this.availableEmitter.fire(true);
      }
    );
  }

  dispose() {
    if (this.watcher) this.watcher.dispose();
    if (this.availableEmitter) this.availableEmitter.dispose();
    if (this.commandDisposable)
      this.commandDisposable.dispose();
  }
}
