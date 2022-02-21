const { execSync } = require('child_process');
const { exit } = require('process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {
  buildBackend,
  buildWebClient,
  synthSharedInfra,
  synthServices
} = require('./build');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function readLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      resolve(answer);
    });
  });
}

// get configuration name and env name from command line args
let configName = 'Default';
let envName = 'Default';
if (process.argv.length > 2) {
  configName = process.argv[2];
  if (process.argv.length > 3) {
    envName = process.argv[3];
  }
}

console.log(
  `Start building solution with configuration ${configName} for environment ${envName}`
);

buildBackend();

const {
  getDeployedShareInfraVersion,
  getCurrentSharedInfraVersion
} = require('./AGSSharedInfra/infra/bin/checkVersion');
const {
  deployWebClientToS3,
  getCognitoAuthSettings,
  createAdminUser
} = require('./AGSSharedInfra/infra/bin/webClientHelper');

(async function () {
  const deployedSharedInfraVersion = await getDeployedShareInfraVersion();
  if (deployedSharedInfraVersion === 'ERROR') {
    console.log(
      'Failed to read Shared Infra version in the target account. Cannot proceed.'
    );
    exit(1);
  }

  if (
    deployedSharedInfraVersion !== 'NOT_DEPLOYED' &&
    +deployedSharedInfraVersion !== +getCurrentSharedInfraVersion()
  ) {
    console.log(
      `A different version of AGS Shared Infra has been deployed in the target account. Cannot proceed. Current: ${+getCurrentSharedInfraVersion()}, Deployed: ${+deployedSharedInfraVersion}`
    );
    exit(1);
  }

  if (deployedSharedInfraVersion === 'NOT_DEPLOYED') {
    synthSharedInfra(configName, envName);

    console.log('Deploy Shared Infrastructure for Evidence Store Solution');
    execSync(
      `npx cdk deploy -a cdk.out/assembly-${envName}Stage --all --require-approval=never`,
      {
        cwd: path.resolve(__dirname, './AGSSharedInfra/infra'),
        stdio: 'inherit'
      }
    );
  } else {
    console.log(
      `Detected Shared Infra version ${+deployedSharedInfraVersion} has been deployed in target account. Skip deploying Shared Infra.`
    );
  }

  synthServices(configName, envName, 'AGSEvidenceStore');

  console.log('Deploy AGSEvidenceStore');
  execSync(
    `npx cdk deploy -a cdk.out/assembly-${envName}Stage --all --require-approval=never`,
    {
      cwd: path.resolve(__dirname, './AGSEvidenceStore/infra'),
      stdio: 'inherit'
    }
  );

  synthServices(configName, envName, 'AGSSecurityHubEvidenceCollector');

  console.log('Deploy AGSSecurityHubEvidenceCollector');
  execSync(
    `npx cdk deploy -a cdk.out/assembly-${envName}Stage --all --require-approval=never`,
    {
      cwd: path.resolve(__dirname, './AGSSecurityHubEvidenceCollector/infra'),
      stdio: 'inherit'
    }
  );

  // read configuration file
  const configFile = fs.readFileSync(
    path.resolve(__dirname, `./configurations/${configName}.json`)
  );
  const configData = JSON.parse(configFile);

  // if web client is enabled in shared infra, web client will be deployed
  let webConfig;
  if (configData.AGSSharedInfra.deploymentOptions.enableWebClient) {
    // create the configuration file for Web Client, it is either federated, or using Cognito
    webConfig = {
      auth: configData.AGSSharedInfra.deploymentOptions.enableFederatedAuth
        ? {
            signInLink: configData.AGSSharedInfra.identityProvider.loginUrl
          }
        : await getCognitoAuthSettings()
    };

    fs.writeFileSync(
      path.resolve(__dirname, './AGSWebClient/app/src/config/awsConfig.json'),
      JSON.stringify(webConfig, null, 4)
    );

    console.log('Build AGSWebClient');
    buildWebClient();

    console.log('Deploy AGSWebClient');
    await deployAGSWebClient();

    if (!configData.AGSSharedInfra.deploymentOptions.enableFederatedAuth) {
      console.log('Creating Admin user in Cognito');
      const adminUserEmail = await readLineAsync(
        'Please input the email for the admin user: '
      );
      rl.close();
      await createAdminUser(webConfig.auth.cognitoUserPoolId, adminUserEmail);
    }
  } else {
    console.log('AGS Web Client is not enabled.');
  }

  console.log('AGS Evidence Store Solution deployed successfully.');

  if (configData.AGSSharedInfra.deploymentOptions.enableWebClient) {
    if (configData.AGSSharedInfra.deploymentOptions.enableFederatedAuth) {
      console.log(
        `Please create a user in your identity provider to get started. Once the user is created, please open ${webConfig.auth.signInLink} in your browser to login.`
      );
    } else {
      console.log(
        `You will receive an email that contains your temporarily password. Please open the following link in your browser and log in with user name 'admin' and the temporary password. \n${webConfig.auth.signInLink}`
      );
    }
  }
})().catch((error) => {
  console.log(`AGS Evidence Store Solution deployment failed. Error: ${error}`);
  exit(1);
});

async function deployAGSWebClient() {
  await deployWebClientToS3(
    path.resolve(__dirname, './AGSWebClient/build/app/Prod')
  );
}
