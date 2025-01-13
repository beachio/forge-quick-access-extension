import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';

export async function authenticate(secretStorage: vscode.SecretStorage) {
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

    const accessToken = response.data.access_token;
    await secretStorage.store('forgeAccessToken', accessToken);

    const config = vscode.workspace.getConfiguration('forgeQuickAccess');
    await config.update('forgeToken', accessToken, vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage("Authentication successful!");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      vscode.window.showErrorMessage(`Authentication failed: ${error.message}`);
    } else {
      vscode.window.showErrorMessage('Authentication failed: An unknown error occurred.');
    }
  }
}


export async function listSites(secretStorage: vscode.SecretStorage) {
	const token = vscode.workspace.getConfiguration().get('forgeQuickAccess.accountToken');
	const url = `https://getforge.com/api/cli/sites?token=${token}`;

	try {
			const response = await axios.get(url);
			const selectedSite = await vscode.window.showQuickPick(
					response.data,
					{ placeHolder: "Select a site" }
			);

			if (selectedSite) {
				vscode.window.showInformationMessage(`Selected site: ${selectedSite}`);
				await secretStorage.store('forgeSite', selectedSite);
			}
	} catch (error) {
		console.log('error', error)
		if (axios.isAxiosError(error)) {
			vscode.window.showErrorMessage(`List Sites failed: ${error.message}`);
		} else {
			vscode.window.showErrorMessage('List Sites failed: An unknown error occurred.');
		}
	}
}


export async function deploy(secretStorage: vscode.SecretStorage) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	const domain = await secretStorage.get('forgeSite');
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found.");
    return;
  }

  const path = await vscode.window.showInputBox({
    prompt: "Enter the path to the zip file",
    placeHolder: 'dist.zip'
  });

  if (!path) {
    vscode.window.showErrorMessage("File path is required.");
    return;
  }

	const filePath = `${workspaceFolder.uri.fsPath}/${path}`

  if (!fs.existsSync(filePath)) {
    vscode.window.showErrorMessage(`File not found: ${filePath}`);
    return;
  }

  try {
    const token = vscode.workspace.getConfiguration().get('forgeQuickAccess.accountToken');

    if (!token) {
      vscode.window.showErrorMessage("Forge token is not configured.");
      return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('domain', domain);
    formData.append('archive', fs.createReadStream(filePath));

    const response = await axios.post('https://getforge.com/api/cli/deploy', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

		console.log('response', response);

    vscode.window.showInformationMessage("Deployment successful!");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      vscode.window.showErrorMessage(`Deployment error: ${error.message}`);
    } else {
      vscode.window.showErrorMessage('Deployment error: An unknown error occurred.');
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const authenticateCommand = vscode.commands.registerCommand('forge.authenticate', () => authenticate(context.secrets));
  const deployCommand = vscode.commands.registerCommand('forge.deploy', () => deploy(context.secrets));
	const listSiteCommand = vscode.commands.registerCommand('forge.listSites', () => listSites(context.secrets));
	
  context.subscriptions.push(authenticateCommand);
	context.subscriptions.push(listSiteCommand);
  context.subscriptions.push(deployCommand);
}

export function deactivate() {}


