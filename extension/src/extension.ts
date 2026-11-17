import * as vscode from 'vscode';
import { TranslationSession } from './session.ts';
import { PythonTranslationSession } from './sessionPython.ts';
import type { InformationAffichable, SessionControleur, SessionDiagnostic, TargetState } from './session.ts';
import { PreviewStore } from './preview.ts';
import type { PreviewPair } from './preview.ts';
import type { CalculationAdvisory } from '../../src/calculationAdvisories.ts';


type Choice = vscode.QuickPickItem & { action: 'insert' | 'edit' | 'return' | 'cancel' };
export type SessionInspection = {
  phase: string; ui: 'input' | 'confirmation' | 'none'; draft: string;
  targetUri: string; choices: string[]; diagnostic: SessionDiagnostic | undefined;
  preview: { before: string; after: string } | undefined;
  advisories: CalculationAdvisory[];
  information: InformationAffichable[];
  attachmentLabel: string | undefined;
  souple: boolean;
  langage: 'c17' | 'python';
  normalisation: { source: string; canonique: string; lectures: number } | undefined;
  validation: string | vscode.InputBoxValidationMessage | undefined;
  confirmationTitle: string | undefined;
  pedagogyEntry: string;
  loggedPreviews: number;
};
export type ExtensionApi = { inspect(): SessionInspection | undefined };

function indentation(editor: vscode.TextEditor): { unit: string; signature: string } | undefined {
  const { insertSpaces, tabSize, indentSize } = editor.options;
  if (typeof insertSpaces !== 'boolean' || typeof tabSize !== 'number' || !Number.isSafeInteger(tabSize) || tabSize < 1
    || typeof indentSize !== 'number' || !Number.isSafeInteger(indentSize) || indentSize < 1) return undefined;
  try {
    return { unit: insertSpaces ? ' '.repeat(indentSize) : '\t', signature: `${insertSpaces}:${tabSize}:${indentSize}` };
  } catch { return undefined; }
}

function message(diagnostic: SessionDiagnostic): string {
  const label = diagnostic.stage === 'translation' ? 'Traduction'
    : diagnostic.stage === 'placement' ? 'Placement refusé'
      : diagnostic.stage === 'variantes' ? 'Ambiguïté'
        : diagnostic.stage === 'rendu' ? 'Langage cible' : 'Intégration';
  return `${label} : ${diagnostic.message}`;
}

/** The default for the flexible mode.
 *
 * Switched to `true` on 17 November 2026, after final validation, exactly as
 * the founder asked. Strict mode stays reachable: setting `c-a.souplesse` to
 * `false` restores it, and the toggle command works both ways.
 *
 * This constant and the `default` of the setting in `extension/package.json`
 * must always agree; a test enforces it, because a switch that forgot one of
 * the two would be invisible. */
export const SOUPLESSE_PAR_DEFAUT = true;

/** The flexible mode is a user setting, read once per session so it cannot
 * change under a prepared preview. Absent or malformed, it takes the default
 * above. */
function souplesseActive(): boolean {
  const reglage = vscode.workspace.getConfiguration('c-a').get<boolean>('souplesse');
  return typeof reglage === 'boolean' ? reglage : SOUPLESSE_PAR_DEFAUT;
}

/** Python est ACTIF par defaut depuis le 17 novembre 2026.
 *
 * Il etait derriere un reglage desactive tant que son catalogue comptait 32
 * intentions portees et aucune intention native : il ne savait pas creer une
 * liste, et l'exposer aurait enseigne un Python infirme. Il compte desormais
 * 97 intentions, 64 natives, 49 informations passives, et neuf programmes
 * ecrits par C-A ont ete executes sans une retouche.
 *
 * Le reglage reste : le mettre a `false` n'ouvre que les fichiers .c. */
export const PYTHON_PAR_DEFAUT = true;

function pythonActif(): boolean {
  const reglage = vscode.workspace.getConfiguration('c-a').get<boolean>('python');
  return typeof reglage === 'boolean' ? reglage : PYTHON_PAR_DEFAUT;
}

/** Les langages que la commande accepte, par extension et identifiant VS Code.
 * Aucun repli : un fichier qui n'est ni l'un ni l'autre est refuse. */
type Cible = { langage: 'c17' | 'python'; extension: string; languageId: string };
const CIBLES: readonly Cible[] = [
  { langage: 'c17', extension: '.c', languageId: 'c' },
  { langage: 'python', extension: '.py', languageId: 'python' },
];

class NativeSession {
  readonly controller: SessionControleur;
  private readonly langage: 'c17' | 'python';
  private readonly languageId: string;
  private readonly document: vscode.TextDocument;
  private readonly column: vscode.ViewColumn;
  private readonly initial: TargetState;
  private readonly subscriptions: vscode.Disposable[] = [];
  private input: vscode.InputBox | undefined;
  private picker: vscode.QuickPick<Choice> | undefined;
  private pair: PreviewPair | undefined;
  private disposed = false;
  private finishing = false;
  private busy = false;
  private manualSelectionDuringApply = false;
  private diagnostic: SessionDiagnostic | undefined;
  private readonly editor: vscode.TextEditor;
  private readonly store: PreviewStore;
  private readonly id: number;
  private readonly finished: (draft: string) => void;
  private readonly pedagogy: vscode.OutputChannel;
  private lastLoggedToken: number | undefined;
  private pedagogyEntry = '';
  private loggedPreviews = 0;

  constructor(
    editor: vscode.TextEditor,
    store: PreviewStore,
    id: number,
    initial: TargetState,
    draft: string,
    finished: (draft: string) => void,
    pedagogy: vscode.OutputChannel,
    souple = false,
    cible: Cible = CIBLES[0]!,
  ) {
    this.editor = editor; this.store = store; this.id = id; this.finished = finished;
    this.pedagogy = pedagogy;
    this.document = editor.document;
    this.column = editor.viewColumn ?? vscode.ViewColumn.One;
    this.initial = initial;
    this.langage = cible.langage;
    this.languageId = cible.languageId;
    this.controller = cible.langage === 'python'
      ? new PythonTranslationSession(initial, draft, { souple })
      : new TranslationSession(initial, draft, { souple });
    const observe = () => {
      if (this.disposed || this.finishing) return;
      this.controller.observe(this.capture());
      this.refresh();
    };
    this.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(event => { if (event.document === this.document) observe(); }),
      vscode.workspace.onDidCloseTextDocument(document => {
        if (document === this.document) this.invalidate('Le document cible a été fermé. Revenez au fichier et relancez C-A.');
      }),
      vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor !== this.editor) return;
        if (this.controller.phase === 'applying') {
          if (event.kind === vscode.TextEditorSelectionChangeKind.Keyboard || event.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
            this.manualSelectionDuringApply = true;
          }
          return;
        }
        observe();
      }),
      vscode.window.onDidChangeTextEditorOptions(event => { if (event.textEditor === this.editor) observe(); }),
      vscode.window.onDidChangeVisibleTextEditors(() => observe()),
      vscode.window.onDidChangeActiveTextEditor(active => {
        if (active && active !== this.editor && !this.store.owns(this.pair, active.document.uri)) {
          this.invalidate('Un autre éditeur est actif. La cible n’a pas été déplacée : revenez au fichier et relancez C-A.');
        }
      }),
    );
  }

  private capture(): TargetState {
    const open = !this.document.isClosed && this.editor.document === this.document
      && this.document.languageId === this.languageId && vscode.window.visibleTextEditors.includes(this.editor);
    const settings = indentation(this.editor);
    return {
      document: open ? { id: this.document.uri.toString(), revision: this.document.version, text: this.document.getText() } : { ...this.initial.document },
      cursorOffset: open ? this.document.offsetAt(this.editor.selection.active) : this.initial.cursorOffset,
      singleCursor: this.editor.selections.length === 1 && this.editor.selection.isEmpty,
      indentUnit: settings?.unit ?? '', indentSignature: settings?.signature ?? 'indéterminée',
      eol: this.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n', open,
    };
  }

  private invalidate(text: string): void {
    if (this.disposed || this.finishing) return;
    this.controller.invalidate(text);
    this.refresh();
  }

  private refresh(): void {
    if (this.disposed || this.finishing || this.controller.phase === 'applying') return;
    this.diagnostic = this.controller.diagnose(this.capture());
    const advisories = this.diagnostic ? [] : this.controller.advisories;
    // A normalisation the user cannot see would be an implicit behaviour, and
    // rule 3 forbids those. It is named before any preview is prepared.
    if (this.input) this.input.prompt = this.prompt();
    if (this.input) this.input.validationMessage = this.diagnostic ? message(this.diagnostic)
      : advisories.length ? { message: `${advisories.length} avertissement(s) — ${advisories[0]?.message} Consultez « C-A — Pédagogie » après préparation de l’aperçu.`,
        severity: vscode.InputBoxValidationSeverity.Warning } : undefined;
    if (this.picker && this.controller.phase === 'stale') {
      this.picker.title = 'C-A : aperçu périmé — aucune insertion autorisée';
      this.picker.placeholder = this.diagnostic ? message(this.diagnostic) : 'Demandez un nouvel aperçu.';
      this.picker.items = this.choices(false);
    }
  }

  focus(): void {
    if (this.input) this.input.show();
    else if (this.picker) this.picker.show();
    else void vscode.window.showInformationMessage('C-A : préparation ou insertion en cours.');
  }

  showInput(): void {
    if (this.disposed || this.finishing) return;
    const input = vscode.window.createInputBox();
    this.input = input;
    let intentionalHide = false;
    const listeners: vscode.Disposable[] = [];
    const close = () => {
      intentionalHide = true;
      for (const listener of listeners) listener.dispose();
      if (this.input === input) this.input = undefined;
      input.dispose();
    };
    const langue = this.langage === 'python' ? ' — Python' : '';
    input.title = (this.controller.flexible ? 'C-A : instruction française — mode souple' : 'C-A : instruction française') + langue;
    input.prompt = this.prompt();
    input.placeholder = 'Exemples : Crée un bloc si "actif && age >= 18". / Ajoute une branche sinon. / Crée une boucle tant que "i < limite".';
    input.ignoreFocusOut = true;
    input.value = this.controller.draft;
    listeners.push(
      input.onDidChangeValue(value => { this.controller.updateText(value); this.refresh(); }),
      input.onDidHide(() => { if (!intentionalHide) { close(); void this.close(false); } }),
      input.onDidAccept(() => {
        if (this.busy || this.disposed) return;
        const result = this.controller.prepare(this.capture());
        if (result.status === 'error') {
          this.diagnostic = result.diagnostic;
          input.validationMessage = message(result.diagnostic);
          if (result.diagnostic.stage === 'translation' && result.diagnostic.range) {
            input.valueSelection = [result.diagnostic.range.start, result.diagnostic.range.end];
          }
          return;
        }
        this.busy = true;
        this.logAdvisories(result.preview.token);
        input.enabled = false;
        close();
        void this.store.show(this.id, result.preview, pair => { this.pair = pair; },
          () => !this.disposed && !this.finishing && this.controller.phase === 'preparing').then(async pair => {
          if (this.disposed || this.finishing) { await this.store.close(pair); return; }
          this.controller.reviewReady(result.preview.token, this.capture());
          this.busy = false;
          this.showConfirmation(result.preview.token, result.preview.eol);
        }).catch(async () => {
          if (this.disposed || this.finishing) return;
          try { await this.store.close(this.pair); } catch { /* No source edit is attempted. */ }
          this.pair = undefined;
          this.busy = false;
          this.controller.editAgain();
          this.showInput();
          this.diagnostic = { stage: 'integration', code: 'PREVIEW_FAILED', message: 'Impossible d’ouvrir l’aperçu. Aucune insertion n’a été demandée ; relancez C-A.' };
          if (this.input) this.input.validationMessage = message(this.diagnostic);
        });
      }),
    );
    this.refresh();
    input.show();
  }

  /** Never a correction to copy: it states the catalogue sentence C-A read,
   * which the user asked it to look for by turning the mode on. */
  private prompt(): string {
    const base = 'Entrée prépare l’aperçu uniquement. Échap annule.';
    const normalisation = this.controller.normalisation;
    if (!normalisation) return this.controller.flexible ? `Mode souple actif. ${base}` : base;
    return `Mode souple : C-A lit « ${normalisation.canonique} ». Le commentaire gardera votre phrase. ${base}`;
  }

  private choices(current: boolean): Choice[] {
    const advisories = this.diagnostic ? [] : this.controller.advisories;
    return current ? [
      { label: 'Insérer', description: this.controller.attachmentLabel ?? 'Appliquer exactement l’aperçu affiché', action: 'insert',
        ...(this.controller.normalisation
          ? { detail: `Mode souple : phrase lue « ${this.controller.normalisation.canonique} » ; commentaire conservé.` }
          : advisories.length ? { detail: advisories[0]?.message ?? '' } : {}) },
      { label: 'Modifier la phrase', action: 'edit' }, { label: 'Annuler', action: 'cancel' },
    ] : [{ label: 'Revenir au fichier', description: 'Phrase conservée pour la prochaine commande C-A', action: 'return' }, { label: 'Annuler', action: 'cancel' }];
  }

  private showConfirmation(token: number, eol: '\n' | '\r\n'): void {
    if (this.disposed || this.finishing) return;
    const picker = vscode.window.createQuickPick<Choice>();
    this.picker = picker;
    let intentionalHide = false;
    const listeners: vscode.Disposable[] = [];
    const close = () => {
      intentionalHide = true;
      for (const listener of listeners) listener.dispose();
      if (this.picker === picker) this.picker = undefined;
      picker.dispose();
    };
    picker.title = `C-A : confirmer l’aperçu — fins de ligne ${eol === '\n' ? 'LF' : 'CRLF'}`;
    if (this.controller.normalisation) picker.title += ' — mode souple';
    const advisories = this.controller.advisories;
    if (advisories.length) picker.title += ` — ${advisories.length} avertissement(s) — C-A — Pédagogie`;
    picker.placeholder = 'Entrée sur « Insérer » modifie le fichier ; Échap annule.';
    picker.ignoreFocusOut = true;
    picker.items = this.choices(this.controller.phase === 'review');
    listeners.push(
      picker.onDidHide(() => { if (!intentionalHide) { close(); void this.close(false); } }),
      picker.onDidAccept(() => {
        if (this.busy || this.disposed) return;
        const choice = picker.selectedItems[0];
        if (!choice) return;
        if (choice.action === 'edit') {
          close();
          this.controller.editAgain();
          this.busy = true;
          void this.store.close(this.pair).then(() => { this.pair = undefined; this.busy = false; this.showInput(); }).catch(() => {
            this.busy = false;
            this.controller.invalidate('L’aperçu ne peut pas être fermé. Revenez au fichier et relancez C-A.');
            this.showInput();
          });
        } else if (choice.action === 'insert') {
          this.busy = true;
          picker.enabled = false;
          close();
          void this.apply(token);
        } else { close(); void this.close(false); }
      }),
    );
    this.refresh();
    picker.show();
  }

  private logAdvisories(token: number): void {
    if (this.lastLoggedToken === token) return;
    this.lastLoggedToken = token;
    const advisories = this.controller.advisories;
    const information = this.controller.information;
    const normalisation = this.controller.normalisation;
    if (!advisories.length && !information.length && !normalisation) return;
    this.pedagogyEntry = `Session ${this.id}, aperçu ${token} — historique, pas un état actif\n${this.controller.draft}\n`
      + (normalisation
        ? `NORMALISATION [information] ${normalisation.lectures} lecture(s) essayée(s) : « ${normalisation.canonique} »\n`
        : '')
      + [...advisories.map(advice => `${advice.code} [${advice.assessment}] UTF-16 [${advice.range.start}, ${advice.range.end}) : ${advice.message}`),
        ...information.map(info => `${info.code} [information] UTF-16 [${info.range.start}, ${info.range.end}) : ${info.message}`)].join('\n');
    this.pedagogy.appendLine(this.pedagogyEntry);
    this.loggedPreviews++;
  }

  private async apply(token: number): Promise<void> {
    try {
      if (this.document.isClosed) { this.invalidate('Le document cible a été fermé.'); this.busy = false; this.showInput(); return; }
      const focused = await vscode.window.showTextDocument(this.document, { viewColumn: this.column, preserveFocus: false });
      if (focused !== this.editor) this.invalidate('La vue cible a été remplacée. Relancez C-A depuis le fichier.');
      const result = this.controller.beginApply(token, this.capture());
      if (result.status !== 'apply') {
        this.busy = false;
        this.showInput();
        this.diagnostic = result.diagnostic;
        if (this.input) this.input.validationMessage = message(result.diagnostic);
        return;
      }
      const desiredEol = result.plan.eol === '\n' ? vscode.EndOfLine.LF : vscode.EndOfLine.CRLF;
      // Refuse a mismatch instead of letting VS Code normalize the shown text.
      // No separate EOL edit: it would not undo together with the insertion.
      if (this.document.eol !== desiredEol) {
        this.controller.finishApply(false);
        this.busy = false;
        this.showInput();
        if (this.input) this.input.validationMessage = 'Intégration : la fin de ligne de l’éditeur ne correspond plus à l’aperçu. Aucune insertion effectuée ; demandez un nouvel aperçu.';
        return;
      }
      // No await between beginApply's freshness check and this one edit call.
      const success = await this.editor.edit(builder => {
        for (const edit of result.plan.edits) {
          builder.replace(new vscode.Range(this.document.positionAt(edit.range.start), this.document.positionAt(edit.range.end)), edit.newText);
        }
      }, { undoStopBefore: true, undoStopAfter: true });
      this.controller.finishApply(success);
      if (!success) {
        this.busy = false;
        this.showInput();
        if (this.input) this.input.validationMessage = 'Intégration : l’édition a été refusée. Demandez un nouvel aperçu ; aucune reprise automatique.';
        return;
      }
      const version = this.document.version;
      await this.close(true, { text: result.expectedAfter, version, cursor: result.plan.cursorAfter });
    } catch {
      this.controller.finishApply(false);
      this.busy = false;
      if (!this.disposed && !this.finishing) {
        this.showInput();
        this.diagnostic = { stage: 'integration', code: 'APPLY_FAILED', message: 'L’application n’a pas pu être confirmée. Vérifiez le document avant de demander un nouvel aperçu ; aucune reprise automatique.' };
        if (this.input) this.input.validationMessage = message(this.diagnostic);
      }
    }
  }

  async close(applied: boolean, expected?: { text: string; version: number; cursor: number }): Promise<void> {
    if (this.finishing || this.disposed || (!applied && this.controller.phase === 'applying')) return;
    this.finishing = true;
    const active = vscode.window.activeTextEditor;
    const restore = !active || active === this.editor || this.store.owns(this.pair, active.document.uri);
    if (!applied) this.controller.cancel();
    for (const listener of this.subscriptions) listener.dispose();
    // onDidHide callbacks see finishing and close() is idempotent.
    this.input?.dispose(); this.input = undefined;
    this.picker?.dispose(); this.picker = undefined;
    try {
      await this.store.close(this.pair);
      const now = vscode.window.activeTextEditor;
      if (restore && !this.document.isClosed && (!now || now === this.editor || this.store.owns(this.pair, now.document.uri))) {
        const editor = await vscode.window.showTextDocument(this.document, { viewColumn: this.column, preserveFocus: false });
        if (expected && !this.manualSelectionDuringApply && this.document.version === expected.version && this.document.getText() === expected.text) {
          const position = this.document.positionAt(expected.cursor);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(new vscode.Range(position, position));
        }
      }
    } catch {
      void vscode.window.showWarningMessage('C-A : impossible de rétablir complètement la vue. Vérifiez le fichier ; aucune reprise automatique n’est effectuée.');
    } finally {
      this.disposed = true;
      this.finished(applied ? '' : this.controller.draft);
    }
  }

  inspect(): SessionInspection {
    return {
      phase: this.controller.phase, ui: this.input ? 'input' : this.picker ? 'confirmation' : 'none',
      draft: this.controller.draft, targetUri: this.document.uri.toString(), choices: this.picker?.items.map(item => item.label) ?? [],
      diagnostic: this.diagnostic,
      advisories: this.diagnostic ? [] : this.controller.advisories,
      information: this.diagnostic ? [] : this.controller.information,
      attachmentLabel: this.controller.attachmentLabel,
      souple: this.controller.flexible,
      langage: this.langage,
      normalisation: this.controller.normalisation,
      validation: this.input?.validationMessage,
      confirmationTitle: this.picker?.title,
      pedagogyEntry: this.pedagogyEntry, loggedPreviews: this.loggedPreviews,
      preview: this.pair ? { before: this.pair.before.toString(), after: this.pair.after.toString() } : undefined,
    };
  }
}

export function activate(context: vscode.ExtensionContext): ExtensionApi {
  const store = new PreviewStore();
  const pedagogy = vscode.window.createOutputChannel('C-A — Pédagogie');
  context.subscriptions.push(pedagogy);
  let active: NativeSession | undefined;
  let nextId = 0;
  let rememberedDraft = '';
  context.subscriptions.push(store, { dispose: () => { if (active) void active.close(false); } });
  context.subscriptions.push(vscode.commands.registerCommand('c-a.translate', (draft?: unknown) => {
    if (active) { active.focus(); return; }
    const editor = vscode.window.activeTextEditor;
    const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
    const disponibles = CIBLES.filter(c => c.langage === 'c17' || pythonActif());
    const cible = editor === undefined ? undefined : disponibles.find(candidat =>
      editor.document.uri.path.endsWith(candidat.extension) && editor.document.languageId === candidat.languageId);
    if (!editor || editor.document.uri.scheme !== 'file' || cible === undefined
      || editor.viewColumn === undefined || !(tab?.input instanceof vscode.TabInputText)) {
      void vscode.window.showWarningMessage(pythonActif()
        ? 'C-A : ouvrez un fichier .c en mode C, ou un fichier .py en mode Python, avant de saisir une instruction.'
        : 'C-A : ouvrez un fichier .c ordinaire en mode C avant de saisir une instruction.');
      return;
    }
    if (editor.selections.length !== 1 || !editor.selection.isEmpty) {
      void vscode.window.showWarningMessage('C-A : placez un seul curseur, sans sélection, sur une ligne blanche.');
      return;
    }
    const settings = indentation(editor);
    if (!settings) { void vscode.window.showWarningMessage('C-A : les réglages effectifs d’indentation ne sont pas résolus.'); return; }
    const target: TargetState = {
      document: { id: editor.document.uri.toString(), revision: editor.document.version, text: editor.document.getText() },
      cursorOffset: editor.document.offsetAt(editor.selection.active), singleCursor: true,
      indentUnit: settings.unit, indentSignature: settings.signature, open: true,
      eol: editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n',
    };
    const session = new NativeSession(editor, store, ++nextId, target, typeof draft === 'string' ? draft : rememberedDraft, value => {
      if (active === session) { rememberedDraft = value; active = undefined; }
    }, pedagogy, souplesseActive(), cible);
    active = session;
    session.showInput();
  }));
  // The setting is the single source of truth; the command only flips it, so
  // a session already open keeps the mode it started with.
  context.subscriptions.push(vscode.commands.registerCommand('c-a.souplesse', async () => {
    const configuration = vscode.workspace.getConfiguration('c-a');
    const now = configuration.get<boolean>('souplesse') === true;
    try {
      await configuration.update('souplesse', !now, vscode.ConfigurationTarget.Global);
    } catch {
      void vscode.window.showWarningMessage('C-A : le réglage « c-a.souplesse » n’a pas pu être écrit.');
      return;
    }
    void vscode.window.showInformationMessage(now
      ? 'C-A : mode strict. Seules les phrases du catalogue sont acceptées.'
      : 'C-A : mode souple. Une phrase refusée est cherchée dans un lexique fini de variantes ; une phrase ambiguë reste refusée. Prend effet à la prochaine commande C-A.');
  }));
  // Read-only observability: no API bypasses the native confirmation control.
  return { inspect: () => active?.inspect() };
}
