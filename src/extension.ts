// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

export async function authenticate() {
	const email = await vscode.window.showInputBox({
			prompt: "Enter your Forge email",
			placeHolder: "you@example.com"
	});

	if (!email) {
			vscode.window.showErrorMessage("Email is required.");
			return;
	}

	const password = await vscode.window.showInputBox({
			prompt: "Enter your Forge password",
			password: true
	});

	if (!password) {
			vscode.window.showErrorMessage("Password is required.");
			return;
	}

	try {
			const response = await axios.post('https://getforge.com/api/v2/cli/login', {
					email,
					password
			});

			console.log('response', response)

			const accessToken = response.data.access_token;
			const secrets = vscode.workspace.getConfiguration().get('forgeQuickAccess.secrets');
	  	const updatedSecrets = typeof secrets === 'object' && secrets !== null ? { ...secrets, accessToken } : { accessToken };
	  	await vscode.workspace.getConfiguration().update('forgeQuickAccess.secrets', updatedSecrets, vscode.ConfigurationTarget.Global);

			vscode.window.showInformationMessage("Authentication successful!");
	} catch (error) {
			console.log('error', error)
			if (axios.isAxiosError(error)) {
				vscode.window.showErrorMessage(`Authentication failed: ${error.message}`);
			} else {
				vscode.window.showErrorMessage('Authentication failed: An unknown error occurred.');
			}
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "forge-quick-access" is now active!');

	const authenticateCommand = vscode.commands.registerCommand('forge.authenticate', authenticate);
	context.subscriptions.push(authenticateCommand);
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('forge-quick-access.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from forge-quick-access!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
