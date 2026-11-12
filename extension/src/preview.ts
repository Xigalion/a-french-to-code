import * as vscode from 'vscode';
import type { Preview } from './session.ts';

export type PreviewPair = { before: vscode.Uri; after: vscode.Uri };

export class PreviewStore implements vscode.TextDocumentContentProvider, vscode.Disposable {
  // Avoid reusing a cached virtual document after an extension-host reload.
  private readonly instance = `${vscode.env.sessionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  private readonly contents = new Map<string, string>();
  private readonly registration = vscode.workspace.registerTextDocumentContentProvider('c-a-preview', this);

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) ?? 'Aperçu C-A fermé.';
  }

  async show(sessionId: number, preview: Preview, own: (pair: PreviewPair) => void, current: () => boolean): Promise<PreviewPair> {
    if (!current()) throw new Error('Aperçu annulé.');
    const before = vscode.Uri.from({ scheme: 'c-a-preview', path: `/${this.instance}/session-${sessionId}/${preview.token}/avant.c` });
    const after = vscode.Uri.from({ scheme: 'c-a-preview', path: `/${this.instance}/session-${sessionId}/${preview.token}/apres.c` });
    const pair = { before, after };
    own(pair);
    this.contents.set(before.toString(), preview.before);
    this.contents.set(after.toString(), preview.after);
    for (const uri of [before, after]) {
      if (!current()) throw new Error('Aperçu annulé.');
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.languages.setTextDocumentLanguage(document, 'c');
    }
    if (!current()) throw new Error('Aperçu annulé.');
    await vscode.commands.executeCommand('vscode.diff', before, after, 'C-A : avant ↔ après — aucun changement appliqué',
      { viewColumn: vscode.ViewColumn.Beside, preview: true });
    return pair;
  }

  owns(pair: PreviewPair | undefined, uri: vscode.Uri): boolean {
    return !!pair && (uri.toString() === pair.before.toString() || uri.toString() === pair.after.toString());
  }

  async close(pair: PreviewPair | undefined): Promise<void> {
    if (!pair) return;
    const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs).filter(tab => {
      const input = tab.input;
      if (input instanceof vscode.TabInputText) return this.owns(pair, input.uri);
      return input instanceof vscode.TabInputTextDiff
        && input.original.toString() === pair.before.toString() && input.modified.toString() === pair.after.toString();
    });
    if (tabs.length) await vscode.window.tabGroups.close(tabs, true);
    this.contents.delete(pair.before.toString());
    this.contents.delete(pair.after.toString());
  }

  dispose(): void { this.contents.clear(); this.registration.dispose(); }
}
